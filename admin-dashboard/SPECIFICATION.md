# Admin Dashboard Technical Specification

## Executive Summary

This specification defines the complete implementation of the Rimmarsa Admin Dashboard - a React-based SPA for managing the multi-vendor marketplace platform. The dashboard will enable administrators to authenticate, manage cities/regions, oversee vendors, handle subscriptions, and track referrals. Implementation will follow a component-driven architecture using React 18, TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Objective

Build a secure, performant admin dashboard that enables platform administrators to:
- Authenticate using email/password credentials stored in the admins table
- Manage geographic data (cities and regions) with bilingual support
- Perform full CRUD operations on vendor accounts
- Create and manage vendor subscriptions with referral tracking
- Monitor platform activity and vendor status

## Technology Stack

### Core Technologies
- React 18.3.1
- TypeScript 5.9.3
- Vite 7.1.7 (build tool)
- React Router DOM 7.9.4 (routing)
- Tailwind CSS 4.1.14 (styling)
- Supabase JS 2.75.0 (backend client)

### Additional Libraries
- TanStack Table 8.21.3 (data tables)
- shadcn/ui components (to be installed)
- bcryptjs (for password hashing)
- React Hook Form (form handling)
- Zod (schema validation)

## Architecture Overview

### Application Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── alert.tsx
│   │   │   └── toast.tsx
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── cities/
│   │   │   ├── CitiesTable.tsx
│   │   │   ├── CityForm.tsx
│   │   │   ├── CityDeleteDialog.tsx
│   │   │   └── CityFilters.tsx
│   │   ├── vendors/
│   │   │   ├── VendorsTable.tsx
│   │   │   ├── VendorForm.tsx
│   │   │   ├── VendorDetails.tsx
│   │   │   ├── VendorFilters.tsx
│   │   │   ├── SubscriptionForm.tsx
│   │   │   └── SubscriptionHistory.tsx
│   │   └── auth/
│   │       └── LoginForm.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CitiesPage.tsx
│   │   ├── VendorsPage.tsx
│   │   └── VendorDetailPage.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── database.types.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCities.ts
│   │   └── useVendors.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── components.json              # shadcn/ui config
└── SPECIFICATION.md
```

### Routing Structure

```typescript
Routes:
/                           → Redirect to /login or /dashboard
/login                      → LoginPage (public)
/dashboard                  → DashboardPage (protected)
/cities                     → CitiesPage (protected)
/vendors                    → VendorsPage (protected)
/vendors/:id                → VendorDetailPage (protected)
```

## Feature Specifications

### 1. Authentication System

#### 1.1 Database Contract

**Table: `admins`**
```sql
id              UUID PRIMARY KEY
email           TEXT UNIQUE NOT NULL
password_hash   TEXT NOT NULL
name            TEXT NOT NULL
role            TEXT DEFAULT 'admin'
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**RLS Policies Required:**
- No RLS policies needed (admins table uses custom auth, not Supabase Auth)
- Create service role function to bypass RLS for admin operations

#### 1.2 Authentication Flow

**Login Process:**
1. User submits email + password
2. Query `admins` table for user by email
3. Compare password with bcrypt.compare(password, password_hash)
4. On success: Store admin session in localStorage + AuthContext
5. On failure: Display error message
6. Redirect to /dashboard on success

**Session Management:**
```typescript
interface AdminSession {
  id: string
  email: string
  name: string
  role: string
  expiresAt: number
}

// Store in localStorage as 'admin_session'
// Check expiry on every protected route
// Clear on logout
```

**Protected Routes:**
- Wrap all dashboard routes with ProtectedRoute component
- Check for valid session in AuthContext
- Redirect to /login if no session or expired

#### 1.3 Login UI Requirements

**Layout:**
- Centered card on full-screen background
- Logo/brand name at top
- Email input (type="email")
- Password input (type="password", show/hide toggle)
- "Remember me" checkbox (optional)
- Submit button with loading state
- Error message display area

**Validation:**
- Email: Required, valid email format
- Password: Required, minimum 8 characters
- Show inline validation errors
- Disable submit during API call

### 2. Dashboard Layout

#### 2.1 Layout Components

