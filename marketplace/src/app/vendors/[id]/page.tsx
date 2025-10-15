import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductGrid from '@/components/ProductGrid'

export default async function VendorProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Fetch vendor profile using database function
  const { data: vendorProfile } = await supabase
    .rpc('get_public_vendor_profile', {
      vendor_uuid: params.id,
    })
    .single()

  if (!vendorProfile) {
    notFound()
  }

  // Fetch vendor's products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', params.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Get vendor stats
  const { data: stats } = await supabase
    .rpc('get_vendor_stats', {
      vendor_uuid: params.id,
    })
    .single()

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
          <Link href="/vendors" className="hover:text-blue-600">
            Vendors
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {vendorProfile.store_name}
          </span>
        </div>

        {/* Vendor Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Vendor Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center text-6xl overflow-hidden">
                {vendorProfile.profile_image ? (
                  <img
                    src={vendorProfile.profile_image}
                    alt={vendorProfile.store_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  '🏪'
                )}
              </div>
            </div>

            {/* Vendor Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">
                {vendorProfile.store_name}
              </h1>
              <p className="text-gray-600 mb-4">by {vendorProfile.vendor_name}</p>

              {vendorProfile.description && (
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {vendorProfile.description}
                </p>
              )}

              {/* Location and Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl mb-2">📍</div>
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="font-semibold">
                    {vendorProfile.city}, {vendorProfile.state}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl mb-2">📦</div>
                  <div className="text-sm text-gray-600">Products</div>
                  <div className="font-semibold">
                    {vendorProfile.total_products} items
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="text-sm text-gray-600">Member Since</div>
                  <div className="font-semibold">
                    {new Date(vendorProfile.member_since).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </div>
                </div>
              </div>

              {/* Contact via WhatsApp */}
              {vendorProfile.whatsapp_number && (
                <div className="mt-6">
                  <a
                    href={`https://wa.me/${vendorProfile.whatsapp_number.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Contact on WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vendor's Products */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Products from {vendorProfile.store_name}
          </h2>

          {products && products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">No products yet</h3>
              <p className="text-gray-600">
                This vendor hasn't listed any products yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
