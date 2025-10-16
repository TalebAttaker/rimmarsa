'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  Store,
  User,
  MapPin,
  Upload,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Shield,
  Building2,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  MessageCircle
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

interface Region {
  id: string
  name: string
  name_ar: string
}

interface City {
  id: string
  name: string
  name_ar: string
  region_id: string
}

interface PendingRequest {
  id: string
  business_name: string
  email: string | null
  phone: string
  whatsapp_number: string | null
  status: string
  package_plan: string
  package_price: number
  created_at: string
}

const PRICING_PLANS = [
  {
    id: '1_month',
    name: 'خطة شهر واحد',
    price: 1250,
    duration: '30 يوم',
    features: ['وصول كامل للمنصة', 'منتجات غير محدودة', 'دعم العملاء', 'لوحة التحليلات']
  },
  {
    id: '2_months',
    name: 'خطة شهرين',
    price: 1600,
    duration: '60 يوم',
    savings: 'وفر 350 أوقية',
    features: ['وصول كامل للمنصة', 'منتجات غير محدودة', 'دعم العملاء ذو الأولوية', 'لوحة التحليلات', 'شارة البائع المميز']
  }
]

export default function VendorRegistrationPage() {
  const [step, setStep] = useState(1)
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filteredCities, setFilteredCities] = useState<City[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null)
  const [passwordError, setPasswordError] = useState('')

  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    password: '',
    whatsapp_number: '',
    region_id: '',
    city_id: '',
    address: '',
    package_plan: '2_months',
    nni_image_url: '',
    personal_image_url: '',
    store_image_url: '',
    payment_screenshot_url: ''
  })

  const [uploading, setUploading] = useState({
    nni: false,
    personal: false,
    store: false,
    payment: false
  })

  const [uploadProgress, setUploadProgress] = useState({
    nni: 0,
    personal: 0,
    store: 0,
    payment: 0
  })

  useEffect(() => {
    const initialize = async () => {
      await fetchData()
      checkInitialPhone()
    }
    initialize()
  }, [])

  useEffect(() => {
    if (formData.region_id) {
      const citiesInRegion = cities.filter(city => city.region_id === formData.region_id)
      setFilteredCities(citiesInRegion)
      if (!citiesInRegion.find(c => c.id === formData.city_id)) {
        setFormData(prev => ({ ...prev, city_id: '' }))
      }
    } else {
      setFilteredCities([])
    }
  }, [formData.region_id, cities, formData.city_id])

  const checkInitialPhone = () => {
    // Check if there's a phone in localStorage from previous attempt
    const storedPhone = localStorage.getItem('vendor_registration_phone')
    if (storedPhone) {
      checkExistingRequest(storedPhone)
    } else {
      setLoading(false)
    }
  }

  const checkExistingRequest = async (phone: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vendor_requests')
        .select('*')
        .eq('phone', phone)
        .eq('status', 'pending')
        .maybeSingle()

      if (data && !error) {
        setPendingRequest(data)
      }
    } catch (error) {
      console.error('Error checking existing request:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const supabase = createClient()

      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (regionsError) {
        console.error('Error fetching regions:', regionsError)
        toast.error('Failed to load regions')
      }

      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (citiesError) {
        console.error('Error fetching cities:', citiesError)
        toast.error('Failed to load cities')
      }

      setRegions(regionsData || [])
      setCities(citiesData || [])

      console.log('Loaded regions:', regionsData?.length || 0)
      console.log('Loaded cities:', citiesData?.length || 0)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load location data')
    }
  }

  const validatePassword = (password: string): boolean => {
    // Password must contain both numbers and letters (like 23343534Aa)
    const hasNumbers = /\d/.test(password)
    const hasLetters = /[a-zA-Z]/.test(password)
    const minLength = password.length >= 8

    if (!minLength) {
      setPasswordError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return false
    }
    if (!hasNumbers) {
      setPasswordError('كلمة المرور يجب أن تحتوي على أرقام')
      return false
    }
    if (!hasLetters) {
      setPasswordError('كلمة المرور يجب أن تحتوي على حروف')
      return false
    }

    setPasswordError('')
    return true
  }

  const handlePhoneBlur = async () => {
    if (formData.phone) {
      // Save phone to localStorage
      localStorage.setItem('vendor_registration_phone', formData.phone)

      // Check for existing pending request
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vendor_requests')
        .select('*')
        .eq('phone', formData.phone)
        .eq('status', 'pending')
        .maybeSingle()

      if (data && !error) {
        setPendingRequest(data)
        toast.error('لديك بالفعل طلب تسجيل قيد الانتظار!')
      }
    }
  }

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password })
    if (password) {
      validatePassword(password)
    } else {
      setPasswordError('')
    }
  }

  const handleImageUpload = async (file: File, type: 'nni' | 'personal' | 'store' | 'payment') => {
    setUploading(prev => ({ ...prev, [type]: true }))
    setUploadProgress(prev => ({ ...prev, [type]: 0 }))

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const currentProgress = prev[type]
        if (currentProgress < 90) {
          return { ...prev, [type]: currentProgress + 10 }
        }
        return prev
      })
    }, 200)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `vendor-requests/${type}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Complete the progress
      clearInterval(progressInterval)
      setUploadProgress(prev => ({ ...prev, [type]: 100 }))

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      const fieldMap = {
        nni: 'nni_image_url',
        personal: 'personal_image_url',
        store: 'store_image_url',
        payment: 'payment_screenshot_url'
      }

      setFormData(prev => ({ ...prev, [fieldMap[type]]: publicUrl }))
      toast.success('Image uploaded successfully!')

      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [type]: 0 }))
      }, 1000)
    } catch (error: unknown) {
      clearInterval(progressInterval)
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image'
      toast.error(errorMessage)
      setUploadProgress(prev => ({ ...prev, [type]: 0 }))
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.nni_image_url || !formData.personal_image_url ||
        !formData.store_image_url || !formData.payment_screenshot_url) {
      toast.error('يرجى تحميل جميع الصور المطلوبة')
      return
    }

    if (!formData.password || !validatePassword(formData.password)) {
      toast.error('يرجى إدخال كلمة مرور صحيحة (يجب أن تحتوي على أرقام وحروف)')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      // Check again for duplicate request using phone
      const { data: existingData } = await supabase
        .from('vendor_requests')
        .select('id')
        .eq('phone', formData.phone)
        .eq('status', 'pending')
        .maybeSingle()

      if (existingData) {
        toast.error('لديك بالفعل طلب تسجيل قيد الانتظار!')
        setSubmitting(false)
        return
      }

      const selectedPlan = PRICING_PLANS.find(p => p.id === formData.package_plan)

      // Generate email from phone: remove +, spaces, and add @rimmarsa.com
      const cleanPhone = formData.phone.replace(/[\s+\-()]/g, '')
      const generatedEmail = `${cleanPhone}@rimmarsa.com`

      const { error } = await supabase
        .from('vendor_requests')
        .insert([{
          business_name: formData.business_name,
          owner_name: formData.owner_name,
          email: generatedEmail,
          phone: formData.phone,
          password: formData.password, // Will be hashed by admin when creating account
          whatsapp_number: formData.whatsapp_number,
          region_id: formData.region_id || null,
          city_id: formData.city_id || null,
          address: formData.address || null,
          package_plan: formData.package_plan,
          package_price: selectedPlan?.price || 0,
          nni_image_url: formData.nni_image_url,
          personal_image_url: formData.personal_image_url,
          store_image_url: formData.store_image_url,
          payment_screenshot_url: formData.payment_screenshot_url,
          status: 'pending'
        }])

      if (error) throw error

      setSuccess(true)
      localStorage.setItem('vendor_registration_phone', formData.phone)
      toast.success('تم إرسال الطلب بنجاح!')
    } catch (error: unknown) {
      console.error('Error submitting application:', error)
      const errorMessage = error instanceof Error ? error.message : 'فشل في إرسال الطلب'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPlan = PRICING_PLANS.find(p => p.id === formData.package_plan)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // Pending request status page
  if (pendingRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-gray-900 border border-primary-500/20 rounded-2xl p-8"
        >
          <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-primary-400" />
          </div>

          <h2 className="text-3xl font-bold text-primary-400 text-center mb-4">الطلب قيد الانتظار</h2>

          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 space-y-3">
            <div className="flex items-center gap-2 text-gray-300">
              <AlertCircle className="w-5 h-5 text-secondary-400" />
              <p className="text-sm">لديك بالفعل طلب تسجيل قيد الانتظار.</p>
            </div>

            <div className="border-t border-gray-700 pt-3 space-y-2">
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-white">العمل:</span> {pendingRequest.business_name}
              </p>
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-white">الهاتف:</span> {pendingRequest.phone}
              </p>
              {pendingRequest.whatsapp_number && (
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-white">الواتساب:</span> {pendingRequest.whatsapp_number}
                </p>
              )}
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-white">الخطة:</span> {selectedPlan?.name} - {pendingRequest.package_price} أوقية
              </p>
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-white">تاريخ الإرسال:</span> {new Date(pendingRequest.created_at).toLocaleDateString('ar-MR')}
              </p>
            </div>

            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-primary-200 font-medium text-center">
                الحالة: <span className="text-primary-400 font-bold uppercase">{pendingRequest.status === 'pending' ? 'قيد الانتظار' : pendingRequest.status}</span>
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-400 text-center mb-6">
            فريق الإدارة لدينا يراجع طلبك. ستتلقى إشعاراً عبر البريد الإلكتروني بمجرد الموافقة على طلبك أو إذا كنا بحاجة إلى معلومات إضافية.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setPendingRequest(null)
                localStorage.removeItem('vendor_registration_phone')
              }}
              className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
            >
              التسجيل برقم هاتف مختلف
            </button>
            <Link
              href="/"
              className="block text-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all"
            >
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Success page
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-gray-900 border border-green-500/20 rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-green-400 mb-4">تم إرسال الطلب!</h2>
          <p className="text-gray-300 mb-6">
            شكراً لتقديم طلبك للانضمام إلى ريمارسا! لقد استلمنا طلبك وسنقوم بمراجعته قريباً.
            ستتلقى إشعاراً عبر البريد الإلكتروني بمجرد معالجة طلبك.
          </p>
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">تفاصيل الطلب:</p>
            <p className="text-white font-medium">{formData.business_name}</p>
            <p className="text-gray-400 text-sm">{formData.phone}</p>
            <p className="text-primary-400 font-semibold mt-2">
              {selectedPlan?.name} - {selectedPlan?.price} أوقية
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة إلى الصفحة الرئيسية
          </Link>
        </motion.div>
      </div>
    )
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent mb-2">
            كن بائعاً
          </h1>
          <p className="text-gray-400">انضم إلى منصة السوق الرائدة في موريتانيا</p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-secondary-400 hover:text-secondary-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 ${
                    step > s ? 'bg-primary-500' : 'bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSubmit}
          className="bg-gray-900/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-8"
        >
          {/* Step 1: Business Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-400 flex items-center gap-2 mb-6">
                <Store className="w-6 h-6" />
                معلومات العمل
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    اسم العمل *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="اسم عملك التجاري"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    اسم المالك *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="الاسم الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={handlePhoneBlur}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="+222 XX XX XX XX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white focus:outline-none transition-colors ${
                      passwordError ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                    }`}
                    placeholder="يجب أن تحتوي على أرقام وحروف"
                  />
                  {passwordError && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {passwordError}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    مثال: 23343534Aa (8 أحرف على الأقل، أرقام وحروف)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    رقم الواتساب *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="+222 XX XX XX XX"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    مطلوب للتواصل معك عند الموافقة على الطلب
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all"
              >
                التالي: الموقع
              </button>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-400 flex items-center gap-2 mb-6">
                <MapPin className="w-6 h-6" />
                الموقع
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    المنطقة
                  </label>
                  <select
                    value={formData.region_id}
                    onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                  >
                    <option value="">اختر منطقة</option>
                    {regions.map(region => (
                      <option key={region.id} value={region.id}>
                        {region.name_ar || region.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    المدينة
                  </label>
                  <select
                    value={formData.city_id}
                    onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
                    disabled={!formData.region_id}
                  >
                    <option value="">اختر مدينة</option>
                    {filteredCities.map(city => (
                      <option key={city.id} value={city.id}>
                        {city.name_ar || city.name}
                      </option>
                    ))}
                  </select>
                  {!formData.region_id && (
                    <p className="text-xs text-gray-500 mt-1">اختر منطقة أولاً</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  العنوان
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="عنوان الشارع"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
                >
                  السابق
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all"
                >
                  التالي: المستندات
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-400 flex items-center gap-2 mb-6">
                <Upload className="w-6 h-6" />
                تحميل المستندات
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* National ID Image */}
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    البطاقة الوطنية (NNI) *
                  </label>
                  {formData.nni_image_url ? (
                    <div className="space-y-3">
                      <img src={formData.nni_image_url} alt="NNI" className="w-full h-32 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, nni_image_url: '' })}
                        className="w-full py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm"
                      >
                        إزالة
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-sm text-gray-400">
                          {uploading.nni ? `جاري التحميل... ${uploadProgress.nni}%` : 'انقر للتحميل'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file, 'nni')
                          }}
                          className="hidden"
                          disabled={uploading.nni}
                        />
                      </label>
                      {uploading.nni && (
                        <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress.nni}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Personal Image */}
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الصورة الشخصية *
                  </label>
                  {formData.personal_image_url ? (
                    <div className="space-y-3">
                      <img src={formData.personal_image_url} alt="Personal" className="w-full h-32 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, personal_image_url: '' })}
                        className="w-full py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm"
                      >
                        إزالة
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-sm text-gray-400">
                          {uploading.personal ? `جاري التحميل... ${uploadProgress.personal}%` : 'انقر للتحميل'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file, 'personal')
                          }}
                          className="hidden"
                          disabled={uploading.personal}
                        />
                      </label>
                      {uploading.personal && (
                        <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress.personal}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Store Image */}
                <div className="bg-gray-800/30 rounded-xl p-6 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    صورة المتجر *
                  </label>
                  {formData.store_image_url ? (
                    <div className="space-y-3">
                      <img src={formData.store_image_url} alt="Store" className="w-full h-48 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, store_image_url: '' })}
                        className="w-full py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm"
                      >
                        إزالة
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                        <Upload className="w-12 h-12 text-gray-500 mb-2" />
                        <span className="text-sm text-gray-400">
                          {uploading.store ? `جاري التحميل... ${uploadProgress.store}%` : 'انقر لتحميل صورة المتجر'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file, 'store')
                          }}
                          className="hidden"
                          disabled={uploading.store}
                        />
                      </label>
                      {uploading.store && (
                        <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress.store}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
                >
                  السابق
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!formData.nni_image_url || !formData.personal_image_url || !formData.store_image_url}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي: الدفع
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Pricing & Payment */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-400 flex items-center gap-2 mb-6">
                <CreditCard className="w-6 h-6" />
                اختيار الخطة والدفع
              </h2>

              {/* Pricing Plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {PRICING_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, package_plan: plan.id })}
                    className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                      formData.package_plan === plan.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                    }`}
                  >
                    {plan.savings && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                        {plan.savings}
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-3xl font-bold text-primary-400 mb-2">{plan.price} أوقية</p>
                    <p className="text-gray-400 text-sm mb-4">{plan.duration}</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {/* Payment Screenshot */}
              <div className="bg-gray-800/30 rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  تحميل لقطة شاشة الدفع *
                </label>
                <p className="text-sm text-gray-400 mb-4">
                  يرجى إجراء الدفع إلى تفاصيل الحساب المقدمة وتحميل لقطة الشاشة هنا.
                </p>
                {formData.payment_screenshot_url ? (
                  <div className="space-y-3">
                    <img src={formData.payment_screenshot_url} alt="Payment" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_screenshot_url: '' })}
                      className="w-full py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm"
                    >
                      إزالة
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                      <Upload className="w-12 h-12 text-gray-500 mb-2" />
                      <span className="text-sm text-gray-400">
                        {uploading.payment ? `جاري التحميل... ${uploadProgress.payment}%` : 'انقر لتحميل لقطة شاشة الدفع'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, 'payment')
                        }}
                        className="hidden"
                        disabled={uploading.payment}
                      />
                    </label>
                    {uploading.payment && (
                      <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-300"
                          style={{ width: `${uploadProgress.payment}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
                >
                  السابق
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.payment_screenshot_url}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
              </div>
            </div>
          )}
        </motion.form>
      </div>
    </div>
  )
}
