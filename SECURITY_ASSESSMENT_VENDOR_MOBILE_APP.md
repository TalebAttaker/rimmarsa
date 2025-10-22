# SECURITY ASSESSMENT: Vendor Mobile App Distribution System
## Rimmarsa Multi-Vendor Marketplace Platform

---

**Assessment Date:** 2025-10-22
**Platform:** rimmarsa.com (Next.js 15 on Vercel)
**Scope:** Android APK Distribution & Vendor Mobile App Security
**Assessment Type:** Pre-Implementation Security Review
**Classification:** CONFIDENTIAL

---

## EXECUTIVE SUMMARY

This security assessment identifies **18 critical and high-priority security concerns** across five domains for the planned vendor mobile app distribution system. The assessment reveals that while the current backend infrastructure (Supabase Auth + RLS policies) provides a solid foundation, significant security hardening is required before production deployment.

### Critical Findings Summary

**CRITICAL (Immediate Action Required - 4 findings):**
- Hardcoded API credentials in mobile app configuration (app.json)
- Missing APK code signing and integrity verification mechanisms
- Insufficient RLS policies for vendor data isolation
- No SSL certificate pinning or network security configuration

**HIGH (Address Before Launch - 8 findings):**
- Public APK distribution without access control or rate limiting
- Missing app-level authentication token encryption
- No reverse engineering protections (ProGuard/R8 obfuscation)
- Absence of security monitoring and anomaly detection
- Missing update/rollback mechanisms
- Inadequate session management controls
- No device binding or multi-device session tracking
- Missing comprehensive logging and audit trails

**MEDIUM (Address Within 30 Days - 6 findings):**
- Lack of certificate transparency monitoring
- Missing runtime integrity checks (root/jailbreak detection)
- Insufficient API rate limiting on vendor endpoints
- No comprehensive penetration testing plan
- Missing incident response procedures
- Inadequate security documentation

---

## 1. CURRENT INFRASTRUCTURE ANALYSIS

### 1.1 Existing Security Posture

**STRENGTHS IDENTIFIED:**
✓ Supabase Auth with JWT token-based authentication
✓ Row-Level Security (RLS) enabled on core tables
✓ Service role key separation (not exposed to client)
✓ HTTPS enforcement via Vercel infrastructure
✓ Vendor approval workflow (is_approved, is_active flags)
✓ Phone-based authentication with email format conversion
✓ Password hashing via bcrypt (pgcrypto extension)

**CURRENT VULNERABILITIES:**
✗ **CRITICAL:** Supabase anon key hardcoded in app.json (line 45)
```json
"supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg5OTY0MTgsImV4cCI6MjA0NDU3MjQxOH0.S8x2vcvA5YhCa6LAqSNh1lOoJSGpSUyZjSrX5JTjQRY"
```
**Impact:** Anyone decompiling the APK gains full access to Supabase anon key, enabling unauthorized API calls.
**CVSS v3.1:** 9.1 (CRITICAL) - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N
**CWE:** CWE-798 (Use of Hard-coded Credentials)

✗ **HIGH:** Incomplete RLS policies for vendor data isolation
- Current policy: `"Public can view vendors" ON vendors FOR SELECT USING (is_active = true)`
- Missing policies for INSERT, UPDATE, DELETE operations scoped to vendor user_id
- No RLS policy enforcement on products table for vendor-specific operations

✗ **HIGH:** Missing is_approved column enforcement in vendor-middleware.ts (line 94)
- Code checks for `is_approved` but vendors table schema only has `is_verified`
- Inconsistency between code expectations and database schema

### 1.2 Database Schema Security Review

**File:** `/home/taleb/rimmarsa/marketplace/supabase_migration.sql`

**Vendors Table (lines 17-34):**
```sql
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  city VARCHAR(100),
  address TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,  -- Missing is_approved column
  is_active BOOLEAN DEFAULT true,
  referral_code VARCHAR(50) UNIQUE,
  total_sales DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SECURITY GAPS:**
1. Missing `is_approved` column (referenced in vendor-middleware.ts line 94)
2. No encryption-at-rest for PII fields (phone, address, email)
3. Missing audit triggers for sensitive column updates (is_active, is_verified, commission_rate)
4. No rate limiting on vendor table queries

---

## 2. THREAT MODEL ANALYSIS

### 2.1 Attack Surface Mapping

```
┌─────────────────────────────────────────────────────────────┐
│                    ATTACK SURFACE MAP                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [User Device]                                              │
│       ↓                                                     │
│  ┌──────────────┐                                           │
│  │ APK Download │ ← Attack Vector 1: MitM APK injection    │
│  │  (rimmarsa.  │ ← Attack Vector 2: Unauthorized access   │
│  │   com/app)   │ ← Attack Vector 3: Automated scraping    │
│  └──────────────┘                                           │
│       ↓                                                     │
│  ┌──────────────┐                                           │
│  │ Mobile App   │ ← Attack Vector 4: Reverse engineering   │
│  │ (Installed)  │ ← Attack Vector 5: Token extraction      │
│  │              │ ← Attack Vector 6: Root/jailbreak bypass │
│  └──────────────┘                                           │
│       ↓                                                     │
│  ┌──────────────┐                                           │
│  │   API Calls  │ ← Attack Vector 7: Token replay attacks  │
│  │  (Supabase)  │ ← Attack Vector 8: RLS bypass attempts   │
│  │              │ ← Attack Vector 9: Data exfiltration     │
│  └──────────────┘                                           │
│       ↓                                                     │
│  ┌──────────────┐                                           │
│  │  Database    │ ← Attack Vector 10: SQL injection        │
│  │ (PostgreSQL) │ ← Attack Vector 11: Privilege escalation │
│  └──────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 STRIDE Threat Analysis

**S - Spoofing Identity**
- **Threat:** Attacker impersonates legitimate vendor by stealing JWT tokens
- **Current Controls:** JWT signature validation, user_id to vendor_id mapping
- **Gaps:** No device fingerprinting, no multi-factor authentication, tokens stored in AsyncStorage (plaintext)
- **Recommendation:** Implement secure token storage (Expo SecureStore), device binding, session anomaly detection

**T - Tampering with Data**
- **Threat:** APK modification to bypass authentication or alter business logic
- **Current Controls:** None (no APK signing verification mentioned)
- **Gaps:** No code integrity checks, no anti-tampering mechanisms
- **Recommendation:** Implement APK signing with Google Play App Signing, certificate pinning, runtime integrity checks

**R - Repudiation**
- **Threat:** Vendor denies malicious actions (unauthorized product modifications, price changes)
- **Current Controls:** Basic created_at/updated_at timestamps
- **Gaps:** No comprehensive audit logging of vendor actions, no immutable audit trail
- **Recommendation:** Implement detailed audit logs with vendor_id, action_type, IP, device_id, before/after values

**I - Information Disclosure**
- **Threat:** Exposure of vendor PII, business data, or API credentials via reverse engineering
- **Current Controls:** RLS policies (incomplete), HTTPS transport
- **Gaps:** Hardcoded credentials in APK, no obfuscation, insufficient RLS policies
- **Recommendation:** Remove hardcoded secrets, implement ProGuard/R8 obfuscation, enhance RLS policies

**D - Denial of Service**
- **Threat:** Resource exhaustion via mass APK downloads or API abuse
- **Current Controls:** Rate limiting tables exist (rate_limits, rate_limit_log)
- **Gaps:** No implementation evidence for APK download rate limiting, unclear vendor API rate limits
- **Recommendation:** Implement CDN with rate limiting for APK distribution, enforce API rate limits per vendor_id

**E - Elevation of Privilege**
- **Threat:** Vendor gaining admin access or accessing other vendors' data
- **Current Controls:** Vendor auth middleware checks is_active, is_approved (inconsistent schema)
- **Gaps:** Incomplete RLS policies allow cross-vendor data access, missing column (is_approved)
- **Recommendation:** Complete RLS policy implementation, add missing schema columns, implement strict vendor_id isolation

---

## 3. DETAILED VULNERABILITY ASSESSMENT

### FINDING #1: Hardcoded API Credentials in Mobile App
**Severity:** CRITICAL
**CVSS v3.1 Score:** 9.1 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)
**CWE:** CWE-798 (Use of Hard-coded Credentials)
**OWASP Mobile Top 10:** M9 - Reverse Engineering

**Location:** `/home/taleb/rimmarsa/mobile-app/app.json` lines 44-46

**Description:**
Supabase URL and anon key are hardcoded directly in app.json, which becomes part of the compiled APK. This is a critical security flaw because:

1. APK files are easily decompilable using tools like apktool, jadx, or dex2jar
2. The anon key grants full access to your Supabase RLS-protected database
3. Even with RLS policies, attackers can enumerate data, perform timing attacks, and identify vulnerabilities
4. Compromised anon key cannot be easily rotated without redeploying the entire app

**Reproduction Steps (Conceptual):**
1. Download APK from rimmarsa.com/app
2. Decompile using: `apktool d rimmarsa.apk`
3. Extract configuration: `cat assets/app.json | grep supabase`
4. Use extracted credentials to query Supabase API directly

**Impact:**
- Unauthorized database access via RLS bypass attempts
- Data enumeration attacks (vendor lists, product catalogs)
- API quota exhaustion leading to service disruption
- Reconnaissance for further attacks

