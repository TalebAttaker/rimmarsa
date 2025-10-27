# Rimmarsa - Multi-Vendor E-Commerce Platform

A complete e-commerce ecosystem targeting Mauritania with public marketplace, vendor management, and mobile applications.

**Production:** https://www.rimmarsa.com
**Version:** 1.7.0
**Status:** Production Ready

---

## Quick Links

- [Architecture Documentation](./docs/architecture/README.md)
- [Quick Start Guide](./docs/development/QUICK-START.md)
- [Security Guidelines](./docs/security/README.md)
- [Deployment Guide](./docs/deployment/README.md)
- [Testing Guide](./docs/testing/README.md)

---

## Project Overview

Rimmarsa is a multi-vendor marketplace platform consisting of four main applications:

1. **Web Marketplace** - Customer-facing marketplace with vendor discovery and registration
2. **Mobile Vendor App** - React Native/Expo app for vendor management
3. **Admin Dashboard** - Administrative control panel for platform management
4. **Vendor Dashboard** - Web portal for vendor product and analytics management

---

## Technology Stack

### Web Marketplace
- **Framework:** Next.js 15.5.5 (App Router)
- **UI:** React 19.1.0, TypeScript, Tailwind CSS 4.x
- **Animations:** Framer Motion 12.23.24
- **Hosting:** Vercel (with geographic blocking for security)

### Mobile Vendor App
- **Framework:** React Native 0.74.5, Expo 51.0.0
- **Platform:** Android (APK distributed via R2)
- **API Client:** Supabase JS 2.76.1
- **Current Version:** 1.7.0

### Dashboards (Admin & Vendor)
- **Framework:** React 18.x, Vite
- **UI Components:** shadcn/ui, Radix UI
- **Data Visualization:** Recharts, TanStack Table

### Backend & Infrastructure
- **Database:** PostgreSQL 13.x (Supabase Cloud)
- **Authentication:** Supabase Auth with Row Level Security (RLS)
- **API:** Next.js API Routes (Serverless)
- **Storage:** Cloudflare R2 (S3-compatible)
- **CDN/Hosting:** Vercel Edge Network

---

## Project Structure

```
rimmarsa/
├── marketplace/          # Next.js 15 web marketplace
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   ├── lib/            # Utilities and helpers
│   └── public/         # Static assets
├── mobile-app/          # React Native vendor app
│   ├── App.js          # Main entry point
│   ├── app.config.js   # Expo configuration
│   └── eas.json        # Expo Application Services
├── admin-dashboard/     # React admin panel
├── vendor-dashboard/    # React vendor panel
├── supabase/           # Database migrations & functions
│   ├── migrations/     # SQL migration files
│   └── functions/      # Edge functions
├── docs/               # Documentation (organized)
│   ├── architecture/   # System design & specs
│   ├── security/       # Security guidelines
│   ├── development/    # Dev guides & standards
│   ├── deployment/     # Deploy & release docs
│   ├── testing/        # Test guides & checklists
│   └── archive/        # Historical documentation
└── .github/            # CI/CD workflows
```

---

## Key Features

### For Customers
- Browse multi-vendor marketplace with category filtering
- Search and discover local vendors
- Direct WhatsApp integration for vendor contact
- Mobile-responsive design

### For Vendors
- Self-service registration via mobile app
- Product catalog management
- Real-time analytics dashboard
- Subscription management
- Image upload to Cloudflare R2

### For Admins
- Complete vendor approval workflow
- Product moderation and management
- Platform analytics and monitoring
- Security controls and RLS policies
- APK version management for mobile app

### Platform Features
- JWT-based authentication with refresh tokens
- Row Level Security (RLS) for data isolation
- Cloudflare R2 for scalable file storage
- Geographic IP blocking for security
- Automated deployment via Vercel
- Mobile app distribution via R2 CDN

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git
- Supabase account (for database and auth)
- Cloudflare account (for R2 storage)
- Vercel account (for deployment)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/TalebAttaker/rimmarsa.git
cd rimmarsa

# Install marketplace dependencies
cd marketplace
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

For detailed setup instructions, see [Quick Start Guide](./docs/development/QUICK-START.md)

---

## Development Workflow

1. **Feature Development:** Work on feature branches
2. **Code Review:** Follow code standards in [docs/development/CODE-STANDARDS.md](./docs/development/CODE-STANDARDS.md)
3. **Testing:** Run tests before committing (see [docs/testing/](./docs/testing/))
4. **Deployment:** Automated via Vercel on merge to main

See [DEVELOPMENT-WORKFLOW.md](./docs/archive/DEVELOPMENT-WORKFLOW.md) for detailed workflow.

---

## Environment Variables

Each application requires its own environment configuration:

### Marketplace (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

### Mobile App (.env)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

See `.env.example` files in each directory for complete configuration.

---

## Deployment

### Web Marketplace
- **Platform:** Vercel
- **Branch:** main (auto-deploy)
- **URL:** https://www.rimmarsa.com
- **Build Command:** `cd marketplace && npm run build`

### Mobile App
- **Platform:** Expo EAS Build
- **Distribution:** Cloudflare R2 (APK hosting)
- **Update Process:** Build → Upload to R2 → Update database version record

See [Deployment Guide](./docs/deployment/README.md) for detailed instructions.

---

## Security

Security is a top priority for Rimmarsa:

- Row Level Security (RLS) policies on all database tables
- Geographic IP blocking via Vercel Edge Functions
- Secure token-based upload system (v1.6.0+)
- JWT authentication with refresh tokens
- HTTPS-only communication
- Regular security audits

See [Security Documentation](./docs/security/README.md) for comprehensive guidelines.

---

## Testing

- **Manual Testing:** [docs/testing/MANUAL-TESTING-CHECKLIST.md](./docs/testing/MANUAL-TESTING-CHECKLIST.md)
- **Mobile Testing:** [docs/testing/MOBILE-APP-TESTING-GUIDE.md](./docs/testing/MOBILE-APP-TESTING-GUIDE.md)
- **R2 Migration:** [docs/testing/R2-MIGRATION-TESTING-GUIDE.md](./docs/testing/R2-MIGRATION-TESTING-GUIDE.md)

---

## Documentation

All documentation has been organized into `/docs/` with the following structure:

- **architecture/** - System architecture, specifications, database schema
- **security/** - Security policies, checklists, implementation guides
- **development/** - Code standards, refactoring plans, development guides
- **deployment/** - Build instructions, deployment guides, release notes
- **testing/** - Testing guides, checklists, test status reports
- **archive/** - Historical documentation and session summaries

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow code standards in [docs/development/CODE-STANDARDS.md](./docs/development/CODE-STANDARDS.md)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## Support

For issues, questions, or support:

- Create an issue on GitHub
- Review documentation in `/docs/`
- Check [docs/archive/SESSION-SUMMARY.md](./docs/archive/SESSION-SUMMARY.md) for common issues

---

## License

All rights reserved.

---

## Version History

- **v1.7.0** - Current production version
- **v1.6.0** - Security upgrade with token-based uploads
- **v1.5.0** - R2 migration complete
- **v1.4.0** - Expo update fixes
- **v1.3.0** - APK deployment automation
- **v1.2.0** - Initial production release

See [docs/deployment/](./docs/deployment/) for detailed release notes.
