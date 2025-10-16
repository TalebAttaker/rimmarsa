import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Eye,
  Check,
  X,
  ZoomIn,
  User,
  Phone,
  MapPin,
  Building2,
  CreditCard,
} from 'lucide-react'

interface VendorRequest {
  id: string
  business_name: string
  owner_name: string
  email: string | null
  phone: string
  whatsapp_number: string | null
  address: string | null
  package_plan: string
  package_price: number
  nni_image_url: string
  personal_image_url: string
  store_image_url: string
  payment_screenshot_url: string
  status: string | null
  created_at: string | null
}

export default function VendorRequests() {
  const [requests, setRequests] = useState<VendorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<VendorRequest | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    }
    const labels = {
      pending: 'قيد الانتظار',
      approved: 'موافق عليه',
      rejected: 'مرفوض',
    }
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم العمل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المالك
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الهاتف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الخطة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    لا توجد طلبات
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.business_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.owner_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.package_price} أوقية
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-yellow-600 hover:text-yellow-900 inline-flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        عرض
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                تفاصيل طلب البائع
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Business Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">اسم العمل</p>
                    <p className="font-semibold text-gray-800">
                      {selectedRequest.business_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">اسم المالك</p>
                    <p className="font-semibold text-gray-800">
                      {selectedRequest.owner_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">رقم الهاتف</p>
                    <p className="font-semibold text-gray-800">
                      {selectedRequest.phone}
                    </p>
                  </div>
                </div>

                {selectedRequest.whatsapp_number && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">رقم الواتساب</p>
                      <p className="font-semibold text-gray-800">
                        {selectedRequest.whatsapp_number}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRequest.address && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg md:col-span-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">العنوان</p>
                      <p className="font-semibold text-gray-800">
                        {selectedRequest.address}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">الخطة</p>
                    <p className="font-semibold text-gray-800">
                      {selectedRequest.package_price} أوقية
                    </p>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  المستندات المرفقة
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { url: selectedRequest.nni_image_url, label: 'البطاقة الوطنية' },
                    { url: selectedRequest.personal_image_url, label: 'الصورة الشخصية' },
                    { url: selectedRequest.store_image_url, label: 'صورة المتجر' },
                    {
                      url: selectedRequest.payment_screenshot_url,
                      label: 'إثبات الدفع',
                    },
                  ].map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={image.label}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => setZoomedImage(image.url)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 p-2 rounded-full"
                        >
                          <ZoomIn className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        {image.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                    <Check className="w-5 h-5" />
                    الموافقة على الطلب
                  </button>
                  <button className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                    <X className="w-5 h-5" />
                    رفض الطلب
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 left-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
