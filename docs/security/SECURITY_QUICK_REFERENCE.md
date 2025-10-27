# Security Quick Reference Guide
## Rimmarsa Vendor Mobile App - Critical Security Controls

**🚨 EMERGENCY CONTACT:** [Your security team contact]
**📋 FULL ASSESSMENT:** See `SECURITY_ASSESSMENT_VENDOR_MOBILE_APP.md`
**📝 IMPLEMENTATION GUIDE:** See `SECURITY_IMPLEMENTATION_GUIDE.md`
**✅ CHECKLIST:** See `MOBILE_APP_SECURITY_CHECKLIST.md`

---

## 🔴 CRITICAL ISSUES (FIX IMMEDIATELY)

### 1. Hardcoded Credentials (30 min fix)
**File:** `/home/taleb/rimmarsa/mobile-app/app.json`
**Issue:** Supabase URL and anon key hardcoded
**Fix:** Remove from `app.json`, fetch from API on app startup
```bash
# Remove this from app.json:
"extra": {
  "supabaseUrl": "...",
  "supabaseAnonKey": "..."
}
```

### 2. Missing Database Column (15 min fix)
**Issue:** Code expects `is_approved` column but doesn't exist
**Fix:** Run migration
```sql
ALTER TABLE vendors ADD COLUMN is_approved BOOLEAN DEFAULT false;
UPDATE vendors SET is_approved = is_verified WHERE is_approved IS NULL;
```

### 3. Incomplete RLS Policies (2 hour fix)
**Issue:** Vendors can access other vendors' data
**Fix:** Apply comprehensive RLS policies (see implementation guide)
**Test:** Login as Vendor A, try to query Vendor B's products → should return 0 rows

### 4. Insecure Token Storage (1 hour fix)
**Issue:** Tokens in plaintext AsyncStorage
**Fix:** Use expo-secure-store
```bash
npx expo install expo-secure-store
# Then implement SecureTokenManager (see implementation guide)
```

---

## 🟡 HIGH PRIORITY (FIX BEFORE LAUNCH)

### 5. No Certificate Pinning
**Impact:** MitM attacks possible
**Fix:** Implement network security config (3 hours)
**Test:** Use mitmproxy → app should refuse connection

### 6. No Code Obfuscation
**Impact:** Easy reverse engineering
**Fix:** Enable ProGuard + Hermes (1 hour)
**Test:** Decompile APK → verify obfuscated code

### 7. No APK Signing
**Impact:** APK can be modified/trojanized
**Fix:** Use EAS Build with proper signing (2 hours)
**Test:** Verify APK signature with jarsigner

### 8. Weak Session Management
**Impact:** Sessions never expire, unlimited devices
**Fix:** Implement session timeout + device tracking (3 hours)
**Test:** Login, wait 30 min idle → next request should fail

---

## 📊 SECURITY METRICS TO MONITOR

| Metric | Threshold | Action |
|--------|-----------|--------|
| Failed login rate | >5 per 15min per IP | Block IP temporarily |
| Active sessions per vendor | >3 devices | Alert vendor |
| APK downloads | >3 per hour per IP | Rate limit triggered |
| Product creation rate | >10 per hour | Rate limit triggered |
| Security events (critical) | Any | Immediate alert |

---

## 🔧 QUICK COMMANDS

### Check APK Security
```bash
# Decompile APK
apktool d rimmarsa-vendor.apk

# Extract JavaScript bundle
cd rimmarsa-vendor/assets
cat index.android.bundle | grep -i "supabase\|password\|secret\|key"

# Verify signature
jarsigner -verify -verbose -certs rimmarsa-vendor.apk
```

### Test Certificate Pinning
```bash
# Start mitmproxy
mitmproxy -p 8080

# Configure Android device to use proxy
# IP: your-computer-ip, Port: 8080

# Install mitmproxy certificate on device
adb push ~/.mitmproxy/mitmproxy-ca-cert.cer /sdcard/

# Open app → if pinning works, connection should fail
```

### Test RLS Policies
```sql
-- Login as Vendor A (user_id = 'vendor-a-uuid')
-- Try to access Vendor B's data
SELECT * FROM products WHERE vendor_id = 'vendor-b-uuid';
-- Expected: 0 rows

-- Try to update Vendor B's product
UPDATE products SET price = 1 WHERE vendor_id = 'vendor-b-uuid';
-- Expected: 0 rows updated
```

### Check Token Storage
```bash
# Connect to device
adb shell

# Check AsyncStorage (should NOT contain tokens)
cd /data/data/com.rimmarsa.mobile/files/RCTAsyncLocalStorage_V1
ls -la
cat manifest-*
# Should NOT see auth tokens here

# Tokens should be in EncryptedSharedPreferences instead
cd /data/data/com.rimmarsa.mobile/shared_prefs
ls -la
# Look for androidx.security.crypto files
```

---

## 🚀 PRE-LAUNCH CHECKLIST (1 Hour Before Release)

