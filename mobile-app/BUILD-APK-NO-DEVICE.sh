#!/bin/bash

# Build APK WITHOUT Device or Emulator
# Creates APK file directly using Gradle

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   📱 BUILD APK (NO DEVICE NEEDED!)                          ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

set -e

# Set Android environment
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/36.0.0"
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

echo "✅ Environment configured"
echo "   ANDROID_HOME: $ANDROID_HOME"
echo "   JAVA_HOME: $JAVA_HOME"
echo ""

# Make sure local.properties exists
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
echo "✅ local.properties created"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Export JavaScript Bundle"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Export the bundle
npx expo export:embed --entry-file index.js --platform android --dev false --reset-cache --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

echo ""
echo "✅ Bundle exported"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Build APK with Gradle (No Device Required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will take 5-10 minutes..."
echo ""

cd android

# Clean previous builds
./gradlew clean

# Build release APK
./gradlew assembleRelease

cd ..

# Find the APK
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    echo ""
    echo "✅ APK built successfully!"
    echo ""

    # Copy to root directory
    cp "$APK_PATH" vendor-app-1.0.0.apk

    SIZE=$(du -h vendor-app-1.0.0.apk | cut -f1)
    echo "📦 APK Size: $SIZE"

    # Generate checksum
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Generating SHA-256 Checksum..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    CHECKSUM=$(sha256sum vendor-app-1.0.0.apk | cut -d' ' -f1)
    echo ""
    echo "🔐 Checksum: $CHECKSUM"
    echo "$CHECKSUM" > checksum.txt

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║   ✅ APK READY!                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📍 Location: $(pwd)/vendor-app-1.0.0.apk"
    echo "📏 Size: $SIZE"
    echo "🔐 SHA-256: $CHECKSUM"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📤 Ready to Upload to Supabase!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Upload here:"
    echo "https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/public"
    echo ""
    echo "Upload path: apps/vendor-app-1.0.0.apk"
    echo ""

else
    echo "❌ APK not found at: $APK_PATH"
    echo ""
    echo "Searching for APK files..."
    find android/app/build/outputs -name "*.apk" -type f 2>/dev/null || echo "No APK files found"
    exit 1
fi
