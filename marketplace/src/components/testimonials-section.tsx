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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mb-4">
            آراء العملاء
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ماذا يقول عملاؤنا
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-2 border-gray-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 fill-secondary-500 text-secondary-500" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 leading-relaxed mb-6 flex-1">
                  &quot;{testimonial.content}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
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
