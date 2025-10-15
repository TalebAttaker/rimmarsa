# Deployment Guide

## Build Status
✅ **Production build successful** - Application is ready for deployment!

## Important Note About Node.js Version

The application requires **Node.js 20.19+ or 22.12+** for running the development server.

If you're using Node.js 18.x, you have two options:

### Option 1: Upgrade Node.js (Recommended)
```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or using n
npm install -g n
n 20
```

### Option 2: Deploy the Built Application
The production build is already complete and ready to deploy. You don't need to run the dev server locally.

## Quick Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /home/taleb/rimmarsa/vendor-dashboard
vercel
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd /home/taleb/rimmarsa/vendor-dashboard
netlify deploy --prod --dir=dist
```

### Deploy to Cloudflare Pages
1. Push code to GitHub
2. Connect to Cloudflare Pages
3. Set build command: `npm run build`
4. Set output directory: `dist`

## Environment Variables

Make sure to set these environment variables in your deployment platform:

```
VITE_SUPABASE_URL=https://rfyqzuuuumgdoomyhqcu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjUyOTUsImV4cCI6MjA3NjEwMTI5NX0.2rmHzJEXD6bSG0vZGn7bQ0lq-jP3YvB9w_cDgPkqaR0
```

## Testing Locally with Node.js 20+

If you've upgraded Node.js:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Production Build

The production build is already complete:
- Location: `dist/` directory
- Bundle size: 579KB (169KB gzipped)
- All files optimized and ready to serve

## Post-Deployment Checklist

1. ✅ Environment variables set
2. ✅ Database tables exist in Supabase
3. ✅ Supabase Auth enabled
4. ✅ Test login functionality
5. ✅ Test all CRUD operations
6. ✅ Verify mobile responsiveness
7. ✅ Check console for errors

## Troubleshooting

### Issue: Cannot login
- Check Supabase Auth is enabled
- Verify environment variables
- Check user exists in Supabase Auth
- Ensure user has corresponding vendor record with `user_id`

### Issue: Products not loading
- Check vendor ID matches
- Verify database permissions (RLS policies)
- Check network tab for API errors

### Issue: Images not displaying
- Verify image URLs are accessible
- Check CORS settings if using external images

## Support

For deployment issues:
1. Check build logs
2. Verify environment variables
3. Test with production build locally: `npm run preview`
4. Check browser console for errors

---

**Ready to go live!** 🚀
