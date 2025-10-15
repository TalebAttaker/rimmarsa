# Rimmarsa Vendor Dashboard

A modern, responsive vendor dashboard built with React, TypeScript, Tailwind CSS, and Supabase for the Rimmarsa marketplace.

## Features

- **Authentication**: Secure login using Supabase Auth
- **Dashboard**: Overview with sales statistics, active products, and commission tracking
- **Product Management**: Full CRUD operations for products with image support
- **Profile Management**: Update vendor business and contact information
- **Referral System**: Track referrals and earn commissions
- **Responsive Design**: Mobile-first approach that works on all devices
- **Modern UI**: Clean interface with Tailwind CSS and custom components

## Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v3
- **Backend**: Supabase (Auth + PostgreSQL)
- **Routing**: React Router v7
- **Form Management**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Badge.tsx
│   ├── Layout.tsx       # Main layout with sidebar
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── utils.ts         # Utility functions
│   └── database.types.ts # Database type definitions
├── pages/
│   ├── Login.tsx        # Login page
│   ├── Dashboard.tsx    # Home dashboard
│   ├── Products.tsx     # Products list
│   ├── ProductForm.tsx  # Add/Edit product
│   ├── Profile.tsx      # Vendor profile
│   └── Referrals.tsx    # Referral tracking
├── App.tsx              # Router configuration
├── main.tsx             # App entry point
└── index.css            # Global styles
```

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (recommended)
- npm or yarn
- Supabase account and project

### Installation

1. Navigate to the project directory:
```bash
cd /home/taleb/rimmarsa/vendor-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
The `.env` file should contain your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Authentication
- Vendors log in with email and password using Supabase Auth
- Protected routes redirect unauthenticated users to login
- Automatic session management and refresh

### Dashboard
- **Total Sales**: Display total sales revenue
- **Active Products**: Count of currently active products
- **Commission Earned**: Calculate commission based on sales
- **Subscription Status**: Show current subscription status
- **Recent Products**: List of most recently added products

### Product Management
- Add new products with images, pricing, and inventory
- Edit existing products
- Delete products with confirmation
- Search and filter products
- Support for Arabic names and descriptions
- Category selection
- Stock quantity tracking
- Active/inactive status toggle

### Profile Management
- Update business information
- Change contact details
- Upload logo URL
- View verification and active status
- Update address and location

### Referral System
- Display unique referral code
- Copy referral code and link to clipboard
- Track total referrals and commissions
- View referral history with status

## Database Schema

The application uses the following main tables:

- **vendors**: Store vendor information and status
- **products**: Product catalog with images and pricing
- **categories**: Product categories
- **subscription_history**: Subscription tracking
- **referrals**: Referral program tracking

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## UI Components

The dashboard includes reusable UI components:

- **Button**: Multiple variants (default, destructive, outline, secondary, ghost, link)
- **Input**: Form input with label and error message support
- **Card**: Container components (Card, CardHeader, CardTitle, CardContent, CardFooter)
- **Badge**: Status indicators with variants (success, warning, destructive, etc.)

## Authentication Flow

1. Vendor enters email and password on login page
2. Supabase Auth validates credentials
3. On success, fetch vendor record from `vendors` table using `user_id`
4. Store vendor info in AuthContext
5. Redirect to dashboard
6. Protected routes check authentication status

## Contributing

This is an MVP (Minimum Viable Product). To extend functionality:

1. Add order management
2. Implement real-time notifications
3. Add analytics and reporting
4. Integrate payment processing
5. Add image upload to Supabase Storage
6. Implement advanced filtering and search

## License

Private - Rimmarsa Marketplace

## Support

For questions or issues, contact the development team.
