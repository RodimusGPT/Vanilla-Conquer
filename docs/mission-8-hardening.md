# Mission 8 public-ABI hardening note

Both Mission 8 variants are **mandatory** in `test:classic-freeware:release`
and remain **red**. Missions 1–7 retain green public-ABI victory evidence.

**East-b live handoff (resume here):**
[mission-8-east-b-handoff.md](mission-8-east-b-handoff.md) — TRACE metrics,
code map, closed experiments, ordered next steps for another harness.

Root [AGENTS.md](../AGENTS.md) steers agents to that handoff for Mission 8
east-b work.

This note records scenario facts, retained progress, closed dead-ends, and
pointers. It is not a release claim.

## Shared gate criteria

Verifier: `web/scripts/verify-classic-freeware-mission-one.mjs` with
`CNCWEB_VERIFY_MISSION=8` and `CNCWEB_VERIFY_MISSION_VARIANT=east-a|east-b`.

Win path (both variants):

- Exactly one authoritative `EVENT_GAME_OVER` with win bit (`flags & 4`)
- Matching campaign outcome win bit
- No debug victory hook
- `finalHostiles === 0` for counted Nod root combatants (types 1–4 units and
  buildings), `finalFriendly > 0` for counted GDI
- Variant-specific extra assertions (below)

Run:

```sh
cd web
CNCWEB_VERIFY_MISSION=8 CNCWEB_VERIFY_MISSION_VARIANT=east-a CNCWEB_VERIFY_TRACE=1 \
  node scripts/verify-classic-freeware-mission-one.mjs
CNCWEB_VERIFY_MISSION=8 CNCWEB_VERIFY_MISSION_VARIANT=east-b CNCWEB_VERIFY_TRACE=1 \
  node scripts/verify-classic-freeware-mission-one.mjs
```

## East A — `SCG08EA` (eliminate Nod)

### Progress (retained)

Checkpoint commit `fb5b00a`:

- Capture west Nod FACT (~tick 32.2k), sell for rifle economy
- Post-FACT ~26 E1 cleanup wave
- Production GUN soft charge (~58.8k), peel/hold at staging 14,12
- HAND assault open at last A-10 + 7100; HAND dies (~66.3k), **maxWest stage 9**
- Post-HAND survivors force AFLD/PROC immediately (do not wait for next A-10)

Typical red end after HAND:

- ~6 half-dead E1s at HAND cell, then 1 → 0 GDI mobiles
- ~20 counted Nod still up (AFLD, PROC, LTNK/BGGY, silos, etc.)
- Next A-10 ~tick 72.9k; remnant is already dead by ~66.8k

### Design A (WEAP + pad MTNK) — blocked

Hypothesis: fund a Weapons Factory from the captured FACT, train 1 MTNK, park it,
release into HAND/AFLD for durable post-HAND DPS.

**Engine facts:**

| Item | Value |
|---|---|
| WEAP cost | 2000 |
| WEAP prereq | `STRUCTF_REFINERY` (own PROC) |
| WEAP build time | ~`Raw_Cost` ticks at full power; ×4 with no power |
| FACT sell refund | 2500 |
| Cash at capture (baseline path) | ~143 |

**Why it fails on this mission:**

1. Pre-capture free-spend funds the assault; cash at capture is far below 2000.
2. Third-wave cash conversion sells **PROC** (and surplus NUKEs) → WEAP is not
   buildable and power for build speed is gone.
3. Delaying FACT sell without cash/prereq leaves FACT under fire; it dies in
   ~800 ticks and never funds the rifle flood.
4. Reserving 2000 cash from engineer seal / mission start starves early
   production; assault never forms (timeout at 120k).
5. Keeping PROC + NUKE for WEAP thins home-guard counterattack; engineer path
   fails to capture.

### Other closed micro-experiments

