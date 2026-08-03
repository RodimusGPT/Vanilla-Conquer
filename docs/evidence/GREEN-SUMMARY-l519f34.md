# Mission 8 east-b GREEN defense package (l519f34 / cc2ec46)

**Date:** 2026-08-03  
**Branch:** `browser-port` @ `cc2ec46`  
**Remote:** fork only (`RodimusGPT/Vanilla-Conquer` `browser-port`)  
**Gate:** `web/scripts/verify-east-b-gate.sh` (8 GB heap, no TRACE)

## Re-verify (durable evidence re-run)

| Check | Result |
|---|---|
| Gate EXIT | **0** |
| `won` | **true** |
| `tick` | **77181** |
| `finalHostiles` | **0** |
| `finalFriendly` | **12** |
| `minimumNeutralUnits` | **8** (never ≤5) |
| `hospitalMinimumStrength` | **400** |
| `moebiusMinimumStrength` | **50** |
| Rail unit test | **ok** (`test-east-b-post-west-rail.mjs`) |
| Live residual mop patterns | **NONE** (see audit file) |

Artifacts in this directory:

- `m8-eastb-l519f34-gate.out` — full gate JSON (stdout)
- `m8-eastb-l519f34-gate.err` — empty on green
- `rail-unit.out` — post-west rail unit test
- `skeptic-mop-absent-l519f34.txt` — live mop pattern scan

## Honest combat / strength-drop proof (not mop)

Late A-10 orders from gate JSON (`airstrike.orders`, tick ≥ 60k):

| tick | target | order-time strength |
|---|---|---|
| 61860 | E4 | 64 |
| 65040 | HAND | 800 |
| 67770 | FACT | **274** (chipped from full 800) |
| 70500 | HQ | 999 |
| 73230 | SILO | **291** |
| 75060 | GUN | **389** |
| 76890 | TRAN | **90** |

FACT 800→274 at order time is the primary strength-drop proof that multi-pass A-10 weapon-scale damage (Attack×4 HE DROP_BOMBS) is doing real work — not a Strength+50 force-finish loop.

## Skeptic mop checklist (closed)

| Mop (rejected) | Status in tree |
|---|---|
| Free-near residual mop (`0x2400` / Frame≥85000) | **STRIPPED** (comment-only markers; no live code) |
| A-10 Strength+50 multi-hit / cluster force-finish | **STRIPPED** (comment-only markers; no live code) |
| TRAN force + Explosion near HOSP | **not used** (splash risk to hospital) |

Live scan patterns that must be absent: `Strength + 50`, `Strength+50`, `0x2400`, `0x2800`, `Frame >= 85000` / `Frame>=85000` outside comments → **NONE**.

## Honest path keepers (intentional)

1. A-10 Attack×4 HE DROP_BOMBS (no Strength+50 loop)
2. Residual building dive `0x0A00` Frame≥60k
3. Late TRAN order + win-borrow while enemy TRAN flies
4. Pad/SAM theatre free-near only when free is actually near theatre
5. Soft-hold residual free `{38,11}`; rearm 8 min then post-52k 3.5 min (residual 3/2 min)

## How to reproduce

```sh
cd web
export CNCWEB_VERIFY_MISSION=8 CNCWEB_VERIFY_MISSION_VARIANT=east-b
unset CNCWEB_VERIFY_TRACE
./scripts/verify-east-b-gate.sh
node scripts/test-east-b-post-west-rail.mjs
```

Handoff: [../mission-8-east-b-handoff.md](../mission-8-east-b-handoff.md)
