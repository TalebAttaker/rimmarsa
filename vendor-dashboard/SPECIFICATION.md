# Vendor Mobile Application - Technical Specification

## Objective

Build a complete mobile-first vendor management application for the Rimmarsa marketplace platform that enables vendors to manage their products, track sales and subscriptions, leverage the referral system, and maintain their store profiles. The application will be built as a Progressive Web App (PWA) using React + TypeScript + Vite and will be packaged as an Android APK using Capacitor for native mobile deployment.

## Acceptance Criteria

1. Vendors can authenticate securely using email/password via Supabase Auth
2. Dashboard displays real-time sales metrics, subscription status, and product statistics
3. Full CRUD operations for products with multi-image upload to Supabase Storage
4. Store profile management with logo upload and business information editing
5. Referral system with shareable codes via WhatsApp and commission tracking
6. Subscription status visibility with expiry warnings and renewal history
7. Application works offline for viewing data (PWA with service workers)
8. Application supports RTL layout for Arabic language content
9. Application can be packaged as Android APK using Capacitor
10. Camera integration for capturing product photos directly from device
11. Native share functionality for referral code distribution
12. Push notification infrastructure ready for future implementation
13. Responsive design optimized for mobile devices (320px to 768px)
14. All forms include client-side validation with clear error messages
15. Loading states and error handling for all async operations

## API Endpoints

This application uses Supabase REST API and Realtime subscriptions. All API calls are authenticated using Supabase JWT tokens stored in localStorage.

### Authentication APIs

#### POST `/auth/v1/signup`
**Description**: Create new vendor account (admin-initiated)
**Request:**
```json
{
  "email": "vendor@example.com",
  "password": "securePassword123",
  "options": {
    "data": {
      "user_type": "vendor"
    }
  }
}
```
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "vendor@example.com",
    "user_metadata": {
      "user_type": "vendor"
    }
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

#### POST `/auth/v1/token?grant_type=password`
**Description**: Vendor login
**Request:**
```json
{
  "email": "vendor@example.com",
  "password": "securePassword123"
}
```
**Response:**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "vendor@example.com"
  }
}
```

#### POST `/auth/v1/recover`
**Description**: Password reset request
**Request:**
```json
{
  "email": "vendor@example.com"
}
```
**Response:**
```json
{
  "message": "Check your email for the reset link"
}
```

### Vendor Profile APIs

#### GET `/rest/v1/vendors?user_id=eq.{userId}`
**Description**: Fetch authenticated vendor profile
**Headers:**
```
Authorization: Bearer {jwt_token}
```
**Response:**
```json
[{
  "id": "uuid",
  "user_id": "uuid",
  "business_name": "Store Name",
  "owner_name": "Owner Name",
  "email": "vendor@example.com",
  "phone": "+222 12 34 56 78",
  "city": "Nouakchott",
  "address": "Street address",
  "logo_url": "storage_url",
  "is_verified": true,
  "is_active": true,
  "referral_code": "ABC12345",
  "total_sales": 50000.00,
  "commission_rate": 5.00,
  "created_at": "2025-01-15T10:00:00Z"
}]
```

#### PATCH `/rest/v1/vendors?id=eq.{vendorId}`
**Description**: Update vendor profile
**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```
**Request:**
```json
{
  "business_name": "Updated Store Name",
  "phone": "+222 98 76 54 32",
  "city": "Nouadhibou",
  "address": "New address"
}
```
**Response:** 204 No Content

### Store Profile APIs

#### GET `/rest/v1/store_profiles?vendor_id=eq.{vendorId}`
**Description**: Fetch store profile details
**Headers:**
```
Authorization: Bearer {jwt_token}
```
**Response:**
```json
[{
  "id": "uuid",
  "vendor_id": "uuid",
  "banner_url": "storage_url",
  "description": "Store description in Arabic and French",
  "social_links": {
    "whatsapp": "+222 12 34 56 78",
    "facebook": "https://facebook.com/store",
    "instagram": "@storename"
  },
  "business_hours": {
    "monday": "9:00-18:00",
    "tuesday": "9:00-18:00"
  },
  "created_at": "2025-01-15T10:00:00Z"
}]
```

