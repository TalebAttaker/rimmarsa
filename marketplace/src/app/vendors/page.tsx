'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Star, Store, Verified, TrendingUp, Sparkles,
  Filter, X, ChevronDown, Phone, Mail, ExternalLink, Package
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import MobileBottomNav from '@/components/mobile/MobileBottomNav'
import { sanitizeSearchQuery } from '@/lib/security/sql-utils'

type Vendor = Database['public']['Tables']['vendors']['Row']
type Region = Database['public']['Tables']['regions']['Row']
type City = Database['public']['Tables']['cities']['Row']

export default function VendorsPage() {
  const router = useRouter()

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [totalVendors, setTotalVendors] = useState(0)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [selectedRegion, selectedCity, searchQuery])

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
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

      // Build vendors query
      let query = supabase
        .from('vendors')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .eq('is_approved', true)

      // Apply filters
      if (selectedRegion) query = query.eq('region_id', selectedRegion)
      if (selectedCity) query = query.eq('city_id', selectedCity)
      if (searchQuery) {
        try {
          const safeQuery = sanitizeSearchQuery(searchQuery)
          query = query.or(`business_name.ilike.%${safeQuery}%,owner_name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
        } catch (error) {
          console.error('Search query validation error:', error)
          toast.error('استعلام البحث يحتوي على أحرف غير صالحة')
          setLoading(false)
          return
        }
      }

      const { data: vendorsData, count } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      setVendors(vendorsData || [])
      setTotalVendors(count || 0)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('حدث خطأ أثناء تحميل المتاجر')
    } finally {
      setLoading(false)
    }
  }

  const updateURL = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedRegion) params.set('region_id', selectedRegion)
    if (selectedCity) params.set('city_id', selectedCity)
    router.push(`/vendors?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedRegion('')
    setSelectedCity('')
    router.push('/vendors')
  }

  const filteredCities = cities.filter(city =>
    !selectedRegion || city.region_id === selectedRegion
  )

  const hasActiveFilters = selectedRegion || selectedCity || searchQuery

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white md:bg-gradient-to-br md:from-gray-900 md:via-gray-800 md:to-black pb-20 md:pb-0">
      <Toaster position="top-center" />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-secondary-600 via-secondary-500 to-secondary-700 md:from-gray-900 md:via-black md:to-gray-800 text-white overflow-hidden">
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
            className="absolute top-0 right-0 w-96 h-96 bg-white md:bg-yellow-400 rounded-full blur-3xl"
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
            className="absolute bottom-0 left-0 w-96 h-96 bg-primary-400 md:bg-yellow-500 rounded-full blur-3xl"
          />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Store className="w-8 h-8 md:w-10 md:h-10 text-white" />
              <h1 className="text-4xl md:text-6xl font-bold">
                المتاجر الموثوقة
              </h1>
              <Verified className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <p className="text-xl md:text-2xl text-secondary-100 mb-8">
              كل المتاجر هنا موثقة تماما ومضمونة
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <div className="relative group">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-secondary-500 md:group-focus-within:text-yellow-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && updateURL()}
                  placeholder="ابحث عن متجر..."
                  className="w-full pr-14 pl-14 py-5 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-secondary-300/50 md:focus:ring-yellow-500/50 shadow-2xl text-lg md:bg-gray-800/50 md:border md:border-yellow-500/30 md:text-white md:placeholder-gray-400"
                  dir="rtl"
                />
                <button
                  onClick={updateURL}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-secondary-500 to-secondary-600 md:from-yellow-500 md:to-yellow-600 text-white md:text-black px-6 py-3 rounded-xl font-semibold hover:from-secondary-600 hover:to-secondary-700 md:hover:from-yellow-600 md:hover:to-yellow-700 transition-all shadow-lg"
                >
                  بحث
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full md:hidden">
            <path
              fill="#f9fafb"
              fillOpacity="1"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            ></path>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full hidden md:block">
            <path
              fill="#1f2937"
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
            <div className="bg-white md:bg-gray-800/50 md:backdrop-blur-xl rounded-3xl shadow-xl p-6 sticky top-8 border border-gray-100 md:border-yellow-500/30">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 md:border-gray-700">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-secondary-600 md:text-yellow-400" />
                  <h2 className="text-xl font-bold text-gray-900 md:text-white">الفلاتر</h2>
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

              {/* Region */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 md:text-gray-300 mb-3" dir="rtl">
                  المنطقة
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value)
                    setSelectedCity('')
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 md:border-gray-700 md:bg-gray-900/50 md:text-white focus:border-secondary-500 md:focus:border-yellow-500 focus:outline-none transition-colors"
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
                <label className="block text-sm font-bold text-gray-700 md:text-gray-300 mb-3" dir="rtl">
                  المدينة
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedRegion}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 md:border-gray-700 md:bg-gray-900/50 md:text-white focus:border-secondary-500 md:focus:border-yellow-500 focus:outline-none transition-colors disabled:bg-gray-50 md:disabled:bg-gray-900/30 disabled:cursor-not-allowed"
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

              {/* Apply Filters Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={updateURL}
                className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 md:from-yellow-500 md:to-yellow-600 text-white md:text-black py-4 rounded-xl font-bold shadow-lg hover:shadow-xl md:hover:shadow-yellow-500/50 transition-all"
              >
                تطبيق الفلاتر
              </motion.button>
            </div>
          </motion.aside>

          {/* Vendors Grid */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="bg-white md:bg-gray-800/50 md:backdrop-blur-xl rounded-2xl shadow-lg p-4 mb-6 border border-gray-100 md:border-yellow-500/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-secondary-500 text-secondary-600 font-semibold hover:bg-secondary-50 transition-colors"
                  >
                    <Filter className="w-5 h-5" />
                    فلاتر
                  </button>

                  <p className="text-gray-600 md:text-gray-300 font-semibold" dir="rtl">
                    <span className="text-secondary-600 md:text-yellow-400 font-bold">{vendors.length}</span> متجر
                  </p>
                </div>
              </div>

              {/* Active Filters Chips */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 md:border-gray-700">
                  {searchQuery && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 bg-secondary-100 md:bg-yellow-500/20 text-secondary-700 md:text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold border md:border-yellow-500/30"
                    >
                      <span>البحث: {searchQuery}</span>
                      <button onClick={() => setSearchQuery('')}>
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Vendors Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-secondary-200 md:border-gray-700 border-t-secondary-600 md:border-t-yellow-500 rounded-full animate-spin"></div>
                  <Store className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-secondary-600 md:text-yellow-500" />
                </div>
              </div>
            ) : vendors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="text-8xl mb-6">🏪</div>
                <h3 className="text-2xl font-bold text-gray-900 md:text-white mb-2" dir="rtl">
                  لم نجد أي متاجر
                </h3>
                <p className="text-gray-600 md:text-gray-300 mb-6" dir="rtl">
                  جرب تعديل الفلاتر أو البحث بكلمات مختلفة
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 md:from-yellow-500 md:to-yellow-600 text-white md:text-black font-bold rounded-xl shadow-lg hover:shadow-xl md:hover:shadow-yellow-500/50 transition-all"
                >
                  مسح جميع الفلاتر
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor, index) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/vendors/${vendor.id}`}>
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white md:bg-gray-800/50 md:backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl md:hover:shadow-yellow-500/20 transition-all duration-300 overflow-hidden border border-gray-100 md:border-yellow-500/30 h-full flex flex-col"
                      >
                        {/* Vendor Header */}
                        <div className="relative h-32 bg-gradient-to-br from-secondary-400 to-secondary-600 md:from-yellow-600 md:to-yellow-400 flex items-center justify-center">
                          {vendor.logo_url ? (
                            <img
                              src={vendor.logo_url}
                              alt={vendor.business_name}
                              className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-xl"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-xl">
                              <Store className="w-10 h-10 text-secondary-600" />
                            </div>
                          )}

                          {/* Verified Badge */}
                          {vendor.is_verified && (
                            <div className="absolute top-3 right-3 bg-primary-500 md:bg-yellow-500 text-white md:text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                              <Verified className="w-3 h-3" />
                              موثوق
                            </div>
                          )}
                        </div>

                        {/* Vendor Info */}
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-xl font-bold text-gray-900 md:text-white mb-2 line-clamp-1" dir="rtl">
                            {vendor.business_name}
                          </h3>

                          {vendor.description && (
                            <p className="text-sm text-gray-600 md:text-gray-300 mb-4 line-clamp-2" dir="rtl">
                              {vendor.description}
                            </p>
                          )}

                          {/* Location */}
                          {vendor.city && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 md:text-gray-400 mb-3">
                              <MapPin className="w-4 h-4" />
                              <span>{vendor.city}</span>
                            </div>
                          )}

                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 md:text-gray-600'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-600 md:text-gray-400 mr-2">(4.0)</span>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 md:border-gray-700">
                            <div className="text-center">
                              <Package className="w-5 h-5 text-secondary-600 md:text-yellow-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500 md:text-gray-400">المنتجات</p>
                              <p className="font-bold text-gray-900 md:text-white">12+</p>
                            </div>
                            <div className="text-center">
                              <TrendingUp className="w-5 h-5 text-primary-600 md:text-yellow-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500 md:text-gray-400">المبيعات</p>
                              <p className="font-bold text-gray-900 md:text-white">50+</p>
                            </div>
                          </div>

                          {/* Visit Button */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full mt-4 py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 md:from-yellow-500 md:to-yellow-600 text-white md:text-black font-bold rounded-xl shadow-lg hover:shadow-xl md:hover:shadow-yellow-500/50 transition-all flex items-center justify-center gap-2"
                          >
                            زيارة المتجر
                            <ExternalLink className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
