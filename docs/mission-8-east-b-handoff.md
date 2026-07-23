# Mission 8 East-B handoff (resume here)

**Purpose:** machine- and human-readable checkpoint so another harness or agent
can continue Mission 8 `east-b` without replaying the full TRACE history.

**Entrypoint:** root [AGENTS.md](../AGENTS.md) requires reading this file before
Mission 8 east-b work (Grok/Claude/Codex-style agents that load project
instructions will pick that up).

| Field | Value |
|---|---|
| Status | **RED** — not release-ready |
| Branch | `browser-port` |
| Commit | `1fc974c` |
| Remote | `fork` only (`fork/browser-port`) — do **not** push `origin` |
| Primary file | `web/scripts/verify-classic-freeware-mission-one.mjs` |
| Variant | `CNCWEB_VERIFY_MISSION_VARIANT=east-b` (`SCG08EB`) |
| Companion note | [mission-8-hardening.md](mission-8-hardening.md) |
| Last TRACE suite | v221 FINE — samMin **169** @32580 (was 174); chip-band west-edge approach + in-range fire; SAM still repairs |

Update the **Commit** and **Last TRACE** rows after every checkpoint push.

---

## Goal (release gate)

Green when the Wasm verifier ends with:

- Engine win (`EVENT_GAME_OVER` win bit + campaign win)
- `finalHostiles === 0`, `finalFriendly > 0`
- No debug victory hook
- East-b extras: hospital + Moebius preserved; never ≤5 neutrals; civ lose never fires (9th Neutral unit death → `GDILOSE`)

Win path that still blocks: **kill western SAM (13,16) → unlock A-10 → clear map**.

---

## How to run

```sh
cd web
CNCWEB_VERIFY_MISSION=8 CNCWEB_VERIFY_MISSION_VARIANT=east-b CNCWEB_VERIFY_TRACE=1 \
  node scripts/verify-classic-freeware-mission-one.mjs
```

Optional: `CNCWEB_VERIFY_TRACE_FINE=1` (every 30 ticks).

Parse stderr JSON lines with `"missionEight"`. Useful fields:

- `assaultTick`, `routeStage`, `strikeUnits`, `samSites` (western SAM is `cellX:13,cellY:16`)
- `eastBStaging.freeTanks`, `eastBStaging.freeRockets`, `neutralMinimum`
- `airstrike.readyTicks` / `orders` (empty until a SAM dies)

Quick SAM min over a TRACE file:

```sh
node -e '
const fs=require("fs");
const rows=fs.readFileSync(process.argv[1],"utf8").trim().split("\n")
  .map(l=>{try{return JSON.parse(l).missionEight}catch{return null}}).filter(Boolean);
let min=9999,mint=-1,dead=-1;
for (const r of rows) {
  const w=r.samSites?.find(s=>s.cellX===13&&s.cellY===16);
  if (w&&w.strength>0&&w.strength<min){min=w.strength;mint=r.tick}
  if (w&&w.strength===0&&dead<0) dead=r.tick;
}
console.log({assault:rows.find(r=>r.assaultTick)?.assaultTick,samMin:min,at:mint,dead,
  note:'scan all stderr lines — coarse %300 sampling misses nadir between samples',
  last:rows.at(-1)&&{t:rows.at(-1).tick,rs:rows.at(-1).routeStage,
    host:rows.at(-1).hostiles,friendly:rows.at(-1).friendly,
    neutr:rows.at(-1).neutralMinimum}});
' /tmp/m8-eastb/vNN.err
```

---

## Current progress (checkpoint)

### Held (do not regress)

| Area | Evidence |
|---|---|
| Early civ window | `neutralMinimum` still **13** by tick 20k (≤1 early death) |
| Village intercept | Hospital/Moebius screen; force-move pickets; MCV/HARV never village/strike |
| Free assault launch | ~tick **28.0k**, **3 free MTNKs** staged at assembly `{39,57}` |
| SAM pack at launch | Typically **3 free E3** + free MTNKs (was often 0 E3) |
| Western route stages | forceMove corridor → GUN `{11,18}` → SAM `{13,16}` |
| Stage thrash fix | Northbound force-move counts “already past” tanks as arrivals |
| Best first-wave SAM chip | **~200–204** HP remaining (TRACE v43/v55 class) |
| Finisher logistics | Village loan chain + free MTNK→strike (not village re-home) while SAM chipped |
| Emergency cash | Can sell NUKE when strike empty + SAM chipped + funds &lt; 800 (funds often stuck ~740) |

### Still broken

