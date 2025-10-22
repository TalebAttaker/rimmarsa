# Build Rimmarsa Vendor APK - Step by Step

## Problem
When users try to download the app from rimmarsa.com, they get a JSON error because the APK file doesn't exist in Supabase Storage yet.

## Solution
Build the production APK using EAS Build and upload it to Supabase Storage.

---

## Step 1: Create an Expo Account (if you don't have one)

1. Go to: https://expo.dev/signup
2. Sign up with your email
3. Verify your email address

---

## Step 2: Login to EAS CLI

Open a terminal in the mobile-app directory and run:

```bash
cd /home/taleb/rimmarsa/mobile-app
npx eas-cli login
```

Enter your Expo credentials when prompted.

---

## Step 3: Configure EAS Project (First Time Only)

```bash
npx eas-cli build:configure
```

This will:
- Create/update your `eas.json` configuration
- Set up your project on Expo servers
- Link your local project to Expo

---

## Step 4: Build the Production APK

```bash
npx eas-cli build --platform android --profile production
```

**This will:**
- Upload your code to Expo's build servers
- Build a production-ready, signed APK
- Take approximately **10-15 minutes**
- Provide a download link when complete

**You will see output like:**
```
✔ Build started, it may take a few minutes to complete.
Build details: https://expo.dev/accounts/[your-account]/projects/rimmarsa-mobile/builds/[build-id]

Wait for build to complete...
```

---

## Step 5: Download the Built APK

Once the build completes, you'll see:
```
✔ Build finished
APK: https://expo.dev/artifacts/eas/[unique-id].apk
```

**Download the APK:**
```bash
# The CLI will show a download link, or use:
npx eas-cli build:list

# Download the APK
wget [APK_URL] -O vendor-app-1.0.0.apk
```

Or download it from the Expo dashboard:
- Go to: https://expo.dev/accounts/[your-account]/projects/rimmarsa-mobile/builds
- Find the latest build
- Click "Download" button

---

## Step 6: Upload APK to Supabase Storage

### Option A: Using Supabase Dashboard (Easier)

1. Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/public

2. Navigate to the `public` bucket

3. Create the `apps/` folder if it doesn't exist:
   - Click "New folder"
   - Name: `apps`

4. Upload the APK:
   - Open the `apps/` folder
   - Click "Upload file"
   - Select your `vendor-app-1.0.0.apk` file
   - **IMPORTANT**: Make sure the filename is exactly `vendor-app-1.0.0.apk`

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Upload the APK
npx supabase storage upload public/apps/vendor-app-1.0.0.apk vendor-app-1.0.0.apk --project-ref rfyqzuuuumgdoomyhqcu
```

---

## Step 7: Generate SHA-256 Checksum

This checksum allows users to verify the APK hasn't been tampered with:

```bash
sha256sum vendor-app-1.0.0.apk
```

**Copy the output** (it will look like):
```
a3f5b8c9d2e1f4... vendor-app-1.0.0.apk
```

---

## Step 8: Update Download Page with Checksum

Edit the download page and add the checksum:

```bash
cd /home/taleb/rimmarsa/marketplace
```

Open `src/app/download/page.tsx` and find this line (around line 11):
```typescript
const apkChecksum = "";
```

Replace with your actual checksum:
```typescript
const apkChecksum = "a3f5b8c9d2e1f4a7b6c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0";
```

Save the file.

---

## Step 9: Deploy the Update

```bash
git add src/app/download/page.tsx
git commit -m "Add APK checksum for verification"
git push origin main
```

Vercel will auto-deploy (takes 2-3 minutes).

---

## Step 10: Test the Download

1. **On Desktop**: Visit https://rimmarsa.com/download
2. **On Mobile**: Visit https://rimmarsa.com (scroll down to blue download button)
3. Click "تحميل التطبيق"
4. **You should now download a real APK file** (40-60 MB)

---

## Verify the APK Works

1. Transfer the APK to an Android device
2. Enable "Install from Unknown Sources" in Settings
3. Install the APK
4. Open the app
5. Test vendor login with your vendor credentials

---

## Current Status

✅ Download page created
✅ API endpoint ready
✅ Download buttons on homepage (desktop + mobile)
✅ Database analytics tracking
✅ Security documentation
⏳ **APK build needed** ← YOU ARE HERE
⏳ APK upload to Supabase
⏳ Checksum generation
⏳ Final testing

---

## Quick Command Summary

```bash
# 1. Login to EAS
cd /home/taleb/rimmarsa/mobile-app
npx eas-cli login

# 2. Configure EAS (first time only)
npx eas-cli build:configure

# 3. Build APK (wait 10-15 min)
npx eas-cli build --platform android --profile production

# 4. Download APK when build completes
# (Copy URL from build output)

# 5. Generate checksum
sha256sum vendor-app-1.0.0.apk

# 6. Upload to Supabase via dashboard or CLI

# 7. Update marketplace with checksum
cd /home/taleb/rimmarsa/marketplace
# Edit src/app/download/page.tsx
git add src/app/download/page.tsx
git commit -m "Add APK checksum"
git push origin main
```

---

## Troubleshooting

### "Error: Not logged in"
Run: `npx eas-cli login`

### "Error: Project not configured"
Run: `npx eas-cli build:configure`

### "Build failed"
- Check the build logs on Expo dashboard
- Ensure .env file has correct Supabase credentials
- Verify app.config.js is properly configured

### "Download still returns JSON"
- Verify APK was uploaded to: `public/apps/vendor-app-1.0.0.apk`
- Check filename is exactly: `vendor-app-1.0.0.apk`
- Check file is in `public` bucket, not `private`

---

## Alternative: Local Build (Advanced)

If you prefer to build locally without EAS:

1. Install Java JDK 17:
   ```bash
   sudo apt-get install openjdk-17-jdk
   ```

2. Set JAVA_HOME:
   ```bash
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
   ```

3. Build with Gradle:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. APK will be at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

**Note**: Local builds are unsigned and should only be used for testing.

---

## Support

If you encounter any issues:
1. Check the build logs on Expo dashboard
2. Review the security documentation in `/home/taleb/rimmarsa/SECURITY_*.md`
3. Ensure all environment variables are set correctly in `.env`

---

**Time Estimate**: 30 minutes total (mostly waiting for build)
- EAS Login: 2 min
- Build: 10-15 min
- Upload: 2 min
- Update & Deploy: 5 min
- Testing: 5 min