**Sidebar Navigation:**
```typescript
NavItems = [
  { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
  { label: 'Cities', icon: 'MapPin', path: '/cities' },
  { label: 'Vendors', icon: 'Store', path: '/vendors' },
  { label: 'Logout', icon: 'LogOut', action: 'logout' }
]
```

**Header:**
- Platform name/logo (left)
- Current page title (center)
- Admin name + avatar dropdown (right)
  - Profile option
  - Logout option

**Responsive Behavior:**
- Desktop (>1024px): Fixed sidebar, main content area
- Tablet (768-1024px): Collapsible sidebar
- Mobile (<768px): Hamburger menu with overlay sidebar

### 3. Cities/Regions Management

#### 3.1 Database Contract

**Table: `cities`**
```sql
id              UUID PRIMARY KEY
name            VARCHAR(255) UNIQUE NOT NULL    -- French
name_ar         VARCHAR(255) NOT NULL           -- Arabic
region          VARCHAR(255)                    -- French
region_ar       VARCHAR(255)                    -- Arabic
is_active       BOOLEAN DEFAULT true
order_index     INTEGER DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**Indexes:**
- `idx_cities_is_active` on `is_active`
- `idx_cities_order_index` on `order_index`

#### 3.2 API Operations

**List Cities:**
```typescript
// GET all cities with filtering
const { data, error } = await supabase
  .from('cities')
  .select('*')
  .ilike('name', `%${searchTerm}%`)
  .eq('is_active', filterActive)
  .order('order_index', { ascending: true })
  .order('name', { ascending: true })
```

**Create City:**
```typescript
const { data, error } = await supabase
  .from('cities')
  .insert({
    name: string,
    name_ar: string,
    region: string,
    region_ar: string,
    is_active: true,
    order_index: number
  })
  .select()
  .single()
```

**Update City:**
```typescript
const { data, error } = await supabase
  .from('cities')
  .update({
    name: string,
    name_ar: string,
    region: string,
    region_ar: string,
    is_active: boolean,
    order_index: number
  })
  .eq('id', cityId)
  .select()
  .single()
```

**Delete City:**
```typescript
// Soft delete by setting is_active = false
const { error } = await supabase
  .from('cities')
  .update({ is_active: false })
  .eq('id', cityId)

// Hard delete (use with caution)
const { error } = await supabase
  .from('cities')
  .delete()
  .eq('id', cityId)
```

**Toggle Active Status:**
```typescript
const { error } = await supabase
  .from('cities')
  .update({ is_active: !currentStatus })
  .eq('id', cityId)
```

#### 3.3 UI Requirements

**Cities Table:**
- Columns: Name (FR), Name (AR), Region (FR), Region (AR), Status, Actions
- Sortable by: Name, Region, Status
- Filterable by: Search (name), Status (active/inactive)
- Row actions: Edit, Delete, Toggle Status
- Pagination: 20 items per page
- Empty state: "No cities found" with "Add City" CTA

**Add/Edit City Form:**
- Fields:
  - City Name (French): Text input, required, max 255 chars
  - City Name (Arabic): Text input, required, max 255 chars, RTL support
  - Region (French): Text input, optional, max 255 chars
  - Region (Arabic): Text input, optional, max 255 chars, RTL support
  - Order Index: Number input, default 0
  - Active Status: Checkbox, default true
- Validation:
  - City Name (FR): Required, unique
  - City Name (AR): Required
  - Order Index: Must be >= 0
- Modal/Dialog presentation
- Cancel and Save buttons
- Loading state on save
- Success/error toast notifications

**Delete Confirmation:**
- Dialog with warning message
- Show city name to confirm
- "Cancel" and "Delete" buttons
- Warning if city is referenced by vendors/products

### 4. Vendor Management

#### 4.1 Database Contract

**Table: `vendors`**
```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES auth.users
business_name       VARCHAR(255) NOT NULL
owner_name          VARCHAR(255) NOT NULL
email               VARCHAR(255) UNIQUE NOT NULL
phone               VARCHAR(50) NOT NULL
city                VARCHAR(255)
address             TEXT
logo_url            TEXT
is_verified         BOOLEAN DEFAULT false
is_active           BOOLEAN DEFAULT true
referral_code       VARCHAR(8) UNIQUE
total_sales         NUMERIC(10,2) DEFAULT 0
commission_rate     NUMERIC(5,2) DEFAULT 5.00
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

