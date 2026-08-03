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

/** SE standoff cells at Chebyshev 3–4 from NE GUN{16,9} (MTNK range ~4).
 * TRACE l174: free@19,16 nd=7 engaged out of range → pathfind thrash@18,17
 * and never parked on a fire cell; NE GUN stayed 400. */
export const EAST_B_NE_GUN_FIRE_CELLS = [
  { cellX: 20, cellY: 12 },
  { cellX: 20, cellY: 13 },
  { cellX: 19, cellY: 12 },
  { cellX: 19, cellY: 13 },
  { cellX: 18, cellY: 12 },
  { cellX: 21, cellY: 12 },
  { cellX: 21, cellY: 13 },
];

/** Approach cells west of SE SAM cluster {43,14}/{52,14}/{54,5}.
 * TRACE l175: free holds@20,13 after NW dead — never peels east; 3 SE SAMs
 * stay 400. Force-move east on y≈13–16 corridor then engage. */
export const EAST_B_SE_SAM_APPROACH = { cellX: 40, cellY: 14 };

/** True when post-west target is a remaining SE SAM (NW already dead). */
export function eastBIsSeRemainingSam(target) {
  if (!target) return false;
  const x = target.cellX;
  const y = target.cellY;
  return (x === 43 && y === 14)
    || (x === 52 && y === 14)
    || (x === 54 && y === 5)
    || (x >= 40 && y <= 18 && y >= 4);
}

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
 * @param {{soleFree?: boolean, stuck?: boolean, isScrap?: boolean, freeLeader?: object|null, waitPartner?: boolean, waitPartnerPostGun?: boolean, neGun?: {cellX:number,cellY:number,strength:number}|null, freeNorthCount?: number, ltnkFaceStand?: boolean}} opts
 */
