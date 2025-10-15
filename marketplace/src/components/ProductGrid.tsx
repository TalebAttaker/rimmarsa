import Link from 'next/link'
import { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden group"
        >
          <div className="aspect-square bg-gray-200 relative overflow-hidden">
            {product.images && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                📦
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {product.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-blue-600 font-bold text-xl">
                {product.price.toLocaleString()} MRU
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                📍 {product.city}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
