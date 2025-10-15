import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/database.types"
import ModernNavbar from "@/components/modern-navbar"
import ModernHero from "@/components/modern-hero"
import ModernCategoryCard from "@/components/modern-category-card"
import ModernProductCard from "@/components/modern-product-card"
import ModernFooter from "@/components/modern-footer"
import Link from "next/link"

type Category = Database['public']['Tables']['categories']['Row']
type Product = Database['public']['Tables']['products']['Row']

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true })
    .limit(8)

  // Fetch recent products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Modern Navbar */}
      <ModernNavbar />

      {/* Modern Hero Section */}
      <ModernHero />

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Shop by Category
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explore our wide range of categories and find exactly what you're looking for
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
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
            >
              View All Categories →
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Products Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Latest Products
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover the newest additions from our trusted vendors across Mauritania
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products?.map((product: Product, index: number) => (
              <ModernProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                city={product.city}
                images={product.images}
                index={index}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
            >
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <ModernFooter />
    </div>
  )
}
