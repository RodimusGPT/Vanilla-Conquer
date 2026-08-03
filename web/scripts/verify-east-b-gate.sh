#!/usr/bin/env bash
# East-b pass/fail gate check: no TRACE, explicit heap, stderr not buffered in IDE.
set -euo pipefail
cd "$(dirname "$0")/.."
HEAP_MB="${CNCWEB_VERIFY_HEAP_MB:-8192}"
export CNCWEB_VERIFY_MISSION=8
export CNCWEB_VERIFY_MISSION_VARIANT=east-b
exec node --max-old-space-size="$HEAP_MB" scripts/verify-classic-freeware-mission-one.mjs
