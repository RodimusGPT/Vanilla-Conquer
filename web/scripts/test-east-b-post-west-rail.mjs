/**
 * Unit tests for east-b post-west rail approach (shipped pure helper).
 * Run: node scripts/test-east-b-post-west-rail.mjs
 */
import assert from "node:assert/strict";
import { eastBPostWestRailApproach } from "./east-b-post-west-rail.mjs";

const nwSam = { cellX: 12, cellY: 5 };
const gun = { cellX: 11, cellY: 18, strength: 400 };

{
  const r = eastBPostWestRailApproach({ cellX: 35, cellY: 55, strength: 400 }, nwSam, gun);
  assert.equal(r.reason, "north-off-pad");
}
{
  const r = eastBPostWestRailApproach({ cellX: 29, cellY: 35, strength: 400 }, nwSam, gun);
  assert.equal(r.reason, "east-detour");
  assert.ok(r.cellX >= 38);
}
{
  const r = eastBPostWestRailApproach({ cellX: 40, cellY: 28, strength: 400 }, nwSam, gun);
  assert.equal(r.reason, "cut-west-high");
  assert.equal(r.cellX, 24);
}
{
  const r = eastBPostWestRailApproach({ cellX: 22, cellY: 24, strength: 400 }, nwSam, gun);
  assert.equal(r.reason, "to-gun-theatre");
  assert.ok(r.cellY <= 20);
}
{
  const r = eastBPostWestRailApproach({ cellX: 19, cellY: 18, strength: 395 }, nwSam, gun);
  // gunDist=|19-11|+|18-18|=8 ≤10 theatre hunt
  assert.equal(r.engage, true);
  assert.ok(r.reason === "gun-hunt" || r.reason === "gun-adjacent");
}
{
  const r = eastBPostWestRailApproach({ cellX: 16, cellY: 21, strength: 395 }, nwSam, gun);
  assert.equal(r.engage, true);
  assert.equal(r.reason, "gun-hunt");
}
{
  const r = eastBPostWestRailApproach({ cellX: 12, cellY: 20, strength: 395 }, nwSam, gun);
  assert.equal(r.engage, true);
  assert.equal(r.reason, "gun-adjacent");
}
{
  // Still fights GUN at 100 HP (abort only below 80).
  const r = eastBPostWestRailApproach({ cellX: 11, cellY: 20, strength: 100 }, nwSam, gun);
  assert.equal(r.engage, true);
  assert.equal(r.reason, "gun-adjacent");
}
{
  const r = eastBPostWestRailApproach({ cellX: 11, cellY: 20, strength: 50 }, nwSam, gun);
  assert.equal(r.engage, false);
  assert.equal(r.reason, "gun-flee-east");
}
{
  const r = eastBPostWestRailApproach(
    { cellX: 13, cellY: 20, strength: 300 }, nwSam,
    { cellX: 11, cellY: 18, strength: 0 },
  );
  assert.equal(r.reason, "spine-north");
  assert.ok(r.cellY < 20);
}
{
  const r = eastBPostWestRailApproach({ cellX: 12, cellY: 8, strength: 300 }, nwSam, null);
  assert.equal(r.engage, true);
}

console.log("test-east-b-post-west-rail: ok");