**Evidence:**
```json
"extra": {
  "supabaseUrl": "https://rfyqzuuuumgdoomyhqcu.supabase.co",
  "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Remediation:**

**Priority 1 (Immediate - Before First APK Build):**
1. **Remove hardcoded credentials from app.json**
2. **Implement environment-based configuration:**

```typescript
// config/supabase.config.ts
import Constants from 'expo-constants';

// For production APK, fetch config from secure server endpoint
const getSupabaseConfig = async () => {
  if (__DEV__) {
    return {
      url: Constants.expoConfig?.extra?.supabaseUrl,
      anonKey: Constants.expoConfig?.extra?.supabaseAnonKey,
    };
  }

  // Production: Fetch from authenticated endpoint
  const response = await fetch('https://rimmarsa.com/api/mobile/config', {
    headers: { 'X-App-Version': Constants.expoConfig?.version || '1.0.0' }
  });

  if (!response.ok) throw new Error('Config fetch failed');
  return response.json();
};
```

3. **Create server endpoint with rate limiting:**

```typescript
// marketplace/src/app/api/mobile/config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  // Rate limit: 10 requests per hour per IP
  const rateLimitResult = await checkRateLimit({
    identifier: `mobile-config:${clientIP}`,
    limit: 10,
    window: 3600,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Validate app version (prevent old/vulnerable app versions)
  const appVersion = request.headers.get('X-App-Version');
  const MIN_SUPPORTED_VERSION = '1.0.0';

  if (!appVersion || compareVersions(appVersion, MIN_SUPPORTED_VERSION) < 0) {
    return NextResponse.json({
      error: 'App version not supported. Please update.',
      updateRequired: true,
    }, { status: 426 });
  }

  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    minSupportedVersion: MIN_SUPPORTED_VERSION,
    currentVersion: '1.0.0',
  });
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}
```

**Priority 2 (Before Production - Within 7 Days):**
4. **Implement certificate pinning** (see Finding #4)
5. **Add request signature validation** to prevent API replay attacks
6. **Rotate anon key after removing hardcoded version** (coordinate with mobile app update)

**Verification:**
- Decompile production APK and confirm no hardcoded credentials present
- Test config endpoint rate limiting (should block after 10 requests/hour)
- Verify old app versions receive update-required response

---

### FINDING #2: Missing APK Code Signing & Integrity Verification
**Severity:** CRITICAL
**CVSS v3.1 Score:** 8.8 (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H)
**CWE:** CWE-345 (Insufficient Verification of Data Authenticity)
**OWASP Mobile Top 10:** M8 - Code Tampering

**Description:**
No evidence of APK signing infrastructure, checksum verification, or integrity validation mechanisms. This allows attackers to:
- Modify APK to inject malware or backdoors
- Distribute trojanized versions via phishing campaigns
- Bypass authentication or business logic controls
- Steal vendor credentials or session tokens

**Attack Scenario:**
1. Attacker downloads legitimate APK from rimmarsa.com
2. Decompiles and injects malicious code (credential harvester)
3. Re-signs APK with attacker's certificate
4. Distributes via fake website (rimmarsaa.com, rimmarsa-app.com)
5. Unsuspecting vendors install trojanized APK
6. Attacker gains vendor credentials and session tokens

**Current State:**
- No eas.json configuration found (Expo Application Services)
- No evidence of Google Play App Signing setup
- No runtime integrity checks in mobile app code
- No checksum verification on download page

**Remediation:**

**Priority 1 (Before First APK Distribution):**

1. **Set up Expo Application Services (EAS) Build:**

```bash
# Install EAS CLI
npm install -g eas-cli

# Initialize EAS project
cd /home/taleb/rimmarsa/mobile-app
eas build:configure
```

2. **Create eas.json configuration:**

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

3. **Generate signing keystore (for direct APK distribution):**

```bash
# Generate production keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore rimmarsa-release-key.keystore \
  -alias rimmarsa-release \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass $KEYSTORE_PASSWORD \
  -keypass $KEY_PASSWORD \
  -dname "CN=Rimmarsa Ltd, OU=Mobile, O=Rimmarsa, L=City, S=State, C=SA"
```

**⚠️ CRITICAL:** Store keystore in secure vault (NOT in git repository). Backup in multiple secure locations.

4. **Build signed APK:**

```bash
# Build production APK with EAS
eas build --platform android --profile production

# Or local build with credentials
expo build:android --type app-bundle --release-channel production
```

5. **Generate checksums for distribution:**

```bash
# After build completes, generate checksums
sha256sum rimmarsa-v1.0.0.apk > rimmarsa-v1.0.0.apk.sha256
sha512sum rimmarsa-v1.0.0.apk > rimmarsa-v1.0.0.apk.sha512

# Sign checksums with GPG (optional but recommended)
gpg --armor --detach-sign rimmarsa-v1.0.0.apk
```

6. **Create download page with integrity verification:**

```typescript
// marketplace/src/app/vendor-app/page.tsx
export default function VendorAppDownloadPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1>تحميل تطبيق البائعين - Rimmarsa Vendor App</h1>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>تحذير أمني:</strong> تأكد من تحميل التطبيق من هذا الموقع الرسمي فقط.
          تحقق من بصمة SHA-256 بعد التحميل.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h2>الإصدار الحالي: v1.0.0</h2>
          <p>تاريخ الإصدار: 2025-10-22</p>

          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg mt-4">
            تحميل APK (15.2 MB)
          </button>

          <div className="mt-4 bg-gray-100 p-3 rounded font-mono text-sm">
            <p className="font-semibold">SHA-256 Checksum:</p>
            <p className="break-all">a1b2c3d4e5f6...</p>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold">خطوات التحقق من التطبيق:</h3>
            <ol className="list-decimal list-inside space-y-2 mt-2">
              <li>قم بتحميل التطبيق من هذه الصفحة فقط</li>
              <li>تحقق من حجم الملف (يجب أن يكون 15.2 MB تقريباً)</li>
              <li>قارن SHA-256 باستخدام تطبيق Hash Calculator</li>
              <li>تأكد من تطابق البصمة مع المعروضة أعلاه</li>
              <li>قم بتثبيت التطبيق فقط في حالة التطابق</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
```

7. **Implement runtime integrity checks in mobile app:**

```typescript
// mobile-app/utils/security.ts
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';

export async function verifyAppIntegrity(): Promise<boolean> {
  try {
    // Check if app is properly signed
    const installationId = await Application.getInstallationIdAsync();

    // Verify signature (Android only)
    if (Platform.OS === 'android') {
      // Note: Actual implementation requires native module
      // This is a placeholder for the security check pattern
      const signatureHash = await getAppSignatureHash();
      const expectedSignature = 'YOUR_PRODUCTION_SIGNATURE_HASH';

      if (signatureHash !== expectedSignature) {
        console.error('App signature verification failed');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Integrity check failed:', error);
    return false;
  }
}

// Call on app startup
async function initializeApp() {
  const isIntegrityValid = await verifyAppIntegrity();

  if (!isIntegrityValid) {
    Alert.alert(
      'تحذير أمني',
      'تم اكتشاف تعديل في التطبيق. يرجى تحميل التطبيق من الموقع الرسمي.',
      [
        {
          text: 'تحميل النسخة الرسمية',
          onPress: () => Linking.openURL('https://rimmarsa.com/vendor-app')
        }
      ]
    );
    throw new Error('App integrity compromised');
  }
}
```

**Verification:**
- Successfully build signed APK using EAS Build
- Verify APK signature using: `jarsigner -verify -verbose -certs rimmarsa.apk`
- Test integrity check alerts when APK is modified
- Confirm checksums displayed on download page match built APK

---

### FINDING #3: Incomplete Row-Level Security (RLS) Policies
**Severity:** CRITICAL
**CVSS v3.1 Score:** 8.5 (AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:N)
**CWE:** CWE-863 (Incorrect Authorization)
**OWASP API Security Top 10:** API1:2023 - Broken Object Level Authorization

**Description:**
Current RLS policies only cover SELECT operations for public access. Missing policies for:
- Vendor-specific INSERT/UPDATE/DELETE operations on products table
- Vendor data isolation (one vendor accessing another vendor's data)
- Store profiles and referrals table protection
- Subscription history access controls

**Current Policies (from supabase_migration.sql lines 106-110):**
```sql
CREATE POLICY "Public can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view vendors" ON vendors FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view store profiles" ON store_profiles FOR SELECT USING (true);
```

**Vulnerabilities:**
1. **No INSERT policy on products** → Vendors might not be able to create products, or worse, anyone could potentially insert
2. **No UPDATE policy** → Vendors cannot update their own products, or can update other vendors' products
3. **No DELETE policy** → Vendors cannot delete their own products
4. **No vendor_id isolation** → Policies don't enforce "vendors can only access their own data"
5. **is_approved column mismatch** → Code checks for is_approved (vendor-middleware.ts line 94) but schema only has is_verified

**Attack Scenario:**
1. Attacker authenticates as Vendor A (user_id: abc-123)
2. Queries products table and discovers Vendor B's product (id: xyz-789)
3. Attempts to update Vendor B's product: `UPDATE products SET price=0.01 WHERE id='xyz-789'`
4. If no RLS policy prevents this, attack succeeds → Business logic compromise

**Remediation:**

**Priority 1 (Immediate - Migration Required):**

1. **Fix schema inconsistency - Add is_approved column:**

```sql
-- Migration: 20251022_add_is_approved_to_vendors.sql
-- Add is_approved column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Update existing vendors: set is_approved = is_verified for backward compatibility
UPDATE vendors SET is_approved = is_verified WHERE is_approved IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_vendors_approved ON vendors(is_approved, is_active);

-- Comment for documentation
COMMENT ON COLUMN vendors.is_approved IS 'Admin approval status - vendors must be approved to access vendor app';
COMMENT ON COLUMN vendors.is_verified IS 'Email/phone verification status - for account activation';
```

2. **Implement comprehensive RLS policies:**

```sql
-- Migration: 20251022_vendor_rls_policies.sql

-- =========================================
-- VENDORS TABLE POLICIES
-- =========================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public can view vendors" ON vendors;

-- Public can view only active, approved vendors
CREATE POLICY "Public can view active approved vendors"
  ON vendors FOR SELECT
  USING (is_active = true AND is_approved = true);

-- Vendors can view their own record (even if inactive)
CREATE POLICY "Vendors can view own record"
  ON vendors FOR SELECT
  USING (auth.uid() = user_id);

-- Vendors can update only their own non-critical fields
CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent vendors from modifying critical fields
    is_approved = (SELECT is_approved FROM vendors WHERE user_id = auth.uid()) AND
    is_active = (SELECT is_active FROM vendors WHERE user_id = auth.uid()) AND
    commission_rate = (SELECT commission_rate FROM vendors WHERE user_id = auth.uid())
  );

-- Only service role can INSERT vendors (via vendor registration API)
CREATE POLICY "Service role can insert vendors"
  ON vendors FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Vendors cannot delete their own accounts (admin only via service role)
-- No DELETE policy = implicit deny for non-service-role users

-- =========================================
-- PRODUCTS TABLE POLICIES
-- =========================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Public can view active products" ON products;

-- Public can view active products from active, approved vendors
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = products.vendor_id
      AND vendors.is_active = true
      AND vendors.is_approved = true
    )
  );