**Table: `subscription_history`**
```sql
id              UUID PRIMARY KEY
vendor_id       UUID REFERENCES vendors(id)
plan_type       VARCHAR(50) NOT NULL
amount          NUMERIC(10,2) NOT NULL
start_date      TIMESTAMPTZ NOT NULL
end_date        TIMESTAMPTZ
status          VARCHAR(20) DEFAULT 'active'
created_at      TIMESTAMPTZ DEFAULT NOW()
```

**Table: `referrals`**
```sql
id                      UUID PRIMARY KEY
referrer_id             UUID REFERENCES vendors(id)
referred_vendor_id      UUID REFERENCES vendors(id)
referred_customer_email VARCHAR(255)
referral_code           VARCHAR(8) NOT NULL
commission_earned       NUMERIC(10,2) DEFAULT 0
status                  VARCHAR(20) DEFAULT 'pending'
created_at              TIMESTAMPTZ DEFAULT NOW()
```

#### 4.2 API Operations

**List Vendors:**
```typescript
const { data, error } = await supabase
  .from('vendors')
  .select(`
    *,
    subscription_history (
      plan_type,
      start_date,
      end_date,
      status
    )
  `)
  .ilike('business_name', `%${searchTerm}%`)
  .eq('is_active', filterActive)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```

**Get Vendor Details:**
```typescript
const { data, error } = await supabase
  .from('vendors')
  .select(`
    *,
    subscription_history (*),
    products (count),
    referrals!referrer_id (*)
  `)
  .eq('id', vendorId)
  .single()
```

**Create Vendor:**
```typescript
// 1. Create Supabase Auth user (if needed)
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: vendorEmail,
  password: temporaryPassword,
  email_confirm: true
})

// 2. Create vendor record
const { data, error } = await supabase
  .from('vendors')
  .insert({
    user_id: authData.user.id,
    business_name: string,
    owner_name: string,
    email: string,
    phone: string,
    city: string,
    address: string,
    is_verified: false,
    is_active: true
  })
  .select()
  .single()

// 3. Send welcome email with credentials
```

**Update Vendor:**
```typescript
const { data, error } = await supabase
  .from('vendors')
  .update({
    business_name: string,
    owner_name: string,
    email: string,
    phone: string,
    city: string,
    address: string,
    is_verified: boolean,
    is_active: boolean
  })
  .eq('id', vendorId)
  .select()
  .single()
```

**Create Subscription:**
```typescript
const { data, error } = await supabase
  .from('subscription_history')
  .insert({
    vendor_id: string,
    plan_type: string,      // 'monthly', 'quarterly', 'annual'
    amount: number,
    start_date: string,     // ISO timestamp
    end_date: string,       // ISO timestamp
    status: 'active'
  })
  .select()
  .single()
```

**Get Subscription History:**
```typescript
const { data, error } = await supabase
  .from('subscription_history')
  .select('*')
  .eq('vendor_id', vendorId)
  .order('created_at', { ascending: false })
```

#### 4.3 UI Requirements

**Vendors Table:**
- Columns: Business Name, Owner, Email, Phone, City, Status, Verified, Actions
- Sortable by: Business Name, Created Date, Status
- Filterable by:
  - Search (business name, email, phone)
  - Status (active/inactive)
  - Verified (yes/no)
  - City (dropdown from cities table)
- Row actions: View Details, Edit, Verify/Unverify, Activate/Deactivate
- Bulk actions: Export to CSV
- Pagination: 20 items per page
- Status badges: Active (green), Inactive (gray), Verified (blue checkmark)

**Add/Edit Vendor Form:**
- Fields:
  - Business Name: Text input, required, max 255 chars
  - Owner Name: Text input, required, max 255 chars
  - Email: Email input, required, unique validation
  - Phone: Tel input, required, format validation
  - City: Select dropdown (from cities table)
  - Address: Textarea, optional
  - Active Status: Checkbox
  - Verified Status: Checkbox
- Validation:
  - Email: Valid format, unique
  - Phone: Valid format (Mauritanian phone numbers)
  - All required fields must be filled
