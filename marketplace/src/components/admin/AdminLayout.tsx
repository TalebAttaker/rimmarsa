'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MapPin,
  Building2,
  UserPlus
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

const menuItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', href: '/fassalapremierprojectbsk/dashboard' },
  { icon: UserPlus, label: 'طلبات البائعين', href: '/fassalapremierprojectbsk/vendor-requests' },
  { icon: Users, label: 'البائعون', href: '/fassalapremierprojectbsk/vendors' },
  { icon: Package, label: 'المنتجات', href: '/fassalapremierprojectbsk/products' },
  { icon: Tags, label: 'التصنيفات', href: '/fassalapremierprojectbsk/categories' },
  { icon: MapPin, label: 'المناطق', href: '/fassalapremierprojectbsk/regions' },
  { icon: Building2, label: 'المدن', href: '/fassalapremierprojectbsk/cities' },
  { icon: DollarSign, label: 'الإحالات', href: '/fassalapremierprojectbsk/referrals' },
  { icon: Settings, label: 'الإعدادات', href: '/fassalapremierprojectbsk/settings' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('admin')
    localStorage.removeItem('loginTime')
    router.push('/fassalapremierprojectbsk/login')
  }

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
              <span className="text-black font-bold text-xl">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                ريمارسا
              </h1>
              <p className="text-xs text-gray-400">لوحة الإدارة</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
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
                  {isActive && <ChevronRight className="w-4 h-4 mr-auto rotate-180" />}
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

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-yellow-400">المسؤول الرئيسي</p>
                <p className="text-xs text-gray-400">مدير النظام</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center font-bold text-black shadow-lg shadow-yellow-500/50">
                SA
              </div>
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
