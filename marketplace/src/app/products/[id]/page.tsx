'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  MapPin,
  Store,
  Phone,
  Share2,
  Heart,
  ShoppingBag,
  MessageCircle,
  Package,
  Calendar,
  Star
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

type Product = {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category_id: string
  vendor_id: string
  city: string
  state: string
  views: number
  created_at: string
  is_active: boolean
}

type Category = {
  id: string
  name: string
  name_ar: string
  icon: string
}

type VendorProfile = {
  profile_image: string | null
  store_name: string
  vendor_name: string
  total_products: number
  city: string
  state: string
  whatsapp_number: string
  description: string | null
  member_since: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [moreProducts, setMoreProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProductData()
    }
  }, [id])

  const fetchProductData = async () => {
    try {
      const supabase = createClient()

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (productError || !productData) {
        toast.error('Product not found')
        router.push('/products')
        return
      }

      setProduct(productData)

      // Fetch category
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', productData.category_id)
        .single()

      setCategory(categoryData)

      // Fetch vendor profile
      const { data: vendorData } = await supabase
        .rpc('get_public_vendor_profile', {
          vendor_uuid: productData.vendor_id,
        })
        .single()

      setVendor(vendorData)

      // Increment view count
      await supabase
        .from('products')
        .update({ views: (productData.views || 0) + 1 })
        .eq('id', id)

      // Fetch more products from same vendor
      const { data: moreData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', productData.vendor_id)
        .eq('is_active', true)
        .neq('id', id)
        .limit(4)

      setMoreProducts(moreData || [])
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppClick = () => {
    if (!vendor?.whatsapp_number || !product) return

    const cleanPhone = vendor.whatsapp_number.replace(/\D/g, '')
    const message = `مرحباً! أنا مهتم بهذا المنتج من ريمارسا:

📦 ${product.name}
💰 ${product.price.toLocaleString()} أوقية

هل المنتج متوفر؟`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Check out ${product?.name} on Rimmarsa`,
          url: url,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  const nextImage = () => {
    if (product?.images) {
      setSelectedImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (product?.images) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const images = product.images && product.images.length > 0 ? product.images : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Toaster position="top-center" />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-primary-400 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              className="absolute left-4 text-white hover:text-primary-400 transition-colors"
            >
              <ChevronLeft className="w-12 h-12" />
            </button>

            <motion.img
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={images[selectedImageIndex]}
              alt={product.name}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              className="absolute right-4 text-white hover:text-primary-400 transition-colors"
            >
              <ChevronRight className="w-12 h-12" />
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex(idx)
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === selectedImageIndex
                      ? 'bg-primary-500 w-8'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm mb-8" dir="rtl">
          <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
            الرئيسية
          </Link>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
          <Link href="/products" className="text-gray-600 hover:text-primary-600 transition-colors">
            المنتجات
          </Link>
          {category && (
            <>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
              <Link
                href={`/products?category=${category.id}`}
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                {category.icon} {category.name_ar || category.name}
              </Link>
            </>
          )}
          <ChevronLeft className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main Image */}
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl mb-4 group">
              {images.length > 0 ? (
                <div
                  className="aspect-square cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                >
                  <motion.img
                    key={selectedImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={images[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Package className="w-32 h-32 text-gray-400" />
                </div>
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                      idx === selectedImageIndex
                        ? 'ring-4 ring-primary-500 shadow-lg'
                        : 'ring-2 ring-gray-200 hover:ring-primary-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            dir="rtl"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 sticky top-8">
              {/* Title and Actions */}
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900 flex-1">{product.name}</h1>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-3 rounded-xl transition-all ${
                      isFavorite
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    className="p-3 rounded-xl bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                    {product.price.toLocaleString()}
                  </span>
                  <span className="text-2xl text-gray-600">أوقية</span>
                </div>
              </div>

              {/* Meta Info */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                {category && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl">
                      {category.icon}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">الفئة</p>
                      <Link
                        href={`/products?category=${category.id}`}
                        className="font-semibold text-primary-600 hover:text-primary-700"
                      >
                        {category.name_ar || category.name}
                      </Link>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الموقع</p>
                    <p className="font-semibold text-gray-900">
                      {product.city}, {product.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">المشاهدات</p>
                    <p className="font-semibold text-gray-900">{product.views.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary-600" />
                  الوصف
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* WhatsApp Button */}
              {vendor?.whatsapp_number && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWhatsAppClick}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all mb-4"
                >
                  <MessageCircle className="w-6 h-6" />
                  تواصل مع البائع عبر واتساب
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Vendor Info Section */}
        {vendor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-white via-primary-50/30 to-white rounded-3xl shadow-2xl p-8 mb-12"
            dir="rtl"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Store className="w-6 h-6 text-primary-600" />
              معلومات البائع
            </h2>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Vendor Avatar */}
              <Link href={`/vendors/${product.vendor_id}`} className="flex-shrink-0 group">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-1">
                    <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                      {vendor.profile_image ? (
                        <img
                          src={vendor.profile_image}
                          alt={vendor.store_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-10 h-10 text-primary-600" />
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
                    <span className="text-xs">✓</span>
                  </div>
                </div>
              </Link>

              {/* Vendor Details */}
              <div className="flex-1">
                <Link
                  href={`/vendors/${product.vendor_id}`}
                  className="text-2xl font-bold text-gray-900 hover:text-primary-600 transition-colors inline-block mb-2"
                >
                  {vendor.store_name}
                </Link>
                <p className="text-gray-600 mb-4">{vendor.vendor_name}</p>

                {vendor.description && (
                  <p className="text-gray-700 leading-relaxed mb-4 line-clamp-2">
                    {vendor.description}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-primary-600">{vendor.total_products}</p>
                    <p className="text-xs text-gray-600">منتج</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="w-4 h-4 text-secondary-600" />
                    </div>
                    <p className="text-xs text-gray-900 font-semibold">{vendor.city}</p>
                    <p className="text-xs text-gray-600">{vendor.state}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-900 font-semibold">عضو منذ</p>
                    <p className="text-xs text-gray-600">
                      {new Date(vendor.member_since).toLocaleDateString('ar-MR', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/vendors/${product.vendor_id}`}
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
                >
                  زيارة المتجر
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* More from this seller */}
        {moreProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            dir="rtl"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-primary-600" />
              منتجات أخرى من نفس البائع
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {moreProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * idx }}
                >
                  <Link
                    href={`/products/${p.id}`}
                    className="group block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {p.images && p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                        {p.price.toLocaleString()} أوقية
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
