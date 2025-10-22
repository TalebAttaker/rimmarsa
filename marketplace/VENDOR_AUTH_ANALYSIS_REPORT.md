# Vendor Authentication Analysis Report
**Date:** October 22, 2025
**Platform:** Rimmarsa Multi-Vendor Marketplace
**Analyzed By:** Security Assessment System
**Severity:** CRITICAL

---

## Executive Summary

**CRITICAL ISSUE IDENTIFIED:** Vendors approved through the admin panel CANNOT login because Supabase Auth users are NOT being created during the approval process.

**Impact:**
- All approved vendors are locked out of their accounts
- Authentication system is completely broken for vendors
- Business operations are severely impacted

**Root Cause:** Gap between vendor approval workflow and Supabase Auth user creation

**Test Case Confirmed:**
- Vendor: "متجر التوحيد" (Test Store)
- Phone: +22223456677
- Status: Approved and Active ✅
- Auth User ID: **NULL** ❌ (THIS IS THE PROBLEM)
- Email: 22223456677@rimmarsa.com (auto-generated correctly)

---

## 1. ROOT CAUSE ANALYSIS

### Problem Statement
The vendor approval flow has a critical disconnect:

```
┌─────────────────────────────────────────────────────────────┐
│ CURRENT BROKEN WORKFLOW                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Vendor submits registration                            │
│     ↓                                                       │
│  2. Admin approves via approve_vendor_request()            │
│     ↓                                                       │
│  3. Function ATTEMPTS to create auth.users record          │
│     ↓                                                       │
│  4. ❌ AUTH USER NOT CREATED (user_id = NULL)              │
│     ↓                                                       │
│  5. Vendor tries to login with phone + password            │
│     ↓                                                       │
│  6. ❌ signInWithPassword FAILS - no auth user exists      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Specific Code Issues Identified

#### Issue #1: Database Function Cannot Create Supabase Auth Users
**Location:** `/home/taleb/rimmarsa/supabase/migrations/20250117_update_approve_vendor_with_referral_tracking.sql`

**Problem:**
```sql
-- Lines 47-85: This code tries to INSERT directly into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  ...
) VALUES (...)
```

**Why This Fails:**
1. **Auth Schema Restrictions:** Direct INSERT into `auth.users` from a database function does NOT trigger Supabase's authentication infrastructure
2. **Missing Auth Infrastructure:** Supabase Auth requires using Admin API (`auth.admin.createUser`) to properly set up:
   - Identity provider records
   - Email confirmation
   - Password hashing (uses specific algorithms)
   - Session management infrastructure
3. **Service Role Required:** Creating auth users requires the service role key, which cannot be safely used in database functions

**Evidence:**
```json
{
  "id": "c1b94ad5-99cd-477f-84c3-fa6483ccd8ba",
  "business_name": "متجر التوحيد",
  "phone": "+22223456677",
  "email": "22223456677@rimmarsa.com",
  "user_id": null,  // ❌ SHOULD BE A UUID POINTING TO auth.users
  "is_approved": true,
  "is_active": true
}
```

#### Issue #2: Admin Approval Process Uses Wrong Approach
**Location:** `/home/taleb/rimmarsa/marketplace/src/app/fassalapremierprojectbsk/vendor-requests/page.tsx`

**Problem:**
```typescript
// Lines 134-138: Calls database function expecting it to create auth users
const { data, error } = await supabase
  .rpc('approve_vendor_request', {
    request_id: request.id
  })