- Modal presentation
- Cancel and Save buttons
- Loading state on save
- Success/error toast notifications

**Vendor Detail Page:**

Layout sections:
1. Header Card:
   - Business name (large)
   - Verified badge
   - Active/Inactive status badge
   - Edit and Delete buttons

2. Information Card:
   - Owner Name
   - Email (with copy button)
   - Phone (with copy button)
   - City
   - Address
   - Referral Code (with copy button)
   - Created Date
   - Last Updated

3. Statistics Cards (row):
   - Total Products
   - Total Sales
   - Referral Earnings
   - Commission Rate

4. Subscription Section:
   - Current subscription status
   - Plan type
   - Start date / End date
   - Days remaining (if active)
   - "Add Subscription" button
   - Subscription history table

5. Referrals Section:
   - List of vendors referred by this vendor
   - Commission earned per referral
   - Status (pending/paid)
   - Total referral count

**Subscription Form:**
- Fields:
  - Plan Type: Select (Monthly/Quarterly/Annual)
  - Amount: Number input, required, min 0
  - Start Date: Date picker, required
  - End Date: Date picker, required, must be after start date
  - Referral Code (optional): Text input, validates against existing codes
- Auto-calculation:
  - If referral code is valid: Apply 20% discount
  - Show original amount and discounted amount
  - Calculate and display commission for referrer
- Validation:
  - Amount must be > 0
  - End date must be after start date
  - Referral code must exist (if provided)
- Modal presentation
- Cancel and Create buttons
- Show discount calculation summary before submit

**Subscription History Table:**
- Columns: Plan Type, Amount, Start Date, End Date, Status, Created Date
- Sortable by: Created Date, End Date
- Status badges: Active (green), Expired (red), Cancelled (gray)
- No pagination (show all for single vendor)

## Data Validation Rules

### Cities
```typescript
const citySchema = z.object({
  name: z.string().min(1, "City name required").max(255),
  name_ar: z.string().min(1, "Arabic name required").max(255),
  region: z.string().max(255).optional(),
  region_ar: z.string().max(255).optional(),
  order_index: z.number().min(0).default(0),
  is_active: z.boolean().default(true)
})
```

### Vendors
```typescript
const vendorSchema = z.object({
  business_name: z.string().min(1, "Business name required").max(255),
  owner_name: z.string().min(1, "Owner name required").max(255),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^\+222\d{8}$/, "Invalid Mauritanian phone"),
  city: z.string().optional(),
  address: z.string().optional(),
  is_verified: z.boolean().default(false),
  is_active: z.boolean().default(true)
})
```

### Subscriptions
```typescript
const subscriptionSchema = z.object({
  vendor_id: z.string().uuid(),
  plan_type: z.enum(['monthly', 'quarterly', 'annual']),
  amount: z.number().min(1, "Amount must be positive"),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  referral_code: z.string().length(8).optional()
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: "End date must be after start date",
  path: ["end_date"]
})
```

## Error Handling Strategy

### Error Types
1. Network errors (timeout, no connection)
2. Authentication errors (401, 403)
3. Validation errors (400)
4. Database errors (constraint violations)
5. Server errors (500)

### Error Display
- Toast notifications for transient errors
- Inline form errors for validation
- Error boundary for uncaught errors
- Retry mechanism for network failures

### Error Messages
```typescript
const errorMessages = {
  auth: {
    invalid_credentials: "Invalid email or password",
    session_expired: "Your session has expired. Please login again",
    unauthorized: "You don't have permission to perform this action"
  },
  network: {
    timeout: "Request timed out. Please try again",
    offline: "No internet connection. Please check your network",
    server_error: "Server error. Please try again later"
  },
  validation: {
    required: "This field is required",
    email: "Please enter a valid email address",
    phone: "Please enter a valid phone number",
    unique: "This value already exists"
  }
}
```

## Performance Requirements

### Loading States
- Show skeleton loaders for table data
- Show spinner for form submissions
- Debounce search inputs (300ms)
- Implement optimistic UI updates

### Caching Strategy
- Cache city list (rarely changes)
- Refetch vendor list on mutations
- Use React Query for server state management (optional)

