# Vendor App v1.2.0 - Deployment Status

## ✅ Completed Successfully

### 1. APK Build
- **Status**: ✅ **SUCCESS**
- **Version**: 1.2.0
- **File Location**: `/tmp/vendor-app-1.2.0.apk`
- **File Size**: 60.8 MB (63,119,502 bytes)
- **Build Time**: ~9 minutes
- **Features**: Complete vendor registration system included

### 2. Registration Features Confirmed
- ✅ Business information form
- ✅ Location selection (region/city)
- ✅ Document uploads (NNI, personal photo, store photo)
- ✅ Package plan selection (1 month / 2 months)
- ✅ Payment screenshot upload
- ✅ Integration with `vendor_requests` table
- ✅ Admin approval workflow

## ⚠️ Manual Steps Required

### Step 1: Upload APK to Supabase Storage

The APK needs to be uploaded to Supabase Storage manually due to permission restrictions.

**Option A: Using Supabase Dashboard (Recommended)**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu
2. Navigate to **Storage** in the left sidebar
3. Create bucket "apps" if it doesn't exist:
   - Click "Create bucket"
   - Name: `apps`
   - **Public bucket**: ✅ YES (check this box)
   - Click "Create bucket"
4. Open the "apps" bucket
5. Click "Upload file"
6. Upload: `/tmp/vendor-app-1.2.0.apk`
7. Verify the file appears in the bucket

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Upload the file
supabase storage cp /tmp/vendor-app-1.2.0.apk \
  supabase://apps/vendor-app-1.2.0.apk \
  --project-ref rfyqzuuuumgdoomyhqcu
```

**Expected URL after upload**:
```
https://rfyqzuuuumgdoomyhqcu.supabase.co/storage/v1/object/public/apps/vendor-app-1.2.0.apk
```

### Step 2: Update Database with Version Info

After uploading the APK, update the database to register version 1.2.0:

**Option A: Using Supabase Dashboard SQL Editor**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu
2. Click **SQL Editor** in the left sidebar
3. Click "New query"
4. Copy and paste the following SQL:

```sql
INSERT INTO public.app_versions (
  app_name,
  version,
  build_number,
  minimum_version,
  download_url,
  file_size,
  release_notes_ar,
  release_notes_en,
  update_message_ar,
  update_message_en,
  force_update,
  is_active
) VALUES (
  'vendor',
  '1.2.0',
  2,
  '1.2.0',
  'https://rfyqzuuuumgdoomyhqcu.supabase.co/storage/v1/object/public/apps/vendor-app-1.2.0.apk',
  63119502,
  ARRAY[
    'إضافة نظام التسجيل الكامل للبائعين الجدد',
    'رفع المستندات المطلوبة (NNI، صورة شخصية، صورة المتجر)',
    'اختيار المنطقة والمدينة',
    'اختيار باقة الاشتراك (شهر أو شهرين)',
    'رفع إيصال الدفع',
    'تحسينات في الأداء والواجهة'
  ],
  ARRAY[
    'Added complete vendor registration system',
    'Upload required documents (NNI, personal photo, store photo)',
    'Select region and city',
    'Choose subscription plan (1 or 2 months)',
    'Upload payment receipt',
    'Performance and UI improvements'
  ],
  'إصدار جديد متوفر! يتضمن نظام التسجيل للبائعين الجدد. قم بالتحديث الآن!',
  'New version available! Includes registration system for new vendors. Update now!',
  false,
  true
)
ON CONFLICT (app_name, version)
DO UPDATE SET
  download_url = EXCLUDED.download_url,
  file_size = EXCLUDED.file_size,
  release_notes_ar = EXCLUDED.release_notes_ar,
  release_notes_en = EXCLUDED.release_notes_en,
  is_active = EXCLUDED.is_active,
  released_at = NOW();

-- Verify the version was added
SELECT
  app_name,
  version,
  is_active,
  force_update,
  file_size,
  released_at
