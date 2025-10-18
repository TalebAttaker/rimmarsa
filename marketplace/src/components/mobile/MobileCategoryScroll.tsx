'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Package } from 'lucide-react'

interface Category {
  id: string
  name: string
  name_ar: string
  icon?: string | null
}

interface MobileCategoryScrollProps {
  categories: Category[]
}

const categoryColors = [
  'from-primary-400 to-primary-600',
  'from-secondary-400 to-secondary-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-green-400 to-green-600',
  'from-yellow-400 to-yellow-600',
  'from-red-400 to-red-600',
]

export default function MobileCategoryScroll({ categories }: MobileCategoryScrollProps) {
  return (
    <div className="py-4">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-yellow-400">الفئات</h2>
        <Link href="/products" className="text-sm text-yellow-500 font-medium hover:text-yellow-400 transition-colors">
          عرض الكل ←
        </Link>
      </div>

      {/* Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2">
          {categories.map((category, index) => {
            const gradientColor = categoryColors[index % categoryColors.length]

            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0"
                >
                  <div className="w-20 space-y-2">
                    {/* Icon Circle */}
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradientColor} shadow-lg flex items-center justify-center`}>
                      {category.icon ? (
                        <span className="text-3xl">{category.icon}</span>
                      ) : (
                        <Package className="w-8 h-8 text-white" />
                      )}
                    </div>

                    {/* Category Name */}
                    <p className="text-xs font-medium text-gray-300 text-center line-clamp-2 leading-tight">
                      {category.name_ar || category.name}
                    </p>
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
