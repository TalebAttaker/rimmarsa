# Security Implementation Guide
## Step-by-Step Implementation Checklist for Vendor Mobile App

**Project:** Rimmarsa Multi-Vendor Marketplace
**Document Version:** 1.0
**Last Updated:** 2025-10-22

---

## QUICK START: CRITICAL SECURITY FIXES (Day 1-3)

### Step 1: Fix Hardcoded Credentials (30 minutes)

**Current Issue:** `/home/taleb/rimmarsa/mobile-app/app.json` contains hardcoded Supabase credentials.

**Action:**

```bash
cd /home/taleb/rimmarsa/mobile-app

# 1. Edit app.json - REMOVE the "extra" section
# Before:
# "extra": {
#   "supabaseUrl": "https://rfyqzuuuumgdoomyhqcu.supabase.co",
#   "supabaseAnonKey": "eyJhbGciOiJIUzI1..."
# }

# After:
# "extra": {}

# 2. Create environment configuration file
cat > config/env.ts << 'EOF'
import Constants from 'expo-constants';

let supabaseUrl: string;
let supabaseAnonKey: string;

if (__DEV__) {
  // Development: Use local config
  supabaseUrl = 'https://rfyqzuuuumgdoomyhqcu.supabase.co';
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
} else {
  // Production: Fetch from server
  // This will be set by config fetch on app startup
  supabaseUrl = '';
  supabaseAnonKey = '';
}

export const getSupabaseConfig = async () => {
  if (__DEV__) {
    return { url: supabaseUrl, anonKey: supabaseAnonKey };
  }

  // Production: fetch from API
  const response = await fetch('https://rimmarsa.com/api/mobile/config');
  const config = await response.json();

  supabaseUrl = config.supabaseUrl;
  supabaseAnonKey = config.supabaseAnonKey;

  return { url: supabaseUrl, anonKey: supabaseAnonKey };
};
EOF

# 3. Add config to .gitignore
echo "config/env.ts" >> .gitignore
```

**Verification:**
```bash
# Decompile and check no credentials
# (after building APK)
```

---

### Step 2: Add Missing Database Column (15 minutes)

**Current Issue:** Code expects `is_approved` column but vendors table only has `is_verified`.

**Action:**

```bash
cd /home/taleb/rimmarsa/marketplace

# Create migration file
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_add_is_approved_to_vendors.sql << 'EOF'
-- Add is_approved column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Update existing vendors: set is_approved = is_verified for backward compatibility
UPDATE vendors SET is_approved = is_verified WHERE is_approved IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_vendors_approved ON vendors(is_approved, is_active);

-- Add comments for documentation
COMMENT ON COLUMN vendors.is_approved IS 'Admin approval status - vendors must be approved to access vendor app';
COMMENT ON COLUMN vendors.is_verified IS 'Email/phone verification status - for account activation';
EOF

# Apply migration (using Supabase CLI or MCP tool)
supabase db push
```

**Verification:**
```sql
-- Check column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'vendors' AND column_name = 'is_approved';

-- Check existing data migrated correctly
SELECT id, is_verified, is_approved FROM vendors LIMIT 10;
```

---

### Step 3: Implement Complete RLS Policies (2 hours)

**Current Issue:** Incomplete RLS policies allow cross-vendor data access.

**Action:**

```bash
cd /home/taleb/rimmarsa/marketplace

# Create comprehensive RLS migration
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_complete_vendor_rls_policies.sql << 'EOF'
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
    )
  );

-- Vendors can delete their own products
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

CREATE POLICY "Vendors can view own store profile"
  ON store_profiles FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

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

CREATE POLICY "Vendors can update own store profile"
  ON store_profiles FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- =========================================
-- REFERRALS TABLE POLICIES
-- =========================================

CREATE POLICY "Vendors can view own referrals"
  ON referrals FOR SELECT
  USING (
    referrer_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

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

-- =========================================
-- SUBSCRIPTION_HISTORY TABLE POLICIES
-- =========================================

CREATE POLICY "Vendors can view own subscriptions"
  ON subscription_history FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );
EOF

# Apply migration
supabase db push
```

**Verification:**
```sql
-- Test 1: Vendor can only see own products
-- (Connect as Vendor A with user_id='xxx')
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "vendor_a_user_id"}';

SELECT * FROM products WHERE vendor_id != (SELECT id FROM vendors WHERE user_id = 'vendor_a_user_id');
-- Should return: 0 rows

-- Test 2: Vendor cannot update other vendor's products
UPDATE products SET price = 1.00 WHERE vendor_id != (SELECT id FROM vendors WHERE user_id = current_setting('request.jwt.claims')::json->>'sub');
-- Should return: 0 rows updated

-- Test 3: Public cannot see inactive vendors
SELECT * FROM vendors WHERE is_active = false;
-- Should return: 0 rows (assuming RLS active for public/anon role)
```

