#!/bin/bash

# Build APK Locally - No Expo/EAS Needed!

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   📱 RIMMARSA - LOCAL APK BUILD (No Expo Required!)         ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

set -e

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Installing OpenJDK 17..."
    echo ""
    echo "This will ask for your sudo password..."
    sudo apt-get update
    sudo apt-get install -y openjdk-17-jdk

    # Set JAVA_HOME
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
    export PATH=$PATH:$JAVA_HOME/bin

    # Add to bashrc for future use
    echo "export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >> ~/.bashrc
    echo "export PATH=\$PATH:\$JAVA_HOME/bin" >> ~/.bashrc

    echo "✅ Java installed!"
else
    echo "✅ Java is already installed:"
    java -version
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Building APK..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Navigate to android directory
cd android

# Clean previous builds
echo "Cleaning previous builds..."
./gradlew clean

# Build release APK
echo ""
echo "Building release APK (this takes 5-10 minutes)..."
./gradlew assembleRelease

# Check if build succeeded
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo ""
    echo "✅ APK built successfully!"

    # Copy to parent directory
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
    echo "APK Location: $(pwd)/vendor-app-1.0.0.apk"
    echo "Size: $SIZE"
    echo "Checksum: $CHECKSUM"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Next Steps:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Upload APK to Supabase:"
    echo "   https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/public"
    echo "   - Create 'apps' folder"
    echo "   - Upload: vendor-app-1.0.0.apk"
    echo ""
    echo "2. I'll update the download page and deploy automatically!"
    echo ""

else
    echo "❌ Build failed. Check the output above for errors."
    exit 1
fi