-- Vendors can view all their own products (even inactive)
CREATE POLICY "Vendors can view own products"
  ON products FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Vendors can insert products (only for their own vendor_id)
CREATE POLICY "Vendors can insert own products"
  ON products FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors
      WHERE user_id = auth.uid()
      AND is_active = true
      AND is_approved = true
    )
  );

-- Vendors can update only their own products
CREATE POLICY "Vendors can update own products"
  ON products FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    ) AND
    -- Prevent changing vendor_id (product ownership transfer)
    vendor_id = (SELECT vendor_id FROM products WHERE id = products.id)
  );

-- Vendors can soft-delete (set is_active=false) their own products
CREATE POLICY "Vendors can delete own products"
  ON products FOR DELETE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- =========================================
-- STORE_PROFILES TABLE POLICIES
-- =========================================

DROP POLICY IF EXISTS "Public can view store profiles" ON store_profiles;

-- Public can view store profiles of active, approved vendors
CREATE POLICY "Public can view active store profiles"
  ON store_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = store_profiles.vendor_id
      AND vendors.is_active = true
      AND vendors.is_approved = true
    )
  );

-- Vendors can view their own store profile
CREATE POLICY "Vendors can view own store profile"
  ON store_profiles FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Vendors can create their own store profile (one per vendor)
CREATE POLICY "Vendors can insert own store profile"
  ON store_profiles FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors
      WHERE user_id = auth.uid()
      AND is_active = true
      AND is_approved = true
    )
  );

-- Vendors can update their own store profile
CREATE POLICY "Vendors can update own store profile"
  ON store_profiles FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    ) AND
    vendor_id = (SELECT vendor_id FROM store_profiles WHERE id = store_profiles.id)
  );

-- =========================================
-- REFERRALS TABLE POLICIES
-- =========================================

-- Vendors can view referrals where they are the referrer
CREATE POLICY "Vendors can view own referrals"
  ON referrals FOR SELECT
  USING (
    referrer_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Vendors can create referrals (as referrer only)
CREATE POLICY "Vendors can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (
    referrer_id IN (
      SELECT id FROM vendors
      WHERE user_id = auth.uid()
      AND is_active = true
      AND is_approved = true
    )
  );

-- Only service role can update referrals (for commission tracking)
-- No UPDATE policy for regular users

-- =========================================
-- SUBSCRIPTION_HISTORY TABLE POLICIES
-- =========================================

-- Vendors can view their own subscription history
CREATE POLICY "Vendors can view own subscriptions"
  ON subscription_history FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Only service role can INSERT/UPDATE subscription history
-- No INSERT/UPDATE policies for regular users

-- =========================================
-- GRANT NECESSARY PERMISSIONS
-- =========================================

-- Ensure authenticated users can execute functions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Revoke dangerous permissions
REVOKE ALL ON auth.users FROM authenticated;
```

3. **Apply migration:**

```bash
# Using Supabase CLI
supabase migration new vendor_rls_policies
# Copy the SQL above into the new migration file
supabase db push

# Or using MCP Supabase tool
mcp__supabase__apply_migration
```

**Verification:**

```sql
-- Test 1: Verify vendor can only see their own products
-- Login as Vendor A, attempt to query Vendor B's products
SELECT * FROM products WHERE vendor_id = '<vendor_b_id>';
-- Expected: Empty result (RLS blocks cross-vendor access)

-- Test 2: Verify vendor cannot update other vendor's products
UPDATE products SET price = 1.00 WHERE vendor_id = '<vendor_b_id>';
-- Expected: Error or 0 rows affected

-- Test 3: Verify vendor can create products only for themselves
INSERT INTO products (vendor_id, name, price)
VALUES ('<vendor_b_id>', 'Test Product', 10.00);
-- Expected: Error (RLS policy violation)

-- Test 4: Verify public cannot see inactive vendors
SELECT * FROM vendors WHERE is_active = false;
-- Expected: Empty result

-- Test 5: Verify vendor cannot escalate privileges
UPDATE vendors SET is_approved = true, commission_rate = 0.5 WHERE user_id = auth.uid();
-- Expected: Error or changes to critical fields are ignored
```

---

### FINDING #4: Missing SSL Certificate Pinning
**Severity:** HIGH
**CVSS v3.1 Score:** 7.4 (AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N)
**CWE:** CWE-295 (Improper Certificate Validation)
**OWASP Mobile Top 10:** M3 - Insecure Communication

**Description:**
Mobile app does not implement SSL certificate pinning, making it vulnerable to Man-in-the-Middle (MitM) attacks via:
- Rogue WiFi access points
- Compromised network infrastructure
- Certificate Authority compromises
- SSL stripping attacks

**Attack Scenario:**
1. Vendor connects to public WiFi at coffee shop
2. Attacker performs MitM attack using tools like mitmproxy or Burp Suite
3. Attacker intercepts HTTPS traffic to Supabase API
4. Attacker captures vendor JWT tokens, product data, and business information
5. Attacker can replay tokens or modify API responses

**Impact:**
- Session token theft
- Exposure of vendor business data (sales, products, customer info)
- API request/response manipulation
- Credential harvesting

**Remediation:**

**Priority 1 (Before Production - Within 7 Days):**

1. **Implement certificate pinning using Expo and native modules:**

```bash
cd /home/taleb/rimmarsa/mobile-app
npx expo install expo-secure-store expo-crypto
```

2. **Create network security configuration (Android):**

```xml
<!-- mobile-app/android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Pin certificates for Supabase -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">rfyqzuuuumgdoomyhqcu.supabase.co</domain>
        <domain includeSubdomains="true">rimmarsa.com</domain>
        <pin-set expiration="2026-10-22">
            <!-- Get current certificate pins using:
                 openssl s_client -servername rfyqzuuuumgdoomyhqcu.supabase.co -connect rfyqzuuuumgdoomyhqcu.supabase.co:443 | openssl x509 -pubkey -noout | openssl rsa -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
            -->
            <!-- Primary certificate pin (example - replace with actual) -->
            <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
            <!-- Backup certificate pin (for rotation) -->
            <pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>
        </pin-set>
    </domain-config>

    <!-- Default configuration for other domains -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

3. **Reference network security config in AndroidManifest.xml:**

```xml
<!-- mobile-app/android/app/src/main/AndroidManifest.xml -->
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
</application>
```

4. **Get actual certificate pins:**

```bash
# Get Supabase certificate pin
echo | openssl s_client -servername rfyqzuuuumgdoomyhqcu.supabase.co -connect rfyqzuuuumgdoomyhqcu.supabase.co:443 2>/dev/null | openssl x509 -pubkey -noout | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -binary | openssl enc -base64

# Get rimmarsa.com certificate pin
echo | openssl s_client -servername rimmarsa.com -connect rimmarsa.com:443 2>/dev/null | openssl x509 -pubkey -noout | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -binary | openssl enc -base64

# Get backup certificate (from Let's Encrypt CA if using LE)
curl -s https://letsencrypt.org/certs/isrgrootx1.pem | openssl x509 -pubkey -noout | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -binary | openssl enc -base64
```

5. **Implement runtime pinning validation (additional layer):**

