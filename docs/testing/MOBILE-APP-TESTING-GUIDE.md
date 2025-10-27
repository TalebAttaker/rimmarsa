# Mobile App Testing Guide - R2 Migration (v1.7.0)

**App Version**: 1.7.0
**Build Date**: October 27, 2025
**Migration**: Supabase Storage → Cloudflare R2

---

## 🎯 Testing Objective

Verify that the mobile app (vendor APK) works end-to-end with the new R2 upload system:
1. ✅ Vendor registration with image uploads
2. ✅ Vendor login
3. ✅ Product management with image uploads

**Total Time**: ~20-30 minutes

---

## 📱 Prerequisites

### Install the APK
1. Download latest APK (v1.7.0) from R2 or local build
2. Enable "Install from Unknown Sources" on Android device
3. Install the APK
4. Open the app

### Testing Environment
- **Android Device**: Physical device or emulator
- **Network**: Connected to internet
- **API**: https://www.rimmarsa.com (production)
- **Database**: Supabase (shared with web)

---

## 🧪 Test Suite

### Test 1: Vendor Registration Flow (10-15 min)

**Objective**: Register a new vendor account and upload 4 images to R2

#### Steps:

**1. Launch App & Navigate**
- [ ] Open "ريمارسا - البائع" app
- [ ] Tap on registration screen

**2. Fill Step 1: Business Information**
- [ ] Business name: "Test Vendor Mobile R2"
- [ ] Owner name: "Ahmed Test"
- [ ] Phone: 8 digits (e.g., 12345678)
- [ ] Password: Mix letters + numbers (e.g., "Test1234")
- [ ] WhatsApp: Same or different 8 digits
- [ ] Referral code: (optional)
- [ ] Tap "Next"

**3. Fill Step 2: Location**
- [ ] Select Region (dropdown)
- [ ] Select City (dropdown)
- [ ] Enter Address
- [ ] Tap "Next"

**4. Fill Step 3: Documents (CRITICAL FOR R2 TEST)**
- [ ] Tap "Upload NNI Image"
  - Select photo from gallery or take photo
  - **Watch for progress bar (0-100%)**
  - Success message: "تم تحميل الصورة بنجاح!"
- [ ] Tap "Upload Personal Photo"
  - Select/take photo
  - Watch progress bar
  - Success message
- [ ] Tap "Upload Store Photo"
  - Select/take photo
  - Watch progress bar
  - Success message
- [ ] Tap "Upload Payment Screenshot"
  - Select/take photo
  - Watch progress bar
  - Success message
- [ ] Tap "Next"

**5. Step 4: Payment Plan**
- [ ] Select package (1 month or 2 months)
- [ ] Review information
- [ ] Tap "Submit Registration"
- [ ] See success screen

#### Expected Results:
- ✅ Upload progress shows 0% → 100% for each image
- ✅ Success message appears after each upload
- ✅ No "Upload failed" errors
- ✅ Registration submits successfully
- ✅ Success screen displays

#### Verification (SQL):
```sql
SELECT business_name, nni_image_url, personal_image_url,
       store_image_url, payment_screenshot_url, created_at
FROM vendor_requests
WHERE business_name = 'Test Vendor Mobile R2'
AND created_at > NOW() - INTERVAL '30 minutes'
LIMIT 1;
```

**Check**: All 4 image URLs should start with:
`https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/`

---

### Test 2: Admin Approval (5 min)

**Objective**: Verify admin can approve the mobile registration

#### Steps:

**1. Login to Admin Panel (Web)**
- [ ] Go to: https://www.rimmarsa.com/fassalapremierprojectbsk/login
- [ ] Login with admin credentials

**2. View Pending Request**
- [ ] Navigate to: Vendor Requests
- [ ] Find "Test Vendor Mobile R2"
- [ ] Click to view details

**3. Verify Images Load**
- [ ] NNI image loads from R2 (no 404)
- [ ] Personal photo loads from R2
- [ ] Store photo loads from R2
- [ ] Payment screenshot loads from R2
- [ ] No CORS errors in browser console

**4. Approve Vendor**
- [ ] Click "Approve" button
- [ ] Approval succeeds
- [ ] Success message displays

