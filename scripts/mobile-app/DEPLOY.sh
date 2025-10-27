#!/bin/bash
set -e

################################################################################
# RIMMARSA VENDOR APP - BUILD & DEPLOY SCRIPT
#
# This script handles the complete workflow:
# 1. Builds the Android APK locally
# 2. Uploads to Cloudflare R2
# 3. Updates version in database
# 4. App automatically detects new version and prompts users to update
#
# Usage: ./DEPLOY.sh
################################################################################

echo "🚀 Rimmarsa Vendor App - Build & Deploy"
echo "========================================"
echo ""

# Use Node 20 for compatibility with Expo SDK 51
export PATH="$HOME/.local/node-v20/bin:$PATH"
echo "✅ Using Node.js $(node --version)"
echo ""

# Configuration
PROJECT_DIR="/home/taleb/rimmarsa/mobile-app"
SUPABASE_PROJECT_REF="rfyqzuuuumgdoomyhqcu"
SUPABASE_URL="https://rfyqzuuuumgdoomyhqcu.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg5OTY0MTgsImV4cCI6MjA0NDU3MjQxOH0.S8x2vcvA5YhCa6LAqSNh1lOoJSGpSUyZjSrX5JTjQRY"

cd "$PROJECT_DIR"

# Read version from package.json
VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
echo "📦 Building version: $VERSION"
echo ""

# Step 1: Check Android SDK
echo "1️⃣  Checking Android SDK..."
if [ ! -d "$HOME/Android/Sdk" ]; then
    echo "❌ Android SDK not found!"
    echo "Please run: ./INSTALL-ANDROID-SDK.sh first"
    exit 1
fi
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
echo "✅ Android SDK ready"
echo ""

# Step 2: Generate Android project if needed
echo "2️⃣  Checking Android project..."
if [ ! -d "android" ]; then
    echo "Generating Android project with expo prebuild..."
    npx expo prebuild --clean --platform android > /dev/null 2>&1
    echo "✅ Android project generated"
else
    echo "✅ Android project exists"
fi
echo ""

# Step 3: Build APK
echo "3️⃣  Building APK (this may take 2-5 minutes)..."
cd android
./gradlew assembleRelease --console=plain 2>&1 | grep -E "BUILD|Task :app|SUCCESSFUL|FAILED" || true
cd ..

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_PATH" ]; then
    echo "❌ Build failed! APK not found"
    exit 1
fi
echo "✅ APK built successfully"
echo ""

# Step 4: Prepare APK for upload
OUTPUT_FILE="vendor-app-${VERSION}.apk"
cp "$APK_PATH" "/tmp/$OUTPUT_FILE"
APK_SIZE=$(stat -f%z "/tmp/$OUTPUT_FILE" 2>/dev/null || stat -c%s "/tmp/$OUTPUT_FILE")
APK_SIZE_MB=$(echo "scale=2; $APK_SIZE / 1048576" | bc)

echo "4️⃣  APK Details:"
echo "   📱 File: $OUTPUT_FILE"
echo "   📊 Size: ${APK_SIZE_MB} MB"
echo ""

# Step 5: Upload to Supabase Storage
echo "5️⃣  Uploading to Supabase Storage..."
STORAGE_PATH="apps/$OUTPUT_FILE"
PUBLIC_URL="${SUPABASE_URL}/storage/v1/object/public/${STORAGE_PATH}"

# Upload using curl
UPLOAD_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/storage/v1/object/apps/${OUTPUT_FILE}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/vnd.android.package-archive" \
  -H "x-upsert: true" \
  --data-binary "@/tmp/$OUTPUT_FILE")

if echo "$UPLOAD_RESPONSE" | grep -q "error"; then
    echo "❌ Upload failed: $UPLOAD_RESPONSE"
    exit 1
fi
echo "✅ Uploaded to: $PUBLIC_URL"
echo ""

# Step 6: Update database with new version
echo "6️⃣  Updating version in database..."

# Create SQL to insert/update version
SQL_QUERY="
INSERT INTO public.app_versions (
  app_name,
  version,
  build_number,
  minimum_version,
  download_url,
  file_size,
  release_notes_ar,
  release_notes_en,
  update_message_ar,
  update_message_en,
  force_update,
  is_active
) VALUES (
  'vendor',
  '${VERSION}',
  EXTRACT(EPOCH FROM NOW())::INTEGER,
  '${VERSION}',
  '${PUBLIC_URL}',
  ${APK_SIZE},
  ARRAY['تحسينات عامة في الأداء', 'إصلاحات للأخطاء'],
  ARRAY['General performance improvements', 'Bug fixes'],
  'يتوفر إصدار جديد! قم بالتحديث الآن.',
  'New version available! Update now.',
  false,
  true
)
ON CONFLICT (app_name, version)
DO UPDATE SET
  download_url = EXCLUDED.download_url,
  file_size = EXCLUDED.file_size,
  is_active = EXCLUDED.is_active,
  released_at = NOW();

-- Optionally deactivate old versions
-- UPDATE public.app_versions
-- SET is_active = false
-- WHERE app_name = 'vendor' AND version != '${VERSION}';
"

# Execute SQL using psql (you'll need to install psql)
echo "$SQL_QUERY" | PGPASSWORD="TahaRou7@2035" psql \
  "postgresql://postgres.rfyqzuuuumgdoomyhqcu:TahaRou7@2035@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -q

echo "✅ Database updated"
echo ""

# Step 7: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Version: $VERSION"
echo "📊 Size: ${APK_SIZE_MB} MB"
echo "🔗 Download URL: $PUBLIC_URL"
echo ""
echo "🎉 Users will now be prompted to update when they open the app!"
echo ""
echo "To customize release notes, edit this script or update directly in Supabase."
echo ""