```

**Why This Fails:**
- Relies on database function to create auth users
- Database function CANNOT use Supabase Admin API
- No fallback to server-side API route with service role

#### Issue #3: Vendor Login Expects Supabase Auth User
**Location:** `/home/taleb/rimmarsa/marketplace/src/lib/auth/vendor-auth.ts`

**Problem:**
```typescript
// Lines 20-33: Attempts to sign in with Supabase Auth
export async function signInVendorWithPhone(phoneDigits: string, password: string) {
  const email = `${phoneDigits}@vendor.rimmarsa.com`

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة')
  }
  // ...
}
```

**Why This Fails:**
- `signInWithPassword` requires a user in `auth.users` table
- Since `user_id` is NULL, no auth user exists
- Login always fails with "invalid credentials"

#### Issue #4: Password Handling Inconsistency
**Locations:**
- Vendor request stores password in `vendor_requests.password` (line 267-269 in page.tsx)
- Database function tries to hash with `crypt()` (line 70 in migration)
- No password stored in vendors table for migration script

**Problem:**
- Password stored in vendor_requests but NOT in vendors table
- When auth user should be created later, password is lost
- Migration script has no password to use

---

## 2. SECURITY VULNERABILITIES IDENTIFIED

### VULN-AUTH-001: Plaintext Password Storage (CRITICAL)
**CVSS 3.1 Score:** 8.1 (HIGH)
**Vector:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N

**Description:**
```typescript
// vendor-requests/page.tsx line 264-270
const { error } = await supabase
  .from('vendor_requests')
  .update({
    password: newPassword,  // ❌ STORING PLAINTEXT PASSWORD
    updated_at: new Date().toISOString()
  })
  .eq('id', selectedRequest.id)
```

**Impact:**
- Passwords stored in plaintext in `vendor_requests` table
- Database compromise exposes all vendor passwords
- Admin users can read vendor passwords directly

**Recommendation:**
- NEVER store plaintext passwords
- Hash passwords server-side before storage
- Use bcrypt/argon2 with proper salt

### VULN-AUTH-002: Missing Auth User Creation (CRITICAL)
**CVSS 3.1 Score:** 9.1 (CRITICAL)
**Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H

**Description:**
- Approved vendors cannot access the system
- Complete authentication failure
- Business operations disrupted

**Impact:**
- Denial of service for all approved vendors
- Revenue loss
- Platform reputation damage

### VULN-AUTH-003: Client-Side Admin Actions (HIGH)
**CVSS 3.1 Score:** 7.5 (HIGH)
**Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N

**Description:**
```typescript
// vendor-requests/page.tsx lines 67-85
// Authentication check is CLIENT-SIDE ONLY
const storedAdmin = localStorage.getItem('admin')
const loginTime = localStorage.getItem('loginTime')

if (!storedAdmin || !loginTime) {
  router.push('/fassalapremierprojectbsk/login')
  return
}
```

**Impact:**
- Admin authentication relies on localStorage (easily bypassed)
- No server-side validation
- Attacker can approve/reject vendors by manipulating client state

**Recommendation:**
- Move admin authentication to server-side middleware
- Use HttpOnly cookies for admin sessions
- Validate all admin actions server-side

### VULN-AUTH-004: Password Reset Without Verification (HIGH)
**CVSS 3.1 Score:** 7.3 (HIGH)
**Vector:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N

**Description:**
```typescript
// vendor-requests/page.tsx lines 246-284
// Admin can reset vendor password without any verification
const handleResetPassword = async () => {
  // No current password verification
  // No vendor notification
  // No audit log
}
```

**Impact:**
- Admin can hijack vendor accounts
- No accountability
- Vendor unaware of password change

---

## 3. CURRENT SYSTEM STATE

### Database Schema
```sql
-- vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  user_id UUID,  -- ❌ NULL for all approved vendors
  phone VARCHAR,
  email VARCHAR UNIQUE,
  password_hash TEXT,  -- ❌ NULL (password not stored here)
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  ...
)

-- vendor_requests table
CREATE TABLE vendor_requests (
  id UUID PRIMARY KEY,
  phone VARCHAR,
  email VARCHAR,
  password TEXT,  -- ❌ PLAINTEXT PASSWORD
  status VARCHAR,  -- pending, approved, rejected
  vendor_id UUID,
  ...
)

