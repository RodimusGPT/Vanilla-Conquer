# Mission 8 East-B handoff (resume here)

**Purpose:** machine- and human-readable checkpoint so another harness or agent
can continue Mission 8 `east-b` without replaying the full TRACE history.

| Field | Value |
|---|---|
| Status | **RED** — not release-ready |
| Branch | `browser-port` |
| Remote | `fork` only (`fork/browser-port`) — do **not** push `origin` |
| Primary file | `web/scripts/verify-classic-freeware-mission-one.mjs` |
| Variant | `CNCWEB_VERIFY_MISSION_VARIANT=east-b` (`SCG08EB`) |
| Companion note | [mission-8-hardening.md](mission-8-hardening.md) |
| Last TRACE suite | local `/tmp/m8-eastb/v40`–`v64` (not committed) |

Update the commit hash and “Last TRACE” row after every checkpoint push.

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

### Latest TRACE shape (v64 class)

- Assault ~28020: freeT=3, freeR=3, strike includes base scrap MTNK
- E3 parked at support hold through stages 0–4; present at GUN/SAM
- SAM min often **~200–360** depending on first-wave HP; **not killed**
- Lose later: civ pressure / base collapse while stuck at routeStage 7

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
| GUN/SAM micro | Focus block for typeName GUN/SAM; form-up; SAM attack-move when `cellY <= 30` |
| West rail | Hard-rail east wanderers onto X=13; finish-rail when SAM chipped |
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
| Force-move thrash south after overshoot | Fixed via past-arrival advance |

---

## Recommended next work (ordered)

1. **Recover v55-class first-wave SAM chip (~200)** with **3 free MTNKs + 3 E3** overlapping fire at y≈20–22 after GUN dies. Watch free-tank X (must stay ≤20 after stage 1).
2. **Overlap a full-HP finisher** while SAM is still &lt;250 (village loan already mid-corridor *or* 4th free MTNK pre-railed to `{13,32}` at assault without holding free tanks out of wave 1).
3. **Do not leave SAM at 200–300 unrepaired** with funds frozen — ensure rebuild tank is ordered the tick funds ≥800 (or after NUKE sell) and immediately west-railed.
4. After **first western SAM death**, verify A-10 unlock and continue Nod clear; keep civ ≤8 deaths total (lose on 9th).
5. Only then re-touch east-a full clear.

---

## Harness resume checklist

```text
[ ] git checkout browser-port && git pull fork browser-port
[ ] Read this file + mission-8-hardening.md east-b section
[ ] Run TRACE (command above); record samMin / assaultTick / freeR at assault
[ ] If samMin > 280: first-wave / pathing regression — fix rail + GUN form first
[ ] If samMin ~200 and no death: finisher timing / rebuild — fix loan + production
[ ] If SAM dies: pursue A-10 + map clear; re-check civ lose diagnosis
[ ] Checkpoint: commit message WIP, push fork only; update commit hash in this table
```

## Related commits (fork history, incomplete)

Recent WIP on this branch (newest first at push time may differ):

- Softer assault gate + E3 prep (SAM min ~288)
- Fund follow-up tank before western assault
- SAM chip ~278 + solo finish path
- 3-tank western push (~276)
- Western strike reinforcement
- Early civ intercept

Update this list when committing the SAM-pack / wave-two checkpoint.
