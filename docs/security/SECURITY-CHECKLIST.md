# Rimmarsa Security Pre-Production Checklist

**Version:** 1.0
**Date:** October 27, 2025
**Purpose:** Mandatory security verification before production launch

---

## ⚠️ CRITICAL - DO NOT LAUNCH WITHOUT THESE

### 🔴 VULN-001: R2 Credentials
- [ ] **CRITICAL**: Rotate R2 credentials immediately (Cloudflare Dashboard)
- [ ] Remove hardcoded credentials from `/marketplace/src/app/api/upload-vendor-image/route.ts`
- [ ] Move R2 credentials to environment variables
- [ ] Add environment variables to Vercel (production)
- [ ] Add R2 credentials to `.env.example` (WITHOUT real values)
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Test upload functionality with new credentials
- [ ] Scan git history for exposed credentials: `git log --all --full-history -p -S "7a9b56cea68966"`
- [ ] **IF FOUND IN GIT**: Rotate credentials again and accept history contamination OR rewrite git history

**Verification Command:**
```bash
# Ensure no hardcoded credentials remain
grep -r "7a9b56cea689661dbd115769c3fb371122080706b02ff674ddc686280bf81805" marketplace/src/
# Should return: no results

# Test API endpoint
curl -I https://rimmarsa.com/api/upload-vendor-image
# Should return: 200 OK or 401 (not 500 error)
```

---

### 🔴 VULN-002: Security Headers
- [ ] **CRITICAL**: Add security headers to `next.config.js`
- [ ] Implement Content-Security-Policy (CSP)
- [ ] Implement Strict-Transport-Security (HSTS)
- [ ] Implement X-Frame-Options: DENY
- [ ] Implement X-Content-Type-Options: nosniff
- [ ] Implement Referrer-Policy: strict-origin-when-cross-origin
- [ ] Deploy changes to Vercel
- [ ] Test security headers with: https://securityheaders.com/?q=https://rimmarsa.com
- [ ] **Target Score: A or higher**

**Verification Command:**
```bash
curl -I https://rimmarsa.com | grep -E "Content-Security-Policy|Strict-Transport|X-Frame-Options"
# Should return all three headers

# Or use online scanner
# https://securityheaders.com/?q=https://rimmarsa.com
# Target: Grade A or A+
```

---

## 🟠 HIGH PRIORITY - Fix Within 7 Days

### Authentication & Authorization
- [ ] Fix service role key fallback in `admin-auth.ts` (line 10)
- [ ] Fix service role key fallback in `vendor-auth.ts` (line 8)
- [ ] Add server-side context check (typeof window !== 'undefined')
- [ ] Implement fail-fast error handling for missing env vars

### Rate Limiting
- [ ] Change rate limiting from fail-open to fail-closed in `rate-limit.ts`
- [ ] Implement circuit breaker pattern (5 errors → open circuit)
- [ ] Add circuit breaker reset timer (60 seconds)
- [ ] Test rate limit bypass scenarios

### Session Management
- [ ] Implement admin session inactivity timeout (15 minutes)
- [ ] Add last-activity cookie tracking
- [ ] Add session timeout redirect to login page
- [ ] Test inactivity logout flow

### Geographic Access Control
- [ ] Add IP-based geolocation validation (not just header)
- [ ] Integrate MaxMind GeoIP2 or similar service
- [ ] Add localhost bypass for development (with warning)
- [ ] Test geo-fence with VPN from different countries

### File Upload Security
- [ ] Install `sharp` package: `npm install sharp`
- [ ] Implement image reprocessing and validation
- [ ] Strip all EXIF/metadata from uploaded images
- [ ] Validate image dimensions (prevent pixel bombs)
- [ ] Add file size validation before processing
- [ ] Test with malicious files (polyglots, EXIF exploits)

---

## 🟡 MEDIUM PRIORITY - Fix Within 30 Days

### Admin Security
- [ ] Create `admin_audit_log` table in Supabase
- [ ] Implement audit logging for vendor approvals
- [ ] Implement audit logging for password resets
- [ ] Implement audit logging for admin user creation
- [ ] Add audit log viewer in admin dashboard

