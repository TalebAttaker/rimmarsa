# Rimmarsa Project Structure

**Last Updated:** 2025-10-27
**Status:** Post Week 2 Organization

---

## Root Directory

```
rimmarsa/
├── README.md              # Comprehensive project overview
├── package.json           # Root dependencies
├── package-lock.json      # Lock file
├── .gitignore             # Enhanced with 80+ patterns
│
├── docs/                  # All documentation (organized Week 1)
├── scripts/               # All automation scripts (organized Week 2)
├── marketplace/           # Next.js 15 web marketplace
├── mobile-app/            # React Native vendor app
├── admin-dashboard/       # React admin panel
├── vendor-dashboard/      # React vendor panel
├── supabase/              # Database migrations & functions
└── .github/               # CI/CD workflows
```

---

## Documentation Structure (`/docs/`)

```
docs/
├── README.md                    # Documentation navigation hub
├── WEEK1-COMPLETION.md          # Week 1 summary
├── WEEK-2-ORGANIZATION.md       # Week 2 summary
│
├── architecture/                # System architecture (3 files)
│   ├── SPECIFICATION.md         # Complete technical specification
│   ├── CURRENT-STATE.md         # Current system architecture
│   └── DATABASE.md              # Database schema & RLS policies
│
├── security/                    # Security documentation (13 files)
│   ├── SECURITY_README.md       # Security overview
│   ├── SECURITY-CHECKLIST.md    # Pre-deployment checklist
│   ├── SECURITY-UPGRADE-V1.6.0.md
│   ├── SECURITY-FIXES-IMPLEMENTED.md
│   ├── SECURITY-FIXES.json
│   ├── WEEK-2-SECURITY-FIXES.md
│   └── ... (7 more)
│
├── development/                 # Development guides (11 files)
│   ├── QUICK-START.md           # 15-minute developer setup
│   ├── CODE-STANDARDS.md        # Coding guidelines
│   ├── REFACTOR-PLAN.md         # Refactoring roadmap
│   ├── REORGANIZATION-PLAN.md   # Project reorganization plan
│   ├── tasks.json               # Development task tracking
│   ├── refactor-tasks.json      # Refactoring tasks
│   ├── WEEK-2-REFACTORING.md
│   ├── CODE-QUALITY-METRICS-WEEK2.md
│   └── ... (3 more)
│
├── deployment/                  # Deployment guides (19 files)
│   ├── BUILD_APK_INSTRUCTIONS.md
│   ├── VERCEL_DEPLOYMENT.md
│   ├── V1.5.0-RELEASE-NOTES.md
│   └── ... (16 more)
│
├── testing/                     # Testing documentation (4 files)
│   ├── MANUAL-TESTING-CHECKLIST.md
│   ├── MOBILE-APP-TESTING-GUIDE.md
│   └── ... (2 more)
│
└── archive/                     # Historical documentation (26 files)
    ├── WEEK-1-COMPLETE-SUMMARY.md
    ├── WEEK-2-FILE-INVENTORY.md
    └── ... (24 more)
```

**Total Documentation Files:** 76 files organized into 6 categories

---

## Scripts Structure (`/scripts/`)

