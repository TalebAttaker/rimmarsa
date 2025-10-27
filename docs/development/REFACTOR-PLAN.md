# Refactor Plan: Rimmarsa Marketplace
**Project**: Rimmarsa Marketplace Platform
**Created**: 2025-10-27
**Status**: Planning Phase
**Estimated Duration**: 3 weeks (120 hours total)

---

## Table of Contents
1. [Motivation](#motivation)
2. [Current Issues Summary](#current-issues-summary)
3. [Refactoring Phases](#refactoring-phases)
4. [Risk Assessment](#risk-assessment)
5. [Testing Strategy](#testing-strategy)
6. [Success Metrics](#success-metrics)

---

## Motivation

### Why This Refactor is Needed

The Rimmarsa marketplace was built incrementally using AI assistance (Claude Code), which resulted in:
- **Duplicated logic** across 25-30% of the codebase
- **Confusing organization** that slows down development
- **Inconsistent patterns** making maintenance difficult
- **Large, monolithic files** (1,000+ lines) that violate SRP

### Business Value
- **Faster feature development**: 20-40% velocity increase after Priority 1, 60-100% after Priority 2
- **Fewer bugs**: Centralized logic reduces edge cases
- **Easier onboarding**: New developers can navigate codebase in hours vs. days
- **Scalability**: Clean architecture supports future growth

### Technical Debt Quantification
- **Current state**: ~18,000 lines of code, 85 TypeScript files
- **Estimated duplication**: 4,500-5,400 lines (25-30%)
- **Target**: Reduce to ~13,000-14,000 lines (25% reduction)
- **Complexity reduction**: From avg 15-20 to <10 cyclomatic complexity per function

---

## Current Issues Summary

| Category | Count | Impact | Effort |
|----------|-------|--------|--------|
| Structural (naming, organization) | 3 | HIGH | SMALL |
| Code Duplication | 4 | HIGH | SMALL-MEDIUM |
| Missing Abstractions | 3 | HIGH | MEDIUM |
| Type Safety | 2 | MEDIUM | SMALL |
| Performance | 2 | MEDIUM | SMALL |
| Security | 1 | MEDIUM | MEDIUM |

**See [CODE-QUALITY-REPORT.md](./CODE-QUALITY-REPORT.md) for detailed analysis.**

---

## Refactoring Phases

### Phase 1: Quick Wins (Week 1 - 20 hours)
**Goal**: Immediate 15-20% improvement with minimal risk
**Focus**: Low-hanging fruit that provides maximum impact

#### Task 1.1: Rename Admin Directory (2 hours)
**Priority**: CRITICAL | **Risk**: LOW | **Impact**: HIGH

**Current State**:
```
/app/fassalapremierprojectbsk/  ← Confusing name
```

**Target State**:
```
/app/admin/  ← Clear, descriptive name
```

**Steps**:
1. Create new `/app/admin/` directory
2. Move all files from `/app/fassalapremierprojectbsk/` to `/app/admin/`
3. Update all import statements (search for `fassalapremierprojectbsk`)
4. Update navigation links in components
5. Test all admin routes manually
6. Delete old directory
7. Commit with message: "refactor: rename admin directory for clarity"

**Files to Update**: ~15 files
- 11 admin page files
- 4 files with navigation links (AdminLayout, navbar, etc.)

**Testing**:
- [ ] Admin login still works
- [ ] All admin pages load correctly
- [ ] Navigation links work
- [ ] API calls from admin pages still function

**Rollback Plan**: Git revert + rename back

---

#### Task 1.2: Create Shared Supabase Admin Client (1 hour)
**Priority**: HIGH | **Risk**: LOW | **Impact**: HIGH

**Current State**:
```typescript
// Duplicated in 11 files:
function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

**Target State**:
```typescript
// Single location: /lib/supabase/admin.ts
export function getSupabaseAdmin() { ... }

// All other files:
import { getSupabaseAdmin } from '@/lib/supabase/admin'
```

**Steps**:
1. Create `/lib/supabase/admin.ts` with improved implementation (singleton pattern)
2. Update 11 files to import from shared location:
   - `/lib/auth/vendor-auth.ts`
   - `/lib/auth/admin-auth.ts`
   - `/lib/auth/vendor-middleware.ts`
   - `/lib/auth/admin-middleware.ts`
   - `/lib/rate-limit.ts`
   - `/api/vendor/products/route.ts`
   - `/api/vendor/products/[id]/route.ts`
   - `/api/admin/vendors/approve/route.ts`
   - `/api/admin/security/traffic/route.ts`
   - `/api/admin/security/summary/route.ts`
   - `/api/admin/security/suspicious/route.ts`
3. Remove local `getSupabaseAdmin()` function from each file
4. Run TypeScript compiler to check for errors
5. Test critical API routes

**Code Changes**:
```typescript
// NEW FILE: /lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'

let adminClient: ReturnType<typeof createClient<Database>> | null = null

/**
 * Get Supabase Admin Client (singleton with lazy initialization)
 *
 * SECURITY: Only use server-side! Never expose service role key to client.
 *
 * @returns Supabase admin client with full database access
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not configured
 */
export function getSupabaseAdmin() {
  if (adminClient) return adminClient

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Admin client cannot be created.'
    )
  }

  adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return adminClient
}

/**
 * Reset admin client (useful for testing)
 */
export function resetAdminClient() {
  adminClient = null
}
```

**Testing**:
- [ ] Vendor login works
- [ ] Admin login works
- [ ] Product creation works
- [ ] Admin vendor approval works
- [ ] Security alerts load

**Rollback Plan**: Git revert

**Lines of Code Saved**: ~120 lines (11 files × 12 lines - 1 shared implementation)

---

#### Task 1.3: Create Shared ImageUploadCard Component (4 hours)
**Priority**: HIGH | **Risk**: LOW | **Impact**: HIGH

**Current State**:
- Image upload UI duplicated in 3+ files
- Each implementation has ~50-80 lines of JSX
- Total duplication: ~200-300 lines

**Target State**:
- Single reusable `ImageUploadCard` component (~120 lines)
- Used across all upload forms

**Steps**:
1. Create `/components/shared/ImageUploadCard.tsx`
2. Extract common upload logic into component
3. Update vendor-registration/page.tsx (4 image uploads)
4. Update fassalapremierprojectbsk/vendors/page.tsx (2 image uploads)
5. Update vendor/products/add/page.tsx (product images)
6. Test all upload flows

**Code Changes**:

```typescript
// NEW FILE: /components/shared/ImageUploadCard.tsx
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ImageUploadCardProps {
  /** Display label for the upload field */
  label: string
  /** Optional icon to display next to label */
  icon?: React.ReactNode
  /** Current image URL (if uploaded) */
  imageUrl?: string | null
  /** Whether upload is in progress */
  uploading: boolean
  /** Upload progress (0-100) */
  uploadProgress: number
  /** Callback when file is selected */
  onUpload: (file: File) => void
  /** Callback when user clicks remove */
  onRemove: () => void
  /** Size variant */
  height?: 'sm' | 'md' | 'lg'
  /** Whether field is required */
  required?: boolean
  /** Additional CSS classes */
  className?: string
  /** Accepted file types */
  accept?: string
  /** Help text to display below upload area */
  helperText?: string
}

export default function ImageUploadCard({
  label,
  icon,
  imageUrl,
  uploading,
  uploadProgress,
  onUpload,
  onRemove,
  height = 'md',
  required = false,
  className,
  accept = 'image/*',
  helperText
}: ImageUploadCardProps) {
  const heightClasses = {
    sm: 'h-24',
    md: 'h-32',
    lg: 'h-48'
  }

  return (
    <div className={cn('bg-gray-800/30 rounded-xl p-6', className)}>
      <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
        {icon}
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {imageUrl ? (
        // Preview with remove button
        <div className="space-y-3">
          <div className="relative">
            <img
              src={imageUrl}
              alt={label}
              className={cn(
                'w-full object-cover rounded-lg',
                heightClasses[height]
              )}
            />
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="w-full py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            إزالة الصورة
          </button>
        </div>
      ) : (
        // Upload area
        <div>
          <label
            className={cn(
              'flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              heightClasses[height],
              uploading
                ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
                : 'border-gray-700 hover:border-primary-500 hover:bg-gray-800/30'
            )}
          >
            <Upload className={cn(
              'w-8 h-8 mb-2',
              uploading ? 'text-gray-600' : 'text-gray-500'
            )} />
            <span className="text-sm text-gray-400">
              {uploading
                ? `جاري التحميل... ${uploadProgress}%`
                : 'انقر للتحميل أو اسحب الصورة هنا'}
            </span>
            {helperText && (
              <span className="text-xs text-gray-500 mt-1">{helperText}</span>
            )}
            <input
              type="file"
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUpload(file)
              }}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {/* Progress bar */}
          {uploading && (
            <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

**Usage Example**:
```typescript
// BEFORE (50+ lines of JSX)
<div className="bg-gray-800/30 rounded-xl p-6">
  <label>...</label>
  {formData.nni_image_url ? (
    <div>...</div>
  ) : (
    <div>...</div>
  )}
</div>

// AFTER (8 lines)
<ImageUploadCard
  label="البطاقة الوطنية (NNI)"
  icon={<Shield className="w-4 h-4" />}
  imageUrl={formData.nni_image_url}
  uploading={uploading.nni}
  uploadProgress={uploadProgress.nni}
  onUpload={(file) => handleImageUpload(file, 'nni')}
  onRemove={() => setFormData({ ...formData, nni_image_url: '' })}
  required
  helperText="صورة واضحة للبطاقة الوطنية"
/>
```

**Testing**:
- [ ] Upload image in vendor registration
- [ ] Remove uploaded image
- [ ] Progress indicator shows correctly
- [ ] Different height variants work
- [ ] Required indicator shows
- [ ] All image types in registration form work

**Lines of Code Saved**: ~200-300 lines

---

#### Task 1.4: Create Shared Types File (2 hours)
**Priority**: HIGH | **Risk**: LOW | **Impact**: MEDIUM

**Current State**:
- Types duplicated in 10+ files
- Inconsistent field definitions
- No single source of truth

**Steps**:
1. Create `/lib/types/index.ts`
2. Define all common types (Region, City, Vendor, Product, Category, Admin)
3. Export from centralized location
4. Update all files using these types
5. Run TypeScript compiler

**Code Changes**:

```typescript
// NEW FILE: /lib/types/index.ts
/**
 * Shared TypeScript types for Rimmarsa Marketplace
 *
 * This file serves as the single source of truth for all
 * domain models used across the application.
 */

// ============================================
// LOCATION TYPES
// ============================================

export interface Region {
  id: string
  name: string
  name_ar: string
  code: string
  is_active: boolean
  created_at?: string
}

export interface City {
  id: string
  name: string
  name_ar: string
  region_id: string
  is_active: boolean
  created_at?: string
}

// ============================================
// USER TYPES
// ============================================

export interface Vendor {
  id: string
  business_name: string
  owner_name: string
  email: string
  phone: string
  user_id?: string | null
  logo_url?: string | null
  personal_picture_url?: string | null
  nni_image_url?: string | null
  promo_code?: string | null
  description?: string | null
  region_id?: string | null
  city_id?: string | null
  address?: string | null
  whatsapp_number?: string | null
  is_verified: boolean
  is_active: boolean
  is_approved: boolean
  created_at: string
  updated_at?: string
  // Relations
  regions?: Region
  cities?: City
}

export interface Admin {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'moderator'
  user_id?: string | null
  created_at: string
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface Category {
  id: string
  name: string
  name_ar: string
  icon?: string | null
  is_active: boolean
  order: number | null
  created_at?: string
}

export interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  vendor_id: string
  category_id: string
  region_id?: string | null
  city_id?: string | null
  images?: string[] | null
  is_active: boolean
  is_featured?: boolean
  stock_quantity?: number | null
  created_at: string
  updated_at?: string
  // Relations
  vendors?: Vendor
  categories?: Category
  regions?: Region
  cities?: City
}

// ============================================
// REQUEST TYPES
// ============================================

export interface VendorRequest {
  id: string
  business_name: string
  owner_name: string
  email: string | null
  phone: string
  password: string // Will be hashed by admin
  whatsapp_number: string | null
  region_id?: string | null
  city_id?: string | null
  address?: string | null
  package_plan: string
  package_price: number
  referred_by_code?: string | null
  nni_image_url: string
  personal_image_url: string
  store_image_url: string
  payment_screenshot_url: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  created_at: string
  updated_at?: string
  // Relations
  regions?: Region
  cities?: City
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export interface SubscriptionHistory {
  id: string
  vendor_id: string
  plan_name: string
  price: number
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface ProfileView {
  id: string
  vendor_id: string
  viewer_ip?: string | null
  viewer_country?: string | null
  viewer_city?: string | null
  viewed_at: string
}

// ============================================
// UTILITY TYPES
// ============================================

export type UploadImageType = 'nni' | 'personal' | 'store' | 'payment' | 'logo' | 'product'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  validation_errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
```

**Testing**:
- [ ] TypeScript compilation succeeds
- [ ] No type errors in updated files
- [ ] IDE autocomplete works for imported types

**Lines of Code Saved**: ~100-150 lines (removes duplicate type definitions)

---

#### Task 1.5: Establish Naming Conventions (1 hour)
**Priority**: MEDIUM | **Risk**: NONE | **Impact**: MEDIUM

**Deliverable**: Document coding standards

See Task 2.6 below for full CODE-STANDARDS.md creation.

This task focuses on documenting existing good patterns and identifying violations.

---

#### Task 1.6: Create Consistent Route Grouping (2 hours)
**Priority**: MEDIUM | **Risk**: LOW | **Impact**: MEDIUM

**Current State**:
```
/app/vendor/          → Authenticated vendor routes
/app/vendors/         → Public vendor listing
/app/vendor-registration/ → Registration form
```

**Target State** (using Next.js 15 route groups):
```
/app/(public)/
  ├── page.tsx        → Home
  ├── vendors/        → Vendor directory
  └── products/       → Product listings

/app/(vendor)/
  ├── layout.tsx      → Vendor auth wrapper
  └── dashboard/      → Vendor portal

/app/(admin)/
  ├── layout.tsx      → Admin auth wrapper
  └── dashboard/      → Admin panel

/app/vendor-registration/  → Keep separate (no auth required)
```

**Steps**:
1. Create route group directories
2. Move files to appropriate groups
3. Update import paths
4. Test all routes
5. Verify auth layouts apply correctly

**Testing**:
- [ ] Public routes accessible without auth
- [ ] Vendor routes require vendor auth
- [ ] Admin routes require admin auth
- [ ] Navigation works correctly

---

### Phase 1 Summary
**Total Time**: 20 hours
**Lines of Code Reduced**: ~450-550 lines
**Developer Velocity Improvement**: +20-40%
**Risk Level**: LOW

---

### Phase 2: Structural Improvements (Week 2 - 40 hours)
**Goal**: 30-40% code reduction, establish solid patterns
**Focus**: Larger refactorings that require more testing

#### Task 2.1: Create Centralized Error Handler (4 hours)
**Priority**: HIGH | **Risk**: MEDIUM | **Impact**: HIGH

**Current State**:
- 3 different error handling patterns across API routes
- Inconsistent error responses
- No centralized logging

**Target State**:
- Single `withErrorHandling()` wrapper
- Consistent error response format
- Automatic error logging

**Steps**:
1. Create `/lib/api/error-handler.ts` (see CODE-QUALITY-REPORT.md for full code)
2. Create `/lib/api/response-builder.ts` for consistent responses
3. Update 15 API routes to use new error handler
4. Add error type classes (ApiError, UnauthorizedError, etc.)
5. Test error scenarios for each route

**Code Changes**:

```typescript
// NEW FILE: /lib/api/response-builder.ts
import { NextResponse } from 'next/server'

export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

/**
 * Build consistent success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    { success: true, data, message } as SuccessResponse<T>,
    { status }
  )
}

/**
 * Build consistent error response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: any
): NextResponse {
  return NextResponse.json(
    { success: false, error, code, details } as ErrorResponse,
    { status }
  )
}
```

**Usage Example**:
```typescript
// BEFORE (25 lines)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = vendorLoginSchema.parse(body)
    // ... logic ...
    return NextResponse.json({ success: true, vendor })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', validation_errors: getValidationErrors(error) },
        { status: 400 }
      )
    }
    console.error('Vendor login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطأ' },
      { status: 401 }
    )
  }
}

// AFTER (10 lines)
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = vendorLoginSchema.parse(body) // Auto-caught

  // ... logic ...

  return successResponse({ vendor })
})
```

**Testing**:
- [ ] Valid requests return 200
- [ ] Validation errors return 400 with details
- [ ] Auth errors return 401
- [ ] Server errors return 500
- [ ] Error logs appear in console

**Lines of Code Saved**: ~200 lines across 15 API routes

---

#### Task 2.2: Extract Form Validation Hooks (6 hours)
**Priority**: HIGH | **Risk**: LOW | **Impact**: MEDIUM

**Current State**:
- Password validation duplicated in 3+ files
- Phone validation duplicated in 5+ files
- No reusable validation logic

**Target State**:
- Shared hooks: `usePasswordValidation()`, `usePhoneValidation()`
- Consistent validation messages
- Built-in strength indicators

**Steps**:
1. Create `/lib/hooks/useFormValidation.ts` (see CODE-QUALITY-REPORT.md for full code)
2. Extract password validation from vendor-registration
3. Extract phone validation from multiple forms
4. Update 5+ files to use new hooks
5. Test all forms

**Code Changes**: See CODE-QUALITY-REPORT.md, Issue 3.2

**Testing**:
- [ ] Password validation works in registration
- [ ] Password validation works in login
- [ ] Phone validation works in all forms
- [ ] Error messages display correctly
- [ ] Strength indicator shows for passwords

**Lines of Code Saved**: ~120 lines

---

#### Task 2.3: Create Base Auth Utility (4 hours)
**Priority**: MEDIUM | **Risk**: MEDIUM | **Impact**: MEDIUM

**Current State**:
- `signInVendorWithPhone()` and `signInAdmin()` are 80% identical
- `createVendorAuthUser()` and `createAdminAuthUser()` are 70% identical

**Target State**:
- Generic `signInWithSupabase<T>()` function
- Generic `createAuthUser<T>()` function
- Vendor/admin functions become thin wrappers

**Steps**:
1. Create `/lib/auth/base-auth.ts` (see CODE-QUALITY-REPORT.md for full code)
2. Refactor `vendor-auth.ts` to use base functions
3. Refactor `admin-auth.ts` to use base functions
4. Test all auth flows
5. Ensure error messages still make sense

**Testing**:
- [ ] Vendor login works
- [ ] Admin login works
- [ ] Error messages are user-friendly
- [ ] Auth user creation works
- [ ] Validation (is_active, is_approved) works

**Lines of Code Saved**: ~60 lines

---

#### Task 2.4: Split Monolithic Files (16 hours)
**Priority**: HIGH | **Risk**: HIGH | **Impact**: HIGH

**Target Files**:
1. `vendor-registration/page.tsx` (1,097 lines → 7 files)
2. `admin/vendors/page.tsx` (1,058 lines → 6 files)
3. `mobile-app/src/screens/VendorRegistrationScreen.js` (1,430 lines → 8 files)

**Risk**: This is the highest risk task. Break into small, testable commits.

**Approach for vendor-registration/page.tsx**:

**Step 1** (2 hours): Extract hooks
```typescript
// NEW FILE: /app/vendor-registration/hooks/useVendorRegistration.ts
export function useVendorRegistration() {
  const [formData, setFormData] = useState({...})
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  // ... all form state logic
  return { formData, setFormData, step, setStep, submitting, handleSubmit }
}

// NEW FILE: /app/vendor-registration/hooks/useImageUpload.ts
export function useImageUpload(uploadToken: string | null) {
  const [uploading, setUploading] = useState({...})
  const [uploadProgress, setUploadProgress] = useState({...})

  const handleImageUpload = async (file: File, type: UploadImageType) => {
    // ... upload logic
  }

  return { uploading, uploadProgress, handleImageUpload }
}

// NEW FILE: /app/vendor-registration/hooks/useLocationData.ts
export function useLocationData() {
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filteredCities, setFilteredCities] = useState<City[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  return { regions, cities, filteredCities }
}
```

**Step 2** (4 hours): Extract step components
```typescript
// NEW FILE: /app/vendor-registration/components/BusinessInfoStep.tsx
interface BusinessInfoStepProps {
  formData: FormData
  setFormData: (data: FormData) => void
  passwordError: string
  onNext: () => void
}

export default function BusinessInfoStep({ formData, setFormData, passwordError, onNext }: BusinessInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* All step 1 fields */}
    </div>
  )
}

// Similar files for:
// - LocationStep.tsx
// - DocumentsStep.tsx
// - PricingStep.tsx
```

**Step 3** (2 hours): Extract UI components
```typescript
// NEW FILE: /app/vendor-registration/components/RegistrationStepper.tsx
// NEW FILE: /app/vendor-registration/components/SuccessScreen.tsx
// NEW FILE: /app/vendor-registration/components/PendingRequestScreen.tsx
```

**Step 4** (2 hours): Refactor main page.tsx
```typescript
// AFTER: /app/vendor-registration/page.tsx (now ~150 lines)
export default function VendorRegistrationPage() {
  const { formData, setFormData, step, setStep, submitting, handleSubmit } = useVendorRegistration()
  const { uploading, uploadProgress, handleImageUpload } = useImageUpload(uploadToken)
  const { regions, cities, filteredCities } = useLocationData()
  const passwordValidation = usePasswordValidation()

  if (loading) return <LoadingScreen />
  if (pendingRequest) return <PendingRequestScreen request={pendingRequest} />
  if (success) return <SuccessScreen formData={formData} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <Toaster position="top-right" />
      <RegistrationStepper currentStep={step} />

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <BusinessInfoStep
            formData={formData}
            setFormData={setFormData}
            passwordError={passwordValidation.error}
            onNext={() => setStep(2)}
          />
        )}
        {/* ... other steps */}
      </form>
    </div>
  )
}
```

**Step 5** (6 hours): Repeat for other monolithic files

**Testing** (CRITICAL):
- [ ] Each step after refactoring, test the ENTIRE form flow
- [ ] Commit after each file extraction
- [ ] If bugs appear, git revert last commit and try again
- [ ] Test on multiple browsers
- [ ] Test on mobile

**Lines of Code Reduction**: Main files go from 1,000+ to 100-200 lines each

---

#### Task 2.5: Implement Consistent Component Naming (4 hours)
**Priority**: LOW | **Risk**: LOW | **Impact**: LOW

**Current State**:
- Mix of `kebab-case.tsx` and `PascalCase.tsx`

**Target State**:
- All component files use `PascalCase.tsx`

**Steps**:
1. Identify all kebab-case files (e.g., `modern-hero.tsx`)
2. Rename to PascalCase (e.g., `ModernHero.tsx`)
3. Update all import statements
4. Run TypeScript compiler

**Files to Rename**:
- `modern-hero.tsx` → `ModernHero.tsx`
- `modern-navbar.tsx` → `ModernNavbar.tsx`
- `modern-footer.tsx` → `ModernFooter.tsx`
- `modern-category-card.tsx` → `ModernCategoryCard.tsx`
- `modern-product-card.tsx` → `ModernProductCard.tsx`
- `how-it-works.tsx` → `HowItWorks.tsx`
- `features-section.tsx` → `FeaturesSection.tsx`
- `testimonials-section.tsx` → `TestimonialsSection.tsx`

**Testing**:
- [ ] TypeScript compilation succeeds
- [ ] Home page renders correctly
- [ ] All components import properly

---

#### Task 2.6: Create CODE-STANDARDS.md (6 hours)
**Priority**: HIGH | **Risk**: NONE | **Impact**: HIGH

See Phase 3 below for full document creation.

---

### Phase 2 Summary
**Total Time**: 40 hours
**Lines of Code Reduced**: ~700-900 lines
**Developer Velocity Improvement**: +60-100%
**Risk Level**: MEDIUM

---

### Phase 3: Production-Ready (Week 3 - 60 hours)
**Goal**: Scalable architecture, full test coverage
**Focus**: Long-term sustainability

#### Task 3.1: Add Test Suite (30 hours)

**Structure**:
```
tests/
├── unit/
│   ├── lib/
│   │   ├── validation.test.ts
│   │   ├── r2-upload.test.ts
│   │   └── geo-fence.test.ts
│   └── hooks/
│       ├── usePasswordValidation.test.ts
│       └── usePhoneValidation.test.ts
├── integration/
│   ├── api/
│   │   ├── vendor-login.test.ts
│   │   ├── admin-login.test.ts
│   │   └── product-crud.test.ts
│   └── components/
│       └── ImageUploadCard.test.tsx
└── e2e/
    ├── vendor-registration.spec.ts
    ├── vendor-login.spec.ts
    └── admin-approval.spec.ts
```

**Test Coverage Goals**:
- Unit Tests: 70% coverage
- Integration Tests: Critical API routes
- E2E Tests: Main user flows

**Setup**:
1. Install dependencies: `npm install -D jest @testing-library/react @testing-library/jest-dom playwright`
2. Configure Jest: `jest.config.js`
3. Configure Playwright: `playwright.config.ts`
4. Add test scripts to `package.json`

**Sample Unit Test**:
```typescript
// tests/unit/hooks/usePasswordValidation.test.ts
import { renderHook, act } from '@testing-library/react'
import { usePasswordValidation } from '@/lib/hooks/useFormValidation'

describe('usePasswordValidation', () => {
  it('should validate password with numbers and letters', () => {
    const { result } = renderHook(() => usePasswordValidation())

    let validationResult
    act(() => {
      validationResult = result.current.validate('password123')
    })

    expect(validationResult.isValid).toBe(true)
    expect(result.current.error).toBe('')
  })

  it('should reject password without numbers', () => {
    const { result } = renderHook(() => usePasswordValidation())

    let validationResult
    act(() => {
      validationResult = result.current.validate('passwordonly')
    })

    expect(validationResult.isValid).toBe(false)
    expect(result.current.error).toBe('كلمة المرور يجب أن تحتوي على أرقام')
  })

  it('should reject password less than 8 characters', () => {
    const { result } = renderHook(() => usePasswordValidation())

    let validationResult
    act(() => {
      validationResult = result.current.validate('pass1')
    })

    expect(validationResult.isValid).toBe(false)
    expect(result.current.error).toContain('8 أحرف')
  })
})
```

**Sample Integration Test**:
```typescript
// tests/integration/api/vendor-login.test.ts
import { POST } from '@/app/api/vendor/login/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth/vendor-auth')

describe('POST /api/vendor/login', () => {
  it('should return 200 for valid credentials', async () => {
    const request = new NextRequest('http://localhost/api/vendor/login', {
      method: 'POST',
      body: JSON.stringify({
        phoneDigits: '12345678',
        password: 'password123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.vendor).toBeDefined()
  })

  it('should return 400 for invalid phone format', async () => {
    const request = new NextRequest('http://localhost/api/vendor/login', {
      method: 'POST',
      body: JSON.stringify({
        phoneDigits: '123',
        password: 'password123'
      })
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
```

**Sample E2E Test**:
```typescript
// tests/e2e/vendor-registration.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Vendor Registration', () => {
  test('should complete full registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/vendor-registration')

    // Step 1: Business Info
    await page.fill('[name="business_name"]', 'Test Store')
    await page.fill('[name="owner_name"]', 'Test Owner')
    await page.fill('[name="phoneDigits"]', '12345678')
    await page.fill('[name="password"]', 'password123')
    await page.fill('[name="whatsappDigits"]', '12345678')
    await page.click('button:has-text("التالي")')

    // Step 2: Location
    await page.selectOption('[name="region_id"]', { index: 1 })
    await page.selectOption('[name="city_id"]', { index: 1 })
    await page.click('button:has-text("التالي")')

    // Step 3: Documents
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-image.jpg')
    await expect(page.locator('text=تم تحميل الصورة')).toBeVisible()
    await page.click('button:has-text("التالي")')

    // Step 4: Pricing & Submit
    await page.click('[data-plan="2_months"]')
    await page.click('button:has-text("إرسال الطلب")')

    // Verify success
    await expect(page.locator('text=تم إرسال الطلب')).toBeVisible()
  })
})
```

---

#### Task 3.2: Migrate localStorage Auth to Cookies (8 hours)
**Priority**: MEDIUM | **Risk**: MEDIUM | **Impact**: MEDIUM

**Current State**:
- Sensitive auth data in localStorage (XSS vulnerable)
- 16 files using localStorage

**Target State**:
- Auth tokens in HttpOnly cookies
- Session management via server-side checks

**Steps**:
1. Create `useAuth()` hook that reads from cookies instead of localStorage
2. Update vendor layout to use new hook
3. Update admin layout to use new hook
4. Remove localStorage.getItem('admin')/getItem('vendor') calls
5. Test auth flows

**Code Changes**:
```typescript
// NEW FILE: /lib/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useVendorAuth() {
  const router = useRouter()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vendor/me')
      .then(res => res.json())
      .then(data => {
        if (data.vendor) {
          setVendor(data.vendor)
        } else {
          router.push('/vendor/login')
        }
      })
      .catch(() => router.push('/vendor/login'))
      .finally(() => setLoading(false))
  }, [router])

  return { vendor, loading }
}
```

---

#### Task 3.3: Create Service Layer (16 hours)
**Priority**: MEDIUM | **Risk**: LOW | **Impact**: HIGH

**Goal**: Separate business logic from API routes and components

**Structure**:
```
lib/services/
├── vendor.service.ts
├── product.service.ts
├── admin.service.ts
└── auth.service.ts
```

**Example**:
```typescript
// lib/services/vendor.service.ts
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { Vendor } from '@/lib/types'

export class VendorService {
  /**
   * Get vendor by ID
   */
  async getById(vendorId: string): Promise<Vendor | null> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('vendors')
      .select('*, regions(*), cities(*)')
      .eq('id', vendorId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get all active vendors
   */
  async getActive(): Promise<Vendor[]> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('vendors')
      .select('*, regions(*), cities(*)')
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Update vendor
   */
  async update(vendorId: string, updates: Partial<Vendor>): Promise<Vendor> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const vendorService = new VendorService()
```

**Usage in API Route**:
```typescript
// BEFORE
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('is_active', true)
  // ...
}

// AFTER
import { vendorService } from '@/lib/services/vendor.service'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const vendors = await vendorService.getActive()
  return successResponse(vendors)
})
```

---

#### Task 3.4: Implement Route Group Organization (6 hours)

See Task 1.6 above - this is the full implementation.

---

### Phase 3 Summary
**Total Time**: 60 hours
**Lines of Code**: Neutral (adds tests, restructures)
**Developer Velocity Improvement**: +100%+ (with tests as safety net)
**Risk Level**: LOW (tests catch regressions)

---

## Risk Assessment

### Overall Risk: MEDIUM

### Risk Breakdown

| Phase | Risk Level | Mitigation Strategy |
|-------|-----------|---------------------|
| Phase 1 | LOW | Small, isolated changes; easy to revert |
| Phase 2 | MEDIUM | Test each task independently; commit frequently |
| Phase 3 | LOW | Tests provide safety net for changes |

### Critical Risks

#### Risk 1: Breaking Auth During Refactoring
**Probability**: MEDIUM | **Impact**: HIGH

**Mitigation**:
- Test auth flows after every change
- Keep backup of working auth code
- Use feature branches for auth changes
- Test on staging environment before production

**Rollback Plan**:
- Git revert problematic commits
- Restore from backup if needed
- Communicate downtime to users

---

#### Risk 2: Introducing Bugs in Monolithic File Splitting
**Probability**: HIGH | **Impact**: MEDIUM

**Mitigation**:
- Split in small increments (extract one hook at a time)
- Commit after each extraction
- Test entire flow after each commit
- Use TypeScript to catch missing props
- Add console.log() statements during development to verify data flow

**Rollback Plan**:
- Git revert to last working commit
- Can always revert to original monolithic file

---

#### Risk 3: Test Suite Delays Launch
**Probability**: LOW | **Impact**: MEDIUM

**Mitigation**:
- Start with smoke tests (E2E) for critical paths
- Add unit tests incrementally
- Don't block launch on 100% coverage
- Target 70% coverage initially, improve over time

---

## Testing Strategy

### Test Pyramid

```
       E2E Tests (5%)
         /\
        /  \
       /    \
      /      \
     / Integration \
    /    Tests      \
   /      (25%)      \
  /                  \
 /   Unit Tests       \
/       (70%)          \
```

### Phase 1 Testing
- **Manual testing**: Click through all affected pages
- **TypeScript compiler**: Ensure no type errors
- **Visual inspection**: Check UI hasn't changed unexpectedly

### Phase 2 Testing
- **Manual regression testing**: Full app walkthrough after each task
- **Browser testing**: Chrome, Firefox, Safari
- **Mobile testing**: iOS and Android
- **API testing**: Use Postman/Insomnia to test all API routes

### Phase 3 Testing
- **Automated tests**: Run full test suite
- **CI/CD integration**: Tests run on every commit
- **Code coverage**: Monitor with Istanbul/NYC
- **Performance testing**: Lighthouse scores

### Test Checklist (After Every Change)

**Critical Paths**:
- [ ] Home page loads
- [ ] Vendor registration completes successfully
- [ ] Vendor login works
- [ ] Admin login works
- [ ] Product creation works
- [ ] Image upload works
- [ ] Admin vendor approval works

**Edge Cases**:
- [ ] Invalid form data shows errors
- [ ] Network errors handled gracefully
- [ ] Auth expiration redirects to login
- [ ] Mobile responsive layout works

---

## Success Metrics

### Code Quality Metrics

| Metric | Before | Phase 1 | Phase 2 | Phase 3 |
|--------|--------|---------|---------|---------|
| Total Lines of Code | 18,000 | 17,500 | 16,500 | 16,500 |
| Code Duplication | 25-30% | 15-20% | 5-10% | <5% |
| Avg File Size | 212 lines | 180 lines | 150 lines | 150 lines |
| Files >500 lines | 8 | 6 | 2 | 0 |
| Test Coverage | 0% | 0% | 0% | 70% |

### Developer Productivity Metrics

| Metric | Before | Phase 1 | Phase 2 | Phase 3 |
|--------|--------|---------|---------|---------|
| Time to add feature | 8 hours | 6-7 hours | 4-5 hours | 3-4 hours |
| Bug fix time | 2 hours | 1.5 hours | 1 hour | 30 min |
| New dev onboarding | 3-4 days | 2-3 days | 1-2 days | 1 day |

### Business Metrics

| Metric | Before | After Refactor |
|--------|--------|----------------|
| Development velocity | 5 features/week | 8-10 features/week |
| Bug rate | 10 bugs/week | 3-5 bugs/week |
| Deployment confidence | Medium | High |
| Tech debt repayment | 0% | 20% per sprint |

---

## Timeline & Resource Allocation

### Recommended Approach: Continuous Refactoring

**Do NOT block feature development** for refactoring. Instead:

1. **Allocate 20% of sprint capacity** to refactoring
2. **Refactor as you go**: When touching a file, improve it
3. **Boy Scout Rule**: Leave code better than you found it

### Timeline

```
Week 1: Phase 1 (Quick Wins)
├── Mon-Tue: Tasks 1.1-1.3 (8 hours)
├── Wed-Thu: Tasks 1.4-1.6 (12 hours)
└── Fri: Review, testing, documentation

Week 2: Phase 2 (Structural Improvements)
├── Mon: Task 2.1 (Error handler)
├── Tue: Tasks 2.2-2.3 (Validation hooks, base auth)
├── Wed-Thu: Task 2.4 (Split monolithic files) - MOST CRITICAL
└── Fri: Tasks 2.5-2.6 (Naming, standards)

Week 3: Phase 3 (Production-Ready)
├── Mon-Wed: Task 3.1 (Test suite) - 30 hours
├── Thu: Tasks 3.2-3.3 (Auth migration, service layer)
└── Fri: Task 3.4 (Route groups) + final review
```

### Resource Allocation

**Ideal Team**:
- 1 Senior Developer (leads refactoring, reviews)
- 1 Mid-Level Developer (implements changes)
- 1 QA Engineer (tests changes)

**Minimum Viable**:
- 1 Developer (can complete in 3 weeks full-time)

---

## Rollback Strategy

### Git Strategy

1. **Feature branches** for all refactoring work
   ```bash
   git checkout -b refactor/phase-1-quick-wins
   git checkout -b refactor/phase-2-structural
   git checkout -b refactor/phase-3-production-ready
   ```

2. **Small, atomic commits**
   - Each task gets its own commit
   - Commit message format: `refactor(scope): description`
   - Examples:
     - `refactor(admin): rename fassalapremierprojectbsk to admin`
     - `refactor(lib): create shared getSupabaseAdmin utility`
     - `refactor(components): extract ImageUploadCard component`

3. **Tag before each phase**
   ```bash
   git tag -a v1.0.0-pre-refactor -m "Baseline before refactoring"
   git tag -a v1.0.1-phase-1-complete -m "Phase 1 complete"
   ```

### Rollback Procedures

**Scenario 1: Bug discovered immediately**
```bash
git revert <commit-hash>
```

**Scenario 2: Multiple broken commits**
```bash
git reset --hard <last-known-good-commit>
git push --force-with-lease origin <branch>
```

**Scenario 3: Production emergency**
```bash
# Revert to pre-refactor baseline
git checkout v1.0.0-pre-refactor
git checkout -b hotfix/revert-refactor
# Deploy this branch immediately
```

---

## Communication Plan

### Stakeholder Updates

**Weekly Status Report** (send to project owner):
```markdown
## Refactoring Update - Week X

**Completed This Week**:
- ✅ Task 1.1: Renamed admin directory
- ✅ Task 1.2: Created shared Supabase client
- ✅ Task 1.3: Extracted ImageUploadCard component

**Metrics**:
- Lines of code reduced: 450 lines
- Files refactored: 15
- Tests added: 0 (Phase 3)

**Next Week**:
- Task 2.1: Centralized error handler
- Task 2.2: Form validation hooks

**Blockers**: None
**Risk Level**: LOW
```

### Developer Documentation

After each phase, update:
1. `README.md` - New project structure
2. `CONTRIBUTING.md` - Coding standards
3. `ARCHITECTURE.md` - Architecture decisions

---

## Conclusion

This refactoring plan balances **practical constraints** (need to launch soon) with **long-term sustainability** (need maintainable code).

**Key Principles**:
1. **Incremental approach**: Small, testable changes
2. **Low risk**: Easy rollback, frequent commits
3. **High impact**: Focus on biggest pain points first
4. **Sustainable**: Establish patterns for future development

**Recommended Start**: Begin with **Phase 1** immediately (8 hours investment). If successful, proceed to **Phase 2**. **Phase 3** can be implemented post-launch.

**ROI**: The refactoring will pay for itself within 2-3 months through increased developer productivity, fewer bugs, and faster feature development.
