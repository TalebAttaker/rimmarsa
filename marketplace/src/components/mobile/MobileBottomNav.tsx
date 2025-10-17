'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Home,
  Search,
  ShoppingBag,
  Store,
  User
} from 'lucide-react'

const navItems = [
  {
    href: '/',
    icon: Home,
    label: 'الرئيسية',
    activeColor: 'text-primary-600',
    bgColor: 'bg-primary-100'
  },
  {
    href: '/products',
    icon: Search,
    label: 'بحث',
    activeColor: 'text-primary-600',
    bgColor: 'bg-primary-100'
  },
  {
    href: '/vendors',
    icon: Store,
    label: 'المتاجر',
    activeColor: 'text-secondary-600',
    bgColor: 'bg-secondary-100'
  },
  {
    href: '/login',
    icon: User,
    label: 'حسابي',
    activeColor: 'text-gray-900',
    bgColor: 'bg-gray-100'
  }
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  // Don't show on vendor or admin pages
  if (pathname?.startsWith('/vendor') || pathname?.startsWith('/fassalapremierprojectbsk')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around px-2 py-2 safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
                          (item.href !== '/' && pathname?.startsWith(item.href))

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 py-2"
              >
                <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                  isActive ? item.bgColor : 'bg-transparent'
                }`}>
                  <Icon
                    className={`w-6 h-6 transition-colors duration-300 ${
                      isActive ? item.activeColor : 'text-gray-400'
                    }`}
                  />

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-2xl border-2 border-current"
                      style={{ borderColor: 'currentColor' }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>

                <span className={`text-xs font-medium transition-colors duration-300 ${
                  isActive ? item.activeColor : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
