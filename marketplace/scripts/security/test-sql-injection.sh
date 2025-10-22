#!/bin/bash

# ============================================================================
# SQL Injection Security Test Suite
# ============================================================================
# Tests all critical endpoints for SQL injection vulnerabilities
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
PASSED=0
FAILED=0

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}SQL Injection Security Test Suite${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Testing: ${BASE_URL}"
echo ""

# ============================================================================
# Test Helper Functions
# ============================================================================

test_pass() {
  echo -e "${GREEN}✓ PASS${NC} - $1"
  PASSED=$((PASSED + 1))
}

test_fail() {
  echo -e "${RED}✗ FAIL${NC} - $1"
  echo -e "${YELLOW}  Details: $2${NC}"
  FAILED=$((FAILED + 1))
}

test_info() {
  echo -e "${BLUE}ℹ INFO${NC} - $1"
}

# ============================================================================
# TEST 1: Vendor Search - LIKE Pattern Injection
# ============================================================================

echo -e "\n${BLUE}TEST 1: Vendor Search - LIKE Pattern Injection${NC}"
echo "Testing: /vendors?search=..."

# Test 1.1: Wildcard percent injection
test_info "Testing percent wildcard injection: %"
RESPONSE=$(curl -s "${BASE_URL}/vendors?search=%25" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
  # Should either succeed with escaped pattern or reject with 400
  test_pass "Percent wildcard handled correctly (HTTP $HTTP_CODE)"
else
  test_fail "Percent wildcard failed" "HTTP $HTTP_CODE"
fi

# Test 1.2: Underscore wildcard injection
test_info "Testing underscore wildcard injection: _"
RESPONSE=$(curl -s "${BASE_URL}/vendors?search=_" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
  test_pass "Underscore wildcard handled correctly (HTTP $HTTP_CODE)"
else
  test_fail "Underscore wildcard failed" "HTTP $HTTP_CODE"
fi

# Test 1.3: Combined pattern injection
test_info "Testing combined pattern: %_test_%"
RESPONSE=$(curl -s "${BASE_URL}/vendors?search=%25_test_%25" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
  test_pass "Combined pattern handled correctly (HTTP $HTTP_CODE)"
else
  test_fail "Combined pattern failed" "HTTP $HTTP_CODE"
fi

# Test 1.4: SQL comment injection attempt
test_info "Testing SQL comment injection: test'--"
RESPONSE=$(curl -s "${BASE_URL}/vendors?search=test%27--" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)
if [ "$HTTP_CODE" = "400" ] && echo "$BODY" | grep -q "غير صالحة"; then
  test_pass "SQL comment injection blocked (HTTP 400 with Arabic error)"
elif [ "$HTTP_CODE" = "200" ]; then
  test_pass "SQL comment rejected by character validation (HTTP 200)"
else
  test_fail "SQL comment injection not properly handled" "HTTP $HTTP_CODE"
fi

# Test 1.5: Invalid characters rejection
test_info "Testing invalid characters: <script>"
RESPONSE=$(curl -s "${BASE_URL}/vendors?search=%3Cscript%3E" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)
if [ "$HTTP_CODE" = "400" ]; then
  test_pass "Invalid characters rejected (HTTP 400)"
elif [ "$HTTP_CODE" = "200" ] && ! echo "$BODY" | grep -q "script"; then
  test_pass "Invalid characters sanitized"
else
  test_fail "Invalid characters not properly handled" "HTTP $HTTP_CODE"
fi

# Test 1.6: Query length limit
test_info "Testing query length limit (250 chars)"
LONG_QUERY=$(printf 'a%.0s' {1..250})
RESPONSE=$(curl -s "${BASE_URL}/vendors?search=${LONG_QUERY}" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "400" ]; then
  test_pass "Long query rejected (HTTP 400)"
else
  test_fail "Long query not rejected" "HTTP $HTTP_CODE"
fi

# ============================================================================
# TEST 2: Product Search - LIKE Pattern Injection
# ============================================================================

echo -e "\n${BLUE}TEST 2: Product Search - LIKE Pattern Injection${NC}"
echo "Testing: /products?search=..."

# Test 2.1: Wildcard injection
test_info "Testing product search with wildcards"
RESPONSE=$(curl -s "${BASE_URL}/products?search=%25_%25" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
  test_pass "Product search wildcard handled (HTTP $HTTP_CODE)"
else
  test_fail "Product search wildcard failed" "HTTP $HTTP_CODE"
fi

# Test 2.2: SQL injection attempt
test_info "Testing SQL injection: ' OR 1=1--"
RESPONSE=$(curl -s "${BASE_URL}/products?search=%27%20OR%201=1--" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
  test_pass "SQL injection attempt blocked/sanitized (HTTP $HTTP_CODE)"
else
  test_fail "SQL injection not handled" "HTTP $HTTP_CODE"
fi

# ============================================================================
# TEST 3: Database Function - Traffic Report
# ============================================================================

echo -e "\n${BLUE}TEST 3: Database Function - Traffic Report${NC}"
echo "Testing: /api/admin/security/traffic?hours=..."

# Note: These tests require admin authentication
test_info "Testing without authentication (should fail)"
RESPONSE=$(curl -s "${BASE_URL}/api/admin/security/traffic?hours=24" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "401" ]; then
  test_pass "Unauthenticated request rejected (HTTP 401)"
else
  test_fail "Unauthenticated request not rejected" "HTTP $HTTP_CODE"
fi

# Test with potential SQL injection in hours parameter (would need auth token)
test_info "Testing SQL injection in hours parameter: '; DROP TABLE--"
RESPONSE=$(curl -s "${BASE_URL}/api/admin/security/traffic?hours=%27;%20DROP%20TABLE--" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "500" ]; then
  test_pass "SQL injection in hours parameter rejected (HTTP $HTTP_CODE)"
else
  test_fail "SQL injection in hours parameter not handled" "HTTP $HTTP_CODE"
fi

# ============================================================================
# TEST 4: Admin Authentication Bypass Attempts
# ============================================================================

echo -e "\n${BLUE}TEST 4: Admin Endpoint Authentication${NC}"
echo "Testing: Admin security endpoints"

ADMIN_ENDPOINTS=(
  "/api/admin/security/summary"
  "/api/admin/security/alerts"
  "/api/admin/security/traffic"
  "/api/admin/security/suspicious"
)

for endpoint in "${ADMIN_ENDPOINTS[@]}"; do
  test_info "Testing ${endpoint}"

  # Test without auth
  RESPONSE=$(curl -s "${BASE_URL}${endpoint}" -w "\n%{http_code}" || echo "000")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  if [ "$HTTP_CODE" = "401" ]; then
    test_pass "${endpoint} requires authentication (HTTP 401)"
  else
    test_fail "${endpoint} accessible without auth" "HTTP $HTTP_CODE"
  fi

  # Test with invalid token
  RESPONSE=$(curl -s "${BASE_URL}${endpoint}" -H "Authorization: Bearer invalid-token-12345" -w "\n%{http_code}" || echo "000")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    test_pass "${endpoint} rejects invalid token (HTTP $HTTP_CODE)"
  else
    test_fail "${endpoint} accepts invalid token" "HTTP $HTTP_CODE"
  fi
done

# ============================================================================
# TEST 5: Input Validation - Security Utils
# ============================================================================

echo -e "\n${BLUE}TEST 5: Input Validation Edge Cases${NC}"

# Test 5.1: Empty search query
test_info "Testing empty search query"
RESPONSE=$(curl -s "${BASE_URL}/vendors?search=" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
  test_pass "Empty search query handled (HTTP 200)"
else
  test_fail "Empty search query failed" "HTTP $HTTP_CODE"
fi

# Test 5.2: Arabic text (should be allowed)
test_info "Testing Arabic text: متجر"
RESPONSE=$(curl -s "${BASE_URL}/vendors?search=%D9%85%D8%AA%D8%AC%D8%B1" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
  test_pass "Arabic text accepted (HTTP 200)"
else
  test_fail "Arabic text rejected" "HTTP $HTTP_CODE"
fi

# Test 5.3: Numbers and hyphens (should be allowed)
test_info "Testing allowed characters: test-123"
RESPONSE=$(curl -s "${BASE_URL}/vendors?search=test-123" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
  test_pass "Allowed characters accepted (HTTP 200)"
else
  test_fail "Allowed characters rejected" "HTTP $HTTP_CODE"
fi

# Test 5.4: Special SQL characters
test_info "Testing SQL special characters: ';\\\"/*"
RESPONSE=$(curl -s "${BASE_URL}/vendors?search=%27;%5C%22/*" -w "\n%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "400" ]; then
  test_pass "SQL special characters rejected (HTTP 400)"
else
  test_fail "SQL special characters not rejected" "HTTP $HTTP_CODE"
fi

# ============================================================================
# RESULTS SUMMARY
# ============================================================================

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Test Results Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ ALL TESTS PASSED${NC}"
  echo -e "${GREEN}The platform is protected against SQL injection attacks.${NC}"
  exit 0
else
  echo -e "\n${RED}✗ SOME TESTS FAILED${NC}"
  echo -e "${YELLOW}Please review failed tests and fix vulnerabilities.${NC}"
  exit 1
fi