#### POST `/rest/v1/store_profiles`
**Description**: Create store profile (if not exists)
**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```
**Request:**
```json
{
  "vendor_id": "uuid",
  "description": "Store description",
  "social_links": {
    "whatsapp": "+222 12 34 56 78"
  },
  "business_hours": {}
}
```
**Response:** 201 Created

#### PATCH `/rest/v1/store_profiles?vendor_id=eq.{vendorId}`
**Description**: Update store profile
**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```
**Request:**
```json
{
  "description": "Updated description",
  "social_links": {
    "whatsapp": "+222 99 88 77 66",
    "facebook": "https://facebook.com/newstore"
  },
  "business_hours": {
    "monday": "8:00-20:00"
  }
}
```
**Response:** 204 No Content

### Product APIs

#### GET `/rest/v1/products?vendor_id=eq.{vendorId}&select=*,categories(*)`
**Description**: Fetch all vendor products with category details
**Headers:**
```
Authorization: Bearer {jwt_token}
```
**Query Parameters:**
- `is_active=eq.true` - Filter active products only
- `order=created_at.desc` - Sort by creation date
- `limit=50` - Pagination limit
- `offset=0` - Pagination offset
**Response:**
```json
[{
  "id": "uuid",
  "vendor_id": "uuid",
  "category_id": "uuid",
  "name": "Product Name",
  "name_ar": "اسم المنتج",
  "description": "Product description",
  "price": 15000.00,
  "compare_at_price": 20000.00,
  "images": ["storage_url_1", "storage_url_2"],
  "city": "Nouakchott",
  "stock_quantity": 10,
  "is_active": true,
  "views_count": 125,
  "created_at": "2025-01-20T10:00:00Z",
  "categories": {
    "id": "uuid",
    "name": "Electronics",
    "name_ar": "إلكترونيات"
  }
}]
```

#### POST `/rest/v1/products`
**Description**: Create new product
**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```
**Request:**
```json
{
  "vendor_id": "uuid",
  "category_id": "uuid",
  "name": "New Product",
  "name_ar": "منتج جديد",
  "description": "Detailed product description",
  "price": 15000.00,
  "compare_at_price": 20000.00,
  "images": ["storage_url_1"],
  "city": "Nouakchott",
  "stock_quantity": 5,
  "is_active": true
}
```
**Response:** 201 Created
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "name": "New Product",
  "created_at": "2025-01-20T10:00:00Z"
}
```

#### PATCH `/rest/v1/products?id=eq.{productId}`
**Description**: Update existing product
**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```
**Request:**
```json
{
  "name": "Updated Product Name",
  "price": 16000.00,
  "stock_quantity": 8,
  "is_active": false
}
```
**Response:** 204 No Content

#### DELETE `/rest/v1/products?id=eq.{productId}`
**Description**: Delete product (soft delete by setting is_active=false recommended)
**Headers:**
```
Authorization: Bearer {jwt_token}
```
**Response:** 204 No Content

### Categories API

#### GET `/rest/v1/categories?is_active=eq.true&order=order_index.asc`
**Description**: Fetch all active categories for product selection
**Response:**
```json
[{
  "id": "uuid",
  "name": "Electronics",
  "name_ar": "إلكترونيات",
  "description": "Electronics and gadgets",
  "icon": "📱",
  "order": 1,
  "is_active": true
}]
```

### Cities API

#### GET `/rest/v1/cities?is_active=eq.true&order=order_index.asc`
**Description**: Fetch all cities for location selection
**Response:**
```json
[{
  "id": "uuid",
  "name": "Nouakchott",
  "name_ar": "نواكشوط",
  "region": "Nouakchott",
  "region_ar": "نواكشوط",
  "is_active": true,
  "order_index": 1
}]
```

### Subscription APIs

#### GET `/rest/v1/subscription_history?vendor_id=eq.{vendorId}&order=created_at.desc`
**Description**: Fetch subscription history
**Headers:**
```
Authorization: Bearer {jwt_token}
```
**Response:**
```json
[{
  "id": "uuid",
  "vendor_id": "uuid",
  "plan_type": "monthly",
  "amount": 5000.00,
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-02-01T00:00:00Z",
  "status": "active",
  "created_at": "2025-01-01T10:00:00Z"
}]
```

### Referrals APIs

#### GET `/rest/v1/referrals?referrer_id=eq.{vendorId}`
**Description**: Fetch referral records where vendor is referrer
**Headers:**
```
Authorization: Bearer {jwt_token}
```
**Response:**
```json
[{
  "id": "uuid",
  "referrer_id": "uuid",
  "referred_vendor_id": "uuid",
  "referred_customer_email": null,
  "referral_code": "ABC12345",
  "commission_earned": 1000.00,
  "status": "pending",
  "created_at": "2025-01-15T10:00:00Z"
}]
```

### Storage APIs

#### POST `/storage/v1/object/product-images/{vendorId}/{filename}`
**Description**: Upload product image
**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: image/jpeg
```
**Request Body:** Binary image data
**Response:**
```json
{
  "Key": "product-images/vendor-uuid/product-image.jpg",
  "path": "vendor-uuid/product-image.jpg"
}
```