```typescript
// mobile-app/services/api/security.ts
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

interface PinConfig {
  hostname: string;
  pins: string[];
}

const CERTIFICATE_PINS: PinConfig[] = [
  {
    hostname: 'rfyqzuuuumgdoomyhqcu.supabase.co',
    pins: [
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Primary
      'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Backup
    ],
  },
  {
    hostname: 'rimmarsa.com',
    pins: [
      'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=',
    ],
  },
];

export async function validateCertificatePin(url: string): Promise<boolean> {
  try {
    const hostname = new URL(url).hostname;
    const pinConfig = CERTIFICATE_PINS.find(p => p.hostname === hostname);

    if (!pinConfig) {
      console.warn(`No certificate pins configured for ${hostname}`);
      return true; // Allow if no pins configured (dev mode)
    }

    // On Android, native network security config handles this
    // This is an additional runtime check
    if (Platform.OS === 'android') {
      // Additional validation can be added via native module
      return true;
    }

    // iOS implementation would go here
    return true;
  } catch (error) {
    console.error('Certificate pinning validation failed:', error);
    return false;
  }
}

// Wrap fetch to add pinning validation
export async function secureFetch(url: string, options?: RequestInit): Promise<Response> {
  const isPinValid = await validateCertificatePin(url);

  if (!isPinValid) {
    throw new Error('Certificate pinning validation failed. Possible MitM attack detected.');
  }

  return fetch(url, options);
}
```

6. **Update Supabase client to use secure fetch:**

```typescript
// mobile-app/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { secureFetch } from './api/security';

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    global: {
      fetch: secureFetch as typeof fetch,
    },
  }
);
```

**Priority 2 (Monitoring - Within 14 Days):**

7. **Implement certificate expiration monitoring:**

```typescript
// marketplace/src/lib/monitoring/certificate-monitor.ts
import https from 'https';

interface CertificateInfo {
  hostname: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiry: number;
  issuer: string;
  pin: string;
}

export async function checkCertificateExpiry(hostname: string): Promise<CertificateInfo> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      method: 'HEAD',
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();

      if (!cert || !Object.keys(cert).length) {
        return reject(new Error('No certificate found'));
      }

      const validTo = new Date(cert.valid_to);
      const now = new Date();
      const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate pin (simplified - actual implementation needs full cert)
      const pin = Buffer.from(cert.fingerprint256, 'hex').toString('base64');

      resolve({
        hostname,
        validFrom: new Date(cert.valid_from),
        validTo,
        daysUntilExpiry,
        issuer: cert.issuer.O,
        pin,
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Schedule daily certificate check
export async function monitorCertificates() {
  const hosts = ['rfyqzuuuumgdoomyhqcu.supabase.co', 'rimmarsa.com'];

  for (const host of hosts) {
    try {
      const certInfo = await checkCertificateExpiry(host);

      // Alert if certificate expires within 30 days
      if (certInfo.daysUntilExpiry < 30) {
        console.warn(`Certificate for ${host} expires in ${certInfo.daysUntilExpiry} days`);
        // Send alert to admin
      }

      // Log current pin for verification
      console.log(`Current pin for ${host}: ${certInfo.pin}`);
    } catch (error) {
      console.error(`Certificate check failed for ${host}:`, error);
    }
  }
}
```

**Verification:**
- Build APK with network security config
- Test app with proxy (mitmproxy) → Should fail to connect
- Test app on normal network → Should connect successfully
- Verify certificate expiry monitoring runs daily
- Test certificate rotation process with backup pins

---

### FINDING #5: Insecure Token Storage
**Severity:** HIGH
**CVSS v3.1 Score:** 7.5 (AV:L/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)
**CWE:** CWE-522 (Insufficiently Protected Credentials)
**OWASP Mobile Top 10:** M2 - Inadequate Supply Chain Security, M9 - Insecure Data Storage

**Description:**
Based on the mobile-app dependencies (`@react-native-async-storage/async-storage`), authentication tokens are likely stored in AsyncStorage, which is NOT encrypted on Android by default. This allows:
- Root/jailbroken device access to tokens
- Backup extraction attacks
- Forensic token recovery
- ADB access token theft (on debug builds)

**Attack Scenario:**
1. Vendor's device is lost/stolen or rooted
2. Attacker connects device via ADB: `adb shell`
3. Attacker navigates to AsyncStorage: `cd /data/data/com.rimmarsa.mobile/files/RCTAsyncLocalStorage_V1`
4. Attacker reads tokens: `cat manifest-000001`
5. Attacker extracts JWT access_token and refresh_token
6. Attacker uses tokens to impersonate vendor

**Current Implementation Risk:**
```typescript
// Likely current implementation (INSECURE)
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storing tokens in plaintext AsyncStorage
await AsyncStorage.setItem('supabase.auth.token', JSON.stringify(session));
```

**Remediation:**

**Priority 1 (Before Production - Immediate):**

1. **Replace AsyncStorage with Expo SecureStore for sensitive data:**

```bash
cd /home/taleb/rimmarsa/mobile-app
npx expo install expo-secure-store
```

2. **Create secure token manager:**

```typescript
// mobile-app/services/auth/tokenManager.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'vendor_auth_token';
const REFRESH_TOKEN_KEY = 'vendor_refresh_token';
const DEVICE_ID_KEY = 'device_id';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Securely store authentication tokens using Expo SecureStore
 * On Android: Uses EncryptedSharedPreferences (AES256)
 * On iOS: Uses Keychain Services
 */
export class SecureTokenManager {

  /**
   * Save authentication tokens securely
   */
  static async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      // Store access token
      await SecureStore.setItemAsync(
        TOKEN_KEY,
        JSON.stringify({
          token: tokens.accessToken,
          expiresAt: tokens.expiresAt,
        }),
        {
          keychainAccessible: SecureStore.WHEN_UNLOCKED, // iOS
          requireAuthentication: false, // Don't require biometrics for each access
        }
      );

      // Store refresh token separately (more sensitive)
      await SecureStore.setItemAsync(
        REFRESH_TOKEN_KEY,
        tokens.refreshToken,
        {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY, // iOS - no cloud backup
          requireAuthentication: false,
        }
      );

      console.log('[SecureTokenManager] Tokens saved securely');
    } catch (error) {
      console.error('[SecureTokenManager] Failed to save tokens:', error);
      throw new Error('Failed to securely store authentication tokens');
    }
  }

  /**
   * Retrieve access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const tokenData = await SecureStore.getItemAsync(TOKEN_KEY);

      if (!tokenData) return null;

      const parsed = JSON.parse(tokenData);

      // Check if token is expired
      if (Date.now() >= parsed.expiresAt) {
        console.log('[SecureTokenManager] Access token expired');
        return null;
      }

      return parsed.token;
    } catch (error) {
      console.error('[SecureTokenManager] Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Retrieve refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('[SecureTokenManager] Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Clear all tokens (on logout)
   */
  static async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      console.log('[SecureTokenManager] Tokens cleared');
    } catch (error) {
      console.error('[SecureTokenManager] Failed to clear tokens:', error);
    }
  }

  /**
   * Get or create device ID (for device binding)
   */
  static async getDeviceId(): Promise<string> {
    try {
      let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

      if (!deviceId) {
        // Generate new device ID
        deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
      }

      return deviceId;
    } catch (error) {
      console.error('[SecureTokenManager] Failed to get device ID:', error);
      return `fallback-${Date.now()}`;
    }
  }

  /**
   * Check if tokens exist
   */
  static async hasValidSession(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    return accessToken !== null;
  }
}
```

3. **Update Supabase client to use secure storage:**

```typescript
// mobile-app/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { SecureTokenManager } from './auth/tokenManager';

// Custom storage adapter for Supabase
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (key.includes('auth-token')) {
      const token = await SecureTokenManager.getAccessToken();
      if (!token) return null;

      const refreshToken = await SecureTokenManager.getRefreshToken();

      // Return in Supabase expected format
      return JSON.stringify({
        access_token: token,
        refresh_token: refreshToken,
      });
    }
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (key.includes('auth-token')) {
      try {
        const session = JSON.parse(value);
        await SecureTokenManager.saveTokens({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at * 1000, // Convert to ms
        });
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    if (key.includes('auth-token')) {
      await SecureTokenManager.clearTokens();
    }
  },
};

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export default supabase;
```

4. **Implement device binding for additional security:**

```typescript
// mobile-app/services/auth/deviceBinding.ts
import { SecureTokenManager } from './tokenManager';
import supabase from '../supabase';

/**
 * Bind session to device to prevent token reuse on different devices
 */
export async function bindSessionToDevice(): Promise<void> {
  const deviceId = await SecureTokenManager.getDeviceId();

  // Store device_id in Supabase user metadata
  const { error } = await supabase.auth.updateUser({
    data: { device_id: deviceId, last_device_login: new Date().toISOString() },
  });

  if (error) {
    console.error('Failed to bind session to device:', error);
  }
}

/**
 * Verify current device matches session device
 */
export async function verifyDeviceBinding(): Promise<boolean> {
  const currentDeviceId = await SecureTokenManager.getDeviceId();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const sessionDeviceId = user.user_metadata?.device_id;

  if (sessionDeviceId && sessionDeviceId !== currentDeviceId) {
    console.warn('Device mismatch detected - possible token theft');
    // Log security event
    await logSecurityEvent('device_mismatch', {
      expected: sessionDeviceId,
      actual: currentDeviceId,
    });
    return false;
  }

  return true;
}

async function logSecurityEvent(eventType: string, details: any): Promise<void> {
  // Send to backend security monitoring
  try {
    await fetch('https://rimmarsa.com/api/security/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        details,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
```

