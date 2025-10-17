'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Phone, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [phoneDigits, setPhoneDigits] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneDigits || !password) {
      toast.error('الرجاء إدخال رقم الهاتف وكلمة المرور')
      return
    }

    if (phoneDigits.length !== 8) {
      toast.error('رقم الهاتف يجب أن يتكون من 8 أرقام')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Full phone number with +222 prefix
      const fullPhone = `+222${phoneDigits}`

      // Convert phone to generated email format: phone@rimmarsa.com
      const cleanPhone = fullPhone.replace(/[\s+\-()]/g, '')
      const generatedEmail = `${cleanPhone}@rimmarsa.com`

      // Try to authenticate with Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: generatedEmail,
        password,
      })

      // If auth fails, try vendor table authentication
      if (authError) {
        console.log('Auth failed, trying vendor table authentication')

        // Look up vendor by phone
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id, business_name, password_hash, is_active, is_approved')
          .eq('phone', fullPhone)
          .single()

        if (vendorError || !vendorData) {
          throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة')
        }

        if (!vendorData.is_active) {
          throw new Error('حسابك غير نشط. يرجى الاتصال بالدعم')
        }

        if (!vendorData.is_approved) {
          throw new Error('حسابك لم تتم الموافقة عليه بعد. يرجى الانتظار حتى تتم مراجعة طلبك')
        }

        // Verify password using RPC function
        const { data: passwordValid, error: verifyError } = await supabase.rpc('verify_vendor_password', {
          vendor_phone: fullPhone,
          password_attempt: password
        })

        if (verifyError || !passwordValid) {
          throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة')
        }

        // Store vendor session in localStorage
        localStorage.setItem('vendor_id', vendorData.id)
        localStorage.setItem('vendor_name', vendorData.business_name)
        toast.success('تم تسجيل الدخول بنجاح!')

        // Redirect to vendor dashboard
        setTimeout(() => {
          router.push('/vendor/dashboard')
        }, 500)
      } else if (authData.user) {
        toast.success('تم تسجيل الدخول بنجاح!')

        // Redirect to home or profile
        setTimeout(() => {
          router.push('/')
        }, 500)
      }
    } catch (error: unknown) {
      console.error('Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'فشل تسجيل الدخول'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" dir="rtl">
      <Toaster position="top-center" />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.25, 0.35, 0.25],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full blur-3xl opacity-25"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 mb-6 cursor-pointer"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/50">
                    <ShoppingBag className="w-8 h-8 text-white" />
                  </div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 blur-xl"
                  />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 via-primary-300 to-primary-400 bg-clip-text text-transparent">
                  ريمارسا
                </h1>
              </motion.div>
            </Link>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <Sparkles className="w-5 h-5 text-secondary-400" />
              <p className="text-xl font-semibold text-white">مرحباً بعودتك!</p>
              <Sparkles className="w-5 h-5 text-secondary-400" />
            </motion.div>
            <p className="text-gray-400">سجّل دخولك لمتابعة التسوق</p>
          </div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative"
          >
            {/* Glassmorphism Card */}
            <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/20">
              {/* Glossy Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

              <form onSubmit={handleLogin} className="relative space-y-6">
                {/* Phone Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    رقم الهاتف
                  </label>
                  <div className="relative group">
                    <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-400 transition-colors" />
                    <div className="flex items-center w-full pr-12 pl-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus-within:ring-2 focus-within:ring-primary-400/50 focus-within:border-primary-400/50 transition-all" dir="ltr">
                      <span className="text-gray-300 font-medium">+222</span>
                      <input
                        type="tel"
                        value={phoneDigits}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                          setPhoneDigits(value)
                        }}
                        placeholder="XXXXXXXX"
                        maxLength={8}
                        className="flex-1 ml-1 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">أدخل 8 أرقام فقط</p>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    كلمة المرور
                  </label>
                  <div className="relative group">
                    <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-400 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-12 pl-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-left">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-secondary-400 hover:text-secondary-300 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                {/* Login Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 group-hover:from-primary-600 group-hover:via-primary-700 group-hover:to-primary-600 transition-all duration-300" />

                  {/* Glossy Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />

                  {/* Button Content */}
                  <span className="relative flex items-center justify-center gap-2 text-white">
                    {loading ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        تسجيل الدخول
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </span>
                </motion.button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-gray-400">أو</span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-gray-300">
                    ليس لديك حساب؟{' '}
                    <Link
                      href="/signup"
                      className="text-secondary-400 hover:text-secondary-300 font-semibold transition-colors"
                    >
                      سجّل الآن
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            {/* Glow Effect */}
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary-400/20 to-secondary-500/20 blur-2xl" />
          </motion.div>

          {/* Vendor Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <Link
              href="/vendor/login"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary-400 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              تسجيل دخول البائعين
            </Link>
          </motion.div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