| Experiment | Result |
|---|---|
| Hold 4 rifles off HAND for mop | **maxWest 8** — HAND lives |
| Peel 3 when HAND ≤250 HP | **maxWest 8** |
| A-10 pad armor instead of HAND at assault window | **maxWest 8** — HAND A-10 is load-bearing |
| 2-rifle HAND chip during stage-8 hold | Softens HAND, then **HAND repairs**; early open wipes wave |
| 0 home guards / 3 GUN finishers | Earlier wipe, **maxWest 8** |
| Immediate post-HAND AFLD retarget | Preserves maxWest 9; does not clear map |

### East A next (when resumed)

Need durable post-HAND DPS without stripping the HAND kill:

- Timeboxed cash for +4–6 post-FACT rifles (unlikely to beat LTNK/AFLD alone)
- Or a redesign that does not require captured-FACT WEAP (e.g. lessons from
  east-b vehicle economy once that path is green)
- Do **not** hold-back HAND wave or redirect assault-window A-10 away from HAND

**v390–v391:** FACT-capture prerequisite — APC was dying @32280 routing
to `{8,13}` through ARTY / production screen. Hold helpers keep APC at northern
screen `{18,7}`, basin hold `{29,38}`, or transport reserve `{23,30}` with
under-fire stop + staged reserve→unload advance. `transportDeathTick` improved
32280 → ~53850 (still RED, no `captureTick`).

**v392:** Cap APC counterattack routing at stage 2 (southern
crossing) while western GUN `@21,19` lives; A-10 basin-ARTY pass when APC holds
`{29,38}`; fragile-APC hold below 15% HP. `transportDeathTick` ~58380 (+4.5k
vs v391); still no `captureTick`.

**v394:** Western GUN `@21,19` siege — wire `postSamNorthSupportKeys` from north
flank/strike/south-ready; suppress local-threat peel during GUN stage; repeat
A-10 on GUN while APC holds basin (420t cooldown). `transportDeathTick` ~75750
(+17k vs v393); GUN repairs to 400, still no `captureTick`.

**v400–v401:** FACT capture landed (`captureTick` ~46620). Post-FACT rifle wave
and cleanup launch survive past ~55k.

**v402–v424 (uncommitted stack, then v423–v432):** Early-capture path skips
western stages 0–6, holds at safe staging, opens HAND assault at
`ticksSinceAir >= 6800` (or pending A-10 / HAND ≤200).

| Run | Result |
|---|---|
| v412 class | HAND min ~104, no kill |
| v424 | HAND min ~45, AI repairs, remnant dies |
| **v428 / v431 / v432 / v436 / v440 / v443 / v449** | **HAND killed** (`westCleanupStage` 9 @~66600); AFLD/PROC remain; cleanupAlive 0 |
| **v454 / v457 / v458 / v462** | **HAND killed + mop seed**: 1 straggler at assault open; AFLD **1000→877–913**; seed dies ~300 ticks later |
| v460 | Cap production-GUN A-10s to free mop A-10 — stuck on GUN, no HAND kill |
| v461 | Seed tagged at stage-8 start (pre-assault) — thinned mass, HAND min 200 |
| v423 | Closer ridge hold — wiped before HAND damage |
| v425 | Finisher reserve whole fight — HAND min 350, no kill |
| v430 | Early launch@18 — died on production GUN |
| v433 | Late finisher release@250 — HAND min 64, repaired |
| v434–v435 | Pure mop reserve (2 off HAND) — HAND min 64, no kill |
| v437 | Launch@22 + trailers held off HAND — died on production GUN |
| v438 | Home guards held off HAND — HAND min 51, no kill; home died at base |
| v439 | open@6500 full mass — wave wiped early, HAND min 416 |
| v441 | Skip early retained-power sale — GDI wiped ~42k (pre-capture) |
| v442 | Bank 2 E1s from FACT (24 main) — died on production GUN |
| v446 | Soft-pull 3 on HAND A-10 order — cA=3 live, HAND min 67 (repairs) |
| v447–v448 | Soft-pull 2 + recommit — HAND min **17**, still repairs; no kill |

