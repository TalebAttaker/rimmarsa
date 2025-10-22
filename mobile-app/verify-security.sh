#!/bin/bash

# Rimmarsa Vendor App - Security Verification Script
# Run this before building production APK

set -e

echo "🔒 Rimmarsa Vendor App - Security Verification"
echo "=============================================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to print error
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "1. Checking for hardcoded credentials..."
echo "----------------------------------------"

# Check for hardcoded Supabase URLs (not in env vars)
if grep -r "rfyqzuuuumgdoomyhqcu" src/ app.config.js 2>/dev/null | grep -v "process.env" | grep -q .; then
    error "Found hardcoded Supabase URL in code"
    grep -r "rfyqzuuuumgdoomyhqcu" src/ app.config.js 2>/dev/null | grep -v "process.env"
else
    success "No hardcoded Supabase URLs found in code"
fi

# Check for hardcoded JWT tokens
if grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/ --include="*.js" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".env" | grep -q .; then
    error "Found hardcoded JWT tokens in code"
    grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/ --include="*.js" --include="*.ts" 2>/dev/null | grep -v ".env"
else
    success "No hardcoded JWT tokens found in code"
fi

# Check for AsyncStorage usage (should use SecureStorage instead)
ASYNC_COUNT=$(grep -r "AsyncStorage" src/ --include="*.js" 2>/dev/null | grep -v "SecureTokenManager" | wc -l)
if [ "$ASYNC_COUNT" -gt 0 ]; then
    warning "Found $ASYNC_COUNT instances of AsyncStorage (should use SecureTokenManager)"
    grep -r "AsyncStorage" src/ --include="*.js" 2>/dev/null | grep -v "SecureTokenManager"
else
    success "AsyncStorage properly replaced with SecureTokenManager"
fi

echo ""
echo "2. Checking environment configuration..."
echo "----------------------------------------"

# Check if .env file exists
if [ ! -f ".env" ]; then
    error ".env file not found"
else
    success ".env file exists"

    # Check if .env has required variables
    if ! grep -q "SUPABASE_URL" .env; then
        error "SUPABASE_URL not found in .env"
    else
        success "SUPABASE_URL found in .env"
    fi

    if ! grep -q "SUPABASE_ANON_KEY" .env; then
        error "SUPABASE_ANON_KEY not found in .env"
    else
        success "SUPABASE_ANON_KEY found in .env"
    fi
fi

# Check if .env is in .gitignore
if grep -q "^.env$" .gitignore; then
    success ".env is in .gitignore"
else
    error ".env is NOT in .gitignore - credentials may be committed!"
fi

echo ""
echo "3. Checking security packages..."
echo "--------------------------------"

# Check if expo-secure-store is installed
if grep -q "expo-secure-store" package.json; then
    success "expo-secure-store is installed"
else
    error "expo-secure-store NOT installed"
fi

# Check if dotenv is installed
if grep -q "dotenv" package.json; then
    success "dotenv is installed"
else
    warning "dotenv NOT installed (optional but recommended)"
fi

echo ""
echo "4. Checking SecureTokenManager implementation..."
echo "------------------------------------------------"

if [ -f "src/services/secureStorage.js" ]; then
    success "SecureTokenManager service exists"

    # Check if it exports the class
    if grep -q "export default SecureTokenManager" src/services/secureStorage.js; then
        success "SecureTokenManager properly exported"
    else
        error "SecureTokenManager not properly exported"
    fi
else
    error "SecureTokenManager service NOT found"
fi

echo ""
echo "5. Checking app configuration..."
echo "--------------------------------"

# Check if app.config.js exists
if [ -f "app.config.js" ]; then
    success "app.config.js exists"

    # Check if it uses process.env
    if grep -q "process.env.SUPABASE_URL" app.config.js; then
        success "app.config.js uses environment variables"
    else
        error "app.config.js does NOT use environment variables"
    fi
else
    error "app.config.js NOT found"
fi

# Check if old app.json has credentials
if [ -f "app.json" ]; then
    if grep -q "supabaseUrl\|supabaseAnonKey" app.json; then
        warning "app.json still contains credentials (should be removed or use app.config.js instead)"
    else
        success "app.json is clean"
    fi
fi

echo ""
echo "6. Checking build configuration..."
echo "----------------------------------"

# Check if eas.json exists
if [ -f "eas.json" ]; then
    success "eas.json exists"
else
    warning "eas.json NOT found (required for EAS builds)"
fi

echo ""
echo "7. File permissions check..."
echo "----------------------------"

# Check if .env has proper permissions (should not be world-readable)
if [ -f ".env" ]; then
    PERMS=$(stat -c "%a" .env 2>/dev/null || stat -f "%A" .env 2>/dev/null)
    if [ "$PERMS" = "600" ] || [ "$PERMS" = "640" ]; then
        success ".env has secure permissions ($PERMS)"
    else
        warning ".env permissions are $PERMS (recommend 600 or 640)"
    fi
fi

echo ""
echo "8. Dependency security check..."
echo "--------------------------------"

# Check for known vulnerable packages
if npm audit --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities"; then
    success "No high/critical vulnerabilities in dependencies"
else
    warning "Some vulnerabilities found in dependencies"
    echo "Run 'npm audit' for details"
fi

echo ""
echo "=========================================="
echo "Security Verification Complete"
echo "=========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo "Your app is secure and ready for production build."
    echo ""
    echo "Next steps:"
    echo "1. Run: npx eas-cli build --platform android --profile production"
    echo "2. Upload APK to Supabase Storage"
    echo "3. Deploy website: git push origin main"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS WARNING(S) FOUND${NC}"
    echo "Review warnings above. App is mostly secure but improvements recommended."
    exit 0
else
    echo -e "${RED}❌ $ERRORS ERROR(S) and $WARNINGS WARNING(S) FOUND${NC}"
    echo "Please fix errors above before building production APK!"
    exit 1
fi