### Authorization
- [ ] Create `requireAdmin()` middleware function
- [ ] Add admin role checks to ALL admin API endpoints:
  - [ ] `/api/admin/vendors/approve`
  - [ ] `/api/admin/security/alerts`
  - [ ] `/api/admin/security/summary`
  - [ ] `/api/admin/security/suspicious`
  - [ ] `/api/admin/security/traffic`
  - [ ] `/api/admin/login`
  - [ ] `/api/admin/check`
- [ ] Test horizontal privilege escalation (vendor → admin)
- [ ] Test vertical privilege escalation (vendor A → vendor B)

### Password Security
- [ ] Install bcrypt: `npm install bcryptjs`
- [ ] Hash vendor registration passwords BEFORE storing in `vendor_requests`
- [ ] Update database schema: Add `password_hash` column, remove `password`
- [ ] Update vendor approval flow to use hashed passwords
- [ ] Test end-to-end vendor registration and approval

### CSRF Protection
- [ ] Verify `SameSite=Strict` is set on all cookies (ALREADY DONE ✅)
- [ ] Optionally: Implement double-submit cookie CSRF tokens
- [ ] Test CSRF attacks with malicious HTML pages

### Referral System
- [ ] Add referral code validation during registration
- [ ] Check referral code belongs to active, approved vendor
- [ ] Prevent self-referral (vendor using own code)
- [ ] Add referral fraud detection monitoring

### Dependencies
- [ ] Run `npm audit` and review all vulnerabilities
- [ ] Update vulnerable dependencies: `npm audit fix`
- [ ] Update `@vercel/node` to latest version
- [ ] Update `vercel` CLI to latest version
- [ ] Set up Dependabot in GitHub repository
- [ ] Schedule monthly dependency reviews

---

## 🟢 LOW PRIORITY - Fix Within 60-90 Days

### Code Quality
- [ ] Enable ESLint in production builds
- [ ] Fix all ESLint warnings
- [ ] Add pre-commit hooks (Husky + lint-staged)
- [ ] Implement code coverage targets (>80%)

### Authentication Improvements
- [ ] Add email as secondary factor for vendors
- [ ] Implement SMS OTP for sensitive actions
- [ ] Add account recovery via email
- [ ] Implement phone number change flow with admin approval
- [ ] Add password expiration policy (90 days)

### Monitoring & Alerting
- [ ] Integrate Sentry for error tracking
- [ ] Set up Logtail for centralized logging
- [ ] Configure Slack webhooks for critical alerts
- [ ] Create security dashboard in Grafana
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)

### API Security
- [ ] Add rate limiting to vendor registration endpoint (3/hour per IP)
- [ ] Add rate limiting to password reset endpoints
- [ ] Implement API request signature verification
- [ ] Add request ID tracking for debugging

### Mobile App
- [ ] Implement certificate pinning for API calls
- [ ] Add root detection and jailbreak detection
- [ ] Implement code obfuscation (ProGuard for Android)
- [ ] Add app integrity checks (Firebase App Check)

---

## 📋 Compliance & Governance

### GDPR Compliance (If EU users)
- [ ] Create comprehensive privacy policy
- [ ] Implement cookie consent banner (OneTrust, Cookiebot)
- [ ] Build data export feature (user dashboard)
- [ ] Build data deletion feature ("right to be forgotten")
- [ ] Appoint Data Protection Officer (DPO) if required
- [ ] Document data processing activities
- [ ] Create data breach notification procedure

### PCI DSS (Payment Screenshots)
- [ ] Minimize payment screenshot storage duration (delete after 90 days)
- [ ] Encrypt payment screenshots at rest
- [ ] Restrict access to payment screenshots (admin-only)
- [ ] Implement access logging for payment screenshot views
- [ ] Create secure payment screenshot deletion procedure

### Local Regulations (Mauritania)
- [ ] Consult with local legal counsel on data residency requirements
- [ ] Verify Supabase AWS region compliance
- [ ] Register business with local authorities if required
- [ ] Review local e-commerce regulations

---

## 🔒 Security Testing

