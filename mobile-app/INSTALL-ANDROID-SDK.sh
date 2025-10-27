#!/bin/bash
set -e

################################################################################
# Android SDK Installation Script for Rimmarsa Vendor App
#
# This script installs everything needed to build Android APKs locally
# Run this ONCE before your first build
#
# Usage: ./INSTALL-ANDROID-SDK.sh
################################################################################

echo "📱 Android SDK Installation for Rimmarsa"
echo "========================================"
echo ""

# Check if already installed
if [ -d "$HOME/Android/Sdk" ]; then
    echo "✅ Android SDK already installed at: $HOME/Android/Sdk"
    echo ""
    echo "If you want to reinstall, run:"
    echo "  rm -rf $HOME/Android/Sdk"
    echo "  ./INSTALL-ANDROID-SDK.sh"
    exit 0
fi

echo "Installing Android SDK..."
echo ""

# 1. Install Java
echo "1️⃣  Installing Java 17..."
sudo apt-get update -qq
sudo apt-get install -y -qq openjdk-17-jdk wget unzip
echo "✅ Java installed"
echo ""

# 2. Download Android Command Line Tools
echo "2️⃣  Downloading Android Command Line Tools..."
mkdir -p $HOME/Android/Sdk/cmdline-tools
cd $HOME/Android/Sdk/cmdline-tools

wget -q --show-progress https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip -q commandlinetools-linux-9477386_latest.zip
mv cmdline-tools latest
rm commandlinetools-linux-9477386_latest.zip
echo "✅ Command line tools downloaded"
echo ""

# 3. Set Environment Variables
echo "3️⃣  Setting up environment variables..."
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Add to .bashrc for persistence
if ! grep -q "ANDROID_HOME" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# Android SDK" >> ~/.bashrc
    echo "export ANDROID_HOME=\$HOME/Android/Sdk" >> ~/.bashrc
    echo "export ANDROID_SDK_ROOT=\$ANDROID_HOME" >> ~/.bashrc
    echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools" >> ~/.bashrc
fi
echo "✅ Environment variables set"
echo ""

# 4. Accept Licenses
echo "4️⃣  Accepting Android SDK licenses..."
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null 2>&1
echo "✅ Licenses accepted"
echo ""

# 5. Install Required Packages
echo "5️⃣  Installing Android SDK packages (this may take a few minutes)..."
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "ndk;25.1.8937393" \
    > /dev/null 2>&1
echo "✅ SDK packages installed"
echo ""

# 6. Verify Installation
echo "6️⃣  Verifying installation..."
echo ""
echo "Java version:"
java -version
echo ""
echo "Android SDK location: $ANDROID_HOME"
echo "SDK packages installed:"
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --list | grep "installed" | head -5
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ INSTALLATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 You can now build Android APKs!"
echo ""
echo "Next steps:"
echo "1. Restart your terminal (or run: source ~/.bashrc)"
echo "2. Navigate to mobile-app directory"
echo "3. Run: ./DEPLOY.sh"
echo ""
echo "Environment variables added to ~/.bashrc"
echo "They will be available in new terminal sessions."
echo ""
