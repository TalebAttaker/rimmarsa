'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import VendorLayout from '@/components/vendor/VendorLayout'
import { motion } from 'framer-motion'
import {
  Upload,
  X,
  Save,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Category {
  id: string
  name: string
  name_ar: string
}

const MAX_IMAGES = 6

export default function AddProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [vendorRegionId, setVendorRegionId] = useState<string | null>(null)
  const [vendorCityId, setVendorCityId] = useState<string | null>(null)

  // Categories
  const [categories, setCategories] = useState<Category[]>([])

  // Form data (removed region_id and city_id as they come from vendor)
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    stock_quantity: '0',
    is_active: true
  })

  // Images
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  useEffect(() => {
    const storedVendor = localStorage.getItem('vendor')
    if (!storedVendor) {
      router.push('/vendor/login')
      return
    }

    const vendor = JSON.parse(storedVendor)
    setVendorId(vendor.id)
    fetchVendorAndFormData(vendor.id)
  }, [router])

  const fetchVendorAndFormData = async (vendorId: string) => {
    try {
      const supabase = createClient()

      // Fetch vendor's region and city along with categories
      const [vendorRes, categoriesRes] = await Promise.all([
        supabase.from('vendors').select('region_id, city_id').eq('id', vendorId).single(),
        supabase.from('categories').select('*').eq('is_active', true).order('order')
      ])

      if (vendorRes.data) {
        setVendorRegionId(vendorRes.data.region_id)
        setVendorCityId(vendorRes.data.city_id)
      }

      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error fetching form data:', error)
      toast.error('فشل في تحميل البيانات')
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`يمكنك إضافة ${MAX_IMAGES} صور كحد أقصى`)
      return
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ليس ملف صورة صالح`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} حجمه كبير جداً (الحد الأقصى 5MB)`)
        return false
      }
      return true
    })

    setImages(prev => [...prev, ...validFiles])

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return []

    setUploadingImages(true)
    const uploadedUrls: string[] = []

    try {
      const supabase = createClient()

      for (const image of images) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${vendorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      return uploadedUrls
    } catch (error) {
      console.error('Error uploading images:', error)
      throw new Error('فشل في رفع الصور')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!vendorId) return

    if (!formData.name || !formData.price || !formData.category_id) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة')
      return
    }

    if (images.length === 0) {
      toast.error('الرجاء إضافة صورة واحدة على الأقل')
      return
    }

    setLoading(true)

    try {
      // Upload images first
      const imageUrls = await uploadImages()

      // Create product using secure RPC function
      // Use vendor's region_id and city_id automatically
      const supabase = createClient()
      const { data: productId, error } = await supabase.rpc('vendor_insert_product', {
        p_vendor_id: vendorId,
        p_name: formData.name,
        p_name_ar: formData.name_ar || formData.name,
        p_description: formData.description || '',
        p_price: parseFloat(formData.price),
        p_compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        p_category_id: formData.category_id,
        p_region_id: vendorRegionId,
        p_city_id: vendorCityId,
        p_stock_quantity: parseInt(formData.stock_quantity) || 0,
        p_is_active: formData.is_active,
        p_images: imageUrls
      })

      if (error) throw error

      toast.success('تم إضافة المنتج بنجاح!')
      setTimeout(() => {
        router.push('/vendor/products')
      }, 1000)
    } catch (error) {
      console.error('Error creating product:', error)
      const errorMessage = error instanceof Error ? error.message : 'فشل في إضافة المنتج'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <VendorLayout>
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
            إضافة منتج جديد
          </h1>
          <p className="text-gray-400 mt-2">املأ المعلومات أدناه لإضافة منتج جديد لمتجرك</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <ImageIcon className="w-6 h-6" />
              صور المنتج (حتى {MAX_IMAGES} صور)
            </h2>

            {/* Image Previews */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                    {index + 1}
                  </div>
                </div>
              ))}

              {/* Upload Button */}
              {images.length < MAX_IMAGES && (
                <label className="h-32 border-2 border-dashed border-gray-600 hover:border-yellow-500 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                  <span className="text-sm text-gray-500">إضافة صورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p>• يمكنك إضافة حتى {MAX_IMAGES} صور للمنتج</p>
                <p>• الصورة الأولى ستكون الصورة الرئيسية</p>
                <p>• الحد الأقصى لحجم الصورة: 5MB</p>
              </div>
            </div>
          </motion.div>

          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-4">المعلومات الأساسية</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  اسم المنتج <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="مثال: هاتف ذكي"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  الاسم بالعربية
                </label>
                <input
                  type="text"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="مثال: هاتف ذكي"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  placeholder="وصف تفصيلي للمنتج..."
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  السعر (أوقية) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  السعر قبل الخصم (اختياري)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  الفئة <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  required
                >
                  <option value="">اختر الفئة</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  الكمية المتوفرة
                </label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-gray-300">نشط (سيظهر المنتج في المتجر)</span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
            >
              {loading || uploadingImages ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  {uploadingImages ? 'جاري رفع الصور...' : 'جاري الحفظ...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ المنتج
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </VendorLayout>
  )
}
