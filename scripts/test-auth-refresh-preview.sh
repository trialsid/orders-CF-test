#!/usr/bin/env bash
# Smoke-test the auth refresh flow against a preview deployment.
# Usage:
#   PREVIEW_URL=https://<preview>.order-ieeja.pages.dev \
#   PHONE=1234567890 PASS="password" \
#   bash scripts/test-auth-refresh-preview.sh

set -euo pipefail

PREVIEW_URL="https://081c6c16.order-ieeja.pages.dev"
PHONE="9999999999"
PASS="Password123"

if [[ -z "$PREVIEW_URL" || -z "$PHONE" || -z "$PASS" ]]; then
  cat <<'EOF'
Required env vars:
  PREVIEW_URL=https://081c6c16.order-ieeja.pages.dev
  PHONE=9999999999
  PASS=Password123
Example:
  PREVIEW_URL=https://081c6c16.order-ieeja.pages.dev PHONE=9876543210 PASS="secret" bash scripts/test-auth-refresh-preview.sh
EOF
  exit 1
fi

BASE_URL="${PREVIEW_URL%/}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT

extract_token() {
  local file="$1"
  python3 - <<'PY' "$file" || true
import json, sys
try:
    data = json.load(open(sys.argv[1]))
    tok = data.get("token") or data.get("accessToken")
    if tok:
        print(tok)
except Exception:
    pass
PY
}

echo "Login -> Refresh -> Logout -> Refresh after logout @ ${BASE_URL}"

LOGIN_BODY="$(mktemp)"
LOGIN_STATUS=$(curl -sS -c "$COOKIE_FILE" -o "$LOGIN_BODY" -w '%{http_code}' \
  -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  --data "{\"phone\":\"$PHONE\",\"password\":\"$PASS\"}")
echo "Login status: $LOGIN_STATUS"
cat "$LOGIN_BODY"
echo
LOGIN_TOKEN=$(extract_token "$LOGIN_BODY")
if [[ "$LOGIN_STATUS" != "200" || -z "$LOGIN_TOKEN" ]]; then
  echo "Login failed; aborting."
  exit 1
fi
echo "Access token (truncated): ${LOGIN_TOKEN:0:24}..."

echo "Waiting 5 seconds before refresh to ensure a new token..."
sleep 5

REFRESH_BODY="$(mktemp)"
REFRESH_STATUS=$(curl -sS -b "$COOKIE_FILE" -c "$COOKIE_FILE" -o "$REFRESH_BODY" -w '%{http_code}' \
  -X POST "$BASE_URL/auth/refresh")
echo "Refresh status: $REFRESH_STATUS"
cat "$REFRESH_BODY"
echo
REFRESH_TOKEN=$(extract_token "$REFRESH_BODY")
if [[ "$REFRESH_STATUS" != "200" || -z "$REFRESH_TOKEN" ]]; then
  echo "Refresh failed."
else
  echo "New access token (truncated): ${REFRESH_TOKEN:0:24}..."
fi

LOGOUT_BODY="$(mktemp)"
LOGOUT_STATUS=$(curl -sS -b "$COOKIE_FILE" -c "$COOKIE_FILE" -o "$LOGOUT_BODY" -w '%{http_code}' \
  -X POST "$BASE_URL/auth/logout")
echo "Logout status: $LOGOUT_STATUS"
cat "$LOGOUT_BODY"
echo

AFTER_BODY="$(mktemp)"
AFTER_STATUS=$(curl -sS -b "$COOKIE_FILE" -o "$AFTER_BODY" -w '%{http_code}' \
  -X POST "$BASE_URL/auth/refresh")
echo "Refresh after logout status: $AFTER_STATUS (expected 401)"
cat "$AFTER_BODY"
echo
