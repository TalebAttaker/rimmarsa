#!/bin/bash
set -e

echo "🔨 Simple APK Build (No Prebuild)"
echo "=================================="

# Set environment
export PATH="$HOME/.local/node-v20/bin:$PATH"
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

cd /home/taleb/rimmarsa/mobile-app

# Verify App.js has modern UI
GRADIENT_COUNT=$(grep -c "LinearGradient" App.js || echo "0")
echo "✓ App.js contains $GRADIENT_COUNT LinearGradient instances (modern UI)"

if [ "$GRADIENT_COUNT" -lt "10" ]; then
    echo "❌ App.js doesn't have modern UI!"
    exit 1
fi

echo ""
echo "🔨 Building APK (using existing Android project)..."
cd android
./gradlew clean assembleRelease

# Find and copy APK
APK_PATH="app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    VERSION=$(grep '"version":' ../package.json | cut -d'"' -f4)
    cp "$APK_PATH" "/tmp/vendor-app-$VERSION-MODERN-UI.apk"

    echo ""
    echo "✅ =========================================="
    echo "✅ BUILD SUCCESSFUL!"
    echo "✅ =========================================="
    echo ""
    echo "📱 APK: /tmp/vendor-app-$VERSION-MODERN-UI.apk"
    ls -lh "/tmp/vendor-app-$VERSION-MODERN-UI.apk"
    echo ""
    echo "🔍 To verify modern UI in APK:"
    echo "   unzip -p /tmp/vendor-app-$VERSION-MODERN-UI.apk index.android.bundle 2>/dev/null | grep -o 'LinearGradient' | wc -l"
else
    echo "❌ APK not found at $APK_PATH"
    ls -la app/build/outputs/apk/release/ || echo "Output directory doesn't exist"
    exit 1
fi
