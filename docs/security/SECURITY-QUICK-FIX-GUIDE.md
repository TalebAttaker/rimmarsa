# Rimmarsa Security - Quick Fix Guide

**URGENT:** Fix these 2 critical issues BEFORE launching to production

---

## 🔴 CRITICAL FIX #1: R2 Credentials (30 minutes)

### Step 1: Rotate R2 Credentials (10 min)
```bash
# 1. Go to Cloudflare Dashboard
# https://dash.cloudflare.com/

# 2. Navigate to: R2 > Manage R2 API Tokens

# 3. Delete existing token named "rimmarsa-upload"

# 4. Create NEW API token:
#    Name: rimmarsa-upload-v2
#    Permissions: Object Write ONLY (no read)
#    Bucket: rimmarsa-vendor-images
#    
# 5. Copy the NEW credentials:
#    - Account ID
#    - Access Key ID
#    - Secret Access Key
```

### Step 2: Update Code (10 min)
Edit: `/home/taleb/rimmarsa/marketplace/src/app/api/upload-vendor-image/route.ts`

**REMOVE lines 6-10:**
```typescript
// DELETE THIS (lines 6-10):
const R2_ACCOUNT_ID = '932136e1e064884067a65d0d357297cf';
const R2_ACCESS_KEY_ID = 'd4963dcd29796040ac1062c4e6e59936';
const R2_SECRET_ACCESS_KEY = '7a9b56cea689661dbd115769c3fb371122080706b02ff674ddc686280bf81805';
```

**REPLACE with:**
```typescript
// R2 Configuration from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

// Validate credentials exist
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  throw new Error('Missing R2 credentials in environment variables. Check Vercel settings.');
}
```

### Step 3: Add to Vercel (5 min)
```bash
# Option A: Via Vercel Dashboard
# 1. Go to https://vercel.com/rimmarsa/settings/environment-variables
# 2. Add these three variables (Production):
#    R2_ACCOUNT_ID = <your new account id>
#    R2_ACCESS_KEY_ID = <your new access key>
#    R2_SECRET_ACCESS_KEY = <your new secret key>

# Option B: Via Vercel CLI
vercel env add R2_ACCOUNT_ID production
# Paste: <your new account id>

vercel env add R2_ACCESS_KEY_ID production
# Paste: <your new access key>

vercel env add R2_SECRET_ACCESS_KEY production
# Paste: <your new secret key>
```

### Step 4: Deploy (5 min)
```bash
cd /home/taleb/rimmarsa/marketplace
git add src/app/api/upload-vendor-image/route.ts
git commit -m "Security: Remove hardcoded R2 credentials, use env vars"
git push

# Vercel will auto-deploy
# Wait 2-3 minutes for deployment
```

### Step 5: Verify (5 min)
```bash
# Test that credentials work
curl https://rimmarsa.com/api/upload-vendor-image
# Should return: {"status":"ok","message":"Secure vendor image upload endpoint is ready",...}

# Verify no hardcoded credentials remain
grep -r "7a9b56cea689661dbd115769c3fb371122080706b02ff674ddc686280bf81805" /home/taleb/rimmarsa/marketplace/src/
# Should return: (nothing - no results)
```

**Status:** ✅ Fixed when verification passes

---

## 🔴 CRITICAL FIX #2: Security Headers (20 minutes)

### Step 1: Update next.config.js (15 min)
Edit: `/home/taleb/rimmarsa/marketplace/next.config.js`

**REPLACE entire file with:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },

  // SECURITY HEADERS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy (prevents XSS)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev https://*.supabase.co",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://rfyqzuuuumgdoomyhqcu.supabase.co https://pub-6cf3ef49a27d47f7bc38b12620f38013.r2.dev wss://rfyqzuuuumgdoomyhqcu.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },

          // HSTS (force HTTPS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },

          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },

          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },

          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },

          // Disable dangerous browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },

          // Legacy XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  }
};

module.exports = nextConfig;
```

### Step 2: Deploy (3 min)
```bash
cd /home/taleb/rimmarsa/marketplace
git add next.config.js
git commit -m "Security: Add security headers (CSP, HSTS, X-Frame-Options)"
git push

# Wait for Vercel deployment (2-3 minutes)
```

### Step 3: Verify (2 min)
```bash
# Option A: Command line
curl -I https://rimmarsa.com | grep -E "Content-Security-Policy|Strict-Transport|X-Frame-Options|X-Content-Type"

# Should show all 4 headers

# Option B: Online scanner (RECOMMENDED)
# Go to: https://securityheaders.com/
# Enter: https://rimmarsa.com
# Target Score: A or A+
```

**Status:** ✅ Fixed when Grade A or A+ achieved

---

## ✅ Verification Checklist

After completing both fixes:

- [ ] R2 credentials rotated in Cloudflare
- [ ] Hardcoded credentials removed from code
- [ ] Environment variables added to Vercel
- [ ] Upload API endpoint working (test with curl)
- [ ] No hardcoded credentials in source code (grep test passes)
- [ ] Security headers implemented in next.config.js
- [ ] Security headers deployed to production
- [ ] Security headers verified (Grade A or A+ on securityheaders.com)
- [ ] Website still functions correctly
- [ ] Vendor registration works
- [ ] Image uploads work

---

## 🚀 After Fixes Are Complete

1. **Test the application thoroughly:**
   - Create a test vendor account
   - Upload images (NNI, personal, store, payment)
   - Test product creation
   - Test admin login
   - Test vendor approval flow

2. **Read the full security report:**
   - `/home/taleb/rimmarsa/SECURITY-ASSESSMENT-REPORT.md`

3. **Review the complete checklist:**
   - `/home/taleb/rimmarsa/SECURITY-CHECKLIST.md`

4. **Plan for HIGH priority fixes (7-day timeline):**
   - Service role key fallback
   - Rate limiting fail-closed
   - Admin session timeout
   - Enhanced file upload validation
   - Geo-fence improvement

---

## 🆘 If You Need Help

**Common Issues:**

### Issue: "Upload API returns 500 error after fix"
**Solution:** Check Vercel environment variables are set correctly
```bash
# Verify env vars in Vercel Dashboard:
# https://vercel.com/your-project/settings/environment-variables
# Ensure all 3 R2 variables are present and correct
```

### Issue: "Website blocked by CSP after header deployment"
**Solution:** Check browser console for CSP violations
```bash
# In Chrome DevTools (F12), look for CSP errors
# Add allowed domains to CSP policy if needed
```

### Issue: "Can't deploy to Vercel"
**Solution:** Check build logs
```bash
# In Vercel Dashboard, click on deployment
# Check "Build Logs" for errors
# Common issue: Missing env vars
```

---

## 📞 Emergency Contacts

- **Vercel Support:** https://vercel.com/support
- **Cloudflare Support:** https://dash.cloudflare.com/support
- **Supabase Support:** support@supabase.io

---

**Total Time Required:** ~50 minutes
**Difficulty:** Medium
**Risk Level:** Critical - Must be done before production launch

---

**Last Updated:** October 27, 2025
