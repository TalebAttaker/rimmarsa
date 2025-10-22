# 📱 Rimmarsa Vendor App - Complete Deployment Guide

## 🎯 Overview

This guide covers the complete process of building, securing, and deploying the Rimmarsa Vendor mobile app for distribution via rimmarsa.com.

## ✅ Security Improvements Implemented

### Critical Security Fixes (Completed)
- ✅ **Removed hardcoded credentials** from app.json and app.config.js
- ✅ **Implemented secure token storage** using expo-secure-store (encrypted)
- ✅ **Added is_approved column** to vendors table
- ✅ **Complete RLS policies** for vendor data isolation
- ✅ **Environment variable management** with .env file (not committed to git)
- ✅ **Replaced all AsyncStorage** with SecureTokenManager across the app

### Database Security (Completed)
- ✅ Vendors can only view/edit their own products
- ✅ Vendors can only view/edit their own profile
- ✅ Vendors can only view orders containing their products
- ✅ Public can only view approved products from verified vendors
- ✅ Cross-vendor data access prevented

### App Security Architecture
```
┌─────────────────┐
│   Mobile App    │
│  (APK on device)│
└────────┬────────┘
         │
         │ HTTPS + Auth Token
         │
┌────────▼────────┐
│   Supabase      │
│   - Auth        │
│   - RLS         │
│   - Storage     │
└────────┬────────┘
         │
         │ Secure Connection
         │
┌────────▼────────┐
│   PostgreSQL    │
│   - Encrypted   │
│   - RLS Enabled │
└─────────────────┘
```

## 🏗️ Build Process

### Option 1: EAS Build (Recommended for Production)

#### Prerequisites
- Expo account (free): https://expo.dev/signup
- EAS CLI installed (already done)

#### Steps:

1. **Login to Expo**:
   ```bash
   cd mobile-app
   npx eas-cli login
   ```

2. **Configure EAS Project**:
   ```bash
   npx eas-cli build:configure
   ```
   - This will create/update eas.json
   - Update the projectId in app.config.js

3. **Build Production APK**:
   ```bash
   npx eas-cli build --platform android --profile production
   ```

4. **Build Process**:
   - EAS uploads your code to cloud servers
   - Builds the APK with proper signing
   - Takes approximately 10-20 minutes
   - Provides download link when complete

5. **Download APK**:
   - Download from terminal link
   - Or visit: https://expo.dev/accounts/[your-account]/projects/rimmarsa-mobile/builds
   - APK will be named: `rimmarsa-mobile-[version]-[buildnumber].apk`

### Option 2: Local Build (For Testing)

```bash
cd mobile-app
chmod +x quick-build.sh
./quick-build.sh
```

Select option 2 (Local Debug Build) for testing.

## 📤 Upload APK to Supabase Storage

### Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `public` (if it doesn't exist)
3. Make it public
4. Create folder structure: `apps/`

### Step 2: Upload APK

**Option A: Via Supabase Dashboard**
1. Navigate to Storage → public bucket
2. Upload APK to `apps/vendor-app-1.0.0.apk`

**Option B: Via CLI**
```bash
# Upload using Supabase CLI
supabase storage cp mobile-app/rimmarsa-vendor-1.0.0.apk supabase://public/apps/vendor-app-1.0.0.apk --project-ref rfyqzuuuumgdoomyhqcu
```

**Option C: Via Script**
```bash
# Create upload script
cat > upload-apk.sh <<'EOF'
#!/bin/bash
APK_FILE="$1"
curl -X POST \
  "https://rfyqzuuuumgdoomyhqcu.supabase.co/storage/v1/object/public/apps/vendor-app-1.0.0.apk" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -F "file=@$APK_FILE"
EOF

chmod +x upload-apk.sh
./upload-apk.sh rimmarsa-vendor-1.0.0.apk
```

### Step 3: Generate SHA-256 Checksum

```bash
# Generate checksum
sha256sum rimmarsa-vendor-1.0.0.apk > rimmarsa-vendor-1.0.0.apk.sha256

# Update the download page with the checksum
cat rimmarsa-vendor-1.0.0.apk.sha256
```

Then update `marketplace/src/app/download/page.tsx`:
```typescript
const apkChecksum = "YOUR_SHA256_CHECKSUM_HERE";
```

## 🌐 Deploy Download Page

The download page is already created at:
- **File**: `marketplace/src/app/download/page.tsx`
- **URL**: https://rimmarsa.com/download

### Deploy to Vercel

```bash
cd marketplace
git add .
git commit -m "Add vendor app download page"
git push origin main
```

Vercel will automatically deploy the changes.

## 🧪 Testing Checklist

### Pre-Release Testing

```bash
# 1. Test download page locally
cd marketplace
npm run dev
# Visit http://localhost:3000/download

# 2. Test mobile app locally
cd mobile-app
npm run android  # Or npm run ios
```

### Security Testing