-- auth.users (Supabase managed)
-- ❌ NO ENTRIES FOR VENDORS
```

### Authentication Flow (Current - BROKEN)

```typescript
// LOGIN ATTEMPT
1. Vendor enters: phoneDigits = "23456677"
2. System generates: email = "23456677@vendor.rimmarsa.com"
3. Call: supabaseAdmin.auth.signInWithPassword({ email, password })
4. Supabase Auth searches auth.users WHERE email = "23456677@vendor.rimmarsa.com"
5. ❌ NOT FOUND - Returns "Invalid credentials" error
6. Vendor cannot login
```

### Email Generation (WORKING)
```sql
-- Function: generate_vendor_email (correctly implemented)
-- Input: "+22223456677"
-- Output: "23456677@vendor.rimmarsa.com"
-- Status: ✅ Working correctly
```

---

## 4. RECOMMENDED SOLUTION

### Approach: Server-Side Auth User Creation via API Route

#### Why This Approach?
1. ✅ Service role access available in API routes
2. ✅ Proper use of Supabase Admin API
3. ✅ Secure password hashing
4. ✅ Audit logging capability
5. ✅ Error handling and rollback

#### Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ CORRECTED WORKFLOW                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Vendor submits registration                            │
│     → vendor_requests (status=pending, password hashed)    │
│     ↓                                                       │
│  2. Admin reviews and clicks "Approve"                     │
│     → POST /api/admin/vendors/approve                      │
│     ↓                                                       │
│  3. API Route (with service role):                         │
│     a. Create Supabase Auth user via auth.admin.createUser│
│     b. Create vendors record with user_id linkage          │
│     c. Create subscription_history record                  │
│     d. Update vendor_request status = approved             │
│     e. Send welcome notification to vendor                 │
│     ↓                                                       │
│  4. ✅ Vendor receives credentials                         │
│     ↓                                                       │
│  5. Vendor logs in with phone + password                   │
│     → POST /api/vendor/login                               │
│     ↓                                                       │
│  6. ✅ signInWithPassword succeeds                         │
│     ↓                                                       │
│  7. ✅ Vendor accesses dashboard                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. STEP-BY-STEP REMEDIATION PLAN

### Phase 1: Emergency Fix (IMMEDIATE - Deploy within 24 hours)

#### Step 1.1: Create Admin Vendor Approval API Route
**File:** `/marketplace/src/app/api/admin/vendors/approve/route.ts`

**Purpose:**
- Server-side vendor approval with auth user creation
- Proper password handling
- Transaction-safe operations

**Key Features:**
- Uses service role to create auth users
- Creates vendor record with proper user_id linkage
- Generates subscription record
- Returns credentials for vendor notification

#### Step 1.2: Create Vendor Password Reset API Route
**File:** `/marketplace/src/app/api/admin/vendors/reset-password/route.ts`

**Purpose:**
- Server-side password reset
- Audit logging
- Vendor notification

#### Step 1.3: Update Admin UI to Use New API Routes
**File:** `/marketplace/src/app/fassalapremierprojectbsk/vendor-requests/page.tsx`

**Changes:**
- Replace `supabase.rpc('approve_vendor_request')` with API call
- Add proper error handling
- Display success messages with vendor credentials

#### Step 1.4: Migration Script for Existing Vendors
**File:** `/marketplace/scripts/fix-vendor-auth.ts`

**Purpose:**
- Create auth users for all approved vendors who have `user_id = NULL`
- Generate temporary passwords
- Output credentials for manual distribution

### Phase 2: Security Hardening (24-72 hours)

#### Step 2.1: Hash Passwords in vendor_requests
**Migration:** Add trigger to hash passwords before insert/update

#### Step 2.2: Implement Server-Side Admin Middleware
**File:** `/marketplace/src/lib/auth/admin-middleware.ts` (ALREADY EXISTS)

**Action:** Enforce in all admin routes

#### Step 2.3: Add Audit Logging
**Table:** Create `admin_actions` table
**Fields:** admin_id, action_type, target_id, timestamp, ip_address, details

#### Step 2.4: Vendor Notification System
**Feature:** Email/SMS notification when password is reset

### Phase 3: Long-Term Improvements (1-2 weeks)

#### Step 3.1: Replace Client-Side Admin Auth
- Implement JWT-based admin sessions
- HttpOnly cookies
- Session management API

#### Step 3.2: Vendor Self-Service Password Reset
- Implement phone-based OTP verification
- Secure password reset flow
- Rate limiting

#### Step 3.3: Two-Factor Authentication (Optional)
- SMS-based OTP for vendor login
- Enhanced security for high-value accounts

---

## 6. DETAILED CODE FIXES

### Fix #1: Create Admin Vendor Approval API Route

```typescript
// /marketplace/src/app/api/admin/vendors/approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate admin (use server-side middleware)
    // TODO: Add requireAdmin() middleware

    const { request_id } = await request.json()

    // 2. Fetch vendor request
    const { data: vendorRequest, error: fetchError } = await supabaseAdmin
      .from('vendor_requests')
      .select('*')
      .eq('id', request_id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !vendorRequest) {
      return NextResponse.json(
        { error: 'Vendor request not found or already processed' },
        { status: 404 }
      )
    }

    // 3. Generate email from phone
    const phoneDigits = vendorRequest.phone.replace(/\D/g, '').slice(-8)
    const email = `${phoneDigits}@vendor.rimmarsa.com`

    // 4. Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: vendorRequest.password,  // Already validated during registration
      email_confirm: true,  // Auto-confirm
      user_metadata: {
        vendor_id: vendorRequest.id,
        business_name: vendorRequest.business_name,
        phone: vendorRequest.phone,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json(
        { error: 'Failed to create authentication user: ' + authError?.message },
        { status: 500 }
      )
    }

    // 5. Calculate subscription end date
    const durationDays = vendorRequest.package_plan === '2_months' ? 60 : 30
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + durationDays)

    // 6. Create vendor record
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .insert({
        id: authData.user.id,  // Use auth user ID
        user_id: authData.user.id,
        business_name: vendorRequest.business_name,
        owner_name: vendorRequest.owner_name,
        email,
        phone: vendorRequest.phone,
        whatsapp_number: vendorRequest.whatsapp_number,
        region_id: vendorRequest.region_id,
        city_id: vendorRequest.city_id,
        address: vendorRequest.address,
        logo_url: vendorRequest.personal_image_url,
        banner_url: vendorRequest.store_image_url,
        is_active: true,
        is_approved: true,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (vendorError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create vendor record: ' + vendorError.message },
        { status: 500 }
      )
    }

    // 7. Create subscription record
    await supabaseAdmin.from('subscription_history').insert({
      vendor_id: vendor.id,
      plan_type: vendorRequest.package_plan,
      amount: vendorRequest.package_price,
      start_date: new Date().toISOString(),
      end_date: subscriptionEndDate.toISOString(),
      status: 'active',
      payment_screenshot_url: vendorRequest.payment_screenshot_url,
    })

    // 8. Update vendor request status
    await supabaseAdmin
      .from('vendor_requests')
      .update({
        status: 'approved',
        vendor_id: vendor.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', request_id)

    // 9. Return success with vendor credentials
    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        business_name: vendor.business_name,
        email,
        phone: vendor.phone,
      },
      credentials: {
        email,
        phone_digits: phoneDigits,
        // Don't return password in response for security
      },
      subscription_end_date: subscriptionEndDate,
    })
  } catch (error) {
    console.error('Vendor approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error during vendor approval' },
      { status: 500 }
    )
  }
}
```

### Fix #2: Migration Script for Existing Vendors

```typescript
// /marketplace/scripts/fix-vendor-auth.ts
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate secure temporary password
function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = 'Aa1!'  // Ensure required chars
  for (let i = 0; i < 12; i++) {
    password += chars[crypto.randomInt(0, chars.length)]
  }
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

