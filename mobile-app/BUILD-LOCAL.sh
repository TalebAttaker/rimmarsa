#!/bin/bash
set -e

echo "🚀 Rimmarsa Local APK Build Script"
echo "===================================="
echo ""

# Use Node 20 for compatibility with Expo SDK 51
export PATH="$HOME/.local/node-v20/bin:$PATH"
echo "✅ Using Node.js $(node --version)"
echo ""

# Check if Android SDK is installed
if [ ! -d "$HOME/Android/Sdk" ]; then
    echo "❌ Android SDK not found!"
    echo "Installing Android SDK..."
    
    # Install dependencies
    sudo apt-get update -qq
    sudo apt-get install -y -qq openjdk-17-jdk wget unzip > /dev/null 2>&1
    
    # Download Android command line tools
    mkdir -p $HOME/Android/Sdk/cmdline-tools
    cd $HOME/Android/Sdk/cmdline-tools
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
    unzip -q commandlinetools-linux-9477386_latest.zip
    mv cmdline-tools latest
    rm commandlinetools-linux-9477386_latest.zip
    
    # Set environment variables
    export ANDROID_HOME=$HOME/Android/Sdk
    export ANDROID_SDK_ROOT=$ANDROID_HOME
    export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
    
    # Accept licenses and install required packages
    yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null 2>&1
    $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" > /dev/null 2>&1
    
    echo "✅ Android SDK installed!"
else
    echo "✅ Android SDK found"
fi

# Set environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

cd /home/taleb/rimmarsa/mobile-app

echo ""
echo "📦 Generating native Android code..."
npx expo prebuild --clean --platform android > /dev/null 2>&1
echo "✅ Android project generated"

echo ""
echo "🔨 Building APK..."
cd android
./gradlew assembleRelease --console=plain | grep -E "BUILD|Task|FAILURE|ERROR|>"
cd ..

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    VERSION=$(grep '"version":' package.json | cut -d'"' -f4)
    OUTPUT_PATH="/tmp/vendor-app-$VERSION.apk"
    cp "$APK_PATH" "$OUTPUT_PATH"
    
    echo ""
    echo "✅ =========================================="
    echo "✅ BUILD SUCCESSFUL!"
    echo "✅ =========================================="
    echo ""
    echo "📱 APK Location: $OUTPUT_PATH"
    echo "📊 APK Size: $(du -h $OUTPUT_PATH | cut -f1)"
    echo ""
    echo "Next steps:"
    echo "1. Copy to website: cp $OUTPUT_PATH /home/taleb/rimmarsa/marketplace/public/apps/"
    echo "2. Update API route: marketplace/src/app/api/download/vendor-app/route.ts"
    echo "3. Commit and push to deploy"
else
    echo ""
    echo "❌ Build failed! APK not found at $APK_PATH"
    exit 1
fi
