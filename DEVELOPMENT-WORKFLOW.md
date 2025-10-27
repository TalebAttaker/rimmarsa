# Rimmarsa Development Workflow

## 📱 Vendor Mobile App Development & Deployment

### Quick Start

The vendor mobile app is built with **Expo SDK 51** and includes:
- ✅ Vendor Login
- ✅ Vendor Dashboard
- ✅ Complete Vendor Registration (4 steps)
- ✅ Image uploads to Supabase Storage
- ✅ Integration with `vendor_requests` table

### Project Structure

```
rimmarsa/
├── mobile-app/          # Vendor mobile app (Expo)
│   ├── App.js          # Main application file
│   ├── app.config.js   # Expo configuration
│   ├── package.json    # Dependencies
│   └── eas.json        # EAS Build configuration
├── marketplace/         # Website (Next.js 15)
│   ├── src/
│   │   ├── app/
│   │   │   ├── vendor-registration/  # Web registration page
│   │   │   └── api/download/vendor-app/  # APK download endpoint
│   │   └── public/apps/  # APK files stored here
└── DEVELOPMENT-WORKFLOW.md  # This file
```

---

## 🔄 Workflow for Updating the Mobile App

### 1. Make Your Changes

Edit the mobile app code in `/home/taleb/rimmarsa/mobile-app/`:

```bash
cd /home/taleb/rimmarsa/mobile-app
# Edit App.js, add new features, fix bugs, etc.
```

### 2. Update Version Number

**IMPORTANT:** Always increment the version when making updates!

```bash
# Edit these 3 files:

# 1. package.json
{
  "version": "1.2.0"  # <-- Increment this
}

# 2. app.config.js
export default {
  expo: {
    version: "1.2.0"  # <-- Increment this
  }
}

# 3. App.js (line 374)
<Text style={styles.version}>الإصدار 1.2.0</Text>  {/* <-- Update this */}
```

### 3. Build the APK with EAS

```bash
cd /home/taleb/rimmarsa/mobile-app

# Start the build (takes ~10-15 minutes)
npx eas-cli build --platform android --profile production --non-interactive
```

**What happens:**
- EAS uploads your code to Expo's servers
- Build runs in the cloud (no local setup needed!)
- You get a build URL to monitor progress

**Monitor the build:**
```bash
# Check build status
npx eas-cli build:list --platform android --limit 1

# Build status will be:
# - "in queue"    → Waiting to start
# - "in progress" → Currently building
# - "finished"    → Build complete! ✅
# - "errored"     → Build failed ❌
```

### 4. Download the APK

Once the build finishes:

```bash
# Get the latest build info
npx eas-cli build:list --platform android --limit 1

# Look for "Build Artifacts URL" in the output
# Copy that URL and download the APK:

curl -L -o /tmp/vendor-app-1.2.0.apk "BUILD_ARTIFACTS_URL_HERE"

# Example:
# curl -L -o /tmp/vendor-app-1.2.0.apk "https://expo.dev/artifacts/eas/abc123def456.apk"
```

### 5. Deploy to Website

```bash
# Copy APK to marketplace public folder
cp /tmp/vendor-app-1.2.0.apk /home/taleb/rimmarsa/marketplace/public/apps/

# Update the API route to serve the new version
# Edit: /home/taleb/rimmarsa/marketplace/src/app/api/download/vendor-app/route.ts
# Change line 37:
const apkUrl = '/apps/vendor-app-1.2.0.apk';  # <-- Update filename

# Commit and push
cd /home/taleb/rimmarsa/marketplace
git add public/apps/vendor-app-1.2.0.apk src/app/api/download/vendor-app/route.ts
git commit -m "Update vendor app to v1.2.0"
git push origin main

# Vercel automatically deploys! 🎉
```

### 6. Test the Download

```bash
# Wait ~30 seconds for Vercel deployment
sleep 30

# Test the download
curl -I https://www.rimmarsa.com/api/download/vendor-app

# Should return HTTP 200 with APK headers
```

---

## 🌐 Updating the Website Vendor Registration

The website registration is at:
- **File:** `/home/taleb/rimmarsa/marketplace/src/app/vendor-registration/page.tsx`
- **URL:** `https://rimmarsa.com/vendor-registration`

### To Update the Registration Form:

1. **Edit the form** in `vendor-registration/page.tsx`
2. **Commit and push:**
```bash
cd /home/taleb/rimmarsa/marketplace
git add src/app/vendor-registration/page.tsx
git commit -m "Update vendor registration form"
git push origin main
```
3. **Vercel auto-deploys** (usually takes 1-2 minutes)

### Keeping Mobile and Web in Sync

**IMPORTANT:** The mobile app and website both submit to the same `vendor_requests` table in Supabase.

If you change the form fields:
1. ✅ Update website (`vendor-registration/page.tsx`)
2. ✅ Update mobile app (`mobile-app/App.js`)
3. ✅ Update database if adding/removing columns
4. ✅ Deploy both changes

---

## 📊 Database Schema for Vendor Requests

The `vendor_requests` table structure:

```sql
CREATE TABLE vendor_requests (
  id UUID PRIMARY KEY,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  whatsapp_number TEXT,
  region_id UUID REFERENCES regions(id),
  city_id UUID REFERENCES cities(id),
  address TEXT,
  package_plan TEXT NOT NULL,  -- '1_month' or '2_months'
  package_price INTEGER NOT NULL,
  referred_by_code TEXT,
  nni_image_url TEXT NOT NULL,
  personal_image_url TEXT NOT NULL,
  store_image_url TEXT NOT NULL,
  payment_screenshot_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🚀 Quick Reference Commands

### Build New APK
```bash
cd /home/taleb/rimmarsa/mobile-app
npx eas-cli build --platform android --profile production --non-interactive
```

### Check Build Status
```bash
npx eas-cli build:list --platform android --limit 1
```

### Deploy to Website
```bash
# 1. Copy APK
cp /tmp/vendor-app-X.X.X.apk /home/taleb/rimmarsa/marketplace/public/apps/

# 2. Update API route (if filename changed)
# Edit: marketplace/src/app/api/download/vendor-app/route.ts

# 3. Commit and push
cd /home/taleb/rimmarsa/marketplace
git add public/apps/ src/app/api/download/vendor-app/route.ts
git commit -m "Update vendor app to vX.X.X"
git push origin main
```

### Test Download
```bash
curl -I https://www.rimmarsa.com/api/download/vendor-app
```

---

## 🔐 Important Files & Credentials

### Supabase Configuration
- **URL:** `https://rfyqzuuuumgdoomyhqcu.supabase.co`
- **Anon Key:** In `mobile-app/App.js` and `marketplace/src/lib/supabase/client.ts`

### EAS Project
- **Project ID:** `bf9384bd-86ef-4bbf-982e-e79d6a57e912`
- **Account:** `taleb1914`
- **Project:** `rimmarsa`

### Vercel Deployment
- **Git:** `https://github.com/TalebAttaker/rimmarsa`
- **Branch:** `main` (auto-deploys to production)

---

## 🐛 Troubleshooting

### Build Fails with Dependency Errors
```bash
# Clear cache and rebuild
cd /home/taleb/rimmarsa/mobile-app
rm -rf node_modules
npx eas-cli build --platform android --profile production --clear-cache
```

### APK Download Returns 404
1. Check file exists: `ls /home/taleb/rimmarsa/marketplace/public/apps/`
2. Check API route points to correct filename
3. Verify Vercel deployment succeeded: Check GitHub Actions

### Image Upload Fails in App
1. Check Supabase Storage `images` bucket exists
2. Verify bucket is public
3. Check RLS policies allow anonymous uploads to `vendor-requests/` folder

---

## 📱 Mobile App Features

### Current Features (v1.1.0)
- ✅ Login with phone number and password
- ✅ Vendor dashboard showing business info
- ✅ 4-step registration process:
  1. Business Information (name, phone, password, WhatsApp, referral code)
  2. Location (region, city, address)
  3. Document Uploads (NNI, personal photo, store photo)
  4. Package Selection & Payment Screenshot
- ✅ Duplicate request detection
- ✅ Pending request status screen
- ✅ Success confirmation screen
- ✅ Image upload to Supabase Storage with progress
- ✅ Form validation (phone numbers, password strength)
- ✅ Arabic RTL interface

### Adding New Features

**Example: Add "Products" screen**

1. Edit `mobile-app/App.js`:
```javascript
// Add new state
const [screen, setScreen] = useState('login'); // Add 'products' to options

// Add new screen conditional
if (screen === 'products') {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>منتجاتي</Text>
      </View>
      {/* Your products UI here */}
    </View>
  );
}
```

2. Increment version (1.1.0 → 1.2.0)
3. Build and deploy following the workflow above

---

## 📝 Git Workflow

### Before Making Changes
```bash
cd /home/taleb/rimmarsa
git pull origin main  # Get latest changes
```

### After Making Changes
```bash
git status  # See what changed
git add .
git commit -m "Descriptive message of what you changed"
git push origin main
```

### If You Need to Revert
```bash
git log  # Find the commit to revert to
git reset --hard COMMIT_HASH
git push --force origin main  # ⚠️ Use with caution!
```

---

## 🎯 Best Practices

1. **Always test locally first** (if possible with Expo Go)
2. **Increment version numbers** for every release
3. **Keep mobile and web forms in sync** (same fields, same validation)
4. **Test download after deployment** before announcing to users
5. **Backup APKs** before replacing them
6. **Document your changes** in git commit messages
7. **Check Supabase Storage** quota (free tier = 1GB)

---

## 📞 Support & Resources

- **Expo Documentation:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs

---

## ✅ Current Status

**Mobile App:**
- Version: **1.1.0**
- Features: Login + Registration + Auto-Update Checking ✅
- Build Status: ⏳ Building on EAS (Build ID: 72cdc0c1)
- Deploy Status: ⏳ Pending build completion

**New Features in v1.1.0:**
- ✅ Complete vendor registration (4 steps)
- ✅ Image uploads to Supabase Storage
- ✅ Automatic update checking on app launch
- ✅ Update modal with force update capability
- ✅ Direct APK download from update modal

**Website:**
- Version: **Latest**
- Registration: ✅ Live at rimmarsa.com/vendor-registration
- APK Download: ✅ API endpoint ready at rimmarsa.com/api/download/vendor-app
- Version API: ✅ Live at rimmarsa.com/api/app-version

**Next Steps:**
1. ⏳ Wait for EAS build to complete (~10-15 min)
2. ⏳ Download APK from EAS
3. ⏳ Deploy APK to website
4. ⏳ Test update prompt (users with older versions will see modal)
5. ⏳ Test full registration flow end-to-end

---

**Last Updated:** October 23, 2025 by Claude Code 🤖