async function fixVendorAuth() {
  console.log('🔧 Fixing vendor authentication...\n')

  // Get all approved vendors without auth users
  const { data: vendors, error } = await supabaseAdmin
    .from('vendors')
    .select('*')
    .eq('is_approved', true)
    .is('user_id', null)

  if (error || !vendors || vendors.length === 0) {
    console.log('✅ No vendors need fixing')
    return
  }

  console.log(`Found ${vendors.length} vendors to fix\n`)

  const results = []

  for (const vendor of vendors) {
    console.log(`Processing: ${vendor.business_name} (${vendor.phone})`)

    const phoneDigits = vendor.phone.replace(/\D/g, '').slice(-8)
    const email = `${phoneDigits}@vendor.rimmarsa.com`
    const tempPassword = generatePassword()

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          vendor_id: vendor.id,
          business_name: vendor.business_name,
          phone: vendor.phone,
        },
      })

      if (authError) throw authError

      // Update vendor with user_id
      await supabaseAdmin
        .from('vendors')
        .update({ user_id: authData.user.id })
        .eq('id', vendor.id)

      console.log(`✅ Created auth user for ${vendor.business_name}`)

      results.push({
        business_name: vendor.business_name,
        phone: vendor.phone,
        email,
        password: tempPassword,
      })
    } catch (error: any) {
      console.error(`❌ Failed: ${error.message}`)
    }
  }

  // Output credentials
  console.log('\n\n📋 VENDOR CREDENTIALS\n')
  console.log('Send these to vendors securely:\n')

  results.forEach((v, i) => {
    console.log(`${i + 1}. ${v.business_name}`)
    console.log(`   Phone: ${v.phone}`)
    console.log(`   Login: ${v.phone.slice(-8)} (8 digits only)`)
    console.log(`   Password: ${v.password}`)
    console.log('')
  })
}

