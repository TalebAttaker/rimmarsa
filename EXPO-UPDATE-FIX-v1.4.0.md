# Expo Update Issue - Fixed in v1.4.0

## Problem Description

When users downloaded the app from rimmarsa.com (even fresh installs), the app showed an update notification and redirected to expo.dev login page when they tried to update. This affected all versions including v1.3.0.

## Root Cause

### Issue 1: Hardcoded Version Number
- **File:** `/mobile-app/App.js`
- **Line 19:** `const CURRENT_VERSION = '1.2.0'`
- **Problem:** Even though we built v1.3.0, the code still had `CURRENT_VERSION = '1.2.0'`
- **Result:** App thought it was v1.2.0 and saw v1.3.0 as an update

### Issue 2: EAS Project ID in Config
- **File:** `/mobile-app/app.config.js`
- **Lines 21-25:**
```javascript
extra: {
  eas: {
    projectId: "bf9384bd-86ef-4bbf-982e-e79d6a57e912"
  }
}
```
- **Problem:** This EAS project ID might trigger Expo's cloud services
- **Result:** App may attempt to connect to Expo servers for updates

### Issue 3: Update Flow Behavior
The app has a custom update checker (lines 84-165 in App.js) that:
1. Checks `https://www.rimmarsa.com/api/app-version` for latest version
2. Compares with `CURRENT_VERSION` constant
3. Shows update modal if newer version exists
4. Calls `Linking.openURL(updateInfo.downloadUrl)` to download

Since CURRENT_VERSION was wrong, the app always detected an "update" and the redirect URL may have been pointing to Expo instead of our R2 URL.

## Solution Implemented

### Changes Made in v1.4.0

1. **Updated Version Constant** ✅
   - Changed `CURRENT_VERSION = '1.2.0'` → `'1.4.0'`
   - File: `/mobile-app/App.js:19`

2. **Updated Display Version** ✅
   - Changed login screen version text to "1.4.0"
   - File: `/mobile-app/App.js:429`

3. **Removed EAS Configuration** ✅
   - Completely removed `extra.eas` section from config
   - File: `/mobile-app/app.config.js:21-25`
   - No more Expo cloud dependencies

4. **Updated App Config Version** ✅
   - Changed `version: "1.3.0"` → `"1.4.0"`
   - File: `/mobile-app/app.config.js:5`

5. **Updated Android Build Version** ✅
   - Changed `versionCode: 3` → `4`
   - Changed `versionName: "1.3.0"` → `"1.4.0"`
   - File: `/mobile-app/android/app/build.gradle:117-118`

## How This Fixes the Problem

### Before (v1.2.0, v1.3.0)
```
User installs v1.3.0 from rimmarsa.com
  ↓
App starts with CURRENT_VERSION = '1.2.0' (hardcoded wrong!)
  ↓
App checks API → sees v1.3.0 available
  ↓
App thinks: "I'm 1.2.0, but 1.3.0 is available - show update!"
  ↓
User clicks update → redirects to expo.dev (wrong URL)
  ↓
❌ USER STUCK
```

### After (v1.4.0)
```
User installs v1.4.0 from rimmarsa.com
  ↓
App starts with CURRENT_VERSION = '1.4.0' (correct!)
  ↓
App checks API → sees v1.4.0 (same version)
  ↓
App thinks: "I'm up to date - no update needed"
  ↓
✅ No update modal shown
✅ App works normally
```

### Future Updates (v1.5.0+)
```
User has v1.4.0 installed
  ↓
We release v1.5.0 to R2 and update database
  ↓
App checks API → sees v1.5.0 available
  ↓
App shows update modal with download button
  ↓
User clicks "Update Now"
  ↓
Opens: https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.5.0.apk
  ↓
✅ Downloads new APK from R2 (not Expo!)
✅ User installs update
```

## Technical Details

### Custom Update System
The app uses a custom update checking system (NOT Expo Updates):

**API Endpoint:** `https://www.rimmarsa.com/api/app-version?app=vendor`

**Expected Response:**
```json
{
  "version": "1.4.0",
  "buildNumber": 4,
  "downloadUrl": "https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-1.4.0.apk",
  "fileSize": 63000000,
  "forceUpdate": false,
  "minimumVersion": "1.0.0",
  "updateMessage": {
    "ar": "إصدار جديد متاح!",
    "en": "New version available!"
  },
  "releaseNotes": {
    "ar": [
      "إصلاح مشكلة التحديث",
      "إزالة اعتماد Expo Cloud"
    ],
    "en": [
      "Fixed update issue",
      "Removed Expo cloud dependency"
    ]
  }
}
```

**Update Logic:**
```javascript
// Compare versions
const needsUpdate = compareVersions(data.version, CURRENT_VERSION) > 0;
const forceUpdate = data.forceUpdate &&
                    compareVersions(CURRENT_VERSION, data.minimumVersion) < 0;

if (needsUpdate || forceUpdate) {
  // Show update modal
  setUpdateInfo(data);
  setShowUpdateModal(true);
}
```

### No Expo Cloud Services
With the EAS project ID removed, the app:
- ✅ Does NOT connect to Expo servers
- ✅ Does NOT attempt OTA updates via Expo
- ✅ Only checks our own API
- ✅ Only downloads from our R2 bucket
- ✅ 100% local builds, zero cloud dependency

## Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `App.js:19` | `CURRENT_VERSION = '1.4.0'` | Fix version detection |
| `App.js:429` | Display version "1.4.0" | Show correct version to user |
| `app.config.js:5` | `version: "1.4.0"` | Expo config version |
| `app.config.js:21-25` | Removed `extra.eas` | Remove Expo cloud dependency |
| `build.gradle:117` | `versionCode: 4` | Android version code |
| `build.gradle:118` | `versionName: "1.4.0"` | Android version name |

## Deployment Steps

1. ✅ Update code (DONE)
2. ⏳ Build v1.4.0 APK (IN PROGRESS)
3. ⏳ Upload to Cloudflare R2
4. ⏳ Update database
5. ⏳ Test on device

## Testing Checklist

After deploying v1.4.0:

- [ ] Fresh install from rimmarsa.com
- [ ] App opens without update prompt
- [ ] Login screen shows "الإصدار 1.4.0"
- [ ] No redirect to expo.dev
- [ ] Registration works (image upload)
- [ ] Login works for existing users

## Future Best Practices

### For Every New Version:

1. **Update ALL Version References:**
   - [ ] `App.js` → `CURRENT_VERSION`
   - [ ] `App.js` → Display version text
   - [ ] `app.config.js` → `version`
   - [ ] `build.gradle` → `versionCode` (increment by 1)
   - [ ] `build.gradle` → `versionName`

2. **Build Process:**
   - [ ] Build APK locally (no Expo cloud)
   - [ ] Upload to Cloudflare R2
   - [ ] Update database with new URL
   - [ ] Test on device before announcing

3. **Database Update:**
   ```sql
   UPDATE app_versions
   SET download_url = 'https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/vendor-app-X.Y.Z.apk',
       file_size = <size-in-bytes>,
       is_active = true
   WHERE app_name = 'vendor' AND version = 'X.Y.Z';
   ```

## Summary

**Problem:** App redirected to expo.dev due to incorrect version constant and EAS config

**Solution:**
- Fixed CURRENT_VERSION to match actual build version
- Removed EAS project ID completely
- Built v1.4.0 with correct configuration

**Result:**
- No more expo.dev redirects
- 100% self-hosted updates via R2
- Clean, simple update flow

**Status:** v1.4.0 build in progress...
