#!/bin/bash

# Build APK Locally - NO EAS REQUIRED!
# Uses Expo local build command

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   📱 BUILD APK LOCALLY (NO EAS!)                            ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

set -e

# Set Android environment
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/36.0.0"

echo "✅ Android SDK configured at: $ANDROID_HOME"
echo ""

# Make sure local.properties exists
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
echo "✅ local.properties created"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Building APK with Expo (Local Build - No EAS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will take 5-10 minutes..."
echo ""

# Build release APK locally
npx expo run:android --variant release --no-bundler

# Find the APK
APK_PATH=$(find android/app/build/outputs/apk/release -name "*.apk" -type f | grep -v "unsigned" | head -1)

if [ -f "$APK_PATH" ]; then
    echo ""
    echo "✅ APK built successfully!"
    echo ""

    # Copy to root directory
    cp "$APK_PATH" vendor-app-1.0.0.apk

    SIZE=$(du -h vendor-app-1.0.0.apk | cut -f1)
    echo "APK Size: $SIZE"

    # Generate checksum
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Generating SHA-256 Checksum..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    CHECKSUM=$(sha256sum vendor-app-1.0.0.apk | cut -d' ' -f1)
    echo ""
    echo "✅ Checksum: $CHECKSUM"
    echo "$CHECKSUM" > checksum.txt

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║   ✅ APK READY FOR UPLOAD!                                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📦 APK Location: $(pwd)/vendor-app-1.0.0.apk"
    echo "📏 Size: $SIZE"
    echo "🔐 Checksum: $CHECKSUM"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Next: Upload to Supabase"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/public"
    echo "2. Create folder: apps"
    echo "3. Upload file: vendor-app-1.0.0.apk"
    echo ""
    echo "Then tell me and I'll update the download page automatically!"
    echo ""

else
    echo "❌ APK not found after build"
    echo "Searching for APK files..."
    find android/app/build/outputs/apk -name "*.apk" -type f
    exit 1
fi