### Pagination
- Server-side pagination for vendors table
- Client-side pagination for cities (small dataset)
- Infinite scroll for large lists (future enhancement)

## Security Considerations

### Authentication
- Store admin session in localStorage
- Set session expiry (24 hours)
- Clear session on logout
- Implement CSRF protection (Supabase handles this)

### Authorization
- Verify admin session on every protected API call
- Use Supabase service role key for admin operations
- Never expose service role key in client code (use Edge Functions)

### Input Sanitization
- Validate all user inputs with Zod schemas
- Escape special characters in search queries
- Prevent SQL injection (Supabase parameterizes queries)
- Limit file upload sizes (if implementing logo upload)

### Password Security
- Hash passwords with bcrypt (12 rounds minimum)
- Never log or display passwords
- Implement password strength requirements (min 8 chars)
- Consider password reset flow (future enhancement)

## Accessibility Requirements

### Keyboard Navigation
- All interactive elements accessible via Tab
- Modal dialogs trap focus
- Implement proper ARIA labels

### Screen Reader Support
- Semantic HTML elements
- ARIA live regions for dynamic content
- Alt text for images/icons

### Color Contrast
- WCAG AA compliance minimum
- Use Tailwind color palette with good contrast
- Don't rely solely on color for status indication

## Responsive Design Breakpoints

```css
/* Mobile First */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

## Testing Requirements

### Unit Tests (Future Enhancement)
- Test utility functions (validation, formatting)
- Test custom hooks (useAuth, useCities, useVendors)
- Test form validation logic

### Integration Tests (Future Enhancement)
- Test authentication flow
- Test CRUD operations
- Test form submissions

### E2E Tests (Future Enhancement)
- Test complete user journeys
- Test critical paths (login, create vendor, add subscription)

### Manual Testing Checklist
- Test on Chrome, Firefox, Safari
- Test on mobile devices (iOS, Android)
- Test with slow network (3G throttling)
- Test with Arabic text input (RTL)
- Test error scenarios (invalid input, network failure)

## Deployment Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-only)
```

