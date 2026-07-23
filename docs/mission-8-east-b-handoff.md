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
| Commit | `64ecb96` + local WIP (SAM range/overlap finisher + spine rail) |
| Remote | `fork` only (`fork/browser-port`) — do **not** push `origin` |
| Primary file | `web/scripts/verify-classic-freeware-mission-one.mjs` |
| Variant | `CNCWEB_VERIFY_MISSION_VARIANT=east-b` (`SCG08EB`) |
| Companion note | [mission-8-hardening.md](mission-8-hardening.md) |
| Last TRACE suite | local `/tmp/m8-eastb/v113` — samMin **298** @32400; 2 MTNK survive to ~32460; E3 gone @32340; no A-10; assault @28020 (best prior: v111 **266** @32400 — run variance) |

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
| GUN/SAM micro | Focus block for typeName GUN/SAM; `eastBGunApproachRally` / `eastBSamFormRally`; inBand attack + outOfBand spine rail + spine fallback |
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
| x≥12-only `samAttackers` + E3 `samRocketKillReady` gate | v112 samMin **396** — no chip |
| E3 commit only when SAM≤300 + overlap (no tank change) | v114 samMin **346** — E3 survive but under-chip |
| Block joiners during first-wave chip | v115 samMin **328** |
| Demote non-corridor strike MTNK during chip | v116 samMin **400** — assault broken |

---

## Recommended next work (ordered)

1. **FINE TRACE 32100–32400** (baseline code) — v113 FINE: E3 die @32310–32340 with SAM@298; MTNK chip 362→298 then stall. GUN not respawning in window. Confirm whether v111’s 266 is reproducible or run variance.
2. **Do not re-add x≥12-only tank fire or E3 pre-280 screen** — both regressed chip (v112/v114).
3. **Kill-window stack** — best runs have **2 MTNK + 3 E3** on corridor at 32100 (v111); extra southern strike MTNK correlate with shallower chip (v113/v115). Need a lever that trims distant strike without breaking assault (v116 demotion failed).
4. **Keep range mix** — `inSamRange` fire + `samStandoff` alt; engageRange 6; samUrgent cadence 1 when 2+ in approach band.
5. After **first western SAM death**, verify A-10 unlock and map clear.

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