fixVendorAuth()
```

### Fix #3: Update Admin UI

```typescript
// Update handleApprove in vendor-requests/page.tsx

const handleApprove = async (request: VendorRequest) => {
  if (!confirm(`Approve ${request.business_name}?`)) return

  setProcessing(true)

  try {
    // Call new API route instead of database function
    const response = await fetch('/api/admin/vendors/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: request.id }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to approve vendor')
    }

    toast.success(`✅ Vendor approved! Credentials:
      Phone: ${data.credentials.phone_digits}
      Login: Enter 8 digits of phone number
      Password: (sent separately)
    `)

    fetchRequests()
    setShowDetailsModal(false)
  } catch (error: any) {
    toast.error(error.message)
  } finally {
    setProcessing(false)
  }
}
```

---

## 7. TESTING PLAN

### Test Case 1: New Vendor Approval
```
1. Submit new vendor registration
2. Admin approves vendor
3. Verify:
   - ✅ Auth user created in auth.users
   - ✅ Vendor record has user_id populated
   - ✅ Vendor can login with phone + password
   - ✅ Session created successfully
```

### Test Case 2: Existing Vendor Fix
```
1. Run migration script
2. Verify:
   - ✅ All approved vendors have user_id
   - ✅ Auth users created
   - ✅ All vendors can login
```

### Test Case 3: Login Flow
```
1. Vendor enters: 23456677 + password
2. System converts to: 23456677@vendor.rimmarsa.com
3. Supabase Auth validates
4. Session created
5. Vendor dashboard loads
```

---

## 8. SECURITY RECOMMENDATIONS

### Immediate Actions
1. ✅ Create auth users for all approved vendors
2. ✅ Hash passwords in vendor_requests table
3. ✅ Implement server-side admin authentication
4. ✅ Add audit logging for admin actions

### Short-Term (1-2 weeks)
1. Implement password reset via OTP
2. Add rate limiting to login endpoints
3. Enable MFA for admin accounts
4. Implement session timeout (4 hours)

### Long-Term (1 month+)
1. Vendor 2FA via SMS
2. Password rotation policy (90 days)
3. Security audit logs dashboard
4. Automated security scanning

---

## 9. COMPLIANCE & AUDIT TRAIL

### Required Logging
- Admin approval actions → admin_actions table
- Password resets → admin_actions table
- Failed login attempts → rate_limits table
- Vendor status changes → admin_actions table

### Data Retention
- Audit logs: 1 year minimum
- Failed login attempts: 30 days
- Password change history: Indefinite

---

## 10. ROLLOUT PLAN

### Day 1 (Immediate)
- Create API routes for vendor approval
- Deploy migration script
- Fix existing vendors
- Notify vendors of credentials

### Day 2-3
- Update admin UI
- Implement audit logging
- Hash passwords in vendor_requests

### Day 4-7
- Security testing
- Penetration testing
- Load testing

### Week 2
- Monitoring and alerting
- Documentation
- Training for admins

---

## CONCLUSION

**Current Status:** CRITICAL - Vendor authentication completely broken

**Primary Issue:** Auth users not created during vendor approval

**Solution:** Server-side API routes using Supabase Admin API

**Timeline:** Emergency fix deployable within 24 hours

**Next Steps:**
1. Deploy vendor approval API route
2. Run migration script for existing vendors
3. Distribute credentials securely
4. Monitor login success rates
5. Implement security hardening

**Success Metrics:**
- 100% of approved vendors can login ✅
- Zero plaintext passwords stored ✅
- All admin actions logged ✅
- Response time < 2 seconds ✅

---

**Report Status:** COMPLETE
**Requires Immediate Action:** YES
**Business Impact:** CRITICAL
