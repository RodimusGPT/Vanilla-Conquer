# Mission 8 East-B handoff (resume here)

**Purpose:** machine- and human-readable checkpoint so another harness or agent
can continue Mission 8 `east-b` without replaying the full TRACE history.

**Entrypoint:** root [AGENTS.md](../AGENTS.md) requires reading this file before
Mission 8 east-b work (Grok/Claude/Codex-style agents that load project
instructions will pick that up).

| Field | Value |
|---|---|
| Status | **RED** — residual **≥249** (l168 key-turret chip); free peels **@242**; NE GUN chipped **~244–340** not killed; NW **400**; lose ~39–41k |
| Branch | `browser-port` |
| Commit | `(pending l173)` |
| Remote | `fork` only (`fork/browser-port`) — do **not** push `origin` |
| Primary file | `web/scripts/verify-classic-freeware-mission-one.mjs` + `web/scripts/east-b-post-west-rail.mjs` + `tiberiandawn/building.cpp` |
| Variant | `CNCWEB_VERIFY_MISSION_VARIANT=east-b` (`SCG08EB`) |
| Companion note | [mission-8-hardening.md](mission-8-hardening.md) |
| Last TRACE suite | l168–l173 key-turret finish chip + NE GUN engage: residual **249@14,22**; NE GUN **244–340** (was 400); NW 400; free dies trading NE GUN |

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

**Prefer the wrappers** (explicit 8 GB heap on the `node` command line — required in Cursor):

```sh
cd web
./scripts/verify-east-b-gate.sh                           # pass/fail, no trace
./scripts/trace-east-b-kill-window.sh                     # kill-window trace → /tmp/m8-eastb.trace.err
node scripts/parse-east-b-trace-sam-min.mjs /tmp/m8-eastb.trace.err
```

Partial sim for strategy debug (not a release gate):

```sh
cd web
CNCWEB_VERIFY_MAX_TICKS=33000 ./scripts/verify-east-b-gate.sh
```

Manual gate-check (only if you must — add heap flag yourself):

```sh
cd web
node --max-old-space-size=8192 scripts/verify-classic-freeware-mission-one.mjs
# with: CNCWEB_VERIFY_MISSION=8 CNCWEB_VERIFY_MISSION_VARIANT=east-b
```

Manual TRACE (only if you need custom tick bands):

```sh
cd web
CNCWEB_VERIFY_MISSION=8 CNCWEB_VERIFY_MISSION_VARIANT=east-b CNCWEB_VERIFY_TRACE=1 \
  node --max-old-space-size=8192 scripts/verify-classic-freeware-mission-one.mjs
```

Optional env vars: `CNCWEB_VERIFY_TRACE_FINE=1` (every 30 ticks), `CNCWEB_VERIFY_TRACE_COMPACT=1` (omit heavy east-b fields), `CNCWEB_VERIFY_TRACE_TICK_MIN` / `_MAX`, `CNCWEB_VERIFY_TRACE_INITIAL=0`, `CNCWEB_VERIFY_MAX_TICKS`, `CNCWEB_VERIFY_HEAP_MB` (default 8192 in wrappers).

**OOM note:** A crash at **~2046 MB** means the default ~2 GB heap was used — `NODE_OPTIONS` was not applied. Always pass `node --max-old-space-size=8192` (the wrappers do this). Also:

- Do **not** run ungated FINE trace on a full east-b run (~4k JSON lines).
- Redirect stderr to a file for TRACE (`trace-east-b-kill-window.sh` does this).
- Use `./scripts/verify-east-b-gate.sh` for regressions (no trace).
- Parse traces with `parse-east-b-trace-sam-min.mjs` (streams; never load the whole file in agent context).

Kill-window TRACE (equivalent manual command):

```sh
cd web
CNCWEB_VERIFY_MISSION=8 CNCWEB_VERIFY_MISSION_VARIANT=east-b \
CNCWEB_VERIFY_TRACE=1 CNCWEB_VERIFY_TRACE_FINE=1 \
CNCWEB_VERIFY_TRACE_COMPACT=1 \
CNCWEB_VERIFY_TRACE_TICK_MIN=32400 CNCWEB_VERIFY_TRACE_TICK_MAX=32800 \
CNCWEB_VERIFY_TRACE_INITIAL=0 \
node --max-old-space-size=8192 scripts/verify-classic-freeware-mission-one.mjs 2>/tmp/m8-eastb.trace.err
node scripts/parse-east-b-trace-sam-min.mjs /tmp/m8-eastb.trace.err
```

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

### Post-west (v390–v397) — held