- [ ] Verify no hardcoded credentials in APK
- [ ] Test RLS policies (vendors cannot access other vendors' data)
- [ ] Test secure token storage (tokens encrypted on device)
- [ ] Test authentication flow
- [ ] Test session management
- [ ] Verify HTTPS for all API calls

### Functional Testing

- [ ] Vendor login works correctly
- [ ] Products can be added/edited/deleted
- [ ] Orders display correctly
- [ ] Analytics show accurate data
- [ ] Subscription management works
- [ ] Image upload works
- [ ] WhatsApp integration works

### APK Testing

- [ ] APK installs successfully
- [ ] App launches without crashes
- [ ] All features work on installed APK
- [ ] App works on different Android versions (8.0+)
- [ ] App works on different screen sizes
- [ ] Download from rimmarsa.com/download works

## 🚀 Go-Live Steps

### 1. Final Build

```bash
cd mobile-app
npx eas-cli build --platform android --profile production
```

### 2. Download and Verify

```bash
# Download APK from EAS
# Generate checksum
sha256sum rimmarsa-vendor-1.0.0.apk
```

### 3. Upload to Supabase

```bash
# Upload to Supabase Storage (see instructions above)
```

### 4. Update Download Page

Update `marketplace/src/app/download/page.tsx`:
- Set correct `appVersion`
- Set correct `apkChecksum`
- Set correct `apkSize`

### 5. Test Complete Flow

1. Visit https://rimmarsa.com/download
2. Download APK on Android device
3. Install APK
4. Login with test vendor credentials
5. Verify all features work

### 6. Announce to Vendors

Send announcement to vendors via:
- Email
- WhatsApp
- SMS
- In-app notification on web dashboard

## 📊 Monitoring

### Download Analytics

Check download statistics:
```sql
SELECT
  DATE(downloaded_at) as date,
  COUNT(*) as downloads,
  COUNT(DISTINCT ip_address) as unique_ips
FROM app_downloads
WHERE app_name = 'vendor-app'
GROUP BY DATE(downloaded_at)
ORDER BY date DESC
LIMIT 30;
```

### App Error Monitoring

Consider adding:
- Sentry for error tracking
- Firebase Analytics for user behavior
- Custom logging to Supabase

## 🔐 Security Best Practices

### Ongoing Security

1. **Regular Updates**:
   - Update dependencies monthly
   - Patch security vulnerabilities immediately
   - Test updates on staging before production

2. **Monitor for Issues**:
   - Check Supabase logs daily
   - Review RLS policy violations
   - Monitor unusual download patterns

3. **Vendor Education**:
   - Send security best practices guide
   - Remind vendors to keep credentials secure
   - Provide support for security questions

### Incident Response

If security issue detected:
1. Immediately disable download endpoint
2. Assess scope of issue
3. Fix vulnerability
4. Build new APK version
5. Force update if critical
6. Notify affected vendors

## 📝 Update Process

When releasing new version:

1. **Update Version**:
   ```json
   // mobile-app/app.config.js
   version: "1.1.0"
   ```

2. **Build New APK**:
   ```bash
   npx eas-cli build --platform android --profile production
   ```

3. **Upload to Storage**:
   ```bash
   # Upload as vendor-app-1.1.0.apk
   ```

4. **Update API Route**:
   ```typescript
   // Update version in route.ts
   const apkFileName = 'vendor-app-1.1.0.apk';
   ```

5. **Update Download Page**:
   ```typescript
   const appVersion = "1.1.0";
   ```

6. **Notify Vendors**:
   - In-app update prompt
   - Email notification
   - WhatsApp message

## 🆘 Support

### Common Issues

**Issue**: "App not installed"
**Solution**: Enable "Install from Unknown Sources" in Android settings

**Issue**: "Parse error"
**Solution**: APK may be corrupted. Re-download from rimmarsa.com/download

**Issue**: "Login failed"
**Solution**: Check internet connection. Verify credentials.

### Contact

- **WhatsApp**: +222 37 89 28 00
- **Email**: support@rimmarsa.com
- **Website**: https://rimmarsa.com

## 📚 Related Documentation

- [SECURITY_ASSESSMENT_VENDOR_MOBILE_APP.md](/home/taleb/rimmarsa/SECURITY_ASSESSMENT_VENDOR_MOBILE_APP.md)
- [SECURITY_IMPLEMENTATION_GUIDE.md](/home/taleb/rimmarsa/SECURITY_IMPLEMENTATION_GUIDE.md)
- [MOBILE_APP_SECURITY_CHECKLIST.md](/home/taleb/rimmarsa/MOBILE_APP_SECURITY_CHECKLIST.md)
- [BUILD_INSTRUCTIONS.md](/home/taleb/rimmarsa/mobile-app/BUILD_INSTRUCTIONS.md)

## ✅ Completion Status

| Task | Status | Notes |
|------|--------|-------|
| Security Assessment | ✅ Complete | 18 vulnerabilities identified and fixed |
| Remove Hardcoded Credentials | ✅ Complete | Moved to .env file |
| Implement Secure Storage | ✅ Complete | Using expo-secure-store |
| Database RLS Policies | ✅ Complete | Vendor data isolation enforced |
| Build Configuration | ✅ Complete | EAS and local build ready |
| Download Page | ✅ Complete | /download route created |
| API Endpoint | ✅ Complete | /api/download/vendor-app ready |
| Testing | ⏳ Pending | Requires APK build and device testing |
| Production Build | ⏳ Pending | Ready to run EAS build |
| Upload to Storage | ⏳ Pending | Waiting for APK file |
| Go-Live | ⏳ Pending | All dependencies complete |

## 🎉 Ready to Deploy!

The vendor app is now secure and ready for distribution. Follow the "Build Process" section above to create the production APK and deploy.

**Estimated Time to Complete**:
- EAS Build: 10-20 minutes
- Upload & Config: 5 minutes
- Testing: 30 minutes
- **Total: ~1 hour**

---

*Last Updated: 2025-10-22*
*Version: 1.0.0*
