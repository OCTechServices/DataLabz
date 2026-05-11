#!/usr/bin/env bash
# scripts/session-end.sh
# Claude Code session-end hook.
# Collects git context from the current session and syncs completed milestones
# to your active DATA.LABZ room via the milestone-sync API.
#
# Requires in .env.local:
#   MILESTONE_SECRET=<random string matching server>
#   NEXT_PUBLIC_APP_URL=http://localhost:3000  (or prod URL)
#   ANTHROPIC_API_KEY=<your key>

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Source .env.local to pick up secrets
if [ -f "$PROJECT_DIR/.env.local" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_DIR/.env.local"
  set +a
fi

MILESTONE_SECRET="${MILESTONE_SECRET:-}"
APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

if [ -z "$MILESTONE_SECRET" ]; then
  echo "[session-end] MILESTONE_SECRET not set — skipping milestone sync"
  exit 0
fi

cd "$PROJECT_DIR"

# Must be a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "[session-end] Not a git repo — skipping"
  exit 0
fi

# Collect context: recent commits + changed files + any uncommitted work
GIT_LOG=$(git log --oneline -10 2>/dev/null || true)
GIT_COMMITTED=$(git diff --stat HEAD~5 HEAD 2>/dev/null || true)
GIT_STAGED=$(git diff --cached --stat 2>/dev/null || true)
GIT_UNSTAGED=$(git diff --stat 2>/dev/null || true)

# Bail early if nothing to report
if [ -z "$GIT_LOG" ] && [ -z "$GIT_COMMITTED" ] && [ -z "$GIT_STAGED" ] && [ -z "$GIT_UNSTAGED" ]; then
  echo "[session-end] No git activity found — skipping"
  exit 0
fi

GIT_CONTEXT="=== Recent commits ===
${GIT_LOG}

=== Files committed (last 5 commits) ===
${GIT_COMMITTED}

=== Staged (uncommitted) ===
${GIT_STAGED:-none}

=== Unstaged changes ===
${GIT_UNSTAGED:-none}"

# JSON-encode the context safely (python3 is standard on macOS/Linux)
if ! command -v python3 &>/dev/null; then
  echo "[session-end] python3 not found — skipping"
  exit 0
fi

BODY=$(python3 -c "import json,sys; print(json.dumps({'git_context': sys.stdin.read()}))" <<< "$GIT_CONTEXT")

# POST to the API — silently skip if server is unreachable
RESPONSE=$(curl -sf \
  --max-time 30 \
  -X POST "${APP_URL}/api/rooms/milestone-sync" \
  -H "Content-Type: application/json" \
  -H "x-milestone-secret: ${MILESTONE_SECRET}" \
  -d "$BODY" \
  2>/dev/null) || {
  echo "[session-end] ${APP_URL} unreachable — skipping (this is fine if dev server is off)"
  exit 0
}

echo "[session-end] $RESPONSE"
