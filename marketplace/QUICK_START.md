# 🚀 RIMMARSA QUICK START GUIDE

## 📁 What You Got

Your rimmarsa platform now has **enterprise-grade security** with comprehensive monitoring. Here's everything at a glance:

---

## 🔐 Security Features (Active Now)

✅ **Rate Limiting** - DDoS protection via Supabase
✅ **IP Geofencing** - Mauritania-only access
✅ **Secure Auth** - Supabase Auth (phone + password)
✅ **Input Validation** - Zod schemas prevent attacks
✅ **Monitoring** - Real-time security dashboard

---

## 🎯 Quick Commands

### 1. Migrate Existing Vendors to Supabase Auth

```bash
# Install dependencies first (if needed)
npm install tsx @supabase/supabase-js

# Run migration
npx tsx scripts/security/migrate-vendors-to-auth.ts
```

**What it does:**
- Creates Supabase Auth accounts for all approved vendors
- Generates temporary passwords
- Outputs credentials file for you to share with vendors

**Output:**
- Console: Summary of migration
- File: `vendor-credentials-YYYY-MM-DD.txt` (send to vendors securely)

---

### 2. Test Security Features

```bash
# Test everything (local)
./scripts/security/test-security.sh

# Test production
./scripts/security/test-security.sh https://rimmarsa.com
```

**What it tests:**
- ✓ Rate limiting (authentication)
- ✓ Input validation
- ✓ Security headers
- ✓ Rate limit headers
- ⚠ Geofencing (manual test required)

---

### 3. Monitor Security (API)

```bash
# Get security summary
curl https://rimmarsa.com/api/admin/security/summary

# Check active alerts
curl https://rimmarsa.com/api/admin/security/alerts

# View traffic report (last 24 hours)
curl https://rimmarsa.com/api/admin/security/traffic?hours=24

# See suspicious IPs
curl https://rimmarsa.com/api/admin/security/suspicious
```

---

### 4. Monitor Security (Supabase SQL)

Go to: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/sql

```sql
-- Quick security summary
SELECT * FROM public.get_security_summary();

-- Active security alerts
SELECT * FROM public.check_security_alerts();

-- Suspicious activity
SELECT * FROM public.suspicious_activity;

-- Failed login attempts
SELECT * FROM public.failed_login_monitor;

-- Hourly traffic report
SELECT * FROM public.get_hourly_traffic_report(24);
```

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| `SECURITY_IMPLEMENTATION.md` | Complete security features guide |
| `MONITORING_GUIDE.md` | How to monitor and respond to alerts |
| `QUICK_START.md` | This file - quick reference |

---

## 🛠️ Files Created

### Database Migrations (Applied ✅)
```
supabase/migrations/
├── 20250121000001_create_rate_limiting.sql       # Rate limiting system
├── 20250121000002_vendor_email_generation.sql    # Email auto-generation
└── 20250121000003_monitoring_views.sql           # Monitoring views/functions
```

### Security Libraries
```
src/lib/
├── rate-limit.ts                    # Supabase rate limiting
├── geo-fence.ts                     # IP geofencing
├── auth/
│   ├── vendor-auth.ts              # Vendor authentication
│   └── admin-auth.ts               # Admin authentication
└── validation/
    └── schemas.ts                  # Zod validation schemas
```

### API Routes
```
src/app/api/
├── vendor/login/route.ts           # Vendor login (NEW)
├── admin/
│   ├── login/route.ts              # Admin login (UPDATED)
│   └── security/
│       ├── summary/route.ts        # Security summary
│       ├── alerts/route.ts         # Active alerts
│       ├── traffic/route.ts        # Traffic report
│       └── suspicious/route.ts     # Suspicious IPs
```

### Scripts
```
scripts/security/
├── migrate-vendors-to-auth.ts      # Create Auth users for vendors
└── test-security.sh                # Test security features
```

### Middleware
```
src/middleware.ts                   # Edge middleware (geo + rate limit)
```

---

## 🎬 First Steps After Deployment

### Step 1: Migrate Vendors
```bash
npx tsx scripts/security/migrate-vendors-to-auth.ts
```

- This creates Supabase Auth accounts for your 5 existing vendors
- Outputs credentials to file
- Send credentials to vendors via WhatsApp (securely!)

### Step 2: Test Security
```bash
./scripts/security/test-security.sh https://rimmarsa.com
```

- Verifies all security features are working
- Takes ~30 seconds
- Shows PASS/FAIL for each test

### Step 3: Monitor Daily

**Morning (9 AM):**
```bash
curl https://rimmarsa.com/api/admin/security/summary
curl https://rimmarsa.com/api/admin/security/alerts
```

**Evening (6 PM):**
```bash
curl https://rimmarsa.com/api/admin/security/traffic?hours=24
```

Or in Supabase:
```sql
SELECT * FROM public.get_security_summary();
SELECT * FROM public.check_security_alerts();
```

---

## ⚠️ Important Notes

### Environment Variables (Already Set)
```env
NEXT_PUBLIC_SUPABASE_URL=https://rfyqzuuuumgdoomyhqcu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
NODE_ENV=production
```

### Security Settings

**Rate Limits:**
- Global: 100 requests/minute per IP
- Auth: 5 attempts per 15 minutes
- API: 30 requests/minute per IP

**Geofencing:**
- ✅ Allows: Mauritania (MR)
- ❌ Blocks: All other countries
- Dev mode: Allows localhost

**Passwords:**
- Minimum: 12 characters
- Must have: uppercase, lowercase, number, symbol

---

## 🆘 Troubleshooting

### "Rate limit check error"
→ Check `SUPABASE_SERVICE_ROLE_KEY` in environment variables

### "Vendor not found after login"
→ Run migration script: `npx tsx scripts/security/migrate-vendors-to-auth.ts`

### "Geofencing blocks localhost"
→ Set `NODE_ENV=development` in `.env.local`

### "Middleware not running"
→ Check `src/middleware.ts` exists and `vercel.json` is configured

---

## 📞 Support

**Security Issues:**
- Check: `MONITORING_GUIDE.md`
- Supabase Logs: https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/logs
- Vercel Logs: https://vercel.com/taleb-ahmeds-projects/rimmarsa/logs

**Documentation:**
- Implementation: `SECURITY_IMPLEMENTATION.md`
- Monitoring: `MONITORING_GUIDE.md`

---

## 🎯 What's Protecting Your Platform

| Attack Type | Protection | Status |
|------------|------------|--------|
| DDoS | Rate limiting (100/min) | ✅ Active |
| Brute Force | Auth rate limit (5/15min) | ✅ Active |
| SQL Injection | Parameterized queries + Zod | ✅ Active |
| XSS | Input sanitization + CSP | ✅ Active |
| CSRF | SameSite cookies | ✅ Active |
| Unauthorized Access | IP geofencing | ✅ Active |
| Session Hijacking | HTTP-only cookies | ✅ Active |
| Weak Passwords | Strong policy (12+ chars) | ✅ Active |

---

**Security Level:** 🔐 **PRODUCTION-READY**

**Last Updated:** 2025-01-21
**Version:** 1.0.0
