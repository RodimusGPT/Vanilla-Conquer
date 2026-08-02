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

// l212: free on SE corridor with SAM low peels west (keep residual for A-10).
{
  const seSam = { cellX: 43, cellY: 14, strength: 100 };
  const r = eastBPostWestRailApproach(
    { cellX: 38, cellY: 14, strength: 300 },
    seSam,
    null,
    { soleFree: false },
  );
  assert.equal(r.reason, "se-sam-peel-west");
  assert.equal(r.cellX, 28);
  assert.ok(r.cellY >= 18);
}
// l219: free critically wounded (hp<120) peels west even if SAM healthy.
{
  const seSam = { cellX: 52, cellY: 14, strength: 300 };
  const r = eastBPostWestRailApproach(
    { cellX: 38, cellY: 14, strength: 100 },
    seSam,
    null,
    { soleFree: false },
  );
  assert.equal(r.reason, "se-sam-peel-west");
}
// Healthy free + healthy SE SAM still approaches (no early peel).
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 30, cellY: 14, strength: 360 },
    seSam,
    null,
    { soleFree: false },
  );
  assert.notEqual(r.reason, "se-sam-peel-west");
  assert.ok(r.reason.startsWith("se-sam-"), r.reason);
}

// l181: after NW dead free mid-map (23,32) must SE-peel, not spine-far-north.
{
  const r = eastBPostWestRailApproach(
    { cellX: 23, cellY: 32, strength: 360 },
    { cellX: 43, cellY: 14, strength: 400 },
    null,
    { soleFree: false },
  );
  assert.equal(r.reason, "se-sam-east");
  assert.ok(r.cellX >= 29, `SE peel east x=${r.cellX}`);
  assert.ok(r.cellY < 32, `SE peel north y=${r.cellY}`);
}
// l181: free@19,15 SE target hops east on corridor.
{
  const r = eastBPostWestRailApproach(
    { cellX: 19, cellY: 15, strength: 360 },
    { cellX: 43, cellY: 14, strength: 400 },
    null,
    { soleFree: false },
  );
  assert.equal(r.reason, "se-sam-east");
  assert.ok(r.cellX > 19);
}

