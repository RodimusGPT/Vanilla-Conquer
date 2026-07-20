# Mission 8 public-ABI hardening note

Status as of checkpoint `fb5b00a` on `browser-port` (pushed to
`fork/browser-port`). Both Mission 8 variants are **mandatory** in
`test:classic-freeware:release` and remain **red**. Missions 1–7 retain green
public-ABI victory evidence.

This note records scenario facts, current verifier progress, closed dead-ends,
and next work. It is not a release claim.

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

### East B next (ordered by confirmed fail)

1. ~~Instrument lose cause~~ — done; confirmed **9th civilian** (`GDILOSE`).
2. **Village platoon first** — armor + rockets that never join the strike;
   intercept `Terror` / `tank1` Attack-Civil teams and airlift unloads near
   8,57 / hospital.
3. **Hold assault** until village is stable (e.g. ≤3 civilian deaths and ≥2
   village MTNKs alive), then push west.
4. **Economy** for 8–10+ MTNKs after core build (harvest discipline / spend).
5. **SAM-first** western route so `airs` grants A-10 before base push.
6. Only then expand strike through Nod base for `win` (All Destr. BadGuy).

## Working-tree / git notes

- `fb5b00a` — east-a HAND kill checkpoint (maxWest 9; full clear red)
- `a29ec0e` — earlier GUN-to-HAND path WIP
- Both pushed to `fork/browser-port` only (not upstream `origin`)

## Related docs

- [classic-freeware.md](classic-freeware.md) — release gate scope, Mission 8 orders
- [implementation-status.md](implementation-status.md) — remaining product work item 1
