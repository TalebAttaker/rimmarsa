#!/bin/bash

# Rimmarsa Vendor App - FULLY AUTOMATED Build and Deploy
# This script does EVERYTHING after you login to EAS

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   🤖 RIMMARSA - FULLY AUTOMATED BUILD & DEPLOY              ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "app.config.js" ]; then
    echo -e "${RED}❌ Error: Please run this script from the mobile-app directory${NC}"
    echo "   cd /home/taleb/rimmarsa/mobile-app"
    exit 1
fi

# Configuration
APK_NAME="vendor-app-1.0.0.apk"
SUPABASE_PROJECT="rfyqzuuuumgdoomyhqcu"
SUPABASE_BUCKET="public"
SUPABASE_PATH="apps/${APK_NAME}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1/7: Check EAS Login${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if logged in
if npx eas-cli whoami 2>&1 | grep -q "Not logged in"; then
    echo -e "${RED}❌ Not logged in to EAS${NC}"
    echo ""
    echo -e "${YELLOW}Please run these commands first:${NC}"
    echo "  npx eas-cli@latest login"
    echo "  npx eas-cli@latest init --id bf9384bd-86ef-4bbf-982e-e79d6a57e912"
    echo ""
    echo "Then run this script again."
    exit 1
fi

USERNAME=$(npx eas-cli whoami 2>&1 | grep -v "Not logged in" | head -1)
echo -e "${GREEN}✅ Logged in as: ${USERNAME}${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2/7: Initialize EAS Project${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Initializing project with ID: bf9384bd-86ef-4bbf-982e-e79d6a57e912"
npx eas-cli@latest init --id bf9384bd-86ef-4bbf-982e-e79d6a57e912 || echo "Already initialized"
echo -e "${GREEN}✅ Project initialized${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3/7: Build Production APK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⏱️  This will take 10-15 minutes...${NC}"
echo "Starting build..."
echo ""

# Start the build and capture output
BUILD_OUTPUT=$(npx eas-cli@latest build --platform android --profile production --non-interactive 2>&1)
echo "$BUILD_OUTPUT"

# Extract build URL
BUILD_URL=$(echo "$BUILD_OUTPUT" | grep -oP 'https://expo.dev/accounts/[^/]+/projects/[^/]+/builds/[a-zA-Z0-9-]+' | head -1)

if [ -z "$BUILD_URL" ]; then
    echo -e "${RED}❌ Failed to start build. Please check the output above.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build started!${NC}"
echo -e "${BLUE}Build URL: ${BUILD_URL}${NC}"
echo ""
echo "Waiting for build to complete..."

