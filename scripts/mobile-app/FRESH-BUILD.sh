#!/bin/bash
set -e

echo "🔥 FRESH BUILD - Clearing ALL Caches"
echo "======================================"

# Use Node 20
export PATH="$HOME/.local/node-v20/bin:$PATH"
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

cd /home/taleb/rimmarsa/mobile-app

echo "1️⃣  Clearing Metro bundler cache..."
npx expo start --clear > /dev/null 2>&1 &
METRO_PID=$!
sleep 5
kill $METRO_PID 2>/dev/null || true

echo "2️⃣  Clearing Gradle caches..."
cd android && ./gradlew clean > /dev/null 2>&1 && cd ..

echo "3️⃣  Rebuilding Android project..."
npx expo prebuild --clean --platform android > /dev/null 2>&1

echo "4️⃣  Building APK..."
cd android
./gradlew assembleRelease --rerun-tasks 2>&1 | grep -E "BUILD|Task|SUCCESS|FAIL"
cd ..

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
    cp "$APK_PATH" "/tmp/vendor-app-$VERSION.apk"
    echo ""
    echo "✅ BUILD SUCCESSFUL!"
    echo "📱 APK: /tmp/vendor-app-$VERSION.apk"
    echo "📊 Size: $(du -h /tmp/vendor-app-$VERSION.apk | cut -f1)"
else
    echo "❌ Build failed!"
    exit 1
fi
