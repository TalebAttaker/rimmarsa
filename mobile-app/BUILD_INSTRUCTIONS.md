# Rimmarsa Vendor App - Build Instructions

## 🚀 Quick Build for Distribution

### Prerequisites
- Node.js 18+ installed
- Android Studio or Android SDK installed
- Java JDK 17+ installed

### Option 1: Build with EAS (Recommended for Production)

1. **Login to Expo**:
   ```bash
   npx eas-cli login
   ```

2. **Configure the Build**:
   ```bash
   npx eas-cli build:configure
   ```

3. **Build APK for Production**:
   ```bash
   npx eas-cli build --platform android --profile production
   ```

   This will:
   - Build on Expo's cloud servers
   - Sign the APK automatically
   - Provide a download link when complete
   - Usually takes 10-20 minutes

4. **Download the APK**:
   - Download from the link provided in terminal
   - Or visit: https://expo.dev/accounts/[your-account]/projects/rimmarsa-mobile/builds

### Option 2: Local Build (Faster, but less secure)

1. **Generate Android Project**:
   ```bash
   npx expo prebuild --platform android
   ```

2. **Build APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **Find APK**:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

### Option 3: Development Build (Quickest for Testing)

1. **Generate Android Project**:
   ```bash
   npx expo prebuild --platform android
   ```

2. **Build Debug APK**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

3. **Find APK**:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

## 📦 After Building

1. **Rename the APK**:
   ```bash
   mv app-release.apk rimmarsa-vendor-v1.0.0.apk
   ```

2. **Generate Checksum** (for security):
   ```bash
   sha256sum rimmarsa-vendor-v1.0.0.apk > rimmarsa-vendor-v1.0.0.apk.sha256
   ```

3. **Upload to Storage**:
   - Upload to Supabase Storage (public bucket)
   - Or upload to your web server
   - Make sure HTTPS is enabled

## 🔒 Security Checklist Before Distribution

- [ ] Remove all hardcoded credentials from code
- [ ] Environment variables are properly configured
- [ ] APK is signed with a production keystore
- [ ] HTTPS is enabled for download
- [ ] SHA256 checksum is generated
- [ ] RLS policies are enabled on database
- [ ] Test on a real device before public release

## 📱 Installation Instructions for Vendors

1. Enable "Install from Unknown Sources" on Android device
2. Download APK from rimmarsa.com/download
3. Open the downloaded file
4. Click "Install"
5. Open Rimmarsa Vendor App
6. Login with your vendor credentials

## 🐛 Troubleshooting

**Error: "App not installed"**
- Enable "Install from Unknown Sources"
- Clear previous app data if updating

**Error: "SDK location not found"**
- Set ANDROID_HOME environment variable
- Or create android/local.properties with sdk.dir

**Build takes too long**
- Use EAS Build (cloud-based)
- Or enable Gradle daemon: `touch ~/.gradle/gradle.properties && echo "org.gradle.daemon=true" >> ~/.gradle/gradle.properties`

## 📝 Notes

- Development builds include Expo Dev Client
- Production builds are smaller and faster
- Always use EAS Build for Play Store distribution
- Local builds are great for quick testing
