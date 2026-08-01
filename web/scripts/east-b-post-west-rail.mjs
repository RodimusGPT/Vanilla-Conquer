/**
 * Pure post-west remaining-SAM approach for east-b free tanks.
 *
 * Best TRACE paths:
 * - l16: free@395 35,55→42,33→42,29→33,26→27,19→19,18 (GUN theatre, full HP)
 * - l25/l28: free@395 reached y=9–12 via east detour but could not path west to
 *   NW SAM{12,5}; NE rim is a dead end.
 * - l18: free@335 at 11,20 (GUN fire line) — close enough to trade with GUN.
 * - l30: early cut-west at y=28 thrashed mid-map (west blocked).
 *
 * Rail: pad north → east mid detour (x≈40) → cut west-north to ~20,18 (l16)
 * → GUN standoff/kill → spine north to NW SAM. Healthy free engages GUN.
 */
export function eastBPostWestRailApproach(tank, target, westernGun, opts = {}) {
  const soleFree = opts.soleFree !== false;
  const stuck = Boolean(opts.stuck);
  const hp = tank.strength ?? 400;
  const dist = Math.abs(tank.cellX - target.cellX) + Math.abs(tank.cellY - target.cellY);
  if (dist <= 5) {
    return {
      cellX: target.cellX, cellY: target.cellY,
      engage: true, cadence: 5, reason: "sam-range",
    };
  }

  const gunLive = Boolean(westernGun && westernGun.strength > 0);
  const gunDist = gunLive
    ? Math.abs(tank.cellX - westernGun.cellX) + Math.abs(tank.cellY - westernGun.cellY)
    : 999;
  const healthy = hp >= 250;

  // Engage GUN when close. TRACE l32: free@11,20@255 still healthy enough to
  // finish the trade — only abort below 80 HP (flee left free@61 useless at hold).
  if (gunLive && gunDist <= 5) {
    if (hp >= 80 || !soleFree) {
      return {
        cellX: westernGun.cellX, cellY: westernGun.cellY,
        engage: true, cadence: 3, reason: "gun-adjacent",
      };
    }
    return {
      cellX: 18, cellY: Math.min(tank.cellY, 22),
      engage: false, cadence: 3, reason: "gun-flee-east",
    };
  }
  // Healthy free in GUN theatre: direct attack so engine paths into range
  // (l31 free@16,21@395 thrashed on standoff cells without hunting).
  if (gunLive && hp >= 200 && tank.cellY <= 24 && tank.cellX <= 22 && gunDist <= 12) {
    return {
      cellX: westernGun.cellX, cellY: westernGun.cellY,
      engage: true, cadence: 4, reason: "gun-hunt",
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
    // Past mid-band: cut west-north toward GUN theatre (l16 42,29→27,19).
    // Do NOT order x≤16 yet (l30 thrash at y=28–32).
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
    // GUN theatre (y≤22): close standoff then engage.
    if (tank.cellX > 16) {
      approach = { cellX: 15, cellY: Math.min(tank.cellY, 20) };
      reason = "gun-approach";
      cadence = 10;
    } else if (gunDist > 5) {
      approach = { cellX: 13, cellY: 20 };
      reason = "gun-standoff";
      cadence = 8;
    } else {
      approach = { cellX: westernGun.cellX, cellY: westernGun.cellY };
      reason = "gun-close";
      cadence = 5;
    }
  } else if (tank.cellY > 10) {
    // GUN dead: western spine north to NW SAM.
    approach = { cellX: 12, cellY: Math.max(tank.cellY - 4, 8) };
    reason = "spine-north";
    cadence = 8;
  } else {
    approach = { cellX: target.cellX, cellY: target.cellY };
    reason = dist <= 6 ? "sam-close" : "to-sam-standoff";
    cadence = 5;
  }

  if (stuck) {
    if (gunLive) {
      approach = { cellX: 13, cellY: 20 };
      reason = "gun-standoff-stuck";
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