**Current blocker (east-a):** post-HAND mop. The HAND kill requires the full
rifle mass. Soft-pull seeds preserve 2–3 rifles but leave HAND at 17–67 HP
(AI repairs). Full-mass kill zeros cleanupAlive; AFLD ~849 / PROC ~801 remain.
Post-HAND structure sales find nothing useful (funds stay ~43); no free MTNK
survives to mop. Design-A WEAP path remains blocked (PROC sold mid-game).

**Closed three-lever pass (v441–v449) + harvest/straggler follow-up (v450–v458):**
1. **Extra economy / keep PROC** — thinning FACT wave fails GUN; skip mid-game
   power sale or keep-PROC without PROC refund fails pre-capture; late sales
   yield no mop E1s (funds ~43).
2. **Soft-pull of engaged rifles** — best HAND min 17 with live seed, no kill.
3. **Vehicle mop / WEAP** — no free tanks at HAND time; WEAP needs PROC (sold).
4. **Approach straggler (v454/v457/v458)** — park 1 unit still ≥8 cells from
   HAND at assault open: **HAND still dies**, seed lives through kill, **AFLD
   1000→877**, then seed dies within ~300 ticks. Two stragglers lose HAND kill.

**Current best mop evidence:** HAND dead + AFLD −123 HP + 1 cleanup survivor
for one sample. Need longer seed survival and/or a second A-10 on AFLD before
the remnant dies (~tick 67k; next A-10 ~73k).

**Still open:** protect/reinforce the single straggler through AFLD+PROC clear;
or land a post-HAND A-10 while the seed is alive; east-b SAM ceiling.

### v466–v502 three-lever pass (2026-07-31)

| Lever | Result |
|---|---|
| **A-10 building damage** | Stock wasm: A-10s spawn (`a10Observed`) but structure HP is almost always `before==after==min` (GUN/AFLD). Only reliable non-zero was unit LTNK 300→251 (v451). HAND 800→792 coincides with ground fire. Engine building-tarcom in `Place_Special_Blast` made early LTNK/GUN strikes actually hit and **splash-wiped the engineer path** (v496–v497 capture fail). Reverted; keep stock. |
| **Survive to next A-10 (~73k)** | Best class still dies ~68.1k. HARV is last friend @~45,55 (strength ~68) then BGGY kill; flees do not stick. Aggressive HARV stop/flee or immediate post-HAND kite **lost HAND kill** (v498/v501). Keep v490 escort+flee cadence. |
| **Post-HAND economy** | Launch mass must stay **26** (v495@24 bled 22→8 on GUN). MOP only after `westCleanupStage≥9`. Post-HAND NUKE/GTWR sells still yield nothing useful (funds stuck ~43). |

**Retained foothold (v490 / v502):** capture@46620, launch@55290, HAND kill min 33 @66510, stage 9, AFLD min **920**, end ~68100. Best AFLD chip remains **v466 min ~797** (slightly weaker HAND survivors).

### v503–v507 three-lever pass (2026-07-31 cont.)

| Lever | Result |
|---|---|
| **A-10 (engine)** | Building-object tarcom for **AFLD / HAND / PROC only**, and only if no allied ground unit within ~3 cells. GUN/turret and unit tarcoms never upgraded (western GUN siege splash broke capture in v503). Capture@46620 preserved. HAND A-10 still ~800→792 (friendlies on pad → cell tarcom). No post-HAND A-10 yet (wipe before ~73k). |
| **Mop seed** | Seed peels pad LTNK/BGGY within 3 before AFLD CTRL-fire. HAND kill **improved** (min **12** vs v502 33). AFLD min **952** (slightly worse than 920 — pad peel trades chip for seed/HAND stability). Melee-only peel (≤1) lost HAND (v506). |
| **HARV SE** | Two-step flee waypoint `{52,58}` → `{58,62}` when stage≥8+hurt / stage≥9 / threat. No UNIT_STOP. Always-on flee from assault open lost HAND (v505). HARV drifts 38,53→46,55; still not deep SE; last friend to ~68.1k. |

