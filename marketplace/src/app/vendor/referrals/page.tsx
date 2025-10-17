'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Users, Copy, CheckCircle, Gift, TrendingUp, Clock, Award } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import VendorLayout from '@/components/vendor/VendorLayout'

interface Vendor {
  id: string
  business_name: string
  promo_code: string | null
}

interface Referral {
  id: string
  referred_vendor_id: string
  referred_customer_email: string | null
  referral_code: string
  commission_earned: number
  status: string
  created_at: string
  referred_vendor?: {
    business_name: string
    email: string
    created_at: string
  }
}

interface ReferralStats {
  total: number
  completed: number
  pending: number
  totalCommission: number
}

export default function VendorReferralsPage() {
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    completed: 0,
    pending: 0,
    totalCommission: 0
  })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('يجب تسجيل الدخول أولاً')
        window.location.href = '/vendor/login'
        return
      }

      // Get vendor info
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, business_name, promo_code')
        .eq('id', user.id)
        .single()

      if (vendorError) throw vendorError

      setVendor(vendorData)

      // Get referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_vendor:vendors!referred_vendor_id(
            business_name,
            email,
            created_at
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (referralsError) throw referralsError

      setReferrals(referralsData || [])

      // Calculate stats
      const total = referralsData?.length || 0
      const completed = referralsData?.filter(r => r.status === 'completed').length || 0
      const pending = referralsData?.filter(r => r.status === 'pending').length || 0
      const totalCommission = referralsData?.reduce((sum, r) => sum + Number(r.commission_earned || 0), 0) || 0

      setStats({ total, completed, pending, totalCommission })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const copyPromoCode = () => {
    if (vendor?.promo_code) {
      navigator.clipboard.writeText(vendor.promo_code)
      setCopied(true)
      toast.success('تم نسخ رمز الترويج!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareReferralLink = () => {
    const referralUrl = `${window.location.origin}/vendor-registration?ref=${vendor?.promo_code}`
    navigator.clipboard.writeText(referralUrl)
    toast.success('تم نسخ رابط الإحالة!')
  }

  if (loading) {
    return (
      <VendorLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">جاري التحميل...</p>
          </div>
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">برنامج الإحالة</h1>
          <p className="text-gray-400">شارك رمزك الترويجي واكسب عمولات من كل بائع يسجل باستخدامه</p>
        </div>

        {/* Promo Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-3xl p-8 text-black relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-8 h-8" />
              <h2 className="text-2xl font-bold">رمزك الترويجي</h2>
            </div>

            {vendor?.promo_code ? (
              <>
                <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-6 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl font-bold tracking-wider">
                      {vendor.promo_code}
                    </div>
                    <button
                      onClick={copyPromoCode}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Copy className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={shareReferralLink}
                  className="w-full py-3 bg-black/20 hover:bg-black/30 backdrop-blur-xl rounded-xl font-semibold transition-colors"
                >
                  نسخ رابط الإحالة
                </button>
              </>
            ) : (
              <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-6">
                <p className="text-center">لم يتم إنشاء رمز ترويجي بعد</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400 text-sm">إجمالي الإحالات</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">مكتملة</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.completed}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm">قيد الانتظار</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.pending}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400 text-sm">العمولة المكتسبة</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalCommission.toLocaleString()} أوقية</div>
          </motion.div>
        </div>

        {/* Referrals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-yellow-500/20 overflow-hidden"
        >
          <div className="p-6 border-b border-yellow-500/20">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              البائعون المحالون
            </h3>
          </div>

          {referrals.length > 0 ? (
            <div className="divide-y divide-yellow-500/10">
              {referrals.map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-yellow-500/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-1">
                        {referral.referred_vendor?.business_name || 'بائع محال'}
                      </h4>
                      <p className="text-sm text-gray-400 mb-2">
                        {referral.referred_vendor?.email}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          تاريخ التسجيل: {new Date(referral.created_at).toLocaleDateString('ar-MR')}
                        </span>
                        <span className="flex items-center gap-1">
                          رمز الإحالة: <span className="font-mono text-yellow-400">{referral.referral_code}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          referral.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : referral.status === 'pending'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {referral.status === 'completed' ? 'مكتمل' : referral.status === 'pending' ? 'قيد الانتظار' : referral.status}
                      </span>
                      {referral.commission_earned > 0 && (
                        <span className="text-yellow-400 font-semibold">
                          +{Number(referral.commission_earned).toLocaleString()} أوقية
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">لا توجد إحالات بعد</p>
              <p className="text-gray-500 text-sm">
                شارك رمزك الترويجي مع البائعين الآخرين لتبدأ في كسب العمولات
              </p>
            </div>
          )}
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20"
        >
          <h3 className="text-xl font-bold text-white mb-4">كيف يعمل؟</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-gray-300">شارك رمزك الترويجي أو رابط الإحالة مع البائعين الآخرين</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-gray-300">عندما يسجل بائع جديد باستخدام رمزك، سيتم إضافته إلى قائمة إحالاتك</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-gray-300">اكسب عمولات من كل بائع محال ينضم إلى المنصة</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </VendorLayout>
  )
}
