'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Users, Copy, CheckCircle, Gift, TrendingUp, Download, Award, Share2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import VendorLayout from '@/components/vendor/VendorLayout'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Vendor {
  id: string
  business_name: string
  promo_code: string | null
}

interface ReferredUser {
  id: string
  full_name: string
  phone: string
  created_at: string
}

interface ReferralStats {
  total: number
  thisMonth: number
}

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: Record<string, unknown>) => void
}

export default function VendorReferralsPage() {
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    thisMonth: 0
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

      // Get vendor info - FIX: use user_id instead of id
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, business_name, promo_code')
        .eq('user_id', user.id)
        .single()

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError)
        toast.error('فشل في تحميل بيانات البائع')
        setLoading(false)
        return
      }

      setVendor(vendorData)

      // Get referred users - vendors who registered with this vendor's promo code
      if (vendorData.promo_code) {
        const { data: referralsData, error: referralsError } = await supabase
          .from('vendors')
          .select('id, business_name, owner_name, phone, created_at')
          .eq('referral_code', vendorData.promo_code)
          .order('created_at', { ascending: false })

        if (referralsError) {
          console.error('Error fetching referrals:', referralsError)
        } else {
          const users = (referralsData || []).map(v => ({
            id: v.id,
            full_name: v.business_name || v.owner_name || 'غير متوفر',
            phone: v.phone || 'غير متوفر',
            created_at: v.created_at
          }))

          setReferredUsers(users)

          // Calculate stats
          const total = users.length
          const thisMonth = users.filter(u => {
            const date = new Date(u.created_at)
            const now = new Date()
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
          }).length

          setStats({ total, thisMonth })
        }
      }
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

  const shareReferralLink = async () => {
    if (!vendor?.promo_code) return

    const shareText = `انضم إلى ريمارسا باستخدام كود الإحالة الخاص بي: ${vendor.promo_code}\n\nاحصل على مزايا حصرية!\n\nhttps://www.rimmarsa.com/vendor-registration?ref=${vendor.promo_code}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'كود الإحالة - ريمارسا',
          text: shareText
        })
        toast.success('تم المشاركة بنجاح!')
      } catch {
        // User cancelled or error occurred
        copyPromoCode()
      }
    } else {
      copyPromoCode()
    }
  }

  const downloadPDF = () => {
    if (referredUsers.length === 0) {
      toast.error('لا يوجد مستخدمون لتحميلهم')
      return
    }

    try {
      const doc = new jsPDF()

      // Title
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(20)
      doc.text('Referral Report - Rimmarsa', 105, 20, { align: 'center' })

      doc.setFontSize(12)
      doc.text(`Vendor: ${vendor?.business_name || ''}`, 105, 30, { align: 'center' })
      doc.text(`Promo Code: ${vendor?.promo_code || ''}`, 105, 38, { align: 'center' })
      doc.text(`Total Referrals: ${referredUsers.length}`, 105, 46, { align: 'center' })
      doc.text(`Date: ${new Date().toLocaleDateString('ar-MR')}`, 105, 54, { align: 'center' })

      // Table
      const tableData = referredUsers.map((user, index) => [
        index + 1,
        user.full_name,
        user.phone,
        new Date(user.created_at).toLocaleDateString('ar-MR')
      ])

      ;(doc as jsPDFWithAutoTable).autoTable({
        startY: 65,
        head: [['#', 'Name', 'Phone', 'Registration Date']],
        body: tableData,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 10
        },
        headStyles: {
          fillColor: [234, 179, 8], // Yellow
          textColor: [0, 0, 0]
        }
      })

      doc.save(`referrals-${vendor?.promo_code}-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('تم تحميل الملف بنجاح!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('فشل تحميل الملف')
    }
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
                    <div className="flex gap-2">
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
                      <button
                        onClick={shareReferralLink}
                        className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <Share2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-6">
                <p className="text-center">لم يتم إنشاء رمز ترويجي بعد</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-yellow-400" />
              <span className="text-gray-400 text-sm">إجمالي الإحالات</span>
            </div>
            <div className="text-4xl font-bold text-yellow-400">{stats.total}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
              <span className="text-gray-400 text-sm">نشط هذا الشهر</span>
            </div>
            <div className="text-4xl font-bold text-yellow-400">{stats.thisMonth}</div>
          </motion.div>
        </div>

        {/* Referrals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-yellow-500/20 overflow-hidden"
        >
          <div className="p-6 border-b border-yellow-500/20 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              المستخدمون المُحالون ({referredUsers.length})
            </h3>
            {referredUsers.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">تحميل PDF</span>
              </motion.button>
            )}
          </div>

          {referredUsers.length > 0 ? (
            <div className="divide-y divide-yellow-500/10">
              {referredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-yellow-500/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <h4 className="text-lg font-semibold text-white">
                          {user.full_name}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">الهاتف</p>
                          <p className="text-gray-300 font-mono">{user.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">تاريخ التسجيل</p>
                          <p className="text-gray-300">
                            {new Date(user.created_at).toLocaleDateString('ar-MR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">لم تحصل على إحالات بعد</p>
              <p className="text-gray-500 text-sm">
                شارك كود الإحالة الخاص بك لتبدأ في كسب العمولات!
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
