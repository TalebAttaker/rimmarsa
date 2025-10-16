import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/database.types"
import ModernNavbar from "@/components/modern-navbar"
import ModernHero from "@/components/modern-hero"
import HowItWorks from "@/components/how-it-works"
import FeaturesSection from "@/components/features-section"
import TestimonialsSection from "@/components/testimonials-section"
import ModernCategoryCard from "@/components/modern-category-card"
import ModernProductCard from "@/components/modern-product-card"
import ModernFooter from "@/components/modern-footer"
import LocationFilter from "@/components/LocationFilter"
import Link from "next/link"

type Category = Database['public']['Tables']['categories']['Row']
type Product = Database['public']['Tables']['products']['Row']

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
    <div className="min-h-screen bg-white">
      {/* Modern Navbar */}
      <ModernNavbar />

      {/* Modern Hero Section */}
      <ModernHero />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mb-4">
              الفئات
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              تسوق حسب الفئة
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              استكشف مجموعة واسعة من الفئات واعثر على ما تحتاجه بالضبط
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {categories?.map((category: Category, index: number) => (
              <ModernCategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                name_ar={category.name_ar}
                icon={category.icon}
                index={index}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-primary-500/50 transition-all duration-300"
            >
              عرض جميع الفئات ←
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Recent Products Section */}
      <section id="products" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-secondary-100 text-secondary-700 font-semibold text-sm mb-4">
              أحدث المنتجات
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              اكتشف منتجات جديدة
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              أحدث الإضافات من البائعين الموثوقين في جميع أنحاء موريتانيا
            </p>
          </div>

          {/* Location Filter */}
          <div className="flex justify-center mb-8">
            <LocationFilter />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {products?.map((product: any, index: number) => (
              <ModernProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                city={product.cities?.name || product.city_deprecated || null}
                images={product.images}
                index={index}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-primary-500/50 transition-all duration-300"
            >
              عرض جميع المنتجات ←
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Modern Footer */}
      <ModernFooter />
    </div>
  )
}
