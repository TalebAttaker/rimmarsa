# Rimmarsa - Multi-Vendor E-Commerce Platform

A complete e-commerce ecosystem with public marketplace, vendor management, and referral system.

**GitHub Repository:** https://github.com/TalebAttaker/rimmarsa

## 🏗️ Project Structure

```
rimmarsa/
├── backend/              # Node.js + Express + TypeScript + Prisma
├── marketplace/          # Next.js 14 public marketplace
├── admin-dashboard/      # React admin panel
├── vendor-dashboard/     # React vendor panel
├── mobile-app/          # React Native (future)
└── docs/                # Documentation
```

## 🎯 Features

- **Multi-Vendor Marketplace** with category filtering
- **Referral System** - 20% commission + 20% discount
- **Admin Dashboard** - Complete vendor & product management
- **Vendor Dashboard** - Product management + referral tracking
- **WhatsApp Integration** - Direct contact with vendors
- **Secure Authentication** - JWT with refresh tokens
- **File Upload** - Cloudinary/S3 integration

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- Redis (caching)
- Multer + Cloudinary

### Frontend (Marketplace)
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (state)
- React Hook Form + Zod

### Dashboards
- React 18 + Vite
- TypeScript
- shadcn/ui + Radix UI
- TanStack Table
- Recharts

## 📦 Getting Started

See individual README files in each directory for setup instructions.

## 🔐 Environment Variables

Required environment variables are documented in `.env.example` files in each directory.

## 📄 License

All rights reserved.
