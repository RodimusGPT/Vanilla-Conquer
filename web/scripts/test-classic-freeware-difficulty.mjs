#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { TextWriter, Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from "@zip.js/zip.js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const enginePath = resolve(process.argv[2] ?? resolve(scriptDirectory, "../../build/web-td/tiberiandawn.js"));
const builtPackage = resolve(scriptDirectory, "../dist/classic-freeware-gdi-v1.cncweb");
const packagePath = resolve(process.argv[3] ?? (existsSync(builtPackage)
  ? builtPackage
  : resolve(scriptDirectory, "../../.cache/classic-freeware/classic-freeware-gdi-v1.cncweb")));

assert.ok(existsSync(enginePath), `browser engine is missing: ${enginePath}`);
assert.ok(existsSync(packagePath), `classic-freeware package is missing: ${packagePath}`);

const packageBytes = new Uint8Array(readFileSync(packagePath));
const archive = new ZipReader(new Uint8ArrayReader(packageBytes));
let packageRevision;
const engineFiles = [];
try {
  const entries = await archive.getEntries();
  const manifestEntry = entries.find((entry) => entry.filename === "manifest.json");
  assert.ok(manifestEntry?.getData, "classic-freeware package has no manifest");
  const manifestText = await manifestEntry.getData(new TextWriter());
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.package_id, "classic-freeware-gdi-v1");
  packageRevision = createHash("sha256").update(JSON.stringify(manifest), "utf8").digest("hex");
  for (const entry of entries) {
    if (!entry.directory && entry.filename.startsWith("engine/td/") && entry.getData) {
      engineFiles.push({ path: entry.filename, data: await entry.getData(new Uint8ArrayWriter()) });
    }
  }
} finally {
  await archive.close();
}
assert.ok(engineFiles.some((file) => file.path === "engine/td/SCG08EA.INI"));

const { default: createModule } = await import(pathToFileURL(enginePath).href);
const wasmPath = resolve(dirname(enginePath), "tiberiandawn.wasm");
const compiledWasm = new WebAssembly.Module(readFileSync(wasmPath));
const engine = await createModule({
  instantiateWasm(imports, receiveInstance) {
    const instance = new WebAssembly.Instance(compiledWasm, imports);
    receiveInstance(instance);
    return instance.exports;
  },
});

const STATUS_OK = 0;
const MAGIC = 0x57434e43;
const ABI_VERSION = engine._cnc_web_abi_version();
const mountRoot = `/difficulty-test/${packageRevision.slice(0, 16)}`;
for (const file of engineFiles) {
  const destination = `${mountRoot}/${file.path}`;
  engine.FS.mkdirTree(dirname(destination));
  engine.FS.writeFile(destination, file.data);
}

function allocate(size, label) {
  const pointer = engine._malloc(size);
  assert.notEqual(pointer, 0, `could not allocate ${label}`);
  return pointer;
}

function withInput(bytes, operation) {
  const pointer = allocate(bytes.byteLength, "input");
  try {
    engine.HEAPU8.set(bytes, pointer);
    return operation(pointer, bytes.byteLength);
  } finally {
    engine._free(pointer);
  }
}

function outputU32(operation, label) {
  const pointer = allocate(4, label);
  try {
    assert.equal(operation(pointer), STATUS_OK, `${label} failed`);
    return new DataView(engine.HEAPU8.buffer).getUint32(pointer, true);
  } finally {
    engine._free(pointer);
  }
}

function outputU64(operation, label) {
  const pointer = allocate(8, label);
  try {
    assert.equal(operation(pointer), STATUS_OK, `${label} failed`);
    return new DataView(engine.HEAPU8.buffer).getBigUint64(pointer, true);
  } finally {
    engine._free(pointer);
  }
}

function createHandle() {
  const pointer = allocate(4, "handle");
  try {
    assert.equal(engine._cnc_web_create(ABI_VERSION, pointer), STATUS_OK, "create failed");
    return new DataView(engine.HEAPU8.buffer).getUint32(pointer, true);
  } finally {
    engine._free(pointer);
  }
}

