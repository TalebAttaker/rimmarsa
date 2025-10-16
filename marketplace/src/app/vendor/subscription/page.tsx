'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import VendorLayout from '@/components/vendor/VendorLayout'
import { motion } from 'framer-motion'
import { Calendar, CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Subscription {
  id: string
  plan_type: string
  amount: number
  start_date: string
  end_date: string
  status: string
  created_at: string
}

export default function VendorSubscriptionPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  useEffect(() => {
    const storedVendor = localStorage.getItem('vendor')
    if (!storedVendor) {
      router.push('/vendor/login')
      return
    }

    const vendor = JSON.parse(storedVendor)
    fetchSubscription(vendor.id)
  }, [router])

  const fetchSubscription = async (vendorId: string) => {
    try {
      const supabase = createClient()

      // Get active subscription
      const { data: activeSub } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .order('end_date', { ascending: false })
        .limit(1)
        .single()

      if (activeSub) {
        setSubscription(activeSub)

        // Calculate days remaining
        const endDate = new Date(activeSub.end_date)
        const today = new Date()
        const days = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        setDaysRemaining(days)
      }

      // Get subscription history
      const { data: history } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })

      if (history) setSubscriptionHistory(history)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      toast.error('فشل في تحميل بيانات الاشتراك')
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
            <p className="text-yellow-400 font-medium">جاري تحميل الاشتراك...</p>
          </div>
        </div>
      </VendorLayout>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', icon: CheckCircle },
      expired: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: AlertCircle },
      cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', icon: AlertCircle }
    }

    const labels = {
      active: 'نشط',
      expired: 'منتهي',
      cancelled: 'ملغي'
    }

    const style = styles[status as keyof typeof styles] || styles.expired
    const Icon = style.icon

    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${style.bg} ${style.text} border ${style.border}`}>
        <Icon className="w-4 h-4" />
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <VendorLayout>
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
            اشتراكي
          </h1>
          <p className="text-gray-400 mt-2">تفاصيل اشتراكك وتاريخ الدفعات</p>
        </motion.div>

        {/* Warning if expiring soon */}
        {subscription && daysRemaining !== null && daysRemaining < 7 && daysRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-orange-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-orange-400 mb-2">اشتراكك قرب على الانتهاء!</h3>
                <p className="text-gray-300">
                  لديك {daysRemaining} يوم متبقي. تواصل مع الإدارة لتجديد اشتراكك.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Current Subscription */}
        {subscription ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-yellow-400">الاشتراك الحالي</h2>
              {getStatusBadge(subscription.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <p className="text-gray-400 text-sm">الخطة</p>
                </div>
                <p className="text-white font-bold text-xl">{subscription.plan_type}</p>
                <p className="text-yellow-400 text-sm mt-1">{subscription.amount} أوقية</p>
              </div>

              <div className="bg-gray-800/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <p className="text-gray-400 text-sm">تاريخ البداية</p>
                </div>
                <p className="text-white font-bold text-xl">
                  {new Date(subscription.start_date).toLocaleDateString('ar-MR')}
                </p>
              </div>

              <div className="bg-gray-800/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-red-400" />
                  <p className="text-gray-400 text-sm">تاريخ الانتهاء</p>
                </div>
                <p className="text-white font-bold text-xl">
                  {new Date(subscription.end_date).toLocaleDateString('ar-MR')}
                </p>
                {daysRemaining !== null && (
                  <p className={`text-sm mt-1 ${daysRemaining < 7 ? 'text-red-400' : 'text-green-400'}`}>
                    {daysRemaining > 0 ? `${daysRemaining} يوم متبقي` : 'منتهي'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-12 text-center"
          >
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-400 mb-2">لا يوجد اشتراك نشط</h3>
            <p className="text-gray-400">تواصل مع الإدارة لتفعيل اشتراكك</p>
          </motion.div>
        )}

        {/* Subscription History */}
        {subscriptionHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-4">تاريخ الاشتراكات</h2>

            <div className="space-y-4">
              {subscriptionHistory.map((sub, index) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors"
                >
                  <div>
                    <p className="text-white font-semibold mb-1">{sub.plan_type}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(sub.start_date).toLocaleDateString('ar-MR')} - {new Date(sub.end_date).toLocaleDateString('ar-MR')}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(sub.status)}
                    <p className="text-yellow-400 font-bold mt-2">{sub.amount} أوقية</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </VendorLayout>
  )
}
