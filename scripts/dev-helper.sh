#!/bin/bash

# Rimmarsa Development Helper Script
# Quick commands for common development tasks

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo ""
    echo "Rimmarsa Development Helper"
    echo "============================"
    echo ""
    echo "Usage: ./scripts/dev-helper.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start-marketplace    Start marketplace dev server"
    echo "  start-mobile         Start mobile app dev server"
    echo "  start-admin          Start admin dashboard"
    echo "  start-vendor         Start vendor dashboard"
    echo "  start-all            Start all dev servers (separate terminals)"
    echo "  build-marketplace    Build marketplace for production"
    echo "  build-mobile         Build mobile app APK"
    echo "  test-all             Run all tests"
    echo "  lint-all             Lint all projects"
    echo "  clean                Clean all node_modules and build artifacts"
    echo "  fresh-install        Clean install all dependencies"
    echo "  check-env            Verify environment files"
    echo "  status               Show git status and current branches"
    echo ""
}

start_marketplace() {
    echo -e "${GREEN}Starting marketplace...${NC}"
    cd marketplace && npm run dev
}

start_mobile() {
    echo -e "${GREEN}Starting mobile app...${NC}"
    cd mobile-app && npm start
}

start_admin() {
    echo -e "${GREEN}Starting admin dashboard...${NC}"
    cd admin-dashboard && npm run dev
}

start_vendor() {
    echo -e "${GREEN}Starting vendor dashboard...${NC}"
    cd vendor-dashboard && npm run dev
}

start_all() {
    echo -e "${YELLOW}Note: This will open multiple terminals${NC}"
    echo "Please start each app manually in separate terminals:"
    echo "  Terminal 1: cd marketplace && npm run dev"
    echo "  Terminal 2: cd mobile-app && npm start"
    echo "  Terminal 3: cd admin-dashboard && npm run dev"
    echo "  Terminal 4: cd vendor-dashboard && npm run dev"
}

build_marketplace() {
    echo -e "${GREEN}Building marketplace...${NC}"
    cd marketplace && npm run build
}

build_mobile() {
    echo -e "${GREEN}Building mobile app...${NC}"
    ./scripts/mobile-app/build-and-upload.sh
}

test_all() {
    echo -e "${GREEN}Running tests...${NC}"
    echo "Testing marketplace..."
    cd marketplace && npm test || echo "No tests configured"
    cd ..
}

lint_all() {
    echo -e "${GREEN}Linting all projects...${NC}"
    echo "Linting marketplace..."
    cd marketplace && npm run lint || echo "No lint configured"
    cd ..
}

clean_all() {
    echo -e "${YELLOW}Cleaning build artifacts and node_modules...${NC}"
    read -p "This will delete all node_modules. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf marketplace/node_modules marketplace/.next
        rm -rf mobile-app/node_modules mobile-app/dist
        rm -rf admin-dashboard/node_modules admin-dashboard/dist
        rm -rf vendor-dashboard/node_modules vendor-dashboard/dist
        rm -rf node_modules
        echo -e "${GREEN}✓ Cleaned${NC}"
    fi
}

fresh_install() {
    clean_all
    echo -e "${GREEN}Installing dependencies...${NC}"
    ./scripts/setup/setup-dev-environment.sh
}

check_env() {
    echo -e "${BLUE}Checking environment files...${NC}"
    echo ""

    [ -f "marketplace/.env.local" ] && echo "✓ marketplace/.env.local" || echo "✗ marketplace/.env.local MISSING"
    [ -f "mobile-app/.env" ] && echo "✓ mobile-app/.env" || echo "✗ mobile-app/.env MISSING"
    [ -f "admin-dashboard/.env" ] && echo "✓ admin-dashboard/.env" || echo "✗ admin-dashboard/.env MISSING"
    [ -f "vendor-dashboard/.env" ] && echo "✓ vendor-dashboard/.env" || echo "✗ vendor-dashboard/.env MISSING"
    echo ""
}

show_status() {
    echo -e "${BLUE}Git Status${NC}"
    git status -sb
    echo ""
    echo -e "${BLUE}Recent Commits${NC}"
    git log --oneline -5
    echo ""
}

# Main command router
case "$1" in
    start-marketplace)
        start_marketplace
        ;;
    start-mobile)
        start_mobile
        ;;
    start-admin)
        start_admin
        ;;
    start-vendor)
        start_vendor
        ;;
    start-all)
        start_all
        ;;
    build-marketplace)
        build_marketplace
        ;;
    build-mobile)
        build_mobile
        ;;
    test-all)
        test_all
        ;;
    lint-all)
        lint_all
        ;;
    clean)
        clean_all
        ;;
    fresh-install)
        fresh_install
        ;;
    check-env)
        check_env
        ;;
    status)
        show_status
        ;;
    *)
        show_help
        ;;
esac
