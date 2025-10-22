#!/bin/bash

# Rimmarsa Vendor App - Quick Build Script
# This script builds an APK for immediate distribution

set -e

echo "🚀 Rimmarsa Vendor App - Quick Build Script"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "❌ Error: .env file not found"
  echo "Please create .env file with:"
  echo "  SUPABASE_URL=your_url"
  echo "  SUPABASE_ANON_KEY=your_key"
  exit 1
fi

echo "✓ Environment file found"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js not found"
  echo "Please install Node.js 18 or higher"
  exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Ask user which build type
echo ""
echo "Select build type:"
echo "1) EAS Build (Cloud - Recommended for production)"
echo "2) Local Debug Build (Fast - For testing)"
echo "3) Local Release Build (Requires Android SDK)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo ""
    echo "🌩️  Starting EAS Cloud Build..."
    echo ""
    echo "Note: You'll need to login to Expo"
    npx eas-cli build --platform android --profile production
    echo ""
    echo "✅ Build complete! Download link provided above."
    ;;
  2)
    echo ""
    echo "🔨 Building local debug APK..."

    # Generate Android project if it doesn't exist
    if [ ! -d "android" ]; then
      echo "Generating Android project..."
      npx expo prebuild --platform android
    fi

    echo "Building APK..."
    cd android
    ./gradlew assembleDebug
    cd ..

    APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$APK_PATH" ]; then
      echo ""
      echo "✅ Build successful!"
      echo "APK Location: $APK_PATH"
      echo ""
      echo "To rename and prepare for distribution:"
      echo "  mv $APK_PATH rimmarsa-vendor-debug-$(date +%Y%m%d).apk"
    else
      echo "❌ Build failed - APK not found"
      exit 1
    fi
    ;;
  3)
    echo ""
    echo "🔨 Building local release APK..."

    # Generate Android project if it doesn't exist
    if [ ! -d "android" ]; then
      echo "Generating Android project..."
      npx expo prebuild --platform android
    fi

    echo "Building release APK..."
    cd android
    ./gradlew assembleRelease
    cd ..

    APK_PATH="android/app/build/outputs/apk/release/app-release-unsigned.apk"
    if [ -f "$APK_PATH" ]; then
      echo ""
      echo "✅ Build successful!"
      echo "APK Location: $APK_PATH"
      echo ""
      echo "⚠️  Warning: This APK is UNSIGNED"
      echo "For production, use EAS Build or sign manually"
    else
      echo "❌ Build failed - APK not found"
      exit 1
    fi
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "🎉 Done!"
