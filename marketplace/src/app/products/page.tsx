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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster position="top-center" />

      {/* Hero Section with Search */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white overflow-hidden">
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
            className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"
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
            className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-400 rounded-full blur-3xl"
          />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-secondary-400" />
              <h1 className="text-4xl md:text-6xl font-bold">
                اكتشف منتجاتنا
              </h1>
              <Sparkles className="w-6 h-6 text-secondary-400" />
            </div>
            <p className="text-xl md:text-2xl text-primary-100 mb-8">
              {totalProducts.toLocaleString()} منتج من البائعين المحليين
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <div className="relative group">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && updateURL()}
                  placeholder="ابحث عن المنتجات..."
                  className="w-full pr-14 pl-14 py-5 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-300/50 shadow-2xl text-lg"
                  dir="rtl"
                />
                <button
                  onClick={updateURL}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg"
                >
                  بحث
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full">
            <path
              fill="#f9fafb"
              fillOpacity="1"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            ></path>
          </svg>
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
            <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-8 border border-gray-100">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-900">الفلاتر</h2>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    مسح الكل
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3" dir="rtl">
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
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{category.icon}</div>
                      <div className="text-xs font-semibold text-gray-700 line-clamp-1">
                        {category.name_ar}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3" dir="rtl">
                  المنطقة
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value)
                    setSelectedCity('')
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors"
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
                <label className="block text-sm font-bold text-gray-700 mb-3" dir="rtl">
                  المدينة
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedRegion}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
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
                <label className="block text-sm font-bold text-gray-700 mb-3" dir="rtl">
                  نطاق السعر (أوقية)
                </label>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="الحد الأدنى"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors"
                    dir="rtl"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="الحد الأقصى"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Apply Filters Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={updateURL}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                تطبيق الفلاتر
              </motion.button>
            </div>
          </motion.aside>

          {/* Products Section */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary-500 text-primary-600 font-semibold hover:bg-primary-50 transition-colors"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    فلاتر
                  </button>

                  <p className="text-gray-600 font-semibold" dir="rtl">
                    <span className="text-primary-600 font-bold">{products.length}</span> منتج
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Toggle */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === 'grid'
                          ? 'bg-white text-primary-600 shadow-md'
                          : 'text-gray-600 hover:text-primary-600'
                      }`}
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === 'list'
                          ? 'bg-white text-primary-600 shadow-md'
                          : 'text-gray-600 hover:text-primary-600'
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
                      className="appearance-none px-4 py-2 pr-10 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none font-semibold text-gray-700 cursor-pointer hover:border-primary-300 transition-colors"
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
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                  {selectedCategory && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold"
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
                      className="flex items-center gap-2 bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full text-sm font-semibold"
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
                      className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold"
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
                  <div className="w-20 h-20 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                  <ShoppingBag className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary-600" />
                </div>
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="text-8xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2" dir="rtl">
                  لم نجد أي منتجات
                </h3>
                <p className="text-gray-600 mb-6" dir="rtl">
                  جرب تعديل الفلاتر أو البحث بكلمات مختلفة
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
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
                        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 h-full flex flex-col">
                          {/* Product Image */}
                          <Link href={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
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
                              className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all z-10"
                            >
                              <Heart
                                className={`w-5 h-5 transition-all ${
                                  favorites.has(product.id)
                                    ? 'fill-red-500 text-red-500'
                                    : 'text-gray-600'
                                }`}
                              />
                            </button>

                            {/* Badge */}
                            {product.views_count && product.views_count > 100 && (
                              <div className="absolute top-3 right-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                رائج
                              </div>
                            )}
                          </Link>

                          {/* Product Info */}
                          <div className="p-4 flex-1 flex flex-col">
                            <Link href={`/products/${product.id}`}>
                              <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors" dir="rtl">
                                {product.name}
                              </h3>
                            </Link>

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2" dir="rtl">
                              {product.description}
                            </p>

                            <div className="mt-auto">
                              {/* Price */}
                              <div className="mb-3">
                                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                                  {product.price.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-600 mr-1">أوقية</span>
                              </div>

                              {/* Location */}
                              {product.city_deprecated && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full w-fit" dir="rtl">
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
                          className="flex gap-4 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 p-4"
                        >
                          {/* Image */}
                          <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
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
                            <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                                  {product.price.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-600 mr-1">أوقية</span>
                              </div>
                              {product.city_deprecated && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
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
                            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all flex-shrink-0"
                          >
                            <Heart
                              className={`w-5 h-5 transition-all ${
                                favorites.has(product.id)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-gray-600'
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
    </div>
  )
}
