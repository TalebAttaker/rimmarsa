'use client'

import { motion } from 'framer-motion'
import { FiSearch, FiShoppingCart, FiTruck, FiStar } from 'react-icons/fi'

export default function HowItWorks() {
  const steps = [
    {
      icon: <FiSearch className="w-8 h-8" />,
      title: 'تصفح واختر',
      description: 'ابحث عن المنتجات التي تحتاجها من آلاف المنتجات المتنوعة',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: <FiShoppingCart className="w-8 h-8" />,
      title: 'أضف للسلة',
      description: 'أضف المنتجات المفضلة لديك وتواصل مع البائع مباشرة',
      color: 'from-yellow-400 to-yellow-500'
    },
    {
      icon: <FiTruck className="w-8 h-8" />,
      title: 'استلم طلبك',
      description: 'احصل على طلبك بسرعة وأمان في أي مكان في موريتانيا',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: <FiStar className="w-8 h-8" />,
      title: 'قيّم تجربتك',
      description: 'شارك تجربتك وساعد الآخرين في اتخاذ القرار الصحيح',
      color: 'from-yellow-400 to-yellow-500'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-gray-800 to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold text-sm mb-4">
            كيف يعمل
          </span>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-4">
            التسوق بسيط ومريح
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            أربع خطوات سهلة للحصول على كل ما تحتاجه من منتجات محلية موثوقة
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              {/* Connector Line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-yellow-500/30 to-transparent -ml-8 z-0" />
              )}

              {/* Step Card */}
              <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border-2 border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-xl hover:shadow-yellow-500/20 transition-all duration-300 z-10">
                {/* Step Number */}
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-yellow-500/50">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-black mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/50`}>
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-yellow-400 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