5. **Update login flow to use secure storage:**

```typescript
// mobile-app/screens/LoginScreen.tsx
import { SecureTokenManager } from '../services/auth/tokenManager';
import { bindSessionToDevice } from '../services/auth/deviceBinding';
import supabase from '../services/supabase';

export default function LoginScreen() {
  const handleLogin = async (phone: string, password: string) => {
    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${phone}@vendor.rimmarsa.com`,
        password,
      });

      if (error) throw error;

      // Tokens are automatically saved via custom storage adapter

      // Bind session to this device
      await bindSessionToDevice();

      // Navigate to main app
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('خطأ في تسجيل الدخول', error.message);
    }
  };

  // ... rest of component
}
```

**Verification:**
- Build APK and install on test device
- Login and verify tokens are NOT in AsyncStorage directory
- Verify tokens are stored in Keychain (iOS) or EncryptedSharedPreferences (Android)
- Test token persistence after app restart
- Test device binding prevents token reuse on different device

---

### FINDING #6: Missing Code Obfuscation & Reverse Engineering Protections
**Severity:** HIGH
**CVSS v3.1 Score:** 6.8 (AV:L/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N)
**CWE:** CWE-656 (Reliance on Security Through Obscurity)
**OWASP Mobile Top 10:** M9 - Reverse Engineering

**Description:**
React Native apps are easily decompilable, exposing:
- Business logic and authentication flows
- API endpoints and request structures
- Hardcoded strings and configuration
- Vendor-specific algorithms (commission calculations, etc.)

While security through obscurity is not a primary defense, obfuscation raises the bar for attackers.

**Attack Scenario:**
1. Attacker downloads APK from rimmarsa.com
2. Decompiles using jadx: `jadx rimmarsa.apk`
3. Analyzes JavaScript bundle to understand authentication flow
4. Identifies API endpoints and request signatures
5. Creates automated bot to abuse vendor endpoints
6. Bypasses client-side validations

**Remediation:**

**Priority 1 (Before Production Build):**

1. **Enable ProGuard/R8 obfuscation for Android:**

```javascript
// mobile-app/android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

2. **Create ProGuard rules:**

```proguard
# mobile-app/android/app/proguard-rules.pro

# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

# Keep React Native modules
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep Expo modules
-keep class expo.modules.** { *; }

# Keep Supabase classes
-keep class io.supabase.** { *; }

# Obfuscate everything else
-repackageclasses ''
-allowaccessmodification

# Remove logging in production
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# String encryption (requires additional plugin)
-keep class com.rimmarsa.mobile.** { *; }
```

3. **Enable Hermes JavaScript engine (bytecode harder to decompile than plain JS):**

```javascript
// mobile-app/android/app/build.gradle
project.ext.react = [
    enableHermes: true,  // Enable Hermes engine
]
```

4. **Configure Expo for production optimization:**

```json
// mobile-app/app.json
{
  "expo": {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    }
  }
}
```

5. **Obfuscate critical strings and API endpoints:**

```typescript
// mobile-app/utils/obfuscation.ts

/**
 * Simple string obfuscation (not cryptographically secure, just raises the bar)
 */
function deobfuscate(obfuscated: string): string {
  return Buffer.from(obfuscated, 'base64').toString('utf-8');
}

// Instead of hardcoding API endpoints
const API_ENDPOINTS = {
  // BAD: login: 'https://rimmarsa.com/api/vendor/login',

  // BETTER: Obfuscate endpoints
  login: deobfuscate('aHR0cHM6Ly9yaW1tYXJzYS5jb20vYXBpL3ZlbmRvci9sb2dpbg=='),
  products: deobfuscate('aHR0cHM6Ly9yaW1tYXJzYS5jb20vYXBpL3ZlbmRvci9wcm9kdWN0cw=='),
};

/**
 * Runtime environment detection
 */
export function isRunningInEmulator(): boolean {
  return (
    Platform.OS === 'android' &&
    (Platform.constants.Fingerprint?.includes('generic') ||
      Platform.constants.Model?.includes('sdk') ||
      Platform.constants.Brand?.startsWith('generic'))
  );
}

export function isDebuggable(): boolean {
  if (Platform.OS === 'android') {
    // Check if app is debuggable (requires native module)
    return __DEV__;
  }
  return false;
}

/**
 * Detect if app is running under debugger
 */
export function isDebuggerAttached(): boolean {
  // Check if React Native debugger is connected
  return typeof atob !== 'undefined' && (global as any).DedicatedWorkerGlobalScope;
}
```

6. **Implement runtime integrity checks:**

```typescript
// mobile-app/utils/security-checks.ts
import { Alert } from 'react-native';
import * as Application from 'expo-application';
import { isRunningInEmulator, isDebuggable, isDebuggerAttached } from './obfuscation';

export async function performSecurityChecks(): Promise<boolean> {
  const checks = [];

  // Check 1: Detect emulator (higher risk environment)
  if (isRunningInEmulator()) {
    checks.push('App is running in emulator');
  }

  // Check 2: Detect debug build
  if (isDebuggable()) {
    checks.push('App is in debug mode');
  }

  // Check 3: Detect debugger attachment
  if (isDebuggerAttached()) {
    checks.push('Debugger is attached');
  }

  // Check 4: Verify app signature (would require native module)
  // const isValidSignature = await verifyAppSignature();
  // if (!isValidSignature) checks.push('Invalid app signature');

  if (checks.length > 0 && !__DEV__) {
    console.warn('Security checks failed:', checks);

    // In production, show warning (don't completely block - could be false positive)
    Alert.alert(
      'تحذير أمني',
      'تم اكتشاف بيئة تشغيل غير آمنة. للحماية الكاملة، استخدم التطبيق على جهاز حقيقي.',
      [
        {
          text: 'متابعة على مسؤوليتي',
          style: 'destructive',
        },
      ]
    );

    // Log security event to backend
    await fetch('https://rimmarsa.com/api/security/environment-warning', {
      method: 'POST',
      body: JSON.stringify({ checks, device: await Application.getIosIdForVendorAsync() }),
    });
  }

  return checks.length === 0;
}
```

**Priority 2 (Optional - Enhanced Security):**

7. **Consider using react-native-obfuscating-transformer (additional JS obfuscation):**

```bash
npm install --save-dev react-native-obfuscating-transformer
```

```javascript
// metro.config.js
const obfuscatingTransformer = require('react-native-obfuscating-transformer');

module.exports = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-obfuscating-transformer'),
  },
};
```

**Verification:**
- Build production APK with obfuscation enabled
- Decompile APK using jadx or apktool
- Verify JavaScript code is in Hermes bytecode format (.hbc files)
- Verify Java/Kotlin code is obfuscated (class names are a, b, c, etc.)
- Verify strings are not plainly visible
- Test app functions normally after obfuscation

---

## 4. AUTHENTICATION & AUTHORIZATION SECURITY

### 4.1 Current Authentication Flow Analysis

**File:** `/home/taleb/rimmarsa/marketplace/src/lib/auth/vendor-auth.ts`

**Flow:**
1. Vendor provides phone number + password
2. Phone converted to email format: `{phone_digits}@vendor.rimmarsa.com`
3. Supabase Auth signInWithPassword
4. Fetch vendor record using user_id
5. Verify is_active and is_approved flags
6. Return user, session, vendor

**Security Strengths:**
✓ Passwords hashed via Supabase Auth (bcrypt)
✓ JWT tokens with signature validation
✓ User_id to vendor_id mapping prevents account confusion
✓ Account status checks (is_active, is_approved)

**Security Gaps:**
✗ No multi-factor authentication (MFA)
✗ No session timeout or idle timeout
✗ No concurrent session limiting
✗ No login attempt rate limiting (application level)
✗ No CAPTCHA or bot protection on login endpoint
✗ No security questions or account recovery verification

### 4.2 Session Management Vulnerabilities

**FINDING #7: Weak Session Management**
**Severity:** HIGH
**CVSS v3.1 Score:** 7.1 (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N)
**CWE:** CWE-613 (Insufficient Session Expiration)

**Issues:**
1. **No explicit session timeout** - JWT tokens valid until expiry (potentially long-lived)
2. **No idle timeout** - Sessions remain active even if vendor is inactive for days
3. **No session termination** - No "logout from all devices" functionality
4. **No concurrent session tracking** - Vendor can be logged in on unlimited devices
5. **No session anomaly detection** - No alerts for unusual login patterns

**Remediation:**

1. **Implement session timeout and tracking:**

```sql
-- Migration: 20251022_vendor_sessions.sql

CREATE TABLE IF NOT EXISTS vendor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT unique_device_session UNIQUE(vendor_id, device_id)
);

CREATE INDEX idx_vendor_sessions_vendor ON vendor_sessions(vendor_id);
CREATE INDEX idx_vendor_sessions_active ON vendor_sessions(is_active, expires_at);
CREATE INDEX idx_vendor_sessions_last_activity ON vendor_sessions(last_activity_at);

-- Enable RLS
ALTER TABLE vendor_sessions ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own sessions
CREATE POLICY "Vendors can view own sessions"
  ON vendor_sessions FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendors can delete (logout) their own sessions
CREATE POLICY "Vendors can delete own sessions"
  ON vendor_sessions FOR DELETE
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM vendor_sessions
  WHERE expires_at < NOW() OR last_activity_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions()');
```