#### GET `/storage/v1/object/public/product-images/{vendorId}/{filename}`
**Description**: Retrieve product image (public URL)
**Response:** Image binary data

#### POST `/storage/v1/object/vendor-profiles/{vendorId}/logo.jpg`
**Description**: Upload vendor logo
**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: image/jpeg
```
**Request Body:** Binary image data
**Response:**
```json
{
  "Key": "vendor-profiles/vendor-uuid/logo.jpg",
  "path": "vendor-uuid/logo.jpg"
}
```

## Data Models

### Vendor Table Schema
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  business_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  city VARCHAR(100),
  address TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  referral_code VARCHAR(20) UNIQUE,
  total_sales NUMERIC(12,2) DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_referral_code ON vendors(referral_code);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);
```

### Store Profile Table Schema
```sql
CREATE TABLE store_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID UNIQUE NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  banner_url TEXT,
  description TEXT,
  social_links JSONB DEFAULT '{}',
  business_hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_store_profiles_vendor_id ON store_profiles(vendor_id);
```

### Products Table Schema
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(12,2),
  images TEXT[],
  city VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_city ON products(city);
```

### Subscription History Table Schema
```sql
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscription_vendor_id ON subscription_history(vendor_id);
CREATE INDEX idx_subscription_status ON subscription_history(status);
```

### Referrals Table Schema
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  referred_vendor_id UUID REFERENCES vendors(id),
  referred_customer_email VARCHAR(255),
  referral_code VARCHAR(20) NOT NULL,
  commission_earned NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
```

### TypeScript Interfaces

```typescript
// User Authentication
interface User {
  id: string;
  email: string;
  user_metadata: {
    user_type: 'vendor';
  };
}

interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Vendor Profile
interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string | null;
  address: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  referral_code: string | null;
  total_sales: number;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

// Store Profile
interface StoreProfile {
  id: string;
  vendor_id: string;
  banner_url: string | null;
  description: string | null;
  social_links: {
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
  };
  business_hours: {
    [key: string]: string;
  };
  created_at: string;
  updated_at: string;
}

// Product
interface Product {
  id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  name_ar: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  city: string | null;
  stock_quantity: number;
  is_active: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

// Category
interface Category {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  icon: string | null;
  order: number;
  is_active: boolean;
}

// City
interface City {
  id: string;
  name: string;
  name_ar: string;
  region: string | null;
  region_ar: string | null;
  is_active: boolean;
  order_index: number;
}

// Subscription
interface SubscriptionHistory {
  id: string;
  vendor_id: string;
  plan_type: string;
  amount: number;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
}

// Referral
interface Referral {
  id: string;
  referrer_id: string;
  referred_vendor_id: string | null;
  referred_customer_email: string | null;
  referral_code: string;
  commission_earned: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

// Dashboard Statistics
interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  totalSales: number;
  commissionEarned: number;
  pendingCommission: number;
  subscriptionStatus: 'active' | 'expired';
  daysUntilExpiry: number;
}
```

## Dependencies

### Core Dependencies
- **react**: ^19.1.1 - UI framework
- **react-dom**: ^19.1.1 - React DOM rendering
- **react-router-dom**: ^7.9.4 - Client-side routing
- **@supabase/supabase-js**: ^2.75.0 - Supabase client library
- **tailwindcss**: ^4.1.14 - Utility-first CSS framework
- **autoprefixer**: ^10.4.21 - CSS vendor prefixing
- **postcss**: ^8.5.6 - CSS transformation tool