```
scripts/
├── README.md                    # Complete scripts reference guide
│
├── mobile-app/                  # Mobile app automation (20 files)
│   ├── README.md                # Mobile scripts guide
│   │
│   ├── Build Scripts (15):
│   ├── quick-build.sh           # Fast development build
│   ├── BUILD-SIMPLE.sh          # Simplified build
│   ├── BUILD-LOCAL.sh           # Standard local build
│   ├── BUILD-LOCAL-APK.sh       # Local APK build
│   ├── BUILD-APK-LOCALLY-NO-EAS.sh
│   ├── BUILD-APK-NO-DEVICE.sh
│   ├── SUPER-SIMPLE-BUILD.sh
│   ├── ONE-COMMAND-BUILD.sh
│   ├── FRESH-BUILD.sh           # Clean build from scratch
│   ├── build-and-upload.sh      # Build + upload to R2
│   │
│   ├── Deployment Scripts (3):
│   ├── DEPLOY.sh                # Standard deployment
│   ├── DEPLOY-COMPLETE.sh       # Complete deployment workflow
│   ├── auto-build-and-deploy.sh # Automated CI/CD
│   │
│   ├── Upload Scripts (4):
│   ├── upload-apk.js            # Upload to R2 (JavaScript)
│   ├── upload-to-supabase.js    # Upload to Supabase
│   ├── upload-with-service-key.js
│   ├── upload_apk.py            # Upload utility (Python)
│   │
│   └── Utilities (3):
│       ├── INSTALL-ANDROID-SDK.sh
│       ├── update-async-storage.sh
│       └── verify-security.sh
│
├── marketplace/                 # Marketplace scripts (1 file)
│   └── DEPLOY-NOW.sh            # Deploy marketplace to Vercel
│
├── database/                    # Database scripts (3 files)
│   ├── setup-database.js        # Initialize database schema
│   ├── update-db-v1.6.0.js      # Version 1.6.0 migration
│   └── insert-version-1.2.0.sql # Version 1.2.0 data migration
│
├── setup/                       # Project setup (2 files)
│   ├── setup-rimmarsa.sh        # Original setup script
│   └── setup-dev-environment.sh # NEW: Automated dev setup
│
├── Developer Tools (2):
├── dev-helper.sh                # NEW: Developer CLI tool
│   └── Commands: start-marketplace, start-mobile, build-*,
│       test-all, lint-all, clean, fresh-install, check-env, status
│
└── Utilities (4):
    ├── quick-upload-apk.sh      # Quick APK upload to R2
    ├── upload-apk-r2.sh         # R2 upload utility
    ├── check-domain.sh          # Domain verification
    └── fix-vercel-deploy.js     # Vercel deployment fix
```

**Total Scripts:** 32 automation files organized into 4 categories

---

## Application Structures

### Marketplace (`/marketplace/`)

```
marketplace/
├── .env.example                 # Environment template
├── .env.local                   # Local environment (gitignored)
├── package.json                 # Dependencies
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS config
│
├── app/                         # Next.js App Router
│   ├── page.tsx                 # Home page
│   ├── layout.tsx               # Root layout
│   ├── vendors/                 # Vendor pages
│   ├── api/                     # API routes
│   │   ├── admin/               # Admin endpoints
│   │   ├── vendor/              # Vendor endpoints
│   │   ├── auth/                # Authentication
│   │   └── upload-vendor-image/ # Image upload
│   └── ...
│
├── components/                  # React components
│   ├── ui/                      # shadcn/ui components
│   ├── vendor/                  # Vendor-specific components
│   └── ...
│
├── lib/                         # Utilities and libraries
│   ├── supabase/                # Supabase clients
│   ├── services/                # NEW: Service layer
│   │   ├── vendor.service.ts
│   │   ├── vendor-approval.service.ts
│   │   ├── subscription.service.ts
│   │   └── product.service.ts
│   ├── hooks/                   # NEW: Reusable React hooks
│   │   ├── useVendorRegistration.ts
│   │   ├── useImageUpload.ts
│   │   └── useLocationData.ts
│   ├── utils/                   # NEW: Shared utilities
│   │   ├── error-handler.ts
│   │   └── validation.ts
│   ├── auth/                    # Authentication utilities
│   ├── rate-limit.ts            # Rate limiting
│   └── ...
│
├── public/                      # Static assets
├── scripts/                     # (MOVED to /scripts/)
└── sql/                         # SQL queries
```

### Mobile App (`/mobile-app/`)

```
mobile-app/
├── .env.example                 # Environment template
├── .env                         # Environment (gitignored)
├── package.json                 # Dependencies
├── app.config.js                # Expo configuration
├── eas.json                     # Expo Application Services config
├── App.js                       # Main entry point
├── index.js                     # Root index
│
├── src/                         # Source code
│   ├── screens/                 # App screens
│   ├── components/              # React Native components
│   ├── navigation/              # Navigation configuration
│   ├── utils/                   # Utilities
│   └── ...
│
├── assets/                      # Images, fonts, etc.
├── android/                     # Android native code
└── dist/                        # Build output (gitignored)
```

### Admin Dashboard (`/admin-dashboard/`)

```
admin-dashboard/
├── .env.example                 # NEW: Environment template
├── .env                         # Environment (gitignored)
├── package.json                 # Dependencies
├── vite.config.js               # Vite configuration
│
├── src/                         # Source code
│   ├── pages/                   # React pages
│   ├── components/              # React components
│   ├── lib/                     # Utilities
│   └── ...
│
├── public/                      # Static assets
└── dist/                        # Build output (gitignored)
```

