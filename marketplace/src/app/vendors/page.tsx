import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import VendorFilters from '@/components/VendorFilters'
import VendorGrid from '@/components/VendorGrid'
import Link from 'next/link'

type Vendor = Database['public']['Tables']['vendors']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Region = Database['public']['Tables']['regions']['Row']
type City = Database['public']['Tables']['cities']['Row']

interface SearchParams {
  region_id?: string
  city_id?: string
  search?: string
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch all regions and cities for filters
  const { data: regions } = await supabase
    .from('regions')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const { data: cities } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Build query with filters
  let query = supabase
    .from('vendors')
    .select('*, cities(name, name_ar), regions(name, name_ar)')
    .eq('is_active', true)
    .eq('is_verified', true)
    .order('created_at', { ascending: false })

  // Apply region filter if provided
  if (params.region_id) {
    query = query.eq('region_id', params.region_id)
  }

  // Apply city filter if provided
  if (params.city_id) {
    query = query.eq('city_id', params.city_id)
  }

  // Apply search filter if provided
  if (params.search) {
    query = query.or(
      `business_name.ilike.%${params.search}%,owner_name.ilike.%${params.search}%,description.ilike.%${params.search}%`
    )
  }

  const { data: vendors, count } = await supabase
    .from('vendors')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .eq('is_verified', true)

  const { data: filteredVendors } = await query.limit(50)

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
          <h1 className="text-4xl font-bold mb-2">Browse Vendors</h1>
          <p className="text-gray-600">
            Discover {count?.toLocaleString() || 0} trusted vendors across Mauritania
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<div>Loading filters...</div>}>
              <VendorFilters
                regions={regions || []}
                cities={cities || []}
                searchParams={params}
              />
            </Suspense>
          </aside>

          {/* Vendors Grid */}
          <main className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredVendors?.length || 0} vendors
              </p>
            </div>

            <Suspense fallback={<div>Loading vendors...</div>}>
              <VendorGrid vendors={filteredVendors || []} />
            </Suspense>

            {filteredVendors && filteredVendors.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-xl font-semibold mb-2">No vendors found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search query
                </p>
                <Link
                  href="/vendors"
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
