# Mobile App Scripts

Build, deployment, and distribution scripts for the Rimmarsa React Native mobile app.

## Build Scripts

### Quick Builds

- **quick-build.sh** - Fast development build for testing
- **BUILD-SIMPLE.sh** - Simplified build with minimal configuration
- **SUPER-SIMPLE-BUILD.sh** - Absolute minimal build setup
- **ONE-COMMAND-BUILD.sh** - Complete build in one command

### Local Builds

- **BUILD-LOCAL.sh** - Standard local build process
- **BUILD-LOCAL-APK.sh** - Build APK locally without cloud services
- **BUILD-APK-LOCALLY-NO-EAS.sh** - Build without Expo Application Services
- **BUILD-APK-NO-DEVICE.sh** - Build without requiring connected Android device

### Production Builds

- **FRESH-BUILD.sh** - Clean build from scratch (removes all caches)
- **build-and-upload.sh** - Complete build and upload to R2 storage

## Deployment Scripts

- **DEPLOY.sh** - Standard deployment workflow
- **DEPLOY-COMPLETE.sh** - Complete deployment with all checks
- **auto-build-and-deploy.sh** - Automated CI/CD pipeline

## Upload Scripts

### JavaScript

- **upload-apk.js** - Upload APK to Cloudflare R2
- **upload-to-supabase.js** - Upload APK to Supabase Storage
- **upload-with-service-key.js** - Upload using service account credentials

### Python

- **upload_apk.py** - Python-based APK upload utility

## Setup & Utilities

- **INSTALL-ANDROID-SDK.sh** - Install and configure Android SDK
- **update-async-storage.sh** - Update React Native AsyncStorage configuration
- **verify-security.sh** - Run security checks before deployment

## Common Workflows

### Development Build

```bash
# Quick build for testing
./scripts/mobile-app/quick-build.sh
```

### Production Release

```bash
# Complete production build and deploy
./scripts/mobile-app/build-and-upload.sh
```

### Manual APK Upload

```bash
# Upload pre-built APK
node scripts/mobile-app/upload-apk.js
```

## Prerequisites

### Required

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android SDK (or use INSTALL-ANDROID-SDK.sh)

### Environment Variables

Create `.env` in mobile-app directory:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
CLOUDFLARE_R2_ENDPOINT=your_r2_endpoint
CLOUDFLARE_R2_ACCESS_KEY=your_access_key
CLOUDFLARE_R2_SECRET_KEY=your_secret_key
```

## Build Types Explained

### EAS vs Local Builds

- **EAS (Expo Application Services)**: Cloud-based builds, requires Expo account
- **Local Builds**: Build on your machine, requires Android SDK

### When to Use Each Build Script

| Script | Use Case | Speed | Requirements |
|--------|----------|-------|--------------|
| quick-build.sh | Development testing | Fast | Minimal |
| BUILD-SIMPLE.sh | Development | Medium | Android SDK |
| BUILD-LOCAL-APK.sh | Testing production locally | Medium | Android SDK |
| build-and-upload.sh | Production release | Slow | Full environment |
| FRESH-BUILD.sh | After major changes | Slowest | Full environment |

## Troubleshooting

### Build Fails

```bash
# Clear all caches and rebuild
./scripts/mobile-app/FRESH-BUILD.sh
```

### Upload Fails

```bash
# Verify credentials
cat .env | grep -E "(CLOUDFLARE|SUPABASE)"

# Check APK exists
ls -lh mobile-app/dist/*.apk
```

### Android SDK Missing

```bash
# Install Android SDK
./scripts/mobile-app/INSTALL-ANDROID-SDK.sh
```

## Security Notes

- Never commit `.env` files
- Use service keys for CI/CD only
- Verify APK signature before distribution
- Run security checks: `./verify-security.sh`

## Related Documentation

- [Mobile App Architecture](/docs/architecture/CURRENT-STATE.md#mobile-vendor-app)
- [Deployment Guide](/docs/deployment/README.md)
- [Security Guidelines](/docs/security/README.md)

---

**Last Updated:** 2025-10-27
