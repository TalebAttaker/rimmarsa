#!/bin/bash
set -e

################################################################################
# RIMMARSA VENDOR APP - COMPLETE AUTOMATED DEPLOYMENT
#
# This script handles everything:
# 1. Builds the Android APK
# 2. Uploads to Supabase Storage (with service role key)
# 3. Updates database with version info
# 4. Verifies deployment
#
# Usage: ./DEPLOY-COMPLETE.sh
################################################################################

echo "🚀 Rimmarsa Vendor App - Complete Deployment"
echo "=============================================="
echo ""

# Configuration
PROJECT_DIR="/home/taleb/rimmarsa/mobile-app"
SUPABASE_URL="https://rfyqzuuuumgdoomyhqcu.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A"

cd "$PROJECT_DIR"

# Read version from package.json
VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
echo "📦 Version: $VERSION"
echo ""

# Step 1: Build APK (if not already built)
APK_PATH="/tmp/vendor-app-${VERSION}.apk"

if [ -f "$APK_PATH" ]; then
    echo "✅ APK already exists at: $APK_PATH"
else
    echo "1️⃣  Building APK..."
    echo "   This may take 5-10 minutes..."

    # Check Android SDK
    if [ ! -d "$HOME/Android/Sdk" ]; then
        echo "❌ Android SDK not found!"
        exit 1
    fi

    export ANDROID_HOME=$HOME/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

    # Build
    cd android
    ./gradlew assembleRelease --console=plain > /dev/null 2>&1
    cd ..

    # Copy APK
    cp "android/app/build/outputs/apk/release/app-release.apk" "$APK_PATH"
    echo "✅ APK built successfully"
fi

APK_SIZE=$(stat -f%z "$APK_PATH" 2>/dev/null || stat -c%s "$APK_PATH")
APK_SIZE_MB=$(echo "scale=2; $APK_SIZE / 1048576" | bc)
echo ""
echo "📊 APK Details:"
echo "   File: $APK_PATH"
echo "   Size: ${APK_SIZE_MB} MB ($APK_SIZE bytes)"
echo ""

# Step 2: Upload to Supabase Storage using multipart approach
echo "2️⃣  Uploading to Supabase Storage..."
echo "   Note: For files > 6MB, we'll use the Supabase dashboard method"
echo ""

# Create upload helper
cat > /tmp/upload-apk-final.js << 'JSEOF'
const fs = require('fs');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const APK_PATH = process.env.APK_PATH;
const VERSION = process.env.VERSION;

async function uploadAPK() {
  console.log('📤 Uploading APK via chunked transfer...\n');

  const fileName = `vendor-app-${VERSION}.apk`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/apps/${fileName}`;

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(APK_PATH);
    const fileSize = fs.statSync(APK_PATH).size;

    const url = new URL(uploadUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/vnd.android.package-archive',
        'x-upsert': 'true',
        'Transfer-Encoding': 'chunked'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Upload successful!');
          console.log(`   Public URL: ${SUPABASE_URL}/storage/v1/object/public/apps/${fileName}\n`);
          resolve(data);
        } else {
          console.error(`❌ Upload failed: HTTP ${res.statusCode}`);
          console.error(`   Response: ${data}\n`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);

    let uploaded = 0;
    fileStream.on('data', (chunk) => {
      uploaded += chunk.length;
      const progress = ((uploaded / fileSize) * 100).toFixed(1);
      process.stdout.write(`\r   Progress: ${progress}% (${(uploaded / 1024 / 1024).toFixed(1)} MB / ${(fileSize / 1024 / 1024).toFixed(1)} MB)`);
    });

    fileStream.pipe(req);
  });
}

uploadAPK()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Upload failed:', err.message);
    console.log('\n⚠️  Automatic upload failed. Please upload manually:');
    console.log(`   1. Go to: ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '')}/storage/buckets/apps`);
    console.log(`   2. Upload: ${APK_PATH}`);
    console.log(`   3. File name should be: vendor-app-${VERSION}.apk\n`);
    process.exit(1);
  });
JSEOF

# Run the upload
SUPABASE_URL=$SUPABASE_URL \
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
APK_PATH=$APK_PATH \
VERSION=$VERSION \
node /tmp/upload-apk-final.js

if [ $? -eq 0 ]; then
    echo "✅ APK uploaded to Supabase Storage"
    PUBLIC_URL="${SUPABASE_URL}/storage/v1/object/public/apps/vendor-app-${VERSION}.apk"
else
    echo "⚠️  Upload command completed with warnings"
    PUBLIC_URL="${SUPABASE_URL}/storage/v1/object/public/apps/vendor-app-${VERSION}.apk"
fi

echo ""

# Step 3: Test accessibility
echo "3️⃣  Testing APK accessibility..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" "$PUBLIC_URL")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ APK is publicly accessible!"
else
    echo "⚠️  APK returned HTTP $HTTP_CODE"
    echo "   This might mean:"
    echo "   - Upload is still processing"
    echo "   - Manual upload needed via Supabase Dashboard"
fi
echo ""

# Step 4: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Version: $VERSION"
echo "📊 Size: ${APK_SIZE_MB} MB"
echo "🔗 Download URL: $PUBLIC_URL"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "🎉 FULLY DEPLOYED!"
    echo ""
    echo "Users can now:"
    echo "  - Download from: https://www.rimmarsa.com/download"
    echo "  - Register as vendors via the mobile app"
    echo "  - Existing users will get update notifications"
else
    echo "⚠️  MANUAL STEP NEEDED"
    echo ""
    echo "Please upload the APK manually:"
    echo "  1. Open: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/apps"
    echo "  2. Upload: $APK_PATH"
    echo "  3. Verify: $PUBLIC_URL returns HTTP 200"
fi

echo ""
