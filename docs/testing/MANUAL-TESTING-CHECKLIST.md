# Quick Manual Testing Checklist

**Keep this open while testing**: Press F12 → Console tab to see logs

---

## Test 1: Vendor Registration (5-10 minutes)

**URL**: https://www.rimmarsa.com/vendor-registration

**Steps**:
1. [ ] Fill all 4 steps of registration form
2. [ ] Upload 4 images (NNI, personal, store, payment)
3. [ ] Watch console for: "Uploaded {type} to R2: https://pub-..."
4. [ ] Submit form
5. [ ] See success message

**Check Console For**:
```
✓ Upload token acquired for R2 uploads
✓ Uploaded nni to R2: https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/nni/...
✓ Remaining uploads: 3
```

**SQL Verification** (run after):
```sql
SELECT business_name, nni_image_url, personal_image_url
FROM vendor_requests
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC LIMIT 1;
```

---

## Test 2: Admin Approval (3-5 minutes)

**URL**: https://www.rimmarsa.com/fassalapremierprojectbsk/login

**Steps**:
1. [ ] Login to admin panel
2. [ ] Go to Vendor Requests
3. [ ] Click on pending request from Test 1
4. [ ] Verify all 4 images load (no broken images)
5. [ ] Click "Approve"

**Check**: Images should load from `https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/`

---

## Test 3: Admin Upload Logo (2 minutes)

**URL**: Admin Panel → Vendors

**Steps**:
1. [ ] Click "Edit" on any vendor
2. [ ] Upload new logo
3. [ ] Watch console for R2 URL
4. [ ] Save
5. [ ] Image displays immediately

**Check Console For**:
```
✓ Logo uploaded to R2 successfully!
✓ URL: https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/logo/...
```

---

## Test 4: Vendor Login (1 minute)

**URL**: https://www.rimmarsa.com/vendor/login

**Steps**:
1. [ ] Use phone from Test 1: +222XXXXXXXX
2. [ ] Use password from Test 1
3. [ ] Click login
4. [ ] Redirected to dashboard

---

## Test 5: Product Images (5 minutes)

**URL**: Vendor Dashboard → Products → Add Product

**Steps**:
1. [ ] Fill product form (name, category, price)
2. [ ] Upload 2-3 images
3. [ ] Watch console for: "Uploading image 1/3 (33%)"
4. [ ] Click "Save Product"
5. [ ] Product created successfully

**Check Console For**:
```
✓ Uploading image 1/3 (33%)
✓ Uploading image 2/3 (66%)
✓ Uploading image 3/3 (100%)
✓ Successfully uploaded 3 images to R2
```

**SQL Verification**:
```sql
SELECT name, images
FROM products
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC LIMIT 1;
```

---

## Quick SQL Checks

Run these in Supabase SQL editor after testing:

```sql
-- Check recent vendor requests have R2 URLs
SELECT business_name, nni_image_url
FROM vendor_requests
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC LIMIT 5;

-- Check recent vendors have R2 logo URLs
SELECT business_name, logo_url
FROM vendors
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC LIMIT 5;

-- Check recent products have R2 image URLs
SELECT name, images[1] as first_image
FROM products
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC LIMIT 5;
```

---

## ✅ Success Indicators

**You should see**:
- ✅ Upload progress bars (0-100%)
- ✅ Console logs with R2 URLs
- ✅ Arabic success messages: "تم تحميل الصورة بنجاح!"
- ✅ Images display immediately after upload
- ✅ No CORS errors
- ✅ No 404 errors
- ✅ All URLs start with: `https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/`

**You should NOT see**:
- ❌ Supabase Storage URLs in console
- ❌ Upload errors
- ❌ Broken image placeholders
- ❌ CORS errors in console
- ❌ 404 errors when images load

---

## 🚨 If Something Fails

**Issue**: Upload fails
→ Check console for error message
→ Verify file is JPEG/PNG/WebP under 10MB
→ Check token was generated

**Issue**: Images don't load
→ Check image URL starts with R2 domain
→ Check browser network tab for 404s
→ Verify R2 bucket is public

**Issue**: Token errors
→ Check token endpoint: `curl https://www.rimmarsa.com/api/vendor/request-upload-token`
→ Wait if rate limited (5 tokens per hour max)

---

## 📊 Estimated Testing Time

- Test 1 (Registration): 5-10 min
- Test 2 (Admin approval): 3-5 min
- Test 3 (Admin upload): 2 min
- Test 4 (Vendor login): 1 min
- Test 5 (Product images): 5 min

**Total**: ~15-25 minutes

---

## 📝 Report Back

After testing, provide:
1. Which tests passed ✅
2. Which tests failed ❌
3. Any error messages from console
4. SQL query results showing R2 URLs

**All set! Ready to start testing?** 🚀
