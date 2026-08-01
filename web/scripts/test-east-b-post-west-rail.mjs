/**
 * Unit tests for east-b post-west rail / GUN standoff (shipped pure helper).
 * Run: node scripts/test-east-b-post-west-rail.mjs
 */
import assert from "node:assert/strict";
import {
  eastBPostWestRailApproach,
  eastBGunBestFireCell,
  eastBChebyshev,
  EAST_B_GUN_FIRE_CELLS,
} from "./east-b-post-west-rail.mjs";

const nwSam = { cellX: 12, cellY: 5 };
const gun = { cellX: 11, cellY: 18, strength: 400 };

// Fire cells are at Chebyshev 3–5 from GUN (in/near MTNK range).
for (const cell of EAST_B_GUN_FIRE_CELLS) {
  const d = eastBChebyshev(cell, gun);
  assert.ok(d >= 3 && d <= 5, `fire cell ${cell.cellX},${cell.cellY} dist=${d}`);
}

// Pad exit.
{
  const r = eastBPostWestRailApproach({ cellX: 35, cellY: 55, strength: 400 }, nwSam, gun);
  assert.equal(r.reason, "north-off-pad");
}

// East detour mid-band.
{
  const r = eastBPostWestRailApproach({ cellX: 29, cellY: 35, strength: 400 }, nwSam, gun);
  assert.equal(r.reason, "east-detour");
  assert.ok(r.cellX >= 38);
}

// Theatre: go to fire cell, do NOT engage GUN from far (no pathfind into turret).
{
  const r = eastBPostWestRailApproach({ cellX: 22, cellY: 18, strength: 395 }, nwSam, gun);
  assert.equal(r.engage, false);
  assert.equal(r.reason, "gun-to-fire-cell");
  const d = eastBChebyshev(r, gun);
  assert.ok(d >= 3 && d <= 5, "target fire cell in standoff band");
}

// At 16,21 (Cheby 5): standoff fire engage — start DPS while healthy (l42).
{
  const r = eastBPostWestRailApproach({ cellX: 16, cellY: 21, strength: 395 }, nwSam, gun);
  assert.equal(r.engage, true);
  assert.equal(r.reason, "gun-standoff-fire");
}

// At fire cell with gunDist 4: standoff fire engage.
{
  const r = eastBPostWestRailApproach({ cellX: 15, cellY: 20, strength: 395 }, nwSam, gun);
  assert.equal(r.engage, true);
  assert.equal(r.reason, "gun-standoff-fire");
}

// Point-blank on GUN (11,20): back to standoff, do not sit trading.
{
  const r = eastBPostWestRailApproach({ cellX: 11, cellY: 20, strength: 255 }, nwSam, gun);
  assert.equal(r.engage, false);
  assert.equal(r.reason, "gun-back-to-standoff");
  assert.ok(eastBChebyshev(r, gun) >= 3);
}

// Critically wounded vs healthy GUN: flee east.
{
  const r = eastBPostWestRailApproach({ cellX: 11, cellY: 20, strength: 50 }, nwSam, gun);
  assert.equal(r.reason, "gun-flee-east");
}

// Partner-wait: free mid-map holds east of GUN theatre until rendezvous (l65/l67).
{
  const r = eastBPostWestRailApproach(
    { cellX: 40, cellY: 34, strength: 400 }, nwSam, gun,
    { soleFree: true, waitPartner: true },
  );
  assert.equal(r.reason, "partner-wait-hold");
  assert.equal(r.engage, false);
  assert.ok(r.cellY >= 32 && r.cellY <= 36);
}
// Partner-wait also holds lead free when a 2nd free exists but is still south.
{
  const r = eastBPostWestRailApproach(
    { cellX: 40, cellY: 33, strength: 400 }, nwSam, gun,
    { soleFree: false, waitPartner: true },
  );
  assert.equal(r.reason, "partner-wait-hold");
}
// Partner-wait does not trap free already in GUN theatre (y≤28).
{
  const r = eastBPostWestRailApproach(
    { cellX: 16, cellY: 21, strength: 395 }, nwSam, gun,
    { soleFree: true, waitPartner: true },
  );
  assert.equal(r.engage, true);
  assert.equal(r.reason, "gun-standoff-fire");
}
// Low HP but GUN near-dead: keep firing (l43 free@55 gun@180).
{
  const r = eastBPostWestRailApproach(
    { cellX: 13, cellY: 23, strength: 55 }, nwSam,
    { cellX: 11, cellY: 18, strength: 180 },
  );
  assert.equal(r.engage, true);
  assert.equal(r.reason, "gun-standoff-fire");
}

