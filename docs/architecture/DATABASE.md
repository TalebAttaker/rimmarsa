# Rimmarsa Database Documentation

## Overview

The Rimmarsa platform uses **Supabase** (PostgreSQL) as the complete backend solution with:
- PostgreSQL database with Row Level Security (RLS)
- Supabase Auth for authentication
- Supabase Storage for file uploads
- Database functions and triggers for business logic

## Database Schema

### Tables

#### 1. `admins`
Stores admin user accounts who manage the platform.

```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- password_hash (TEXT) -- Hashed with bcrypt
- name (TEXT)
- role (TEXT, default: 'admin')
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 2. `vendors`
Stores vendor accounts who list products and earn referral commissions.

```sql
- id (UUID, PK)
- name (TEXT)
- phone (TEXT, UNIQUE)
- email (TEXT, UNIQUE, nullable)
- password_hash (TEXT)
- id_card_image (TEXT) -- Storage URL
- profile_image (TEXT) -- Storage URL
- discount_code (TEXT, UNIQUE) -- Auto-generated 8-char code
- referred_by (UUID, FK → vendors.id, nullable)
- referral_earnings (DECIMAL, default: 0)
- subscription_start (TIMESTAMPTZ)
- subscription_end (TIMESTAMPTZ)
- is_active (BOOLEAN, default: true)
- auth_user_id (UUID, UNIQUE) -- Links to Supabase Auth
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Key Points:**
- `discount_code` is automatically generated on creation
- `referred_by` tracks referral chain
- `auth_user_id` links to Supabase Auth for authentication

#### 3. `store_profiles`
Vendor store information and WhatsApp contact.

```sql
- id (UUID, PK)
- vendor_id (UUID, UNIQUE, FK → vendors.id, CASCADE)
- store_name (TEXT)
- description (TEXT, nullable)
- city (TEXT)
- state (TEXT)
- whatsapp_number (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 4. `categories`
Product categories with bilingual support (English/Arabic).

```sql
- id (UUID, PK)
- name (TEXT, UNIQUE) -- English name
- name_ar (TEXT) -- Arabic name
- icon (TEXT, nullable) -- Emoji or icon name
- order (INTEGER, default: 0) -- Display order
- is_active (BOOLEAN, default: true)
- created_at (TIMESTAMPTZ)
```

**Pre-seeded categories:**
- Children (الأطفال)
- Men's Clothing (ملابس رجالية)
- Women's Clothing (ملابس نسائية)
- Beauty & Fashion (الجمال والموضة)
- Electronics (إلكترونيات)
- And 15 more...

#### 5. `products`
Products listed by vendors.

```sql
- id (UUID, PK)
- vendor_id (UUID, FK → vendors.id, CASCADE)
- name (TEXT)
- description (TEXT)
- price (DECIMAL)
- category_id (UUID, FK → categories.id)
- city (TEXT)
- state (TEXT)
- images (TEXT[]) -- Array of storage URLs
- is_active (BOOLEAN, default: true)
- views (INTEGER, default: 0)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Indexes:**
- `idx_products_vendor_id` on `vendor_id`
- `idx_products_category_id` on `category_id`
- `idx_products_state_city` on `(state, city)`
- `idx_products_is_active` on `is_active`

#### 6. `referrals`
Tracks referral commissions earned by vendors.

```sql
- id (UUID, PK)
- referrer_id (UUID, FK → vendors.id)
- referred_vendor_id (UUID, FK → vendors.id)
- commission_amount (DECIMAL)
- status (TEXT, default: 'pending') -- pending, paid
- created_at (TIMESTAMPTZ)
```

**Indexes:**
- `idx_referrals_referrer_id` on `referrer_id`
- `idx_referrals_status` on `status`

#### 7. `subscription_history`
Audit trail of vendor subscriptions.

```sql
- id (UUID, PK)
- vendor_id (UUID, FK → vendors.id, CASCADE)
- subscription_start (TIMESTAMPTZ)
- subscription_end (TIMESTAMPTZ)
- amount_paid (DECIMAL)
- discount_applied (DECIMAL, default: 0)
- payment_method (TEXT, nullable)
- notes (TEXT, nullable)
- created_by (UUID, nullable) -- Admin who created
- created_at (TIMESTAMPTZ)
```

---

## Row Level Security (RLS) Policies

### Categories
- **SELECT**: Public read access (where `is_active = true`)

### Products
- **SELECT**: Public read access (where `is_active = true`)
- **INSERT**: Vendors can create their own products
- **UPDATE**: Vendors can update their own products
- **DELETE**: Vendors can delete their own products

### Vendors
- **SELECT**: Vendors can view their own profile
- **UPDATE**: Vendors can update their own profile

### Store Profiles
- **SELECT**: Public read access (all)
- **SELECT**: Vendors can view their own profile
- **UPDATE**: Vendors can update their own profile

### Referrals
- **SELECT**: Vendors can view their own referrals

### Subscription History
- **SELECT**: Vendors can view their own history

---

## Database Functions

### 1. `generate_discount_code()`
Generates a unique 8-character alphanumeric discount code.

**Returns:** `TEXT`

**Usage:**
```sql
SELECT generate_discount_code();
-- Returns: 'A3F7B2C9'
```

### 2. `is_subscription_active(vendor_uuid UUID)`
Checks if a vendor's subscription is currently active.

**Parameters:**
- `vendor_uuid`: Vendor ID

**Returns:** `BOOLEAN`

