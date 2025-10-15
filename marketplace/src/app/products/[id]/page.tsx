import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import WhatsAppButton from '@/components/WhatsAppButton'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch product details
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!product) {
    notFound()
  }

  // Fetch category info
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', product.category_id)
    .single()

  // Fetch vendor and store profile
  const { data: vendorProfile } = await supabase
    .rpc('get_public_vendor_profile', {
      vendor_uuid: product.vendor_id,
    })
    .single()

  // Increment view count (fire and forget)
  supabase
    .from('products')
    .update({ views: product.views + 1 })
    .eq('id', product.id)
    .then(() => {})

  // Fetch more products from same vendor
  const { data: moreFromVendor } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', product.vendor_id)
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(4)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              Rimmarsa
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/products" className="text-sm font-medium hover:underline">
                Products
              </Link>
              <Link href="/vendors" className="text-sm font-medium hover:underline">
                Vendors
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-blue-600">
            Products
          </Link>
          <span>/</span>
          <Link
            href={`/products?category=${category?.id}`}
            className="hover:text-blue-600"
          >
            {category?.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
              {product.images && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-gray-200 text-9xl">
                  📦
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-white rounded-lg shadow overflow-hidden"
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-blue-600">
                {product.price.toLocaleString()} MRU
              </span>
            </div>

            {/* Category and Location */}
            <div className="space-y-3 mb-6 pb-6 border-b">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-semibold">Category:</span>
                <Link
                  href={`/products?category=${category?.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {category?.icon} {category?.name}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-semibold">Location:</span>
                <span>
                  📍 {product.city}, {product.state}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span>👁️ {product.views.toLocaleString()} views</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Vendor Info */}
            {vendorProfile && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">Seller Information</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                    {vendorProfile.profile_image ? (
                      <img
                        src={vendorProfile.profile_image}
                        alt={vendorProfile.store_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      '🏪'
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/vendors/${product.vendor_id}`}
                      className="font-semibold text-lg hover:text-blue-600"
                    >
                      {vendorProfile.store_name}
                    </Link>
                    <p className="text-sm text-gray-600">
                      {vendorProfile.total_products} products •{' '}
                      {vendorProfile.city}, {vendorProfile.state}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/vendors/${product.vendor_id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View seller profile →
                </Link>
              </div>
            )}

            {/* WhatsApp Contact Button */}
            {vendorProfile?.whatsapp_number && (
              <WhatsAppButton
                phoneNumber={vendorProfile.whatsapp_number}
                productName={product.name}
                productPrice={product.price}
              />
            )}
          </div>
        </div>

        {/* More from this seller */}
        {moreFromVendor && moreFromVendor.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">More from this seller</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {moreFromVendor.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden group"
                >
                  <div className="aspect-square bg-gray-200 relative overflow-hidden">
                    {p.images && p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{p.name}</h3>
                    <p className="text-blue-600 font-bold">
                      {p.price.toLocaleString()} MRU
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
