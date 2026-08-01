/**
 * Pure post-west remaining-SAM / GUN approach for east-b free tanks.
 *
 * TRACE (goal implementer):
 * - free@395 reaches GUN theatre via east detour (l16/l32) but loses point-blank
 *   trade when attack-ordered onto GUN (paths to 11,20@255 then dies).
 * - NE rim y=9 cannot path west to NW SAM{12,5} — GUN must die first, then spine.
 * - missionEightDistance is Chebyshev; MTNK weapon range ~4.
 *
 * GUN micro: force-move to a SE fire cell at Chebyshev 4 from GUN{11,18}, then
 * attack in place (flags=0). Never path onto the GUN cell. After GUN dead,
 * spine north x≈12 to NW SAM.
 */

/** SE standoff cells at Chebyshev 3–5 from GUN{11,18} — approach from east.
 * TRACE l42: free@16,21 Cheby 5 not firing; only chipped at 14,22 (dist 4).
 * Prefer cells at dist 4–5 so free starts DPS earlier while still healthy. */
export const EAST_B_GUN_FIRE_CELLS = [
  { cellX: 16, cellY: 20 },
  { cellX: 16, cellY: 21 },
  { cellX: 15, cellY: 20 },
  { cellX: 15, cellY: 21 },
  { cellX: 14, cellY: 21 },
  { cellX: 14, cellY: 22 },
  { cellX: 13, cellY: 22 },
];

export function eastBChebyshev(a, b) {
  return Math.max(Math.abs(a.cellX - b.cellX), Math.abs(a.cellY - b.cellY));
}

/** Closest fire cell to tank (stable order for ties). */
export function eastBGunBestFireCell(tank, cells = EAST_B_GUN_FIRE_CELLS) {
  let best = cells[0];
  let bestD = Infinity;
  for (const cell of cells) {
    const d = eastBChebyshev(tank, cell);
    if (d < bestD) {
      bestD = d;
      best = cell;
    }
  }
  return best;
}

/**
 * @param {object} tank - {cellX, cellY, strength?}
 * @param {object} target - remaining SAM (usually NW 12,5)
 * @param {object|null} westernGun - {cellX, cellY, strength} or null/dead
 * @param {{soleFree?: boolean, stuck?: boolean, isScrap?: boolean, freeLeader?: object|null, waitPartner?: boolean}} opts
 */
