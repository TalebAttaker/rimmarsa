'use client'

import { motion } from 'framer-motion'
import { FiShield, FiTruck, FiDollarSign, FiHeadphones, FiGift, FiZap } from 'react-icons/fi'

export default function FeaturesSection() {
  const features = [
    {
      icon: <FiShield className="w-6 h-6" />,
      title: 'دفع آمن ومضمون',
      description: 'جميع المعاملات محمية بأحدث تقنيات الأمان',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: <FiTruck className="w-6 h-6" />,
      title: 'توصيل سريع',
      description: 'خدمة توصيل لجميع أنحاء موريتانيا بأسرع وقت',
      color: 'from-yellow-400 to-yellow-500'
    },
    {
      icon: <FiDollarSign className="w-6 h-6" />,
      title: 'أسعار تنافسية',
      description: 'أفضل الأسعار مع عروض وخصومات حصرية',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: <FiHeadphones className="w-6 h-6" />,
      title: 'دعم عملاء 24/7',
      description: 'فريق دعم متاح دائماً لمساعدتك',
      color: 'from-yellow-400 to-yellow-500'
    },
    {
      icon: <FiGift className="w-6 h-6" />,
      title: 'برنامج الإحالة',
      description: 'احصل على عمولات عند إحالة بائعين جدد',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: <FiZap className="w-6 h-6" />,
      title: 'تجربة سريعة',
      description: 'منصة سريعة وسهلة الاستخدام لكل الأجهزة',
      color: 'from-yellow-400 to-yellow-500'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold text-sm mb-4">
            لماذا نحن؟
          </span>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-4">
            مزايا تجعلنا الأفضل
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            نقدم أفضل تجربة تسوق إلكتروني في موريتانيا مع خدمات متميزة
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group"
            >
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-xl hover:shadow-yellow-500/20 transition-all duration-300">
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-black mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/50`}>
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-yellow-400 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