#### Expected Results:
- ✅ All images load correctly
- ✅ Image URLs use R2 domain
- ✅ No broken images
- ✅ Approval successful

---

### Test 3: Vendor Login (2 min)

**Objective**: Login with approved mobile-registered account

#### Steps:

**1. Return to Mobile App**
- [ ] Close app completely
- [ ] Reopen app

**2. Navigate to Login**
- [ ] Find login screen
- [ ] Enter phone: +222XXXXXXXX (8 digits from Test 1)
- [ ] Enter password: (from Test 1)
- [ ] Tap "Login"

**3. Verify Dashboard**
- [ ] Login succeeds
- [ ] Redirected to vendor dashboard
- [ ] Business name displays
- [ ] Menu/navigation visible

#### Expected Results:
- ✅ Login successful
- ✅ Dashboard loads
- ✅ No authentication errors

---

### Test 4: Add Product with Images (8-10 min)

**Objective**: Create a product with multiple images uploaded to R2

#### Steps:

**1. Navigate to Products**
- [ ] From dashboard, tap "Products" or "منتجات"
- [ ] Tap "Add Product" or "+" button

**2. Fill Product Form**
- [ ] Product name (English): "Test Product Mobile R2"
- [ ] Product name (Arabic): "منتج تجريبي"
- [ ] Category: Select from dropdown
- [ ] Price: 100
- [ ] Description: "Test product for R2"

**3. Add Product Images (CRITICAL FOR R2 TEST)**
- [ ] Tap "Add Images" or camera icon
- [ ] Select 2-3 images from gallery
- [ ] **Watch console/logs for upload progress**
- [ ] Wait for all uploads to complete

**4. Submit Product**
- [ ] Tap "Save Product" or "حفظ"
- [ ] Wait for success message
- [ ] Product appears in list

#### Expected Results:
- ✅ Can select multiple images (up to 6)
- ✅ Upload progress indicators visible
- ✅ Success message: "تم إضافة المنتج بنجاح"
- ✅ Product appears in product list
- ✅ Product images display correctly

#### Verification (SQL):
```sql
SELECT name, images, created_at
FROM products
WHERE name = 'Test Product Mobile R2'
AND created_at > NOW() - INTERVAL '30 minutes'
LIMIT 1;
```

**Check**: The `images` array should contain R2 URLs:
`["https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/product/..."]`

---

### Test 5: Edit Product Images (Optional - 5 min)

**Objective**: Verify editing existing products works

#### Steps:
- [ ] Tap on "Test Product Mobile R2"
- [ ] Tap "Edit"
- [ ] Add one more image
- [ ] Save changes
- [ ] Verify new image appears

#### Expected Results:
- ✅ Can add additional images
- ✅ Upload works
- ✅ Product updates successfully

---

## 🔍 Console Logs to Check

If you have access to Android logs (via `adb logcat`):

### Registration Flow:
```
Upload token acquired for R2 uploads
Uploaded nni to R2: https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/nni/...
Remaining uploads: 3
Uploaded personal to R2: https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/personal/...
Remaining uploads: 2
...
```

### Product Upload:
```
Uploading image 1/3 (33%)
Uploading image 2/3 (66%)
Uploading image 3/3 (100%)
Successfully uploaded 3 images to R2
```

---

## ✅ Success Criteria

### Registration Test
- [x] All 4 images upload successfully
- [x] Progress bars show 0-100%
- [x] Success messages appear in Arabic
- [x] Database contains R2 URLs
- [x] Admin can view images

### Login Test
- [x] Can login with mobile-registered account
- [x] Dashboard loads correctly
- [x] No errors

### Product Test
- [x] Can add product with 2-3 images
- [x] Upload progress visible
- [x] Database contains R2 URLs for product images
- [x] Images display in product list

---

## 🚨 Common Issues & Solutions

### Issue: "Upload token required"
**Cause**: Token request failed or expired
**Solution**:
- Check internet connection
- Verify API URL is accessible
- Try closing and reopening app

### Issue: Images upload fails
**Cause**: File too large or wrong format
**Solution**:
- Ensure images are < 10MB
- Use JPEG, PNG, or WebP only
- Try different image