FROM public.app_versions
WHERE app_name = 'vendor'
ORDER BY released_at DESC
LIMIT 3;
```

5. Click "Run" or press Ctrl/Cmd + Enter
6. Verify the version appears in the results

**Option B: Using the SQL file**

A pre-made SQL file is available at: `/home/taleb/rimmarsa/mobile-app/insert-version-1.2.0.sql`

You can run it if you have psql installed:
```bash
psql "postgresql://postgres.rfyqzuuuumgdoomyhqcu:TahaRou7@2035@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f insert-version-1.2.0.sql
```

## 🎯 What Happens After Deployment

Once both steps are complete:

1. **Download Page** (`https://www.rimmarsa.com/download`)
   - Already shows version 1.2.0
   - Already lists registration as the first feature
   - API will fetch from database and redirect to the uploaded APK

2. **Existing App Users**
   - Will receive update notification on next app open
   - Can update directly from the app
   - Will see all release notes in Arabic

3. **New Users**
   - Can download version 1.2.0 directly
   - Can register as new vendor using the registration form
   - Complete all 4 registration steps
   - Submit for admin approval

## 📱 Testing the Deployment

After completing the manual steps:

### Test 1: Verify APK Download
```bash
curl -I "https://rfyqzuuuumgdoomyhqcu.supabase.co/storage/v1/object/public/apps/vendor-app-1.2.0.apk"
# Should return: HTTP/2 200
```

### Test 2: Verify API Returns Correct Version
```bash
curl "https://www.rimmarsa.com/api/app-version?app=vendor"
# Should return version 1.2.0 details
```

### Test 3: Verify Download Page
Visit: https://www.rimmarsa.com/download
- Should show version 1.2.0
- Download button should work
- Should redirect to APK

## 📂 File Locations

- **APK File**: `/tmp/vendor-app-1.2.0.apk` (60.8 MB)
- **Source Code**: `/home/taleb/rimmarsa/mobile-app/`
- **Registration Screen**: `/home/taleb/rimmarsa/mobile-app/src/screens/VendorRegistrationScreen.js`
- **App Config**: `/home/taleb/rimmarsa/mobile-app/app.config.js`
- **Package Info**: `/home/taleb/rimmarsa/mobile-app/package.json`

## 🔄 Next Time: Automated Deployment

To automate this process in the future:

1. **Get Supabase Service Role Key**:
   - Dashboard → Settings → API
   - Copy the `service_role` key (NOT the anon key)
   - Store securely in environment variable

2. **Update DEPLOY.sh**:
   - Replace `SUPABASE_ANON_KEY` with `SUPABASE_SERVICE_KEY`
   - Or use Supabase CLI for uploads

3. **Or Use EAS Build**:
   - `eas login`
   - `eas build --platform android --profile production`
   - Automatically builds and can upload

## 📊 Build Summary

```
✅ Build Time: ~9 minutes
✅ APK Size: 60.8 MB
✅ Version: 1.2.0
✅ Build Number: 2
✅ Package: com.rimmarsa.mobile
✅ Min Android: 8.0 (API 26)
✅ Target Android: 34
```

## 🎉 Registration Feature Details

The app now includes a complete 4-step registration workflow:

**Step 1: Business Information**
- Business name (required)
- Owner name (required)
- Phone number with +222 prefix (required)
- Password (8+ chars, letters & numbers)
- WhatsApp number (required)
- Referral code (optional)

**Step 2: Location**
- Region selection (from database)
- City selection (filtered by region)
- Address (optional text)

**Step 3: Document Uploads**
- NNI (National ID) image
- Personal photo
- Store/Business photo
- All uploaded to Supabase Storage

**Step 4: Payment & Plan**
- 1 Month: 1,250 MRU (30 days)
- 2 Months: 1,600 MRU (60 days, save 350 MRU)
- Payment screenshot upload

After submission:
- Creates record in `vendor_requests` table
- Status: "pending"
- Awaits admin approval
- User sees pending screen
- Can login after approval

## 🔍 Troubleshooting

**Issue**: APK won't install on device
- Solution: Enable "Unknown sources" in Android settings
- Check: Minimum Android 8.0 required

**Issue**: Storage bucket not found
- Solution: Create "apps" bucket in Supabase Dashboard
- Make sure it's set to **public**

**Issue**: Download URL returns 404
- Solution: Verify file uploaded successfully
- Check URL matches exactly: `/storage/v1/object/public/apps/vendor-app-1.2.0.apk`

## ✉️ Support

For issues or questions:
- WhatsApp: +222 37892800
- Email: Check Supabase project settings

---

**Status**: Ready for final deployment steps
**Date**: October 25, 2025
**Built by**: Claude Code
