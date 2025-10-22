'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  Copy,
  Download,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Share2,
  Gift,
  TrendingUp
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import MobileBottomNav from '@/components/mobile/MobileBottomNav'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

type VendorStatus = 'none' | 'pending' | 'approved'

type ReferredUser = {
  id: string
  full_name: string
  phone: string
  created_at: string
}

type VendorData = {
  id: string
  user_id: string
  is_approved: boolean
  promo_code: string | null
  business_name: string
  owner_name: string
  phone: string
  created_at: string
}

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: Record<string, unknown>) => void
}

export default function ReferralsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>('none')
  const [promoCode, setPromoCode] = useState('')
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([])
  const [vendorData, setVendorData] = useState<VendorData | null>(null)

  useEffect(() => {
    checkVendorStatus()
  }, [])

  const checkVendorStatus = async () => {
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Not logged in, redirect to vendor login
        router.push('/vendor/login')
        return
      }

      // Check if user has a vendor account
      const { data: vendor, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !vendor) {
        // No vendor account found
        setVendorStatus('none')
        setLoading(false)
        return
      }

      setVendorData(vendor)

      if (!vendor.is_approved) {
        // Vendor pending approval
        setVendorStatus('pending')
        setLoading(false)
        return
      }

      // Vendor is approved
      setVendorStatus('approved')
      setPromoCode(vendor.promo_code || '')

      // Fetch referred users
      await fetchReferredUsers(vendor.promo_code)

      setLoading(false)
    } catch (error) {
      console.error('Error checking vendor status:', error)
      toast.error('حدث خطأ أثناء التحميل')
      setLoading(false)
    }
  }

  const fetchReferredUsers = async (code: string) => {
    if (!code) return

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('vendors')
        .select('id, business_name, owner_name, phone, created_at')
        .eq('referral_code', code)
        .order('created_at', { ascending: false })

      if (error) throw error

      const users = (data || []).map(vendor => ({
        id: vendor.id,
        full_name: vendor.business_name || vendor.owner_name || 'غير متوفر',
        phone: vendor.phone || 'غير متوفر',
        created_at: vendor.created_at
      }))

      setReferredUsers(users)
    } catch (error) {
      console.error('Error fetching referred users:', error)
      toast.error('فشل تحميل المستخدمين المُحالين')
    }
  }

  const copyPromoCode = () => {
    if (!promoCode) return
    navigator.clipboard.writeText(promoCode)
    toast.success('تم نسخ كود الترويج!')
  }

  const sharePromoCode = async () => {
    if (!promoCode) return

    const shareText = `انضم إلى ريمارسا باستخدام كود الإحالة الخاص بي: ${promoCode}\n\nاحصل على مزايا حصرية!\n\nhttps://www.rimmarsa.com/vendor-registration?ref=${promoCode}`

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

      // Add Arabic font support (you may need to add custom font)
      doc.setFont('helvetica', 'normal')

      // Title
      doc.setFontSize(20)
      doc.text('Referral Report - Rimmarsa', 105, 20, { align: 'center' })

      doc.setFontSize(12)
      doc.text(`Promo Code: ${promoCode}`, 105, 30, { align: 'center' })
      doc.text(`Total Referrals: ${referredUsers.length}`, 105, 38, { align: 'center' })
      doc.text(`Date: ${new Date().toLocaleDateString('ar-MR')}`, 105, 46, { align: 'center' })

      // Table
      const tableData = referredUsers.map((user, index) => [
        index + 1,
        user.full_name,
        user.phone,
        new Date(user.created_at).toLocaleDateString('ar-MR')
      ])

      ;(doc as jsPDFWithAutoTable).autoTable({
        startY: 55,
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

      doc.save(`referrals-${promoCode}-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('تم تحميل الملف بنجاح!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('فشل تحميل الملف')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // Not a vendor - redirect to registration
  if (vendorStatus === 'none') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-yellow-500/30 text-center"
        >
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            يجب أن تكون بائعاً للوصول لهذه الصفحة
          </h2>
          <p className="text-gray-300 mb-8">
            برنامج الإحالة متاح فقط للبائعين المعتمدين. سجل كبائع الآن للحصول على كود الإحالة الخاص بك!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/vendor-registration')}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl shadow-lg hover:shadow-yellow-500/50 transition-all"
          >
            التسجيل كبائع
          </motion.button>
          <button
            onClick={() => router.push('/')}
            className="w-full mt-4 py-3 text-gray-400 hover:text-yellow-400 transition-colors"
          >
            العودة إلى الصفحة الرئيسية
          </button>
        </motion.div>
        <MobileBottomNav />
      </div>
    )
  }

  // Vendor pending approval
  if (vendorStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-yellow-500/30 text-center"
        >
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            حسابك قيد المراجعة
          </h2>
          <p className="text-gray-300 mb-8">
            شكراً لتسجيلك! حسابك قيد المراجعة من قبل فريقنا. ستتمكن من الوصول إلى برنامج الإحالة وكود الترويج الخاص بك بمجرد الموافقة على حسابك.
          </p>
          <div className="bg-gray-900/50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">وقت المراجعة المتوقع:</p>
            <p className="text-lg font-bold text-yellow-400">1-3 أيام عمل</p>
          </div>
          <button
            onClick={() => router.push('/vendor/dashboard')}
            className="w-full py-4 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
          >
            العودة إلى لوحة التحكم
          </button>
        </motion.div>
        <MobileBottomNav />
      </div>
    )
  }

  // Approved vendor - show referral program
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pb-24">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 pt-6 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/vendor/dashboard')}
              className="text-black hover:text-gray-800 font-semibold"
            >
              ← العودة
            </button>
            <h1 className="text-2xl font-bold text-black">برنامج الإحالة</h1>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-black/20 rounded-2xl flex items-center justify-center">
              <Gift className="w-8 h-8 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">كود الإحالة الخاص بك</h2>
              <p className="text-black/70 text-sm">شارك واربح مع كل إحالة</p>
            </div>
          </div>

          {/* Promo Code */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-black/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-black/70 text-sm mb-2">كود الترويج</p>
                <p className="text-3xl font-bold text-black tracking-wider">{promoCode}</p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={copyPromoCode}
                  className="p-3 bg-black/20 hover:bg-black/30 rounded-xl transition-colors"
                  title="نسخ"
                >
                  <Copy className="w-5 h-5 text-black" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={sharePromoCode}
                  className="p-3 bg-black/20 hover:bg-black/30 rounded-xl transition-colors"
                  title="مشاركة"
                >
                  <Share2 className="w-5 h-5 text-black" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 -mt-12">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-yellow-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-yellow-400" />
              <span className="text-gray-400 text-sm">إجمالي الإحالات</span>
            </div>
            <p className="text-4xl font-bold text-yellow-400">{referredUsers.length}</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-yellow-500/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
              <span className="text-gray-400 text-sm">نشط هذا الشهر</span>
            </div>
            <p className="text-4xl font-bold text-yellow-400">
              {referredUsers.filter(u => {
                const date = new Date(u.created_at)
                const now = new Date()
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
              }).length}
            </p>
          </div>
        </div>

        {/* Referred Users List */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-yellow-400" />
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
                تحميل PDF
              </motion.button>
            )}
          </div>

          {referredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">لم تحصل على إحالات بعد</p>
              <p className="text-gray-500 text-sm">شارك كود الإحالة الخاص بك لتبدأ في كسب العمولات!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-yellow-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <p className="font-semibold text-white">{user.full_name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
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
          )}
        </div>

        {/* How it works */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-yellow-500/20 mt-6">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">كيف يعمل برنامج الإحالة؟</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-yellow-400 font-bold">1</span>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">شارك كود الإحالة الخاص بك</p>
                <p className="text-gray-400 text-sm">أرسل كود الإحالة للبائعين الجدد</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-yellow-400 font-bold">2</span>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">يسجلون باستخدام الكود</p>
                <p className="text-gray-400 text-sm">عندما يستخدمون كودك عند التسجيل</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-yellow-400 font-bold">3</span>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">احصل على عمولة</p>
                <p className="text-gray-400 text-sm">استمتع بالعمولات من مبيعاتهم</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