// GUN dead @ y=20: east peel (l105).
{
  const r = eastBPostWestRailApproach(
    { cellX: 13, cellY: 20, strength: 300 }, nwSam,
    { cellX: 11, cellY: 18, strength: 0 },
  );
  assert.equal(r.reason, "spine-east-peel");
  assert.equal(r.cellX, 18);
}

// SAM range.
{
  const r = eastBPostWestRailApproach({ cellX: 12, cellY: 8, strength: 300 }, nwSam, null);
  assert.equal(r.engage, true);
  assert.equal(r.reason, "sam-range");
}

// bestFireCell picks nearby cell.
{
  const c = eastBGunBestFireCell({ cellX: 20, cellY: 20 });
  assert.ok(EAST_B_GUN_FIRE_CELLS.some((f) => f.cellX === c.cellX && f.cellY === c.cellY));
}

// Scrap holds mid-map while free still south of theatre.
{
  const r = eastBPostWestRailApproach(
    { cellX: 34, cellY: 50, strength: 200 }, nwSam, gun,
    { isScrap: true, freeLeader: { cellX: 42, cellY: 33, strength: 395 } },
  );
  assert.equal(r.reason, "scrap-hold-for-free");
  assert.ok(r.cellY >= 33);
}

// Scrap joins fire cell once free in theatre.
{
  const r = eastBPostWestRailApproach(
    { cellX: 34, cellY: 40, strength: 200 }, nwSam, gun,
    { isScrap: true, freeLeader: { cellX: 16, cellY: 22, strength: 395 } },
  );
  assert.ok(
    r.reason === "gun-to-fire-cell" || r.reason === "gun-standoff-fire"
      || r.reason === "gun-back-to-standoff",
    r.reason,
  );
}


// Post-GUN: free mid-spine east-peels then north (l105).
{
  const r = eastBPostWestRailApproach(
    { cellX: 13, cellY: 30, strength: 119 }, nwSam, null,
    { soleFree: true },
  );
  assert.equal(r.reason, "spine-east-peel");
  assert.equal(r.cellX, 18);
  assert.equal(r.stopFirst, true);
}
{
  const r = eastBPostWestRailApproach(
    { cellX: 18, cellY: 22, strength: 185 }, nwSam, null,
  );
  assert.equal(r.reason, "spine-east-north");
  assert.ok(r.cellY < 22);
}

// TRACE l105: free@11,22 peels east off Nod fire (not west into base).
{
  const r = eastBPostWestRailApproach(
    { cellX: 11, cellY: 22, strength: 108 }, nwSam, null,
  );
  assert.equal(r.reason, "spine-east-peel");
  assert.equal(r.cellX, 18);
  assert.equal(r.engage, false);
}
// On GUN pad band: peel east.
{
  const r = eastBPostWestRailApproach(
    { cellX: 14, cellY: 22, strength: 128 }, nwSam, null,
  );
  assert.equal(r.reason, "spine-east-peel");
  assert.equal(r.cellX, 18);
}
// Near fire line / east lane y≤14: attack-move NW SAM (l106).
{
  const r = eastBPostWestRailApproach(
    { cellX: 13, cellY: 11, strength: 100 }, nwSam, null,
  );
  assert.equal(r.reason, "sam-attack-move");
  assert.equal(r.engage, true);
}
{
  const r = eastBPostWestRailApproach(
    { cellX: 19, cellY: 13, strength: 109 }, nwSam, null,
  );
  assert.equal(r.reason, "sam-attack-move");
  assert.equal(r.engage, true);
}

console.log("test-east-b-post-west-rail: ok");
