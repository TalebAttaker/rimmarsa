#!/bin/bash

# Install Android SDK and Build APK
# This script does EVERYTHING needed to build the APK

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   📱 ANDROID SDK INSTALLATION & APK BUILD                    ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

set -e

# Configuration
ANDROID_HOME="$HOME/Android/Sdk"
ANDROID_SDK_ROOT="$ANDROID_HOME"
CMDLINE_TOOLS_VERSION="11076708"  # Latest version
BUILD_TOOLS_VERSION="36.0.0"
PLATFORM_VERSION="android-36"

echo "Step 1: Creating Android SDK directory..."
mkdir -p "$ANDROID_HOME/cmdline-tools"

echo ""
echo "Step 2: Downloading Android Command Line Tools..."
cd /tmp
wget -q --show-progress "https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip" -O cmdline-tools.zip

echo ""
echo "Step 3: Extracting Command Line Tools..."
unzip -q cmdline-tools.zip
mv cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
rm cmdline-tools.zip

echo ""
echo "Step 4: Setting up environment variables..."
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/$BUILD_TOOLS_VERSION"

# Add to bashrc for future use
echo "" >> ~/.bashrc
echo "# Android SDK" >> ~/.bashrc
echo "export ANDROID_HOME=$HOME/Android/Sdk" >> ~/.bashrc
echo "export ANDROID_SDK_ROOT=\$ANDROID_HOME" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/build-tools/$BUILD_TOOLS_VERSION" >> ~/.bashrc

echo "✅ Environment configured"

echo ""
echo "Step 5: Installing Android SDK components..."
echo "This will take a few minutes..."

# Accept licenses
yes | sdkmanager --licenses > /dev/null 2>&1 || true

# Install required SDK components
sdkmanager "platform-tools" "platforms;$PLATFORM_VERSION" "build-tools;$BUILD_TOOLS_VERSION" "ndk;27.1.12297006"

echo "✅ Android SDK installed"

echo ""
echo "Step 6: Creating local.properties..."
cd /home/taleb/rimmarsa/mobile-app/android
echo "sdk.dir=$ANDROID_HOME" > local.properties
echo "✅ local.properties created"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Building APK..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Clean and build
./gradlew clean
./gradlew assembleRelease

if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo ""
    echo "✅ APK built successfully!"

    cd ..
    cp android/app/build/outputs/apk/release/app-release.apk vendor-app-1.0.0.apk

    SIZE=$(du -h vendor-app-1.0.0.apk | cut -f1)
    echo "   Size: $SIZE"

    # Generate checksum
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Generating SHA-256 checksum..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    CHECKSUM=$(sha256sum vendor-app-1.0.0.apk | cut -d' ' -f1)
    echo ""
    echo "✅ Checksum: $CHECKSUM"
    echo "$CHECKSUM" > checksum.txt

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║   ✅ APK READY!                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "APK: $(pwd)/vendor-app-1.0.0.apk"
    echo "Size: $SIZE"
    echo "Checksum: $CHECKSUM"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Next: Upload to Supabase"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/public"
    echo "Upload: vendor-app-1.0.0.apk to apps/ folder"
    echo ""
else
    echo "❌ Build failed"
    exit 1
fi