| Symptom | Detail |
|---|---|
| Western SAM not dead | Never reaches 0; no A-10 (`readyTicks` empty) |
| First-wave wipe | GUN/SAM dual fire shreds armor before finish (~300 ticks) |
| Finisher late / thin | Second wave often arrives with SAM still **280–360** and dies in one exchange |
| Free tanks east-wander | Mid-assault free MTNKs at `x≈32–45` then re-rail (costs HP/time) |
| E3 corridor deaths | Fixed in latest WIP by parking E3 at `{13,32}` until routeStage ≥ 5; re-verify |
| Post-wave economy | Harvest often freezes; rebuild MTNK late; NUKE sell can blackout WEAP briefly |
| **Tank pathfinding off-corridor** | Partially improved: east-of-spine tanks detour south to X=13 (v76: id=29 14,22→13,26); still need finisher overlap |
| **GUN respawn** | Not re-landed — prior WIP regressed samMin to 400; dropped for v76 minimal patch |
| **SAM chip** | v86: **400→330** @32400; strike wipes; SAM repairs/stuck; no A-10 |
| **NUKE sell** | Selling sole NUKE blackouts WEAP — only sell when **2+ NUKEs** remain |

### Latest TRACE shape (v76)

- Assault ~28020: freeT=3, freeR=3, strike includes base scrap MTNK
- E3 parked at support hold through stages 0–4; present at GUN/SAM
- SAM min **330** @32400 (improved from committed baseline 360); **not killed**; no A-10 unlock
- Tank id=29 detoured east-of-spine via south rail (14,22→13,26); tank 5 chipped from 10,20
- Strike wiped by tick ~32400; SAM stuck at 330; funds/rebuild not tested
- Lose: civ pressure (neutralMinimum 7 @38400)

East A: **deferred** (HAND kill / maxWest 9 checkpoint earlier; full clear red).

---

## Key code map (`verify-classic-freeware-mission-one.mjs`)

| Topic | Where / constants |
|---|---|
| East-b route | `missionEightRoutes["east-b"]` — stages 0–7 forceMove then GUN/SAM |
| Assault tanks | `missionEightEastBAssaultTankCount = 3`, min tick `22_000`, soft follow-up +6k |
| Village tanks | `missionEightEastBVillageTankCount = 2` (late still 2) |
| Staging cells | assembly `{39,57}`, reserve `{27,57}` |
| SAM pack production | `eastBSamPackPhase`, MTNK-first, gap-fill E3 when pack &lt; 4 |
| Wave-two / rocket park | `eastBWaveTwoKeys`; E3 + base scrap held at `{13,32}` until `routeStage >= 5` |
| GUN/SAM micro | `samChipBand` form (221–279 HP); deep finisher @ routeStage 7; `queueEastBSamSpineFinisherRail` hoisted before GUN/SAM `return`; `eastBSamSpineFinisherHoldKeys` hold @ `{13,32}` until chip band |
| West rail | Hard-rail east wanderers onto X=13; spine finisher uses shared `queueEastBSamSpineFinisherRail` when west-rail block runs (post-GUN/SAM return) |
| Pathing sample | `eastBSamSpinePathSample` — placement `generallyClear` on spine cells; logged once on first SAM chip (`eastBSamSpinePath` in TRACE) |
| Village→strike loan | When `routeStage >= 5`; last village tank if strike empty + SAM chipped |
| Free tank assignment | While SAM chipped, unassigned free MTNK → **strike**, not village |
| Emergency sell | `eastBSamFinishSellTick`; sell NUKE if funds &lt; 800, strike empty, SAM chipped |

---

## Closed / avoid

