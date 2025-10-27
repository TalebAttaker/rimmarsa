# Admin Dashboard Fix - R2 Migration Compatibility

## Executive Summary

Fixed critical admin dashboard authentication issues after R2 migration. The problem was NOT R2-related - images were already using R2 URLs. The actual issue was admin pages using client-side Supabase client instead of secure admin API routes.

## Problem Analysis

### Root Cause
1. Admin vendor-requests page was using `createClient()` (anon client) to query database
2. Anon client doesn't have permissions for admin operations
3. This caused 401/403 errors when fetching vendor requests
4. Admin authentication uses HttpOnly cookies, but client-side queries don't use them

### Why R2 Was Not The Issue
- Vendor registration already uploads images to R2 via `/api/upload-vendor-image`
- Database stores R2 URLs directly (`nni_image_url`, `personal_image_url`, etc.)
- No Supabase Storage references in admin code
- Images display correctly once data is fetched

## Changes Made

### 1. New Admin API Route: `/api/admin/vendors/requests`

**File**: `/home/taleb/rimmarsa/marketplace/src/app/api/admin/vendors/requests/route.ts`

**Features**:
- **GET**: Fetch all vendor requests with regions/cities data
- **PATCH**: Update requests (reject with reason, reset password)
- Requires admin authentication via `requireAdmin()` middleware
- Returns R2 image URLs from database

**Security**:
- Admin token validation via HttpOnly cookies
- Role-based access control
- Input validation (password format, rejection reason)
- Audit logging (reviewed_by, reviewed_at)

### 2. Updated Vendor Requests Page

**File**: `/home/taleb/rimmarsa/marketplace/src/app/fassalapremierprojectbsk/vendor-requests/page.tsx`

**Changes**:
1. Removed direct Supabase client usage (`createClient()`)
2. Updated `fetchRequests()` to use `/api/admin/vendors/requests` with `credentials: 'include'`
3. Updated `handleReject()` to use PATCH API with action='reject'
4. Updated `handleResetPassword()` to use PATCH API with action='reset_password'
5. Updated `handleApprove()` to include `credentials: 'include'`
6. Added auto-redirect to login on 401/403 errors

### 3. API Request Pattern

All admin operations now use this pattern:

```typescript
const response = await fetch('/api/admin/vendors/requests', {
  method: 'GET', // or PATCH, POST
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // CRITICAL: Include HttpOnly cookies
  body: JSON.stringify(data) // if needed
})

if (!response.ok) {
  if (response.status === 401 || response.status === 403) {
    // Session expired - redirect to login
    localStorage.removeItem('admin')
    localStorage.removeItem('loginTime')
    router.push('/fassalapremierprojectbsk/login')
    return
  }
  throw new Error(data.error)
}
```

## Admin Workflow (After Fix)

### 1. Admin Login
- POST `/api/admin/login` with email/password
- Server sets HttpOnly cookies: `sb-admin-token`, `sb-admin-refresh-token`
- Client stores admin data in localStorage (for UI only)
- Redirect to dashboard

### 2. View Vendor Requests
- GET `/api/admin/vendors/requests` (with cookies)
- Server validates admin token from cookies
- Returns all vendor requests with R2 image URLs
- Display images, payment proofs, NNI documents

### 3. Reset Vendor Password
- PATCH `/api/admin/vendors/requests` with action='reset_password'
- Validates password format (8+ chars, letters + numbers)
- Updates vendor_requests.password field

### 4. Reject Vendor
- PATCH `/api/admin/vendors/requests` with action='reject'
- Requires rejection_reason
- Sets status='rejected', reviewed_at, reviewed_by

### 5. Approve Vendor
- POST `/api/admin/vendors/approve`
- Creates auth.users record
- Creates vendors table record
- Creates subscription_history record
- Handles referrals
- Uses R2 image URLs from vendor_request

## Image Flow (R2)

### Vendor Registration
1. Vendor submits registration form
2. Frontend requests upload token: POST `/api/vendor/request-upload-token`
3. Frontend uploads images: POST `/api/upload-vendor-image` (with token)
4. R2 returns public URL: `https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev/nni/123456.jpg`
5. Frontend stores R2 URL in form state
6. Form submission saves R2 URLs to `vendor_requests` table

