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
        <div className="relative h-full bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              <FiHeart className={`w-5 h-5 ${isFavorite && 'fill-current'}`} />
            </motion.button>

            {/* Quick View Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur-xl rounded-full text-sm font-semibold text-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              Quick View →
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Product Name */}
            <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
              {name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {description || 'No description available'}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {/* Price */}
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {price.toLocaleString()} <span className="text-sm">MRU</span>
                </div>
              </div>

              {/* Location */}
              {city && (
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <FiMapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Animated Border on Hover */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-[2px]">
              <div className="absolute inset-0 rounded-3xl bg-white" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