**Retained foothold (v507):** capture@46620, HAND kill min **12** @66480, stage 9, AFLD min **952**, end ~68186 with HARV last. Engine A-10 pad-ready when friendlies clear.

### v508–v513 survival pass

| Change | Result |
|---|---|
| Post-HAND kite-until-AFLD-A10 then dive | Correct logic, but `cleanupAlive` is already 0 within ~120t of HAND death — nothing left to kite |
| Seed pullback at HAND ≤80/100 | Brief ca=1 (v509 end **69483**) but later runs **lost HAND kill** (pad armor rejoined) — closed |
| HARV flee/baseThreat during stage 8 | Thrashes selection; lost HAND (v510) — closed |
| HARV re-stop every 240t only after HAND | Small end-tick gain (~68.5k); HARV still sits ~46,55 on tiberium |

**Retained foothold (v513):** HAND min **12**, stage 9, AFLD min **964**, end ~**68567**, capture OK. Engine A-10 building-tarcom still unused (no post-HAND A-10; wipe before 73k). Pure v513 is **stable** (3/3 TRACE HAND min 12).

### v514–v519 closed (all lost HAND kill vs stable v513)

| Experiment | HAND | Notes |
|---|---|---|
| Timed all-seed south-hold after AFLD chip | fail min 56 | Frees pad armor mid-kill (same class as HAND-HP pullback) |
| Dual seed: #1 AFLD, #2 south reserve | fail min 38 | Pad peel needs both seeds on-pad |
| All seeds south during HAND (no AFLD chip) | fail min 28 | On-pad seed/pad peel is **load-bearing** for HAND kill |
| HARV flee waypoint only 52,58→50,55 | fail min 38 | Even flee-target constant changes thrash/timing enough to lose kill |
| HARV flee only after stage≥9 (no stage-8 hurt) | fail min 56 | Stage-8 hurt flee is part of the stable command stream |

**Implication:** Seeds must stay on AFLD/pad during HAND. Post-HAND mop is empty because seeds die with the assault. HARV SE is brittle — small flee changes desync the kill. Path to 73k needs a **new** live friend (post-HAND production) or a non-thrashing HARV channel that does not alter pre-HAND command stream.

**Next:** produce 1–2 mop E1s **before** HAND dies from leftover cash (without cutting launch 26); or post-HAND structure sell that actually fires; do not move seeds off pad until `westCleanupStage ≥ 9`.

### v520–v522 mop-reserve E1s (post-launch, off HAND)

| Change | Result |
|---|---|
| 2× MOP E1 after launch (FACT stays 26) | Produced @~55.4k from leftover cash (~293) |
| Continuous/reserve hold thrash during GUN/HAND | **HAND fail** (v520–v521) |
| **One-shot park** then silence until stage ≥ 9 (v522) | **HAND min 6**, AFLD min **877**, `cleanupAlive` 7 at HAND death, end **~70401** |

**Retained foothold (v522):** capture@46620, launch@55290, MOP×2 reserve, HAND kill min **6** @66330, AFLD **877**, stage 9 with live mop until ~70k. Still short of next A-10 (~73.2k) by ~3k ticks; no post-HAND AFLD strike yet.

**Next:** extend mop kite farther from pad LTNK/BGGY; keep HARV alive with mop screen after HAND; land AFLD A-10 at ~73k with pad clear for building-tarcom.

### v523–v526 post-HAND kite / 73k window

| Change | Result |
|---|---|
| Always kite after HAND (drop mopWave≤6 cap) + SE rally with HARV | HAND min 6 kept; mop lives deep into 70ks |
| airSoon ≤1200t + pad-clear hold SW | **assert ~73481** — lives into next A-10 window |
| A-10s spawn at end (A10 friendlies) | Order/target not always in TRACE dump; AFLD min still ~901 (no big napalm chip yet) |
| All-mop escort HARV (v525) | Attrits earlier — closed; keep **3** screen max |

