# Quick Build Steps - Run These Commands Now!

## 📍 Open Your Terminal

Open a terminal and navigate to the mobile app directory:

```bash
cd /home/taleb/rimmarsa/mobile-app
```

---

## Step 1: Login to EAS

Run this command and enter your Expo credentials:

```bash
npx eas-cli@latest login
```

**Enter the email and password** you just used to create your Expo account.

---

## Step 2: Initialize the Project

After successful login, run:

```bash
npx eas-cli@latest init --id bf9384bd-86ef-4bbf-982e-e79d6a57e912
```

This will connect your project to Expo.

---

## Step 3: Build the Android APK

Now build the production APK (this will take 10-15 minutes):

```bash
npx eas-cli@latest build --platform android --profile production
```

**Important Notes:**
- The build happens on Expo's cloud servers
- You'll see a URL to track the build progress
- When it asks questions, use the default answers (just press Enter)
- Wait for the build to complete

---

## Step 4: Check Build Status

The CLI will show you:
- Build status
- Build URL (to monitor progress)
- Download URL (when complete)

Example output:
```
✔ Build started
Build details: https://expo.dev/accounts/[your-account]/projects/rimmarsa-mobile/builds/[build-id]

Waiting for build to complete...
✔ Build finished
APK: https://expo.dev/artifacts/eas/[unique-id].apk
```

---

## Step 5: Download the APK

Once the build completes, you'll see a download URL. Download it:

```bash
# Option A: Download with wget (if the URL is in the output)
wget [APK_URL] -O vendor-app-1.0.0.apk

# Option B: Download from the dashboard
# Go to: https://expo.dev
# Navigate to your builds
# Click Download button
```

Save the file as: `vendor-app-1.0.0.apk` in the mobile-app directory.

---

## Step 6: Generate Checksum

Once you have the APK, generate its checksum:

```bash
sha256sum vendor-app-1.0.0.apk
```

Copy the output (the long hex string).

---

## Step 7: Upload to Supabase

Go to Supabase Dashboard:
1. Visit: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets/public
2. Create a folder named `apps` (if it doesn't exist)
3. Upload `vendor-app-1.0.0.apk` to the `apps/` folder
4. **Verify the filename is exactly**: `vendor-app-1.0.0.apk`

---

## Step 8: Update Download Page

Edit the marketplace download page:

```bash
cd /home/taleb/rimmarsa/marketplace
```

Open: `src/app/download/page.tsx`

Find line ~11:
```typescript
const apkChecksum = "";
```

Replace with your checksum:
```typescript
const apkChecksum = "your_sha256_checksum_here";
```

---

## Step 9: Deploy

Commit and push:

```bash
git add src/app/download/page.tsx
git commit -m "Add APK checksum for verification"
git push origin main
```

Wait 2-3 minutes for Vercel to deploy.

---

## Step 10: Test

On your mobile phone:
1. Visit: https://rimmarsa.com/download
2. Click "تحميل التطبيق"
3. The APK should download (40-60 MB)
4. Install and test!

---

## 🎯 Summary of Commands (Copy-Paste Ready)

```bash
# 1. Navigate to mobile app
cd /home/taleb/rimmarsa/mobile-app

# 2. Login to EAS
npx eas-cli@latest login

# 3. Initialize project
npx eas-cli@latest init --id bf9384bd-86ef-4bbf-982e-e79d6a57e912

# 4. Build APK (wait 10-15 min)
npx eas-cli@latest build --platform android --profile production

# 5. Download APK (use URL from build output)
# wget [URL] -O vendor-app-1.0.0.apk

# 6. Generate checksum
sha256sum vendor-app-1.0.0.apk

# 7. Upload to Supabase via dashboard

# 8. Update download page with checksum
cd /home/taleb/rimmarsa/marketplace
# Edit src/app/download/page.tsx

# 9. Deploy
git add src/app/download/page.tsx
git commit -m "Add APK checksum"
git push origin main
```

---

## ⏱️ Time Breakdown

- Login: 1 min
- Initialize: 1 min
- Build: 10-15 min ⏳ (automated)
- Download APK: 2 min
- Upload to Supabase: 2 min
- Update & Deploy: 3 min
- **Total: ~20 minutes**

---

## 🆘 Troubleshooting

**"Not logged in"**
- Run: `npx eas-cli@latest login`

**Build failed**
- Check the build logs on Expo dashboard
- Ensure app.config.js and .env are correct

**Download returns JSON**
- Verify APK is at: `public/apps/vendor-app-1.0.0.apk` in Supabase
- Check filename is exactly correct
- Ensure it's in the `public` bucket

---

## 📞 Need Help?

If you get stuck:
1. Check the build logs on: https://expo.dev
2. Review the full guide: `/home/taleb/rimmarsa/BUILD_APK_INSTRUCTIONS.md`
3. All security docs are in: `/home/taleb/rimmarsa/SECURITY_*.md`

---

**🚀 START NOW! Open your terminal and run the commands above.**
