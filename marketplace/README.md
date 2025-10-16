# Rimmarsa Marketplace

Next.js 14 public-facing marketplace for the Rimmarsa multi-vendor platform.

## Features

- **Homepage**: Hero section, category grid, recent products
- **Server-Side Rendering**: Fetches data from Supabase on the server
- **TypeScript**: Full type safety with database types
- **Responsive Design**: Mobile-first layout with Tailwind CSS
- **SEO Optimized**: Proper meta tags and semantic HTML

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase project set up

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the marketplace.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
marketplace/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── page.tsx        # Homepage
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/          # Reusable components
│   └── lib/                 # Utilities and configs
│       ├── supabase/        # Supabase client
│       │   ├── client.ts   # Browser client
│       │   └── server.ts   # Server client
│       ├── database.types.ts # Generated DB types
│       └── utils.ts         # Helper functions
├── public/                  # Static files
└── .env.local              # Environment variables
```

## Database Schema

The marketplace uses the following Supabase tables:

- `categories` - Product categories (English + Arabic)
- `products` - Product listings
- `vendors` - Vendor accounts
- `store_profiles` - Vendor store information
- `referrals` - Commission tracking
- `subscription_history` - Subscription audit trail

See `/docs/DATABASE.md` in the project root for full schema documentation.

## Features Implemented

✅ Homepage with hero section
✅ Categories grid
✅ Recent products display
✅ Vendor registration system with approval workflow
✅ Location filtering (regions and cities)
✅ Vendor profiles and product browsing
✅ Supabase integration with RLS policies
✅ TypeScript types
✅ Responsive design

## Features TODO

- [ ] Product listing page with filtering
- [ ] Product detail page
- [ ] Vendor profile page
- [ ] Search functionality
- [ ] WhatsApp integration
- [ ] Image optimization
- [ ] Caching strategy

## Development Notes

- Uses Server Components by default for better performance
- Database queries run on the server to keep keys secure
- RLS policies enforce data access rules
- Images are served from Supabase Storage (public buckets)

## Support

For questions or issues, contact the development team.
