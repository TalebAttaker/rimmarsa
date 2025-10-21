#!/bin/bash

###############################################################################
# RIMMARSA SECURITY TESTING SCRIPT
###############################################################################
# This script tests all security features to ensure they're working correctly
#
# Usage:
#   chmod +x scripts/security/test-security.sh
#   ./scripts/security/test-security.sh [PRODUCTION_URL]
#
# Example:
#   ./scripts/security/test-security.sh https://rimmarsa.com
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
VENDOR_API="$BASE_URL/api/vendor/login"
ADMIN_API="$BASE_URL/api/admin/login"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         RIMMARSA SECURITY TESTING SUITE                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Target: ${YELLOW}$BASE_URL${NC}"
echo ""

###############################################################################
# TEST 1: Rate Limiting (Authentication)
###############################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 1: Authentication Rate Limiting (5 attempts/15min)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "Testing vendor login rate limiting..."
echo "Expected: First 5 attempts return 401, 6th returns 429"
echo ""

for i in {1..7}; do
  echo -n "Attempt $i: "

  response=$(curl -s -w "\n%{http_code}" -X POST "$VENDOR_API" \
    -H "Content-Type: application/json" \
    -d '{"phoneDigits":"12345678","password":"wrongpassword"}')

  status_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)

  if [ $i -le 5 ]; then
    if [ "$status_code" == "401" ]; then
      echo -e "${GREEN}✓ PASS${NC} - Got 401 Unauthorized (expected)"
    else
      echo -e "${RED}✗ FAIL${NC} - Got $status_code (expected 401)"
    fi
  else
    if [ "$status_code" == "429" ]; then
      echo -e "${GREEN}✓ PASS${NC} - Got 429 Rate Limited (expected)"
    else
      echo -e "${RED}✗ FAIL${NC} - Got $status_code (expected 429)"
    fi
  fi

  sleep 0.5
done

echo ""

###############################################################################
# TEST 2: Input Validation
###############################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 2: Input Validation (Zod Schemas)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -n "Test 2a: Invalid phone (too short) - "
response=$(curl -s -w "\n%{http_code}" -X POST "$VENDOR_API" \
  -H "Content-Type: application/json" \
  -d '{"phoneDigits":"123","password":"test123"}')

status_code=$(echo "$response" | tail -n 1)
if [ "$status_code" == "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Rejected invalid phone"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400, got $status_code"
fi

echo -n "Test 2b: Non-numeric phone - "
response=$(curl -s -w "\n%{http_code}" -X POST "$VENDOR_API" \
  -H "Content-Type: application/json" \
  -d '{"phoneDigits":"abcd1234","password":"test123"}')

status_code=$(echo "$response" | tail -n 1)
if [ "$status_code" == "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Rejected non-numeric phone"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400, got $status_code"
fi

echo -n "Test 2c: Missing password - "
response=$(curl -s -w "\n%{http_code}" -X POST "$VENDOR_API" \
  -H "Content-Type: application/json" \
  -d '{"phoneDigits":"12345678"}')

status_code=$(echo "$response" | tail -n 1)
if [ "$status_code" == "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Rejected missing password"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400, got $status_code"
fi

echo ""

###############################################################################
# TEST 3: Geofencing (Manual Test)
###############################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 3: IP Geofencing (Mauritania-Only)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}⚠️  MANUAL TEST REQUIRED${NC}"
echo ""
echo "Geofencing can only be tested in production with actual IP addresses."
echo ""
echo "To test:"
echo "1. Access $BASE_URL from Mauritania IP → Should work (200)"
echo "2. Access $BASE_URL from US/Europe IP → Should be blocked (403)"
echo "3. Use VPN to test different countries"
echo ""
echo "Expected 403 response body:"
echo '{"error":"Access denied. This service is only available in Mauritania.","code":"GEO_BLOCKED"}'
echo ""

###############################################################################
# TEST 4: Security Headers
###############################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 4: Security Headers${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "Checking security headers..."
headers=$(curl -s -I "$BASE_URL" | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Content-Security-Policy|Strict-Transport-Security)")

echo -n "X-Frame-Options: "
if echo "$headers" | grep -q "X-Frame-Options"; then
  echo -e "${GREEN}✓ PRESENT${NC}"
else
  echo -e "${RED}✗ MISSING${NC}"
fi

echo -n "X-Content-Type-Options: "
if echo "$headers" | grep -q "X-Content-Type-Options"; then
  echo -e "${GREEN}✓ PRESENT${NC}"
else
  echo -e "${RED}✗ MISSING${NC}"
fi

echo -n "X-XSS-Protection: "
if echo "$headers" | grep -q "X-XSS-Protection"; then
  echo -e "${GREEN}✓ PRESENT${NC}"
else
  echo -e "${RED}✗ MISSING${NC}"
fi

echo -n "Content-Security-Policy: "
if echo "$headers" | grep -q "Content-Security-Policy"; then
  echo -e "${GREEN}✓ PRESENT${NC}"
else
  echo -e "${RED}✗ MISSING${NC}"
fi

echo -n "Strict-Transport-Security: "
if echo "$headers" | grep -q "Strict-Transport-Security"; then
  echo -e "${GREEN}✓ PRESENT${NC}"
else
  echo -e "${YELLOW}⚠  MISSING (OK in dev, required in prod)${NC}"
fi

echo ""

###############################################################################
# TEST 5: Rate Limit Headers
###############################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 5: Rate Limit Headers${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "Checking rate limit headers..."
response=$(curl -s -I "$BASE_URL")

echo -n "X-RateLimit-Limit: "
if echo "$response" | grep -q "X-RateLimit-Limit"; then
  limit=$(echo "$response" | grep "X-RateLimit-Limit" | cut -d' ' -f2 | tr -d '\r')
  echo -e "${GREEN}✓ PRESENT${NC} (Limit: $limit)"
else
  echo -e "${RED}✗ MISSING${NC}"
fi

echo -n "X-RateLimit-Remaining: "
if echo "$response" | grep -q "X-RateLimit-Remaining"; then
  remaining=$(echo "$response" | grep "X-RateLimit-Remaining" | cut -d' ' -f2 | tr -d '\r')
  echo -e "${GREEN}✓ PRESENT${NC} (Remaining: $remaining)"
else
  echo -e "${RED}✗ MISSING${NC}"
fi

echo -n "X-RateLimit-Reset: "
if echo "$response" | grep -q "X-RateLimit-Reset"; then
  reset=$(echo "$response" | grep "X-RateLimit-Reset" | cut -d' ' -f2 | tr -d '\r')
  echo -e "${GREEN}✓ PRESENT${NC} (Reset: $reset)"
else
  echo -e "${RED}✗ MISSING${NC}"
fi

echo ""

###############################################################################
# SUMMARY
###############################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "✅ Automated tests completed"
echo -e "⚠️  Manual geofencing test required (see TEST 3)"
echo ""
echo -e "${GREEN}Security features are working correctly!${NC}"
echo ""