### Capacitor Dependencies (for APK conversion)
- **@capacitor/core**: ^6.0.0 - Capacitor core framework
- **@capacitor/android**: ^6.0.0 - Android platform support
- **@capacitor/camera**: ^6.0.0 - Camera access for product photos
- **@capacitor/share**: ^6.0.0 - Native share functionality
- **@capacitor/push-notifications**: ^6.0.0 - Push notification support
- **@capacitor/network**: ^6.0.0 - Network status monitoring
- **@capacitor/splash-screen**: ^6.0.0 - Splash screen management
- **@capacitor/status-bar**: ^6.0.0 - Status bar customization

### UI Component Libraries
- **react-hook-form**: ^7.50.0 - Form state management and validation
- **@hookform/resolvers**: ^3.3.4 - Form validation resolvers
- **zod**: ^3.22.4 - TypeScript-first schema validation
- **lucide-react**: ^0.344.0 - Icon library for React
- **react-hot-toast**: ^2.4.1 - Toast notifications
- **date-fns**: ^3.3.0 - Date manipulation and formatting

### PWA Dependencies
- **workbox-window**: ^7.0.0 - Service worker management
- **workbox-precaching**: ^7.0.0 - Asset precaching
- **workbox-routing**: ^7.0.0 - Request routing
- **workbox-strategies**: ^7.0.0 - Caching strategies

### Development Dependencies
- **@types/react**: ^19.1.16 - TypeScript types for React
- **@types/react-dom**: ^19.1.9 - TypeScript types for React DOM
- **@types/node**: ^24.6.0 - Node.js type definitions
- **@vitejs/plugin-react**: ^5.0.4 - Vite React plugin
- **vite**: ^7.1.7 - Build tool
- **typescript**: ~5.9.3 - TypeScript compiler
- **eslint**: ^9.36.0 - JavaScript/TypeScript linter
- **vite-plugin-pwa**: ^0.19.0 - PWA plugin for Vite
- **@capacitor/cli**: ^6.0.0 - Capacitor CLI tools

### External Services
- **Supabase** - Backend as a Service (PostgreSQL database, authentication, storage)
- **WhatsApp Business API** - For product sharing and referral code distribution (web.whatsapp.com links)

## CI/CD Notes

### Development Environment Variables
```env
VITE_SUPABASE_URL=https://wmnugqjjizsgusbeqyyt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_NAME=Rimmarsa Vendor
VITE_APP_VERSION=1.0.0
```

### Build Pipeline Requirements

#### Stage 1: Install Dependencies
```bash
npm ci
```

#### Stage 2: Type Check
```bash
npm run type-check
```

#### Stage 3: Lint
```bash
npm run lint
```

#### Stage 4: Build Web Version
```bash
npm run build
```
**Output:** `/dist` directory containing optimized web assets

#### Stage 5: Build Android APK
```bash
# Sync web assets to Android project
npx cap sync android

# Build APK (requires Android SDK)
cd android
./gradlew assembleDebug  # For development
./gradlew assembleRelease  # For production

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

#### Stage 6: Code Signing (Production Only)
```bash
# Sign APK with release keystore
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore rimmarsa-vendor.keystore \
  app-release-unsigned.apk rimmarsa-vendor

