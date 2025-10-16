'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import VendorLayout from '@/components/vendor/VendorLayout'
import { motion } from 'framer-motion'
import {
  Package,
  Eye,
  Calendar,
  TrendingUp,
  AlertCircle,
  Plus,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

interface VendorStats {
  total_products: number
  active_products: number
  total_views: number
  today_views: number
  week_views: number
  subscription_end_date: string | null
  days_remaining: number | null
}

export default function VendorDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication
    const storedVendor = localStorage.getItem('vendor')
    const loginTime = localStorage.getItem('vendorLoginTime')

    if (!storedVendor || !loginTime) {
      router.push('/vendor/login')
      return
    }

    const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60)
    if (hoursSinceLogin > 24) {
      localStorage.removeItem('vendor')
      localStorage.removeItem('vendorLoginTime')
      router.push('/vendor/login')
      return
    }

    const vendor = JSON.parse(storedVendor)
    setVendorId(vendor.id)
    fetchDashboardData(vendor.id)
  }, [router])

  const fetchDashboardData = async (vendorId: string) => {
    try {
      const supabase = createClient()

      // Fetch products count
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)

      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .eq('is_active', true)

      // Fetch profile view stats
      const { data: viewStats, error: viewError } = await supabase
        .rpc('get_vendor_profile_stats', { vendor_uuid: vendorId })

      if (viewError) console.error('Error fetching view stats:', viewError)

      // Fetch subscription info
      const { data: subscription } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .order('end_date', { ascending: false })
        .limit(1)
        .single()

      let daysRemaining = null
      if (subscription && subscription.end_date) {
        const endDate = new Date(subscription.end_date)
        const today = new Date()
        daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }

      setStats({
        total_products: totalProducts || 0,
        active_products: activeProducts || 0,
        total_views: viewStats?.total_views || 0,
        today_views: viewStats?.today_views || 0,
        week_views: viewStats?.week_views || 0,
        subscription_end_date: subscription?.end_date || null,
        days_remaining: daysRemaining
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <VendorLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 font-medium">جاري تحميل لوحة التحكم...</p>
          </div>
        </div>
      </VendorLayout>
    )
  }

  const statCards = [
    {
      title: 'إجمالي المنتجات',
      value: stats?.total_products || 0,
      subtitle: `${stats?.active_products || 0} نشط`,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      link: '/vendor/products'
    },
    {
      title: 'زيارات الملف الشخصي',
      value: stats?.total_views || 0,
      subtitle: `${stats?.today_views || 0} اليوم`,
      icon: Eye,
      gradient: 'from-purple-500 to-purple-600',
      link: '/vendor/analytics'
    },
    {
      title: 'أيام الاشتراك المتبقية',
      value: stats?.days_remaining || 0,
      subtitle: stats?.subscription_end_date
        ? new Date(stats.subscription_end_date).toLocaleDateString('ar-MR')
        : 'لا يوجد اشتراك',
      icon: Calendar,
      gradient: stats && stats.days_remaining && stats.days_remaining < 7 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
      link: '/vendor/subscription'
    },
  ]

  return (
    <VendorLayout>
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-2">
                مرحباً بك!
              </h1>
              <p className="text-gray-400">إليك نظرة عامة على متجرك</p>
            </div>
            <TrendingUp className="w-16 h-16 text-yellow-400 opacity-50" />
          </div>
        </motion.div>

        {/* Subscription Warning */}
        {stats && stats.days_remaining !== null && stats.days_remaining < 7 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-red-400 mb-2">تنبيه: اشتراكك قرب على الانتهاء!</h3>
                <p className="text-gray-300">
                  لديك {stats.days_remaining} يوم متبقي في اشتراكك. قم بتجديد اشتراكك لتجنب توقف خدماتك.
                </p>
                <Link href="/vendor/subscription">
                  <button className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors">
                    تجديد الاشتراك
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={card.link}>
                  <div className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 transition-all group cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-gray-400 text-sm mb-1">{card.title}</h3>
                    <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-yellow-400 mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/vendor/products/add">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 hover:from-green-500/30 hover:to-green-600/30 rounded-xl border border-green-500/30 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">إضافة منتج جديد</span>
              </motion.button>
            </Link>
            <Link href="/vendor/analytics">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-400 hover:from-purple-500/30 hover:to-purple-600/30 rounded-xl border border-purple-500/30 transition-all"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-semibold">عرض الإحصائيات</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </VendorLayout>
  )
}
