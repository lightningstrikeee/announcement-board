#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
ANNOUNCEMENTS_URL="$API_URL/announcements"
AUTH_REGISTER_URL="$API_URL/auth/register"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

request() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local out_file="$4"
  local auth_token="${5:-}"

  local auth_headers=()
  if [[ -n "$auth_token" ]]; then
    auth_headers=(-H "Authorization: Bearer $auth_token")
  fi

  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "$url" \
      -H "Content-Type: application/json" \
      "${auth_headers[@]}" \
      -d "$body" \
      -o "$out_file" \
      -w "%{http_code}"
  else
    curl -sS -X "$method" "$url" \
      "${auth_headers[@]}" \
      -o "$out_file" \
      -w "%{http_code}"
  fi
}

assert_status() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [[ "$expected" != "$actual" ]]; then
    echo "[FAIL] $label: expected status $expected, got $actual"
    exit 1
  fi
  echo "[OK] $label"
}

assert_body_contains() {
  local needle="$1"
  local file="$2"
  local label="$3"
  if ! grep -q "$needle" "$file"; then
    echo "[FAIL] $label: response does not contain '$needle'"
    echo "Response:"
    cat "$file"
    exit 1
  fi
  echo "[OK] $label"
}

echo "Running backend smoke test against $API_URL"

test_email="smoke.$(date +%s)@example.com"
test_password="SmokePass1"

# 1) GET /announcements should return 200 and an array payload.
GET_ALL_BODY="$WORK_DIR/get-all.json"
get_all_status="$(request GET "$ANNOUNCEMENTS_URL" "" "$GET_ALL_BODY")"
assert_status "200" "$get_all_status" "GET /announcements returns 200"
if ! grep -Eq '^\s*\[' "$GET_ALL_BODY"; then
  echo "[FAIL] GET /announcements did not return a JSON array"
  cat "$GET_ALL_BODY"
  exit 1
fi
echo "[OK] GET /announcements returns a JSON array"

# 2) Register a smoke user and capture JWT for protected routes.
REGISTER_BODY="$WORK_DIR/register.json"
register_status="$(request POST "$AUTH_REGISTER_URL" "{\"email\":\"$test_email\",\"password\":\"$test_password\",\"name\":\"Smoke\",\"surname\":\"Tester\",\"department\":\"Engineering\",\"position\":\"Developer\"}" "$REGISTER_BODY")"
assert_status "201" "$register_status" "POST /auth/register creates smoke user"
assert_body_contains '"accessToken"' "$REGISTER_BODY" "Register returns access token"

access_token="$(sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p' "$REGISTER_BODY" | head -n 1)"
if [[ -z "$access_token" ]]; then
  echo "[FAIL] Could not extract access token from register response"
  cat "$REGISTER_BODY"
  exit 1
fi
echo "[OK] Captured access token"

# 3) Invalid POST payload should fail validation.
INVALID_POST_BODY="$WORK_DIR/post-invalid.json"
invalid_status="$(request POST "$ANNOUNCEMENTS_URL" '{"title":"x","body":"y","pinned":"yes"}' "$INVALID_POST_BODY" "$access_token")"
assert_status "400" "$invalid_status" "POST /announcements validates payload"
assert_body_contains 'pinned must be a boolean' "$INVALID_POST_BODY" "Validation message for pinned"

# 4) Valid POST payload should create an announcement.
POST_BODY="$WORK_DIR/post-valid.json"
post_status="$(request POST "$ANNOUNCEMENTS_URL" '{"title":"Smoke Title","body":"Smoke Body","pinned":false}' "$POST_BODY" "$access_token")"
assert_status "201" "$post_status" "POST /announcements creates record"
assert_body_contains '"id"' "$POST_BODY" "Created announcement has id"

announcement_id="$(sed -n 's/.*"id":"\([^"]*\)".*/\1/p' "$POST_BODY" | head -n 1)"
if [[ -z "$announcement_id" ]]; then
  echo "[FAIL] Could not extract id from create response"
  cat "$POST_BODY"
  exit 1
fi
echo "[OK] Extracted created id: $announcement_id"

# 5) GET /announcements/:id should return 200 and the created title.
GET_ONE_BODY="$WORK_DIR/get-one.json"
get_one_status="$(request GET "$ANNOUNCEMENTS_URL/$announcement_id" "" "$GET_ONE_BODY")"
assert_status "200" "$get_one_status" "GET /announcements/:id returns 200"
assert_body_contains '"title":"Smoke Title"' "$GET_ONE_BODY" "Fetched announcement title"

# 6) DELETE /announcements/:id should succeed.
DELETE_BODY="$WORK_DIR/delete.json"
delete_status="$(request DELETE "$ANNOUNCEMENTS_URL/$announcement_id" "" "$DELETE_BODY" "$access_token")"
if [[ "$delete_status" != "200" && "$delete_status" != "204" ]]; then
  echo "[FAIL] DELETE /announcements/:id: expected status 200 or 204, got $delete_status"
  exit 1
fi
echo "[OK] DELETE /announcements/:id succeeds"

echo "Smoke test finished successfully."