### Admin Approval
1. Admin fetches vendor requests (R2 URLs already in database)
2. Images display using R2 URLs: `<img src={request.nni_image_url} />`
3. On approval, R2 URLs copied from `vendor_requests` to `vendors` table:
   - `nni_image_url` → `vendors.nni_image_url`
   - `personal_image_url` → `vendors.personal_picture_url`
   - `store_image_url` → `vendors.banner_url`
   - `payment_screenshot_url` → `subscription_history.payment_screenshot_url`

## Security Improvements

### 1. API-Based Admin Operations
- All database operations via authenticated API routes
- No client-side admin queries using anon key
- Prevents privilege escalation

### 2. Token-Based Authentication
- HttpOnly cookies prevent XSS attacks
- Automatic token validation on every request
- Session expiry handling with auto-redirect

### 3. Input Validation
- Password format validation (regex)
- Rejection reason required
- Action whitelist (reject, reset_password)

### 4. Audit Logging
- All rejections log: reviewed_by, reviewed_at
- All approvals log: reviewed_by, approved_at
- Helps track admin actions

## Testing Checklist

- [x] TypeScript compilation (no errors)
- [x] Next.js build successful
- [ ] Admin login flow
- [ ] View vendor requests (with images)
- [ ] Reset vendor password
- [ ] Reject vendor request
- [ ] Approve vendor request
- [ ] Verify images display (R2 URLs)
- [ ] Check network requests include cookies
- [ ] Test session expiry redirect

## Deployment Steps

1. **Build**: `npm run build` (completed, successful)
2. **Commit**: Git commit with descriptive message
3. **Deploy**: Push to production (Vercel auto-deploy)
4. **Verify**: Test admin login and vendor request workflow
5. **Monitor**: Check Vercel logs for any errors

## Additional Notes

### Other Admin Pages (Future Work)
The following admin pages still use direct Supabase client queries:
- `/fassalapremierprojectbsk/dashboard/page.tsx` - counts vendors/products
- `/fassalapremierprojectbsk/vendors/page.tsx` - CRUD operations
- `/fassalapremierprojectbsk/referrals/page.tsx`
- `/fassalapremierprojectbsk/cities/page.tsx`
- `/fassalapremierprojectbsk/regions/page.tsx`

These should be refactored to use admin API routes for consistency and security.

### Database Schema (R2 URLs)
```sql
-- vendor_requests table
nni_image_url TEXT           -- R2 URL
personal_image_url TEXT      -- R2 URL
store_image_url TEXT         -- R2 URL
payment_screenshot_url TEXT  -- R2 URL

-- vendors table
nni_image_url TEXT           -- R2 URL
personal_picture_url TEXT    -- R2 URL
banner_url TEXT              -- R2 URL
logo_url TEXT                -- R2 URL

-- subscription_history table
payment_screenshot_url TEXT  -- R2 URL
```

## Files Modified

1. **Created**: `/home/taleb/rimmarsa/marketplace/src/app/api/admin/vendors/requests/route.ts`
   - New admin API route for vendor request operations

2. **Modified**: `/home/taleb/rimmarsa/marketplace/src/app/fassalapremierprojectbsk/vendor-requests/page.tsx`
   - Removed direct Supabase client usage
   - All operations now use admin API routes
   - Added credentials: 'include' for cookie auth
   - Added session expiry handling

## Success Criteria

- Admin can login without errors
- Admin can view all vendor requests with images
- Images load correctly from R2 URLs
- Admin can reset vendor passwords
- Admin can reject vendor requests with reason
- Admin can approve vendors and create accounts
- All operations properly authenticated
- Session expiry redirects to login

## R2 Configuration (No Changes Needed)

```env
R2_ACCOUNT_ID=932136e1e064884067a65d0d357297cf
R2_ACCESS_KEY_ID=d4963dcd29796040ac1062c4e6e59936
R2_SECRET_ACCESS_KEY=7a9b56cea689661dbd115769c3fb371122080706b02ff674ddc686280bf81805
R2_BUCKET_NAME=rimmarsa-vendor-images
R2_PUBLIC_URL=https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev
```

All R2 configuration remains unchanged. Images are already using R2.

---

**Fix Date**: 2025-10-27
**Issue**: Admin dashboard 401 errors after R2 migration
**Root Cause**: Client-side Supabase queries instead of admin API routes
**Resolution**: Created admin API routes, updated vendor-requests page
**Status**: READY FOR DEPLOYMENT
