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
        <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 shadow-lg shadow-yellow-500/10 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 border border-yellow-500/20 overflow-hidden">
          {/* Gradient Overlay on Hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
          />

          {/* Animated Border */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 p-[2px]">
              <div className="absolute inset-0 rounded-3xl bg-gray-800/50 backdrop-blur-xl" />
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Icon Container */}
            <motion.div
              whileHover={{ rotate: 360, scale: 1.2 }}
              transition={{ duration: 0.6 }}
              className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-lg shadow-yellow-500/50 group-hover:shadow-2xl group-hover:shadow-yellow-500/60 transition-all duration-300"
            >
              <span className="filter drop-shadow-lg">
                {icon || '📦'}
              </span>
            </motion.div>

            {/* Category Name */}
            <h3 className="text-lg font-bold text-white mb-1 text-center group-hover:text-yellow-400 transition-colors duration-300">
              {name}
            </h3>

            {/* Arabic Name */}
            <p className="text-sm text-gray-400 text-center">
              {name_ar}
            </p>

            {/* Hover Arrow */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              ←
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