### Build Configuration
```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Hosting Options
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Self-hosted with Nginx

### CI/CD Pipeline (Future)
1. Run linter (ESLint)
2. Run type checker (TypeScript)
3. Run tests (if implemented)
4. Build production bundle
5. Deploy to hosting platform

## Monitoring and Analytics

### Error Tracking
- Implement Sentry or similar (future)
- Log errors to console in development
- Send errors to monitoring service in production

### Usage Analytics
- Track page views (optional)
- Track feature usage (optional)
- Monitor performance metrics (optional)

## Dependencies Installation

### Required npm packages
```bash
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react  # Icons
npm install date-fns      # Date formatting
npm install clsx tailwind-merge  # Utility for className
```

### shadcn/ui setup
```bash
npx shadcn@latest init
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add badge
npx shadcn@latest add card
npx shadcn@latest add alert
npx shadcn@latest add toast
npx shadcn@latest add dropdown-menu
npx shadcn@latest add checkbox
```

## Known Limitations and Future Enhancements

### Current Limitations
- No password reset functionality
- No email notifications
- No audit logs
- No role-based access control (all admins have full access)
- No batch operations (bulk delete, bulk activate)

### Phase 2 Enhancements
- Advanced filtering with saved filter presets
- Export functionality (CSV, PDF reports)
- Dashboard analytics with charts
- Email notifications for subscription expiry
- SMS notifications for vendors
- Audit log for admin actions
- Role-based permissions (super admin, admin, viewer)
- Multi-language UI (French, Arabic)
- Dark mode support

## Success Criteria

### Acceptance Criteria
- Admin can login with valid credentials
- Admin can view, add, edit, delete cities
- Admin can view, add, edit vendor accounts
- Admin can verify/unverify vendors
- Admin can activate/deactivate vendors
- Admin can create subscriptions with referral discount
- Admin can view subscription history
- Admin can view referral earnings
- All forms validate correctly
- All table filters work as expected
- Application is responsive on all device sizes
- Application handles errors gracefully

### Performance Benchmarks
- Initial page load < 2 seconds
- Table data load < 1 second
- Form submission response < 500ms
- Search/filter response < 300ms (with debounce)

## Risk Assessment

### High Priority Risks
1. **Risk**: Exposing service role key in client code
   - **Mitigation**: Use Edge Functions for privileged operations
   - **Mitigation**: Keep service role key server-side only

2. **Risk**: Session hijacking or XSS attacks
   - **Mitigation**: Implement HTTP-only cookies (via Edge Functions)
   - **Mitigation**: Sanitize all user inputs
   - **Mitigation**: Use Content Security Policy headers

3. **Risk**: Unauthorized access to admin functions
   - **Mitigation**: Implement proper authentication checks
   - **Mitigation**: Verify admin session on every API call
   - **Mitigation**: Set session expiry

### Medium Priority Risks
1. **Risk**: Data loss during vendor deletion
   - **Mitigation**: Implement soft delete (set is_active = false)
   - **Mitigation**: Add confirmation dialogs with warnings
   - **Mitigation**: Show related records count before delete

2. **Risk**: Duplicate city names
   - **Mitigation**: Enforce unique constraint in database
   - **Mitigation**: Check for duplicates before insert

3. **Risk**: Invalid phone number formats
   - **Mitigation**: Implement strict validation with regex
   - **Mitigation**: Provide input mask for phone fields

### Low Priority Risks
1. **Risk**: Poor performance with large datasets
   - **Mitigation**: Implement server-side pagination
   - **Mitigation**: Add database indexes on filter columns
   - **Monitoring**: Monitor query performance in Supabase dashboard

## Implementation Notes

### Development Workflow
1. Set up project dependencies (shadcn/ui, additional libraries)
2. Implement authentication (login page, auth context, protected routes)
3. Build dashboard layout (sidebar, header, routing)
4. Implement cities management (table, form, CRUD)
5. Implement vendors management (table, form, CRUD)
6. Implement vendor details page
7. Implement subscription management
8. Add polish (loading states, error handling, toasts)
9. Test on multiple devices and browsers
10. Deploy to hosting platform

### Code Quality Standards
- Use TypeScript strict mode
- Follow React best practices (hooks, functional components)
- Use ESLint for code linting
- Use Prettier for code formatting
- Write meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components small and focused (< 300 lines)
- Extract reusable logic into custom hooks

### Git Workflow
- Create feature branches for each feature
- Use conventional commits (feat, fix, chore, etc.)
- Squash commits before merging to main
- Tag releases with semantic versioning

## Appendix

### Useful Supabase Queries

**Check if admin exists:**
```sql
SELECT * FROM admins WHERE email = 'admin@rimmarsa.com';
```

**Create first admin (run in Supabase SQL Editor):**
```sql
-- Install pgcrypto extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert admin with bcrypt hashed password
INSERT INTO admins (email, password_hash, name, role)
VALUES (
  'admin@rimmarsa.com',
  crypt('your_password_here', gen_salt('bf', 12)),
  'Admin User',
  'admin'
);
```

**Get vendor with subscription status:**
```sql
SELECT
  v.*,
  CASE
    WHEN sh.end_date > NOW() THEN 'active'
    ELSE 'expired'
  END as subscription_status
FROM vendors v
LEFT JOIN LATERAL (
  SELECT * FROM subscription_history
  WHERE vendor_id = v.id
  ORDER BY created_at DESC
  LIMIT 1
) sh ON true;
```

### Mauritanian Phone Number Format
```
Format: +222 XX XX XX XX
Example: +222 22 12 34 56
Regex: /^\+222\d{8}$/
```

### Common Errors and Solutions

**Error: "Missing Supabase environment variables"**
- Solution: Check .env file exists and contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

**Error: "Invalid login credentials"**
- Solution: Verify admin exists in database with correct password hash

**Error: "Permission denied for table cities"**
- Solution: Check RLS policies or use service role key for admin operations

**Error: "duplicate key value violates unique constraint"**
- Solution: Check if city name or vendor email already exists

### Contact Information
- Project Repository: /home/taleb/rimmarsa/admin-dashboard
- Database Documentation: /home/taleb/rimmarsa/docs/DATABASE.md
- Project Summary: /home/taleb/rimmarsa/PROJECT_SUMMARY.md