### Manual Testing
- [ ] Test brute-force protection on login endpoints
- [ ] Test password complexity enforcement
- [ ] Test session timeout (15 min inactivity)
- [ ] Test account enumeration via login errors
- [ ] Test JWT token expiration
- [ ] Verify RLS policies with test script (`test-rls-policies.sql`)
- [ ] Test admin role enforcement on all admin endpoints
- [ ] Test horizontal privilege escalation scenarios
- [ ] Test vertical privilege escalation scenarios
- [ ] Test SQL injection on search fields
- [ ] Test XSS on product descriptions and vendor names
- [ ] Test file upload validation
- [ ] Test rate limiting bypass techniques
- [ ] Test parameter tampering (modify vendor_id)

### Automated Testing
- [ ] Run SAST scan: `semgrep --config=auto src/`
- [ ] Run DAST scan: OWASP ZAP baseline scan
- [ ] Run dependency scan: `npm audit`
- [ ] Run Snyk scan: `npx snyk test`
- [ ] Set up automated security testing in CI/CD

### Penetration Testing
- [ ] Schedule external penetration test (annual)
- [ ] Budget: $5,000 - $15,000 USD
- [ ] Obtain pentest report and remediation plan
- [ ] Verify all findings are addressed

---

## 🚀 Pre-Launch Final Verification

### Critical Systems Check (Day Before Launch)
- [ ] ✅ All CRITICAL vulnerabilities fixed (VULN-001, VULN-002)
- [ ] ✅ Security headers return Grade A+ on securityheaders.com
- [ ] ✅ No hardcoded credentials in source code
- [ ] ✅ All environment variables set in Vercel production
- [ ] ✅ Rate limiting tested and working
- [ ] ✅ RLS policies verified and enabled
- [ ] ✅ Geo-fence tested and blocking non-MR traffic
- [ ] ✅ File upload validation tested
- [ ] ✅ Admin authentication tested
- [ ] ✅ Vendor authentication tested

### Performance & Availability Check
- [ ] Load test API endpoints (JMeter, k6)
- [ ] Verify database connection pool settings
- [ ] Test backup and restore procedures
- [ ] Verify CDN caching is working (Vercel Edge)
- [ ] Set up uptime monitoring

### Monitoring & Alerting Check
- [ ] Sentry integrated and receiving errors
- [ ] Logtail collecting logs
- [ ] Slack alerts configured
- [ ] On-call rotation established
- [ ] Incident response plan documented

### Documentation Check
- [ ] Security documentation completed
- [ ] API documentation up-to-date
- [ ] Runbooks created for common incidents
- [ ] Admin user guide created
- [ ] Vendor onboarding guide created

---

## 📊 Security Metrics

### Track These Metrics Post-Launch
- **Failed login attempts** per hour (target: <10)
- **Rate limit violations** per day (target: <50)
- **Geo-fence blocks** per day (target: <100)
- **Malware-infected uploads blocked** (target: 0)
- **Admin session timeouts** per day (track for UX)
- **Security incidents** (target: 0)
- **Mean time to patch (MTTP)** (target: <7 days)

---

## ✅ Sign-Off

**Before launching to production, the following stakeholders must sign off:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Owner/CEO** | | | |
| **Lead Developer** | | | |
| **Security Reviewer** | | | |

**By signing, I confirm that:**
1. All CRITICAL vulnerabilities (VULN-001, VULN-002) have been fixed
2. Security headers are implemented and tested (Grade A+)
3. All sensitive credentials have been moved to environment variables
4. The application has been tested for common vulnerabilities (OWASP Top 10)
5. Monitoring and alerting are configured
6. An incident response plan is in place
7. I accept the residual risks documented in the Security Assessment Report

---

## 🆘 Emergency Contacts

| Role | Contact | Phone | Email |
|------|---------|-------|-------|
| **Owner** | | | tasynmym@gmail.com |
| **Supabase Support** | | | support@supabase.io |
| **Cloudflare Support** | | | https://dash.cloudflare.com/support |
| **Vercel Support** | | | https://vercel.com/support |

---

## 📚 References

- Security Assessment Report: `/home/taleb/rimmarsa/SECURITY-ASSESSMENT-REPORT.md`
- Security Fixes (Machine-Readable): `/home/taleb/rimmarsa/SECURITY-FIXES.json`
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org/
- Supabase Security: https://supabase.com/docs/guides/platform/security
- Vercel Security: https://vercel.com/docs/security

---

**REMEMBER:** Security is not a one-time task. Schedule quarterly security reviews and annual penetration tests.

**Last Updated:** October 27, 2025
**Next Review:** January 27, 2026
