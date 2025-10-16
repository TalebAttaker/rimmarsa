'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface ModernCategoryCardProps {
  id: string
  name: string
  name_ar: string
  icon: string | null
  index: number
}

export default function ModernCategoryCard({ id, name, name_ar, icon, index }: ModernCategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
    >
      <Link
        href={`/products?category=${id}`}
        className="group relative block"
      >
        <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
          {/* Gradient Overlay on Hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
          />

          {/* Animated Border */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 p-[2px]">
              <div className="absolute inset-0 rounded-3xl bg-white" />
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Icon Container */}
            <motion.div
              whileHover={{ rotate: 360, scale: 1.2 }}
              transition={{ duration: 0.6 }}
              className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-lg group-hover:shadow-2xl group-hover:shadow-primary-500/50 transition-all duration-300"
            >
              <span className="filter drop-shadow-lg">
                {icon || '📦'}
              </span>
            </motion.div>

            {/* Category Name */}
            <h3 className="text-lg font-bold text-gray-800 mb-1 text-center group-hover:text-primary-600 transition-colors duration-300">
              {name}
            </h3>

            {/* Arabic Name */}
            <p className="text-sm text-gray-500 text-center">
              {name_ar}
            </p>

            {/* Hover Arrow */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-600 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              ←
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
