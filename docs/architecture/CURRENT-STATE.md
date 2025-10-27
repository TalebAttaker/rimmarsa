# Rimmarsa Architecture - Current State Documentation

**Last Updated:** 2025-10-27
**Version:** 1.7.0
**Status:** Production

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Folder Structure](#folder-structure)
3. [Component Organization](#component-organization)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [External Integrations](#external-integrations)
7. [Authentication & Security](#authentication--security)
8. [Deployment Architecture](#deployment-architecture)

---

## System Overview

Rimmarsa is a multi-vendor marketplace platform for Mauritania consisting of four interconnected applications:

### Application Breakdown

| Application | Technology | Purpose | Deployment |
|------------|------------|---------|------------|
| **Web Marketplace** | Next.js 15.5.5 | Customer-facing marketplace | Vercel (https://www.rimmarsa.com) |
| **Mobile Vendor App** | React Native/Expo 51 | Vendor self-service app | APK distributed via Cloudflare R2 |
| **Admin Dashboard** | React 18 + Vite | Platform administration | (Standalone React app) |
| **Vendor Dashboard** | React 18 + Vite | Vendor web portal | (Standalone React app) |

### Core Services

- **Database:** Supabase PostgreSQL 13.x with Row Level Security (RLS)
- **Storage:** Cloudflare R2 (S3-compatible object storage)
- **Hosting:** Vercel Edge Network with geographic blocking
- **Authentication:** Supabase Auth (JWT-based)

---

## Folder Structure

### Root Directory

```
rimmarsa/
├── marketplace/          # Next.js 15 web marketplace (MAIN APPLICATION)
├── mobile-app/          # React Native vendor app
├── admin-dashboard/     # React admin panel
├── vendor-dashboard/    # React vendor panel
├── supabase/           # Database migrations & edge functions
├── docs/               # Organized documentation (NEW)
├── .github/            # CI/CD workflows
├── package.json        # Root dependencies (bcryptjs)
├── SECURITY-FIXES.json # Security tracking
└── tasks.json         # Development task list
```

### Marketplace Application (`/marketplace/`)

```
marketplace/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API Routes (serverless functions)
│   │   ├── vendor-registration/  # Vendor signup page
│   │   ├── vendors/         # Vendor listing & details
│   │   ├── download/        # Mobile app download page
│   │   ├── admin/           # Admin dashboard (integrated)
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Homepage
│   ├── components/
│   │   ├── admin/           # Admin-specific components
│   │   ├── vendor/          # Vendor-specific components
│   │   ├── mobile/          # Mobile-specific components
│   │   └── ui/              # Reusable UI components (shadcn/ui)
│   ├── lib/
│   │   ├── supabase/        # Supabase client & utilities
│   │   ├── auth/            # Authentication helpers
│   │   ├── security/        # Security utilities
│   │   └── validation/      # Zod schemas
│   └── hooks/               # Custom React hooks
├── public/                  # Static assets
├── next.config.js           # Next.js configuration
├── package.json            # Dependencies
├── .env.local              # Environment variables (NOT in git)
├── .env.example            # Environment template
└── vercel.json             # Vercel deployment config
```

### Mobile App (`/mobile-app/`)

```
mobile-app/
├── App.js                  # Main entry point
├── app.config.js           # Expo configuration
├── eas.json               # Expo Application Services config
├── package.json           # Dependencies (React Native, Expo, Supabase)
├── BUILD-LOCAL.sh         # Local build script
├── DEPLOY.sh              # Deployment script (build + upload to R2)
└── insert-version-1.2.0.sql  # Database version update SQL
```

### Supabase (`/supabase/`)

```
supabase/
├── migrations/            # SQL migration files
│   ├── 20231015_*.sql    # Initial schema
│   ├── 20231016_*.sql    # RLS policies
│   └── ...
├── functions/            # Supabase Edge Functions
└── config.toml          # Supabase configuration
```

### Documentation (`/docs/`)

```
docs/
├── architecture/         # System design & specifications
│   ├── SPECIFICATION.md  # Complete technical spec
│   ├── DATABASE.md       # Database schema details
│   └── CURRENT-STATE.md  # This file
├── security/            # Security documentation
│   ├── SECURITY-*.md    # Various security guides
│   └── MOBILE_APP_SECURITY_CHECKLIST.md
├── development/         # Development guides
│   ├── CODE-STANDARDS.md
│   ├── REFACTOR-PLAN.md
│   └── REORGANIZATION-PLAN.md
├── deployment/          # Deployment documentation
│   ├── BUILD_APK_INSTRUCTIONS.md
│   ├── DEPLOYMENT-*.md
│   └── V1.5.0-RELEASE-NOTES.md
├── testing/            # Testing guides
│   └── MANUAL-TESTING-CHECKLIST.md
└── archive/           # Historical documentation
```

---

## Component Organization

### Web Marketplace Components

#### Core Pages (App Router)
- **Homepage (`/`):** Hero, featured vendors, categories
- **Vendors (`/vendors`):** Vendor directory with filtering
- **Vendor Details (`/vendors/[id]`):** Individual vendor profile with products
- **Vendor Registration (`/vendor-registration`):** Vendor signup form
- **Download (`/download`):** Mobile app download page
- **Admin Dashboard (`/admin`):** Integrated admin panel

#### Reusable Components (`/src/components/`)

**UI Components (`/ui/`)** - shadcn/ui based:
- button, card, input, select, table, dialog, etc.
- Fully typed TypeScript components
- Tailwind CSS styling

**Admin Components (`/admin/`):**
- VendorManagement
- ProductApproval
- Analytics
- SecurityMonitor

**Vendor Components (`/vendor/`):**
- VendorCard
- ProductList
- RegistrationForm

**Mobile Components (`/mobile/`):**
- MobileAppBanner
- DownloadCTA

### Mobile App Structure

```
mobile-app/
├── App.js                # Root component with navigation
├── screens/              # Screen components
├── components/           # Reusable components
└── services/            # API & Supabase services
```

Current mobile app uses functional structure without screens folder (all in App.js).

---

## Database Schema

### Core Tables

#### `vendors`
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_phone TEXT,
  email TEXT,
  location TEXT,
  category TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  category TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `admin_users`
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `app_versions`
```sql
CREATE TABLE app_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL,
  apk_url TEXT NOT NULL,
  changelog TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `upload_tokens`
```sql
CREATE TABLE upload_tokens (
  token TEXT PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  upload_type TEXT NOT NULL, -- 'vendor_logo', 'vendor_banner', 'product_image'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false
);
```

### Row Level Security (RLS) Policies

All tables have RLS enabled with policies for:
- **Public read access** (only approved items)
- **Authenticated vendor access** (own data only)
- **Admin full access** (via admin_users table)

See `/docs/architecture/DATABASE.md` for complete schema details.

---

## API Endpoints

### Vendor API (`/api/vendor/*`)

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/vendor/register` | POST | Vendor registration | No |
| `/api/vendor/login` | POST | Vendor authentication | No |
| `/api/vendor/products` | GET | List vendor products | Yes (JWT) |
| `/api/vendor/products` | POST | Create product | Yes (JWT) |
| `/api/vendor/products/[id]` | PUT | Update product | Yes (JWT) |
| `/api/vendor/products/[id]` | DELETE | Delete product | Yes (JWT) |
| `/api/vendor/analytics` | GET | Vendor analytics | Yes (JWT) |

### Admin API (`/api/admin/*`)

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/admin/login` | POST | Admin authentication | No |
| `/api/admin/vendors` | GET | List all vendors | Yes (Admin JWT) |
| `/api/admin/vendors/[id]/approve` | POST | Approve vendor | Yes (Admin JWT) |
| `/api/admin/vendors/[id]` | DELETE | Delete vendor | Yes (Admin JWT) |
| `/api/admin/products` | GET | List all products | Yes (Admin JWT) |
| `/api/admin/products/[id]/approve` | POST | Approve product | Yes (Admin JWT) |
| `/api/admin/analytics` | GET | Platform analytics | Yes (Admin JWT) |

### Upload API (`/api/upload-*`)

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/upload-vendor-image` | POST | Upload vendor logo/banner to R2 | Yes (Token-based v1.6.0+) |
| `/api/upload-product-image` | POST | Upload product image to R2 | Yes (Token-based v1.6.0+) |
| `/api/upload-token` | POST | Generate secure upload token | Yes (JWT) |

### Download API (`/api/download/*`)

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/download/latest` | GET | Get latest APK version info | No |
| `/api/app-version` | GET | Get current app version | No |

### Public API

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/vendors` | GET | List approved vendors | No |
| `/api/vendors/[id]` | GET | Get vendor details | No |
| `/api/products` | GET | List approved products | No |

---

## External Integrations

### Supabase
- **URL:** `process.env.NEXT_PUBLIC_SUPABASE_URL`
- **Anon Key:** `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Purpose:** Database, authentication, RLS policies
- **Client:** `@supabase/supabase-js` v2.75.0

### Cloudflare R2
- **Account ID:** `process.env.R2_ACCOUNT_ID`
- **Access Key:** `process.env.R2_ACCESS_KEY_ID`
- **Secret Key:** `process.env.R2_SECRET_ACCESS_KEY`
- **Bucket:** `process.env.R2_BUCKET_NAME` (rimmarsa-assets)
- **Public URL:** `process.env.R2_PUBLIC_URL`
- **Purpose:** APK hosting, vendor images, product images
- **Client:** `@aws-sdk/client-s3` v3.917.0

### Vercel
- **Deployment:** Auto-deploy on push to main branch
- **Edge Functions:** Geographic IP blocking (Mauritania only for vendor registration)
- **Environment:** Production + Preview environments
- **Configuration:** `vercel.json` with custom routing

---

## Authentication & Security

### Authentication Flow

#### Vendor Authentication
1. Vendor registers via mobile app (`/api/vendor/register`)
2. Credentials stored in Supabase Auth
3. JWT token issued on login (`/api/vendor/login`)
4. Token used for subsequent API requests
5. Token refresh mechanism for session persistence

#### Admin Authentication
1. Admin logs in via web dashboard (`/api/admin/login`)
2. Credentials verified against `admin_users` table (bcrypt hash)
3. JWT token issued with admin role
4. Token used for admin API requests

### Security Measures

#### Row Level Security (RLS)
- All database tables have RLS policies enabled
- Vendors can only access/modify their own data
- Public users can only view approved vendors/products
- Admins have full access via service role

#### Token-Based Upload System (v1.6.0+)
- Secure upload tokens generated via `/api/upload-token`
- Tokens are single-use with expiration
- Prevents unauthorized R2 uploads
- Tracked in `upload_tokens` table

#### Geographic Blocking
- Vercel Edge Functions block non-Mauritania IPs for sensitive endpoints
- Vendor registration restricted to Mauritania
- Implemented in `vercel.json` edge functions

#### Input Validation
- Zod schemas for all API inputs
- SQL injection prevention via parameterized queries
- XSS protection via React's built-in escaping

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────┐
│              Vercel Edge Network                     │
│  ┌─────────────────────────────────────────────┐   │
│  │   Next.js Application (www.rimmarsa.com)    │   │
│  │   - SSR & Server Components                  │   │
│  │   - API Routes (Serverless Functions)       │   │
│  │   - Edge Functions (Geo Blocking)           │   │
│  └──────────────┬──────────────────────────────┘   │
└─────────────────┼────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────────┐
│   Supabase    │   │  Cloudflare R2    │
│               │   │                   │
│ - PostgreSQL  │   │ - APK files       │
│ - Auth        │   │ - Vendor images   │
│ - RLS         │   │ - Product images  │
└───────────────┘   └───────────────────┘
```

### Build & Deployment Process

#### Web Marketplace
```bash
# Automatic on git push to main
git push origin main

# Vercel detects changes → builds → deploys
# Build command: cd marketplace && npm run build
# Output directory: marketplace/.next
```

#### Mobile App
```bash
# Manual build process
cd mobile-app
npm run build  # Uses Expo EAS Build

# Upload to R2
./DEPLOY.sh

# Update database version record
# Insert new version into app_versions table
```

### Environment Variables

#### Marketplace (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=rimmarsa-assets
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

#### Mobile App (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

---

## Current Issues & Technical Debt

### Known Issues
1. **Duplicate admin dashboard** - Both integrated in marketplace and standalone app
2. **Hardcoded credentials** - Some config in mobile app code (being refactored)
3. **Inconsistent folder structure** - Admin/vendor dashboards not following marketplace patterns
4. **Documentation sprawl** - 60+ markdown files (NOW ORGANIZED in /docs/)

### Planned Improvements
See `/docs/development/REORGANIZATION-PLAN.md` for full refactoring roadmap.

---

## Additional Resources

- **Complete Technical Specification:** [SPECIFICATION.md](./SPECIFICATION.md)
- **Database Schema:** [DATABASE.md](./DATABASE.md)
- **Security Documentation:** [../security/](../security/)
- **Deployment Guides:** [../deployment/](../deployment/)
- **Code Standards:** [../development/CODE-STANDARDS.md](../development/CODE-STANDARDS.md)

---

**Last Reviewed:** 2025-10-27
**Maintained By:** Development Team
**Status:** Living Document - Update as architecture evolves