export function eastBPostWestRailApproach(tank, target, westernGun, opts = {}) {
  const soleFree = opts.soleFree !== false;
  const stuck = Boolean(opts.stuck);
  const isScrap = Boolean(opts.isScrap);
  const freeLeader = opts.freeLeader ?? null;
  const waitPartner = Boolean(opts.waitPartner);
  const hp = tank.strength ?? 400;
  const dist = eastBChebyshev(tank, target);
  if (dist <= 4 && !isScrap) {
    return {
      cellX: target.cellX, cellY: target.cellY,
      engage: true, cadence: 4, reason: "sam-range",
    };
  }

  const gunLive = Boolean(westernGun && westernGun.strength > 0);
  const gunDist = gunLive ? eastBChebyshev(tank, westernGun) : 999;
  const fireCell = gunLive ? eastBGunBestFireCell(tank) : null;
  const atFireCell = fireCell
    ? eastBChebyshev(tank, fireCell) <= 1
    : false;

  // TRACE l65/l67: sole free chips GUN to 180 alone; with freeT=3 free#1 still
  // dies at GUN while partners lag. Hold mid-east (y≈32–36) until caller sees
  // ≥2 free MTNKs ready mid-map. Do not enter GUN theatre while waiting.
  if (waitPartner && gunLive && !isScrap && tank.cellY > 28) {
    return {
      cellX: 40,
      cellY: Math.min(Math.max(tank.cellY, 32), 36),
      engage: false,
      cadence: 18,
      reason: "partner-wait-hold",
    };
  }

  // Scrap escort: hold mid-map until free is in GUN theatre (y≤28), then join
  // fire cell (do not east-detour alone). TRACE l36–l37: early scrap suicided.
  if (isScrap && gunLive) {
    if (!freeLeader || freeLeader.cellY > 28) {
      return {
        cellX: Math.min(Math.max(tank.cellX, 30), 38),
        cellY: Math.min(Math.max(tank.cellY - 2, 38), 42),
        engage: false, cadence: 20, reason: "scrap-hold-for-free",
      };
    }
    // Free in theatre — force scrap onto fire cell / standoff path.
    if (gunDist <= 4 && (atFireCell || gunDist >= 3)) {
      return {
        cellX: westernGun.cellX, cellY: westernGun.cellY,
        engage: true, cadence: 1, reason: "gun-standoff-fire",
      };
    }
    return {
      cellX: fireCell.cellX, cellY: fireCell.cellY,
      engage: false, cadence: 8, reason: "gun-to-fire-cell",
    };
  }

  if (gunLive) {
    // TRACE l43: free@155 gun@180 almost killed GUN then fled at 55 while gun
    // repaired. Stay on GUN until dead or free <40 (or gun still healthy >250).
    // freeT=3 2v1 (l77) kills GUN — keep proven engage band; freeT=2 bank
    // closed (l78–l79 free#2 stuck @17,20).
    const gunNearDead = westernGun.strength <= 220;
    if (soleFree && gunDist <= 5 && hp < 40) {
      return {
        cellX: 18, cellY: Math.min(tank.cellY, 22),
        engage: false, cadence: 3, reason: "gun-flee-east",
      };
    }
    if (soleFree && gunDist <= 5 && hp < 60 && !gunNearDead) {
      return {
        cellX: 18, cellY: Math.min(tank.cellY, 22),
        engage: false, cadence: 3, reason: "gun-flee-east",
      };
    }
    // TRACE l117: when GUN finishing (≤100), pin free at dist 4–5 SE fire —
    // pathing into dist≤3 walks free to 11,22 and burns HP needed for NE GUN.
    // Full attack-in-place closed (l92 free@15); this only gates finish band.
    if (westernGun.strength <= 100 && gunDist <= 3 && hp >= 80) {
      return {
        cellX: 15, cellY: 21,
        engage: false, cadence: 2, reason: "gun-finish-standoff",
      };
    }
    if (westernGun.strength <= 100 && gunDist <= 5 && gunDist >= 4) {
      return {
        cellX: westernGun.cellX, cellY: westernGun.cellY,
        engage: true, cadence: 1, reason: "gun-standoff-fire",
      };
    }
    // Fire at Chebyshev ≤5. Cadence 1 — reissue every tick while trading.
    if (gunDist <= 5 && (atFireCell || gunDist >= 3 || gunNearDead)) {
      return {
        cellX: westernGun.cellX, cellY: westernGun.cellY,
        engage: true, cadence: 1, reason: "gun-standoff-fire",
      };
    }
    // Too close: back up to outer fire cell. TRACE l45 free walked 17,22→13,23
    // under GUN and bled faster; prefer dist 4–5 while healthy.
    if (gunDist <= 2 || (gunDist <= 3 && hp >= 200 && westernGun.strength > 200)) {
      const outer = { cellX: 16, cellY: 21 };
      return {
        cellX: outer.cellX, cellY: outer.cellY,
        engage: false, cadence: 3, reason: "gun-back-to-standoff",
      };
    }
    // Approach SE fire cell — never order the GUN cell as a move target.
    if (tank.cellY <= 26 && tank.cellX <= 30) {
      return {
        cellX: fireCell.cellX, cellY: fireCell.cellY,
        engage: false, cadence: 5, reason: "gun-to-fire-cell",
      };
    }
  }

  // TRACE l68/l85: free@108 dies ~300t before NW. l98–l100: force-move freezes
  // free in combat; pure SAM attack-move from x≤11 paths into Nod base
  // (10,21→11,20 death). l101: spine force-move + stopFirst. l104 free@128
  // @14,22 still bleeds under Nod west fire. l105: peel east to x=18 first
  // (escape west-base LOS) then north on x=18 to y=12, then cut west to SAM.
  if (!gunLive && tank.cellX <= 28 && tank.cellY <= 40) {
    if (dist <= 4) {
      return {
        cellX: target.cellX, cellY: target.cellY,
        engage: true, cadence: 1, reason: "sam-range",
      };
    }
    // TRACE l105/l106: free@109@19,14 dies ~58t after attack-move SAM from mid
    // east — pathfind west through death zone. l110: stay on east lane to y=10
    // then cut west; attack-move only when dist≤5 or on spine near fire line.
    if (dist <= 5) {
      return {
        cellX: target.cellX, cellY: target.cellY,
        engage: true, cadence: 1, reason: "sam-range",
      };
    }
    if (tank.cellX <= 15 && tank.cellY <= 11 && dist <= 7) {
      return {
        cellX: target.cellX, cellY: target.cellY,
        engage: true, cadence: 1, reason: "sam-attack-move",
      };
    }
    // l141: keep NUKE extends lose past 39058 (free still alive@19,12 then).
    // l142: with extra time, dodge east of GUN@16,9 then north to y=8, cut west.
    // l110 path dies under GUN@16,9; l130 with NUKE sell ends at 39058 mid-dodge.
    if (tank.cellX < 17 && tank.cellY >= 16) {
      return {
        cellX: 18,
        cellY: Math.min(tank.cellY, 20),
        engage: false,
        cadence: 1,
        reason: "spine-east-peel",
        stopFirst: true,
      };
    }
    if (tank.cellX < 20 && tank.cellY > 16) {
      return {
        cellX: Math.max(tank.cellX, 17),
        cellY: Math.max(tank.cellY - 3, 16),
        engage: false,
        cadence: 1,
        reason: "spine-east-north",
        stopFirst: true,
      };
    }
    // TRACE l142: free@21,11@128. l145 require x=22 before north stuck thrash.
    // l146: dodge only while x<20; once x≥20 north hard to y=7 then SAM AM.
    // No force cut-west through GUN@16,9 (that bled free to death).
    // Closed post-l146: l148 far-east x≥24 thrash@28,9 + earlier civ lose;
    // l149 solo NE GUN free@128 dies never kills; l150 partner peel@GUN≤100
    // under-DPS GUN repairs; l151 x≥22 one-cell thrash@21,16 bleed.
    if (tank.cellX < 20 && tank.cellY <= 16) {
      return {
        cellX: 22,
        cellY: Math.min(tank.cellY, 16),
        engage: false,
        cadence: 1,
        reason: "spine-dodge-east",
        stopFirst: true,
      };
    }
    // North on x≥20 until y≤7 (north of GUN@16,9). l146 best minY 10@108.
    // l147 reStop escape thrash pulled free west — closed.
    if (tank.cellX >= 20 && tank.cellY > 7) {
      return {
        cellX: Math.max(tank.cellX, 21),
        cellY: Math.max(tank.cellY - 3, 7),
        engage: false,
        cadence: 1,
        reason: "spine-far-north",
        stopFirst: true,
      };
    }
    // y≤7: attack-move NW SAM only (pathfind north of GUN).
    return {
      cellX: target.cellX,
      cellY: target.cellY,
      engage: true,
      cadence: 1,
      reason: dist <= 6 ? "sam-attack-move" : "sam-attack-move-far",
      stopFirst: true,
    };
  }
  if (!gunLive && (tank.cellY <= 36 || tank.cellX <= 22)) {
    if (dist <= 4) {
      return {
        cellX: target.cellX, cellY: target.cellY,
        engage: true, cadence: 1, reason: "sam-range",
      };
    }
    if (tank.cellY > 10) {
      return {
        cellX: 13,
        cellY: 9,
        engage: false,
        cadence: 1,
        reason: "spine-north",
        stopFirst: true,
      };
    }
    return {
      cellX: target.cellX, cellY: target.cellY,
      engage: dist <= 5,
      cadence: 1,
      reason: dist <= 5 ? "sam-close" : "to-sam-standoff",
    };
  }

  let approach;
  let cadence = 18;
  let reason = "rail";

  if (tank.cellY > 42) {
    approach = { cellX: tank.cellX, cellY: 40 };
    reason = "north-off-pad";
    cadence = 12;
  } else if (tank.cellY > 30) {
    // Mid-band west blocked — east detour (l16/l24).
    if (tank.cellX < 38) {
      approach = { cellX: 40, cellY: Math.min(tank.cellY, 32) };
      reason = "east-detour";
      cadence = 18;
    } else {
      approach = { cellX: 40, cellY: 28 };
      reason = "north-east-lane";
      cadence = 15;
    }
  } else if (tank.cellY > 22) {
    // Cut west-north toward GUN theatre (l16 42,29→27,19).
    if (tank.cellX > 24) {
      approach = { cellX: 24, cellY: Math.min(tank.cellY, 24) };
      reason = "cut-west-high";
      cadence = 14;
    } else {
      approach = { cellX: Math.max(tank.cellX - 2, 18), cellY: 20 };
      reason = "to-gun-theatre";
      cadence = 12;
    }
  } else if (gunLive) {
    // Fallback theatre approach to fire cell.
    approach = { cellX: fireCell.cellX, cellY: fireCell.cellY };
    reason = "gun-to-fire-cell";
    cadence = 8;
  } else if (tank.cellY > 10) {
    // GUN dead: western spine north to NW SAM (x=13 — east of GUN pad).
    approach = { cellX: 13, cellY: Math.max(tank.cellY - 3, 9) };
    reason = "spine-north";
    cadence = 1;
  } else {
    approach = { cellX: target.cellX, cellY: target.cellY };
    reason = dist <= 5 ? "sam-close" : "to-sam-standoff";
    cadence = 5;
  }

  if (stuck) {
    if (gunLive && fireCell) {
      approach = { cellX: fireCell.cellX, cellY: fireCell.cellY };
      reason = "gun-fire-cell-stuck";
    } else {
      approach = {
        cellX: tank.cellX + Math.sign(target.cellX - tank.cellX) * 3,
        cellY: tank.cellY + Math.sign(target.cellY - tank.cellY) * 3,
      };
      reason = `${reason}-stuck`;
    }
    cadence = 3;
  }
  if (approach.cellY > tank.cellY) {
    approach = { cellX: approach.cellX, cellY: tank.cellY - 2 };
  }
  return { ...approach, engage: false, cadence, reason };
}
