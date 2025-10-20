'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Store,
  MapPin,
  Calendar,
  Package,
  MessageCircle,
  ChevronLeft,
  Star,
  Phone,
  Mail,
  Globe,
  ShoppingBag,
  TrendingUp,
  Award,
  CheckCircle
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

type VendorProfile = {
  profile_image: string | null
  store_name: string
  vendor_name: string
  total_products: number
  city: string | null
  state: string | null
  whatsapp_number: string | null
  description: string | null
  member_since: string
}

type Product = {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category_id: string
  views_count: number
  created_at: string
}

export default function VendorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest')

  useEffect(() => {
    if (id) {
      fetchVendorData()
    }
  }, [id])

  useEffect(() => {
    if (products.length > 0) {
      sortProducts()
    }
  }, [sortBy])

  const fetchVendorData = async () => {
    try {
      const supabase = createClient()

      // Fetch vendor profile
      const { data: vendorData, error: vendorError } = await supabase
        .rpc('get_public_vendor_profile', {
          vendor_uuid: id,
        })
        .single()

      if (vendorError || !vendorData) {
        toast.error('Vendor not found')
        router.push('/vendors')
        return
      }

      setVendor(vendorData as VendorProfile)

      // Fetch vendor's products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])
    } catch (error) {
      console.error('Error fetching vendor:', error)
      toast.error('Failed to load vendor profile')
    } finally {
      setLoading(false)
    }
  }

  const sortProducts = () => {
    const sorted = [...products]
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'price-low') {
      sorted.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      sorted.sort((a, b) => b.price - a.price)
    }
    setProducts(sorted)
  }

  const handleWhatsAppClick = () => {
    if (!vendor?.whatsapp_number) return

    const cleanPhone = vendor.whatsapp_number.replace(/\D/g, '')
    const message = `مرحباً! أنا مهتم بمنتجاتك في ريمارسا.

🏪 ${vendor.store_name}

أريد الاستفسار عن منتجاتكم.`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
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

  if (!vendor) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Toaster position="top-center" />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm mb-8 text-white/80" dir="rtl">
            <Link href="/" className="hover:text-white transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="w-4 h-4" />
            <Link href="/vendors" className="hover:text-white transition-colors">
              البائعون
            </Link>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-white font-medium">{vendor.store_name}</span>
          </nav>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Vendor Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative flex-shrink-0"
            >
              <div className="w-40 h-40 rounded-3xl bg-white p-2 shadow-2xl">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                  {vendor.profile_image ? (
                    <img
                      src={vendor.profile_image}
                      alt={vendor.store_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-20 h-20 text-gray-400" />
                  )}
                </div>
              </div>
              {/* Verified Badge */}
              <div className="absolute -bottom-3 -right-3 bg-yellow-500 text-black rounded-full p-3 shadow-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            </motion.div>

            {/* Vendor Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 text-center md:text-right"
              dir="rtl"
            >
              <div className="flex items-center gap-3 justify-center md:justify-start mb-6">
                <h1 className="text-4xl md:text-5xl font-bold">{vendor.store_name}</h1>
                <Award className="w-8 h-8 text-yellow-400" />
              </div>

              {vendor.description && (
                <p className="text-lg text-white/80 leading-relaxed mb-6 max-w-2xl">
                  {vendor.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    <span className="font-bold text-2xl">{vendor.total_products}</span>
                    <span className="text-white/80">منتج</span>
                  </div>
                </div>
                {(vendor.city || vendor.state) && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {vendor.city && <span className="font-bold">{vendor.city}</span>}
                      {vendor.state && <span className="text-white/80">{vendor.state}</span>}
                    </div>
                  </div>
                )}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-white/80">عضو منذ</span>
                    <span className="font-bold">
                      {new Date(vendor.member_since).toLocaleDateString('ar-MR', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Button */}
              {vendor.whatsapp_number && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWhatsAppClick}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all"
                >
                  <MessageCircle className="w-6 h-6" />
                  تواصل عبر واتساب
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full">
            <path
              fill="#111827"
              fillOpacity="1"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            ></path>
          </svg>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8" dir="rtl">
          <h2 className="text-3xl font-bold text-white mb-4 sm:mb-0 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-yellow-400" />
            المنتجات ({products.length})
          </h2>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm">ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-low' | 'price-high')}
              className="px-4 py-2 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-800 text-white"
            >
              <option value="newest">الأحدث</option>
              <option value="price-low">السعر: من الأقل للأعلى</option>
              <option value="price-high">السعر: من الأعلى للأقل</option>
            </select>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                <Link
                  href={`/products/${product.id}`}
                  className="group block bg-gray-800/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-yellow-500/20 border border-yellow-500/30 transition-all duration-300"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 text-white text-sm">
                          <TrendingUp className="w-4 h-4" />
                          {product.views_count?.toLocaleString() || 0} مشاهدة
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4" dir="rtl">
                    <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                      {product.price.toLocaleString()} أوقية
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-lg border border-yellow-500/30 p-16 text-center"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-16 h-16 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">لا توجد منتجات حالياً</h3>
            <p className="text-gray-300 mb-6">
              هذا البائع لم يضف أي منتجات بعد. تحقق مرة أخرى لاحقاً!
            </p>
            <Link
              href="/vendors"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              تصفح بائعين آخرين
            </Link>
          </motion.div>
        )}
      </div>

      {/* Contact Section */}
      {vendor.whatsapp_number && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-500/30 p-8 md:p-12 text-center"
              dir="rtl"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                لديك استفسار عن المنتجات؟
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                تواصل مباشرة مع {vendor.store_name} عبر واتساب للحصول على معلومات أكثر عن المنتجات والأسعار
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWhatsAppClick}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold px-10 py-5 rounded-2xl shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all text-lg"
              >
                <MessageCircle className="w-7 h-7" />
                ابدأ المحادثة الآن
              </motion.button>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}
