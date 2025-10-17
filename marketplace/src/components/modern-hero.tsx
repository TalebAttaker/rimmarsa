'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FiShoppingBag, FiTrendingUp, FiPackage, FiUsers, FiStar, FiArrowRight } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'

export default function ModernHero() {
  const stats = [
    { icon: <FiPackage className="w-6 h-6" />, value: '10,000+', label: 'منتج متنوع' },
    { icon: <FiUsers className="w-6 h-6" />, value: '5,000+', label: 'بائع موثوق' },
    { icon: <FiTrendingUp className="w-6 h-6" />, value: '50,000+', label: 'عميل سعيد' },
    { icon: <FiStar className="w-6 h-6" />, value: '4.8/5', label: 'تقييم ممتاز' },
  ]

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Animated Background Patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-br from-yellow-400/20 to-yellow-500/10 rounded-full blur-3xl"
        />

        {/* Floating Shapes */}
        <motion.div
          animate={{ y: [-20, 20, -20], rotate: [0, 180, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-16 h-16 border-4 border-yellow-500/20 rounded-2xl"
        />
        <motion.div
          animate={{ y: [20, -20, 20], rotate: [360, 180, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-20 h-20 border-4 border-yellow-400/20 rounded-full"
        />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-right">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 text-yellow-400 mb-6 shadow-lg shadow-yellow-500/20"
            >
              <HiSparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-semibold">السوق الأول في موريتانيا</span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse-glow" />
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            >
              اكتشف أفضل{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                  المنتجات
                </span>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="absolute bottom-2 right-0 h-3 bg-yellow-500/30 -z-0"
                />
              </span>
              <br />
              من بائعين محليين
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              سوق إلكتروني موثوق يربطك مباشرة بالبائعين المحليين في جميع أنحاء موريتانيا.
              تسوق بثقة واحصل على عمولات إحالة حصرية.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/products"
                  className="group relative px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 flex items-center gap-2 overflow-hidden"
                >
                  <FiShoppingBag className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">تصفح المنتجات</span>
                  <FiArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-700"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/vendor-registration"
                  className="px-8 py-4 bg-gray-800 border-2 border-yellow-500/30 text-yellow-400 rounded-2xl font-bold text-lg hover:border-yellow-500 hover:bg-yellow-500/10 hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <HiSparkles className="w-5 h-5" />
                  كن بائعاً
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
                  <FiShoppingBag className="w-4 h-4 text-yellow-400" />
                </div>
                <span>دفع آمن</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
                  <FiPackage className="w-4 h-4 text-yellow-400" />
                </div>
                <span>توصيل سريع</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
                  <FiStar className="w-4 h-4 text-yellow-400" />
                </div>
                <span>ضمان الجودة</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Illustration/Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            {/* Main Illustration Container */}
            <div className="relative w-full h-[600px] flex items-center justify-center">
              {/* Floating Cards */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 right-10 w-64 h-80 bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-yellow-500/20"
              >
                <div className="w-full h-48 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-2xl mb-4 flex items-center justify-center border border-yellow-500/30">
                  <FiShoppingBag className="w-20 h-20 text-yellow-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-yellow-500/20 rounded-full w-3/4" />
                  <div className="h-4 bg-yellow-500/20 rounded-full w-1/2" />
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 left-10 w-64 h-80 bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-yellow-500/20"
              >
                <div className="w-full h-48 bg-gradient-to-br from-yellow-400/20 to-yellow-500/10 rounded-2xl mb-4 flex items-center justify-center border border-yellow-500/30">
                  <FiPackage className="w-20 h-20 text-yellow-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-yellow-500/20 rounded-full w-3/4" />
                  <div className="h-4 bg-yellow-500/20 rounded-full w-1/2" />
                </div>
              </motion.div>

              {/* Center Element */}
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/50"
              >
                <HiSparkles className="w-16 h-16 text-black" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="group relative"
            >
              <div className="bg-gray-800/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
