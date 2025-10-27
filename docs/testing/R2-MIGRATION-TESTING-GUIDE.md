# R2 Migration Testing Guide

## ✅ Migration Complete - Testing Required

All image uploads have been successfully migrated from Supabase Storage to Cloudflare R2. This guide will help you test the complete flow.

---

## 🔧 Infrastructure Status

### R2 Buckets
- ✅ **rimmarsa-apps**: APK files storage
- ✅ **rimmarsa-vendor-images**: All vendor/product images
  - Public URL: `https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev`

### Database
- ✅ **Supabase**: All data storage (unchanged)
  - URL: `https://rfyqzuuuumgdoomyhqcu.supabase.co`

### Deployment
- ✅ **Vercel Production**: https://www.rimmarsa.com (or your production domain)
- ✅ **Build Status**: Successful ✓

---

## 🧪 Test Plan

### Test 1: Vendor Registration with Image Uploads

**Objective**: Verify that new vendor registrations upload images to R2

**Steps**:
1. Go to: https://www.rimmarsa.com/vendor-registration
2. Fill out Step 1 (Business Information):
   - Business name
   - Owner name
   - Phone number (8 digits)
   - Password (mix of letters and numbers)
   - WhatsApp number
   - Referral code (optional)

3. Click "Next: Location" → Fill Step 2:
   - Select region
   - Select city
   - Enter address

4. Click "Next: Documents" → **Upload 4 images**:
   - ✅ National ID (NNI) image
   - ✅ Personal photo
   - ✅ Store photo
   - ✅ Payment screenshot

5. Watch for upload progress (should show percentage)

6. Click "Next: Payment" → Select package and submit

**Expected Results**:
- ✅ Upload progress shows for each image
- ✅ Success toast: "تم تحميل الصورة بنجاح!"
- ✅ Console logs show: "Uploaded {type} to R2: https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/..."
- ✅ Form submission succeeds
- ✅ Success page displays

**Verification**:
```sql
-- Check vendor_requests table for new entry
SELECT
  id,
  business_name,
  phone,
  nni_image_url,
  personal_image_url,
  store_image_url,
  payment_screenshot_url,
  status
FROM vendor_requests
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

All image URLs should start with: `https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/`

---

### Test 2: Admin Approval Flow

**Objective**: Verify admin can approve vendors and images load from R2

**Steps**:
1. Login to admin panel: https://www.rimmarsa.com/fassalapremierprojectbsk/login
2. Navigate to: Vendor Requests
3. Find the pending request from Test 1
4. Click to review the vendor request
5. **Verify images load**:
   - Check NNI image displays
   - Check personal photo displays
   - Check store photo displays
   - Check payment screenshot displays

6. Click "Approve" button

**Expected Results**:
- ✅ All 4 images load correctly from R2
- ✅ Images display without CORS errors
- ✅ Approval succeeds
- ✅ Vendor account is created
- ✅ Vendor can now login

**Verification**:
```sql
-- Check that vendor was created and linked
SELECT
  v.id,
  v.business_name,
  v.email,
  v.is_approved,
  v.logo_url,
  v.personal_picture_url,
  vr.status,
  vr.nni_image_url
FROM vendors v
LEFT JOIN vendor_requests vr ON vr.vendor_id = v.id
WHERE v.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY v.created_at DESC
LIMIT 1;
```

---

### Test 3: Admin Vendor Management

**Objective**: Test admin uploading logo/pictures to R2

**Steps**:
1. In admin panel, go to: Vendors
2. Click "Edit" on any vendor
3. Upload a new logo image
4. Upload a new personal picture
5. Save changes

**Expected Results**:
- ✅ Upload progress shows
- ✅ Success toast: "Logo uploaded to R2 successfully!" or "Personal picture uploaded to R2 successfully!"
- ✅ Console logs show R2 URLs
- ✅ Images display immediately after upload

**Verification**:
```sql
-- Check vendor logo/picture URLs
SELECT
  id,
  business_name,
  logo_url,
  personal_picture_url
FROM vendors
WHERE updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY updated_at DESC
LIMIT 1;
```

Both URLs should start with: `https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/`

---

### Test 4: Vendor Login and Product Management

**Objective**: Test vendor uploading product images to R2

**Steps**:
1. Login as vendor: https://www.rimmarsa.com/vendor/login
   - Use phone from Test 1 (format: +222XXXXXXXX)
   - Use password from Test 1

2. Navigate to: Products → Add Product

3. Fill out product form:
   - Product name
   - Category
   - Price
   - Description

4. **Upload multiple product images** (up to 6):
   - Click "Add Images"
   - Select 2-3 product images
   - Watch upload progress

5. Click "Save Product"

**Expected Results**:
- ✅ Login succeeds
- ✅ Each image shows upload progress
- ✅ Console logs: "Uploading image 1/3 (33%)"
- ✅ Console logs: "Successfully uploaded 3 images to R2"
- ✅ Product creation succeeds

**Verification**:
```sql
-- Check product with R2 image URLs
SELECT
  id,
  name,
  vendor_id,
  images,
  created_at
