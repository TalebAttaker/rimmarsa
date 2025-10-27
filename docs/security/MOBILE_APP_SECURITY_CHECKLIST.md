# Mobile App Security Development Checklist
## Rimmarsa Vendor Mobile App - React Native/Expo

**Version:** 1.0
**Target Platform:** Android APK Distribution
**Framework:** React Native + Expo
**Backend:** Supabase (PostgreSQL + Auth + Storage)

---

## PRE-DEVELOPMENT SECURITY SETUP

### Environment & Configuration
- [ ] Remove hardcoded Supabase credentials from `app.json`
- [ ] Create environment configuration system (dev vs production)
- [ ] Add sensitive files to `.gitignore` (keys, keystores, env files)
- [ ] Set up Expo EAS for secure builds
- [ ] Generate production keystore and store in secure vault (NOT in git)
- [ ] Document keystore password in password manager

### Dependencies & Supply Chain
- [ ] Audit all npm dependencies for known vulnerabilities: `npm audit`
- [ ] Use exact dependency versions (no `^` or `~` in package.json)
- [ ] Review permissions requested by third-party libraries
- [ ] Remove unused dependencies
- [ ] Set up automated dependency scanning (Dependabot, Snyk)

---

## AUTHENTICATION & SESSION MANAGEMENT

### Token Storage
- [ ] Install `expo-secure-store` for secure token storage
- [ ] Replace `AsyncStorage` with `SecureStore` for sensitive data
- [ ] Implement `SecureTokenManager` class
- [ ] Configure keychain accessibility: `WHEN_UNLOCKED` (iOS)
- [ ] Use `EncryptedSharedPreferences` (Android - handled by SecureStore)
- [ ] Never log tokens to console (especially in production)

### Login Flow
- [ ] Validate phone number format before API call
- [ ] Implement password strength indicator (optional but recommended)
- [ ] Show/hide password toggle
- [ ] Implement "Remember Me" functionality with SecureStore
- [ ] Clear sensitive fields from memory after use
- [ ] Implement login rate limiting (client-side warning + server enforcement)

### Session Management
- [ ] Implement session timeout (30 minutes idle)
- [ ] Auto-refresh tokens before expiry
- [ ] Implement activity tracking (ping every 5 minutes when app active)
- [ ] Handle session expiry gracefully (redirect to login)
- [ ] Implement "Logout from all devices" functionality
- [ ] Show active sessions list in settings
- [ ] Implement device binding (store device_id in user metadata)

### Logout
- [ ] Clear all tokens from SecureStore
- [ ] Clear Supabase session
- [ ] Clear sensitive data from app state/redux
- [ ] Clear navigation stack (prevent back button access)
- [ ] Invalidate session on backend

---

## DATA SECURITY

### Sensitive Data Handling
- [ ] Never store passwords (even temporarily)
- [ ] Encrypt sensitive data before storing locally (if needed)
- [ ] Clear clipboard after copying sensitive data
- [ ] Implement auto-lock after inactivity
- [ ] Prevent screenshots on sensitive screens (optional)
- [ ] Sanitize log output (no PII in logs)

### API Communication
- [ ] Use HTTPS only (enforce in network config)
- [ ] Implement certificate pinning for Supabase API
- [ ] Implement certificate pinning for rimmarsa.com API
- [ ] Validate SSL certificates
- [ ] Implement request timeout (30 seconds)
- [ ] Handle network errors gracefully
- [ ] Implement retry logic with exponential backoff