**Logic:**
- Returns `true` if `is_active = true` AND `subscription_end > NOW()`

### 3. `days_until_expiry(vendor_uuid UUID)`
Calculates days remaining until subscription expires.

**Parameters:**
- `vendor_uuid`: Vendor ID

**Returns:** `INTEGER`

### 4. `get_vendor_stats(vendor_uuid UUID)`
Returns comprehensive statistics for a vendor.

**Parameters:**
- `vendor_uuid`: Vendor ID

**Returns:**
```typescript
{
  total_products: number
  active_products: number
  total_views: number
  total_referrals: number
  total_earnings: number
  pending_earnings: number
}
```

### 5. `get_public_vendor_profile(vendor_uuid UUID)`
Returns public-facing vendor profile information.

**Parameters:**
- `vendor_uuid`: Vendor ID

**Returns:**
```typescript
{
  vendor_id: UUID
  vendor_name: string
  profile_image: string
  store_name: string
  description: string
  city: string
  state: string
  whatsapp_number: string
  total_products: number
  member_since: timestamp
}
```

---

## Database Triggers

### 1. `update_updated_at_column()`
Automatically updates `updated_at` timestamp on row updates.

**Applied to:**
- `vendors`
- `store_profiles`
- `products`

### 2. `create_referral_on_vendor_creation()`
Automatically creates referral record when a new vendor is created with a referral code.

**Trigger:** `AFTER INSERT ON vendors`

**Logic:**
1. If `referred_by` is set
2. Calculate commission (20% of base subscription price)
3. Insert into `referrals` table
4. Update referrer's `referral_earnings`

---

## Storage Buckets

### 1. `vendor-id-cards` (Private)
- **Purpose**: Store vendor ID card images
- **Access**: Admin only
- **Max Size**: 5MB
- **Allowed Types**: JPEG, PNG, WebP

### 2. `vendor-profiles` (Public)
- **Purpose**: Store vendor profile images
- **Access**: Public read, vendor write
- **Max Size**: 5MB
- **Allowed Types**: JPEG, PNG, WebP

### 3. `product-images` (Public)
- **Purpose**: Store product images
- **Access**: Public read, vendor write
- **Max Size**: 5MB
- **Allowed Types**: JPEG, PNG, WebP

---

## Referral System Logic

### How It Works:

1. **Admin creates vendor**
   - Auto-generates unique `discount_code`
   - Sets `subscription_start` and `subscription_end`

2. **Vendor shares discount code**
   - Vendor shares their code with potential new vendors

3. **New vendor signs up with code**
   - Admin enters referral code during vendor creation
   - `referred_by` field is set to referrer's ID
   - New vendor gets 20% discount on subscription

4. **Referral commission is created**
   - Trigger `create_referral_on_vendor_creation()` fires
   - Calculates 20% commission on base price (not discounted price)
   - Creates entry in `referrals` table with status 'pending'
   - Updates referrer's `referral_earnings`

5. **Admin marks commission as paid**
   - When admin pays out commissions
   - Update `referrals.status` to 'paid'

### Example Calculation:

```
Base subscription price: 1000 MRU
Referral discount: 20% = 200 MRU
New vendor pays: 800 MRU

Referrer earns: 1000 × 20% = 200 MRU (commission on base price)
```

---

## Authentication Flow

### Vendor Authentication:
1. Vendor registers → Admin creates account
2. Supabase Auth user created
3. `vendors.auth_user_id` links to auth user
4. Vendor logs in with phone/email + password
5. JWT token issued by Supabase
6. RLS policies use `auth.uid()` to verify access

### Admin Authentication:
1. Admin logs in with email + password
2. Custom authentication (not using Supabase Auth)
3. JWT token issued by backend
4. Admin has full access (bypasses RLS)

---

## API Patterns

All API calls use Supabase client:

```typescript
// Example: Fetch products
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(20)

// Example: Insert product (RLS enforces vendor ownership)
const { data, error } = await supabase
  .from('products')
  .insert({
    vendor_id: vendorId,
    name: 'Product Name',
    description: 'Description',
    price: 100.00,
    category_id: categoryId,
    city: 'Nouakchott',
    state: 'Nouakchott',
    images: ['url1', 'url2'],
    is_active: true
  })
```

---

## Security Best Practices

1. **Never expose service role key** in client-side code
2. **Use RLS policies** to enforce data access rules
3. **Validate all inputs** on client and server
4. **Use prepared statements** (Supabase handles this)
5. **Limit file upload sizes** in storage buckets
6. **Rate limit authentication endpoints**
7. **Hash all passwords** with bcrypt (12 rounds minimum)
8. **Use HTTPS only** in production

---

## Indexes for Performance

Critical indexes already created:
- Products by vendor
- Products by category
- Products by location
- Referrals by referrer
- Referrals by status

**Monitor query performance** using Supabase Dashboard → Performance.

---

## Backup and Maintenance

1. **Daily backups**: Enabled in Supabase (Point-in-Time Recovery)
2. **Soft deletes**: Consider adding `deleted_at` for critical tables
3. **Archival**: Move old `subscription_history` to cold storage
4. **Monitoring**: Set up alerts for subscription expiry

---

## Future Enhancements

- [ ] Add `reviews` table for product reviews
- [ ] Add `favorites` table for wishlist
- [ ] Add `vendor_ratings` table
- [ ] Add `chat_messages` table for in-app chat
- [ ] Add `notifications` table
- [ ] Add full-text search indexes
- [ ] Add analytics tables (page views, clicks, etc.)
