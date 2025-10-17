'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FiMapPin, FiHeart } from 'react-icons/fi'
import { useState } from 'react'

interface ModernProductCardProps {
  id: string
  name: string
  description: string | null
  price: number
  city: string | null
  images: string[] | null
  index: number
}

export default function ModernProductCard({
  id,
  name,
  description,
  price,
  city,
  images,
  index
}: ModernProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -10 }}
      className="group"
    >
      <Link href={`/products/${id}`} className="block h-full">
        <div className="relative h-full bg-gray-800/50 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg shadow-yellow-500/10 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 border border-yellow-500/20">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
            {images && images[0] ? (
              <motion.img
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.6 }}
                src={images[0]}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                📦
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Favorite Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault()
                setIsFavorite(!isFavorite)
              }}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-300 ${
                isFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-900/80 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30'
              }`}
            >
              <FiHeart className={`w-5 h-5 ${isFavorite && 'fill-current'}`} />
            </motion.button>

            {/* Quick View Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-yellow-500/90 backdrop-blur-xl rounded-full text-sm font-semibold text-black opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg shadow-yellow-500/50"
            >
              Quick View →
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Product Name */}
            <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors duration-300">
              {name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-300 mb-4 line-clamp-2">
              {description || 'لا يوجد وصف متاح'}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-yellow-500/20">
              {/* Price */}
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                  {price.toLocaleString()} <span className="text-sm">أوقية</span>
                </div>
              </div>

              {/* Location */}
              {city && (
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <FiMapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Animated Border on Hover */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 p-[2px]">
              <div className="absolute inset-0 rounded-3xl bg-gray-800/50 backdrop-blur-xl" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
