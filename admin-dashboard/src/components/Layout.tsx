import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { path: '/vendor-requests', icon: FileText, label: 'طلبات البائعين' },
    { path: '/vendors', icon: Users, label: 'البائعون' },
    { path: '/products', icon: ShoppingBag, label: 'المنتجات' },
    { path: '/settings', icon: Settings, label: 'الإعدادات' },
  ]

  const handleLogout = () => {
    // TODO: Implement logout functionality
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full bg-gray-900 text-white transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-yellow-400">ريمارسا</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-yellow-500 text-black font-semibold'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-gray-800 text-gray-300 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'mr-64' : 'mr-20'
        }`}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {menuItems.find((item) => item.path === location.pathname)?.label ||
                'لوحة التحكم'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">المسؤول</p>
                <p className="text-xs text-gray-500">admin@rimmarsa.com</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-black">
                م
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