### Vendor Dashboard (`/vendor-dashboard/`)

```
vendor-dashboard/
├── .env.example                 # NEW: Environment template
├── .env                         # Environment (gitignored)
├── package.json                 # Dependencies
├── vite.config.js               # Vite configuration
│
├── src/                         # Source code
│   ├── pages/                   # React pages
│   ├── components/              # React components
│   ├── lib/                     # Utilities
│   └── ...
│
├── public/                      # Static assets
└── dist/                        # Build output (gitignored)
```

### Database (`/supabase/`)

```
supabase/
├── config.toml                  # Supabase configuration
│
├── migrations/                  # SQL migrations
│   ├── 20250915000000_initial_schema.sql
│   ├── 20250920000000_add_subscriptions.sql
│   └── ... (version-controlled migrations)
│
├── functions/                   # Edge functions
│   └── ... (Deno functions)
│
└── seed/                        # Seed data
    └── ... (test data)
```

### CI/CD (`/.github/`)

```
.github/
└── workflows/                   # GitHub Actions workflows
    ├── deploy-marketplace.yml   # Marketplace deployment
    ├── test.yml                 # Run tests
    └── ... (CI/CD automation)
```

---

## Key Features After Week 2

### Organization Improvements

✓ **Clean Root Directory**
- Only 3 essential files: README.md, package.json, package-lock.json
- All documentation moved to `/docs/`
- All scripts moved to `/scripts/`

✓ **Organized Documentation** (76 files in 6 categories)
- Architecture (3 files)
- Security (13 files)
- Development (11 files)
- Deployment (19 files)
- Testing (4 files)
- Archive (26 files)

✓ **Organized Scripts** (32 files in 4 categories)
- Mobile App (20 files)
- Marketplace (1 file)
- Database (3 files)
- Setup & Tools (8 files)

✓ **Enhanced .gitignore**
- 80+ patterns (up from 40)
- Comprehensive credential protection
- Build artifact exclusion
- Platform-specific ignores

✓ **Developer Tooling**
- Automated setup script (5-minute onboarding)
- Developer helper CLI (15+ commands)
- Environment templates for all apps
- Comprehensive documentation

### Code Quality Improvements

✓ **Service Layer Architecture**
- Business logic isolated from HTTP layer
- Reusable service functions
- Consistent error handling

✓ **Shared Utilities**
- Validation utilities
- Error handling
- Type definitions

✓ **Reusable Hooks**
- Form management
- File upload
- Location data

---

## Developer Quick Reference

### Setup New Environment

```bash
# Complete setup in 5 minutes
./scripts/setup/setup-dev-environment.sh
```

### Common Development Tasks

```bash
# Start marketplace
./scripts/dev-helper.sh start-marketplace

# Start mobile app
./scripts/dev-helper.sh start-mobile

# Build mobile app
./scripts/dev-helper.sh build-mobile

# Check environment
./scripts/dev-helper.sh check-env

# Clean and reinstall
./scripts/dev-helper.sh fresh-install
```

### Build Mobile App

```bash
# Quick development build
./scripts/mobile-app/quick-build.sh

# Production build and upload
./scripts/mobile-app/build-and-upload.sh

# Clean build from scratch
./scripts/mobile-app/FRESH-BUILD.sh
```

### Deploy Marketplace

```bash
# Deploy to Vercel
./scripts/marketplace/DEPLOY-NOW.sh
```

### Database Operations

```bash
# Setup database
node scripts/database/setup-database.js

# Apply migration
node scripts/database/update-db-v1.6.0.js
```

---

## File Statistics

| Category | Files | Purpose |
|----------|-------|---------|
| **Documentation** | 76 | Project documentation |
| **Scripts** | 32 | Automation & tooling |
| **Source Code** | 500+ | Application code |
| **Tests** | 50+ | Unit & integration tests |
| **Config** | 20+ | Configuration files |

---

## Related Documentation

- [README.md](/README.md) - Project overview
- [docs/README.md](/docs/README.md) - Documentation index
- [docs/development/QUICK-START.md](/docs/development/QUICK-START.md) - Developer setup
- [docs/architecture/CURRENT-STATE.md](/docs/architecture/CURRENT-STATE.md) - System architecture
- [scripts/README.md](/scripts/README.md) - Scripts reference

---

**Maintained By:** Development Team
**Last Reorganization:** Week 2 (2025-10-27)
**Status:** Production Ready
