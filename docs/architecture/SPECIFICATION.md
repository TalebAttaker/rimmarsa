# Rimmarsa Marketplace - Technical Specification

**Document Version:** 1.0.0
**Date:** 2025-10-27
**Status:** Production Reorganization Plan

---

## Executive Summary

Rimmarsa is a multi-vendor marketplace platform targeting Mauritania, consisting of:
- **Web Marketplace** (Next.js 15.5.5) - Customer-facing marketplace with vendor registration
- **Mobile Vendor App** (React Native/Expo) - Vendor management application (v1.7.0)
- **Admin Dashboard** (React + Vite) - Administrative control panel
- **Vendor Dashboard** (React + Vite) - Vendor web portal

**Current Issues:**
- Excessive documentation (50+ markdown files in root directory)
- Hardcoded credentials in mobile app
- Inconsistent folder structure between applications
- Duplicate functionality (admin integrated in marketplace + standalone dashboard)
- Old/backup files not cleaned up
- 83 script files scattered across the project
- Configuration sprawl (multiple .env files without clear hierarchy)
- 30,576 lines of code without clear organization

**Production Status:** Live at https://www.rimmarsa.com

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Customers  │  │   Vendors    │  │   Admins     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Web Marketplace│  │  Mobile Vendor  │  │ Admin Dashboard │
│   (Next.js 15)  │  │  App (RN/Expo)  │  │  (React/Vite)   │
│                 │  │                 │  │                 │
│  - Homepage     │  │  - Registration │  │  - Vendor Mgmt  │
│  - Products     │  │  - Login        │  │  - Product Mgmt │
│  - Vendors      │  │  - Products     │  │  - Analytics    │
│  - Registration │  │  - Analytics    │  │  - Settings     │
│  - Download     │  │  - Subscription │  │  - Security     │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   API LAYER         │
                    │  (Next.js Routes)   │
                    │                     │
                    │  /api/vendor/*      │
                    │  /api/admin/*       │
                    │  /api/upload-*      │
                    │  /api/download/*    │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
      ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
      │  Supabase   │  │ Cloudflare  │  │   Vercel    │
      │ PostgreSQL  │  │     R2      │  │  Hosting    │
      │             │  │             │  │             │
      │ - Auth      │  │ - APK files │  │ - Edge Fns  │
      │ - Database  │  │ - Vendor    │  │ - Geo Block │
      │ - RLS       │  │   images    │  │ - CDN       │
      └─────────────┘  └─────────────┘  └─────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Web Frontend** | Next.js | 15.5.5 | App Router, SSR, Server Components |
| | React | 19.1.0 | UI Library |
| | TypeScript | 5.x | Type Safety |
| | Tailwind CSS | 4.x | Styling |
| | Framer Motion | 12.23.24 | Animations |
| **Mobile App** | React Native | 0.74.5 | Mobile Framework |
| | Expo | 51.0.0 | Build & Development |
| | Supabase JS | 2.76.1 | API Client |
| **Dashboards** | React | 18.x | UI Library |
| | Vite | Latest | Build Tool |
| | shadcn/ui | Latest | Component Library |
| **Backend** | Supabase | Cloud | Auth + PostgreSQL + RLS |
| | Next.js API Routes | 15.5.5 | Serverless Functions |
| **Storage** | Cloudflare R2 | Cloud | Object Storage (S3-compatible) |
| **Hosting** | Vercel | Latest | Deployment & CDN |
| **Database** | PostgreSQL | 13.x | via Supabase |

---

## 2. Database Schema

### 2.1 Core Tables

**vendors** (5 rows)
- Primary vendor accounts with authentication
- Fields: business_name, owner_name, email, phone, whatsapp_number
- Geographic: region_id, city_id
- Auth: password_hash, user_id (Supabase Auth)
- Business: promo_code, referral_code, commission_rate, total_sales
- Verification: is_verified, is_approved, approved_at
- RLS: Vendors can only access their own data

**products** (7 rows)
- Vendor product listings
- Fields: name, name_ar, description, price, compare_at_price
- Stock: stock_quantity, is_active
- Media: images (array)
- Relations: vendor_id, category_id, region_id, city_id
- Analytics: views_count
- RLS: Vendors can only manage their own products

**categories** (20 rows)
- Product categorization
- Fields: name, name_ar, description, icon, order
- Status: is_active
- No RLS (public read)

**regions** (13 rows) & **cities** (38 rows)
- Geographic hierarchy for Mauritania
- Fields: name, name_ar, code (regions only)
- Relation: cities.region_id → regions.id

**vendor_requests** (3 rows)
- Pending vendor registration applications
- Fields: All vendor details + package_plan, package_price
- Images: nni_image_url, personal_image_url, store_image_url, payment_screenshot_url
- Referral: referred_by_code
- Status: pending/approved/rejected
- Workflow: Approved requests → create vendor account

**subscription_history** (2 rows)
- Vendor subscription tracking
- Fields: vendor_id, plan_type, amount, start_date, end_date
- Status: active/expired/cancelled

**referrals** (0 rows)
- Referral tracking system
- Fields: referrer_id, referred_vendor_id, referral_code, commission_earned
- Status: pending/completed/cancelled

**admins** (2 rows)
- Admin user accounts
- Fields: email, password_hash, name, role
- RLS: Admins only

**app_versions** (7 rows)
- Mobile app version management
- Fields: app_name (vendor/customer), version, build_number
- Update: force_update, minimum_version, download_url
- Release notes in Arabic & English

**upload_tokens** (3 rows)
- Secure token-based upload system (v1.6.0 security feature)
- Fields: token, client_ip, expires_at, max_uploads, uploads_used
- Security: Rate limiting per IP

**rate_limits** (87 rows)
- DDoS and abuse protection
- Fields: identifier (IP), endpoint, request_count, window_start

**profile_views** (0 rows)
- Vendor profile analytics
- Fields: vendor_id, viewer_ip, viewer_user_agent, referrer_url

**app_downloads** (13 rows)
- Mobile app download tracking
- Fields: app_name, version, ip_address, user_agent

**store_profiles** (0 rows)
- Extended vendor profile information
- Fields: banner_url, description, social_links, business_hours

### 2.2 Database Functions

**approve_vendor_request(request_id UUID)**
- Complex approval workflow
- Creates Supabase Auth user
- Creates vendor record with unique promo code
- Creates subscription record
- Creates referral record (if referred_by_code present)
- Updates request status to 'approved'

### 2.3 Row Level Security (RLS)

All tables have RLS enabled. Key policies:
- Vendors can only access/modify their own data
- Admins have elevated permissions
- Public tables (categories, regions, cities) are read-only
- upload_tokens validated by token + IP

---

## 3. API Architecture

### 3.1 API Endpoints

**Vendor APIs** (`/api/vendor/*`)
```
POST   /api/vendor/login                  # Vendor authentication
GET    /api/vendor/products                # List vendor's products
POST   /api/vendor/products                # Create product
PUT    /api/vendor/products/[id]           # Update product
DELETE /api/vendor/products/[id]           # Delete product
POST   /api/vendor/request-upload-token    # Get secure upload token
POST   /api/vendor/validate-promo          # Validate promo code
```

**Admin APIs** (`/api/admin/*`)
```
POST   /api/admin/login                    # Admin authentication
GET    /api/admin/check                    # Verify admin session
POST   /api/admin/vendors/approve          # Approve vendor request
GET    /api/admin/security/alerts          # Security alerts
GET    /api/admin/security/summary         # Security summary
GET    /api/admin/security/suspicious      # Suspicious activity
GET    /api/admin/security/traffic         # Traffic analytics
```

**Public APIs**
```
GET    /api/app-version                    # Mobile app version check
POST   /api/upload-vendor-image            # Secure image upload
GET    /api/download/vendor-app            # APK download endpoint
```

### 3.2 Authentication Flow

**Vendor Authentication:**
1. Phone number converted to email: `{phoneDigits}@vendor.rimmarsa.com`
2. Password validated via Supabase Auth
3. Vendor record fetched from database
4. Session stored in HTTP-only cookie
5. JWT token used for API authorization

**Admin Authentication:**
1. Email + password validated against `admins` table (bcrypt)
2. Custom session management (not Supabase Auth)
3. Session stored in HTTP-only cookie

**Mobile App Flow:**
1. User enters phone + password
2. App calls `/api/vendor/login`
3. Session token stored in secure storage
4. Token sent in Authorization header for API calls

### 3.3 Middleware & Security

**Global Middleware** (`src/middleware.ts`)
- Geographic fence: Only Mauritania (country code MR)
- Rate limiting: Global rate limit per IP
- Security headers: CSP, HSTS, X-Frame-Options, etc.

**Route Protection:**
- Vendor routes: `requireVendor()` middleware
- Admin routes: `requireAdmin()` middleware
- Upload endpoints: Token validation + IP verification

---

## 4. Component Architecture

### 4.1 Web Marketplace Structure

**Current Structure:**
```
marketplace/src/
├── app/                                  # Next.js App Router
│   ├── layout.tsx                        # Root layout (RTL, Arabic)
│   ├── page.tsx                          # Homepage (SSR)
│   ├── products/
│   │   ├── page.tsx                      # Product listing
│   │   └── [id]/page.tsx                 # Product detail
│   ├── vendors/
│   │   ├── page.tsx                      # Vendor listing
│   │   └── [id]/page.tsx                 # Vendor profile
│   ├── vendor-registration/page.tsx      # Public vendor registration
│   ├── download/page.tsx                 # Mobile app download page
│   ├── referrals/page.tsx                # Referral info page
│   ├── vendor/                           # Vendor portal (web)
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── products/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── subscription/page.tsx
│   │   └── referrals/page.tsx
│   ├── fassalapremierprojectbsk/         # Admin portal (integrated)
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── vendor-requests/page.tsx
│   │   ├── vendors/page.tsx
│   │   ├── products/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── regions/page.tsx
│   │   ├── cities/page.tsx
│   │   ├── referrals/page.tsx
│   │   └── settings/page.tsx
│   └── api/                              # API Routes
│       ├── vendor/                       # Vendor APIs
│       ├── admin/                        # Admin APIs
│       ├── upload-vendor-image/
│       ├── download/vendor-app/
│       └── app-version/
├── components/
│   ├── admin/
│   │   └── AdminLayout.tsx               # Admin layout wrapper
│   ├── vendor/
│   │   └── VendorLayout.tsx              # Vendor layout wrapper
│   ├── mobile/                           # Mobile-specific components
│   │   ├── MobileLayout.tsx
│   │   ├── MobileHome.tsx
│   │   ├── MobileHero.tsx
│   │   ├── MobileProductCard.tsx
│   │   ├── MobileCategoryScroll.tsx
│   │   └── MobileBottomNav.tsx
│   ├── ui/                               # shadcn/ui components
│   ├── ResponsiveHome.tsx                # Adaptive homepage
│   ├── modern-navbar.tsx
│   ├── modern-hero.tsx
│   ├── modern-footer.tsx
│   ├── ProductGrid.tsx
│   ├── ProductFilters.tsx
│   ├── VendorGrid.tsx
│   ├── VendorFilters.tsx
│   ├── LocationFilter.tsx
│   ├── WhatsAppButton.tsx
│   ├── how-it-works.tsx
│   ├── features-section.tsx
│   └── testimonials-section.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser client
│   │   ├── server.ts                     # Server client
│   │   └── admin.ts                      # Admin client (service role)
│   ├── auth/
│   │   ├── vendor-auth.ts                # Vendor auth functions
│   │   ├── vendor-middleware.ts          # Vendor route protection
│   │   ├── admin-auth.ts                 # Admin auth functions
│   │   └── admin-middleware.ts           # Admin route protection
│   ├── security/
│   │   └── sql-utils.ts                  # SQL injection prevention
│   ├── validation/
│   │   └── schemas.ts                    # Zod schemas
│   ├── database.types.ts                 # Generated from Supabase
│   ├── geo-fence.ts                      # Geographic access control
│   ├── rate-limit.ts                     # Rate limiting logic
│   ├── r2-upload.ts                      # Cloudflare R2 upload
│   └── utils.ts                          # Utility functions
├── hooks/
│   └── useIsMobile.ts                    # Mobile detection hook
└── middleware.ts                         # Global middleware
```

### 4.2 Mobile App Structure

**Current Structure:**
```
mobile-app/
├── App.js                                # Main app component (1737 lines - NEEDS REFACTORING)
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js                 # Landing/welcome
│   │   ├── VendorRegistrationScreen.js   # Registration form
│   │   └── vendor/
│   │       ├── VendorLoginScreen.js
│   │       ├── VendorDashboardScreen.js
│   │       ├── VendorProductsScreen.js
│   │       ├── AddProductScreen.js
│   │       ├── EditProductScreen.js
│   │       ├── VendorAnalyticsScreen.js
│   │       ├── VendorSubscriptionScreen.js
│   │       └── VendorSettingsScreen.js
│   ├── components/
│   │   └── vendor/                       # (empty - components in App.js)
│   ├── navigation/
│   │   └── VendorNavigator.js            # Navigation setup
│   ├── services/
│   │   ├── supabase.js                   # Supabase client
│   │   ├── secureStorage.js              # Secure storage wrapper
│   │   └── r2Upload.js                   # R2 upload service
│   ├── theme/
│   │   └── colors.js                     # Color constants
│   └── utils/                            # Utility functions
├── assets/                               # Images, fonts
├── android/                              # Native Android code
└── build scripts (14+ shell scripts)    # Various build scripts
```

**CRITICAL ISSUES:**
- App.js is 1737 lines - single monolithic file
- All UI components defined inline
- No separation of concerns
- Hardcoded API credentials
- Version hardcoded in code

### 4.3 Admin Dashboard Structure

**Standalone React App:**
```
admin-dashboard/src/
├── main.tsx
├── App.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── VendorRequests.tsx
│   ├── Vendors.tsx
│   ├── Products.tsx
│   ├── Categories.tsx
│   └── Settings.tsx
├── components/
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   └── ui/
└── lib/
    ├── api.ts
    └── utils.ts
```

**DUPLICATION ISSUE:**
- Admin functionality exists in TWO places:
  1. `/marketplace/src/app/fassalapremierprojectbsk/` (integrated)
  2. `/admin-dashboard/` (standalone React app)

### 4.4 Vendor Dashboard Structure

**Standalone React App:**
```
vendor-dashboard/src/
├── main.tsx
├── App.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Products.tsx
│   ├── AddProduct.tsx
│   └── Analytics.tsx
├── components/
│   ├── Layout.tsx
│   └── ui/
└── lib/
    ├── api.ts
    └── utils.ts
```

**DUPLICATION ISSUE:**
- Vendor functionality exists in TWO places:
  1. `/marketplace/src/app/vendor/` (integrated)
  2. `/vendor-dashboard/` (standalone React app)

---

## 5. RECOMMENDED PROJECT STRUCTURE

### 5.1 Consolidated Structure

**Recommendation:** Consolidate into monorepo structure:

```
rimmarsa/
├── apps/                                 # Applications
│   ├── web/                              # Next.js marketplace (KEEP)
│   │   ├── src/
│   │   │   ├── app/                      # Routes
│   │   │   │   ├── (public)/             # Public routes group
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── vendors/
│   │   │   │   │   └── download/
│   │   │   │   ├── (vendor)/             # Vendor routes group
│   │   │   │   │   └── vendor/
│   │   │   │   ├── (admin)/              # Admin routes group
│   │   │   │   │   └── admin/            # Rename from fassalapremierprojectbsk
│   │   │   │   └── api/
│   │   │   ├── components/
│   │   │   │   ├── features/             # NEW: Feature-based components
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── vendors/
│   │   │   │   │   └── admin/
│   │   │   │   ├── layouts/              # NEW: Layout components
│   │   │   │   ├── ui/                   # shadcn components
│   │   │   │   └── shared/               # Shared components
│   │   │   └── lib/                      # Utilities & configs
│   │   ├── public/
│   │   └── config files
│   │
│   └── mobile/                           # React Native app (REFACTORED)
│       ├── src/
│       │   ├── app/                      # NEW: Main app entry
│       │   │   └── App.tsx               # Refactored (navigation only)
│       │   ├── features/                 # NEW: Feature modules
│       │   │   ├── auth/
│       │   │   │   ├── screens/
│       │   │   │   ├── components/
│       │   │   │   └── hooks/
│       │   │   ├── registration/
│       │   │   ├── products/
│       │   │   ├── dashboard/
│       │   │   └── analytics/
│       │   ├── shared/                   # NEW: Shared code
│       │   │   ├── components/
│       │   │   ├── hooks/
│       │   │   ├── services/
│       │   │   └── utils/
│       │   ├── navigation/
│       │   ├── theme/
│       │   └── config/                   # NEW: Configuration
│       │       ├── constants.ts          # API URLs, versions
│       │       └── env.ts                # Environment variables
│       ├── assets/
│       └── android/
│
├── packages/                             # Shared packages (FUTURE)
│   ├── shared-types/                     # TypeScript types
│   ├── shared-utils/                     # Utility functions
│   └── api-client/                       # API client library
│
├── docs/                                 # CONSOLIDATED documentation
│   ├── api/                              # API documentation
│   ├── deployment/                       # Deployment guides
│   ├── development/                      # Development guides
│   ├── security/                         # Security documentation
│   └── architecture/                     # Architecture diagrams
│
├── scripts/                              # Build & deployment scripts
│   ├── build/
│   ├── deploy/
│   └── database/
│
├── supabase/                             # Database migrations
│   └── migrations/
│
└── config/                               # Root configuration
    ├── .env.example
    └── README.md
```

### 5.2 Key Changes

**ELIMINATE:**
- `/admin-dashboard/` (move to `/apps/web/src/app/(admin)/`)
- `/vendor-dashboard/` (already in `/apps/web/src/app/(vendor)/`)
- 50+ markdown files in root (consolidate to `/docs/`)
- Old backup files (`page_old.tsx`)
- Scattered build scripts (consolidate to `/scripts/`)

**REFACTOR:**
- Mobile App.js (1737 lines → feature modules)
- Hardcoded credentials (use environment variables)
- Admin route name (fassalapremierprojectbsk → admin)

**CONSOLIDATE:**
- Environment files (clear hierarchy)
- Documentation (into `/docs/` with categories)
- Scripts (into `/scripts/` with categories)

---

## 6. Configuration Management

### 6.1 Environment Variables

**Current Issues:**
- Multiple `.env` files without clear purpose
- Credentials committed in mobile app
- No `.env.example` in some directories

**Recommended Structure:**

**Web Marketplace:**
```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NODE_ENV=development
IP_WHITELIST=127.0.0.1  # Optional for local testing

# .env.production (production via Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME_APPS=rimmarsa-apps
R2_BUCKET_NAME_IMAGES=rimmarsa-vendor-images
R2_PUBLIC_URL=https://pub-xxx.r2.dev
NODE_ENV=production
```

**Mobile App:**
```bash
# .env (NEVER commit)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
API_URL=https://www.rimmarsa.com
APP_VERSION=1.7.0
```

### 6.2 Build Configuration

**Next.js (marketplace):**
- `next.config.js`: ESLint disabled during builds (SECURITY RISK)
- `vercel.json`: Security headers, function timeouts
- `tsconfig.json`: TypeScript configuration

**Mobile App:**
- `app.config.js`: Expo configuration (version, package name)
- `eas.json`: Build profiles
- Multiple build scripts (needs consolidation)

---

## 7. Deployment & CI/CD

### 7.1 Current Deployment Process

**Web Marketplace:**
1. GitHub push to `main` branch
2. Vercel auto-deploy triggered
3. Build via `npm run build`
4. Deploy to https://www.rimmarsa.com
5. Environment variables from Vercel dashboard

**Mobile App:**
1. Manual version bump in App.js
2. Run build script (one of 14+ scripts)
3. Generate APK locally
4. Upload to Cloudflare R2 manually
5. Update database `app_versions` table manually

**Admin/Vendor Dashboards:**
- Currently unused (duplicate of integrated versions)

### 7.2 Recommended CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
# .github/workflows/deploy-web.yml
name: Deploy Web Marketplace
on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run tests (MISSING - needs implementation)
      - Run linting (currently disabled)
      - Deploy to Vercel
```

```yaml
# .github/workflows/build-mobile.yml
name: Build Mobile App
on:
  push:
    tags:
      - 'mobile-v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js & Java
      - Install dependencies
      - Build APK with Expo
      - Upload to Cloudflare R2
      - Update app_versions table
      - Create GitHub release
```

### 7.3 Environment Management

**Recommended Environments:**
1. **Development** - Local development
2. **Staging** - Pre-production testing (MISSING)
3. **Production** - Live environment

**Current Gap:** No staging environment

---

## 8. Security Architecture

### 8.1 Current Security Measures

**Geographic Fence:**
- Middleware blocks all non-Mauritania traffic
- Uses Vercel geo headers
- Implemented globally

**Rate Limiting:**
- Global rate limit per IP
- Stored in database (rate_limits table)
- Window-based tracking

**Authentication:**
- Supabase Auth for vendors
- Custom bcrypt for admins
- HTTP-only cookies for sessions
- JWT tokens for mobile app

**Authorization:**
- Row Level Security (RLS) on all tables
- Vendor middleware protection
- Admin middleware protection
- Service role key for admin operations

**Upload Security:**
- Token-based upload system (v1.6.0)
- IP validation
- Token expiry (15 minutes)
- Upload count limits (4 per token)
- Private R2 bucket for sensitive documents

**Headers:**
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Permissions-Policy

### 8.2 Security Gaps

1. **Hardcoded Credentials in Mobile App**
   - Supabase URL & anon key in App.js
   - Should use environment variables

2. **ESLint Disabled**
   - `ignoreDuringBuilds: true` in next.config.js
   - Bypasses code quality checks

3. **No Input Validation**
   - Missing Zod schema validation on many API routes
   - SQL injection risk (partially mitigated by RLS)

4. **No HTTPS Enforcement**
   - Mobile app doesn't enforce HTTPS

5. **Weak Admin Route**
   - `/fassalapremierprojectbsk/` - obscurity ≠ security
   - Should use proper authentication layer

6. **No Security Monitoring**
   - Security tables exist but no alerting
   - No automated threat detection

### 8.3 Recommended Security Enhancements

1. Implement environment variables in mobile app
2. Enable ESLint in production builds
3. Add Zod validation to all API routes
4. Implement HTTPS enforcement
5. Rename admin route to `/admin/` with proper auth
6. Add security monitoring and alerting
7. Implement CSRF protection
8. Add request signing for mobile app
9. Implement API key rotation
10. Add audit logging for sensitive operations

---

## 9. Testing Strategy

### 9.1 Current State

**CRITICAL GAP:** NO AUTOMATED TESTS

- No unit tests
- No integration tests
- No E2E tests
- No test configuration files
- Manual testing only

### 9.2 Recommended Testing Strategy

**Unit Tests (Jest + React Testing Library):**
```
apps/web/src/
├── lib/
│   ├── __tests__/
│   │   ├── auth.test.ts
│   │   ├── utils.test.ts
│   │   └── validation.test.ts
└── components/
    └── __tests__/
        ├── ProductCard.test.tsx
        └── VendorGrid.test.tsx
```

**Integration Tests (Playwright):**
```
tests/
├── e2e/
│   ├── vendor-registration.spec.ts
│   ├── vendor-login.spec.ts
│   ├── product-management.spec.ts
│   └── admin-approval.spec.ts
```

**API Tests (Supertest):**
```
tests/
├── api/
│   ├── vendor-api.test.ts
│   ├── admin-api.test.ts
│   └── upload-api.test.ts
```

**Mobile Tests (Jest + React Native Testing Library):**
```
mobile-app/src/
├── features/
│   └── auth/
│       └── __tests__/
│           └── LoginScreen.test.tsx
```

**Test Coverage Goals:**
- Unit tests: 80% coverage
- Integration tests: Critical user flows
- API tests: All endpoints
- Mobile tests: Critical screens

---

## 10. Documentation Organization

### 10.1 Current Documentation Issues

**ROOT DIRECTORY CHAOS:**
- 50+ markdown files in root directory
- Multiple deployment guides (overlapping content)
- Multiple session summaries
- Multiple security documents
- No clear organization

**Categorization Needed:**
```
Current mess (50 files):
- DEPLOYMENT-COMPLETE-V1.3.0.md
- DEPLOYMENT-COMPLETE.md
- DEPLOYMENT-FIX-READY.md
- DEPLOYMENT-STATUS-V1.3.0.md
- DEPLOYMENT-STEPS.md
- DEPLOYMENT-SUCCESS-v1.2.0.md
- ... and 44 more
```

### 10.2 Recommended Documentation Structure

```
docs/
├── README.md                             # Documentation index
├── getting-started/
│   ├── README.md
│   ├── local-development.md
│   ├── environment-setup.md
│   └── first-deployment.md
├── architecture/
│   ├── README.md
│   ├── system-overview.md
│   ├── database-schema.md
│   ├── api-architecture.md
│   └── security-architecture.md
├── api/
│   ├── README.md
│   ├── vendor-endpoints.md
│   ├── admin-endpoints.md
│   └── public-endpoints.md
├── deployment/
│   ├── README.md
│   ├── web-deployment.md               # Vercel
│   ├── mobile-deployment.md            # Build & upload
│   ├── database-migrations.md
│   └── rollback-procedures.md
├── development/
│   ├── README.md
│   ├── coding-standards.md
│   ├── git-workflow.md
│   ├── testing-guide.md
│   └── mobile-development.md
├── security/
│   ├── README.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── rate-limiting.md
│   ├── upload-security.md
│   └── security-checklist.md
├── operations/
│   ├── README.md
│   ├── monitoring.md
│   ├── backup-restore.md
│   ├── incident-response.md
│   └── vendor-approval-process.md
└── release-notes/
    ├── v1.7.0.md
    ├── v1.6.0.md
    └── v1.5.0.md
```

**Migration Plan:**
1. Create `/docs/` structure
2. Consolidate content from 50+ files
3. Archive old files to `/docs/archive/`
4. Update all references
5. Delete duplicates

---

## 11. Code Quality Standards

### 11.1 Current Issues

1. **ESLint disabled** in production builds
2. **No TypeScript strict mode**
3. **Inconsistent naming** (fassalapremierprojectbsk)
4. **No code formatting** enforcement (Prettier)
5. **Large monolithic files** (App.js - 1737 lines)
6. **Hardcoded values** throughout codebase

### 11.2 Recommended Standards

**TypeScript:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**ESLint:**
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["error"] }],
    "max-lines": ["error", 300],
    "complexity": ["error", 10]
  }
}
```

**Prettier:**
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

**File Size Limits:**
- Components: Max 300 lines
- Functions: Max 50 lines
- Complexity: Max 10

---

## 12. Performance Optimization

### 12.1 Current Performance

**Web Marketplace:**
- Next.js 15 with App Router (modern)
- Server Components for data fetching
- Image optimization via Next.js
- Geographic CDN via Vercel
- No bundle analysis

**Mobile App:**
- Large bundle size (not measured)
- No code splitting
- Images not optimized
- No caching strategy

### 12.2 Recommended Optimizations

**Web:**
1. Implement bundle analysis
2. Add image CDN (Cloudflare Images)
3. Implement caching strategy
4. Add performance monitoring (Vercel Analytics)
5. Optimize database queries (add indexes)
6. Implement pagination for large lists

**Mobile:**
1. Implement code splitting
2. Add image caching
3. Implement offline mode
4. Optimize bundle size
5. Add performance monitoring
6. Implement lazy loading

---

## 13. Monitoring & Observability

### 13.1 Current State

**GAPS:**
- No application monitoring
- No error tracking
- No performance monitoring
- No user analytics
- No uptime monitoring

**Existing Data:**
- Database tables for analytics (not used)
- Security tables (not monitored)
- Download tracking (manual)

### 13.2 Recommended Monitoring Stack

**Application Monitoring:**
- Vercel Analytics (included)
- Sentry (error tracking)
- LogRocket (session replay)

**Database Monitoring:**
- Supabase Dashboard (built-in)
- Custom queries for business metrics

**Uptime Monitoring:**
- UptimeRobot or Pingdom
- Status page for customers

**Security Monitoring:**
- Custom dashboard using security tables
- Automated alerts for suspicious activity
- Daily security reports

**Business Metrics:**
- Vendor registrations
- Product uploads
- App downloads
- Referral conversions

---

## 14. Acceptance Criteria for Production Readiness

### 14.1 Code Quality
- [ ] All ESLint errors resolved
- [ ] TypeScript strict mode enabled
- [ ] No hardcoded credentials
- [ ] Code coverage > 80%
- [ ] All files under 300 lines
- [ ] Prettier formatting enforced

### 14.2 Security
- [ ] Environment variables properly managed
- [ ] Admin route renamed and secured
- [ ] Input validation on all endpoints
- [ ] Security monitoring implemented
- [ ] Audit logging for sensitive operations
- [ ] CSRF protection implemented

### 14.3 Testing
- [ ] Unit tests for critical functions
- [ ] Integration tests for user flows
- [ ] API tests for all endpoints
- [ ] Mobile app tests for critical screens
- [ ] E2E tests for key workflows

### 14.4 Documentation
- [ ] All 50+ markdown files consolidated
- [ ] API documentation complete
- [ ] Deployment guide updated
- [ ] Architecture diagrams created
- [ ] Security documentation reviewed

### 14.5 Infrastructure
- [ ] Staging environment created
- [ ] CI/CD pipelines implemented
- [ ] Monitoring and alerting active
- [ ] Backup and restore tested
- [ ] Rollback procedures documented

### 14.6 Mobile App
- [ ] App.js refactored into modules
- [ ] Environment variables implemented
- [ ] Build process automated
- [ ] Version management automated
- [ ] Update mechanism tested

---

## 15. Dependencies & Risks

### 15.1 External Dependencies

| Service | Purpose | Risk Level | Mitigation |
|---------|---------|-----------|------------|
| Supabase | Database + Auth | HIGH | Regular backups, migration plan |
| Cloudflare R2 | File storage | MEDIUM | Multi-region, local backups |
| Vercel | Hosting | MEDIUM | Can migrate to Netlify/AWS |
| Expo | Mobile builds | LOW | Can use React Native CLI |

### 15.2 Technical Risks

**HIGH PRIORITY:**
1. **Single monolithic mobile app file** - Hard to maintain, high bug risk
2. **No automated tests** - High regression risk
3. **Hardcoded credentials** - Security breach risk
4. **Disabled ESLint** - Code quality degradation
5. **No staging environment** - Production testing risk

**MEDIUM PRIORITY:**
6. **Duplicate admin/vendor dashboards** - Maintenance burden
7. **Documentation chaos** - Onboarding difficulty
8. **Manual deployment process** - Human error risk
9. **No monitoring** - Blind to issues
10. **Geographic fence only** - Single point of security

**LOW PRIORITY:**
11. **Large bundle sizes** - Performance impact
12. **No caching strategy** - Scalability concern
13. **Inconsistent naming** - Developer confusion

---

## 16. Migration Strategy

See **REORGANIZATION-PLAN.md** for detailed step-by-step migration plan.

**High-Level Phases:**
1. **Phase 1: Documentation Cleanup** (1-2 days)
2. **Phase 2: Mobile App Refactor** (3-5 days)
3. **Phase 3: Security Hardening** (2-3 days)
4. **Phase 4: Testing Implementation** (5-7 days)
5. **Phase 5: CI/CD Setup** (2-3 days)
6. **Phase 6: Monitoring & Observability** (2-3 days)
7. **Phase 7: Performance Optimization** (3-5 days)

**Total Estimated Time:** 18-28 days

---

## 17. Appendices

### A. Database ERD

```
vendors (1) ----< (many) products
   |
   | (1 to 1)
   |
   +------ store_profiles
   |
   | (1 to many)
   |
   +------ subscription_history
   |
   | (1 to many)
   |
   +------ referrals (as referrer)
   |
   | (1 to many)
   |
   +------ referrals (as referred)
   |
   +------ profile_views

vendor_requests (many) ----< (1) regions
vendor_requests (many) ----< (1) cities
vendor_requests (optional) --> vendors (approved)

products (many) ----< (1) categories
products (many) ----< (1) regions
products (many) ----< (1) cities

cities (many) ----< (1) regions
```

### B. API Response Formats

**Success Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message in Arabic",
  "code": "ERROR_CODE"
}
```

### C. Naming Conventions

**Files:**
- Components: PascalCase (e.g., `ProductCard.tsx`)
- Utilities: camelCase (e.g., `formatPrice.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_URL`)

**Database:**
- Tables: snake_case, plural (e.g., `vendor_requests`)
- Columns: snake_case (e.g., `created_at`)

**API Routes:**
- kebab-case (e.g., `/api/vendor/request-upload-token`)

---

**Document End**

For implementation details, see:
- **tasks.json** - Detailed task breakdown
- **REORGANIZATION-PLAN.md** - Step-by-step migration guide
