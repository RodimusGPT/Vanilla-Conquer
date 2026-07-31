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