| Area | Evidence |
|---|---|
| Western SAM kill | **Held** — dead ~tick 33.0k |
| Free→strike promote | **Held** — post-west free in `strikeKeys` @400 HP |
| Dead-SAM gate | Corpse at (13,16) no longer blocks push |
| Pad escape + east detour | free@400: `35,55→42,33→42,29→~24,19` (l16/l28/l32) |
| Pure rail helper | `east-b-post-west-rail.mjs` + unit tests (imported by verifier) |
| WEAP@400 through free transit | Held until free mid-map (~39k); pinned non-postWest defender |
| Secure release | WEAP≥80% → free leaves immediately |
| Village E3 after free | After mtnk busy / free≥1 (never before MTNK buy) |
| North rim / GUN theatre | Best north **y=9@395** (l28); **GUN dead @38700** (v399 l68 2v1) |
| GUN TRACE field | Compact TRACE `westGun` strength |
| Partner free / FACT cash | Early FACT sell post-west → funds **2816**, freeT **3** (l67–l68) |
| Partner rendezvous | Hold free mid-east until ≥2 free MTNKs at y≤36, then GUN 2v1 |
| Post-GUN spine | Micro-step x=13 + stop-first force-move; SAM attack-move only y≤16; no south-rally free x≤24 y≤40 str≥40 |
| Post-GUN promote | Never demote free on spine to WEAP picket; re-promote stuck pickets |
| Post-GUN GUN latch | `eastBPostWestGunClearedTick` — ignore GUN respawn after first kill (free stays on NW spine) |
| Post-GUN east peel | peel x=18 → y=16 → dodge x=20+ → far-north to y=7 → SAM AM (l146); free **108@21,10** |
| Post-GUN keep NUKE | Do not sell last NUKE after GUN (extends lose past free approach) |
| GUN finish standoff | When GUN≤100 and free dist≤3, pin SE fire cell (l117); kill held free@128 |
| Post-GUN NUKE | **Keep** last NUKE (l141/l142) — selling ends game ~39058 with free still alive; cash 240 never bought free#4 |
| Post-GUN free residual | Best **128** at GUN death; far-east peel to **128@21,11** (l142) |

### Still broken

| Symptom | Detail |
|---|---|
| Remaining 4 SAMs | All **400** — free reaches y=10@108 (l146) still Cheby 5 from NE GUN@16,9; never chips NW |
| Post-GUN survivors | far-east **108@21,10** (l146 FINE) / **128@21,11** (l142); cut-west / NE GUN clear / residual≥200 closed l148–l151 |
| Village / civs | minNeut **7**; lose ~41257 civ-near after free dies |
| A-10 / clear | Needs all five SAMs dead |

### Avoid (post-west levers closed with TRACE)

