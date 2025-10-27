# Rimmarsa Vendor App - Update Workflow

## Overview

This document describes the **simple and automated** workflow for building and deploying updates to the Rimmarsa Vendor mobile app.

### How It Works

```
┌─────────────────┐
│ 1. Update Code  │  You make changes to the app
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Run ./DEPLOY │  Single command builds and deploys
└────────┬────────┘
         │
         ├──► Builds APK locally
         ├──► Uploads to Supabase Storage
         └──► Updates version in database
                    │
                    ▼
┌─────────────────────────────────┐
│ 3. Users Get Update Prompt      │
│                                 │
│ • App checks version on startup │
│ • Shows update modal if needed  │
│ • User downloads latest APK     │
└─────────────────────────────────┘
```

## Prerequisites (One-Time Setup)

### 1. Install Android SDK

```bash
cd /home/taleb/rimmarsa/mobile-app
./INSTALL-ANDROID-SDK.sh
```

This installs the Android SDK needed to build APKs locally.

### 2. Install PostgreSQL Client (for database updates)

```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
```

## Daily Workflow: Making Updates

### Step 1: Update Your Code

Make your changes to the app:
- Edit `App.js` for UI/logic changes
- Edit `package.json` to bump the version number
- Test locally if needed: `npm start`

### Step 2: Bump Version

Edit `package.json` and update the version:

```json
{
  "version": "1.2.0"  ← Increment this
}
```

**Version Rules:**
- `1.0.0` → `1.0.1` for bug fixes
- `1.0.0` → `1.1.0` for new features
- `1.0.0` → `2.0.0` for major changes

### Step 3: Deploy

Run the single deploy command:

```bash
cd /home/taleb/rimmarsa/mobile-app
./DEPLOY.sh
```

This script will:
1. ✅ Check Android SDK
2. ✅ Generate Android project (if needed)
3. ✅ Build the APK (2-5 minutes)
4. ✅ Upload to Supabase Storage
5. ✅ Update version in database

### Step 4: Users Get Updated

**Automatically!**

When users open the app:
- App checks the database for the latest version
- If a new version is available, shows an update modal
- User taps "Update Now" and downloads the latest APK
- User installs and enjoys the new features!

## Customizing Update Messages

Edit the `DEPLOY.sh` script to customize the update message:

```bash
# Around line 95, edit these:
release_notes_ar='ARRAY[\"تحسينات عامة\", \"إصلاحات الأخطاء\"]'
release_notes_en='ARRAY[\"Performance improvements\", \"Bug fixes\"]'
update_message_ar='يتوفر إصدار جديد! قم بالتحديث الآن.'
update_message_en='New version available! Update now.'
force_update=false  # Set to true to force users to update
```

Or update directly in Supabase:

```sql
UPDATE app_versions
SET
  release_notes_ar = ARRAY['ميزة جديدة رائعة!', 'إصلاحات'],
  release_notes_en = ARRAY['Awesome new feature!', 'Bug fixes'],
  force_update = false
WHERE app_name = 'vendor' AND version = '1.2.0';
```

## Force Update vs Optional Update

### Optional Update (Default)
```sql
force_update = false
```
- User sees "Update Now" and "Later" buttons
- User can skip and update later
- Good for minor improvements

### Force Update
```sql
force_update = true
```
- User MUST update to continue
- No "Later" button shown
- Good for critical security fixes or breaking changes

## Troubleshooting

### Build Fails?

```bash
# Clean and rebuild
cd /home/taleb/rimmarsa/mobile-app
rm -rf android
./DEPLOY.sh
```

### Upload Fails?

Check that:
1. Supabase storage bucket `apps` exists
2. Storage bucket is public
3. File size limit is sufficient (default 50MB)

### Database Update Fails?

```bash
# Manually update using psql
PGPASSWORD="TahaRou7@2035" psql \
  "postgresql://postgres.rfyqzuuuumgdoomyhqcu:TahaRou7@2035@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -c "SELECT * FROM app_versions WHERE app_name = 'vendor' ORDER BY released_at DESC LIMIT 5;"
```

## File Structure

```
mobile-app/
├── App.js                  # Main app code
├── package.json            # Version number here!
├── DEPLOY.sh              # One-command deploy script
├── INSTALL-ANDROID-SDK.sh # One-time SDK setup
└── android/               # Generated Android project (auto-created)
```

## Quick Reference

| Task | Command |
|------|---------|
| Install SDK (once) | `./INSTALL-ANDROID-SDK.sh` |
| Build & Deploy | `./DEPLOY.sh` |
| Check versions | `SELECT * FROM app_versions WHERE app_name = 'vendor';` |
| Test API | `curl https://www.rimmarsa.com/api/app-version` |

## Tips

1. **Always test locally first** before deploying
2. **Bump version** in package.json before running DEPLOY.sh
3. **Write clear release notes** so users know what's new
4. **Use force_update sparingly** - only for critical updates
5. **Keep the APK under 50MB** to ensure fast downloads

## Support

If something goes wrong:
1. Check the error message from `./DEPLOY.sh`
2. Verify Supabase storage bucket permissions
3. Test the API endpoint: `https://www.rimmarsa.com/api/app-version`
4. Check database: `SELECT * FROM app_versions;`

---

**That's it!** Your update workflow is now:

1. Edit code
2. Bump version in package.json
3. Run `./DEPLOY.sh`
4. Users get updated automatically!

No Expo. No EAS. No complicated CI/CD. Just simple local builds that work.
