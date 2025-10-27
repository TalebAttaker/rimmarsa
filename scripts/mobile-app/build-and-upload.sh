#!/bin/bash

# Rimmarsa Vendor App - Build and Upload Script
# This script guides you through building and uploading the APK

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   🏗️  RIMMARSA VENDOR APP - BUILD & UPLOAD                   ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "app.config.js" ]; then
    echo "❌ Error: Please run this script from the mobile-app directory"
    echo "   cd /home/taleb/rimmarsa/mobile-app"
    exit 1
fi

echo "📋 This script will help you:"
echo "   1. Login to Expo/EAS"
echo "   2. Build the production APK"
echo "   3. Generate the SHA-256 checksum"
echo "   4. Provide instructions for uploading to Supabase"
echo ""
echo "⏱️  Estimated time: 30 minutes (mostly waiting for build)"
echo ""

# Step 1: Check if logged in
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Check EAS Login Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if npx eas-cli whoami 2>&1 | grep -q "Not logged in"; then
    echo "❌ You are not logged in to EAS"
    echo ""
    echo "📝 To login, run:"
    echo "   npx eas-cli login"
    echo ""
    echo "   If you don't have an Expo account:"
    echo "   1. Visit: https://expo.dev/signup"
    echo "   2. Create an account"
    echo "   3. Then run: npx eas-cli login"
    echo ""
    read -p "Press Enter when you've logged in, or Ctrl+C to exit..."

    # Verify login
    if npx eas-cli whoami 2>&1 | grep -q "Not logged in"; then
        echo "❌ Still not logged in. Please run: npx eas-cli login"
        exit 1
    fi
fi

echo "✅ Logged in as: $(npx eas-cli whoami)"
echo ""

# Step 2: Configure EAS (if needed)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Configure EAS Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f "eas.json" ]; then
    echo "⚙️  Configuring EAS project..."
    npx eas-cli build:configure
else
    echo "✅ EAS already configured (eas.json exists)"
fi
echo ""

# Step 3: Build the APK
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Build Production APK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🏗️  Starting build process..."
echo "   This will take approximately 10-15 minutes"
echo "   You can monitor progress on: https://expo.dev"
echo ""

npx eas-cli build --platform android --profile production

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Download the APK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📥 To download your APK:"
echo "   1. Go to: https://expo.dev"
echo "   2. Navigate to your project builds"
echo "   3. Download the latest APK"
echo "   4. Save it as: vendor-app-1.0.0.apk"
echo ""
echo "   OR use the download URL from the build output above"
echo ""
read -p "Press Enter when you've downloaded the APK to this directory..."

# Check if APK exists
if [ ! -f "vendor-app-1.0.0.apk" ]; then
    echo "⚠️  APK file not found: vendor-app-1.0.0.apk"
    echo "   Please ensure the file is in: /home/taleb/rimmarsa/mobile-app/"
    echo ""
    read -p "Press Enter when the APK is ready..."
fi

if [ -f "vendor-app-1.0.0.apk" ]; then
    echo "✅ APK found!"

    # Get file size
    SIZE=$(du -h vendor-app-1.0.0.apk | cut -f1)
    echo "   Size: $SIZE"

    # Step 5: Generate checksum
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "STEP 5: Generate SHA-256 Checksum"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    CHECKSUM=$(sha256sum vendor-app-1.0.0.apk | cut -d' ' -f1)
    echo "✅ SHA-256 Checksum:"
    echo "   $CHECKSUM"
    echo ""
    echo "   This checksum has been saved to: checksum.txt"
    echo "$CHECKSUM" > checksum.txt
fi

# Step 6: Upload instructions
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 6: Upload APK to Supabase Storage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📤 Upload the APK to Supabase:"
echo ""
echo "   Option A: Using Supabase Dashboard (Recommended)"
echo "   ────────────────────────────────────────────────"
echo "   1. Visit: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/public"
echo "   2. Create folder: 'apps' (if it doesn't exist)"
echo "   3. Upload: vendor-app-1.0.0.apk to the apps/ folder"
echo "   4. Verify filename is exactly: vendor-app-1.0.0.apk"
echo ""
echo "   Option B: Using Supabase CLI"
echo "   ────────────────────────────────────────────────"
echo "   npx supabase storage upload public/apps/vendor-app-1.0.0.apk \\"
echo "       vendor-app-1.0.0.apk \\"
echo "       --project-ref rfyqzuuuumgdoomyhqcu"
echo ""

read -p "Press Enter when you've uploaded the APK to Supabase..."

# Step 7: Update download page
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 7: Update Download Page with Checksum"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "checksum.txt" ]; then
    CHECKSUM=$(cat checksum.txt)
    echo "✏️  Updating marketplace/src/app/download/page.tsx..."
    echo ""
    echo "   Replace this line:"
    echo "   const apkChecksum = \"\";"
    echo ""
    echo "   With:"
    echo "   const apkChecksum = \"$CHECKSUM\";"
    echo ""
    echo "📋 Checksum copied to clipboard (if xclip is installed)"
    echo "$CHECKSUM" | xclip -selection clipboard 2>/dev/null || echo "   Install xclip to auto-copy: sudo apt-get install xclip"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ BUILD COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Summary:"
echo "   ✅ APK built successfully"
if [ -f "checksum.txt" ]; then
    echo "   ✅ Checksum generated"
fi
echo "   ⏳ Upload APK to Supabase (if not done)"
echo "   ⏳ Update download page with checksum"
echo "   ⏳ Deploy to Vercel"
echo "   ⏳ Test download on mobile"
echo ""
echo "📱 Next Steps:"
echo "   1. Upload APK to Supabase Storage"
echo "   2. Update marketplace/src/app/download/page.tsx with checksum"
echo "   3. Commit and push changes"
echo "   4. Test download at: https://rimmarsa.com/download"
echo ""
echo "📖 Full instructions: /home/taleb/rimmarsa/BUILD_APK_INSTRUCTIONS.md"
echo ""