### Input Validation
- [ ] Validate all user inputs client-side (don't rely on server validation alone)
- [ ] Sanitize inputs before displaying (prevent XSS in WebViews)
- [ ] Validate file uploads (type, size, content)
- [ ] Implement max length for text inputs
- [ ] Validate phone numbers with regex
- [ ] Validate email format

---

## NETWORK SECURITY

### Certificate Pinning (Android)
- [ ] Create `network_security_config.xml`
- [ ] Get Supabase certificate pin (SHA-256)
- [ ] Get rimmarsa.com certificate pin (SHA-256)
- [ ] Include backup pin for certificate rotation
- [ ] Set pin expiration date (1 year from deployment)
- [ ] Reference config in `AndroidManifest.xml`
- [ ] Test pinning with mitmproxy (should fail to connect)

### HTTPS Enforcement
- [ ] Disable cleartext traffic in network config
- [ ] Verify all API endpoints use HTTPS
- [ ] Verify image URLs use HTTPS
- [ ] Test app blocks HTTP connections

---

## APP INTEGRITY & ANTI-TAMPERING

### Code Obfuscation
- [ ] Enable Hermes JavaScript engine
- [ ] Enable ProGuard/R8 in release builds
- [ ] Create `proguard-rules.pro` with appropriate keep rules
- [ ] Test obfuscated build thoroughly
- [ ] Verify decompiled APK shows obfuscated code
- [ ] Keep source maps for crash reporting (store securely)

### Runtime Integrity Checks
- [ ] Implement app signature verification
- [ ] Detect rooted/jailbroken devices (show warning, don't block)
- [ ] Detect emulator environment (show warning in production)
- [ ] Detect debugger attachment (show warning in production)
- [ ] Implement runtime tampering detection (optional - advanced)
- [ ] Log integrity check failures to backend

### APK Signing
- [ ] Sign APK with production keystore
- [ ] Use EAS Build for reproducible builds
- [ ] Generate SHA-256 checksum of final APK
- [ ] Publish checksum on download page
- [ ] Store keystore backup in multiple secure locations
- [ ] Document signing process in runbook

---

## PERMISSIONS & PRIVACY

### Android Permissions
- [ ] Request only necessary permissions (CAMERA, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE)
- [ ] Request permissions at runtime (not at install time)
- [ ] Provide clear explanation for each permission request
- [ ] Handle permission denial gracefully
- [ ] Don't repeatedly ask for denied permissions (show settings link)
- [ ] Remove unused permissions from `AndroidManifest.xml`

### Privacy Features
- [ ] Implement privacy policy link in app
- [ ] Implement terms of service link in app
- [ ] Allow users to delete their data (GDPR compliance)
- [ ] Allow users to export their data (GDPR compliance)
- [ ] Clear consent for data collection
- [ ] Implement opt-out for analytics (if using analytics)

---

## ERROR HANDLING & LOGGING

### Error Messages
- [ ] Don't expose technical details in user-facing errors
- [ ] Provide helpful, actionable error messages in Arabic
- [ ] Log detailed errors to backend (for debugging)
- [ ] Implement error boundary for React components
- [ ] Handle network errors gracefully
- [ ] Handle authentication errors (401, 403) with re-login prompt

### Logging
- [ ] Remove `console.log` from production builds
- [ ] Implement structured logging (with levels: debug, info, warn, error)
- [ ] Send critical errors to backend monitoring service
- [ ] Never log sensitive data (passwords, tokens, PII)
- [ ] Implement log rotation/cleanup for local logs
- [ ] Use Sentry or similar for crash reporting (optional)

---

## UI/UX SECURITY

### Secure Screens
- [ ] Blur sensitive screens when app goes to background (prevent screenshot in task switcher)
- [ ] Auto-lock after inactivity (optional - advanced)
- [ ] Clear sensitive data from forms on navigation
- [ ] Implement biometric authentication (optional - fingerprint/face ID)
- [ ] Show masked input for passwords
- [ ] Prevent autocomplete on sensitive fields

### Indicators
- [ ] Show loading states during API calls
- [ ] Show clear session status indicator
- [ ] Show "Logged in as {vendor_name}" indicator
- [ ] Show app version in settings (for support)
- [ ] Implement update available notification

---

## CONFIGURATION SECURITY

### app.json Security
- [ ] Remove hardcoded API keys from `extra` section
- [ ] Set appropriate permissions
- [ ] Configure app version (semantic versioning)
- [ ] Set appropriate build number (increment for each build)
- [ ] Configure appropriate bundle identifier: `com.rimmarsa.mobile`
- [ ] Remove development URLs from production config

### Environment Variables
- [ ] Use environment-specific configurations
- [ ] Never commit `.env` files to git
- [ ] Document required environment variables
- [ ] Validate environment variables at app startup
- [ ] Use different Supabase projects for dev/staging/production

---

## BUILD & DISTRIBUTION SECURITY

### Pre-Build Checklist
- [ ] Remove all debug code
- [ ] Remove all console.log statements
- [ ] Disable developer mode
- [ ] Set `__DEV__` to false
- [ ] Test production build locally
- [ ] Run security scan on build (if tooling available)

### APK Build Process
- [ ] Use EAS Build for consistent builds
- [ ] Build APK in release mode: `eas build --platform android --profile production`
- [ ] Download APK from EAS
- [ ] Generate SHA-256 checksum
- [ ] Generate SHA-512 checksum (additional verification)
- [ ] Test APK on real device (not emulator)
- [ ] Verify no errors/crashes on startup
- [ ] Verify login flow works
- [ ] Verify all critical features work

### Distribution
- [ ] Upload APK to secure server location
- [ ] Publish checksums on download page
- [ ] Implement download rate limiting (3 per hour per IP)
- [ ] Track downloads (IP, user agent, timestamp)
- [ ] Version APK files: `rimmarsa-vendor-v1.0.0.apk`
- [ ] Keep old versions available for rollback

---

## UPDATE & VERSIONING

### Version Management
- [ ] Implement semantic versioning (MAJOR.MINOR.PATCH)
- [ ] Increment version in `app.json` for each release
- [ ] Increment build number for each build
- [ ] Document changes in CHANGELOG.md
- [ ] Tag releases in git: `git tag v1.0.0`

### Update Enforcement
- [ ] Implement version check API endpoint
- [ ] Check version on app startup
- [ ] Show update notification for available updates
- [ ] Force update for critical security fixes
- [ ] Block app usage for deprecated versions
- [ ] Provide direct download link in update prompt

### Rollback Plan
- [ ] Keep previous 3 APK versions available
- [ ] Document rollback procedure
- [ ] Test rollback process
- [ ] Maintain compatibility with previous database schema

---

## MONITORING & ANALYTICS

### Security Monitoring
- [ ] Log authentication events (login, logout, failed attempts)
- [ ] Log authorization failures (RLS policy violations)
- [ ] Log integrity check failures (root detection, debugger, etc.)
- [ ] Log certificate pinning failures
- [ ] Log session anomalies (device mismatch, unusual location)
- [ ] Send critical events to backend immediately

### Performance Monitoring
- [ ] Monitor app crash rate
- [ ] Monitor API response times
- [ ] Monitor network errors
- [ ] Monitor battery usage (avoid excessive background tasks)
- [ ] Monitor app launch time

---

## TESTING

### Security Testing
- [ ] Test with mitmproxy (should be blocked by certificate pinning)
- [ ] Test on rooted device (should show warning)
- [ ] Test with debugger attached (should show warning)
- [ ] Test APK decompilation (verify obfuscation)
- [ ] Test token extraction attempts (verify SecureStore protection)
- [ ] Penetration testing by security professional (recommended)

### Functional Testing
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test session timeout
- [ ] Test auto-refresh token
- [ ] Test logout
- [ ] Test "logout from all devices"
- [ ] Test offline mode (graceful degradation)
- [ ] Test network error handling
- [ ] Test update enforcement

### Device Testing
- [ ] Test on Android 8+ devices
- [ ] Test on different screen sizes
- [ ] Test on low-end devices (performance)
- [ ] Test on devices with different Android versions
- [ ] Test in Arabic locale
- [ ] Test RTL layout

---

## COMPLIANCE

### Legal Requirements
- [ ] Privacy policy implemented and accessible
- [ ] Terms of service implemented and accessible
- [ ] Data retention policy documented
- [ ] Data deletion mechanism implemented
- [ ] GDPR compliance (if applicable)
- [ ] Saudi Arabia data protection compliance

### App Store Requirements (if planning Google Play)
- [ ] Privacy policy URL provided
- [ ] Data safety form completed
- [ ] Target API level meets Google requirements (API 33+ for 2024)
- [ ] App signing by Google Play enabled
- [ ] Content rating completed

---

## DOCUMENTATION

### User Documentation
- [ ] Installation guide (with screenshots)
- [ ] User manual (how to use app)
- [ ] FAQ (common issues)
- [ ] Security best practices for vendors
- [ ] Contact support information

### Developer Documentation
- [ ] README.md with setup instructions
- [ ] SECURITY.md with security policies
- [ ] CHANGELOG.md with version history
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Deployment runbook

### Security Documentation
- [ ] Threat model documented
- [ ] Security controls documented
- [ ] Incident response plan
- [ ] Security testing results
- [ ] Penetration test report (if conducted)
- [ ] Security audit findings (if conducted)

---

## INCIDENT RESPONSE

### Preparation
- [ ] Document incident response plan
- [ ] Define security roles and responsibilities
- [ ] Establish communication channels (emergency contacts)
- [ ] Create vendor notification templates
- [ ] Test incident response procedures

### Detection
- [ ] Set up alerting for security events
- [ ] Monitor security event logs daily
- [ ] Review failed login attempts
- [ ] Monitor for unusual API patterns
- [ ] Set up automated anomaly detection (optional)

### Response Plan
- [ ] If APK compromised: immediate download block, build new APK, force update
- [ ] If tokens leaked: invalidate all sessions, force re-login
- [ ] If database breach: rotate keys, audit RLS, notify vendors
- [ ] If vulnerability discovered: assess severity, patch, test, deploy
- [ ] Document all incidents for post-mortem review

---

## FINAL PRE-LAUNCH CHECKLIST

### Critical Security Items (Must Have)
- [ ] No hardcoded credentials in APK
- [ ] Tokens stored in SecureStore (not AsyncStorage)
- [ ] Certificate pinning enabled
- [ ] APK signed with production keystore
- [ ] Code obfuscation enabled (ProGuard + Hermes)
- [ ] RLS policies complete and tested
- [ ] Session management implemented
- [ ] Rate limiting on all APIs
- [ ] Security event logging active

### Recommended Security Items (Should Have)
- [ ] Root detection implemented
- [ ] Debugger detection implemented
- [ ] App signature verification
- [ ] Update enforcement mechanism
- [ ] Device binding
- [ ] Comprehensive logging
- [ ] Incident response plan
- [ ] User documentation

### Optional Security Items (Nice to Have)
- [ ] Biometric authentication
- [ ] Screenshot prevention on sensitive screens
- [ ] Auto-lock after inactivity
- [ ] Advanced anti-tampering (runtime checks)
- [ ] Third-party security audit
- [ ] Bug bounty program

---

## POST-LAUNCH MONITORING (First 30 Days)

### Daily Tasks
- [ ] Review security event logs
- [ ] Monitor failed login attempts
- [ ] Check for crash reports
- [ ] Monitor download counts
- [ ] Review vendor feedback

### Weekly Tasks
- [ ] Review all security alerts
- [ ] Analyze session patterns
- [ ] Check dependency vulnerabilities: `npm audit`
- [ ] Review API rate limit violations
- [ ] Update security documentation

### Monthly Tasks
- [ ] Security audit of logs
- [ ] Review and update RLS policies
- [ ] Test disaster recovery procedures
- [ ] Review and update incident response plan
- [ ] Check for OS/framework security updates
- [ ] Plan security improvements for next version

---

## RESOURCES

### Security Tools
- **Static Analysis:** ESLint with security plugins
- **Dependency Scanning:** `npm audit`, Snyk, Dependabot
- **APK Analysis:** apktool, jadx, dex2jar
- **Network Testing:** mitmproxy, Burp Suite, Charles Proxy
- **Certificate Tools:** OpenSSL
- **Testing:** Detox (E2E), Jest (unit tests)

### Learning Resources
- OWASP Mobile Application Security Project: https://owasp.org/www-project-mobile-app-security/
- Expo Security Best Practices: https://docs.expo.dev/guides/security/
- React Native Security: https://reactnative.dev/docs/security
- Supabase Security: https://supabase.com/docs/guides/platform/going-into-prod

### External Services
- **Build:** Expo EAS Build
- **Monitoring:** Sentry (crash reporting), LogRocket (session replay)
- **Analytics:** Amplitude, Mixpanel (with privacy controls)
- **Security Scanning:** Snyk, GitGuardian

---

## SIGN-OFF

**Security Review Completed By:** ___________________________
**Date:** ___________________________
**Developer Sign-off:** ___________________________
**Security Team Sign-off:** ___________________________
**Product Owner Sign-off:** ___________________________

**Notes/Exceptions:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Last Updated:** 2025-10-22
**Next Review:** 2025-11-22
**Document Owner:** Security Team
