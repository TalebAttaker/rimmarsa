import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import ProductFilters from '@/components/ProductFilters'
import ProductGrid from '@/components/ProductGrid'
import Link from 'next/link'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface SearchParams {
  category?: string
  state?: string
  city?: string
  search?: string
  minPrice?: string
  maxPrice?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  // Fetch all categories for filter
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true })

  // Build query with filters
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Apply filters
  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category)
  }

  if (searchParams.state) {
    query = query.eq('state', searchParams.state)
  }

  if (searchParams.city) {
    query = query.eq('city', searchParams.city)
  }

  if (searchParams.search) {
    query = query.or(
      `name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`
    )
  }

  if (searchParams.minPrice) {
    query = query.gte('price', parseFloat(searchParams.minPrice))
  }

  if (searchParams.maxPrice) {
    query = query.lte('price', parseFloat(searchParams.maxPrice))
  }

  const { data: products, count } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)

  const { data: filteredProducts } = await query.limit(50)

  // Get unique states and cities for filters
  const { data: locations } = await supabase
    .from('products')
    .select('state, city')
    .eq('is_active', true)

  const uniqueStates = [...new Set(locations?.map((l) => l.state))]
  const uniqueCities = [...new Set(locations?.map((l) => l.city))]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
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
              <Link href="/login" className="text-sm font-medium hover:underline">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Products</h1>
          <p className="text-gray-600">
            Discover {count?.toLocaleString() || 0} products from local vendors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<div>Loading filters...</div>}>
              <ProductFilters
                categories={categories || []}
                states={uniqueStates}
                cities={uniqueCities}
                searchParams={searchParams}
              />
            </Suspense>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredProducts?.length || 0} products
              </p>
              {/* Sort dropdown can go here */}
            </div>

            <Suspense fallback={<div>Loading products...</div>}>
              <ProductGrid products={filteredProducts || []} />
            </Suspense>

            {filteredProducts && filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search query
                </p>
                <Link
                  href="/products"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Clear all filters
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
