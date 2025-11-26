#!/usr/bin/env bash
# Quick smoke test for login rate limiting against the preview Pages build.
# Defaults can be overridden:
#   PREVIEW_URL=https://feature-auth-refresh-rate-li.order-ieeja.pages.dev
#   IP=1.2.3.4
#   ATTEMPTS=6

set -u

URL="${PREVIEW_URL:-https://feature-auth-refresh-rate-li.order-ieeja.pages.dev}/auth/login"
IP="${IP:-1.2.3.4}"
ATTEMPTS="${ATTEMPTS:-6}"

echo "Hitting $URL with IP $IP for $ATTEMPTS attempts..."

for i in $(seq 1 "$ATTEMPTS"); do
  echo "Attempt $i"
  curl -i -X POST "$URL" \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: $IP" \
    --data '{"phone":"1234567890","password":"wrongpw"}'
  echo -e "\n"
done
