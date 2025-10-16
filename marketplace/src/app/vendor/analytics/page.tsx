'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import VendorLayout from '@/components/vendor/VendorLayout'
import { motion } from 'framer-motion'
import { Eye, TrendingUp, Calendar, Users } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface ProfileStats {
  total_views: number
  today_views: number
  week_views: number
  month_views: number
}

export default function VendorAnalyticsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedVendor = localStorage.getItem('vendor')
    if (!storedVendor) {
      router.push('/vendor/login')
      return
    }

    const vendor = JSON.parse(storedVendor)
    fetchAnalytics(vendor.id)
  }, [router])

  const fetchAnalytics = async (vendorId: string) => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .rpc('get_vendor_profile_stats', { vendor_uuid: vendorId })

      if (error) throw error

      setStats(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('فشل في تحميل الإحصائيات')
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
            <p className="text-yellow-400 font-medium">جاري تحميل الإحصائيات...</p>
          </div>
        </div>
      </VendorLayout>
    )
  }

  const statCards = [
    {
      title: 'إجمالي الزيارات',
      value: stats?.total_views || 0,
      icon: Eye,
      gradient: 'from-blue-500 to-blue-600',
      description: 'منذ البداية'
    },
    {
      title: 'زيارات اليوم',
      value: stats?.today_views || 0,
      icon: TrendingUp,
      gradient: 'from-green-500 to-green-600',
      description: 'خلال آخر 24 ساعة'
    },
    {
      title: 'زيارات الأسبوع',
      value: stats?.week_views || 0,
      icon: Calendar,
      gradient: 'from-purple-500 to-purple-600',
      description: 'خلال آخر 7 أيام'
    },
    {
      title: 'زيارات الشهر',
      value: stats?.month_views || 0,
      icon: Users,
      gradient: 'from-yellow-500 to-yellow-600',
      description: 'خلال آخر 30 يوم'
    },
  ]

  return (
    <VendorLayout>
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">
            الإحصائيات والتحليلات
          </h1>
          <p className="text-gray-400 mt-2">تابع أداء متجرك وزيارات ملفك الشخصي</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-400 text-sm mb-1">{card.title}</h3>
                <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                <p className="text-xs text-gray-500">{card.description}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-yellow-400 mb-4">حول الإحصائيات</h2>
          <div className="space-y-3 text-gray-300">
            <p className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>يتم احتساب الزيارات عندما يقوم شخص ما بعرض ملفك الشخصي أو منتجاتك</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>الإحصائيات يتم تحديثها في الوقت الفعلي</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>استخدم هذه البيانات لفهم مدى تفاعل العملاء مع منتجاتك</span>
            </p>
          </div>
        </motion.div>
      </div>
    </VendorLayout>
  )
}