// l179c/l180: free#5 frozen@17,20 — unstick south when GUN still full HP.
{
  const r = eastBPostWestRailApproach(
    { cellX: 17, cellY: 20, strength: 362 }, nwSam, gun,
    { soleFree: false },
  );
  assert.equal(r.engage, false);
  assert.equal(r.reason, "gun-unstick-south");
  assert.equal(r.cellX, 14);
  assert.equal(r.cellY, 23);
  assert.equal(r.stopFirst, true);
}
// l180: when partner has chipped GUN (≤320), free@17,20 attack-joins (no idle).
{
  const r = eastBPostWestRailApproach(
    { cellX: 17, cellY: 20, strength: 400 }, nwSam,
    { cellX: 11, cellY: 18, strength: 150 },
    { soleFree: false },
  );
  assert.equal(r.engage, true);
  assert.equal(r.reason, "gun-standoff-fire");
}
// After unstick to 14,23 gunDist=5: engage band.
{
  const r = eastBPostWestRailApproach(
    { cellX: 14, cellY: 23, strength: 362 }, nwSam, gun,
    { soleFree: false },
  );
  assert.equal(r.engage, true);
  assert.equal(r.reason, "gun-standoff-fire");
}
// After step to 15,21: engage GUN.
{
  const r = eastBPostWestRailApproach(
    { cellX: 15, cellY: 21, strength: 362 }, nwSam, gun,
    { soleFree: false },
  );
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
  // l179: NW live + free mid-map in corridor → hold NW fire cell (not SE peel).
  const r = eastBPostWestRailApproach(
    { cellX: 18, cellY: 22, strength: 185 },
    { cellX: 12, cellY: 5, strength: 400 },
    null,
  );
  assert.equal(r.reason, "sam-hold-nw-chip");
  assert.equal(r.cellX, 20);
  assert.equal(r.cellY, 13);
}
{
  // NW dead (SE target) free mid-map peels SE-east.
  const r = eastBPostWestRailApproach(
    { cellX: 18, cellY: 22, strength: 185 },
    { cellX: 43, cellY: 14, strength: 400 },
    null,
  );
  assert.ok(
    r.reason === "se-sam-east" || r.reason === "se-sam-attack-move"
      || r.reason === "sam-post-negun-north" || r.reason === "spine-east-north",
    r.reason,
  );
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
// On GUN pad band post-GUN with NW live: north peel toward NW theatre.
{
  const r = eastBPostWestRailApproach(
    { cellX: 14, cellY: 22, strength: 128 }, nwSam, null,
  );
  assert.ok(
    r.reason === "spine-east-peel" || r.reason === "sam-post-negun-north"
      || r.reason === "spine-east-north",
    r.reason,
  );
}
// Near fire line on spine: attack-move NW SAM (l110).
{
  const r = eastBPostWestRailApproach(
    { cellX: 13, cellY: 11, strength: 100 }, nwSam, null,
  );
  assert.equal(r.reason, "sam-attack-move");
  assert.equal(r.engage, true);
}
// Mid east y=13 (NE clear, healthy): hold NW chip theatre (l175h).
{
  const r = eastBPostWestRailApproach(
    { cellX: 19, cellY: 13, strength: 128 }, nwSam, null,
  );
  assert.equal(r.reason, "sam-hold-nw-chip");
  assert.equal(r.engage, false);
}
// Far-east y=13 healthy: hold NW chip theatre.
{
  const r = eastBPostWestRailApproach(
    { cellX: 22, cellY: 13, strength: 128 }, nwSam, null,
  );
  assert.equal(r.reason, "sam-hold-nw-chip");
}
// Far-east y=8: SAM attack-move.
{
  const r = eastBPostWestRailApproach(
    { cellX: 22, cellY: 8, strength: 100 }, nwSam, null,
  );
  assert.ok(r.reason.includes("sam"), r.reason);
}

// GUN finish band: back up from dist≤3 to SE standoff (l117).
{
  const r = eastBPostWestRailApproach(
    { cellX: 12, cellY: 21, strength: 150 }, nwSam,
    { cellX: 11, cellY: 18, strength: 90 },
  );
  assert.equal(r.reason, "gun-finish-standoff");
  assert.equal(r.engage, false);
  assert.ok(eastBChebyshev(r, { cellX: 11, cellY: 18 }) >= 4);
}
// GUN finish at dist 4–5: keep firing.
{
  const r = eastBPostWestRailApproach(
    { cellX: 14, cellY: 22, strength: 169 }, nwSam,
    { cellX: 11, cellY: 18, strength: 90 },
  );
  assert.equal(r.reason, "gun-standoff-fire");
  assert.equal(r.engage, true);
}

// free@21,11 healthy: hold NW chip theatre (l175h).
{
  const r = eastBPostWestRailApproach(
    { cellX: 21, cellY: 11, strength: 128 }, nwSam, null,
  );
  assert.equal(r.reason, "sam-hold-nw-chip");
  assert.equal(r.engage, false);
}
// l179: free@21,11 low HP still holds NW (hp≥40) so engine can finish NW.
{
  const r = eastBPostWestRailApproach(
    { cellX: 21, cellY: 11, strength: 70 }, nwSam, null,
  );
  assert.equal(r.reason, "sam-hold-nw-chip");
  assert.equal(r.engage, false);
}
// free@21,11 very low (hp<40): not hold; any safe rail is ok.
{
  const r = eastBPostWestRailApproach(
    { cellX: 21, cellY: 11, strength: 30 }, nwSam, null,
  );
  assert.notEqual(r.reason, "se-sam-east", r.reason); // never SE while NW target live
}
// y=9: SAM attack-move.
{
  const r = eastBPostWestRailApproach(
    { cellX: 21, cellY: 9, strength: 100 }, nwSam, null,
  );
  assert.equal(r.reason, "sam-post-negun");
  assert.equal(r.engage, true);
}
// l174f/h: free@19,12@247 NE dead → hold NW chip theatre.
{
  const r = eastBPostWestRailApproach(
    { cellX: 19, cellY: 12, strength: 247 }, nwSam, null,
  );
  assert.equal(r.reason, "sam-hold-nw-chip");
  assert.equal(r.engage, false);
}
// free@21,10: SAM engage.
{
  const r = eastBPostWestRailApproach(
    { cellX: 21, cellY: 10, strength: 99 }, nwSam, null,
  );
  assert.equal(r.reason, "sam-post-negun");
  assert.equal(r.engage, true);
}
// l175g: free@20,13@99 after NE — hold NW chip theatre (hp≥80, NW >160).
{
  const r = eastBPostWestRailApproach(
    { cellX: 20, cellY: 13, strength: 99 },
    { cellX: 12, cellY: 5, strength: 300 },
    null,
  );
  assert.equal(r.reason, "sam-hold-nw-chip");
  assert.equal(r.engage, false);
}
// l178f/l216: NW dead — direct force-move to multi-SAM stand 39,14.
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 20, cellY: 13, strength: 99 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
  assert.equal(r.engage, false);
  assert.equal(r.stopFirst, true);
}
// l176f: SE target while NE GUN still live — peel SE, do not hold NE.
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const neGun = { cellX: 16, cellY: 9, strength: 177 };
  const r = eastBPostWestRailApproach(
    { cellX: 20, cellY: 13, strength: 200 },
    seSam,
    null,
    { neGun },
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
  assert.equal(r.engage, false);
}
// l179: NE dead, NW still live (even low) — HOLD fire cell, no SE peel.
{
  const r = eastBPostWestRailApproach(
    { cellX: 20, cellY: 13, strength: 200 },
    { cellX: 12, cellY: 5, strength: 80 },
    null,
    { neGun: null },
  );
  assert.equal(r.reason, "sam-hold-nw-chip");
  assert.equal(r.engage, false);
  assert.equal(r.cellX, 20);
}
// l179: free south of fire cell, NE dead, NW live — walk to hold, not SE.
{
  const r = eastBPostWestRailApproach(
    { cellX: 18, cellY: 18, strength: 150 },
    { cellX: 12, cellY: 5, strength: 200 },
    null,
    { neGun: null },
  );
  assert.equal(r.reason, "sam-hold-nw-chip");
  assert.equal(r.cellX, 20);
  assert.equal(r.cellY, 13);
}
// l179: NW@0 strength with SE target — peel SE.
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 20, cellY: 13, strength: 150 },
    seSam,
    null,
    { neGun: null },
  );
  assert.equal(r.reason, "se-sam-east");
  assert.ok(r.cellX > 20);
}
// l178f/l216: mid corridor force-moves to multi-SAM stand 39,14.
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 30, cellY: 14, strength: 99 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
  assert.equal(r.cellY, 14);
}
// l184/l219: free critically wounded@38,14 peels west (residual for post-SAM).
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 38, cellY: 14, strength: 99 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-peel-west");
  assert.equal(r.engage, false);
}
// Healthy free at stand holds for engine chip (no peel while SAM healthy).
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 39, cellY: 14, strength: 300 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.engage, false);
  assert.equal(r.cellX, 39);
}
// l176: NW still healthy target@300 — keep hold chip.
{
  const r = eastBPostWestRailApproach(
    { cellX: 20, cellY: 13, strength: 99 },
    { cellX: 12, cellY: 5, strength: 300 },
    null,
  );
  assert.equal(r.reason, "sam-hold-nw-chip");
}
// l183/l216: free@32 healthy force-moves to multi-SAM stand 39,14.
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 32, cellY: 14, strength: 300 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.engage, false);
  assert.equal(r.cellX, 39);
}
// Past stand (41,14) critically wounded — peel west (l212 residual).
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 41, cellY: 14, strength: 99 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-peel-west");
}
// Healthy free at stand with healthy SAM: hold stand (not peel).
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 39, cellY: 14, strength: 300 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
}
// SAM in kill_band (≤100) → peel west for residual.
{
  const seSam = { cellX: 43, cellY: 14, strength: 80 };
  const r = eastBPostWestRailApproach(
    { cellX: 38, cellY: 14, strength: 300 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-peel-west");
}
// Healthy free approaching stand from x=34 still goes east to 39,14.
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 34, cellY: 14, strength: 300 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
}
// After overshoot@47 critically wounded: peel west (l212 residual).
{
  const seSam = { cellX: 52, cellY: 14, strength: 350 };
  const r = eastBPostWestRailApproach(
    { cellX: 47, cellY: 17, strength: 100 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-peel-west");
  assert.ok(r.cellX <= 30, `peel x=${r.cellX}`);
}
// Healthy free@40 with healthy SAM: hold multi-SAM stand (not peel, not dive).
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 40, cellY: 14, strength: 300 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
}
// At stand@39 healthy hold — engine chip, no engage into base.
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 39, cellY: 14, strength: 300 },
    seSam,
    null,
  );
  assert.equal(r.engage, false);
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
}
// l215/l216: free@26,16 must direct-move to multi-SAM stand 39,14.
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 26, cellY: 16, strength: 345 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
  assert.equal(r.cellY, 14);
}
// l215: free@30,16 still routes to 39,14 (chip range), not spine-north.
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 30, cellY: 16, strength: 260 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
}
// l216: free@38,17 (drift south) snaps back to 39,14 not peel while healthy.
{
  const seSam = { cellX: 52, cellY: 14, strength: 283 };
  const r = eastBPostWestRailApproach(
    { cellX: 38, cellY: 17, strength: 250 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
  assert.equal(r.cellY, 14);
}
// l219: free residual critical at stand peels west before death.
{
  const seSam = { cellX: 52, cellY: 14, strength: 283 };
  const r = eastBPostWestRailApproach(
    { cellX: 38, cellY: 14, strength: 100 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-peel-west");
}
// l219: free@180 + SAM@283 holds for chip (do not peel early — l218 SE@52 stuck).
{
  const seSam = { cellX: 52, cellY: 14, strength: 283 };
  const r = eastBPostWestRailApproach(
    { cellX: 38, cellY: 14, strength: 180 },
    seSam,
    null,
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.cellX, 39);
}

// l176k: SE hunter from mid-map steps toward SE approach (no overshoot hop).
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 38, cellY: 40, strength: 300 },
    seSam,
    null,
    { seHunter: true },
  );
  assert.equal(r.reason, "se-sam-east");
  assert.equal(r.engage, false);
  assert.ok(r.cellX <= 40, r.cellX);
  assert.ok(r.cellY < 40, r.cellY);
}
// seHunter from west spine steps east (not NW pile-on).
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 14, cellY: 24, strength: 380 },
    seSam,
    null,
    { seHunter: true },
  );
  assert.equal(r.reason, "se-sam-east");
  assert.ok(r.cellX >= 20, r.cellX);
  assert.equal(r.engage, false);
}
// seHunter past SE stand peels west.
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 44, cellY: 16, strength: 300 },
    seSam,
    null,
    { seHunter: true },
  );
  assert.equal(r.reason, "se-sam-peel-west");
  assert.ok(r.cellX <= 40, r.cellX);
}
// l267b closed: seHunter during live GUN falls through to gun micro (2v1 kept).
{
  const seSam = { cellX: 43, cellY: 14, strength: 400 };
  const gun = { cellX: 11, cellY: 18, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 16, cellY: 21, strength: 295 },
    seSam,
    gun,
    { seHunter: true },
  );
  assert.ok(String(r.reason).startsWith("gun-"), `GUN micro reason=${r.reason}`);
}