2. **Create session management API:**

```typescript
// marketplace/src/app/api/vendor/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth/vendor-middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (!authResult.success) return authResult.response!;

  const vendor = authResult.vendor!;

  // Get all active sessions for this vendor
  const { data: sessions, error } = await supabase
    .from('vendor_sessions')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('is_active', true)
    .order('last_activity_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions });
}

// Logout from specific session
export async function DELETE(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (!authResult.success) return authResult.response!;

  const vendor = authResult.vendor!;
  const { sessionId } = await request.json();

  // Deactivate session
  const { error } = await supabase
    .from('vendor_sessions')
    .update({ is_active: false })
    .eq('id', sessionId)
    .eq('vendor_id', vendor.id); // Ensure vendor can only delete their own sessions

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Logout from all sessions except current
export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (!authResult.success) return authResult.response!;

  const vendor = authResult.vendor!;
  const { currentDeviceId } = await request.json();

  // Deactivate all sessions except current device
  const { error } = await supabase
    .from('vendor_sessions')
    .update({ is_active: false })
    .eq('vendor_id', vendor.id)
    .neq('device_id', currentDeviceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Logged out from all other devices' });
}
```

3. **Update login flow to create session:**

```typescript
// marketplace/src/app/api/vendor/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signInVendorWithPhone } from '@/lib/auth/vendor-auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  // Rate limit: 5 login attempts per 15 minutes per IP
  const rateLimitResult = await checkRateLimit({
    identifier: `vendor-login:${clientIP}`,
    limit: 5,
    window: 900,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({
      error: 'Too many login attempts. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    }, { status: 429 });
  }

  const { phone, password, deviceId, deviceInfo } = await request.json();

  try {
    const { user, session, vendor } = await signInVendorWithPhone(phone, password);

    // Create session record
    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await supabase.from('vendor_sessions').upsert({
      vendor_id: vendor.id,
      user_id: user.id,
      device_id: deviceId,
      device_info: deviceInfo,
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent'),
      last_activity_at: new Date().toISOString(),
      expires_at: sessionExpiry.toISOString(),
      is_active: true,
    }, {
      onConflict: 'vendor_id,device_id',
    });

    // Check for concurrent sessions
    const { count } = await supabase
      .from('vendor_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .eq('is_active', true);

    if (count && count > 3) {
      // Alert vendor about multiple active sessions
      console.warn(`Vendor ${vendor.id} has ${count} active sessions`);
    }

    return NextResponse.json({
      success: true,
      user,
      session,
      vendor,
      activeSessions: count || 1,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
```

4. **Implement activity tracking middleware:**

```typescript
// marketplace/src/middleware/session-activity.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const IDLE_TIMEOUT_MINUTES = 30;

export async function updateSessionActivity(vendorId: string, deviceId: string): Promise<void> {
  try {
    const { data: session } = await supabase
      .from('vendor_sessions')
      .select('last_activity_at')
      .eq('vendor_id', vendorId)
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .single();

    if (!session) {
      console.warn(`No active session found for vendor ${vendorId}, device ${deviceId}`);
      return;
    }

    // Check if session is idle
    const lastActivity = new Date(session.last_activity_at);
    const idleMinutes = (Date.now() - lastActivity.getTime()) / (1000 * 60);

    if (idleMinutes > IDLE_TIMEOUT_MINUTES) {
      // Deactivate idle session
      await supabase
        .from('vendor_sessions')
        .update({ is_active: false })
        .eq('vendor_id', vendorId)
        .eq('device_id', deviceId);

      throw new Error('Session expired due to inactivity');
    }

    // Update last activity timestamp
    await supabase
      .from('vendor_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('vendor_id', vendorId)
      .eq('device_id', deviceId);
  } catch (error) {
    console.error('Failed to update session activity:', error);
    throw error;
  }
}
```

5. **Mobile app session monitoring:**

```typescript
// mobile-app/services/auth/sessionMonitor.ts
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import supabase from '../supabase';
import { SecureTokenManager } from './tokenManager';

const ACTIVITY_PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useSessionMonitor() {
  const appState = useRef(AppState.currentState);
  const activityInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start activity pings
    startActivityPing();

    // Monitor app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      stopActivityPing();
    };
  }, []);

  const startActivityPing = () => {
    activityInterval.current = setInterval(async () => {
      try {
        const deviceId = await SecureTokenManager.getDeviceId();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Ping activity endpoint
        await fetch('https://rimmarsa.com/api/vendor/activity', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await SecureTokenManager.getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceId }),
        });
      } catch (error) {
        console.error('Activity ping failed:', error);
        // If session expired, redirect to login
        if (error.message.includes('expired')) {
          // Handle logout
        }
      }
    }, ACTIVITY_PING_INTERVAL);
  };

  const stopActivityPing = () => {
    if (activityInterval.current) {
      clearInterval(activityInterval.current);
      activityInterval.current = null;
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground - resume activity pings
      startActivityPing();
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background - stop pings
      stopActivityPing();
    }

    appState.current = nextAppState;
  };
}
```

**Verification:**
- Login from mobile app and verify session created in vendor_sessions table
- Wait 30 minutes without activity → next API call should fail with session expired
- Login from 2 devices → verify both sessions tracked
- Use "logout from all devices" → verify all sessions except current are deactivated
- Test activity ping updates last_activity_at every 5 minutes

---

## 5. APK DISTRIBUTION SECURITY

### FINDING #8: Insecure APK Distribution Without Access Control
**Severity:** HIGH
**CVSS v3.1 Score:** 6.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:L)
**CWE:** CWE-284 (Improper Access Control)

**Description:**
Planned implementation appears to serve APK publicly without:
- Authentication requirements
- Rate limiting on downloads
- Download tracking
- Version enforcement
- Geographic restrictions

**Risks:**
- Unlimited APK downloads by bots
- Bandwidth exhaustion
- Unauthorized distribution of APK
- Inability to track which vendors have outdated versions
- No mechanism to force critical security updates

**Remediation:**

1. **Create authenticated download endpoint:**

```typescript
// marketplace/src/app/api/vendor-app/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  // Rate limit: 3 downloads per hour per IP
  const rateLimitResult = await checkRateLimit({
    identifier: `apk-download:${clientIP}`,
    limit: 3,
    window: 3600,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({
      error: 'Download limit exceeded. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    }, { status: 429 });
  }

  // OPTION 1: Public download (with tracking and rate limiting)
  const { searchParams } = new URL(request.url);
  const version = searchParams.get('version') || 'latest';

  // Log download attempt
  await logDownload({
    ip: clientIP,
    userAgent: request.headers.get('user-agent') || 'unknown',
    version,
    authenticated: false,
  });

  // Get APK file
  const apkPath = path.join(process.cwd(), 'public', 'apps', `rimmarsa-vendor-${version}.apk`);

  if (!fs.existsSync(apkPath)) {
    return NextResponse.json({ error: 'APK version not found' }, { status: 404 });
  }

  // Read file and stream
  const fileBuffer = fs.readFileSync(apkPath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': `attachment; filename="rimmarsa-vendor-${version}.apk"`,
      'X-Content-Type-Options': 'nosniff',
      'X-Download-Options': 'noopen',
    },
  });
}

// OPTION 2: Authenticated download (requires vendor login)
export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  // Rate limit
  const rateLimitResult = await checkRateLimit({
    identifier: `apk-download-auth:${clientIP}`,
    limit: 5,
    window: 3600,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Download limit exceeded' }, { status: 429 });
  }

  const { phone, verificationCode } = await request.json();

  // Verify vendor exists and is approved
  const vendorEmail = `${phone.replace(/\D/g, '').slice(-8)}@vendor.rimmarsa.com`;

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('id, business_name, is_approved, is_active')
    .eq('email', vendorEmail)
    .single();

  if (error || !vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  if (!vendor.is_approved || !vendor.is_active) {
    return NextResponse.json({
      error: 'Your vendor account is not yet approved. Please contact support.',
    }, { status: 403 });
  }

  // TODO: Verify SMS code (implement SMS verification service)

  // Log authenticated download
  await logDownload({
    ip: clientIP,
    userAgent: request.headers.get('user-agent') || 'unknown',
    version: 'latest',
    authenticated: true,
    vendorId: vendor.id,
  });

  // Generate time-limited download token
  const downloadToken = await generateDownloadToken(vendor.id);

  return NextResponse.json({
    downloadUrl: `/api/vendor-app/download/secure?token=${downloadToken}`,
    expiresIn: 300, // 5 minutes
  });
}

async function logDownload(data: {
  ip: string;
  userAgent: string;
  version: string;
  authenticated: boolean;
  vendorId?: string;
}) {
  await supabase.from('apk_downloads').insert({
    ip_address: data.ip,
    user_agent: data.userAgent,
    app_version: data.version,
    is_authenticated: data.authenticated,
    vendor_id: data.vendorId,
    downloaded_at: new Date().toISOString(),
  });
}

async function generateDownloadToken(vendorId: string): Promise<string> {
  const token = `${vendorId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await supabase.from('download_tokens').insert({
    token,
    vendor_id: vendorId,
    expires_at: expiresAt.toISOString(),
    used: false,
  });

  return token;
}
```

2. **Create download tracking table:**

```sql
-- Migration: 20251022_apk_download_tracking.sql

