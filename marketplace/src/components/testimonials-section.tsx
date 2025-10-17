'use client'

import { motion } from 'framer-motion'
import { FiStar } from 'react-icons/fi'

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'أحمد محمد',
      role: 'عميل',
      content: 'تجربة رائعة! وجدت كل ما أحتاجه من منتجات محلية بأسعار ممتازة. التوصيل كان سريع والخدمة احترافية.',
      rating: 5,
      image: '👨🏻‍💼'
    },
    {
      name: 'فاطمة أحمد',
      role: 'بائعة',
      content: 'منصة ممتازة للبائعين! ساعدتني في الوصول لآلاف العملاء وزيادة مبيعاتي بشكل كبير. أنصح بها بشدة.',
      rating: 5,
      image: '👩🏻‍💼'
    },
    {
      name: 'محمود علي',
      role: 'عميل',
      content: 'أفضل سوق إلكتروني في موريتانيا. التطبيق سهل الاستخدام والدعم الفني متعاون جداً. خمس نجوم!',
      rating: 5,
      image: '👨🏽‍💼'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold text-sm mb-4">
            آراء العملاء
          </span>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-4">
            ماذا يقول عملاؤنا
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            آلاف العملاء والبائعين السعداء يثقون بنا كل يوم
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border-2 border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-xl hover:shadow-yellow-500/20 transition-all duration-300 h-full flex flex-col">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-300 leading-relaxed mb-6 flex-1">
                  &quot;{testimonial.content}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-4 border-t border-yellow-500/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/50">
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-400">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
