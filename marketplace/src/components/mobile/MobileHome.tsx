'use client'

import { useState } from 'react'
import MobileHero from './MobileHero'
import MobileCategoryScroll from './MobileCategoryScroll'
import MobileProductCard from './MobileProductCard'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Zap, Gift } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  name_ar: string
  icon?: string | null
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  city?: string | null
  images?: string[]
}

interface MobileHomeProps {
  categories: Category[]
  products: Product[]
}

export default function MobileHome({ categories, products }: MobileHomeProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'trending' | 'deals'>('new')

  const tabs = [
    { id: 'new' as const, label: 'جديد', icon: Sparkles },
    { id: 'trending' as const, label: 'الأكثر مبيعاً', icon: TrendingUp },
    { id: 'deals' as const, label: 'عروض', icon: Gift },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Hero Section */}
      <MobileHero />

      {/* Categories Horizontal Scroll */}
      <MobileCategoryScroll categories={categories || []} />

      {/* Quick Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 my-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-4 shadow-lg"
      >
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">1000+</div>
            <div className="text-xs text-primary-100">منتج</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">500+</div>
            <div className="text-xs text-primary-100">بائع</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">10K+</div>
            <div className="text-xs text-primary-100">عميل</div>
          </div>
        </div>
      </motion.div>

      {/* Product Tabs */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-yellow-500/20">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-md shadow-yellow-500/50'
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {products?.map((product, index) => (
            <MobileProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price}
              city={product.city}
              images={product.images}
              index={index}
            />
          ))}
        </div>

        {/* Load More Button */}
        <Link href="/products">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-4 bg-gray-800/50 backdrop-blur-md border-2 border-yellow-500 text-yellow-400 rounded-2xl font-bold shadow-lg hover:bg-yellow-500/10 transition-all duration-300"
          >
            عرض جميع المنتجات
          </motion.button>
        </Link>
      </div>

      {/* Floating Action Sections */}
      <div className="px-4 pb-8 space-y-3">
        {/* Become Vendor Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 shadow-lg shadow-yellow-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-black" />
                <h3 className="text-black font-bold">كن بائعاً</h3>
              </div>
              <p className="text-black/80 text-sm mb-3">
                ابدأ البيع اليوم واربح عمولات حصرية
              </p>
              <Link href="/vendor-registration">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-black text-yellow-400 rounded-xl font-bold text-sm shadow-lg hover:bg-gray-900 transition-colors duration-300"
                >
                  سجّل الآن
                </motion.button>
              </Link>
            </div>
            <div className="text-6xl opacity-20">🚀</div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-yellow-500/20 text-center">
            <div className="text-3xl mb-2">🚚</div>
            <div className="text-xs font-semibold text-yellow-400">توصيل سريع</div>
            <div className="text-xs text-gray-400">لجميع المدن</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-yellow-500/20 text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <div className="text-xs font-semibold text-yellow-400">دفع آمن</div>
            <div className="text-xs text-gray-400">حماية 100%</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-yellow-500/20 text-center">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-xs font-semibold text-yellow-400">دعم 24/7</div>
            <div className="text-xs text-gray-400">نحن هنا دائماً</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-yellow-500/20 text-center">
            <div className="text-3xl mb-2">🎁</div>
            <div className="text-xs font-semibold text-yellow-400">عروض يومية</div>
            <div className="text-xs text-gray-400">خصومات حصرية</div>
          </div>
        </div>
      </div>
    </div>
  )
}
