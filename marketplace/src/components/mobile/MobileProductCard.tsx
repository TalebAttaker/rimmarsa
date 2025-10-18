'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { MapPin, Heart, Star } from 'lucide-react'
import { useState } from 'react'

interface MobileProductCardProps {
  id: string
  name: string
  description?: string
  price: number
  city?: string | null
  images?: string[]
  index?: number
}

export default function MobileProductCard({
  id,
  name,
  description,
  price,
  city,
  images,
  index = 0
}: MobileProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageError, setImageError] = useState(false)

  const imageUrl = images && images.length > 0 && !imageError
    ? images[0]
    : '/placeholder-product.png'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/products/${id}`}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-gray-800/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-yellow-500/20 active:shadow-xl active:shadow-yellow-500/20 transition-all duration-300"
        >
          {/* Image Container */}
          <div className="relative aspect-square bg-gray-900">
            <img
              src={imageUrl}
              alt={name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />

            {/* Favorite Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault()
                setIsFavorite(!isFavorite)
              }}
              className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </motion.button>

            {/* Sale Badge (if applicable) */}
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-lg">
              <span className="text-xs font-bold text-black">جديد</span>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-3 space-y-2">
            {/* Title */}
            <h3 className="font-bold text-gray-100 text-sm line-clamp-2 min-h-[2.5rem]">
              {name}
            </h3>

            {/* Location */}
            {city && (
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{city}</span>
              </div>
            )}

            {/* Price & Rating */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-lg font-bold text-yellow-400">
                  {price.toLocaleString('ar-MR')}
                </span>
                <span className="text-xs text-gray-400 mr-1">أوقية</span>
              </div>

              <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">4.5</span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