FROM products
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

The `images` array should contain URLs starting with: `https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/product/`

---

## 🔍 Browser Console Debugging

Open browser DevTools (F12) and check Console for these logs:

### During Registration:
```
Upload token acquired for R2 uploads
Uploaded nni to R2: https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/nni/...
Remaining uploads: 3
```

### During Product Upload:
```
Uploading image 1/3 (33%)
Uploading image 2/3 (66%)
Uploading image 3/3 (100%)
Successfully uploaded 3 images to R2
```

---

## 🚨 Troubleshooting

### Images Not Loading
**Check**: CORS configuration on R2 bucket

```bash
# If images don't load, check CORS:
wrangler r2 bucket cors get rimmarsa-vendor-images
```

**Solution**: Add CORS policy if missing:
```bash
wrangler r2 bucket cors put rimmarsa-vendor-images --config cors-config.json
```

### Upload Fails with "Token Required"
**Check**: Token generation endpoint
```bash
curl -X POST https://www.rimmarsa.com/api/vendor/request-upload-token
```

**Expected Response**:
```json
{
  "token": "abc123...",
  "expires_at": "2025-...",
  "max_uploads": 4
}
```

### Upload Fails with "Invalid file type"
**Allowed types**: JPEG, JPG, PNG, WebP only
**Max size**: 10MB per file

---

## ✅ Success Criteria

**Registration Flow**:
- [ ] Registration form uploads 4 images to R2
- [ ] All image URLs use R2 public domain
- [ ] Images are saved to database correctly
- [ ] Images display in admin panel

**Admin Flow**:
- [ ] Admin can view uploaded images
- [ ] Admin can upload new logo/pictures to R2
- [ ] Approval process works correctly

**Vendor Flow**:
- [ ] Vendor can login with created account
- [ ] Vendor can upload product images to R2
- [ ] Product images display correctly on site

---

## 📊 R2 Storage Verification

Check what's actually stored in R2:

```bash
# List all objects in vendor-images bucket (first 100)
wrangler r2 object list rimmarsa-vendor-images --limit 100

# Check specific image types
wrangler r2 object list rimmarsa-vendor-images --prefix nni/
wrangler r2 object list rimmarsa-vendor-images --prefix personal/
wrangler r2 object list rimmarsa-vendor-images --prefix store/
wrangler r2 object list rimmarsa-vendor-images --prefix payment/
wrangler r2 object list rimmarsa-vendor-images --prefix logo/
wrangler r2 object list rimmarsa-vendor-images --prefix product/
```

---

## 🎯 Quick Database Queries

### Check recent uploads:
```sql
-- Recent vendor requests (should have R2 URLs)
SELECT
  business_name,
  nni_image_url,
  created_at
FROM vendor_requests
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Recent vendors (should have R2 URLs)
SELECT
  business_name,
  logo_url,
  personal_picture_url,
  created_at
FROM vendors
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Recent products (images array should have R2 URLs)
SELECT
  name,
  images,
  created_at
FROM products
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## 🔐 Security Checks

### Token Rate Limiting:
Try requesting multiple tokens rapidly:
```bash
for i in {1..6}; do
  curl -X POST https://www.rimmarsa.com/api/vendor/request-upload-token
  echo ""
done
```

**Expected**: After 5 requests, should get rate limit error

### Upload Token Validation:
Try uploading without a token:
```bash
curl -X POST https://www.rimmarsa.com/api/upload-vendor-image \
  -F "image=@test.jpg" \
  -F "type=logo"
```

**Expected**: `401 Unauthorized` - "Upload token is required"

---

## 📝 Test Results Checklist

Once testing is complete, verify:

- [ ] **Registration**: 4 images uploaded to R2 successfully
- [ ] **Database**: All image URLs point to R2 (not Supabase)
- [ ] **Display**: Images load correctly in browser
- [ ] **Admin**: Can view and upload images via admin panel
- [ ] **Vendor**: Can login and upload product images
- [ ] **Products**: Product images display on storefront
- [ ] **Security**: Token system works, rate limiting active
- [ ] **Performance**: Images load quickly from R2
- [ ] **Console**: No CORS or 404 errors

---

## 🎉 Migration Success!

If all tests pass:
- ✅ R2 migration is complete and working
- ✅ No more Supabase Storage usage
- ✅ Better performance and lower costs
- ✅ Secure token-based uploads
- ✅ Proper file validation and rate limiting

**Next Steps**: Monitor R2 usage in Cloudflare dashboard and remove old Supabase Storage bucket if no longer needed.
