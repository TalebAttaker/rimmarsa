/**
 * Vendor Registration Form Hook
 *
 * Manages form state, validation, and submission for vendor registration.
 * Extracted from 1097-line page component for better maintainability.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface VendorRegistrationFormData {
  business_name: string
  owner_name: string
  phone: string
  phoneDigits: string
  password: string
  whatsapp_number: string
  whatsappDigits: string
  region_id: string
  city_id: string
  address: string
  package_plan: '1_month' | '2_months'
  referral_code: string
  nni_image_url: string
  personal_image_url: string
  store_image_url: string
  payment_screenshot_url: string
}

export interface PendingRequest {
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

export function useVendorRegistration() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null)
  const [passwordError, setPasswordError] = useState('')

  const [formData, setFormData] = useState<VendorRegistrationFormData>({
    business_name: '',
    owner_name: '',
    phone: '',
    phoneDigits: '',
    password: '',
    whatsapp_number: '',
    whatsappDigits: '',
    region_id: '',
    city_id: '',
    address: '',
    package_plan: '2_months',
    referral_code: '',
    nni_image_url: '',
    personal_image_url: '',
    store_image_url: '',
    payment_screenshot_url: '',
  })

  /**
   * Validate password strength
   */
  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      setPasswordError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return false
    }

    if (!/\d/.test(password)) {
      setPasswordError('كلمة المرور يجب أن تحتوي على أرقام')
      return false
    }

    if (!/[a-zA-Z]/.test(password)) {
      setPasswordError('كلمة المرور يجب أن تحتوي على حروف')
      return false
    }

    setPasswordError('')
    return true
  }

  /**
   * Check if vendor has pending request
   */
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

  /**
   * Initialize form from localStorage if available
   */
  const checkInitialPhone = () => {
    const storedPhone = localStorage.getItem('vendor_registration_phone')
    if (storedPhone) {
      checkExistingRequest(storedPhone)
    } else {
      setLoading(false)
    }
  }

  /**
   * Validate step 1 (business information)
   */
  const validateStep1 = (): boolean => {
    if (!formData.business_name.trim()) {
      toast.error('اسم المتجر مطلوب')
      return false
    }

    if (!formData.owner_name.trim()) {
      toast.error('اسم المالك مطلوب')
      return false
    }

    if (!formData.phoneDigits || formData.phoneDigits.length !== 8) {
      toast.error('يرجى إدخال رقم هاتف صحيح (8 أرقام)')
      return false
    }

    if (!validatePassword(formData.password)) {
      toast.error(passwordError)
      return false
    }

    return true
  }

  /**
   * Validate step 2 (location)
   */
  const validateStep2 = (): boolean => {
    if (!formData.region_id) {
      toast.error('يرجى اختيار الولاية')
      return false
    }

    if (!formData.city_id) {
      toast.error('يرجى اختيار المقاطعة')
      return false
    }

    return true
  }

  /**
   * Validate step 3 (documents)
   */
  const validateStep3 = (): boolean => {
    if (!formData.nni_image_url) {
      toast.error('يرجى تحميل صورة البطاقة الوطنية')
      return false
    }

    if (!formData.personal_image_url) {
      toast.error('يرجى تحميل صورتك الشخصية')
      return false
    }

    if (!formData.store_image_url) {
      toast.error('يرجى تحميل صورة المتجر')
      return false
    }

    return true
  }

  /**
   * Validate step 4 (payment)
   */
  const validateStep4 = (): boolean => {
    if (!formData.payment_screenshot_url) {
      toast.error('يرجى تحميل إيصال الدفع')
      return false
    }

    return true
  }

  /**
   * Move to next step with validation
   */
  const goToNextStep = (): boolean => {
    let isValid = false

    switch (step) {
      case 1:
        isValid = validateStep1()
        break
      case 2:
        isValid = validateStep2()
        break
      case 3:
        isValid = validateStep3()
        break
      case 4:
        isValid = validateStep4()
        break
      default:
        isValid = true
    }

    if (isValid && step < 4) {
      setStep(step + 1)
    }

    return isValid
  }

  /**
   * Move to previous step
   */
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  /**
   * Submit vendor registration
   */
  const submitRegistration = async (): Promise<boolean> => {
    if (!validateStep4()) {
      return false
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      // Format phone numbers
      const fullPhone = `+222${formData.phoneDigits}`
      const fullWhatsApp = formData.whatsappDigits
        ? `+222${formData.whatsappDigits}`
        : null

      // Get package price
      const packagePrice = formData.package_plan === '2_months' ? 1600 : 1250

      // Insert vendor request
      const { data, error } = await supabase
        .from('vendor_requests')
        .insert({
          business_name: formData.business_name,
          owner_name: formData.owner_name,
          phone: fullPhone,
          password: formData.password,
          whatsapp_number: fullWhatsApp,
          region_id: formData.region_id || null,
          city_id: formData.city_id || null,
          address: formData.address || null,
          package_plan: formData.package_plan,
          package_price: packagePrice,
          referred_by_code: formData.referral_code || null,
          nni_image_url: formData.nni_image_url,
          personal_image_url: formData.personal_image_url,
          store_image_url: formData.store_image_url,
          payment_screenshot_url: formData.payment_screenshot_url,
          status: 'pending',
        })
        .select()

      if (error) {
        console.error('Registration error:', error)
        toast.error('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى')
        return false
      }

      // Save phone to localStorage for future reference
      localStorage.setItem('vendor_registration_phone', fullPhone)

      toast.success('تم إرسال طلبك بنجاح!')
      setSuccess(true)
      return true
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('حدث خطأ غير متوقع')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return {
    // State
    step,
    formData,
    submitting,
    success,
    loading,
    pendingRequest,
    passwordError,

    // Actions
    setFormData,
    setStep,
    goToNextStep,
    goToPreviousStep,
    submitRegistration,
    validatePassword,
    checkInitialPhone,
    checkExistingRequest,
  }
}
