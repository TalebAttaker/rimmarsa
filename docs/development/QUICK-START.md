# Rimmarsa Quick Start Guide

Get up and running with Rimmarsa development in 15 minutes.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 8.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

### Required Accounts

You'll need accounts for these services:

1. **Supabase** - Database and authentication ([Sign up](https://supabase.com))
2. **Cloudflare** - R2 object storage ([Sign up](https://cloudflare.com))
3. **Vercel** (optional) - For deployment ([Sign up](https://vercel.com))

---

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/TalebAttaker/rimmarsa.git

# Navigate to the project
cd rimmarsa
```

---

## Step 2: Set Up the Web Marketplace

### Install Dependencies

```bash
cd marketplace
npm install
```

### Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=rimmarsa-assets
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select existing one
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Get Cloudflare R2 Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** → **Create Bucket**
3. Create bucket named `rimmarsa-assets`
4. Go to **Manage R2 API Tokens** → **Create API Token**
5. Copy:
   - **Account ID** → `R2_ACCOUNT_ID`
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
6. Enable public access on bucket and note the public URL

---

## Step 3: Set Up the Database

### Run Supabase Migrations

```bash
# Make sure you're in the marketplace directory
cd marketplace

# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Alternatively, you can manually run the SQL migrations:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Navigate to `/supabase/migrations/` in the repo
3. Copy and execute each migration file in chronological order

### Create Admin User

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
  'admin@rimmarsa.com',
  '$2a$10$rKZexamplehashhere',  -- Use bcrypt to hash your password
  'Admin User',
  'admin'
);
```

To generate a bcrypt hash:

```bash
# Install bcrypt tool
npm install -g bcrypt-cli

# Generate hash
bcrypt-cli "your-password-here" 10
```

---

## Step 4: Run the Development Server

```bash
# Make sure you're in the marketplace directory
cd marketplace

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the Rimmarsa marketplace homepage!

---

## Step 5: Verify Everything Works

### Test Public Pages

- **Homepage:** http://localhost:3000
- **Vendors:** http://localhost:3000/vendors
- **Vendor Registration:** http://localhost:3000/vendor-registration
- **Download Page:** http://localhost:3000/download

### Test Admin Dashboard

1. Navigate to http://localhost:3000/admin
2. Login with admin credentials you created
3. Verify you can see vendors and products

### Test Vendor Registration

1. Go to http://localhost:3000/vendor-registration
2. Fill out the form
3. Submit and verify vendor appears in admin dashboard (unapproved)

---

## Step 6: Mobile App Setup (Optional)

If you want to work on the mobile vendor app:

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
nano .env
```

Add to `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Run on Expo Go

```bash
# Start Expo development server
npx expo start
```

Scan the QR code with:
- **iOS:** Camera app → Opens in Expo Go
- **Android:** Expo Go app → Scan QR code

---

## Common Issues & Solutions

### Issue: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Supabase connection fails

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active and not paused
- Ensure RLS policies are set up correctly

### Issue: R2 upload fails

**Solution:**
- Verify R2 credentials are correct
- Ensure bucket name matches exactly
- Check bucket has public access enabled (if serving public files)
- Verify CORS settings on R2 bucket

### Issue: Port 3000 already in use

**Solution:**
```bash
# Use a different port
npm run dev -- -p 3001

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: Environment variables not loading

**Solution:**
- Make sure file is named `.env.local` (not `.env`)
- Restart the dev server after changing env vars
- Variables starting with `NEXT_PUBLIC_` are exposed to browser
- Server-only variables (R2 credentials) should NOT have `NEXT_PUBLIC_` prefix

---

## Project Structure Overview

```
rimmarsa/
├── marketplace/          # Main Next.js application
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities and helpers
│   ├── public/          # Static assets
│   └── package.json
├── mobile-app/          # React Native vendor app
├── admin-dashboard/     # Admin panel (standalone)
├── vendor-dashboard/    # Vendor panel (standalone)
├── supabase/           # Database migrations
└── docs/               # Documentation
```

---

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the appropriate directory

3. **Test locally:**
   ```bash
   npm run dev
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: Add your feature description"
   ```

5. **Push to GitHub:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

- Follow existing code patterns
- Use TypeScript for type safety
- Format code with Prettier (automatic in VS Code)
- See [CODE-STANDARDS.md](./CODE-STANDARDS.md) for detailed guidelines

---

## Useful Commands

### Marketplace (Next.js)

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Mobile App (React Native/Expo)

```bash
# Start Expo dev server
npx expo start

# Start on Android
npx expo start --android

# Start on iOS
npx expo start --ios

# Build APK
npm run build
```

### Database (Supabase)

```bash
# Link to project
supabase link --project-ref your-ref

# Push migrations
supabase db push

# Create new migration
supabase migration new migration_name

# Generate TypeScript types
supabase gen types typescript --local > types/database.ts
```

---

## Next Steps

1. **Explore the codebase:**
   - Review `/docs/architecture/CURRENT-STATE.md` for system overview
   - Check `/docs/architecture/SPECIFICATION.md` for detailed specs

2. **Review security guidelines:**
   - See `/docs/security/` for security best practices
   - Review RLS policies in Supabase dashboard

3. **Set up deployment:**
   - Connect GitHub repo to Vercel
   - Configure environment variables in Vercel dashboard
   - See `/docs/deployment/` for deployment guides

4. **Join development:**
   - Check `/docs/development/CODE-STANDARDS.md` for coding guidelines
   - Review open issues and tasks in `tasks.json`

---

## Getting Help

- **Documentation:** Check `/docs/` directory for comprehensive guides
- **Issues:** Review common issues in this guide
- **GitHub Issues:** Create an issue for bugs or feature requests
- **Architecture Questions:** See `/docs/architecture/CURRENT-STATE.md`

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

---

**Happy coding!** If you encounter any issues not covered here, please create an issue on GitHub or check the full documentation in `/docs/`.
