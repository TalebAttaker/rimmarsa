import Link from 'next/link'
import { MapPin, Store, Star, ShoppingBag } from 'lucide-react'

interface VendorGridProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vendors: any[]
}

export default function VendorGrid({ vendors }: VendorGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor) => (
        <Link
          key={vendor.id}
          href={`/vendors/${vendor.id}`}
          className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden group"
        >
          {/* Vendor Logo/Header */}
          <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
            {vendor.logo_url ? (
              <img
                src={vendor.logo_url}
                alt={vendor.business_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store className="w-16 h-16 text-white/80" />
              </div>
            )}
            {/* Verified Badge */}
            {vendor.is_verified && (
              <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Verified
              </div>
            )}
          </div>

          {/* Vendor Info */}
          <div className="p-4">
            <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition">
              {vendor.business_name}
            </h3>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
              {vendor.description || 'Welcome to our store! Browse our products and discover quality items.'}
            </p>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>
                {vendor.cities?.name || 'Mauritania'}
                {vendor.regions?.name && `, ${vendor.regions.name}`}
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <ShoppingBag className="w-4 h-4" />
                <span>View Products</span>
              </div>

              {vendor.promo_code && (
                <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-semibold">
                  {vendor.promo_code}
                </div>
              )}
            </div>
          </div>

          {/* Hover Effect Border */}
          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-blue-500" />
        </Link>
      ))}
    </div>
  )
}
