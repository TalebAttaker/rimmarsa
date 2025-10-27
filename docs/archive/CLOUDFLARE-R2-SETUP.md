# Cloudflare R2 Setup & Credentials

**Date**: October 27, 2025
**Status**: ✅ Configured & Saved

---

## 🔑 Credentials Saved

All Cloudflare R2 credentials are stored securely in:
```
/home/taleb/rimmarsa/.cloudflare-r2-credentials
```

**Permissions**: 600 (read-only by owner)

---

## 📋 Credential Details

### R2 API Token
```
Token: uLIMFsHwZcfh2W7IYf-n7p_wgZ2f3g27OrXW7Zgz
Expiration: October 27, 2026 (1 year)
```

### S3-Compatible Access Keys
```
Access Key ID: d742e649178718e0d220a210247832e2
Secret Access Key: 84b11eef6bff41bfb7ca6b99bc1aa2297098a7b2a617701b88b6b1ab351a686f
```

### R2 Endpoint
```
URL: https://932136e1e064884067a65d0d357297cf.r2.cloudflarestorage.com
Region: auto
Account ID: 932136e1e064884067a65d0d357297cf
```

---

## 🪣 R2 Buckets

### 1. rimmarsa-vendor-images
- **Purpose**: Vendor registration images, product images
- **Created**: October 26, 2025
- **Public Access**: ⚠️ **NEEDS TO BE ENABLED**
- **Target Domain**: `pub-XXXXXXXX.r2.dev` (to be configured)

### 2. rimmarsa-apps
- **Purpose**: APK files for mobile apps
- **Created**: October 25, 2025
- **Public Access**: ⚠️ **NEEDS TO BE ENABLED**
- **Target Domain**: `pub-XXXXXXXX.r2.dev` (to be configured)

---

## 🔧 Tools & Scripts

### Upload Script
**Location**: `/tmp/upload-to-r2.py`
**Usage**:
```bash
python3 /tmp/upload-to-r2.py
```

### List Objects Script
**Location**: `/tmp/list-r2-objects.py`
**Usage**:
```bash
python3 /tmp/list-r2-objects.py
```

### Direct AWS CLI Usage
```bash
# Configure (one-time)
export AWS_ACCESS_KEY_ID="d742e649178718e0d220a210247832e2"
export AWS_SECRET_ACCESS_KEY="84b11eef6bff41bfb7ca6b99bc1aa2297098a7b2a617701b88b6b1ab351a686f"
export AWS_ENDPOINT_URL="https://932136e1e064884067a65d0d357297cf.r2.cloudflarestorage.com"

# List buckets
aws s3 ls --endpoint-url=$AWS_ENDPOINT_URL

# List objects
aws s3 ls s3://rimmarsa-vendor-images/ --endpoint-url=$AWS_ENDPOINT_URL

# Upload file
aws s3 cp file.apk s3://rimmarsa-apps/file.apk --endpoint-url=$AWS_ENDPOINT_URL
```

---

## ⚠️ IMPORTANT: Enable Public Access

**TO-DO** (Requires Cloudflare Dashboard):

1. **Login to Cloudflare Dashboard**
2. **Navigate to R2**
3. **For each bucket** (`rimmarsa-vendor-images`, `rimmarsa-apps`):
   - Click bucket name
   - Go to **Settings**
   - Find **Public Access** section
   - Click **Enable Public Access** or **Allow Public Access**
   - **Copy the public domain** (e.g., `pub-XXXXXXXX.r2.dev`)
   - **Save** the domain somewhere

4. **Update this document** with the public domains

---

## 📝 Current Status

### ✅ Completed
- [x] R2 API token configured (valid for 1 year)
- [x] S3-compatible credentials saved
- [x] Python upload scripts created
- [x] boto3 installed for R2 access
- [x] v1.7.0 APK uploaded to `rimmarsa-vendor-images` bucket (62.3 MB)
- [x] Database updated with v1.7.0 URL

### ⏳ Pending
- [ ] **Enable public access** on `rimmarsa-vendor-images` bucket
- [ ] **Enable public access** on `rimmarsa-apps` bucket
- [ ] **Verify public URLs** work for all APKs
- [ ] **Update database** with correct public URLs

---

## 🔍 Verification Commands

### Check if credentials work:
```bash
python3 /tmp/list-r2-objects.py
```

### Test public URL (after enabling public access):
```bash
curl -I "https://pub-XXXXXXXX.r2.dev/vendor-app-1.7.0.apk"
# Expected: HTTP/1.1 200 OK
```

### Check database URLs:
```sql
SELECT version, download_url, is_active
FROM app_versions
WHERE app_name = 'vendor'
ORDER BY released_at DESC;
```

---

## 💡 Quick Reference

### Upload New APK Version
```python
# Edit /tmp/upload-to-r2.py
# Change:
FILE_PATH = "/path/to/new-app.apk"
OBJECT_KEY = "vendor-app-X.X.X.apk"

# Run:
python3 /tmp/upload-to-r2.py
```

### Update Database After Upload
```sql
INSERT INTO app_versions (
  app_name, version, download_url,
  build_number, file_size, is_active,
  release_notes_ar, release_notes_en,
  released_at
) VALUES (
  'vendor', 'X.X.X',
  'https://pub-XXXXXXXX.r2.dev/vendor-app-X.X.X.apk',
  X, file_size_bytes, true,
  ARRAY['ملاحظات بالعربية'],
  ARRAY['English notes'],
  NOW()
);

-- Deactivate old version
UPDATE app_versions
SET is_active = false
WHERE app_name = 'vendor' AND version = 'OLD_VERSION';
```

---

## 🔒 Security Notes

- **Credentials file**: `/home/taleb/rimmarsa/.cloudflare-r2-credentials`
  - Permissions: 600 (owner read-only)
  - **DO NOT commit to git**
  - Added to `.gitignore`

- **Token Expiration**: October 27, 2026
  - Set calendar reminder to renew before expiration
  - Update this document with new token when renewed

- **Public Buckets**:
  - Only enable public access on buckets that need it
  - APKs and images need public access
  - Other buckets should remain private

---

## 📞 Support

**Cloudflare Account**: tasynmym@gmail.com
**Account ID**: 932136e1e064884067a65d0d357297cf

**Dashboard**: https://dash.cloudflare.com/

---

**Last Updated**: October 27, 2025
**Next Review**: October 27, 2026 (token renewal)
