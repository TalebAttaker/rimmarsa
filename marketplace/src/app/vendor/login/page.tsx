'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Phone, Lock, Store, ArrowRight } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

export default function VendorLoginPage() {
  const router = useRouter()
  const [phoneDigits, setPhoneDigits] = useState('')
  const [password, setPassword] = useState('')
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
      // SECURITY FIX (FIX-009): Use secure API endpoint instead of direct Supabase calls
      // This ensures server-side authentication and HttpOnly cookie-based session management
      const response = await fetch('/api/vendor/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies in request
        body: JSON.stringify({
          phoneDigits,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error(data.error || 'محاولات تسجيل دخول كثيرة جداً. يرجى المحاولة بعد 15 دقيقة')
        }
        throw new Error(data.error || 'رقم الهاتف أو كلمة المرور غير صحيحة')
      }

      if (!data.success || !data.vendor) {
        throw new Error('فشل تسجيل الدخول')
      }

      // Store ONLY non-sensitive vendor data in localStorage for UI purposes
      // Authentication tokens are now in secure HttpOnly cookies (set by API)
      const vendorSession = {
        id: data.vendor.id,
        business_name: data.vendor.business_name,
        phone: data.vendor.phone,
        logo_url: data.vendor.logo_url,
        is_verified: data.vendor.is_verified,
        // NOTE: No tokens stored here! Tokens are in HttpOnly cookies only
      }
      localStorage.setItem('vendor', JSON.stringify(vendorSession))
      localStorage.setItem('vendorLoginTime', Date.now().toString())

      toast.success(`مرحباً ${data.vendor.business_name}!`)

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/vendor/dashboard')
      }, 500)
    } catch (error: unknown) {
      console.error('Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'فشل تسجيل الدخول'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4" dir="rtl">
      <Toaster position="top-center" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                <Store className="w-7 h-7 text-black" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                ريمارسا
              </h1>
            </div>
          </Link>
          <p className="text-gray-400">لوحة تحكم البائع</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">تسجيل الدخول</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Phone Input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="flex items-center w-full pr-12 pl-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus-within:border-yellow-500 transition-colors" dir="ltr">
                  <span className="text-gray-400 font-medium">+222</span>
                  <input
                    type="tel"
                    value={phoneDigits}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                      setPhoneDigits(value)
                    }}
                    placeholder="XXXXXXXX"
                    maxLength={8}
                    className="flex-1 ml-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">أدخل 8 أرقام فقط</p>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full pr-12 pl-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/30"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              ليس لديك حساب؟{' '}
              <Link href="/" className="text-yellow-400 hover:text-yellow-300 font-medium">
                سجل كبائع
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors">
            ← العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
