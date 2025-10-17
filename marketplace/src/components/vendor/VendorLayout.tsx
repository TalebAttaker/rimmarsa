'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Plus,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  Calendar,
  Home,
  User,
  Gift
} from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface VendorLayoutProps {
  children: ReactNode
}

const menuItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', href: '/vendor/dashboard', mobileLabel: 'الرئيسية' },
  { icon: Package, label: 'منتجاتي', href: '/vendor/products', mobileLabel: 'المنتجات' },
  { icon: Plus, label: 'إضافة منتج', href: '/vendor/products/add', mobileLabel: 'إضافة' },
  { icon: BarChart3, label: 'الإحصائيات', href: '/vendor/analytics', mobileLabel: 'إحصائيات' },
  { icon: Gift, label: 'برنامج الإحالة', href: '/vendor/referrals', mobileLabel: 'الإحالات' },
  { icon: Calendar, label: 'اشتراكي', href: '/vendor/subscription', mobileLabel: 'اشتراكي' },
]

export default function VendorLayout({ children }: VendorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [vendorData, setVendorData] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vendor')
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  const handleLogout = () => {
    localStorage.removeItem('vendor')
    localStorage.removeItem('vendorLoginTime')
    router.push('/vendor/login')
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pb-20" dir="rtl">
        {/* Mobile Top Header */}
        <header className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-b border-yellow-500/20 z-50">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                <Store className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                  ريمارسا
                </h1>
                {vendorData && (
                  <p className="text-xs text-gray-400 truncate max-w-[150px]">{vendorData.business_name}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ x: 300 }}
                animate={{ x: 0 }}
                exit={{ x: 300 }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-gray-900 to-black border-r border-yellow-500/20 z-50 overflow-y-auto"
              >
                {/* Drawer Header */}
                <div className="p-4 border-b border-yellow-500/20 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-yellow-400">القائمة</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Vendor Info */}
                {vendorData && (
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                        <Store className="w-6 h-6 text-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{vendorData.business_name}</p>
                        <p className="text-xs text-gray-400 truncate">{vendorData.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                <nav className="p-4 space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <div
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                              : 'text-gray-400 hover:text-yellow-400 hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                      </Link>
                    )
                  })}

                  {/* Settings Item */}
                  <Link href="/vendor/settings" onClick={() => setMobileMenuOpen(false)}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        pathname === '/vendor/settings'
                          ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                          : 'text-gray-400 hover:text-yellow-400 hover:bg-white/5'
                      }`}
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">الإعدادات</span>
                    </div>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">تسجيل الخروج</span>
                  </button>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="pt-16 px-4 py-6">
          {children}
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-yellow-500/20 z-40">
          <div className="flex items-center justify-around py-2">
            {menuItems.slice(0, 5).map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                      isActive ? 'text-yellow-400' : 'text-gray-400'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-yellow-500/20' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{item.mobileLabel}</span>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    )
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black" dir="rtl">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: sidebarOpen ? 0 : 280 }}
        className="fixed right-0 top-0 h-full w-72 bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl border-l border-yellow-500/20 z-50"
      >
        {/* Logo */}
        <div className="p-6 border-b border-yellow-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/50">
              <Store className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                ريمارسا
              </h1>
              <p className="text-xs text-gray-400">لوحة البائع</p>
            </div>
          </div>
        </div>

        {/* Vendor Info */}
        {vendorData && (
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
              {vendorData.logo_url ? (
                <img
                  src={vendorData.logo_url}
                  alt={vendorData.business_name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                  <Store className="w-6 h-6 text-black" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{vendorData.business_name}</p>
                <p className="text-xs text-gray-400 truncate">{vendorData.owner_name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30 shadow-lg shadow-yellow-500/20'
                      : 'text-gray-400 hover:text-yellow-400 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-yellow-500/20">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'mr-72' : 'mr-0'}`}>
        {/* Top Bar */}
        <header className="bg-gray-900/50 backdrop-blur-xl border-b border-yellow-500/20 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="text-right">
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString('ar-MR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