```markdown
## Critical Security Verification

### APK Security
- [ ] APK signed with production keystore (not debug)
- [ ] Decompile and verify NO hardcoded credentials
- [ ] ProGuard obfuscation enabled (classes named a.b.c)
- [ ] Hermes bytecode enabled (.hbc files)
- [ ] SHA-256 checksum generated and published

### Backend Security
- [ ] All migrations applied (check is_approved column exists)
- [ ] RLS policies tested (vendors isolated from each other)
- [ ] Rate limiting active on all endpoints
- [ ] Security event logging functional

### Authentication
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Failed login rate limiting active (5 per 15min)
- [ ] Tokens stored in SecureStore (verified with ADB)
- [ ] Session timeout works (30 min idle)

### Network Security
- [ ] Certificate pinning blocks mitmproxy
- [ ] All API calls use HTTPS
- [ ] Network security config deployed

### Monitoring
- [ ] Security events table exists
- [ ] Login events being logged
- [ ] APK download tracking active
- [ ] Alert mechanism tested

### Documentation
- [ ] Download page shows SHA-256 checksum
- [ ] Installation instructions published
- [ ] Emergency contact info updated
- [ ] Incident response plan ready
```

---

## 🆘 EMERGENCY PROCEDURES

### If APK Compromised (Trojan Distributed)

**Within 1 Hour:**
1. Block APK downloads: Comment out download endpoint
2. Invalidate all sessions: `UPDATE vendor_sessions SET is_active = false;`
3. Send emergency notification to all vendors (SMS + Email)
4. Post security alert on website

**Within 24 Hours:**
1. Build new APK with new signing key
2. Publish new SHA-256 checksum
3. Force critical update (block old versions)
4. Communicate update instructions

**Within 1 Week:**
1. Conduct forensic analysis
2. Identify attack vector
3. Patch vulnerability
4. Update security procedures
5. Notify authorities if required

### If Database Breach Detected

**Immediate:**
1. Rotate Supabase service role key
2. Invalidate all vendor sessions
3. Enable IP whitelisting in Supabase
4. Review access logs for suspicious activity

**Within 24 Hours:**
1. Audit all RLS policies
2. Review and patch vulnerabilities
3. Notify affected vendors (if PII exposed)
4. Document incident

**Within 1 Week:**
1. Engage security consultant
2. Conduct comprehensive security audit
3. Implement additional monitoring
4. Review and update all security policies

### If Hardcoded Credentials Leaked

**Immediate:**
1. Rotate Supabase anon key (Supabase Dashboard → Settings → API)
2. Update production APK with new key
3. Force critical update
4. Monitor for suspicious API usage

**Within 24 Hours:**
1. Analyze access logs for abuse
2. Block suspicious IPs
3. Review and strengthen RLS policies
4. Update security documentation

---

## 📞 CONTACT INFORMATION

### Internal Team
- **Security Lead:** [Name, Email, Phone]
- **CTO:** [Name, Email, Phone]
- **DevOps:** [Name, Email, Phone]
- **Support Team:** [Email, Phone]

### External Services
- **Supabase Support:** https://supabase.com/support
- **Expo Support:** https://expo.dev/support
- **Vercel Support:** https://vercel.com/support

### Security Researchers
- **Bug Bounty:** [Your bug bounty program if exists]
- **Responsible Disclosure:** security@rimmarsa.com

---

## 🔗 USEFUL LINKS

### Documentation
- Full Security Assessment: `/home/taleb/rimmarsa/SECURITY_ASSESSMENT_VENDOR_MOBILE_APP.md`
- Implementation Guide: `/home/taleb/rimmarsa/SECURITY_IMPLEMENTATION_GUIDE.md`
- Security Checklist: `/home/taleb/rimmarsa/MOBILE_APP_SECURITY_CHECKLIST.md`

### External Resources
- OWASP Mobile Top 10: https://owasp.org/www-project-mobile-top-10/
- Expo Security: https://docs.expo.dev/guides/security/
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Android Network Security: https://developer.android.com/training/articles/security-config

### Tools
- APK Decompiler (jadx): https://github.com/skylot/jadx
- mitmproxy: https://mitmproxy.org/
- OpenSSL: https://www.openssl.org/
- EAS CLI: https://github.com/expo/eas-cli

---

## 📊 SECURITY SCORE CALCULATOR

Use this to track your security posture:

```
CRITICAL ISSUES (Must be 0):
- Hardcoded credentials: ___
- Missing RLS policies: ___
- Insecure token storage: ___
- No APK signing: ___

HIGH PRIORITY (Should be 0 before launch):
- No certificate pinning: ___
- No code obfuscation: ___
- Weak session management: ___
- Missing security monitoring: ___

SECURITY SCORE:
10/10 = All critical + high priority issues fixed
8-9/10 = All critical fixed, some high priority remain
6-7/10 = Some critical issues remain
<6/10 = DO NOT LAUNCH - multiple critical issues

Current Score: ___ / 10
```

---

## 🎯 30-DAY SECURITY ROADMAP

### Week 1: Critical Fixes
- [ ] Remove hardcoded credentials
- [ ] Fix missing database column
- [ ] Implement RLS policies
- [ ] Switch to SecureStore

### Week 2: High Priority
- [ ] Implement certificate pinning
- [ ] Enable code obfuscation
- [ ] Set up APK signing with EAS
- [ ] Implement session management

### Week 3: Testing & Monitoring
- [ ] Security testing (RLS, auth, network)
- [ ] Set up security event logging
- [ ] Set up monitoring dashboards
- [ ] Document procedures

### Week 4: Launch Preparation
- [ ] Final security review
- [ ] Penetration testing (if budget allows)
- [ ] Prepare incident response plan
- [ ] Limited beta test (5-10 vendors)

---

**Last Updated:** 2025-10-22
**Review Frequency:** Weekly during development, Monthly post-launch
**Owner:** Security Team

**⚠️ REMEMBER: Security is not a one-time task. Continuous monitoring and updates are essential.**