**Retained foothold (v526):** HAND min **6**, AFLD **901**, MOP×2, stage 9, live friends through **~73.2k**, game-over **~73481** with A10s airborne. Still red (ground wipe; AFLD not cleared). Building-tarcom path is now reachable in time.

**Next:** keep one ground unit alive through AFLD A-10 discharge; confirm AFLD HP drop from building-tarcom; dive mop after strike.

### v527–v532 ground through A-10 + AFLD damage

| Change | Result |
|---|---|
| SE hold when air due (not SW pad-clear) | Lives to **~74.1k**; AFLD A-10 **ordered @73230** |
| AFLD always building-tarcom | Still discharge dmg=false if DROP_BOMBS never near |
| A-10 DROP_BOMBS: force Explosion_Damage on enemy AFLD within range | **AFLD min 505** (was ~901) — real structure chip; likely during HAND A-10 pass too |
| Dedicated survivor unit | Thinned mop earlier (v528) — closed |

**Retained foothold (v532):** HAND min **6**, AFLD min **~505**, AFLD A-10 order @73230 a10Observed, end ~**74124**, capture OK. Still red: ground wipe near A-10 window; AFLD not destroyed; discharge telemetry often before==after on the late strike.

### v533 soft-AFLD dive + no AFLD auto-repair + tarcom force chip

| Change | Result |
|---|---|
| Dive when AFLD ≤750; skip AFLD auto-repair (scen 8) | AFLD destroyed mid-HAND |
| DROP_BOMBS force-chip all nearby AFLD (0x0A00) | **Splash-wiped HAND assault** (19→3 @~66.3k); end **67890** red |
| Drop kite/HARV screen | N/A — dead before kite window |

### v534–v537: no AFLD repair + kite-to-A10 + AFLD kill

| Change | Result |
|---|---|
| Skip AI auto-repair on AFLD (scenario 8 only) | Seed stays **~676–688** (not 1000) |
| Force-chip AFLD as tarcom, or proximity w/ friendly-clear | No HAND-wave splash wipe |
| Always kite deep SE after HAND; dive only after post-HAND A-10 | Live through **@73230** AFLD order |
| Fixed SE hold (no follow HARV) + airSoon dive-stage `{42,40}` | v536 **AFLD destroyed** min **102** @73590 |
| Drop mop-HARV / kite screens | Stable 4–5 attackers through 73k |

**Retained foothold (v536/v537):** capture@46620, launch@55290, HAND min **6**, AFLD **destroyed** (stage 9 done ~73.5k), AFLD A-10 @73230, end ~**74.8k** on PROC with cleanupAlive 1. Still red: mop dies on PROC/pad; north base + pad armor remain.

### v539–v540 thin re-kite + second A-10 on pad LTNK

| Change | Result |
|---|---|
| After AFLD falls with ≤3 mop, re-kite SE for next recharge | Live through **@80460** second A-10 |
| A-10 rank: pad LTNK/BGGY before PROC once AFLD gone | Second strike targets **LTNK** |
| Delay first dive; south approach; no early second-dive eta | v540 holds **3 attackers** to ~81.6k |
| Cell-tarcom AFLD force chip + double pulse | Late AFLD still often 676→676 (mop kills AFLD) |

**Retained foothold (v540):** HAND min **6**, AFLD destroyed min **176**, second A-10 @80460 on LTNK, PROC min **645**, end ~**82811**. Still red: remnant dies on second pad dive; north base remains.

### v541–v542 PROC kill + thin second dive + A-10 Take_Damage

| Change | Result |
|---|---|
| Thin second dive: all-in soft pad then PROC; delay 150t | Survives to second A-10 @80460 |
| A-10 rank PROC after AFLD (mop peels pad) | Order **@80460 PROC** |
| Direct Take_Damage + Explosion on AFLD/PROC tarcom; scen-8 unit AP | Discharge still often flat; **mop kills AFLD+PROC** |
| Stage advances to production NUKE | **buildingsKilled 10**, stage **11** |