---

### Step 4: Implement Secure Token Storage (1 hour)

**Current Issue:** Tokens stored in plaintext AsyncStorage.

**Action:**

```bash
cd /home/taleb/rimmarsa/mobile-app

# 1. Install expo-secure-store
npx expo install expo-secure-store

# 2. Create secure token manager
mkdir -p services/auth
cat > services/auth/tokenManager.ts << 'EOF'
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'vendor_auth_token';
const REFRESH_TOKEN_KEY = 'vendor_refresh_token';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class SecureTokenManager {
  static async saveTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(
      TOKEN_KEY,
      JSON.stringify({ token: tokens.accessToken, expiresAt: tokens.expiresAt }),
      { keychainAccessible: SecureStore.WHEN_UNLOCKED }
    );

    await SecureStore.setItemAsync(
      REFRESH_TOKEN_KEY,
      tokens.refreshToken,
      { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
    );
  }

  static async getAccessToken(): Promise<string | null> {
    const tokenData = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!tokenData) return null;

    const parsed = JSON.parse(tokenData);
    if (Date.now() >= parsed.expiresAt) return null;

    return parsed.token;
  }

  static async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }

  static async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }

  static async hasValidSession(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    return accessToken !== null;
  }
}
EOF

# 3. Update Supabase client
cat > services/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';
import { SecureTokenManager } from './auth/tokenManager';

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (key.includes('auth-token')) {
      const token = await SecureTokenManager.getAccessToken();
      const refreshToken = await SecureTokenManager.getRefreshToken();
      if (!token) return null;

      return JSON.stringify({
        access_token: token,
        refresh_token: refreshToken,
      });
    }
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (key.includes('auth-token')) {
      const session = JSON.parse(value);
      await SecureTokenManager.saveTokens({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at * 1000,
      });
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
    },
  }
);

export default supabase;
EOF
```

**Verification:**
```bash
# Build and install app
# Login as vendor
# Check that tokens are NOT in AsyncStorage directory:
adb shell
cd /data/data/com.rimmarsa.mobile/files/RCTAsyncLocalStorage_V1
ls -la
# Should NOT see auth tokens here

# Tokens should be in EncryptedSharedPreferences instead
```

---

## MEDIUM PRIORITY FIXES (Week 2-3)

### Step 5: APK Signing Setup (2 hours)

```bash
cd /home/taleb/rimmarsa/mobile-app

# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure EAS
eas build:configure

# 4. Create eas.json
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
EOF

# 5. Build production APK
eas build --platform android --profile production

# 6. After build completes, generate checksums
# (download APK from Expo)
sha256sum rimmarsa-vendor-v1.0.0.apk > rimmarsa-vendor-v1.0.0.apk.sha256
```

---

### Step 6: Certificate Pinning (3 hours)

```bash
cd /home/taleb/rimmarsa/mobile-app

# 1. Get certificate pins
echo | openssl s_client -servername rfyqzuuuumgdoomyhqcu.supabase.co -connect rfyqzuuuumgdoomyhqcu.supabase.co:443 2>/dev/null | openssl x509 -pubkey -noout | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -binary | openssl enc -base64

# 2. Create network security config
mkdir -p android/app/src/main/res/xml
cat > android/app/src/main/res/xml/network_security_config.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">rfyqzuuuumgdoomyhqcu.supabase.co</domain>
        <domain includeSubdomains="true">rimmarsa.com</domain>
        <pin-set expiration="2026-10-22">
            <!-- Replace with actual certificate pins from step 1 -->
            <pin digest="SHA-256">PRIMARY_PIN_HERE</pin>
            <pin digest="SHA-256">BACKUP_PIN_HERE</pin>
        </pin-set>
    </domain-config>
</network-security-config>
EOF

# 3. Update AndroidManifest.xml
# Add: android:networkSecurityConfig="@xml/network_security_config"
```

---

### Step 7: Code Obfuscation (1 hour)