// l164/l169: 2 free in SE fire band engage NE GUN.
{
  const neGun = { cellX: 16, cellY: 9, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 20, cellY: 13, strength: 128 }, nwSam, null,
    { freeNorthCount: 2, neGun },
  );
  assert.equal(r.reason, "ne-gun-standoff-fire");
  assert.equal(r.engage, true);
}
// l173: free hp≥100 after GUN routes to NE GUN fire/standoff.
{
  const neGun = { cellX: 16, cellY: 9, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 14, cellY: 22, strength: 249 }, nwSam, null,
    { freeNorthCount: 2, neGun },
  );
  assert.equal(r.reason, "ne-gun-to-fire-cell");
  assert.equal(r.engage, false);
  assert.ok(r.cellY <= 13 && r.cellX >= 18, `fire cell ${r.cellX},${r.cellY}`);
}
{
  const neGun = { cellX: 16, cellY: 9, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 20, cellY: 13, strength: 200 }, nwSam, null,
    { freeNorthCount: 1, neGun },
  );
  assert.equal(r.reason, "ne-gun-standoff-fire");
  assert.equal(r.engage, true);
}
// l174b: free@19,16 Cheby 7 out of range — force-move to fire cell, no engage.
{
  const neGun = { cellX: 16, cellY: 9, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 19, cellY: 16, strength: 226 }, nwSam, null,
    { freeNorthCount: 1, neGun },
  );
  assert.equal(r.reason, "ne-gun-to-fire-cell");
  assert.equal(r.engage, false);
  assert.ok(r.cellY <= 13, `should seek y≤13 fire cell got ${r.cellY}`);
}
// l174b: free@18,17 thrash cell — still force-move north to fire cell.
{
  const neGun = { cellX: 16, cellY: 9, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 18, cellY: 17, strength: 247 }, nwSam, null,
    { freeNorthCount: 1, neGun },
  );
  assert.equal(r.reason, "ne-gun-to-fire-cell");
  assert.equal(r.engage, false);
}
// l174b: free@18,12 Cheby 3 at fire band engages.
{
  const neGun = { cellX: 16, cellY: 9, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 18, cellY: 12, strength: 200 }, nwSam, null,
    { freeNorthCount: 1, neGun },
  );
  assert.equal(r.reason, "ne-gun-standoff-fire");
  assert.equal(r.engage, true);
}
// l175c: free wounded at fire cell while NE low — hold chip, do not trade.
{
  const neGun = { cellX: 16, cellY: 9, strength: 100 };
  const r = eastBPostWestRailApproach(
    { cellX: 20, cellY: 13, strength: 150 }, nwSam, null,
    { freeNorthCount: 1, neGun },
  );
  assert.equal(r.reason, "ne-gun-hold-chip");
  assert.equal(r.engage, false);
}
// very low-HP free still peels north (under-kill risk).
{
  const neGun = { cellX: 16, cellY: 9, strength: 400 };
  const r = eastBPostWestRailApproach(
    { cellX: 21, cellY: 12, strength: 80 }, nwSam, null,
    { freeNorthCount: 1, neGun },
  );
  assert.ok(
    r.reason === "spine-far-north" || r.reason === "spine-dodge-east",
    r.reason,
  );
}



console.log("test-east-b-post-west-rail: ok");
