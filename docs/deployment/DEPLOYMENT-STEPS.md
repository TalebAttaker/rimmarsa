# Deployment Steps for Version 1.2.0

## Current Situation

**Issue**: The website still shows version 1.0.0 APK

**Root Cause**:
- Download API was hardcoded to serve `vendor-app-1.0.0.apk`
- Database doesn't have version 1.2.0 entry yet
- Existing APK file is version 1.0.0

**What I Fixed**:
- ✅ Updated download API to dynamically fetch latest version from database
- ✅ Updated download page to show version 1.2.0
- ✅ Updated mobile app code to version 1.2.0
- ✅ Created SQL script to insert version 1.2.0 into database

## Choose Your Deployment Path

### Option 1: Quick Fix (Use Existing APK, Update Later)

If the existing APK already has registration (it might), you can:

```bash
# 1. Check if existing APK has registration by testing it
# If it does, just update database to call it version 1.2.0

# Create a quick SQL update
cat > /tmp/quick-fix.sql << 'EOF'
INSERT INTO public.app_versions (
  app_name, version, build_number, minimum_version,
  download_url, is_active, force_update,
  release_notes_ar, update_message_ar
) VALUES (
  'vendor', '1.2.0', 2, '1.2.0',
  'https://www.rimmarsa.com/apps/vendor-app-1.0.0.apk',
  true, false,
  ARRAY['تحديث الإصدار إلى 1.2.0', 'يتضمن نظام التسجيل الكامل'],
  'إصدار جديد متاح!'
) ON CONFLICT (app_name, version) DO UPDATE
  SET is_active = true, download_url = EXCLUDED.download_url;
EOF

# Run it
PGPASSWORD="TahaRou7@2035" psql \
  "postgresql://postgres.rfyqzuuuumgdoomyhqcu:TahaRou7@2035@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -f /tmp/quick-fix.sql

# 2. Deploy website changes
cd /home/taleb/rimmarsa/marketplace
git add .
git commit -m "Update to version 1.2.0 API and download page"
git push

# Done! Website will now serve the APK as version 1.2.0
```

### Option 2: Proper Build (Recommended)

Build a fresh APK with all latest changes:

```bash
# 1. First, install PostgreSQL client if not installed
sudo apt-get update && sudo apt-get install -y postgresql-client

# 2. Add version 1.2.0 to database (points to Supabase Storage)
cd /home/taleb/rimmarsa/mobile-app
PGPASSWORD="TahaRou7@2035" psql \
  "postgresql://postgres.rfyqzuuuumgdoomyhqcu:TahaRou7@2035@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -f insert-version-1.2.0.sql

# 3. Build and deploy the APK (this will take 5-10 minutes)
./DEPLOY.sh
# This script will:
# - Build the APK
# - Upload to Supabase Storage at: apps/vendor-app-1.2.0.apk
# - Update database with correct URL
# - Users will download from Supabase (faster, more reliable)

# 4. Deploy website changes
cd /home/taleb/rimmarsa/marketplace
git add .
git commit -m "Update to version 1.2.0 with registration feature"
git push

# Done! Everything is properly deployed
```

### Option 3: Manual Upload (If Build Fails)

If you have the APK file already built elsewhere:

```bash
# 1. Upload APK to Supabase Storage manually via dashboard
# Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/storage/buckets
# Navigate to 'apps' bucket
# Upload file named: vendor-app-1.2.0.apk

# 2. Get the public URL (it will be):
# https://rfyqzuuuumgdoomyhqcu.supabase.co/storage/v1/object/public/apps/vendor-app-1.2.0.apk

# 3. Insert version into database
cd /home/taleb/rimmarsa/mobile-app
PGPASSWORD="TahaRou7@2035" psql \
  "postgresql://postgres.rfyqzuuuumgdoomyhqcu:TahaRou7@2035@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -f insert-version-1.2.0.sql

# 4. Deploy website
cd /home/taleb/rimmarsa/marketplace
git add .
git commit -m "Update to version 1.2.0"
git push
```

## What Happens After Deployment

Once deployed:

1. **Download Page** (`rimmarsa.com/download`):
   - Shows version 1.2.0
   - Lists registration as first feature
   - Download button works

2. **Download API** (`/api/download/vendor-app`):
   - Queries database for latest version
   - Redirects to correct APK URL
   - Tracks downloads with correct version

3. **Version Check API** (`/api/app-version`):
   - Returns version 1.2.0 info
   - Shows registration in release notes
   - Existing users get update prompt

4. **Users**:
   - New downloads get version 1.2.0
   - Can register as vendors
   - Existing users see update notification

## Verify Deployment

After deployment, check:

```bash
# 1. Check version API
curl https://www.rimmarsa.com/api/app-version | jq

# 2. Check download redirects correctly
curl -I https://www.rimmarsa.com/api/download/vendor-app

# 3. Visit download page
# Open: https://www.rimmarsa.com/download
# Should show version 1.2.0
```

## My Recommendation

**Use Option 2 (Proper Build)** because:
- ✅ Clean, proper version numbering
- ✅ APK uploaded to reliable Supabase Storage
- ✅ Automatic database update
- ✅ Everything matches (version numbers, features, files)
- ✅ One command does everything: `./DEPLOY.sh`

## Status of Files

✅ Code updated to version 1.2.0:
- `mobile-app/App.js` → Version 1.2.0
- `mobile-app/package.json` → Version 1.2.0
- `marketplace/src/app/download/page.tsx` → Version 1.2.0
- `marketplace/src/app/api/download/vendor-app/route.ts` → Dynamic version from DB

✅ Scripts ready:
- `mobile-app/DEPLOY.sh` → Build & deploy script
- `mobile-app/insert-version-1.2.0.sql` → Database insert script

📦 Existing APK:
- `marketplace/public/apps/vendor-app-1.0.0.apk` → 60MB, from Oct 22

## Next Action

**Tell me which option you prefer, or just run Option 2:**

```bash
cd /home/taleb/rimmarsa/mobile-app
./DEPLOY.sh
```

Then commit and push the marketplace changes.