function startMessage() {
  const content = new TextEncoder().encode(`${mountRoot}/engine/td`);
  const bytes = new Uint8Array(72 + content.byteLength);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, MAGIC, true);
  view.setUint16(4, 1, true);
  view.setUint16(6, 1, true);
  view.setUint32(8, bytes.byteLength, true);
  view.setUint32(12, 1, true);
  view.setUint32(16, 0x1a2b3c4d, true);
  view.setInt32(20, 8, true);
  view.setInt32(24, 0, true);
  view.setInt32(28, 0, true);
  view.setInt32(32, 8, true);
  view.setInt32(36, -1, true);
  view.setUint32(40, 1, true);
  view.setUint32(44, 1, true);
  view.setBigUint64(48, 0n, true);
  view.setUint32(56, content.byteLength, true);
  view.setUint32(60, 0, true);
  view.setBigUint64(64, BigInt(`0x${packageRevision.slice(0, 16)}`), true);
  bytes.set(content, 72);
  return bytes;
}

function snapshotBytes(handle) {
  const size = outputU32((pointer) => engine._cnc_web_snapshot_size(handle, pointer), "snapshot size");
  const data = allocate(size, "snapshot");
  const written = allocate(4, "snapshot length");
  try {
    assert.equal(engine._cnc_web_write_snapshot(handle, data, size, written), STATUS_OK, "snapshot write failed");
    assert.equal(new DataView(engine.HEAPU8.buffer).getUint32(written, true), size);
    return new Uint8Array(engine.HEAPU8.buffer, data, size).slice();
  } finally {
    engine._free(written);
    engine._free(data);
  }
}

function sidebarCosts(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert.equal(view.getUint32(0, true), MAGIC);
  const sectionCount = view.getUint32(32, true);
  let offset = 40;
  for (let index = 0; index < sectionCount; index += 1) {
    const kind = view.getUint16(offset, true);
    const length = view.getUint32(offset + 4, true);
    const count = view.getUint32(offset + 8, true);
    offset += 16;
    if (kind === 4) {
      const costs = new Map();
      for (let entry = 0; entry < count; entry += 1) {
        const entryOffset = offset + 60 + entry * 128;
        const nameBytes = bytes.subarray(entryOffset, entryOffset + 16);
        const terminator = nameBytes.indexOf(0);
        const name = new TextDecoder().decode(terminator < 0 ? nameBytes : nameBytes.subarray(0, terminator));
        costs.set(name, view.getInt32(entryOffset + 32, true));
      }
      return costs;
    }
    offset += length;
  }
  assert.fail("snapshot has no sidebar section");
}

function snapshotHash(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert.equal(view.getUint32(0, true), MAGIC);
  return view.getBigUint64(24, true);
}

function profileState(difficulty) {
  const handle = createHandle();
  try {
    assert.equal(engine._cnc_web_set_difficulty(handle, difficulty), STATUS_OK, "difficulty companion failed");
    const message = startMessage();
    assert.equal(
      withInput(message, (pointer, length) => engine._cnc_web_start(handle, pointer, length)),
      STATUS_OK,
      "Mission 8 start failed",
    );
    const snapshot = snapshotBytes(handle);
    const costs = sidebarCosts(snapshot);
    assert.ok(costs.has("E1"), "Mission 8 sidebar has no minigunner entry");
    const stateHash = outputU64(
      (pointer) => engine._cnc_web_state_hash(handle, pointer),
      "state hash",
    );
    assert.equal(stateHash, snapshotHash(snapshot), "public and snapshot state hashes differ");
    return { rifleCost: costs.get("E1"), stateHash };
  } finally {
    assert.equal(engine._cnc_web_destroy(handle), STATUS_OK, "destroy failed");
  }
}

const easy = profileState(0);
const normal = profileState(1);
const hard = profileState(2);
const easyCost = easy.rifleCost;
const normalCost = normal.rifleCost;
const hardCost = hard.rifleCost;
assert.equal(easyCost, 80, "Easy did not apply the classic 0.8 player cost bias");
assert.equal(normalCost, 100, "Normal did not retain the classic 1.0 player cost bias");
assert.equal(hardCost, 100, "Hard did not retain the classic 1.0 player cost bias");
assert.ok(easyCost < normalCost, "real TD sidebar costs do not differ by difficulty");
assert.equal(new Set([easy.stateHash, normal.stateHash, hard.stateHash]).size, 3,
  "initial public state hashes do not distinguish every difficulty profile");

const hashHex = (value) => value.toString(16).padStart(16, "0");
console.log(JSON.stringify({
  easyCost,
  normalCost,
  hardCost,
  stateHashes: {
    easy: hashHex(easy.stateHash),
    normal: hashHex(normal.stateHash),
    hard: hashHex(hard.stateHash),
  },
}));
