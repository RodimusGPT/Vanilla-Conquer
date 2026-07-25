#!/usr/bin/env node
/**
 * Stream-parse east-b missionEight TRACE lines; print western SAM nadir + kill-window snapshot.
 * Usage: node scripts/parse-east-b-trace-sam-min.mjs [/path/to/trace.err]
 */
import fs from "node:fs";
import readline from "node:readline";

const WESTERN_SAM = { cellX: 13, cellY: 16 };
const path = process.argv[2] ?? "/tmp/m8-eastb.trace.err";

if (!fs.existsSync(path)) {
  console.error(`trace file not found: ${path}`);
  process.exit(1);
}

let samMin = Infinity;
let samMinTick = -1;
let nadirRow;
let lineCount = 0;

const rl = readline.createInterface({
  input: fs.createReadStream(path),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  if (!line.includes("\"missionEight\"")) continue;
  let row;
  try {
    row = JSON.parse(line).missionEight;
  } catch {
    continue;
  }
  lineCount += 1;
  const western = row.samSites?.find((site) => (
    site.cellX === WESTERN_SAM.cellX && site.cellY === WESTERN_SAM.cellY
  ));
  if (!western || western.strength <= 0 || western.strength >= samMin) continue;
  samMin = western.strength;
  samMinTick = row.tick;
  nadirRow = row;
}

if (!Number.isFinite(samMin)) {
  console.log(JSON.stringify({ path, lines: lineCount, samMin: null }));
  process.exit(0);
}

const mtnks = nadirRow.strikeUnits?.filter((unit) => unit.typeName === "MTNK") ?? [];
console.log(JSON.stringify({
  path,
  lines: lineCount,
  samMin,
  at: samMinTick,
  mtnks: mtnks.map((tank) => `#${tank.id}@${tank.cellX},${tank.cellY}`),
  strikeUnits: nadirRow.strikeUnits,
}, null, 2));
