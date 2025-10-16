'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  X,
  AlertCircle,
  Store,
  MapPin,
  CreditCard,
  Shield,
  User,
  Building2,
  ZoomIn
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface VendorRequest {
  id: string
  business_name: string
  owner_name: string
  email: string
  phone: string
  region_id?: string
  city_id?: string
  address?: string
  nni_image_url: string
  personal_image_url: string
  store_image_url: string
  payment_screenshot_url: string
  package_plan: string
  package_price: number
  status: string
  rejection_reason?: string
  created_at: string
  regions?: { name: string; name_ar: string }
  cities?: { name: string; name_ar: string }
}

export default function VendorRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<VendorRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<VendorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedRequest, setSelectedRequest] = useState<VendorRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication
    const storedAdmin = localStorage.getItem('admin')
    const loginTime = localStorage.getItem('loginTime')

    if (!storedAdmin || !loginTime) {
      router.push('/fassalapremierprojectbsk/login')
      return
    }

    const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60)
    if (hoursSinceLogin > 24) {
      localStorage.removeItem('admin')
      localStorage.removeItem('loginTime')
      router.push('/fassalapremierprojectbsk/login')
      return
    }

    fetchRequests()
  }, [router])

  useEffect(() => {
    const filtered = requests.filter(request => {
      const matchesSearch =
        request.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.phone.includes(searchQuery)

      const matchesStatus = statusFilter === 'all' || request.status === statusFilter

      return matchesSearch && matchesStatus
    })

    setFilteredRequests(filtered)
  }, [searchQuery, statusFilter, requests])

  const fetchRequests = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('vendor_requests')
        .select('*, regions(*), cities(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
      setFilteredRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to load vendor requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: VendorRequest) => {
    if (!confirm(`Approve ${request.business_name}? This will create a vendor account and activate their subscription.`)) {
      return
    }

    setProcessing(true)

    try {
      const supabase = createClient()

      // Calculate subscription dates
      const startDate = new Date()
      const monthsToAdd = request.package_plan === '2_months' ? 2 : 1
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + monthsToAdd)

      // Generate referral code
      const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      // Create vendor
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .insert([{
          business_name: request.business_name,
          owner_name: request.owner_name,
          email: request.email,
          phone: request.phone,
          logo_url: request.store_image_url,
          personal_picture_url: request.personal_image_url,
          nni: null, // NNI image is stored, but we don't have the text value
          region_id: request.region_id,
          city_id: request.city_id,
          address: request.address,
          referral_code: referralCode,
          is_verified: true, // Auto-verify approved vendors
          is_active: true
        }])
        .select()
        .single()

      if (vendorError) throw vendorError

      // Create subscription
      const { error: subscriptionError } = await supabase
        .from('subscription_history')
        .insert([{
          vendor_id: vendor.id,
          plan_type: request.package_plan === '2_months' ? '2 Months' : '1 Month',
          amount: request.package_price,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active'
        }])

      if (subscriptionError) throw subscriptionError

      // Update request status
      const { error: updateError } = await supabase
        .from('vendor_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          vendor_id: vendor.id
        })
        .eq('id', request.id)

      if (updateError) throw updateError

      toast.success(`Vendor approved! Account created for ${request.business_name}`)
      fetchRequests()
      setShowDetailsModal(false)
    } catch (error: unknown) {
      console.error('Error approving vendor:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve vendor'
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setProcessing(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('vendor_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id)

      if (error) throw error

      toast.success('Vendor request rejected')
      fetchRequests()
      setShowRejectModal(false)
      setShowDetailsModal(false)
      setRejectionReason('')
    } catch (error: unknown) {
      console.error('Error rejecting vendor:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject vendor'
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    }

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle
    }

    const labels = {
      pending: 'قيد الانتظار',
      approved: 'موافق عليه',
      rejected: 'مرفوض'
    }

    const Icon = icons[status as keyof typeof icons]

    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-4 h-4" />
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getPlanDisplay = (plan: string) => {
    const plans: { [key: string]: string } = {
      '1_month': 'شهر واحد',
      '2_months': 'شهرين'
    }
    return plans[plan] || plan
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 font-medium">جاري تحميل طلبات البائعين...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">
                  طلبات البائعين
                </h1>
                <p className="text-gray-400">مراجعة وإدارة طلبات تسجيل البائعين</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-400">{requests.filter(r => r.status === 'pending').length}</p>
                <p className="text-sm text-gray-400">قيد الانتظار</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم التجاري، المالك، البريد الإلكتروني، أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="approved">موافق عليه</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Requests Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">العمل التجاري</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">معلومات الاتصال</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">الموقع</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">الخطة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">التاريخ</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredRequests.map((request, index) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{request.business_name}</p>
                        <p className="text-gray-400 text-sm">{request.owner_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-300">{request.email}</p>
                        <p className="text-gray-500">{request.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {request.cities ? (
                        <div className="text-sm">
                          <p className="text-gray-300">{request.cities.name}</p>
                          <p className="text-gray-500">{request.regions?.name}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">غير محدد</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{getPlanDisplay(request.package_plan)}</p>
                        <p className="text-yellow-400 text-sm">{request.package_price} MRU</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowDetailsModal(true)
                        }}
                        className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filteredRequests.length === 0 && (
              <div className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد طلبات بائعين</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-yellow-400">تفاصيل طلب البائع</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Business Info */}
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2 mb-4">
                    <Store className="w-5 h-5" />
                    معلومات العمل التجاري
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">اسم العمل</p>
                      <p className="text-white font-medium">{selectedRequest.business_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">اسم المالك</p>
                      <p className="text-white font-medium">{selectedRequest.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">البريد الإلكتروني</p>
                      <p className="text-white font-medium">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">الهاتف</p>
                      <p className="text-white font-medium">{selectedRequest.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                {(selectedRequest.cities || selectedRequest.address) && (
                  <div className="bg-gray-800/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5" />
                      الموقع
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRequest.cities && (
                        <>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">المدينة</p>
                            <p className="text-white font-medium">{selectedRequest.cities.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">المنطقة</p>
                            <p className="text-white font-medium">{selectedRequest.regions?.name}</p>
                          </div>
                        </>
                      )}
                      {selectedRequest.address && (
                        <div className="col-span-2">
                          <p className="text-gray-400 text-sm mb-1">العنوان</p>
                          <p className="text-white font-medium">{selectedRequest.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Plan */}
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5" />
                    خطة الاشتراك
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">الخطة</p>
                      <p className="text-white font-medium">{getPlanDisplay(selectedRequest.package_plan)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">السعر</p>
                      <p className="text-yellow-400 font-bold text-xl">{selectedRequest.package_price} أوقية</p>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">المستندات المرفوعة</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        البطاقة الوطنية
                      </p>
                      <div className="relative group cursor-pointer" onClick={() => setZoomedImage(selectedRequest.nni_image_url)}>
                        <img src={selectedRequest.nni_image_url} alt="NNI" className="w-full h-48 object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 p-3 rounded-full">
                            <ZoomIn className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        الصورة الشخصية
                      </p>
                      <div className="relative group cursor-pointer" onClick={() => setZoomedImage(selectedRequest.personal_image_url)}>
                        <img src={selectedRequest.personal_image_url} alt="Personal" className="w-full h-48 object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 p-3 rounded-full">
                            <ZoomIn className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        صورة المتجر
                      </p>
                      <div className="relative group cursor-pointer" onClick={() => setZoomedImage(selectedRequest.store_image_url)}>
                        <img src={selectedRequest.store_image_url} alt="Store" className="w-full h-48 object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 p-3 rounded-full">
                            <ZoomIn className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        إثبات الدفع
                      </p>
                      <div className="relative group cursor-pointer" onClick={() => setZoomedImage(selectedRequest.payment_screenshot_url)}>
                        <img src={selectedRequest.payment_screenshot_url} alt="Payment" className="w-full h-48 object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 p-3 rounded-full">
                            <ZoomIn className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowRejectModal(true)
                      }}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      رفض
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest)}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {processing ? 'جاري المعالجة...' : 'الموافقة وإنشاء حساب البائع'}
                    </button>
                  </div>
                )}

                {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 font-semibold mb-2">سبب الرفض:</p>
                    <p className="text-gray-300">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-red-500/20 rounded-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-red-400 mb-4">رفض الطلب</h2>
              <p className="text-gray-300 mb-4">
                يرجى تقديم سبب رفض طلب {selectedRequest.business_name}:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors resize-none mb-4"
                placeholder="أدخل سبب الرفض..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectionReason('')
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'جاري الرفض...' : 'تأكيد الرفض'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
