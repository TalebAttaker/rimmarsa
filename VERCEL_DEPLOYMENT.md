# Vercel Deployment Guide - Rimmarsa Marketplace

## 🚀 Quick Deploy to Vercel

### Step 1: Import from GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose the **rimmarsa** repository
5. Select the **marketplace** directory as the root

### Step 2: Configure Project

**Framework Preset:** Next.js
**Root Directory:** `marketplace`
**Build Command:** `npm run build` (auto-detected)
**Output Directory:** `.next` (auto-detected)

### Step 3: Environment Variables

Add these environment variables in the Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://rfyqzuuuumgdoomyhqcu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjUyOTUsImV4cCI6MjA3NjEwMTI5NX0.2rmHzJEXD6bSG0vZGn7bQ0lq-jP3YvB9w_cDgPkqaR0
```

**Important:** Only add the `NEXT_PUBLIC_*` variables to Vercel. Never add the `SUPABASE_SERVICE_ROLE_KEY` to Vercel (server-side only).

### Step 4: Deploy

Click **"Deploy"** and Vercel will:
- Install dependencies
- Build the Next.js app
- Deploy to a production URL
- Set up automatic deployments for future pushes

---

## 🔧 Vercel Configuration

The project includes `vercel.json` with:

✅ **Security Headers:**
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy (CSP)

✅ **Region:** Frankfurt (fra1) for optimal performance

✅ **Function Timeout:** 30 seconds for API routes

---

## 📝 Automatic Deployments

Once connected, Vercel will automatically deploy:
- **Production:** Every push to `main` branch
- **Preview:** Every pull request

---

## 🌐 Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `rimmarsa.com`)
3. Update DNS records as instructed by Vercel
4. SSL certificate will be automatically provisioned

---

## 🔍 Post-Deployment Checklist

- [ ] Test the deployed URL
- [ ] Verify Supabase connection works
- [ ] Check product listings load correctly
- [ ] Test vendor profiles
- [ ] Verify WhatsApp integration
- [ ] Test on mobile devices
- [ ] Check browser console for errors
- [ ] Verify all images load properly

---

## 🐛 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify environment variables are set correctly
- Check build logs in Vercel dashboard

### Supabase Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Ensure RLS policies allow public access to necessary tables

### Images Not Loading
- Check Supabase storage bucket permissions
- Verify image URLs are accessible
- Check Content-Security-Policy allows image sources

---

## 📊 Performance Optimization

The marketplace is configured with:
- ✅ Server-Side Rendering (SSR)
- ✅ Image Optimization via Next.js
- ✅ Static page generation where possible
- ✅ CDN distribution via Vercel Edge Network

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **GitHub Repository:** https://github.com/taharou7-max/rimmarsa
- **Vercel Docs:** https://vercel.com/docs

---

## 👥 Team Access

To add team members to Vercel:
1. Go to Project Settings → Team
2. Invite members by email
3. Set appropriate role (Viewer/Member/Owner)

---

**Deployment Time:** ~2-3 minutes
**Automatic Re-deploys:** Every git push to main branch
