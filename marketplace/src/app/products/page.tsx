'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, SlidersHorizontal, Grid3x3, List, X, ChevronDown,
  MapPin, Heart, ShoppingBag, TrendingUp, Sparkles, Filter
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import MobileBottomNav from '@/components/mobile/MobileBottomNav'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Region = Database['public']['Tables']['regions']['Row']
type City = Database['public']['Tables']['cities']['Row']

export default function ProductsPage() {
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest')

  // UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [selectedCategory, selectedRegion, selectedCity, minPrice, maxPrice, searchQuery, sortBy])

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true })

      setCategories(categoriesData || [])

      // Fetch regions
      const { data: regionsData } = await supabase
        .from('regions')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      setRegions(regionsData || [])

      // Fetch cities
      const { data: citiesData } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      setCities(citiesData || [])

      // Build products query
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      // Apply filters
      if (selectedCategory) query = query.eq('category_id', selectedCategory)
      if (selectedRegion) query = query.eq('region_id', selectedRegion)
      if (selectedCity) query = query.eq('city_id', selectedCity)
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }
      if (minPrice) query = query.gte('price', parseFloat(minPrice))
      if (maxPrice) query = query.lte('price', parseFloat(maxPrice))

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'price-low') {
        query = query.order('price', { ascending: true })
      } else if (sortBy === 'price-high') {
        query = query.order('price', { ascending: false })
      } else if (sortBy === 'popular') {
        query = query.order('views_count', { ascending: false })
      }

      const { data: productsData, count } = await query.limit(50)

      setProducts(productsData || [])
      setTotalProducts(count || 0)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('حدث خطأ أثناء تحميل المنتجات')
    } finally {
      setLoading(false)
    }
  }

  const updateURL = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedRegion) params.set('region_id', selectedRegion)
    if (selectedCity) params.set('city_id', selectedCity)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    router.push(`/products?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedRegion('')
    setSelectedCity('')
    setMinPrice('')
    setMaxPrice('')
    router.push('/products')
  }

  const filteredCities = cities.filter(city =>
    !selectedRegion || city.region_id === selectedRegion
  )

  const hasActiveFilters = selectedCategory || selectedRegion || selectedCity || minPrice || maxPrice || searchQuery

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId)
      toast.success('تمت الإزالة من المفضلة')
    } else {
      newFavorites.add(productId)
      toast.success('تمت الإضافة للمفضلة')
    }
    setFavorites(newFavorites)
  }

  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pb-20 md:pb-0">
      <Toaster position="top-center" />

      {/* Hero Section with Search */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden border-b border-yellow-500/20">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-600 rounded-full blur-3xl"
          />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                اكتشف منتجاتنا
              </h1>
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              {totalProducts.toLocaleString()} منتج من البائعين المحليين
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <div className="relative group">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && updateURL()}
                  placeholder="ابحث عن المنتجات..."
                  className="w-full pr-14 pl-14 py-5 rounded-2xl bg-gray-800 border border-yellow-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-yellow-500/50 shadow-2xl shadow-yellow-500/10 text-lg"
                  dir="rtl"
                />
                <button
                  onClick={updateURL}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all shadow-lg"
                >
                  بحث
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}
          >
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-xl shadow-yellow-500/10 p-6 sticky top-8 border border-yellow-500/20">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-bold text-white">الفلاتر</h2>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    مسح الكل
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-300 mb-3" dir="rtl">
                  الفئة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.slice(0, 6).map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedCategory(category.id === selectedCategory ? '' : category.id)
                      }}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedCategory === category.id
                          ? 'border-yellow-500 bg-yellow-500/20 shadow-md shadow-yellow-500/50'
                          : 'border-yellow-500/20 hover:border-yellow-500/40 bg-gray-900/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{category.icon}</div>
                      <div className="text-xs font-semibold text-white line-clamp-1">
                        {category.name_ar}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-300 mb-3" dir="rtl">
                  المنطقة
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value)
                    setSelectedCity('')
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-yellow-500/20 bg-gray-900/50 text-white focus:border-yellow-500 focus:outline-none transition-colors"
                  dir="rtl"
                >
                  <option value="">كل المناطق</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-300 mb-3" dir="rtl">
                  المدينة
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedRegion}
                  className="w-full px-4 py-3 rounded-xl border-2 border-yellow-500/20 bg-gray-900/50 text-white focus:border-yellow-500 focus:outline-none transition-colors disabled:bg-gray-700/30 disabled:cursor-not-allowed"
                  dir="rtl"
                >
                  <option value="">كل المدن</option>
                  {filteredCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-300 mb-3" dir="rtl">
                  نطاق السعر (أوقية)
                </label>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="الحد الأدنى"
                    className="w-full px-4 py-3 rounded-xl border-2 border-yellow-500/20 bg-gray-900/50 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none transition-colors"
                    dir="rtl"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="الحد الأقصى"
                    className="w-full px-4 py-3 rounded-xl border-2 border-yellow-500/20 bg-gray-900/50 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none transition-colors"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Apply Filters Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={updateURL}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-yellow-500/50 transition-all"
              >
                تطبيق الفلاتر
              </motion.button>
            </div>
          </motion.aside>

          {/* Products Section */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-lg shadow-yellow-500/10 p-4 mb-6 border border-yellow-500/20">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-yellow-500 text-yellow-400 font-semibold hover:bg-yellow-500/20 transition-colors"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    فلاتر
                  </button>

                  <p className="text-gray-300 font-semibold" dir="rtl">
                    <span className="text-yellow-400 font-bold">{products.length}</span> منتج
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Toggle */}
                  <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === 'grid'
                          ? 'bg-yellow-500/20 text-yellow-400 shadow-md'
                          : 'text-gray-400 hover:text-yellow-400'
                      }`}
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === 'list'
                          ? 'bg-yellow-500/20 text-yellow-400 shadow-md'
                          : 'text-gray-400 hover:text-yellow-400'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-low' | 'price-high' | 'popular')}
                      className="appearance-none px-4 py-2 pr-10 rounded-xl border-2 border-yellow-500/20 bg-gray-900/50 text-white focus:border-yellow-500 focus:outline-none font-semibold cursor-pointer hover:border-yellow-500/40 transition-colors"
                      dir="rtl"
                    >
                      <option value="newest">الأحدث</option>
                      <option value="popular">الأكثر مشاهدة</option>
                      <option value="price-low">السعر: من الأقل للأعلى</option>
                      <option value="price-high">السعر: من الأعلى للأقل</option>
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Active Filters Chips */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-yellow-500/20">
                  {selectedCategory && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold border border-yellow-500/30"
                    >
                      <span>{getCategoryById(selectedCategory)?.name_ar}</span>
                      <button onClick={() => setSelectedCategory('')}>
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                  {searchQuery && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-semibold border border-blue-500/30"
                    >
                      <span>البحث: {searchQuery}</span>
                      <button onClick={() => setSearchQuery('')}>
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                  {(minPrice || maxPrice) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold border border-green-500/30"
                    >
                      <span>
                        {minPrice && maxPrice
                          ? `${minPrice} - ${maxPrice} أوقية`
                          : minPrice
                          ? `من ${minPrice} أوقية`
                          : `حتى ${maxPrice} أوقية`}
                      </span>
                      <button onClick={() => { setMinPrice(''); setMaxPrice('') }}>
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                  <ShoppingBag className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-yellow-400" />
                </div>
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="text-8xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2" dir="rtl">
                  لم نجد أي منتجات
                </h3>
                <p className="text-gray-300 mb-6" dir="rtl">
                  جرب تعديل الفلاتر أو البحث بكلمات مختلفة
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-yellow-500/50 transition-all"
                >
                  مسح جميع الفلاتر
                </button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      {viewMode === 'grid' ? (
                        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-lg shadow-yellow-500/10 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 overflow-hidden border border-yellow-500/20 h-full flex flex-col">
                          {/* Product Image */}
                          <Link href={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-8xl">
                                📦
                              </div>
                            )}

                            {/* Favorite Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                toggleFavorite(product.id)
                              }}
                              className="absolute top-3 left-3 w-10 h-10 rounded-full bg-gray-900/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-yellow-500/20 border border-yellow-500/30 transition-all z-10"
                            >
                              <Heart
                                className={`w-5 h-5 transition-all ${
                                  favorites.has(product.id)
                                    ? 'fill-red-500 text-red-500'
                                    : 'text-yellow-400'
                                }`}
                              />
                            </button>

                            {/* Badge */}
                            {product.views_count && product.views_count > 100 && (
                              <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                رائج
                              </div>
                            )}
                          </Link>

                          {/* Product Info */}
                          <div className="p-4 flex-1 flex flex-col">
                            <Link href={`/products/${product.id}`}>
                              <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors" dir="rtl">
                                {product.name}
                              </h3>
                            </Link>

                            <p className="text-sm text-gray-300 mb-3 line-clamp-2" dir="rtl">
                              {product.description}
                            </p>

                            <div className="mt-auto">
                              {/* Price */}
                              <div className="mb-3">
                                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                                  {product.price.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-300 mr-1">أوقية</span>
                              </div>

                              {/* Location */}
                              {product.city_deprecated && (
                                <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-900/50 border border-yellow-500/20 px-3 py-1 rounded-full w-fit" dir="rtl">
                                  <MapPin className="w-3 h-3" />
                                  {product.city_deprecated}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={`/products/${product.id}`}
                          className="flex gap-4 bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-lg shadow-yellow-500/10 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 overflow-hidden border border-yellow-500/20 p-4"
                        >
                          {/* Image */}
                          <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 flex-shrink-0">
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">
                                📦
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0" dir="rtl">
                            <h3 className="font-bold text-xl text-white mb-2 group-hover:text-yellow-400 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                                  {product.price.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-300 mr-1">أوقية</span>
                              </div>
                              {product.city_deprecated && (
                                <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-900/50 border border-yellow-500/20 px-3 py-1 rounded-full">
                                  <MapPin className="w-3 h-3" />
                                  {product.city_deprecated}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Favorite */}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              toggleFavorite(product.id)
                            }}
                            className="w-10 h-10 rounded-full bg-gray-900/50 border border-yellow-500/20 hover:bg-yellow-500/20 flex items-center justify-center transition-all flex-shrink-0"
                          >
                            <Heart
                              className={`w-5 h-5 transition-all ${
                                favorites.has(product.id)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-yellow-400'
                              }`}
                            />
                          </button>
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
