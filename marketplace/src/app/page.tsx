import { createClient } from "@/lib/supabase/server"
import ResponsiveHome from "@/components/ResponsiveHome"

interface HomePageProps {
  searchParams: Promise<{ region_id?: string; city_id?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient()
  const params = await searchParams

  // Fetch active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true })
    .limit(8)

  // Build product query with optional location filters
  let productsQuery = supabase
    .from('products')
    .select('*, cities(name, name_ar), regions(name, name_ar)')
    .eq('is_active', true)

  // Apply region filter if provided
  if (params.region_id) {
    productsQuery = productsQuery.eq('region_id', params.region_id)
  }

  // Apply city filter if provided
  if (params.city_id) {
    productsQuery = productsQuery.eq('city_id', params.city_id)
  }

  const { data: products } = await productsQuery
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <ResponsiveHome
      categories={categories || []}
      products={products || []}
    />
  )
}
