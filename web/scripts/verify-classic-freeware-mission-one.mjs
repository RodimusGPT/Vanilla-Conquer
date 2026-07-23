#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { TextWriter, Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from "@zip.js/zip.js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const defaultModulePath = resolve(scriptDirectory, "../dist/engine/tiberiandawn.js");
const builtPackagePath = resolve(scriptDirectory, "../dist/classic-freeware-gdi-v1.cncweb");
const cachedPackagePath = resolve(scriptDirectory, "../../.cache/classic-freeware/classic-freeware-gdi-v1.cncweb");
const defaultPackagePath = existsSync(builtPackagePath) ? builtPackagePath : cachedPackagePath;

const missionNumber = Number.parseInt(process.env.CNCWEB_VERIFY_MISSION ?? "1", 10);
const missionVariant = process.env.CNCWEB_VERIFY_MISSION_VARIANT ?? "west-a";
const missions = new Map([
  [1, {
    number: 1,
    id: "gdi-01-east-a",
    scenarioRoot: "SCG01EA",
    scenario: 1,
    variation: 0,
    direction: 0,
    buildLevel: 1,
    maxTicks: 6_000,
  }],
  [2, {
    number: 2,
    id: "gdi-02-east-a",
    scenarioRoot: "SCG02EA",
    scenario: 2,
    variation: 0,
    direction: 0,
    buildLevel: 2,
    maxTicks: 30_000,
  }],
  [3, {
    number: 3,
    id: "gdi-03-east-a",
    scenarioRoot: "SCG03EA",
    scenario: 3,
    variation: 0,
    direction: 0,
    buildLevel: 3,
    maxTicks: 90_000,
  }],
  [6, {
    number: 6,
    id: "gdi-06-east-a",
    scenarioRoot: "SCG06EA",
    scenario: 6,
    variation: 0,
    direction: 0,
    buildLevel: 6,
    maxTicks: 60_000,
    samSites: [
      { typeName: "SAM", cellX: 53, cellY: 40 },
      { typeName: "SAM", cellX: 38, cellY: 40 },
    ],
    transportLanding: { cellX: 32, cellY: 36 },
    infiltrationRoute: [
      { cellX: 36, cellY: 32 },
      { cellX: 49, cellY: 24 },
      { cellX: 58, cellY: 24 },
      { cellX: 61, cellY: 22 },
      { cellX: 61, cellY: 12 },
      { cellX: 60, cellY: 7 },
    ],
    airstrip: { typeName: "AFLD", cellX: 58, cellY: 4 },
  }],
  [7, {
    number: 7,
    id: "gdi-07-east-a",
    scenarioRoot: "SCG07EA",
    scenario: 7,
    variation: 0,
    direction: 0,
    buildLevel: 7,
    maxTicks: 120_000,
    sabotagedStructure: 7,
    carryOverCredits: 98_765,
    nukePieces: 5,
    sabotagedSite: { typeName: "PROC", cellX: 54, cellY: 10 },
  }],
]);
const missionFourVariants = new Map([
  ["west-a", {
    number: 4,
    variant: "west-a",
    id: "gdi-04-west-a",
    scenarioRoot: "SCG04WA",
    scenario: 4,
    variation: 0,
    direction: 1,
    buildLevel: 4,
    maxTicks: 30_000,
    objective: "extract",
    runner: "apc",
    threatRadius: 0,
    route: [
      { cellX: 18, cellY: 47 },
      { cellX: 11, cellY: 42 },
      { cellX: 12, cellY: 28 },
      { cellX: 13, cellY: 19 },
      { cellX: 14, cellY: 13 },
    ],
  }],
  ["west-b", {
    number: 4,
    variant: "west-b",
    id: "gdi-04-west-b",
    scenarioRoot: "SCG04WB",
    scenario: 4,
    variation: 1,
    direction: 1,
    buildLevel: 4,
    maxTicks: 45_000,
    objective: "eliminate",
    threatRadius: 4,
    route: [
      { cellX: 31, cellY: 55 },
      { cellX: 42, cellY: 55 },
      { cellX: 52, cellY: 55 },
      { cellX: 55, cellY: 35 },
      { cellX: 50, cellY: 22 },
      { cellX: 42, cellY: 17 },
      { cellX: 35, cellY: 30 },
      { cellX: 29, cellY: 30 },
      { cellX: 29, cellY: 49 },
      { cellX: 20, cellY: 55 },
      { cellX: 19, cellY: 44 },
    ],
  }],
  ["east-a", {
    number: 4,
    variant: "east-a",
    id: "gdi-04-east-a",
    scenarioRoot: "SCG04EA",
    scenario: 4,
    variation: 0,
    direction: 0,
    buildLevel: 4,
    maxTicks: 30_000,
    objective: "extract",
    runner: "apc-one",
    threatRadius: 0,
    route: [
      { cellX: 16, cellY: 39 },
      { cellX: 17, cellY: 25 },
      { cellX: 40, cellY: 26 },
      { cellX: 52, cellY: 38 },
      { cellX: 57, cellY: 43 },
      { cellX: 57, cellY: 52 },
      { cellX: 25, cellY: 58 },
    ],
  }],
]);
const missionFiveVariants = new Map([
  ["east-a", {
    number: 5,
    variant: "east-a",
    id: "gdi-05-east-a",
    scenarioRoot: "SCG05EA",
    scenario: 5,
    variation: 0,
    direction: 0,
    buildLevel: 5,
    maxTicks: 120_000,
    earliestAssaultTick: 9_000,
    reliefRoute: [
      { cellX: 27, cellY: 55 },
      { cellX: 38, cellY: 55 },
      { cellX: 40, cellY: 55 },
      { cellX: 47, cellY: 55 },
    ],
    crate: { cellX: 44, cellY: 40 },
    home: { cellX: 50, cellY: 54 },
    guardPosts: [
      { cellX: 37, cellY: 54 },
      { cellX: 52, cellY: 46 },
    ],
    homeGuardSize: 10,
    assaultTargetStage: 5,
    precisionRouteStage: 4,
    huntSites: [
      { typeName: "AFLD", cellX: 11, cellY: 25 },
      { typeName: "FACT", cellX: 10, cellY: 29 },
      { typeName: "PROC", cellX: 22, cellY: 23 },
      { typeName: "HAND", cellX: 15, cellY: 23 },
    ],
    samSites: [
      { site: { cellX: 13, cellY: 30 }, approach: { cellX: 15, cellY: 30 } },
      { site: { cellX: 24, cellY: 31 }, approach: { cellX: 25, cellY: 32 } },
      { site: { cellX: 41, cellY: 34 }, approach: { cellX: 43, cellY: 34 } },
      { site: { cellX: 21, cellY: 39 }, approach: { cellX: 23, cellY: 41 } },
    ],
    samSweepSites: [
      { site: { cellX: 21, cellY: 39 }, approach: { cellX: 23, cellY: 41 } },
      { site: { cellX: 24, cellY: 31 }, approach: { cellX: 26, cellY: 33 } },
      { site: { typeName: "GUN", cellX: 24, cellY: 28 }, approach: { cellX: 26, cellY: 30 } },
    ],
    postSweepRouteStage: 3,
    preSweepRouteStage: 2,
    cleanupSites: [
      { site: { cellX: 9, cellY: 22 }, approach: { cellX: 10, cellY: 25 } },
      { site: { cellX: 24, cellY: 31 }, approach: { cellX: 25, cellY: 32 } },
      { site: { cellX: 21, cellY: 39 }, approach: { cellX: 23, cellY: 41 } },
      { site: { cellX: 41, cellY: 34 }, approach: { cellX: 43, cellY: 34 } },
      { site: { cellX: 13, cellY: 30 }, approach: { cellX: 15, cellY: 30 } },
      { site: { cellX: 11, cellY: 22 }, approach: { cellX: 10, cellY: 25 } },
      { site: { cellX: 13, cellY: 22 }, approach: { cellX: 15, cellY: 25 } },
    ],
    assaultRoute: [
      { cellX: 37, cellY: 54 },
      { cellX: 28, cellY: 45 },
      { cellX: 30, cellY: 31 },
      { cellX: 17, cellY: 28 },
      { cellX: 13, cellY: 29 },
      { cellX: 10, cellY: 25 },
      { cellX: 15, cellY: 25 },
      { cellX: 27, cellY: 33 },
      { cellX: 21, cellY: 42 },
      { cellX: 10, cellY: 34 },
      { cellX: 28, cellY: 45 },
      { cellX: 26, cellY: 54 },
      { cellX: 37, cellY: 54 },
      { cellX: 52, cellY: 46 },
      { cellX: 53, cellY: 31 },
      { cellX: 42, cellY: 29 },
      { cellX: 36, cellY: 28 },
    ],
  }],
  ["west-a", {
    number: 5,
    variant: "west-a",
    id: "gdi-05-west-a",
    scenarioRoot: "SCG05WA",
    scenario: 5,
    variation: 0,
    direction: 1,
    buildLevel: 5,
    maxTicks: 120_000,
    relaunchForce: 25,
    reliefRoute: [
      { cellX: 27, cellY: 55 },
      { cellX: 38, cellY: 55 },
      { cellX: 40, cellY: 55 },
      { cellX: 47, cellY: 55 },
    ],
    home: { cellX: 50, cellY: 54 },
    huntSites: [
      { typeName: "AFLD", cellX: 11, cellY: 25 },
      { typeName: "FACT", cellX: 10, cellY: 29 },
      { typeName: "PROC", cellX: 22, cellY: 23 },
      { typeName: "HAND", cellX: 15, cellY: 23 },
    ],
    samSites: [
      { site: { cellX: 13, cellY: 30 }, approach: { cellX: 15, cellY: 30 } },
      { site: { cellX: 24, cellY: 31 }, approach: { cellX: 25, cellY: 32 } },
      { site: { cellX: 41, cellY: 34 }, approach: { cellX: 43, cellY: 34 } },
      { site: { cellX: 21, cellY: 39 }, approach: { cellX: 23, cellY: 41 } },
    ],
    cleanupSites: [
      { site: { cellX: 9, cellY: 22 }, approach: { cellX: 10, cellY: 25 } },
      { site: { cellX: 24, cellY: 31 }, approach: { cellX: 25, cellY: 32 } },
      { site: { cellX: 21, cellY: 39 }, approach: { cellX: 23, cellY: 41 } },
      { site: { cellX: 41, cellY: 34 }, approach: { cellX: 43, cellY: 34 } },
      { site: { cellX: 13, cellY: 30 }, approach: { cellX: 15, cellY: 30 } },
      { site: { cellX: 11, cellY: 22 }, approach: { cellX: 10, cellY: 25 } },
      { site: { cellX: 13, cellY: 22 }, approach: { cellX: 15, cellY: 25 } },
    ],
    assaultRoute: [
      { cellX: 37, cellY: 54 },
      { cellX: 28, cellY: 45 },
      { cellX: 30, cellY: 31 },
      { cellX: 31, cellY: 25 },
      { cellX: 17, cellY: 28 },
      { cellX: 13, cellY: 29 },
      { cellX: 10, cellY: 25 },
      { cellX: 15, cellY: 25 },
      { cellX: 27, cellY: 33 },
      { cellX: 21, cellY: 42 },
      { cellX: 10, cellY: 34 },
      { cellX: 28, cellY: 45 },
      { cellX: 26, cellY: 54 },
      { cellX: 37, cellY: 54 },
      { cellX: 52, cellY: 46 },
      { cellX: 53, cellY: 31 },
      { cellX: 42, cellY: 29 },
      { cellX: 36, cellY: 28 },
    ],
  }],
  ["west-b", {
    number: 5,
    variant: "west-b",
    id: "gdi-05-west-b",
    scenarioRoot: "SCG05WB",
    scenario: 5,
    variation: 1,
    direction: 1,
    buildLevel: 5,
    maxTicks: 120_000,
    earliestAssaultTick: 7_200,
    relaunchForce: 3,
    reliefRoute: [
      { cellX: 12, cellY: 30 },
      { cellX: 12, cellY: 45 },
      { cellX: 12, cellY: 58 },
      { cellX: 23, cellY: 58 },
      { cellX: 25, cellY: 58 },
      { cellX: 30, cellY: 54 },
    ],
    crate: { cellX: 26, cellY: 42 },
    home: { cellX: 31, cellY: 53 },
    guardPosts: [
      { cellX: 20, cellY: 57 },
      { cellX: 42, cellY: 54 },
    ],
    homeGuardSize: 0,
    assaultTargetStage: 4,
    precisionRouteStage: 4,
    coreRouteHolds: [
      { routeStage: 4, sites: [{ typeName: "FACT", cellX: 52, cellY: 17 }] },
      { routeStage: 5, sites: [
        { typeName: "HAND", cellX: 41, cellY: 22 },
        { typeName: "AFLD", cellX: 42, cellY: 18 },
      ] },
      { routeStage: 6, sites: [
        { typeName: "PROC", cellX: 47, cellY: 22 },
        { typeName: "NUKE", cellX: 47, cellY: 18 },
      ] },
    ],
    huntSites: [
      { typeName: "PROC", cellX: 47, cellY: 22 },
      { typeName: "AFLD", cellX: 42, cellY: 18 },
      { typeName: "NUKE", cellX: 47, cellY: 18 },
      { typeName: "NUKE", cellX: 49, cellY: 17 },
      { typeName: "FACT", cellX: 52, cellY: 17 },
    ],
    samSites: [
      { site: { cellX: 40, cellY: 17 }, approach: { cellX: 38, cellY: 19 } },
      { site: { cellX: 38, cellY: 25 }, approach: { cellX: 36, cellY: 27 } },
      { site: { cellX: 52, cellY: 25 }, approach: { cellX: 54, cellY: 27 } },
      { site: { cellX: 26, cellY: 37 }, approach: { cellX: 24, cellY: 39 } },
    ],
    assaultRoute: [
      { cellX: 42, cellY: 54 },
      { cellX: 53, cellY: 53 },
      { cellX: 53, cellY: 42 },
      { cellX: 56, cellY: 29 },
      { cellX: 53, cellY: 19 },
      { cellX: 42, cellY: 20 },
      { cellX: 48, cellY: 20 },
      { cellX: 53, cellY: 42 },
      { cellX: 53, cellY: 53 },
      { cellX: 42, cellY: 54 },
      { cellX: 20, cellY: 57 },
      { cellX: 11, cellY: 51 },
      { cellX: 12, cellY: 30 },
      { cellX: 12, cellY: 21 },
      { cellX: 34, cellY: 20 },
      { cellX: 34, cellY: 29 },
    ],
  }],
]);
const missionEightVariants = new Map([
  ["east-a", {
    number: 8,
    variant: "east-a",
    id: "gdi-08-east-a",
    scenarioRoot: "SCG08EA",
    scenario: 8,
    variation: 0,
    direction: 0,
    buildLevel: 8,
    maxTicks: 120_000,
  }],
  ["east-b", {
    number: 8,
    variant: "east-b",
    id: "gdi-08-east-b",
    scenarioRoot: "SCG08EB",
    scenario: 8,
    variation: 1,
    direction: 0,
    buildLevel: 8,
    maxTicks: 120_000,
  }],
]);
const mission = missionNumber === 4
  ? missionFourVariants.get(missionVariant)
  : missionNumber === 5
    ? missionFiveVariants.get(missionVariant)
    : missionNumber === 8
      ? missionEightVariants.get(missionVariant)
      : missions.get(missionNumber);
if (!mission) {
  if (missionNumber === 4 || missionNumber === 5) {
    console.error("CNCWEB_VERIFY_MISSION_VARIANT must be west-a, west-b, or east-a");
  } else if (missionNumber === 8) {
    console.error("CNCWEB_VERIFY_MISSION_VARIANT must be east-a or east-b");
  } else console.error("CNCWEB_VERIFY_MISSION must be 1, 2, 3, 4, 5, 6, 7, or 8");
  process.exit(2);
}
const difficultyValues = new Map([
  ["easy", 0], ["normal", 1], ["hard", 2],
  ["0", 0], ["1", 1], ["2", 2],
]);
const difficultyNames = ["easy", "normal", "hard"];
const difficultyInput = process.env.CNCWEB_VERIFY_DIFFICULTY
  ?? (mission.number === 8 ? "normal" : undefined);
const verifierDifficulty = difficultyInput === undefined
  ? undefined
  : difficultyValues.get(difficultyInput.trim().toLowerCase());
if (difficultyInput !== undefined && verifierDifficulty === undefined) {
  console.error("CNCWEB_VERIFY_DIFFICULTY must be easy, normal, hard, 0, 1, or 2");
  process.exit(2);
}
const trace = process.env.CNCWEB_VERIFY_TRACE === "1";
let diagnosticClassicPixels;
let diagnosticClassicWidth = 0;
let diagnosticClassicHeight = 0;
let diagnosticPalette;
const missionFiveWestBStrategy = mission.number === 5 && mission.variant === "west-b";
const missionTwoAssaultTick = Number.parseInt(process.env.CNCWEB_VERIFY_ASSAULT_TICK ?? "12000", 10);
if (mission.number === 2 && (!Number.isSafeInteger(missionTwoAssaultTick) || missionTwoAssaultTick < 0 || missionTwoAssaultTick > mission.maxTicks)) {
  console.error("CNCWEB_VERIFY_ASSAULT_TICK must be an integer within the mission tick budget");
  process.exit(2);
}
const missionThreeAssaultTick = Number.parseInt(process.env.CNCWEB_VERIFY_MISSION_THREE_ASSAULT_TICK ?? "24000", 10);
if (mission.number === 3 && (!Number.isSafeInteger(missionThreeAssaultTick)
  || missionThreeAssaultTick < 0 || missionThreeAssaultTick > mission.maxTicks)) {
  console.error("CNCWEB_VERIFY_MISSION_THREE_ASSAULT_TICK must be an integer within the mission tick budget");
  process.exit(2);
}
const missionFiveAssaultTick = Number.parseInt(
  process.env.CNCWEB_VERIFY_MISSION_FIVE_ASSAULT_TICK
    ?? (missionFiveWestBStrategy ? "12000" : "48000"),
  10,
);
const missionFiveAssaultForce = Number.parseInt(
  process.env.CNCWEB_VERIFY_MISSION_FIVE_ASSAULT_FORCE
    ?? (missionFiveWestBStrategy ? "25" : mission.variant === "east-a" ? "35" : "45"),
  10,
);
if (mission.number === 5 && (!Number.isSafeInteger(missionFiveAssaultTick)
  || missionFiveAssaultTick < 0 || missionFiveAssaultTick > mission.maxTicks
  || !Number.isSafeInteger(missionFiveAssaultForce) || missionFiveAssaultForce < 1 || missionFiveAssaultForce > 500)) {
  console.error("Mission 5 assault tuning must use a tick within the mission budget and a force from 1 to 500");
  process.exit(2);
}

const arguments_ = process.argv.slice(2);
if (arguments_.length !== 0 && arguments_.length !== 3 && arguments_.length !== 4) {
  console.error("usage: verify-classic-freeware-mission-one.mjs [ENGINE.js ENGINE_ASSET_BASE PACKAGE.cncweb [PACKAGE_REVISION]]");
  process.exit(2);
}

const modulePath = resolve(arguments_[0] ?? defaultModulePath);
const packagePath = resolve(arguments_[2] ?? defaultPackagePath);
const expectedRevision = arguments_[3];
if (expectedRevision !== undefined && !/^[a-f0-9]{64}$/.test(expectedRevision)) {
  console.error("PACKAGE_REVISION must be a lowercase SHA-256 digest");
  process.exit(2);
}

function directoryUrl(value) {
  if (value === undefined) return pathToFileURL(`${dirname(modulePath)}/`);
  let url;
  try {
    url = new URL(value);
  } catch {
    url = pathToFileURL(`${resolve(value)}/`);
  }
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

const assetBase = directoryUrl(arguments_[1]);
const packageBytes = new Uint8Array(readFileSync(packagePath));
const archive = new ZipReader(new Uint8ArrayReader(packageBytes));
let manifest;
let packageRevision;
let engineFiles;
try {
  const entries = await archive.getEntries();
  const byPath = new Map(entries.filter((entry) => !entry.directory).map((entry) => [entry.filename, entry]));
  const manifestEntry = byPath.get("manifest.json");
  assert.ok(manifestEntry?.getData, "classic-freeware package has no canonical manifest");
  manifest = JSON.parse(await manifestEntry.getData(new TextWriter()));
  assert.equal(manifest.format, "cncweb-content", "package manifest format is not supported");
  assert.equal(manifest.version, 1, "package manifest version is not supported");
  assert.equal(manifest.package_id, "classic-freeware-gdi-v1", "package is not the classic-freeware GDI campaign");
  assert.equal(manifest.source?.product, "tiberian-dawn-freeware", "package source product is not Tiberian Dawn freeware");
  assert.equal(manifest.source?.provider, "ea-freeware", "package source provider is not EA freeware");
  assert.match(manifest.source.install_fingerprint_sha256, /^[a-f0-9]{64}$/, "package source fingerprint is invalid");

  packageRevision = createHash("sha256").update(JSON.stringify(manifest), "utf8").digest("hex");
  if (expectedRevision !== undefined) {
    assert.equal(packageRevision, expectedRevision, "package revision differs from the requested browser ContentStore identity");
  }

  const catalogEntry = byPath.get("runtime/catalog-v1.json");
  assert.ok(catalogEntry?.getData, "classic-freeware package has no runtime catalog");
  const catalog = JSON.parse(await catalogEntry.getData(new TextWriter()));
  assert.equal(catalog.format, "cncweb-runtime", "runtime catalog format is not supported");
  assert.equal(catalog.version, 1, "runtime catalog version is not supported");
  assert.equal(catalog.engine, "tiberian-dawn", "runtime catalog does not target Tiberian Dawn");
  assert.equal(catalog.engineRoot, "engine/td", "runtime catalog engine root is unexpected");
  assert.ok(catalog.missions?.some((candidate) => (
    candidate.id === mission.id
    && candidate.scenarioRoot === mission.scenarioRoot
    && candidate.scenario === mission.scenario
    && candidate.variation === mission.variation
    && candidate.direction === mission.direction
    && candidate.buildLevel === mission.buildLevel
    && candidate.faction === "gdi"
  )), `runtime catalog does not contain canonical GDI Mission ${mission.number}`);

  const descriptors = new Map(manifest.files.map((file) => [file.path, file]));
  engineFiles = [];
  for (const entry of entries) {
    if (entry.directory || !entry.filename.startsWith("engine/td/") || !entry.getData) continue;
    const descriptor = descriptors.get(entry.filename);
    assert.ok(descriptor, `${entry.filename} is absent from the package manifest`);
    const data = await entry.getData(new Uint8ArrayWriter());
    assert.equal(data.byteLength, descriptor.size, `${entry.filename} size differs from its manifest`);
    assert.equal(createHash("sha256").update(data).digest("hex"), descriptor.sha256, `${entry.filename} hash differs from its manifest`);
    engineFiles.push({ path: entry.filename, data });
  }
  assert.ok(engineFiles.some((file) => file.path === `engine/td/${mission.scenarioRoot}.INI`), `GDI Mission ${mission.number} scenario INI is missing`);
  assert.ok(engineFiles.some((file) => file.path === `engine/td/${mission.scenarioRoot}.BIN`), `GDI Mission ${mission.number} scenario map is missing`);
  assert.ok(engineFiles.length >= 15, "classic-freeware package has too few engine files");
} finally {
  await archive.close();
}

const { default: createModule } = await import(pathToFileURL(modulePath).href);
let moduleOptions;
if (assetBase.protocol === "file:") {
  const compiledWasm = new WebAssembly.Module(readFileSync(fileURLToPath(new URL("tiberiandawn.wasm", assetBase))));
  moduleOptions = {
    instantiateWasm(imports, receiveInstance) {
      const instance = new WebAssembly.Instance(compiledWasm, imports);
      receiveInstance(instance);
      return instance.exports;
    },
  };
} else {
  moduleOptions = { locateFile: (path) => new URL(path, assetBase).href };
}
const engine = await createModule(moduleOptions);
assert.equal(engine._cnc_web_abi_version(), 2, "unexpected browser ABI version");

const MAGIC = 0x57434e43;
const STATUS_OK = 0;
const MESSAGE_START = 1;
const MESSAGE_COMMAND = 2;
const MESSAGE_SNAPSHOT = 3;
const EVENT_GAME_OVER = 3;
const EVENT_MOVIE = 5;
const EVENT_DIAGNOSTIC = 14;
const EVENT_CAMPAIGN_OUTCOME = 15;
const DIAGNOSTIC_START_READY = 6;
const COMMAND_INPUT = 1;
const COMMAND_GAME = 7;
const COMMAND_STRUCTURE = 2;
const COMMAND_UNIT = 3;
const COMMAND_CLEAR_SELECTION = 8;
const COMMAND_SELECT_OBJECT = 9;
const COMMAND_SIDEBAR = 4;
const COMMAND_SUPERWEAPON = 5;
const SIDEBAR_START_CONSTRUCTION = 0;
const SIDEBAR_START_PLACEMENT = 3;
const SIDEBAR_PLACE = 4;
const SUPERWEAPON_PLACE = 0;
const STRUCTURE_REPAIR_START = 1;
const STRUCTURE_REPAIR = 2;
const STRUCTURE_SELL = 4;
const GAME_MOVIE_DONE = 0;
const INPUT_COMMAND_AT_POSITION = 9;
const INPUT_SPECIAL_KEYS = 10;
const UNIT_REQUEST_STOP = 5;
const UNIT_SCATTER = 1;
const ACTION_SELF = 4;
const ACTION_SABOTAGE = 10;
const STRUCT_REFINERY = 7;
const STRUCT_AIRSTRIP = 11;
const PIP_COMMANDO = 7;
const MODIFIER_CTRL = 1 << 0;
const MODIFIER_ALT = 1 << 1;
const SECTION_STATIC_MAP = 1;
const SECTION_OBJECTS = 3;
const SECTION_SIDEBAR = 4;
const SECTION_PLACEMENT = 5;
const SECTION_SHROUD = 6;
const SNAPSHOT_TERMINAL = 1;
const OBJECT_RECORD_BYTES = 472;
const SIDEBAR_FIXED_BYTES = 60;
const SIDEBAR_RECORD_BYTES = 128;
const TICK_HZ = 15;
const TICKS_PER_ORDER = 30;
const MAX_TICKS = mission.maxTicks;
const CELL_PIXELS = 24;
const HOUSE_GDI = 0;
const HOUSE_NOD = 1;
const HOUSE_NEUTRAL = 2;
const ROOT_COMBAT_TYPES = new Set([1, 2, 3, 4]);

const mountRoot = `/cnc-content/${packageRevision.slice(0, 16)}`;
for (const file of engineFiles) {
  const destination = `${mountRoot}/${file.path}`;
  engine.FS.mkdirTree(dirname(destination));
  engine.FS.writeFile(destination, file.data);
}

function withAllocation(size, operation) {
  const pointer = engine._malloc(size);
  assert.notEqual(pointer, 0, `failed to allocate ${operation}`);
  return pointer;
}

function writeInput(bytes, callback) {
  const pointer = withAllocation(bytes.byteLength, "input buffer");
  try {
    engine.HEAPU8.set(bytes, pointer);
    return callback(pointer, bytes.byteLength);
  } finally {
    engine._free(pointer);
  }
}

function outputU32(callback, operation) {
  const pointer = withAllocation(4, operation);
  try {
    assert.equal(callback(pointer), STATUS_OK, `${operation} failed`);
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
  view.setUint16(6, MESSAGE_START, true);
  view.setUint32(8, bytes.byteLength, true);
  view.setUint32(12, 1, true);
  view.setUint32(16, 0x1a2b3c4d, true);
  view.setInt32(20, mission.scenario, true);
  view.setInt32(24, mission.variation, true);
  view.setInt32(28, mission.direction, true);
  view.setInt32(32, mission.buildLevel, true);
  view.setInt32(36, mission.sabotagedStructure ?? -1, true);
  view.setUint32(40, 1, true);
  view.setUint32(44, 1, true);
  view.setBigUint64(48, 0n, true);
  view.setUint32(56, content.byteLength, true);
  view.setUint32(60, 0, true);
  const contentHash = BigInt(`0x${packageRevision.slice(0, 16)}`);
  assert.notEqual(contentHash, 0n, "package revision produced an invalid content identity");
  view.setBigUint64(64, contentHash, true);
  bytes.set(content, 72);
  return bytes;
}

function commandBatch(targetTick, commands) {
  assert.ok(commands.length > 0 && commands.length <= 4096, "command count is outside the protocol limit");
  const bytes = new Uint8Array(32 + commands.length * 32);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, MAGIC, true);
  view.setUint16(4, 1, true);
  view.setUint16(6, MESSAGE_COMMAND, true);
  view.setUint32(8, bytes.byteLength, true);
  view.setUint32(12, commands.length, true);
  view.setUint32(16, targetTick, true);
  view.setUint16(20, 32, true);
  view.setUint16(22, 0, true);
  view.setBigUint64(24, 0n, true);
  commands.forEach((command, index) => {
    assert.equal(command.args.length, 7, "normalized commands require seven arguments");
    const offset = 32 + index * 32;
    view.setUint16(offset, command.type, true);
    view.setUint16(offset + 2, command.flags ?? 0, true);
    command.args.forEach((value, argument) => view.setInt32(offset + 4 + argument * 4, value, true));
  });
  return bytes;
}

function submitCommands(handle, targetTick, commands) {
  const bytes = commandBatch(targetTick, commands);
  assert.equal(
    writeInput(bytes, (pointer, length) => engine._cnc_web_submit_commands(handle, pointer, length)),
    STATUS_OK,
    `command batch for tick ${targetTick} failed`,
  );
}

function readOutput(handle, sizeFunction, writeFunction, label) {
  const size = outputU32((output) => sizeFunction(handle, output), `${label}-size query`);
  assert.ok(size > 0 && size <= 64 * 1024 * 1024, `${label} size is invalid`);
  const dataPointer = withAllocation(size, `${label} buffer`);
  const writtenPointer = withAllocation(4, `${label} written output`);
  try {
    assert.equal(writeFunction(handle, dataPointer, size, writtenPointer), STATUS_OK, `${label} write failed`);
    const written = new DataView(engine.HEAPU8.buffer).getUint32(writtenPointer, true);
    assert.equal(written, size, `${label} size changed while writing`);
    return new Uint8Array(engine.HEAPU8.buffer, dataPointer, size).slice();
  } finally {
    engine._free(writtenPointer);
    engine._free(dataPointer);
  }
}

const events = [];
let currentTick = 0;
let movieAcknowledgements = 0;

function drainEvents(handle) {
  for (let index = 0; index < 4096; index += 1) {
    const size = outputU32((output) => engine._cnc_web_event_size(handle, output), "event-size query");
    if (size === 0) return;
    assert.ok(size >= 64 && size <= 1024 * 1024, "engine emitted an invalid event size");
    const eventPointer = withAllocation(size, "event buffer");
    const writtenPointer = withAllocation(4, "event written output");
    try {
      assert.equal(engine._cnc_web_poll_event(handle, eventPointer, size, writtenPointer), STATUS_OK, "event poll failed");
      const memory = new DataView(engine.HEAPU8.buffer);
      assert.equal(memory.getUint32(writtenPointer, true), size, "event size changed while polling");
      assert.equal(memory.getUint32(eventPointer, true), MAGIC, "event has invalid magic");
      assert.equal(memory.getUint16(eventPointer + 4, true), 1, "event protocol is unsupported");
      assert.equal(memory.getUint16(eventPointer + 6, true), 4, "event message kind is invalid");
      assert.equal(memory.getUint32(eventPointer + 8, true), size, "event total size is invalid");
      const text1Length = memory.getUint32(eventPointer + 56, true);
      const text2Length = memory.getUint32(eventPointer + 60, true);
      assert.equal(64 + text1Length + text2Length, size, "event text layout is invalid");
      const tick = memory.getUint32(eventPointer + 16, true);
      const type = memory.getUint16(eventPointer + 20, true);
      const flags = memory.getUint16(eventPointer + 22, true);
      const args = Array.from({ length: 6 }, (_, argument) => memory.getInt32(eventPointer + 32 + argument * 4, true));
      const textBytes = new Uint8Array(engine.HEAPU8.buffer, eventPointer + 64, text1Length + text2Length);
      const text1 = new TextDecoder().decode(textBytes.subarray(0, text1Length));
      const text2 = new TextDecoder().decode(textBytes.subarray(text1Length));
      events.push({ tick, type, flags, args, text1, text2 });
      if (type === EVENT_MOVIE) {
        const targetTick = Math.max(tick, currentTick) + 1;
        submitCommands(handle, targetTick, [{ type: COMMAND_GAME, args: [GAME_MOVIE_DONE, 0, 0, 0, 0, 0, 0] }]);
        movieAcknowledgements += 1;
      }
    } finally {
      engine._free(writtenPointer);
      engine._free(eventPointer);
    }
  }
  assert.fail("engine emitted more than 4096 events without draining");
}

function readSnapshot(handle) {
  const bytes = readOutput(handle, engine._cnc_web_snapshot_size, engine._cnc_web_write_snapshot, "snapshot");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert.ok(bytes.byteLength >= 40, "snapshot header is truncated");
  assert.equal(view.getUint32(0, true), MAGIC, "snapshot magic is invalid");
  assert.equal(view.getUint16(4, true), 1, "snapshot protocol is unsupported");
  assert.equal(view.getUint16(6, true), MESSAGE_SNAPSHOT, "snapshot message kind is invalid");
  assert.equal(view.getUint32(8, true), bytes.byteLength, "snapshot total size is invalid");
  const sectionCount = view.getUint32(32, true);
  assert.equal(view.getUint32(12, true), sectionCount, "snapshot section count differs between headers");
  const sections = new Map();
  let offset = 40;
  for (let index = 0; index < sectionCount; index += 1) {
    assert.ok(offset + 16 <= bytes.byteLength, "snapshot section header is truncated");
    const kind = view.getUint16(offset, true);
    const flags = view.getUint16(offset + 2, true);
    const length = view.getUint32(offset + 4, true);
    const count = view.getUint32(offset + 8, true);
    assert.equal(view.getUint32(offset + 12, true), 0, "snapshot section reserved field is not zero");
    assert.ok(!sections.has(kind), "snapshot contains a duplicate section");
    offset += 16;
    assert.ok(offset + length <= bytes.byteLength, "snapshot section is truncated");
    sections.set(kind, { flags, length, count, offset });
    offset += length;
  }
  assert.equal(offset, bytes.byteLength, "snapshot has trailing bytes");

  const diagnosticSurfacePath = process.env.CNCWEB_VERIFY_DUMP_PPM;
  if (diagnosticSurfacePath) {
    const surface = sections.get(9);
    const palette = sections.get(10);
    if (palette) diagnosticPalette = bytes.slice(palette.offset, palette.offset + palette.length);
    if (surface) {
      const width = view.getUint32(surface.offset, true);
      const height = view.getUint32(surface.offset + 4, true);
      const pitch = view.getUint32(surface.offset + 8, true);
      const format = view.getUint32(surface.offset + 12, true);
      if (format === 1) {
        diagnosticClassicWidth = width;
        diagnosticClassicHeight = height;
        diagnosticClassicPixels = new Uint8Array(width * height);
        for (let y = 0; y < height; y += 1) {
          diagnosticClassicPixels.set(bytes.subarray(
            surface.offset + 16 + y * pitch,
            surface.offset + 16 + y * pitch + width,
          ), y * width);
        }
      } else if (format === 2 && diagnosticClassicPixels) {
        const rectX = view.getUint32(surface.offset + 16, true);
        const rectY = view.getUint32(surface.offset + 20, true);
        const rectWidth = view.getUint32(surface.offset + 24, true);
        const rectHeight = view.getUint32(surface.offset + 28, true);
        for (let y = 0; y < rectHeight; y += 1) {
          diagnosticClassicPixels.set(bytes.subarray(
            surface.offset + 32 + y * pitch,
            surface.offset + 32 + y * pitch + rectWidth,
          ), (rectY + y) * width + rectX);
        }
      }
    }
    const dumpTick = Number.parseInt(process.env.CNCWEB_VERIFY_DUMP_TICK ?? "0", 10);
    if (view.getUint32(16, true) >= dumpTick && diagnosticClassicPixels && diagnosticPalette) {
      const output = Buffer.alloc(Buffer.byteLength(
        `P6\n${diagnosticClassicWidth} ${diagnosticClassicHeight}\n255\n`,
      ) + diagnosticClassicPixels.length * 3);
      const header = output.write(`P6\n${diagnosticClassicWidth} ${diagnosticClassicHeight}\n255\n`);
      for (let index = 0; index < diagnosticClassicPixels.length; index += 1) {
        const color = diagnosticClassicPixels[index];
        output[header + index * 3] = diagnosticPalette[color * 3];
        output[header + index * 3 + 1] = diagnosticPalette[color * 3 + 1];
        output[header + index * 3 + 2] = diagnosticPalette[color * 3 + 2];
      }
      writeFileSync(diagnosticSurfacePath, output);
      console.error(JSON.stringify({
        diagnosticSurfacePath,
        width: diagnosticClassicWidth,
        height: diagnosticClassicHeight,
        tick: view.getUint32(16, true),
      }));
      process.exit(0);
    }
  }

  const objectsSection = sections.get(SECTION_OBJECTS);
  assert.ok(objectsSection, "snapshot has no object section");
  assert.equal(objectsSection.flags, 0, "object section flags are unsupported");
  assert.equal(objectsSection.length, objectsSection.count * OBJECT_RECORD_BYTES, "object section layout is invalid");
  const objects = [];
  for (let index = 0; index < objectsSection.count; index += 1) {
    const objectOffset = objectsSection.offset + index * OBJECT_RECORD_BYTES;
    const decodeName = (nameOffset) => {
      const field = bytes.subarray(nameOffset, nameOffset + 16);
      const terminator = field.indexOf(0);
      return new TextDecoder().decode(terminator < 0 ? field : field.subarray(0, terminator));
    };
    objects.push({
      typeName: decodeName(objectOffset),
      assetName: decodeName(objectOffset + 16),
      type: view.getInt32(objectOffset + 112, true),
      id: view.getInt32(objectOffset + 116, true),
      maxStrength: view.getInt16(objectOffset + 160, true),
      strength: view.getInt16(objectOffset + 162, true),
      cellX: view.getUint16(objectOffset + 166, true),
      cellY: view.getUint16(objectOffset + 168, true),
      centerX: view.getUint16(objectOffset + 170, true),
      centerY: view.getUint16(objectOffset + 172, true),
      owner: view.getUint8(objectOffset + 182),
      subObject: view.getUint8(objectOffset + 184),
      selectedMask: view.getUint32(objectOffset + 188, true),
      objectFlags: view.getUint32(objectOffset + 204, true),
      canFireMask: view.getUint32(objectOffset + 212, true),
      actionWithSelected: Array.from(
        { length: 32 },
        (_, house) => view.getUint8(objectOffset + 440 + house),
      ),
      // cnc_web_protocol.h v1: occupy_count u16 @216, pip_count u16 @218,
      // max_pips u16 @220, line_count u16 @222, then pips[18] i32 @296.
      // Note that the transport renderer exports all five slots, including
      // PIP_EMPTY, so pipCount is slot count rather than cargo occupancy.
      pipCount: view.getUint16(objectOffset + 218, true),
      maxPips: view.getUint16(objectOffset + 220, true),
      pips: Array.from({ length: 18 }, (_, pipIndex) => (
        view.getInt32(objectOffset + 296 + pipIndex * 4, true)
      )),
    });
  }

  const staticMapSection = sections.get(SECTION_STATIC_MAP);
  assert.ok(staticMapSection, "snapshot has no static-map section");
  assert.equal(staticMapSection.flags, 0, "static-map section flags are unsupported");
  assert.ok(staticMapSection.length >= 304, "static-map section is truncated");
  const staticMap = {
    cellX: view.getInt32(staticMapSection.offset, true),
    cellY: view.getInt32(staticMapSection.offset + 4, true),
    width: view.getInt32(staticMapSection.offset + 8, true),
    height: view.getInt32(staticMapSection.offset + 12, true),
  };
  assert.ok(staticMap.cellX >= 0 && staticMap.cellY >= 0 && staticMap.width > 0 && staticMap.height > 0
    && staticMap.cellX + staticMap.width <= 128 && staticMap.cellY + staticMap.height <= 128,
  "static-map bounds are invalid");

  const sidebarSection = sections.get(SECTION_SIDEBAR);
  assert.ok(sidebarSection, "snapshot has no sidebar section");
  assert.equal(sidebarSection.flags, 0, "sidebar section flags are unsupported");
  assert.ok(sidebarSection.length >= SIDEBAR_FIXED_BYTES, "sidebar section is truncated");
  const stats = {
    unitsKilled: view.getUint32(sidebarSection.offset + 36, true),
    buildingsKilled: view.getUint32(sidebarSection.offset + 40, true),
    unitsLost: view.getUint32(sidebarSection.offset + 44, true),
    buildingsLost: view.getUint32(sidebarSection.offset + 48, true),
  };
  const sidebarEntries = [];
  for (let index = 0; index < sidebarSection.count; index += 1) {
    const entryOffset = sidebarSection.offset + SIDEBAR_FIXED_BYTES + index * SIDEBAR_RECORD_BYTES;
    const assetBytes = bytes.subarray(entryOffset, entryOffset + 16);
    const terminator = assetBytes.indexOf(0);
    const flags = view.getUint32(entryOffset + 52, true);
    const placementCount = view.getUint32(entryOffset + 48, true);
    assert.ok(placementCount <= 36, "sidebar placement footprint is invalid");
    const placementOffsets = Array.from(
      { length: placementCount },
      (_, placementIndex) => view.getInt16(entryOffset + 56 + placementIndex * 2, true),
    );
    sidebarEntries.push({
      assetName: new TextDecoder().decode(terminator < 0 ? assetBytes : assetBytes.subarray(0, terminator)),
      buildableType: view.getInt32(entryOffset + 16, true),
      buildableId: view.getInt32(entryOffset + 20, true),
      objectType: view.getInt32(entryOffset + 24, true),
      superweaponType: view.getInt32(entryOffset + 28, true),
      cost: view.getInt32(entryOffset + 32, true),
      progress: view.getFloat32(entryOffset + 44, true),
      completed: Boolean(flags & 1),
      constructing: Boolean(flags & 2),
      onHold: Boolean(flags & 4),
      busy: Boolean(flags & 8),
      placementOffsets,
    });
  }
  const placementSection = sections.get(SECTION_PLACEMENT);
  const placement = placementSection
    ? {
      flags: bytes.slice(placementSection.offset, placementSection.offset + placementSection.length),
      ...staticMap,
    }
    : undefined;
  if (placementSection) {
    assert.equal(placementSection.flags, 0, "placement section flags are unsupported");
    assert.equal(placementSection.count, staticMap.width * staticMap.height, "placement grid count differs from the static map");
    assert.equal(placementSection.length, placementSection.count, "placement grid layout is invalid");
  }
  const shroudSection = sections.get(SECTION_SHROUD);
  assert.ok(shroudSection, "snapshot has no shroud section");
  assert.equal(shroudSection.flags, 0, "shroud section flags are unsupported");
  assert.equal(shroudSection.count, staticMap.width * staticMap.height, "shroud grid count differs from the static map");
  assert.equal(shroudSection.length, shroudSection.count * 2, "shroud grid layout is invalid");
  const shroudEntries = bytes.slice(shroudSection.offset, shroudSection.offset + shroudSection.length);
  for (let index = 0; index < shroudSection.count; index += 1) {
    assert.equal(shroudEntries[index * 2 + 1] & ~7, 0, "shroud cell flags are invalid");
  }
  const shroud = {
    ...staticMap,
    isVisible(cellX, cellY) {
      const x = cellX - staticMap.cellX;
      const y = cellY - staticMap.cellY;
      if (x < 0 || y < 0 || x >= staticMap.width || y >= staticMap.height) return false;
      return Boolean(shroudEntries[(y * staticMap.width + x) * 2 + 1] & 1);
    },
  };
  return {
    tick: view.getUint32(16, true),
    terminal: Boolean(view.getUint32(36, true) & SNAPSHOT_TERMINAL),
    objects,
    staticMap,
    stats,
    placement,
    shroud,
    sidebar: {
      credits: view.getInt32(sidebarSection.offset + 8, true),
      tiberium: view.getInt32(sidebarSection.offset + 16, true),
      entries: sidebarEntries,
    },
  };
}

function rootCombatants(snapshot, owner) {
  return snapshot.objects.filter((object) => (
    object.owner === owner
    && object.subObject === 0
    && object.strength > 0
    && ROOT_COMBAT_TYPES.has(object.type)
  ));
}

function availableAttackers(snapshot) {
  return rootCombatants(snapshot, HOUSE_GDI).filter((object) => (
    object.type !== 4 && Boolean(object.objectFlags & 1) && Boolean(object.canFireMask & (1 << HOUSE_GDI))
  ));
}

function objectKey(object) {
  return `${object.type}:${object.typeName}:${object.id}`;
}

function chooseTarget(hostiles) {
  return hostiles.toSorted((left, right) => (
    Number(left.type === 4) - Number(right.type === 4)
    || right.cellY - left.cellY
    || left.cellX - right.cellX
    || left.type - right.type
    || left.id - right.id
  ))[0];
}

const MISSION_THREE_STRUCTURE_PRIORITY = new Map([
  ["HAND", 0],
  ["FACT", 1],
  ["PROC", 2],
  ["GUN", 3],
  ["NUKE", 4],
  ["SAM", 5],
  ["SILO", 6],
]);

function chooseMissionThreeAssaultTarget(hostiles) {
  const mobile = hostiles.filter((object) => object.type !== 4);
  const westernGun = hostiles.find((object) => (
    object.typeName === "GUN" && object.cellX === 20 && object.cellY === 34
  ));
  if (westernGun) return westernGun;
  const production = hostiles.filter((object) => object.typeName === "FACT" || object.typeName === "HAND");
  if (production.length > 0) return production.toSorted((left, right) => (
    (MISSION_THREE_STRUCTURE_PRIORITY.get(left.typeName) ?? 100)
    - (MISSION_THREE_STRUCTURE_PRIORITY.get(right.typeName) ?? 100)
    || right.cellY - left.cellY
    || left.cellX - right.cellX
    || left.id - right.id
  ))[0];
  if (mobile.length > 12) return chooseTarget(mobile);
  return hostiles.toSorted((left, right) => (
    (MISSION_THREE_STRUCTURE_PRIORITY.get(left.typeName) ?? 100)
    - (MISSION_THREE_STRUCTURE_PRIORITY.get(right.typeName) ?? 100)
    || Number(left.type === 4) - Number(right.type === 4)
    || right.cellY - left.cellY
    || left.cellX - right.cellX
    || left.id - right.id
  ))[0];
}

function chooseMissionThreeDefenseTarget(hostiles) {
  return chooseTarget(hostiles.filter((object) => object.cellY >= 44 && object.cellX <= 28))
    ?? { cellX: 12, cellY: 52 };
}

function chooseMissionTwoDefenseTarget(hostiles) {
  return chooseTarget(hostiles.filter((object) => object.cellY >= 45));
}

const MISSION_FIVE_STRUCTURE_PRIORITY = new Map([
  ["FACT", 0],
  ["HAND", 1],
  ["AFLD", 2],
  ["PROC", 3],
  ["GUN", 4],
  ["SAM", 5],
  ["NUKE", 6],
  ["SILO", 7],
]);

const MISSION_FIVE_WEST_B_CORE_PRIORITY = new Map([
  ["FACT", 0],
  ["HAND", 1],
  ["AFLD", 2],
  ["NUKE", 3],
  ["PROC", 4],
]);

const MISSION_FIVE_WEST_B_CORE_SITES = new Set([
  "FACT:52:17",
  "HAND:41:22",
  "AFLD:42:18",
  "PROC:47:22",
  "NUKE:47:18",
  "NUKE:49:17",
]);

function chooseMissionFiveAssaultTarget(attackers, hostiles, preferStructures = false) {
  const localThreat = chooseFormationThreat(attackers, hostiles.filter((object) => (
    object.type !== 4 && (object.objectFlags & (1 << 12)) !== 0
  )), 7);
  if (localThreat) return localThreat;
  const nearbyGun = chooseFormationThreat(attackers, hostiles.filter((object) => object.typeName === "GUN"), 10);
  if (nearbyGun) return nearbyGun;
  const structureTarget = hostiles.filter((object) => object.type === 4).toSorted((left, right) => (
    (MISSION_FIVE_STRUCTURE_PRIORITY.get(left.typeName) ?? 50)
    - (MISSION_FIVE_STRUCTURE_PRIORITY.get(right.typeName) ?? 50)
    || left.strength - right.strength
    || left.cellY - right.cellY
    || left.cellX - right.cellX
    || left.type - right.type
    || left.id - right.id
  ))[0];
  if (preferStructures && structureTarget) return structureTarget;
  return structureTarget;
}

function chooseMissionFiveWestBAssaultTarget(
  attackers,
  hostiles,
  huntTriggered,
  requiredCoreSites,
  reserveHuntSwitch = false,
  cleanupWaypoint,
) {
  if (reserveHuntSwitch) {
    hostiles = hostiles.filter((object) => !(
      object.typeName === "NUKE" && object.cellX === 49 && object.cellY === 17
    ));
  }
  const engineerScreeningFactory = (
    missionFiveWestBEngineerPhase !== "captured"
    || (missionFiveShuttleFactCaptureTick !== undefined
      && missionFiveShuttleCaptures.length < 4)
  ) && requiredCoreSites?.some((site) => (
      site.typeName === "FACT" && site.cellX === 52 && site.cellY === 17
    ));
  if (engineerScreeningFactory) {
    const eastGun = hostiles.filter((object) => (
      object.typeName === "GUN"
      && object.cellY === 27
      && (object.cellX === 45 || object.cellX === 50)
    )).toSorted((left, right) => (
      left.strength - right.strength || right.cellX - left.cellX || left.id - right.id
    ))[0];
    if (eastGun) return eastGun;
    const eastMobileThreat = chooseFormationThreat(attackers, hostiles.filter((object) => (
      object.type !== 4
      && (object.objectFlags & (1 << 12)) !== 0
      && object.cellX >= 45
      && object.cellY <= 35
    )), 10);
    if (eastMobileThreat) return eastMobileThreat;
    // Keep the strike screen south-east of the factory. The engineer transport
    // owns the factory objective during this phase, so combat units must not
    // fall through to the normal FACT focus order.
    return { cellX: 55, cellY: 27 };
  }
  const nearbyGun = chooseFormationThreat(attackers, hostiles.filter((object) => (
    object.typeName === "GUN" && (huntTriggered || object.cellX >= 45)
  )), 10);
  if (nearbyGun) return nearbyGun;
  const coreStructure = hostiles.filter((object) => (
    object.type === 4
    && MISSION_FIVE_WEST_B_CORE_SITES.has(`${object.typeName}:${object.cellX}:${object.cellY}`)
  )).toSorted((left, right) => (
    MISSION_FIVE_WEST_B_CORE_PRIORITY.get(left.typeName)
    - MISSION_FIVE_WEST_B_CORE_PRIORITY.get(right.typeName)
    || left.strength - right.strength
    || left.cellY - right.cellY
    || left.cellX - right.cellX
    || left.id - right.id
  ))[0];
  if (!huntTriggered) {
    if (requiredCoreSites?.length > 0) {
      return hostiles.filter((hostile) => requiredCoreSites.some((site) => (
        hostile.typeName === site.typeName
        && hostile.cellX === site.cellX
        && hostile.cellY === site.cellY
      ))).toSorted((left, right) => (
        MISSION_FIVE_WEST_B_CORE_PRIORITY.get(left.typeName)
        - MISSION_FIVE_WEST_B_CORE_PRIORITY.get(right.typeName)
        || left.strength - right.strength
        || left.id - right.id
      ))[0];
    }
    if (coreStructure) return coreStructure;
    if (reserveHuntSwitch) {
      return chooseFormationThreat(attackers, hostiles.filter((object) => (
        object.type !== 4 && (object.objectFlags & (1 << 12)) !== 0
      )), 12)
        ?? chooseMissionFiveAssaultTarget(attackers, hostiles, true)
        ?? chooseTarget(hostiles)
        ?? cleanupWaypoint;
    }
    return undefined;
  }
  const localThreat = chooseFormationThreat(attackers, hostiles.filter((object) => (
    object.type !== 4 && (object.objectFlags & (1 << 12)) !== 0
  )), 7);
  if (localThreat) return localThreat;
  if (coreStructure) return coreStructure;
  return chooseMissionFiveAssaultTarget(attackers, hostiles, true);
}

function chooseMissionFiveDefenseTarget(hostiles, home) {
  return chooseTarget(hostiles.filter((object) => (
    Math.max(Math.abs(object.cellX - home.cellX), Math.abs(object.cellY - home.cellY)) <= 14
  )));
}

function chooseLocalThreat(attackers, hostiles, radius) {
  return hostiles
    .map((hostile) => ({
      hostile,
      distance: Math.min(...attackers.map((attacker) => Math.max(
        Math.abs(attacker.cellX - hostile.cellX),
        Math.abs(attacker.cellY - hostile.cellY),
      ))),
    }))
    .filter(({ distance }) => distance <= radius)
    .toSorted((left, right) => (
      left.distance - right.distance
      || Number(left.hostile.type === 4) - Number(right.hostile.type === 4)
      || left.hostile.strength - right.hostile.strength
      || left.hostile.id - right.hostile.id
    ))[0]?.hostile;
}

function chooseFormationThreat(attackers, hostiles, radius) {
  if (attackers.length === 0) return undefined;
  const requiredNearby = Math.min(4, Math.max(1, Math.ceil(attackers.length * 0.15)));
  return hostiles
    .map((hostile) => {
      const distances = attackers.map((attacker) => Math.max(
        Math.abs(attacker.cellX - hostile.cellX),
        Math.abs(attacker.cellY - hostile.cellY),
      )).toSorted((left, right) => left - right);
      return { hostile, distance: distances[requiredNearby - 1] };
    })
    .filter(({ distance }) => distance <= radius)
    .toSorted((left, right) => (
      left.distance - right.distance
      || Number(left.hostile.type === 4) - Number(right.hostile.type === 4)
      || left.hostile.strength - right.hostile.strength
      || left.hostile.id - right.hostile.id
    ))[0]?.hostile;
}

function decodePlacementOffset(offset) {
  const y = Math.floor((offset + 64) / 128);
  return { x: offset - y * 128, y };
}

function findLegalPlacement(snapshot, entry) {
  const grid = snapshot.placement;
  if (!grid || entry.placementOffsets.length === 0) return undefined;
  const gridIndex = (cellX, cellY) => {
    if (cellX < grid.cellX || cellY < grid.cellY
      || cellX >= grid.cellX + grid.width || cellY >= grid.cellY + grid.height) return undefined;
    return (cellY - grid.cellY) * grid.width + cellX - grid.cellX;
  };
  for (let cellY = grid.cellY; cellY < grid.cellY + grid.height; cellY += 1) {
    for (let cellX = grid.cellX; cellX < grid.cellX + grid.width; cellX += 1) {
      const anchorIndex = gridIndex(cellX, cellY);
      if (anchorIndex === undefined || !(grid.flags[anchorIndex] & 1)) continue;
      const legal = entry.placementOffsets.every((rawOffset) => {
        const offset = decodePlacementOffset(rawOffset);
        const footprintIndex = gridIndex(cellX + offset.x, cellY + offset.y);
        return footprintIndex !== undefined && Boolean(grid.flags[footprintIndex] & 2);
      });
      if (legal) return { x: cellX - grid.cellX, y: cellY - grid.cellY };
    }
  }
  return undefined;
}

function findMissionSevenPlacement(snapshot, entry) {
  const grid = snapshot.placement;
  assert.ok(grid, `Mission 7 ${entry.assetName} placement state is unavailable`);
  const gridIndex = (cellX, cellY) => {
    if (cellX < grid.cellX || cellY < grid.cellY
      || cellX >= grid.cellX + grid.width || cellY >= grid.cellY + grid.height) return undefined;
    return (cellY - grid.cellY) * grid.width + cellX - grid.cellX;
  };
  const candidates = [];
  for (let cellY = grid.cellY; cellY < grid.cellY + grid.height; cellY += 1) {
    for (let cellX = grid.cellX; cellX < grid.cellX + grid.width; cellX += 1) {
      const anchorIndex = gridIndex(cellX, cellY);
      if (anchorIndex === undefined || !(grid.flags[anchorIndex] & 1)) continue;
      const legal = entry.placementOffsets.every((rawOffset) => {
        const offset = decodePlacementOffset(rawOffset);
        const footprintIndex = gridIndex(cellX + offset.x, cellY + offset.y);
        return footprintIndex !== undefined && Boolean(grid.flags[footprintIndex] & 2);
      });
      if (legal) {
        candidates.push({
          x: cellX - grid.cellX,
          y: cellY - grid.cellY,
          cellX,
          cellY,
        });
      }
    }
  }
  const pinned = missionSevenPlacementSites.get(entry.assetName);
  if (pinned) {
    return candidates.find((candidate) => (
      candidate.cellX === pinned.cellX && candidate.cellY === pinned.cellY
    )) ?? {
      x: pinned.cellX - grid.cellX,
      y: pinned.cellY - grid.cellY,
      cellX: pinned.cellX,
      cellY: pinned.cellY,
    };
  }
  const preferred = entry.assetName === "PROC"
    ? { cellX: missionSevenDeploySite.cellX - 2, cellY: missionSevenDeploySite.cellY - 9 }
    : entry.assetName === "WEAP"
      ? { cellX: missionSevenDeploySite.cellX + 3, cellY: missionSevenDeploySite.cellY - 3 }
      : entry.assetName === "GTWR"
        ? { cellX: missionSevenDeploySite.cellX + 1, cellY: missionSevenDeploySite.cellY - 3 }
        : { cellX: missionSevenDeploySite.cellX + 2, cellY: missionSevenDeploySite.cellY };
  return candidates.toSorted((left, right) => (
    Math.max(Math.abs(left.cellX - preferred.cellX), Math.abs(left.cellY - preferred.cellY))
    - Math.max(Math.abs(right.cellX - preferred.cellX), Math.abs(right.cellY - preferred.cellY))
    || right.cellX - left.cellX
    || right.cellY - left.cellY
  ))[0];
}

function advance(handle, ticks) {
  const advanced = outputU32((output) => engine._cnc_web_advance(handle, ticks, output), "engine advance");
  assert.ok(advanced <= ticks, "engine advanced more ticks than requested");
  currentTick += advanced;
  drainEvents(handle);
  return advanced;
}

let handle = 0;
const startedAt = performance.now();
let commandBatches = 0;
let selectionCommands = 0;
let contextualOrders = 0;
let retargetCycles = 0;
let productionStarts = 0;
let infantryProductionStarts = 0;
let vehicleProductionStarts = 0;
let repairOrders = 0;
let deploymentOrders = 0;
let placementStarts = 0;
let placements = 0;
const repairedBuildingIds = new Set();
const missionTwoHomeGuardIds = new Set();
const missionThreeRepairTicks = new Map();
const startedMissionThreeStructures = new Set();
let missionThreeBaseAssaultStarted = false;
let missionThreeScoutId;
let missionThreeScoutStage = 0;
const missionThreeScoutArrivalTicks = [];
let missionThreeRouteStage = 0;
const missionThreeStrikeGroupIds = new Set();
let missionThreeAssaultStartedTick;
let missionFourRouteStage = 0;
const missionFourRouteArrivalTicks = [];
const missionFourExtractionKeys = new Set();
const missionFourCargoKeys = new Set();
let missionFourCargoLoadIssued = false;
let missionFourCargoSealed = false;
let missionFourCargoUnloadIssued = false;
let missionFourCargoUnloaded = false;
let missionFourVanguardStage = 0;
let missionFourScoutKey;
let missionFourScoutStage = 0;
const missionFourScoutArrivalTicks = [];
const missionFiveInitialForceKeys = new Set();
const missionFiveInitialFriendlyKeys = new Set();
const missionFiveCompletedInfantryKeys = new Set();
const missionFiveCompletedVehicleKeys = new Set();
const missionFiveRepairTicks = new Map();
const missionFiveSoldStructureIds = new Set();
let missionFiveReliefStage = 0;
const missionFiveReliefArrivalTicks = [];
let missionFiveRelievedTick;
let missionFiveBaseRepairedTick;
let missionFiveCrateRunnerKey;
let missionFiveCrateCollectedTick;
let missionFivePreviousFunds;
let missionFiveAssaultStartedTick;
const missionFiveStrikeGroupKeys = new Set();
const missionFiveHomeGuardKeys = new Set();
let missionFiveAssaultRouteStage = 0;
const missionFiveAssaultRouteArrivalTicks = [];
let missionFiveAssaultPhase = "staging";
let missionFiveAssaultWaveCount = 0;
let missionFiveWaveLaunchedTick;
let missionFiveAssaultProgressTick = 0;
let missionFiveLastForwardTargetKey;
let missionFiveLastForwardTargetStrength;
let missionFiveWestBRefineryScatterTick;
let missionFiveWestBEngineerPhase = "await-engineer";
let missionFiveWestBEngineerKey;
let missionFiveWestBEngineerProductionStarted = 0;
let missionFiveWestBApcKey;
let missionFiveWestBApcRouteStage = 0;
let missionFiveWestBLoadOrderTick = -Infinity;
let missionFiveWestBApcOrderTick = -Infinity;
let missionFiveWestBUnloadOrderTick = -Infinity;
let missionFiveWestBCaptureOrderTick = -Infinity;
let missionFiveWestBEngineerCaptureStage = 0;
let missionFiveWestBEngineerProducedTick;
let missionFiveWestBLoadTick;
let missionFiveWestBUnloadIssuedTick;
let missionFiveWestBEmptyPipsTick;
let missionFiveWestBEngineerRootTick;
let missionFiveWestBCaptureTick;
let missionFiveWestBInitialApcPipsLogged = false;
const missionFiveWestBEngineerTransitions = [];
let missionFiveShuttleFactCaptureTick;
let missionFiveShuttleFactSaleTick;
let missionFiveShuttleFactSaleFunds;
let missionFiveShuttleFactGoneTick;
let missionFiveShuttleFactGoneFunds;
let missionFiveShuttlePhase = "await-fact";
let missionFiveShuttleRouteStage = 0;
let missionFiveShuttleOrderTick = -Infinity;
let missionFiveShuttleUnloadTick = -Infinity;
let missionFiveShuttleEngineerStarts = 0;
let missionFiveShuttleEngineerStartTick = -Infinity;
let missionFiveShuttleEngineerResumeTick = -Infinity;
const missionFiveShuttleBaselineFriendlyKeys = new Set();
const missionFiveShuttleEngineers = new Map();
const missionFiveShuttleFactCrew = new Map();
const missionFiveShuttleAssignments = new Map();
const missionFiveShuttleRaidStages = new Map();
const missionFiveShuttleRaidOrderTicks = new Map();
const missionFiveShuttleCaptures = [];
const missionFiveShuttleCaptureKeys = new Set();
let missionFiveFootReservePhase = "waiting";
let missionFiveFootReserveRouteStage = 0;
let missionFiveFootReserveOrderTick = -Infinity;
let missionFiveFootEscortOrderTick = -Infinity;
let missionFiveFootReserveStagingTick;
const missionFiveFootReserveStagedEngineers = [];
let missionFiveWestBCleanupBatchTick;
let missionFiveWestBCleanupBatchSize = 0;
const missionFiveInitialHuntStructureKeys = new Set();
const missionFiveInitialSamStructureKeys = new Set();
let missionFiveSamSweepStage = 0;
const missionFiveSamDestroyedTicks = [];
const missionFiveAirstrikeReadyTicks = [];
const missionFiveAirstrikeOrders = [];
const missionFiveAirstrikeDischarges = [];
let missionFiveAirstrikeReadyLatched = false;
let missionFiveAirstrikePending;
let missionFiveHuntTriggeredTick;
const missionFiveKnownHostileStructures = new Map();
let missionFiveStaticSweepStartedTick;
let missionFiveStaticSweepForceOrderCycle = -1;
let missionSixPhase = "opening";
let missionSixRouteStage = 0;
const missionSixRouteArrivalTicks = [];
let missionSixTransportLoadTick;
let missionSixTransportLandingTick;
let missionSixTransportUnloadTick;
let missionSixSabotageActionObserved = false;
let missionSixSabotageOrderTick;
let missionSixLastOrderTick = -Infinity;
let missionSixLastOrderKey;
let missionSixAirstripSelectionTick;
const missionSixSamDestroyedTicks = [];
let missionSevenSabotagedSiteObserved = false;
const missionSevenReinforcementTicks = {
  infantry: undefined,
  jeep: undefined,
  firstTank: undefined,
  secondTank: undefined,
  mcv: undefined,
};
const missionSevenDeploySite = { cellX: 17, cellY: 41 };
const missionSevenPlacementSites = new Map([
  ["NUKE", { cellX: 19, cellY: 43 }],
  ["PROC", { cellX: 13, cellY: 39 }],
  ["PYLE", { cellX: 17, cellY: 43 }],
  ["GTWR", { cellX: 17, cellY: 39 }],
  ["WEAP", { cellX: 16, cellY: 42 }],
]);
const missionSevenSamSites = [
  { cellX: 48, cellY: 31 },
  { cellX: 54, cellY: 18 },
  { cellX: 44, cellY: 18 },
  { cellX: 22, cellY: 13 },
];
const missionSevenWestRoute = [
  { cellX: 12, cellY: 35 },
  { cellX: 8, cellY: 27 },
  { cellX: 8, cellY: 19 },
  { cellX: 14, cellY: 14 },
  { cellX: 22, cellY: 13 },
];
const missionSevenEngineerRoute = [
  { cellX: 41, cellY: 33 },
  { cellX: 49, cellY: 26 },
];
const missionSevenJeepRoute = [
  { cellX: 41, cellY: 33 },
  { cellX: 49, cellY: 26 },
];
const missionSevenSaleCrewRoute = [
  { cellX: 41, cellY: 33 },
  { cellX: 49, cellY: 26 },
];
const missionSevenHandProductionRoute = [
  { cellX: 47, cellY: 18 },
  { cellX: 51, cellY: 17 },
];
const missionSevenVehicleStaging = { cellX: 17, cellY: 46, kind: "waypoint" };
const missionSevenCoreRoute = [
  { cellX: 41, cellY: 33, typeName: "GUN" },
  { cellX: 48, cellY: 31, typeName: "SAM", exact: true },
  { cellX: 49, cellY: 26, kind: "waypoint", label: "east approach" },
  { cellX: 53, cellY: 20, typeName: "GUN" },
  { cellX: 46, cellY: 20, typeName: "GUN" },
  { cellX: 44, cellY: 18, typeName: "SAM", exact: true },
  { cellX: 54, cellY: 18, typeName: "SAM", exact: true },
  { cellX: 55, cellY: 14, typeName: "FACT" },
  { cellX: 60, cellY: 8, kind: "waypoint", label: "airstrip approach" },
  { cellX: 58, cellY: 4, typeName: "AFLD", exact: true },
  { cellX: 44, cellY: 13, typeName: "HAND" },
  { cellX: 53, cellY: 14, typeName: "NUKE", exact: true },
  { cellX: 51, cellY: 14, typeName: "NUKE", exact: true },
  { cellX: 50, cellY: 4, typeName: "HQ" },
  { cellX: 52, cellY: 4, typeName: "NUKE", exact: true },
  { cellX: 54, cellY: 4, typeName: "NUKE", exact: true },
  { cellX: 42, cellY: 13, typeName: "NUKE", exact: true },
  { cellX: 37, cellY: 14, typeName: "GUN", exact: true },
  { cellX: 37, cellY: 3, typeName: "GUN", exact: true },
];
const missionSevenState = {
  placedSites: [],
  lastFactRepairTick: -Infinity,
  pyleSale: {},
  cySale: { crewBefore: new Set(), crew: [] },
  westKeys: new Set(),
  westStage: 0,
  assaultTick: undefined,
  wave: 0,
  waves: [],
  strikeKeys: new Set(),
  homeKeys: new Set(),
  heldKeys: new Set(),
  routeStage: 0,
  routeProgress: [],
  samDeathTicks: new Map(),
  allSamsDeadTick: undefined,
  airstrike: {
    readyTicks: [],
    orders: [],
    discharges: [],
    readyLatched: false,
    pending: undefined,
  },
  postCyTankStarts: 0,
  postCyJeepStarts: 0,
  sixthTank: {},
  jeep: { stage: 0 },
  engineer: {
    stage: "await-sale",
    routeStage: 0,
    orderTick: -Infinity,
    progress: [],
    captureOrders: [],
    guardOrderTick: -Infinity,
    guardOrderCount: 0,
  },
  purge: {
    targetKey: undefined,
    orderTick: -Infinity,
    targets: [],
    quietStartTick: undefined,
    quietSatisfiedTick: undefined,
    quietStopIssued: false,
  },
  capturedHand: undefined,
  handBaselineFootKeys: new Set(),
  weapSale: { crewBefore: new Set(), crewKeys: new Set(), crew: [] },
  saleCrew: { routeStage: 0, arrivalKeys: new Set() },
  handProduction: {
    orders: [],
    keys: new Set(),
    completions: [],
    stages: new Map(),
    arrivals: [],
  },
  factDestroyedTick: undefined,
  airstripDestroyedTick: undefined,
};

function missionSevenDistance(object, destination) {
  return Math.max(
    Math.abs(object.cellX - destination.cellX),
    Math.abs(object.cellY - destination.cellY),
  );
}

function missionSevenMatchesSite(object, site) {
  return site.typeName !== undefined
    && object.typeName === site.typeName
    && missionSevenDistance(object, site) <= (site.exact ? 0 : 3);
}

function queueMissionSevenContext(commands, group, destination, flags = 0) {
  if (group.length === 0 || !destination) return false;
  commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
  for (const object of group) {
    commands.push({
      type: COMMAND_SELECT_OBJECT,
      args: [object.type, object.id, 0, 0, 0, 0, 0],
    });
  }
  if (flags) commands.push({
    type: COMMAND_INPUT,
    flags,
    args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
  });
  commands.push({
    type: COMMAND_INPUT,
    flags,
    args: [
      INPUT_COMMAND_AT_POSITION,
      destination.worldX ?? destination.cellX * CELL_PIXELS + CELL_PIXELS / 2,
      destination.worldY ?? destination.cellY * CELL_PIXELS + CELL_PIXELS / 2,
      0, 0, 0, 0,
    ],
  });
  if (flags) commands.push({
    type: COMMAND_INPUT,
    args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
  });
  selectionCommands += group.length;
  contextualOrders += 1;
  retargetCycles += 1;
  return true;
}

function queueMissionSevenStop(commands, group) {
  if (group.length === 0) return false;
  commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
  for (const object of group) {
    commands.push({
      type: COMMAND_SELECT_OBJECT,
      args: [object.type, object.id, 0, 0, 0, 0, 0],
    });
  }
  commands.push({ type: COMMAND_UNIT, args: [UNIT_REQUEST_STOP, 0, 0, 0, 0, 0, 0] });
  selectionCommands += group.length;
  return true;
}

function startMissionSevenProduction(commands, entry) {
  commands.push({
    type: COMMAND_SIDEBAR,
    args: [SIDEBAR_START_CONSTRUCTION, entry.buildableType, entry.buildableId, 0, 0, 0, 0],
  });
  productionStarts += 1;
  if (entry.objectType === 12) infantryProductionStarts += 1;
  if (entry.objectType === 13) vehicleProductionStarts += 1;
}

function sellMissionSevenStructure(commands, structure) {
  commands.push({
    type: COMMAND_STRUCTURE,
    args: [STRUCTURE_SELL, structure.id, 0, 0, 0, 0, 0],
  });
}

function observeMissionSevenTurn(snapshot, friendly, hostiles) {
  const state = missionSevenState;
  const funds = snapshot.sidebar.credits + snapshot.sidebar.tiberium;

  for (const site of missionSevenSamSites) {
    const key = `${site.cellX}:${site.cellY}`;
    if (!state.samDeathTicks.has(key) && !hostiles.some((hostile) => (
      hostile.typeName === "SAM"
      && hostile.cellX === site.cellX && hostile.cellY === site.cellY
    ))) state.samDeathTicks.set(key, snapshot.tick);
  }
  if (state.samDeathTicks.size === missionSevenSamSites.length
    && state.allSamsDeadTick === undefined) state.allSamsDeadTick = snapshot.tick;

  const authoredFact = hostiles.find((hostile) => (
    hostile.typeName === "FACT" && missionSevenDistance(hostile, { cellX: 55, cellY: 14 }) <= 3
  ));
  if (state.assaultTick !== undefined && !authoredFact && state.factDestroyedTick === undefined) {
    state.factDestroyedTick = snapshot.tick;
  }
  const authoredAirstrip = hostiles.find((hostile) => (
    hostile.typeName === "AFLD" && hostile.cellX === 58 && hostile.cellY === 4
  ));
  if (state.assaultTick !== undefined && !authoredAirstrip
    && state.airstripDestroyedTick === undefined) state.airstripDestroyedTick = snapshot.tick;

  const capturedHand = friendly.find((object) => (
    object.type === 4 && object.typeName === "HAND"
    && missionSevenDistance(object, { cellX: 44, cellY: 13 }) <= 3
  ));
  if (capturedHand && state.capturedHand === undefined) {
    state.capturedHand = {
      tick: snapshot.tick,
      key: objectKey(capturedHand),
      strength: capturedHand.strength,
      maxStrength: capturedHand.maxStrength,
      cellX: capturedHand.cellX,
      cellY: capturedHand.cellY,
    };
    state.engineer.captureTick = snapshot.tick;
    state.engineer.stage = "captured";
    state.handBaselineFootKeys = new Set(
      friendly.filter((object) => object.type === 1).map(objectKey),
    );
    if (state.engineer.guardKey !== undefined) {
      state.strikeKeys.add(state.engineer.guardKey);
      state.engineer.guardReleaseTick = snapshot.tick;
    }
  }

  if (state.pyleSale.orderTick !== undefined && state.pyleSale.goneTick === undefined
    && !friendly.some((object) => object.type === 4 && object.id === state.pyleSale.id)) {
    state.pyleSale.goneTick = snapshot.tick;
    state.pyleSale.fundsAfter = funds;
  }

  if (state.cySale.orderTick !== undefined && state.cySale.goneTick === undefined
    && !friendly.some((object) => object.type === 4 && object.id === state.cySale.id)) {
    state.cySale.goneTick = snapshot.tick;
    state.cySale.fundsAfter = funds;
    const crew = friendly.filter((object) => (
      object.type === 1 && !state.cySale.crewBefore.has(objectKey(object))
    ));
    state.cySale.crew = crew.map((object) => object.typeName).toSorted();
    assert.equal(state.cySale.crew.length, 5,
      "Mission 7 delayed Construction Yard survivor count changed");
    assert.ok(state.cySale.crew.every((typeName) => (
      typeName === "E1" || typeName === "C1" || typeName === "C7" || typeName === "E6"
    )), "Mission 7 delayed Construction Yard emitted an invalid survivor type");
    assert.equal(state.cySale.crew.filter((typeName) => typeName === "E6").length, 1,
      "Mission 7 delayed Construction Yard did not yield exactly one Engineer");
    assert.equal(state.cySale.fundsAfter - state.cySale.fundsBefore, 2_500,
      "Mission 7 Construction Yard sale refund changed");
    const engineer = crew.find((object) => object.typeName === "E6");
    assert.ok(engineer, "Mission 7 Construction Yard sale did not yield its Engineer");
    state.engineer.key = objectKey(engineer);
    state.engineer.observedTick = snapshot.tick;
    state.engineer.minimumStrength = engineer.strength;
    state.engineer.stage = "holding";
  }

  if (state.weapSale.orderTick !== undefined && state.weapSale.goneTick === undefined) {
    const spawned = friendly.filter((object) => (
      object.type === 1 && !state.weapSale.crewBefore.has(objectKey(object))
    ));
    for (const object of spawned) state.weapSale.crewKeys.add(objectKey(object));
    state.weapSale.crew = spawned.map((object) => object.typeName).toSorted();
    if (!friendly.some((object) => object.type === 4 && object.id === state.weapSale.id)) {
      state.weapSale.goneTick = snapshot.tick;
      state.weapSale.fundsAfter = funds;
      assert.equal(state.weapSale.fundsAfter - state.weapSale.fundsBefore, 1_000,
        "Mission 7 post-capture Weapons Factory refund changed");
      assert.equal(state.weapSale.crew.length, 5,
        "Mission 7 post-capture Weapons Factory survivor count changed");
      assert.ok(state.weapSale.crew.every((typeName) => (
        typeName === "E1" || typeName === "C1" || typeName === "C7"
      )), "Mission 7 post-capture Weapons Factory emitted an invalid survivor type");
    }
  }

  if (state.engineer.key !== undefined && state.engineer.captureTick === undefined) {
    const engineer = friendly.find((object) => objectKey(object) === state.engineer.key);
    if (engineer) {
      state.engineer.minimumStrength = Math.min(state.engineer.minimumStrength, engineer.strength);
    } else if (state.engineer.deathTick === undefined) {
      state.engineer.deathTick = snapshot.tick;
    }
  }

  if (state.capturedHand !== undefined) {
    const expectedCounts = new Map();
    for (const { assetName } of state.handProduction.orders) {
      expectedCounts.set(assetName, (expectedCounts.get(assetName) ?? 0) + 1);
    }
    const completedCounts = new Map();
    for (const { typeName } of state.handProduction.completions) {
      completedCounts.set(typeName, (completedCounts.get(typeName) ?? 0) + 1);
    }
    for (const object of friendly.filter((candidate) => (
      candidate.type === 1
      && !state.handBaselineFootKeys.has(objectKey(candidate))
      && !state.weapSale.crewKeys.has(objectKey(candidate))
    )).toSorted((left, right) => left.id - right.id)) {
      const key = objectKey(object);
      const completed = completedCounts.get(object.typeName) ?? 0;
      if (state.handProduction.keys.has(key)
        || completed >= (expectedCounts.get(object.typeName) ?? 0)) continue;
      state.handProduction.keys.add(key);
      state.handProduction.completions.push({
        tick: snapshot.tick,
        key,
        typeName: object.typeName,
      });
      completedCounts.set(object.typeName, completed + 1);
      state.handProduction.stages.set(key, 0);
    }
  }

  const airstrikeEntry = snapshot.sidebar.entries.find((entry) => entry.assetName === "SW_AirStrike");
  if (airstrikeEntry) {
    assert.equal(airstrikeEntry.buildableType, 24, "Mission 7 Air Strike buildable type changed");
    assert.equal(airstrikeEntry.buildableId, 3, "Mission 7 Air Strike buildable id changed");
    assert.equal(airstrikeEntry.objectType, 11, "Mission 7 Air Strike object type changed");
    assert.equal(airstrikeEntry.superweaponType, 3, "Mission 7 Air Strike superweapon type changed");
    if (airstrikeEntry.completed && !state.airstrike.readyLatched) {
      state.airstrike.readyTicks.push(snapshot.tick);
      state.airstrike.readyLatched = true;
    } else if (!airstrikeEntry.completed) state.airstrike.readyLatched = false;
  }
  if (state.allSamsDeadTick !== undefined && snapshot.tick >= state.allSamsDeadTick + 60) {
    assert.ok(airstrikeEntry, "destroying all four Mission 7 SAM sites did not expose Air Strike");
  }
  if (state.airstrike.pending) {
    const pendingTarget = hostiles.find((hostile) => (
      objectKey(hostile) === state.airstrike.pending.targetKey
    ));
    const discharged = airstrikeEntry && !airstrikeEntry.completed;
    const a10Observed = friendly.some((object) => object.type === 3 && object.typeName === "A10");
    const targetDamaged = !pendingTarget
      || pendingTarget.strength < state.airstrike.pending.targetStrength;
    if (discharged && a10Observed) {
      state.airstrike.discharges.push({
        orderTick: state.airstrike.pending.orderTick,
        effectTick: snapshot.tick,
        target: state.airstrike.pending.targetType,
        a10Observed,
        targetDamaged,
      });
      state.airstrike.pending = undefined;
    }
  }
}

function queueMissionSevenBase(snapshot, friendly, hostiles, commands) {
  const state = missionSevenState;
  const funds = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
  const buildings = friendly.filter((object) => object.type === 4);
  const builtAssets = new Set(buildings.map((object) => object.typeName));

  if (buildings.length === 0) {
    const mcv = friendly.find((object) => object.typeName === "MCV");
    if (mcv) {
      const atSite = missionSevenDistance(mcv, missionSevenDeploySite) === 0;
      queueMissionSevenContext(commands, [mcv], atSite ? mcv : missionSevenDeploySite);
      if (atSite) deploymentOrders += 1;
    }
  } else if (state.cySale.orderTick === undefined) {
    const completedStructure = snapshot.sidebar.entries.find((entry) => (
      entry.objectType === 15 && entry.completed
    ));
    const missingStructure = !builtAssets.has("NUKE") ? "NUKE"
      : !builtAssets.has("PROC") ? "PROC"
        : state.pyleSale.orderTick === undefined && !builtAssets.has("PYLE") ? "PYLE"
          : state.pyleSale.orderTick === undefined && !builtAssets.has("GTWR") ? "GTWR"
            : !builtAssets.has("WEAP") ? "WEAP"
              : undefined;
    const structureEntry = completedStructure ?? (missingStructure
      ? snapshot.sidebar.entries.find((entry) => (
          entry.objectType === 15 && entry.assetName === missingStructure
        ))
      : undefined);
    if (structureEntry?.completed) {
      if (snapshot.placement) {
        const cell = findMissionSevenPlacement(snapshot, structureEntry);
        commands.push({
          type: COMMAND_SIDEBAR,
          args: [
            SIDEBAR_PLACE,
            structureEntry.buildableType,
            structureEntry.buildableId,
            cell.x,
            cell.y,
            0,
            0,
          ],
        });
        state.placedSites.push({
          assetName: structureEntry.assetName,
          tick: snapshot.tick,
          cellX: cell.cellX,
          cellY: cell.cellY,
        });
        placements += 1;
      } else {
        commands.push({
          type: COMMAND_SIDEBAR,
          args: [
            SIDEBAR_START_PLACEMENT,
            structureEntry.buildableType,
            structureEntry.buildableId,
            0, 0, 0, 0,
          ],
        });
        placementStarts += 1;
      }
    } else if (structureEntry && !structureEntry.constructing
      && !structureEntry.onHold && !structureEntry.busy && funds >= structureEntry.cost) {
      startMissionSevenProduction(commands, structureEntry);
    }
  }

  if (state.pyleSale.orderTick === undefined
    && builtAssets.has("GTWR") && !builtAssets.has("WEAP")) {
    const pyle = buildings.find((object) => (
      object.typeName === "PYLE" && (object.objectFlags & (1 << 5))
    ));
    if (pyle) {
      state.pyleSale = {
        orderTick: snapshot.tick,
        id: pyle.id,
        fundsBefore: funds,
        strength: pyle.strength,
      };
      sellMissionSevenStructure(commands, pyle);
    }
  }

  if (state.cySale.orderTick === undefined && state.samDeathTicks.has("48:31")
    && snapshot.tick >= state.samDeathTicks.get("48:31") + 30) {
    const constructionYard = buildings.find((object) => (
      object.typeName === "FACT" && (object.objectFlags & (1 << 5))
    ));
    if (constructionYard) {
      state.cySale.orderTick = snapshot.tick;
      state.cySale.id = constructionYard.id;
      state.cySale.fundsBefore = funds;
      state.cySale.strength = constructionYard.strength;
      state.cySale.crewBefore = new Set(
        friendly.filter((object) => object.type === 1).map(objectKey),
      );
      sellMissionSevenStructure(commands, constructionYard);
    }
  }

  const constructionYard = buildings.find((object) => object.typeName === "FACT");
  if (constructionYard && state.cySale.orderTick === undefined
    && constructionYard.strength < constructionYard.maxStrength
    && !(constructionYard.objectFlags & (1 << 1))
    && funds >= 250 && snapshot.tick - state.lastFactRepairTick >= 900) {
    commands.push({
      type: COMMAND_STRUCTURE,
      args: [STRUCTURE_REPAIR_START, 0, 0, 0, 0, 0, 0],
    });
    commands.push({
      type: COMMAND_STRUCTURE,
      args: [STRUCTURE_REPAIR, constructionYard.id, 0, 0, 0, 0, 0],
    });
    state.lastFactRepairTick = snapshot.tick;
    repairOrders += 1;
  }

  const westSamAlive = hostiles.some((hostile) => (
    hostile.typeName === "SAM" && hostile.cellX === 22 && hostile.cellY === 13
  ));
  if (builtAssets.has("PYLE") && state.pyleSale.orderTick === undefined && westSamAlive) {
    const liveWest = friendly.filter((object) => (
      object.type === 1 && state.westKeys.has(objectKey(object))
    )).length;
    const infantry = snapshot.sidebar.entries.find((entry) => entry.assetName === "E2")
      ?? snapshot.sidebar.entries.find((entry) => entry.assetName === "E1");
    if (infantry && liveWest < 4 && !infantry.constructing && !infantry.completed
      && !infantry.onHold && !infantry.busy && funds >= infantry.cost + 800) {
      startMissionSevenProduction(commands, infantry);
    }
  }

  if (state.cySale.goneTick !== undefined && builtAssets.has("WEAP")) {
    const mediumTank = snapshot.sidebar.entries.find((entry) => entry.assetName === "MTNK");
    const jeep = snapshot.sidebar.entries.find((entry) => entry.assetName === "JEEP");
    const waveTwoTick = state.waves.findLast(({ wave }) => wave === 2)?.tick;
    const vehicle = state.postCyTankStarts < 5
      ? mediumTank
      : state.wave >= 2 && snapshot.tick > waveTwoTick
          && state.sixthTank.queueTick === undefined
        ? mediumTank
        : state.sixthTank.completedTick !== undefined
            && snapshot.tick > state.sixthTank.completedTick
            && state.jeep.queueTick === undefined
          ? jeep
          : undefined;
    if (vehicle && !vehicle.constructing && !vehicle.completed && !vehicle.onHold
      && !vehicle.busy && funds >= vehicle.cost) {
      startMissionSevenProduction(commands, vehicle);
      if (vehicle.assetName === "MTNK") {
        state.postCyTankStarts += 1;
        if (state.postCyTankStarts === 6) {
          state.sixthTank.queueTick = snapshot.tick;
          state.sixthTank.queueFunds = funds;
        }
      } else {
        state.postCyJeepStarts += 1;
        state.jeep.queueTick = snapshot.tick;
        state.jeep.queueFunds = funds;
      }
    }
  }

  if (state.capturedHand !== undefined && state.weapSale.orderTick === undefined) {
    const weaponsFactory = buildings.find((object) => (
      object.typeName === "WEAP" && (object.objectFlags & (1 << 5))
    ));
    if (weaponsFactory) {
      state.weapSale.orderTick = snapshot.tick;
      state.weapSale.id = weaponsFactory.id;
      state.weapSale.fundsBefore = funds;
      state.weapSale.crewBefore = new Set(
        friendly.filter((object) => object.type === 1).map(objectKey),
      );
      sellMissionSevenStructure(commands, weaponsFactory);
    }
  }

  if (state.weapSale.goneTick !== undefined && state.capturedHand !== undefined
    && state.handProduction.orders.length < 4) {
    const infantry = ["E3", "E4", "E1"]
      .map((assetName) => snapshot.sidebar.entries.find((entry) => entry.assetName === assetName))
      .find((entry) => entry && !entry.constructing && !entry.completed
        && !entry.onHold && !entry.busy && funds >= entry.cost);
    if (infantry) {
      startMissionSevenProduction(commands, infantry);
      state.handProduction.orders.push({
        tick: snapshot.tick,
        assetName: infantry.assetName,
        cost: infantry.cost,
        fundsBefore: funds,
      });
    }
  }

  const airstrikeEntry = snapshot.sidebar.entries.find((entry) => (
    entry.assetName === "SW_AirStrike"
  ));
  if (state.allSamsDeadTick !== undefined && airstrikeEntry?.completed
    && state.airstrike.pending === undefined) {
    const priorities = state.airstrike.orders.length === 0
      ? new Map([["AFLD", 0], ["FACT", 1], ["HAND", 2], ["NUKE", 3], ["HQ", 4]])
      : new Map([["FACT", 0], ["AFLD", 1], ["HAND", 2], ["NUKE", 3], ["HQ", 4]]);
    const protectHand = state.engineer.key !== undefined
      && state.engineer.captureTick === undefined && state.engineer.deathTick === undefined;
    const structureTarget = hostiles.filter((hostile) => (
      hostile.type === 4
      && !(protectHand && hostile.typeName === "HAND"
        && missionSevenDistance(hostile, { cellX: 44, cellY: 13 }) <= 3)
    )).toSorted((left, right) => (
      (priorities.get(left.typeName) ?? 20) - (priorities.get(right.typeName) ?? 20)
      || left.strength - right.strength
      || left.cellY - right.cellY
      || left.cellX - right.cellX
      || left.id - right.id
    ))[0];
    const mobileTarget = chooseTarget(hostiles.filter((hostile) => (
      hostile.type !== 4 && hostile.typeName !== "HARV"
    )));
    const remoteCleanupTarget = state.airstrike.orders.length > 0
      ? chooseTarget(hostiles.filter((hostile) => (
        hostile.type !== 4 && hostile.typeName !== "HARV"
        && hostile.cellX <= 10 && hostile.cellY <= 10
      )))
      : undefined;
    const target = remoteCleanupTarget
      ?? structureTarget
      ?? mobileTarget
      ?? chooseTarget(hostiles);
    if (target) {
      commands.push({
        type: COMMAND_SUPERWEAPON,
        args: [
          SUPERWEAPON_PLACE,
          airstrikeEntry.buildableType,
          airstrikeEntry.buildableId,
          target.cellX * CELL_PIXELS + CELL_PIXELS / 2,
          target.cellY * CELL_PIXELS + CELL_PIXELS / 2,
          0,
          0,
        ],
      });
      const order = {
        tick: snapshot.tick,
        target: target.typeName,
        cellX: target.cellX,
        cellY: target.cellY,
        strength: target.strength,
      };
      state.airstrike.orders.push(order);
      state.airstrike.pending = {
        orderTick: snapshot.tick,
        targetKey: objectKey(target),
        targetType: target.typeName,
        targetStrength: target.strength,
      };
    }
  }
}

function classifyMissionSevenForces(snapshot, friendly, hostiles, attackers) {
  const state = missionSevenState;
  const liveFriendlyKeys = new Set(friendly.map(objectKey));
  for (const keys of [state.westKeys, state.strikeKeys, state.homeKeys, state.heldKeys]) {
    for (const key of keys) {
      if (!liveFriendlyKeys.has(key)) keys.delete(key);
    }
  }

  const westSamAlive = hostiles.some((hostile) => (
    hostile.typeName === "SAM" && hostile.cellX === 22 && hostile.cellY === 13
  ));
  if (westSamAlive) {
    const liveWestKeys = new Set(friendly.filter((object) => (
      object.type === 1 && state.westKeys.has(objectKey(object))
    )).map(objectKey));
    if (liveWestKeys.size < 6) {
      for (const infantry of friendly.filter((object) => (
        object.type === 1
        && objectKey(object) !== state.engineer.key
        && !state.westKeys.has(objectKey(object))
        && !state.strikeKeys.has(objectKey(object))
        && !state.weapSale.crewKeys.has(objectKey(object))
        && !state.handProduction.keys.has(objectKey(object))
      )).toSorted((left, right) => (
        Number(right.typeName === "E2") - Number(left.typeName === "E2")
        || left.id - right.id
      ))) {
        const key = objectKey(infantry);
        state.westKeys.add(key);
        state.homeKeys.delete(key);
        liveWestKeys.add(key);
        if (liveWestKeys.size >= 6) break;
      }
    }
  } else if (state.assaultTick !== undefined) {
    for (const key of state.westKeys) {
      if (liveFriendlyKeys.has(key)) state.strikeKeys.add(key);
    }
  }

  const buildings = friendly.filter((object) => object.type === 4);
  const tanks = attackers.filter((attacker) => attacker.typeName === "MTNK")
    .toSorted((left, right) => right.strength - left.strength || left.id - right.id);
  const baseReady = buildings.some((object) => object.typeName === "GTWR")
    && buildings.some((object) => object.typeName === "WEAP");
  if (state.assaultTick === undefined && baseReady && tanks.length >= 2) {
    state.assaultTick = snapshot.tick;
    state.wave = 1;
    state.waves.push({ tick: snapshot.tick, wave: 1, size: tanks.length });
    for (const tank of tanks) {
      const key = objectKey(tank);
      state.homeKeys.delete(key);
      state.strikeKeys.add(key);
    }
  }

  for (const attacker of attackers) {
    const key = objectKey(attacker);
    if (key === state.engineer.key || state.westKeys.has(key)
      || state.strikeKeys.has(key) || state.homeKeys.has(key) || state.heldKeys.has(key)
      || key === state.sixthTank.key || key === state.jeep.key) continue;
    if (state.weapSale.crewKeys.has(key) && state.saleCrew.releaseTick === undefined) continue;
    if (state.handProduction.keys.has(key)
      && (state.handProduction.stages.get(key) ?? 0) < missionSevenHandProductionRoute.length) continue;

    if (state.assaultTick === undefined) {
      state.homeKeys.add(key);
      continue;
    }
    if (attacker.typeName === "MTNK") {
      if (state.sixthTank.queueTick !== undefined && state.sixthTank.key === undefined) {
        state.sixthTank.key = key;
        state.sixthTank.completedTick = snapshot.tick;
        const engineer = friendly.find((object) => objectKey(object) === state.engineer.key);
        if (engineer && state.engineer.captureTick === undefined) {
          state.engineer.guardKey = key;
          state.engineer.transitGuardKey = key;
          state.engineer.transitGuardActive = true;
          state.engineer.guardAssignedTick = snapshot.tick;
          state.engineer.guardOrderTick = -Infinity;
          state.engineer.guardMinimumStrength = attacker.strength;
        } else state.strikeKeys.add(key);
      } else state.heldKeys.add(key);
    } else if (attacker.typeName === "JEEP"
      && state.jeep.queueTick !== undefined && state.jeep.key === undefined) {
      state.jeep.key = key;
      state.jeep.completedTick = snapshot.tick;
      state.heldKeys.add(key);
    } else state.homeKeys.add(key);
  }

  const heldTanks = attackers.filter((attacker) => (
    attacker.typeName === "MTNK" && state.heldKeys.has(objectKey(attacker))
  ));
  if (heldTanks.length >= 5 && state.routeStage === 3) {
    for (const tank of heldTanks) {
      const key = objectKey(tank);
      state.heldKeys.delete(key);
      state.strikeKeys.add(key);
    }
    state.wave += 1;
    state.waves.push({
      tick: snapshot.tick,
      wave: state.wave,
      size: heldTanks.length,
      routeStage: state.routeStage,
    });
  }
}

function queueMissionSevenWestAndHome(
  snapshot,
  friendly,
  hostiles,
  attackers,
  commands,
  phase = "all",
) {
  const state = missionSevenState;
  const westSam = hostiles.find((hostile) => (
    hostile.typeName === "SAM" && hostile.cellX === 22 && hostile.cellY === 13
  ));
  const westGroup = friendly.filter((object) => (
    object.type === 1 && state.westKeys.has(objectKey(object))
  ));
  if (phase !== "home" && westSam && westGroup.length > 0) {
    while (state.westStage < missionSevenWestRoute.length - 1) {
      const waypoint = missionSevenWestRoute[state.westStage];
      const arrivals = westGroup.filter((unit) => missionSevenDistance(unit, waypoint) <= 2).length;
      if (arrivals < Math.max(1, Math.ceil(westGroup.length / 2))) break;
      state.westStage += 1;
    }
    const target = state.westStage >= missionSevenWestRoute.length - 1
      ? westSam
      : missionSevenWestRoute[state.westStage];
    queueMissionSevenContext(commands, westGroup, target);
  }

  const homeGroup = attackers.filter((attacker) => state.homeKeys.has(objectKey(attacker)));
  const mcvDeploying = friendly.some((object) => object.typeName === "MCV")
    && !friendly.some((object) => object.type === 4);
  if (phase !== "west" && !mcvDeploying && homeGroup.length > 0) {
    const visibleThreat = chooseTarget(hostiles.filter((hostile) => (
      snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
      && hostile.type !== 4 && hostile.typeName !== "HARV"
      && missionSevenDistance(hostile, missionSevenDeploySite) <= 11
    )));
    queueMissionSevenContext(commands, homeGroup,
      visibleThreat ?? { cellX: missionSevenDeploySite.cellX + 1, cellY: missionSevenDeploySite.cellY });
  }
}

function queueMissionSevenEngineerTransit(snapshot, friendly, commands) {
  const state = missionSevenState;
  if (state.engineer.key === undefined || state.engineer.captureTick !== undefined
    || state.engineer.deathTick !== undefined) return;
  const engineer = friendly.find((object) => objectKey(object) === state.engineer.key);
  if (!engineer) return;

  const transitGuard = friendly.find((object) => (
    objectKey(object) === state.engineer.transitGuardKey
  ));
  if (state.engineer.transitGuardActive && transitGuard
    && snapshot.tick - state.engineer.guardOrderTick >= 60) {
    queueMissionSevenContext(
      commands,
      [transitGuard],
      engineer,
      MODIFIER_CTRL | MODIFIER_ALT,
    );
    state.engineer.guardOrderTick = snapshot.tick;
    state.engineer.guardOrderCount += 1;
    state.engineer.guardMinimumStrength = Math.min(
      state.engineer.guardMinimumStrength ?? transitGuard.strength,
      transitGuard.strength,
    );
  }

  if (state.wave < 2) {
    const home = { cellX: 18, cellY: 41 };
    if (missionSevenDistance(engineer, home) > 2
      && snapshot.tick - state.engineer.orderTick >= 90) {
      state.engineer.stage = "returning-home";
      queueMissionSevenContext(commands, [engineer], home, MODIFIER_ALT);
      state.engineer.orderTick = snapshot.tick;
    } else if (missionSevenDistance(engineer, home) <= 2
      && (state.engineer.orderTick === -Infinity
        || state.engineer.stage === "returning-home")) {
      queueMissionSevenStop(commands, [engineer]);
      state.engineer.stage = "holding";
      state.engineer.orderTick = snapshot.tick;
    }
    return;
  }

  if (state.engineer.routeStage < missionSevenEngineerRoute.length) {
    state.engineer.stage = "transiting";
    while (state.engineer.routeStage < missionSevenEngineerRoute.length) {
      const waypoint = missionSevenEngineerRoute[state.engineer.routeStage];
      if (missionSevenDistance(engineer, waypoint) > 3) break;
      state.engineer.progress.push({
        tick: snapshot.tick,
        stage: state.engineer.routeStage,
        waypoint,
        strength: engineer.strength,
        cellX: engineer.cellX,
        cellY: engineer.cellY,
      });
      state.engineer.routeStage += 1;
      state.engineer.orderTick = -Infinity;
    }
    const waypoint = missionSevenEngineerRoute[state.engineer.routeStage];
    if (waypoint && snapshot.tick - state.engineer.orderTick >= 90) {
      queueMissionSevenContext(commands, [engineer], waypoint, MODIFIER_ALT);
      state.engineer.orderTick = snapshot.tick;
    }
  }

  if (state.engineer.routeStage === missionSevenEngineerRoute.length
    && state.engineer.stagedTick === undefined) {
    state.engineer.stagedTick = snapshot.tick;
    state.engineer.stage = "staged";
    queueMissionSevenStop(commands, [engineer]);
    if (state.engineer.transitGuardActive && state.engineer.guardKey !== undefined) {
      const guardKey = state.engineer.guardKey;
      state.engineer.transitGuardActive = false;
      state.engineer.transitGuardReleaseTick = snapshot.tick;
      state.strikeKeys.add(guardKey);
      state.engineer.guardKey = undefined;
      state.engineer.guardAssignedTick = undefined;
      state.engineer.guardOrderTick = -Infinity;
    }
  }
}

function queueMissionSevenJeep(snapshot, friendly, hostiles, attackers, commands) {
  const state = missionSevenState;
  if (state.jeep.key === undefined) return;
  const jeep = attackers.find((attacker) => objectKey(attacker) === state.jeep.key);
  if (!jeep) {
    if (state.jeep.completedTick !== undefined && state.jeep.deathTick === undefined) {
      state.jeep.deathTick = snapshot.tick;
    }
    return;
  }
  state.jeep.minimumStrength = Math.min(state.jeep.minimumStrength ?? jeep.strength, jeep.strength);
  const innerGunsCleared = [[53, 20], [46, 20]].every(([cellX, cellY]) => (
    state.routeProgress.some((progress) => (
      progress.typeName === "GUN" && progress.cellX === cellX && progress.cellY === cellY
    ))
  ));
  if (!innerGunsCleared) return;

  while (state.jeep.stage < missionSevenJeepRoute.length) {
    const waypoint = missionSevenJeepRoute[state.jeep.stage];
    if (missionSevenDistance(jeep, waypoint) > 3) break;
    state.jeep.stage += 1;
  }
  if (state.jeep.stage < missionSevenJeepRoute.length) {
    state.heldKeys.delete(state.jeep.key);
    state.jeep.transitTick ??= snapshot.tick;
    queueMissionSevenContext(commands, [jeep], missionSevenJeepRoute[state.jeep.stage]);
    return;
  }

  state.jeep.parkTick ??= snapshot.tick;
  const airstrip = hostiles.find((hostile) => (
    hostile.typeName === "AFLD" && hostile.cellX === 58 && hostile.cellY === 4
  ));
  if (state.allSamsDeadTick !== undefined && airstrip) {
    state.heldKeys.delete(state.jeep.key);
    state.jeep.releaseTick ??= snapshot.tick;
    state.jeep.attackOrderTick ??= snapshot.tick;
    queueMissionSevenContext(commands, [jeep], airstrip);
  } else if (state.jeep.releaseTick === undefined) queueMissionSevenStop(commands, [jeep]);
}

function queueMissionSevenHeldVehicles(attackers, commands) {
  const heldVehicles = attackers.filter((attacker) => (
    missionSevenState.heldKeys.has(objectKey(attacker))
  ));
  queueMissionSevenContext(commands, heldVehicles, missionSevenVehicleStaging);
}

function queueMissionSevenFootSupport(snapshot, friendly, attackers, commands) {
  const state = missionSevenState;
  const saleCrew = friendly.filter((object) => (
    object.type === 1 && state.weapSale.crewKeys.has(objectKey(object))
  ));
  if (state.weapSale.goneTick !== undefined && state.factDestroyedTick !== undefined
    && state.airstripDestroyedTick !== undefined && state.saleCrew.transitTick === undefined
    && saleCrew.length > 0) state.saleCrew.transitTick = snapshot.tick;
  if (state.saleCrew.transitTick !== undefined && state.saleCrew.releaseTick === undefined
    && saleCrew.length > 0) {
    while (state.saleCrew.routeStage < missionSevenSaleCrewRoute.length) {
      const waypoint = missionSevenSaleCrewRoute[state.saleCrew.routeStage];
      const arrived = saleCrew.filter((object) => missionSevenDistance(object, waypoint) <= 3);
      for (const object of arrived) {
        state.saleCrew.arrivalKeys.add(`${objectKey(object)}:${state.saleCrew.routeStage}`);
      }
      if (arrived.length < saleCrew.length) break;
      state.saleCrew.routeStage += 1;
    }
    if (state.saleCrew.routeStage < missionSevenSaleCrewRoute.length) {
      queueMissionSevenContext(commands, saleCrew,
        missionSevenSaleCrewRoute[state.saleCrew.routeStage]);
    } else {
      state.saleCrew.parkTick = snapshot.tick;
      state.saleCrew.releaseTick = snapshot.tick;
      for (const object of saleCrew) {
        const key = objectKey(object);
        state.homeKeys.delete(key);
        state.heldKeys.delete(key);
        state.westKeys.delete(key);
        state.strikeKeys.add(key);
      }
    }
  } else if (state.weapSale.orderTick !== undefined && state.saleCrew.transitTick === undefined
    && saleCrew.length > 0) queueMissionSevenStop(commands, saleCrew);

  const stagedGroups = new Map();
  for (const key of state.handProduction.keys) {
    const infantry = friendly.find((object) => objectKey(object) === key);
    if (!infantry) continue;
    let stage = state.handProduction.stages.get(key) ?? 0;
    while (stage < missionSevenHandProductionRoute.length
      && missionSevenDistance(infantry, missionSevenHandProductionRoute[stage]) <= 3) {
      state.handProduction.arrivals.push({
        tick: snapshot.tick,
        key,
        typeName: infantry.typeName,
        stage,
        waypoint: missionSevenHandProductionRoute[stage],
      });
      stage += 1;
    }
    state.handProduction.stages.set(key, stage);
    if (stage >= missionSevenHandProductionRoute.length) {
      state.homeKeys.delete(key);
      state.heldKeys.delete(key);
      state.westKeys.delete(key);
      state.strikeKeys.add(key);
    } else {
      const group = stagedGroups.get(stage) ?? [];
      group.push(infantry);
      stagedGroups.set(stage, group);
    }
  }
  for (const [stage, group] of stagedGroups) {
    queueMissionSevenContext(commands, group, missionSevenHandProductionRoute[stage], MODIFIER_ALT);
  }

  for (const attacker of attackers) {
    const key = objectKey(attacker);
    if (state.saleCrew.releaseTick !== undefined && state.weapSale.crewKeys.has(key)) {
      state.homeKeys.delete(key);
      state.heldKeys.delete(key);
      state.westKeys.delete(key);
      state.strikeKeys.add(key);
    }
  }
}

function queueMissionSevenPurgeAndCapture(snapshot, friendly, hostiles, attackers, commands) {
  const state = missionSevenState;
  const engineer = friendly.find((object) => objectKey(object) === state.engineer.key);
  const capturedHand = friendly.find((object) => (
    object.type === 4 && object.typeName === "HAND"
    && missionSevenDistance(object, { cellX: 44, cellY: 13 }) <= 3
  ));
  const hostileHand = hostiles.find((object) => (
    object.type === 4 && object.typeName === "HAND"
    && missionSevenDistance(object, { cellX: 44, cellY: 13 }) <= 3
  ));
  const allSamsDead = state.samDeathTicks.size === missionSevenSamSites.length
    && state.allSamsDeadTick < snapshot.tick;
  const preCapture = state.engineer.captureTick === undefined && engineer
    && state.engineer.stagedTick !== undefined && allSamsDead;
  const postCapture = state.engineer.captureTick !== undefined;
  if (!preCapture && !postCapture) return false;

  const purgeForces = attackers.filter((attacker) => (
    (!preCapture || attacker.typeName === "MTNK")
    && (state.strikeKeys.has(objectKey(attacker))
      || objectKey(attacker) === state.engineer.guardKey
      || objectKey(attacker) === state.sixthTank.key)
  ));
  const purgeTanks = purgeForces.filter((attacker) => attacker.typeName === "MTNK");
  const formationDistance = (object) => purgeForces.length === 0 ? Infinity
    : Math.min(...purgeForces.map((unit) => missionSevenDistance(unit, object)));
  const handDistance = (object) => missionSevenDistance(object, { cellX: 44, cellY: 13 });
  const engineerDistance = (object) => engineer ? missionSevenDistance(object, engineer) : Infinity;
  const capturedHandDistance = (object) => capturedHand
    ? missionSevenDistance(object, capturedHand)
    : Infinity;
  const anchorDistance = (object) => preCapture
    ? Math.min(handDistance(object), engineerDistance(object))
    : Math.min(capturedHandDistance(object), formationDistance(object));
  const inCore = (object) => object.cellX >= 40 && object.cellX <= 62
    && object.cellY >= 3 && object.cellY <= 26;
  const candidates = hostiles.filter((object) => (
    object.type !== 4
    && (object.objectFlags & (1 << 12)) !== 0
    && snapshot.shroud.isVisible(object.cellX, object.cellY)
    && (preCapture
      ? anchorDistance(object) <= 12
      : inCore(object)
        && (formationDistance(object) <= 8 || capturedHandDistance(object) <= 10))
  ));
  let target = candidates.find((object) => objectKey(object) === state.purge.targetKey);
  if (!target) {
    const priority = (object) => object.typeName === "LTNK" ? 0
      : object.typeName === "BGGY" ? 1
        : ["E3", "E4", "E1"].includes(object.typeName) ? 2 : 3;
    target = candidates.toSorted((left, right) => (
      priority(left) - priority(right)
      || anchorDistance(left) - anchorDistance(right)
      || left.strength - right.strength
      || left.id - right.id
    ))[0];
    state.purge.targetKey = target && objectKey(target);
    state.purge.orderTick = -Infinity;
    if (target) state.purge.targets.push({
      tick: snapshot.tick,
      phase: preCapture ? "pre-capture" : "post-capture",
      key: objectKey(target),
      typeName: target.typeName,
      cellX: target.cellX,
      cellY: target.cellY,
    });
  }

  if (preCapture) {
    if (target) {
      state.purge.quietStartTick = undefined;
      state.purge.quietSatisfiedTick = undefined;
      state.purge.quietStopIssued = false;
      if (state.engineer.guardKey !== undefined && !state.engineer.transitGuardActive) {
        state.strikeKeys.add(state.engineer.guardKey);
        state.engineer.guardKey = undefined;
        state.engineer.guardAssignedTick = undefined;
        state.engineer.guardOrderTick = -Infinity;
      }
    } else {
      state.purge.quietStartTick ??= snapshot.tick;
      if (!state.purge.quietStopIssued) {
        const movingTanks = purgeTanks.filter((tank) => objectKey(tank) !== state.engineer.guardKey);
        queueMissionSevenStop(commands, movingTanks);
        state.purge.quietStopIssued = true;
      }
      if (state.purge.quietSatisfiedTick === undefined
        && snapshot.tick - state.purge.quietStartTick >= 180) {
        state.purge.quietSatisfiedTick = snapshot.tick;
      }
      if (state.purge.quietSatisfiedTick !== undefined && state.engineer.guardKey === undefined) {
        const guard = purgeTanks.toSorted((left, right) => (
          right.strength - left.strength || right.maxStrength - left.maxStrength || left.id - right.id
        ))[0];
        if (guard) {
          state.engineer.guardKey = objectKey(guard);
          state.engineer.guardAssignedTick = snapshot.tick;
          state.engineer.guardOrderTick = -Infinity;
          state.engineer.guardMinimumStrength = guard.strength;
          state.strikeKeys.delete(state.engineer.guardKey);
        }
      }
    }
  }

  const guard = friendly.find((object) => objectKey(object) === state.engineer.guardKey);
  if (preCapture && engineer && guard
    && snapshot.tick - state.engineer.guardOrderTick >= 60) {
    queueMissionSevenContext(commands, [guard], engineer, MODIFIER_CTRL | MODIFIER_ALT);
    state.engineer.guardOrderTick = snapshot.tick;
    state.engineer.guardOrderCount += 1;
    state.engineer.guardMinimumStrength = Math.min(
      state.engineer.guardMinimumStrength ?? guard.strength,
      guard.strength,
    );
  }
  if (preCapture && !target && engineer && guard && hostileHand
    && state.purge.quietSatisfiedTick !== undefined
    && snapshot.tick - state.engineer.guardAssignedTick >= 60
    && snapshot.tick - state.engineer.orderTick >= 60) {
    state.engineer.stage = "capturing";
    queueMissionSevenContext(commands, [engineer], hostileHand);
    state.engineer.orderTick = snapshot.tick;
    state.engineer.captureOrderTick ??= snapshot.tick;
    state.engineer.captureOrders.push({
      tick: snapshot.tick,
      strength: engineer.strength,
      cellX: engineer.cellX,
      cellY: engineer.cellY,
    });
  }

  if (target && purgeForces.length > 0
    && snapshot.tick - state.purge.orderTick >= 90) {
    for (let index = 0; index < purgeForces.length; index += 6) {
      queueMissionSevenContext(commands, purgeForces.slice(index, index + 6), target);
    }
    state.purge.orderTick = snapshot.tick;
  }
  return (target !== undefined && purgeForces.length > 0) || preCapture;
}

function queueMissionSevenCoreAssault(snapshot, hostiles, attackers, commands, purgeActive) {
  const state = missionSevenState;
  if (state.assaultTick === undefined || purgeActive) return;
  const strike = attackers.filter((attacker) => state.strikeKeys.has(objectKey(attacker)));
  if (strike.length === 0) return;
  const visibleHostiles = hostiles.filter((hostile) => (
    snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
  ));

  while (state.routeStage < missionSevenCoreRoute.length) {
    const site = missionSevenCoreRoute[state.routeStage];
    if (site.kind === "waypoint") {
      const tanks = strike.filter((attacker) => attacker.typeName === "MTNK");
      const required = Math.min(2, tanks.length);
      const arrivals = tanks.filter((tank) => missionSevenDistance(tank, site) <= 3).length;
      if (required > 0 && arrivals < required) break;
      state.routeProgress.push({ ...site, tick: snapshot.tick, arrivals });
      state.routeStage += 1;
      continue;
    }
    if (hostiles.some((hostile) => missionSevenMatchesSite(hostile, site))) break;
    state.routeProgress.push({ ...site, tick: snapshot.tick });
    state.routeStage += 1;
  }

  const site = missionSevenCoreRoute[state.routeStage];
  const routeStructure = site && visibleHostiles.find((hostile) => (
    missionSevenMatchesSite(hostile, site)
  ));
  const hiddenTarget = chooseTarget(hostiles);
  const target = routeStructure ?? site ?? chooseTarget(visibleHostiles) ?? (hiddenTarget && {
      cellX: hiddenTarget.cellX,
      cellY: hiddenTarget.cellY,
    });
  if (!target) return;
  const orderedStrike = strike.toSorted((left, right) => (
    right.maxStrength - left.maxStrength
    || right.strength - left.strength
    || left.id - right.id
  ));
  const strikeTanks = orderedStrike.filter((unit) => unit.typeName === "MTNK");
  const strikeSupport = orderedStrike.filter((unit) => unit.typeName !== "MTNK");
  const nearbyMobile = state.routeStage > 0
    && state.routeStage < missionSevenCoreRoute.length
    && strikeTanks.length > 0
    ? visibleHostiles.filter((hostile) => hostile.type !== 4)
      .map((hostile) => ({
        hostile,
        distance: Math.min(...strikeTanks.map((tank) => missionSevenDistance(tank, hostile))),
      }))
      .filter(({ distance }) => distance <= 8)
      .toSorted((left, right) => (
        left.distance - right.distance
        || left.hostile.strength - right.hostile.strength
        || left.hostile.id - right.hostile.id
      ))[0]?.hostile
    : undefined;
  const coreLocked = state.samDeathTicks.size === missionSevenSamSites.length
    && hostiles.some((hostile) => (
      hostile.type === 4 && ["FACT", "AFLD", "HAND"].includes(hostile.typeName)
    ));
  const supportTarget = coreLocked ? target : nearbyMobile ?? target;
  const groups = [
    ...Array.from({ length: Math.ceil(strikeTanks.length / 6) },
      (_, index) => strikeTanks.slice(index * 6, index * 6 + 6)),
    ...Array.from({ length: Math.ceil(strikeSupport.length / 6) },
      (_, index) => strikeSupport.slice(index * 6, index * 6 + 6)),
  ].filter((group) => group.length > 0);
  for (const group of groups) {
    const groupTarget = group.every((unit) => unit.typeName === "MTNK")
      ? target
      : supportTarget;
    const flags = groupTarget.type === undefined && groupTarget.kind !== "waypoint"
      ? MODIFIER_CTRL
      : 0;
    queueMissionSevenContext(commands, group, groupTarget, flags);
  }
}

function queueMissionSevenTurn(snapshot, friendly, hostiles, attackers, commands) {
  observeMissionSevenTurn(snapshot, friendly, hostiles);
  classifyMissionSevenForces(snapshot, friendly, hostiles, attackers);
  queueMissionSevenBase(snapshot, friendly, hostiles, commands);
  queueMissionSevenWestAndHome(snapshot, friendly, hostiles, attackers, commands, "west");
  const purgeActive = queueMissionSevenPurgeAndCapture(
    snapshot,
    friendly,
    hostiles,
    attackers,
    commands,
  );
  queueMissionSevenCoreAssault(snapshot, hostiles, attackers, commands, purgeActive);
  queueMissionSevenWestAndHome(snapshot, friendly, hostiles, attackers, commands, "home");
  queueMissionSevenJeep(snapshot, friendly, hostiles, attackers, commands);
  queueMissionSevenHeldVehicles(attackers, commands);
  queueMissionSevenFootSupport(snapshot, friendly, attackers, commands);
  queueMissionSevenEngineerTransit(snapshot, friendly, commands);
}

const missionEightSamSites = {
  "east-a": [
    { cellX: 16, cellY: 7 },
    { cellX: 33, cellY: 18 },
    { cellX: 11, cellY: 20 },
  ],
  "east-b": [
    { cellX: 12, cellY: 5 },
    { cellX: 54, cellY: 5 },
    { cellX: 43, cellY: 14 },
    { cellX: 52, cellY: 14 },
    { cellX: 13, cellY: 16 },
  ],
};
const missionEightRoutes = {
  "east-a": [
    { cellX: 42, cellY: 42, label: "base perimeter" },
    { cellX: 40, cellY: 36, label: "southern patrol" },
    { cellX: 45, cellY: 35, label: "eastern patrol" },
    { cellX: 42, cellY: 25, label: "eastern flank" },
    { cellX: 48, cellY: 18, label: "northeast bypass" },
    { cellX: 45, cellY: 10, label: "northern bypass" },
    { cellX: 33, cellY: 10, label: "northern crossing" },
    {
      cellX: 33,
      cellY: 14,
      label: "eastern SAM firing line",
      typeName: "SAM",
      targetCellX: 33,
      targetCellY: 18,
    },
    { cellX: 33, cellY: 10, label: "northern assault assembly" },
    { cellX: 16, cellY: 7, label: "northern SAM", typeName: "SAM" },
    { cellX: 12, cellY: 12, label: "western ridge crossing" },
    {
      cellX: 9,
      cellY: 9,
      label: "western base",
      typeName: "FACT",
      targetCellX: 8,
      targetCellY: 11,
    },
    { cellX: 10, cellY: 10, label: "southern ridge exit" },
    { cellX: 15, cellY: 10, label: "southern ridge crossing" },
    { cellX: 18, cellY: 13, label: "southern assembly" },
    { cellX: 18, cellY: 14, label: "southern artillery approach" },
    { cellX: 19, cellY: 15, label: "southern artillery staging" },
    {
      cellX: 19,
      cellY: 16,
      label: "southern artillery gate",
      typeName: "ARTY",
      targetCellX: 19,
      targetCellY: 17,
    },
    {
      cellX: 23,
      cellY: 20,
      label: "southern tank gate",
      typeName: "LTNK",
      targetCellX: 19,
      targetCellY: 18,
    },
    {
      cellX: 23,
      cellY: 22,
      label: "southern buggy gate",
      typeName: "BGGY",
      targetCellX: 20,
      targetCellY: 18,
    },
    {
      cellX: 23,
      cellY: 22,
      label: "southern turret gate",
      typeName: "GUN",
      targetCellX: 21,
      targetCellY: 19,
    },
    { cellX: 18, cellY: 22, label: "southern corridor west" },
    { cellX: 16, cellY: 23, label: "southern corridor southwest" },
    { cellX: 15, cellY: 26, label: "southern corridor descent" },
    { cellX: 14, cellY: 27, label: "southern corridor floor" },
    {
      cellX: 9,
      cellY: 22,
      label: "southwest buggy screen",
      typeName: "BGGY",
      targetCellX: 10,
      targetCellY: 21,
    },
    {
      cellX: 9,
      cellY: 22,
      label: "southern SAM firing line",
      typeName: "SAM",
      targetCellX: 11,
      targetCellY: 20,
    },
    { cellX: 14, cellY: 27, label: "post-strike southern return" },
    { cellX: 19, cellY: 22, label: "post-strike western turn" },
    { cellX: 21, cellY: 23, label: "post-strike central turn" },
    { cellX: 23, cellY: 20, label: "post-strike northern turn" },
    { cellX: 23, cellY: 18, label: "production approach" },
    {
      cellX: 29,
      cellY: 14,
      label: "production base",
      typeName: "AFLD",
      targetCellX: 27,
      targetCellY: 14,
    },
  ],
  "east-b": [
    { cellX: 25, cellY: 48, label: "southern artillery lane", forceMove: true },
    { cellX: 13, cellY: 32, label: "western support hold", forceMove: true },
    { cellX: 13, cellY: 29, label: "western gate approach", forceMove: true },
    { cellX: 13, cellY: 27, label: "western gate descent", forceMove: true },
    { cellX: 13, cellY: 25, label: "western gate staging", forceMove: true },
    { cellX: 13, cellY: 23, label: "western gate firing line", forceMove: true },
    { cellX: 11, cellY: 18, label: "western turret", typeName: "GUN" },
    { cellX: 13, cellY: 16, label: "western SAM", typeName: "SAM" },
    { cellX: 12, cellY: 10, label: "northwest SAM approach", forceMove: true },
    { cellX: 12, cellY: 5, label: "northwest SAM", typeName: "SAM" },
    { cellX: 33, cellY: 12, label: "northern crossing" },
    { cellX: 43, cellY: 14, label: "southeast SAM" },
    { cellX: 50, cellY: 16, label: "eastern perimeter" },
    { cellX: 52, cellY: 14, label: "southwest SAM" },
    { cellX: 54, cellY: 5, label: "northeast SAM" },
    { cellX: 48, cellY: 8, label: "eastern base" },
  ],
};
const missionEightEastASouthTransitRoute = [
  { cellX: 42, cellY: 45, label: "southern force assembly" },
  { cellX: 42, cellY: 37, label: "southern deployment exit" },
  { cellX: 37, cellY: 38, label: "southern western turn" },
  { cellX: 32, cellY: 39, label: "southern lower crossing" },
  { cellX: 29, cellY: 38, label: "southern lower approach" },
  { cellX: 21, cellY: 30, label: "southern basin approach" },
  { cellX: 21, cellY: 28, label: "southern basin entry" },
  { cellX: 15, cellY: 26, label: "southwest corridor descent" },
  { cellX: 14, cellY: 27, label: "southwest corridor floor" },
  {
    cellX: 9,
    cellY: 22,
    label: "southwest buggy screen",
    typeName: "BGGY",
    targetCellX: 10,
    targetCellY: 21,
  },
  {
    cellX: 9,
    cellY: 22,
    label: "southern SAM firing line",
    typeName: "SAM",
    targetCellX: 11,
    targetCellY: 20,
  },
  { cellX: 9, cellY: 18, label: "southwest ridge return" },
  { cellX: 9, cellY: 13, label: "western base approach" },
  { cellX: 12, cellY: 12, label: "southern strike assembly" },
];
const missionEightEastAWestCleanupTargets = [
  { typeName: "GUN", cellX: 21, cellY: 19, label: "western turret" },
  { typeName: "NUKE", cellX: 10, cellY: 9, label: "western power center" },
  { typeName: "NUKE", cellX: 8, cellY: 8, label: "western power flank" },
  { typeName: "NUKE", cellX: 6, cellY: 8, label: "western power reserve" },
  { typeName: "SILO", cellX: 12, cellY: 9, label: "western storage south" },
  { typeName: "SILO", cellX: 11, cellY: 7, label: "western storage east" },
  { typeName: "SILO", cellX: 9, cellY: 7, label: "western storage west" },
  { typeName: "GUN", cellX: 26, cellY: 21, label: "production turret" },
  { typeName: "HAND", cellX: 27, cellY: 17, label: "hand of Nod" },
  { typeName: "AFLD", cellX: 29, cellY: 14, label: "airstrip" },
  { typeName: "PROC", cellX: 25, cellY: 17, label: "refinery" },
  { typeName: "NUKE", cellX: 23, cellY: 14, label: "production power" },
];
const missionEightEastAPostSamCounterattackRoute = [
  { cellX: 42, cellY: 45, label: "base departure" },
  { cellX: 37, cellY: 38, label: "southern crossing" },
  { cellX: 29, cellY: 38, label: "western approach" },
  { cellX: 21, cellY: 30, label: "basin approach" },
  { typeName: "GUN", cellX: 21, cellY: 19, label: "western turret" },
];
const missionEightEastAPostSamFirstTargetStage =
  missionEightEastAPostSamCounterattackRoute.findIndex((site) => site.typeName);
const missionEightEastAPostSamNorthFlankRoute = [
  { cellX: 22, cellY: 7, label: "northern screen" },
];
const missionEightEastAWestScreenPriorities = new Map([
  ["BGGY", 0], ["LTNK", 1], ["ARTY", 2], ["E4", 3], ["E3", 4], ["E1", 5],
]);
// All rifles: 26×E1 fits the captured-FACT refund. Mixing late E3s exhausted
// cash before launchCompletionCount and the wave never left home.
const missionEightEastAPostFactRifleCount = 26;
const missionEightEastAPostFactProductionCount = 26;
// Two home guards; the rest of the post-FACT wave joins the production cleanup.
const missionEightEastAPostFactHomeDefenseCount = 2;
const missionEightEastAPostFactLaunchCompletionCount =
  missionEightEastAPostFactProductionCount;
// Launch once the production turret has been airstrike-softened (~tick 51k)
// rather than waiting until 54.5k while it repairs back to full.
const missionEightEastAPostFactLaunchMinTick = 52_000;
// Charge only when the turret is badly softened. ~217 still wiped a 15-rifle
// wave in ~600 ticks; wait for deeper damage or a post-hold airstrike pass.
const missionEightEastAProductionGunSoftStrength = 150;
const missionEightEastAProductionGunSite = { cellX: 26, cellY: 21, typeName: "GUN" };
const missionEightEastAProductionStaging = { cellX: 14, cellY: 12 };
const missionEightEastAScoutRoute = [
  { cellX: 30, cellY: 40 },
  { cellX: 24, cellY: 38 },
  { cellX: 23, cellY: 27 },
  { cellX: 23, cellY: 24 },
];
const missionEightEastADecoyRoute = missionEightEastASouthTransitRoute.slice(0, 13)
  .map(({ cellX, cellY, label }) => ({ cellX, cellY, label }));
const missionEightEastAEngineerUnloadApproach = {
  cellX: 8,
  cellY: 13,
  label: "construction yard perimeter",
};
const missionEightEastAEngineerTransportReserve = {
  cellX: 23,
  cellY: 30,
  label: "western turret reserve",
};
const missionEightEastAEmergencyEngineerRoute = [
  { cellX: 12, cellY: 12, label: "western ridge crossing" },
  { cellX: 8, cellY: 12, label: "construction yard approach" },
];
const missionEightEastAEngineerTransportRoute = [
  { cellX: 42, cellY: 25, label: "eastern escort lane" },
  { cellX: 45, cellY: 10, label: "northern bypass" },
  { cellX: 33, cellY: 10, label: "northern assault assembly" },
  { cellX: 18, cellY: 7, label: "northern capture screen" },
  { cellX: 44, cellY: 50, label: "counterattack reserve" },
];
const missionEightEastAReplacementDecoyRoute = [
  ...missionEightEastASouthTransitRoute.slice(0, 10),
  missionEightEastAEngineerUnloadApproach,
  ...missionEightEastAEmergencyEngineerRoute,
].map(({ cellX, cellY, label }) => ({ cellX, cellY, label }));
const missionEightEastAEngineerRoute = missionEightEastASouthTransitRoute.slice(0, 14)
  .map(({ cellX, cellY, label }) => ({ cellX, cellY, label }));
const missionEightStructurePreferences = new Map([
  ["NUKE", { cellX: 36, cellY: 50 }],
  ["PYLE", { cellX: 31, cellY: 52 }],
  ["PROC", { cellX: 38, cellY: 52 }],
  ["WEAP", { cellX: 35, cellY: 54 }],
]);
const missionEightEastBSecondNukeCell = { cellX: 33, cellY: 50 };
const missionEightEastBTankAssembly = { cellX: 39, cellY: 57 };
const missionEightEastBTankReserve = { cellX: 27, cellY: 57 };
// Village platoon: produced tanks diverted here until this many live MTNKs
// guard the hospital/civilians (never join the strike force). Keep 2 through
// the whole mission — dropping to 1 after 20k let mid-game airlifts farm civs
// once the base vehicles left with the strike (TRACE v10: civ-nine ~40k).
const missionEightEastBVillageTankCount = 2;
const missionEightEastBVillageTankCountLate = 2;
// Free staged tanks at launch. Prefer 3 free so GUN/SAM has durable DPS after
// the corridor (TRACE: 2 free often arrive as 1 half-dead tank). Staging stays
// on assembly and free tanks are protected from village re-absorb once staged.
const missionEightEastBAssaultTankCount = 3;
const missionEightEastBAssaultMinTick = 22_000;
// Prefer not to launch the western strike after this many civilian deaths
// (SCG08EB fails on the 9th). Still allow a late push with thin margin.
const missionEightEastBMaxCivilianDeathsBeforeAssault = 7;
const missionEightEastBVillagePoint = { cellX: 6, cellY: 58 };
const missionEightEastBHospitalPoint = { cellX: 3, cellY: 60 };
// SCG08EB: starting ARTY ~12,45; tank1 Move:3 @12,50 then Attack Civil.
const missionEightEastBCivilIntercept = { cellX: 12, cellY: 50 };
const missionEightEastBArtyScreen = { cellX: 12, cellY: 46 };
const missionEightState = {
  initialized: false,
  baselineFriendlyKeys: new Set(),
  initialNeutralUnitKeys: new Set(),
  initialNeutralStructureKeys: new Set(),
  minimumNeutralUnits: Infinity,
  soldStructureIds: new Set(),
  saleOrders: [],
  retainedPowerId: undefined,
  cashConversion: undefined,
  pyleConversion: undefined,
  repairedIds: new Set(),
  repairTicks: new Map(),
  postSamRepairStopTicks: new Map(),
  vehicleRepairKeys: new Set(),
  vehicleRepairInitialStrengths: new Map(),
  vehicleRepairCompletedKeys: new Set(),
  vehicleRepairActiveKey: undefined,
  vehicleRepairClearKey: undefined,
  vehicleRepairOrders: [],
  vehicleRepairClearOrders: [],
  vehicleRepairProgress: [],
  vehicleRepairLastStrengths: new Map(),
  vehicleRepairLastProgressTicks: new Map(),
  vehicleRepairLastOrderTick: -Infinity,
  vehicleRepairLastClearOrderTick: -Infinity,
  vehicleRepairCompleteTick: undefined,
  deployOrderTick: undefined,
  deploySite: undefined,
  structureStarts: [],
  placedSites: [],
  productionOrders: [],
  productionCompletions: [],
  productionKeys: new Set(),
  eastBProducedTankKeys: new Set(),
  eastBPreviousTanks: new Map(),
  eastBTankCohortReadyTick: undefined,
  // Free/base MTNKs pre-positioned at western support hold; released at GUN stage.
  eastBWaveTwoKeys: new Set(),
  eastBSamFinishSellTick: undefined,
  eastBSamDeepChip: false,
  eastBSecondNukeOrderTick: undefined,
  villageGuardKeys: new Set(),
  baseGuardKeys: new Set(),
  scoutKeys: new Set(),
  scoutStage: 0,
  scoutArrivalTicks: [],
  delxEnteredTick: undefined,
  delyEnteredTick: undefined,
  assaultTick: undefined,
  assaultWave: 0,
  strikeKeys: new Set(),
  northHoldKeys: new Set(),
  northHoldTick: undefined,
  postSamNorthFlankKeys: new Set(),
  postSamNorthFlankStage: 0,
  postSamNorthFlankProgress: [],
  southReadyKeys: new Set(),
  southAssaultTick: undefined,
  secondWaveKeys: new Set(),
  secondWaveCohortKeys: new Set(),
  secondWaveLaunchTick: undefined,
  secondWaveJoinTick: undefined,
  secondWaveTransitStage: 0,
  secondWaveTransitProgress: [],
  northReinforcementTick: undefined,
  northReinforcementKeys: new Set(),
  northReinforcementStage: 0,
  northReinforcementProgress: [],
  northReinforcementJoinTick: undefined,
  thirdWaveKeys: new Set(),
  thirdWaveCohortKeys: new Set(),
  thirdWaveLaunchTick: undefined,
  thirdWaveJoinTick: undefined,
  thirdWaveTransitStage: 0,
  thirdWaveTransitProgress: [],
  northernHoldStartedTick: undefined,
  southHoldStartedTick: undefined,
  routeStage: 0,
  routeStageStartedTick: 0,
  routeProgress: [],
  routeTargetEngagedStages: new Set(),
  corridorScreenKeys: new Set(),
  southTransitFocus: undefined,
  southTransitInfantryScreenKeys: new Set(),
  southSamDemolitionKeys: new Set(),
  southSamDemolitionInitialized: false,
  southRearGuardKeys: new Set(),
  southRearGuardStartedTick: undefined,
  southFinalGateInitialized: false,
  southFinalGateEnteredTick: undefined,
  southFinalGateBlockerKeys: new Set(),
  southFinalGateBlockers: new Map(),
  southFinalGateBlockerDrops: [],
  northReleaseKeys: new Set(),
  northReleaseTick: undefined,
  baseGuardReleaseKeys: new Set(),
  baseGuardReleaseTick: undefined,
  westCleanupStage: 0,
  westCleanupStartedTick: undefined,
  westCleanupCompletedTick: undefined,
  westCleanupTarget: undefined,
  westCleanupProgress: [],
  productionGunMinimumStrength: undefined,
  productionGunHoldStartedTick: undefined,
  productionGunHoldLastStrength: undefined,
  productionGunChargeTick: undefined,
  productionGunChargeStrength: undefined,
  productionHandAssaultTick: undefined,
  westCleanupDeferredFromStage: undefined,
  productionGunPeelKeys: new Set(),
  engineer: {
    orderTick: undefined,
    observedTick: undefined,
    key: undefined,
    initialKey: undefined,
    initialDeathTick: undefined,
    replacementOrderTick: undefined,
    replacementObservedTick: undefined,
    replacementKey: undefined,
    secondReplacementOrderTick: undefined,
    secondReplacementObservedTick: undefined,
    secondReplacementKey: undefined,
    secondReplacementDeathTick: undefined,
    replacementDecoyKey: undefined,
    replacementDecoyStage: 0,
    replacementDecoyProgress: [],
    replacementDecoyLastOrderTick: -Infinity,
    replacementDecoyEscortInitializedTick: undefined,
    replacementDecoyEscortKeys: new Set(),
    replacementDecoyScreenTankKey: undefined,
    replacementDecoyScreenTankClearedTick: undefined,
    replacementDecoyScreenReadyTick: undefined,
    fallbackToDecoyTick: undefined,
    deathTick: undefined,
    missingSinceTick: undefined,
    transportKey: undefined,
    transportDeathTick: undefined,
    transportRouteStage: 0,
    transportRouteProgress: [],
    transportCounterattackTick: undefined,
    loadIssuedTick: undefined,
    sealedTick: undefined,
    transportRetreatTick: undefined,
    unloadApproachTick: undefined,
    unloadStagedTick: undefined,
    unloadIssuedTick: undefined,
    unloadedTick: undefined,
    emergencyIngressStage: 0,
    emergencyIngressProgress: [],
    transitStage: 0,
    transitProgress: [],
    decoyStage: 0,
    decoyProgress: [],
    decoyLastOrderTick: -Infinity,
    footEscortInitializedTick: undefined,
    footEscortKeys: new Set(),
    footDecoyKeys: new Set(),
    footDecoyStage: 0,
    footDecoyProgress: [],
    lastOrderTick: -Infinity,
    captureOrderTick: undefined,
    captureOrders: [],
    captureTick: undefined,
    capturedFactId: undefined,
    factSale: {
      orderTick: undefined,
      structure: undefined,
      fundsBefore: undefined,
      preexistingFriendlyKeys: undefined,
      goneTick: undefined,
      fundsAfter: undefined,
      refund: undefined,
      crew: [],
    },
  },
  postFactSales: {
    PROC: undefined,
    NUKE: undefined,
    PYLE: undefined,
    GTWR: undefined,
  },
  postFactHomeDefenseKeys: new Set(),
  postFactHomeDefenseCohortKeys: new Set(),
  postFactCleanupCohortKeys: new Set(),
  postSamCounterattackKeys: new Set(),
  postSamNorthSupportKeys: new Set(),
  postSamCounterattackLaunchTick: undefined,
  postSamCounterattackStage: 0,
  postSamCounterattackProgress: [],
  postSamCounterattackCompletedTick: undefined,
  postFactLiveMobileKeys: undefined,
  postFactProductionOrders: [],
  postFactProductionCompletions: [],
  postFactCleanupLaunchTick: undefined,
  postFactCleanupTransitStage: 0,
  postFactCleanupTransitProgress: [],
  southWithdrawalTargets: new Map(),
  southWithdrawalTargetDeaths: new Map(),
  southTransitStage: 0,
  southTransitProgress: [],
  southTransitTargetKeys: new Map(),
  roleOrderTicks: new Map(),
  samDeathTicks: new Map(),
  allSamsDeadTick: undefined,
  factInitialStrength: undefined,
  factMinimumStrength: Infinity,
  factDeathTick: undefined,
  airstrike: {
    readyLatched: false,
    readyTicks: [],
    orders: [],
    discharges: [],
    pending: undefined,
  },
  transportSightings: new Map(),
  hospitalMinimumStrength: Infinity,
  moebiusMinimumStrength: Infinity,
  // East-b lose diagnosis (SCG08EB: los3 on Moebius/HOSP, civ #9 Neutral).
  eastBNeutralUnitKeys: new Set(),
  eastBNeutralDeaths: [],
  eastBHospitalMissingTick: undefined,
  eastBMoebiusMissingTick: undefined,
  eastBLoseHint: undefined,
};

function clearMissionEightUnitRoleKey(key) {
  const state = missionEightState;
  for (const keys of [
    state.villageGuardKeys,
    state.baseGuardKeys,
    state.scoutKeys,
    state.strikeKeys,
    state.northHoldKeys,
    state.postSamNorthFlankKeys,
    state.southReadyKeys,
    state.southRearGuardKeys,
    state.secondWaveKeys,
    state.thirdWaveKeys,
    state.northReinforcementKeys,
    state.engineer.footEscortKeys,
    state.engineer.footDecoyKeys,
    state.engineer.replacementDecoyEscortKeys,
    state.corridorScreenKeys,
    state.southTransitInfantryScreenKeys,
    state.southSamDemolitionKeys,
    state.northReleaseKeys,
    state.baseGuardReleaseKeys,
    state.secondWaveCohortKeys,
    state.thirdWaveCohortKeys,
    state.postFactHomeDefenseKeys,
    state.postFactCleanupCohortKeys,
    state.postSamCounterattackKeys,
    state.postSamNorthSupportKeys,
  ]) keys.delete(key);
}

function missionEightDistance(object, destination) {
  return Math.max(
    Math.abs(object.cellX - destination.cellX),
    Math.abs(object.cellY - destination.cellY),
  );
}

function queueMissionEightContext(commands, group, destination, flags = 0) {
  return queueMissionSevenContext(commands, group, destination, flags);
}

function startMissionEightProduction(commands, entry) {
  startMissionSevenProduction(commands, entry);
  missionEightState.productionOrders.push({
    tick: currentTick,
    assetName: entry.assetName,
    objectType: entry.objectType,
    cost: entry.cost,
  });
}

function missionEightLegalPlacement(snapshot, entry, preferredOverride) {
  const grid = snapshot.placement;
  if (!grid || entry.placementOffsets.length === 0) return undefined;
  const gridIndex = (cellX, cellY) => {
    if (cellX < grid.cellX || cellY < grid.cellY
      || cellX >= grid.cellX + grid.width || cellY >= grid.cellY + grid.height) return undefined;
    return (cellY - grid.cellY) * grid.width + cellX - grid.cellX;
  };
  const candidates = [];
  for (let cellY = grid.cellY; cellY < grid.cellY + grid.height; cellY += 1) {
    for (let cellX = grid.cellX; cellX < grid.cellX + grid.width; cellX += 1) {
      const anchorIndex = gridIndex(cellX, cellY);
      if (anchorIndex === undefined || !(grid.flags[anchorIndex] & 1)) continue;
      const legal = entry.placementOffsets.every((rawOffset) => {
        const offset = decodePlacementOffset(rawOffset);
        const footprintIndex = gridIndex(cellX + offset.x, cellY + offset.y);
        return footprintIndex !== undefined && Boolean(grid.flags[footprintIndex] & 2);
      });
      if (legal) candidates.push({
        x: cellX - grid.cellX,
        y: cellY - grid.cellY,
        cellX,
        cellY,
      });
    }
  }
  const preferred = preferredOverride
    ?? missionEightStructurePreferences.get(entry.assetName)
    ?? missionEightState.deploySite
    ?? { cellX: grid.cellX + Math.floor(grid.width / 2), cellY: grid.cellY + Math.floor(grid.height / 2) };
  return candidates.toSorted((left, right) => (
    Math.max(Math.abs(left.cellX - preferred.cellX), Math.abs(left.cellY - preferred.cellY))
      - Math.max(Math.abs(right.cellX - preferred.cellX), Math.abs(right.cellY - preferred.cellY))
    || left.cellY - right.cellY
    || left.cellX - right.cellX
  ))[0];
}

function initializeMissionEight(snapshot) {
  const state = missionEightState;
  if (state.initialized) return;
  state.initialized = true;
  state.routeStageStartedTick = snapshot.tick;
  const friendly = rootCombatants(snapshot, HOUSE_GDI);
  const attackers = availableAttackers(snapshot);
  for (const object of friendly) state.baselineFriendlyKeys.add(objectKey(object));
  for (const object of snapshot.objects.filter((candidate) => (
    candidate.owner === HOUSE_NEUTRAL && candidate.subObject === 0 && candidate.strength > 0
  ))) {
    if (object.type === 1) state.initialNeutralUnitKeys.add(objectKey(object));
    if (object.type === 4) state.initialNeutralStructureKeys.add(objectKey(object));
  }
  state.minimumNeutralUnits = state.initialNeutralUnitKeys.size;

  if (mission.variant === "east-a") {
    for (const [index, waypoint] of missionEightEastASouthTransitRoute.entries()) {
      if (!waypoint.typeName) continue;
      const target = snapshot.objects.find((candidate) => (
        candidate.owner === HOUSE_NOD && candidate.subObject === 0
        && candidate.typeName === waypoint.typeName
        && candidate.cellX === (waypoint.targetCellX ?? waypoint.cellX)
        && candidate.cellY === (waypoint.targetCellY ?? waypoint.cellY)
      ));
      if (target) state.southTransitTargetKeys.set(index, objectKey(target));
    }
    for (const vehicle of attackers.filter((candidate) => candidate.type === 2)) {
      const key = objectKey(vehicle);
      state.vehicleRepairKeys.add(key);
      state.vehicleRepairInitialStrengths.set(key, {
        typeName: vehicle.typeName,
        strength: vehicle.strength,
        maxStrength: vehicle.maxStrength,
      });
      state.vehicleRepairLastStrengths.set(key, vehicle.strength);
    }
    const scoutPriority = new Map([["APC", 0], ["JEEP", 1], ["MSAM", 2], ["MTNK", 3]]);
    const scouts = attackers.toSorted((left, right) => (
      (scoutPriority.get(left.typeName) ?? 20) - (scoutPriority.get(right.typeName) ?? 20)
      || right.strength - left.strength
      || left.id - right.id
    )).slice(0, 1);
    for (const scout of scouts) state.scoutKeys.add(objectKey(scout));
    const guardPriority = new Map([["E2", 0], ["E1", 1], ["E3", 2], ["MSAM", 3], ["JEEP", 4], ["APC", 5], ["MTNK", 6]]);
    for (const guard of attackers.filter((candidate) => !state.scoutKeys.has(objectKey(candidate)))
      .toSorted((left, right) => (
        (guardPriority.get(left.typeName) ?? 20) - (guardPriority.get(right.typeName) ?? 20)
        || right.strength - left.strength
        || left.id - right.id
      )).slice(0, 8)) state.baseGuardKeys.add(objectKey(guard));
  } else {
    const remaining = new Map(attackers.map((attacker) => [objectKey(attacker), attacker]));
    const take = (typeName, count) => {
      const selected = [...remaining.values()].filter((attacker) => (
        attacker.typeName === typeName
      )).toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || right.strength - left.strength
        || left.id - right.id
      )).slice(0, count);
      for (const attacker of selected) remaining.delete(objectKey(attacker));
      return selected;
    };
    const planned = (entries) => entries.flatMap(([typeName, count]) => take(typeName, count));
    const base = planned([
      ["MTNK", 1], ["JEEP", 1], ["MSAM", 2], ["E3", 1], ["E2", 2], ["E1", 1],
    ]);
    const village = planned([
      ["MTNK", 2], ["E3", 2], ["E2", 2], ["E1", 2],
    ]);
    for (const guard of base) state.baseGuardKeys.add(objectKey(guard));
    for (const guard of village) state.villageGuardKeys.add(objectKey(guard));
    for (const guard of remaining.values()) {
      if (guard.typeName === "MCV" || guard.typeName === "HARV") continue;
      const target = state.villageGuardKeys.size < 10
        ? state.villageGuardKeys : state.baseGuardKeys;
      target.add(objectKey(guard));
    }
  }
}

function observeMissionEightTurn(snapshot, friendly, hostiles) {
  const state = missionEightState;
  initializeMissionEight(snapshot);
  if (mission.variant === "east-b") {
    const liveTanks = friendly.filter((object) => object.typeName === "MTNK");
    const weaponFactory = friendly.find((object) => (
      object.type === 4 && object.typeName === "WEAP"
    ));
    const factoryExit = weaponFactory
      ? { cellX: weaponFactory.cellX + 3, cellY: weaponFactory.cellY + 2 }
      : missionEightEastBTankAssembly;
    for (const tank of liveTanks) {
      const key = objectKey(tank);
      const previous = state.eastBPreviousTanks.get(key);
      const emergedAtFactory = missionEightDistance(tank, factoryExit) <= 3
        && (!previous || missionEightDistance(tank, previous) > 6);
      if (vehicleProductionStarts === 0 || !emergedAtFactory) continue;
      if (state.villageGuardKeys.has(key)) continue;
      clearMissionEightUnitRoleKey(key);
      state.baselineFriendlyKeys.delete(key);
      state.productionKeys.delete(key);
      state.eastBProducedTankKeys.add(key);
      const westernSamEmergence = hostiles.find((hostile) => (
        hostile.typeName === "SAM" && hostile.cellX === 13 && hostile.cellY === 16
      ));
      if (westernSamEmergence
        && missionEightState.eastBSamDeepChip
        && westernSamEmergence.strength > 0) {
        state.strikeKeys.add(key);
        state.villageGuardKeys.delete(key);
        state.baseGuardKeys.delete(key);
        state.eastBWaveTwoKeys.delete(key);
      }
    }
    state.eastBPreviousTanks = new Map(liveTanks.map((tank) => [objectKey(tank), {
      cellX: tank.cellX,
      cellY: tank.cellY,
    }]));
  }
  if (mission.variant === "east-a") {
    const fact = hostiles.find((hostile) => (
      hostile.typeName === "FACT" && hostile.cellX === 8 && hostile.cellY === 11
    ));
    if (fact) {
      state.factInitialStrength ??= fact.strength;
      state.factMinimumStrength = Math.min(state.factMinimumStrength, fact.strength);
    } else if (state.factInitialStrength !== undefined && state.factDeathTick === undefined) {
      state.factMinimumStrength = 0;
      state.factDeathTick = snapshot.tick;
    }

    const capturedFact = friendly.find((object) => (
      object.type === 4 && object.typeName === "FACT"
      && object.cellX === 8 && object.cellY === 11
    ));
    if (capturedFact && state.engineer.captureTick === undefined) {
      state.engineer.captureTick = snapshot.tick;
      state.engineer.capturedFactId = capturedFact.id;
    }
    if (state.engineer.orderTick !== undefined && state.engineer.key === undefined) {
      const engineer = friendly.find((object) => (
        object.type === 1 && object.typeName === "E6"
        && !state.baselineFriendlyKeys.has(objectKey(object))
      ));
      if (engineer) {
        state.engineer.key = objectKey(engineer);
        state.engineer.initialKey = state.engineer.key;
        state.engineer.observedTick = snapshot.tick;
        clearMissionEightUnitRoleKey(state.engineer.key);
      }
    }
    if (state.engineer.replacementOrderTick !== undefined
      && state.engineer.replacementKey === undefined) {
      const replacement = friendly.find((object) => (
        object.type === 1 && object.typeName === "E6"
        && objectKey(object) !== state.engineer.initialKey
        && !state.baselineFriendlyKeys.has(objectKey(object))
      ));
      if (replacement) {
        state.engineer.key = objectKey(replacement);
        state.engineer.replacementKey = state.engineer.key;
        state.engineer.replacementObservedTick = snapshot.tick;
        state.engineer.deathTick = undefined;
        state.engineer.missingSinceTick = undefined;
        state.engineer.transitStage = 0;
        state.engineer.transitProgress = [];
        state.engineer.footEscortInitializedTick = undefined;
        state.engineer.footEscortKeys.clear();
        state.engineer.footDecoyKeys.clear();
        state.engineer.footDecoyStage = 0;
        state.engineer.footDecoyProgress = [];
        state.engineer.lastOrderTick = -Infinity;
        clearMissionEightUnitRoleKey(state.engineer.key);
      }
    }
    if (state.engineer.secondReplacementOrderTick !== undefined
      && state.engineer.secondReplacementKey === undefined) {
      const replacement = friendly.find((object) => (
        object.type === 1 && object.typeName === "E6"
        && objectKey(object) !== state.engineer.initialKey
        && objectKey(object) !== state.engineer.replacementKey
        && !state.baselineFriendlyKeys.has(objectKey(object))
      ));
      if (replacement) {
        state.engineer.replacementDecoyKey = state.engineer.replacementKey;
        state.engineer.key = objectKey(replacement);
        state.engineer.secondReplacementKey = state.engineer.key;
        state.engineer.secondReplacementObservedTick = snapshot.tick;
        state.engineer.deathTick = undefined;
        state.engineer.missingSinceTick = undefined;
        state.engineer.transitStage = 0;
        state.engineer.transitProgress = [];
        state.engineer.footEscortInitializedTick = undefined;
        state.engineer.footEscortKeys.clear();
        state.engineer.footDecoyKeys.clear();
        state.engineer.footDecoyStage = 0;
        state.engineer.footDecoyProgress = [];
        state.engineer.lastOrderTick = -Infinity;
        clearMissionEightUnitRoleKey(state.engineer.key);
      }
    }
    let liveEngineer = state.engineer.key !== undefined
      ? friendly.find((object) => objectKey(object) === state.engineer.key)
      : undefined;
    if (!liveEngineer && state.engineer.unloadIssuedTick !== undefined) {
      const unloadedEngineer = friendly.find((object) => (
        object.type === 1 && object.typeName === "E6"
      ));
      if (unloadedEngineer) {
        state.engineer.key = objectKey(unloadedEngineer);
        liveEngineer = unloadedEngineer;
      }
    }
    if (!liveEngineer && state.engineer.key === state.engineer.secondReplacementKey
      && state.engineer.fallbackToDecoyTick === undefined) {
      const decoy = friendly.find((object) => (
        objectKey(object) === state.engineer.replacementDecoyKey
      ));
      if (decoy) {
        state.engineer.secondReplacementDeathTick = snapshot.tick;
        state.engineer.fallbackToDecoyTick = snapshot.tick;
        state.engineer.key = state.engineer.replacementDecoyKey;
        state.engineer.deathTick = undefined;
        state.engineer.missingSinceTick = undefined;
        state.engineer.transitStage = state.engineer.replacementDecoyStage;
        state.engineer.transitProgress = state.engineer.replacementDecoyProgress.map((entry) => ({
          ...entry,
          fallbackDecoy: true,
        }));
        state.engineer.footEscortInitializedTick = undefined;
        state.engineer.footEscortKeys.clear();
        state.engineer.footDecoyKeys.clear();
        state.engineer.lastOrderTick = -Infinity;
        clearMissionEightUnitRoleKey(state.engineer.key);
        liveEngineer = decoy;
      }
    }
    const engineerTransport = state.engineer.transportKey !== undefined
      ? friendly.find((object) => objectKey(object) === state.engineer.transportKey)
      : undefined;
    if (state.engineer.loadIssuedTick !== undefined && !liveEngineer && engineerTransport) {
      state.engineer.sealedTick ??= snapshot.tick;
    }
    if (state.engineer.sealedTick !== undefined && liveEngineer) {
      state.engineer.unloadedTick ??= snapshot.tick;
    }
    const plausiblyTransported = state.engineer.loadIssuedTick !== undefined
      && state.engineer.unloadedTick === undefined && engineerTransport;
    if (state.engineer.key !== undefined && state.engineer.captureTick === undefined
      && state.engineer.deathTick === undefined && !liveEngineer && !plausiblyTransported) {
      state.engineer.missingSinceTick ??= snapshot.tick;
      if (snapshot.tick >= state.engineer.missingSinceTick + 300) {
        state.engineer.deathTick = snapshot.tick;
        if (state.engineer.key === state.engineer.initialKey) {
          state.engineer.initialDeathTick ??= snapshot.tick;
        }
      }
    } else state.engineer.missingSinceTick = undefined;
    const factSale = state.engineer.factSale;
    if (factSale.orderTick !== undefined && factSale.goneTick === undefined
      && !friendly.some((object) => (
        object.type === 4 && object.id === factSale.structure.id
      ))) {
      factSale.goneTick = snapshot.tick;
      factSale.fundsAfter = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
      factSale.refund = factSale.fundsAfter - factSale.fundsBefore;
      const crew = friendly.filter((object) => (
        (object.type === 1 || object.type === 2)
        && !factSale.preexistingFriendlyKeys.has(objectKey(object))
        && missionEightDistance(object, { cellX: 8, cellY: 11 }) <= 4
      ));
      factSale.crew = crew.map(({ typeName, id, strength, maxStrength, cellX, cellY }) => (
        { typeName, id, strength, maxStrength, cellX, cellY }
      ));
      for (const object of crew) {
        const key = objectKey(object);
        clearMissionEightUnitRoleKey(key);
        state.strikeKeys.add(key);
      }
    }
  }

  for (const sale of Object.values(state.postFactSales).filter(Boolean)) {
    if (sale.goneTick !== undefined || friendly.some((object) => (
      object.type === 4 && object.id === sale.structure.id
    ))) continue;
    sale.goneTick = snapshot.tick;
    sale.fundsAfter = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
    sale.refund = sale.fundsAfter - sale.fundsBefore;
    const crew = friendly.filter((object) => (
      (object.type === 1 || object.type === 2)
      && !sale.preexistingFriendlyKeys.has(objectKey(object))
    ));
    sale.crew = crew.map(({ typeName, id, strength, maxStrength, cellX, cellY }) => (
      { typeName, id, strength, maxStrength, cellX, cellY }
    ));
    for (const object of crew) {
      const key = objectKey(object);
      clearMissionEightUnitRoleKey(key);
      state.postFactHomeDefenseKeys.add(key);
      state.postFactHomeDefenseCohortKeys.add(key);
    }
  }

  if (state.postFactSales.PROC?.goneTick !== undefined
    || state.engineer.factSale.goneTick !== undefined) {
    const liveMobiles = friendly.filter((object) => object.type === 1 || object.type === 2);
    if (state.postFactLiveMobileKeys !== undefined) {
      for (const object of liveMobiles) {
        const key = objectKey(object);
        if (state.postFactLiveMobileKeys.has(key)) continue;
        const pendingPostFactOrder = state.postFactProductionOrders[
          state.postFactProductionCompletions.length
        ];
        const producedAtPyle = pendingPostFactOrder
          && object.typeName === pendingPostFactOrder.assetName
          && missionEightDistance(object, { cellX: 48, cellY: 50 }) <= 2;
        if (!producedAtPyle) continue;
        clearMissionEightUnitRoleKey(key);
        const completionIndex = state.postFactProductionCompletions.length;
        if (completionIndex < missionEightEastAPostFactHomeDefenseCount) {
          state.postFactHomeDefenseKeys.add(key);
          state.postFactHomeDefenseCohortKeys.add(key);
        } else {
          state.postFactCleanupCohortKeys.add(key);
          if (state.postFactCleanupLaunchTick === undefined) {
            state.postFactHomeDefenseKeys.add(key);
          } else state.strikeKeys.add(key);
        }
        state.postFactProductionCompletions.push({
          tick: snapshot.tick,
          key,
          typeName: object.typeName,
          strength: object.strength,
          cellX: object.cellX,
          cellY: object.cellY,
          fundingSale: pendingPostFactOrder.fundingSale,
          orderTick: pendingPostFactOrder.tick,
        });
      }
    }
    state.postFactLiveMobileKeys = new Set(liveMobiles.map(objectKey));
  }

  for (const object of friendly.filter((candidate) => candidate.type === 1 || candidate.type === 2)) {
    const key = objectKey(object);
    if (state.baselineFriendlyKeys.has(key) || state.productionKeys.has(key)) continue;
    if (state.postFactHomeDefenseKeys.has(key)) continue;
    state.productionKeys.add(key);
    state.productionCompletions.push({
      tick: snapshot.tick,
      key,
      typeName: object.typeName,
      objectType: object.type,
    });
  }
  if (state.cashConversion && state.cashConversion.goneTick === undefined
    && state.cashConversion.structureIds.every((id) => !friendly.some((object) => (
      object.type === 4 && object.id === id
    )))) {
    state.cashConversion.goneTick = snapshot.tick;
    state.cashConversion.fundsAfter = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
    state.cashConversion.refund = state.cashConversion.fundsAfter
      - state.cashConversion.fundsBefore;
    const crew = friendly.filter((object) => (
      (object.type === 1 || object.type === 2)
      && !state.cashConversion.preexistingFriendlyKeys.has(objectKey(object))
    ));
    state.cashConversion.crew = crew.map(({ typeName, id, strength, cellX, cellY }) => (
      { typeName, id, strength, cellX, cellY }
    ));
    for (const object of crew) {
      const key = objectKey(object);
      clearMissionEightUnitRoleKey(key);
      state.postFactHomeDefenseKeys.add(key);
      state.postFactHomeDefenseCohortKeys.add(key);
    }
  }
  if (state.pyleConversion && state.pyleConversion.goneTick === undefined
    && !friendly.some((object) => (
      object.type === 4 && object.id === state.pyleConversion.structure.id
    ))) {
    const conversion = state.pyleConversion;
    conversion.goneTick = snapshot.tick;
    conversion.fundsAfter = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
    conversion.refund = conversion.fundsAfter - conversion.fundsBefore;
    const crew = friendly.filter((object) => (
      (object.type === 1 || object.type === 2)
      && !conversion.preexistingFriendlyKeys.has(objectKey(object))
    ));
    conversion.crew = crew.map(({ typeName, id, strength, cellX, cellY }) => (
      { typeName, id, strength, cellX, cellY }
    ));
    for (const object of crew) {
      const key = objectKey(object);
      clearMissionEightUnitRoleKey(key);
      state.postFactHomeDefenseKeys.add(key);
      state.postFactHomeDefenseCohortKeys.add(key);
    }
  }

  for (const site of missionEightSamSites[mission.variant]) {
    const key = `${site.cellX}:${site.cellY}`;
    if (!state.samDeathTicks.has(key) && !hostiles.some((hostile) => (
      hostile.typeName === "SAM" && hostile.cellX === site.cellX && hostile.cellY === site.cellY
    ))) state.samDeathTicks.set(key, snapshot.tick);
  }
  for (const [key, target] of state.southWithdrawalTargets) {
    const liveTarget = hostiles.find((hostile) => objectKey(hostile) === key);
    if (liveTarget) {
      target.minimumStrength = Math.min(target.minimumStrength ?? target.strength, liveTarget.strength);
      target.lastCellX = liveTarget.cellX;
      target.lastCellY = liveTarget.cellY;
    } else if (!state.southWithdrawalTargetDeaths.has(key)) {
      state.southWithdrawalTargetDeaths.set(key, {
        ...target,
        deathTick: snapshot.tick,
      });
    }
  }
  if (state.samDeathTicks.size === missionEightSamSites[mission.variant].length
    && state.allSamsDeadTick === undefined) state.allSamsDeadTick = snapshot.tick;

  const airstrikeEntry = snapshot.sidebar.entries.find((entry) => entry.assetName === "SW_AirStrike");
  if (airstrikeEntry) {
    assert.equal(airstrikeEntry.buildableType, 24, "Mission 8 Air Strike buildable type changed");
    assert.equal(airstrikeEntry.buildableId, 3, "Mission 8 Air Strike buildable id changed");
    assert.equal(airstrikeEntry.objectType, 11, "Mission 8 Air Strike object type changed");
    assert.equal(airstrikeEntry.superweaponType, 3, "Mission 8 Air Strike superweapon type changed");
    if (airstrikeEntry.completed && !state.airstrike.readyLatched) {
      state.airstrike.readyTicks.push(snapshot.tick);
      state.airstrike.readyLatched = true;
    } else if (!airstrikeEntry.completed) state.airstrike.readyLatched = false;
  }
  if (state.allSamsDeadTick !== undefined && snapshot.tick >= state.allSamsDeadTick + 90) {
    assert.ok(airstrikeEntry, `destroying every Mission 8 ${mission.variant} SAM did not expose Air Strike`);
  }
  if (state.airstrike.pending) {
    const pendingTarget = hostiles.find((hostile) => objectKey(hostile) === state.airstrike.pending.targetKey);
    const discharged = airstrikeEntry && !airstrikeEntry.completed;
    const a10Observed = friendly.some((object) => object.type === 3 && object.typeName === "A10");
    const targetDamaged = !pendingTarget || pendingTarget.strength < state.airstrike.pending.targetStrength;
    const elapsed = snapshot.tick - state.airstrike.pending.orderTick;
    // A-10 damage often lands after the aircraft is first observed. Wait long
    // enough to record real softening before clearing the pending slot.
    if (discharged && (targetDamaged || elapsed >= 120 || (a10Observed && elapsed >= 90))) {
      state.airstrike.discharges.push({
        orderTick: state.airstrike.pending.orderTick,
        effectTick: snapshot.tick,
        target: state.airstrike.pending.targetType,
        a10Observed,
        targetDamaged,
        targetStrengthBefore: state.airstrike.pending.targetStrength,
        targetStrengthAfter: pendingTarget?.strength ?? 0,
      });
      state.airstrike.pending = undefined;
    }
  }

  if (mission.variant === "east-a") {
    const scouts = friendly.filter((object) => state.scoutKeys.has(objectKey(object)));
    if (state.delxEnteredTick === undefined && scouts.some((object) => (
      object.cellX >= 14 && object.cellX <= 27 && object.cellY >= 26 && object.cellY <= 27
    ))) state.delxEnteredTick = snapshot.tick;
    if (state.delyEnteredTick === undefined && scouts.some((object) => (
      object.cellX >= 14 && object.cellX <= (object.cellY === 24 ? 25 : 26)
      && object.cellY >= 24 && object.cellY <= 25
    ))) state.delyEnteredTick = snapshot.tick;
  } else {
    const neutralUnits = snapshot.objects.filter((object) => (
      object.owner === HOUSE_NEUTRAL && object.subObject === 0 && object.type === 1 && object.strength > 0
    ));
    const liveNeutralKeys = new Set(neutralUnits.map(objectKey));
    if (state.eastBNeutralUnitKeys.size === 0) {
      for (const key of liveNeutralKeys) state.eastBNeutralUnitKeys.add(key);
    } else {
      for (const key of [...state.eastBNeutralUnitKeys]) {
        if (!liveNeutralKeys.has(key)
          && !state.eastBNeutralDeaths.some((death) => death.key === key)) {
          state.eastBNeutralDeaths.push({ key, tick: snapshot.tick });
        }
      }
      for (const key of liveNeutralKeys) state.eastBNeutralUnitKeys.add(key);
    }
    state.minimumNeutralUnits = Math.min(state.minimumNeutralUnits, neutralUnits.length);
    const hospital = friendly.find((object) => object.type === 4 && object.typeName === "HOSP"
      && object.cellX === 3 && object.cellY === 60);
    const moebius = friendly.find((object) => object.type === 1 && object.typeName === "MOEBIUS"
      && object.cellX === 6 && object.cellY === 60);
    if (hospital) {
      state.hospitalMinimumStrength = Math.min(state.hospitalMinimumStrength, hospital.strength);
    } else {
      state.eastBHospitalMissingTick ??= snapshot.tick;
    }
    if (moebius) {
      state.moebiusMinimumStrength = Math.min(state.moebiusMinimumStrength, moebius.strength);
    } else {
      state.eastBMoebiusMissingTick ??= snapshot.tick;
    }
    // Infer likely SCG08EB lose trigger for diagnostics.
    const gdiCombat = friendly.filter((object) => (
      (object.type === 1 || object.type === 2 || object.type === 4)
      && object.typeName !== "MOEBIUS" && object.typeName !== "HOSP"
    ));
    if (state.eastBMoebiusMissingTick !== undefined || state.eastBHospitalMissingTick !== undefined) {
      state.eastBLoseHint = "los3-moebius-or-hosp";
    } else if (state.eastBNeutralDeaths.length >= 9
      || state.minimumNeutralUnits <= state.initialNeutralUnitKeys.size - 9) {
      state.eastBLoseHint = "civ-nine-neutral-unit-deaths";
    } else if (gdiCombat.length === 0) {
      state.eastBLoseHint = "all-destr-goodguy";
    } else if (state.eastBNeutralDeaths.length >= 8) {
      state.eastBLoseHint = "civ-near-threshold";
    }
    for (const transport of hostiles.filter((object) => object.type === 3 && object.typeName === "TRAN")) {
      const key = objectKey(transport);
      if (!state.transportSightings.has(key)) state.transportSightings.set(key, {
        tick: snapshot.tick,
        cellX: transport.cellX,
        cellY: transport.cellY,
      });
    }
  }
}

function queueMissionEightRepairs(snapshot, friendly, commands) {
  const state = missionEightState;
  if (mission.variant === "east-b" && friendly.filter((object) => (
    object.typeName === "MTNK"
    && state.eastBProducedTankKeys.has(objectKey(object))
  )).length < 6) return;
  if (mission.variant === "east-a" && state.allSamsDeadTick !== undefined) {
    for (const building of friendly.filter((object) => (
      object.type === 4 && (object.objectFlags & (1 << 1))
      && snapshot.tick - (state.postSamRepairStopTicks.get(object.id) ?? -Infinity) >= 90
    ))) {
      commands.push({ type: COMMAND_STRUCTURE, args: [STRUCTURE_REPAIR_START, 0, 0, 0, 0, 0, 0] });
      commands.push({ type: COMMAND_STRUCTURE, args: [STRUCTURE_REPAIR, building.id, 0, 0, 0, 0, 0] });
      state.postSamRepairStopTicks.set(building.id, snapshot.tick);
    }
    return;
  }
  const funds = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
  const importantEastA = new Set(["PROC", "NUKE", "PYLE", "GTWR", "FIX"]);
  for (const building of friendly.filter((object) => (
    object.type === 4 && object.strength < object.maxStrength
    && !(object.objectFlags & (1 << 1))
    && (mission.variant === "east-b" || importantEastA.has(object.typeName))
    && funds >= 300
    && snapshot.tick - (state.repairTicks.get(object.id) ?? -900) >= 900
  ))) {
    commands.push({ type: COMMAND_STRUCTURE, args: [STRUCTURE_REPAIR_START, 0, 0, 0, 0, 0, 0] });
    commands.push({ type: COMMAND_STRUCTURE, args: [STRUCTURE_REPAIR, building.id, 0, 0, 0, 0, 0] });
    state.repairedIds.add(building.id);
    state.repairTicks.set(building.id, snapshot.tick);
    repairOrders += 1;
  }
}

function queueMissionEightVehicleRepair(snapshot, friendly, commands) {
  const state = missionEightState;
  if (mission.variant !== "east-a" || state.vehicleRepairCompleteTick !== undefined
    || state.assaultTick !== undefined) return;
  const vehicles = friendly.filter((object) => (
    object.type === 2 && state.vehicleRepairKeys.has(objectKey(object))
  ));
  for (const vehicle of vehicles) {
    const key = objectKey(vehicle);
    const previousStrength = state.vehicleRepairLastStrengths.get(key) ?? vehicle.strength;
    if (vehicle.strength > previousStrength) {
      state.vehicleRepairProgress.push({
        tick: snapshot.tick,
        key,
        typeName: vehicle.typeName,
        from: previousStrength,
        to: vehicle.strength,
      });
      state.vehicleRepairLastProgressTicks.set(key, snapshot.tick);
    }
    state.vehicleRepairLastStrengths.set(key, vehicle.strength);
    if (vehicle.strength >= vehicle.maxStrength) {
      state.vehicleRepairCompletedKeys.add(key);
      if (state.vehicleRepairActiveKey === key) {
        state.vehicleRepairActiveKey = undefined;
        state.vehicleRepairClearKey = key;
      }
    }
  }

  const repairFacility = friendly.find((object) => object.type === 4 && object.typeName === "FIX");
  if (!repairFacility) return;
  if (state.vehicleRepairClearKey) {
    const clearing = vehicles.find((vehicle) => objectKey(vehicle) === state.vehicleRepairClearKey);
    if (!clearing || missionEightDistance(clearing, repairFacility) > 1) {
      state.vehicleRepairClearKey = undefined;
    } else {
      if (snapshot.tick - state.vehicleRepairLastClearOrderTick >= 90) {
        const parkingIndex = state.vehicleRepairCompletedKeys.size - 1;
        const parking = { cellX: 43 + (parkingIndex % 5) * 2, cellY: 55 };
        queueMissionEightContext(commands, [clearing], parking, MODIFIER_ALT);
        state.vehicleRepairLastClearOrderTick = snapshot.tick;
        state.vehicleRepairClearOrders.push({
          tick: snapshot.tick,
          key: state.vehicleRepairClearKey,
          typeName: clearing.typeName,
          cellX: parking.cellX,
          cellY: parking.cellY,
        });
      }
      return;
    }
  }
  if (state.vehicleRepairCompletedKeys.size === state.vehicleRepairKeys.size) {
    state.vehicleRepairCompleteTick = snapshot.tick;
    return;
  }
  let active = vehicles.find((vehicle) => objectKey(vehicle) === state.vehicleRepairActiveKey);
  if (!active) {
    const candidates = vehicles.filter((vehicle) => (
      !state.vehicleRepairCompletedKeys.has(objectKey(vehicle))
      && (state.scoutStage >= missionEightEastAScoutRoute.length
        || !state.scoutKeys.has(objectKey(vehicle)))
    ));
    active = candidates.toSorted((left, right) => (
      left.strength / left.maxStrength - right.strength / right.maxStrength
      || left.id - right.id
    ))[0];
    state.vehicleRepairActiveKey = active ? objectKey(active) : undefined;
  }
  if (!active) return;
  const key = objectKey(active);
  const lastProgress = state.vehicleRepairLastProgressTicks.get(key) ?? -Infinity;
  if (snapshot.tick - state.vehicleRepairLastOrderTick >= 300
    && snapshot.tick - lastProgress >= 180) {
    queueMissionEightContext(commands, [active], repairFacility);
    state.vehicleRepairLastOrderTick = snapshot.tick;
    state.vehicleRepairOrders.push({
      tick: snapshot.tick,
      key,
      typeName: active.typeName,
      strength: active.strength,
      maxStrength: active.maxStrength,
    });
  }
}

function queueMissionEightPostFactSale(snapshot, friendly, commands, structure) {
  const state = missionEightState;
  const sale = {
    orderTick: snapshot.tick,
    structure: {
      typeName: structure.typeName,
      id: structure.id,
      strength: structure.strength,
      maxStrength: structure.maxStrength,
      cellX: structure.cellX,
      cellY: structure.cellY,
    },
    fundsBefore: snapshot.sidebar.credits + snapshot.sidebar.tiberium,
    preexistingFriendlyKeys: new Set(friendly.filter((object) => (
      object.type === 1 || object.type === 2
    )).map(objectKey)),
    goneTick: undefined,
    fundsAfter: undefined,
    refund: undefined,
    crew: [],
  };
  state.postFactSales[structure.typeName] = sale;
  sellMissionSevenStructure(commands, structure);
  state.soldStructureIds.add(structure.id);
  state.saleOrders.push({
    tick: snapshot.tick,
    typeName: structure.typeName,
    cellX: structure.cellX,
    cellY: structure.cellY,
    reason: "post-FACT split-force economy",
  });
}

function queueMissionEightBase(snapshot, friendly, hostiles, commands) {
  const state = missionEightState;
  if (mission.variant === "east-a") {
    const capturedFact = friendly.find((object) => (
      object.type === 4 && object.typeName === "FACT"
      && object.cellX === 8 && object.cellY === 11
      && (object.objectFlags & (1 << 5))
    ));
    if (state.engineer.captureTick !== undefined
      && state.engineer.factSale.orderTick === undefined && capturedFact) {
      const factSale = state.engineer.factSale;
      factSale.orderTick = snapshot.tick;
      factSale.structure = {
        typeName: capturedFact.typeName,
        id: capturedFact.id,
        strength: capturedFact.strength,
        maxStrength: capturedFact.maxStrength,
        cellX: capturedFact.cellX,
        cellY: capturedFact.cellY,
      };
      factSale.fundsBefore = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
      factSale.preexistingFriendlyKeys = new Set(friendly.filter((object) => (
        object.type === 1 || object.type === 2
      )).map(objectKey));
      sellMissionSevenStructure(commands, capturedFact);
      state.soldStructureIds.add(capturedFact.id);
      state.saleOrders.push({
        tick: snapshot.tick,
        typeName: capturedFact.typeName,
        cellX: capturedFact.cellX,
        cellY: capturedFact.cellY,
        reason: "captured-FACT conversion",
      });
    }
    const disposable = friendly.filter((object) => (
      object.type === 4
      && (object.objectFlags & (1 << 5))
      && !state.soldStructureIds.has(object.id)
      && (object.typeName === "HQ" || object.typeName === "SILO"
        || (object.typeName === "FIX" && state.vehicleRepairCompleteTick !== undefined))
    ));
    for (const structure of disposable) {
      sellMissionSevenStructure(commands, structure);
      state.soldStructureIds.add(structure.id);
      state.saleOrders.push({
        tick: snapshot.tick,
        typeName: structure.typeName,
        cellX: structure.cellX,
        cellY: structure.cellY,
      });
    }
    if (state.factDeathTick !== undefined && state.engineer.captureTick === undefined
      && state.postFactSales.PROC === undefined) {
      const refinery = friendly.find((object) => (
        object.type === 4 && object.typeName === "PROC"
        && (object.objectFlags & (1 << 5))
        && !state.soldStructureIds.has(object.id)
      ));
      if (refinery) queueMissionEightPostFactSale(snapshot, friendly, commands, refinery);
    }

    if (state.northHoldTick !== undefined && state.cashConversion === undefined) {
      const powerPlants = friendly.filter((object) => (
        object.type === 4 && object.typeName === "NUKE" && (object.objectFlags & (1 << 5))
      )).toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || left.cellY - right.cellY
        || left.cellX - right.cellX
        || left.id - right.id
      ));
      state.retainedPowerId = powerPlants[0]?.id;
      const conversionStructures = friendly.filter((object) => (
        object.type === 4 && (object.objectFlags & (1 << 5))
        && !state.soldStructureIds.has(object.id)
        && (object.typeName === "PROC"
          || (object.typeName === "NUKE" && object.id !== state.retainedPowerId))
      ));
      if (conversionStructures.length > 0) {
        state.cashConversion = {
          orderTick: snapshot.tick,
          structureIds: conversionStructures.map((structure) => structure.id),
          structures: conversionStructures.map(({ typeName, id, strength, cellX, cellY }) => (
            { typeName, id, strength, cellX, cellY }
          )),
          fundsBefore: snapshot.sidebar.credits + snapshot.sidebar.tiberium,
          preexistingFriendlyKeys: new Set(friendly.filter((object) => (
            object.type === 1 || object.type === 2
          )).map(objectKey)),
          goneTick: undefined,
          fundsAfter: undefined,
          refund: undefined,
          crew: [],
        };
        for (const structure of conversionStructures) {
          sellMissionSevenStructure(commands, structure);
          state.soldStructureIds.add(structure.id);
          state.saleOrders.push({
            tick: snapshot.tick,
            typeName: structure.typeName,
            cellX: structure.cellX,
            cellY: structure.cellY,
            reason: "third-wave cash conversion",
          });
        }
      }
    }
    if (state.cashConversion?.goneTick !== undefined && state.pyleConversion === undefined) {
      const surplusTower = friendly.filter((object) => (
        object.type === 4 && object.typeName === "GTWR" && (object.objectFlags & (1 << 5))
        && !state.soldStructureIds.has(object.id)
      )).toSorted((left, right) => right.cellY - left.cellY || right.id - left.id)[0];
      if (surplusTower) {
        const retainedPower = friendly.find((object) => (
          object.type === 4 && object.typeName === "NUKE"
          && object.id === state.retainedPowerId && !state.soldStructureIds.has(object.id)
        ));
        const supportStructures = [surplusTower, retainedPower].filter(Boolean);
        state.pyleConversion = {
          orderTick: snapshot.tick,
          structure: {
            typeName: surplusTower.typeName,
            id: surplusTower.id,
            strength: surplusTower.strength,
            cellX: surplusTower.cellX,
            cellY: surplusTower.cellY,
          },
          fundsBefore: snapshot.sidebar.credits + snapshot.sidebar.tiberium,
          preexistingFriendlyKeys: new Set(friendly.filter((object) => (
            object.type === 1 || object.type === 2
          )).map(objectKey)),
          goneTick: undefined,
          fundsAfter: undefined,
          refund: undefined,
          crew: [],
        };
        for (const structure of supportStructures) {
          sellMissionSevenStructure(commands, structure);
          state.soldStructureIds.add(structure.id);
          state.saleOrders.push({
            tick: snapshot.tick,
            typeName: structure.typeName,
            cellX: structure.cellX,
            cellY: structure.cellY,
            reason: "post-SAM support conversion",
          });
        }
      }
    }
  }
  queueMissionEightRepairs(snapshot, friendly, commands);
  queueMissionEightVehicleRepair(snapshot, friendly, commands);
  let funds = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
  const buildings = friendly.filter((object) => object.type === 4);
  const builtAssets = new Set(buildings.map((object) => object.typeName));
  const healthyReservedEastBTanks = mission.variant === "east-b" ? friendly.filter((object) => (
    object.typeName === "MTNK"
    && state.eastBProducedTankKeys.has(objectKey(object))
    && !state.villageGuardKeys.has(objectKey(object))
    && object.strength >= Math.ceil(object.maxStrength * 0.75)
    && (missionEightDistance(object, missionEightEastBTankReserve) <= 6
      || missionEightDistance(object, missionEightEastBTankAssembly) <= 4)
  )) : [];
  if (healthyReservedEastBTanks.length >= missionEightEastBAssaultTankCount) {
    state.eastBTankCohortReadyTick ??= snapshot.tick;
  }
  const eastBTankCohortReady = state.eastBTankCohortReadyTick !== undefined;

  if (mission.variant === "east-b" && !builtAssets.has("FACT")) {
    const mcv = friendly.find((object) => object.type === 2 && object.typeName === "MCV");
    if (mcv && (state.deployOrderTick === undefined || snapshot.tick - state.deployOrderTick >= 90)) {
      queueMissionEightContext(commands, [mcv], mcv);
      state.deployOrderTick = snapshot.tick;
      state.deploySite ??= { cellX: mcv.cellX, cellY: mcv.cellY };
      deploymentOrders += 1;
    }
    return;
  }

  if (mission.variant === "east-b") {
    const sequence = ["NUKE", "PYLE", "PROC", "WEAP"];
    const missingAsset = sequence.find((assetName) => !builtAssets.has(assetName));
    if (missingAsset) {
      const entry = snapshot.sidebar.entries.find((candidate) => (
        candidate.assetName === missingAsset && candidate.objectType === 15
      ));
      if (entry?.completed) {
        if (snapshot.placement) {
          const cell = missionEightLegalPlacement(snapshot, entry);
          assert.ok(cell, `no legal Mission 8 east-b ${entry.assetName} placement was exported`);
          commands.push({
            type: COMMAND_SIDEBAR,
            args: [SIDEBAR_PLACE, entry.buildableType, entry.buildableId, cell.x, cell.y, 0, 0],
          });
          state.placedSites.push({ assetName: entry.assetName, tick: snapshot.tick,
            cellX: cell.cellX, cellY: cell.cellY });
          placements += 1;
        } else {
          commands.push({
            type: COMMAND_SIDEBAR,
            args: [SIDEBAR_START_PLACEMENT, entry.buildableType, entry.buildableId, 0, 0, 0, 0],
          });
          placementStarts += 1;
        }
      } else if (entry && !entry.constructing && !entry.onHold && !entry.busy && funds >= entry.cost) {
        startMissionEightProduction(commands, entry);
        state.structureStarts.push({ assetName: entry.assetName, tick: snapshot.tick, cost: entry.cost });
        funds -= entry.cost;
      }
    }
  }

  let engineerQueued = false;
  if (mission.variant === "east-a" && state.vehicleRepairCompleteTick !== undefined
    && state.engineer.orderTick === undefined && builtAssets.has("PYLE")) {
    const engineer = snapshot.sidebar.entries.find((entry) => entry.assetName === "E6");
    if (engineer && !engineer.constructing && !engineer.completed
      && !engineer.onHold && !engineer.busy && funds >= engineer.cost + 400) {
      startMissionEightProduction(commands, engineer);
      state.engineer.orderTick = snapshot.tick;
      state.engineer.orderFunds = funds;
      funds -= engineer.cost;
      engineerQueued = true;
    }
  }

  const postFactStartsFor = (fundingSale) => state.postFactProductionOrders.filter((order) => (
    order.fundingSale === fundingSale
  )).length;
  const postFactFundingSale = mission.variant === "east-a" && builtAssets.has("PYLE")
    && state.postFactSales.PROC?.goneTick !== undefined && postFactStartsFor("PROC") < 3
      ? "PROC"
      : mission.variant === "east-a" && builtAssets.has("PYLE")
        && state.engineer.factSale.goneTick !== undefined
        && postFactStartsFor("FACT") < missionEightEastAPostFactProductionCount
        ? "FACT"
      : undefined;
  if (postFactFundingSale) {
    const postFactStartIndex = postFactStartsFor(postFactFundingSale);
    const assetName = postFactFundingSale === "FACT"
      ? postFactStartIndex < missionEightEastAPostFactRifleCount ? "E1" : "E3"
      : "E1";
    const infantry = snapshot.sidebar.entries.find((entry) => entry.assetName === assetName);
    if (infantry && !infantry.constructing && !infantry.completed
      && !infantry.onHold && !infantry.busy && funds >= infantry.cost) {
      state.postFactProductionOrders.push({
        tick: snapshot.tick,
        assetName: infantry.assetName,
        cost: infantry.cost,
        fundsBefore: funds,
        fundingSale: postFactFundingSale,
      });
      startMissionEightProduction(commands, infantry);
      funds -= infantry.cost;
    }
  }

  const freeEastBTanks = mission.variant === "east-b"
    ? friendly.filter((object) => (
      object.typeName === "MTNK"
      && state.eastBProducedTankKeys.has(objectKey(object))
      && !state.villageGuardKeys.has(objectKey(object))
      && object.strength > 0
    )).length
    : 0;
  const eastBMtnkEntry = mission.variant === "east-b"
    ? snapshot.sidebar.entries.find((entry) => entry.assetName === "MTNK")
    : undefined;
  const eastBMtnkBusy = Boolean(eastBMtnkEntry?.constructing || eastBMtnkEntry?.completed);
  // SAM pack phase: free tanks are staging and we still need a follow-up tank
  // and/or rockets before the western push.
  const eastBSamPackPhase = mission.variant === "east-b" && builtAssets.has("WEAP")
    && (eastBTankCohortReady || freeEastBTanks >= 2
      || missionEightState.assaultTick !== undefined);

  if (mission.variant === "east-b" && builtAssets.has("WEAP")) {
    // Always prefer MTNK once WEAP is up — the western SAM needs a continuous
    // armor stream, not Jeeps.
    if (eastBMtnkEntry && !eastBMtnkEntry.constructing && !eastBMtnkEntry.completed
      && !eastBMtnkEntry.onHold && !eastBMtnkEntry.busy
      && funds >= eastBMtnkEntry.cost) {
      startMissionEightProduction(commands, eastBMtnkEntry);
      funds -= eastBMtnkEntry.cost;
    }
    // Emergency cash only when a second NUKE exists — selling the sole plant
    // blackouts WEAP and stalls the finish tank (TRACE v84/v85).
    const westernSamForSale = hostiles.find((hostile) => (
      hostile.typeName === "SAM" && hostile.cellX === 13 && hostile.cellY === 16
    ));
    const strikeTanksForSale = friendly.filter((object) => (
      object.typeName === "MTNK"
      && missionEightState.strikeKeys.has(objectKey(object))
      && object.strength > 0
    )).length;
    const liveFunds = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
    if (state.eastBSamFinishSellTick === undefined
      && westernSamForSale
      && westernSamForSale.strength < westernSamForSale.maxStrength
      && strikeTanksForSale <= 2
      && liveFunds < 800
      && liveFunds >= 300) {
      const powerPlants = friendly.filter((object) => (
        object.type === 4
        && object.typeName === "NUKE" && object.strength > 0
        && !state.soldStructureIds.has(object.id)
      )).toSorted((left, right) => (
        left.strength - right.strength || left.id - right.id
      ));
      if (powerPlants.length >= 2) {
        const sell = powerPlants[0];
        sellMissionSevenStructure(commands, sell);
        state.soldStructureIds.add(sell.id);
        state.eastBSamFinishSellTick = snapshot.tick;
        state.saleOrders.push({
          tick: snapshot.tick,
          typeName: sell.typeName,
          cellX: sell.cellX,
          cellY: sell.cellY,
          reason: "east-b SAM-finish tank funding",
        });
      }
    }
    // Reserve power for emergency SAM-finish sells: build a second NUKE only
    // after the western assault has launched — queuing it earlier blocks WEAP
    // MTNK production and the assault gate never closes (TRACE v87).
    const eastBNukeCount = buildings.filter((object) => (
      object.typeName === "NUKE" && object.strength > 0
    )).length;
    if (eastBNukeCount < 2 && state.eastBSecondNukeOrderTick === undefined
      && builtAssets.has("WEAP")
      && state.assaultTick !== undefined
      && (eastBMtnkBusy || snapshot.tick >= state.assaultTick + 6_000)
      && !(westernSamForSale
        && westernSamForSale.strength <= 280
        && strikeTanksForSale === 0
        && funds < 800)) {
      const spareNukeEntry = snapshot.sidebar.entries.find((entry) => (
        entry.assetName === "NUKE" && entry.objectType === 15
      ));
      if (spareNukeEntry?.completed && snapshot.placement) {
        const cell = missionEightLegalPlacement(snapshot, spareNukeEntry,
          missionEightEastBSecondNukeCell);
        if (cell) {
          commands.push({
            type: COMMAND_SIDEBAR,
            args: [SIDEBAR_PLACE, spareNukeEntry.buildableType, spareNukeEntry.buildableId,
              cell.x, cell.y, 0, 0],
          });
          state.placedSites.push({
            assetName: spareNukeEntry.assetName,
            tick: snapshot.tick,
            cellX: cell.cellX,
            cellY: cell.cellY,
          });
          state.eastBSecondNukeOrderTick = snapshot.tick;
          placements += 1;
        }
      } else if (spareNukeEntry && !spareNukeEntry.constructing && !spareNukeEntry.onHold
        && !spareNukeEntry.busy && funds >= spareNukeEntry.cost + 400) {
        startMissionEightProduction(commands, spareNukeEntry);
        state.eastBSecondNukeOrderTick = snapshot.tick;
        funds -= spareNukeEntry.cost;
      }
    }
  }

  const canProduceEastA = mission.variant === "east-a"
    && !engineerQueued && !postFactFundingSale && state.engineer.orderTick !== undefined
    && state.vehicleRepairCompleteTick !== undefined
    && (state.thirdWaveLaunchTick === undefined || state.allSamsDeadTick !== undefined)
    && (!state.cashConversion || state.cashConversion.goneTick !== undefined);
  const eastBVillageInfantryCount = mission.variant === "east-b"
    ? friendly.filter((object) => (
      object.type === 1 && state.villageGuardKeys.has(objectKey(object)) && object.strength > 0
    )).length
    : 0;
  const eastBStrikeRockets = mission.variant === "east-b"
    ? friendly.filter((object) => (
      object.typeName === "E3"
      && !state.villageGuardKeys.has(objectKey(object))
      && object.strength > 0
    )).length
    : 0;
  // After WEAP, top up village rockets even before the tank cohort is ready —
  // waiting left hospital guards unreplaced through the early airlifts.
  // Also allow production during SAM-pack phase to stock E3 for the western push.
  const canProduceEastB = mission.variant === "east-b" && builtAssets.has("PROC")
    && builtAssets.has("PYLE")
    && (eastBTankCohortReady
      || eastBSamPackPhase
      || (builtAssets.has("WEAP") && eastBVillageInfantryCount < 5));
  if (canProduceEastA || canProduceEastB) {
    // Bank a full MTNK when we still need follow-up armor. Once a tank is in
    // the factory queue (or we already have 4 free tanks), spend leftover cash
    // on E3 rockets for the SAM pack (TRACE: zero E3 at assault for many runs).
    // After the first western wave dies with a pristine SAM, ease banking so
    // leftover cash buys E3 (TRACE v42 sat at 740 forever). When the SAM is
    // already chipped, hard-bank for a finishing MTNK instead — E3 spam left
    // funds at 280 while SAM repaired 200→400 (TRACE v43).
    const eastBWesternSam = mission.variant === "east-b"
      ? hostiles.find((hostile) => (
        hostile.typeName === "SAM" && hostile.cellX === 13 && hostile.cellY === 16
      ))
      : undefined;
    const eastBSamStillUp = Boolean(eastBWesternSam);
    const eastBSamChipped = Boolean(
      eastBWesternSam && eastBWesternSam.strength < eastBWesternSam.maxStrength,
    );
    const eastBStrikeTanksLive = mission.variant === "east-b"
      ? friendly.filter((object) => (
        object.typeName === "MTNK"
        && missionEightState.strikeKeys.has(objectKey(object))
        && object.strength > 0
      )).length
      : 0;
    const eastBRebuildWave = mission.variant === "east-b"
      && missionEightState.assaultTick !== undefined
      && eastBSamStillUp
      && eastBStrikeTanksLive === 0
      && !eastBSamChipped;
    const eastBSamNearDead = Boolean(
      eastBWesternSam && (eastBWesternSam.strength <= 220 || missionEightState.eastBSamDeepChip)
    );
    const eastBSamMtnkBank = mission.variant === "east-b"
      && missionEightState.assaultTick !== undefined
      && eastBSamChipped
      && (eastBStrikeTanksLive <= 2 || eastBSamNearDead)
      && funds < 800;
    const eastBFinishBank = mission.variant === "east-b"
      && missionEightState.assaultTick !== undefined
      && (eastBSamMtnkBank
        || (eastBSamChipped
          && freeEastBTanks < 1
          && !eastBMtnkBusy));
    const eastBBankingForArmor = mission.variant === "east-b" && (
      eastBFinishBank
      || (!eastBRebuildWave && (
        missionEightState.assaultTick !== undefined
        || (freeEastBTanks < missionEightEastBAssaultTankCount + 1 && !eastBMtnkBusy)
      ))
    );
    const structureReserve = mission.variant === "east-b" && !builtAssets.has("WEAP")
      ? 2_000
      : mission.variant === "east-b" && eastBBankingForArmor ? 800
      : mission.variant === "east-b" && !eastBTankCohortReady ? 1_000
      : mission.variant === "east-a" && state.allSamsDeadTick !== undefined ? 0
        : mission.variant === "east-a" && state.secondWaveLaunchTick !== undefined ? 0 : 400;
    const infantryPattern = mission.variant === "east-a"
      ? state.allSamsDeadTick !== undefined
        ? ["E3"]
        : state.secondWaveLaunchTick !== undefined ? ["E1"] : ["E1", "E3", "E1", "E1"]
      : eastBVillageInfantryCount < 4 ? ["E3", "E3", "E2"]
        : eastBSamPackPhase || missionEightState.assaultTick !== undefined
          ? ["E3", "E3", "E3"]
        : ["E3", "E2", "E3"];
    const infantryAsset = infantryPattern[infantryProductionStarts % infantryPattern.length];
    const infantry = snapshot.sidebar.entries.find((entry) => entry.assetName === infantryAsset)
      ?? snapshot.sidebar.entries.find((entry) => entry.assetName === "E2")
      ?? snapshot.sidebar.entries.find((entry) => entry.assetName === "E1");
    // While banking for the next tank, still allow E3 if we cannot afford MTNK
    // this tick (funds in [300,799]) so rockets stockpile beside staged tanks.
    const eastBInfantryReserve = mission.variant === "east-b" && eastBBankingForArmor
      ? 800
      : mission.variant === "east-b" && eastBSamPackPhase && eastBStrikeRockets < 4
        ? 0
      : structureReserve;
    const canBuyInfantry = infantry && !infantry.constructing && !infantry.completed
      && !infantry.onHold && !infantry.busy
      && funds >= infantry.cost + eastBInfantryReserve
      && !(mission.variant === "east-b" && eastBSamMtnkBank
        && eastBStrikeTanksLive === 0 && freeEastBTanks === 0);
    // Gap-fill rockets when a tank is already building and cash is short of another.
    // Never gap-fill while hard-banking a SAM-finish tank (TRACE v45 spent down
    // to 280 on E3 while SAM repaired from 202).
    const canBuyPackRocket = mission.variant === "east-b" && eastBSamPackPhase
      && !eastBFinishBank
      && !eastBSamMtnkBank
      && eastBStrikeRockets < 4
      && infantry?.assetName === "E3"
      && !infantry.constructing && !infantry.completed && !infantry.onHold && !infantry.busy
      && funds >= infantry.cost
      && (eastBMtnkBusy || funds < 800 || freeEastBTanks >= missionEightEastBAssaultTankCount);
    if (canBuyInfantry || canBuyPackRocket) {
      startMissionEightProduction(commands, infantry);
      funds -= infantry.cost;
    }
  }

  const airstrikeEntry = snapshot.sidebar.entries.find((entry) => entry.assetName === "SW_AirStrike");
  const holdingEastACounterattackStrike = mission.variant === "east-a"
    && state.allSamsDeadTick !== undefined && state.factDeathTick === undefined
    && (state.postSamCounterattackLaunchTick === undefined
      || state.postSamCounterattackStage < 2);
  if (airstrikeEntry?.completed && !state.airstrike.pending && hostiles.length > 0
    && !holdingEastACounterattackStrike) {
    const priorities = new Map([["HAND", 0], ["AFLD", 1], ["PROC", 2], ["FACT", 3], ["GUN", 4], ["NUKE", 5]]);
    const withdrawalLane = { cellX: 9, cellY: 22 };
    const engineerIngressPending = mission.variant === "east-a"
      && state.allSamsDeadTick !== undefined && state.engineer.captureTick === undefined;
    const withdrawalPriorities = new Map([
      ["ARTY", 0], ["LTNK", 1], ["BGGY", 2], ["E4", 3],
      ["E3", 4], ["E2", 5], ["E1", 6], ["GUN", 7],
    ]);
    const baseAirstrikePoint = { cellX: 43, cellY: 52 };
    const baseAirstrikeTarget = mission.variant === "east-a"
      ? hostiles.filter((hostile) => (
          hostile.type !== 4
          && withdrawalPriorities.has(hostile.typeName)
          && missionEightDistance(hostile, baseAirstrikePoint) <= 18
        )).toSorted((left, right) => (
          (withdrawalPriorities.get(left.typeName) ?? 20)
            - (withdrawalPriorities.get(right.typeName) ?? 20)
          || missionEightDistance(left, baseAirstrikePoint)
            - missionEightDistance(right, baseAirstrikePoint)
          || left.strength - right.strength
          || left.id - right.id
        ))[0]
      : undefined;
    const withdrawalCandidates = mission.variant === "east-a"
      && state.allSamsDeadTick !== undefined && state.factDeathTick === undefined
      ? hostiles.filter((hostile) => (
          withdrawalPriorities.has(hostile.typeName)
          && snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
          && missionEightDistance(hostile, withdrawalLane) <= 12
        )).toSorted((left, right) => (
          Number(!(engineerIngressPending && left.typeName === "E1"
            && left.cellX === 13 && left.cellY === 12))
            - Number(!(engineerIngressPending && right.typeName === "E1"
              && right.cellX === 13 && right.cellY === 12))
          ||
          (withdrawalPriorities.get(left.typeName) ?? 20)
            - (withdrawalPriorities.get(right.typeName) ?? 20)
          || missionEightDistance(left, withdrawalLane) - missionEightDistance(right, withdrawalLane)
          || left.strength - right.strength
          || left.id - right.id
        ))
      : [];
    const withdrawalTarget = withdrawalCandidates[0];
    const counterattackSite = (state.postSamCounterattackLaunchTick !== undefined
      || (state.pyleConversion?.goneTick !== undefined && snapshot.tick >= 30_000))
      && hostiles.some((hostile) => (
        hostile.typeName === "GUN" && hostile.cellX === 21 && hostile.cellY === 19
      )) ? { typeName: "GUN", cellX: 21, cellY: 19 } : undefined;
    const counterattackTarget = counterattackSite ? hostiles.find((hostile) => (
      hostile.typeName === counterattackSite.typeName
      && hostile.cellX === counterattackSite.cellX
      && hostile.cellY === counterattackSite.cellY
    )) : undefined;
    const productionGun = mission.variant === "east-a"
      ? hostiles.find((hostile) => (
        hostile.typeName === missionEightEastAProductionGunSite.typeName
        && hostile.cellX === missionEightEastAProductionGunSite.cellX
        && hostile.cellY === missionEightEastAProductionGunSite.cellY
      ))
      : undefined;
    if (productionGun) {
      state.productionGunMinimumStrength = Math.min(
        state.productionGunMinimumStrength ?? productionGun.strength,
        productionGun.strength,
      );
    }
    // Once the production charge (or HAND peel) is committed, prefer A-10s on
    // HAND/AFLD over the turret. Keep post-hold GUN soft-passes available so
    // the charge does not walk into a fully repaired turret.
    const peelCommitted = state.productionGunPeelKeys.size > 0
      || state.westCleanupStage >= 8
      || state.productionGunChargeTick !== undefined;
    // Base armor gets priority only before the production assault is the focus.
    const baseArmorThreat = mission.variant === "east-a" && !peelCommitted
      ? hostiles.filter((hostile) => (
          (hostile.typeName === "LTNK" || hostile.typeName === "BGGY" || hostile.typeName === "ARTY")
          && missionEightDistance(hostile, baseAirstrikePoint) <= 16
        )).toSorted((left, right) => (
          missionEightDistance(left, baseAirstrikePoint)
            - missionEightDistance(right, baseAirstrikePoint)
          || left.strength - right.strength
          || left.id - right.id
        ))[0]
      : undefined;
    const productionTurretPriority = !peelCommitted
      && (state.postFactCleanupLaunchTick !== undefined
        || state.westCleanupStage >= 6
        || (productionGun
          && productionGun.strength > missionEightEastAProductionGunSoftStrength));
    const productionTurretTarget = productionGun
      && state.engineer.factSale.goneTick !== undefined
      && state.westCleanupStage <= 7
      && productionTurretPriority
      && !baseArmorThreat
      ? productionGun
      : undefined;
    const productionBaseTarget = mission.variant === "east-a"
      && state.postFactCleanupLaunchTick !== undefined
      && (peelCommitted
        || !productionGun
        || productionGun.strength <= missionEightEastAProductionGunSoftStrength
        || state.westCleanupStage >= 8)
      ? hostiles.filter((hostile) => (
          (hostile.typeName === "HAND" && hostile.cellX === 27 && hostile.cellY === 17)
          || (hostile.typeName === "AFLD" && hostile.cellX === 29 && hostile.cellY === 14)
          || (hostile.typeName === "PROC" && hostile.cellX === 25 && hostile.cellY === 17)
          || ((hostile.typeName === "LTNK" || hostile.typeName === "BGGY")
            && missionEightDistance(hostile, { cellX: 27, cellY: 17 }) <= 6)
        )).toSorted((left, right) => {
          const rank = (unit) => {
            // HAND first (the only target whose kill we have reproduced), then
            // pad armor once HAND is gone, then the rest of the production chain.
            if (unit.typeName === "HAND") return 0;
            if (unit.typeName === "LTNK" || unit.typeName === "BGGY") {
              return state.westCleanupStage >= 9 ? 1 : 3;
            }
            if (unit.typeName === "AFLD") return 2;
            if (unit.typeName === "PROC") return 4;
            return 5;
          };
          return rank(left) - rank(right) || left.strength - right.strength || left.id - right.id;
        })[0]
      : undefined;
    const structureTarget = hostiles.filter((hostile) => hostile.type === 4).toSorted((left, right) => (
      (priorities.get(left.typeName) ?? 20) - (priorities.get(right.typeName) ?? 20)
      || left.strength - right.strength
      || left.cellY - right.cellY
      || left.cellX - right.cellX
      || left.id - right.id
    ))[0];
    const target = (peelCommitted
      ? (productionBaseTarget ?? baseArmorThreat)
      : (baseArmorThreat ?? productionTurretTarget))
      ?? productionTurretTarget ?? counterattackTarget
      ?? productionBaseTarget ?? baseAirstrikeTarget ?? structureTarget
      ?? withdrawalTarget ?? chooseTarget(hostiles);
    if (target) {
      commands.push({
        type: COMMAND_SUPERWEAPON,
        args: [
          SUPERWEAPON_PLACE,
          airstrikeEntry.buildableType,
          airstrikeEntry.buildableId,
          target.cellX * CELL_PIXELS + CELL_PIXELS / 2,
          target.cellY * CELL_PIXELS + CELL_PIXELS / 2,
          0, 0,
        ],
      });
      state.airstrike.orders.push({
        tick: snapshot.tick,
        target: target.typeName,
        cellX: target.cellX,
        cellY: target.cellY,
        targetStrength: target.strength,
        withdrawalCandidates: withdrawalCandidates.map((candidate) => ({
          typeName: candidate.typeName,
          id: candidate.id,
          strength: candidate.strength,
          cellX: candidate.cellX,
          cellY: candidate.cellY,
          laneDistance: missionEightDistance(candidate, withdrawalLane),
        })),
      });
      state.airstrike.pending = {
        orderTick: snapshot.tick,
        targetKey: objectKey(target),
        targetType: target.typeName,
        targetStrength: target.strength,
      };
    }
  }
}

function missionEightThreatNear(hostiles, point, radius) {
  const priorities = new Map([["TRAN", 0], ["ARTY", 1], ["LTNK", 2], ["BGGY", 3], ["E4", 4], ["E3", 5], ["E1", 6], ["GUN", 7]]);
  return hostiles.filter((hostile) => missionEightDistance(hostile, point) <= radius)
    .toSorted((left, right) => (
      (priorities.get(left.typeName) ?? 20) - (priorities.get(right.typeName) ?? 20)
      || missionEightDistance(left, point) - missionEightDistance(right, point)
      || left.strength - right.strength
      || left.id - right.id
    ))[0];
}

function queueMissionEightRole(commands, role, group, target, flags = 0, cadence = 60) {
  if (group.length === 0 || !target) return;
  const last = missionEightState.roleOrderTicks.get(role) ?? -Infinity;
  if (currentTick - last < cadence) return;
  queueMissionEightContext(commands, group, target, flags);
  missionEightState.roleOrderTicks.set(role, currentTick);
}

function queueMissionEightStop(commands, role, group, cadence = 300) {
  if (group.length === 0) return;
  const last = missionEightState.roleOrderTicks.get(role) ?? -Infinity;
  if (currentTick - last < cadence) return;
  commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
  for (const object of group) {
    commands.push({
      type: COMMAND_SELECT_OBJECT,
      args: [object.type, object.id, 0, 0, 0, 0, 0],
    });
  }
  commands.push({ type: COMMAND_UNIT, args: [UNIT_REQUEST_STOP, 0, 0, 0, 0, 0, 0] });
  selectionCommands += group.length;
  missionEightState.roleOrderTicks.set(role, currentTick);
}

function queueMissionEightScout(snapshot, friendly, attackers, commands) {
  if (mission.variant !== "east-a") return;
  const state = missionEightState;
  if (state.assaultTick !== undefined) return;
  let scouts = attackers.filter((object) => state.scoutKeys.has(objectKey(object)));
  if (state.scoutStage >= missionEightEastAScoutRoute.length) {
    scouts = scouts.filter((object) => (
      objectKey(object) !== state.vehicleRepairActiveKey
      && objectKey(object) !== state.vehicleRepairClearKey
    ));
    queueMissionEightRole(commands, "scout-return", scouts, { cellX: 43, cellY: 50 }, MODIFIER_ALT, 90);
    return;
  }
  if (scouts.length === 0 && snapshot.tick < 7_200) {
    const replacement = attackers.filter((object) => !state.baseGuardKeys.has(objectKey(object)))
      .toSorted((left, right) => right.strength - left.strength || left.id - right.id)[0];
    if (replacement) {
      state.scoutKeys.add(objectKey(replacement));
      scouts = [replacement];
    }
  }
  const waypoint = missionEightEastAScoutRoute[state.scoutStage];
  if (scouts.some((scout) => missionEightDistance(scout, waypoint) <= 1)) {
    state.scoutArrivalTicks.push(snapshot.tick);
    state.scoutStage += 1;
  }
  const next = missionEightEastAScoutRoute[state.scoutStage];
  if (next) queueMissionEightRole(commands, "scout", scouts, next, MODIFIER_ALT, 60);
}

function queueMissionEightEngineer(snapshot, friendly, hostiles, commands) {
  const state = missionEightState;
  if (mission.variant !== "east-a" || state.engineer.key === undefined
    || state.engineer.captureTick !== undefined || state.engineer.deathTick !== undefined) return;
  const engineer = friendly.find((object) => objectKey(object) === state.engineer.key);
  if (engineer) clearMissionEightUnitRoleKey(state.engineer.key);

  if (state.engineer.transportKey === undefined) {
    const transport = friendly.filter((object) => (
      object.type === 2 && object.typeName === "APC"
    )).toSorted((left, right) => (
      Number(!state.scoutKeys.has(objectKey(left)))
        - Number(!state.scoutKeys.has(objectKey(right)))
      || right.strength / right.maxStrength - left.strength / left.maxStrength
      || left.id - right.id
    ))[0];
    if (transport) state.engineer.transportKey = objectKey(transport);
  }
  const transport = state.engineer.transportKey !== undefined
    ? friendly.find((object) => objectKey(object) === state.engineer.transportKey)
    : undefined;
  if (!transport && state.engineer.transportKey !== undefined) {
    state.engineer.transportDeathTick ??= snapshot.tick;
  }
  if (transport) clearMissionEightUnitRoleKey(state.engineer.transportKey);

  const replacementDecoyKey = state.engineer.replacementDecoyKey
    ?? (state.engineer.secondReplacementOrderTick !== undefined
      ? state.engineer.replacementKey : undefined);
  const replacementDecoy = replacementDecoyKey !== undefined
    ? friendly.find((object) => objectKey(object) === replacementDecoyKey)
    : undefined;
  if (replacementDecoy && state.engineer.replacementDecoyEscortInitializedTick === undefined) {
    state.engineer.replacementDecoyEscortInitializedTick = snapshot.tick;
    const escorts = friendly.filter((object) => (
      object.type === 1 && object.typeName !== "E6"
      && missionEightDistance(object, { cellX: 45, cellY: 50 }) <= 14
    )).toSorted((left, right) => (
      right.strength / right.maxStrength - left.strength / left.maxStrength
      || right.strength - left.strength
      || left.id - right.id
    )).slice(0, 14);
    for (const escort of escorts) {
      const key = objectKey(escort);
      clearMissionEightUnitRoleKey(key);
      state.engineer.replacementDecoyEscortKeys.add(key);
    }
  }
  const replacementDecoyEscorts = friendly.filter((object) => (
    state.engineer.replacementDecoyEscortKeys.has(objectKey(object))
  ));
  while (replacementDecoy
    && state.engineer.replacementDecoyStage < missionEightEastAReplacementDecoyRoute.length) {
    const waypoint = missionEightEastAReplacementDecoyRoute[
      state.engineer.replacementDecoyStage
    ];
    if (missionEightDistance(replacementDecoy, waypoint) > 2) break;
    state.engineer.replacementDecoyProgress.push({
      tick: snapshot.tick,
      stage: state.engineer.replacementDecoyStage,
      label: waypoint.label,
      cellX: waypoint.cellX,
      cellY: waypoint.cellY,
    });
    state.engineer.replacementDecoyStage += 1;
  }
  const replacementDecoyWaypoint = missionEightEastAReplacementDecoyRoute[
    state.engineer.replacementDecoyStage
  ];
  const decoyFact = hostiles.find((object) => (
    object.type === 4 && object.typeName === "FACT"
    && object.cellX === 8 && object.cellY === 11
  ));
  const replacementDecoyCanCapture = replacementDecoy
    && state.engineer.replacementDecoyStage >= 12
    && decoyFact;
  const replacementDecoyFinalScreenTarget = replacementDecoy
    && state.engineer.replacementDecoyStage >= 11
    ? { cellX: 5, cellY: 16 }
    : undefined;
  if (replacementDecoyFinalScreenTarget
    && state.engineer.replacementDecoyScreenTankKey === undefined
    && state.engineer.replacementDecoyScreenTankClearedTick === undefined) {
    const tank = hostiles.filter((hostile) => (
      hostile.type === 2 && hostile.typeName === "LTNK"
      && missionEightDistance(hostile, replacementDecoy) <= 20
    )).toSorted((left, right) => (
      missionEightDistance(left, replacementDecoy)
        - missionEightDistance(right, replacementDecoy)
      || left.strength - right.strength
      || left.id - right.id
    ))[0];
    if (tank) state.engineer.replacementDecoyScreenTankKey = objectKey(tank);
    else state.engineer.replacementDecoyScreenTankClearedTick = snapshot.tick;
  }
  const replacementDecoyScreenTank = state.engineer.replacementDecoyScreenTankKey
    ? hostiles.find((hostile) => (
      objectKey(hostile) === state.engineer.replacementDecoyScreenTankKey
    ))
    : undefined;
  if (state.engineer.replacementDecoyScreenTankKey !== undefined
    && !replacementDecoyScreenTank
    && state.engineer.replacementDecoyScreenTankClearedTick === undefined) {
    state.engineer.replacementDecoyScreenTankClearedTick = snapshot.tick;
  }
  if (replacementDecoyFinalScreenTarget
    && state.engineer.replacementDecoyScreenTankClearedTick !== undefined
    && state.engineer.replacementDecoyScreenReadyTick === undefined) {
    const arrivals = replacementDecoyEscorts.filter((escort) => (
      missionEightDistance(escort, replacementDecoyFinalScreenTarget) <= 2
    )).length;
    if (replacementDecoyEscorts.length === 0
      || arrivals >= Math.max(2, Math.ceil(replacementDecoyEscorts.length * 0.5))) {
      state.engineer.replacementDecoyScreenReadyTick = snapshot.tick;
    }
  }
  if (replacementDecoyFinalScreenTarget) {
    for (let index = 0; index < replacementDecoyEscorts.length; index += 10) {
      queueMissionEightRole(commands, `east-a-replacement-decoy-final-screen-${index / 10}`,
        replacementDecoyEscorts.slice(index, index + 10),
        replacementDecoyScreenTank ?? replacementDecoyFinalScreenTarget,
        replacementDecoyScreenTank ? 0 : MODIFIER_ALT, 30);
    }
  }
  if (replacementDecoyCanCapture
    && snapshot.tick - state.engineer.replacementDecoyLastOrderTick >= 60) {
    queueMissionEightContext(commands, [replacementDecoy], decoyFact);
    state.engineer.replacementDecoyLastOrderTick = snapshot.tick;
    state.engineer.captureOrders.push({
      tick: snapshot.tick,
      strength: replacementDecoy.strength,
      cellX: replacementDecoy.cellX,
      cellY: replacementDecoy.cellY,
      factStrength: decoyFact.strength,
      decoy: true,
    });
  } else if (replacementDecoy && replacementDecoyWaypoint
    && snapshot.tick - state.engineer.replacementDecoyLastOrderTick >= 60) {
    const screenStaging = state.engineer.replacementDecoyStage >= 11
      && state.engineer.replacementDecoyScreenReadyTick === undefined;
    queueMissionEightContext(commands, replacementDecoyFinalScreenTarget
      ? [replacementDecoy]
      : [replacementDecoy, ...replacementDecoyEscorts.slice(0, 9)],
    screenStaging ? { cellX: 4, cellY: 22 } : replacementDecoyWaypoint, MODIFIER_ALT);
    state.engineer.replacementDecoyLastOrderTick = snapshot.tick;
  }
  if (replacementDecoyKey !== undefined && state.engineer.key === replacementDecoyKey) return;

  const stagedBehindReplacementDecoy = engineer
    && state.engineer.key === state.engineer.secondReplacementKey
    && replacementDecoy
    && state.engineer.replacementDecoyStage < 7;
  if (stagedBehindReplacementDecoy) {
    queueMissionEightRole(commands, "east-a-capture-engineer-staging",
      [engineer], { cellX: 45, cellY: 55 }, MODIFIER_ALT, 90);
    return;
  }

  if (state.engineer.unloadedTick === undefined) {
    if (state.engineer.sealedTick === undefined) {
      if (engineer && transport && snapshot.tick - state.engineer.lastOrderTick >= 90) {
        queueMissionEightContext(commands, [engineer], transport);
        state.engineer.loadIssuedTick ??= snapshot.tick;
        state.engineer.lastOrderTick = snapshot.tick;
      }
      return;
    }
    if (!transport) return;
    const easternSamDead = !hostiles.some((hostile) => (
      hostile.typeName === "SAM" && hostile.cellX === 33 && hostile.cellY === 18
    ));
    if (!easternSamDead) return;
    const northernSamAlive = hostiles.some((hostile) => (
      hostile.typeName === "SAM" && hostile.cellX === 16 && hostile.cellY === 7
    ));
    const finalTransportStage = missionEightEastAEngineerTransportRoute.length - 1;
    while (state.engineer.transportRouteStage < finalTransportStage) {
      const stage = state.engineer.transportRouteStage;
      const transportWaypoint = missionEightEastAEngineerTransportRoute[stage];
      if (missionEightDistance(transport, transportWaypoint) > 2
        || (stage === 3 && northernSamAlive)) break;
      state.engineer.transportRouteProgress.push({
        tick: snapshot.tick,
        stage,
        label: transportWaypoint.label,
        cellX: transportWaypoint.cellX,
        cellY: transportWaypoint.cellY,
      });
      state.engineer.transportRouteStage += 1;
    }
    const transportWaypoint = missionEightEastAEngineerTransportRoute[
      state.engineer.transportRouteStage
    ];
    const northernSam = hostiles.find((hostile) => (
      hostile.typeName === "SAM" && hostile.cellX === 16 && hostile.cellY === 7
    ));
    if (state.engineer.transportRouteStage === 3 && northernSam
      && missionEightDistance(transport, northernSam) <= 5) {
      if (snapshot.tick - state.engineer.lastOrderTick >= 60) {
        queueMissionEightContext(commands, [transport], northernSam);
        state.engineer.lastOrderTick = snapshot.tick;
      }
      return;
    }
    let transportTarget = transportWaypoint;
    let capturing = false;
    if (state.engineer.transportRouteStage === finalTransportStage
      && (missionEightDistance(transport, transportWaypoint) <= 2
        || state.engineer.transportCounterattackTick !== undefined)) {
      if (state.postSamCounterattackLaunchTick === undefined) return;
      state.engineer.transportCounterattackTick ??= snapshot.tick;
      const westernGun = hostiles.find((hostile) => (
        hostile.typeName === "GUN" && hostile.cellX === 21 && hostile.cellY === 19
      ));
      if (state.postSamCounterattackStage
        < missionEightEastAPostSamFirstTargetStage) {
        transportTarget = missionEightEastAPostSamCounterattackRoute[
          state.postSamCounterattackStage
        ];
      } else if (westernGun) {
        // Let the infantry and airstrike remove the turret while the loaded
        // APC waits outside its range. The engineer is the mission-critical
        // payload, not another member of the assault wave.
        transportTarget = missionEightEastAEngineerTransportReserve;
      }
      else {
        transportTarget = missionEightEastAEngineerUnloadApproach;
        capturing = true;
      }
    }
    if (capturing && missionEightDistance(transport, transportTarget) <= 1) {
      state.engineer.unloadApproachTick ??= snapshot.tick;
      if (state.engineer.unloadStagedTick === undefined) {
        queueMissionSevenStop(commands, [transport]);
        state.engineer.unloadStagedTick = snapshot.tick;
        state.engineer.lastOrderTick = snapshot.tick;
      } else if (snapshot.tick >= state.engineer.unloadStagedTick + 60
        && snapshot.tick - state.engineer.lastOrderTick >= 90) {
        queueMissionEightContext(commands, [transport], {
          cellX: transport.cellX,
          cellY: transport.cellY,
          worldX: Math.round(transport.centerX * CELL_PIXELS / 256),
          worldY: Math.round(transport.centerY * CELL_PIXELS / 256),
        });
        state.engineer.unloadIssuedTick ??= snapshot.tick;
        state.engineer.lastOrderTick = snapshot.tick;
      }
    } else if (missionEightDistance(transport, transportTarget) <= 1) {
      // A context click on an occupied APC is its deploy action, so holding
      // waypoints must remain command-free while the engineer is still cargo.
      return;
    } else if (snapshot.tick - state.engineer.lastOrderTick >= 90) {
      queueMissionEightContext(commands, [transport], transportTarget,
        transportTarget.typeName ? 0 : MODIFIER_ALT);
      state.engineer.lastOrderTick = snapshot.tick;
    }
    return;
  }

  if (state.engineer.footEscortInitializedTick === undefined) {
    state.engineer.footEscortInitializedTick = snapshot.tick;
    const emergencySupport = state.engineer.unloadedTick !== undefined && engineer
      ? friendly.filter((object) => (
        (object.type === 1 || object.type === 2)
        && object.typeName !== "E6"
        && objectKey(object) !== state.engineer.transportKey
        && missionEightDistance(object, engineer) <= 8
      )).toSorted((left, right) => (
        Number(left.typeName !== "E3") - Number(right.typeName !== "E3")
        || missionEightDistance(left, engineer) - missionEightDistance(right, engineer)
        || right.strength / right.maxStrength - left.strength / left.maxStrength
        || right.strength - left.strength
        || left.id - right.id
      )).slice(0, 10)
      : [];
    const support = emergencySupport.length > 0 ? emergencySupport
      : friendly.filter((object) => (
        object.type === 1 && state.baseGuardKeys.has(objectKey(object))
      )).toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || right.strength - left.strength
        || left.id - right.id
      )).slice(0, 10);
    for (const unit of support) {
      const key = objectKey(unit);
      clearMissionEightUnitRoleKey(key);
      state.engineer.footEscortKeys.add(key);
    }
  }
  const footEscorts = friendly.filter((object) => (
    state.engineer.footEscortKeys.has(objectKey(object))
  ));
  const footDecoys = friendly.filter((object) => (
    state.engineer.footDecoyKeys.has(objectKey(object))
  ));
  const footDecoyRoute = missionEightEastASouthTransitRoute.slice(0, 10);
  while (state.engineer.footDecoyStage < footDecoyRoute.length && footDecoys.length > 0) {
    const decoyWaypoint = footDecoyRoute[state.engineer.footDecoyStage];
    const arrivals = footDecoys.filter((unit) => (
      missionEightDistance(unit, decoyWaypoint) <= 3
    )).length;
    if (arrivals < Math.max(1, Math.ceil(footDecoys.length * 0.5))) break;
    state.engineer.footDecoyProgress.push({
      tick: snapshot.tick,
      stage: state.engineer.footDecoyStage,
      label: decoyWaypoint.label,
      cellX: decoyWaypoint.cellX,
      cellY: decoyWaypoint.cellY,
      arrivals,
    });
    state.engineer.footDecoyStage += 1;
  }
  const footDecoyWaypoint = footDecoyRoute[
    Math.min(state.engineer.footDecoyStage, footDecoyRoute.length - 1)
  ];
  for (let index = 0; index < footDecoys.length; index += 10) {
    queueMissionEightRole(commands, `east-a-engineer-foot-decoy-${index / 10}`,
      footDecoys.slice(index, index + 10), footDecoyWaypoint, MODIFIER_ALT, 45);
  }
  if (footDecoys.length > 0 && state.engineer.footDecoyStage < 7) {
    if (engineer) {
      queueMissionEightRole(commands, "east-a-engineer-north-staging",
        [engineer, ...footEscorts], { cellX: 45, cellY: 50 }, MODIFIER_ALT, 90);
    }
    return;
  }

  const emergencyFootIngress = state.engineer.unloadedTick !== undefined
    && state.engineer.transportDeathTick !== undefined;
  const armoredDelivery = state.engineer.unloadedTick !== undefined
    && state.engineer.transportDeathTick === undefined;
  const engineerCaptureRoute = armoredDelivery ? [] : emergencyFootIngress
    ? missionEightEastAEmergencyEngineerRoute : missionEightEastAEngineerRoute;
  const stageProperty = emergencyFootIngress ? "emergencyIngressStage" : "transitStage";
  while (state.engineer[stageProperty] < engineerCaptureRoute.length) {
    const waypoint = engineerCaptureRoute[state.engineer[stageProperty]];
    if (!engineer || missionEightDistance(engineer, waypoint) > 2) break;
    const progress = {
      tick: snapshot.tick,
      stage: state.engineer[stageProperty],
      label: waypoint.label,
      cellX: waypoint.cellX,
      cellY: waypoint.cellY,
    };
    state.engineer.transitProgress.push(progress);
    if (emergencyFootIngress) state.engineer.emergencyIngressProgress.push(progress);
    state.engineer[stageProperty] += 1;
  }

  const finalEngineerScreenHold = { cellX: 21, cellY: 17 };
  const finalScreenThreat = emergencyFootIngress && engineer
    ? hostiles.filter((hostile) => (
      (hostile.type === 1 || hostile.type === 2)
      && missionEightDistance(hostile,
        missionEightEastAEmergencyEngineerRoute.at(-1)) <= 4
    )).toSorted((left, right) => (
      (missionEightEastAWestScreenPriorities.get(left.typeName) ?? 99)
        - (missionEightEastAWestScreenPriorities.get(right.typeName) ?? 99)
      || missionEightDistance(left, engineer) - missionEightDistance(right, engineer)
      || left.strength - right.strength
      || left.id - right.id
    ))[0]
    : undefined;
  if (finalScreenThreat && footEscorts.length > 0) {
    const finalScreenThreatVisible = snapshot.shroud.isVisible(
      finalScreenThreat.cellX, finalScreenThreat.cellY,
    );
    const finalScreenTarget = finalScreenThreatVisible
      ? finalScreenThreat : missionEightEastAEmergencyEngineerRoute[0];
    for (let index = 0; index < footEscorts.length; index += 10) {
      queueMissionEightRole(commands, `east-a-engineer-final-screen-${index / 10}`,
        footEscorts.slice(index, index + 10), finalScreenTarget, 0, 30);
    }
    // STOP does not cancel an infantry path that is already committed in the
    // classic simulation. Pull the engineer back onto the cleared approach
    // instead, buying the rifle screen enough time to eliminate the artillery.
    queueMissionEightRole(commands, "east-a-engineer-final-hold",
      [engineer], finalEngineerScreenHold, MODIFIER_ALT, 30);
    state.engineer.lastOrderTick = snapshot.tick;
    return;
  }

  const waypoint = engineerCaptureRoute[state.engineer[stageProperty]];
  if (waypoint) {
    const pursuitThreat = engineer ? hostiles.filter((hostile) => (
      (hostile.type === 1 || hostile.type === 2)
      && missionEightDistance(hostile, engineer) <= 10
    )).toSorted((left, right) => (
      missionEightDistance(left, engineer) - missionEightDistance(right, engineer)
      || (missionEightEastAWestScreenPriorities.get(left.typeName) ?? 99)
        - (missionEightEastAWestScreenPriorities.get(right.typeName) ?? 99)
      || left.strength - right.strength
      || left.id - right.id
    ))[0] : undefined;
    if (pursuitThreat && footEscorts.length > 0) {
      for (let index = 0; index < footEscorts.length; index += 10) {
        queueMissionEightRole(commands, `east-a-engineer-rear-screen-${index / 10}`,
          footEscorts.slice(index, index + 10), pursuitThreat, 0, 30);
      }
    }
    if (engineer && (snapshot.tick === state.engineer.unloadedTick
      || snapshot.tick - state.engineer.lastOrderTick >= 90)) {
      queueMissionEightContext(commands, pursuitThreat ? [engineer] : [engineer, ...footEscorts.slice(0, 9)],
        waypoint, MODIFIER_ALT);
      for (let index = pursuitThreat ? footEscorts.length : 9;
        index < footEscorts.length; index += 10) {
        queueMissionEightContext(commands, footEscorts.slice(index, index + 10),
          waypoint, MODIFIER_ALT);
      }
      state.engineer.lastOrderTick = snapshot.tick;
    }
    return;
  }

  const fact = hostiles.find((object) => (
    object.type === 4 && object.typeName === "FACT"
    && object.cellX === 8 && object.cellY === 11
  ));
  if (engineer && fact && snapshot.shroud.isVisible(fact.cellX, fact.cellY)
    && snapshot.tick - state.engineer.lastOrderTick >= 60) {
    queueMissionEightContext(commands, [engineer], fact);
    state.engineer.lastOrderTick = snapshot.tick;
    state.engineer.captureOrderTick ??= snapshot.tick;
    state.engineer.captureOrders.push({
      tick: snapshot.tick,
      strength: engineer.strength,
      cellX: engineer.cellX,
      cellY: engineer.cellY,
      factStrength: fact.strength,
    });
  }
}

function missionEightAssignRoles(snapshot, attackers, hostiles = []) {
  const state = missionEightState;
  for (const keys of [
    state.villageGuardKeys,
    state.baseGuardKeys,
    state.scoutKeys,
    state.strikeKeys,
    state.northHoldKeys,
    state.postSamNorthFlankKeys,
    state.southReadyKeys,
    state.southRearGuardKeys,
    state.secondWaveKeys,
    state.thirdWaveKeys,
    state.northReinforcementKeys,
    state.engineer.footEscortKeys,
    state.engineer.footDecoyKeys,
    state.postFactHomeDefenseKeys,
    state.postSamCounterattackKeys,
    state.postSamNorthSupportKeys,
  ]) {
    for (const key of keys) if (!attackers.some((attacker) => objectKey(attacker) === key)) keys.delete(key);
  }
  const unassigned = attackers.filter((attacker) => (
    !state.villageGuardKeys.has(objectKey(attacker))
    && !state.baseGuardKeys.has(objectKey(attacker))
    && !state.scoutKeys.has(objectKey(attacker))
    && !state.strikeKeys.has(objectKey(attacker))
    && !state.northHoldKeys.has(objectKey(attacker))
    && !state.southReadyKeys.has(objectKey(attacker))
    && !state.southRearGuardKeys.has(objectKey(attacker))
    && !state.secondWaveKeys.has(objectKey(attacker))
    && !state.thirdWaveKeys.has(objectKey(attacker))
    && !state.northReinforcementKeys.has(objectKey(attacker))
    && !state.engineer.footEscortKeys.has(objectKey(attacker))
    && !state.engineer.footDecoyKeys.has(objectKey(attacker))
    && !state.engineer.replacementDecoyEscortKeys.has(objectKey(attacker))
    && !state.postFactHomeDefenseKeys.has(objectKey(attacker))
    && !state.postSamCounterattackKeys.has(objectKey(attacker))
    && !state.postSamNorthSupportKeys.has(objectKey(attacker))
    && !(mission.variant === "east-b" && state.assaultTick === undefined
      && state.eastBProducedTankKeys.has(objectKey(attacker)))
  ));
  if (mission.variant === "east-b") {
    // Village first pre-assault — base fill used to starve hospital replacements.
    // Post-assault: free armor streams to the western strike (TRACE: village size
    // cap of 8 ate every new unit, so strike stayed at 2 MTNKs and died at stage 3).
    const villageTankTarget = snapshot.tick < 20_000
      ? missionEightEastBVillageTankCount
      : missionEightEastBVillageTankCountLate;
    const liveVillageInfantry = attackers.filter((unit) => (
      unit.type === 1 && state.villageGuardKeys.has(objectKey(unit))
    )).length;
    const westernSamForAssign = hostiles.find((hostile) => (
      hostile.typeName === "SAM" && hostile.cellX === 13 && hostile.cellY === 16
    ));
    const samNeedsFinish = Boolean(
      state.assaultTick !== undefined
      && westernSamForAssign
      && westernSamForAssign.strength < westernSamForAssign.maxStrength
    );
    for (const attacker of unassigned) {
      if (attacker.typeName === "MCV" || attacker.typeName === "HARV") continue;
      const key = objectKey(attacker);
      const liveVillageTanks = attackers.filter((unit) => (
        unit.typeName === "MTNK" && state.villageGuardKeys.has(objectKey(unit))
      )).length;
      // While a chipped western SAM is still up, free MTNKs go to the strike —
      // never the village (TRACE v60 re-homed a fresh tank with SAM@314).
      if (attacker.typeName === "MTNK"
        && liveVillageTanks < villageTankTarget
        && !samNeedsFinish) {
        state.villageGuardKeys.add(key);
        continue;
      }
      if (state.assaultTick !== undefined) {
        if (attacker.typeName === "MTNK" || attacker.type === 2
          || (attacker.type === 1 && liveVillageInfantry >= 6)) {
          state.strikeKeys.add(key);
          continue;
        }
      }
      if (state.villageGuardKeys.size < (state.assaultTick !== undefined ? 6 : 8)) {
        state.villageGuardKeys.add(key);
      } else if (state.baseGuardKeys.size < (state.assaultTick !== undefined ? 4 : 8)) {
        state.baseGuardKeys.add(key);
      } else if (state.assaultTick !== undefined) state.strikeKeys.add(key);
    }
  } else if (state.assaultTick !== undefined) {
    for (const attacker of unassigned) {
      if (state.baseGuardReleaseTick === undefined && state.baseGuardKeys.size < 10) {
        state.baseGuardKeys.add(objectKey(attacker));
      }
      else if (state.secondWaveLaunchTick !== undefined && state.thirdWaveJoinTick === undefined) {
        state.thirdWaveKeys.add(objectKey(attacker));
      }
      else state.strikeKeys.add(objectKey(attacker));
    }
  }

  const builtAssets = new Set(snapshot.objects.filter((object) => (
    object.owner === HOUSE_GDI && object.subObject === 0 && object.type === 4 && object.strength > 0
  )).map((object) => object.typeName));
  const stagedEastBTanks = mission.variant === "east-b" ? attackers.filter((attacker) => (
    attacker.typeName === "MTNK"
    && state.eastBProducedTankKeys.has(objectKey(attacker))
    && !state.villageGuardKeys.has(objectKey(attacker))
    && attacker.strength >= Math.ceil(attacker.maxStrength * 0.75)
    // Assembly OR reserve OR the corridor between them. TRACE: flipping the
    // parking cell at 27k put tanks in transit outside both old radii so the
    // free-tank assault gate never closed.
    && (missionEightDistance(attacker, missionEightEastBTankReserve) <= 8
      || missionEightDistance(attacker, missionEightEastBTankAssembly) <= 6
      || (attacker.cellY >= 54 && attacker.cellY <= 60
        && attacker.cellX >= 25 && attacker.cellX <= 42))
  )) : [];
  const villageArmorAlive = mission.variant === "east-b"
    ? attackers.filter((attacker) => (
      attacker.typeName === "MTNK" && state.villageGuardKeys.has(objectKey(attacker))
      && attacker.strength > 0
    )).length
    : 0;
  const civilianDeaths = mission.variant === "east-b"
    ? Math.max(
      state.eastBNeutralDeaths.length,
      state.initialNeutralUnitKeys.size - state.minimumNeutralUnits,
    )
    : 0;
  // After the early civil window, require only 1 village tank for launch so a
  // dead hospital guard cannot hard-block the western assault forever
  // (TRACE v32: village MTNK died ~25.8k, free tanks protected from re-absorb,
  // villageArmorAlive=0, assault never fired).
  const eastBVillageTankGate = snapshot.tick < 20_000
    ? missionEightEastBVillageTankCount
    : 1;
  // Prefer a follow-up MTNK in production, but do not hard-block the assault
  // past a short pad (TRACE v32–38: waiting for 800 cash delayed to ~37k without
  // improving the SAM kill, while early 22k assaults still chipped to ~278).
  const eastBFollowUpTankReady = mission.variant !== "east-b" || (
    snapshot.sidebar.entries.some((entry) => (
      entry.assetName === "MTNK" && (entry.constructing || entry.completed)
    ))
    || (snapshot.sidebar.credits + snapshot.sidebar.tiberium) >= 800
    || attackers.filter((attacker) => (
      attacker.typeName === "MTNK"
      && state.eastBProducedTankKeys.has(objectKey(attacker))
      && !state.villageGuardKeys.has(objectKey(attacker))
    )).length >= missionEightEastBAssaultTankCount + 1
    || snapshot.tick >= missionEightEastBAssaultMinTick + 6_000
  );
  const assaultReady = mission.variant === "east-a"
    ? state.vehicleRepairCompleteTick !== undefined
      && snapshot.tick >= 5_400 && attackers.length >= 54
    : builtAssets.has("PROC") && builtAssets.has("WEAP")
      && civilianDeaths <= missionEightEastBMaxCivilianDeathsBeforeAssault
      && villageArmorAlive >= eastBVillageTankGate
      && stagedEastBTanks.length >= missionEightEastBAssaultTankCount
      && snapshot.tick >= missionEightEastBAssaultMinTick
      && eastBFollowUpTankReady;
  if (state.assaultTick === undefined && assaultReady) {
    state.assaultTick = snapshot.tick;
    state.assaultWave = 1;
    if (mission.variant === "east-a") {
      const strongest = (candidates) => candidates.toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || right.strength - left.strength
        || left.id - right.id
      ));
      const infantryReserve = strongest(attackers.filter((attacker) => attacker.type === 1)).slice(0, 10);
      state.baseGuardKeys.clear();
      for (const guard of infantryReserve) {
        state.baseGuardKeys.add(objectKey(guard));
      }
      const reserve = new Set(state.baseGuardKeys);
      const assaultCandidates = attackers.filter((attacker) => !reserve.has(objectKey(attacker)))
        .toSorted((left, right) => (
          (left.type === 2 ? 0 : 1) - (right.type === 2 ? 0 : 1)
          || right.strength / right.maxStrength - left.strength / left.maxStrength
          || left.id - right.id
        ));
      const northernVehicles = [
        ...strongest(assaultCandidates.filter((attacker) => attacker.typeName === "MTNK")).slice(0, 1),
        ...strongest(assaultCandidates.filter((attacker) => attacker.typeName === "MSAM")).slice(0, 2),
        ...strongest(assaultCandidates.filter((attacker) => attacker.typeName === "APC")).slice(0, 1),
        ...strongest(assaultCandidates.filter((attacker) => attacker.typeName === "JEEP")).slice(0, 1),
      ];
      for (const vehicle of strongest(assaultCandidates.filter((attacker) => attacker.type === 2))) {
        if (northernVehicles.length === 5) break;
        if (!northernVehicles.includes(vehicle)) northernVehicles.push(vehicle);
      }
      const northernVehicleKeys = new Set(northernVehicles.map(objectKey));
      const southernVehicles = assaultCandidates.filter((attacker) => (
        attacker.type === 2 && !northernVehicleKeys.has(objectKey(attacker))
      ));
      const southernVehicleKeys = new Set(southernVehicles.map(objectKey));
      const northernCandidates = assaultCandidates.filter((attacker) => (
        !southernVehicleKeys.has(objectKey(attacker))
      ));
      for (const attacker of northernCandidates.slice(0, 26)) {
        state.strikeKeys.add(objectKey(attacker));
      }
      for (const attacker of [...southernVehicles, ...northernCandidates.slice(26)]) {
        state.secondWaveKeys.add(objectKey(attacker));
      }
    } else {
      // East-b: free produced MTNKs + healthy base vehicles. Keep a thin base
      // infantry screen home. Skip half-dead scrap (TRACE: 5–32 HP MSAMs die
      // without helping GUN/SAM).
      const baseInfantry = attackers.filter((attacker) => (
        attacker.type === 1 && state.baseGuardKeys.has(objectKey(attacker))
      )).toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || left.id - right.id
      ));
      const baseInfantryKeep = new Set(
        baseInfantry.slice(0, 3).map((unit) => objectKey(unit)),
      );
      const reserve = new Set([
        ...state.villageGuardKeys,
        ...baseInfantryKeep,
        ...state.scoutKeys,
      ]);
      for (const attacker of attackers) {
        if (attacker.typeName === "MCV" || attacker.typeName === "HARV") continue;
        const key = objectKey(attacker);
        if (reserve.has(key)) continue;
        if (state.baseGuardKeys.has(key)
          && attacker.strength < Math.ceil(attacker.maxStrength * 0.6)) {
          continue;
        }
        // Keep one half-healthy base MTNK home if we already have ≥2 free tanks.
        if (state.baseGuardKeys.has(key) && attacker.typeName === "MTNK") {
          const freeTanks = attackers.filter((unit) => (
            unit.typeName === "MTNK"
            && state.eastBProducedTankKeys.has(objectKey(unit))
            && !state.villageGuardKeys.has(objectKey(unit))
          )).length;
          if (freeTanks >= 2 && attacker.strength < Math.ceil(attacker.maxStrength * 0.75)) {
            continue;
          }
        }
        state.baseGuardKeys.delete(key);
        state.strikeKeys.add(key);
      }
      // Rocket infantry for GUN/SAM building DPS. Prefer base E3; also take
      // surplus village E3 beyond two guards so the launch always has rockets
      // (TRACE v37: zero E3 joined because base keep ate the only healthy ones).
      const villageE3 = attackers.filter((attacker) => (
        attacker.typeName === "E3" && state.villageGuardKeys.has(objectKey(attacker))
      )).toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || left.id - right.id
      ));
      const villageE3Keep = new Set(villageE3.slice(0, 2).map((unit) => objectKey(unit)));
      const rocketLoans = attackers.filter((attacker) => (
        attacker.typeName === "E3"
        && !state.strikeKeys.has(objectKey(attacker))
        && !villageE3Keep.has(objectKey(attacker))
        && attacker.strength >= Math.ceil(attacker.maxStrength * 0.5)
      )).toSorted((left, right) => (
        Number(state.villageGuardKeys.has(objectKey(left)))
          - Number(state.villageGuardKeys.has(objectKey(right)))
        || right.strength / right.maxStrength - left.strength / left.maxStrength
        || left.id - right.id
      )).slice(0, 4);
      for (const rocket of rocketLoans) {
        const key = objectKey(rocket);
        state.baseGuardKeys.delete(key);
        state.villageGuardKeys.delete(key);
        state.strikeKeys.add(key);
      }
      // Wave-two: only pre-rail base scrap MTNK to the support hold. Do NOT hold
      // a free produced tank back — TRACE v56 left a 2-tank first wave that died
      // on the GUN with SAM untouched (v55's 3 free + base scrap chipped to 203).
      for (const tank of attackers.filter((attacker) => (
        attacker.typeName === "MTNK"
        && state.baseGuardKeys.has(objectKey(attacker))
        && attacker.strength >= 40
      ))) {
        const key = objectKey(tank);
        state.baseGuardKeys.delete(key);
        state.strikeKeys.add(key);
        state.eastBWaveTwoKeys.add(key);
      }
    }
    state.routeStageStartedTick = snapshot.tick;
  }
  if (mission.variant === "east-a" && state.assaultTick !== undefined
    && state.secondWaveLaunchTick === undefined && state.secondWaveKeys.size > 0
    && (state.samDeathTicks.size >= 2
      || state.routeStage >= 8
      || (state.routeStage >= 7 && state.strikeKeys.size <= 6)
      || (state.samDeathTicks.size >= 1 && state.strikeKeys.size === 0))) {
    state.secondWaveLaunchTick = snapshot.tick;
    state.assaultWave = 2;
    if (state.routeStage >= 7 && state.strikeKeys.size <= 6) {
      const secondWave = attackers.filter((attacker) => (
        state.secondWaveKeys.has(objectKey(attacker))
      ));
      const strongest = (candidates) => candidates.toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || right.strength - left.strength
        || left.id - right.id
      ));
      const northReinforcements = [
        ...attackers.filter((attacker) => state.baseGuardKeys.has(objectKey(attacker))),
        ...strongest(secondWave.filter((attacker) => attacker.typeName === "MTNK")).slice(0, 1),
      ];
      for (const reinforcement of northReinforcements) {
        const key = objectKey(reinforcement);
        state.secondWaveKeys.delete(key);
        state.baseGuardKeys.delete(key);
        state.northReinforcementKeys.add(key);
        state.secondWaveCohortKeys.add(key);
      }
      if (northReinforcements.length > 0) state.northReinforcementTick = snapshot.tick;
    }
  }
  if (mission.variant === "east-a" && state.thirdWaveLaunchTick === undefined
    && state.baseGuardKeys.size < 10 && state.thirdWaveKeys.size > 0) {
    const needed = 10 - state.baseGuardKeys.size;
    const replacements = attackers.filter((attacker) => (
      state.thirdWaveKeys.has(objectKey(attacker))
    )).toSorted((left, right) => (
      right.strength / right.maxStrength - left.strength / left.maxStrength
      || left.id - right.id
    )).slice(0, needed);
    for (const replacement of replacements) {
      const key = objectKey(replacement);
      state.thirdWaveKeys.delete(key);
      state.baseGuardKeys.add(key);
    }
  }
  if (mission.variant === "east-a" && state.secondWaveLaunchTick !== undefined
    && state.thirdWaveLaunchTick === undefined && state.thirdWaveKeys.size >= 18
    && snapshot.tick >= state.secondWaveLaunchTick + 3_000) {
    state.thirdWaveLaunchTick = snapshot.tick;
    state.assaultWave = 3;
  }
  if (mission.variant === "east-b" && state.assaultTick !== undefined) {
    // Stream free produced MTNKs into the strike. When the western front is thin
    // (≤2 strike tanks) also loan one healthy base MTNK as emergency SAM finish
    // (TRACE v22: SAM left at 298–364 with strike empty).
    const villageTankTarget = snapshot.tick < 20_000
      ? missionEightEastBVillageTankCount
      : missionEightEastBVillageTankCountLate;
    const liveVillageTanks = attackers.filter((unit) => (
      unit.typeName === "MTNK" && state.villageGuardKeys.has(objectKey(unit))
    )).length;
    const westernSam = hostiles.find((hostile) => (
      hostile.typeName === "SAM" && hostile.cellX === 13 && hostile.cellY === 16
    ));
    const corridorStrikeTanks = attackers.filter((unit) => (
      unit.typeName === "MTNK"
      && state.strikeKeys.has(objectKey(unit))
      && unit.cellY <= 24 && unit.cellX >= 10 && unit.cellX <= 15
    )).length;
    const holdFirstWaveStack = Boolean(
      westernSam
      && westernSam.strength > 280
      && state.routeStage >= 5
      && state.routeStage <= 7
      && corridorStrikeTanks >= 2
    );
    if (westernSam && westernSam.strength <= 220) {
      state.eastBSamDeepChip = true;
    }
    if (!westernSam || westernSam.strength === 0) {
      state.eastBSamDeepChip = false;
    }
    const samKillWindow = Boolean(
      state.eastBSamDeepChip
      && westernSam
      && westernSam.strength > 0
    );
    const demoteFarSamFinishers = () => {
      if (!samKillWindow) return;
      for (const tank of attackers) {
        if (tank.typeName !== "MTNK" || tank.strength < 40) continue;
        const key = objectKey(tank);
        if (!state.strikeKeys.has(key)) continue;
        const farFromSamFinish = tank.cellY >= 32 || tank.cellX <= 8 || tank.cellX >= 18;
        if (!farFromSamFinish) continue;
        const onFinishPath = (tank.cellY <= 40 && tank.cellX >= 10 && tank.cellX <= 15)
          || missionEightDistance(tank, missionEightEastBTankAssembly) <= 8
          || missionEightDistance(tank, missionEightEastBTankReserve) <= 8;
        if (onFinishPath) continue;
        state.strikeKeys.delete(key);
        state.baseGuardKeys.delete(key);
        if (tank.cellX <= 8 && tank.cellY >= 40) {
          state.villageGuardKeys.add(key);
        } else {
          state.baseGuardKeys.add(key);
        }
      }
    };
    demoteFarSamFinishers();
    if (state.routeStage >= 6) {
      for (const tank of attackers) {
        if (tank.typeName !== "MTNK" || tank.strength < 40) continue;
        const key = objectKey(tank);
        if (!state.strikeKeys.has(key)) continue;
        if (tank.cellX >= 10 && tank.cellY <= 40) continue;
        state.strikeKeys.delete(key);
        state.baseGuardKeys.add(key);
      }
    }
    let strikeTanksLive = attackers.filter((unit) => (
      unit.typeName === "MTNK" && state.strikeKeys.has(objectKey(unit))
    )).length;
    // Release wave-two at the firing line so they roll into GUN/SAM with the
    // first wave instead of waiting one stage further south. Keep base scrap on
    // the support hold through the first-wave chip (TRACE v119: id6@12,32 diluted
    // the 32100 stack).
    if (state.routeStage >= 4) {
      if (!westernSam || westernSam.strength <= 280) {
        state.eastBWaveTwoKeys.clear();
      }
    } else {
      for (const key of [...state.eastBWaveTwoKeys]) {
        if (!attackers.some((attacker) => objectKey(attacker) === key && attacker.strength > 0)) {
          state.eastBWaveTwoKeys.delete(key);
        }
      }
    }
    // Pre-march village armor once free tanks hit the gate. If the SAM is
    // chipped at all and the strike is empty, loan even the last hospital
    // tank (TRACE v60: second village tank sat at 146 HP while SAM@314 because
    // the 0.65 gate blocked the follow-up loan).
    const loanVillageForSamFinish = Boolean(
      liveVillageTanks >= 1
      && state.routeStage >= 5
      && (
        liveVillageTanks >= 2
        || (westernSam
          && westernSam.strength < westernSam.maxStrength
          && strikeTanksLive <= 3)
      )
    );
    const samFinishUrgent = Boolean(
      westernSam
      && westernSam.strength < westernSam.maxStrength
      && westernSam.strength <= 320
      && strikeTanksLive <= 2
    );
    const maxVillageLoans = (samFinishUrgent || (westernSam
      && westernSam.strength < westernSam.maxStrength
      && strikeTanksLive <= 3)) ? 2 : 1;
    const joiners = attackers.filter((attacker) => {
      const key = objectKey(attacker);
      if (state.scoutKeys.has(key) || state.strikeKeys.has(key)) return false;
      if (attacker.typeName === "MCV" || attacker.typeName === "HARV") return false;
      if (attacker.typeName === "MTNK") {
        if (state.villageGuardKeys.has(key)) {
          if (holdFirstWaveStack || samKillWindow) return false;
          return loanVillageForSamFinish && attacker.strength >= 20;
        }
        if (state.baseGuardKeys.has(key)) {
          if (holdFirstWaveStack || samKillWindow) return false;
          if (samFinishUrgent && attacker.strength >= 20) {
            return true;
          }
          if (westernSam && westernSam.strength < westernSam.maxStrength
            && strikeTanksLive <= 2
            && attacker.strength >= 40) {
            return true;
          }
          if (westernSam && westernSam.strength <= westernSam.maxStrength * 0.55
            && strikeTanksLive <= 1
            && attacker.strength >= 40) {
            return true;
          }
          return strikeTanksLive <= 2
            && attacker.strength >= Math.ceil(attacker.maxStrength * 0.6);
        }
        // Never divert a fresh free tank into village duty while the western
        // SAM is chipped — TRACE v60 re-absorbed MTNK#1 into village@37200
        // with SAM@314 and funds for more armor.
        if (westernSam && westernSam.strength < westernSam.maxStrength
          && state.eastBProducedTankKeys.has(key)
          && !state.baseGuardKeys.has(key)) {
          if (holdFirstWaveStack) return false;
          return true;
        }
        if (samFinishUrgent && state.eastBProducedTankKeys.has(key)) {
          if (holdFirstWaveStack) return false;
          return true;
        }
        if (liveVillageTanks < villageTankTarget
          && state.eastBProducedTankKeys.has(key)) return false;
        if (holdFirstWaveStack || samKillWindow) return false;
        return true;
      }
      if (state.villageGuardKeys.has(key)) return false;
      if (attacker.typeName === "E3" && !state.baseGuardKeys.has(key)) {
        return true;
      }
      if (state.baseGuardKeys.has(key)) return false;
      return attacker.typeName === "JEEP";
    });
    // Loan up to two village tanks when the SAM is nearly dead and strike empty.
    let villageLoansTaken = 0;
    const maxVillageLoansJoin = maxVillageLoans;
    if (joiners.length > 0) {
      if (state.strikeKeys.size === 0) state.assaultWave += 1;
      for (const attacker of joiners) {
        const key = objectKey(attacker);
        if (state.villageGuardKeys.has(key)) {
          if (villageLoansTaken >= maxVillageLoansJoin) continue;
          villageLoansTaken += 1;
          state.villageGuardKeys.delete(key);
        }
        state.baseGuardKeys.delete(key);
        state.strikeKeys.add(key);
      }
    }
    if (samKillWindow) {
      if (westernSam && westernSam.strength <= 220) {
        for (const tank of attackers) {
          if (tank.typeName !== "MTNK" || tank.strength < 40) continue;
          const key = objectKey(tank);
          if (!state.eastBWaveTwoKeys.has(key)) continue;
          if (tank.cellY > 32 || tank.cellX < 10 || tank.cellX > 15) continue;
          state.strikeKeys.add(key);
          state.eastBWaveTwoKeys.delete(key);
        }
      }
      demoteFarSamFinishers();
      for (const tank of attackers) {
        if (tank.typeName !== "MTNK" || tank.strength < 40) continue;
        const key = objectKey(tank);
        if (state.eastBProducedTankKeys.has(key) && !state.villageGuardKeys.has(key)) {
          state.strikeKeys.add(key);
          state.baseGuardKeys.delete(key);
          state.eastBWaveTwoKeys.delete(key);
          continue;
        }
        if (state.strikeKeys.has(key) || state.scoutKeys.has(key)) continue;
        if (state.villageGuardKeys.has(key)) continue;
        const onSpine = tank.cellY <= 40 && tank.cellX >= 10 && tank.cellX <= 15;
        if (onSpine) {
          state.strikeKeys.add(key);
          state.baseGuardKeys.delete(key);
          state.villageGuardKeys.delete(key);
          state.eastBWaveTwoKeys.delete(key);
        }
      }
    }
  } else if (mission.variant !== "east-a" && state.assaultTick !== undefined
    && state.strikeKeys.size < 6) {
    const reinforcements = attackers.filter((attacker) => (
      !state.villageGuardKeys.has(objectKey(attacker))
      && !state.baseGuardKeys.has(objectKey(attacker))
      && !state.scoutKeys.has(objectKey(attacker))
    ));
    if (reinforcements.length >= 8) {
      state.assaultWave += 1;
      for (const attacker of reinforcements) state.strikeKeys.add(objectKey(attacker));
    }
  }
}

function missionEightRouteTarget(snapshot, hostiles, waypoint) {
  if (!waypoint.typeName) return undefined;
  const targetCellX = waypoint.targetCellX ?? waypoint.cellX;
  const targetCellY = waypoint.targetCellY ?? waypoint.cellY;
  return hostiles.find((hostile) => (
    hostile.typeName === waypoint.typeName
    && hostile.cellX === targetCellX && hostile.cellY === targetCellY
    && snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
  ));
}

function missionEightAssaultTarget(snapshot, strike, hostiles, waypoint, offset = 0) {
  const routeTarget = missionEightRouteTarget(snapshot, hostiles, waypoint);
  const demolitionPhase = missionEightState.allSamsDeadTick !== undefined;
  const local = hostiles.filter((hostile) => (
    snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
    && (missionEightDistance(hostile, waypoint) <= (mission.variant === "east-a" ? 4 : 9)
      || strike.some((attacker) => missionEightDistance(attacker, hostile)
        <= (mission.variant === "east-a" ? 3 : 6)))
  ));
  const priorities = demolitionPhase
    ? new Map([
      ["ARTY", 0], ["LTNK", 1], ["BGGY", 2], ["E4", 3], ["E3", 4], ["E1", 5],
      ["GUN", 6], ["SAM", 7], ["FACT", 8], ["HAND", 9], ["AFLD", 10], ["PROC", 11],
      ["NUKE", 12], ["SILO", 13],
    ])
    : new Map([
      ["E4", 0], ["ARTY", 1], ["E3", 2], ["LTNK", 3], ["BGGY", 4], ["E1", 5], ["GUN", 6],
      ["SAM", 7], ["FACT", 8], ["HAND", 9], ["AFLD", 10], ["PROC", 11],
    ]);
  const distanceToGroup = (hostile) => Math.min(
    ...strike.map((attacker) => missionEightDistance(attacker, hostile)),
  );
  const rank = (candidates) => candidates.toSorted((left, right) => (
    demolitionPhase
      ? (priorities.get(left.typeName) ?? 20) - (priorities.get(right.typeName) ?? 20)
        || distanceToGroup(left) - distanceToGroup(right)
      : distanceToGroup(left) - distanceToGroup(right)
        || (priorities.get(left.typeName) ?? 20) - (priorities.get(right.typeName) ?? 20)
    || left.strength - right.strength
    || left.id - right.id
  ))[Math.min(offset, Math.max(0, candidates.length - 1))];
  const localThreats = local.filter((hostile) => (
    hostile.type === 1 || hostile.type === 2 || hostile.typeName === "GUN"
  ));
  if (mission.variant === "east-a" && !demolitionPhase) {
    return rank(localThreats) ?? routeTarget;
  }
  return rank(local) ?? routeTarget ?? (missionEightState.routeStage >= missionEightRoutes[mission.variant].length
    ? rank(hostiles)
    : undefined);
}

function queueMissionEightTransitWave(snapshot, attackers, commands, {
  keys,
  stageProperty,
  progressProperty,
  joinProperty,
  role,
  transitRoute = missionEightRoutes["east-a"].slice(0, 7),
  joinKeys = missionEightState.strikeKeys,
  companionStage = missionEightState[stageProperty],
  arrivalFraction = 0.9,
}) {
  const state = missionEightState;
  const transit = attackers.filter((attacker) => keys.has(objectKey(attacker)));
  if (transit.length === 0) return;
  const transitWaypoint = transitRoute[state[stageProperty]];
  if (transitWaypoint) {
    const arrivals = transit.filter((attacker) => (
      missionEightDistance(attacker, transitWaypoint) <= 3
    )).length;
    const required = Math.min(transit.length,
      Math.max(1, Math.ceil(transit.length * arrivalFraction)));
    if (arrivals >= required) {
      state[progressProperty].push({
        tick: snapshot.tick,
        stage: state[stageProperty],
        label: transitWaypoint.label,
        cellX: transitWaypoint.cellX,
        cellY: transitWaypoint.cellY,
        arrivals,
      });
      state[stageProperty] += 1;
    }
  }
  if (state[stageProperty] > companionStage) {
    const syncPoint = transitRoute[Math.max(0, state[stageProperty] - 1)];
    const syncGroups = Array.from({ length: Math.ceil(transit.length / 10) }, (_, index) => (
      transit.slice(index * 10, index * 10 + 10)
    ));
    for (let index = 0; index < syncGroups.length; index += 1) {
      queueMissionEightRole(commands, `${role}-stage-sync-${index}`,
        syncGroups[index], syncPoint, MODIFIER_ALT, 45);
    }
    return;
  }
  const nextTransitWaypoint = transitRoute[state[stageProperty]];
  if (!nextTransitWaypoint) {
    state[joinProperty] = snapshot.tick;
    for (const key of keys) joinKeys.add(key);
    keys.clear();
    return;
  }
  const transitGroups = Array.from({ length: Math.ceil(transit.length / 10) }, (_, index) => (
    transit.slice(index * 10, index * 10 + 10)
  ));
  for (let index = 0; index < transitGroups.length; index += 1) {
    queueMissionEightRole(commands, `${role}-transit-${index}`,
      transitGroups[index], nextTransitWaypoint, MODIFIER_ALT, 45);
  }
}

function completeMissionEightSouthTransit(snapshot, combined) {
  const state = missionEightState;
  const mainRoute = missionEightRoutes["east-a"];
  const factStage = mainRoute.findIndex((waypoint) => waypoint.typeName === "FACT");
  assert.ok(factStage > 0, "Mission 8 east-a FACT stage is missing");
  if (state.routeStage < factStage) {
    assert.equal(state.routeStage, factStage - 1,
      "Mission 8 east-a north front was not waiting at the western ridge crossing");
    const crossing = mainRoute[state.routeStage];
    state.routeProgress.push({
      tick: snapshot.tick,
      stage: state.routeStage,
      label: crossing.label,
      cellX: crossing.cellX,
      cellY: crossing.cellY,
      arrivals: combined.filter((attacker) => missionEightDistance(attacker, crossing) <= 1).length,
      secondCohort: combined.filter((attacker) => (
        state.secondWaveKeys.has(objectKey(attacker))
      )).length,
      thirdCohort: combined.filter((attacker) => (
        state.thirdWaveKeys.has(objectKey(attacker))
      )).length,
    });
    state.routeStage = factStage;
    state.routeStageStartedTick = snapshot.tick;
  }
  state.secondWaveJoinTick ??= snapshot.tick;
  state.thirdWaveJoinTick ??= snapshot.tick;
  for (const key of state.secondWaveKeys) {
    state.secondWaveCohortKeys.add(key);
    state.southReadyKeys.add(key);
  }
  for (const key of state.thirdWaveKeys) {
    state.thirdWaveCohortKeys.add(key);
    state.southReadyKeys.add(key);
  }
  state.northReleaseTick ??= snapshot.tick;
  for (const key of state.northHoldKeys) {
    state.northReleaseKeys.add(key);
    state.southReadyKeys.add(key);
  }
  state.northHoldKeys.clear();
  state.secondWaveKeys.clear();
  state.thirdWaveKeys.clear();
}

function queueMissionEightSouthTransit(snapshot, hostiles, attackers, commands) {
  const state = missionEightState;
  const secondWave = state.secondWaveLaunchTick === undefined ? [] : attackers.filter((attacker) => (
    state.secondWaveKeys.has(objectKey(attacker))
  ));
  const thirdWave = state.thirdWaveLaunchTick === undefined ? [] : attackers.filter((attacker) => (
    state.thirdWaveKeys.has(objectKey(attacker))
  ));
  const combined = [...secondWave, ...thirdWave];
  if (combined.length === 0) return;
  const route = missionEightEastASouthTransitRoute;
  if (state.southTransitStage >= route.length) {
    completeMissionEightSouthTransit(snapshot, combined);
    return;
  }

  const stage = state.southTransitStage;
  const waypoint = route[stage];
  const previousWaypoint = route[Math.max(0, stage - 1)];
  const targetKey = state.southTransitTargetKeys.get(stage);
  const authoredTarget = targetKey
    ? hostiles.find((hostile) => objectKey(hostile) === targetKey)
    : waypoint.typeName ? hostiles.find((hostile) => (
        hostile.typeName === waypoint.typeName
        && hostile.cellX === (waypoint.targetCellX ?? waypoint.cellX)
        && hostile.cellY === (waypoint.targetCellY ?? waypoint.cellY)
      )) : undefined;
  const visibleAuthoredTarget = authoredTarget
    && snapshot.shroud.isVisible(authoredTarget.cellX, authoredTarget.cellY)
    ? authoredTarget
    : undefined;
  const completedSamGate = waypoint.typeName === "SAM" && targetKey && !authoredTarget;
  const finalAssembly = waypoint.label === "southern strike assembly";
  const bypassLabels = new Set([
    "southwest corridor descent",
    "southwest corridor floor",
    "southwest ridge return",
    "western base approach",
  ]);
  const finalAdjacentThreatPriority = new Map([
    ["BGGY", 0], ["LTNK", 1], ["E4", 2], ["E3", 3],
    ["E2", 4], ["E1", 5], ["ARTY", 6],
  ]);
  const finalRemoteThreatPriority = new Map([
    ["ARTY", 0], ["BGGY", 1], ["LTNK", 2], ["E4", 3],
    ["E3", 4], ["E2", 5], ["E1", 6],
  ]);
  const threatPriority = finalAssembly
    ? finalAdjacentThreatPriority
    : waypoint.typeName === "SAM"
    ? new Map([
        ["LTNK", 0], ["BGGY", 1], ["ARTY", 2], ["E4", 3],
        ["E3", 4], ["E2", 5], ["E1", 6],
      ])
    : new Map([
        ["E4", 0], ["ARTY", 1], ["E3", 2], ["E2", 3],
        ["E1", 4], ["LTNK", 5], ["BGGY", 6], ["GUN", 7],
      ]);
  const combatRadius = finalAssembly ? 8 : stage === 1 || waypoint.typeName === "SAM" ? 10 : 6;
  const inFinalCorridor = (hostile) => [previousWaypoint, waypoint].some((anchor) => (
    missionEightDistance(anchor, hostile) <= combatRadius
  ));
  if (finalAssembly && !state.southFinalGateInitialized) {
    state.southFinalGateInitialized = true;
    state.southFinalGateEnteredTick = snapshot.tick;
    for (const hostile of hostiles.filter((candidate) => (
      threatPriority.has(candidate.typeName)
      && snapshot.shroud.isVisible(candidate.cellX, candidate.cellY)
      && inFinalCorridor(candidate)
    ))) {
      const key = objectKey(hostile);
      state.southFinalGateBlockerKeys.add(key);
      state.southFinalGateBlockers.set(key, {
        key,
        typeName: hostile.typeName,
        id: hostile.id,
        strength: hostile.strength,
        cellX: hostile.cellX,
        cellY: hostile.cellY,
      });
    }
  }
  if (finalAssembly) {
    for (const key of [...state.southFinalGateBlockerKeys]) {
      const blocker = hostiles.find((hostile) => objectKey(hostile) === key);
      if (!blocker || !inFinalCorridor(blocker)) {
        state.southFinalGateBlockerKeys.delete(key);
        state.southFinalGateBlockerDrops.push({
          tick: snapshot.tick,
          key,
          reason: blocker ? "left-corridor" : "destroyed",
          ...(blocker ? {
            typeName: blocker.typeName,
            strength: blocker.strength,
            cellX: blocker.cellX,
            cellY: blocker.cellY,
          } : {}),
        });
      }
    }
  }
  const finalThreatDistance = (hostile) => Math.min(...combined.map((attacker) => (
    missionEightDistance(attacker, hostile)
  )));
  const localThreat = stage > 0 && !bypassLabels.has(waypoint.label) && !completedSamGate
    ? hostiles.filter((hostile) => (
        threatPriority.has(hostile.typeName)
        && (!finalAssembly || state.southFinalGateBlockerKeys.has(objectKey(hostile)))
        && snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
        && ([previousWaypoint, waypoint].some((anchor) => (
          missionEightDistance(anchor, hostile) <= combatRadius
        )) || (waypoint.typeName === "SAM"
          && combined.some((attacker) => missionEightDistance(attacker, hostile) <= 8)))
      )).toSorted((left, right) => (
        (finalAssembly
          ? Number(finalThreatDistance(left) > 3) - Number(finalThreatDistance(right) > 3)
          : 0)
        || (finalAssembly
          ? ((finalThreatDistance(left) <= 3
              ? finalAdjacentThreatPriority : finalRemoteThreatPriority).get(left.typeName) ?? 20)
            - ((finalThreatDistance(right) <= 3
              ? finalAdjacentThreatPriority : finalRemoteThreatPriority).get(right.typeName) ?? 20)
          : (threatPriority.get(left.typeName) ?? 20)
            - (threatPriority.get(right.typeName) ?? 20))
        || (finalAssembly ? left.strength - right.strength
          : Math.min(missionEightDistance(previousWaypoint, left), missionEightDistance(waypoint, left))
            - Math.min(missionEightDistance(previousWaypoint, right), missionEightDistance(waypoint, right)))
        || left.strength - right.strength
        || left.id - right.id
      ))[0]
    : undefined;
  const combatThreat = waypoint.typeName === "SAM"
    ? localThreat ?? visibleAuthoredTarget
    : visibleAuthoredTarget ?? localThreat;
  if (finalAssembly && combatThreat) {
    const combatThreatKey = objectKey(combatThreat);
    if (!state.southWithdrawalTargets.has(combatThreatKey)) {
      state.southWithdrawalTargets.set(combatThreatKey, {
        key: combatThreatKey,
        engagedTick: snapshot.tick,
        typeName: combatThreat.typeName,
        id: combatThreat.id,
        strength: combatThreat.strength,
        cellX: combatThreat.cellX,
        cellY: combatThreat.cellY,
      });
    }
  }
  state.southTransitFocus = {
    tick: snapshot.tick,
    role: "east-a-south-combined",
    stage,
    target: combatThreat ? {
      typeName: combatThreat.typeName,
      id: combatThreat.id,
      strength: combatThreat.strength,
      cellX: combatThreat.cellX,
      cellY: combatThreat.cellY,
    } : undefined,
  };

  if (completedSamGate) {
    const secondArrivals = secondWave.filter((attacker) => (
      missionEightDistance(attacker, waypoint) <= 3
    )).length;
    const thirdArrivals = thirdWave.filter((attacker) => (
      missionEightDistance(attacker, waypoint) <= 3
    )).length;
    const progress = {
      tick: snapshot.tick,
      stage,
      label: waypoint.label,
      cellX: waypoint.cellX,
      cellY: waypoint.cellY,
      secondArrivals,
      thirdArrivals,
    };
    state.southTransitProgress.push(progress);
    state.secondWaveTransitProgress.push({ ...progress, arrivals: secondArrivals });
    state.thirdWaveTransitProgress.push({ ...progress, arrivals: thirdArrivals });
    state.southTransitStage += 1;
    state.secondWaveTransitStage = state.southTransitStage;
    state.thirdWaveTransitStage = state.southTransitStage;
    state.southTransitInfantryScreenKeys.clear();
    state.southSamDemolitionKeys.clear();
    const retreat = route[state.southTransitStage];
    for (let index = 0; index < combined.length; index += 10) {
      queueMissionEightRole(commands, `east-a-south-sam-exit-${index / 10}`,
        combined.slice(index, index + 10), retreat, MODIFIER_ALT, 30);
    }
    return;
  }

  if (combatThreat) {
    const vehicles = combined.filter((attacker) => attacker.type === 2);
    const samGate = waypoint.typeName === "SAM" && authoredTarget;
    for (const key of state.southTransitInfantryScreenKeys) {
      if (!combined.some((attacker) => objectKey(attacker) === key)) {
        state.southTransitInfantryScreenKeys.delete(key);
      }
    }
    const infantryScreenTarget = finalAssembly
      ? Math.min(12, combined.length)
      : samGate
      ? Math.max(0, 8 - vehicles.length)
      : vehicles.length === 0 ? 8 : 0;
    if (state.southTransitInfantryScreenKeys.size < infantryScreenTarget) {
      const screenPriority = new Map([["E3", 0], ["E2", 1], ["E1", 2]]);
      const candidates = combined.filter((attacker) => (
        attacker.type === 1
        && !state.southTransitInfantryScreenKeys.has(objectKey(attacker))
        && !state.southSamDemolitionKeys.has(objectKey(attacker))
      )).toSorted((left, right) => (
        (screenPriority.get(left.typeName) ?? 10) - (screenPriority.get(right.typeName) ?? 10)
        || right.strength / right.maxStrength - left.strength / left.maxStrength
        || left.id - right.id
      ));
      const needed = infantryScreenTarget - state.southTransitInfantryScreenKeys.size;
      for (const candidate of candidates.slice(0, needed)) {
        state.southTransitInfantryScreenKeys.add(objectKey(candidate));
      }
    }
    const infantryScreen = combined.filter((attacker) => (
      state.southTransitInfantryScreenKeys.has(objectKey(attacker))
    ));
    const screen = samGate
      ? [...vehicles, ...infantryScreen].slice(0, 8)
      : vehicles.length > 0 ? vehicles
      : combined.filter((attacker) => (
          state.southTransitInfantryScreenKeys.has(objectKey(attacker))
        ));
    const screenKeys = new Set(screen.map(objectKey));
    if (samGate) {
      for (const key of state.southSamDemolitionKeys) {
        if (!combined.some((attacker) => objectKey(attacker) === key)) {
          state.southSamDemolitionKeys.delete(key);
        }
      }
      if (!state.southSamDemolitionInitialized) {
        const demolitionPriority = new Map([["E3", 0], ["E2", 1], ["E1", 2]]);
        const candidates = combined.filter((attacker) => (
          attacker.type === 1 && !screenKeys.has(objectKey(attacker))
        )).toSorted((left, right) => (
          (demolitionPriority.get(left.typeName) ?? 10)
            - (demolitionPriority.get(right.typeName) ?? 10)
          || right.strength / right.maxStrength - left.strength / left.maxStrength
          || left.id - right.id
        ));
        for (const candidate of candidates.slice(0, 10)) {
          state.southSamDemolitionKeys.add(objectKey(candidate));
        }
        state.southSamDemolitionInitialized = true;
      }
    }
    const demolition = samGate && visibleAuthoredTarget
      ? combined.filter((attacker) => state.southSamDemolitionKeys.has(objectKey(attacker)))
      : [];
    const demolitionKeys = new Set(demolition.map(objectKey));
    const held = combined.filter((attacker) => (
      !screenKeys.has(objectKey(attacker)) && !demolitionKeys.has(objectKey(attacker))
    ));
    state.southTransitFocus.screen = {
      vehiclesAlive: vehicles.length > 0,
      infantryFallback: state.southTransitInfantryScreenKeys.size,
      demolition: demolition.length,
    };
    for (let index = 0; index < screen.length; index += 10) {
      queueMissionEightRole(commands, `east-a-south-combat-${index / 10}`,
        screen.slice(index, index + 10), combatThreat, 0, 30);
    }
    for (let index = 0; index < demolition.length; index += 10) {
      queueMissionEightRole(commands, `east-a-south-sam-demolition-${index / 10}`,
        demolition.slice(index, index + 10), visibleAuthoredTarget, 0, 30);
    }
    const spreadOffsets = [
      { x: -2, y: 0 }, { x: 2, y: 0 }, { x: -2, y: 2 },
      { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 0 },
    ];
    for (let index = 0; index < held.length; index += 6) {
      const offset = spreadOffsets[(index / 6) % spreadOffsets.length];
      queueMissionEightRole(commands, `east-a-south-screen-hold-${index / 6}`,
        held.slice(index, index + 6), {
          cellX: previousWaypoint.cellX + offset.x,
          cellY: previousWaypoint.cellY + offset.y,
        }, MODIFIER_ALT, 45);
    }
    return;
  }

  state.southTransitInfantryScreenKeys.clear();
  const arrivalRadius = waypoint.label === "southern strike assembly" ? 1 : 3;
  const arrivals = (wave) => wave.filter((attacker) => (
    missionEightDistance(attacker, waypoint) <= arrivalRadius
  )).length;
  const secondArrivals = arrivals(secondWave);
  const thirdArrivals = arrivals(thirdWave);
  const required = (wave) => Math.min(wave.length, Math.max(1, Math.ceil(wave.length * 0.7)));
  if (!authoredTarget
    && secondArrivals >= required(secondWave) && thirdArrivals >= required(thirdWave)) {
    const progress = {
      tick: snapshot.tick,
      stage,
      label: waypoint.label,
      cellX: waypoint.cellX,
      cellY: waypoint.cellY,
      secondArrivals,
      thirdArrivals,
    };
    state.southTransitProgress.push(progress);
    state.secondWaveTransitProgress.push({ ...progress, arrivals: secondArrivals });
    state.thirdWaveTransitProgress.push({ ...progress, arrivals: thirdArrivals });
    state.southTransitStage += 1;
    state.secondWaveTransitStage = state.southTransitStage;
    state.thirdWaveTransitStage = state.southTransitStage;
    if (state.southTransitStage >= route.length) {
      completeMissionEightSouthTransit(snapshot, combined);
      return;
    }
    for (let index = 0; index < combined.length; index += 10) {
      queueMissionEightRole(commands, `east-a-south-stage-hold-${index / 10}`,
        combined.slice(index, index + 10), waypoint, MODIFIER_ALT, 45);
    }
    return;
  }
  for (let index = 0; index < combined.length; index += 10) {
    queueMissionEightRole(commands, `east-a-south-transit-${index / 10}`,
      combined.slice(index, index + 10), waypoint, MODIFIER_ALT, 45);
  }
}

function queueMissionEightWestCleanup(snapshot, hostiles, strike, commands) {
  const state = missionEightState;
  if (mission.variant !== "east-a" || state.factDeathTick === undefined) return false;
  state.westCleanupStartedTick ??= snapshot.tick;

  while (state.westCleanupStage < missionEightEastAWestCleanupTargets.length) {
    const stage = state.westCleanupStage;
    const cleanupStrike = strike;
    const productionGun = hostiles.find((hostile) => (
      hostile.typeName === missionEightEastAProductionGunSite.typeName
      && hostile.cellX === missionEightEastAProductionGunSite.cellX
      && hostile.cellY === missionEightEastAProductionGunSite.cellY
    ));
    if (productionGun) {
      state.productionGunMinimumStrength = Math.min(
        state.productionGunMinimumStrength ?? productionGun.strength,
        productionGun.strength,
      );
    }
    // This guard belongs inside the loop: destroying stage 2 advances to stage
    // 3 in the same turn, and an outer guard would leak one production-turret
    // order before the next snapshot. Keep that pre-launch force moving west,
    // where it cannot draw Nod's production armor toward the GDI home base.
    if (stage >= 3 && state.postFactCleanupLaunchTick === undefined) {
      const westernReserve = hostiles.find((hostile) => (
        hostile.typeName === "NUKE" && hostile.cellX === 6 && hostile.cellY === 8
      ));
      for (let index = 0; index < cleanupStrike.length; index += 10) {
        queueMissionEightRole(commands, `east-a-west-prelaunch-${index / 10}`,
          cleanupStrike.slice(index, index + 10), westernReserve ?? { cellX: 10, cellY: 10 },
          westernReserve ? 0 : MODIFIER_ALT, westernReserve ? 30 : 90);
      }
      return true;
    }
    // After launch, do not bleed the wave clearing silos while the production
    // turret is still healthy. Hold the full ridge force until the GUN is soft
    // (or a post-hold airstrike has landed), then push stages 3–11 as one surge.
    if (stage >= 3 && stage < 7 && state.postFactCleanupLaunchTick !== undefined
      && productionGun
      && productionGun.strength > missionEightEastAProductionGunSoftStrength) {
      state.productionGunHoldStartedTick ??= snapshot.tick;
      state.productionGunHoldLastStrength = productionGun.strength;
      const holdDuration = snapshot.tick - state.productionGunHoldStartedTick;
      const postHoldAirstrike = state.airstrike.orders.find((order) => (
        order.target === "GUN"
        && order.cellX === 26 && order.cellY === 21
        && order.tick >= state.productionGunHoldStartedTick
      ));
      const sincePostHoldAirstrike = postHoldAirstrike
        ? snapshot.tick - postHoldAirstrike.tick
        : undefined;
      // Charge once the turret is soft, a post-hold A-10 has landed, or a
      // long timeout fires. Commit chargeTick here so stage 7 cannot re-hold
      // if the gun repairs during the march, and so the next A-10 prefers HAND.
      const readyToSurge = productionGun.strength <= missionEightEastAProductionGunSoftStrength
        && (sincePostHoldAirstrike === undefined || sincePostHoldAirstrike >= 180);
      const previouslySoft = (state.productionGunMinimumStrength ?? 999)
        <= missionEightEastAProductionGunSoftStrength + 70;
      const forceChargeAfterHold = holdDuration >= 10_500
        // Post-hold soft-pass: charge once the turret is mid-health. Full-HP
        // early charges wipe finishers; A-10-on-HAND first did not reduce HAND.
        || (sincePostHoldAirstrike !== undefined && sincePostHoldAirstrike >= 300
          && productionGun.strength <= 300)
        || (previouslySoft && holdDuration >= 2_700
          && productionGun.strength <= 280);
      if (!forceChargeAfterHold && !readyToSurge) {
        const holdThreat = hostiles.filter((hostile) => (
          (hostile.type === 1 || hostile.type === 2)
          && missionEightEastAWestScreenPriorities.has(hostile.typeName)
          && cleanupStrike.some((attacker) => missionEightDistance(attacker, hostile) <= 3)
        )).toSorted((left, right) => (
          missionEightEastAWestScreenPriorities.get(left.typeName)
            - missionEightEastAWestScreenPriorities.get(right.typeName)
          || left.strength - right.strength
          || left.id - right.id
        ))[0];
        const holdTarget = holdThreat ?? missionEightEastAProductionStaging;
        for (let index = 0; index < cleanupStrike.length; index += 10) {
          queueMissionEightRole(commands, `east-a-west-pregun-hold-${index / 10}`,
            cleanupStrike.slice(index, index + 10), holdTarget,
            holdThreat ? 0 : MODIFIER_ALT, holdThreat ? 30 : 60);
        }
        return true;
      }
      // Surge with the full ridge force straight onto the production turret.
      // Clearing silos first bled 17 rifles down to 4 before the charge.
      if (stage < 7) {
        state.westCleanupDeferredFromStage ??= stage;
        state.westCleanupStage = 7;
        state.productionGunChargeTick ??= snapshot.tick;
        state.productionGunChargeStrength ??= productionGun.strength;
        continue;
      }
    }
    const site = missionEightEastAWestCleanupTargets[stage];
    const target = hostiles.find((hostile) => (
      hostile.typeName === site.typeName
      && hostile.cellX === site.cellX && hostile.cellY === site.cellY
    ));
    if (!target) {
      const engagement = state.westCleanupTarget?.stage === stage
        ? state.westCleanupTarget : undefined;
      state.westCleanupProgress.push({
        tick: snapshot.tick,
        stage,
        ...site,
        engagedTick: engagement?.engagedTick,
        targetKey: engagement?.targetKey,
        initialStrength: engagement?.initialStrength,
        minimumStrength: engagement?.minimumStrength ?? 0,
        absentAtStart: engagement === undefined,
      });
      // After the production turret falls, keep pressing HAND/AFLD/PROC with
      // the remaining force. Resume deferred western silos only after the
      // production base chain (stages 8–11) is finished.
      if (stage === 7) {
        state.westCleanupStage = 8;
      } else if (stage === 11 && state.westCleanupDeferredFromStage !== undefined) {
        const resume = state.westCleanupDeferredFromStage;
        state.westCleanupDeferredFromStage = undefined;
        state.westCleanupStage = resume;
      } else {
        state.westCleanupStage += 1;
      }
      state.westCleanupTarget = undefined;
      continue;
    }

    if (state.westCleanupTarget?.stage !== stage
      || state.westCleanupTarget.targetKey !== objectKey(target)) {
      state.westCleanupTarget = {
        stage,
        label: site.label,
        typeName: target.typeName,
        targetKey: objectKey(target),
        cellX: target.cellX,
        cellY: target.cellY,
        engagedTick: snapshot.tick,
        initialStrength: target.strength,
        minimumStrength: target.strength,
      };
    } else {
      state.westCleanupTarget.minimumStrength = Math.min(
        state.westCleanupTarget.minimumStrength,
        target.strength,
      );
    }

    // Stage 7 is the production turret. Charging it while fully healthy wipes
    // the post-FACT wave; hold on the western ridge and let airstrikes soften it.
    // Once chargeTick is set, never re-hold — earlier builds re-held when the
    // gun repaired during the march and burned another A-10 on GUN.
    const isProductionGun = stage >= 7
      && site.typeName === missionEightEastAProductionGunSite.typeName
      && site.cellX === missionEightEastAProductionGunSite.cellX
      && site.cellY === missionEightEastAProductionGunSite.cellY;
    if (isProductionGun && state.productionGunChargeTick === undefined) {
      state.productionGunHoldStartedTick ??= snapshot.tick;
      state.productionGunHoldLastStrength = target.strength;
      const holdDuration = snapshot.tick - state.productionGunHoldStartedTick;
      const postHoldAirstrike = state.airstrike.orders.find((order) => (
        order.target === "GUN"
        && order.cellX === 26 && order.cellY === 21
        && order.tick >= state.productionGunHoldStartedTick
      ));
      const sincePostHoldAirstrike = postHoldAirstrike
        ? snapshot.tick - postHoldAirstrike.tick
        : undefined;
      const softEnough = target.strength <= missionEightEastAProductionGunSoftStrength
        && (sincePostHoldAirstrike === undefined || sincePostHoldAirstrike >= 180);
      const previouslySoft = (state.productionGunMinimumStrength ?? 999)
        <= missionEightEastAProductionGunSoftStrength + 70;
      const forceChargeAfterHold = holdDuration >= 10_500
        || (sincePostHoldAirstrike !== undefined && sincePostHoldAirstrike >= 300
          && target.strength <= 300)
        || (previouslySoft && holdDuration >= 2_700 && target.strength <= 280);
      if (!forceChargeAfterHold && !softEnough) {
        const holdThreat = hostiles.filter((hostile) => (
          (hostile.type === 1 || hostile.type === 2)
          && missionEightEastAWestScreenPriorities.has(hostile.typeName)
          && cleanupStrike.some((attacker) => missionEightDistance(attacker, hostile) <= 3)
        )).toSorted((left, right) => (
          missionEightEastAWestScreenPriorities.get(left.typeName)
            - missionEightEastAWestScreenPriorities.get(right.typeName)
          || left.strength - right.strength
          || left.id - right.id
        ))[0];
        const holdTarget = holdThreat ?? missionEightEastAProductionStaging;
        for (let index = 0; index < cleanupStrike.length; index += 10) {
          queueMissionEightRole(commands, `east-a-west-gun-hold-${index / 10}`,
            cleanupStrike.slice(index, index + 10), holdTarget,
            holdThreat ? 0 : MODIFIER_ALT, holdThreat ? 30 : 60);
        }
        return true;
      }
      state.productionGunChargeTick = snapshot.tick;
      state.productionGunChargeStrength = target.strength;
      // Commit the tiny home reserve once the production surge starts.
      for (const reservist of snapshot.objects.filter((candidate) => (
        candidate.owner === HOUSE_GDI && candidate.subObject === 0
        && candidate.strength > 0
        && state.postFactHomeDefenseKeys.has(objectKey(candidate))
      ))) {
        const key = objectKey(reservist);
        state.postFactHomeDefenseKeys.delete(key);
        state.postFactHomeDefenseCohortKeys.delete(key);
        state.postFactCleanupCohortKeys.add(key);
        state.strikeKeys.add(key);
      }
    } else if (isProductionGun) {
      state.productionGunHoldLastStrength = target.strength;
    }

    const postFactCleanup = state.postFactCleanupLaunchTick === undefined || stage !== 3 ? []
      : cleanupStrike.filter((attacker) => (
        state.postFactCleanupCohortKeys.has(objectKey(attacker))
      ));
    const nearbyThreatDistance = (hostile) => Math.min(...postFactCleanup.map((attacker) => (
      missionEightDistance(attacker, hostile)
    )));
    const nearbyThreat = postFactCleanup.length === 0 ? undefined : hostiles.filter((hostile) => (
      (hostile.type === 1 || hostile.type === 2)
      && missionEightEastAWestScreenPriorities.has(hostile.typeName)
      && nearbyThreatDistance(hostile) <= 6
      && snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
    )).toSorted((left, right) => (
      missionEightEastAWestScreenPriorities.get(left.typeName)
        - missionEightEastAWestScreenPriorities.get(right.typeName)
      || nearbyThreatDistance(left) - nearbyThreatDistance(right)
      || left.strength - right.strength
      || left.id - right.id
    ))[0];
    if (nearbyThreat) {
      for (let index = 0; index < cleanupStrike.length; index += 10) {
        queueMissionEightRole(commands,
          `east-a-west-cleanup-screen-${objectKey(nearbyThreat)}-${index / 10}`,
          cleanupStrike.slice(index, index + 10), nearbyThreat, 0, 60);
      }
      return true;
    }
    // Production-base stages: keep a small finisher squad on the turret while
    // the rest hold at western staging (out of arc). Prior peel at 22,14 still
    // ate turret fire; full-wave gun charge wiped everyone before HAND.
    if (stage >= 7) {
      const hand = hostiles.find((hostile) => (
        hostile.typeName === "HAND" && hostile.cellX === 27 && hostile.cellY === 17
      ));
      // Approach HAND from south of the production turret so peels do not walk
      // through LTNK/BGGY north of the pad (prior direct rally wiped the peel).
      const handRally = { cellX: 24, cellY: 22 };
      // Drop dead peel keys.
      for (const key of [...state.productionGunPeelKeys]) {
        if (!cleanupStrike.some((attacker) => objectKey(attacker) === key)) {
          state.productionGunPeelKeys.delete(key);
        }
      }
      // Peel as soon as the charge is committed. Four finishers on a softened
      // gun; the rest hold at staging so stage 8 has a healthy HAND wave.
      if (stage === 7 && state.productionGunChargeTick !== undefined
        && cleanupStrike.length > 8 && state.productionGunPeelKeys.size === 0) {
        const ordered = cleanupStrike.toSorted((left, right) => (
          // Keep the closest/healthiest on the gun; peel the farthest first.
          missionEightDistance(left, target) - missionEightDistance(right, target)
          || right.strength / right.maxStrength - left.strength / left.maxStrength
          || left.id - right.id
        ));
        const finishers = ordered.slice(0, 4);
        const finisherKeys = new Set(finishers.map(objectKey));
        for (const attacker of ordered) {
          if (!finisherKeys.has(objectKey(attacker))) {
            state.productionGunPeelKeys.add(objectKey(attacker));
          }
        }
      }
      // After the gun is gone, everyone is a HAND attacker.
      if (stage >= 8) {
        for (const attacker of cleanupStrike) {
          state.productionGunPeelKeys.add(objectKey(attacker));
        }
      }
      const peeled = cleanupStrike.filter((attacker) => (
        state.productionGunPeelKeys.has(objectKey(attacker))
      ));
      const working = cleanupStrike.filter((attacker) => (
        !state.productionGunPeelKeys.has(objectKey(attacker))
      ));
      // Keep peels at western staging (safe ridge) until the next A-10 window,
      // then rush HAND. Holding at 18,24 bled the wave to BGGYs before air;
      // immediate rushes wiped ~17 rifles with HAND still ~350.
      const lastAirTick = state.airstrike.orders.reduce((maxTick, order) => (
        Math.max(maxTick, order.tick)
      ), 0);
      const ticksSinceAir = snapshot.tick - lastAirTick;
      // Open just before A-10 ready. Latched — re-checking ticksSinceAir after
      // the HAND order used to send the wave home mid-rush. 7100 is the only
      // open that has reliably killed HAND; 6500–6900 dies with HAND still up.
      if (state.productionHandAssaultTick === undefined
        && (ticksSinceAir >= 7_100
          || state.airstrike.pending !== undefined
          || (hand !== undefined && hand.strength <= 500))) {
        state.productionHandAssaultTick = snapshot.tick;
        // Commit the home reserve into the production assault once the pad
        // push starts — two late rifles help mop AFLD after HAND falls.
        for (const reservist of snapshot.objects.filter((candidate) => (
          candidate.owner === HOUSE_GDI && candidate.subObject === 0
          && candidate.strength > 0
          && state.postFactHomeDefenseKeys.has(objectKey(candidate))
        ))) {
          const key = objectKey(reservist);
          state.postFactHomeDefenseKeys.delete(key);
          state.postFactHomeDefenseCohortKeys.delete(key);
          state.postFactCleanupCohortKeys.add(key);
          state.strikeKeys.add(key);
          state.productionGunPeelKeys.add(key);
        }
      }
      const handAirWindow = state.productionHandAssaultTick !== undefined;
      if (peeled.length > 0 && stage === 7) {
        for (let index = 0; index < peeled.length; index += 10) {
          queueMissionEightRole(commands, `east-a-west-peel-stage-${index / 10}`,
            peeled.slice(index, index + 10), missionEightEastAProductionStaging,
            MODIFIER_ALT, 30);
        }
      }
      if (peeled.length > 0 && stage >= 8) {
        if (!handAirWindow) {
          // Screen threats that walk onto the ridge; otherwise hold staging.
          const holdThreat = hostiles.filter((hostile) => (
            (hostile.type === 1 || hostile.type === 2)
            && missionEightEastAWestScreenPriorities.has(hostile.typeName)
            && peeled.some((attacker) => missionEightDistance(attacker, hostile) <= 3)
          )).toSorted((left, right) => (
            missionEightEastAWestScreenPriorities.get(left.typeName)
              - missionEightEastAWestScreenPriorities.get(right.typeName)
            || left.strength - right.strength
            || left.id - right.id
          ))[0];
          if (holdThreat) {
            for (let index = 0; index < peeled.length; index += 10) {
              queueMissionEightRole(commands, `east-a-west-peel-hold-screen-${index / 10}`,
                peeled.slice(index, index + 10), holdThreat, 0, 30);
            }
          } else {
            for (let index = 0; index < peeled.length; index += 10) {
              queueMissionEightRole(commands, `east-a-west-peel-hold-stage-${index / 10}`,
                peeled.slice(index, index + 10), missionEightEastAProductionStaging,
                MODIFIER_ALT, 30);
            }
          }
          return true;
        }
        // Air window open: whole wave on HAND. Only peel face-flame while HAND
        // is still healthy — once it is nearly dead, ignore micro so the last
        // volleys finish it with more rifles still standing for AFLD.
        const handNearDead = hand && hand.strength <= 200;
        const closeFlame = !handNearDead ? hostiles.filter((hostile) => (
          hostile.typeName === "E4"
          && peeled.some((attacker) => missionEightDistance(attacker, hostile) <= 2)
        )).toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0]
          : undefined;
        if (closeFlame) {
          const threatened = peeled.filter((attacker) => (
            missionEightDistance(attacker, closeFlame) <= 2
          ));
          const rest = peeled.filter((attacker) => (
            missionEightDistance(attacker, closeFlame) > 2
          ));
          for (let index = 0; index < threatened.length; index += 10) {
            queueMissionEightRole(commands, `east-a-west-hand-flame-${index / 10}`,
              threatened.slice(index, index + 10), closeFlame, 0, 30);
          }
          if (rest.length > 0 && hand) {
            for (let index = 0; index < rest.length; index += 10) {
              queueMissionEightRole(commands, `east-a-west-hand-while-flame-${index / 10}`,
                rest.slice(index, index + 10), hand, MODIFIER_CTRL, 30);
            }
          } else if (rest.length > 0 && !hand) {
            for (let index = 0; index < rest.length; index += 10) {
              queueMissionEightRole(commands, `east-a-west-hand-next-${index / 10}`,
                rest.slice(index, index + 10), target, MODIFIER_CTRL, 30);
            }
          }
          return true;
        }
        if (hand) {
          const handEngaged = peeled.filter((attacker) => (
            missionEightDistance(attacker, hand) <= 2
          ));
          const handApproach = peeled.filter((attacker) => (
            missionEightDistance(attacker, hand) > 2
          ));
          for (let index = 0; index < handApproach.length; index += 10) {
            queueMissionEightRole(commands, `east-a-west-peel-hand-attack-${index / 10}`,
              handApproach.slice(index, index + 10), hand, 0, 30);
          }
          for (let index = 0; index < handEngaged.length; index += 10) {
            queueMissionEightRole(commands, `east-a-west-peel-hand-fire-${index / 10}`,
              handEngaged.slice(index, index + 10), hand, MODIFIER_CTRL, 30);
          }
        } else {
          // HAND is down — press AFLD/PROC immediately. Waiting for the next
          // A-10 with a tiny remnant lets LTNK/BGGY finish the survivors before
          // the next air window (~tick 72.9k; remnant is dead by ~66.8k).
          const mopPriority = new Map([
            ["AFLD", 0], ["PROC", 1], ["NUKE", 2], ["SILO", 3], ["HAND", 4],
            ["LTNK", 5], ["BGGY", 6], ["ARTY", 7],
          ]);
          const mopTarget = hostiles.filter((hostile) => (
            mopPriority.has(hostile.typeName)
            && (hostile.type === 4
              || peeled.some((attacker) => missionEightDistance(attacker, hostile) <= 5))
          )).toSorted((left, right) => (
            (mopPriority.get(left.typeName) ?? 20) - (mopPriority.get(right.typeName) ?? 20)
            || left.strength - right.strength
            || left.id - right.id
          ))[0] ?? target;
          const approach = peeled.filter((attacker) => (
            missionEightDistance(attacker, mopTarget) > 2
          ));
          const engaged = peeled.filter((attacker) => (
            missionEightDistance(attacker, mopTarget) <= 2
          ));
          for (let index = 0; index < approach.length; index += 10) {
            queueMissionEightRole(commands, `east-a-west-prod-attack-${stage}-${index / 10}`,
              approach.slice(index, index + 10), mopTarget, 0, 30);
          }
          for (let index = 0; index < engaged.length; index += 10) {
            queueMissionEightRole(commands, `east-a-west-prod-fire-${stage}-${index / 10}`,
              engaged.slice(index, index + 10), mopTarget, MODIFIER_CTRL, 30);
          }
        }
        return true;
      }
      const gunForce = working.length > 0 ? working : cleanupStrike;
      const approach = gunForce.filter((attacker) => (
        missionEightDistance(attacker, target) > 3
      ));
      const engaged = gunForce.filter((attacker) => (
        missionEightDistance(attacker, target) <= 3
      ));
      const rally = {
        cellX: Math.max(0, target.cellX - 2),
        cellY: Math.max(0, target.cellY),
      };
      for (let index = 0; index < approach.length; index += 10) {
        queueMissionEightRole(commands, `east-a-west-approach-${stage}-${index / 10}`,
          approach.slice(index, index + 10), rally, MODIFIER_ALT, 30);
      }
      for (let index = 0; index < engaged.length; index += 10) {
        queueMissionEightRole(commands, `east-a-west-cleanup-${stage}-${index / 10}`,
          engaged.slice(index, index + 10), target, MODIFIER_CTRL, 30);
      }
      if (approach.length > 0 || engaged.length > 0 || peeled.length > 0) return true;
    }
    for (let index = 0; index < cleanupStrike.length; index += 10) {
      queueMissionEightRole(commands, `east-a-west-cleanup-${stage}-${index / 10}`,
        cleanupStrike.slice(index, index + 10), target, 0, 30);
    }
    return true;
  }

  state.westCleanupCompletedTick ??= snapshot.tick;
  return false;
}

function queueMissionEightPostSamCounterattack(snapshot, hostiles, attackers, commands) {
  const state = missionEightState;
  if (mission.variant !== "east-a" || state.allSamsDeadTick === undefined) return;
  if (state.postSamCounterattackLaunchTick === undefined && snapshot.tick >= 28_800) {
    const defenders = attackers.filter((attacker) => (
      state.baseGuardKeys.has(objectKey(attacker))
      || state.postFactHomeDefenseKeys.has(objectKey(attacker))
    )).toSorted((left, right) => (
      Number(left.typeName !== "E3") - Number(right.typeName !== "E3")
      || right.strength / right.maxStrength - left.strength / left.maxStrength
      || left.id - right.id
    ));
    const launchCount = Math.max(0, defenders.length - 1);
    if (launchCount >= 5) {
      state.postSamCounterattackLaunchTick = snapshot.tick;
      for (const attacker of defenders.slice(0, launchCount)) {
        const key = objectKey(attacker);
        clearMissionEightUnitRoleKey(key);
        state.postSamCounterattackKeys.add(key);
      }
    }
  }

  const counterattack = attackers.filter((attacker) => (
    state.postSamCounterattackKeys.has(objectKey(attacker))
  ));
  const northSupport = attackers.filter((attacker) => (
    state.postSamNorthSupportKeys.has(objectKey(attacker))
  ));
  if ((counterattack.length === 0
      && state.postSamCounterattackStage < missionEightEastAPostSamFirstTargetStage)
    || state.postSamCounterattackCompletedTick !== undefined) return;

  while (state.postSamCounterattackStage < missionEightEastAPostSamCounterattackRoute.length) {
    const stage = state.postSamCounterattackStage;
    const site = missionEightEastAPostSamCounterattackRoute[stage];
    const target = site.typeName ? hostiles.find((hostile) => (
      hostile.typeName === site.typeName
      && hostile.cellX === site.cellX && hostile.cellY === site.cellY
    )) : undefined;
    if (site.typeName && target) break;
    const engagementForce = stage >= missionEightEastAPostSamFirstTargetStage
      ? [...counterattack, ...northSupport] : counterattack;
    const arrivals = site.typeName ? engagementForce.length : counterattack.filter((attacker) => (
      missionEightDistance(attacker, site) <= 3
    )).length;
    const required = Math.min(counterattack.length, Math.max(1,
      Math.ceil(counterattack.length * 0.6)));
    if (!site.typeName && arrivals < required) break;
    const supportOrder = state.airstrike.orders.find((order) => (
      order.tick >= state.postSamCounterattackLaunchTick
      && order.target === "GUN" && order.cellX === 21 && order.cellY === 19
    ));
    if (stage === 2 && (!supportOrder || snapshot.tick < supportOrder.tick + 450)) break;
    state.postSamCounterattackProgress.push({
      tick: snapshot.tick,
      stage,
      label: site.label,
      typeName: site.typeName,
      cellX: site.cellX,
      cellY: site.cellY,
      arrivals,
    });
    state.postSamCounterattackStage += 1;
  }

  const site = missionEightEastAPostSamCounterattackRoute[state.postSamCounterattackStage];
  if (!site) {
    state.postSamCounterattackCompletedTick = snapshot.tick;
    for (const key of new Set([
      ...state.postSamCounterattackKeys,
      ...state.postSamNorthSupportKeys,
    ])) state.strikeKeys.add(key);
    state.postSamCounterattackKeys.clear();
    state.postSamNorthSupportKeys.clear();
    return;
  }
  if (state.postSamCounterattackStage < missionEightEastAPostSamFirstTargetStage) {
    for (let index = 0; index < northSupport.length; index += 8) {
      queueMissionEightRole(commands, `east-a-post-sam-north-support-${index / 8}`,
        northSupport.slice(index, index + 8), { cellX: 18, cellY: 30 }, MODIFIER_ALT, 60);
    }
  }
  const engagementForce = state.postSamCounterattackStage
    >= missionEightEastAPostSamFirstTargetStage
    ? [...counterattack, ...northSupport] : counterattack;
  const structureTarget = site.typeName ? hostiles.find((hostile) => (
    hostile.typeName === site.typeName
    && hostile.cellX === site.cellX && hostile.cellY === site.cellY
  )) : undefined;
  const localThreat = hostiles.filter((hostile) => (
    hostile.type !== 4
    && engagementForce.some((attacker) => missionEightDistance(attacker, hostile) <= 6)
  )).toSorted((left, right) => (
    missionEightDistance(left, site) - missionEightDistance(right, site)
    || left.strength - right.strength
    || left.id - right.id
  ))[0];
  // Once the force reaches a scripted structure, keep its fire concentrated.
  // Chasing nearby infantry leaves the western turret alive long enough to
  // destroy the engineer's APC and collapse the capture attempt.
  const target = structureTarget ?? localThreat ?? site;
  for (let index = 0; index < engagementForce.length; index += 8) {
    queueMissionEightRole(commands,
      `east-a-post-sam-counterattack-${state.postSamCounterattackStage}-${index / 8}`,
      engagementForce.slice(index, index + 8), target,
      target === site ? MODIFIER_ALT : 0, 45);
  }
}

function queueMissionEightForces(snapshot, friendly, hostiles, attackers, commands) {
  const state = missionEightState;
  queueMissionEightScout(snapshot, friendly, attackers, commands);
  missionEightAssignRoles(snapshot, attackers, hostiles);
  queueMissionEightEngineer(snapshot, friendly, hostiles, commands);
  queueMissionEightPostSamCounterattack(snapshot, hostiles, attackers, commands);

  if (mission.variant === "east-a" && state.engineer.captureTick !== undefined) {
    const cleanup = attackers.filter((attacker) => (
      state.postFactCleanupCohortKeys.has(objectKey(attacker))
    ));
    const launchSupport = state.postFactCleanupLaunchTick === undefined
      ? attackers.filter((attacker) => (
        !state.postFactCleanupCohortKeys.has(objectKey(attacker))
        && !state.postFactHomeDefenseCohortKeys.has(objectKey(attacker))
        && missionEightDistance(attacker, { cellX: 45, cellY: 50 }) <= 14
      )).toSorted((left, right) => (
        Number(left.typeName !== "E3") - Number(right.typeName !== "E3")
        || right.strength / right.maxStrength - left.strength / left.maxStrength
        || right.strength - left.strength
        || left.id - right.id
      ))
      : [];
    if (state.postFactCleanupLaunchTick === undefined
      && state.postFactProductionCompletions.length
        >= missionEightEastAPostFactLaunchCompletionCount
      && state.airstrike.orders.filter((order) => (
        order.target === "GUN" && order.cellX === 26 && order.cellY === 21
      )).length >= 1
      && state.airstrike.pending === undefined
      && snapshot.tick >= missionEightEastAPostFactLaunchMinTick) {
      state.postFactCleanupLaunchTick = snapshot.tick;
      const liveHomeCohort = attackers.filter((attacker) => (
        state.postFactHomeDefenseCohortKeys.has(objectKey(attacker))
      ));
      const launchCandidates = [...new Map([
        ...liveHomeCohort, ...cleanup, ...launchSupport,
      ].map((attacker) => [objectKey(attacker), attacker])).values()];
      // Prefer rifles for the tiny home reserve so any rockets/vehicles attack.
      const defensePriorities = new Map([
        ["E1", 0], ["E2", 1], ["JEEP", 2], ["E3", 3],
        ["APC", 4], ["MSAM", 5], ["MTNK", 6],
      ]);
      const reserveCount = Math.min(
        launchCandidates.length,
        missionEightEastAPostFactHomeDefenseCount,
      );
      const reserveKeys = new Set(launchCandidates.toSorted((left, right) => (
        (defensePriorities.get(left.typeName) ?? 20)
          - (defensePriorities.get(right.typeName) ?? 20)
        || right.strength / right.maxStrength - left.strength / left.maxStrength
        || right.strength - left.strength
        || left.id - right.id
      )).slice(0, reserveCount).map(objectKey));
      state.postFactHomeDefenseCohortKeys.clear();
      for (const attacker of launchCandidates) {
        const key = objectKey(attacker);
        clearMissionEightUnitRoleKey(key);
        if (reserveKeys.has(key)) {
          state.postFactHomeDefenseKeys.add(key);
          state.postFactHomeDefenseCohortKeys.add(key);
        } else {
          state.postFactCleanupCohortKeys.add(key);
          state.strikeKeys.add(key);
        }
      }
    } else if (state.postFactCleanupLaunchTick === undefined) {
      for (const attacker of cleanup) {
        const key = objectKey(attacker);
        state.strikeKeys.delete(key);
        state.postFactHomeDefenseKeys.add(key);
      }
    }
  }

  if (mission.variant === "east-a" && state.northReinforcementKeys.size > 0) {
    queueMissionEightTransitWave(snapshot, attackers, commands, {
      keys: state.northReinforcementKeys,
      stageProperty: "northReinforcementStage",
      progressProperty: "northReinforcementProgress",
      joinProperty: "northReinforcementJoinTick",
      role: "east-a-north-reinforcement",
      transitRoute: missionEightRoutes["east-a"].slice(3, 9),
      joinKeys: state.strikeKeys,
      arrivalFraction: 0.55,
    });
  }

  if (mission.variant === "east-a" && state.engineer.captureTick !== undefined
    && state.northReleaseTick === undefined) {
    state.northReleaseTick = snapshot.tick;
    for (const key of new Set([
      ...state.northHoldKeys,
      ...state.southReadyKeys,
      ...state.secondWaveKeys,
      ...state.thirdWaveKeys,
      ...state.engineer.footEscortKeys,
      ...state.engineer.footDecoyKeys,
      ...state.engineer.replacementDecoyEscortKeys,
    ])) {
      state.northReleaseKeys.add(key);
      state.strikeKeys.add(key);
    }
    state.northHoldKeys.clear();
    state.southReadyKeys.clear();
    state.secondWaveKeys.clear();
    state.thirdWaveKeys.clear();
    state.engineer.footEscortKeys.clear();
    state.engineer.footDecoyKeys.clear();
    state.engineer.replacementDecoyEscortKeys.clear();
  }

  if (mission.variant === "east-a" && state.factDeathTick !== undefined
    && state.baseGuardReleaseTick === undefined) {
    state.baseGuardReleaseTick = snapshot.tick;
    for (const key of state.baseGuardKeys) {
      state.baseGuardReleaseKeys.add(key);
      state.strikeKeys.add(key);
    }
    state.baseGuardKeys.clear();
  }

  const basePoint = mission.variant === "east-a" ? { cellX: 45, cellY: 51 } : { cellX: 34, cellY: 50 };
  const baseGuard = attackers.filter((attacker) => (
    state.baseGuardKeys.has(objectKey(attacker))
    || state.postFactHomeDefenseKeys.has(objectKey(attacker))
  ));
  if (mission.variant === "east-b") {
    const basePriorities = new Map([
      ["ARTY", 0], ["LTNK", 1], ["BGGY", 2], ["E4", 3], ["E3", 4], ["E1", 5],
    ]);
    const baseThreat = hostiles.filter((hostile) => (
      basePriorities.has(hostile.typeName)
      && missionEightDistance(hostile, { cellX: 34, cellY: 50 }) <= 10
    )).toSorted((left, right) => (
      (basePriorities.get(left.typeName) ?? 20) - (basePriorities.get(right.typeName) ?? 20)
      || missionEightDistance(left, { cellX: 34, cellY: 50 })
        - missionEightDistance(right, { cellX: 34, cellY: 50 })
      || left.strength - right.strength
      || left.id - right.id
    ))[0];
    const baseFallback = { cellX: 27, cellY: 52 };
    // During the early civil + first-airlift window the starting base MTNK is
    // loaned to village pickets — do not yank it home with the base hold order.
    const baseHomeGuard = snapshot.tick < 18_000
      ? baseGuard.filter((guard) => guard.typeName !== "MTNK")
      : baseGuard;
    const commandedBaseGuard = baseThreat ? baseHomeGuard : baseHomeGuard.filter((guard) => (
      missionEightDistance(guard, baseFallback) > 2
    ));
    queueMissionEightRole(commands, "east-b-base", commandedBaseGuard,
      baseThreat ?? baseFallback, baseThreat ? 0 : MODIFIER_ALT, 45);
  } else if (state.assaultTick !== undefined) {
    const postSamDefense = mission.variant === "east-a" && state.allSamsDeadTick !== undefined;
    if (postSamDefense) {
      const defensePoint = { cellX: 43, cellY: 52 };
      const baseThreat = missionEightThreatNear(hostiles, defensePoint, 10);
      if (state.postFactCleanupLaunchTick === undefined
        && state.engineer.captureTick !== undefined && baseThreat) {
        for (let index = 0; index < baseGuard.length; index += 10) {
          queueMissionEightRole(commands, `post-fact-base-defense-${index / 10}`,
            baseGuard.slice(index, index + 10), baseThreat, 0, 30);
        }
      } else {
        const antiArmor = baseThreat ? baseGuard.filter((guard) => (
          guard.typeName === "E3"
        )).toSorted((left, right) => (
          left.strength / left.maxStrength - right.strength / right.maxStrength
          || left.id - right.id
        )).slice(0, 1) : [];
        queueMissionEightRole(commands, "base-anti-armor", antiArmor,
          baseThreat ?? defensePoint, baseThreat ? 0 : MODIFIER_ALT, 45);
        const antiArmorKeys = new Set(antiArmor.map(objectKey));
        const defenseAnchors = [
          { cellX: 43, cellY: 48 }, { cellX: 45, cellY: 48 },
          { cellX: 43, cellY: 50 }, { cellX: 45, cellY: 50 },
          { cellX: 43, cellY: 52 }, { cellX: 45, cellY: 52 },
          { cellX: 43, cellY: 54 }, { cellX: 45, cellY: 54 },
          { cellX: 47, cellY: 51 }, { cellX: 47, cellY: 53 },
        ];
        baseGuard.filter((guard) => !antiArmorKeys.has(objectKey(guard)))
          .toSorted((left, right) => left.id - right.id)
          .forEach((guard, index) => {
            queueMissionEightRole(commands, `base-hold-${objectKey(guard)}`, [guard],
              defenseAnchors[index % defenseAnchors.length], MODIFIER_ALT, 180);
          });
      }
    } else {
      const baseThreat = missionEightThreatNear(hostiles, basePoint,
        mission.variant === "east-a" ? 10 : 16);
      queueMissionEightRole(commands, "base", baseGuard, baseThreat ?? basePoint, 0, 60);
    }
  }

  if (mission.variant === "east-b") {
    // Divert produced tanks onto village duty before they stage for assault.
    const villageTankTarget = snapshot.tick < 20_000
      ? missionEightEastBVillageTankCount
      : missionEightEastBVillageTankCountLate;
    let liveVillageTanks = attackers.filter((attacker) => (
      attacker.typeName === "MTNK" && state.villageGuardKeys.has(objectKey(attacker))
    )).length;
    // Once free armor is staged for assault, do not re-absorb it into village
    // replacements (TRACE: 3 free @21k became 0 free @30k before the gate fired).
    const freeStagedCount = attackers.filter((attacker) => (
      attacker.typeName === "MTNK"
      && state.eastBProducedTankKeys.has(objectKey(attacker))
      && !state.villageGuardKeys.has(objectKey(attacker))
      && attacker.strength >= Math.ceil(attacker.maxStrength * 0.75)
      && (missionEightDistance(attacker, missionEightEastBTankReserve) <= 8
        || missionEightDistance(attacker, missionEightEastBTankAssembly) <= 6
        || (attacker.cellY >= 54 && attacker.cellY <= 60
          && attacker.cellX >= 25 && attacker.cellX <= 42))
    )).length;
    // Protect free staged tanks only while the village still has at least one
    // live MTNK. If the hospital guard dies, allow one free tank to re-fill so
    // the assault village gate can still pass.
    const protectAssaultStaging = state.assaultTick === undefined
      && freeStagedCount >= missionEightEastBAssaultTankCount
      && snapshot.tick >= 18_000
      && liveVillageTanks >= 1;
    const westernSamForVillage = hostiles.find((hostile) => (
      hostile.typeName === "SAM" && hostile.cellX === 13 && hostile.cellY === 16
    ));
    const holdVillageRefillForSam = Boolean(
      state.assaultTick !== undefined
      && westernSamForVillage
      && westernSamForVillage.strength < westernSamForVillage.maxStrength
    );
    if (liveVillageTanks < villageTankTarget && !protectAssaultStaging
      && !holdVillageRefillForSam) {
      const candidates = attackers.filter((attacker) => (
        attacker.typeName === "MTNK"
        && state.eastBProducedTankKeys.has(objectKey(attacker))
        && !state.villageGuardKeys.has(objectKey(attacker))
        && !state.strikeKeys.has(objectKey(attacker))
        && attacker.strength >= Math.ceil(attacker.maxStrength * 0.5)
      )).toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || left.id - right.id
      ));
      for (const tank of candidates) {
        if (liveVillageTanks >= villageTankTarget) break;
        const key = objectKey(tank);
        clearMissionEightUnitRoleKey(key);
        state.villageGuardKeys.add(key);
        liveVillageTanks += 1;
      }
    }

    const villagePoint = missionEightEastBVillagePoint;
    const hospitalPoint = missionEightEastBHospitalPoint;
    const interceptPoint = missionEightEastBCivilIntercept;
    const artyScreen = missionEightEastBArtyScreen;
    const villageGuard = attackers.filter((attacker) => state.villageGuardKeys.has(objectKey(attacker)));
    const villageArmor = villageGuard.filter((guard) => guard.typeName === "MTNK")
      .toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || left.id - right.id
      ));
    const villageInfantry = villageGuard.filter((guard) => guard.type === 1);
    const nearVillage = (hostile, radius) => (
      missionEightDistance(hostile, villagePoint) <= radius
      || missionEightDistance(hostile, hospitalPoint) <= radius
      || missionEightDistance(hostile, interceptPoint) <= radius
      || missionEightDistance(hostile, artyScreen) <= radius
    );
    // Keep engagement west of the GDI start so we never chase ARTY into Nod's
    // mid-map (TRACE: force-move chase of fleeing ARTY pulled tanks to ~43,30).
    // x<=24 covers air2 landing WP0 (21,60) and Terror approach to WP14 (3,53).
    // y>=36 catches the dual tank1 LTNK approach from the north (~9.3k TRACE).
    const onCivilCorridor = (hostile) => (
      hostile.cellX >= 2 && hostile.cellX <= 24
      && hostile.cellY >= 36 && hostile.cellY <= 63
    );
    const armorPriorities = new Map([
      ["TRAN", 0], ["ARTY", 1], ["LTNK", 2], ["BGGY", 3], ["E4", 4], ["E3", 5], ["E1", 6],
    ]);
    const armorThreat = hostiles.filter((hostile) => (
      (hostile.type === 1 || hostile.type === 2 || hostile.typeName === "TRAN")
      && armorPriorities.has(hostile.typeName)
      && (onCivilCorridor(hostile)
        || hostile.typeName === "TRAN" && nearVillage(hostile, 22)
        || (hostile.typeName === "ARTY" && nearVillage(hostile, 18))
        || (hostile.typeName === "LTNK" && nearVillage(hostile, 16))
        || nearVillage(hostile, 12))
    )).toSorted((left, right) => (
      Number(left.typeName !== "TRAN") - Number(right.typeName !== "TRAN")
      || Number(!onCivilCorridor(left)) - Number(!onCivilCorridor(right))
      || (armorPriorities.get(left.typeName) ?? 20) - (armorPriorities.get(right.typeName) ?? 20)
      || Math.min(
        missionEightDistance(left, hospitalPoint),
        missionEightDistance(left, interceptPoint),
      ) - Math.min(
        missionEightDistance(right, hospitalPoint),
        missionEightDistance(right, interceptPoint),
      )
      || left.strength - right.strength
      || left.id - right.id
    ))[0];
    const infantryThreat = hostiles.filter((hostile) => (
      (hostile.typeName === "TRAN" || hostile.typeName === "E4"
        || hostile.typeName === "E3" || hostile.typeName === "E1")
      && (onCivilCorridor(hostile) || nearVillage(hostile, 16))
    )).toSorted((left, right) => (
      Number(left.typeName !== "TRAN") - Number(right.typeName !== "TRAN")
      || Number(left.typeName !== "E4") - Number(right.typeName !== "E4")
      || Number(!onCivilCorridor(left)) - Number(!onCivilCorridor(right))
      || Math.min(
        missionEightDistance(left, hospitalPoint),
        missionEightDistance(left, interceptPoint),
      ) - Math.min(
        missionEightDistance(right, hospitalPoint),
        missionEightDistance(right, interceptPoint),
      )
      || left.strength - right.strength
      || left.id - right.id
    ))[0];
    const armorFallback = { cellX: 8, cellY: 56 };
    const infantryFallback = { cellX: 5, cellY: 58 };
    // Terror unload cell WP14 and air2 landing WP0 — hard-coded from SCG08EB.INI.
    const terrorLanding = { cellX: 3, cellY: 53 };
    const airliftLanding = { cellX: 21, cellY: 60 };
    // Clamp approach so we close with corridor threats without free-chasing ARTY
    // into Nod (TRACE: unclamped force-move to fleeing ARTY → tanks at ~43,30).
    const clampApproach = (threat, fallback) => {
      if (!threat) return fallback;
      return {
        cellX: Math.min(20, Math.max(4, threat.cellX)),
        cellY: Math.min(60, Math.max(38, threat.cellY)),
      };
    };
    // Force-move toward approach; attack once in gun range. When a live threat is
    // in the corridor, approach is the clamped threat cell — not a fixed screen
    // (TRACE v6: LTNK@6,49 farmed a civ while hunters sat on intercept rally).
    const picket = (units, threat, fallbackRally, role, engageRange = 7) => {
      if (units.length === 0) return;
      const rally = clampApproach(threat, fallbackRally);
      const ready = threat
        ? units.filter((unit) => missionEightDistance(unit, threat) <= engageRange)
        : [];
      const movers = units.filter((unit) => (
        !ready.some((unitReady) => objectKey(unitReady) === objectKey(unit))
        && missionEightDistance(unit, rally) > 2
      ));
      if (ready.length > 0) {
        queueMissionEightRole(commands, `${role}-atk`, ready, threat, 0, 20);
      }
      if (movers.length > 0) {
        queueMissionEightRole(commands, `${role}-mv`, movers, rally, MODIFIER_ALT, 30);
      }
    };
    // Only TRAN / flame-pack (E4) count as airlift. Generic E3 near the ridge used
    // to flip this true and yank every tank north off the hospital.
    const airliftActive = Boolean(
      hostiles.some((hostile) => (
        hostile.typeName === "TRAN" && nearVillage(hostile, 22)
      ))
      || hostiles.some((hostile) => (
        hostile.typeName === "E4" && nearVillage(hostile, 14)
      )),
    );
    // Corridor armor (LTNK dual pack ~9.3k, ARTY, BGGY): pile both village tanks
    // plus base loan. Keep a hospital anchor only when the map is quiet.
    const corridorArmorActive = Boolean(
      armorThreat && (armorThreat.typeName === "ARTY" || armorThreat.typeName === "LTNK"
        || armorThreat.typeName === "BGGY" || armorThreat.typeName === "TRAN"),
    );
    const pileOn = airliftActive || corridorArmorActive;
    const anchors = pileOn
      ? []
      : villageArmor.slice(0, Math.min(1, villageArmor.length));
    const hunters = pileOn ? villageArmor : villageArmor.slice(anchors.length);
    const screenRally = snapshot.tick < 8_000 ? artyScreen : interceptPoint;
    const airliftRally = armorThreat?.typeName === "TRAN"
      ? { cellX: armorThreat.cellX, cellY: armorThreat.cellY }
      : (infantryThreat && nearVillage(infantryThreat, 16)
        ? { cellX: infantryThreat.cellX, cellY: infantryThreat.cellY }
        : terrorLanding);
    const anchorThreat = (() => {
      if (armorThreat && nearVillage(armorThreat, 14)) return armorThreat;
      if (infantryThreat && nearVillage(infantryThreat, 12)) return infantryThreat;
      return undefined;
    })();
    const hunterThreat = pileOn
      ? (armorThreat?.typeName === "TRAN"
        ? armorThreat
        : (armorThreat ?? infantryThreat))
      : (armorThreat && (
        onCivilCorridor(armorThreat)
        || missionEightDistance(armorThreat, artyScreen) <= 10
        || missionEightDistance(armorThreat, interceptPoint) <= 10
      ) ? armorThreat : undefined);
    const hunterRally = airliftActive ? airliftRally : screenRally;
    picket(anchors, anchorThreat, armorFallback, "east-b-village-anchor", 8);
    picket(hunters, hunterThreat, hunterRally, "east-b-village-hunter", pileOn ? 10 : 7);
    // Loan base MTNK through first tank1 + airlift window. Civ defense needs it
    // (TRACE v20 with cut-off at 9k: 7 deaths by 20k). Assault loans whatever
    // HP remains afterward.
    if (snapshot.tick < 18_000) {
      const baseLoan = attackers.filter((attacker) => (
        attacker.typeName === "MTNK"
        && state.baseGuardKeys.has(objectKey(attacker))
        && attacker.strength >= Math.ceil(attacker.maxStrength * 0.5)
      )).toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || left.id - right.id
      )).slice(0, 1);
      picket(
        baseLoan,
        hunterThreat ?? anchorThreat,
        airliftActive ? airliftRally : screenRally,
        "east-b-base-loan",
        10,
      );
    }
    const infantryTarget = infantryThreat && nearVillage(infantryThreat, 16)
      ? infantryThreat
      : (snapshot.tick < 20_000 ? interceptPoint : infantryFallback);
    const commandedVillageInfantry = (infantryThreat || snapshot.tick < 20_000)
      ? villageInfantry
      : villageInfantry.filter((guard) => (
        missionEightDistance(guard, infantryFallback) > 2
      ));
    if (commandedVillageInfantry.length > 0) {
      if (infantryThreat && commandedVillageInfantry.some((unit) => (
        missionEightDistance(unit, infantryThreat) <= 5
      ))) {
        queueMissionEightRole(commands, "east-b-village-infantry", commandedVillageInfantry,
          infantryThreat,
          infantryThreat.typeName === "TRAN" ? 0 : MODIFIER_CTRL,
          30);
      } else {
        queueMissionEightRole(commands, "east-b-village-infantry", commandedVillageInfantry,
          airliftActive ? airliftRally : infantryTarget, MODIFIER_ALT, 30);
      }
    }
  }

  if (mission.variant === "east-b" && state.assaultTick === undefined) {
    const stagedTanks = attackers.filter((attacker) => (
      attacker.typeName === "MTNK"
      && state.eastBProducedTankKeys.has(objectKey(attacker))
      && !state.villageGuardKeys.has(objectKey(attacker))
    ));
    // Stay on assembly until assault launches — switching to reserve mid-wait
    // desynced the staged-tank gate (see stagedEastBTanks comment).
    const stagingPoint = missionEightEastBTankAssembly;
    const movingTanks = stagedTanks.filter((attacker) => (
      missionEightDistance(attacker, stagingPoint) > 2
    ));
    queueMissionEightRole(commands, "east-b-tank-staging", movingTanks,
      stagingPoint, MODIFIER_ALT, 90);
    // Park free SAM-pack rockets beside staged armor so launch loans walk west
    // with the tanks instead of spawning late from the barracks (TRACE: E3
    // often still at base when the first wave hit GUN/SAM).
    if (stagedTanks.length >= 2) {
      const freeRockets = attackers.filter((attacker) => (
        attacker.typeName === "E3"
        && !state.villageGuardKeys.has(objectKey(attacker))
        && attacker.strength >= Math.ceil(attacker.maxStrength * 0.5)
        && missionEightDistance(attacker, stagingPoint) > 2
      )).toSorted((left, right) => (
        right.strength / right.maxStrength - left.strength / left.maxStrength
        || left.id - right.id
      )).slice(0, 4);
      if (freeRockets.length > 0) {
        queueMissionEightRole(commands, "east-b-rocket-staging", freeRockets,
          stagingPoint, MODIFIER_ALT, 90);
      }
    }
  }

  if (state.assaultTick === undefined) {
    if (mission.variant === "east-a") {
      const scouts = new Set(state.scoutKeys);
      const reserve = attackers.filter((attacker) => (
        !scouts.has(objectKey(attacker))
        && objectKey(attacker) !== state.vehicleRepairActiveKey
        && objectKey(attacker) !== state.vehicleRepairClearKey
      ));
      const threat = state.vehicleRepairCompleteTick === undefined
        ? undefined
        : missionEightThreatNear(hostiles, { cellX: 41, cellY: 52 }, 7);
      const vehicles = reserve.filter((attacker) => attacker.type === 2);
      const infantry = reserve.filter((attacker) => attacker.type === 1);
      if (state.vehicleRepairCompleteTick === undefined) {
        const repairKeys = [...state.vehicleRepairKeys];
        for (const vehicle of vehicles) {
          const parkingIndex = Math.max(0, repairKeys.indexOf(objectKey(vehicle)));
          queueMissionEightRole(commands, `east-a-parking-${objectKey(vehicle)}`, [vehicle], {
            cellX: 43 + (parkingIndex % 5) * 2,
            cellY: 55,
          }, MODIFIER_ALT, 300);
        }
      } else {
        queueMissionEightRole(commands, "east-a-vehicles", vehicles,
          threat ?? { cellX: 43, cellY: 52 }, 0, 90);
      }
      queueMissionEightRole(commands, "east-a-infantry", infantry,
        threat ?? { cellX: 42, cellY: 51 }, 0, 90);
    }
    return;
  }

  const route = missionEightRoutes[mission.variant];
  if (mission.variant === "east-a" && state.secondWaveKeys.size > 0
    && state.secondWaveLaunchTick === undefined) {
    const held = attackers.filter((attacker) => state.secondWaveKeys.has(objectKey(attacker)));
    const holdingPoints = [
      { cellX: 43, cellY: 55 },
      { cellX: 47, cellY: 55 },
      { cellX: 51, cellY: 55 },
    ];
    for (let index = 0; index < held.length; index += 7) {
      queueMissionEightRole(commands, `east-a-wave-two-${index / 7}`,
        held.slice(index, index + 7), holdingPoints[(index / 7) % holdingPoints.length],
        MODIFIER_ALT, 90);
    }
  }
  if (mission.variant === "east-a" && state.thirdWaveKeys.size > 0
    && state.thirdWaveLaunchTick === undefined) {
    const held = attackers.filter((attacker) => state.thirdWaveKeys.has(objectKey(attacker)));
    const holdingPoints = [
      { cellX: 41, cellY: 52 },
      { cellX: 45, cellY: 55 },
      { cellX: 50, cellY: 53 },
    ];
    for (let index = 0; index < held.length; index += 7) {
      queueMissionEightRole(commands, `east-a-wave-three-${index / 7}`,
        held.slice(index, index + 7), holdingPoints[(index / 7) % holdingPoints.length],
        MODIFIER_ALT, 90);
    }
  }
  if (mission.variant === "east-a"
    && ((state.secondWaveKeys.size > 0 && state.secondWaveLaunchTick !== undefined)
      || (state.thirdWaveKeys.size > 0 && state.thirdWaveLaunchTick !== undefined))) {
    queueMissionEightSouthTransit(snapshot, hostiles, attackers, commands);
  }
  if (mission.variant === "east-a") {
    const rearGuard = attackers.filter((attacker) => (
      state.southRearGuardKeys.has(objectKey(attacker))
    ));
    const rearThreatPriority = new Map([
      ["ARTY", 0], ["LTNK", 1], ["BGGY", 2], ["E4", 3],
      ["E3", 4], ["E2", 5], ["E1", 6],
    ]);
    const rearThreat = hostiles.filter((hostile) => (
      rearThreatPriority.has(hostile.typeName)
      && snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
      && (missionEightDistance(hostile, { cellX: 9, cellY: 22 }) <= 12
        || rearGuard.some((guard) => missionEightDistance(guard, hostile) <= 10))
    )).toSorted((left, right) => (
      (rearThreatPriority.get(left.typeName) ?? 20)
        - (rearThreatPriority.get(right.typeName) ?? 20)
      || Math.min(...rearGuard.map((guard) => missionEightDistance(guard, left)))
        - Math.min(...rearGuard.map((guard) => missionEightDistance(guard, right)))
      || left.strength - right.strength
      || left.id - right.id
    ))[0];
    for (let index = 0; index < rearGuard.length; index += 10) {
      queueMissionEightRole(commands, `east-a-south-rear-guard-${index / 10}`,
        rearGuard.slice(index, index + 10), rearThreat ?? { cellX: 9, cellY: 22 },
        rearThreat ? 0 : MODIFIER_ALT, 30);
    }
    const northHold = attackers.filter((attacker) => (
      state.northHoldKeys.has(objectKey(attacker))
    ));
    const captureScreenTarget = state.allSamsDeadTick === undefined
      && state.engineer.captureTick === undefined
      ? hostiles.filter((hostile) => (
          (hostile.type === 1 || hostile.type === 2)
          && missionEightDistance(hostile, { cellX: 8, cellY: 11 }) <= 9
        )).toSorted((left, right) => {
          const captureThreatPriority = new Map([
            ["E1", 0], ["E3", 1], ["E4", 2], ["ARTY", 3], ["LTNK", 4], ["BGGY", 5],
          ]);
          return (captureThreatPriority.get(left.typeName) ?? 20)
            - (captureThreatPriority.get(right.typeName) ?? 20)
          || Math.min(...northHold.map((guard) => missionEightDistance(guard, left)))
            - Math.min(...northHold.map((guard) => missionEightDistance(guard, right)))
          || left.strength - right.strength
          || left.id - right.id;
        })[0]
      : undefined;
    if (state.allSamsDeadTick !== undefined) {
      if (state.postSamNorthFlankKeys.size === 0
        && state.postSamNorthFlankProgress.length === 0) {
        for (const attacker of northHold.filter((candidate) => (
          candidate.type === 2 && candidate.cellY < 20
        ))) {
          state.postSamNorthFlankKeys.add(objectKey(attacker));
        }
      }
      const northFlank = northHold.filter((attacker) => (
        state.postSamNorthFlankKeys.has(objectKey(attacker))
      ));
      while (northFlank.length > 0 && state.postSamNorthFlankStage
        < missionEightEastAPostSamNorthFlankRoute.length - 1) {
        const waypoint = missionEightEastAPostSamNorthFlankRoute[
          state.postSamNorthFlankStage
        ];
        const arrivals = northFlank.filter((attacker) => (
          missionEightDistance(attacker, waypoint) <= 2
        )).length;
        const required = Math.min(northFlank.length,
          Math.max(1, Math.ceil(northFlank.length * 0.5)));
        if (arrivals < required) break;
        state.postSamNorthFlankProgress.push({
          tick: snapshot.tick,
          stage: state.postSamNorthFlankStage,
          ...waypoint,
          arrivals,
        });
        state.postSamNorthFlankStage += 1;
      }
      const flankWaypoint = missionEightEastAPostSamNorthFlankRoute[
        state.postSamNorthFlankStage
      ];
      for (let index = 0; index < northFlank.length; index += 8) {
        queueMissionEightRole(commands, `east-a-north-flank-${index / 8}`,
          northFlank.slice(index, index + 8), flankWaypoint, MODIFIER_ALT, 90);
      }
      const flankKeys = new Set(northFlank.map(objectKey));
      const remoteHold = northHold.filter((attacker) => !flankKeys.has(objectKey(attacker)));
      for (let index = 0; index < remoteHold.length; index += 8) {
        queueMissionEightRole(commands, `east-a-north-remote-hold-${index / 8}`,
          remoteHold.slice(index, index + 8), { cellX: 40, cellY: 30 }, MODIFIER_ALT, 120);
      }
    } else {
      for (let index = 0; index < northHold.length; index += 10) {
        queueMissionEightRole(commands, `east-a-north-hold-${index / 10}`,
          northHold.slice(index, index + 10), captureScreenTarget ?? { cellX: 18, cellY: 7 },
          captureScreenTarget ? 0 : MODIFIER_ALT, captureScreenTarget ? 30 : 90);
      }
    }
    const southReady = attackers.filter((attacker) => (
      state.southReadyKeys.has(objectKey(attacker))
    ));
    for (let index = 0; index < southReady.length; index += 10) {
      queueMissionEightRole(commands, `east-a-south-ready-${index / 10}`,
        southReady.slice(index, index + 10), { cellX: 12, cellY: 12 }, MODIFIER_ALT, 90);
    }
    const northernSamStage = route.findIndex((waypoint) => waypoint.label === "northern SAM");
    if (state.routeStage > northernSamStage
      && state.secondWaveJoinTick !== undefined && state.thirdWaveJoinTick !== undefined
      && state.southReadyKeys.size > 0) {
      for (const key of state.southReadyKeys) state.strikeKeys.add(key);
      state.southReadyKeys.clear();
      state.southAssaultTick ??= snapshot.tick;
    }
  }
  let strike = attackers.filter((attacker) => state.strikeKeys.has(objectKey(attacker)));
  if (strike.length === 0) return;
  // East-b wave-two + SAM-pack rockets: park at western support hold until the
  // firing line so finishers/rockets are intact when GUN dies (TRACE v63: 3 E3
  // at assault → 1 at GUN; corridor peels wiped the pack).
  if (mission.variant === "east-b" && (
    state.routeStage < 4
    || state.eastBWaveTwoKeys.size > 0
  )) {
    const hold = { cellX: 13, cellY: 32 };
    const waveTwo = strike.filter((attacker) => (
      state.eastBWaveTwoKeys.has(objectKey(attacker))
      || (state.routeStage < 4 && attacker.typeName === "E3")
    ));
    for (const unit of waveTwo) {
      const rally = unit.cellY >= 50
        ? { cellX: 13, cellY: 48 }
        : hold;
      if (missionEightDistance(unit, rally) > 1 || unit.cellX >= 16) {
        queueMissionEightRole(commands, `east-b-wave-two-${objectKey(unit)}`,
          [unit], rally, MODIFIER_ALT, 20);
      }
    }
    if (waveTwo.length > 0) {
      const waveTwoKeys = new Set(waveTwo.map(objectKey));
      strike = strike.filter((attacker) => !waveTwoKeys.has(objectKey(attacker)));
      if (strike.length === 0) return;
    }
  }
  const postFactCleanupTransitRoute = [
    { cellX: 29, cellY: 40, label: "cleanup southern crossing" },
    { cellX: 21, cellY: 30, label: "cleanup basin assembly" },
    { cellX: 12, cellY: 12, label: "cleanup western assembly" },
  ];
  if (mission.variant === "east-a" && state.postFactCleanupLaunchTick !== undefined
    && state.postFactCleanupTransitStage < postFactCleanupTransitRoute.length) {
    const cleanupStrike = strike.filter((attacker) => (
      state.postFactCleanupCohortKeys.has(objectKey(attacker))
    ));
    const waypoint = postFactCleanupTransitRoute[state.postFactCleanupTransitStage];
    const liveRockets = cleanupStrike.filter((attacker) => attacker.typeName === "E3");
    const rifles = cleanupStrike.filter((attacker) => attacker.typeName !== "E3");
    const rocketWaypoint = waypoint;
    const arrivals = rifles.filter((attacker) => (
      missionEightDistance(attacker, waypoint) <= 3
    )).length;
    const rocketsArrived = liveRockets.every((attacker) => (
      missionEightDistance(attacker, rocketWaypoint) <= 3
    ));
    const required = Math.min(rifles.length,
      Math.max(1, Math.ceil(rifles.length * 0.8)));
    if (arrivals >= required && rocketsArrived) {
      state.postFactCleanupTransitProgress.push({
        tick: snapshot.tick,
        stage: state.postFactCleanupTransitStage,
        ...waypoint,
        arrivals,
        required,
        rockets: liveRockets.length,
      });
      state.postFactCleanupTransitStage += 1;
    } else {
      for (let index = 0; index < rifles.length; index += 10) {
        queueMissionEightRole(commands,
          `east-a-post-fact-transit-${state.postFactCleanupTransitStage}-${index / 10}`,
          rifles.slice(index, index + 10), waypoint, MODIFIER_ALT, 45);
      }
      if (liveRockets.length > 0) {
        queueMissionEightRole(commands,
          `east-a-post-fact-rockets-${state.postFactCleanupTransitStage}`,
          liveRockets, rocketWaypoint, MODIFIER_ALT, 45);
      }
      return;
    }
  }
  const factCapturePending = mission.variant === "east-a"
    && state.engineer.key !== undefined && state.engineer.captureTick === undefined
    && state.engineer.deathTick === undefined
    && friendly.some((object) => (
      objectKey(object) === state.engineer.key
      || objectKey(object) === state.engineer.transportKey
    ));
  if (queueMissionEightWestCleanup(snapshot, hostiles, strike, commands)) return;
  const waypoint = route[Math.min(state.routeStage, route.length - 1)];
  const waitingForAssembly = false;
  let completedNorthFront = false;
  if (state.routeStage < route.length) {
    const arrivals = strike.filter((attacker) => missionEightDistance(attacker, waypoint) <= 3).length;
    // East-b northbound force-move: count tanks already north of the waypoint as
    // arrivals so we do not thrash them south after an overshoot (TRACE v41:
    // stage 0 @25,48 kept recalling tanks from y≈34 back to y≈58 for 3k ticks).
    const eastBPastArrivals = mission.variant === "east-b" && waypoint.forceMove
      ? strike.filter((attacker) => (
        attacker.typeName === "MTNK"
        && attacker.cellY <= waypoint.cellY + 1
        && attacker.cellX <= Math.max(waypoint.cellX + 6, 20)
      )).length
      : 0;
    const effectiveArrivals = Math.max(arrivals, eastBPastArrivals);
    const required = mission.variant === "east-a"
      ? waypoint.label === "southern assembly"
          ? Math.min(strike.length, Math.max(1, Math.ceil(strike.length * 0.7)))
        : Math.min(strike.length, 24, Math.max(3, Math.ceil(strike.length * 0.6)))
      : Math.min(
        strike.filter((attacker) => attacker.typeName === "MTNK").length || strike.length,
        Math.max(1, Math.ceil((strike.filter((a) => a.typeName === "MTNK").length || strike.length) * 0.6)),
      );
    const targetCellX = waypoint.targetCellX ?? waypoint.cellX;
    const targetCellY = waypoint.targetCellY ?? waypoint.cellY;
    const routeTargetAlive = waypoint.typeName && hostiles.some((hostile) => (
      hostile.typeName === waypoint.typeName
      && hostile.cellX === targetCellX && hostile.cellY === targetCellY
    ));
    if (missionEightRouteTarget(snapshot, hostiles, waypoint)) {
      state.routeTargetEngagedStages.add(state.routeStage);
    }
    const targetDestroyedOnStage = waypoint.typeName && !routeTargetAlive
      && state.routeTargetEngagedStages.has(state.routeStage);
    if (!waitingForAssembly && !routeTargetAlive
      && (targetDestroyedOnStage || waypoint.typeName === "FACT"
        || effectiveArrivals >= required)) {
      state.routeProgress.push({
        tick: snapshot.tick,
        stage: state.routeStage,
        label: waypoint.label,
        cellX: waypoint.cellX,
        cellY: waypoint.cellY,
        arrivals: effectiveArrivals,
        ...(mission.variant === "east-a" && waypoint.typeName === "FACT" ? {
          secondCohort: strike.filter((attacker) => (
            state.secondWaveCohortKeys.has(objectKey(attacker))
          )).length,
          thirdCohort: strike.filter((attacker) => (
            state.thirdWaveCohortKeys.has(objectKey(attacker))
          )).length,
        } : {}),
      });
      state.routeStage += 1;
      state.routeStageStartedTick = snapshot.tick;
      if (mission.variant === "east-a" && waypoint.label === "northern SAM") {
        for (const key of state.strikeKeys) state.northHoldKeys.add(key);
        state.strikeKeys.clear();
        state.northHoldTick = snapshot.tick;
        completedNorthFront = true;
      }
    }
  }
  if (completedNorthFront) return;
  const nextWaypoint = waitingForAssembly
    ? waypoint
    : route[Math.min(state.routeStage, route.length - 1)] ?? waypoint;
  const routeTarget = missionEightRouteTarget(snapshot, hostiles, nextWaypoint);
  const forceFactFocus = mission.variant === "east-a"
    && nextWaypoint.typeName === "FACT" && routeTarget && !factCapturePending;
  const targetCellX = nextWaypoint.targetCellX ?? nextWaypoint.cellX;
  const targetCellY = nextWaypoint.targetCellY ?? nextWaypoint.cellY;
  const awaitingRouteTargetVisibility = mission.variant === "east-a"
    && nextWaypoint.typeName && !routeTarget && hostiles.some((hostile) => (
      hostile.typeName === nextWaypoint.typeName
      && hostile.cellX === targetCellX && hostile.cellY === targetCellY
    ));
  const forceMoveCorridor = mission.variant === "east-a" && !nextWaypoint.typeName
    && (nextWaypoint.label.startsWith("southern ")
      || nextWaypoint.label.startsWith("post-strike ")
      || nextWaypoint.label === "production approach"
      || nextWaypoint.label === "western ridge crossing")
    || mission.variant === "east-b" && Boolean(nextWaypoint.forceMove);
  let screeningStrike = strike;
  // East-b GUN/SAM: aggressive focus-fire (v23 best: SAM chipped to ~276).
  // Factory-fresh tanks pre-rally west so a second wave is mid-corridor when
  // the first wave hits SAM. Pure solos on a full-HP SAM hold at the firing
  // line; any 2+ live tanks always commit.
  if (mission.variant === "east-b" && nextWaypoint.typeName
    && (nextWaypoint.typeName === "GUN" || nextWaypoint.typeName === "SAM")) {
    const westernSam = hostiles.find((hostile) => (
      hostile.typeName === "SAM" && hostile.cellX === 13 && hostile.cellY === 16
    ));
    const westernGun = hostiles.find((hostile) => (
      hostile.typeName === "GUN" && hostile.cellX === 11 && hostile.cellY === 18
    ));
    const samDeepChip = Boolean(
      state.eastBSamDeepChip && westernSam && westernSam.strength > 0
    );
    const liveStrikeTanks = strike.filter((attacker) => (
      attacker.typeName === "MTNK" && attacker.strength > 0
    ));
    // Pure solo on a pristine SAM: rail to the gate and wait for a partner.
    // Any chip (strength < max) → solo finishes (TRACE v27: tank #37 sat at
    // 13,23 while SAM sat at 360 because the wait threshold was too low).
    if (nextWaypoint.typeName === "SAM" && westernSam
      && liveStrikeTanks.length === 1
      && westernSam.strength >= westernSam.maxStrength) {
      const tank = liveStrikeTanks[0];
      const rally = tank.cellY >= 40
        ? { cellX: 13, cellY: 32 }
        : tank.cellY >= 28
          ? { cellX: 13, cellY: 27 }
          : { cellX: 13, cellY: 23 };
      if (missionEightDistance(tank, rally) > 2) {
        queueMissionEightRole(commands, "east-b-sam-solo-rally", [tank],
          rally, MODIFIER_ALT, 20);
      }
      return;
    }
    // Chipped SAM reinforcements: hard-rail onto X=13 only (never 25,48 / east
    // detours). TRACE v52–54: finishers pathfinded to 45,33 or looped y=47–60.
    if (nextWaypoint.typeName === "SAM" && westernSam
      && westernSam.strength < westernSam.maxStrength) {
      if (samDeepChip) {
        const samCloseCell = (tank) => {
          if (tank.cellX >= 15) {
            if (tank.cellY > 22) return { cellX: 13, cellY: 21 };
            if (tank.cellY > 20) return { cellX: 14, cellY: 20 };
            return { cellX: 14, cellY: 20 };
          }
          if (tank.cellY > 22 && tank.cellX >= 10 && tank.cellX <= 15) {
            return { cellX: 13, cellY: 21 };
          }
          return { cellX: 11, cellY: 20 };
        };
        for (const tank of liveStrikeTanks) {
          if (missionEightDistance(tank, westernSam) <= 5) {
            queueMissionEightRole(commands, `east-b-sam-deep-fire-${objectKey(tank)}`,
              [tank], westernSam, 0, 1);
          } else {
            const close = samCloseCell(tank);
            queueMissionEightRole(commands, `east-b-sam-deep-close-${objectKey(tank)}`,
              [tank], close, 0, 1);
          }
        }
        const deepRockets = strike.filter((attacker) => attacker.typeName === "E3");
        if (deepRockets.length > 0) {
          if (westernSam.strength <= 220) {
            queueMissionEightRole(commands, "east-b-sam-deep-rockets", deepRockets,
              westernSam, 0, 1);
          } else {
            queueMissionEightRole(commands, "east-b-sam-deep-rocket-hold", deepRockets,
              { cellX: 13, cellY: 26 }, MODIFIER_ALT, 5);
          }
        }
        return;
      }
      const trailers = liveStrikeTanks.filter((tank) => (
        tank.cellY >= 26 || tank.cellX >= 16 || tank.cellX <= 9
      ));
      const front = liveStrikeTanks.filter((tank) => (
        tank.cellY < 26 && tank.cellX >= 10 && tank.cellX <= 15
      ));
      if (trailers.length > 0) {
        const samFinishRailCadence = samDeepChip ? 1 : 10;
        for (const tank of trailers) {
          if (samDeepChip && tank.cellX >= 10 && tank.cellX <= 15 && tank.cellY <= 32) {
            queueMissionEightRole(commands, `east-b-sam-finish-rush-${objectKey(tank)}`,
              [tank], westernSam, 0, 1);
            continue;
          }
          const rally = samDeepChip
            ? { cellX: 13, cellY: 20 }
            : tank.cellY >= 55
              ? { cellX: 13, cellY: 48 }
              : tank.cellY >= 40
                ? { cellX: 13, cellY: 32 }
                : tank.cellY >= 28
                  ? { cellX: 13, cellY: 24 }
                  : { cellX: 13, cellY: 20 };
          queueMissionEightRole(commands, `east-b-sam-finish-rail-${objectKey(tank)}`,
            [tank], rally, MODIFIER_ALT, samFinishRailCadence);
        }
        if (front.length === 0) {
          const rockets = strike.filter((attacker) => attacker.typeName === "E3");
          if (rockets.length > 0) {
            queueMissionEightRole(commands, "east-b-sam-finish-rockets", rockets,
              westernSam, 0, 15);
          }
          return;
        }
      }
    }
    // GUN stage: kill the turret. SAM stage: always the western SAM (do not
    // get stuck re-fighting a surviving GUN while a chipped SAM waits —
    // TRACE v29: solo sat at 13,23 and never finished SAM@344).
    const visibleFocus = missionEightRouteTarget(snapshot, hostiles, nextWaypoint);
    const focus = nextWaypoint.typeName === "SAM"
      ? (westernSam
        ?? visibleFocus
        ?? { cellX: 13, cellY: 16 })
      : (visibleFocus
        ?? westernGun
        ?? westernSam
        ?? {
          cellX: nextWaypoint.targetCellX ?? nextWaypoint.cellX,
          cellY: nextWaypoint.targetCellY ?? nextWaypoint.cellY,
        });
    const focusIsUnit = Boolean(focus && focus.typeName);
    const tanks = liveStrikeTanks;
    const rest = strike.filter((attacker) => attacker.typeName !== "MTNK");
    // GUN: shoot from y≈22–23. SAM: close onto the structure.
    // All tanks commit — reserve holds regressed SAM damage to 0 (v38).
    // Weapon range ~4–5. GUN@18 needs y≈22; SAM@16 needs y≈20. Stay out of
    // the pad (y≤17) but do not hold at y=23 forever (TRACE v57: last tank sat
    // at 12,23 for 600 ticks with SAM@400 undamaged).
    const gunStandoff = { cellX: 12, cellY: 22 };
    const samStandoff = { cellX: 12, cellY: 20 };
    const eastBGunApproachRally = (tank) => (
      tank.cellY >= 28
        ? { cellX: 13, cellY: 24 }
        : tank.cellX >= 14
          ? { cellX: 13, cellY: 22 }
          : gunStandoff
    );
    const eastBSamFormRally = (tank) => {
      if (samDeepChip) return { cellX: 13, cellY: 20 };
      if (tank.cellY >= 28) return { cellX: 13, cellY: 24 };
      if (tank.cellX > 13 && tank.cellY <= 24) {
        return { cellX: 13, cellY: Math.max(tank.cellY + 2, 24) };
      }
      if (tank.cellX >= 15 || tank.cellX <= 9 || tank.cellX !== 13) {
        return { cellX: 13, cellY: Math.min(tank.cellY, 20) };
      }
      if (tank.cellY > 21) return { cellX: 13, cellY: 20 };
      return { cellX: 13, cellY: 20 };
    };
    const isGunFocus = focus?.typeName === "GUN" || nextWaypoint.typeName === "GUN";
    const engageRange = isGunFocus ? 5 : 6;
    // GUN: with 3+ MTNKs always commit; with 2, wait for both near the line.
    const gunForming = isGunFocus && focusIsUnit && tanks.length === 2
      && tanks.filter((tank) => tank.cellY <= 25).length < 2
      && tanks.some((tank) => tank.cellY <= 24);
    if (gunForming) {
      const ready = tanks.filter((tank) => tank.cellY <= 25);
      const trailing = tanks.filter((tank) => tank.cellY > 25);
      if (ready.length > 0) {
        queueMissionEightRole(commands, "east-b-gun-form-hold", ready,
          gunStandoff, MODIFIER_ALT, 12);
      }
      for (const tank of trailing) {
        const rally = tank.cellY >= 30
          ? { cellX: 13, cellY: 27 }
          : eastBGunApproachRally(tank);
        queueMissionEightRole(commands, `east-b-gun-form-trail-${objectKey(tank)}`,
          [tank], rally, MODIFIER_ALT, 12);
      }
      const rockets = strike.filter((attacker) => attacker.typeName === "E3");
      if (rockets.length > 0) {
        queueMissionEightRole(commands, "east-b-gun-form-rockets", rockets,
          { cellX: 13, cellY: 26 }, MODIFIER_ALT, 20);
      }
      return;
    }
    // SAM: pin everyone to the fire band first, then shoot. Trailers use a
    // single shared role so cadence cannot stall individual approach keys.
    // Band is y=18–22 (TRACE v61: finisher@11,22 was classed tooFar and
    // force-moved instead of shooting SAM@314).
    if (!isGunFocus && focusIsUnit) {
      // Once a finisher is on the corridor (y≤30), attack-move the SAM directly.
      // Standoff dancing burned HP walking 26→22 without shots (TRACE v62).
      const trailers = tanks.filter((tank) => tank.cellY > 30);
      const finishers = tanks.filter((tank) => tank.cellY <= 30);
      if (trailers.length > 0) {
        for (const tank of trailers) {
          if (samDeepChip && tank.cellX >= 10 && tank.cellX <= 15 && tank.cellY <= 32) {
            queueMissionEightRole(commands, `east-b-sam-trail-rush-${objectKey(tank)}`,
              [tank], focus, 0, 1);
            continue;
          }
          const rally = samDeepChip
            ? { cellX: 13, cellY: 20 }
            : tank.cellY >= 55
              ? (tank.cellX >= 22 ? { cellX: 25, cellY: 48 } : { cellX: 13, cellY: 48 })
              : tank.cellY >= 40
                ? { cellX: 13, cellY: 32 }
                : { cellX: 13, cellY: 24 };
          queueMissionEightRole(commands, `east-b-sam-trail-${objectKey(tank)}`,
            [tank], rally, MODIFIER_ALT, samDeepChip ? 1 : 10);
        }
      }
      const samApproachBand = finishers.filter((tank) => (
        tank.cellY <= 24 && tank.cellX >= 10 && tank.cellX <= 15
      ));
      const inSamRange = finishers.filter((tank) => (
        focusIsUnit && missionEightDistance(tank, focus) <= 5
      ));
      const needsClose = finishers.filter((tank) => (
        !inSamRange.some((ready) => objectKey(ready) === objectKey(tank))
      ));
      const samUrgent = Boolean(westernSam && westernSam.strength <= 300);
      const samChipBand = Boolean(
        !samDeepChip && westernSam
        && westernSam.strength > 220
        && westernSam.strength < 280
      );
      const samFormCadence = samDeepChip ? 1
        : samUrgent && samApproachBand.length >= 2
          ? 1
          : samApproachBand.length >= 2 ? 1 : inSamRange.length >= 1 ? 3 : 10;
      for (const tank of needsClose) {
        if (samDeepChip && tank.cellX >= 10 && tank.cellX <= 15 && tank.cellY <= 30) {
          queueMissionEightRole(commands, `east-b-sam-kill-rush-${objectKey(tank)}`,
            [tank], focus, 0, 1);
          continue;
        }
        const samDist = westernSam ? missionEightDistance(tank, westernSam) : 99;
        const nearCorridor = tank.cellY <= 26 && tank.cellX >= 10 && tank.cellX <= 15;
        let target;
        if (nearCorridor) {
          if (samChipBand && tank.cellX >= 15 && samDist > 5) {
            target = tank.cellY > 22
              ? { cellX: 13, cellY: 21 }
              : tank.cellY > 20
                ? { cellX: 14, cellY: 20 }
                : samStandoff;
          } else if (samChipBand && tank.cellY > 22 && samDist > 5) {
            target = { cellX: 13, cellY: 21 };
          } else {
            target = samStandoff;
          }
        } else {
          target = eastBSamFormRally(tank);
        }
        queueMissionEightRole(commands, `east-b-sam-form-${objectKey(tank)}`,
          [tank], target,
          samChipBand && tank.cellX >= 15 && samDist > 5
            ? 0 : MODIFIER_ALT,
          samChipBand && tank.cellX >= 15 ? 1 : samFormCadence);
      }
      if (inSamRange.length > 0) {
        queueMissionEightRole(commands, "east-b-focus-tanks", inSamRange, focus, 0,
          samDeepChip || samUrgent ? 1 : 10);
      }
    } else {
      const inRange = focusIsUnit
        ? tanks.filter((tank) => missionEightDistance(tank, focus) <= engageRange)
        : [];
      const approaching = tanks.filter((tank) => (
        !inRange.some((ready) => objectKey(ready) === objectKey(tank))
      ));
      if (inRange.length > 0) {
        queueMissionEightRole(commands, "east-b-focus-tanks", inRange, focus, 0, 12);
      }
      for (const tank of approaching) {
        queueMissionEightRole(commands, `east-b-focus-approach-${objectKey(tank)}`,
          [tank], eastBGunApproachRally(tank), MODIFIER_ALT, 12);
      }
    }
    const rockets = strike.filter((attacker) => attacker.typeName === "E3");
    // Hold rockets off the GUN fight — they die under dual GUN/SAM fire before
    // the turret drops (TRACE v48: 3 E3@11,22 gone within 300 ticks). Commit
    // only on SAM stage for building DPS.
    if (isGunFocus) {
      if (rockets.length > 0) {
        queueMissionEightRole(commands, "east-b-rocket-gun-hold", rockets,
          { cellX: 13, cellY: 28 }, MODIFIER_ALT, 12);
      }
    } else {
      const samRocketHold = { cellX: 13, cellY: 28 };
      const samOverlapFire = tanks.filter((tank) => (
        tank.cellY <= 24 && tank.cellX >= 10 && tank.cellX <= 15
      )).length >= 2;
      const samRocketDeepCommit = Boolean(
        focusIsUnit
        && missionEightState.eastBSamDeepChip
        && westernSam
        && westernSam.strength <= 220
      );
      const samRocketChipCommit = Boolean(
        focusIsUnit
        && !samRocketDeepCommit
        && samOverlapFire
        && westernSam
        && westernSam.strength <= 280
        && westernSam.strength > 220
      );
      const samRocketEarlyCommit = Boolean(
        focusIsUnit && (
          (!westernSam || westernSam.strength > 280)
          && (
            missionEightState.eastBSamDeepChip
            || samOverlapFire
            || (westernSam && westernSam.strength <= 300)
            || focus.strength < focus.maxStrength
            || focus.strength <= 360
          )
        )
      );
      const rocketInRange = focusIsUnit
        ? rockets.filter((unit) => missionEightDistance(unit, focus) <= 5)
        : [];
      const rocketApproaching = rockets.filter((unit) => (
        !rocketInRange.some((ready) => objectKey(ready) === objectKey(unit))
      ));
      if (rocketInRange.length > 0) {
        if (samRocketDeepCommit) {
          queueMissionEightRole(commands, "east-b-focus-rockets", rocketInRange, focus, 0, 1);
        } else if (samRocketChipCommit) {
          queueMissionEightRole(commands, "east-b-focus-rockets", rocketInRange, focus, 0, 3);
        } else if (samRocketEarlyCommit) {
          queueMissionEightRole(commands, "east-b-focus-rockets", rocketInRange, focus, 0, 3);
        } else {
          queueMissionEightRole(commands, "east-b-rocket-range-hold", rocketInRange,
            samRocketHold, MODIFIER_ALT, 5);
        }
      }
      if (rocketApproaching.length > 0) {
        if (samRocketDeepCommit || samRocketChipCommit) {
          queueMissionEightRole(commands, "east-b-rocket-commit", rocketApproaching,
            focus, 0, samRocketDeepCommit ? 1 : 5);
        } else if (samRocketEarlyCommit) {
          queueMissionEightRole(commands, "east-b-rocket-commit", rocketApproaching,
            focus, 0, samOverlapFire ? 3 : 15);
        } else {
          queueMissionEightRole(commands, "east-b-rocket-approach", rocketApproaching,
            samRocketHold, MODIFIER_ALT, 5);
        }
      }
    }
    const nonRocketRest = rest.filter((attacker) => attacker.typeName !== "E3");
    if (nonRocketRest.length > 0) {
      const tanksEngaged = focusIsUnit && tanks.some((tank) => (
        missionEightDistance(tank, focus) <= engageRange && tank.cellY <= 24
      ));
      const restTarget = tanksEngaged && focusIsUnit
        ? focus
        : { cellX: 13, cellY: 23 };
      queueMissionEightRole(commands, "east-b-focus-screen", nonRocketRest, restTarget,
        tanksEngaged && focusIsUnit ? 0 : MODIFIER_ALT, 30);
    }
    if (samDeepChip && focusIsUnit && westernSam) {
      const killClose = liveStrikeTanks.filter((tank) => (
        missionEightDistance(tank, focus) > engageRange
        && tank.cellX >= 10 && tank.cellX <= 15 && tank.cellY <= 30
      ));
      if (killClose.length > 0) {
        queueMissionEightRole(commands, "east-b-sam-kill-close", killClose, focus, 0, 1);
      }
    }
    return;
  }
  // Hard-rail factory-fresh or east-wandered strike MTNKs onto X=13.
  // When the western SAM is chipped, rail ANY strike tank still south of the
  // gate (TRACE v59: fresh MTNK@32,55 wandered to 26,60 and died with SAM@238).
  if (mission.variant === "east-b" && state.assaultTick !== undefined) {
    const westernSamLive = hostiles.find((hostile) => (
      hostile.typeName === "SAM" && hostile.cellX === 13 && hostile.cellY === 16
    ));
    const samFinishRail = Boolean(
      westernSamLive && westernSamLive.strength < westernSamLive.maxStrength
    );
    const samKillRail = Boolean(
      westernSamLive && missionEightState.eastBSamDeepChip && westernSamLive.strength > 0
    );
    if (samKillRail && westernSamLive) {
      const samFireCell = { cellX: 11, cellY: 20 };
      for (const tank of strike.filter((attacker) => (
        attacker.typeName === "MTNK" && attacker.strength > 0
      ))) {
        if (missionEightDistance(tank, westernSamLive) <= 5) {
          queueMissionEightRole(commands, `east-b-sam-kill-west-fire-${objectKey(tank)}`,
            [tank], westernSamLive, 0, 1);
        } else {
          queueMissionEightRole(commands, `east-b-sam-kill-west-close-${objectKey(tank)}`,
            [tank], samFireCell, 0, 1);
        }
      }
      const killRockets = strike.filter((attacker) => attacker.typeName === "E3");
      if (killRockets.length > 0) {
        queueMissionEightRole(commands, "east-b-sam-kill-west-rockets", killRockets,
          westernSamLive, 0, 1);
      }
      return;
    }
    const needsRail = strike.filter((attacker) => (
      attacker.typeName === "MTNK"
      && (
        (attacker.cellX >= 32 && attacker.cellY >= 48)
        || (attacker.cellX >= 22 && attacker.cellY <= 42 && state.routeStage >= 1
          && state.routeStage <= 7)
        || (state.routeStage >= 6 && attacker.cellX >= 14 && attacker.cellY <= 26)
        || (samKillRail && state.eastBProducedTankKeys.has(objectKey(attacker))
          && attacker.cellY >= 35)
        || (samFinishRail && (attacker.cellY >= 28 || attacker.cellX >= 16
          || attacker.cellX <= 9))
      )
    ));
    if (needsRail.length > 0) {
      const front = strike.filter((attacker) => (
        !needsRail.some((unit) => objectKey(unit) === objectKey(attacker))
      ));
      const westRailCadence = samKillRail ? 1 : 10;
      for (const tank of needsRail) {
        const rally = samKillRail
          ? { cellX: 13, cellY: 20 }
          : tank.cellY >= 55
            ? { cellX: 13, cellY: 48 }
            : tank.cellY >= 40
              ? { cellX: 13, cellY: 32 }
              : tank.cellY >= 28
                ? { cellX: 13, cellY: 24 }
                : { cellX: 13, cellY: 20 };
        queueMissionEightRole(commands, `east-b-west-rail-${objectKey(tank)}`,
          [tank], rally, MODIFIER_ALT, westRailCadence);
      }
      // During SAM finish, do not fall through to generic corridor orders for
      // railed tanks — keep them on the X=13 spine.
      if (samFinishRail || (!forceMoveCorridor && !nextWaypoint.typeName && front.length === 0)) {
        if (front.length === 0) return;
      }
      if (front.length > 0) screeningStrike = front;
    }
  }
  if (mission.variant === "east-b" && forceMoveCorridor) {
    const far = strike.filter((attacker) => (
      attacker.typeName === "MTNK"
      && missionEightDistance(attacker, nextWaypoint) > 10
      && attacker.cellY > (nextWaypoint.cellY + 6)
    ));
    if (far.length > 0) {
      const near = strike.filter((attacker) => (
        !far.some((unit) => objectKey(unit) === objectKey(attacker))
      ));
      for (const tank of far) {
        const rally = tank.cellY >= 40
          ? { cellX: 13, cellY: 32 }
          : tank.cellY >= 28
            ? { cellX: 13, cellY: 27 }
            : { cellX: 13, cellY: 23 };
        queueMissionEightRole(commands, `east-b-corridor-rally-${objectKey(tank)}`,
          [tank], rally, MODIFIER_ALT, 25);
      }
      screeningStrike = near;
    }
    // Keep rockets with the armor column until GUN stage. Staging them alone at
    // 13,32 while tanks thrashed south (TRACE v41) left three E3s to die to
    // patrols; walking them in the peel screen (v40) also wiped them.
    if (state.routeStage < 6) {
      const packRockets = screeningStrike.filter((attacker) => attacker.typeName === "E3");
      if (packRockets.length > 0) {
        const leadTank = strike.filter((attacker) => attacker.typeName === "MTNK")
          .toSorted((left, right) => left.cellY - right.cellY || left.id - right.id)[0];
        // Stay one step south of the lead tank, never north of the support hold,
        // so rockets do not outrun armor into the GUN arc.
        const hold = leadTank
          ? {
            cellX: Math.min(16, Math.max(11, leadTank.cellX)),
            cellY: Math.min(55, Math.max(32, leadTank.cellY + 2)),
          }
          : { cellX: 25, cellY: 50 };
        const movers = packRockets.filter((unit) => missionEightDistance(unit, hold) > 2);
        if (movers.length > 0) {
          queueMissionEightRole(commands, "east-b-rocket-hold", movers, hold, MODIFIER_ALT, 45);
        }
        const rocketKeys = new Set(packRockets.map(objectKey));
        screeningStrike = screeningStrike.filter((attacker) => (
          !rocketKeys.has(objectKey(attacker))
        ));
      }
    }
  }
  if (mission.variant === "east-a" && nextWaypoint.typeName && routeTarget
    && !(factCapturePending && nextWaypoint.typeName === "FACT")) {
    const demolitionPriority = new Map([
      ["MTNK", 0], ["MSAM", 1], ["APC", 2], ["JEEP", 3],
      ["E3", 4], ["E2", 5], ["E1", 6],
    ]);
    const demolitionSize = Math.min(10, strike.length,
      Math.max(3, Math.ceil(strike.length * 0.4)));
    const demolitionGroup = strike.toSorted((left, right) => (
      (demolitionPriority.get(left.typeName) ?? 20)
        - (demolitionPriority.get(right.typeName) ?? 20)
      || right.strength / right.maxStrength - left.strength / left.maxStrength
      || left.id - right.id
    )).slice(0, demolitionSize);
    const demolitionKeys = new Set(demolitionGroup.map(objectKey));
    screeningStrike = strike.filter((attacker) => !demolitionKeys.has(objectKey(attacker)));
    queueMissionEightRole(commands, "strike-sam-demolition", demolitionGroup, routeTarget, 0, 30);
  }
  if (forceMoveCorridor) {
    const threatPriority = new Map([
      ["ARTY", 0], ["LTNK", 1], ["GUN", 2], ["BGGY", 3], ["E4", 4], ["E3", 5], ["E1", 6],
    ]);
    const engageRadius = mission.variant === "east-b" ? 8 : 6;
    const corridorThreat = hostiles.filter((hostile) => (
      snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
      && (hostile.type === 1 || hostile.type === 2 || hostile.typeName === "GUN")
      && screeningStrike.some((attacker) => (
        missionEightDistance(attacker, hostile) <= engageRadius
      ))
    )).toSorted((left, right) => (
      (threatPriority.get(left.typeName) ?? 20) - (threatPriority.get(right.typeName) ?? 20)
      || Math.min(...screeningStrike.map((attacker) => missionEightDistance(attacker, left)))
        - Math.min(...screeningStrike.map((attacker) => missionEightDistance(attacker, right)))
      || left.strength - right.strength
      || left.id - right.id
    ))[0];
    // East-b western gate: clear hard threats (armor/arty/gun) before force-move.
    // Soft infantry peels after stage 2 bleed the cohort before GUN/SAM
    // (TRACE v22: 3 MTNKs reached SAM at ~364 HP then wiped; finish needs HP).
    if (mission.variant === "east-b" && corridorThreat) {
      const hardThreat = ["ARTY", "LTNK", "GUN", "BGGY", "TRAN"].includes(
        corridorThreat.typeName,
      );
      const earlyStage = state.routeStage <= 2;
      if (hardThreat || earlyStage) {
        for (let index = 0; index < screeningStrike.length; index += 10) {
          queueMissionEightRole(commands, `east-b-corridor-clear-${index / 10}`,
            screeningStrike.slice(index, index + 10), corridorThreat, 0, 30);
        }
        return;
      }
    }
    for (const key of state.corridorScreenKeys) {
      if (!screeningStrike.some((attacker) => objectKey(attacker) === key)) {
        state.corridorScreenKeys.delete(key);
      }
    }
    const screenSize = Math.min(10, Math.max(2, Math.ceil(screeningStrike.length * 0.28)));
    // East-b: never spend pack rockets as corridor peelers — they are the only
    // cheap GUN/SAM building DPS (TRACE v40 wiped all 3 E3s as preferred screen).
    const screenPriority = mission.variant === "east-b"
      ? new Map([["E1", 0], ["E2", 1], ["JEEP", 2], ["E3", 9]])
      : new Map([["E3", 0], ["E2", 1], ["E1", 2]]);
    const candidates = screeningStrike.filter((attacker) => (
      !state.corridorScreenKeys.has(objectKey(attacker))
      && !(mission.variant === "east-b" && attacker.typeName === "E3")
    )).toSorted((left, right) => (
      (screenPriority.get(left.typeName) ?? 10) - (screenPriority.get(right.typeName) ?? 10)
      || right.strength / right.maxStrength - left.strength / left.maxStrength
      || left.id - right.id
    ));
    const neededScreeners = Math.max(0, screenSize - state.corridorScreenKeys.size);
    for (const candidate of candidates.slice(0, neededScreeners)) {
      state.corridorScreenKeys.add(objectKey(candidate));
    }
    const corridorScreen = screeningStrike.filter((attacker) => (
      state.corridorScreenKeys.has(objectKey(attacker))
    ));
    queueMissionEightRole(commands, "strike-corridor-screen", corridorScreen,
      corridorThreat ?? nextWaypoint, corridorThreat ? 0 : MODIFIER_ALT, 45);
    const corridorScreenKeys = new Set(corridorScreen.map(objectKey));
    screeningStrike = screeningStrike.filter((attacker) => (
      !corridorScreenKeys.has(objectKey(attacker))
    ));
  }
  const groups = Array.from({ length: Math.ceil(screeningStrike.length / 10) }, (_, index) => (
    screeningStrike.slice(index * 10, index * 10 + 10)
  ));
  for (let index = 0; index < groups.length; index += 1) {
    const forceEastBRouteTarget = mission.variant === "east-b"
      && nextWaypoint.typeName && routeTarget;
    let target = forceFactFocus || forceEastBRouteTarget
      ? routeTarget
      : waitingForAssembly || forceMoveCorridor || awaitingRouteTargetVisibility
      ? undefined : missionEightAssaultTarget(
      snapshot,
      groups[index],
      hostiles,
      nextWaypoint,
      state.routeStage >= 3 ? index % 3 : 0,
    );
    if (factCapturePending && nextWaypoint.typeName === "FACT" && target === routeTarget) {
      target = undefined;
    }
    const destination = target ?? (factCapturePending && nextWaypoint.typeName === "FACT"
      ? { cellX: 12, cellY: 12 }
      : nextWaypoint);
    const flags = (mission.variant === "east-a" || forceMoveCorridor) && !target
      ? MODIFIER_ALT : 0;
    queueMissionEightRole(commands, `strike-${index}`, groups[index], destination, flags, 45);
  }
}

function queueMissionEightTurn(snapshot, friendly, hostiles, attackers, commands) {
  observeMissionEightTurn(snapshot, friendly, hostiles);
  queueMissionEightBase(snapshot, friendly, hostiles, commands);
  queueMissionEightForces(snapshot, friendly, hostiles, attackers, commands);
}
const missionFourProtectedVillageCells = new Set([
  "18:44",
  "19:46",
  "24:50",
  "25:53",
]);
let initialProtectedVillageCount = 0;
const initialProtectedVillageCells = new Set();
let westBPhase = "load";
let westBRouteStage = 0;
let westBCombatStage = 0;
let westBOwnUnloadIssued = false;
let westBWaitStarted;
let westBLoadIssued = false;
let westBLastScreenOrder;
let westBLastGrenadierOrder;
const westBGrenadierOrders = new Map();
const westBGrenadierOrderTicks = new Map();
const westBScatterTicks = new Map();
let westBJeepKey;
let westBReserveApcKey;
let westBReserveApcPositioned = false;
let westBReserveApcOrderTick = -Infinity;
let westBReserveApcCleanupTargetKey;
let westBTakeoverInitialized = false;
let westBTakeoverPhase = "support";
let westBTakeoverTargetKey;
let westBTakeoverOrderTick = -Infinity;
let westBTakeoverApcInitialStrength;
let westBTakeoverTargetInitialStrength;
let westBTakeoverTargetOrigin;
let westBTakeoverParkedTick;
let westBIntegratedOpeningNormalized = false;
let westBReinforcementsReady = false;
let westBLateAssaultStarted = false;
const westBInitialE2Keys = new Set();
let westBScreenRetreatStarted = false;
let westBScreenRetreatStage = 0;
let westBScreenContactTick;
let westBEndgameRouteStage = 0;
let westBEndgameRouteOrder;
let westBScreenOrder;
let westBFocusOrder;
let westBLureTankKey;
let westBLureDecoyKey;
let westBLurePhase = "approach";
let westBLureRetreatStage = 0;
let westBLureOrder;
let westBLureActivated = false;
let westBLureTargetOrigin;
let westBLureTargetInitialStrength;
let westBLureDecoyInitialStrength;
let westBLureProgressTick = -Infinity;
let westBLureProgressSignature;
const westBLureDecoyBlacklist = new Set();
let westBGuardPhase = "stage";
let westBGuardPhaseTick = 0;
let westBLineEstablished = false;
let westBGuardFocusing = false;
let westBAssaultTargetKey;
let westBAssaultAnchor;
let westBAssaultStartedTick;
let westBKiteActive = false;
let westBKiteTargetKey;
let westBKiteDecoyKey;
let westBKiteRetreatPoint;
let westBKiteOrderTick = -Infinity;
const westBCriticalReserveKeys = new Set();
const westBCriticalReservePoints = new Map();
const westBCriticalReserveOrderTicks = new Map();
let westBLastStand = false;
let westBIntegratedPhase = "opening";
const westBReserveLinePoints = new Map();
let westBReserveGuardOrderTick = -Infinity;
let westBReserveScreenOrderTick = -Infinity;
let westBReserveAssaultPhase = "support";
let westBReserveAssaultTargetKey;
let westBReserveAssaultPhaseTick = 0;
let westBReserveApcStopped = false;
let westBFinalCleanupRetreat = false;
let westBSupportClearOrderTick = -Infinity;
let westBSupportClearScreenTick = -Infinity;
const westBSupportClearE2Ticks = new Map();
let westBSupportClearPhase = "flank";
let westBSupportClearTargetKey;
let westBSupportClearRetreatStage = 0;
let westBLateTankPhase = "stage";
const westBLateTankOrderTicks = new Map();
let westBLateTankAttackTick = -Infinity;
let westBLateTankActive = false;
const westBStagingIndexes = new Map();
const westBGuardedGrenadiers = new Set();
const westBEndgameRoute = [
  { cellX: 46, cellY: 40 },
  { cellX: 46, cellY: 44 },
  { cellX: 45, cellY: 45 },
  { cellX: 44, cellY: 46 },
  { cellX: 43, cellY: 47 },
];
const westBForwardLine = [
  { cellX: 39, cellY: 36 },
  { cellX: 42, cellY: 36 },
  { cellX: 45, cellY: 36 },
  { cellX: 48, cellY: 36 },
  { cellX: 41, cellY: 33 },
  { cellX: 44, cellY: 33 },
  { cellX: 47, cellY: 33 },
];
const westBInitialVehicleKeys = new Set();
const westBTransitRoute = [
  { cellX: 29, cellY: 25 },
  { cellX: 34, cellY: 33 },
  { cellX: 38, cellY: 34 },
  { cellX: 40, cellY: 36 },
  { cellX: 46, cellY: 40 },
  { cellX: 46, cellY: 44 },
  { cellX: 45, cellY: 45 },
  { cellX: 44, cellY: 46 },
  { cellX: 43, cellY: 47 },
  { cellX: 43, cellY: 49 },
  { cellX: 43, cellY: 53 },
  { cellX: 34, cellY: 53 },
  { cellX: 30, cellY: 51 },
  { cellX: 31, cellY: 53 },
];
const westBCombatRoute = [
  { cellX: 31, cellY: 55 },
  { cellX: 42, cellY: 55 },
  { cellX: 52, cellY: 55 },
  { cellX: 55, cellY: 43 },
  { cellX: 55, cellY: 31 },
  { cellX: 50, cellY: 22 },
  { cellX: 43, cellY: 17 },
  { cellX: 34, cellY: 18 },
  { cellX: 27, cellY: 24 },
  { cellX: 23, cellY: 29 },
  { cellX: 31, cellY: 34 },
  { cellX: 42, cellY: 35 },
  { cellX: 53, cellY: 36 },
];
const missionThreeScoutRoute = [
  { cellX: 17, cellY: 43 },
  { cellX: 17, cellY: 41 },
  { cellX: 10, cellY: 54 },
];
const missionThreeAssaultRoute = [
  { cellX: 17, cellY: 43 },
  { cellX: 17, cellY: 41 },
  { cellX: 14, cellY: 35 },
  { cellX: 20, cellY: 34 },
];
function transitionMissionFiveWestBEngineer(nextPhase, tick, detail = {}) {
  if (missionFiveWestBEngineerPhase === nextPhase) return;
  const transition = { tick, from: missionFiveWestBEngineerPhase, to: nextPhase, ...detail };
  missionFiveWestBEngineerTransitions.push(transition);
  missionFiveWestBEngineerPhase = nextPhase;
  if (trace) console.error(JSON.stringify({ westBEngineerTransition: transition }));
}
let initialFriendly = 0;
let initialHostiles = 0;
let peakFriendly = 0;
let peakHostiles = 0;
let finalSnapshot;
try {
  const applyCampaignTransition = (label) => {
    if (mission.carryOverCredits === undefined && mission.nukePieces === undefined) return;
    assert.equal(typeof engine._cnc_web_set_campaign_transition, "function",
      `${label} engine has no campaign-transition ABI`);
    assert.equal(
      engine._cnc_web_set_campaign_transition(
        handle,
        mission.carryOverCredits ?? 0,
        mission.nukePieces ?? 0,
      ),
      STATUS_OK,
      `${label} campaign transition failed`,
    );
  };
  const applyDifficulty = (label) => {
    if (verifierDifficulty === undefined) return;
    assert.equal(typeof engine._cnc_web_set_difficulty, "function",
      `${label} engine has no difficulty-selection ABI`);
    assert.equal(
      engine._cnc_web_set_difficulty(handle, verifierDifficulty),
      STATUS_OK,
      `${label} ${difficultyNames[verifierDifficulty]} difficulty selection failed`,
    );
  };
  const handlePointer = withAllocation(4, "handle output");
  try {
    assert.equal(engine._cnc_web_create(2, handlePointer), STATUS_OK, "cnc_web_create failed");
    handle = new DataView(engine.HEAPU8.buffer).getUint32(handlePointer, true);
    assert.notEqual(handle, 0, "cnc_web_create returned an invalid handle");
  } finally {
    engine._free(handlePointer);
  }

  applyCampaignTransition(`classic-freeware GDI Mission ${mission.number}`);
  applyDifficulty(`classic-freeware GDI Mission ${mission.number}`);
  const startBytes = startMessage();
  assert.equal(
    writeInput(startBytes, (pointer, length) => engine._cnc_web_start(handle, pointer, length)),
    STATUS_OK,
    `classic-freeware GDI Mission ${mission.number} start failed`,
  );
  drainEvents(handle);
  assert.ok(events.some((event) => event.type === EVENT_DIAGNOSTIC && event.args[0] === DIAGNOSTIC_START_READY), "mission start emitted no ready diagnostic");

  const restartFromBytes = (bytes, label) => {
    assert.equal(engine._cnc_web_destroy(handle), STATUS_OK, `${label} destroy failed`);
    const replacementHandlePointer = withAllocation(4, `${label} handle output`);
    try {
      assert.equal(engine._cnc_web_create(2, replacementHandlePointer), STATUS_OK,
        `${label} create failed`);
      handle = new DataView(engine.HEAPU8.buffer).getUint32(replacementHandlePointer, true);
      assert.notEqual(handle, 0, `${label} create returned an invalid handle`);
    } finally {
      engine._free(replacementHandlePointer);
    }
    applyCampaignTransition(label);
    applyDifficulty(label);
    assert.equal(
      writeInput(startBytes, (pointer, length) => engine._cnc_web_start(handle, pointer, length)),
      STATUS_OK,
      `${label} replacement start failed`,
    );
    assert.equal(
      writeInput(bytes, (pointer, length) => engine._cnc_web_load_save(handle, pointer, length)),
      STATUS_OK,
      `${label} reload failed`,
    );
    drainEvents(handle);
    const loaded = readSnapshot(handle);
    assert.equal(loaded.tick, currentTick, `${label} tick changed during reload`);
    return loaded;
  };

  let snapshot = readSnapshot(handle);
  initialFriendly = rootCombatants(snapshot, HOUSE_GDI).length;
  initialHostiles = rootCombatants(snapshot, HOUSE_NOD).length;
  if (mission.number === 5) {
    missionFivePreviousFunds = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
    for (const object of rootCombatants(snapshot, HOUSE_GDI)) {
      missionFiveInitialFriendlyKeys.add(objectKey(object));
    }
    for (const attacker of availableAttackers(snapshot)) {
      missionFiveInitialForceKeys.add(objectKey(attacker));
    }
    const authoredHuntSites = new Set(mission.huntSites.map(({ typeName, cellX, cellY }) => (
      `${typeName}:${cellX}:${cellY}`
    )));
    const authoredSamSites = new Set(mission.samSites.map(({ site: { cellX, cellY } }) => (
      `SAM:${cellX}:${cellY}`
    )));
    for (const structure of rootCombatants(snapshot, HOUSE_NOD).filter((object) => object.type === 4)) {
      const site = `${structure.typeName}:${structure.cellX}:${structure.cellY}`;
      if (authoredHuntSites.has(site)) missionFiveInitialHuntStructureKeys.add(objectKey(structure));
      if (authoredSamSites.has(site)) missionFiveInitialSamStructureKeys.add(objectKey(structure));
    }
    if (trace) {
      console.error(JSON.stringify({
        initialMissionFiveStructures: rootCombatants(snapshot, HOUSE_NOD)
          .filter((object) => object.type === 4)
          .map(({ typeName, id, cellX, cellY }) => ({ typeName, id, cellX, cellY })),
      }));
    }
    assert.equal(missionFiveInitialHuntStructureKeys.size, authoredHuntSites.size,
      `GDI Mission 5 ${mission.variant} authored hunt-trigger structures changed`);
    assert.equal(missionFiveInitialSamStructureKeys.size, authoredSamSites.size,
      `GDI Mission 5 ${mission.variant} authored Air Strike SAM structures changed`);
  }
  if (mission.number === 4 && mission.variant === "west-b") {
    const protectedVillage = snapshot.objects.filter((object) => (
      object.owner === HOUSE_NEUTRAL
      && object.subObject === 0
      && object.type === 4
      && object.strength > 0
      && missionFourProtectedVillageCells.has(`${object.cellX}:${object.cellY}`)
    ));
    initialProtectedVillageCount = protectedVillage.length;
    for (const structure of protectedVillage) {
      initialProtectedVillageCells.add(`${structure.cellX}:${structure.cellY}`);
    }
  }
  if (mission.number === 7) {
    assert.equal(mission.sabotagedStructure, STRUCT_REFINERY,
      "GDI Mission 7 verifier must carry the Refinery sabotage");
    assert.equal(initialFriendly, 0, "GDI Mission 7 should begin before its landing-craft reinforcements arrive");
    assert.equal(initialHostiles, 54, "GDI Mission 7 carried sabotage did not remove exactly one Nod structure");
    assert.equal(snapshot.sidebar.credits + snapshot.sidebar.tiberium, 5_000,
      "GDI Mission 7 did not ignore carried cash through its authored CarryOverMoney rule");
    assert.ok(!rootCombatants(snapshot, HOUSE_NOD).some((hostile) => (
      hostile.typeName === mission.sabotagedSite.typeName
      && hostile.cellX === mission.sabotagedSite.cellX
      && hostile.cellY === mission.sabotagedSite.cellY
    )), "GDI Mission 7 started with the carried sabotaged Refinery intact");
  }
  if (mission.number === 8) {
    initializeMissionEight(snapshot);
    if (trace) {
      console.error(JSON.stringify({
        initialMissionEightObjects: snapshot.objects
          .filter((object) => object.subObject === 0 && object.strength > 0)
          .map(({ owner, type, typeName, id, cellX, cellY, strength, maxStrength, objectFlags }) => ({
            owner, type, typeName, id, cellX, cellY, strength, maxStrength, objectFlags,
          })),
      }));
    }
    if (mission.variant === "east-a") {
      assert.equal(initialFriendly, 35, "GDI Mission 8 east-a initial counted force changed");
      assert.equal(initialHostiles, 61, "GDI Mission 8 east-a initial counted Nod force changed");
      assert.equal(missionEightState.initialNeutralUnitKeys.size, 1,
        "GDI Mission 8 east-a initial neutral unit count changed");
      assert.equal(missionEightState.initialNeutralStructureKeys.size, 8,
        "GDI Mission 8 east-a initial neutral structure count changed");
    } else {
      assert.equal(initialFriendly, 19, "GDI Mission 8 east-b initial counted force changed");
      assert.equal(initialHostiles, 64, "GDI Mission 8 east-b initial counted Nod force changed");
      assert.equal(missionEightState.initialNeutralUnitKeys.size, 14,
        "GDI Mission 8 east-b initial protected civilian count changed");
      assert.equal(missionEightState.initialNeutralStructureKeys.size, 10,
        "GDI Mission 8 east-b initial neutral structure count changed");
      assert.ok(snapshot.objects.some((object) => (
        object.owner === HOUSE_GDI && object.typeName === "MOEBIUS"
        && object.cellX === 6 && object.cellY === 60 && object.strength > 0
      )), "GDI Mission 8 east-b did not start with Dr. Moebius at the authored site");
      assert.ok(snapshot.objects.some((object) => (
        object.owner === HOUSE_GDI && object.typeName === "HOSP"
        && object.cellX === 3 && object.cellY === 60 && object.strength > 0
      )), "GDI Mission 8 east-b did not start with the authored hospital");
    }
  }
  assert.ok(mission.number === 6 || mission.number === 7 || initialFriendly > 0,
    `GDI Mission ${mission.number} started with no friendly combatants`);
  assert.ok(initialHostiles > 0, `GDI Mission ${mission.number} started with no Nod combatants`);

  while (!snapshot.terminal && snapshot.tick < MAX_TICKS) {
    if (mission.number === 4 && mission.variant === "west-b" && !westBIntegratedOpeningNormalized) {
      const boundaryFriendly = rootCombatants(snapshot, HOUSE_GDI);
      const boundaryHostiles = rootCombatants(snapshot, HOUSE_NOD);
      const openingBoundary = boundaryHostiles.length <= 7
        && boundaryHostiles.some((object) => object.typeName === "E3")
        && boundaryFriendly.some((object) => object.typeName === "APC"
          && object.strength === object.maxStrength)
        && boundaryFriendly.filter((object) => object.typeName === "E2").length >= 5;
      if (openingBoundary) {
        const normalized = readOutput(handle, engine._cnc_web_save_size,
          engine._cnc_web_write_save, "opening boundary save");
        snapshot = restartFromBytes(normalized, "opening-to-takeover");
        westBPhase = "combat";
        westBRouteStage = westBTransitRoute.length;
        westBCombatStage = 1;
        westBReinforcementsReady = true;
        westBLineEstablished = true;
        westBGuardPhase = "stage";
        westBTakeoverInitialized = false;
        westBTakeoverPhase = "support";
        westBTakeoverTargetKey = undefined;
        westBTakeoverOrderTick = -Infinity;
        westBTakeoverParkedTick = undefined;
        const loadedReserveApc = availableAttackers(snapshot).filter((attacker) => attacker.typeName === "APC")
          .toSorted((left, right) => right.strength - left.strength || left.id - right.id)[0];
        westBReserveApcKey = loadedReserveApc && objectKey(loadedReserveApc);
        westBReserveApcPositioned = Boolean(loadedReserveApc);
        westBReserveApcOrderTick = -Infinity;
        westBIntegratedOpeningNormalized = true;
        westBIntegratedPhase = "takeover";
        continue;
      }
    }
    if (mission.number === 4 && mission.variant === "west-b" && westBIntegratedPhase === "takeover") {
      const boundaryFriendly = rootCombatants(snapshot, HOUSE_GDI);
      const boundaryHostiles = rootCombatants(snapshot, HOUSE_NOD);
      const tankBoundary = boundaryHostiles.length === 5
        && boundaryFriendly.some((object) => object.typeName === "APC"
          && object.strength === object.maxStrength)
        && boundaryFriendly.filter((object) => object.typeName === "E2").length >= 5;
      if (tankBoundary) {
        const normalized = readOutput(handle, engine._cnc_web_save_size,
          engine._cnc_web_write_save, "tank boundary save");
        snapshot = restartFromBytes(normalized, "takeover-to-tank6");
        westBIntegratedPhase = "tank6";
        westBPhase = "integrated";
        westBGuardPhase = "stage";
        westBGuardPhaseTick = snapshot.tick;
        westBReserveLinePoints.clear();
        westBReserveGuardOrderTick = -Infinity;
        westBReserveScreenOrderTick = -Infinity;
        westBReserveAssaultPhase = "support";
        westBReserveAssaultTargetKey = undefined;
        westBReserveAssaultPhaseTick = snapshot.tick;
        westBReserveApcStopped = false;
        westBFinalCleanupRetreat = false;
        westBStagingIndexes.clear();
        westBGuardedGrenadiers.clear();
        westBGrenadierOrderTicks.clear();
        westBReserveApcOrderTick = -Infinity;
        const loadedReserveApc = availableAttackers(snapshot).filter((attacker) => attacker.typeName === "APC")
          .toSorted((left, right) => right.strength - left.strength || left.id - right.id)[0];
        westBReserveApcKey = loadedReserveApc && objectKey(loadedReserveApc);
        continue;
      }
    }
    if (mission.number === 4 && mission.variant === "west-b" && westBIntegratedPhase === "tank6") {
      const boundaryFriendly = rootCombatants(snapshot, HOUSE_GDI);
      const boundaryHostiles = rootCombatants(snapshot, HOUSE_NOD);
      const cleanupBoundary = boundaryHostiles.filter((object) => object.typeName === "LTNK").length === 1
        && boundaryHostiles.some((object) => object.typeName === "E1")
        && boundaryFriendly.some((object) => object.typeName === "APC")
        && boundaryFriendly.filter((object) => object.typeName === "E2").length >= 4;
      if (cleanupBoundary) {
        const normalized = readOutput(handle, engine._cnc_web_save_size,
          engine._cnc_web_write_save, "cleanup boundary save");
        snapshot = restartFromBytes(normalized, "tank6-to-cleanup");
        westBIntegratedPhase = "cleanup";
        westBPhase = "integrated";
        westBGuardPhase = "stage";
        westBGuardPhaseTick = snapshot.tick;
        westBReserveLinePoints.clear();
        westBReserveGuardOrderTick = -Infinity;
        westBReserveScreenOrderTick = -Infinity;
        westBReserveAssaultPhase = "support";
        westBReserveAssaultTargetKey = undefined;
        westBReserveAssaultPhaseTick = snapshot.tick;
        westBReserveApcStopped = false;
        westBFinalCleanupRetreat = false;
        westBStagingIndexes.clear();
        westBGuardedGrenadiers.clear();
        westBGrenadierOrderTicks.clear();
        westBReserveApcOrderTick = -Infinity;
        continue;
      }
    }
    if (mission.number === 4 && mission.variant === "west-b"
      && (westBIntegratedPhase === "tank6" || westBIntegratedPhase === "cleanup")) {
      const boundaryFriendly = rootCombatants(snapshot, HOUSE_GDI);
      const boundaryHostiles = rootCombatants(snapshot, HOUSE_NOD);
      const supportClearBoundary = boundaryHostiles.length === 2
        && boundaryHostiles.some((object) => object.typeName === "LTNK")
        && boundaryHostiles.some((object) => object.typeName === "BGGY")
        && !boundaryHostiles.some((object) => object.typeName === "E1")
        && boundaryFriendly.some((object) => object.typeName === "APC")
        && boundaryFriendly.filter((object) => object.typeName === "E2").length >= 3;
      if (supportClearBoundary) {
        const normalized = readOutput(handle, engine._cnc_web_save_size,
          engine._cnc_web_write_save, "support clear boundary save");
        snapshot = restartFromBytes(normalized, "tank6-to-support-clear");
        westBIntegratedPhase = "support-clear";
        westBPhase = "integrated";
        westBSupportClearOrderTick = -Infinity;
        westBSupportClearScreenTick = -Infinity;
        westBSupportClearE2Ticks.clear();
        westBSupportClearPhase = "flank";
        westBSupportClearTargetKey = undefined;
        westBSupportClearRetreatStage = 0;
        westBLateTankPhase = "stage";
        westBLateTankOrderTicks.clear();
        westBLateTankAttackTick = -Infinity;
        westBLateTankActive = false;
        continue;
      }
    }
    const friendly = rootCombatants(snapshot, HOUSE_GDI);
    const hostiles = rootCombatants(snapshot, HOUSE_NOD);
    if (mission.number === 7) {
      if (hostiles.some((hostile) => (
        hostile.typeName === mission.sabotagedSite.typeName
        && hostile.cellX === mission.sabotagedSite.cellX
        && hostile.cellY === mission.sabotagedSite.cellY
      ))) missionSevenSabotagedSiteObserved = true;
      const minigunners = friendly.filter((object) => object.typeName === "E1").length;
      const grenadiers = friendly.filter((object) => object.typeName === "E2").length;
      const tanks = friendly.filter((object) => object.typeName === "MTNK").length;
      if (missionSevenReinforcementTicks.infantry === undefined
        && minigunners >= 4 && grenadiers >= 2) missionSevenReinforcementTicks.infantry = snapshot.tick;
      if (missionSevenReinforcementTicks.jeep === undefined
        && friendly.some((object) => object.typeName === "JEEP")) missionSevenReinforcementTicks.jeep = snapshot.tick;
      if (missionSevenReinforcementTicks.firstTank === undefined && tanks >= 1) {
        missionSevenReinforcementTicks.firstTank = snapshot.tick;
      }
      if (missionSevenReinforcementTicks.secondTank === undefined && tanks >= 2) {
        missionSevenReinforcementTicks.secondTank = snapshot.tick;
      }
      if (missionSevenReinforcementTicks.mcv === undefined
        && friendly.some((object) => object.typeName === "MCV")) missionSevenReinforcementTicks.mcv = snapshot.tick;
    }
    if (mission.number === 6 && initialFriendly === 0 && friendly.length > 0) {
      initialFriendly = friendly.length;
    }
    const missionFiveAirstrike = mission.number === 5
      ? snapshot.sidebar.entries.find((entry) => entry.assetName === "SW_AirStrike")
      : undefined;
    if (mission.number === 5) {
      const availableFunds = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
      if (mission.crate
        && missionFiveCrateRunnerKey !== undefined
        && missionFiveCrateCollectedTick === undefined
        && missionFivePreviousFunds !== undefined
        && availableFunds - missionFivePreviousFunds >= 1_000) {
        missionFiveCrateCollectedTick = snapshot.tick;
      }
      missionFivePreviousFunds = availableFunds;
      if (missionFiveCrateCollectedTick === undefined
        && missionFiveCrateRunnerKey !== undefined
        && !friendly.some((object) => objectKey(object) === missionFiveCrateRunnerKey)) {
        missionFiveCrateRunnerKey = undefined;
      }
      if (missionFiveAirstrike) {
        assert.equal(missionFiveAirstrike.buildableType, 24,
          `GDI Mission 5 ${mission.variant} Air Strike buildable type changed`);
        assert.equal(missionFiveAirstrike.buildableId, 3,
          `GDI Mission 5 ${mission.variant} Air Strike buildable id changed`);
        assert.equal(missionFiveAirstrike.objectType, 11,
          `GDI Mission 5 ${mission.variant} Air Strike object type changed`);
        assert.equal(missionFiveAirstrike.superweaponType, 3,
          `GDI Mission 5 ${mission.variant} Air Strike superweapon type changed`);
        if (missionFiveAirstrike.completed && !missionFiveAirstrikeReadyLatched) {
          missionFiveAirstrikeReadyTicks.push(snapshot.tick);
          missionFiveAirstrikeReadyLatched = true;
        } else if (!missionFiveAirstrike.completed) {
          missionFiveAirstrikeReadyLatched = false;
        }
      }
      if (missionFiveAirstrikePending) {
        const pendingTarget = hostiles.find((hostile) => (
          objectKey(hostile) === missionFiveAirstrikePending.targetKey
        ));
        const discharged = missionFiveAirstrike && !missionFiveAirstrike.completed;
        const a10Observed = friendly.some((object) => object.type === 3 && object.typeName === "A10");
        const targetDamaged = !pendingTarget || pendingTarget.strength < missionFiveAirstrikePending.targetStrength;
        if (discharged && (a10Observed || targetDamaged)) {
          missionFiveAirstrikeDischarges.push({
            orderTick: missionFiveAirstrikePending.orderTick,
            effectTick: snapshot.tick,
            target: missionFiveAirstrikePending.targetType,
            a10Observed,
            targetDamaged,
          });
          missionFiveAirstrikePending = undefined;
        }
      }
      for (const object of friendly) {
        const key = objectKey(object);
        if (missionFiveInitialFriendlyKeys.has(key)) continue;
        if (object.type === 1) missionFiveCompletedInfantryKeys.add(key);
        if (object.type === 2 && ["MTNK", "APC", "JEEP"].includes(object.typeName)) {
          missionFiveCompletedVehicleKeys.add(key);
        }
      }
    }
    if (mission.number === 5 && missionFiveBaseRepairedTick === undefined) {
      const baseStructures = friendly.filter((object) => object.type === 4);
      if (baseStructures.length === 7
        && baseStructures.every((structure) => structure.strength >= structure.maxStrength * 0.7)) {
        missionFiveBaseRepairedTick = snapshot.tick;
      }
    }
    if (mission.number === 5 && missionFiveHuntTriggeredTick === undefined
      && [...missionFiveInitialHuntStructureKeys].every((key) => (
        !hostiles.some((hostile) => objectKey(hostile) === key)
      ))) {
      missionFiveHuntTriggeredTick = snapshot.tick;
    }
    peakFriendly = Math.max(peakFriendly, friendly.length);
    peakHostiles = Math.max(peakHostiles, hostiles.length);
    const allAttackers = availableAttackers(snapshot);
    if (mission.number === 5 && mission.variant === "west-b") {
      const liveApcs = friendly.filter((object) => object.typeName === "APC" && object.type === 2);
      if (!missionFiveWestBInitialApcPipsLogged && liveApcs.length > 0) {
        missionFiveWestBInitialApcPipsLogged = true;
        const initialApcPips = liveApcs.map((apc) => ({
          key: objectKey(apc),
          strength: apc.strength,
          cellX: apc.cellX,
          cellY: apc.cellY,
          pipCount: apc.pipCount,
          maxPips: apc.maxPips,
          pips: apc.pips.slice(0, apc.pipCount),
        }));
        assert.ok(initialApcPips.every(({ pipCount, maxPips }) => pipCount === maxPips && maxPips === 5),
          "West-B APC pip slot export changed");
        if (trace) console.error(JSON.stringify({ westBInitialApcPips: initialApcPips }));
      }

      const visibleEngineer = friendly.find((object) => (
        object.typeName === "E6" && object.type === 1 && object.subObject === 0
      ));
      if (missionFiveReliefStage >= mission.reliefRoute.length
        && missionFiveWestBApcKey === undefined
        && missionFiveWestBEngineerKey === undefined) {
        const startingApc = liveApcs.filter((apc) => missionFiveInitialFriendlyKeys.has(objectKey(apc)))
          .toSorted((left, right) => right.strength - left.strength || left.id - right.id)[0];
        if (startingApc) {
          missionFiveWestBApcKey = objectKey(startingApc);
          transitionMissionFiveWestBEngineer("prepark", snapshot.tick, {
            apc: missionFiveWestBApcKey,
            startingApc: true,
            apcStrength: startingApc.strength,
          });
          missionFiveWestBApcOrderTick = -Infinity;
        }
      }
      if (visibleEngineer && missionFiveWestBEngineerKey === undefined) {
        missionFiveWestBEngineerKey = objectKey(visibleEngineer);
        missionFiveWestBEngineerProducedTick = snapshot.tick;
      }
      if (visibleEngineer && missionFiveWestBApcKey !== undefined
        && missionFiveWestBEngineerPhase === "parked-await-engineer") {
        transitionMissionFiveWestBEngineer("docking", snapshot.tick, {
          engineer: missionFiveWestBEngineerKey,
          apc: missionFiveWestBApcKey,
        });
        missionFiveWestBLoadOrderTick = -Infinity;
      }
      if (missionFiveWestBEngineerKey !== undefined && missionFiveWestBApcKey === undefined) {
        const apc = liveApcs.toSorted((left, right) => (
          Number(!missionFiveInitialFriendlyKeys.has(objectKey(left)))
          - Number(!missionFiveInitialFriendlyKeys.has(objectKey(right)))
          || right.strength - left.strength
          || Math.max(Math.abs(left.cellX - mission.home.cellX), Math.abs(left.cellY - mission.home.cellY))
            - Math.max(Math.abs(right.cellX - mission.home.cellX), Math.abs(right.cellY - mission.home.cellY))
          || left.id - right.id
        ))[0];
        if (apc) {
          missionFiveWestBApcKey = objectKey(apc);
          transitionMissionFiveWestBEngineer("parking", snapshot.tick, {
            engineer: missionFiveWestBEngineerKey,
            apc: missionFiveWestBApcKey,
            startingApc: missionFiveInitialFriendlyKeys.has(missionFiveWestBApcKey),
            apcStrength: apc.strength,
          });
          missionFiveWestBApcOrderTick = -Infinity;
          missionFiveWestBLoadOrderTick = -Infinity;
        }
      }
      const reservedApc = friendly.find((object) => objectKey(object) === missionFiveWestBApcKey);
      const occupiedPips = reservedApc?.pips.slice(0, reservedApc.pipCount).filter((pip) => pip !== 0) ?? [];
      if (missionFiveWestBEngineerPhase === "docking" && occupiedPips.includes(5)) {
        missionFiveWestBLoadTick = snapshot.tick;
        transitionMissionFiveWestBEngineer("escort", snapshot.tick, {
          pipCount: reservedApc.pipCount,
          occupiedPips,
        });
      }
      if (missionFiveWestBApcKey !== undefined
        && !reservedApc
        && !["capture", "captured"].includes(missionFiveWestBEngineerPhase)) {
        const lostApc = missionFiveWestBApcKey;
        missionFiveWestBApcKey = undefined;
        transitionMissionFiveWestBEngineer(visibleEngineer ? "await-apc" : "await-engineer", snapshot.tick, { lostApc });
      }
      const capturedFactory = friendly.find((object) => (
        object.typeName === "FACT" && object.type === 4 && object.cellX === 52 && object.cellY === 17
      ));
      if (capturedFactory && missionFiveWestBEngineerPhase !== "captured") {
        missionFiveWestBCaptureTick = snapshot.tick;
        transitionMissionFiveWestBEngineer("captured", snapshot.tick, {
          factory: objectKey(capturedFactory),
          strength: capturedFactory.strength,
        });
      }
      if (missionFiveShuttleFactCaptureTick === undefined) {
        for (const engineer of friendly.filter((object) => (
          object.type === 1 && object.typeName === "E6"
          && objectKey(object) !== missionFiveWestBEngineerKey
        ))) {
          const key = objectKey(engineer);
          if (missionFiveShuttleEngineers.has(key)) continue;
          missionFiveShuttleEngineers.set(key, {
            tick: snapshot.tick, id: engineer.id, strength: engineer.strength,
            cellX: engineer.cellX, cellY: engineer.cellY,
          });
          if (trace) console.error(JSON.stringify({ westBFootReserveEngineer: {
            tick: snapshot.tick, key, id: engineer.id, strength: engineer.strength,
            cellX: engineer.cellX, cellY: engineer.cellY,
            funds: snapshot.sidebar.credits + snapshot.sidebar.tiberium,
          } }));
        }
      }
      if (capturedFactory && missionFiveShuttleFactCaptureTick === undefined) {
        missionFiveShuttleFactCaptureTick = snapshot.tick;
        missionFiveShuttlePhase = "raid";
        missionFiveShuttleRouteStage = missionFiveFootReserveRouteStage;
        missionFiveShuttleOrderTick = -Infinity;
        for (const object of friendly) missionFiveShuttleBaselineFriendlyKeys.add(objectKey(object));
        if (trace) console.error(JSON.stringify({ westBShuttleFactCapture: {
          tick: snapshot.tick,
          key: objectKey(capturedFactory),
          strength: capturedFactory.strength,
          funds: snapshot.sidebar.credits + snapshot.sidebar.tiberium,
          sidebar: snapshot.sidebar.entries.map((entry) => ({
            assetName: entry.assetName,
            cost: entry.cost,
            buildableType: entry.buildableType,
            buildableId: entry.buildableId,
            objectType: entry.objectType,
            completed: entry.completed,
            constructing: entry.constructing,
            onHold: entry.onHold,
            busy: entry.busy,
          })),
        } }));
      }
      if (missionFiveShuttleFactSaleTick !== undefined
        && missionFiveShuttleFactGoneTick === undefined && !capturedFactory) {
        missionFiveShuttleFactGoneTick = snapshot.tick;
        missionFiveShuttleFactGoneFunds = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
        if (trace) console.error(JSON.stringify({ westBShuttleFactSaleComplete: {
          tick: snapshot.tick,
          funds: missionFiveShuttleFactGoneFunds,
          refund: missionFiveShuttleFactGoneFunds - missionFiveShuttleFactSaleFunds,
          crew: [...missionFiveShuttleFactCrew.values()],
          huntTriggeredTick: missionFiveHuntTriggeredTick,
        } }));
      }
      if (missionFiveShuttleFactCaptureTick !== undefined) {
        for (const object of friendly.filter((candidate) => (
          !missionFiveShuttleBaselineFriendlyKeys.has(objectKey(candidate))
          && Math.max(Math.abs(candidate.cellX - 52), Math.abs(candidate.cellY - 17)) <= 4
        ))) {
          const key = objectKey(object);
          if (!missionFiveShuttleFactCrew.has(key)) {
            missionFiveShuttleFactCrew.set(key, {
              tick: snapshot.tick,
              typeName: object.typeName,
              id: object.id,
              strength: object.strength,
              cellX: object.cellX,
              cellY: object.cellY,
            });
          }
        }
        for (const engineer of friendly.filter((object) => (
          object.type === 1 && object.typeName === "E6"
          && !missionFiveShuttleBaselineFriendlyKeys.has(objectKey(object))
        ))) {
          const key = objectKey(engineer);
          if (!missionFiveShuttleEngineers.has(key)) {
            missionFiveShuttleEngineers.set(key, {
              tick: snapshot.tick,
              id: engineer.id,
              strength: engineer.strength,
              cellX: engineer.cellX,
              cellY: engineer.cellY,
            });
            if (trace) console.error(JSON.stringify({ westBShuttleEngineerBuilt: {
              tick: snapshot.tick,
              key,
              id: engineer.id,
              strength: engineer.strength,
              cellX: engineer.cellX,
              cellY: engineer.cellY,
              funds: snapshot.sidebar.credits + snapshot.sidebar.tiberium,
            } }));
          }
        }
        const raidSites = [
          { typeName: "PROC", cellX: 47, cellY: 22 },
          { typeName: "AFLD", cellX: 42, cellY: 18 },
          { typeName: "NUKE", cellX: 47, cellY: 18 },
          { typeName: "NUKE", cellX: 49, cellY: 17 },
        ];
        for (const site of raidSites) {
          const key = `${site.typeName}:${site.cellX}:${site.cellY}`;
          if (missionFiveShuttleCaptureKeys.has(key)) continue;
          const structure = friendly.find((object) => (
            object.type === 4 && object.typeName === site.typeName
            && object.cellX === site.cellX && object.cellY === site.cellY
          ));
          if (!structure) continue;
          missionFiveShuttleCaptureKeys.add(key);
          const capture = {
            tick: snapshot.tick,
            typeName: structure.typeName,
            id: structure.id,
            strength: structure.strength,
            cellX: structure.cellX,
            cellY: structure.cellY,
          };
          missionFiveShuttleCaptures.push(capture);
          if (trace) console.error(JSON.stringify({ westBShuttleCapture: capture }));
        }
      }
    }
    const missionFiveAvailableAttackers = mission.number === 5
      && mission.variant === "west-b"
      && missionFiveWestBApcKey !== undefined
      && missionFiveWestBEngineerPhase !== "captured"
      ? allAttackers.filter((attacker) => (
        objectKey(attacker) !== missionFiveWestBApcKey
        && objectKey(attacker) !== missionFiveWestBEngineerKey
        && !missionFiveShuttleEngineers.has(objectKey(attacker))
      ))
      : allAttackers.filter((attacker) => (
        objectKey(attacker) !== missionFiveWestBEngineerKey
        && !missionFiveShuttleEngineers.has(objectKey(attacker))
      ));
    const attackers = missionFiveShuttleFactCaptureTick !== undefined
      && missionFiveShuttleCaptures.length < 4
      ? missionFiveAvailableAttackers.filter((attacker) => (
        objectKey(attacker) !== missionFiveWestBApcKey
        && !missionFiveShuttleEngineers.has(objectKey(attacker))
        && !(attacker.type === 1 && attacker.typeName === "E6"
          && !missionFiveShuttleBaselineFriendlyKeys.has(objectKey(attacker)))
      ))
      : missionFiveAvailableAttackers;
    const missionFiveInitialForce = mission.number === 5
      ? attackers.filter((attacker) => missionFiveInitialForceKeys.has(objectKey(attacker)))
      : [];
    if (mission.number === 5 && missionFiveReliefStage < mission.reliefRoute.length) {
      const waypoint = mission.reliefRoute[missionFiveReliefStage];
      if (missionFiveInitialForce.some((attacker) => (
        Math.abs(attacker.cellX - waypoint.cellX) <= 1
        && Math.abs(attacker.cellY - waypoint.cellY) <= 1
      ))) {
        missionFiveReliefArrivalTicks.push(snapshot.tick);
        missionFiveReliefStage += 1;
        if (missionFiveReliefStage === mission.reliefRoute.length) missionFiveRelievedTick = snapshot.tick;
      }
    }
    if (mission.number === 4 && mission.scoutRoute && missionFourScoutKey === undefined) {
      const scout = attackers.filter((attacker) => attacker.typeName === mission.scoutType)
        .toSorted((left, right) => right.strength - left.strength || left.id - right.id)[0];
      if (scout) missionFourScoutKey = objectKey(scout);
    }
    const missionFourScout = mission.number === 4 && mission.scoutRoute
      ? attackers.find((attacker) => objectKey(attacker) === missionFourScoutKey)
      : undefined;
    const activeMissionFourScout = missionFourScoutStage < (mission.scoutRoute?.length ?? 0)
      ? missionFourScout
      : undefined;
    const missionFourCombatAttackers = missionFourScout
      ? attackers.filter((attacker) => attacker !== missionFourScout)
      : attackers;
    if (mission.number === 4 && mission.objective === "extract" && missionFourExtractionKeys.size === 0) {
      const candidates = mission.runner === "jeep" || mission.runner === "apc"
        ? attackers.filter((attacker) => attacker.typeName === mission.runner.toUpperCase())
        : mission.runner === "apc-one"
          ? attackers.filter((attacker) => attacker.typeName === "APC")
            .toSorted((left, right) => right.strength - left.strength || left.id - right.id)
            .slice(0, 1)
          : mission.runner === "vehicles"
            ? attackers.filter((attacker) => attacker.type === 2)
          : attackers;
      for (const candidate of candidates) missionFourExtractionKeys.add(objectKey(candidate));
    }
    if (mission.number === 4 && mission.variant === "east-a"
      && missionFourCargoKeys.size === 0 && !missionFourCargoLoadIssued) {
      const rocketSoldiers = attackers.filter((attacker) => attacker.typeName === "E2")
        .toSorted((left, right) => left.id - right.id);
      const cargo = rocketSoldiers.length >= 2
        ? [rocketSoldiers[0], rocketSoldiers.at(-1)]
        : rocketSoldiers;
      for (const passenger of cargo) missionFourCargoKeys.add(objectKey(passenger));
    }
    if (mission.number === 2) {
      for (const id of missionTwoHomeGuardIds) {
        if (!attackers.some((attacker) => attacker.id === id)) missionTwoHomeGuardIds.delete(id);
      }
      const guardCandidates = attackers
        .filter((attacker) => !missionTwoHomeGuardIds.has(attacker.id))
        .toSorted((left, right) => (
          right.cellY - left.cellY
          || Math.abs(left.cellX - 55) - Math.abs(right.cellX - 55)
          || left.id - right.id
        ));
      for (const candidate of guardCandidates) {
        if (missionTwoHomeGuardIds.size >= 8) break;
        missionTwoHomeGuardIds.add(candidate.id);
      }
    }
    const visibleHostiles = (mission.number === 4 && mission.objective === "eliminate") || mission.number === 5
      ? hostiles.filter((hostile) => snapshot.shroud.isVisible(hostile.cellX, hostile.cellY))
      : hostiles;
    if (mission.number === 5) {
      for (const structure of visibleHostiles.filter((hostile) => hostile.type === 4)) {
        missionFiveKnownHostileStructures.set(objectKey(structure), structure);
      }
      for (const key of missionFiveKnownHostileStructures.keys()) {
        if (!hostiles.some((hostile) => objectKey(hostile) === key)) {
          missionFiveKnownHostileStructures.delete(key);
        }
      }
    }
    const target = mission.number === 4 && mission.objective === "eliminate"
      ? chooseLocalThreat(missionFourCombatAttackers, visibleHostiles, mission.threatRadius)
      : chooseTarget(visibleHostiles);
    if (trace && snapshot.tick % 600 === 0) {
      console.error(JSON.stringify({
        tick: snapshot.tick,
        friendly: friendly.length,
        attackers: attackers.length,
        hostile: hostiles.length,
        visibleHostile: visibleHostiles.length,
        target: target && { typeName: target.typeName, id: target.id, strength: target.strength, cellX: target.cellX, cellY: target.cellY },
        buildings: friendly.filter((object) => object.type === 4).map(({ typeName, id, strength, cellX, cellY }) => ({ typeName, id, strength, cellX, cellY })),
        credits: snapshot.sidebar.credits,
        productionStarts,
        missionThreeScoutStage,
        missionThreeBaseAssaultStarted,
        missionThreeRouteStage,
        missionThreeStrikeGroup: missionThreeStrikeGroupIds.size,
        missionFourRouteStage,
        missionFourScoutStage,
        missionFiveReliefStage,
        missionFiveRelievedTick,
        missionFiveBaseRepairedTick,
        missionFiveCrateCollectedTick,
        missionFiveCrateRunner: friendly.find((object) => objectKey(object) === missionFiveCrateRunnerKey),
        missionFiveAssaultStartedTick,
        missionFiveAssaultPhase,
        missionFiveAssaultWaveCount,
        missionFiveAssaultRouteStage,
        missionFiveHuntTriggeredTick,
        missionFiveSamSweepStage,
        missionFiveAirstrikeOrders: missionFiveAirstrikeOrders.length,
        missionFiveAirstrikeDischarges: missionFiveAirstrikeDischarges.length,
        missionFiveStrikeGroup: missionFiveStrikeGroupKeys.size,
        missionFiveHomeGuard: missionFiveHomeGuardKeys.size,
        missionFiveStrikeComposition: friendly.filter((object) => (
          missionFiveStrikeGroupKeys.has(objectKey(object))
        )).map(({ typeName, id, strength, cellX, cellY }) => ({ typeName, id, strength, cellX, cellY })),
        missionFiveGuardComposition: friendly.filter((object) => (
          missionFiveHomeGuardKeys.has(objectKey(object))
        )).map(({ typeName, id, strength, cellX, cellY }) => ({ typeName, id, strength, cellX, cellY })),
        missionFourExtraction: friendly
          .filter((object) => missionFourExtractionKeys.has(objectKey(object)))
          .map(({ typeName, id, strength, cellX, cellY }) => ({ typeName, id, strength, cellX, cellY })),
        sidebar: snapshot.sidebar.entries.map(({ assetName, completed, constructing, onHold, busy }) => ({ assetName, completed, constructing, onHold, busy })),
      }));
    }
    const commands = [];
    if (mission.number === 7) {
      queueMissionSevenTurn(snapshot, friendly, hostiles, attackers, commands);
      if (trace && snapshot.tick % 300 === 0) console.error(JSON.stringify({ missionSeven: {
        tick: snapshot.tick,
        funds: snapshot.sidebar.credits + snapshot.sidebar.tiberium,
        friendly: friendly.map(({ typeName, id, strength, cellX, cellY }) => (
          { typeName, id, strength, cellX, cellY }
        )),
        hostiles: hostiles.length,
        routeStage: missionSevenState.routeStage,
        wave: missionSevenState.wave,
        strike: missionSevenState.strikeKeys.size,
        held: missionSevenState.heldKeys.size,
        engineer: missionSevenState.engineer,
        purge: missionSevenState.purge,
        jeep: missionSevenState.jeep,
        samDeaths: Object.fromEntries(missionSevenState.samDeathTicks),
      } }));
      if (commands.length > 0) {
        submitCommands(handle, snapshot.tick + 1, commands);
        commandBatches += 1;
      }
      const requested = Math.min(TICKS_PER_ORDER, MAX_TICKS - snapshot.tick);
      const advanced = advance(handle, requested);
      snapshot = readSnapshot(handle);
      assert.equal(snapshot.tick, currentTick, "snapshot tick differs from the ABI advance count");
      if (advanced === 0 && !snapshot.terminal) {
        assert.fail("Mission 7 engine stopped before reaching a terminal state");
      }
      continue;
    }
    if (mission.number === 8) {
      queueMissionEightTurn(snapshot, friendly, hostiles, attackers, commands);
      if (trace && snapshot.tick % (process.env.CNCWEB_VERIFY_TRACE_FINE === "1" ? 30 : 300) === 0) console.error(JSON.stringify({ missionEight: {
        variant: mission.variant,
        tick: snapshot.tick,
        funds: snapshot.sidebar.credits + snapshot.sidebar.tiberium,
        friendly: friendly.length,
        attackers: attackers.length,
        hostiles: hostiles.length,
        productionStarts,
        completions: missionEightState.productionCompletions.length,
        vehicleRepair: mission.variant === "east-a" ? {
          active: missionEightState.vehicleRepairActiveKey,
          completed: missionEightState.vehicleRepairCompletedKeys.size,
          total: missionEightState.vehicleRepairKeys.size,
          completeTick: missionEightState.vehicleRepairCompleteTick,
          latestOrder: missionEightState.vehicleRepairOrders.at(-1),
          latestProgress: missionEightState.vehicleRepairProgress.at(-1),
          vehicles: friendly.filter((object) => (
            object.type === 2 && missionEightState.vehicleRepairKeys.has(objectKey(object))
          )).map(({ typeName, id, strength, maxStrength, cellX, cellY }) => (
            { typeName, id, strength, maxStrength, cellX, cellY }
          )),
        } : undefined,
        scoutStage: missionEightState.scoutStage,
        assaultTick: missionEightState.assaultTick,
        assaultWave: missionEightState.assaultWave,
        secondWave: mission.variant === "east-a" ? {
          held: missionEightState.secondWaveKeys.size,
          launchTick: missionEightState.secondWaveLaunchTick,
          transitStage: missionEightState.secondWaveTransitStage,
          joinTick: missionEightState.secondWaveJoinTick,
          units: attackers.filter((object) => (
            missionEightState.secondWaveKeys.has(objectKey(object))
          )).map(({ typeName, strength, cellX, cellY }) => ({ typeName, strength, cellX, cellY })),
        } : undefined,
        thirdWave: mission.variant === "east-a" ? {
          staged: missionEightState.thirdWaveKeys.size,
          launchTick: missionEightState.thirdWaveLaunchTick,
          transitStage: missionEightState.thirdWaveTransitStage,
          joinTick: missionEightState.thirdWaveJoinTick,
          units: attackers.filter((object) => (
            missionEightState.thirdWaveKeys.has(objectKey(object))
          )).map(({ typeName, strength, cellX, cellY }) => ({ typeName, strength, cellX, cellY })),
        } : undefined,
        cashConversion: mission.variant === "east-a" && missionEightState.cashConversion ? {
          orderTick: missionEightState.cashConversion.orderTick,
          goneTick: missionEightState.cashConversion.goneTick,
          refund: missionEightState.cashConversion.refund,
          crew: missionEightState.cashConversion.crew.length,
        } : undefined,
        postFactEconomy: mission.variant === "east-a" ? {
          sales: Object.fromEntries(Object.entries(missionEightState.postFactSales)
            .map(([typeName, sale]) => [typeName, sale ? {
              orderTick: sale.orderTick,
              goneTick: sale.goneTick,
              structure: sale.structure,
              fundsBefore: sale.fundsBefore,
              fundsAfter: sale.fundsAfter,
              refund: sale.refund,
              crew: sale.crew,
            } : undefined])),
          productionOrders: missionEightState.postFactProductionOrders,
          productionCompletions: missionEightState.postFactProductionCompletions,
          cleanupLaunchTick: missionEightState.postFactCleanupLaunchTick,
          cleanupTransitStage: missionEightState.postFactCleanupTransitStage,
          cleanupTransitProgress: missionEightState.postFactCleanupTransitProgress,
          homeCohort: missionEightState.postFactHomeDefenseCohortKeys.size,
          homeAlive: attackers.filter((attacker) => (
            missionEightState.postFactHomeDefenseKeys.has(objectKey(attacker))
          )).length,
          cleanupCohort: missionEightState.postFactCleanupCohortKeys.size,
          cleanupAlive: attackers.filter((attacker) => (
            missionEightState.postFactCleanupCohortKeys.has(objectKey(attacker))
          )).length,
        } : undefined,
        engineer: mission.variant === "east-a" ? {
          orderTick: missionEightState.engineer.orderTick,
          observedTick: missionEightState.engineer.observedTick,
          key: missionEightState.engineer.key,
          unit: friendly.find((object) => (
            objectKey(object) === missionEightState.engineer.key
          )),
          engineerUnits: friendly.filter((object) => (
            object.type === 1 && object.typeName === "E6"
          )),
          footEscorts: friendly.filter((object) => (
            missionEightState.engineer.footEscortKeys.has(objectKey(object))
          )).map(({ typeName, id, strength, maxStrength, cellX, cellY }) => (
            { typeName, id, strength, maxStrength, cellX, cellY }
          )),
          footDecoyStage: missionEightState.engineer.footDecoyStage,
          footDecoys: friendly.filter((object) => (
            missionEightState.engineer.footDecoyKeys.has(objectKey(object))
          )).map(({ typeName, id, strength, maxStrength, cellX, cellY }) => (
            { typeName, id, strength, maxStrength, cellX, cellY }
          )),
          captureThreats: hostiles.filter((object) => (
            (object.type === 1 || object.type === 2 || object.typeName === "GUN")
            && missionEightDistance(object, { cellX: 9, cellY: 18 }) <= 12
          )).map(({ typeName, id, strength, maxStrength, cellX, cellY }) => (
            { typeName, id, strength, maxStrength, cellX, cellY }
          )),
          nearbyThreats: (() => {
            const unit = friendly.find((object) => (
              objectKey(object) === missionEightState.engineer.key
            ));
            if (!unit) return [];
            return hostiles.filter((object) => (
              (object.type === 1 || object.type === 2 || object.typeName === "GUN")
              && missionEightDistance(object, unit) <= 12
            )).map(({ typeName, id, strength, maxStrength, cellX, cellY }) => (
              { typeName, id, strength, maxStrength, cellX, cellY }
            ));
          })(),
          initialKey: missionEightState.engineer.initialKey,
          initialDeathTick: missionEightState.engineer.initialDeathTick,
          replacementOrderTick: missionEightState.engineer.replacementOrderTick,
          replacementObservedTick: missionEightState.engineer.replacementObservedTick,
          replacementKey: missionEightState.engineer.replacementKey,
          secondReplacementOrderTick: missionEightState.engineer.secondReplacementOrderTick,
          secondReplacementObservedTick: missionEightState.engineer.secondReplacementObservedTick,
          secondReplacementKey: missionEightState.engineer.secondReplacementKey,
          secondReplacementDeathTick: missionEightState.engineer.secondReplacementDeathTick,
          replacementDecoyKey: missionEightState.engineer.replacementDecoyKey,
          replacementDecoyUnit: friendly.find((object) => (
            objectKey(object) === missionEightState.engineer.replacementDecoyKey
          )),
          replacementDecoyEscorts: friendly.filter((object) => (
            missionEightState.engineer.replacementDecoyEscortKeys.has(objectKey(object))
          )).map(({ typeName, id, strength, maxStrength, cellX, cellY }) => (
            { typeName, id, strength, maxStrength, cellX, cellY }
          )),
          replacementDecoyEscortInitializedTick:
            missionEightState.engineer.replacementDecoyEscortInitializedTick,
          replacementDecoyScreenReadyTick:
            missionEightState.engineer.replacementDecoyScreenReadyTick,
          replacementDecoyScreenTankKey:
            missionEightState.engineer.replacementDecoyScreenTankKey,
          replacementDecoyScreenTankClearedTick:
            missionEightState.engineer.replacementDecoyScreenTankClearedTick,
          replacementDecoyEscortKeys: [...missionEightState.engineer.replacementDecoyEscortKeys],
          homeMobiles: friendly.filter((object) => (
            (object.type === 1 || object.type === 2)
            && missionEightDistance(object, { cellX: 45, cellY: 50 }) <= 14
          )).map(({ typeName, type, id, strength, maxStrength, cellX, cellY }) => (
            { typeName, type, id, strength, maxStrength, cellX, cellY }
          )),
          cashConversionCrew: missionEightState.cashConversion?.crew,
          replacementDecoyStage: missionEightState.engineer.replacementDecoyStage,
          replacementDecoyProgress: missionEightState.engineer.replacementDecoyProgress,
          fallbackToDecoyTick: missionEightState.engineer.fallbackToDecoyTick,
          deathTick: missionEightState.engineer.deathTick,
          transportKey: missionEightState.engineer.transportKey,
          transportUnit: friendly.find((object) => (
            objectKey(object) === missionEightState.engineer.transportKey
          )),
          transportDeathTick: missionEightState.engineer.transportDeathTick,
          transportRouteStage: missionEightState.engineer.transportRouteStage,
          transportRouteProgress: missionEightState.engineer.transportRouteProgress,
          transportCounterattackTick: missionEightState.engineer.transportCounterattackTick,
          loadIssuedTick: missionEightState.engineer.loadIssuedTick,
          sealedTick: missionEightState.engineer.sealedTick,
          transportRetreatTick: missionEightState.engineer.transportRetreatTick,
          unloadApproachTick: missionEightState.engineer.unloadApproachTick,
          unloadStagedTick: missionEightState.engineer.unloadStagedTick,
          unloadIssuedTick: missionEightState.engineer.unloadIssuedTick,
          unloadedTick: missionEightState.engineer.unloadedTick,
          emergencyIngressStage: missionEightState.engineer.emergencyIngressStage,
          emergencyIngressProgress: missionEightState.engineer.emergencyIngressProgress,
          transitStage: missionEightState.engineer.transitStage,
          transitProgress: missionEightState.engineer.transitProgress,
          captureOrderTick: missionEightState.engineer.captureOrderTick,
          captureOrders: missionEightState.engineer.captureOrders,
          captureTick: missionEightState.engineer.captureTick,
          factSale: {
            orderTick: missionEightState.engineer.factSale.orderTick,
            goneTick: missionEightState.engineer.factSale.goneTick,
            refund: missionEightState.engineer.factSale.refund,
            crew: missionEightState.engineer.factSale.crew,
          },
        } : undefined,
        routeStage: missionEightState.routeStage,
        strike: missionEightState.strikeKeys.size,
        fronts: mission.variant === "east-a" ? {
          northHold: missionEightState.northHoldKeys.size,
          northHoldTick: missionEightState.northHoldTick,
          northFlankStage: missionEightState.postSamNorthFlankStage,
          northFlankProgress: missionEightState.postSamNorthFlankProgress,
          northFlankUnits: attackers.filter((attacker) => (
            missionEightState.postSamNorthFlankKeys.has(objectKey(attacker))
          )).map(({ typeName, id, strength, cellX, cellY }) => (
            { typeName, id, strength, cellX, cellY }
          )),
          southReady: missionEightState.southReadyKeys.size,
          southAssaultTick: missionEightState.southAssaultTick,
          rearGuard: missionEightState.southRearGuardKeys.size,
          rearGuardStartedTick: missionEightState.southRearGuardStartedTick,
          finalGateEnteredTick: missionEightState.southFinalGateEnteredTick,
          finalGateBlockers: [...missionEightState.southFinalGateBlockers.values()],
          finalGateBlockersRemaining: [...missionEightState.southFinalGateBlockerKeys],
          finalGateBlockerDrops: missionEightState.southFinalGateBlockerDrops,
          northReleaseTick: missionEightState.northReleaseTick,
          northReleased: missionEightState.northReleaseKeys.size,
          baseGuardReleaseTick: missionEightState.baseGuardReleaseTick,
          baseGuardsReleased: missionEightState.baseGuardReleaseKeys.size,
          counterattackLaunchTick: missionEightState.postSamCounterattackLaunchTick,
          counterattackStage: missionEightState.postSamCounterattackStage,
          counterattackAlive: attackers.filter((attacker) => (
            missionEightState.postSamCounterattackKeys.has(objectKey(attacker))
          )).length,
          northSupportAlive: attackers.filter((attacker) => (
            missionEightState.postSamNorthSupportKeys.has(objectKey(attacker))
          )).length,
          counterattackUnits: attackers.filter((attacker) => (
            missionEightState.postSamCounterattackKeys.has(objectKey(attacker))
            || missionEightState.postSamNorthSupportKeys.has(objectKey(attacker))
          )).map(({ typeName, id, strength, cellX, cellY }) => (
            { typeName, id, strength, cellX, cellY }
          )),
          counterattackProgress: missionEightState.postSamCounterattackProgress,
          counterattackCompletedTick: missionEightState.postSamCounterattackCompletedTick,
          westCleanupStage: missionEightState.westCleanupStage,
          westCleanupStartedTick: missionEightState.westCleanupStartedTick,
          westCleanupCompletedTick: missionEightState.westCleanupCompletedTick,
          westCleanupTarget: missionEightState.westCleanupTarget,
          westCleanupProgress: missionEightState.westCleanupProgress,
          productionGun: {
            minimumStrength: missionEightState.productionGunMinimumStrength,
            holdStartedTick: missionEightState.productionGunHoldStartedTick,
            holdLastStrength: missionEightState.productionGunHoldLastStrength,
            chargeTick: missionEightState.productionGunChargeTick,
            chargeStrength: missionEightState.productionGunChargeStrength,
          },
          cleanupThreats: (() => {
            const cleanup = attackers.filter((attacker) => (
              missionEightState.postFactCleanupCohortKeys.has(objectKey(attacker))
            ));
            return hostiles.filter((hostile) => (
              hostile.type !== 4
              && cleanup.some((attacker) => missionEightDistance(attacker, hostile) <= 12)
            )).map(({ typeName, id, strength, cellX, cellY }) => (
              { typeName, id, strength, cellX, cellY }
            ));
          })(),
          withdrawalTargets: [...missionEightState.southWithdrawalTargets.values()],
          withdrawalTargetDeaths: [...missionEightState.southWithdrawalTargetDeaths.values()],
          southHealth: (() => {
            const units = attackers.filter((object) => (
              missionEightState.secondWaveKeys.has(objectKey(object))
              || missionEightState.thirdWaveKeys.has(objectKey(object))
              || missionEightState.southReadyKeys.has(objectKey(object))
              || (missionEightState.southAssaultTick !== undefined
                && missionEightState.strikeKeys.has(objectKey(object)))
            ));
            return {
              count: units.length,
              strength: units.reduce((sum, object) => sum + object.strength, 0),
              minimumStrength: units.length > 0
                ? Math.min(...units.map((object) => object.strength)) : 0,
            };
          })(),
        } : undefined,
        southTelemetry: mission.variant === "east-a"
          && snapshot.tick >= 20_100 && snapshot.tick <= 30_000 ? (() => {
            const southUnits = attackers.filter((object) => (
              missionEightState.secondWaveKeys.has(objectKey(object))
              || missionEightState.thirdWaveKeys.has(objectKey(object))
              || missionEightState.southReadyKeys.has(objectKey(object))
            ));
            return {
              focus: missionEightState.southTransitFocus,
              units: southUnits.map(({ typeName, id, strength, cellX, cellY }) => (
                { typeName, id, strength, cellX, cellY }
              )),
              visibleHostiles: hostiles.filter((hostile) => (
                snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
                && southUnits.some((unit) => missionEightDistance(unit, hostile) <= 12)
              )).map(({ typeName, id, strength, cellX, cellY }) => (
                { typeName, id, strength, cellX, cellY }
              )),
            };
          })() : undefined,
        strikeUnits: attackers.filter((object) => (
          missionEightState.strikeKeys.has(objectKey(object))
        )).map(({ typeName, id, strength, cellX, cellY }) => ({ typeName, id, strength, cellX, cellY })),
        samSites: missionEightSamSites[mission.variant].map((site) => {
          const sam = hostiles.find((object) => (
            object.typeName === "SAM" && object.cellX === site.cellX && object.cellY === site.cellY
          ));
          return { ...site, strength: sam?.strength ?? 0 };
        }),
        airstrike: {
          readyTicks: missionEightState.airstrike.readyTicks,
          orders: missionEightState.airstrike.orders,
          discharges: missionEightState.airstrike.discharges,
          pending: missionEightState.airstrike.pending !== undefined,
        },
        fact: mission.variant === "east-a" ? hostiles.find((object) => (
          object.typeName === "FACT" && object.cellX === 8 && object.cellY === 11
        )) : undefined,
        factTelemetry: mission.variant === "east-a" ? {
          initialStrength: missionEightState.factInitialStrength,
          minimumStrength: missionEightState.factMinimumStrength,
          deathTick: missionEightState.factDeathTick,
        } : undefined,
        southSam: hostiles.find((object) => (
          object.typeName === "SAM" && object.cellX === 11 && object.cellY === 20
        )),
        villageGuard: missionEightState.villageGuardKeys.size,
        baseGuard: missionEightState.baseGuardKeys.size,
        eastBStaging: mission.variant === "east-b" ? {
          base: attackers.filter((object) => (
            missionEightState.baseGuardKeys.has(objectKey(object))
          )).map(({ typeName, id, strength, cellX, cellY }) => (
            { typeName, id, strength, cellX, cellY }
          )),
          village: attackers.filter((object) => (
            missionEightState.villageGuardKeys.has(objectKey(object))
          )).map(({ typeName, id, strength, cellX, cellY }) => (
            { typeName, id, strength, cellX, cellY }
          )),
          tanks: attackers.filter((object) => (
            object.typeName === "MTNK"
            && missionEightState.eastBProducedTankKeys.has(objectKey(object))
          )).map(({ id, strength, cellX, cellY }) => ({ id, strength, cellX, cellY })),
          freeTanks: attackers.filter((object) => (
            object.typeName === "MTNK"
            && missionEightState.eastBProducedTankKeys.has(objectKey(object))
            && !missionEightState.villageGuardKeys.has(objectKey(object))
            && object.strength > 0
          )).length,
          freeRockets: attackers.filter((object) => (
            object.typeName === "E3"
            && !missionEightState.villageGuardKeys.has(objectKey(object))
            && object.strength > 0
          )).map(({ id, strength, cellX, cellY }) => ({ id, strength, cellX, cellY })),
          baseThreats: hostiles.filter((object) => (
            object.type !== 4
            && missionEightDistance(object, { cellX: 34, cellY: 50 }) <= 12
          )).map(({ typeName, id, strength, cellX, cellY }) => (
            { typeName, id, strength, cellX, cellY }
          )),
          villageThreats: hostiles.filter((object) => (
            object.type !== 4
            && missionEightDistance(object, { cellX: 8, cellY: 57 }) <= 15
          )).map(({ typeName, id, strength, cellX, cellY }) => (
            { typeName, id, strength, cellX, cellY }
          )),
        } : undefined,
        samDeaths: Object.fromEntries(missionEightState.samDeathTicks),
        neutralMinimum: missionEightState.minimumNeutralUnits,
        buildings: friendly.filter((object) => object.type === 4).map(({ typeName, strength, cellX, cellY }) => (
          { typeName, strength, cellX, cellY }
        )),
      } }));
      if (commands.length > 0) {
        submitCommands(handle, snapshot.tick + 1, commands);
        commandBatches += 1;
      }
      const requested = Math.min(TICKS_PER_ORDER, MAX_TICKS - snapshot.tick);
      const advanced = advance(handle, requested);
      snapshot = readSnapshot(handle);
      assert.equal(snapshot.tick, currentTick, "snapshot tick differs from the ABI advance count");
      if (advanced === 0 && !snapshot.terminal) {
        assert.fail(`Mission 8 ${mission.variant} engine stopped before reaching a terminal state`);
      }
      continue;
    }
    if (mission.number === 5 && mission.variant === "west-b"
      && missionFiveShuttleFactCaptureTick === undefined) {
      const footEngineers = friendly.filter((object) => (
        object.type === 1 && object.typeName === "E6"
        && missionFiveShuttleEngineers.has(objectKey(object))
      )).toSorted((left, right) => left.id - right.id);
      const factApc = friendly.find((object) => objectKey(object) === missionFiveWestBApcKey);
      const footContextOrder = (group, destination, flags = 0) => {
        if (group.length === 0 || !destination) return;
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        for (const object of group) {
          commands.push({
            type: COMMAND_SELECT_OBJECT,
            args: [object.type, object.id, 0, 0, 0, 0, 0],
          });
        }
        if (flags) commands.push({
          type: COMMAND_INPUT, flags,
          args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
        });
        commands.push({
          type: COMMAND_INPUT, flags,
          args: [INPUT_COMMAND_AT_POSITION,
            destination.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            destination.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0, 0, 0, 0],
        });
        if (flags) commands.push({
          type: COMMAND_INPUT,
          args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
        });
        selectionCommands += group.length;
        contextualOrders += 1;
      };
      if (missionFiveWestBEngineerPhase === "capture" && factApc
        && snapshot.tick - missionFiveFootEscortOrderTick >= 120) {
        footContextOrder([factApc], { cellX: 50, cellY: 24 }, MODIFIER_ALT);
        missionFiveFootEscortOrderTick = snapshot.tick;
      }
      if (missionFiveFootReservePhase === "waiting"
        && missionFiveAssaultStartedTick === undefined && footEngineers.length > 0) {
        const holdPoint = { cellX: 35, cellY: 61 };
        const holding = footEngineers.every((engineer) => Math.max(
          Math.abs(engineer.cellX - holdPoint.cellX),
          Math.abs(engineer.cellY - holdPoint.cellY),
        ) <= 1);
        if (!holding && snapshot.tick - missionFiveFootReserveOrderTick >= 60) {
          footContextOrder(footEngineers, holdPoint, MODIFIER_ALT);
          missionFiveFootReserveOrderTick = snapshot.tick;
        }
      }
      if (missionFiveFootReservePhase === "waiting"
        && missionFiveAssaultStartedTick !== undefined) {
        missionFiveFootReservePhase = "outbound";
        missionFiveFootReserveOrderTick = -Infinity;
      }
      if (missionFiveFootReservePhase === "outbound" && footEngineers.length > 0) {
        const route = [
          { cellX: 42, cellY: 54 },
          { cellX: 53, cellY: 53 },
          { cellX: 53, cellY: 42 },
          { cellX: 59, cellY: 31 },
        ];
        const waypoint = route[missionFiveFootReserveRouteStage];
        if (waypoint
          && footEngineers.length === 4
          && footEngineers.every((engineer) => Math.max(
            Math.abs(engineer.cellX - waypoint.cellX),
            Math.abs(engineer.cellY - waypoint.cellY),
          ) <= 2)) {
          missionFiveFootReserveRouteStage += 1;
          missionFiveFootReserveOrderTick = -Infinity;
        }
        const nextWaypoint = route[missionFiveFootReserveRouteStage];
        if (!nextWaypoint) {
          missionFiveFootReservePhase = "staged";
          missionFiveFootReserveStagingTick ??= snapshot.tick;
          if (missionFiveFootReserveStagedEngineers.length === 0) {
            for (const engineer of footEngineers) {
              missionFiveFootReserveStagedEngineers.push({
                key: objectKey(engineer),
                strength: engineer.strength,
                maxStrength: engineer.maxStrength,
                cellX: engineer.cellX,
                cellY: engineer.cellY,
              });
            }
          }
          commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
          for (const engineer of footEngineers) commands.push({
            type: COMMAND_SELECT_OBJECT,
            args: [engineer.type, engineer.id, 0, 0, 0, 0, 0],
          });
          commands.push({ type: COMMAND_UNIT, args: [UNIT_REQUEST_STOP, 0, 0, 0, 0, 0, 0] });
          if (trace) console.error(JSON.stringify({ westBFootReservePhase: {
            tick: snapshot.tick, phase: missionFiveFootReservePhase,
            engineers: footEngineers.map(({ id, strength, cellX, cellY }) => (
              { id, strength, cellX, cellY }
            )),
          } }));
        } else if (missionFiveFootReserveRouteStage < missionFiveAssaultRouteStage
          && snapshot.tick - missionFiveFootReserveOrderTick >= 60) {
          footContextOrder(footEngineers, nextWaypoint, MODIFIER_ALT);
          missionFiveFootReserveOrderTick = snapshot.tick;
        }
      }
      if (trace && snapshot.tick % 300 === 0) console.error(JSON.stringify({
        westBFootReserve: true,
        tick: snapshot.tick,
        phase: missionFiveFootReservePhase,
        routeStage: missionFiveFootReserveRouteStage,
        engineers: footEngineers.map(({ id, strength, cellX, cellY }) => (
          { id, strength, cellX, cellY }
        )),
      }));
    }
    if (mission.number === 5 && mission.variant === "west-b"
      && missionFiveWestBApcKey !== undefined
      && missionFiveWestBEngineerPhase !== "captured") {
      const reservedApc = friendly.find((object) => objectKey(object) === missionFiveWestBApcKey);
      const visibleEngineer = friendly.find((object) => objectKey(object) === missionFiveWestBEngineerKey);
      const occupiedPips = reservedApc?.pips.slice(0, reservedApc.pipCount).filter((pip) => pip !== 0) ?? [];
      const queueContextOrder = (group, destination, flags = 0) => {
        if (group.length === 0 || !destination) return;
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        for (const object of group) {
          commands.push({ type: COMMAND_SELECT_OBJECT, args: [object.type, object.id, 0, 0, 0, 0, 0] });
        }
        if (flags !== 0) {
          commands.push({
            type: COMMAND_INPUT,
            flags,
            args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
          });
        }
        commands.push({
          type: COMMAND_INPUT,
          flags,
          args: [
            INPUT_COMMAND_AT_POSITION,
            destination.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            destination.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0, 0, 0, 0,
          ],
        });
        if (flags !== 0) {
          commands.push({ type: COMMAND_INPUT, args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0] });
        }
        selectionCommands += group.length;
        contextualOrders += 1;
        retargetCycles += 1;
      };
      const queueStop = (group) => {
        if (group.length === 0) return;
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        for (const object of group) {
          commands.push({ type: COMMAND_SELECT_OBJECT, args: [object.type, object.id, 0, 0, 0, 0, 0] });
        }
        commands.push({ type: COMMAND_UNIT, args: [UNIT_REQUEST_STOP, 0, 0, 0, 0, 0, 0] });
        selectionCommands += group.length;
      };

      if ((missionFiveWestBEngineerPhase === "prepark" || missionFiveWestBEngineerPhase === "parking")
        && reservedApc) {
        const parkPoint = { cellX: 31, cellY: 58 };
        if (Math.abs(reservedApc.cellX - parkPoint.cellX) <= 1
          && Math.abs(reservedApc.cellY - parkPoint.cellY) <= 1) {
          const nextPhase = visibleEngineer ? "docking" : "parked-await-engineer";
          transitionMissionFiveWestBEngineer(nextPhase, snapshot.tick, {
            apcStrength: reservedApc.strength,
            parkPoint,
          });
          missionFiveWestBApcOrderTick = -Infinity;
          missionFiveWestBLoadOrderTick = -Infinity;
          queueStop([reservedApc]);
        } else if (snapshot.tick - missionFiveWestBApcOrderTick >= 60) {
          queueContextOrder([reservedApc], parkPoint, MODIFIER_ALT);
          missionFiveWestBApcOrderTick = snapshot.tick;
        }
      } else if (missionFiveWestBEngineerPhase === "docking" && reservedApc && visibleEngineer) {
        if (missionFiveWestBApcOrderTick === -Infinity) {
          queueStop([reservedApc]);
          missionFiveWestBApcOrderTick = snapshot.tick;
        }
        if (snapshot.tick - missionFiveWestBLoadOrderTick >= 60) {
          // E6 alone must receive the contextual ENTER order. Selecting the APC
          // too would resolve a different action and invalidate this proof.
          queueContextOrder([visibleEngineer], reservedApc);
          missionFiveWestBLoadOrderTick = snapshot.tick;
        }
      } else if (missionFiveWestBEngineerPhase === "escort" && reservedApc) {
        const route = mission.assaultRoute.slice(0, 4);
        const waypoint = route[missionFiveWestBApcRouteStage];
        if (waypoint
          && missionFiveWestBApcRouteStage < missionFiveAssaultRouteStage
          && Math.abs(reservedApc.cellX - waypoint.cellX) <= 2
          && Math.abs(reservedApc.cellY - waypoint.cellY) <= 2) {
          missionFiveWestBApcRouteStage += 1;
          missionFiveWestBApcOrderTick = -Infinity;
        }
        const nextWaypoint = route[missionFiveWestBApcRouteStage];
        if (missionFiveAssaultPhase === "assault"
          && missionFiveWestBApcRouteStage < missionFiveAssaultRouteStage
          && nextWaypoint
          && snapshot.tick - missionFiveWestBApcOrderTick >= 60) {
          queueContextOrder([reservedApc], nextWaypoint);
          missionFiveWestBApcOrderTick = snapshot.tick;
        } else if (missionFiveAssaultPhase !== "assault" && missionFiveWestBApcRouteStage === 0
          && (Math.abs(reservedApc.cellX - 31) > 1 || Math.abs(reservedApc.cellY - 58) > 1)
          && snapshot.tick - missionFiveWestBApcOrderTick >= 120) {
          queueContextOrder([reservedApc], { cellX: 31, cellY: 58 }, MODIFIER_ALT);
          missionFiveWestBApcOrderTick = snapshot.tick;
        } else if (!nextWaypoint && missionFiveAssaultRouteStage >= 4) {
          transitionMissionFiveWestBEngineer("screening", snapshot.tick, {
            apcRouteStage: missionFiveWestBApcRouteStage,
          });
          missionFiveWestBApcOrderTick = -Infinity;
        }
      } else if (missionFiveWestBEngineerPhase === "screening" && reservedApc) {
        const eastGuns = hostiles.filter((hostile) => (
          hostile.typeName === "GUN" && hostile.cellY === 27
          && (hostile.cellX === 45 || hostile.cellX === 50)
        ));
        const eastMobileThreats = hostiles.filter((hostile) => (
          hostile.type !== 4 && hostile.cellX >= 48 && hostile.cellY >= 23 && hostile.cellY <= 35
        ));
        if (eastGuns.length === 0 && eastMobileThreats.length === 0) {
          transitionMissionFiveWestBEngineer("ingress", snapshot.tick, {
            apcStrength: reservedApc.strength,
          });
          missionFiveWestBApcOrderTick = -Infinity;
        } else if (snapshot.tick - missionFiveWestBApcOrderTick >= 120) {
          // Never contextual-click the transport's current cell while it is
          // screening: that is an unload. A STOP order holds the route-three
          // position without exposing the engineer.
          queueStop([reservedApc]);
          missionFiveWestBApcOrderTick = snapshot.tick;
        }
      } else if (missionFiveWestBEngineerPhase === "ingress" && reservedApc) {
        const unloadPoint = { cellX: 56, cellY: 16 };
        if (Math.abs(reservedApc.cellX - unloadPoint.cellX) <= 1
          && Math.abs(reservedApc.cellY - unloadPoint.cellY) <= 1) {
          transitionMissionFiveWestBEngineer("unloading", snapshot.tick, {
            apcStrength: reservedApc.strength,
          });
          missionFiveWestBUnloadOrderTick = -Infinity;
        } else if (snapshot.tick - missionFiveWestBApcOrderTick >= 60) {
          queueContextOrder([reservedApc], unloadPoint);
          missionFiveWestBApcOrderTick = snapshot.tick;
        }
      }
      if (missionFiveWestBEngineerPhase === "unloading" && reservedApc) {
        if (occupiedPips.length === 0) missionFiveWestBEmptyPipsTick ??= snapshot.tick;
        if (visibleEngineer) missionFiveWestBEngineerRootTick ??= snapshot.tick;
        if (missionFiveWestBEmptyPipsTick !== undefined && visibleEngineer) {
          transitionMissionFiveWestBEngineer("capture", snapshot.tick, {
            pipCount: reservedApc.pipCount,
            occupiedPips,
            engineer: objectKey(visibleEngineer),
          });
          missionFiveWestBCaptureOrderTick = -Infinity;
        } else if (snapshot.tick - missionFiveWestBUnloadOrderTick >= 90) {
          // A transport contextual self-click is the native unload command.
          queueContextOrder([reservedApc], reservedApc);
          missionFiveWestBUnloadOrderTick = snapshot.tick;
          missionFiveWestBUnloadIssuedTick ??= snapshot.tick;
        }
      }
      if (missionFiveWestBEngineerPhase === "capture" && visibleEngineer) {
        const factory = hostiles.find((hostile) => (
          hostile.typeName === "FACT" && hostile.cellX === 52 && hostile.cellY === 17
        ));
        const captureApproach = [
          { cellX: 55, cellY: 16 },
        ];
        const approach = captureApproach[missionFiveWestBEngineerCaptureStage];
        if (approach && Math.abs(visibleEngineer.cellX - approach.cellX) <= 1
          && Math.abs(visibleEngineer.cellY - approach.cellY) <= 1) {
          missionFiveWestBEngineerCaptureStage += 1;
          missionFiveWestBCaptureOrderTick = -Infinity;
        }
        const nextApproach = captureApproach[missionFiveWestBEngineerCaptureStage];
        if (nextApproach && snapshot.tick - missionFiveWestBCaptureOrderTick >= 60) {
          queueContextOrder([visibleEngineer], nextApproach, MODIFIER_ALT);
          missionFiveWestBCaptureOrderTick = snapshot.tick;
        } else if (!nextApproach && factory && snapshot.tick - missionFiveWestBCaptureOrderTick >= 60) {
          queueContextOrder([visibleEngineer], factory);
          missionFiveWestBCaptureOrderTick = snapshot.tick;
        }
      }
      if (trace && snapshot.tick % 300 === 0) {
        console.error(JSON.stringify({
          westBEngineer: true,
          tick: snapshot.tick,
          phase: missionFiveWestBEngineerPhase,
          engineer: visibleEngineer && {
            strength: visibleEngineer.strength,
            cellX: visibleEngineer.cellX,
            cellY: visibleEngineer.cellY,
          },
          apc: reservedApc && {
            strength: reservedApc.strength,
            cellX: reservedApc.cellX,
            cellY: reservedApc.cellY,
            pipCount: reservedApc.pipCount,
            occupiedPips,
          },
          apcRouteStage: missionFiveWestBApcRouteStage,
        }));
      }
    }
    if (mission.number === 5
      && mission.crate
      && missionFiveReliefStage >= mission.reliefRoute.length
      && missionFiveBaseRepairedTick !== undefined
      && missionFiveCrateCollectedTick === undefined) {
      if (missionFiveCrateRunnerKey === undefined) {
        const runnerPriority = mission.variant === "west-b"
          ? new Map([["JEEP", 0], ["APC", 1], ["MTNK", 2], ["E1", 3], ["E2", 4]])
          : new Map([["APC", 0], ["MTNK", 1], ["E1", 2], ["E2", 3]]);
        const runner = availableAttackers(snapshot).toSorted((left, right) => (
          (runnerPriority.get(left.typeName) ?? 20) - (runnerPriority.get(right.typeName) ?? 20)
          || right.strength - left.strength
          || left.id - right.id
        ))[0];
        if (runner) missionFiveCrateRunnerKey = objectKey(runner);
      }
      const runner = availableAttackers(snapshot).find((object) => (
        objectKey(object) === missionFiveCrateRunnerKey
      ));
      if (runner) {
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        commands.push({ type: COMMAND_SELECT_OBJECT, args: [runner.type, runner.id, 0, 0, 0, 0, 0] });
        commands.push({
          type: COMMAND_INPUT,
          flags: MODIFIER_ALT,
          args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
        });
        commands.push({
          type: COMMAND_INPUT,
          flags: MODIFIER_ALT,
          args: [
            INPUT_COMMAND_AT_POSITION,
            mission.crate.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            mission.crate.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0, 0, 0, 0,
          ],
        });
        commands.push({
          type: COMMAND_INPUT,
          args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
        });
        selectionCommands += 1;
        contextualOrders += 1;
      }
    }
    if (mission.number === 5
      && missionFiveAirstrike?.completed
      && missionFiveAirstrikePending === undefined
      && [...missionFiveInitialSamStructureKeys].every((key) => (
        !hostiles.some((hostile) => objectKey(hostile) === key)
      ))) {
      const airstrikePriority = new Map([["FACT", 0], ["HAND", 1], ["PROC", 2], ["AFLD", 3]]);
      const airstrikeTarget = hostiles.filter((hostile) => hostile.type === 4).toSorted((left, right) => (
        (airstrikePriority.get(left.typeName) ?? 20) - (airstrikePriority.get(right.typeName) ?? 20)
        || left.strength - right.strength
        || left.cellY - right.cellY
        || left.cellX - right.cellX
        || left.id - right.id
      ))[0];
      if (airstrikeTarget) {
        commands.push({
          type: COMMAND_SUPERWEAPON,
          flags: 0,
          args: [
            SUPERWEAPON_PLACE,
            missionFiveAirstrike.buildableType,
            missionFiveAirstrike.buildableId,
            airstrikeTarget.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            airstrikeTarget.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0,
            0,
          ],
        });
        missionFiveAirstrikeOrders.push({
          tick: snapshot.tick,
          target: airstrikeTarget.typeName,
          cellX: airstrikeTarget.cellX,
          cellY: airstrikeTarget.cellY,
        });
        missionFiveAirstrikePending = {
          orderTick: snapshot.tick,
          targetKey: objectKey(airstrikeTarget),
          targetType: airstrikeTarget.typeName,
          targetStrength: airstrikeTarget.strength,
        };
      }
    }
    if (mission.number === 4 && mission.variant === "west-b") {
      if (westBInitialVehicleKeys.size === 0) {
        for (const grenadier of friendly.filter((object) => object.typeName === "E2")) westBInitialE2Keys.add(objectKey(grenadier));
        for (const vehicle of attackers.filter((attacker) => attacker.type === 2)) {
          westBInitialVehicleKeys.add(objectKey(vehicle));
          if (vehicle.typeName === "JEEP") westBJeepKey = objectKey(vehicle);
        }
      }
      if (westBPhase === "load") {
        const apcs = friendly.filter((object) => object.typeName === "APC")
          .toSorted((left, right) => left.cellX - right.cellX || left.id - right.id);
        const cargoGroups = ["E1", "E2"].map((typeName) => friendly.filter((object) => object.typeName === typeName));
        if (friendly.filter((object) => object.type === 1).length === 0) {
          westBPhase = "transit";
        } else if (!westBLoadIssued) {
          for (let groupIndex = 0; groupIndex < Math.min(apcs.length, cargoGroups.length); groupIndex += 1) {
            const cargo = cargoGroups[groupIndex];
            if (cargo.length === 0) continue;
            const apc = apcs[groupIndex];
            commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
            for (const passenger of cargo) commands.push({ type: COMMAND_SELECT_OBJECT, args: [passenger.type, passenger.id, 0, 0, 0, 0, 0] });
            commands.push({ type: COMMAND_INPUT, args: [INPUT_COMMAND_AT_POSITION, apc.cellX * CELL_PIXELS + 12, apc.cellY * CELL_PIXELS + 12, 0, 0, 0, 0] });
          }
          westBLoadIssued = true;
        }
      }
      if (westBPhase === "transit") {
        const travelers = attackers.filter((attacker) => westBInitialVehicleKeys.has(objectKey(attacker))
          && (westBRouteStage < 5 || objectKey(attacker) === westBJeepKey));
        const waypoint = westBTransitRoute[westBRouteStage];
        const arrivals = travelers.filter((unit) => Math.abs(unit.cellX - waypoint.cellX) <= 2 && Math.abs(unit.cellY - waypoint.cellY) <= 2).length;
        if (travelers.length > 0 && arrivals === travelers.length) westBRouteStage += 1;
        const targetWaypoint = westBTransitRoute[westBRouteStage];
        if (!targetWaypoint) {
          westBPhase = "wait";
          westBWaitStarted = snapshot.tick;
        } else if (travelers.length > 0) {
          commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
          for (const traveler of travelers) commands.push({ type: COMMAND_SELECT_OBJECT, args: [traveler.type, traveler.id, 0, 0, 0, 0, 0] });
          commands.push({ type: COMMAND_INPUT, args: [INPUT_COMMAND_AT_POSITION, targetWaypoint.cellX * CELL_PIXELS + 12, targetWaypoint.cellY * CELL_PIXELS + 12, 0, 0, 0, 0] });
        }
      }
      if (westBPhase === "wait") {
        if (!westBOwnUnloadIssued) {
          const loadedApcs = attackers.filter((attacker) => attacker.typeName === "APC" && westBInitialVehicleKeys.has(objectKey(attacker)));
          for (const apc of loadedApcs) {
            commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
            commands.push({ type: COMMAND_SELECT_OBJECT, args: [apc.type, apc.id, 0, 0, 0, 0, 0] });
            commands.push({ type: COMMAND_INPUT, args: [INPUT_COMMAND_AT_POSITION, apc.cellX * CELL_PIXELS + 12, apc.cellY * CELL_PIXELS + 12, 0, 0, 0, 0] });
          }
          westBOwnUnloadIssued = true;
        }
        if (snapshot.tick - westBWaitStarted >= 30) westBPhase = "combat";
      }
      if (westBPhase === "combat" && !westBReinforcementsReady) {
        const deliveredGrenadiers = friendly.filter((object) => object.typeName === "E2" && !westBInitialE2Keys.has(objectKey(object)));
        if (deliveredGrenadiers.length >= 4) westBReinforcementsReady = true;
      }
      if (westBPhase === "combat" && westBReinforcementsReady) {
        const waypoint = westBCombatRoute[westBCombatStage];
        if (waypoint) {
          const arrivals = attackers.filter((unit) => Math.abs(unit.cellX - waypoint.cellX) <= 4 && Math.abs(unit.cellY - waypoint.cellY) <= 4).length;
          if (arrivals >= Math.min(6, Math.max(2, Math.floor(attackers.length / 3)))) westBCombatStage += 1;
        } else if (hostiles.length > 0) {
          westBCombatStage = 0;
        }
        const nextWaypoint = westBCombatRoute[westBCombatStage] ?? westBCombatRoute.at(-1);
        const explorationTarget = visibleHostiles.length === 0 && hostiles.length > 0
          ? chooseTarget(hostiles)
          : nextWaypoint;
        if (!westBReserveApcPositioned && snapshot.tick >= 2600) {
          const reserveCandidate = attackers.filter((attacker) => attacker.typeName === "APC"
            && attacker.cellX <= 30 && attacker.strength === attacker.maxStrength)
            .toSorted((left, right) => right.strength - left.strength || left.id - right.id)[0];
          if (reserveCandidate) {
            westBReserveApcKey = objectKey(reserveCandidate);
            westBReserveApcPositioned = true;
          }
        }
        const reserveApc = attackers.find((attacker) => objectKey(attacker) === westBReserveApcKey);
        const screen = attackers.filter((attacker) => attacker.typeName !== "E2"
          && objectKey(attacker) !== westBReserveApcKey
          && !westBLureDecoyBlacklist.has(objectKey(attacker)));
        const grenadiers = attackers.filter((attacker) => attacker.typeName === "E2");
        const remainingSupport = hostiles.filter((hostile) => hostile.typeName !== "LTNK");
        const reserveGrenadiers = hostiles.length <= 12;
        const chooseFor = (group, priority) => group.length === 0 ? undefined : visibleHostiles.map((hostile) => ({
          hostile,
          distance: Math.min(...group.map((attacker) => Math.max(Math.abs(hostile.cellX - attacker.cellX), Math.abs(hostile.cellY - attacker.cellY)))),
        })).filter(({ distance }) => distance <= 12).toSorted((a, b) => (priority[a.hostile.typeName] ?? 9) - (priority[b.hostile.typeName] ?? 9) || a.distance - b.distance || a.hostile.strength - b.hostile.strength)[0]?.hostile;
        const issueGroupOrder = (group, order) => {
          if (group.length === 0 || !order) return;
          commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
          for (const attacker of group) commands.push({ type: COMMAND_SELECT_OBJECT, args: [attacker.type, attacker.id, 0, 0, 0, 0, 0] });
          commands.push({ type: COMMAND_INPUT, args: [INPUT_COMMAND_AT_POSITION, order.cellX * CELL_PIXELS + 12, order.cellY * CELL_PIXELS + 12, 0, 0, 0, 0] });
        };
        const apcTakeover = Boolean(reserveApc && hostiles.length <= 7
          && hostiles.some((hostile) => hostile.typeName === "E3"));
        if (reserveApc && !apcTakeover) {
          const reserveThreats = hostiles.filter((hostile) => hostile.typeName === "LTNK");
          if (reserveThreats.length > 0) {
            const reservePoint = { cellX: 43, cellY: 30 };
            const parked = Math.abs(reserveApc.cellX - reservePoint.cellX) <= 1
              && Math.abs(reserveApc.cellY - reservePoint.cellY) <= 1;
            if (!parked && snapshot.tick - westBReserveApcOrderTick >= 120) {
              issueGroupOrder([reserveApc], reservePoint);
              westBReserveApcOrderTick = snapshot.tick;
            }
            westBReserveApcCleanupTargetKey = undefined;
          } else {
            const cleanupTarget = hostiles.filter((hostile) => hostile.typeName === "BGGY")
              .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0]
              ?? hostiles.filter((hostile) => hostile.typeName === "E1")
                .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0]
              ?? chooseTarget(hostiles);
            const cleanupKey = cleanupTarget && objectKey(cleanupTarget);
            if (cleanupTarget && (westBReserveApcCleanupTargetKey !== cleanupKey
              || snapshot.tick - westBReserveApcOrderTick >= 60)) {
              issueGroupOrder([reserveApc], cleanupTarget);
              westBReserveApcCleanupTargetKey = cleanupKey;
              westBReserveApcOrderTick = snapshot.tick;
            }
          }
        }
        if (apcTakeover) {
          if (!westBTakeoverInitialized) {
            commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
            for (const grenadier of grenadiers) {
              commands.push({ type: COMMAND_SELECT_OBJECT, args: [grenadier.type, grenadier.id, 0, 0, 0, 0, 0] });
            }
            commands.push({ type: COMMAND_UNIT, args: [5, 0, 0, 0, 0, 0, 0] });
            commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
            for (const unit of screen) {
              commands.push({ type: COMMAND_SELECT_OBJECT, args: [unit.type, unit.id, 0, 0, 0, 0, 0] });
            }
            if (screen.length > 0) commands.push({ type: COMMAND_UNIT, args: [5, 0, 0, 0, 0, 0, 0] });
            westBTakeoverInitialized = true;
          }
          const supportTarget = hostiles.filter((hostile) => hostile.typeName === "E3")
            .toSorted((left, right) => left.strength - right.strength || left.cellY - right.cellY || left.id - right.id)[0];
          if (supportTarget) {
            westBTakeoverPhase = "support";
            const supportKey = objectKey(supportTarget);
            if (westBTakeoverTargetKey !== supportKey || snapshot.tick - westBTakeoverOrderTick >= 60) {
              if (supportTarget.cellY >= 48 && screen.length > 0) {
                issueGroupOrder(screen, supportTarget);
                issueGroupOrder([reserveApc], { cellX: 43, cellY: 30 });
              } else {
                issueGroupOrder([reserveApc], supportTarget);
              }
              westBTakeoverTargetKey = supportKey;
              westBTakeoverOrderTick = snapshot.tick;
            }
          } else {
            const tankTarget = hostiles.filter((hostile) => hostile.typeName === "LTNK")
              .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0];
            if (tankTarget) {
              const tankKey = objectKey(tankTarget);
              if (westBTakeoverPhase === "support" || westBTakeoverTargetKey !== tankKey) {
                westBTakeoverPhase = "approach";
                westBTakeoverTargetKey = tankKey;
                westBTakeoverApcInitialStrength = reserveApc.strength;
                westBTakeoverTargetInitialStrength = tankTarget.strength;
                westBTakeoverTargetOrigin = { cellX: tankTarget.cellX, cellY: tankTarget.cellY };
                westBTakeoverOrderTick = -Infinity;
                westBTakeoverParkedTick = undefined;
              }
              if (westBTakeoverPhase === "approach") {
                if (snapshot.tick - westBTakeoverOrderTick >= 60) {
                  issueGroupOrder([reserveApc], tankTarget);
                  westBTakeoverOrderTick = snapshot.tick;
                }
                if (reserveApc.strength < westBTakeoverApcInitialStrength
                  || tankTarget.strength < westBTakeoverTargetInitialStrength
                  || tankTarget.cellX !== westBTakeoverTargetOrigin.cellX
                  || tankTarget.cellY !== westBTakeoverTargetOrigin.cellY) {
                  westBTakeoverPhase = "retreat";
                  westBTakeoverOrderTick = -Infinity;
                }
              }
              if (westBTakeoverPhase === "retreat") {
                const reservePoint = { cellX: 43, cellY: 30 };
                const parked = Math.abs(reserveApc.cellX - reservePoint.cellX) <= 1
                  && Math.abs(reserveApc.cellY - reservePoint.cellY) <= 1;
                if (!parked && snapshot.tick - westBTakeoverOrderTick >= 60) {
                  issueGroupOrder([reserveApc], reservePoint);
                  westBTakeoverOrderTick = snapshot.tick;
                }
                if (parked) {
                  westBTakeoverParkedTick ??= snapshot.tick;
                  if (snapshot.tick - westBTakeoverParkedTick >= 90) {
                    westBTakeoverPhase = "approach";
                    westBTakeoverApcInitialStrength = reserveApc.strength;
                    westBTakeoverTargetInitialStrength = tankTarget.strength;
                    westBTakeoverTargetOrigin = { cellX: tankTarget.cellX, cellY: tankTarget.cellY };
                    westBTakeoverOrderTick = -Infinity;
                    westBTakeoverParkedTick = undefined;
                  }
                }
              }
            } else {
              const cleanupTarget = hostiles.filter((hostile) => hostile.typeName === "BGGY")
                .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0]
                ?? hostiles.filter((hostile) => hostile.typeName === "E1")
                  .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0]
                ?? chooseTarget(hostiles);
              const cleanupKey = cleanupTarget && objectKey(cleanupTarget);
              if (cleanupTarget && (westBTakeoverTargetKey !== cleanupKey
                || snapshot.tick - westBTakeoverOrderTick >= 60)) {
                issueGroupOrder([reserveApc], cleanupTarget);
                westBTakeoverTargetKey = cleanupKey;
                westBTakeoverOrderTick = snapshot.tick;
              }
            }
          }
        } else if (reserveGrenadiers) {
          const holdPoint = { cellX: 43, cellY: 42 };
          if (westBScreenOrder !== "hold") {
            issueGroupOrder(screen, holdPoint);
            westBScreenOrder = "hold";
          }
          const assaultTarget = screen.length === 0
            ? hostiles.filter((hostile) => hostile.typeName === "LTNK")
              .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0]
              ?? hostiles.filter((hostile) => hostile.typeName === "BGGY")
                .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0]
              ?? chooseTarget(hostiles)
            : undefined;
          const assaultTargetKey = assaultTarget && objectKey(assaultTarget);
          const tanksRemain = hostiles.some((hostile) => hostile.typeName === "LTNK");
          if (tanksRemain && !westBLastStand) {
            for (const candidate of grenadiers
              .filter((grenadier) => grenadier.strength <= 9 && !westBCriticalReserveKeys.has(objectKey(grenadier)))
              .toSorted((left, right) => left.strength - right.strength || left.id - right.id)) {
              const combatCount = grenadiers.filter((grenadier) => !westBCriticalReserveKeys.has(objectKey(grenadier))).length;
              if (combatCount <= 2) break;
              westBCriticalReserveKeys.add(objectKey(candidate));
              westBCriticalReservePoints.set(objectKey(candidate), {
                cellX: Math.max(39, Math.min(56, candidate.cellX)),
                cellY: 30,
              });
            }
          }
          let criticalReserves = tanksRemain
            ? grenadiers.filter((grenadier) => westBCriticalReserveKeys.has(objectKey(grenadier)))
            : [];
          for (const reserve of criticalReserves) {
            const reservePoint = westBCriticalReservePoints.get(objectKey(reserve));
            if (reservePoint && (Math.abs(reserve.cellX - reservePoint.cellX) > 2
              || Math.abs(reserve.cellY - reservePoint.cellY) > 2)
              && snapshot.tick - (westBCriticalReserveOrderTicks.get(objectKey(reserve)) ?? -Infinity) >= 60) {
              issueGroupOrder([reserve], reservePoint);
              westBCriticalReserveOrderTicks.set(objectKey(reserve), snapshot.tick);
            }
          }
          let combatGrenadiers = tanksRemain
            ? grenadiers.filter((grenadier) => !westBCriticalReserveKeys.has(objectKey(grenadier)))
            : grenadiers;
          if (tanksRemain && combatGrenadiers.length === 0 && grenadiers.length > 0) {
            westBLastStand = true;
            westBCriticalReserveKeys.clear();
            criticalReserves = [];
            combatGrenadiers = grenadiers;
          }
          if (westBKiteTargetKey !== assaultTargetKey) {
            westBKiteActive = false;
            westBKiteTargetKey = assaultTargetKey;
            westBKiteDecoyKey = undefined;
            westBKiteRetreatPoint = undefined;
            westBKiteOrderTick = -Infinity;
          }
          if (!westBKiteActive && assaultTarget?.typeName === "LTNK"
            && assaultTarget.cellX >= 59 && combatGrenadiers.length === 2) {
            const decoy = combatGrenadiers.toSorted((left, right) => right.strength - left.strength || left.id - right.id)[0];
            westBKiteActive = true;
            westBKiteDecoyKey = objectKey(decoy);
            westBKiteRetreatPoint = {
              cellX: Math.max(snapshot.staticMap.cellX, assaultTarget.cellX - 10),
              cellY: Math.max(snapshot.staticMap.cellY, assaultTarget.cellY - 10),
            };
          }
          const kiteDecoy = westBKiteActive && combatGrenadiers.length > 1
            ? combatGrenadiers.find((grenadier) => objectKey(grenadier) === westBKiteDecoyKey)
            : undefined;
          if (kiteDecoy && snapshot.tick - westBKiteOrderTick >= 60) {
            issueGroupOrder([kiteDecoy], westBKiteRetreatPoint);
            westBKiteOrderTick = snapshot.tick;
          }
          const firingGrenadiers = kiteDecoy
            ? combatGrenadiers.filter((grenadier) => grenadier !== kiteDecoy)
            : combatGrenadiers;
          if (!assaultTarget) {
            westBAssaultTargetKey = undefined;
            westBAssaultAnchor = undefined;
            westBAssaultStartedTick = undefined;
          } else if (westBAssaultTargetKey !== objectKey(assaultTarget)) {
            westBAssaultTargetKey = objectKey(assaultTarget);
            westBAssaultAnchor = { cellX: assaultTarget.cellX, cellY: assaultTarget.cellY };
            westBAssaultStartedTick = snapshot.tick;
            westBGuardPhase = "stage";
            westBGrenadierOrders.clear();
            westBGrenadierOrderTicks.clear();
          }
          const assaultOffsets = [
            assaultTarget?.cellX >= 59 ? { cellX: -3, cellY: -3 } : { cellX: -4, cellY: -4 },
            { cellX: -1, cellY: -4 },
            { cellX: 2, cellY: -4 },
            { cellX: 4, cellY: -1 },
            { cellX: 5, cellY: -4 },
            { cellX: -4, cellY: -1 },
            { cellX: 3, cellY: -1 },
          ];
          const supportOffsets = [
            { cellX: -3, cellY: -3 },
            { cellX: 0, cellY: -3 },
            { cellX: 3, cellY: -3 },
            { cellX: -3, cellY: 0 },
            { cellX: 3, cellY: 0 },
            { cellX: -3, cellY: 3 },
            { cellX: 3, cellY: 3 },
          ];
          const activeOffsets = tanksRemain && !westBLastStand ? assaultOffsets : supportOffsets;
          const singleShooterPoint = westBAssaultAnchor && firingGrenadiers.length === 1
            ? {
              cellX: Math.max(snapshot.staticMap.cellX, westBAssaultAnchor.cellX - 3),
              cellY: westBAssaultAnchor.cellY,
            }
            : undefined;
          const activeForwardLine = singleShooterPoint
            ? westBForwardLine.map(() => singleShooterPoint)
            : westBAssaultAnchor
            ? activeOffsets.map((offset) => ({
              cellX: Math.max(snapshot.staticMap.cellX, Math.min(
                snapshot.staticMap.cellX + snapshot.staticMap.width - 1,
                westBAssaultAnchor.cellX + offset.cellX,
              )),
              cellY: Math.max(snapshot.staticMap.cellY, Math.min(
                snapshot.staticMap.cellY + snapshot.staticMap.height - 1,
                westBAssaultAnchor.cellY + offset.cellY,
              )),
            }))
              : westBForwardLine;
          const stagingTolerance = westBAssaultAnchor ? 2 : 3;
          for (const grenadier of firingGrenadiers.toSorted((left, right) => left.id - right.id)) {
            if (!westBStagingIndexes.has(objectKey(grenadier))) {
              westBStagingIndexes.set(objectKey(grenadier), westBStagingIndexes.size % westBForwardLine.length);
            }
            const stagingIndex = westBStagingIndexes.get(objectKey(grenadier));
            const stagingPoint = activeForwardLine[stagingIndex];
            const reserveKey = `stage:${stagingIndex}:${stagingPoint.cellX}:${stagingPoint.cellY}`;
            const atStagingPoint = Math.abs(grenadier.cellX - stagingPoint.cellX) <= stagingTolerance
              && Math.abs(grenadier.cellY - stagingPoint.cellY) <= stagingTolerance;
            if (westBGuardPhase === "stage" && !atStagingPoint
              && (westBGrenadierOrders.get(objectKey(grenadier)) !== reserveKey
                || snapshot.tick - (westBGrenadierOrderTicks.get(objectKey(grenadier)) ?? -Infinity) >= 120)) {
              issueGroupOrder([grenadier], stagingPoint);
              westBGrenadierOrders.set(objectKey(grenadier), reserveKey);
              westBGrenadierOrderTicks.set(objectKey(grenadier), snapshot.tick);
            }
          }
          const stagedGrenadiers = firingGrenadiers.filter((grenadier) => {
            const stagingPoint = activeForwardLine[westBStagingIndexes.get(objectKey(grenadier))];
            return Math.abs(grenadier.cellX - stagingPoint.cellX) <= stagingTolerance
              && Math.abs(grenadier.cellY - stagingPoint.cellY) <= stagingTolerance;
          });
          const lineReady = firingGrenadiers.length > 0 && (
            stagedGrenadiers.length === firingGrenadiers.length
            || (assaultTarget && (
              stagedGrenadiers.length >= Math.min(4, firingGrenadiers.length)
              || snapshot.tick - westBAssaultStartedTick >= 240
            ))
          );
          if (westBGuardPhase === "stage" && lineReady) {
            if (assaultTarget?.typeName === "BGGY") {
              issueGroupOrder(firingGrenadiers, assaultTarget);
              westBGuardFocusing = true;
            } else {
              commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
              for (const grenadier of firingGrenadiers) {
                commands.push({ type: COMMAND_SELECT_OBJECT, args: [grenadier.type, grenadier.id, 0, 0, 0, 0, 0] });
              }
              commands.push({ type: COMMAND_UNIT, args: [4, 0, 0, 0, 0, 0, 0] });
              westBGuardFocusing = false;
            }
            westBGuardPhase = "guard";
            westBGuardPhaseTick = snapshot.tick;
            westBLineEstablished = true;
          } else if (westBGuardPhase === "guard"
            && snapshot.tick - westBGuardPhaseTick >= (westBGuardFocusing ? 75 : 45)) {
            commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
            for (const grenadier of firingGrenadiers) {
              commands.push({ type: COMMAND_SELECT_OBJECT, args: [grenadier.type, grenadier.id, 0, 0, 0, 0, 0] });
            }
            commands.push({ type: COMMAND_UNIT, args: [5, 0, 0, 0, 0, 0, 0] });
            westBGuardPhase = "stage";
            if (westBAssaultAnchor) {
              westBAssaultAnchor = { cellX: assaultTarget.cellX, cellY: assaultTarget.cellY };
              westBAssaultStartedTick = snapshot.tick;
            }
            westBGrenadierOrders.clear();
            westBGrenadierOrderTicks.clear();
          }
          if (westBLineEstablished) {
            let lureTarget = hostiles.find((hostile) => objectKey(hostile) === westBLureTankKey);
            if (westBLureTankKey !== undefined && !lureTarget) {
              westBLureTankKey = undefined;
              westBLureDecoyKey = undefined;
              westBLurePhase = "approach";
              westBLureRetreatStage = 0;
              westBLureOrder = undefined;
              westBLureActivated = false;
              westBLureTargetOrigin = undefined;
              westBLureTargetInitialStrength = undefined;
              westBLureDecoyInitialStrength = undefined;
              westBFocusOrder = undefined;
            }
            if (!lureTarget) {
              lureTarget = hostiles.filter((hostile) => hostile.typeName === "E3" && hostile.cellY <= 51)
                .toSorted((left, right) => left.strength - right.strength || left.cellY - right.cellY || left.id - right.id)[0]
                ?? hostiles.filter((hostile) => hostile.typeName === "LTNK")
                .toSorted((left, right) => left.id - right.id)[0]
                ?? hostiles.filter((hostile) => hostile.typeName === "BGGY")
                  .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0]
                ?? chooseTarget(hostiles);
              if (lureTarget) {
                westBLureTankKey = objectKey(lureTarget);
                westBLureTargetOrigin = { cellX: lureTarget.cellX, cellY: lureTarget.cellY };
                westBLureTargetInitialStrength = lureTarget.strength;
              }
            }
            let decoy = screen.find((unit) => objectKey(unit) === westBLureDecoyKey);
            if (!decoy && westBLureActivated) {
              westBLureActivated = false;
              westBLureDecoyKey = undefined;
              westBLurePhase = "approach";
              westBLureRetreatStage = 0;
              westBLureOrder = undefined;
              westBLureProgressSignature = undefined;
              westBLureProgressTick = snapshot.tick;
              westBLureTargetOrigin = lureTarget
                ? { cellX: lureTarget.cellX, cellY: lureTarget.cellY }
                : undefined;
              westBLureTargetInitialStrength = lureTarget?.strength;
            }
            if (decoy && westBLurePhase === "approach") {
              const progressSignature = `${decoy.cellX}:${decoy.cellY}:${lureTarget?.strength}:${lureTarget?.cellX}:${lureTarget?.cellY}`;
              if (progressSignature !== westBLureProgressSignature) {
                westBLureProgressSignature = progressSignature;
                westBLureProgressTick = snapshot.tick;
              } else if (snapshot.tick - westBLureProgressTick >= 180) {
                westBLureDecoyBlacklist.add(objectKey(decoy));
                westBLureDecoyKey = undefined;
                westBLureOrder = undefined;
                westBLureProgressSignature = undefined;
                westBLureProgressTick = snapshot.tick;
                decoy = undefined;
              }
            }
            if (!decoy && !westBLureActivated) {
              decoy = screen.filter((unit) => !westBLureDecoyBlacklist.has(objectKey(unit))).toSorted((left, right) => (
                ({ JEEP: 0, E1: 1, APC: 2 }[left.typeName] ?? 9)
                - ({ JEEP: 0, E1: 1, APC: 2 }[right.typeName] ?? 9)
                || right.strength - left.strength
                || left.id - right.id
              ))[0];
              westBLureDecoyKey = decoy && objectKey(decoy);
              westBLureOrder = undefined;
              westBLurePhase = "approach";
              westBLureRetreatStage = 0;
              westBLureDecoyInitialStrength = decoy?.strength;
              westBLureTargetOrigin = lureTarget
                ? { cellX: lureTarget.cellX, cellY: lureTarget.cellY }
                : undefined;
              westBLureTargetInitialStrength = lureTarget?.strength;
              westBLureProgressSignature = decoy
                ? `${decoy.cellX}:${decoy.cellY}:${lureTarget?.strength}:${lureTarget?.cellX}:${lureTarget?.cellY}`
                : undefined;
              westBLureProgressTick = snapshot.tick;
            }
            if (lureTarget && decoy) {
              if (westBLurePhase === "approach") {
                const attackKey = `attack:${objectKey(lureTarget)}:${objectKey(decoy)}`;
                if (westBLureOrder !== attackKey) {
                  issueGroupOrder([decoy], lureTarget);
                  westBLureOrder = attackKey;
                }
                if (lureTarget.strength < (westBLureTargetInitialStrength ?? lureTarget.strength)
                  || (westBLureTargetOrigin
                    && (lureTarget.cellX !== westBLureTargetOrigin.cellX || lureTarget.cellY !== westBLureTargetOrigin.cellY))) {
                  westBLureActivated = true;
                  westBLurePhase = "retreat";
                  westBLureRetreatStage = 0;
                  westBLureOrder = undefined;
                }
              }
              if (westBLurePhase === "retreat") {
                const retreatProgressSignature = `retreat:${westBLureRetreatStage}:${decoy.cellX}:${decoy.cellY}`;
                if (retreatProgressSignature !== westBLureProgressSignature) {
                  westBLureProgressSignature = retreatProgressSignature;
                  westBLureProgressTick = snapshot.tick;
                }
                if (snapshot.tick - westBLureProgressTick >= 300) {
                  westBLureDecoyBlacklist.add(objectKey(decoy));
                  westBLureTankKey = undefined;
                  westBLureActivated = false;
                  westBLureDecoyKey = undefined;
                  westBLurePhase = "approach";
                  westBLureRetreatStage = 0;
                  westBLureOrder = undefined;
                  westBLureProgressSignature = undefined;
                  westBLureProgressTick = snapshot.tick;
                  westBLureTargetOrigin = undefined;
                  westBLureTargetInitialStrength = undefined;
                } else {
                  const retreatRoute = [
                    { cellX: 50, cellY: 50 },
                    { cellX: 45, cellY: 49 },
                    { cellX: 43, cellY: 48 },
                    { cellX: 43, cellY: 47 },
                    { cellX: 44, cellY: 46 },
                    { cellX: 45, cellY: 45 },
                    { cellX: 46, cellY: 40 },
                    { cellX: 46, cellY: 34 },
                  ];
                  const waypoint = retreatRoute[westBLureRetreatStage] ?? retreatRoute.at(-1);
                  if (Math.abs(decoy.cellX - waypoint.cellX) <= 2 && Math.abs(decoy.cellY - waypoint.cellY) <= 2
                  ) {
                    if (westBLureRetreatStage < retreatRoute.length - 1) {
                      westBLureRetreatStage += 1;
                      westBLureOrder = undefined;
                    } else {
                      westBLureDecoyBlacklist.add(objectKey(decoy));
                      westBLureActivated = false;
                      westBLureDecoyKey = undefined;
                      westBLurePhase = "approach";
                      westBLureRetreatStage = 0;
                      westBLureOrder = undefined;
                      westBLureProgressSignature = undefined;
                      westBLureProgressTick = snapshot.tick;
                      westBLureTargetOrigin = { cellX: lureTarget.cellX, cellY: lureTarget.cellY };
                      westBLureTargetInitialStrength = lureTarget.strength;
                    }
                  }
                  const nextWaypoint = retreatRoute[westBLureRetreatStage] ?? retreatRoute.at(-1);
                  const retreatKey = `retreat:${westBLureRetreatStage}`;
                  if (westBLureOrder !== retreatKey) {
                    issueGroupOrder([decoy], nextWaypoint);
                    westBLureOrder = retreatKey;
                  }
                }
              }
            }
          }
        } else {
          const screenTarget = chooseFor(screen, { BGGY: 0, E3: 1, E1: 2, LTNK: 3 });
          const grenadeTarget = chooseFor(grenadiers, { BGGY: 0, E3: 1, E1: 2, LTNK: 3 });
          issueGroupOrder(screen, screenTarget ?? explorationTarget);
          issueGroupOrder(grenadiers, grenadeTarget ?? screenTarget ?? explorationTarget);
          westBGrenadierOrders.clear();
          westBGrenadierOrderTicks.clear();
        }
      }
      if (westBIntegratedPhase === "tank6" || westBIntegratedPhase === "cleanup") {
        const reserveApc = attackers.find((attacker) => objectKey(attacker) === westBReserveApcKey)
          ?? attackers.filter((attacker) => attacker.typeName === "APC")
            .toSorted((left, right) => right.strength - left.strength || left.id - right.id)[0];
        if (reserveApc && westBReserveApcKey === undefined) westBReserveApcKey = objectKey(reserveApc);
        const grenadiers = attackers.filter((attacker) => attacker.typeName === "E2")
          .toSorted((left, right) => left.id - right.id);
        const screen = attackers.filter((attacker) => attacker.typeName !== "E2" && attacker !== reserveApc);
        const issueReserveOrder = (group, order) => {
          if (group.length === 0 || !order) return;
          commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
          for (const attacker of group) {
            commands.push({ type: COMMAND_SELECT_OBJECT, args: [attacker.type, attacker.id, 0, 0, 0, 0, 0] });
          }
          commands.push({ type: COMMAND_INPUT, args: [INPUT_COMMAND_AT_POSITION,
            order.cellX * CELL_PIXELS + 12, order.cellY * CELL_PIXELS + 12, 0, 0, 0, 0] });
        };
        if (screen.length > 0 && snapshot.tick - westBReserveScreenOrderTick >= 90) {
          issueReserveOrder(screen, { cellX: 43, cellY: 30 });
          westBReserveScreenOrderTick = snapshot.tick;
        }
        const tanks = hostiles.filter((hostile) => hostile.typeName === "LTNK")
          .toSorted((left, right) => left.strength - right.strength || left.id - right.id);
        const tank = tanks[0];
        const finalCleanupActive = tanks.length === 1
          && hostiles.some((hostile) => hostile.typeName === "E1");
        const stageForTank = Boolean(tank && tanks.length >= 2);
        const tankOffsets = [
          { cellX: -4, cellY: -4 },
          { cellX: -1, cellY: -4 },
          { cellX: 2, cellY: -4 },
          { cellX: 4, cellY: -1 },
          { cellX: -4, cellY: -1 },
        ];
        const cleanupLine = [
          { cellX: 43, cellY: 43 },
          { cellX: 46, cellY: 43 },
          { cellX: 49, cellY: 43 },
          { cellX: 52, cellY: 43 },
        ];
        for (const [fallbackIndex, grenadier] of grenadiers.entries()) {
          const grenadierKey = objectKey(grenadier);
          if (!westBStagingIndexes.has(grenadierKey)) westBStagingIndexes.set(grenadierKey, fallbackIndex);
          const index = westBStagingIndexes.get(grenadierKey);
          if (finalCleanupActive) {
            westBReserveLinePoints.set(grenadierKey, cleanupLine[fallbackIndex % cleanupLine.length]);
          } else if (stageForTank) {
            const offset = tankOffsets[index % tankOffsets.length];
            westBReserveLinePoints.set(grenadierKey, {
              cellX: Math.max(snapshot.staticMap.cellX, Math.min(
                snapshot.staticMap.cellX + snapshot.staticMap.width - 1,
                tank.cellX + offset.cellX,
              )),
              cellY: Math.max(snapshot.staticMap.cellY, Math.min(
                snapshot.staticMap.cellY + snapshot.staticMap.height - 1,
                tank.cellY + offset.cellY,
              )),
            });
          }
        }
        const readyGrenadiers = [];
        for (const grenadier of grenadiers) {
          const grenadierKey = objectKey(grenadier);
          const anchor = westBReserveLinePoints.get(grenadierKey);
          if (!anchor) continue;
          if (Math.abs(grenadier.cellX - anchor.cellX) <= 2
            && Math.abs(grenadier.cellY - anchor.cellY) <= 2) {
            readyGrenadiers.push(grenadier);
          } else if ((stageForTank || finalCleanupActive) && westBGuardPhase === "stage"
            && snapshot.tick - (westBGrenadierOrderTicks.get(grenadierKey) ?? -Infinity) >= 90) {
            issueReserveOrder([grenadier], anchor);
            westBGrenadierOrderTicks.set(grenadierKey, snapshot.tick);
          }
        }
        if (finalCleanupActive && westBReserveGuardOrderTick === -Infinity
          && readyGrenadiers.length === grenadiers.length && grenadiers.length > 0) {
          commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
          for (const grenadier of grenadiers) {
            commands.push({ type: COMMAND_SELECT_OBJECT, args: [grenadier.type, grenadier.id, 0, 0, 0, 0, 0] });
          }
          commands.push({ type: COMMAND_UNIT, args: [UNIT_REQUEST_STOP, 0, 0, 0, 0, 0, 0] });
          westBReserveGuardOrderTick = snapshot.tick;
        }
        if (reserveApc && finalCleanupActive) {
          const finalInfantry = hostiles.filter((hostile) => hostile.typeName === "E1")
            .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0];
          if (reserveApc.strength <= 150 || finalInfantry.strength < finalInfantry.maxStrength) {
            westBFinalCleanupRetreat = true;
          }
          if (snapshot.tick - westBReserveApcOrderTick >= 45) {
            issueReserveOrder([reserveApc], westBFinalCleanupRetreat
              ? { cellX: 46, cellY: 43 }
              : finalInfantry);
            westBReserveApcOrderTick = snapshot.tick;
          }
          westBReserveAssaultPhase = westBFinalCleanupRetreat ? "final-retreat" : "final-infantry";
        } else if (stageForTank) {
          const tankKey = objectKey(tank);
          if (westBReserveAssaultTargetKey !== tankKey) {
            westBReserveAssaultTargetKey = tankKey;
            westBReserveAssaultPhase = "tank-stage";
            westBReserveAssaultPhaseTick = snapshot.tick;
            westBReserveApcOrderTick = -Infinity;
            westBReserveApcStopped = false;
            westBGuardPhase = "stage";
            westBGrenadierOrderTicks.clear();
          }
          if (reserveApc) {
            const decoyPoint = { cellX: tank.cellX, cellY: tank.cellY - 4 };
            const atDecoyPoint = reserveApc.cellX === decoyPoint.cellX
              && reserveApc.cellY === decoyPoint.cellY;
            if (atDecoyPoint && !westBReserveApcStopped) {
              commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
              commands.push({ type: COMMAND_SELECT_OBJECT, args: [reserveApc.type, reserveApc.id, 0, 0, 0, 0, 0] });
              commands.push({ type: COMMAND_UNIT, args: [UNIT_REQUEST_STOP, 0, 0, 0, 0, 0, 0] });
              westBReserveApcStopped = true;
            } else if (!atDecoyPoint && snapshot.tick - westBReserveApcOrderTick >= 60) {
              issueReserveOrder([reserveApc], decoyPoint);
              westBReserveApcOrderTick = snapshot.tick;
              westBReserveApcStopped = false;
            }
          }
          const lineReady = grenadiers.length > 0 && (
            readyGrenadiers.length === grenadiers.length
            || readyGrenadiers.length >= Math.min(3, grenadiers.length)
          );
          if (westBGuardPhase === "stage" && lineReady) {
            commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
            westBGuardedGrenadiers.clear();
            for (const grenadier of readyGrenadiers) {
              commands.push({ type: COMMAND_SELECT_OBJECT, args: [grenadier.type, grenadier.id, 0, 0, 0, 0, 0] });
              westBGuardedGrenadiers.add(objectKey(grenadier));
            }
            commands.push({ type: COMMAND_UNIT, args: [4, 0, 0, 0, 0, 0, 0] });
            westBGuardPhase = "guard";
            westBGuardPhaseTick = snapshot.tick;
            westBReserveAssaultPhase = "tank-guard";
          } else if (westBGuardPhase === "guard" && snapshot.tick - westBGuardPhaseTick >= 45) {
            const guardedGrenadiers = grenadiers.filter((grenadier) =>
              westBGuardedGrenadiers.has(objectKey(grenadier)));
            commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
            for (const grenadier of guardedGrenadiers) {
              commands.push({ type: COMMAND_SELECT_OBJECT, args: [grenadier.type, grenadier.id, 0, 0, 0, 0, 0] });
            }
            commands.push({ type: COMMAND_UNIT, args: [UNIT_REQUEST_STOP, 0, 0, 0, 0, 0, 0] });
            westBGuardPhase = "stage";
            westBReserveAssaultPhase = "tank-stage";
            westBReserveAssaultPhaseTick = snapshot.tick;
            for (const grenadier of guardedGrenadiers) {
              westBGrenadierOrderTicks.delete(objectKey(grenadier));
            }
            westBGuardedGrenadiers.clear();
          }
        }
        if (trace && snapshot.tick % 30 === 0) console.error(JSON.stringify({
          integratedTank6: true,
          tick: snapshot.tick,
          phase: westBReserveAssaultPhase,
          apc: reserveApc && { strength: reserveApc.strength, cellX: reserveApc.cellX, cellY: reserveApc.cellY },
          e2: grenadiers.map(({ id, strength, cellX, cellY }) => ({ id, strength, cellX, cellY })),
          hostile: hostiles.map(({ typeName, id, strength, cellX, cellY }) => ({ typeName, id, strength, cellX, cellY })),
        }));
      }
      if (westBIntegratedPhase === "support-clear") {
        const reserveApc = attackers.filter((attacker) => attacker.typeName === "APC")
          .toSorted((left, right) => right.strength - left.strength || left.id - right.id)[0];
        const grenadiers = attackers.filter((attacker) => attacker.typeName === "E2")
          .toSorted((left, right) => left.id - right.id);
        const screen = attackers.filter((attacker) => attacker.typeName === "E1");
        const issueSupportClearOrder = (group, order) => {
          if (group.length === 0 || !order) return;
          commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
          for (const attacker of group) {
            commands.push({ type: COMMAND_SELECT_OBJECT, args: [attacker.type, attacker.id, 0, 0, 0, 0, 0] });
          }
          commands.push({ type: COMMAND_INPUT, args: [INPUT_COMMAND_AT_POSITION,
            order.cellX * CELL_PIXELS + 12, order.cellY * CELL_PIXELS + 12, 0, 0, 0, 0] });
        };
        const lateTankOnly = hostiles.length > 0
          && hostiles.every((hostile) => hostile.typeName === "LTNK")
          && reserveApc === undefined;
        if (lateTankOnly && !westBLateTankActive) {
          westBLateTankActive = true;
          westBLateTankPhase = "stage";
          westBLateTankAttackTick = -Infinity;
        }
        if (westBLateTankActive) {
          const tank = hostiles.find((hostile) => hostile.typeName === "LTNK");
          const stagePoints = [
            { cellX: 44, cellY: 48 },
            { cellX: 43, cellY: 53 },
            { cellX: 44, cellY: 57 },
            { cellX: 54, cellY: 57 },
          ];
          const reducedStagePoints = new Map();
          if (grenadiers.length === 3) {
            const byStrength = grenadiers.toSorted((left, right) =>
              right.strength - left.strength || left.id - right.id);
            reducedStagePoints.set(objectKey(byStrength[0]), stagePoints[3]);
            reducedStagePoints.set(objectKey(byStrength[1]), stagePoints[0]);
            reducedStagePoints.set(objectKey(byStrength[2]), stagePoints[1]);
          }
          const readyGrenadiers = [];
          if (tank && westBLateTankPhase === "stage") {
            for (const [index, grenadier] of grenadiers.entries()) {
              const point = reducedStagePoints.get(objectKey(grenadier))
                ?? stagePoints[index % stagePoints.length];
              const ready = Math.abs(grenadier.cellX - point.cellX) <= 1
                && Math.abs(grenadier.cellY - point.cellY) <= 1;
              if (ready) {
                readyGrenadiers.push(grenadier);
              } else if (snapshot.tick - (westBLateTankOrderTicks.get(objectKey(grenadier)) ?? -Infinity) >= 60) {
                issueSupportClearOrder([grenadier], point);
                westBLateTankOrderTicks.set(objectKey(grenadier), snapshot.tick);
              }
            }
            if (readyGrenadiers.length === grenadiers.length && grenadiers.length > 0) {
              westBLateTankPhase = "assault";
              westBLateTankAttackTick = -Infinity;
            }
          }
          if (tank && westBLateTankPhase === "assault"
            && snapshot.tick - westBLateTankAttackTick >= 60) {
            issueSupportClearOrder(screen, tank);
            if (grenadiers.length === 1) {
              const loneGrenadier = grenadiers[0];
              const grenadierKey = objectKey(loneGrenadier);
              const lastScatterTick = westBScatterTicks.get(grenadierKey);
              const distance = Math.max(
                Math.abs(tank.cellX - loneGrenadier.cellX),
                Math.abs(tank.cellY - loneGrenadier.cellY),
              );
              if (distance <= 2 && snapshot.tick - (lastScatterTick ?? -Infinity) >= 90) {
                commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
                commands.push({ type: COMMAND_SELECT_OBJECT, args: [loneGrenadier.type, loneGrenadier.id, 0, 0, 0, 0, 0] });
                commands.push({ type: COMMAND_UNIT, args: [UNIT_SCATTER, 0, 0, 0, 0, 0, 0] });
                westBScatterTicks.set(grenadierKey, snapshot.tick);
              } else if (lastScatterTick === undefined || snapshot.tick - lastScatterTick >= 60) {
                issueSupportClearOrder(grenadiers, tank);
              }
            } else if (grenadiers.length > 1) {
              issueSupportClearOrder(grenadiers, tank);
            }
            westBLateTankAttackTick = snapshot.tick;
          }
          if (trace && snapshot.tick % 30 === 0) console.error(JSON.stringify({
            integratedLateTank: true,
            tick: snapshot.tick,
            phase: westBLateTankPhase,
            e2: grenadiers.map(({ id, strength, cellX, cellY }) => ({ id, strength, cellX, cellY })),
            tank: tank && { id: tank.id, strength: tank.strength, cellX: tank.cellX, cellY: tank.cellY },
          }));
        } else {
          const buggy = hostiles.filter((hostile) => hostile.typeName === "BGGY")
            .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0];
          const supportTank = hostiles.find((hostile) => hostile.typeName === "LTNK");
          const supportInfantry = hostiles.filter((hostile) => hostile.typeName === "E1")
            .toSorted((left, right) => left.strength - right.strength || left.id - right.id)[0];
          if (screen.length > 0 && snapshot.tick - westBSupportClearScreenTick >= 90) {
            issueSupportClearOrder(screen, buggy
              ? { cellX: 43, cellY: 53 }
              : supportTank ?? { cellX: 43, cellY: 53 });
            westBSupportClearScreenTick = snapshot.tick;
          }
          const retreatPoints = [
            { cellX: 42, cellY: 44 },
            { cellX: 45, cellY: 44 },
            { cellX: 48, cellY: 44 },
            { cellX: 50, cellY: 43 },
          ];
          const earlyReducedStagePoints = new Map();
          if (grenadiers.length === 3) {
            const byStrength = grenadiers.toSorted((left, right) =>
              right.strength - left.strength || left.id - right.id);
            earlyReducedStagePoints.set(objectKey(byStrength[0]), { cellX: 46, cellY: 51 });
            earlyReducedStagePoints.set(objectKey(byStrength[1]), { cellX: 44, cellY: 48 });
            earlyReducedStagePoints.set(objectKey(byStrength[2]), { cellX: 43, cellY: 53 });
          }
          for (const [index, grenadier] of grenadiers.entries()) {
            const retreatPoint = earlyReducedStagePoints.get(objectKey(grenadier))
              ?? retreatPoints[index % retreatPoints.length];
            const ready = Math.abs(grenadier.cellX - retreatPoint.cellX) <= 1
              && Math.abs(grenadier.cellY - retreatPoint.cellY) <= 1;
            if (snapshot.tick - (westBSupportClearE2Ticks.get(objectKey(grenadier)) ?? -Infinity)
              >= (ready ? 90 : 60)) {
              if (buggy) {
                issueSupportClearOrder([grenadier], retreatPoint);
              } else {
                commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
                commands.push({ type: COMMAND_SELECT_OBJECT, args: [grenadier.type, grenadier.id, 0, 0, 0, 0, 0] });
                commands.push({ type: COMMAND_UNIT, args: [UNIT_REQUEST_STOP, 0, 0, 0, 0, 0, 0] });
              }
              westBSupportClearE2Ticks.set(objectKey(grenadier), snapshot.tick);
            }
          }
          if (reserveApc && westBSupportClearPhase === "flank") {
            const flankRoute = [
              { cellX: 43, cellY: 48 },
              { cellX: 43, cellY: 52 },
              { cellX: 43, cellY: 57 },
              { cellX: 58, cellY: 57 },
            ];
            const waypoint = flankRoute[westBSupportClearRetreatStage] ?? flankRoute.at(-1);
            if (Math.abs(reserveApc.cellX - waypoint.cellX) <= 1
              && Math.abs(reserveApc.cellY - waypoint.cellY) <= 1) {
              if (westBSupportClearRetreatStage < flankRoute.length - 1) {
                westBSupportClearRetreatStage += 1;
                westBSupportClearOrderTick = -Infinity;
              } else {
                westBSupportClearPhase = "attack";
                westBSupportClearTargetKey = undefined;
                westBSupportClearRetreatStage = 0;
                westBSupportClearOrderTick = -Infinity;
              }
            }
            const nextWaypoint = flankRoute[westBSupportClearRetreatStage] ?? flankRoute.at(-1);
            if (westBSupportClearPhase === "flank"
              && snapshot.tick - westBSupportClearOrderTick >= 45) {
              issueSupportClearOrder([reserveApc], nextWaypoint);
              westBSupportClearOrderTick = snapshot.tick;
            }
          }
          if (reserveApc && westBSupportClearPhase === "attack" && buggy) {
            const buggyKey = objectKey(buggy);
            if (westBSupportClearTargetKey !== buggyKey
              || snapshot.tick - westBSupportClearOrderTick >= 45) {
              issueSupportClearOrder([reserveApc], buggy);
              westBSupportClearTargetKey = buggyKey;
              westBSupportClearOrderTick = snapshot.tick;
            }
          }
          if (reserveApc && !buggy && supportTank
            && snapshot.tick - westBSupportClearOrderTick >= 45) {
            issueSupportClearOrder([reserveApc], supportInfantry ?? { cellX: 43, cellY: 55 });
            westBSupportClearOrderTick = snapshot.tick;
          }
          if (trace && snapshot.tick % 30 === 0) console.error(JSON.stringify({
            integratedSupportClear: true,
            tick: snapshot.tick,
            phase: westBSupportClearPhase,
            apc: reserveApc && { strength: reserveApc.strength, cellX: reserveApc.cellX, cellY: reserveApc.cellY },
            buggy: buggy && { strength: buggy.strength, cellX: buggy.cellX, cellY: buggy.cellY },
          }));
        }
      }
      if (trace && snapshot.tick % 300 === 0) console.error(JSON.stringify({ wb: true, tick: snapshot.tick, phase: westBPhase, transit: westBRouteStage, combat: westBCombatStage, guardPhase: westBGuardPhase, lineEstablished: westBLineEstablished, lurePhase: westBLurePhase, lureTarget: westBLureTankKey, lureDecoy: westBLureDecoyKey, friendly: friendly.map(({typeName,id,strength,cellX,cellY})=>({typeName,id,strength,cellX,cellY})), hostile: hostiles.length, visible: visibleHostiles.map(({typeName,id,strength,cellX,cellY})=>({typeName,id,strength,cellX,cellY})), peakFriendly }));
      if (trace && westBPhase === "transit" && westBRouteStage >= 6) console.error(JSON.stringify({ crossing: true, tick: snapshot.tick, stage: westBRouteStage, hostile: hostiles.length, travelers: attackers.filter((attacker) => westBInitialVehicleKeys.has(objectKey(attacker))).map(({typeName,id,cellX,cellY})=>({typeName,id,cellX,cellY})) }));
    }
    if (activeMissionFourScout) {
      const scoutTarget = mission.scoutRoute[missionFourScoutStage];
      if (Math.abs(activeMissionFourScout.cellX - scoutTarget.cellX) <= 1
        && Math.abs(activeMissionFourScout.cellY - scoutTarget.cellY) <= 1) {
        missionFourScoutArrivalTicks.push(snapshot.tick);
        missionFourScoutStage += 1;
      }
      const nextScoutTarget = mission.scoutRoute[missionFourScoutStage];
      if (nextScoutTarget) {
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        commands.push({
          type: COMMAND_SELECT_OBJECT,
          args: [activeMissionFourScout.type, activeMissionFourScout.id, 0, 0, 0, 0, 0],
        });
        commands.push({
          type: COMMAND_INPUT,
          args: [
            INPUT_COMMAND_AT_POSITION,
            nextScoutTarget.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            nextScoutTarget.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0, 0, 0, 0,
          ],
        });
        selectionCommands += 1;
        contextualOrders += 1;
      }
    }
    let missionThreeDeploying = false;
    if (mission.number === 3 && !friendly.some((object) => object.type === 4)) {
      const mcv = friendly.find((object) => object.typeName === "MCV");
      if (mcv) {
        missionThreeDeploying = true;
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        commands.push({ type: COMMAND_SELECT_OBJECT, args: [mcv.type, mcv.id, 0, 0, 0, 0, 0] });
        commands.push({
          type: COMMAND_INPUT,
          args: [INPUT_COMMAND_AT_POSITION, mcv.cellX * CELL_PIXELS + CELL_PIXELS / 2, mcv.cellY * CELL_PIXELS + CELL_PIXELS / 2, 0, 0, 0, 0],
        });
        deploymentOrders += 1;
        selectionCommands += 1;
        contextualOrders += 1;
      }
    }
    if (mission.number === 5 && mission.variant === "west-b") {
      const fireSaleStructures = friendly.filter((object) => (
        object.type === 4
        && object.typeName === "WEAP"
        && missionFiveCompletedVehicleKeys.size >= 1
        && (object.objectFlags & (1 << 5))
        && !missionFiveSoldStructureIds.has(object.id)
      ));
      if (fireSaleStructures.length > 0) {
        for (const building of fireSaleStructures) {
          commands.push({ type: COMMAND_STRUCTURE, args: [STRUCTURE_SELL, building.id, 0, 0, 0, 0, 0] });
          missionFiveSoldStructureIds.add(building.id);
        }
      }

      if (missionFiveShuttleFactCaptureTick !== undefined) {
        const shuttleContextOrder = (group, destination, flags = 0) => {
          if (group.length === 0 || !destination) return;
          commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
          for (const object of group) {
            commands.push({
              type: COMMAND_SELECT_OBJECT,
              args: [object.type, object.id, 0, 0, 0, 0, 0],
            });
          }
          if (flags) {
            commands.push({
              type: COMMAND_INPUT,
              flags,
              args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
            });
          }
          commands.push({
            type: COMMAND_INPUT,
            flags,
            args: [
              INPUT_COMMAND_AT_POSITION,
              destination.cellX * CELL_PIXELS + CELL_PIXELS / 2,
              destination.cellY * CELL_PIXELS + CELL_PIXELS / 2,
              0, 0, 0, 0,
            ],
          });
          if (flags) {
            commands.push({
              type: COMMAND_INPUT,
              args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
            });
          }
          selectionCommands += group.length;
          contextualOrders += 1;
        };
        const shuttleStop = (group) => {
          if (group.length === 0) return;
          commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
          for (const object of group) {
            commands.push({
              type: COMMAND_SELECT_OBJECT,
              args: [object.type, object.id, 0, 0, 0, 0, 0],
            });
          }
          commands.push({ type: COMMAND_UNIT, args: [UNIT_REQUEST_STOP, 0, 0, 0, 0, 0, 0] });
          selectionCommands += group.length;
        };

        const shuttleApc = friendly.find((object) => (
          objectKey(object) === missionFiveWestBApcKey
        ));
        const shuttlePips = shuttleApc?.pips.slice(0, shuttleApc.pipCount)
          .filter((pip) => pip !== 0) ?? [];
        const visibleShuttleEngineers = friendly.filter((object) => (
          object.type === 1 && object.typeName === "E6"
          && missionFiveShuttleEngineers.has(objectKey(object))
        )).toSorted((left, right) => (
          (missionFiveShuttleEngineers.get(objectKey(left))?.tick ?? Infinity)
            - (missionFiveShuttleEngineers.get(objectKey(right))?.tick ?? Infinity)
          || left.id - right.id
        ));

        const capturedFactoryForSale = friendly.find((object) => (
          object.type === 4 && object.typeName === "FACT"
          && object.cellX === 52 && object.cellY === 17
        ));
        if (missionFiveShuttleFactSaleTick === undefined
          && capturedFactoryForSale && (capturedFactoryForSale.objectFlags & (1 << 5))) {
          missionFiveShuttleFactSaleTick = snapshot.tick;
          missionFiveShuttleFactSaleFunds = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
          commands.push({
            type: COMMAND_STRUCTURE,
            args: [STRUCTURE_SELL, capturedFactoryForSale.id, 0, 0, 0, 0, 0],
          });
          missionFiveSoldStructureIds.add(capturedFactoryForSale.id);
          if (trace) console.error(JSON.stringify({ westBShuttleFactSaleOrder: {
            tick: snapshot.tick,
            funds: missionFiveShuttleFactSaleFunds,
            strength: capturedFactoryForSale.strength,
          } }));
        }

        const engineerEntry = snapshot.sidebar.entries.find((entry) => entry.assetName === "E6");
        if (missionFiveShuttleFactGoneTick !== undefined
          && missionFiveShuttleEngineers.size < 4 && engineerEntry) {
          if (engineerEntry.onHold
            && snapshot.tick - missionFiveShuttleEngineerResumeTick >= 120) {
            commands.push({
              type: COMMAND_SIDEBAR,
              args: [SIDEBAR_START_CONSTRUCTION,
                engineerEntry.buildableType, engineerEntry.buildableId, 0, 0, 0, 0],
            });
            missionFiveShuttleEngineerResumeTick = snapshot.tick;
            if (trace) console.error(JSON.stringify({ westBShuttleEngineerResume: {
              tick: snapshot.tick,
              starts: missionFiveShuttleEngineerStarts,
              progress: engineerEntry.progress,
              funds: snapshot.sidebar.credits + snapshot.sidebar.tiberium,
            } }));
          } else if (!engineerEntry.constructing && !engineerEntry.completed
            && !engineerEntry.onHold && !engineerEntry.busy
            && missionFiveShuttleEngineerStarts < 4
            && snapshot.sidebar.credits + snapshot.sidebar.tiberium >= engineerEntry.cost
            && snapshot.tick - missionFiveShuttleEngineerStartTick >= 120) {
            commands.push({
              type: COMMAND_SIDEBAR,
              args: [SIDEBAR_START_CONSTRUCTION,
                engineerEntry.buildableType, engineerEntry.buildableId, 0, 0, 0, 0],
            });
            missionFiveShuttleEngineerStarts += 1;
            missionFiveShuttleEngineerStartTick = snapshot.tick;
            productionStarts += 1;
            infantryProductionStarts += 1;
            if (trace) console.error(JSON.stringify({ westBShuttleEngineerStart: {
              tick: snapshot.tick,
              index: missionFiveShuttleEngineerStarts,
              cost: engineerEntry.cost,
              funds: snapshot.sidebar.credits + snapshot.sidebar.tiberium,
            } }));
          }
        }

        const distanceTo = (object, point) => Math.max(
          Math.abs(object.cellX - point.cellX),
          Math.abs(object.cellY - point.cellY),
        );
        if (missionFiveShuttlePhase === "return" && shuttleApc) {
          const returnRoute = [
            { cellX: 56, cellY: 29 },
            { cellX: 53, cellY: 42 },
            { cellX: 53, cellY: 53 },
            { cellX: 42, cellY: 54 },
            { cellX: 31, cellY: 58 },
          ];
          const waypoint = returnRoute[missionFiveShuttleRouteStage];
          if (waypoint && distanceTo(shuttleApc, waypoint) <= 2) {
            missionFiveShuttleRouteStage += 1;
            missionFiveShuttleOrderTick = -Infinity;
          }
          const nextWaypoint = returnRoute[missionFiveShuttleRouteStage];
          if (!nextWaypoint) {
            missionFiveShuttlePhase = "await-load";
            missionFiveShuttleOrderTick = -Infinity;
            shuttleStop([shuttleApc]);
            if (trace) console.error(JSON.stringify({ westBShuttlePhase: {
              tick: snapshot.tick, phase: missionFiveShuttlePhase,
              apc: { strength: shuttleApc.strength, cellX: shuttleApc.cellX, cellY: shuttleApc.cellY },
            } }));
          } else if (snapshot.tick - missionFiveShuttleOrderTick >= 60) {
            shuttleContextOrder([shuttleApc], nextWaypoint, MODIFIER_ALT);
            missionFiveShuttleOrderTick = snapshot.tick;
          }
        } else if (missionFiveShuttlePhase === "await-load" && shuttleApc) {
          if (shuttlePips.filter((pip) => pip === 5).length >= 5) {
            missionFiveShuttlePhase = "outbound";
            missionFiveShuttleRouteStage = 0;
            missionFiveShuttleOrderTick = -Infinity;
            if (trace) console.error(JSON.stringify({ westBShuttlePhase: {
              tick: snapshot.tick, phase: missionFiveShuttlePhase,
              pips: shuttlePips,
              apc: { strength: shuttleApc.strength, cellX: shuttleApc.cellX, cellY: shuttleApc.cellY },
            } }));
          } else if (missionFiveShuttleEngineers.size >= 5
            && visibleShuttleEngineers.length > 0
            && snapshot.tick - missionFiveShuttleOrderTick >= 60) {
            shuttleContextOrder(visibleShuttleEngineers, shuttleApc);
            missionFiveShuttleOrderTick = snapshot.tick;
          } else if (snapshot.tick - missionFiveShuttleOrderTick >= 300) {
            shuttleStop([shuttleApc]);
            missionFiveShuttleOrderTick = snapshot.tick;
          }
        } else if (missionFiveShuttlePhase === "outbound" && shuttleApc) {
          const outboundRoute = [
            { cellX: 42, cellY: 54 },
            { cellX: 53, cellY: 53 },
            { cellX: 53, cellY: 42 },
            { cellX: 56, cellY: 29 },
          ];
          const waypoint = outboundRoute[missionFiveShuttleRouteStage];
          if (waypoint && distanceTo(shuttleApc, waypoint) <= 2) {
            missionFiveShuttleRouteStage += 1;
            missionFiveShuttleOrderTick = -Infinity;
          }
          const nextWaypoint = outboundRoute[missionFiveShuttleRouteStage];
          if (!nextWaypoint) {
            missionFiveShuttlePhase = "unloading";
            missionFiveShuttleUnloadTick = -Infinity;
            shuttleStop([shuttleApc]);
            if (trace) console.error(JSON.stringify({ westBShuttlePhase: {
              tick: snapshot.tick, phase: missionFiveShuttlePhase,
              pips: shuttlePips,
              apc: { strength: shuttleApc.strength, cellX: shuttleApc.cellX, cellY: shuttleApc.cellY },
            } }));
          } else if (snapshot.tick - missionFiveShuttleOrderTick >= 60) {
            shuttleContextOrder([shuttleApc], nextWaypoint, MODIFIER_ALT);
            missionFiveShuttleOrderTick = snapshot.tick;
          }
        } else if (missionFiveShuttlePhase === "unloading" && shuttleApc) {
          if (shuttlePips.length === 0 && visibleShuttleEngineers.length >= 5) {
            missionFiveShuttlePhase = "raid";
            if (trace) console.error(JSON.stringify({ westBShuttlePhase: {
              tick: snapshot.tick, phase: missionFiveShuttlePhase,
              engineers: visibleShuttleEngineers.map((engineer) => ({
                key: objectKey(engineer), strength: engineer.strength,
                cellX: engineer.cellX, cellY: engineer.cellY,
              })),
            } }));
          } else if (snapshot.tick - missionFiveShuttleUnloadTick >= 90) {
            shuttleContextOrder([shuttleApc], shuttleApc);
            missionFiveShuttleUnloadTick = snapshot.tick;
          }
        }

        if (missionFiveShuttlePhase === "raid") {
          const raidSites = [
            { key: "PROC:47:22", typeName: "PROC", cellX: 47, cellY: 22,
              approach: { cellX: 53, cellY: 27 } },
            { key: "AFLD:42:18", typeName: "AFLD", cellX: 42, cellY: 18,
              approach: { cellX: 46, cellY: 24 } },
            { key: "NUKE:47:18", typeName: "NUKE", cellX: 47, cellY: 18,
              approach: { cellX: 50, cellY: 24 } },
            { key: "NUKE:49:17", typeName: "NUKE", cellX: 49, cellY: 17,
              approach: { cellX: 52, cellY: 23 } },
          ];
          for (let index = 0; index < visibleShuttleEngineers.length; index += 1) {
            const engineer = visibleShuttleEngineers[index];
            const engineerKey = objectKey(engineer);
            if (!missionFiveShuttleAssignments.has(engineerKey)) {
              const site = raidSites[index];
              if (!site) continue;
              missionFiveShuttleAssignments.set(engineerKey, site.key);
              missionFiveShuttleRaidStages.set(engineerKey, 0);
              if (trace) console.error(JSON.stringify({ westBShuttleAssignment: {
                tick: snapshot.tick,
                engineer: engineerKey,
                target: site.key,
                strength: engineer.strength,
                cellX: engineer.cellX,
                cellY: engineer.cellY,
              } }));
            }
          }
          for (const engineer of visibleShuttleEngineers) {
            const engineerKey = objectKey(engineer);
            const site = raidSites.find((candidate) => (
              candidate.key === missionFiveShuttleAssignments.get(engineerKey)
            ));
            const target = site && hostiles.find((hostile) => (
              hostile.type === 4 && hostile.typeName === site.typeName
              && hostile.cellX === site.cellX && hostile.cellY === site.cellY
            ));
            if (!site || !target) continue;
            if (site.key === "AFLD:42:18"
              && missionFiveShuttleCaptureKeys.size < 3) continue;
            let stage = missionFiveShuttleRaidStages.get(engineerKey) ?? 0;
            if (stage === 0 && distanceTo(engineer, site.approach) <= 2) {
              stage = 1;
              missionFiveShuttleRaidStages.set(engineerKey, stage);
            }
            const lastOrderTick = missionFiveShuttleRaidOrderTicks.get(engineerKey) ?? -Infinity;
            if (snapshot.tick - lastOrderTick >= 60) {
              shuttleContextOrder([engineer], stage === 0 ? site.approach : target,
                stage === 0 ? MODIFIER_ALT : 0);
              missionFiveShuttleRaidOrderTicks.set(engineerKey, snapshot.tick);
            }
            if (trace && snapshot.tick % 300 === 0) {
              console.error(JSON.stringify({ westBShuttleRaid: {
                tick: snapshot.tick,
                engineer: engineerKey,
                target: site.key,
                stage,
                strength: engineer.strength,
                cellX: engineer.cellX,
                cellY: engineer.cellY,
              } }));
            }
          }
        }

        if (trace && snapshot.tick % 300 === 0) {
          console.error(JSON.stringify({ westBShuttle: {
            tick: snapshot.tick,
            phase: missionFiveShuttlePhase,
            routeStage: missionFiveShuttleRouteStage,
            starts: missionFiveShuttleEngineerStarts,
            built: missionFiveShuttleEngineers.size,
            captures: missionFiveShuttleCaptures,
            apc: shuttleApc && {
              strength: shuttleApc.strength,
              cellX: shuttleApc.cellX,
              cellY: shuttleApc.cellY,
              pips: shuttlePips,
            },
            visibleEngineers: visibleShuttleEngineers.map((engineer) => ({
              key: objectKey(engineer), strength: engineer.strength,
              cellX: engineer.cellX, cellY: engineer.cellY,
            })),
          } }));
        }
      }
    }
    if (mission.number >= 2) {
      for (const building of friendly.filter((object) => (
        object.type === 4
        && !missionFiveSoldStructureIds.has(object.id)
        && !(missionFiveWestBStrategy && missionFiveShuttleFactCaptureTick !== undefined)
        && object.strength < object.maxStrength
        && !(object.objectFlags & (1 << 1))
        && (mission.number !== 3 || snapshot.sidebar.credits + snapshot.sidebar.tiberium >= 1_000)
        && (mission.number !== 5 || snapshot.sidebar.credits + snapshot.sidebar.tiberium >= 300)
        && (mission.number !== 3 || snapshot.tick - (missionThreeRepairTicks.get(object.id) ?? -900) >= 900)
        && (mission.number !== 5 || snapshot.tick - (missionFiveRepairTicks.get(object.id) ?? -600) >= 600)
      ))) {
        if (mission.number !== 3 && mission.number !== 5 && repairedBuildingIds.has(building.id)) continue;
        commands.push({ type: COMMAND_STRUCTURE, args: [STRUCTURE_REPAIR_START, 0, 0, 0, 0, 0, 0] });
        commands.push({ type: COMMAND_STRUCTURE, args: [STRUCTURE_REPAIR, building.id, 0, 0, 0, 0, 0] });
        if (mission.number === 3) missionThreeRepairTicks.set(building.id, snapshot.tick);
        else if (mission.number === 5) missionFiveRepairTicks.set(building.id, snapshot.tick);
        else repairedBuildingIds.add(building.id);
        repairOrders += 1;
      }
    }
    if (mission.number === 2) {
      const minigunner = snapshot.sidebar.entries.find((entry) => entry.assetName === "E1");
      if (minigunner && !minigunner.constructing && !minigunner.completed && !minigunner.onHold && !minigunner.busy
        && snapshot.sidebar.credits + snapshot.sidebar.tiberium >= minigunner.cost) {
        commands.push({
          type: COMMAND_SIDEBAR,
          args: [SIDEBAR_START_CONSTRUCTION, minigunner.buildableType, minigunner.buildableId, 0, 0, 0, 0],
        });
        productionStarts += 1;
      }
    }
    if (mission.number === 5
      && missionFiveReliefStage >= mission.reliefRoute.length
      && missionFiveBaseRepairedTick !== undefined
      && (mission.crate === undefined || missionFiveCrateCollectedTick !== undefined)) {
      let availableFunds = snapshot.sidebar.credits + snapshot.sidebar.tiberium;
      const preferredInfantry = mission.variant === "west-b"
        ? missionFiveShuttleFactGoneTick !== undefined
          ? "E2"
          : infantryProductionStarts % 4 === 3 ? "E2" : "E1"
        : infantryProductionStarts % 3 === 2 ? "E1" : "E2";
      const infantry = snapshot.sidebar.entries.find((entry) => entry.assetName === preferredInfantry)
        ?? snapshot.sidebar.entries.find((entry) => entry.assetName === (preferredInfantry === "E1" ? "E2" : "E1"));
      const engineer = mission.variant === "west-b"
        ? snapshot.sidebar.entries.find((entry) => entry.assetName === "E6")
        : undefined;
      let queuedEngineer = false;
      if (engineer && missionFiveWestBEngineerProductionStarted < 5
        && !engineer.constructing && !engineer.completed && !engineer.onHold && !engineer.busy
        && availableFunds >= engineer.cost + 200) {
        commands.push({
          type: COMMAND_SIDEBAR,
          args: [SIDEBAR_START_CONSTRUCTION, engineer.buildableType, engineer.buildableId, 0, 0, 0, 0],
        });
        missionFiveWestBEngineerProductionStarted += 1;
        queuedEngineer = true;
        productionStarts += 1;
        infantryProductionStarts += 1;
        availableFunds -= engineer.cost;
        if (trace) console.error(JSON.stringify({ westBEngineerProduction: true, tick: snapshot.tick, cost: engineer.cost }));
      }
      const liveApcAvailable = friendly.some((object) => object.typeName === "APC" && object.type === 2);
      const preferredVehicles = mission.variant === "west-b" && !liveApcAvailable ? ["APC", "JEEP"] : ["JEEP", "APC"];
      const vehicle = preferredVehicles
        .map((assetName) => snapshot.sidebar.entries.find((entry) => entry.assetName === assetName))
        .find(Boolean);
      const queueVehicle = (reserve) => {
        if (!vehicle || vehicle.constructing || vehicle.completed || vehicle.onHold || vehicle.busy
          || availableFunds < vehicle.cost + reserve) return;
        commands.push({
          type: COMMAND_SIDEBAR,
          args: [SIDEBAR_START_CONSTRUCTION, vehicle.buildableType, vehicle.buildableId, 0, 0, 0, 0],
        });
        productionStarts += 1;
        vehicleProductionStarts += 1;
        availableFunds -= vehicle.cost;
      };
      if (mission.variant !== "west-a" && (vehicleProductionStarts < 1
        || (mission.variant === "west-b"
          && missionFiveWestBEngineerKey !== undefined
          && !liveApcAvailable
          && vehicleProductionStarts < 3))) queueVehicle(200);
      const infantryReserve = missionFiveAssaultStartedTick === undefined ? 200 : 0;
      if (!queuedEngineer && infantry && !infantry.constructing && !infantry.completed && !infantry.onHold && !infantry.busy
        && availableFunds >= infantry.cost + infantryReserve) {
        commands.push({
          type: COMMAND_SIDEBAR,
          args: [SIDEBAR_START_CONSTRUCTION, infantry.buildableType, infantry.buildableId, 0, 0, 0, 0],
        });
        productionStarts += 1;
        infantryProductionStarts += 1;
        availableFunds -= infantry.cost;
        if (mission.variant === "west-b" && missionFiveShuttleFactGoneTick !== undefined) {
          if (trace) console.error(JSON.stringify({ westBPostRefundInfantry: {
            tick: snapshot.tick,
            assetName: infantry.assetName,
            cost: infantry.cost,
            fundsAfterQueue: availableFunds,
          } }));
        }
      }
      if (mission.variant === "west-a") queueVehicle(600);
    }
    if (mission.number === 3 && !missionThreeDeploying) {
      const builtAssets = new Set(friendly.filter((object) => object.type === 4).map((object) => object.typeName));
      const completedStructure = snapshot.sidebar.entries.find((entry) => entry.objectType === 15 && entry.completed);
      const missingStructure = ["NUKE", "PYLE", "PROC"].find((assetName) => (
        !builtAssets.has(assetName) && !startedMissionThreeStructures.has(assetName)
      ));
      const structure = completedStructure ?? (missingStructure
        ? snapshot.sidebar.entries.find((entry) => entry.assetName === missingStructure && entry.objectType === 15)
        : undefined);
      if (structure?.completed) {
        if (snapshot.placement) {
          const cell = findLegalPlacement(snapshot, structure);
          assert.ok(cell, `no legal ${structure.assetName} placement was exported`);
          commands.push({
            type: COMMAND_SIDEBAR,
            args: [SIDEBAR_PLACE, structure.buildableType, structure.buildableId, cell.x, cell.y, 0, 0],
          });
          placements += 1;
        } else {
          commands.push({
            type: COMMAND_SIDEBAR,
            args: [SIDEBAR_START_PLACEMENT, structure.buildableType, structure.buildableId, 0, 0, 0, 0],
          });
          placementStarts += 1;
        }
      } else if (structure && !structure.constructing && !structure.onHold && !structure.busy
        && snapshot.sidebar.credits + snapshot.sidebar.tiberium >= structure.cost) {
        commands.push({
          type: COMMAND_SIDEBAR,
          args: [SIDEBAR_START_CONSTRUCTION, structure.buildableType, structure.buildableId, 0, 0, 0, 0],
        });
        startedMissionThreeStructures.add(structure.assetName);
        productionStarts += 1;
      }

      if (builtAssets.has("PYLE")) {
        const preferredInfantry = infantryProductionStarts % 3 === 0 ? "E1" : "E2";
        const infantry = snapshot.sidebar.entries.find((entry) => entry.assetName === preferredInfantry)
          ?? snapshot.sidebar.entries.find((entry) => entry.assetName === (preferredInfantry === "E1" ? "E2" : "E1"));
        if (infantry && !infantry.constructing && !infantry.completed && !infantry.onHold && !infantry.busy
          && snapshot.sidebar.credits + snapshot.sidebar.tiberium >= infantry.cost + 800) {
          commands.push({
            type: COMMAND_SIDEBAR,
            args: [SIDEBAR_START_CONSTRUCTION, infantry.buildableType, infantry.buildableId, 0, 0, 0, 0],
          });
          productionStarts += 1;
          infantryProductionStarts += 1;
        }
      }
    }
    const missionThreeBaseReady = ["NUKE", "PYLE", "PROC"].every((assetName) => (
      friendly.some((object) => object.type === 4 && object.typeName === assetName)
    ));
    if (mission.number === 3 && missionThreeScoutId === undefined && missionThreeBaseReady) {
      const candidate = attackers.find((attacker) => attacker.typeName === "JEEP");
      if (candidate) missionThreeScoutId = candidate.id;
    }
    const activeScout = mission.number === 3
      ? attackers.find((attacker) => attacker.id === missionThreeScoutId)
      : undefined;
    if (mission.number === 3 && missionThreeScoutId !== undefined && !activeScout && snapshot.tick >= 6_000) {
      missionThreeScoutStage = missionThreeScoutRoute.length;
    }
    if (activeScout && missionThreeScoutStage < missionThreeScoutRoute.length) {
      const scoutTarget = missionThreeScoutRoute[missionThreeScoutStage];
      if (Math.abs(activeScout.cellX - scoutTarget.cellX) <= 1
        && Math.abs(activeScout.cellY - scoutTarget.cellY) <= 1) {
        missionThreeScoutArrivalTicks.push(snapshot.tick);
        missionThreeScoutStage += 1;
      }
      const nextScoutTarget = missionThreeScoutRoute[missionThreeScoutStage];
      if (nextScoutTarget) {
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        commands.push({ type: COMMAND_SELECT_OBJECT, args: [activeScout.type, activeScout.id, 0, 0, 0, 0, 0] });
        commands.push({
          type: COMMAND_INPUT,
          args: [
            INPUT_COMMAND_AT_POSITION,
            nextScoutTarget.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            nextScoutTarget.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0, 0, 0, 0,
          ],
        });
        selectionCommands += 1;
        contextualOrders += 1;
      }
    }
    const assaultReady = mission.number === 1
      || (mission.number === 2 && (snapshot.tick >= missionTwoAssaultTick || !friendly.some((object) => object.type === 4)))
      || (mission.number === 3 && missionThreeBaseReady && missionThreeScoutStage >= missionThreeScoutRoute.length
        && (attackers.length >= 70 || snapshot.tick >= missionThreeAssaultTick))
      || (mission.number === 5 && missionFiveReliefStage >= mission.reliefRoute.length
        && (mission.crate === undefined || missionFiveCrateCollectedTick !== undefined)
        && snapshot.tick >= (mission.earliestAssaultTick ?? 0)
        && (attackers.length >= missionFiveAssaultForce
          || (mission.variant === "west-b"
            && missionFiveWestBApcKey !== undefined
            && allAttackers.length >= missionFiveAssaultForce)
          || snapshot.tick >= missionFiveAssaultTick
          || (mission.variant === "west-b" && missionFiveAssaultWaveCount > 0
            && attackers.length >= (mission.relaunchForce ?? 26))));
    if (mission.number === 3 && assaultReady && !missionThreeBaseAssaultStarted) {
      missionThreeBaseAssaultStarted = true;
      missionThreeAssaultStartedTick = snapshot.tick;
    }
    if (mission.number === 5) {
      for (const key of missionFiveStrikeGroupKeys) {
        if (!attackers.some((attacker) => objectKey(attacker) === key)) missionFiveStrikeGroupKeys.delete(key);
      }
      for (const key of missionFiveHomeGuardKeys) {
        if (!attackers.some((attacker) => objectKey(attacker) === key)) missionFiveHomeGuardKeys.delete(key);
      }
      const westBFactoryStillLive = mission.variant !== "west-b" || hostiles.some((hostile) => (
        hostile.typeName === "FACT" && hostile.cellX === 52 && hostile.cellY === 17
      ));
      if (mission.variant === "west-b" && !westBFactoryStillLive) {
        for (const key of missionFiveHomeGuardKeys) missionFiveStrikeGroupKeys.add(key);
        missionFiveHomeGuardKeys.clear();
        if (missionFiveAssaultRouteStage === (mission.factoryRouteStage ?? mission.assaultTargetStage)
          && !(missionFiveShuttleFactCaptureTick !== undefined
            && missionFiveShuttleCaptures.length < 4)) {
          missionFiveAssaultRouteStage += 1;
          missionFiveAssaultRouteArrivalTicks.push(snapshot.tick);
          missionFiveAssaultProgressTick = snapshot.tick;
        }
      }
      const initialHuntStructuresRemain = [...missionFiveInitialHuntStructureKeys].some((key) => (
        hostiles.some((hostile) => objectKey(hostile) === key)
      ));
      if (!initialHuntStructuresRemain
        && hostiles.length > 0
        && hostiles.every((hostile) => hostile.type === 4)) {
        missionFiveAssaultPhase = "cleanup";
        missionFiveStrikeGroupKeys.clear();
      }
      const missionFiveStrikeExhaustionThreshold = mission.variant === "west-b"
        && missionFiveHuntTriggeredTick === undefined
        && missionFiveAssaultRouteStage === 6
        ? 1
        : 3;
      if (missionFiveAssaultPhase === "assault"
        && !(missionFiveShuttleFactCaptureTick !== undefined
          && missionFiveShuttleCaptures.length < 4)
        && ((snapshot.tick - missionFiveWaveLaunchedTick >= 300
          && missionFiveStrikeGroupKeys.size < missionFiveStrikeExhaustionThreshold)
          || snapshot.tick - missionFiveAssaultProgressTick >= 6_000)) {
        missionFiveAssaultPhase = "rebuild";
        missionFiveStrikeGroupKeys.clear();
        missionFiveAssaultRouteStage = mission.variant === "west-b"
          ? mission.coreRouteHolds?.find(({ sites }) => (
            sites.some((site) => hostiles.some((hostile) => (
              hostile.typeName === site.typeName
              && hostile.cellX === site.cellX
              && hostile.cellY === site.cellY
            )))
          ))?.routeStage ?? 0
          : 0;
        missionFiveAssaultProgressTick = snapshot.tick;
      }
      const launchThreshold = missionFiveAssaultWaveCount === 0
        ? snapshot.tick >= missionFiveAssaultTick
          ? mission.variant === "west-b" ? 26 : mission.variant === "east-a" ? 34 : 35
          : mission.variant === "west-b" && missionFiveWestBApcKey !== undefined
            ? missionFiveAssaultForce - 1
            : missionFiveAssaultForce
        : mission.variant === "west-b" ? mission.relaunchForce ?? 26
          : mission.variant === "east-a" ? 28 : mission.relaunchForce ?? 40;
      if (assaultReady && (missionFiveAssaultPhase === "staging" || missionFiveAssaultPhase === "rebuild")
        && attackers.length >= launchThreshold) {
        missionFiveAssaultPhase = "assault";
        missionFiveAssaultWaveCount += 1;
        missionFiveWaveLaunchedTick = snapshot.tick;
        missionFiveAssaultProgressTick = snapshot.tick;
        if (missionFiveAssaultStartedTick === undefined) missionFiveAssaultStartedTick = snapshot.tick;
      }
      if (missionFiveAssaultPhase === "assault") {
        const evictedGuardTankKeys = [];
        if (mission.homeGuardSize && westBFactoryStillLive
          && attackers.filter((attacker) => attacker.typeName === "MTNK").length < 2) {
          for (const attacker of attackers.filter((candidate) => candidate.typeName === "MTNK")) {
            const key = objectKey(attacker);
            if (missionFiveHomeGuardKeys.delete(key)) evictedGuardTankKeys.push(key);
          }
        }
        if (mission.homeGuardSize && westBFactoryStillLive
          && missionFiveHomeGuardKeys.size < mission.homeGuardSize) {
          const guardPriority = mission.variant === "west-b"
            ? new Map([["E1", 0], ["E2", 0], ["JEEP", 1], ["APC", 2], ["MTNK", 3]])
            : new Map([["MTNK", 0], ["JEEP", 1], ["APC", 2], ["E2", 3], ["E1", 4]]);
          const guardCandidates = attackers.filter((attacker) => (
            !missionFiveStrikeGroupKeys.has(objectKey(attacker))
            && !missionFiveHomeGuardKeys.has(objectKey(attacker))
          )).toSorted((left, right) => (
            (guardPriority.get(left.typeName) ?? 20) - (guardPriority.get(right.typeName) ?? 20)
            || right.strength - left.strength
            || left.id - right.id
          ));
          let guardTankCount = attackers.filter((attacker) => (
            attacker.typeName === "MTNK" && missionFiveHomeGuardKeys.has(objectKey(attacker))
          )).length;
          const desiredGuardTankCount = attackers.filter((attacker) => attacker.typeName === "MTNK").length >= 2
            ? 1
            : 0;
          const balancedGuardLimit = Math.ceil(mission.homeGuardSize / 2);
          const guardTypeCounts = new Map(["E1", "E2"].map((typeName) => [
            typeName,
            attackers.filter((attacker) => (
              attacker.typeName === typeName && missionFiveHomeGuardKeys.has(objectKey(attacker))
            )).length,
          ]));
          for (const defender of guardCandidates) {
            if (missionFiveHomeGuardKeys.size >= mission.homeGuardSize) break;
            if (defender.typeName === "MTNK" && guardTankCount >= desiredGuardTankCount) continue;
            if (mission.variant === "west-b"
              && ["E1", "E2"].includes(defender.typeName)
              && (guardTypeCounts.get(defender.typeName) ?? 0) >= balancedGuardLimit) continue;
            missionFiveHomeGuardKeys.add(objectKey(defender));
            if (defender.typeName === "MTNK") guardTankCount += 1;
            if (["E1", "E2"].includes(defender.typeName)) {
              guardTypeCounts.set(defender.typeName, (guardTypeCounts.get(defender.typeName) ?? 0) + 1);
            }
          }
          if (mission.variant === "west-b" && missionFiveHomeGuardKeys.size < mission.homeGuardSize) {
            for (const defender of guardCandidates) {
              if (missionFiveHomeGuardKeys.size >= mission.homeGuardSize) break;
              if (missionFiveHomeGuardKeys.has(objectKey(defender))) continue;
              if (defender.typeName === "MTNK" && guardTankCount >= desiredGuardTankCount) continue;
              missionFiveHomeGuardKeys.add(objectKey(defender));
              if (defender.typeName === "MTNK") guardTankCount += 1;
            }
          }
        }
        for (const key of evictedGuardTankKeys) missionFiveStrikeGroupKeys.add(key);
        const reserve = mission.variant === "west-b" && !westBFactoryStillLive
          ? missionFiveHuntTriggeredTick !== undefined && hostiles.some((hostile) => (
            hostile.type !== 4 && (hostile.objectFlags & (1 << 12)) !== 0
          ))
            ? hostiles.some((hostile) => (
              hostile.type !== 4 && (hostile.objectFlags & (1 << 12)) !== 0
              && Math.max(
                Math.abs(hostile.cellX - mission.home.cellX),
                Math.abs(hostile.cellY - mission.home.cellY),
              ) <= 14
            )) ? 50 : hostiles.some((hostile) => (
              hostile.typeName === "HAND" && hostile.cellX === 41 && hostile.cellY === 22
            ))
              ? attackers.length >= 50 ? 30 : attackers.length
              : 5
            : 0
          : mission.homeGuardSize ?? (mission.variant === "east-a" ? 8 : 4);
        const desiredStrikeGroup = Math.min(50, Math.max(0, attackers.length - reserve));
        if (missionFiveWestBStrategy
          && missionFiveHuntTriggeredTick !== undefined
          && reserve === 30
          && desiredStrikeGroup >= 20
          && missionFiveWestBCleanupBatchTick === undefined) {
          missionFiveWestBCleanupBatchTick = snapshot.tick;
          missionFiveWestBCleanupBatchSize = desiredStrikeGroup;
        }
        const priority = new Map([["MTNK", 0], ["APC", 1], ["JEEP", 2], ["E2", 3], ["E1", 4]]);
        const reinforcements = attackers
          .filter((attacker) => (
            !missionFiveStrikeGroupKeys.has(objectKey(attacker))
            && !missionFiveHomeGuardKeys.has(objectKey(attacker))
          ))
          .toSorted((left, right) => (
            (priority.get(left.typeName) ?? 20) - (priority.get(right.typeName) ?? 20)
            || right.strength - left.strength
            || left.type - right.type
            || left.id - right.id
          ));
        if (mission.variant !== "east-a" || snapshot.tick === missionFiveWaveLaunchedTick) {
          for (const attacker of reinforcements) {
            if (missionFiveStrikeGroupKeys.size >= desiredStrikeGroup) break;
            missionFiveStrikeGroupKeys.add(objectKey(attacker));
          }
        }
      }
    }
    const missionFiveStrikeGroup = mission.number === 5
      ? attackers.filter((attacker) => missionFiveStrikeGroupKeys.has(objectKey(attacker)))
      : [];
    const missionFiveAssaultActive = mission.number === 5 && missionFiveAssaultPhase === "assault";
    const missionFiveCleanupActive = mission.number === 5 && missionFiveAssaultPhase === "cleanup";
    const missionFiveForwardGroup = missionFiveCleanupActive ? attackers : missionFiveStrikeGroup;
    if (mission.number === 5 && mission.samSweepSites) {
      while (missionFiveSamSweepStage < mission.samSweepSites.length) {
        const { site } = mission.samSweepSites[missionFiveSamSweepStage];
        const siteTypeName = site.typeName ?? "SAM";
        const liveTarget = hostiles.some((hostile) => (
          hostile.typeName === siteTypeName && hostile.cellX === site.cellX && hostile.cellY === site.cellY
        ));
        if (liveTarget) break;
        if (siteTypeName === "SAM") missionFiveSamDestroyedTicks.push(snapshot.tick);
        missionFiveSamSweepStage += 1;
        missionFiveAssaultProgressTick = snapshot.tick;
      }
      if (missionFiveSamSweepStage >= mission.samSweepSites.length
        && mission.postSweepRouteStage !== undefined
        && missionFiveAssaultRouteStage < mission.postSweepRouteStage) {
        missionFiveAssaultRouteStage = mission.postSweepRouteStage;
      }
    }
    const missionFiveSamSweepSite = mission.number === 5
      ? mission.samSweepSites?.[missionFiveSamSweepStage]
      : undefined;
    const missionFiveSamSweepTarget = missionFiveSamSweepSite
      ? hostiles.find((hostile) => (
        hostile.typeName === (missionFiveSamSweepSite.site.typeName ?? "SAM")
        && hostile.cellX === missionFiveSamSweepSite.site.cellX
        && hostile.cellY === missionFiveSamSweepSite.site.cellY
        && snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
      )) ?? missionFiveSamSweepSite.approach
      : undefined;
    const missionFiveSamSweepActive = missionFiveAssaultActive
      && missionFiveSamSweepTarget !== undefined
      && missionFiveAssaultRouteStage >= (mission.preSweepRouteStage ?? 0);
    const missionFiveSamSweepThreat = missionFiveSamSweepActive
      ? chooseFormationThreat(
        missionFiveForwardGroup,
        visibleHostiles.filter((object) => object.type !== 4 && (object.objectFlags & (1 << 12)) !== 0),
        7,
      ) ?? chooseFormationThreat(
        missionFiveForwardGroup,
        visibleHostiles.filter((object) => object.typeName === "GUN"),
        10,
      )
      : undefined;
    if ((missionFiveAssaultActive || missionFiveCleanupActive) && !missionFiveSamSweepActive) {
      if (missionFiveAssaultRouteStage >= mission.assaultRoute.length
        && visibleHostiles.length === 0 && hostiles.length > 0) {
        missionFiveAssaultRouteStage = 0;
      }
      const assaultWaypoint = mission.assaultRoute[missionFiveAssaultRouteStage];
      if (assaultWaypoint) {
        const arrivalRadius = missionFiveAssaultRouteStage >= (mission.precisionRouteStage ?? 5) ? 2 : 4;
        const arrivals = missionFiveForwardGroup.filter((attacker) => (
          Math.abs(attacker.cellX - assaultWaypoint.cellX) <= arrivalRadius
          && Math.abs(attacker.cellY - assaultWaypoint.cellY) <= arrivalRadius
        )).length;
        const requiredFormation = missionFiveAssaultRouteStage >= (mission.formationReleaseStage ?? 5)
          ? 1
          : Math.min(missionFiveForwardGroup.length, Math.max(4, Math.ceil(missionFiveForwardGroup.length * 0.6)));
        const coreRouteHold = mission.coreRouteHolds?.find(({ routeStage }) => (
          routeStage === missionFiveAssaultRouteStage
        ));
        const holdForWestBCore = (
          missionFiveShuttleFactCaptureTick !== undefined
          && missionFiveShuttleCaptures.length < 4
        ) || coreRouteHold?.sites.some((site) => (
          hostiles.some((hostile) => (
            hostile.typeName === site.typeName
            && hostile.cellX === site.cellX
            && hostile.cellY === site.cellY
          ))
        ));
        if (!holdForWestBCore && missionFiveForwardGroup.length > 0 && arrivals >= requiredFormation) {
          missionFiveAssaultRouteArrivalTicks.push(snapshot.tick);
          missionFiveAssaultRouteStage += 1;
          missionFiveAssaultProgressTick = snapshot.tick;
        }
      }
    }
    const missionFiveRouteThreat = mission.number === 5
      ? mission.variant === "west-b" && missionFiveAssaultRouteStage >= 2
        ? chooseFormationThreat(
          missionFiveForwardGroup,
          visibleHostiles.filter((object) => object.type !== 4 && (object.objectFlags & (1 << 12)) !== 0),
          7,
        ) ?? chooseFormationThreat(
          missionFiveForwardGroup,
          visibleHostiles.filter((object) => object.typeName === "GUN"),
          10,
        )
        : mission.variant === "east-a" && missionFiveAssaultRouteStage >= 2
          ? chooseFormationThreat(
            missionFiveForwardGroup,
            visibleHostiles.filter((object) => object.type !== 4 && (object.objectFlags & (1 << 12)) !== 0),
            7,
          ) ?? chooseFormationThreat(
            missionFiveForwardGroup,
            visibleHostiles.filter((object) => object.typeName === "GUN"),
            10,
          )
        : chooseFormationThreat(missionFiveForwardGroup, visibleHostiles.filter((object) => (
          object.type !== 4 && (object.objectFlags & (1 << 12)) !== 0
        )), 6)
          ?? chooseFormationThreat(missionFiveForwardGroup, visibleHostiles.filter((object) => object.typeName === "GUN"), 8)
      : undefined;
    const missionFiveForwardTarget = missionFiveSamSweepActive
      ? missionFiveSamSweepThreat ?? missionFiveSamSweepTarget
      : mission.number === 5
      && (missionFiveCleanupActive
        || missionFiveAssaultRouteStage >= (mission.assaultTargetStage ?? 5))
      ? mission.variant === "west-b"
        ? chooseMissionFiveWestBAssaultTarget(
          missionFiveForwardGroup,
          visibleHostiles,
          missionFiveHuntTriggeredTick !== undefined,
          mission.coreRouteHolds?.find(({ routeStage }) => (
            routeStage === missionFiveAssaultRouteStage
          ))?.sites.filter((site) => (
            (missionFiveShuttleFactCaptureTick !== undefined
              && missionFiveShuttleCaptures.length < 4
              && site.typeName === "FACT" && site.cellX === 52 && site.cellY === 17)
            || hostiles.some((hostile) => (
              hostile.typeName === site.typeName
              && hostile.cellX === site.cellX
              && hostile.cellY === site.cellY
            ))
          )),
          missionFiveHuntTriggeredTick === undefined
            && hostiles.some((hostile) => (
              hostile.typeName === "NUKE" && hostile.cellX === 49 && hostile.cellY === 17
            ))
            && hostiles.length > 2,
          mission.assaultRoute[Math.floor(snapshot.tick / 1_200) % mission.assaultRoute.length],
        )
        : chooseMissionFiveAssaultTarget(
          missionFiveForwardGroup,
          visibleHostiles,
          mission.variant === "east-a" || missionFiveHuntTriggeredTick !== undefined,
        )
      : missionFiveRouteThreat;
    if (missionFiveAssaultActive) {
      if (missionFiveLastForwardTargetKey !== undefined
        && !hostiles.some((hostile) => objectKey(hostile) === missionFiveLastForwardTargetKey)) {
        missionFiveAssaultProgressTick = snapshot.tick;
      }
      if (missionFiveForwardTarget?.type !== undefined) {
        const forwardTargetKey = objectKey(missionFiveForwardTarget);
        if (forwardTargetKey === missionFiveLastForwardTargetKey
          && missionFiveLastForwardTargetStrength !== undefined
          && missionFiveForwardTarget.strength < missionFiveLastForwardTargetStrength) {
          missionFiveAssaultProgressTick = snapshot.tick;
        }
        missionFiveLastForwardTargetKey = forwardTargetKey;
        missionFiveLastForwardTargetStrength = missionFiveForwardTarget.strength;
      }
    } else if (!missionFiveAssaultActive) {
      missionFiveLastForwardTargetKey = undefined;
      missionFiveLastForwardTargetStrength = undefined;
    }
    const missionSixCommando = mission.number === 6
      ? friendly.find((object) => object.typeName === "RMBO")
      : undefined;
    const missionSixTransport = mission.number === 6
      ? friendly.find((object) => object.typeName === "TRAN")
      : undefined;
    const missionSixAirstrip = mission.number === 6
      ? hostiles.find((hostile) => (
        hostile.typeName === mission.airstrip.typeName
        && hostile.cellX === mission.airstrip.cellX
        && hostile.cellY === mission.airstrip.cellY
      ))
      : undefined;
    const missionSixDistance = (object, destination) => Math.max(
      Math.abs(object.cellX - destination.cellX),
      Math.abs(object.cellY - destination.cellY),
    );
    const missionSixQueueContextOrder = (
      group,
      destination,
      orderKey,
      interval = 90,
      flags = 0,
    ) => {
      if (group.length === 0 || !destination) return false;
      if (missionSixLastOrderKey === orderKey
        && snapshot.tick - missionSixLastOrderTick < interval) return false;
      commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
      for (const object of group) {
        commands.push({
          type: COMMAND_SELECT_OBJECT,
          args: [object.type, object.id, 0, 0, 0, 0, 0],
        });
      }
      if (flags) {
        commands.push({
          type: COMMAND_INPUT,
          flags,
          args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
        });
      }
      commands.push({
        type: COMMAND_INPUT,
        flags,
        args: [
          INPUT_COMMAND_AT_POSITION,
          destination.cellX * CELL_PIXELS + CELL_PIXELS / 2,
          destination.cellY * CELL_PIXELS + CELL_PIXELS / 2,
          0, 0, 0, 0,
        ],
      });
      if (flags) {
        commands.push({
          type: COMMAND_INPUT,
          args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
        });
      }
      selectionCommands += group.length;
      contextualOrders += 1;
      retargetCycles += 1;
      missionSixLastOrderKey = orderKey;
      missionSixLastOrderTick = snapshot.tick;
      return true;
    };
    if (mission.number === 6) {
      const liveSamSites = mission.samSites.map((site) => hostiles.find((hostile) => (
        hostile.typeName === site.typeName
        && hostile.cellX === site.cellX
        && hostile.cellY === site.cellY
      )));
      while (missionSixSamDestroyedTicks.length < mission.samSites.length
        && !liveSamSites[missionSixSamDestroyedTicks.length]) {
        missionSixSamDestroyedTicks.push(snapshot.tick);
      }
      const lowerThreat = missionSixCommando
        ? hostiles.filter((hostile) => (
          hostile.type !== 4 && hostile.cellY >= 38
        )).toSorted((left, right) => (
          missionSixDistance(left, missionSixCommando)
          - missionSixDistance(right, missionSixCommando)
          || left.strength - right.strength
          || left.id - right.id
        ))[0]
        : undefined;
      if (missionSixPhase === "opening"
        && liveSamSites.every((site) => !site) && !lowerThreat) {
        missionSixPhase = "loading";
        missionSixLastOrderKey = undefined;
      }

      if (missionSixPhase === "opening" && missionSixCommando) {
        const openingTarget = lowerThreat ?? liveSamSites.find(Boolean);
        missionSixQueueContextOrder(
          [missionSixCommando],
          openingTarget,
          openingTarget && `opening:${objectKey(openingTarget)}`,
          30,
        );
      }

      if (missionSixPhase === "loading") {
        if (missionSixTransport?.pips.includes(PIP_COMMANDO) && !missionSixCommando) {
          missionSixTransportLoadTick = snapshot.tick;
          missionSixPhase = "flight";
          missionSixLastOrderKey = undefined;
        } else if (missionSixCommando && missionSixTransport) {
          missionSixQueueContextOrder(
            [missionSixCommando],
            missionSixTransport,
            `load:${objectKey(missionSixTransport)}`,
          );
        }
      }

      if (missionSixPhase === "flight" && missionSixTransport) {
        const atLandingZone = missionSixDistance(missionSixTransport, mission.transportLanding) <= 3;
        const selectedByGdi = Boolean(missionSixTransport.selectedMask & (1 << HOUSE_GDI));
        const canUnload = selectedByGdi
          && missionSixTransport.actionWithSelected[HOUSE_GDI] === ACTION_SELF;
        if (atLandingZone && canUnload) {
          missionSixTransportLandingTick = snapshot.tick;
          missionSixQueueContextOrder(
            [missionSixTransport],
            missionSixTransport,
            `unload:${objectKey(missionSixTransport)}`,
            30,
          );
          missionSixPhase = "unloading";
        } else if (!atLandingZone) {
          missionSixQueueContextOrder(
            [missionSixTransport],
            mission.transportLanding,
            "flight:landing-zone",
          );
        }
      }

      if (missionSixPhase === "unloading") {
        if (missionSixCommando && !missionSixTransport?.pips.includes(PIP_COMMANDO)) {
          missionSixTransportUnloadTick = snapshot.tick;
          missionSixPhase = "infiltrate";
          missionSixLastOrderKey = undefined;
        } else if (missionSixTransport
          && missionSixTransport.actionWithSelected[HOUSE_GDI] === ACTION_SELF) {
          missionSixQueueContextOrder(
            [missionSixTransport],
            missionSixTransport,
            `unload:${objectKey(missionSixTransport)}`,
            30,
          );
        }
      }

      if (missionSixPhase === "infiltrate" && missionSixCommando) {
        while (missionSixRouteStage < mission.infiltrationRoute.length
          && missionSixDistance(
            missionSixCommando,
            mission.infiltrationRoute[missionSixRouteStage],
          ) <= 2) {
          missionSixRouteArrivalTicks.push(snapshot.tick);
          missionSixRouteStage += 1;
          missionSixLastOrderKey = undefined;
        }
        const routeTarget = mission.infiltrationRoute[missionSixRouteStage];
        if (routeTarget) {
          missionSixQueueContextOrder(
            [missionSixCommando],
            routeTarget,
            `route:${missionSixRouteStage}`,
            90,
            MODIFIER_ALT,
          );
        } else if (missionSixAirstrip
          && snapshot.shroud.isVisible(missionSixAirstrip.cellX, missionSixAirstrip.cellY)) {
          commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
          commands.push({
            type: COMMAND_SELECT_OBJECT,
            args: [missionSixCommando.type, missionSixCommando.id, 0, 0, 0, 0, 0],
          });
          selectionCommands += 1;
          missionSixAirstripSelectionTick = snapshot.tick;
          missionSixPhase = "sabotage-ready";
        } else {
          missionSixQueueContextOrder(
            [missionSixCommando],
            { cellX: 54, cellY: 8 },
            "route:airstrip-approach",
          );
        }
      }

      if (missionSixPhase === "sabotage-ready"
        && missionSixAirstripSelectionTick !== undefined
        && snapshot.tick > missionSixAirstripSelectionTick
        && missionSixCommando && missionSixAirstrip) {
        const selectedByGdi = Boolean(missionSixCommando.selectedMask & (1 << HOUSE_GDI));
        if (selectedByGdi
          && missionSixAirstrip.actionWithSelected[HOUSE_GDI] === ACTION_SABOTAGE) {
          missionSixSabotageActionObserved = true;
          if (missionSixQueueContextOrder(
            [missionSixCommando],
            missionSixAirstrip,
            `sabotage:${objectKey(missionSixAirstrip)}`,
            Infinity,
          )) {
            missionSixSabotageOrderTick = snapshot.tick;
            missionSixPhase = "sabotage";
          }
        } else if (missionSixAirstripSelectionTick === undefined
          || snapshot.tick - missionSixAirstripSelectionTick >= 90) {
          commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
          commands.push({
            type: COMMAND_SELECT_OBJECT,
            args: [missionSixCommando.type, missionSixCommando.id, 0, 0, 0, 0, 0],
          });
          selectionCommands += 1;
          missionSixAirstripSelectionTick = snapshot.tick;
        }
      }

      if (trace && snapshot.tick % 300 === 0) {
        console.error(JSON.stringify({ missionSix: {
          phase: missionSixPhase,
          routeStage: missionSixRouteStage,
          commando: missionSixCommando && {
            strength: missionSixCommando.strength,
            cellX: missionSixCommando.cellX,
            cellY: missionSixCommando.cellY,
          },
          transport: missionSixTransport && {
            cellX: missionSixTransport.cellX,
            cellY: missionSixTransport.cellY,
            pips: missionSixTransport.pips,
            action: missionSixTransport.actionWithSelected[HOUSE_GDI],
          },
          airstripAction: missionSixAirstrip?.actionWithSelected[HOUSE_GDI],
        } }));
      }
    }
    let orderTarget = mission.number === 6
      ? undefined
      : mission.number === 3
      ? assaultReady ? chooseMissionThreeAssaultTarget(hostiles) : chooseMissionThreeDefenseTarget(hostiles)
      : mission.number === 2
        ? assaultReady ? target : chooseMissionTwoDefenseTarget(hostiles)
        : mission.number === 5
          ? missionFiveReliefStage < mission.reliefRoute.length
            ? mission.reliefRoute[missionFiveReliefStage]
            : missionFiveAssaultActive || missionFiveCleanupActive
              ? missionFiveForwardTarget
                ?? mission.assaultRoute[missionFiveAssaultRouteStage]
                ?? chooseTarget(visibleHostiles)
              : mission.variant === "west-b" && missionFiveAssaultPhase === "rebuild"
                ? chooseMissionFiveDefenseTarget(visibleHostiles, mission.home) ?? mission.home
                : chooseMissionFiveDefenseTarget(visibleHostiles, mission.home) ?? mission.home
        : mission.number === 4 && mission.objective === "extract"
          ? (mission.threatRadius > 0 ? chooseLocalThreat(attackers, hostiles, mission.threatRadius) : undefined)
            ?? mission.route[missionFourRouteStage]
          : target;
    if (mission.number === 5 && mission.variant === "west-b"
      && missionFiveHuntTriggeredTick !== undefined
      && hostiles.some((hostile) => (
        hostile.type !== 4 && (hostile.objectFlags & (1 << 12)) !== 0
      ))) {
      const armedMobileHostiles = visibleHostiles.filter((hostile) => (
        hostile.type !== 4 && (hostile.objectFlags & (1 << 12)) !== 0
      ));
      const localHomeThreat = chooseMissionFiveDefenseTarget(armedMobileHostiles, mission.home);
      const armedMobileRemains = hostiles.some((hostile) => (
        hostile.type !== 4 && (hostile.objectFlags & (1 << 12)) !== 0
      ));
      const hostileHand = hostiles.find((hostile) => (
        hostile.typeName === "HAND" && hostile.cellX === 41 && hostile.cellY === 22
      ));
      if (!localHomeThreat && armedMobileRemains && hostileHand && attackers.length < 50) {
        missionFiveStrikeGroupKeys.clear();
      }
      orderTarget = localHomeThreat
        ?? hostileHand
        ?? chooseTarget(armedMobileHostiles)
        ?? mission.home;
    }
    let missionFiveStaticSweepTarget;
    let missionFiveStaticSweepForceAttack = false;
    let missionFiveStaticSweepForceCycle;
    const missionFiveInitialHuntCleared = mission.number === 5
      && [...missionFiveInitialHuntStructureKeys].every((key) => (
        !hostiles.some((hostile) => objectKey(hostile) === key)
      ));
    const missionFiveKnownSamSites = mission.samSites?.filter((site) => (
      [...missionFiveKnownHostileStructures.values()].some((structure) => (
        structure.typeName === "SAM"
        && structure.cellX === site.site.cellX
        && structure.cellY === site.site.cellY
      ))
    ));
    const missionFiveSoleSamSite = hostiles.length === 1 && hostiles[0].typeName === "SAM"
      ? mission.samSites?.find((site) => (
        site.site.cellX === hostiles[0].cellX && site.site.cellY === hostiles[0].cellY
      ))
      : undefined;
    const missionFiveStaticSweepSites = missionFiveSoleSamSite
      ? [missionFiveSoleSamSite]
      : hostiles.length > 0
      && hostiles.every((hostile) => hostile.typeName === "SAM")
      && missionFiveKnownSamSites?.length > 0
        ? missionFiveKnownSamSites
        : mission.cleanupSites ?? mission.samSites;
    if (mission.number === 5
      && missionFiveInitialHuntCleared
      && missionFiveStaticSweepSites?.length > 0
      && hostiles.length > 0
      && visibleHostiles.length === 0
      && hostiles.every((hostile) => hostile.type === 4)) {
      if (missionFiveStaticSweepStartedTick === undefined) missionFiveStaticSweepStartedTick = snapshot.tick;
      const sweepElapsed = snapshot.tick - missionFiveStaticSweepStartedTick;
      const sweepIndex = Math.floor(sweepElapsed / 1_800)
        % missionFiveStaticSweepSites.length;
      const sweepPhase = sweepElapsed % 1_800;
      const sweepSite = missionFiveStaticSweepSites[sweepIndex];
      missionFiveStaticSweepForceAttack = sweepPhase >= 600;
      missionFiveStaticSweepForceCycle = Math.floor(sweepElapsed / 1_800);
      missionFiveStaticSweepTarget = missionFiveStaticSweepForceAttack
        ? missionFiveStaticSweepForceOrderCycle === missionFiveStaticSweepForceCycle
          ? undefined
          : sweepSite.site
        : sweepSite.approach;
      orderTarget = missionFiveStaticSweepTarget;
    }
    if (trace && mission.number === 5 && snapshot.tick % 600 === 0) {
      console.error(JSON.stringify({
        missionFiveOrder: true,
        tick: snapshot.tick,
        phase: missionFiveAssaultPhase,
        routeStage: missionFiveAssaultRouteStage,
        samSweepStage: missionFiveSamSweepStage,
        forward: missionFiveForwardGroup.length,
        orderTarget: orderTarget && {
          typeName: orderTarget.typeName,
          id: orderTarget.id,
          cellX: orderTarget.cellX,
          cellY: orderTarget.cellY,
        },
        knownStructures: [...missionFiveKnownHostileStructures.values()].map((structure) => ({
          typeName: structure.typeName,
          id: structure.id,
          cellX: structure.cellX,
          cellY: structure.cellY,
        })),
        forwardSample: missionFiveForwardGroup.slice(0, 8).map(({ typeName, id, cellX, cellY }) => (
          { typeName, id, cellX, cellY }
        )),
      }));
    }
    if (mission.number === 4 && mission.scoutRoute
      && missionFourScoutStage < mission.scoutRoute.length && !orderTarget) {
      orderTarget = mission.scoutHold;
    }
    if (mission.number === 4 && mission.objective === "extract"
      && missionFourRouteStage < mission.route.length) {
      const routeTarget = mission.route[missionFourRouteStage];
      const routeRunners = friendly.filter((object) => (
        object.type !== 4
        && missionFourExtractionKeys.has(objectKey(object))
      ));
      const arrivals = routeRunners.filter((object) => (
        Math.abs(object.cellX - routeTarget.cellX) <= 1
        && Math.abs(object.cellY - routeTarget.cellY) <= 1
      )).length;
      const arrived = arrivals >= Math.min(mission.arrivalCount ?? 1, routeRunners.length)
        && routeRunners.length > 0;
      if (arrived) {
        missionFourRouteArrivalTicks.push(snapshot.tick);
        missionFourRouteStage += 1;
      }
      orderTarget = (mission.threatRadius > 0 ? chooseLocalThreat(attackers, hostiles, mission.threatRadius) : undefined)
        ?? mission.route[missionFourRouteStage]
        ?? orderTarget;
    }
    if (mission.number === 4 && mission.variant === "east-a") {
      const queueContextOrder = (group, destination, flags = 0) => {
        if (group.length === 0 || !destination) return;
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        for (const object of group) {
          commands.push({ type: COMMAND_SELECT_OBJECT, args: [object.type, object.id, 0, 0, 0, 0, 0] });
        }
        commands.push({
          type: COMMAND_INPUT,
          flags,
          args: [
            INPUT_COMMAND_AT_POSITION,
            destination.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            destination.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0, 0, 0, 0,
          ],
        });
        selectionCommands += group.length;
        contextualOrders += 1;
        retargetCycles += 1;
      };
      const distance = (object, destination) => Math.max(
        Math.abs(object.cellX - destination.cellX),
        Math.abs(object.cellY - destination.cellY),
      );
      const runner = attackers.find((attacker) => missionFourExtractionKeys.has(objectKey(attacker)));
      const visibleCargo = attackers.filter((attacker) => missionFourCargoKeys.has(objectKey(attacker)));

      if (!missionFourCargoLoadIssued && runner && visibleCargo.length === 2) {
        queueContextOrder(visibleCargo, runner);
        missionFourCargoLoadIssued = true;
      }
      if (missionFourCargoLoadIssued && visibleCargo.length === 0) missionFourCargoSealed = true;
      if (missionFourCargoUnloadIssued
        && visibleCargo.length === missionFourCargoKeys.size) missionFourCargoUnloaded = true;

      const vanguard = attackers.filter((attacker) => (
        !missionFourExtractionKeys.has(objectKey(attacker))
        && (missionFourCargoUnloaded || !missionFourCargoKeys.has(objectKey(attacker)))
      ));
      const currentVanguardWaypoint = mission.route[missionFourVanguardStage];
      if (currentVanguardWaypoint
        && vanguard.some((attacker) => distance(attacker, currentVanguardWaypoint) <= 2)) {
        missionFourVanguardStage += 1;
      }
      const vanguardWaypoint = mission.route[missionFourVanguardStage];
      const visibleEastHostiles = hostiles.filter((hostile) => (
        snapshot.shroud.isVisible(hostile.cellX, hostile.cellY)
      ));
      const tank = hostiles.find((hostile) => (
        hostile.typeName === "LTNK" && hostile.cellX >= 40 && hostile.cellY >= 50
      ));
      const front = vanguard.toSorted((left, right) => (
        (vanguardWaypoint ? distance(left, vanguardWaypoint) - distance(right, vanguardWaypoint) : 0)
        || right.strength - left.strength
        || left.type - right.type
        || left.id - right.id
      )).slice(0, 6);
      const localThreat = chooseLocalThreat(front, visibleEastHostiles, 3);
      const staged = missionFourVanguardStage >= 6 || missionFourRouteStage >= 6;
      const vanguardTarget = staged
        ? tank ?? localThreat ?? vanguardWaypoint
        : localThreat ?? vanguardWaypoint;
      if (trace && snapshot.tick % 600 === 0) {
        console.error(JSON.stringify({
          eastA: {
            vanguardStage: missionFourVanguardStage,
            cargoSealed: missionFourCargoSealed,
            cargoUnloaded: missionFourCargoUnloaded,
            vanguard: vanguard.map(({ typeName, id, strength, cellX, cellY }) => (
              { typeName, id, strength, cellX, cellY }
            )),
            target: vanguardTarget && {
              typeName: vanguardTarget.typeName,
              id: vanguardTarget.id,
              strength: vanguardTarget.strength,
              cellX: vanguardTarget.cellX,
              cellY: vanguardTarget.cellY,
            },
          },
        }));
      }
      queueContextOrder(front, vanguardTarget);

      const rushReady = missionFourCargoUnloaded && (!tank || tank.strength <= 100);
      if (runner && rushReady) {
        queueContextOrder([runner], mission.route.at(-1), MODIFIER_ALT);
      } else if (runner && missionFourRouteStage < 6
        && missionFourRouteStage < missionFourVanguardStage) {
        queueContextOrder([runner], mission.route[missionFourRouteStage]);
      } else if (runner && missionFourRouteStage >= 6
        && missionFourCargoSealed && !missionFourCargoUnloadIssued) {
        queueContextOrder([runner], runner);
        missionFourCargoUnloadIssued = true;
      }
    }
    if (mission.number === 4 && mission.objective === "eliminate" && !target
      && (!mission.scoutRoute || missionFourScoutStage >= mission.scoutRoute.length)) {
      if (missionFourRouteStage >= mission.route.length && hostiles.length > 0) missionFourRouteStage = 0;
      const routeTarget = mission.route[missionFourRouteStage];
      if (routeTarget) {
        const arrivals = friendly.filter((object) => (
          object.type !== 4
          && Math.abs(object.cellX - routeTarget.cellX) <= 2
          && Math.abs(object.cellY - routeTarget.cellY) <= 2
        )).length;
        if (arrivals >= Math.min(4, Math.max(1, attackers.length))) {
          missionFourRouteArrivalTicks.push(snapshot.tick);
          missionFourRouteStage += 1;
        }
        orderTarget = mission.route[missionFourRouteStage] ?? routeTarget;
      }
    }
    if (mission.number === 3) {
      for (const id of missionThreeStrikeGroupIds) {
        if (!attackers.some((attacker) => attacker.id === id)) missionThreeStrikeGroupIds.delete(id);
      }
      const reserve = 25;
      const desiredStrikeGroup = Math.min(40, Math.max(0, attackers.length - reserve));
      if (missionThreeBaseAssaultStarted
        && (missionThreeStrikeGroupIds.size === 0
          || (missionThreeStrikeGroupIds.size < 8 && attackers.length >= reserve + 23))) {
        const reinforcements = attackers
          .filter((attacker) => attacker.id !== missionThreeScoutId && !missionThreeStrikeGroupIds.has(attacker.id))
          .toSorted((left, right) => (
            right.maxStrength - left.maxStrength
            || left.cellY - right.cellY
            || left.cellX - right.cellX
            || left.id - right.id
          ));
        for (const attacker of reinforcements) {
          if (missionThreeStrikeGroupIds.size >= desiredStrikeGroup) break;
          missionThreeStrikeGroupIds.add(attacker.id);
        }
      }
    }
    const missionThreeStrikeGroup = attackers.filter((attacker) => missionThreeStrikeGroupIds.has(attacker.id));
    if (mission.number === 3 && assaultReady && missionThreeBaseAssaultStarted
      && missionThreeRouteStage < missionThreeAssaultRoute.length) {
      const routeTarget = missionThreeAssaultRoute[missionThreeRouteStage];
      const arrivals = missionThreeStrikeGroup.filter((attacker) => (
        Math.abs(attacker.cellX - routeTarget.cellX) <= 4 && Math.abs(attacker.cellY - routeTarget.cellY) <= 4
      )).length;
      if (arrivals >= Math.min(6, Math.max(2, Math.floor(missionThreeStrikeGroup.length / 8)))) missionThreeRouteStage += 1;
      orderTarget = missionThreeAssaultRoute[missionThreeRouteStage] ?? orderTarget;
    }
    const commandingAttackers = mission.number === 3
      ? missionThreeBaseAssaultStarted
        ? missionThreeStrikeGroup
        : attackers
          .filter((attacker) => attacker.id !== missionThreeScoutId)
          .toSorted((left, right) => left.cellY - right.cellY || left.cellX - right.cellX || left.id - right.id)
          .slice(0, 48)
      : mission.number === 2
        ? assaultReady
          ? attackers.filter((attacker) => !missionTwoHomeGuardIds.has(attacker.id))
          : attackers.filter((attacker) => missionTwoHomeGuardIds.has(attacker.id))
        : mission.number === 5
          ? missionFiveReliefStage < mission.reliefRoute.length
            ? missionFiveInitialForce
            : missionFiveAssaultActive || missionFiveCleanupActive
              ? missionFiveForwardGroup
              : attackers.filter((attacker) => (
                missionFiveCrateCollectedTick !== undefined
                || objectKey(attacker) !== missionFiveCrateRunnerKey
              ))
        : mission.number === 4 && mission.objective === "extract"
          ? mission.variant === "east-a"
            ? []
            : attackers.filter((attacker) => missionFourExtractionKeys.has(objectKey(attacker)))
          : missionFourScout
            ? attackers.filter((attacker) => attacker !== missionFourScout)
            : attackers;
    if (!(mission.number === 4 && mission.variant === "west-b")
      && !missionThreeDeploying && commandingAttackers.length > 0 && orderTarget) {
      const westBFinalRefineryAssault = mission.number === 5
        && mission.variant === "west-b"
        && missionFiveHuntTriggeredTick === undefined
        && missionFiveAssaultRouteStage === 6
        && orderTarget.typeName === "PROC"
        && orderTarget.cellX === 47
        && orderTarget.cellY === 22;
      const scatterWestBFinalRefineryAssault = westBFinalRefineryAssault
        && missionFiveWestBRefineryScatterTick === undefined;
      const commandGroups = westBFinalRefineryAssault
        ? [
            commandingAttackers.filter((attacker) => attacker.typeName !== "E2"),
            commandingAttackers.filter((attacker) => attacker.typeName === "E2"),
          ].filter((group) => group.length > 0)
        : mission.number === 5
        ? Array.from({ length: Math.ceil(commandingAttackers.length / 10) }, (_, index) => (
          commandingAttackers.slice(index * 10, index * 10 + 10)
        ))
        : [commandingAttackers];
      if (scatterWestBFinalRefineryAssault) missionFiveWestBRefineryScatterTick = snapshot.tick;
      for (const commandGroup of commandGroups) {
        const commandTarget = westBFinalRefineryAssault
          && commandGroup.every((attacker) => attacker.typeName === "E2")
          ? chooseFormationThreat(commandGroup, visibleHostiles.filter((hostile) => (
              hostile.typeName === "E1" || hostile.typeName === "E3"
            )), 7) ?? orderTarget
          : orderTarget;
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        for (const attacker of commandGroup) {
          commands.push({ type: COMMAND_SELECT_OBJECT, args: [attacker.type, attacker.id, 0, 0, 0, 0, 0] });
        }
        if (scatterWestBFinalRefineryAssault
          && !commandGroup.every((attacker) => attacker.typeName === "E2")) {
          commands.push({ type: COMMAND_UNIT, args: [UNIT_SCATTER, 0, 0, 0, 0, 0, 0] });
          continue;
        }
        const commandModifiers = mission.number === 5 && missionFiveReliefStage < mission.reliefRoute.length
          ? MODIFIER_ALT
          : mission.number === 5 && (missionFiveStaticSweepForceAttack || commandTarget.typeName === "SAM")
            ? MODIFIER_CTRL
            : 0;
        if (commandModifiers !== 0) {
          commands.push({
            type: COMMAND_INPUT,
            flags: commandModifiers,
            args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
          });
        }
        commands.push({
          type: COMMAND_INPUT,
          flags: commandModifiers,
          args: [
            INPUT_COMMAND_AT_POSITION,
            commandTarget.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            commandTarget.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0,
            0,
            0,
            0,
          ],
        });
        if (commandModifiers !== 0) {
          commands.push({
            type: COMMAND_INPUT,
            args: [INPUT_SPECIAL_KEYS, 0, 0, 0, 0, 0, 0],
          });
        }
        selectionCommands += commandGroup.length;
        contextualOrders += 1;
        retargetCycles += 1;
      }
      if (mission.number === 5
        && missionFiveStaticSweepForceAttack
        && missionFiveStaticSweepForceCycle !== undefined) {
        missionFiveStaticSweepForceOrderCycle = missionFiveStaticSweepForceCycle;
      }
    }
    if (mission.number === 3 && !missionThreeDeploying && missionThreeBaseAssaultStarted) {
      const homeAttackers = attackers
        .filter((attacker) => attacker.id !== missionThreeScoutId && !missionThreeStrikeGroupIds.has(attacker.id))
        .toSorted((left, right) => left.cellY - right.cellY || left.cellX - right.cellX || left.id - right.id)
        .slice(0, 48);
      const homeTarget = chooseMissionThreeDefenseTarget(hostiles);
      if (homeAttackers.length > 0 && homeTarget) {
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        for (const attacker of homeAttackers) {
          commands.push({ type: COMMAND_SELECT_OBJECT, args: [attacker.type, attacker.id, 0, 0, 0, 0, 0] });
        }
        commands.push({
          type: COMMAND_INPUT,
          args: [
            INPUT_COMMAND_AT_POSITION,
            homeTarget.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            homeTarget.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0, 0, 0, 0,
          ],
        });
        selectionCommands += homeAttackers.length;
        contextualOrders += 1;
        retargetCycles += 1;
      }
    }
    if (missionFiveAssaultActive) {
      const homeAttackers = attackers.filter((attacker) => (
        !missionFiveStrikeGroupKeys.has(objectKey(attacker))
      ));
      const defenseTarget = chooseMissionFiveDefenseTarget(visibleHostiles, mission.home);
      const homeAssignments = defenseTarget
        ? [{ group: homeAttackers, target: defenseTarget }]
        : mission.guardPosts
          ? mission.guardPosts.map((target, postIndex) => ({
            target,
            group: homeAttackers.filter((attacker) => (
              attacker.id % mission.guardPosts.length === postIndex
              && (Math.abs(attacker.cellX - target.cellX) > 2
                || Math.abs(attacker.cellY - target.cellY) > 2)
            )),
          }))
          : [{ group: homeAttackers, target: mission.home }];
      for (const { group, target: homeTarget } of homeAssignments) {
        if (group.length === 0) continue;
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        for (const attacker of group) {
          commands.push({ type: COMMAND_SELECT_OBJECT, args: [attacker.type, attacker.id, 0, 0, 0, 0, 0] });
        }
        commands.push({
          type: COMMAND_INPUT,
          args: [
            INPUT_COMMAND_AT_POSITION,
            homeTarget.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            homeTarget.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0, 0, 0, 0,
          ],
        });
        selectionCommands += group.length;
        contextualOrders += 1;
        retargetCycles += 1;
      }
    }
    if (mission.number === 2 && assaultReady) {
      const homeGuard = attackers.filter((attacker) => missionTwoHomeGuardIds.has(attacker.id));
      const homeTarget = chooseMissionTwoDefenseTarget(hostiles)
        ?? (!friendly.some((object) => object.type === 4) ? target : undefined);
      if (homeGuard.length > 0 && homeTarget) {
        commands.push({ type: COMMAND_CLEAR_SELECTION, args: [0, 0, 0, 0, 0, 0, 0] });
        for (const attacker of homeGuard) {
          commands.push({ type: COMMAND_SELECT_OBJECT, args: [attacker.type, attacker.id, 0, 0, 0, 0, 0] });
        }
        commands.push({
          type: COMMAND_INPUT,
          args: [
            INPUT_COMMAND_AT_POSITION,
            homeTarget.cellX * CELL_PIXELS + CELL_PIXELS / 2,
            homeTarget.cellY * CELL_PIXELS + CELL_PIXELS / 2,
            0, 0, 0, 0,
          ],
        });
        selectionCommands += homeGuard.length;
        contextualOrders += 1;
        retargetCycles += 1;
      }
    }
    if (commands.length > 0) {
      submitCommands(handle, snapshot.tick + 1, commands);
      commandBatches += 1;
    }
    const requested = Math.min(
      mission.number === 4 && mission.variant === "west-b" && hostiles.length <= 12
        ? 10
        : mission.number === 5 && mission.variant === "west-b"
          ? 60
          : mission.number === 5
            ? 60
            : TICKS_PER_ORDER,
      MAX_TICKS - snapshot.tick,
    );
    const advanced = advance(handle, requested);
    snapshot = readSnapshot(handle);
    assert.equal(snapshot.tick, currentTick, "snapshot tick differs from the ABI advance count");
    if (advanced === 0 && !snapshot.terminal) assert.fail("engine stopped before reaching a terminal state");
  }
  finalSnapshot = snapshot;

  if (missionFiveWestBStrategy) {
    if (trace) console.error(JSON.stringify({ westBShuttleSummary: {
      factCaptureTick: missionFiveShuttleFactCaptureTick,
      factSaleTick: missionFiveShuttleFactSaleTick,
      factSaleFunds: missionFiveShuttleFactSaleFunds,
      factGoneTick: missionFiveShuttleFactGoneTick,
      factGoneFunds: missionFiveShuttleFactGoneFunds,
      refund: missionFiveShuttleFactGoneFunds === undefined
        ? undefined : missionFiveShuttleFactGoneFunds - missionFiveShuttleFactSaleFunds,
      factCrew: [...missionFiveShuttleFactCrew.values()],
      phase: missionFiveShuttlePhase,
      engineerStarts: missionFiveShuttleEngineerStarts,
      engineers: [...missionFiveShuttleEngineers.entries()],
      assignments: [...missionFiveShuttleAssignments.entries()],
      captures: missionFiveShuttleCaptures,
      huntTriggeredTick: missionFiveHuntTriggeredTick,
      footReservePhase: missionFiveFootReservePhase,
      footReserveRouteStage: missionFiveFootReserveRouteStage,
      footReserveStagingTick: missionFiveFootReserveStagingTick,
      footReserveStagedEngineers: missionFiveFootReserveStagedEngineers,
      cleanupBatchTick: missionFiveWestBCleanupBatchTick,
      cleanupBatchSize: missionFiveWestBCleanupBatchSize,
      terminalTick: finalSnapshot.tick,
      finalFunds: finalSnapshot.sidebar.credits + finalSnapshot.sidebar.tiberium,
    } }));
    assert.equal(missionFiveWestBEngineerProductionStarted, 5,
      "West-B did not prebuild exactly five engineers");
    assert.ok(missionFiveWestBEngineerKey !== undefined,
      "West-B did not designate the primary factory-capture engineer");
    assert.equal(missionFiveWestBEngineerPhase, "captured",
      "West-B primary engineer did not complete the factory capture");
    assert.equal(missionFiveShuttleEngineers.size, 4,
      "West-B did not retain exactly four prebuilt reserve engineers");
    assert.ok(!missionFiveShuttleEngineers.has(missionFiveWestBEngineerKey),
      "West-B primary engineer was counted as a reserve engineer");
    assert.equal(missionFiveShuttleEngineerStarts, 0,
      "West-B queued an engineer after capturing the factory");
    assert.ok(missionFiveShuttleFactCaptureTick !== undefined,
      "West-B did not capture the Nod factory");
    assert.ok(missionFiveShuttleFactSaleTick !== undefined
      && missionFiveShuttleFactCaptureTick <= missionFiveShuttleFactSaleTick,
    "West-B sold the Nod factory before its capture was observed");
    assert.ok(missionFiveShuttleFactGoneTick !== undefined
      && missionFiveShuttleFactSaleTick < missionFiveShuttleFactGoneTick,
    "West-B factory sale did not complete after the sale order");
    assert.equal(missionFiveShuttleFactGoneFunds - missionFiveShuttleFactSaleFunds, 2_500,
      "West-B factory sale refund changed");
    assert.ok([...missionFiveShuttleEngineers.values()].every(({ tick }) => (
      tick < missionFiveShuttleFactCaptureTick
    )), "West-B observed a reserve engineer produced after the factory capture");
    assert.equal(missionFiveFootReservePhase, "staged",
      "West-B reserve engineers did not reach their staging area");
    assert.ok(missionFiveFootReserveStagingTick !== undefined,
      "West-B did not record reserve-engineer staging");
    assert.ok(missionFiveFootReserveStagingTick < missionFiveShuttleFactCaptureTick,
      "West-B reserve engineers staged after the factory capture");
    assert.equal(missionFiveFootReserveStagedEngineers.length, 4,
      "West-B did not stage all four reserve engineers");
    assert.ok(missionFiveFootReserveStagedEngineers.every(({ strength, maxStrength }) => (
      strength === maxStrength
    )), "West-B reserve engineers did not reach staging at full strength");
    assert.equal(missionFiveShuttleAssignments.size, 4,
      "West-B did not assign all four reserve engineers to linked structures");
    assert.equal(new Set(missionFiveShuttleAssignments.values()).size, 4,
      "West-B reserve engineers did not receive unique linked-structure assignments");
    assert.ok([...missionFiveShuttleAssignments.keys()].every((key) => (
      missionFiveShuttleEngineers.has(key)
    )), "West-B assigned a non-reserve engineer to a linked structure");
    assert.deepEqual(
      missionFiveShuttleCaptures.map(({ typeName, cellX, cellY }) => (
        `${typeName}:${cellX}:${cellY}`
      )),
      ["PROC:47:22", "NUKE:47:18", "NUKE:49:17", "AFLD:42:18"],
      "prebuilt foot reserve did not capture every remaining Hunt-linked structure",
    );
    assert.ok(missionFiveHuntTriggeredTick !== undefined
      && missionFiveHuntTriggeredTick >= Math.max(...missionFiveShuttleCaptures.map(({ tick }) => tick)),
    "West-B triggered Hunt before completing the four linked captures");
    assert.ok(missionFiveWestBCleanupBatchTick !== undefined,
      "West-B did not assemble its post-Hunt cleanup batch");
    assert.ok(missionFiveWestBCleanupBatchSize >= 20,
      "West-B post-Hunt cleanup batch was smaller than 20 units");
  }
  const gameOverEvents = events.filter((event) => event.type === EVENT_GAME_OVER);
  const outcomeEvents = events.filter((event) => event.type === EVENT_CAMPAIGN_OUTCOME);
  const eastBLoseDiagnosis = mission.number === 8 && mission.variant === "east-b" ? {
    loseHint: missionEightState.eastBLoseHint
      ?? (missionEightState.eastBNeutralDeaths.length >= 9 ? "civ-nine-neutral-unit-deaths"
        : missionEightState.eastBMoebiusMissingTick !== undefined ? "los3-moebius"
        : missionEightState.eastBHospitalMissingTick !== undefined ? "los3-hosp"
        : "unknown"),
    neutralDeaths: missionEightState.eastBNeutralDeaths.length,
    neutralDeathTicks: missionEightState.eastBNeutralDeaths.slice(0, 12),
    minimumNeutralUnits: missionEightState.minimumNeutralUnits,
    initialNeutralUnits: missionEightState.initialNeutralUnitKeys.size,
    hospitalMin: missionEightState.hospitalMinimumStrength,
    moebiusMin: missionEightState.moebiusMinimumStrength,
    hospitalMissingTick: missionEightState.eastBHospitalMissingTick,
    moebiusMissingTick: missionEightState.eastBMoebiusMissingTick,
    transportSightings: missionEightState.transportSightings.size,
    assaultTick: missionEightState.assaultTick,
    routeStage: missionEightState.routeStage,
    producedTanks: missionEightState.eastBProducedTankKeys.size,
  } : undefined;
  const terminalSummary = JSON.stringify({
    tick: finalSnapshot.tick,
    productionStarts,
    repairOrders,
    credits: finalSnapshot.sidebar.credits,
    stats: finalSnapshot.stats,
    ...(eastBLoseDiagnosis ? { eastBLoseDiagnosis } : {}),
    friendly: rootCombatants(finalSnapshot, HOUSE_GDI).map(({ typeName, id, strength, cellX, cellY }) => ({ typeName, id, strength, cellX, cellY })),
    hostile: rootCombatants(finalSnapshot, HOUSE_NOD).map(({ typeName, id, strength, cellX, cellY }) => ({ typeName, id, strength, cellX, cellY })),
  });
  assert.equal(gameOverEvents.length, 1, `mission did not emit exactly one authoritative game-over event: ${terminalSummary}`);
  assert.equal(outcomeEvents.length, 1, `mission did not emit exactly one campaign outcome: ${terminalSummary}`);
  const gameOver = gameOverEvents[0];
  const outcome = outcomeEvents[0];
  assert.equal(gameOver.flags & 1, 0, `GDI Mission ${mission.number} unexpectedly ended as multiplayer`);
  assert.ok(gameOver.flags & 2, "game-over event does not identify the human player");
  if (mission.number === 8 && mission.variant === "east-b" && !(gameOver.flags & 4)) {
    console.error(JSON.stringify({
      eastBGameOver: {
        tick: gameOver.tick,
        flags: gameOver.flags,
        won: Boolean(gameOver.flags & 4),
        movieName: gameOver.text1,
        afterScoreMovie: gameOver.text2,
        args: gameOver.args,
      },
      eastBLoseDiagnosis,
    }));
  }
  assert.ok(gameOver.flags & 4, `GDI Mission ${mission.number} ended without a win: ${terminalSummary}`);
  assert.ok(outcome.flags & 4, "campaign outcome is not a win");
  assert.equal(outcome.tick, gameOver.tick, "campaign outcome and game-over ticks differ");
  assert.equal(outcome.args[4], mission.scenario, `campaign outcome scenario is not GDI Mission ${mission.number}`);
  assert.equal(outcome.args[5], HOUSE_GDI, "campaign outcome house is not GDI");
  assert.equal(outcome.text1, mission.scenarioRoot, `campaign outcome scenario root is not ${mission.scenarioRoot}`);
  if (mission.number === 7) {
    assert.ok(events.indexOf(outcome) < events.indexOf(gameOver),
      "GDI Mission 7 campaign outcome was not emitted before game over");
    assert.equal(outcome.args[1], mission.nukePieces,
      "GDI Mission 7 campaign outcome did not preserve carried nuke pieces");
    assert.equal(outcome.args[2], -1,
      "GDI Mission 7 campaign outcome retained the consumed sabotage marker");
    assert.equal(gameOver.args[4], -1,
      "GDI Mission 7 game-over event retained the consumed sabotage marker");
    assert.equal(gameOver.text1, "PINTLE", "GDI Mission 7 win movie changed");
    assert.equal(gameOver.text2, "", "GDI Mission 7 unexpectedly emitted an after-score movie");
  }
  assert.ok(finalSnapshot.terminal, "final snapshot is not terminal");
  assert.equal(finalSnapshot.tick, gameOver.tick, "terminal snapshot and game-over ticks differ");
  assert.equal(advance(handle, 1), 0, "terminal engine accepted another simulation tick");

  const finalFriendly = rootCombatants(finalSnapshot, HOUSE_GDI).length;
  const remainingHostiles = rootCombatants(finalSnapshot, HOUSE_NOD);
  const finalHostiles = remainingHostiles.length;
  const finalProtectedVillageCount = finalSnapshot.objects.filter((object) => (
    object.owner === HOUSE_NEUTRAL
    && object.subObject === 0
    && object.type === 4
    && object.strength > 0
    && missionFourProtectedVillageCells.has(`${object.cellX}:${object.cellY}`)
  )).length;
  const stats = finalSnapshot.stats;
  if (mission.number === 3) {
    assert.equal(initialFriendly, 12, "GDI Mission 3 initial counted force changed");
    assert.equal(initialHostiles, 63, "GDI Mission 3 initial counted Nod force changed");
    assert.ok(deploymentOrders >= 1, "GDI Mission 3 acceptance did not deploy the MCV");
    assert.equal(startedMissionThreeStructures.size, 3, "GDI Mission 3 acceptance did not start the full core base");
    assert.ok(placementStarts >= 3, "GDI Mission 3 acceptance did not enter placement for each core structure");
    assert.ok(placements >= 3, "GDI Mission 3 acceptance did not place each core structure");
    assert.ok(infantryProductionStarts > 0, "GDI Mission 3 acceptance did not produce infantry");
    assert.equal(missionThreeScoutStage, missionThreeScoutRoute.length, "GDI Mission 3 scout did not complete its route");
    assert.ok(missionThreeScoutArrivalTicks[0] < 4_500, "GDI Mission 3 scout reached the first timer-cancel cell too late");
    assert.ok(missionThreeScoutArrivalTicks[1] < 7_200, "GDI Mission 3 scout reached the second timer-cancel cell too late");
    assert.equal(missionThreeRouteStage, missionThreeAssaultRoute.length, "GDI Mission 3 strike force did not complete its assault route");
    assert.ok(missionThreeAssaultStartedTick !== undefined, "GDI Mission 3 never began its base assault");
    assert.equal(finalHostiles, 0, "GDI Mission 3 won with counted Nod combatants still present");
  }
  if (mission.number === 4) {
    const expectedInitialHostiles = {
      "west-a": 32,
      "west-b": 35,
      "east-a": 40,
    }[mission.variant];
    assert.equal(initialFriendly, 11, `GDI Mission 4 ${mission.variant} initial counted force changed`);
    assert.equal(initialHostiles, expectedInitialHostiles,
      `GDI Mission 4 ${mission.variant} initial counted Nod force changed`);
    if (mission.objective === "extract") {
      assert.equal(missionFourRouteStage, mission.route.length,
        `GDI Mission 4 ${mission.variant} extraction force did not complete its route`);
      assert.equal(missionFourRouteArrivalTicks.length, mission.route.length,
        `GDI Mission 4 ${mission.variant} did not record every route arrival`);
      assert.ok(finalFriendly > 0, `GDI Mission 4 ${mission.variant} won without a surviving GDI force`);
      assert.ok(finalHostiles > 0,
        `GDI Mission 4 ${mission.variant} unexpectedly required eliminating the full Nod force`);
    }
    if (mission.variant === "east-a") {
      assert.ok(missionFourCargoLoadIssued, "GDI Mission 4 east-a never issued its cargo load order");
      assert.ok(missionFourCargoSealed, "GDI Mission 4 east-a never confirmed its cargo was loaded");
      assert.ok(missionFourCargoUnloadIssued, "GDI Mission 4 east-a never issued its cargo unload order");
      assert.ok(missionFourCargoUnloaded, "GDI Mission 4 east-a never confirmed its cargo was unloaded");
      assert.ok(missionFourVanguardStage >= 6,
        "GDI Mission 4 east-a vanguard did not reach the eastern staging area");
    }
    if (mission.variant === "west-b") {
      assert.equal(finalHostiles, 0, "GDI Mission 4 west-b won with counted Nod combatants still present");
      assert.equal(initialProtectedVillageCount, missionFourProtectedVillageCells.size,
        "GDI Mission 4 west-b did not start with exactly four protected village structures");
      assert.equal(initialProtectedVillageCells.size, missionFourProtectedVillageCells.size,
        "GDI Mission 4 west-b protected village coordinates changed");
      assert.ok(finalProtectedVillageCount > 0,
        "GDI Mission 4 west-b won without a surviving protected village structure");
      assert.ok(peakFriendly > initialFriendly,
        "GDI Mission 4 west-b acceptance did not receive the authored GDI reinforcements");
    }
  }
  if (mission.number === 5) {
    const expectedInitialFriendly = mission.variant === "west-b" ? 20 : 18;
    const expectedInitialHostiles = mission.variant === "west-b" ? 44 : 50;
    const expectedReliefForce = mission.variant === "west-b" ? 13 : 11;
    assert.equal(initialFriendly, expectedInitialFriendly,
      `GDI Mission 5 ${mission.variant} initial counted force changed`);
    assert.equal(initialHostiles, expectedInitialHostiles,
      `GDI Mission 5 ${mission.variant} initial counted Nod force changed`);
    assert.equal(missionFiveInitialForceKeys.size, expectedReliefForce,
      `GDI Mission 5 ${mission.variant} protected relief force changed`);
    assert.equal(missionFiveReliefStage, mission.reliefRoute.length,
      `GDI Mission 5 ${mission.variant} relief force did not complete its link-up route`);
    assert.equal(missionFiveReliefArrivalTicks.length, mission.reliefRoute.length,
      `GDI Mission 5 ${mission.variant} did not record every relief-route arrival`);
    assert.ok(missionFiveRelievedTick !== undefined,
      `GDI Mission 5 ${mission.variant} never completed the base link-up`);
    assert.ok(repairOrders >= 7,
      `GDI Mission 5 ${mission.variant} did not repair the authored damaged base`);
    assert.ok(missionFiveBaseRepairedTick !== undefined,
      `GDI Mission 5 ${mission.variant} never restored the damaged base`);
    assert.ok(infantryProductionStarts > 0,
      `GDI Mission 5 ${mission.variant} did not produce infantry`);
    assert.ok(vehicleProductionStarts > 0,
      `GDI Mission 5 ${mission.variant} did not produce vehicles`);
    assert.ok(missionFiveCompletedInfantryKeys.size > 0,
      `GDI Mission 5 ${mission.variant} did not observe completed infantry production`);
    assert.ok(missionFiveCompletedVehicleKeys.size > 0,
      `GDI Mission 5 ${mission.variant} did not observe completed vehicle production`);
    assert.ok(missionFiveAssaultStartedTick !== undefined,
      `GDI Mission 5 ${mission.variant} never began its Nod-base assault`);
    assert.ok(missionFiveRelievedTick < missionFiveAssaultStartedTick,
      `GDI Mission 5 ${mission.variant} attacked before completing the base link-up`);
    assert.ok(missionFiveBaseRepairedTick < missionFiveAssaultStartedTick,
      `GDI Mission 5 ${mission.variant} attacked before restoring the damaged base`);
    if (mission.crate) {
      assert.ok(missionFiveCrateCollectedTick !== undefined,
        `GDI Mission 5 ${mission.variant} never collected its authored campaign crate`);
      assert.ok(missionFiveCrateCollectedTick < missionFiveAssaultStartedTick,
        `GDI Mission 5 ${mission.variant} attacked before collecting its authored campaign crate`);
    }
    assert.ok(missionFiveAssaultWaveCount > 0,
      `GDI Mission 5 ${mission.variant} never launched an assault wave`);
    assert.ok(missionFiveHuntTriggeredTick !== undefined,
      `GDI Mission 5 ${mission.variant} never triggered the authored Nod counterattack`);
    assert.ok(missionFiveHuntTriggeredTick < finalSnapshot.tick,
      `GDI Mission 5 ${mission.variant} did not continue after triggering the authored Nod counterattack`);
    assert.equal(finalHostiles, 0,
      `GDI Mission 5 ${mission.variant} won with counted Nod combatants still present`);
    assert.ok(finalFriendly > 0,
      `GDI Mission 5 ${mission.variant} won without a surviving GDI force`);
    assert.ok(peakFriendly > initialFriendly,
      `GDI Mission 5 ${mission.variant} acceptance did not assemble a larger strike force`);
  }
  if (mission.number === 6) {
    const survivingCommando = finalSnapshot.objects.find((object) => (
      object.owner === HOUSE_GDI
      && object.subObject === 0
      && object.typeName === "RMBO"
      && object.strength > 0
    ));
    assert.equal(initialFriendly, 2, "GDI Mission 6 initial counted insertion force changed");
    assert.equal(initialHostiles, 64, "GDI Mission 6 initial counted Nod force changed");
    assert.equal(missionSixSamDestroyedTicks.length, mission.samSites.length,
      "GDI Mission 6 did not destroy both authored southern SAM sites");
    assert.ok(missionSixTransportLoadTick !== undefined,
      "GDI Mission 6 never confirmed the Commando aboard the Chinook");
    assert.ok(missionSixTransportLandingTick !== undefined,
      "GDI Mission 6 never confirmed the loaded Chinook landed across the river");
    assert.ok(missionSixTransportUnloadTick !== undefined,
      "GDI Mission 6 never confirmed the Commando left the Chinook");
    assert.ok(missionSixTransportLoadTick < missionSixTransportLandingTick
      && missionSixTransportLandingTick <= missionSixTransportUnloadTick,
    "GDI Mission 6 Chinook load, landing, and unload transitions are out of order");
    assert.equal(missionSixRouteStage, mission.infiltrationRoute.length,
      "GDI Mission 6 Commando did not complete the eastern infiltration route");
    assert.equal(missionSixRouteArrivalTicks.length, mission.infiltrationRoute.length,
      "GDI Mission 6 did not record every infiltration-route arrival");
    assert.ok(missionSixAirstripSelectionTick !== undefined,
      "GDI Mission 6 never selected the Commando for the Airstrip objective");
    assert.ok(missionSixSabotageActionObserved,
      "GDI Mission 6 never exposed the public Sabotage action on the Airstrip");
    assert.ok(missionSixSabotageOrderTick !== undefined
      && missionSixAirstripSelectionTick < missionSixSabotageOrderTick,
    "GDI Mission 6 did not issue Airstrip sabotage after observing its public action");
    assert.equal(missionSixPhase, "sabotage",
      "GDI Mission 6 reached its terminal state outside the sabotage phase");
    assert.equal(outcome.args[2], STRUCT_AIRSTRIP,
      "GDI Mission 6 campaign outcome did not carry the sabotaged Airstrip type");
    assert.equal(gameOver.args[4], STRUCT_AIRSTRIP,
      "GDI Mission 6 game-over event did not carry the sabotaged Airstrip type");
    assert.ok(!remainingHostiles.some((hostile) => (
      hostile.typeName === mission.airstrip.typeName
      && hostile.cellX === mission.airstrip.cellX
      && hostile.cellY === mission.airstrip.cellY
    )), "GDI Mission 6 won while the target Airstrip remained intact");
    assert.ok(survivingCommando,
      "GDI Mission 6 won without the Commando surviving the sabotage");
    assert.ok(finalHostiles > 0,
      "GDI Mission 6 acceptance eliminated Nod instead of completing the sabotage objective");
    assert.ok(stats.unitsKilled < 20,
      "GDI Mission 6 triggered the authored twenty-kill Nod hunt instead of infiltrating");
    assert.equal(stats.buildingsKilled, 3,
      "GDI Mission 6 destroyed structures beyond the two SAM sites and target Airstrip");
  }
  if (mission.number === 7) {
    const state = missionSevenState;
    const samDestroyedTicks = [...state.samDeathTicks.values()];
    assert.equal(missionSevenSabotagedSiteObserved, false,
      "GDI Mission 7 carried-sabotage Refinery reappeared during play");
    assert.deepEqual(missionSevenReinforcementTicks, {
      infantry: 120,
      jeep: 390,
      firstTank: 840,
      secondTank: 1_020,
      mcv: 1_740,
    }, "GDI Mission 7 authored reinforcement timings changed");
    assert.equal(deploymentOrders, 1, "GDI Mission 7 did not deploy its reinforced MCV exactly once");
    assert.equal(placementStarts, 5, "GDI Mission 7 did not enter placement for each core structure");
    assert.equal(placements, 5, "GDI Mission 7 did not place each core structure");
    assert.deepEqual(state.placedSites.map(({ assetName, cellX, cellY }) => (
      `${assetName}:${cellX}:${cellY}`
    )), [
      "NUKE:19:43",
      "PROC:13:39",
      "PYLE:17:43",
      "GTWR:17:39",
      "WEAP:16:42",
    ], "GDI Mission 7 core base layout changed");

    assert.ok(state.pyleSale.orderTick < state.pyleSale.goneTick,
      "GDI Mission 7 Barracks sale did not complete after its order");
    assert.equal(state.pyleSale.fundsAfter - state.pyleSale.fundsBefore, 150,
      "GDI Mission 7 Barracks sale refund changed");
    assert.ok(state.cySale.orderTick >= state.samDeathTicks.get("48:31") + 30,
      "GDI Mission 7 sold the Construction Yard before clearing the eastern SAM site");
    assert.ok(state.cySale.orderTick < state.cySale.goneTick,
      "GDI Mission 7 Construction Yard sale did not complete after its order");
    assert.equal(state.cySale.fundsAfter - state.cySale.fundsBefore, 2_500,
      "GDI Mission 7 Construction Yard sale refund changed");
    assert.equal(state.cySale.crew.length, 5,
      "GDI Mission 7 Construction Yard survivor count changed");
    assert.ok(state.cySale.crew.every((typeName) => (
      typeName === "E1" || typeName === "C1" || typeName === "C7" || typeName === "E6"
    )), "GDI Mission 7 Construction Yard emitted an invalid survivor type");
    assert.equal(state.cySale.crew.filter((typeName) => typeName === "E6").length, 1,
      "GDI Mission 7 Construction Yard did not yield exactly one Engineer");

    assert.ok(state.engineer.observedTick >= state.cySale.goneTick,
      "GDI Mission 7 Engineer appeared before the Construction Yard sale completed");
    assert.ok(state.engineer.minimumStrength > 0,
      "GDI Mission 7 Engineer did not survive the capture route");
    assert.equal(state.engineer.deathTick, undefined,
      "GDI Mission 7 Engineer died before capturing the Hand of Nod");
    assert.equal(state.engineer.routeStage, missionSevenEngineerRoute.length,
      "GDI Mission 7 Engineer did not complete its protected capture route");
    assert.equal(state.engineer.progress.length, missionSevenEngineerRoute.length,
      "GDI Mission 7 did not record every Engineer route arrival");
    assert.ok(state.engineer.stagedTick < state.engineer.captureOrderTick,
      "GDI Mission 7 Engineer did not stage before its capture order");
    assert.ok(state.engineer.captureOrders.length > 0,
      "GDI Mission 7 never issued a Hand of Nod capture order");
    assert.ok(state.engineer.captureOrderTick <= state.engineer.captureTick,
      "GDI Mission 7 observed the Hand capture before issuing its order");
    assert.ok(state.capturedHand && state.capturedHand.tick === state.engineer.captureTick,
      "GDI Mission 7 did not observe the captured Hand of Nod");
    assert.ok(state.capturedHand.strength > 0
      && state.capturedHand.strength <= state.capturedHand.maxStrength,
    "GDI Mission 7 captured Hand of Nod has invalid health");
    assert.deepEqual([state.capturedHand.cellX, state.capturedHand.cellY], [44, 13],
      "GDI Mission 7 captured the wrong Hand of Nod");

    assert.ok(state.engineer.captureTick <= state.weapSale.orderTick,
      "GDI Mission 7 sold the Weapons Factory before capturing the Hand of Nod");
    assert.ok(state.weapSale.orderTick < state.weapSale.goneTick,
      "GDI Mission 7 Weapons Factory sale did not complete after its order");
    assert.equal(state.weapSale.fundsAfter - state.weapSale.fundsBefore, 1_000,
      "GDI Mission 7 Weapons Factory sale refund changed");
    assert.equal(state.weapSale.crew.length, 5,
      "GDI Mission 7 Weapons Factory survivor count changed");
    assert.ok(state.weapSale.crew.every((typeName) => (
      typeName === "E1" || typeName === "C1" || typeName === "C7"
    )), "GDI Mission 7 Weapons Factory emitted an invalid survivor type");

    assert.equal(state.wave, 2, "GDI Mission 7 did not launch both authored assault waves");
    assert.deepEqual(state.waves.map(({ wave, size }) => [wave, size]), [[1, 2], [2, 5]],
      "GDI Mission 7 assault-wave composition changed");
    assert.equal(state.waves[0].tick, state.assaultTick,
      "GDI Mission 7 first wave and assault start ticks differ");
    assert.equal(state.waves[1].routeStage, 3,
      "GDI Mission 7 second wave launched outside the eastern staging point");
    assert.ok(state.waves[0].tick < state.waves[1].tick,
      "GDI Mission 7 assault waves launched out of order");
    assert.equal(state.postCyTankStarts, 6,
      "GDI Mission 7 did not produce all six post-sale Medium Tanks");
    assert.equal(state.postCyJeepStarts, 1,
      "GDI Mission 7 did not produce its post-sale Jeep scout");
    assert.equal(vehicleProductionStarts, 7,
      "GDI Mission 7 vehicle production count changed");
    assert.ok(state.waves[1].tick < state.sixthTank.queueTick
      && state.sixthTank.queueTick < state.sixthTank.completedTick,
    "GDI Mission 7 sixth Medium Tank lifecycle is out of order");
    assert.ok(state.sixthTank.key !== undefined,
      "GDI Mission 7 did not observe the sixth Medium Tank complete");
    assert.ok(state.sixthTank.completedTick < state.jeep.queueTick
      && state.jeep.queueTick < state.jeep.completedTick,
    "GDI Mission 7 Jeep lifecycle is out of order");
    assert.ok(state.jeep.key !== undefined,
      "GDI Mission 7 did not observe the Jeep complete");

    assert.equal(state.samDeathTicks.size, missionSevenSamSites.length,
      "GDI Mission 7 did not destroy all four authored SAM sites");
    assert.deepEqual([...state.samDeathTicks.keys()].toSorted(),
      ["22:13", "44:18", "48:31", "54:18"],
      "GDI Mission 7 destroyed-SAM site set changed");
    assert.equal(state.allSamsDeadTick, Math.max(...samDestroyedTicks),
      "GDI Mission 7 all-SAMs-cleared tick is inconsistent");
    assert.ok(state.airstrike.readyTicks.length > 0,
      "GDI Mission 7 never exposed a ready Air Strike");
    assert.ok(state.airstrike.orders.length > 0,
      "GDI Mission 7 never ordered an Air Strike");
    assert.ok(state.airstrike.discharges.length > 0,
      "GDI Mission 7 never observed an Air Strike discharge");
    assert.ok(state.airstrike.orders[0].tick >= state.allSamsDeadTick,
      "GDI Mission 7 ordered an Air Strike before clearing every SAM site");
    assert.ok(state.airstrike.discharges[0].effectTick
      > state.airstrike.discharges[0].orderTick,
    "GDI Mission 7 Air Strike effect preceded its order");

    assert.equal(state.handProduction.orders.length, 4,
      "GDI Mission 7 did not issue all captured-Hand infantry orders");
    assert.deepEqual(state.handProduction.orders.map(({ assetName }) => assetName),
      ["E3", "E3", "E3", "E4"],
      "GDI Mission 7 captured-Hand production composition changed");
    assert.equal(state.handProduction.keys.size, state.handProduction.orders.length,
      "GDI Mission 7 did not observe every captured-Hand infantry completion");
    assert.deepEqual(state.handProduction.completions.map(({ typeName }) => typeName),
      state.handProduction.orders.map(({ assetName }) => assetName),
      "GDI Mission 7 captured-Hand completions did not match its production orders");
    assert.equal(state.handProduction.arrivals.length,
      state.handProduction.orders.length * missionSevenHandProductionRoute.length,
    "GDI Mission 7 captured-Hand infantry did not complete both staging legs");
    assert.ok([...state.handProduction.stages.values()].every((stage) => (
      stage === missionSevenHandProductionRoute.length
    )),
    "GDI Mission 7 captured-Hand infantry remained short of the assault staging area");
    assert.equal(infantryProductionStarts, 8,
      "GDI Mission 7 infantry production count changed");
    assert.equal(productionStarts, 20,
      "GDI Mission 7 total production count changed");

    assert.equal(state.routeStage, missionSevenCoreRoute.length,
      "GDI Mission 7 strike force did not complete its Nod-base route");
    assert.equal(state.routeProgress.length, missionSevenCoreRoute.length,
      "GDI Mission 7 did not record every Nod-base route objective");
    assert.deepEqual(state.routeProgress.map(({ typeName, kind, cellX, cellY }) => (
      `${typeName ?? kind}:${cellX}:${cellY}`
    )), missionSevenCoreRoute.map(({ typeName, kind, cellX, cellY }) => (
      `${typeName ?? kind}:${cellX}:${cellY}`
    )), "GDI Mission 7 Nod-base route progression changed");
    assert.ok(state.factDestroyedTick > state.assaultTick,
      "GDI Mission 7 did not observe the authored Construction Yard destruction");
    assert.ok(state.airstripDestroyedTick > state.assaultTick,
      "GDI Mission 7 did not observe the authored Airstrip destruction");
    assert.equal(finalHostiles, 0,
      "GDI Mission 7 won with counted Nod combatants still present");
    assert.ok(finalFriendly > 0,
      "GDI Mission 7 won without a surviving GDI force");
    assert.ok(peakFriendly > initialFriendly,
      "GDI Mission 7 never observed its authored reinforcements and production");
  }
  if (mission.number === 8) {
    const state = missionEightState;
    const route = missionEightRoutes[mission.variant];
    assert.equal(finalHostiles, 0,
      `GDI Mission 8 ${mission.variant} won with counted Nod combatants still present`);
    assert.ok(finalFriendly > 0,
      `GDI Mission 8 ${mission.variant} won without a surviving GDI force`);
    assert.ok(state.assaultTick !== undefined,
      `GDI Mission 8 ${mission.variant} never launched its staged assault`);
    assert.equal(state.routeStage, route.length,
      `GDI Mission 8 ${mission.variant} strike force did not complete its authored sweep route`);
    assert.equal(state.routeProgress.length, route.length,
      `GDI Mission 8 ${mission.variant} did not record every sweep-route arrival`);
    assert.deepEqual(state.routeProgress.map(({ label, cellX, cellY }) => `${label}:${cellX}:${cellY}`),
      route.map(({ label, cellX, cellY }) => `${label}:${cellX}:${cellY}`),
      `GDI Mission 8 ${mission.variant} sweep-route progression changed`);
    assert.ok(productionStarts > 0,
      `GDI Mission 8 ${mission.variant} did not use the public production queue`);
    assert.ok(state.productionCompletions.length > 0,
      `GDI Mission 8 ${mission.variant} did not observe completed production`);
    assert.equal(state.samDeathTicks.size, missionEightSamSites[mission.variant].length,
      `GDI Mission 8 ${mission.variant} did not destroy every authored SAM site`);
    assert.ok(state.airstrike.readyTicks.length > 0,
      `GDI Mission 8 ${mission.variant} never exposed a ready Air Strike`);
    assert.ok(state.airstrike.orders.length > 0,
      `GDI Mission 8 ${mission.variant} never ordered an Air Strike`);
    assert.ok(state.airstrike.discharges.length > 0,
      `GDI Mission 8 ${mission.variant} never observed an Air Strike discharge`);
    assert.ok(state.airstrike.orders[0].tick >= state.allSamsDeadTick,
      `GDI Mission 8 ${mission.variant} ordered an Air Strike before clearing every SAM site`);
    if (mission.variant === "east-a") {
      assert.ok(repairOrders >= 6, "GDI Mission 8 east-a did not repair its authored damaged base");
      assert.equal(state.scoutStage, missionEightEastAScoutRoute.length,
        "GDI Mission 8 east-a scout did not complete the authored trigger-cancellation route");
      assert.equal(state.scoutArrivalTicks.length, missionEightEastAScoutRoute.length,
        "GDI Mission 8 east-a did not record every scout-route arrival");
      assert.ok(state.delxEnteredTick !== undefined && state.delxEnteredTick < 15_300,
        "GDI Mission 8 east-a did not enter the delx band before the XXXX timed attack");
      assert.ok(state.delyEnteredTick !== undefined && state.delyEnteredTick < 8_100,
        "GDI Mission 8 east-a did not enter the dely band before the YYYY timed attack");
      assert.ok(infantryProductionStarts > 0,
        "GDI Mission 8 east-a did not reinforce its damaged field army with infantry");
    } else {
      const survivingNeutralUnits = finalSnapshot.objects.filter((object) => (
        object.owner === HOUSE_NEUTRAL && object.subObject === 0
        && object.type === 1 && object.strength > 0
      ));
      const hospital = finalSnapshot.objects.find((object) => (
        object.owner === HOUSE_GDI && object.type === 4 && object.typeName === "HOSP"
        && object.cellX === 3 && object.cellY === 60 && object.strength > 0
      ));
      const moebius = finalSnapshot.objects.find((object) => (
        object.owner === HOUSE_GDI && object.type === 1 && object.typeName === "MOEBIUS"
        && object.cellX === 6 && object.cellY === 60 && object.strength > 0
      ));
      assert.ok(hospital && state.hospitalMinimumStrength > 0,
        "GDI Mission 8 east-b won without preserving the authored hospital");
      assert.ok(moebius && state.moebiusMinimumStrength > 0,
        "GDI Mission 8 east-b won without preserving Dr. Moebius");
      assert.ok(survivingNeutralUnits.length >= state.initialNeutralUnitKeys.size - 8,
        "GDI Mission 8 east-b crossed its authored nine-civilian loss threshold");
      assert.ok(state.minimumNeutralUnits >= state.initialNeutralUnitKeys.size - 8,
        "GDI Mission 8 east-b temporarily crossed its authored nine-civilian loss threshold");
      assert.ok(state.transportSightings.size >= 2,
        "GDI Mission 8 east-b did not observe both authored timed Nod airlifts");
      assert.ok(deploymentOrders > 0,
        "GDI Mission 8 east-b never deployed its starting MCV");
      assert.deepEqual(state.structureStarts.map(({ assetName }) => assetName),
        ["NUKE", "PYLE", "PROC", "WEAP"],
        "GDI Mission 8 east-b core construction order changed");
      assert.deepEqual(state.placedSites.map(({ assetName }) => assetName),
        ["NUKE", "PYLE", "PROC", "WEAP"],
        "GDI Mission 8 east-b did not place every core structure");
      assert.ok(infantryProductionStarts > 0 && vehicleProductionStarts > 0,
        "GDI Mission 8 east-b did not produce both infantry and vehicles");
    }
    assert.ok(peakFriendly > initialFriendly,
      `GDI Mission 8 ${mission.variant} never grew its initial force`);
  }
  const commandTypes = mission.number === 3
    ? [
      "sidebar-start-construction",
      "sidebar-start-placement",
      "sidebar-place",
      ...(repairOrders > 0 ? ["structure-repair"] : []),
      "clear-selection",
      "select-object",
      "context-command-at-position",
    ]
    : mission.number === 2
      ? ["sidebar-start-construction", "structure-repair", "clear-selection", "select-object", "context-command-at-position"]
      : mission.number === 5
        ? [
          "sidebar-start-construction",
          "structure-repair",
          ...(missionFiveSoldStructureIds.size > 0 ? ["structure-sell"] : []),
          ...(missionFiveAirstrikeOrders.length > 0 ? ["superweapon-place"] : []),
          "clear-selection",
          "select-object",
          "context-command-at-position",
        ]
        : mission.number === 7
          ? [
            "sidebar-start-construction",
            "sidebar-start-placement",
            "sidebar-place",
            ...(repairOrders > 0 ? ["structure-repair"] : []),
            "structure-sell",
            "superweapon-place",
            "clear-selection",
            "select-object",
            "unit-stop",
            "context-command-at-position",
          ]
          : mission.number === 8
            ? [
              "sidebar-start-construction",
              ...(mission.variant === "east-b" ? ["sidebar-start-placement", "sidebar-place"] : []),
              ...(repairOrders > 0 ? ["structure-repair"] : []),
              "superweapon-place",
              "clear-selection",
              "select-object",
              "context-command-at-position",
            ]
      : ["clear-selection", "select-object", "context-command-at-position"];
  console.log(JSON.stringify({
    format: `cncweb-classic-freeware-mission-${mission.number === 4
      ? `four-${mission.variant}`
      : mission.number === 5
        ? `five-${mission.variant}`
        : mission.number === 6
          ? "six"
          : mission.number === 7
            ? "seven"
            : mission.number === 8
              ? `eight-${mission.variant}`
              : ["zero", "one", "two", "three"][mission.number]}-acceptance`,
    version: 1,
    packageId: manifest.package_id,
    packageRevision,
    missionId: mission.id,
    scenarioRoot: outcome.text1,
    ...(verifierDifficulty === undefined
      ? {}
      : { difficulty: difficultyNames[verifierDifficulty] }),
    won: true,
    terminal: true,
    tick: finalSnapshot.tick,
    simulatedSeconds: Number((finalSnapshot.tick / TICK_HZ).toFixed(3)),
    wallClockMs: Number((performance.now() - startedAt).toFixed(3)),
    movieAcknowledgements,
    commandBatches,
    selectionCommands,
    contextualOrders,
    retargetCycles,
    productionStarts,
    infantryProductionStarts,
    vehicleProductionStarts,
    repairOrders,
    deploymentOrders,
    placementStarts,
    placements,
    ...(mission.number === 2 ? { assaultTick: missionTwoAssaultTick } : {}),
    ...(mission.number === 3 ? {
      assaultTick: missionThreeAssaultStartedTick,
      assaultFallbackTick: missionThreeAssaultTick,
      scoutArrivalTicks: missionThreeScoutArrivalTicks,
    } : {}),
    ...(mission.number === 4 ? {
      variant: mission.variant,
      objective: mission.objective,
      routeArrivalTicks: missionFourRouteArrivalTicks,
      ...(mission.variant === "east-a" ? {
        cargo: {
          loadIssued: missionFourCargoLoadIssued,
          sealed: missionFourCargoSealed,
          unloadIssued: missionFourCargoUnloadIssued,
          unloaded: missionFourCargoUnloaded,
        },
        vanguardStage: missionFourVanguardStage,
      } : {}),
      ...(mission.variant === "west-b" ? {
        protectedVillage: {
          initial: initialProtectedVillageCount,
          final: finalProtectedVillageCount,
        },
      } : {}),
    } : {}),
    ...(mission.number === 5 ? {
      variant: mission.variant,
      assaultTick: missionFiveAssaultStartedTick,
      assaultFallbackTick: missionFiveAssaultTick,
      assaultForce: missionFiveAssaultForce,
      reliefArrivalTicks: missionFiveReliefArrivalTicks,
      relievedTick: missionFiveRelievedTick,
      baseRepairedTick: missionFiveBaseRepairedTick,
      assaultRouteArrivalTicks: missionFiveAssaultRouteArrivalTicks,
      assaultWaves: missionFiveAssaultWaveCount,
      huntTriggeredTick: missionFiveHuntTriggeredTick,
      productionCompletions: {
        infantry: missionFiveCompletedInfantryKeys.size,
        vehicles: missionFiveCompletedVehicleKeys.size,
      },
      ...(mission.crate ? { crateCollectedTick: missionFiveCrateCollectedTick } : {}),
      samSweepDestroyedTicks: missionFiveSamDestroyedTicks,
      airstrike: {
        readyTicks: missionFiveAirstrikeReadyTicks,
        orders: missionFiveAirstrikeOrders,
        discharges: missionFiveAirstrikeDischarges,
        pending: missionFiveAirstrikePending !== undefined,
      },
    } : {}),
    ...(mission.number === 6 ? {
      samDestroyedTicks: missionSixSamDestroyedTicks,
      transport: {
        loadTick: missionSixTransportLoadTick,
        landingTick: missionSixTransportLandingTick,
        unloadTick: missionSixTransportUnloadTick,
      },
      routeArrivalTicks: missionSixRouteArrivalTicks,
      sabotage: {
        selectionTick: missionSixAirstripSelectionTick,
        actionObserved: missionSixSabotageActionObserved,
        orderTick: missionSixSabotageOrderTick,
        structureType: outcome.args[2],
      },
    } : {}),
    ...(mission.number === 7 ? {
      sabotage: {
        structureType: mission.sabotagedStructure,
        siteObserved: missionSevenSabotagedSiteObserved,
      },
      reinforcementTicks: missionSevenReinforcementTicks,
      deploySite: missionSevenDeploySite,
      placedSites: missionSevenState.placedSites,
      assaultTick: missionSevenState.assaultTick,
      waves: missionSevenState.waves,
      sales: {
        barracks: {
          orderTick: missionSevenState.pyleSale.orderTick,
          goneTick: missionSevenState.pyleSale.goneTick,
          refund: missionSevenState.pyleSale.fundsAfter
            - missionSevenState.pyleSale.fundsBefore,
        },
        constructionYard: {
          orderTick: missionSevenState.cySale.orderTick,
          goneTick: missionSevenState.cySale.goneTick,
          refund: missionSevenState.cySale.fundsAfter
            - missionSevenState.cySale.fundsBefore,
          crew: missionSevenState.cySale.crew,
        },
        weaponsFactory: {
          orderTick: missionSevenState.weapSale.orderTick,
          goneTick: missionSevenState.weapSale.goneTick,
          refund: missionSevenState.weapSale.fundsAfter
            - missionSevenState.weapSale.fundsBefore,
          crew: missionSevenState.weapSale.crew,
        },
      },
      production: {
        postConstructionYardTankStarts: missionSevenState.postCyTankStarts,
        sixthTank: missionSevenState.sixthTank,
        postConstructionYardJeepStarts: missionSevenState.postCyJeepStarts,
        jeep: missionSevenState.jeep,
        capturedHandInfantry: {
          orders: missionSevenState.handProduction.orders,
          completions: missionSevenState.handProduction.completions,
          stages: Object.fromEntries(missionSevenState.handProduction.stages),
          arrivals: missionSevenState.handProduction.arrivals,
        },
      },
      samDestroyedTicks: Object.fromEntries(missionSevenState.samDeathTicks),
      allSamsDeadTick: missionSevenState.allSamsDeadTick,
      airstrike: {
        readyTicks: missionSevenState.airstrike.readyTicks,
        orders: missionSevenState.airstrike.orders,
        discharges: missionSevenState.airstrike.discharges,
        pending: missionSevenState.airstrike.pending !== undefined,
      },
      engineer: {
        observedTick: missionSevenState.engineer.observedTick,
        minimumStrength: missionSevenState.engineer.minimumStrength,
        routeStage: missionSevenState.engineer.routeStage,
        progress: missionSevenState.engineer.progress,
        stagedTick: missionSevenState.engineer.stagedTick,
        captureOrderTick: missionSevenState.engineer.captureOrderTick,
        captureOrders: missionSevenState.engineer.captureOrders,
        captureTick: missionSevenState.engineer.captureTick,
        guardOrderCount: missionSevenState.engineer.guardOrderCount,
        guardMinimumStrength: missionSevenState.engineer.guardMinimumStrength,
      },
      capturedHand: missionSevenState.capturedHand,
      routeStage: missionSevenState.routeStage,
      routeProgress: missionSevenState.routeProgress,
      factDestroyedTick: missionSevenState.factDestroyedTick,
      airstripDestroyedTick: missionSevenState.airstripDestroyedTick,
    } : {}),
    ...(mission.number === 8 ? {
      variant: mission.variant,
      deploySite: missionEightState.deploySite,
      structureStarts: missionEightState.structureStarts,
      placedSites: missionEightState.placedSites,
      productionOrders: missionEightState.productionOrders,
      productionCompletions: missionEightState.productionCompletions,
      repairs: missionEightState.repairedIds.size,
      scout: mission.variant === "east-a" ? {
        arrivalTicks: missionEightState.scoutArrivalTicks,
        delxEnteredTick: missionEightState.delxEnteredTick,
        delyEnteredTick: missionEightState.delyEnteredTick,
      } : undefined,
      protection: mission.variant === "east-b" ? {
        initialNeutralUnits: missionEightState.initialNeutralUnitKeys.size,
        minimumNeutralUnits: missionEightState.minimumNeutralUnits,
        hospitalMinimumStrength: missionEightState.hospitalMinimumStrength,
        moebiusMinimumStrength: missionEightState.moebiusMinimumStrength,
        transportSightings: [...missionEightState.transportSightings.values()],
      } : undefined,
      assaultTick: missionEightState.assaultTick,
      assaultWaves: missionEightState.assaultWave,
      southTransit: mission.variant === "east-a" ? {
        progress: missionEightState.southTransitProgress,
        secondWaveProgress: missionEightState.secondWaveTransitProgress,
        thirdWaveProgress: missionEightState.thirdWaveTransitProgress,
        finalGateEnteredTick: missionEightState.southFinalGateEnteredTick,
        finalGateBlockers: [...missionEightState.southFinalGateBlockers.values()],
        finalGateBlockerDrops: missionEightState.southFinalGateBlockerDrops,
        northReleaseTick: missionEightState.northReleaseTick,
        northReleased: missionEightState.northReleaseKeys.size,
        baseGuardReleaseTick: missionEightState.baseGuardReleaseTick,
        baseGuardsReleased: missionEightState.baseGuardReleaseKeys.size,
        westCleanupStartedTick: missionEightState.westCleanupStartedTick,
        westCleanupCompletedTick: missionEightState.westCleanupCompletedTick,
        westCleanupProgress: missionEightState.westCleanupProgress,
        productionGun: {
          minimumStrength: missionEightState.productionGunMinimumStrength,
          holdStartedTick: missionEightState.productionGunHoldStartedTick,
          holdLastStrength: missionEightState.productionGunHoldLastStrength,
          chargeTick: missionEightState.productionGunChargeTick,
          chargeStrength: missionEightState.productionGunChargeStrength,
        },
        targets: [...missionEightState.southWithdrawalTargets.values()],
        targetDeaths: [...missionEightState.southWithdrawalTargetDeaths.values()],
      } : undefined,
      routeProgress: missionEightState.routeProgress,
      samDestroyedTicks: Object.fromEntries(missionEightState.samDeathTicks),
      allSamsDeadTick: missionEightState.allSamsDeadTick,
      fact: mission.variant === "east-a" ? {
        initialStrength: missionEightState.factInitialStrength,
        minimumStrength: missionEightState.factMinimumStrength,
        deathTick: missionEightState.factDeathTick,
      } : undefined,
      postFactEconomy: mission.variant === "east-a" ? {
        sales: Object.fromEntries(Object.entries(missionEightState.postFactSales)
          .map(([typeName, sale]) => [typeName, sale ? {
            orderTick: sale.orderTick,
            goneTick: sale.goneTick,
            structure: sale.structure,
            fundsBefore: sale.fundsBefore,
            fundsAfter: sale.fundsAfter,
            refund: sale.refund,
            crew: sale.crew,
          } : undefined])),
        productionOrders: missionEightState.postFactProductionOrders,
        productionCompletions: missionEightState.postFactProductionCompletions,
        homeDefenseCohort: [...missionEightState.postFactHomeDefenseCohortKeys],
        homeDefenseAlive: missionEightState.postFactHomeDefenseKeys.size,
        cleanupCohort: [...missionEightState.postFactCleanupCohortKeys],
      } : undefined,
      airstrike: {
        readyTicks: missionEightState.airstrike.readyTicks,
        orders: missionEightState.airstrike.orders,
        discharges: missionEightState.airstrike.discharges,
        pending: missionEightState.airstrike.pending !== undefined,
      },
    } : {}),
    commandTypes,
    forces: {
      initialFriendly,
      initialHostiles,
      peakFriendly,
      peakHostiles,
      finalFriendly,
      finalHostiles,
      remainingHostiles: remainingHostiles.map(({ typeName, assetName, type, id, strength, cellX, cellY }) => ({
        typeName,
        assetName,
        type,
        id,
        strength,
        cellX,
        cellY,
      })),
    },
    battle: {
      unitsKilled: stats.unitsKilled,
      buildingsKilled: stats.buildingsKilled,
      totalKilled: stats.unitsKilled + stats.buildingsKilled,
      unitsLost: stats.unitsLost,
      buildingsLost: stats.buildingsLost,
      totalLost: stats.unitsLost + stats.buildingsLost,
    },
    gameOver: {
      score: gameOver.args[0],
      leadership: gameOver.args[1],
      efficiency: gameOver.args[2],
      remainingCredits: gameOver.args[3],
    },
  }));
} finally {
  if (handle !== 0) {
    assert.equal(engine._cnc_web_destroy(handle), STATUS_OK, "runtime destroy failed");
  }
}