### Issue: "Login failed"
**Cause**: Account not approved yet
**Solution**:
- Wait for admin approval (Test 2)
- Check vendor_requests table status

### Issue: No progress bar visible
**Cause**: UI rendering issue
**Solution**:
- Progress tracking still works in background
- Check console logs for "Uploading image X/Y"

---

## 📊 Database Verification Queries

Run these after testing to verify R2 URLs:

```sql
-- Check recent mobile registrations
SELECT business_name, nni_image_url, created_at
FROM vendor_requests
WHERE business_name LIKE '%Mobile R2%'
ORDER BY created_at DESC
LIMIT 5;

-- Check approved vendors from mobile
SELECT business_name, phone, is_approved
FROM vendors
WHERE business_name LIKE '%Mobile R2%'
ORDER BY created_at DESC
LIMIT 5;

-- Check products created from mobile
SELECT name, images, created_at
FROM products
WHERE name LIKE '%Mobile R2%'
ORDER BY created_at DESC
LIMIT 5;

-- Verify all URLs use R2 (not Supabase Storage)
SELECT
  COUNT(*) FILTER (WHERE nni_image_url LIKE '%r2.dev%') as r2_urls,
  COUNT(*) FILTER (WHERE nni_image_url LIKE '%supabase%') as supabase_urls
FROM vendor_requests
WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Expected**: `r2_urls > 0` and `supabase_urls = 0`

---

## 📱 Testing on Real Device vs Emulator

### Real Device (Recommended)
**Pros**:
- Accurate camera/gallery access
- Real network conditions
- True user experience

**Cons**:
- Need physical device
- Harder to get console logs

### Android Emulator
**Pros**:
- Easy to access logs
- Can use mock images
- Faster iteration

**Cons**:
- Camera/gallery simulation may differ
- Network may be slower

**Recommendation**: Test on both if possible, prioritize real device for final verification.

---

## 🎯 Test Results Checklist

After completing all tests, mark these:

### Functionality
- [ ] Registration flow works end-to-end
- [ ] All 4 images upload successfully
- [ ] Login works with mobile-registered account
- [ ] Can add products with images
- [ ] Can view products with images

### R2 Integration
- [ ] Database shows R2 URLs (not Supabase)
- [ ] Images load correctly from R2
- [ ] No CORS errors
- [ ] No 404 errors

### User Experience
- [ ] Upload progress bars visible
- [ ] Success messages appear
- [ ] No crashes or freezes
- [ ] Navigation works smoothly

### Performance
- [ ] Upload speed acceptable (< 30s per image)
- [ ] No significant lag
- [ ] App responsive during uploads

---

## 📝 Test Report Template

After testing, fill this out:

```
### Mobile App R2 Migration Test Report
**Date**: [Date]
**Tester**: [Your Name]
**App Version**: 1.7.0
**Device**: [Model]
**Android Version**: [Version]

#### Test Results:
- Registration: [PASS/FAIL]
  - Notes: [Any issues or observations]

- Login: [PASS/FAIL]
  - Notes: [Any issues]

- Product Creation: [PASS/FAIL]
  - Notes: [Any issues]

#### Database Verification:
- R2 URLs in vendor_requests: [YES/NO]
- R2 URLs in products: [YES/NO]
- Sample URL: [Paste one URL]

#### Issues Found:
1. [Describe any issues]
2. [Screenshots if available]

#### Overall Status: [READY FOR PRODUCTION / NEEDS FIXES]
```

---

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Mark mobile app as production-ready
2. ✅ Update app store listing (if applicable)
3. ✅ Notify users of new version
4. ✅ Monitor R2 usage in Cloudflare dashboard

If tests fail:
1. ❌ Document failures
2. ❌ Review console logs
3. ❌ Fix issues in code
4. ❌ Rebuild APK
5. ❌ Retest

---

**Testing Time**: 20-30 minutes
**Difficulty**: Medium
**Prerequisites**: Admin access, Android device
**Success Rate**: Expected 100% (all tests should pass)

**Ready to test! Good luck!** 🚀📱