```bash
cd /home/taleb/rimmarsa/mobile-app

# 1. Enable Hermes in app.json
# "android": {
#   "jsEngine": "hermes"
# }

# 2. Create ProGuard rules
mkdir -p android/app
cat > android/app/proguard-rules.pro << 'EOF'
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Expo
-keep class expo.modules.** { *; }

# Supabase
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
EOF

# 3. Enable in build.gradle
# buildTypes {
#     release {
#         minifyEnabled true
#         proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
#     }
# }
```

---

## TESTING CHECKLIST

```markdown
## Security Testing Checklist

### APK Security
- [ ] Decompile APK - no hardcoded credentials
- [ ] Certificate pinning blocks MitM proxy
- [ ] ProGuard obfuscated classes (a.b.c naming)
- [ ] Hermes bytecode (.hbc files present)
- [ ] SHA-256 checksum matches published value

### Authentication
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong credentials fails
- [ ] Login rate limited after 5 failed attempts
- [ ] Tokens stored in SecureStore (not AsyncStorage)
- [ ] Session expires after 30 min idle
- [ ] Logout clears tokens from SecureStore

### Authorization (RLS)
- [ ] Vendor A cannot see Vendor B's products
- [ ] Vendor A cannot update Vendor B's products
- [ ] Vendor A cannot delete Vendor B's products
- [ ] Public cannot see inactive vendors
- [ ] Public cannot see inactive products
- [ ] Vendor cannot modify is_approved, is_active, commission_rate

### API Rate Limiting
- [ ] Product creation limited to 10/hour
- [ ] Product updates limited to 30/hour
- [ ] Product reads limited to 60/min
- [ ] APK download limited to 3/hour per IP
- [ ] Login limited to 5/15min per IP

### Monitoring
- [ ] Successful login logged to security_events
- [ ] Failed login logged to security_events
- [ ] Device mismatch logged to security_events
- [ ] APK download logged to apk_downloads
- [ ] Session creation logged to vendor_sessions
```

---

## DEPLOYMENT CHECKLIST

```markdown
## Pre-Production Deployment

### Database
- [ ] All migrations applied successfully
- [ ] RLS policies tested and verified
- [ ] Indexes created for performance
- [ ] Backup strategy in place

### Backend (marketplace)
- [ ] Environment variables set in Vercel
- [ ] Rate limiting middleware deployed
- [ ] Security event logging active
- [ ] API endpoints tested

### Mobile App
- [ ] Production APK built with EAS
- [ ] APK signed with production keystore
- [ ] Certificate pinning enabled
- [ ] ProGuard obfuscation enabled
- [ ] Hermes engine enabled
- [ ] Version enforcement implemented

### Download Page
- [ ] SHA-256 checksum published
- [ ] Installation instructions clear
- [ ] Rate limiting active
- [ ] Download tracking functional

### Monitoring
- [ ] Security event logging active
- [ ] APK download tracking active
- [ ] Session monitoring active
- [ ] Alert mechanisms tested

### Documentation
- [ ] Security policies documented
- [ ] Incident response plan ready
- [ ] Vendor communication templates prepared
- [ ] Emergency contact list updated
```

---

## EMERGENCY PROCEDURES

### If APK Compromised

1. **Immediate Actions (within 1 hour):**
   ```bash
   # 1. Block downloads
   # Update API endpoint to return error

   # 2. Invalidate all sessions
   UPDATE vendor_sessions SET is_active = false;

   # 3. Notify all vendors
   # Send email/SMS with security alert
   ```

2. **Short-term (within 24 hours):**
   - Build new APK with new signing key
   - Publish updated SHA-256 checksum
   - Force app update (set critical_update_required)
   - Communicate update instructions to vendors

3. **Follow-up (within 1 week):**
   - Conduct forensic analysis
   - Document incident
   - Update security procedures
   - Schedule security audit

### If Database Breach Detected

1. **Immediate:**
   - Rotate Supabase service role key
   - Invalidate all vendor sessions
   - Enable IP whitelisting

2. **Short-term:**
   - Audit all RLS policies
   - Review access logs
   - Notify affected vendors

3. **Follow-up:**
   - Engage security consultant
   - Implement additional monitoring
   - Review and update all policies

---

## SUPPORT & ESCALATION

**Security Incidents:**
- Emergency Contact: [Your security team email]
- Escalation: [Your CTO/CEO contact]

**Vendor Support:**
- Support Email: support@rimmarsa.com
- Support Phone: [Your support number]

**External Resources:**
- Supabase Support: https://supabase.com/support
- Expo Support: https://expo.dev/support
- Vercel Support: https://vercel.com/support

---

**Document Maintained By:** Security Team
**Last Review:** 2025-10-22
**Next Review:** 2025-11-22