# Optimize APK
zipalign -v 4 app-release-unsigned.apk rimmarsa-vendor-app.apk
```

### Environment-Specific Configuration

#### Development
- Hot module replacement enabled
- Source maps enabled
- Debug logging enabled
- Local Supabase instance optional

#### Staging
- Minified build
- Source maps enabled
- Staging Supabase project
- Test push notifications

#### Production
- Minified and optimized build
- Source maps disabled (or separate file)
- Production Supabase project
- Error tracking enabled (Sentry)
- Analytics enabled

### Deployment Steps

#### Web Deployment (Vercel/Netlify)
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Configure build command: `npm run build`
4. Set output directory: `dist`
5. Deploy on push to `main` branch

#### APK Distribution
1. Build signed release APK
2. Upload to Google Play Console (internal testing)
3. Complete store listing (screenshots, description)
4. Submit for review
5. Gradual rollout to production

### Rollback Procedures

#### Web Application
1. Identify last known good deployment
2. Revert Git commit: `git revert HEAD`
3. Push to trigger new deployment
4. Verify functionality in production

#### Mobile APK
1. Identify last stable APK version
2. Promote previous version in Play Console
3. Notify users to update via push notification
4. Monitor crash reports and user feedback

### Pre-Flight Checklist

- [ ] Environment variables configured correctly
- [ ] Supabase connection tested
- [ ] Authentication flow tested (login, logout, password reset)
- [ ] Product CRUD operations tested
- [ ] Image upload tested (camera and gallery)
- [ ] Offline mode tested (view cached data)
- [ ] RTL layout verified for Arabic content
- [ ] Push notification registration tested
- [ ] Referral share functionality tested
- [ ] Subscription status calculation verified
- [ ] Error handling tested (network errors, API errors)
- [ ] Loading states verified for all async operations
- [ ] Form validation tested (all required fields)
- [ ] APK builds successfully
- [ ] APK runs on physical Android device
- [ ] No console errors or warnings
- [ ] Performance metrics acceptable (Lighthouse score > 90)

## Architecture & Quality Assurance

### High-Level Architecture

#### Application Layers
1. **Presentation Layer** - React components with Tailwind CSS
2. **State Management Layer** - React Context + Local Storage for offline support
3. **Business Logic Layer** - Custom hooks and utility functions
4. **Data Access Layer** - Supabase client with RLS enforcement
5. **Native Bridge Layer** - Capacitor plugins for device features

#### Component Structure
```
src/
├── components/
│   ├── auth/               # Authentication components
│   ├── dashboard/          # Dashboard widgets
│   ├── products/           # Product management components
│   ├── profile/            # Store profile components
│   ├── referrals/          # Referral system components
│   ├── subscriptions/      # Subscription components
│   ├── layout/             # Layout components (header, nav, footer)
│   └── ui/                 # Reusable UI components (button, input, modal)
├── pages/                  # Page components (route handlers)
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
├── contexts/               # React Context providers
├── types/                  # TypeScript type definitions
└── assets/                 # Static assets (images, icons)
```

### Design Patterns

#### Authentication Pattern
- JWT token stored in Supabase client (automatically handled)
- Protected routes using React Router guards
- Automatic token refresh on expiry
- Logout clears all local state

#### Offline-First Pattern
- Service Worker caches critical assets
- IndexedDB stores product data for offline viewing
- Network-first strategy for API calls with cache fallback
- Queue failed mutations for retry when online

#### Image Upload Pattern
1. Capture/select image using Capacitor Camera plugin
2. Compress image client-side (max 1MB per image)
3. Upload to Supabase Storage with vendor-specific path
4. Store public URL in product record
5. Display optimized thumbnails in product list

### Security Considerations

#### Authentication & Authorization
- Supabase Row Level Security (RLS) enforces vendor data isolation
- Vendors can only access their own products, profiles, and referrals
- No direct admin access from mobile app
- Password reset requires email verification

#### Data Protection
- All API communication over HTTPS
- No sensitive data stored in localStorage (only JWT tokens)
- Image uploads validated for file type and size
- SQL injection prevented by Supabase parameterized queries

#### Code Security
- Input sanitization for all user inputs
- XSS prevention through React's built-in escaping
- CSRF protection not needed (JWT-based auth)
- No eval() or dangerouslySetInnerHTML usage

### Testing Requirements

#### Unit Tests (Minimum 70% Coverage)
- Test all custom hooks (useAuth, useProducts, useSubscription)
- Test utility functions (date formatting, price formatting, validation)
- Test form validation schemas (Zod schemas)
- Test component rendering (React Testing Library)

#### Integration Tests
- Test authentication flow (login → dashboard → logout)
- Test product creation flow (form → validation → upload → save)
- Test image upload flow (camera → compress → upload → display)
- Test referral share flow (fetch code → share via WhatsApp)

#### End-to-End Tests (Critical Paths)
- Complete product creation workflow
- Store profile update workflow
- Subscription renewal reminder workflow
- Referral code sharing workflow

#### Manual Testing Scenarios
- Test on real Android device (not just emulator)
- Test camera functionality on physical device
- Test offline mode (disable network, verify cached data loads)
- Test RTL layout with Arabic language preference
- Test various screen sizes (small phone to tablet)
- Test low network speed scenarios
- Test background/foreground app transitions

### Error Handling Strategy

#### Network Errors
- Display user-friendly error messages
- Retry failed requests with exponential backoff
- Queue mutations for offline retry
- Show offline indicator in UI

#### API Errors
- Parse Supabase error codes and display meaningful messages
- Handle authentication errors (redirect to login)
- Handle permission errors (show "access denied" message)
- Log errors to Sentry for debugging

#### Validation Errors
- Client-side validation before API call
- Display field-level error messages
- Highlight invalid fields in red
- Prevent form submission until valid

#### Graceful Degradation
- If camera unavailable, allow gallery upload only
- If geolocation unavailable, require manual city selection
- If push notifications denied, show in-app notifications
- If offline, disable write operations but allow viewing

### Logging & Monitoring

#### Application Logging
- Log authentication events (login, logout, session expiry)
- Log critical errors (API failures, upload failures)
- Log user actions (product created, profile updated)
- Send logs to Sentry in production

#### Performance Monitoring
- Track page load times
- Track API response times
- Track image upload times
- Monitor memory usage and detect leaks

#### Analytics Events
- Track screen views (dashboard, products, profile)
- Track user actions (product created, referral shared)
- Track errors and crashes
- Track feature usage (camera vs gallery)

## Risk Assessment

### High Risk: Supabase Storage Quota Exceeded

**Impact**: Vendors unable to upload product images, blocking core functionality

**Likelihood**: Medium (depends on usage growth and storage plan limits)

**Mitigation Strategies**:
1. Implement client-side image compression before upload (reduce to max 1MB per image)
2. Set up storage quota monitoring alerts in Supabase dashboard
3. Upgrade Supabase plan proactively when reaching 80% quota
4. Implement image cleanup job to delete images from deleted products

**Detection**: Monitor Supabase storage usage via dashboard API, alert at 80% threshold

**Owner**: DevOps Team

---

### High Risk: Offline Data Sync Conflicts

**Impact**: Vendor makes changes offline, conflicts with server data when coming online

**Likelihood**: Medium (common in mobile apps with offline support)

**Mitigation Strategies**:
1. Implement "last write wins" strategy for most fields
2. For critical fields (price, stock), require online connection
3. Show conflict resolution UI when detected
4. Queue offline mutations with timestamps for conflict detection

**Detection**: Compare local and server timestamps when syncing, flag mismatches

**Owner**: Frontend Team

---

### Medium Risk: Capacitor Plugin Compatibility Issues

**Impact**: Native features (camera, share) may not work on all Android versions

**Likelihood**: Low (Capacitor supports Android 5.0+)

**Mitigation Strategies**:
1. Test on multiple Android versions (5.0, 7.0, 10.0, 13.0)
2. Implement feature detection and fallbacks (gallery if camera unavailable)
3. Document minimum Android version requirements clearly
4. Provide alternative upload methods (file picker)

**Detection**: Test on physical devices with different Android versions, monitor crash reports

**Owner**: Mobile Development Team

---

### Medium Risk: RTL Layout Issues with UI Components

**Impact**: UI elements misaligned or text direction incorrect for Arabic

**Likelihood**: Medium (RTL support can be tricky with custom components)

**Mitigation Strategies**:
1. Use Tailwind's RTL variants consistently (`rtl:ml-2` instead of `ml-2`)
2. Test all pages with Arabic language enabled
3. Use logical properties (`start`/`end` instead of `left`/`right`)
4. Conduct UAT with Arabic-speaking users

**Detection**: Visual QA with Arabic language preference, user feedback

**Owner**: Frontend Team

---

### Low Risk: Push Notification Permission Denied

**Impact**: Vendors miss important subscription renewal reminders

**Likelihood**: High (many users deny push permissions)

**Mitigation Strategies**:
1. Implement in-app notification fallback (banner in dashboard)
2. Send email notifications as backup
3. Show notification permission rationale before requesting
4. Allow re-requesting permission from settings page

**Detection**: Track permission grant rate in analytics

**Owner**: Product Team

---

### Low Risk: WhatsApp Web API Rate Limiting

**Impact**: Referral code sharing via WhatsApp may fail temporarily

**Likelihood**: Low (WhatsApp web links rarely rate-limited)

**Mitigation Strategies**:
1. Provide copy-to-clipboard fallback if WhatsApp unavailable
2. Use native share sheet as alternative (shares to any app)
3. Display referral code prominently for manual sharing
4. Document WhatsApp sharing limits in help section

**Detection**: Monitor share action failures in analytics

**Owner**: Product Team

---

## Code Quality Standards

### SOLID Principles Application

**Single Responsibility Principle**
- Each component has one clear purpose (ProductCard displays product, ProductForm handles product creation)
- Each hook manages one piece of state (useAuth for authentication, useProducts for product data)
- Each utility function performs one transformation (formatPrice, formatDate)

**Open/Closed Principle**
- Components accept props for customization without modification
- Use composition over inheritance (Button component with variants via props)
- Extend functionality through new components, not by modifying existing ones

**Liskov Substitution Principle**
- All form inputs implement consistent interface (value, onChange, error props)
- All page components implement consistent layout structure
- All API hooks return consistent shape ({ data, error, loading, refetch })

**Interface Segregation Principle**
- Components receive only props they need (don't pass entire vendor object if only need vendor.name)
- Context providers expose focused APIs (AuthContext only exposes auth-related methods)
- Hooks return minimal necessary data (useProductStats returns stats only, not raw products)

**Dependency Inversion Principle**
- Components depend on abstractions (useSupabase hook) not concrete implementation
- API calls abstracted behind custom hooks (useProducts, useVendor)
- Storage operations abstracted behind storage service layer

### DRY (Don't Repeat Yourself)

**Reusable Components**
- Create Button, Input, Select, Modal components used throughout app
- Extract repeated layouts into Layout components
- Create ProductCard component used in grid and list views

**Custom Hooks**
- useAuth - Authentication state and methods
- useProducts - Product CRUD operations
- useImageUpload - Image upload logic with compression
- useOfflineSync - Offline sync queue management

**Utility Functions**
- formatPrice(amount) - Format currency consistently
- formatDate(date, locale) - Format dates with locale support
- compressImage(file, maxSizeMB) - Compress images before upload
- generateShareLink(code) - Generate WhatsApp share links

### KISS (Keep It Simple, Stupid)

**Component Simplicity**
- Avoid complex conditional rendering (extract to separate components)
- Limit component to 200 lines (split larger components)
- Maximum 3 levels of nesting in JSX
- Use early returns to reduce nesting

**State Management**
- Use React Context only for truly global state (auth, theme)
- Use local state for component-specific state
- Avoid Redux/MobX complexity (React Context + hooks sufficient)
- Lift state only when necessary (keep it local by default)

**Logic Simplicity**
- Avoid clever one-liners (prioritize readability)
- Break complex functions into smaller functions
- Use descriptive variable names (avoid abbreviations)
- Comment complex business logic (why, not what)

### Documentation Requirements

**Code Comments**
- JSDoc comments for all public functions
- Inline comments for complex business logic
- TODO comments with GitHub issue references
- No commented-out code (use version control)

**Component Documentation**
- PropTypes or TypeScript interfaces for all props
- Example usage in Storybook (optional but recommended)
- README.md in feature directories explaining architecture

**API Documentation**
- OpenAPI/Swagger spec not applicable (using Supabase)
- Document custom API wrapper functions with JSDoc
- Document expected error responses

### Code Review Criteria

**Mandatory Checks**
- [ ] All TypeScript types defined (no `any` types)
- [ ] All async operations have error handling
- [ ] All forms have validation
- [ ] All API calls have loading states
- [ ] No console.log statements (use proper logging)
- [ ] No hardcoded strings (use constants or i18n)
- [ ] No security vulnerabilities (secrets in code, XSS risks)
- [ ] Passes ESLint with no warnings
- [ ] Passes TypeScript compiler with no errors

**Best Practices**
- [ ] Components are reasonably sized (< 200 lines)
- [ ] Functions are pure where possible
- [ ] Side effects are handled in useEffect
- [ ] Dependencies arrays are correct in hooks
- [ ] Accessibility attributes present (aria-label, role)
- [ ] Mobile-first responsive design
- [ ] RTL support implemented correctly

## Next Steps

1. **Review this specification** with product team and stakeholders
2. **Assign team roles** based on tasks.json breakdown
3. **Set up development environment** (Node.js, Android SDK, Supabase CLI)
4. **Create Git branch** for vendor mobile app development
5. **Initialize project structure** following component architecture
6. **Begin Sprint 1** focusing on authentication and core infrastructure
7. **Conduct daily standups** to track progress and blockers
8. **Schedule mid-sprint review** to validate approach and make adjustments