**Retained foothold (v542):** HAND min **6**, **AFLD + PROC destroyed**, second A-10 @80460 on PROC, NUKE min **~299**, end ~**82k**. Still red: remnant dies on NUKE/pad leftovers; north base remains.

### v543–v546 mop A-10 cycle windows + production NUKE kill

| Change | Result |
|---|---|
| Dive only in 150–900t window after each post-HAND A-10 | Stops eternal post-discharge dive bleed |
| After PROC dies, re-kite until next A-10 (third cycle) | Preserves remnant off NUKE pad |
| A-10 rank NUKE/SILO after AFLD+PROC; force chip STRUCT_POWER | Production NUKE dies with PROC dive |
| firstDiveReady only while AFLD lives | Fixes 5→2 bleed before second A-10 |

**Retained foothold (v546):** HAND min **6**, **AFLD + PROC + production NUKE destroyed**, buildingsKilled **11**, cleanupAlive **2**, 3 attackers through ~82k, end ~**82980**. Still red: dies on north base / BGGY leftovers; no third A-10 yet.

### v547–v554 third A-10 + north clear + almost-win

| Change | Result |
|---|---|
| Gate deferred north resume until post-prod-chain A-10 | Avoids BGGY wipe after stage 11 |
| Inter-A-10 kite at `{48,36}` not deep SE | **5 attackers stable 74k–86k** (was 5→3) |
| Third+ A-10s @87690+ on NUKE/SILO | North power falls; **readyTicks through 116k** |
| All-in CTRL on last buildings; hunt leftover E1 | v552: **2 SILO left, 3 E1 live @120k timeout**; v554: **all buildings gone**, die to 4 E1 |

**Retained foothold (v554):** HAND min **6**, third A-10 reached, production + north chain cleared (bk **17** or 2 SILO at timeout), cleanupAlive **2–3**. Still red: timeout with 2 SILO **or** wipe vs last infantry.

**Next:** finish last SILO/E1 before 120k; confirm win.

## East B — `SCG08EB` (eliminate Nod + protect village)

### Scenario fail/win triggers (from packaged `SCG08EB.INI`)

Extracted from classic-freeware package
`engine/td/SCG08EB.INI`:

| Trigger | Event | Action | Notes |
|---|---|---|---|
| `win` | All Destr. (BadGuy) | **Win** | Eliminate counted Nod |
| `lose` | All Destr. (GoodGuy) | **Lose** | GDI wiped |
| `los3` | Destroyed | **Lose** | Attached to **Moebius** and **HOSP** |
| `civ` | # Units Dstr. 9 (Neutral) | **Lose** | Ninth neutral **unit** death |
| `airs` | Destroyed | Airstrike | On Nod SAMs (A-10 unlock) |
| `air1` / `air2` / `vllg` | Time / Destroyed | Reinforce | Nod airlifts + “Terror” vs civilians |
| `tank1` / `arty*` | Time | Create Team | Nod armor/arty; some **Attack Civil.** |

Protected attachments:

- `MOEBIUS` → trigger `los3` (cell ~6,60)
- `HOSP` → trigger `los3` (cell ~3,60)
- 14 Neutral civilian infantry (`C2`–`C9`); at most **8** may die (ninth fails)

Nod deliberately pressures civilians (`tank1` Attack Civil., `Terror` unload +
Attack Civil., timed `vllg` reinforce).

### Baseline verifier behavior (unhardened)

Typical red run:

| Metric | Value |
|---|---|
| Core build | NUKE → PYLE → PROC → WEAP (asserted) |
| Production | ~14 starts; cash-starved after core structures |
| Assault | ~tick 41.6k when **6** healthy produced MTNKs at reserve |
| Strike | Dies around western gate (~route stage 8) |
| SAMs | Often only **1** dead → **no A-10** (`readyTicks` empty) |
| Village | Guards wiped mid-run; `neutralMinimum` 14 → ~7 |
| End | Game-over **without** win bit; GDI may still hold FACT/HOSP/Moebius |

