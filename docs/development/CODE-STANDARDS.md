# Code Standards: Rimmarsa Marketplace
**Project**: Rimmarsa Marketplace Platform
**Version**: 1.0
**Last Updated**: 2025-10-27

---

## Table of Contents
1. [Introduction](#introduction)
2. [File & Folder Naming](#file--folder-naming)
3. [TypeScript Conventions](#typescript-conventions)
4. [React Component Standards](#react-component-standards)
5. [API Route Patterns](#api-route-patterns)
6. [Database Access Patterns](#database-access-patterns)
7. [Error Handling](#error-handling)
8. [Testing Standards](#testing-standards)
9. [Code Review Checklist](#code-review-checklist)

---

## Introduction

### Purpose
This document establishes coding standards for the Rimmarsa marketplace to ensure:
- **Consistency** across the codebase
- **Maintainability** for long-term development
- **Clarity** for new developers joining the project
- **Quality** through established patterns

### Enforcement
- All new code MUST follow these standards
- Existing code SHOULD be refactored to meet standards when touched
- Code reviews MUST check for compliance
- Automated linting enforces some rules (ESLint, Prettier)

### Philosophy
> "Code is read 10x more than it's written. Optimize for readability."

---

## File & Folder Naming

### Components
**Rule**: Use `PascalCase.tsx` for all React components

```bash
# ✓ CORRECT
components/
├── ImageUploadCard.tsx
├── ModernHero.tsx
├── VendorLayout.tsx
└── LocationFilter.tsx

# ✗ INCORRECT
components/
├── image-upload-card.tsx  # kebab-case
├── modernHero.tsx         # camelCase
├── vendor_layout.tsx      # snake_case
```

### Hooks
**Rule**: Use `camelCase.ts` with `use` prefix

```bash
# ✓ CORRECT
hooks/
├── useFormValidation.ts
├── useImageUpload.ts
└── useAuth.ts

# ✗ INCORRECT
hooks/
├── UseFormValidation.ts   # PascalCase
├── formValidation.ts      # Missing 'use' prefix
└── use-image-upload.ts    # kebab-case
```

### Utilities & Services
**Rule**: Use `camelCase.ts` or `kebab-case.ts` (prefer camelCase)

```bash
# ✓ CORRECT
lib/
├── utils/
│   ├── formatters.ts
│   └── validators.ts
├── services/
│   ├── vendorService.ts
│   └── productService.ts
└── api/
    ├── errorHandler.ts
    └── responseBuilder.ts

# ✗ INCORRECT
lib/
├── utils/
│   └── Formatters.ts      # PascalCase (reserved for classes)
└── services/
    └── vendor_service.ts  # snake_case
```

### Types & Interfaces
**Rule**: Use `PascalCase.ts` or include in `index.ts`

```bash
# ✓ CORRECT
lib/types/
├── index.ts               # Exports all types
├── Vendor.ts              # Single type file
└── Database.types.ts      # Generated types

# ✗ INCORRECT
lib/types/
├── vendor.ts              # camelCase
└── vendor-types.ts        # kebab-case
```

### Constants
**Rule**: Use `SCREAMING_SNAKE_CASE.ts` or `camelCase.ts` with const prefix

```bash
# ✓ CORRECT
lib/constants/
├── API_ROUTES.ts
├── PRICING_PLANS.ts
└── errorCodes.ts          # Alternative: camelCase with const

# ✗ INCORRECT
lib/constants/
├── api-routes.ts          # kebab-case
└── pricingPlans.ts        # Should be CAPS or have const prefix
```

### Pages (Next.js App Router)
**Rule**: Always use `page.tsx` (Next.js convention)

```bash
# ✓ CORRECT
app/
├── page.tsx               # Home page
├── vendors/
│   └── page.tsx           # Vendors listing
└── vendor-registration/
    └── page.tsx           # Registration form

# ✗ INCORRECT
app/
├── index.tsx              # Use page.tsx
└── vendors/
    └── index.tsx          # Use page.tsx
```

### API Routes
**Rule**: Always use `route.ts` (Next.js convention)

```bash
# ✓ CORRECT
app/api/
├── vendor/
│   ├── login/
│   │   └── route.ts
│   └── products/
│       └── route.ts

# ✗ INCORRECT
app/api/
├── vendor/
│   └── login.ts           # Missing route.ts convention
```

### Directory Naming
**Rule**: Use `kebab-case` for directories, except route groups

```bash
# ✓ CORRECT
src/
├── components/
├── vendor-registration/
├── (public)/              # Route group (Next.js 15)
└── (vendor)/              # Route group

# ✗ INCORRECT
src/
├── VendorRegistration/    # PascalCase
└── vendor_registration/   # snake_case
```

---

## TypeScript Conventions

### Type Definitions

#### Interfaces vs Types
**Rule**: Prefer `interface` for object shapes, `type` for unions/intersections

```typescript
// ✓ CORRECT
interface Vendor {
  id: string
  business_name: string
  email: string
}

type VendorStatus = 'active' | 'inactive' | 'pending'
type VendorWithRegion = Vendor & { region: Region }

// ✗ INCORRECT
type Vendor = {         // Should be interface
  id: string
  business_name: string
}

interface VendorStatus { ... }  // Should be type for union
```

#### Interface Naming
**Rule**: Use descriptive PascalCase, no `I` prefix

```typescript
// ✓ CORRECT
interface VendorFormData { ... }
interface ApiResponse<T> { ... }
interface ImageUploadCardProps { ... }

// ✗ INCORRECT
interface IVendor { ... }              // No 'I' prefix
interface vendorFormData { ... }       // Not camelCase
interface VendorFormDataInterface { ... }  // No 'Interface' suffix
```

#### Type Exports
**Rule**: Export types from centralized location

```typescript
// ✓ CORRECT - lib/types/index.ts
export interface Vendor { ... }
export interface Product { ... }
export type VendorStatus = 'active' | 'inactive'

// Usage in components
import { Vendor, Product, VendorStatus } from '@/lib/types'

// ✗ INCORRECT - Inline types in components
// app/vendors/page.tsx
interface Vendor { ... }  // Should import from lib/types
```

### Type Annotations

#### Function Parameters
**Rule**: Always annotate function parameters, let return type be inferred when obvious

```typescript
// ✓ CORRECT
function formatPhone(phoneDigits: string): string {
  return `+222${phoneDigits}`
}

async function fetchVendor(id: string) {  // Return type inferred
  const response = await fetch(`/api/vendors/${id}`)
  return response.json()
}

// ✗ INCORRECT
function formatPhone(phoneDigits) {  // Missing type
  return `+222${phoneDigits}`
}

function fetchVendor(id: string): Promise<any> {  // Avoid 'any'
  // ...
}
```

#### React Props
**Rule**: Always define props interface, use destructuring

```typescript
// ✓ CORRECT
interface ImageUploadCardProps {
  label: string
  imageUrl?: string | null
  onUpload: (file: File) => void
  required?: boolean
}

export default function ImageUploadCard({
  label,
  imageUrl,
  onUpload,
  required = false
}: ImageUploadCardProps) {
  // ...
}

// ✗ INCORRECT
export default function ImageUploadCard(props: any) {  // No 'any'
  // ...
}

function ImageUploadCard({ label, imageUrl, onUpload }) {  // Missing types
  // ...
}
```

### Type Safety

#### Avoid `any`
**Rule**: Use `unknown` or proper types instead of `any`

```typescript
// ✓ CORRECT
async function fetchData(): Promise<Vendor> { ... }

function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message)
  }
}

// ✗ INCORRECT
async function fetchData(): Promise<any> { ... }  // Use specific type

function handleError(error: any) {  // Use unknown
  console.error(error.message)  // No type checking
}
```

#### Type Assertions
**Rule**: Avoid `as` assertions, use type guards instead

```typescript
// ✓ CORRECT
function isVendor(obj: unknown): obj is Vendor {
  return typeof obj === 'object' && obj !== null && 'business_name' in obj
}

const data: unknown = await fetch('/api/vendor')
if (isVendor(data)) {
  console.log(data.business_name)  // Type-safe
}

// ✗ INCORRECT
const data = await fetch('/api/vendor') as Vendor  // Unsafe assertion
console.log(data.business_name)  // No runtime validation
```

### Null Safety

**Rule**: Use optional chaining and nullish coalescing

```typescript
// ✓ CORRECT
const cityName = vendor?.cities?.name ?? 'Unknown'
const price = product.price || 0  // For falsy values
const description = product.description ?? ''  // For null/undefined only

// ✗ INCORRECT
const cityName = vendor.cities.name  // May crash
const price = product.price ? product.price : 0  // Verbose
```

---

## React Component Standards

### Component Structure

**Rule**: Follow this order for component sections

```typescript
// 1. Imports (grouped)
import { useState, useEffect, useCallback } from 'react'  // React
import { useRouter } from 'next/navigation'               // Next.js
import { createClient } from '@/lib/supabase/client'      // Internal libs
import { Vendor } from '@/lib/types'                      // Types
import { Button } from '@/components/ui/Button'           // Components
import { formatPhone } from '@/lib/utils'                 // Utils

// 2. Types & Interfaces
interface VendorCardProps {
  vendor: Vendor
  onClick?: (vendor: Vendor) => void
}

// 3. Component Definition
export default function VendorCard({ vendor, onClick }: VendorCardProps) {
  // 4. Hooks (grouped by type)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 5. Effects
  useEffect(() => {
    // ...
  }, [])

  // 6. Event Handlers
  const handleClick = useCallback(() => {
    onClick?.(vendor)
  }, [vendor, onClick])

  // 7. Render Logic
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  // 8. JSX Return
  return (
    <div className="vendor-card">
      {/* ... */}
    </div>
  )
}
```

### Component Size

**Rule**: Keep components under 300 lines, ideally under 200

```typescript
// ✓ CORRECT - Small, focused component
export default function ProductCard({ product }: ProductCardProps) {
  // ~80 lines of logic and JSX
}

// ✗ INCORRECT - Monolithic component
export default function VendorRegistrationPage() {
  // 1,097 lines - SPLIT THIS!
}
```

**Solution**: Split into smaller components
```
VendorRegistrationPage.tsx (150 lines)
├── BusinessInfoStep.tsx (120 lines)
├── LocationStep.tsx (100 lines)
├── DocumentsStep.tsx (150 lines)
└── PricingStep.tsx (120 lines)
```

### State Management

**Rule**: Keep state as local as possible, lift up when needed

```typescript
// ✓ CORRECT - Local state
function ImageUploadCard() {
  const [uploading, setUploading] = useState(false)
  // State only used in this component
}

// ✗ INCORRECT - Unnecessary prop drilling
function ParentComponent() {
  const [uploading, setUploading] = useState(false)
  return <ImageUploadCard uploading={uploading} setUploading={setUploading} />
}
```

**When to lift state**:
- Multiple siblings need the same state
- Parent needs to control child state
- State persists across route changes

### Event Handlers

**Rule**: Prefix with `handle` and use descriptive names

```typescript
// ✓ CORRECT
const handleSubmit = (e: React.FormEvent) => { ... }
const handleImageUpload = (file: File) => { ... }
const handlePhoneChange = (value: string) => { ... }

// ✗ INCORRECT
const submit = () => { ... }              // Missing 'handle' prefix
const onClick = () => { ... }             // Generic name
const handle = () => { ... }              // Not descriptive
```

### Conditional Rendering

**Rule**: Use early returns for loading/error states

```typescript
// ✓ CORRECT - Early returns
export default function VendorPage({ vendorId }) {
  const { vendor, loading, error } = useVendor(vendorId)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!vendor) return <NotFound />

  return <VendorDetails vendor={vendor} />
}

// ✗ INCORRECT - Nested ternaries
export default function VendorPage({ vendorId }) {
  const { vendor, loading, error } = useVendor(vendorId)

  return loading ? (
    <LoadingSpinner />
  ) : error ? (
    <ErrorMessage error={error} />
  ) : vendor ? (
    <VendorDetails vendor={vendor} />
  ) : (
    <NotFound />
  )  // Hard to read!
}
```

### Props

**Rule**: Destructure props, provide default values

```typescript
// ✓ CORRECT
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  onClick: () => void
}

export default function Button({
  label,
  variant = 'primary',
  disabled = false,
  onClick
}: ButtonProps) {
  // ...
}

// ✗ INCORRECT
export default function Button(props: ButtonProps) {
  const variant = props.variant || 'primary'  // Use default params
  // ...
}
```

### Custom Hooks

**Rule**: Extract reusable logic into custom hooks

```typescript
// ✓ CORRECT
// hooks/useFormValidation.ts
export function usePasswordValidation() {
  const [error, setError] = useState('')

  const validate = (password: string) => {
    // Validation logic
  }

  return { validate, error }
}

// Usage
function RegistrationForm() {
  const passwordValidation = usePasswordValidation()
  // ...
}

// ✗ INCORRECT - Logic in component
function RegistrationForm() {
  const [passwordError, setPasswordError] = useState('')

  const validatePassword = (password: string) => {
    // 20 lines of validation logic in component
  }
  // ...
}
```

---

## API Route Patterns

### Route Structure

**Rule**: Use consistent structure for all API routes

```typescript
// app/api/vendor/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api/error-handler'
import { successResponse } from '@/lib/api/response-builder'
import { requireVendor } from '@/lib/auth/vendor-middleware'
import { productService } from '@/lib/services/product.service'

/**
 * GET /api/vendor/products
 *
 * Fetch all products for authenticated vendor
 *
 * @returns Array of products
 * @throws {UnauthorizedError} If vendor not authenticated
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Authentication
  const { vendor } = await requireVendor(request)

  // 2. Business Logic (via service layer)
  const products = await productService.getByVendorId(vendor.id)

  // 3. Response
  return successResponse(products)
})
```

### HTTP Methods

**Rule**: Use correct HTTP methods and status codes

```typescript
// ✓ CORRECT
export const GET = async (request: NextRequest) => {
  // Read data
  return NextResponse.json(data, { status: 200 })
}

export const POST = async (request: NextRequest) => {
  // Create resource
  return NextResponse.json(newResource, { status: 201 })
}

export const PUT = async (request: NextRequest) => {
  // Update entire resource
  return NextResponse.json(updatedResource, { status: 200 })
}

export const PATCH = async (request: NextRequest) => {
  // Partial update
  return NextResponse.json(updatedResource, { status: 200 })
}

export const DELETE = async (request: NextRequest) => {
  // Delete resource
  return NextResponse.json({ success: true }, { status: 204 })
}

// ✗ INCORRECT
export const GET = async (request: NextRequest) => {
  // Creating data in GET - should be POST
  await database.insert(data)
  return NextResponse.json(data)
}
```

### Request Validation

**Rule**: Validate all inputs with Zod schemas

```typescript
// ✓ CORRECT
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.number().positive(),
  category_id: z.string().uuid(),
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = createProductSchema.parse(body)  // Auto-throws on error

  const product = await productService.create(validatedData)
  return successResponse(product, 201)
})

// ✗ INCORRECT - No validation
export const POST = async (request: NextRequest) => {
  const body = await request.json()
  // Directly use body without validation - UNSAFE!
  const product = await productService.create(body)
  return NextResponse.json(product)
}
```

### Response Format

**Rule**: Use consistent response structure

```typescript
// ✓ CORRECT - Consistent structure
// Success response
{
  "success": true,
  "data": { ... },
  "message": "Product created successfully"  // Optional
}

// Error response
{
  "success": false,
  "error": "Product not found",
  "code": "NOT_FOUND",
  "details": { ... }  // Optional
}

// ✗ INCORRECT - Inconsistent structure
{
  "status": "ok",
  "result": { ... }
}

{
  "error": true,
  "msg": "Something went wrong"
}
```

### Authentication

**Rule**: Use middleware for authentication checks

```typescript
// ✓ CORRECT
import { requireVendor } from '@/lib/auth/vendor-middleware'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { vendor } = await requireVendor(request)
  // Vendor is authenticated, proceed with logic
})

// ✗ INCORRECT - Manual auth in every route
export const GET = async (request: NextRequest) => {
  const token = request.headers.get('Authorization')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... manual token verification ...
}
```

### Rate Limiting

**Rule**: Apply rate limiting to sensitive endpoints

```typescript
// ✓ CORRECT
import { authRateLimit, getClientIp } from '@/lib/rate-limit'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const ip = getClientIp(request)
  const identifier = `vendor_login_${ip}`

  const rateLimitResult = await authRateLimit(identifier)
  if (!rateLimitResult.success) {
    throw new ApiError('Too many attempts', 429, 'RATE_LIMIT_EXCEEDED')
  }

  // Proceed with login
})

// ✗ INCORRECT - No rate limiting on login endpoint
export const POST = async (request: NextRequest) => {
  // Login logic without rate limiting - VULNERABLE TO BRUTE FORCE!
}
```

---

## Database Access Patterns

### Supabase Client Usage

**Rule**: Use correct client for context

```typescript
// ✓ CORRECT
// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('*')
  // ...
}

// Client Component
import { createClient } from '@/lib/supabase/client'

export default function ProductList() {
  const supabase = createClient()
  // ...
}

// API Route (with admin privileges)
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const GET = async (request: NextRequest) => {
  const supabase = getSupabaseAdmin()
  // Can bypass RLS
}

// ✗ INCORRECT
// Server Component using client
import { createClient } from '@/lib/supabase/client'  // Wrong client!

export default async function HomePage() {
  const supabase = createClient()
  // ...
}
```

### Query Patterns

**Rule**: Use service layer for complex queries

```typescript
// ✓ CORRECT
// lib/services/product.service.ts
export class ProductService {
  async getActive(): Promise<Product[]> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        vendors!inner (
          id,
          business_name,
          logo_url
        ),
        categories (
          name_ar,
          icon
        ),
        cities (
          name,
          name_ar
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

// Usage in API route
export const GET = withErrorHandling(async () => {
  const products = await productService.getActive()
  return successResponse(products)
})

// ✗ INCORRECT - Complex query in API route
export const GET = async () => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .select(`* ...`)  // Long query inline
  // ...
}
```

### Error Handling

**Rule**: Always handle database errors

```typescript
// ✓ CORRECT
const { data, error } = await supabase
  .from('vendors')
  .select('*')
  .eq('id', vendorId)
  .single()

if (error) {
  throw new ApiError('Vendor not found', 404)
}

if (!data) {
  throw new ApiError('Vendor not found', 404)
}

return data

// ✗ INCORRECT
const { data } = await supabase
  .from('vendors')
  .select('*')
  .eq('id', vendorId)
  .single()

return data  // May be null, error not handled
```

### Type Safety

**Rule**: Use database types for queries

```typescript
// ✓ CORRECT
import type { Database } from '@/lib/database.types'

const supabase = createClient<Database>(...)

const { data } = await supabase
  .from('vendors')  // Autocomplete works!
  .select('business_name, email')  // Type-checked!

// data is typed as: Array<{ business_name: string, email: string }>

// ✗ INCORRECT
const supabase = createClient(...)  // No type parameter

const { data } = await supabase
  .from('vendors')
  .select('business_name, email')

// data is typed as: any[]
```

---

## Error Handling

### API Error Classes

**Rule**: Use custom error classes for different scenarios

```typescript
// ✓ CORRECT
import { ApiError, UnauthorizedError, ValidationError, NotFoundError } from '@/lib/api/error-handler'

// Authentication error
if (!vendor) {
  throw new UnauthorizedError('Vendor not authenticated')
}

// Validation error
if (price < 0) {
  throw new ValidationError('Price must be positive')
}

// Not found error
if (!product) {
  throw new NotFoundError('Product not found')
}

// Generic error
throw new ApiError('Failed to process request', 500)

// ✗ INCORRECT
if (!vendor) {
  throw new Error('Vendor not authenticated')  // Generic Error
}

if (price < 0) {
  return NextResponse.json({ error: 'Invalid price' }, { status: 400 })  // Inconsistent
}
```

### Client-Side Error Handling

**Rule**: Show user-friendly error messages

```typescript
// ✓ CORRECT
import toast from 'react-hot-toast'

async function handleSubmit() {
  try {
    await submitForm()
    toast.success('تم حفظ البيانات بنجاح')
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'حدث خطأ غير متوقع'

    toast.error(message)
    console.error('Submit error:', error)  // Log for debugging
  }
}

// ✗ INCORRECT
async function handleSubmit() {
  try {
    await submitForm()
  } catch (error) {
    alert('Error')  // Not user-friendly
    // No logging
  }
}
```

### Error Boundaries

**Rule**: Use error boundaries for React errors

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo)
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

// Usage
<ErrorBoundary>
  <VendorDashboard />
</ErrorBoundary>
```

---

## Testing Standards

### Test File Naming

**Rule**: Name test files `*.test.ts` or `*.spec.ts`, colocate with source

```bash
# ✓ CORRECT
lib/hooks/
├── useFormValidation.ts
└── useFormValidation.test.ts

components/
├── ImageUploadCard.tsx
└── ImageUploadCard.test.tsx

# ✗ INCORRECT
lib/hooks/
├── useFormValidation.ts
└── test-useFormValidation.ts  # Wrong naming

tests/hooks/
└── useFormValidation.test.ts  # Should be colocated
```

### Test Structure

**Rule**: Use AAA pattern (Arrange, Act, Assert)

```typescript
// ✓ CORRECT
describe('usePasswordValidation', () => {
  it('should validate password with numbers and letters', () => {
    // Arrange
    const { result } = renderHook(() => usePasswordValidation())
    const password = 'password123'

    // Act
    let validationResult
    act(() => {
      validationResult = result.current.validate(password)
    })

    // Assert
    expect(validationResult.isValid).toBe(true)
    expect(result.current.error).toBe('')
  })
})

// ✗ INCORRECT - All mixed together
it('should validate password', () => {
  const { result } = renderHook(() => usePasswordValidation())
  let validationResult
  act(() => {
    validationResult = result.current.validate('password123')
  })
  expect(validationResult.isValid).toBe(true)
  expect(result.current.error).toBe('')
})
```

### Test Coverage

**Rule**: Aim for 70% coverage, 100% for critical paths

```typescript
// Critical paths requiring 100% coverage:
// - Authentication flows
// - Payment processing
// - Data validation
// - Security checks

// Acceptable lower coverage:
// - UI components (manual testing sufficient)
// - Static content pages
// - Admin dashboard (internal tool)
```

### Test Descriptions

**Rule**: Use descriptive test names that explain behavior

```typescript
// ✓ CORRECT
describe('VendorService', () => {
  it('should return vendor with related region and city data', async () => { ... })
  it('should throw NotFoundError when vendor does not exist', async () => { ... })
  it('should only return active and approved vendors', async () => { ... })
})

// ✗ INCORRECT
describe('VendorService', () => {
  it('works', () => { ... })
  it('test 1', () => { ... })
  it('should get vendor', () => { ... })  // Not specific enough
})
```

---

## Code Review Checklist

### Before Submitting PR

- [ ] Code follows file naming conventions
- [ ] All functions have TypeScript types
- [ ] No `any` types used (unless absolutely necessary with comment)
- [ ] No console.log() statements (use proper logging)
- [ ] Error handling added for all async operations
- [ ] User-facing error messages are in Arabic
- [ ] Components are under 300 lines
- [ ] No duplicate code (check for DRY violations)
- [ ] Imports are organized (React → Next.js → Internal → Types → Components → Utils)
- [ ] Variables have descriptive names
- [ ] Functions are small and focused (single responsibility)
- [ ] Tests added for new functionality
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] Prettier formatting applied
- [ ] No security vulnerabilities (no sensitive data exposed)

### During Code Review

**Code Quality**:
- [ ] Is the code readable and self-documenting?
- [ ] Are variable and function names clear?
- [ ] Is the logic easy to follow?
- [ ] Are there comments explaining complex logic?

**Architecture**:
- [ ] Does code belong in the right file/directory?
- [ ] Are abstractions appropriate (not over/under-abstracted)?
- [ ] Is business logic separated from UI?
- [ ] Are reusable patterns extracted?

**Security**:
- [ ] No sensitive data in client-side code
- [ ] Input validation present
- [ ] SQL injection protected (using parameterized queries)
- [ ] XSS vulnerabilities addressed
- [ ] Authentication/authorization checks present

**Performance**:
- [ ] No unnecessary re-renders
- [ ] Large lists virtualized or paginated
- [ ] Images optimized
- [ ] Database queries efficient

**Testing**:
- [ ] Critical paths have tests
- [ ] Edge cases covered
- [ ] Error scenarios tested

---

## Enforcement

### Automated Checks (CI/CD)

```yaml
# .github/workflows/quality-check.yml
name: Code Quality

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint        # ESLint
      - run: npm run type-check  # TypeScript
      - run: npm run test        # Jest
      - run: npm run build       # Production build
```

### Manual Review

All PRs require:
1. **1 approval** from a senior developer
2. **Passing CI checks** (linting, types, tests, build)
3. **No unresolved comments** from reviewers

### Exceptions

Violations of these standards require:
1. Comment explaining why exception is needed
2. TODO to refactor later (if temporary)
3. Approval from senior developer

Example:
```typescript
// TODO: Refactor to use proper types (Issue #123)
// Using 'any' temporarily because third-party library lacks types
const response: any = await legacyApi.fetch()
```

---

## Resources

### Tools
- **TypeScript**: <https://www.typescriptlang.org/>
- **ESLint**: <https://eslint.org/>
- **Prettier**: <https://prettier.io/>
- **Jest**: <https://jestjs.io/>
- **React Testing Library**: <https://testing-library.com/react>
- **Playwright**: <https://playwright.dev/>

### Learning Resources
- Next.js 15 Docs: <https://nextjs.org/docs>
- React Best Practices: <https://react.dev/learn>
- TypeScript Handbook: <https://www.typescriptlang.org/docs/handbook/intro.html>
- Clean Code Principles: Robert C. Martin

---

## Changelog

**v1.0** (2025-10-27)
- Initial version
- Established file naming conventions
- TypeScript patterns
- React component standards
- API route patterns
- Error handling guidelines
- Testing standards

---

## Questions?

If you have questions about these standards:
1. Check this document first
2. Review existing codebase for examples
3. Ask in team chat (#dev-questions)
4. Propose changes via PR to this document
