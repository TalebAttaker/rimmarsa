# Rimmarsa Vendor Mobile App

Professional Android app for Rimmarsa vendors with automatic update detection.

## Quick Start

### First Time Setup (One Command)

```bash
./INSTALL-ANDROID-SDK.sh
```

This installs the Android SDK (takes ~5 minutes, only once).

### Every Time You Update the App (One Command)

```bash
# 1. Edit your code
# 2. Bump version in package.json
# 3. Run:
./DEPLOY.sh
```

That's it! Users will automatically be prompted to update.

## What's Included

- ✅ **Local builds** - No Expo, no EAS, just pure React Native
- ✅ **Automatic updates** - App checks for new versions on startup
- ✅ **Version management** - All versions stored in Supabase
- ✅ **One-command deploy** - Build + Upload + Database update in one script
- ✅ **Simple workflow** - No complicated CI/CD needed

## Features
- ✅ Full Arabic language support with RTL layout
- ✅ Vendor registration with image uploads
- ✅ Multi-step registration form
- ✅ Region & city selection
- ✅ Subscription plan selection
- ✅ Automatic update detection
- ✅ Dark theme UI
- ✅ Integration with Supabase backend

## Tech Stack
- **Framework**: React Native 0.74 (pure, no Expo)
- **Database**: Supabase
- **Storage**: Supabase Storage
- **Build**: Local Gradle builds
- **Deployment**: Automated via DEPLOY.sh

## File Structure

```
mobile-app/
├── App.js                    # Main app code
├── package.json              # Version number defined here
├── DEPLOY.sh                 # ⭐ One-command build & deploy
├── INSTALL-ANDROID-SDK.sh    # One-time setup
├── UPDATE-WORKFLOW.md        # Detailed documentation
├── README.md                 # This file
└── android/                  # Auto-generated Android project
```

## Documentation

- **Quick Reference**: This file (README.md)
- **Detailed Workflow**: [UPDATE-WORKFLOW.md](./UPDATE-WORKFLOW.md)
- **Troubleshooting**: See UPDATE-WORKFLOW.md

## How It Works

### Automatic Update Detection

When users open the app:
1. App checks Supabase for the latest version
2. If new version available, shows update modal
3. User taps "Update Now" to download latest APK
4. User installs and enjoys new features

### Update Workflow for Developers

```
Edit Code → Bump Version → Run ./DEPLOY.sh → Users Get Updated
```

The DEPLOY.sh script:
1. Builds the APK locally (2-5 minutes)
2. Uploads to Supabase Storage
3. Updates version in database
4. Users automatically notified on next app open

### Customizing Updates

Edit `DEPLOY.sh` to customize update messages and release notes, or update directly in Supabase:

```sql
UPDATE app_versions
SET release_notes_ar = ARRAY['ميزة جديدة!', 'إصلاحات'],
    force_update = false
WHERE app_name = 'vendor' AND version = '1.2.0';
```

## Quick Reference

| Task | Command |
|------|---------|
| First time setup | `./INSTALL-ANDROID-SDK.sh` |
| Build & Deploy update | `./DEPLOY.sh` |
| Check versions in DB | `SELECT * FROM app_versions WHERE app_name = 'vendor';` |
| Test version API | `curl https://www.rimmarsa.com/api/app-version` |

## App Screens

### Vendor Registration (Multi-Step)
1. **Business Information** - Name, phone, WhatsApp
2. **Location** - Region and city selection
3. **Documents** - NNI, personal photo, store photo
4. **Payment** - Plan selection and payment screenshot

### Dashboard
- Vendor profile information
- Business statistics
- Account management

### Update Detection
- Automatic version check on app start
- Beautiful update modal with release notes
- Download and install new versions

## Troubleshooting

### Build fails?
```bash
# Clean and rebuild
rm -rf android
./DEPLOY.sh
```

### Upload fails?
- Check Supabase storage bucket `apps` exists and is public
- Verify file size limit (default 50MB)

### Database update fails?
```bash
# Check versions manually
PGPASSWORD="TahaRou7@2035" psql \
  "postgresql://postgres.rfyqzuuuumgdoomyhqcu:TahaRou7@2035@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -c "SELECT * FROM app_versions WHERE app_name = 'vendor' ORDER BY released_at DESC LIMIT 5;"
```

## Support

For detailed instructions, see [UPDATE-WORKFLOW.md](./UPDATE-WORKFLOW.md)

---

**Made with ❤️ for Rimmarsa vendors**

No Expo. No EAS. No complicated CI/CD. Just simple local builds that work.