export function eastBPostWestRailApproach(tank, target, westernGun, opts = {}) {
  const soleFree = opts.soleFree !== false;
  const stuck = Boolean(opts.stuck);
  const isScrap = Boolean(opts.isScrap);
  const freeLeader = opts.freeLeader ?? null;
  const waitPartner = Boolean(opts.waitPartner);
  const waitPartnerPostGun = Boolean(opts.waitPartnerPostGun);
  const hp = tank.strength ?? 400;
  const dist = eastBChebyshev(tank, target);
  // l186: do NOT early-return SE at dist≤4 — SE standoff hard-cap (x≤44) must
  // pull free west first or free dies in SE base (l183–l185). SE handled below.
  if (dist <= 4 && !isScrap && !eastBIsSeRemainingSam(target)) {
    return {
      cellX: target.cellX, cellY: target.cellY,
      engage: true, cadence: 4,
      reason: "sam-range",
    };
  }

  const gunLive = Boolean(westernGun && westernGun.strength > 0);
  const gunDist = gunLive ? eastBChebyshev(tank, westernGun) : 999;
  const fireCell = gunLive ? eastBGunBestFireCell(tank) : null;
  const atFireCell = fireCell
    ? eastBChebyshev(tank, fireCell) <= 1
    : false;

  // TRACE l65/l67: sole free chips GUN alone; wait partner mid-east before GUN.
  // l445e: west-early holds (x=28–32) killed free residual (l445–l445d). Restore
  // proven x=40 partner-wait; mid civ is separate village/screen problem.
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
    // l267b SE-hunter-during-GUN closed: free#2 left 2v1 → GUN thrash/repair.
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
    // l180 TRACE: free#5 idle@17,20 (gunDist 6) for entire kill window while
    // free#1 alone chips GUN 400→150 then bleeds; force-move to 15,21 path-stalls
    // on the 17,20 sink (l78 free#2 idle@17,20). When GUN is already damaged
    // (partner trading), attack-join from theatre — free#1 tanks; free#5 only
    // needs a few shots to finish. Do NOT wait for fire-cell park.
    if (gunDist >= 5 && gunDist <= 8 && westernGun.strength <= 320 && hp >= 100
      && tank.cellX >= 13 && tank.cellX <= 22 && tank.cellY >= 16 && tank.cellY <= 26) {
      return {
        cellX: westernGun.cellX, cellY: westernGun.cellY,
        engage: true, cadence: 1, reason: "gun-standoff-fire",
      };
    }
    // Known path sink 16–18,x19–21: force-move SOUTH first (14,23 / 18,24) then
    // into SE fire band. Direct 17,20→15,21 never completes (l179c/l180).
    if (gunDist >= 5 && gunDist <= 8 && tank.cellX >= 16 && tank.cellX <= 18
      && tank.cellY >= 19 && tank.cellY <= 21 && hp >= 80) {
      return {
        cellX: 14, cellY: 23,
        engage: false, cadence: 1, reason: "gun-unstick-south",
        stopFirst: true,
      };
    }
    // Theatre join: step to SE fire cell 15,21 / 14,22 (gunDist 4).
    // stopFirst = stop-only first cycle at caller (same-cycle stop+move freezes).
    if (gunDist >= 6 && gunDist <= 7 && tank.cellX >= 14 && tank.cellX <= 20
      && tank.cellY >= 17 && tank.cellY <= 24 && hp >= 80) {
      const join = tank.cellY >= 21
        ? { cellX: 14, cellY: 22 }
        : { cellX: 15, cellY: 21 };
      return {
        cellX: join.cellX, cellY: join.cellY,
        engage: false, cadence: 1, reason: "gun-to-fire-cell",
        stopFirst: true,
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
    // Prefer a cell that is actually in MTNK range (gunDist 3–4), not merely
    // the geometrically closest listed cell (16,20 is gunDist 5 from GUN).
    if (tank.cellY <= 26 && tank.cellX <= 30) {
      const inRangeFire = EAST_B_GUN_FIRE_CELLS
        .map((cell) => ({ cell, gd: eastBChebyshev(cell, westernGun), td: eastBChebyshev(tank, cell) }))
        .filter((row) => row.gd >= 3 && row.gd <= 4)
        .toSorted((a, b) => a.td - b.td || a.gd - b.gd)[0];
      const dest = inRangeFire?.cell ?? fireCell;
      return {
        cellX: dest.cellX, cellY: dest.cellY,
        engage: false, cadence: 2, reason: "gun-to-fire-cell",
        stopFirst: gunDist >= 6,
      };
    }
  }

  // TRACE l68/l85: free@108 dies ~300t before NW. l98–l100: force-move freezes
  // free in combat; pure SAM attack-move from x≤11 paths into Nod base
  // (10,21→11,20 death). l101: spine force-move + stopFirst. l104 free@128
  // @14,22 still bleeds under Nod west fire. l105: peel east to x=18 first
  // (escape west-base LOS) then north on x=18 to y=12, then cut west to SAM.
  // l176: allow free x up to SE SAM band (was ≤28 — free never left hold cell).
  if (!gunLive && tank.cellX <= 56 && tank.cellY <= 40) {
    // TRACE l168–l173: residual ≥249; free peels after GUN but dies trading NE
    // GUN / thrash. l174 fine: free@19,16 nd=7 attack-ordered out of MTNK range
    // pathfind thrash@18,17; NE GUN never entered chip near_dist (stayed 400).
    // Mirror western GUN micro: force-move to SE fire cell (Cheby 3–4), then
    // attack in place only when in weapon range. Engine NE finish chip wider.
    void waitPartnerPostGun;
    const neGun = opts.neGun && opts.neGun.strength > 0 ? opts.neGun : null;
    const freeNorth = opts.freeNorthCount ?? 0;
    void freeNorth;
    // l176k: free#2 SE hunter marches east corridor while free#1 finishes NE/NW.
    // l269 hard-march-to-{40,14} closed (free overshot x=44 into east GUNs).
    // Keep y≤22 seHunter on SE (not only y>22) so free does not pile onto NW.
    const seHunter = Boolean(opts.seHunter);
    if (seHunter && hp >= 40) {
      const seDist = eastBIsSeRemainingSam(target)
        ? eastBChebyshev(tank, target)
        : eastBChebyshev(tank, EAST_B_SE_SAM_APPROACH);
      if (seDist <= 5 && eastBIsSeRemainingSam(target) && tank.cellX <= 42) {
        return {
          cellX: target.cellX, cellY: target.cellY,
          engage: true, cadence: 2, reason: "se-sam-range",
        };
      }
      // Pull back if past SE stand (east GUN fire).
      if (tank.cellX > 42) {
        return {
          cellX: 40, cellY: 14,
          engage: false, cadence: 2, reason: "se-sam-peel-west",
        };
      }
      if (tank.cellX >= 34 && tank.cellY <= 20 && eastBIsSeRemainingSam(target)) {
        return {
          cellX: Math.min(Math.max(target.cellX - 4, 36), 42),
          cellY: Math.max(Math.min(target.cellY, 16), 12),
          engage: seDist <= 6 && tank.cellX <= 42,
          cadence: 3,
          reason: seDist <= 6 ? "se-sam-range" : "se-sam-east",
          stopFirst: false,
        };
      }
      // Step east then north toward SE approach (no single-hop overshoot).
      return {
        cellX: Math.min(Math.max(tank.cellX < 34 ? tank.cellX + 6 : tank.cellX, 36), 40),
        cellY: tank.cellX < 34
          ? Math.min(Math.max(tank.cellY, 20), 28)
          : Math.max(Math.min(tank.cellY - 4, 16), 14),
        engage: false,
        cadence: 4,
        reason: "se-sam-east",
        stopFirst: false,
      };
    }
    // l179: hold NW fire cell until NW is dead (peelSeEarly removed — free
    // left NW@400 and never finished under tight SE 0x0A00). SE peel only when
    // target is SE SAM (NW already retargeted away) or seHunter free#2.
    // l272 skip-NE-while-NW closed: free stuck on last SE SAM, maxOrd=0.
    const seSamTarget = eastBIsSeRemainingSam(target) || seHunter;
    void opts.nwSamLive;
    if (neGun && !seSamTarget && !seHunter && hp >= 100
      && tank.cellY <= 26 && tank.cellX <= 26) {
      const nd = eastBChebyshev(tank, neGun);
      const neFire = eastBGunBestFireCell(tank, EAST_B_NE_GUN_FIRE_CELLS);
      const atNeFire = eastBChebyshev(tank, neFire) <= 1;
      // Point-blank / under gun: back to SE fire cell (do not sit trading).
      if (nd <= 2) {
        return {
          cellX: neFire.cellX,
          cellY: neFire.cellY,
          engage: false,
          cadence: 2,
          reason: "ne-gun-back-standoff",
          stopFirst: true,
        };
      }
      // In weapon range (Cheby ≤4) at/near fire cell — attack in place.
      // l175c: when NE is already low (≤120) hold fire cell and let proximity
      // chip finish so free keeps residual HP for NW peel (free@99 after NE
      // kill never reaches NW before civ lose).
      if (nd <= 4 && (atNeFire || nd >= 3)) {
        if ((neGun.strength ?? 400) <= 120 && atNeFire && hp < 180) {
          return {
            cellX: neFire.cellX,
            cellY: neFire.cellY,
            engage: false,
            cadence: 2,
            reason: "ne-gun-hold-chip",
            stopFirst: true,
          };
        }
        return {
          cellX: neGun.cellX,
          cellY: neGun.cellY,
          engage: true,
          cadence: 1,
          reason: "ne-gun-standoff-fire",
        };
      }
      // Approach SE fire cell — never attack-move from nd≥5 (pathfind thrash).
      return {
        cellX: neFire.cellX,
        cellY: neFire.cellY,
        engage: false,
        cadence: 1,
        reason: "ne-gun-to-fire-cell",
        stopFirst: true,
      };
    }
    // l175g/l179: after NE dead free@20,13 is in NW proximity-chip theatre.
    // Hold fire cell while NW is the live target. SE peel ONLY when target is
    // SE SAM (NW dead) — never peel while NW still the live target.
    // strength omitted in unit tests → treat as live (400).
    const nwIsTarget = target
      && target.cellX === 12 && target.cellY === 5
      && (target.strength ?? 400) > 0;
    // l181 TRACE: after NE+NW dead free#5@19,15 should SE-hop, but free later
    // falls to 23,32 and spine-far-north (y>22 excluded SE peel). SE remaining
    // target: peel from anywhere mid-map (y≤40), not only NE fire theatre.
    // l214/l215: free@30,16 dies outside SE chip (need x≈36–39 for 0x0E00);
    // standX=34 + cadence 8 hop thrash aborted approach. Restore l212 stand
    // (target.x-4 ≈39) with direct force-move + high cadence (path completes).
    if (seSamTarget && hp < 40 && tank.cellY <= 40 && tank.cellX >= 26) {
      // Critically wounded on SE corridor — flee west, never spine-north thrash.
      return {
        cellX: 24,
        cellY: 22,
        engage: false,
        cadence: 4,
        reason: "se-sam-peel-west",
        stopFirst: true,
      };
    }
    if (seSamTarget && hp >= 40 && tank.cellY <= 40) {
      const seDist = eastBChebyshev(tank, target);
      // l212 TRACE: free@39,14 chips SE@43 + SE@52 + SE@54 in one hold window
      // (0x0E00 / 0x1400). Per-target standX (SE@52→40) pulled free off the
      // multi-SAM cell and into GUN fire (l215 free@38,17 died SE52@283).
      // Fixed multi-SAM stand for all SE corridor work.
      const northSe = target.cellY <= 8;
      const standX = 39;
      const standY = northSe ? 12 : 14;
      const atStand = Math.abs(tank.cellX - standX) <= 1
        && Math.abs(tank.cellY - standY) <= 1;
      const samStr = target.strength ?? 400;
      // Peel WEST only when SAM is in kill_band (≤100) so free starts west
      // while engine finishes — NOT at sam≤200 (l218 left SE@52@33). Critical
      // residual peel if free is about to die (hp<120) on corridor.
      // l291 early LTNK-face peel closed: free dead@51000 pre-BGGY, maxOrd=2.
      const sePeelWest = tank.cellX >= 36 && tank.cellY <= 20 && hp >= 40 && (
        samStr <= 100
        || (hp < 120 && tank.cellX >= 37)
      );
      if (sePeelWest) {
        return {
          cellX: 28,
          cellY: 22,
          engage: false,
          cadence: 4,
          reason: "se-sam-peel-west",
          stopFirst: true,
        };
      }
      // Overshoot past 40 (east-base GUN@41–45) — pull back to multi-SAM stand.
      if (tank.cellX >= 41 && tank.cellY <= 18 && hp >= 40) {
        return {
          cellX: standX,
          cellY: standY,
          engage: false,
          cadence: 15,
          reason: "se-sam-east",
          stopFirst: false,
        };
      }
      // Drift south of corridor (y≥16) under fire — snap back to stand y=14.
      if (tank.cellX >= 34 && tank.cellY >= 16 && tank.cellY <= 20 && hp >= 100) {
        return {
          cellX: standX,
          cellY: standY,
          engage: false,
          cadence: 20,
          reason: "se-sam-east",
          stopFirst: false,
        };
      }
      // SE@54 only: if free already on multi-SAM stand, hold (0x1400 covers
      // free@39,14→54,5). Climb north only if free is south and SE@54 is sole.
      if (northSe && tank.cellX >= 36 && tank.cellY > 14 && hp >= 40) {
        return {
          cellX: standX,
          cellY: standY,
          engage: false,
          cadence: 25,
          reason: "se-sam-east",
          stopFirst: false,
        };
      }
      // Hold multi-SAM stand — engine chips all SE SAMs; no weapon dive.
      if (atStand || (tank.cellX >= 38 && tank.cellX <= 40
        && tank.cellY >= 13 && tank.cellY <= 15 && seDist <= 16)) {
        return {
          cellX: standX,
          cellY: standY,
          engage: false,
          cadence: 50,
          reason: "se-sam-east",
          stopFirst: false,
        };
      }
      // Mid-corridor / stuck: direct force-move to 39,14.
      // l443: cadence 30 left free parked@40,36 mid thrash — use cadence 2 while
      // free is south of SE stand band (y>20) so path reissues every order cycle.
      if (seDist <= 20 || tank.cellX >= 24 || stuck) {
        const midSouth = tank.cellY > 20;
        return {
          cellX: standX,
          cellY: standY,
          engage: false,
          cadence: midSouth ? 2 : (stuck ? 10 : 30),
          reason: "se-sam-east",
          stopFirst: tank.cellX < 28,
        };
      }
      // South of corridor: north-east toward stand.
      if (tank.cellY > 16) {
        return {
          cellX: Math.min(Math.max(tank.cellX + 8, 32), standX),
          cellY: Math.max(tank.cellY - 8, standY),
          engage: false,
          cadence: 25,
          reason: "se-sam-east",
          stopFirst: false,
        };
      }
      // Far west: direct to multi-SAM stand.
      return {
        cellX: standX,
        cellY: standY,
        engage: false,
        cadence: 30,
        reason: "se-sam-east",
        stopFirst: true,
      };
    }
    if ((seSamTarget || !neGun) && hp >= 40
      && tank.cellY <= 22 && tank.cellX >= 14) {
      const inNeFireTheatre = tank.cellX >= 18 && tank.cellX <= 22
        && tank.cellY >= 11 && tank.cellY <= 15;
      // Hold NW chip for full residual — engine near_dist 0x1000 finishes NW
      // only while free stays in corridor (l179 free left early → NW@400).
      if (nwIsTarget && !seSamTarget && inNeFireTheatre && hp >= 40) {
        return {
          cellX: 20,
          cellY: 13,
          engage: false,
          cadence: 2,
          reason: "sam-hold-nw-chip",
          stopFirst: true,
        };
      }
      // Also hold when free is a bit south of fire cell but NW still live —
      // walk north to fire cell rather than peel SE.
      if (nwIsTarget && !seSamTarget && tank.cellX >= 16 && tank.cellX <= 24
        && tank.cellY >= 11 && tank.cellY <= 22 && hp >= 40) {
        return {
          cellX: 20,
          cellY: 13,
          engage: false,
          cadence: 2,
          reason: "sam-hold-nw-chip",
          stopFirst: true,
        };
      }
      // SE remaining SAMs only (NW dead / target retargeted). Force-move ALT
      // hop east; attack-move when within MTNK range or past x=32.
      if (seSamTarget || !nwIsTarget) {
        const seDist = seSamTarget
          ? eastBChebyshev(tank, target)
          : eastBChebyshev(tank, EAST_B_SE_SAM_APPROACH);
        if (seSamTarget && seDist <= 5) {
          return {
            cellX: target.cellX,
            cellY: target.cellY,
            engage: true,
            cadence: 2,
            reason: "se-sam-range",
            stopFirst: true,
          };
        }
        // Attack-move SE SAM only when free is in SE stand band (y≤20).
        // l443: free@40,36 with cellX≥32 used to attack-move SAM and pathfind
        // thrash mid-map (BGGY/LTNK) for ~1.2k ticks → civ cluster@34.5k.
        // South of y=20: force-move to approach stand, no SAM attack-move.
        if (seSamTarget && tank.cellY > 20 && (tank.cellX >= 28 || stuck)) {
          return {
            cellX: EAST_B_SE_SAM_APPROACH.cellX,
            cellY: EAST_B_SE_SAM_APPROACH.cellY,
            engage: false,
            cadence: 2,
            reason: "se-sam-east",
            stopFirst: false,
          };
        }
        if (seSamTarget && tank.cellY <= 20
          && (tank.cellX >= 32 || seDist <= 10 || stuck)) {
          return {
            cellX: target.cellX,
            cellY: target.cellY,
            engage: true,
            cadence: stuck ? 8 : 12,
            reason: "se-sam-attack-move",
            stopFirst: false,
          };
        }
        // Hop +8 on y≈13–15 corridor toward SE approach (x≥33 for SE@43).
        const hopX = Math.min(tank.cellX + 8, EAST_B_SE_SAM_APPROACH.cellX);
        const hopY = Math.min(Math.max(tank.cellY, 13), 15);
        return {
          cellX: hopX,
          cellY: hopY,
          engage: false,
          cadence: 15,
          reason: "se-sam-east",
          stopFirst: true,
        };
      }
      if (tank.cellY > 10) {
        return {
          cellX: Math.max(tank.cellX, 18),
          cellY: Math.max(tank.cellY - 5, 8),
          engage: false,
          cadence: 1,
          reason: "sam-post-negun-north",
          stopFirst: false,
        };
      }
      return {
        cellX: target.cellX,
        cellY: target.cellY,
        engage: true,
        cadence: 1,
        reason: "sam-post-negun",
        stopFirst: false,
      };
    }
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
    // l443: free@40,36 with NW still live used spine-far-north which kept
    // cellX=max(tank.x,21)=40 and stepped y-3 → free parked mid-east thrashing
    // BGGY/LTNK for ~1.2k ticks (civ cluster@34.5–35.3k, TRACE l442-mid).
    // Cut west to spine corridor x≈20–22 first, then north.
    if (nwIsTarget && tank.cellX >= 28 && tank.cellY > 12) {
      return {
        cellX: 22,
        cellY: Math.min(Math.max(tank.cellY - 2, 18), 30),
        engage: false,
        cadence: 2,
        reason: "spine-cut-west",
        stopFirst: true,
      };
    }
    // North on x≈20–24 until y≤7 (north of GUN@16,9). Clamp x so free does not
    // north on x=40 mid thrash lane.
    if (tank.cellX >= 20 && tank.cellY > 7) {
      return {
        cellX: Math.min(Math.max(tank.cellX, 20), 24),
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
    // GUN live: proven east detour (l16/l24) to x=40 then cut west to GUN.
    // l445e: west-early GUN approach (x≤32) free residual death — closed.
    // After GUN dead: emerge west-spine (avoid x=40 mid thrash on NW path).
    if (!gunLive) {
      approach = {
        cellX: Math.min(Math.max(tank.cellX - 4, 20), 28),
        cellY: Math.min(tank.cellY - 4, 32),
      };
      reason = "emerge-west-spine";
      cadence = 4;
    } else if (tank.cellX < 38) {
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