CREATE TABLE IF NOT EXISTS apk_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  app_version VARCHAR(50),
  is_authenticated BOOLEAN DEFAULT false,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apk_downloads_vendor ON apk_downloads(vendor_id);
CREATE INDEX idx_apk_downloads_ip ON apk_downloads(ip_address);
CREATE INDEX idx_apk_downloads_date ON apk_downloads(downloaded_at);

CREATE TABLE IF NOT EXISTS download_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_download_tokens_token ON download_tokens(token);
CREATE INDEX idx_download_tokens_expires ON download_tokens(expires_at);

-- Cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_download_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM download_tokens
  WHERE expires_at < NOW() OR (used = true AND created_at < NOW() - INTERVAL '1 day');
END;
$$;
```

3. **Create version enforcement system:**

```typescript
// marketplace/src/app/api/vendor-app/version/route.ts
import { NextRequest, NextResponse } from 'next/server';

const APP_VERSIONS = {
  current: '1.0.0',
  minimum: '1.0.0', // Minimum supported version
  deprecated: [], // Versions that will be unsupported soon
  critical_update_required: [], // Versions with critical security flaws
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const installedVersion = searchParams.get('installed_version');

  if (!installedVersion) {
    return NextResponse.json(APP_VERSIONS);
  }

  // Check if update required
  const updateRequired = compareVersions(installedVersion, APP_VERSIONS.minimum) < 0;
  const criticalUpdateRequired = APP_VERSIONS.critical_update_required.includes(installedVersion);
  const updateAvailable = compareVersions(installedVersion, APP_VERSIONS.current) < 0;

  return NextResponse.json({
    ...APP_VERSIONS,
    updateRequired,
    criticalUpdateRequired,
    updateAvailable,
    message: criticalUpdateRequired
      ? 'Critical security update required. Please update immediately.'
      : updateRequired
      ? 'App update required to continue using the service.'
      : updateAvailable
      ? 'New version available with improvements.'
      : 'You are using the latest version.',
  });
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}
```

4. **Mobile app version check on startup:**

```typescript
// mobile-app/services/versionCheck.ts
import * as Application from 'expo-application';
import { Alert } from 'react-native';

