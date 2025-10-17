'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Search, Sparkles, TrendingUp, ShoppingBag, ChevronRight } from 'lucide-react'

export default function MobileHero() {
  const [searchFocused, setSearchFocused] = useState(false)

  const features = [
    { icon: ShoppingBag, text: 'آلاف المنتجات', color: 'text-primary-500' },
    { icon: TrendingUp, text: 'أسعار تنافسية', color: 'text-secondary-500' },
    { icon: Sparkles, text: 'بائعون موثوقون', color: 'text-primary-500' }
  ]

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 pt-6 pb-8 px-4">
      {/* Animated Background Patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary-400 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-6">
        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-block mb-2"
          >
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            مرحباً بك في ريمارسا
          </h1>
          <p className="text-primary-100 text-sm">
            اكتشف آلاف المنتجات من بائعين موثوقين
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/products">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="relative bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="p-2 bg-primary-50 rounded-xl">
                  <Search className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">ابحث عن أي منتج...</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Gradient Border */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Quick Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-around"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white font-medium">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link href="/vendor-registration">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-white text-primary-600 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              كن بائعاً واربح معنا
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
