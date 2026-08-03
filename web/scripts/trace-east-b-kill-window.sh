#!/usr/bin/env bash
# Safe east-b kill-window TRACE: gated ticks, compact JSON, stderr to file.
# Avoids OOM from unbounded FINE trace or default ~2 GB heap in Cursor.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-/tmp/m8-eastb.trace.err}"
HEAP_MB="${CNCWEB_VERIFY_HEAP_MB:-8192}"
export CNCWEB_VERIFY_MISSION=8
export CNCWEB_VERIFY_MISSION_VARIANT=east-b
export CNCWEB_VERIFY_TRACE=1
export CNCWEB_VERIFY_TRACE_FINE=1
export CNCWEB_VERIFY_TRACE_COMPACT=1
export CNCWEB_VERIFY_TRACE_INITIAL=0
export CNCWEB_VERIFY_TRACE_TICK_MIN="${CNCWEB_VERIFY_TRACE_TICK_MIN:-32400}"
export CNCWEB_VERIFY_TRACE_TICK_MAX="${CNCWEB_VERIFY_TRACE_TICK_MAX:-32800}"
set +e
node --max-old-space-size="$HEAP_MB" scripts/verify-classic-freeware-mission-one.mjs 2>"$OUT"
verify_status=$?
set -e
BYTES="$(wc -c <"$OUT" | tr -d ' ')"
echo "trace: $OUT ($BYTES bytes)"
node scripts/parse-east-b-trace-sam-min.mjs "$OUT"
exit "$verify_status"