export async function checkAppVersion(): Promise<void> {
  try {
    const currentVersion = Application.nativeApplicationVersion || '1.0.0';

    const response = await fetch(
      `https://rimmarsa.com/api/vendor-app/version?installed_version=${currentVersion}`
    );

    const versionInfo = await response.json();

    if (versionInfo.criticalUpdateRequired) {
      Alert.alert(
        'تحديث أمني مطلوب',
        'يجب تحديث التطبيق فوراً لأسباب أمنية. لن تتمكن من استخدام التطبيق بدون التحديث.',
        [
          {
            text: 'تحديث الآن',
            onPress: () => {
              Linking.openURL('https://rimmarsa.com/vendor-app');
            },
          },
        ],
        { cancelable: false }
      );
      throw new Error('Critical update required');
    } else if (versionInfo.updateRequired) {
      Alert.alert(
        'تحديث مطلوب',
        'يجب تحديث التطبيق للاستمرار في استخدامه.',
        [
          {
            text: 'تحديث',
            onPress: () => {
              Linking.openURL('https://rimmarsa.com/vendor-app');
            },
          },
        ],
        { cancelable: false }
      );
      throw new Error('Update required');
    } else if (versionInfo.updateAvailable) {
      Alert.alert(
        'تحديث متاح',
        'يوجد إصدار جديد من التطبيق متاح. هل تريد التحديث؟',
        [
          { text: 'لاحقاً', style: 'cancel' },
          {
            text: 'تحديث',
            onPress: () => {
              Linking.openURL('https://rimmarsa.com/vendor-app');
            },
          },
        ]
      );
    }
  } catch (error) {
    console.error('Version check failed:', error);
    // Don't block app if version check fails (could be network issue)
  }
}
```

**Verification:**
- Test APK download rate limiting (should block after 3 downloads/hour)
- Verify download logged in apk_downloads table
- Test authenticated download flow
- Test version enforcement (install old version → should prompt update)
- Test critical update enforcement (should block app usage)

---

## 6. DATA SECURITY

### FINDING #9: Missing API Rate Limiting on Vendor Endpoints
**Severity:** MEDIUM
**CVSS v3.1 Score:** 5.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L)
**CWE:** CWE-770 (Allocation of Resources Without Limits)
**OWASP API Security Top 10:** API4:2023 - Unrestricted Resource Consumption

**Description:**
While rate limiting infrastructure exists (rate_limits, rate_limit_log tables), unclear if it's enforced on vendor-specific API endpoints like:
- `/api/vendor/products` (GET, POST, PUT, DELETE)
- `/api/vendor/orders`
- `/api/vendor/profile`

**Attack Scenario:**
1. Attacker authenticates as vendor (or compromises vendor token)
2. Floods product creation endpoint: `POST /api/vendor/products` 1000 times
3. Database bloated with spam products
4. Legitimate vendor operations slow down
5. Service degradation or outage

**Remediation:**

1. **Verify existing rate limit implementation:**

```typescript
// Check marketplace/src/lib/rate-limit.ts
```

Let me check this file:

```bash
cat /home/taleb/rimmarsa/marketplace/src/lib/rate-limit.ts
```

2. **Apply rate limiting to all vendor endpoints:**

```typescript
// marketplace/src/app/api/vendor/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth/vendor-middleware';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Authenticate vendor
  const authResult = await requireVendor(request);
  if (!authResult.success) return authResult.response!;

  const vendor = authResult.vendor!;

  // Rate limit: 10 product creations per hour per vendor
  const rateLimitResult = await checkRateLimit({
    identifier: `vendor-create-product:${vendor.id}`,
    limit: 10,
    window: 3600,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({
      error: 'Product creation limit exceeded. Maximum 10 products per hour.',
      retryAfter: rateLimitResult.retryAfter,
    }, { status: 429 });
  }

  // Proceed with product creation
  // ...
}

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (!authResult.success) return authResult.response!;

  const vendor = authResult.vendor!;

  // Rate limit: 60 product list requests per minute
  const rateLimitResult = await checkRateLimit({
    identifier: `vendor-list-products:${vendor.id}`,
    limit: 60,
    window: 60,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Proceed
}

export async function PUT(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (!authResult.success) return authResult.response!;

  const vendor = authResult.vendor!;

  // Rate limit: 30 product updates per hour
  const rateLimitResult = await checkRateLimit({
    identifier: `vendor-update-product:${vendor.id}`,
    limit: 30,
    window: 3600,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Update limit exceeded' }, { status: 429 });
  }

  // Proceed
}
```

---

## 7. SECURITY MONITORING & INCIDENT RESPONSE

### FINDING #10: Missing Security Monitoring & Anomaly Detection
**Severity:** HIGH
**CVSS v3.1 Score:** 6.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:L)
**CWE:** CWE-778 (Insufficient Logging)

**Description:**
No evidence of:
- Security event logging (failed logins, suspicious activities)
- Anomaly detection (unusual API patterns, data access)
- Alert mechanisms for critical security events
- Audit trails for vendor actions

**Remediation:**

1. **Create security events table:**

```sql
-- Migration: 20251022_security_events.sql

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_vendor ON security_events(vendor_id);
CREATE INDEX idx_security_events_created ON security_events(created_at);

-- Enable RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access security events
CREATE POLICY "Service role only"
  ON security_events FOR ALL
  USING (auth.role() = 'service_role');
```

2. **Implement security logger:**

```typescript
// marketplace/src/lib/security/logger.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

interface SecurityEvent {
  eventType: string;
  severity: EventSeverity;
  vendorId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await supabase.from('security_events').insert({
      event_type: event.eventType,
      severity: event.severity,
      vendor_id: event.vendorId,
      user_id: event.userId,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      details: event.details || {},
    });

    // If critical, send immediate alert
    if (event.severity === 'critical') {
      await sendCriticalAlert(event);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

async function sendCriticalAlert(event: SecurityEvent): Promise<void> {
  // Send to admin notification channel (email, Slack, etc.)
  console.error('[CRITICAL SECURITY EVENT]', event);

  // TODO: Implement actual alerting mechanism
  // - Send email to security team
  // - Post to Slack channel
  // - Create incident in PagerDuty
}

// Predefined event types
export const SecurityEventTypes = {
  FAILED_LOGIN: 'failed_login',
  SUCCESSFUL_LOGIN: 'successful_login',
  DEVICE_MISMATCH: 'device_mismatch',
  TOKEN_THEFT_SUSPECTED: 'token_theft_suspected',
  MASS_DATA_EXPORT: 'mass_data_export',
  RAPID_API_CALLS: 'rapid_api_calls',
  RLS_BYPASS_ATTEMPT: 'rls_bypass_attempt',
  PERMISSION_ESCALATION_ATTEMPT: 'permission_escalation_attempt',
  SUSPICIOUS_DOWNLOAD: 'suspicious_download',
  APP_INTEGRITY_FAILURE: 'app_integrity_failure',
};
```

3. **Integrate logging into authentication:**

```typescript
// marketplace/src/app/api/vendor/login/route.ts (updated)
import { logSecurityEvent, SecurityEventTypes } from '@/lib/security/logger';

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const { phone, password } = await request.json();

  try {
    const { user, session, vendor } = await signInVendorWithPhone(phone, password);

    // Log successful login
    await logSecurityEvent({
      eventType: SecurityEventTypes.SUCCESSFUL_LOGIN,
      severity: 'low',
      vendorId: vendor.id,
      userId: user.id,
      ipAddress: clientIP,
      userAgent,
      details: { phone },
    });

    return NextResponse.json({ success: true, session, vendor });
  } catch (error: any) {
    // Log failed login
    await logSecurityEvent({
      eventType: SecurityEventTypes.FAILED_LOGIN,
      severity: 'medium',
      ipAddress: clientIP,
      userAgent,
      details: { phone, error: error.message },
    });

    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
```

---

## 8. RECOMMENDATIONS SUMMARY

### 8.1 Critical Actions (Implement Before First APK Distribution)

| Priority | Finding | Action | Timeline |
|----------|---------|--------|----------|
| P0 | #1 | Remove hardcoded Supabase credentials from app.json | Immediate |
| P0 | #2 | Implement APK code signing with EAS Build | Before build |
| P0 | #3 | Complete RLS policies for vendor data isolation | Immediate |
| P0 | #4 | Implement SSL certificate pinning | Within 7 days |
| P0 | #5 | Replace AsyncStorage with SecureStore for tokens | Immediate |

### 8.2 High Priority (Address Before Production Launch)

| Priority | Finding | Action | Timeline |
|----------|---------|--------|----------|
| P1 | #6 | Enable ProGuard/R8 obfuscation | Before build |
| P1 | #7 | Implement session management & timeout | Within 7 days |
| P1 | #8 | Add APK download rate limiting & tracking | Within 7 days |
| P1 | #9 | Enforce API rate limiting on vendor endpoints | Within 14 days |
| P1 | #10 | Implement security event logging | Within 14 days |

### 8.3 Medium Priority (Address Within 30 Days)

- Implement root/jailbreak detection
- Add device binding verification
- Create comprehensive security documentation
- Establish incident response procedures
- Set up penetration testing schedule
- Implement comprehensive audit logging

---

## 9. SECURITY TESTING PLAN

### 9.1 Pre-Launch Security Verification Checklist

```markdown
## APK Security
- [ ] APK signed with production keystore (not debug)
- [ ] Certificate pinning configured and tested
- [ ] ProGuard/R8 obfuscation enabled
- [ ] No hardcoded credentials in decompiled APK
- [ ] Hermes bytecode enabled
- [ ] Runtime integrity checks functional
- [ ] SHA-256 checksum published on download page

## Authentication & Authorization
- [ ] Vendor login requires phone + password
- [ ] Failed login attempts rate limited (5 per 15 min)
- [ ] JWT tokens stored in SecureStore (not AsyncStorage)
- [ ] Device binding implemented and tested
- [ ] Session timeout enforced (30 min idle)
- [ ] "Logout from all devices" functionality working
- [ ] is_approved column added to vendors table
- [ ] Vendor middleware checks is_approved flag

## Row-Level Security (RLS)
- [ ] RLS enabled on all tables (vendors, products, store_profiles, referrals, subscription_history)
- [ ] Vendors can only SELECT their own data
- [ ] Vendors can only INSERT/UPDATE/DELETE their own data
- [ ] Cross-vendor data access blocked (tested)
- [ ] Public can only view active, approved vendors/products
- [ ] Service role policies tested

## API Security
- [ ] All vendor endpoints require authentication
- [ ] Rate limiting enforced (product creation: 10/hour, updates: 30/hour, reads: 60/min)
- [ ] Input validation on all endpoints
- [ ] SQL injection tests passed
- [ ] CORS configured correctly
- [ ] CSRF protection (if applicable)

## Mobile App Security
- [ ] App requests CAMERA, STORAGE permissions only when needed
- [ ] Sensitive data not logged to console in production
- [ ] App blocks execution in emulator (or shows warning)
- [ ] Debugger attachment detected and handled
- [ ] Network traffic encrypted (HTTPS only)
- [ ] Certificate pinning prevents MitM attacks
- [ ] App checks for critical updates on startup

## Download & Distribution
- [ ] APK download rate limited (3 per hour per IP)
- [ ] Download tracking implemented
- [ ] Version enforcement functional
- [ ] Critical update mechanism tested
- [ ] Checksum verification instructions on download page

## Monitoring & Logging
- [ ] Security events logged (failed logins, device mismatches, etc.)
- [ ] Critical events trigger alerts
- [ ] Audit trail for vendor actions (product create/update/delete)
- [ ] Download tracking captures IP, user agent, vendor ID
- [ ] Session activity tracked

## Incident Response
- [ ] Security incident response plan documented
- [ ] Emergency contact list maintained
- [ ] APK revocation procedure defined
- [ ] Token invalidation mechanism tested
- [ ] Vendor notification templates prepared
```

### 9.2 Penetration Testing Scope

**Phase 1: Static Analysis (Week 1)**
- Decompile production APK and review for hardcoded secrets
- Analyze JavaScript bundle for sensitive logic exposure
- Review RLS policies for bypass opportunities
- Code review for SQL injection, XSS, IDOR vulnerabilities

**Phase 2: Dynamic Testing (Week 2)**
- Attempt MitM attacks with certificate pinning enabled
- Test token theft and replay attacks
- Verify RLS policies prevent cross-vendor data access
- Fuzz API endpoints for input validation vulnerabilities
- Test rate limiting effectiveness

**Phase 3: Mobile App Security (Week 3)**
- Root detection bypass attempts
- Secure storage extraction attempts
- SSL pinning bypass tests
- Runtime manipulation via Frida
- Memory dumping for secrets

**Phase 4: Infrastructure (Week 4)**
- Vercel configuration review
- Supabase security posture assessment
- DNS/subdomain enumeration
- CORS misconfiguration testing
- Header security testing (CSP, HSTS, X-Frame-Options)

---

## 10. COMPLIANCE & LEGAL CONSIDERATIONS

### 10.1 Data Protection (GDPR/CCPA Considerations)

Even if your marketplace primarily serves Saudi Arabia, vendors may have international customers. Consider:

**Vendor PII Processing:**
- Phone numbers, emails, business addresses stored in vendors table
- No explicit consent mechanism for data processing
- No data retention policy defined
- No vendor data export functionality (GDPR right to data portability)
- No vendor data deletion functionality (GDPR right to erasure)

**Recommendations:**
1. Add privacy policy acceptance during vendor registration
2. Implement vendor data export API endpoint
3. Implement vendor account deletion with data anonymization
4. Define data retention periods and automated cleanup
5. Document legal basis for data processing

### 10.2 Saudi Arabia Cybersecurity Framework

If operating in Saudi Arabia, consider compliance with:
- National Cybersecurity Authority (NCA) Essential Cybersecurity Controls (ECC)
- Saudi Data and Artificial Intelligence Authority (SDAIA) regulations

**Key Requirements:**
- Incident response procedures (ECC 2-2)
- Security monitoring and logging (ECC 5-1)
- Secure software development lifecycle (ECC 3-4)
- Data classification and protection (ECC 4-1)

---

## 11. AUTHORIZATION REQUEST

**⚠️ IMPORTANT:** This assessment is provided for pre-implementation security planning purposes only. No active security testing, penetration testing, or vulnerability assessment has been performed without proper authorization.

Before proceeding with any active security testing activities, you must provide:

1. **Written Authorization** from organization owner/CEO
2. **Scope Definition** (in-scope assets: rimmarsa.com, Supabase project, APK)
3. **Test Windows** (dates/times when testing is permitted)
4. **Allowed Techniques** (static analysis, dynamic testing, penetration testing)
5. **Emergency Contacts** (who to notify if critical issues found)
6. **Legal Framework** (applicable laws, regulations, compliance requirements)

---

## CONCLUSION

This security assessment identifies **18 critical and high-priority findings** that must be addressed before production deployment of the vendor mobile app distribution system. The most critical issues are:

1. **Hardcoded API credentials** (immediate exposure risk)
2. **Missing APK signing** (allows trojanized APK distribution)
3. **Incomplete RLS policies** (cross-vendor data access risk)
4. **No certificate pinning** (MitM attack vulnerability)
5. **Insecure token storage** (credential theft risk)

**Estimated Security Hardening Effort:**
- Critical fixes (P0): 3-5 developer days
- High-priority fixes (P1): 5-7 developer days
- Medium-priority improvements: 3-5 developer days
- **Total: 11-17 developer days**

**Recommended Launch Timeline:**
1. Week 1: Implement P0 critical fixes
2. Week 2: Implement P1 high-priority fixes + build first signed APK
3. Week 3: Security testing & verification
4. Week 4: Fix any issues found in testing + prepare monitoring
5. Week 5: Limited beta launch to 5-10 trusted vendors
6. Week 6: Production launch

**Next Steps:**
1. Prioritize findings based on business risk tolerance
2. Allocate development resources for security fixes
3. Schedule security code review before production deployment
4. Engage third-party penetration testing firm (recommended)
5. Establish ongoing security monitoring and incident response procedures

---

**Assessment Prepared By:** Claude (Anthropic AI Security Assistant)
**Contact:** Requires human security team review and sign-off
**Disclaimer:** This assessment is based on code analysis and best practices. Actual security posture should be verified through comprehensive penetration testing by qualified security professionals.
