# Agent instructions (cc-remastered / browser-port)

Read this file at the start of a session when working in this repository.
Subagents and other harnesses should inherit the same rules.

## Mission 8 (GDI freeware public-ABI gate)

Both variants are **mandatory** release-gate work and are currently **red**.

| When you are… | Read first |
|---|---|
| Mission 8 **east-b** / `SCG08EB` / western SAM / village / `verify-classic-freeware-mission-one.mjs` east-b | **[docs/mission-8-east-b-handoff.md](docs/mission-8-east-b-handoff.md)** — live resume status, TRACE commands, code map, next steps |
| Mission 8 context, east-a, scenario INI facts, closed Design A | [docs/mission-8-hardening.md](docs/mission-8-hardening.md) |
| Overall product boundary / remaining work list | [docs/implementation-status.md](docs/implementation-status.md) |
| Release-gate mission set | [docs/classic-freeware.md](docs/classic-freeware.md) |

**Required workflow for Mission 8 east-b:**

1. Open `docs/mission-8-east-b-handoff.md` before editing the verifier or re-running TRACE.
2. Do not re-open closed experiments listed there without new evidence.
3. After a meaningful TRACE or strategy change, update the handoff **Status / Commit / Last TRACE** table and “Recommended next work” if they changed.
4. Checkpoint: commit with a clear WIP/status message; push **only** to `fork` (`fork/browser-port`). Do **not** push Mission 8 WIP to upstream `origin` unless the user explicitly asks.

**TRACE / OOM:** Cursor’s bundled `node` defaults to ~2 GB heap. OOM at `2046 MB` means heap was **not** raised — always use the wrappers (they pass `--max-old-space-size=8192` on the `node` command line). Do **not** run ungated `CNCWEB_VERIFY_TRACE_FINE=1` for east-b.

```sh
cd web
chmod +x scripts/verify-east-b-gate.sh scripts/trace-east-b-kill-window.sh
./scripts/verify-east-b-gate.sh                           # pass/fail, no trace
./scripts/trace-east-b-kill-window.sh                       # kill-window trace → /tmp/m8-eastb.trace.err
./scripts/trace-east-b-kill-window.sh /tmp/my.trace.err
```

Partial sim (debug only — not a release gate):

```sh
cd web
CNCWEB_VERIFY_MAX_TICKS=33000 ./scripts/verify-east-b-gate.sh
```

Raise heap further if needed: `CNCWEB_VERIFY_HEAP_MB=12288 ./scripts/verify-east-b-gate.sh`

Parse an existing trace file without loading it whole into an agent context:

```sh
cd web
node scripts/parse-east-b-trace-sam-min.mjs /tmp/m8-eastb.trace.err
```

Verifier entrypoint (manual — prefer wrapper for TRACE):

```sh
cd web
CNCWEB_VERIFY_MISSION=8 CNCWEB_VERIFY_MISSION_VARIANT=east-b CNCWEB_VERIFY_TRACE=1 \
  node scripts/verify-classic-freeware-mission-one.mjs
```

Primary code: `web/scripts/verify-classic-freeware-mission-one.mjs`.

## Git / remotes

- Active Mission 8 work is on branch **`browser-port`**.
- Default push remote for this work: **`fork`** → `fork/browser-port`.
- Treat `origin` as upstream; do not force-push or land experimental Mission 8 commits there without explicit user direction.

## General

- Prefer existing docs under `docs/` over inventing parallel status notes.
- Keep handoff docs factual: red/green, metrics, next lever — not release claims.
- Do not commit secrets (e.g. `.env.local`).
