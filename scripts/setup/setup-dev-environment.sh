#!/bin/bash

# Rimmarsa Development Environment Setup
# This script sets up a complete development environment for Rimmarsa

set -e  # Exit on error

echo "========================================="
echo "Rimmarsa Development Environment Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
check_node() {
    echo -n "Checking Node.js installation... "
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION installed"
    else
        echo -e "${RED}✗${NC} Node.js not found"
        echo "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    echo -n "Checking npm installation... "
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}✓${NC} npm $NPM_VERSION installed"
    else
        echo -e "${RED}✗${NC} npm not found"
        exit 1
    fi
}

# Check if Git is installed
check_git() {
    echo -n "Checking Git installation... "
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        echo -e "${GREEN}✓${NC} Git $GIT_VERSION installed"
    else
        echo -e "${RED}✗${NC} Git not found"
        echo "Please install Git from https://git-scm.com/"
        exit 1
    fi
}

# Install dependencies for marketplace
install_marketplace_deps() {
    echo ""
    echo "Installing marketplace dependencies..."
    cd marketplace
    npm install
    cd ..
    echo -e "${GREEN}✓${NC} Marketplace dependencies installed"
}

# Install dependencies for mobile-app
install_mobile_deps() {
    echo ""
    echo "Installing mobile-app dependencies..."
    cd mobile-app
    npm install
    cd ..
    echo -e "${GREEN}✓${NC} Mobile app dependencies installed"
}

# Install dependencies for admin-dashboard
install_admin_deps() {
    echo ""
    echo "Installing admin-dashboard dependencies..."
    cd admin-dashboard
    npm install
    cd ..
    echo -e "${GREEN}✓${NC} Admin dashboard dependencies installed"
}

# Install dependencies for vendor-dashboard
install_vendor_deps() {
    echo ""
    echo "Installing vendor-dashboard dependencies..."
    cd vendor-dashboard
    npm install
    cd ..
    echo -e "${GREEN}✓${NC} Vendor dashboard dependencies installed"
}

# Check environment files
check_env_files() {
    echo ""
    echo "Checking environment files..."

    MISSING_ENV=0

    if [ ! -f "marketplace/.env.local" ]; then
        echo -e "${YELLOW}⚠${NC} marketplace/.env.local not found"
        echo "   Copy from .env.example and configure"
        MISSING_ENV=1
    fi

    if [ ! -f "mobile-app/.env" ]; then
        echo -e "${YELLOW}⚠${NC} mobile-app/.env not found"
        echo "   Copy from .env.example and configure"
        MISSING_ENV=1
    fi

    if [ ! -f "admin-dashboard/.env" ]; then
        echo -e "${YELLOW}⚠${NC} admin-dashboard/.env not found"
        echo "   Copy from .env.example and configure"
        MISSING_ENV=1
    fi

    if [ ! -f "vendor-dashboard/.env" ]; then
        echo -e "${YELLOW}⚠${NC} vendor-dashboard/.env not found"
        echo "   Copy from .env.example and configure"
        MISSING_ENV=1
    fi

    if [ $MISSING_ENV -eq 1 ]; then
        echo ""
        echo -e "${YELLOW}⚠ Please configure environment files before running the apps${NC}"
        echo "See docs/development/QUICK-START.md for details"
    else
        echo -e "${GREEN}✓${NC} All environment files present"
    fi
}

# Main setup flow
main() {
    check_node
    check_npm
    check_git

    echo ""
    echo "Installing dependencies for all applications..."
    echo ""

    install_marketplace_deps
    install_mobile_deps
    install_admin_deps
    install_vendor_deps

    check_env_files

    echo ""
    echo "========================================="
    echo -e "${GREEN}Setup Complete!${NC}"
    echo "========================================="
    echo ""
    echo "Next steps:"
    echo "1. Configure environment files (see .env.example in each directory)"
    echo "2. Review docs/development/QUICK-START.md"
    echo "3. Start development servers:"
    echo "   - Marketplace: cd marketplace && npm run dev"
    echo "   - Mobile: cd mobile-app && npm start"
    echo "   - Admin: cd admin-dashboard && npm run dev"
    echo "   - Vendor: cd vendor-dashboard && npm run dev"
    echo ""
}

# Run main setup
main