| Idea | Why |
|---|---|
| E3 pad-screen before free MTNK | v396f/g spent rebuild cash → no free, WEAP dead |
| Forever-picket free on WEAP | v396 free+WEAP both die |
| Pre-free village E3 | Burns cash; free never builds |
| Force west at y≈35 | Mid-band west blocked — thrash @28,35 (l24) |
| Long NW diagonal / {12,8} from spine | Paths through GUN — death @10,21 (l20) |
| Direct SAM attack from y=12–15 | Pathfind routes south into GUN (l27) |
| North-rim west cut at y=9 | Pathfind detours east to x=39 (l28/l29) |
| Partner free via sole NUKE sell | Refund insufficient; funds never hit 800 (l21–l33) |
| Point-blank GUN attack-hunt | free paths into turret, worse trade (l32) |
| Scrap MTNK 2v1 loan | only 1 live MTNK after pad; vg keys are infantry (l38–l42) |
| E3 rocket assist alone | atk rose mid-fight; gunMin still 180 (l45) |
| Early sole-NUKE sell for partner (pre-free, funds≥50) | Cash thrash; free never emerges (l47); WEAP blackout |
| Keep last NUKE + harvest for partner free | funds stuck ~4, WEAP dead before 800 (l49); same gunMin 180 |
| PROC+PYLE only (post-free) | peak funds **624** <800 (l63/l64) |
| PROC+PYLE+last-NUKE (post-free) | peak **774** <800; last NUKE power risk (l65) |
| Post-free FACT sell | FACT already dead to raiders ~36.6k (l66) |
| freeT≥2 without mid-map rendezvous | free#1 alone at GUN → gunMin 180 (l67) |
| freeT cap@2 while GUN live | funds 890 but GUN not killed; sole free@17,20 idle (l72–l74) |
| freeT cap@2 + dist-6 engage | free#2 stuck @17,20; gunMin 170–250 no kill (l78–l79) |
| Sell last NUKE while GUN ≤100 | Mid-2v1 power blackout; gunMin 200 no kill (l80) |
| freeT=2 bank 800 for post-GUN free#3 | free#2 never finishes GUN from SE idle (l78–l79) |
| No GUN attack-order until ≤80 (fire-cell hold only) | free@359 HP but gunMin 160 no kill — auto-acquire insufficient (l84) |
| Wounded peel-east (multi free) | gunMin 220 no kill — cut GUN DPS (l88) |
| Wounded outer standoff (hp&lt;220 dist≤5) | gunMin 180 no kill (l89) |
| WEAP defender release after free mid-north | No non-postWest MTNK survivors; TRACE = l85 (l86/l90) |
| FIX mid-map free repair | No FIX on east-b base; free bleeds mid-north far from pad (l86 analysis) |
| Attack-in-place (pin fire cell + slow attack cadence) | GUN kill held (l92/l93) but free residual **15** @14,22 worse than l85 **108** @11,22; NW still 400 |
| Ultra-strict dist-4-only GUN engage | free@17,20 dist 6 never fires; gunMin ~210 (l74) |
| freeReady y≤40 (with freeT=3) | weaker than y≤36 rendezvous for 2v1 kill path (l72) |
| Pre-free FIX from FACT cash + mid-pad heal | l95–l96: **fixSeen false** — free already live when funds hit 2816; gate `freePostWestLive&lt;1 && funds≥1300` never opens; free bleeds mid-north anyway (l86) |
| Village E3 cap5 / freeT≥3 top-up | l96: funds sit **~90** after freeT=3; E3 costs 300 — no-op; closed |
| Post-west hospital MTNK anchor (1 armor hold) | l96/l97: gunMin **190** no kill; freeT 3→2 @36900; minNeut 8 but lose **38253** earlier than l85 **38995** — **reverted** |
| Always-on hospital anchor (pre-west too) | l95: western SAM **never dies**; assault thinned; freeT→0; lose civ@38122 — **reverted** |
| Pure SAM attack-move from GUN pad (x≤11) | l100: pathfind into Nod base → death @10,21/11,20; NW 400 |
| Early spine peel healthiest free at GUN≤100 | l103: cut 2v1 DPS → GUN repairs 90→110; no kill; free@7 |
| Re-engage western GUN respawn with free residual | l101: free re-pulled to GUN@370 @39900; never NW — **latched ignore (l102/l104)** |
| Long force-to-y=9 without combat stop | l98: free freezes ~90t @14,22 under auto-acquire |
| Hard cut-west rush `{13,8}` at y≤18 | l107: free thrash @17–18,y=18–20; minY 18 worse than l106 y=14 |
| Tight east peel x=15 only | l108: free stuck @14,22 (no peel gate); minY 22 — **keep peel x=18 (l106)** |
| Post-GUN E3 escort + free-clear threats | l109: free diverted off east peel; minY 21 worse than l106 y=14 |
| Cut-west at y=13 / long force west | l111: free never left x=19; stuck then die |
| Diagonal west+north micro-step early | l112: free bled 128→90; minY 20 — closed |
| Far-east peel x=22 | l113: free bleeds peels east; minY 21 worse than l110 y=12 |
| Attack NE GUN@16,9 mid peel | l114: free@19,13 engages then dies 128→88; no NW gain vs l110 |
| North-to-y=16 then dodge east x=22 | l115: free@128@21,16 but minY 16 (no further north); die ~39058 — closed |
| Scrap/E3 kill NE GUN@16,9 while free peels | l116: free path = l110 (scrap too late/absent); no NW gain |

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
| GUN/SAM micro | `samChipBand` form (221–279 HP); deep finisher @ routeStage 7; `queueEastBSamDeepFinisher`; partner `eastBSamPartnerWestStep` / `queueEastBSamPartnerWestRoute` (non-produced MTNK); spine finisher `eastBSamDeepSpineFinisherPick` |
| West rail | Hard-rail east wanderers onto X=13; spine finisher uses shared `queueEastBSamSpineFinisherRail` when west-rail block runs (post-GUN/SAM return) |
| Pathing sample | `eastBSamSpinePathSample` — placement `generallyClear` on spine cells; logged once on first SAM chip (`eastBSamSpinePath` in TRACE) |
| Village→strike loan | When `routeStage >= 5`; last village tank if strike empty + SAM chipped |
| Free tank assignment | While SAM chipped, unassigned free MTNK → **strike**, not village |
| Emergency sell | `eastBSamFinishSellTick`; sell NUKE if funds &lt; 800, strike empty, SAM chipped |
| Post-west free rail | `eastBPostWestRailApproach` in `east-b-post-west-rail.mjs`; `queueEastBSamPostWesternSamPush` |
| Post-west promote | `eastBPostWestPromoteCombatTanks`, `eastBWeapSecureForSamPush`, pinned `eastBPostWestWeapDefenderKey` |

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
| E3 hold @13,30 until SAM≤186 | v222 — samMin **201** regression; reverted |
| Spine kill-close @ SAM≤220 | v222 — samMin **201** regression; narrowed to ≤186 |
| East-column kill-line + spine close (v222) | samMin **169** held; orders queue but #29 @15,22 / #4 @13,24 never close |
| Chip-band east dist-6 @ SAM≤234 | v223 — samMin **234** regression; #6 dies @32430; reverted |
| Kill-window occupancy profile (v223) | terrain clear; `{14,21}` often has transient **120mm** @32580 (v224); `{11,20}` has MTNK#6+SMOKE |
| Spine one-cell north + east `{14,21}` close | v223 — samMin **169** held; #29/#4 still ignore attack-move |
| Kill-line clear-cell picker + force east close | v224–v226 — samMin **169** held; `{14,20}` clear but #29 @15,22 still frozen (engine path block x≥15, not order overwrite) |
| Deep-chip east spine detour @ x≥15 | v227 — samMin **214** regression; #6 dies @32520 early; reverted |
| Chip-band east dist-6 @ SAM≤280 | v227 — samMin **214** regression; reverted to ≤205 |
| Spine west detour `{12,y}` @ x=13 y≥24 | v230 — samMin **169** held; #4 still drifts to `{14,23}` not north |
| Skip spine-rail when spine-close active | v229 — samMin **169** held (no duplicate spine orders) |
| v231 three-lever bundle (chip pre-pos + spine detour + E3 gate) | samMin **234** @32310 — #6 wiped early; **reverted** |
| E3 west-shooter gate in deep finisher only | v232/v235 — samMin **169** held; E3 still dead @32580 (already @10,17) |
| Spine finisher rush-to-SAM @ y≥24 | v234 — samMin **400** assault broken; **reverted** |
| E3 kill-hold @13,28 during SAM 187–280 | v237 — samMin **212** @33030; chip DPS lost, #6 dies early; **reverted** |
| Chip-band south detour in SAM form (v245/v249/v259/v261) | samMin **234** — #6 wiped early; **do not** start detour in chip-band form |
| West-edge dist-7 guard (v249/v250) | samMin **218** regression; **reverted** |
| Kill-line dist-7 east pull @15,23 (root cause) | westEdgeKill `{14,22}` steal — fixed v256+ via `eastBSamEastKillCorridorTank` skip |
| East kill-corridor detour (deep block only, v260/v263) | samMin **169** held; #29 path 15,22→14,22→…→12,23 but ~270t late; #6 solo @ nadir |
| Detour rush modifier @ SAM≤200 (v262) | samMin **234** regression; **reverted** |
| Spine corridor yield + finisher suspend (v264–v267) | samMin **169** held; #4 stays @13,23; no nadir gain |
| SAM 221–240 corridor-early detour only (v268) | samMin **139** @32580 (best); **171** on repeat; run variance |
| Spine finisher corridor skip (v270–v278) | **171** stable ×3; #29 holds 15,24 @32460 (no 14,22 snap); #29 @13,23 @32580 — still dist 6, SAM repairs |
| Partner west step (v295–v297) | **171** stable ×3; #29 @**12,23** @32580 (was 13,23); #6 still dead; #4 @12,25 |
| West-first partner detour + chip-band partner (v298–v301) | **171** held; path still 15,23→15,24 @32430 (engine pathfind); no nadir gain |
| Partner hoist + NW force @x=15 + E3 west-lead (v302–v303) | **171** stable ×3; #29 path unchanged |
| Partner pick easternmost globally (v310/v311) | samMin **234** @32400 — chip-band pulled #29 west too early; **reverted hoist** |
| Split partner pick: chip-band westernmost / deep easternmost + spine-key exclude (v312) | **171** stable ×3; deep finisher targets #29 not #4; kill-window positions unchanged |
| Partner force-rush @ SAM≤200 x≥13 (v313) | **171** held; no nadir gain — **closed** |
| Spine designated force-north @ SAM≤186 (v314) | **171** held; #4 still @12,25 — **closed** |
| Partner detour `{14,22}` shortcut @ y≥24 (v315) | **171** held; #29 still @15,24 @32430 — **closed** |
| East-spine west-first @ x≥15 SAM≤235 (v316) | **171** stable ×3; #29 @14,22 @32400 but @13,23 @32580 (was 12,23) — **reverted** |
| Partner force @ x=13 y≥23 SAM≤186 (v317) | **171** held — **closed** |
| Partner north-first + kill-line @ x=13 (v318) | **171** held — **closed** |
| Partner flank rush + spine designated-first (v319–v320) | **171** held; spine pick hoisted — **kept v320** |
| Deep west-flank rush dist 6–7 @ x=13–14 (v323) | **171** held; engine ignores cell rush — **closed** |
| x=15 west-first + corridor-early 221–240 (v324–v327) | samMin **139** @32580 stable ×5; #6 @11,20 survives; #29 stuck @14,22 (dist 6) |
| x=14 global west-first detour (v325) | samMin **171** regression — **closed**; stalls #29 @14,22 without 139 chip |
| Spine designated one-step north @ y≥24 (v327) | **139** held; #4 12,25→12,24 post-nadir — **kept** |
| v328–v329 spine north overlap + attack SAM | **139** held; `eastBSamSpineFinisherKey` undefined at nadir — **closed** |
| Deep spine pick via partner exclude (v337) | Picked **#29** @14,22 — produced #29 drops from partner pick → #4 mis-tagged partner — **closed** |
| Deep spine pick x=13 first (v338) | samMin **134** @32580 stable ×5; #4 @ `{13,24}` @ nadir; #29 @ `{14,22}` |
| Spine north / rush / partner dist-6 fire (v339–v344) | **134** held; #4 still `{13,24}` @32580; engine path rate limited — **closed** |
| Chip-band spine pre-position (v345/v348) | samMin **218/177** — breaks #6 west lead @ `{11,20}` — **closed** |
| Spine rush y≥23 (v349) | **134** held; #4 drifts `{14,22}` post-nadir — **reverted** |
| Post-nadir spine recovery (v352/v353) | **134** held; corridorHold `<80` + onSpine14 recover — engine keeps #4 @ `{14,22}` |
| Chip-band partner switch when westLead @ `{11,20}` (v354) | **134** held — no nadir gain |
| Chip-band spine north pre / finish-rail / west-rail / form rally → `{13,21}` (v358–v360) | **134** held; #4 path unchanged — order targets not the limiter |
| Loosen westLead gate to `{10,21}` + rush `{13,21}` (v355) | samMin **155** regression — **closed** |
| x=14 spine align during chip band (v361) | samMin **216** ungated — #6 wiped; gated ≤240 no gain — **closed** |
| E3 nadir hold / chip-band rocket hold (v362) | samMin **230** — #6 wiped early; E3 chip needed for west lead — **closed** |
| x=14 y=22–24 west detour @ SAM≤240 (v363) | samMin **171** stable ×3 — same class as v325 x=14 west-first — **closed** |
| Partner westLead switch + village loan @ thin strike (v363 bundle) | samMin **171** — reverted with detour — **closed** |
| Produced-tank early release + demote skip + samEarlySpineRail (v364) | samMin **134** ×5; #27 @ `{5,46}` @ nadir — path rate too slow to help — **closed** |
| Corridor-hold release @ SAM≤200 + partner north @ dist 7 (v365) | samMin **150** regression — **closed** |
| Village loan @ samKillWindow when strike≤1 && SAM≤180 (v366) | samMin **134** held; 3 strike MTNK @ nadir — gate never fires — **closed** |
| Spine contextual attack dist 6–8 @ SAM≤180 (v367) | samMin **134** held — **closed** |
| `releaseChipBand` during deep chip (v368) | Earlier civ lose @39625, samMin **134** — **closed/reverted** |
| Deep produced-tank rush + chip-band `{13,20}` rail @221–280 (v369) | samMin **134** held — **closed** (kept fire-line target in deep north + v366 loan) |
| Chip-band spine trailer rally → `{13,20}` not `{13,24}` (v370) | samMin **134** held — **closed** (path rate unchanged; engine ~1 cell/30t) |
| Spine finisher west-flank @ dist≥7 + hold x=12 (v372) | samMin **134** held; #4 reaches `{10,21}`@32730 firing but SAM already repairing — **held** |
| Early west column @ y≥26 when SAM≤240 (v373) | samMin **155** regression — **closed/reverted** |
| Partner #29 dist-6 direct fire (west edge kill-line fix, v374) | samMin **98** @32670 — **held**; #29 survives @ `{14,22}` through nadir |
| Deep finish rush @ dist-6 SAM≤120 (v375) | samMin **98** held; earlier civ lose — **closed/reverted** |
| One-step north `{11,21}` @ dist-6 (v381) | samMin **98** held; #4 frozen `@11,22` — **closed/reverted** (same class as v199) |
| Untimed spine defer / west-finish override (v383) | samMin **104**; #6 dies @32640 — **closed** |
| Timed spine defer @ SAM≤100 or y≤23 (v384) | samMin **98** held; same kill-window as v382 — **held** |
| v386 bundle: SAM≤100-only defer + nadir burst + post-kill push | samMin **98** held; #4 fires @ dist-6 `{11,22}` @ nadir but #6/#29 die @32700; SAM repairs — **held (no gain)** |
| Pre-nadir west-finish @ SAM≤130 / y≤23 (v387) | samMin **98** held; #4 still `@10,21`@32730 — path rate unchanged — **closed** |
| Finisher pick inversion / west-line spine defer (v388) | Pick inversion @ SAM≤120 → samMin **104** (#6 dies @32640); surgical spine-close defer @ SAM≤120 → samMin **98** held, #4 still `@10,21`@32730 — **closed** |
| GUN respawn re-engage @ `{11,18}` (v389) | samMin **98** held; GUN respawns @~33060 @400 HP; lone #27 spine-rails, dies @~33300 — **closed** |

---

## Recommended next work (ordered)

1. **Held (v353 + v360 + v364)** — deep spine pick x=13 (#4); samMin **134** stable; #6 @ `{11,20}` @59 HP; chip-band rally/rail target `{13,21}` (no regression).
2. **Still broken @32580** — SAM repairs after 134 nadir; #4 @ `{13,24}` (dist 8, one cell short of fire); #29 @ `{14,22}` dist 7 dies before `{14,21}`; engine ~1 cell/30t on spine.
3. **Closed v366** — village loan @ samKillWindow + strike≤1 + SAM≤180: no samMin gain (3 strike tanks live @ nadir; positioning not headcount).
4. **Closed v364** — produced #27 joins @32340 `{3,50}`, west-rails east but cannot reach kill line by nadir; demote-skip kept in tree (no samMin gain).
5. **Closed v365** — do not release `corridorHold` @ SAM≤200 or force partner north @ dist 7 (samMin **150**).
6. **Closed v386** — SAM≤100-only defer + nadir burst (#6+#29+#4 @ SAM≤100) + post-western-SAM push: samMin **98** held; #4 dist-6 fire @ `{11,22}` @ nadir but #6/#29 still die @32700; post-kill push untested (SAM never dies). Engine ~1 cell/30t ceiling likely.
6b. **Closed v388** — finisher pick inversion / west-line spine-close defer: pick inversion regressed to samMin **104**; surgical defer held **98** but #4 still `@10,21`@32730 — **closed**.
6c. **Closed v389** — GUN `{11,18}` respawn re-engage when kill line empty: samMin **98** held; lone #27 spine-rails but dies before GUN kill; SAM repairs to 400 — **closed**.
7. **v390 BREAKTHROUGH** — skip AI auto-repair on SAM (scen 8) + last-HP rail to y=20 fire line + proximity HE chip when SAM≤80 and MTNK within ~6 cells → **western SAM dead @32730** (samMin **1–15** then 0).
8. **Held v352** — `corridorHold` strength `<80` (don't tag drifted `#4` as partner).
9. **Held v366** — village loan when `samKillWindow && strike≤1 && SAM≤180` (harmless; inactive @ nadir).
10. **Held v369** — `eastBSamKillSpineFireLine` `{13,20}` + chip-band rail @221–280 for x=13 y≥23.
11. **Held v372** — west-flank finisher @ dist≥7; west-hold on x=12 (no east recall to `{13,24}`).
12. **Held v374** — partner `{14,22}` dist-6 fires via west-edge kill-line (not approach move); partner step sam≤220.
13. **Held v376–v380** — west-finish rush @ dist 6–8 sam≤130 → `{10,21}`; dist-8 finish without chipBandLead gate.
14. **v391 post-west bundle** — after western SAM death latch only:
    - village refill (no loan while village thin); southern free tanks → hospital
    - rebuild hold: do not solo-push NW SAM with scrap; park support hold / civil intercept
    - force routeStage past western SAM even when strike empty
    - post-west MTNK banking + emergency NUKE sell when cash &lt; 800 and rebuild incomplete
    - TRACE v391k: routeStage **9**, free MTNK survives @`{13,34}`, lose still **civ-near-threshold**
    - **Closed:** early-window base-loan HP 0.35 (desynced free tanks → samMin 400)
    - **Closed:** pre-death home-pull / always-keep base MTNK (thins kill or all-destr)

15. **v392 WEAP survival + post-west economy**
    - Keep 1 base MTNK when free produced ≥3 at assault launch
    - Never reassign last base MTNK to village (v392 stole WEAP picket → WEAP dead by 35.4k)
    - Post-assault repair WEAP/PROC first; hold light WEAP repair while banking rebuild MTNK
    - Skip NUKE rebuy after emergency sell while banking tanks (sell→rebuy loop burned cash)
    - Do **not** sell sole NUKE (blackouts WEAP production)
    - TRACE v392h: WEAP/PROC/NUKE/PYLE live at lose; funds **865**; MTNK still on map
    - **Still broken:** village civ cascade (9 deaths); rebuild cohort thin; remaining SAMs 400

16. **v393 civ intercept + post-west tank routing**
    - Village-first rehome after west SAM death (healthy tanks preferred)
    - New produced tanks → village / WEAP picket / strike based on needs
    - Wider post-west civil corridor + always pile-on village armor
    - Do **not** keep last village tank during SAM kill (stuck SAM@46)
    - TRACE v393d: **6 civ deaths** (minNeut 8), first post-kill **34560**, SAM kill held
    - **Still broken:** WEAP dies ~38k; rebuild cohort thin; remaining SAMs 400; lose all-destr

17. **v394 WEAP-through-lose + rebuild cohort=1**
    - Continuous post-west home defense (not only while rebuild-ready unset)
    - WEAP picket first for new tanks / free armor; never steal last base MTNK to village
    - Repair WEAP when &lt;75% even while banking MTNK cash
    - rebuildReady with **1** free healthy tank; approach force-move onto remaining SAMs
    - TRACE v394f: **WEAP@400** at lose with full eco; free tank @36.6k; SAM kill held
    - **Still broken:** free tank often strike=0 (not joining NW push); civ deaths 8; remaining SAMs 400
    - Closed: village-first post-west (WEAP dies by 36k); keep-last village during kill (SAM@46)

| Scrap/E3 pre-clear NE GUN while free on west GUN | l118: free path = l110; NE GUN still kills free @y=12 |
| Weak free east-peel at GUN≤80 | l119: west GUN under-DPS / repairs; free residual 66 — **closed** |
| Weak free to NE GUN@16,9 at GUN≤100 | l121: west GUN repairs to 360+; free wipe — **closed** |
| Broad GUN standoff ≤250 | l120: free already at dist 4; residual still 128 — no gain |
| Far-north past GUN@16,9 (dodge x=22 then y=8) | l130: free@128@21,16 then lose@39058 same wall; minY 16 worse than l110 |
| Far-east x≥24 corridor north to y=4 then cut-west | l148: free peels to **28,9@124** (pathfind drifts east, never y=4); minN→6 earlier civ lose ~39570 — **closed** |
| Solo free engage NE GUN@16,9 after east peel | l149: free@128 peels to 20,14 then bleeds **20,12@16** never kills NE GUN; minY 12 worse than l146 — **closed** |
| Partner peel weakest free when GUN≤100 | l150: under-DPS; GUN repairs 40→400; free wipe; gun never dies — **closed** (same class l88/l103) |
| x≥22 one-cell north + NE-GUN-envelope dodge | l151: free thrash/bleed **@21,16** 128→35 never reaches y=10; minY 16 worse than l146 — **closed** |
| Keep PROC (no sell) + free#4 harvest bank | l152: freeT stuck 1–2; free#1 dies solo; free#2 partner-wait; funds hit ~820 but no free#3; WEAP bleed; lose ~36780 minN6 — **closed** |
| Post-GUN SILO/GTWR/ADV sell for free#4 | l153: no sellables left after freeT=3; funds still **90**; same free@108@21,10 as l146 — **no-op closed** |
| freeT cap@2 until GUN cleared (bank 890 for free#3) | l154: funds **890** held but GUN **never dies** (freeT 2→0 @37800); WEAP dies; minN6 — **closed** (same class l72/l78) |
| Keep villageGuard off GUN scrap when freeT≥2 | l155: freeT peak 2 / GUN never dies / lose ~36720 — **REGRESS closed** |
| Park free#3 (southern freeT≥3) on village while GUN live | l156: same free@108@21,10 / minN7 as l146 — **no-op closed** (vg still 8→0) |
| Full STRUCT_TURRET auto-repair skip (all HP) | l157: freeT=0 WEAP dead early — **REGRESS closed** |
| freeT cap@2 + GUN finish chip | l160: funds 890; freeT 2→0; GUN never dies — **closed** |
| Dual free post-GUN north peel (all free→strike) | l161–l164: residual **128+87** but lose ~**39024** unknown (earlier than l146) — **closed** |
| Early NE GUN approach y≤23 freeNorth≥1 | l163: free#1 dies; free solo under-kills; earlier lose — **closed** |
| Turret finish chip raise ≤150 / chip 30 | l163: freeT=0 path break — **closed**; keep ≤100 chip 20 only |
| Post-free-death last-NUKE sell for free#4 | l166: refund peak **240** <800; free#4 never; lose ~41005 — **closed** |

### Held engine package (l168–l173)

- **SAM** no auto-repair + proximity finish (v390) — western SAM kill held
- **Key turrets only after Frame≥34000**: western GUN (11,18) finish ≤200 chip40; NE GUN (16,9) finish ≤400 chip35 when MTNK near
- Other turrets: mild ≤100 only (global aggressive broke free path)
- Rail: free hp≥100 post-GUN → NE GUN SE fire cell; residual **≥249@14,22**
- Rebuild wasm after `building.cpp` edits

### Prior (l165)

- **SAM** no auto-repair + proximity finish (v390) — western SAM kill held
- **GUN/turret** proximity finish when strength ≤100 + hostile MTNK near (l159/l165) — partner often survives GUN to be parked village
- Rebuild wasm after `building.cpp` changes: `cmake --build build/web-td` then copy to `web/dist/engine/`

### Next (ordered)

**Still structural walls for campaign green:**

1. **NE GUN@16,9** — free residual ~128 dies in range; dual free north peel causes earlier lose (~39k)
2. **Cash** — freeT=3 → funds ~90; free#4 never; freeT=2 no GUN kill
3. **Civ** — lose@41257 civ-near; wounded free on village (l165) does not prevent 8th death
4. **NW SAM → A-10 → clear** blocked by NE GUN + residual

Rebuild engine after any `building.cpp` edit.

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
| `c5051da` | post-GUN east peel free@109@19,14 (l105–l106); NW 400 |
| `3a118d4` | post-GUN GUN-cleared latch + spine stop/micro-step; free@128@14,22; NW 400 |
| `977072f` | docs: close civ-screen/FIX levers (l95–l97 anchor gunMin 190; FIX never built) |
| `fdaf9b0` | docs: close attack-in-place (l91–l94 free@15 worse than free@108) |
| `3f99523` | docs: handoff hash for v400c survivor/FIX avoid |
| `7bcfdbb` | docs: close survivor peel/FIX levers (l86–l90 vs l85) |
| *(v390)* | **Western SAM kill** — no SAM auto-repair + last-HP fire line + proximity finish chip |
| `90e2af2` | v389 GUN respawn re-engage (samMin 98 held) |
| `b8e691b` | v386 nadir burst + post-western-SAM push (samMin 98 held) |
| `94fe069` | v384 timed spine defer (samMin 98 held) |
| `ec7cb8b` | v382 nadir focus-fire `{10,20}` (samMin 98 held) |
| `13f5c15` | v376-v380 west-finish rush (samMin 98 held) |
| `f0a3a5f` | v374 partner dist-6 fire (samMin 98 @32670) |
| `ac4dae1` | v370-v372 west-flank finisher (samMin 134 held; v373 reverted) |
| `563566f` | v366-v369 finisher rails (samMin 134 held); trackpad pan; vite allowedHosts |
| `ad7ef88` | v364 produced-tank rail (samMin 134 held; #27 too late @ nadir) |
| `fea0e81` | docs: close east-b v363 experiments |
| `8955834` | v360 chip-band north rally (samMin 134 held) |
| `a0fe37d` | v327 corridor-early chip (samMin 139 stable ×5) |
| `527faed` | v320 spine designated pick + v316 revert (samMin 171 held) |
| `ea167db` | v316 east-spine west-first detour (samMin 171 held; later reverted) |
| `15df1e1` | v312 split partner pick (samMin 171 held) |
| `0034d9f` | v301 west-first partner detour + spine rush (samMin 171 held) |
| `4d729d4` | v297 partner west routing + TRACE/gate wrappers |
| `7494ba7` | SAM pack + finisher path (~200 chip; handoff doc) |
| `74bfbe4` | Softer assault gate + E3 push prep (SAM min ~288) |
| `1bc9b69` | Fund follow-up tank before western assault |
| `9e51b46` | SAM chip ~278 + solo finish path |
| `a7d8541` | 3-tank western push (~276) |
| `a14defd` | Western strike reinforcement |
| `28b5df5` | Early civ intercept |

After the next checkpoint: prepend a row and bump the table **Commit** field.
