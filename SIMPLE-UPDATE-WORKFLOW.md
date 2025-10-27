# 🚀 Simple App Update Workflow

## The Problem with EAS Builds
- ❌ Slow (10-20 minutes per build)
- ❌ Often fails/timeouts
- ❌ Requires internet and cloud services
- ❌ Hard to debug errors

## ✅ THE BEST SOLUTION: Local Builds with Expo

### One-Time Setup (5 minutes)

```bash
cd /home/taleb/rimmarsa/mobile-app

# 1. Install Android SDK (one-time)
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk wget unzip

# Download Android command line tools
mkdir -p $HOME/Android/Sdk/cmdline-tools
cd $HOME/Android/Sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
mv cmdline-tools latest
rm *.zip

# Set environment variables (add to ~/.bashrc for permanent)
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Accept licenses and install build tools
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# 2. Generate native Android project (one-time)
cd /home/taleb/rimmarsa/mobile-app
npx expo prebuild --platform android
```

---

## 📱 EVERY TIME YOU UPDATE THE APP (2 minutes!)

### Step 1: Make Your Changes
```bash
cd /home/taleb/rimmarsa/mobile-app

# Edit App.js or any files
nano App.js
```

### Step 2: Update Version Numbers
```bash
# Edit these 3 files - increment version (e.g., 1.1.0 → 1.2.0)

# 1. package.json
{
  "version": "1.2.0"  # <-- Change this
}

# 2. app.config.js
export default {
  expo: {
    version: "1.2.0"  # <-- Change this
  }
}

# 3. App.js (line ~429)
<Text style={styles.version}>الإصدار 1.2.0</Text>  {/* Change this */}
```

### Step 3: Build APK Locally (FAST!)
```bash
cd /home/taleb/rimmarsa/mobile-app

# Set Android environment
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Build APK (takes ~2 minutes)
cd android
./gradlew assembleRelease

# APK is created at:
# android/app/build/outputs/apk/release/app-release.apk
```

### Step 4: Deploy to Website
```bash
# Copy APK to marketplace
VERSION="1.2.0"  # Your new version
cp android/app/build/outputs/apk/release/app-release.apk \
   /home/taleb/rimmarsa/marketplace/public/apps/vendor-app-$VERSION.apk

# Update the API route
# Edit: /home/taleb/rimmarsa/marketplace/src/app/api/download/vendor-app/route.ts
# Change line 37:
const apkUrl = '/apps/vendor-app-1.2.0.apk';  # <-- Update version

# Update version API
# Edit: /home/taleb/rimmarsa/marketplace/src/app/api/app-version/route.ts
# Change line 11:
version: '1.2.0',  # <-- Update version

# Commit and deploy
cd /home/taleb/rimmarsa/marketplace
git add public/apps/vendor-app-$VERSION.apk src/app/api/
git commit -m "Update vendor app to v$VERSION"
git push origin main

# Vercel auto-deploys in ~30 seconds!
```

---

## 🎯 SUPER SIMPLE ONE-COMMAND BUILD (After setup)

Create this script: `/home/taleb/rimmarsa/mobile-app/quick-build.sh`

```bash
#!/bin/bash
set -e

# Get version from package.json
VERSION=$(grep '"version":' package.json | cut -d'"' -f4)

echo "🚀 Building Rimmarsa v$VERSION..."

# Set Android environment
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Build APK
cd android
./gradlew assembleRelease --console=plain | grep "BUILD"
cd ..

# Copy to /tmp
cp android/app/build/outputs/apk/release/app-release.apk /tmp/vendor-app-$VERSION.apk

echo "✅ APK built: /tmp/vendor-app-$VERSION.apk"
echo "📊 Size: $(du -h /tmp/vendor-app-$VERSION.apk | cut -f1)"
echo ""
echo "Next: Copy to marketplace and push to GitHub"
```

Then just run:
```bash
cd /home/taleb/rimmarsa/mobile-app
chmod +x quick-build.sh
./quick-build.sh
```

---

## 🔄 Auto-Update Flow (Already Working!)

### How It Works:

1. **User opens app** → Checks `/api/app-version`
2. **If new version available** → Shows update modal
3. **User taps "Update Now"** → Downloads from `/api/download/vendor-app`
4. **User installs APK** → Gets new version

### To Push an Update:

1. Build new APK locally (2 min)
2. Copy to `marketplace/public/apps/`
3. Update `/api/app-version/route.ts` with new version number
4. Git push → Vercel deploys → Users see update modal!

---

## 📝 Quick Reference

### Build APK:
```bash
cd /home/taleb/rimmarsa/mobile-app/android
./gradlew assembleRelease
```

### Test APK:
```bash
# Check APK info
aapt dump badging android/app/build/outputs/apk/release/app-release.apk | grep version
```

### Common Issues:

**"Android SDK not found"**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

**"Gradle build failed"**
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

**"Out of memory"**
```bash
# Add to android/gradle.properties:
org.gradle.jvmargs=-Xmx4096m
```

---

## 🎉 Benefits of Local Builds

- ⚡ **Fast**: 2-3 minutes vs 10-20 minutes
- 💪 **Reliable**: No cloud dependencies
- 🐛 **Easy to debug**: See errors immediately
- 💰 **Free**: No EAS build credits needed
- 🔧 **Full control**: Change anything anytime

---

## 🚨 If You Need APK Right Now

We have a successful build (ID: 38710022) from earlier. Get it with:

```bash
# Download from Expo dashboard
# Visit: https://expo.dev/accounts/taleb1914/projects/rimmarsa/builds/38710022-ab91-4656-a6c5-02136ca35aa5
# Click "Download"
# Save to /tmp/vendor-app.apk

# Or use the build we created earlier if still available
```

---

**Author:** Claude Code 🤖
**Last Updated:** October 23, 2025
**Works with:** Expo SDK 51, React Native 0.74
