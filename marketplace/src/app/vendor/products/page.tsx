'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import VendorLayout from '@/components/vendor/VendorLayout'
import { motion } from 'framer-motion'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  name_ar: string
  description: string
  price: number
  compare_at_price: number | null
  images: string[]
  is_active: boolean
  stock_quantity: number
  views_count: number
  created_at: string
  categories?: { name: string; name_ar: string }
}

export default function VendorProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    const storedVendor = localStorage.getItem('vendor')
    if (!storedVendor) {
      router.push('/vendor/login')
      return
    }

    const vendor = JSON.parse(storedVendor)
    setVendorId(vendor.id)
    fetchProducts(vendor.id)
  }, [router])

  useEffect(() => {
    const filtered = products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name_ar?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active)

      return matchesSearch && matchesStatus
    })

    setFilteredProducts(filtered)
  }, [searchQuery, statusFilter, products])

  const fetchProducts = async (vendorId: string) => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('فشل في تحميل المنتجات')
    } finally {
      setLoading(false)
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId)

      if (error) throw error

      toast.success(currentStatus ? 'تم إخفاء المنتج' : 'تم تفعيل المنتج')
      if (vendorId) fetchProducts(vendorId)
    } catch (error) {
      console.error('Error toggling product status:', error)
      toast.error('فشل في تحديث حالة المنتج')
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast.success('تم حذف المنتج بنجاح')
      if (vendorId) fetchProducts(vendorId)
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('فشل في حذف المنتج')
    }
  }

  if (loading) {
    return (
      <VendorLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 font-medium">جاري تحميل المنتجات...</p>
          </div>
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                  منتجاتي
                </h1>
                <p className="text-gray-400">إدارة جميع منتجاتك</p>
              </div>
            </div>
            <Link href="/vendor/products/add">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30"
              >
                <Plus className="w-5 h-5" />
                إضافة منتج
              </motion.button>
            </Link>
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
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
            <div className="relative">
              <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors appearance-none"
              >
                <option value="all">جميع المنتجات</option>
                <option value="active">المنتجات النشطة</option>
                <option value="inactive">المنتجات المخفية</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-12 text-center"
          >
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-500 mb-6">ابدأ بإضافة منتجك الأول</p>
            <Link href="/vendor/products/add">
              <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-xl transition-all">
                إضافة منتج
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl overflow-hidden hover:border-yellow-500/40 transition-all group"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-800">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      product.is_active
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {product.is_active ? 'نشط' : 'مخفي'}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  {product.categories && (
                    <p className="text-xs text-gray-500 mb-2">{product.categories.name_ar}</p>
                  )}
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">{product.price} MRU</p>
                      {product.compare_at_price && (
                        <p className="text-sm text-gray-500 line-through">
                          {product.compare_at_price} MRU
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">المخزون: {product.stock_quantity}</p>
                      <p className="text-xs text-gray-500">المشاهدات: {product.views_count}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/vendor/products/${product.id}/edit`} className="flex-1">
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                        تعديل
                      </button>
                    </Link>
                    <button
                      onClick={() => toggleProductStatus(product.id, product.is_active)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors"
                    >
                      {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {product.is_active ? 'إخفاء' : 'تفعيل'}
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </VendorLayout>
  )
}
