# Scripts Directory

This directory contains all automation scripts for the Rimmarsa project.

## Directory Structure

```
scripts/
├── mobile-app/      # Mobile app build, deploy, and upload scripts
├── marketplace/     # Marketplace deployment scripts
├── database/        # Database setup and migration scripts
├── setup/           # Project setup and initialization scripts
├── QUICK-UPLOAD-V1.3.0.sh    # Quick APK upload to R2
├── UPLOAD-APK-TO-R2.sh       # APK upload utility
├── check-domain.sh           # Domain verification script
└── fix-vercel-deploy.js      # Vercel deployment fix utility
```

## Script Categories

### Mobile App Scripts (`mobile-app/`)

Build, deployment, and distribution scripts for the React Native mobile app:

- `quick-build.sh` - Fast development build
- `BUILD-APK-LOCALLY-NO-EAS.sh` - Build APK without EAS
- `auto-build-and-deploy.sh` - Automated build and deploy pipeline
- `INSTALL-ANDROID-SDK.sh` - Android SDK installation helper
- `FRESH-BUILD.sh` - Clean build from scratch
- `DEPLOY-COMPLETE.sh` - Complete deployment workflow
- `BUILD-APK-NO-DEVICE.sh` - Build without connected device
- `BUILD-SIMPLE.sh` - Simplified build process
- `SUPER-SIMPLE-BUILD.sh` - Minimal build configuration
- `ONE-COMMAND-BUILD.sh` - Single command build
- `update-async-storage.sh` - Update AsyncStorage configuration
- `DEPLOY.sh` - Standard deployment script
- `BUILD-LOCAL.sh` - Local build script
- `BUILD-LOCAL-APK.sh` - Local APK build
- `verify-security.sh` - Security verification checks
- `build-and-upload.sh` - Build and upload to R2
- `upload-to-supabase.js` - Upload APK to Supabase Storage
- `upload-with-service-key.js` - Upload with service account
- `upload_apk.py` - Python APK upload script
- `upload-apk.js` - JavaScript APK upload script

### Marketplace Scripts (`marketplace/`)

Deployment and management scripts for the Next.js marketplace:

- `DEPLOY-NOW.sh` - Deploy marketplace to Vercel

### Database Scripts (`database/`)

Database setup, migration, and maintenance scripts:

- `setup-database.js` - Initialize database schema
- `update-db-v1.6.0.js` - Version 1.6.0 database migration
- `insert-version-1.2.0.sql` - Version 1.2.0 data migration

### Setup Scripts (`setup/`)

Project initialization and environment setup:

- `setup-rimmarsa.sh` - Complete project setup script

## Usage Guidelines

### Running Shell Scripts

```bash
# Make script executable (if needed)
chmod +x scripts/mobile-app/quick-build.sh

# Run script
./scripts/mobile-app/quick-build.sh
```

### Running Node.js Scripts

```bash
# Run from project root
node scripts/database/setup-database.js
```

### Running Python Scripts

```bash
# Ensure Python 3 and dependencies are installed
python3 scripts/mobile-app/upload_apk.py
```

## Common Tasks

### Build Mobile App

```bash
# Quick development build
./scripts/mobile-app/quick-build.sh

# Production build
./scripts/mobile-app/build-and-upload.sh
```

### Deploy Marketplace

```bash
# Deploy to Vercel
./scripts/marketplace/DEPLOY-NOW.sh
```

### Setup Database

```bash
# Initialize database
node scripts/database/setup-database.js

# Apply migration
node scripts/database/update-db-v1.6.0.js
```

### Upload APK to R2

```bash
# Quick upload
./scripts/QUICK-UPLOAD-V1.3.0.sh

# Full upload process
./scripts/UPLOAD-APK-TO-R2.sh
```

## Best Practices

1. **Always run scripts from the project root** unless documented otherwise
2. **Check script permissions** before running (chmod +x if needed)
3. **Review environment variables** required by each script
4. **Test in development** before running production scripts
5. **Keep credentials secure** - never commit API keys or passwords

## Dependencies

### Required Tools

- **Node.js** 18+ (for .js scripts)
- **Python** 3.8+ (for .py scripts)
- **Bash** 4+ (for .sh scripts)
- **Git** (for version control)

### Optional Tools

- **Android SDK** (for mobile builds)
- **Expo CLI** (for React Native development)
- **Vercel CLI** (for deployments)

## Troubleshooting

### Script Permission Denied

```bash
chmod +x scripts/path/to/script.sh
```

### Node.js Module Not Found

```bash
npm install
```

### Python Dependencies Missing

```bash
pip3 install -r requirements.txt
```

## Maintenance

- **Review scripts quarterly** for obsolete automation
- **Update documentation** when adding new scripts
- **Archive unused scripts** to `docs/archive/`
- **Test scripts** after major dependency updates

## Related Documentation

- [Development Quick Start](/docs/development/QUICK-START.md)
- [Deployment Guide](/docs/deployment/README.md)
- [CI/CD Workflows](/.github/workflows/)

---

**Last Updated:** 2025-10-27
**Maintained By:** Development Team