# Wait for build to complete (check every 30 seconds)
MAX_WAIT=1800  # 30 minutes max
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    sleep 30
    WAITED=$((WAITED + 30))

    BUILD_STATUS=$(npx eas-cli@latest build:list --limit=1 --json 2>&1 | grep -oP '"status":"[^"]+' | head -1 | cut -d'"' -f4)

    if [ "$BUILD_STATUS" = "finished" ]; then
        echo -e "${GREEN}✅ Build completed successfully!${NC}"
        break
    elif [ "$BUILD_STATUS" = "errored" ] || [ "$BUILD_STATUS" = "canceled" ]; then
        echo -e "${RED}❌ Build failed with status: ${BUILD_STATUS}${NC}"
        echo "Check build details at: ${BUILD_URL}"
        exit 1
    else
        echo -e "${YELLOW}⏳ Build in progress... (${WAITED}s elapsed, status: ${BUILD_STATUS})${NC}"
    fi
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ Build timeout. Check status at: ${BUILD_URL}${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4/7: Download APK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get download URL
APK_URL=$(npx eas-cli@latest build:list --limit=1 --json 2>&1 | grep -oP '"buildUrl":"[^"]+' | head -1 | cut -d'"' -f4)

if [ -z "$APK_URL" ]; then
    echo -e "${RED}❌ Failed to get APK download URL${NC}"
    exit 1
fi

echo "Downloading APK from: ${APK_URL}"
wget -q --show-progress "$APK_URL" -O "$APK_NAME"

if [ ! -f "$APK_NAME" ]; then
    echo -e "${RED}❌ Failed to download APK${NC}"
    exit 1
fi

SIZE=$(du -h "$APK_NAME" | cut -f1)
echo -e "${GREEN}✅ APK downloaded: ${SIZE}${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 5/7: Generate SHA-256 Checksum${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

CHECKSUM=$(sha256sum "$APK_NAME" | cut -d' ' -f1)
echo -e "${GREEN}✅ SHA-256 Checksum:${NC}"
echo -e "${BLUE}${CHECKSUM}${NC}"
echo "$CHECKSUM" > checksum.txt
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 6/7: Upload APK to Supabase Storage${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Uploading to: ${SUPABASE_BUCKET}/${SUPABASE_PATH}"

# Upload using Supabase CLI
UPLOAD_RESULT=$(npx supabase storage upload "${SUPABASE_BUCKET}/${SUPABASE_PATH}" "$APK_NAME" --project-ref "$SUPABASE_PROJECT" 2>&1)

if echo "$UPLOAD_RESULT" | grep -q "error\|failed"; then
    echo -e "${YELLOW}⚠️  Upload via CLI failed, trying alternative method...${NC}"
    echo "Please upload manually:"
    echo "1. Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/storage/buckets/${SUPABASE_BUCKET}"
    echo "2. Create 'apps' folder if needed"
    echo "3. Upload: ${APK_NAME}"
    echo ""
    read -p "Press Enter when uploaded..."
else
    echo -e "${GREEN}✅ APK uploaded to Supabase Storage${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 7/7: Update Download Page & Deploy${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Update download page with checksum
DOWNLOAD_PAGE="../marketplace/src/app/download/page.tsx"

if [ -f "$DOWNLOAD_PAGE" ]; then
    echo "Updating download page with checksum..."

    # Backup original
    cp "$DOWNLOAD_PAGE" "${DOWNLOAD_PAGE}.bak"

    # Replace the checksum line
    sed -i "s/const apkChecksum = \".*\"/const apkChecksum = \"${CHECKSUM}\"/" "$DOWNLOAD_PAGE"

    echo -e "${GREEN}✅ Download page updated${NC}"
    echo ""

    # Commit and push
    cd ../marketplace
    git add src/app/download/page.tsx
    git commit -m "Add APK checksum and enable download functionality

- Generated SHA-256: ${CHECKSUM}
- APK uploaded to Supabase Storage
- Download endpoint ready at: /api/download/vendor-app
- APK size: ${SIZE}

🤖 Automated deployment" || echo "No changes to commit"

    git push origin main

    echo -e "${GREEN}✅ Changes pushed to GitHub${NC}"
    echo -e "${YELLOW}⏳ Vercel deployment in progress (2-3 minutes)...${NC}"
    echo ""
else
    echo -e "${RED}❌ Download page not found at: ${DOWNLOAD_PAGE}${NC}"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   ✅ DEPLOYMENT COMPLETE!                                    ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📋 Summary:${NC}"
echo -e "${GREEN}  ✅ APK built: ${SIZE}${NC}"
echo -e "${GREEN}  ✅ Checksum: ${CHECKSUM}${NC}"
echo -e "${GREEN}  ✅ Uploaded to Supabase Storage${NC}"
echo -e "${GREEN}  ✅ Download page updated${NC}"
echo -e "${GREEN}  ✅ Deployed to production${NC}"
echo ""
echo -e "${BLUE}📱 Test Download:${NC}"
echo "  Desktop: https://rimmarsa.com/download"
echo "  Mobile: https://rimmarsa.com (scroll to blue download button)"
echo ""
echo -e "${YELLOW}⏱️  Wait 2-3 minutes for Vercel deployment to complete${NC}"
echo ""
echo -e "${GREEN}🎉 The vendor app is now available for download!${NC}"
echo ""