| Idea | Why |
|---|---|
| Design A (east-a WEAP/MTNK pad) | Cash/PROC/prereq dead-end — see hardening note |
| Hold a free produced tank as wave-two | Leaves 2-tank first wave; GUN dies poorly (v56) |
| Soft standoff only at y=23 on SAM | Outside medium-tank range; no damage for hundreds of ticks |
| Village re-absorb free MTNK while SAM chipped | Finisher never leaves base (v60) |
| E3 as preferred corridor screen | Wipes pack before GUN (v40) |
| x≥12-only `samAttackers` + E3 `samRocketKillReady` gate | v112 samMin **396** — no chip |
| E3 commit only when SAM≤300 + overlap (no tank change) | v114 samMin **346** — E3 survive but under-chip |
| Block joiners during first-wave chip | v115 samMin **328** |
| Demote non-corridor strike MTNK during chip | v116 samMin **400** — assault broken |
| Wave-two hold until SAM≤280 + joiner gate | v117 samMin **400** — tanks stuck @13,32 (too broad) |
| holdFirstWaveStack + wave-two until SAM≤280 | v120/v122 samMin **183** @32400 coarse; FINE **177** @32430 with deep-chip latch |
| E3 commit on deep-chip latch alone | v139 — E3 already dead; no gain |
| Deep-chip attack-move to SAM | v141–142 — tanks stall 1 cell outside weapon range (Chebyshev 6); repair wins |
| Deep-chip close-or-fire @ `{13,20}` only | v144 — samMin **163** @32430 (was 177); 15,22 never reaches fire line in time |
| `eastBSamDeepChip` latch @ SAM≤280 | v148 — samMin **264** stall; bypasses working chip focus path |
| E3 hold until SAM≤220 (focus block) | v151 — samMin **264** stall; same interference with chip path |
| Pre-close east tanks during 221–280 band | v149 — samMin **246**; conflicts with focus chip orders |
| `samCloseCell` east `{14,20}` / spine `{13,21}` | v155 — still **163** @32430; 15,22 pathing stalls at y=22 |
| Deep-block early return removed | v171 — samMin **186** @32520; E3 chip timing worse |
| Deep-block west force-move `{11,20}` | v172 — samMin **186**; tanks reach 11,20 after repair starts |
| Chip-band attack-move rush to SAM | v168 — samMin **234** stall; 0 shooters |
| E3 hold unless `samTanksFiring` in chip band | v166 — samMin **234** stall |
| Kill finisher all tanks @ latch (≤220) | v181 — samMin **186**; 11,20 shooter @32640 too late |
| `samKillRail` after GUN/SAM `return` | dead code on SAM waypoint — never ran |
| East-column west-rush @ SAM≤180 | v188 — samMin **174** held; 14,22 not 11,20; 0 shooters |
| E3 split + west pre-position @ chip band | v191 — SAM **234** stall; E3 wipe early |
| Edge attack-move dist 6–7 @ SAM≤180 | v194 — samMin **180**; E3 chip worse |
| Chip-band west pre-position (needsClose) | v196 — SAM **234** stall; keep west pre inside deep block only |
| East rush @ SAM≤200 / ≤186 (all east column) | v198/v200 — samMin **180** |
| Dist-6 nudge to `{11,21}` | v199 — tank stuck @11,22; blocks west pre |
| Dist-6 edge fire @ deep block | v206 — no damage; MTNK needs cheb≤5 |
| Chip-band west pre (one tank) | v207 — samMin **170** but tank#6 dies @32520 |
| Chip-band east pre (cellX≥15) | v208 — SAM **234** stall |
| E3 delayed commit @ SAM≤200 | v212 — samMin **198** stall |
| Full north-flank all tanks @ deep block | v214 — samMin **180** |
| Timed spine finisher rail (produced MTNK) | v218 — samMin **174** held; tank#4 @13,24 @ nadir; GUN approach override fixed; west rail dead during routeStage 7 |
| Assign-roles spine candidate scan | v219 — samMin **400** stall; do not pull corridor/strike tanks into hold via role scan |
| v219 three-lever bundle | samMin **174** @32580 held; hoisted rail + `{13,32}` hold (y≥28 emergence) + path sample all-clear |
| Reserve strike MTNK @ routeStage 5 | v220 — samMin **266** stall; pulls wave-two/base-scrap (#4) off chip; SAM never ≤240 to release |
| Deep-kill spine pick proximity / y≥21 | v220 — samMin **180** @32550 regression; damaged west-edge tank pulled off chip too early |
| West-edge dist-6/7 close pass (deep block) | v220 — samMin **174** held; tank#6 11,22→10,21 @32610 (~30 ticks late); id#29 15,22 unchanged |
| Chip-band west-edge approach (221–280) | v221 — samMin **169** @32580; #6 pre-rails to 11,20 during chip; fires @ nadir but solo DPS; dies ~32640; SAM repairs |
| East-column dist-6 SAM attack-move | v221 — no gain; #29 stays @15,22 |

---

## Recommended next work (ordered)

1. **Held best (v221)** — samMin **169** @32580; #6 @11,20 fires @ nadir; repair wins @32610 (179 HP); #6 dead @32640.
2. **Second shooter** — #29 @15,22 dist 6 never closes; spine #4 stuck @13,24 — need simultaneous dist≤5 @32580 (profile why #29 ignores east SAM order).
3. **E3 pack** — 0 E3 @32580; rocket commit during deep kill may recover finisher DPS.
4. **Do not** reserve wave-two/base-scrap @ routeStage 5; do not full west-edge close during chip band (only approach dist 7–8 + in-range fire).

---

## Harness resume checklist

```text
[ ] git checkout browser-port && git pull fork browser-port
[ ] Read this file + mission-8-hardening.md east-b section
[ ] Run TRACE (command above); record samMin / assaultTick / freeR at assault
[ ] If samMin > 280: first-wave / pathing regression — fix tank pathfinding to X=13 + GUN form first
[ ] If samMin ~200 and no death: finisher timing / rebuild — fix loan + production
[ ] If SAM dies: pursue A-10 + map clear; re-check civ lose diagnosis
[ ] Check GUN respawn: GUN at (11,18) destroyed ~31770, respawns ~33060 — code re-engages but tanks can't reach
[ ] Checkpoint: commit message WIP, push fork only; update commit hash in this table
```

## Related commits (fork history)

| Commit | Note |
|---|---|
| `7494ba7` | **This checkpoint** — SAM pack + finisher path (~200 chip; handoff doc) |
| `74bfbe4` | Softer assault gate + E3 push prep (SAM min ~288) |
| `1bc9b69` | Fund follow-up tank before western assault |
| `9e51b46` | SAM chip ~278 + solo finish path |
| `a7d8541` | 3-tank western push (~276) |
| `a14defd` | Western strike reinforcement |
| `28b5df5` | Early civ intercept |

After the next checkpoint: prepend a row and bump the table **Commit** field.