### Confirmed lose cause (instrumented)

On a baseline TRACE run (~tick 61357):

```text
eastBGameOver: flags=2, won=false, movieName=GDILOSE
eastBLoseDiagnosis:
  loseHint: civ-nine-neutral-unit-deaths
  neutralDeaths: 9
  9th death: ~tick 61350 (key 1:C8:14)
  hospitalMin: 373, moebiusMin: 50  (both still alive)
  assaultTick: 41640, routeStage: 8, producedTanks: 6
```

So the engine fires **`civ` (# Units Dstr. 9 Neutral → Lose)**, not `los3`
(Moebius/HOSP). The hospital and doctor can still be standing when the mission
ends. Village defense is therefore **hard-fail**, not soft progress.

Verifier now prints `eastBGameOver` + `eastBLoseDiagnosis` on east-b lose and
embeds the diagnosis in the assertion payload.

Extra win assertions (only if engine win fires): hospital preserved, Moebius
preserved, never ≤5 neutral units alive, ≥2 timed airlift sightings, core
build/place order, infantry + vehicle production.

### Failed east-b experiments (reverted)

| Experiment | Result |
|---|---|
| Require 8 assault tanks + 2 village tanks | Never reached cohort; no assault; earlier lose |
| Early infantry before tank cohort | Delayed economy; base nearly wiped |
| ARTY split-hunt + earlier assault gates | Base wipe / earlier lose (regressed) |

### In-progress western SAM kill WIP

**Detailed resume state:** [mission-8-east-b-handoff.md](mission-8-east-b-handoff.md).

Village-first intercept is largely **held**: early civ ≤1 by tick 20k
(`neutralMinimum` 13), hospital/Moebius screen, 2 village MTNKs excluded from
strike. Current blocker is the **western GUN→SAM** fight on route stage 6–7.

Implemented (still red):

- Assault ~22–28k with **3 free MTNKs** staged at assembly; soft follow-up tank gate
- **SAM pack**: MTNK-first production + gap-fill free E3 (target ~4); rockets
  loaned at launch; park free E3 at `{13,32}` until firing line
- Western forceMove corridor → GUN (11,18) → SAM (13,16); past-arrival stage advance
- GUN form-up; SAM focus-fire; west-rail for east-wanderers; village/base finish loans
- Emergency NUKE sell when strike empty + SAM chipped + funds stuck under 800

Best TRACE class: western SAM chipped to **~200 HP** (not killed); no A-10 yet.

### East B next (ordered by confirmed fail)

1. ~~Instrument lose cause~~ — done; confirmed **9th civilian** (`GDILOSE`).
2. ~~Early village intercept~~ — held (≤1 civ death by 20k on current TRACE class).
3. **Kill western SAM (13,16)** with durable first wave + mid-corridor finisher —
   see handoff “Recommended next work”.
4. **A-10 unlock** via `airs` after SAM death; keep civ ≤8 total.
5. Clear remaining Nod for `win` (All Destr. BadGuy) without stripping hospital.
6. East-a full clear remains deferred (HAND checkpoint only).

## Working-tree / git notes

- Push **only** to `fork/browser-port` (not upstream `origin`)
- East-a HAND kill / maxWest 9 earlier; full clear still red
- East-b SAM-pack / wave-two checkpoint: see latest `WIP: Mission 8 east-b` commit
  and [mission-8-east-b-handoff.md](mission-8-east-b-handoff.md)

## Related docs

- [mission-8-east-b-handoff.md](mission-8-east-b-handoff.md) — **resume here** for east-b
- [classic-freeware.md](classic-freeware.md) — release gate scope, Mission 8 orders
- [implementation-status.md](implementation-status.md) — remaining product work item 1
