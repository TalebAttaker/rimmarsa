'use client'

import MobileHome from './mobile/MobileHome'
import MobileLayout from './mobile/MobileLayout'
import ModernNavbar from './modern-navbar'
import ModernHero from './modern-hero'
import HowItWorks from './how-it-works'
import FeaturesSection from './features-section'
import TestimonialsSection from './testimonials-section'
import ModernCategoryCard from './modern-category-card'
import ModernProductCard from './modern-product-card'
import ModernFooter from './modern-footer'
import LocationFilter from './LocationFilter'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  name_ar: string
  icon?: string | null
  is_active: boolean
  order: number | null
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  city?: string | null
  images?: string[]
  cities?: { name: string; name_ar: string } | null
  regions?: { name: string; name_ar: string } | null
  city_deprecated?: string | null
}

interface ResponsiveHomeProps {
  categories: Category[]
  products: Product[]
}

export default function ResponsiveHome({ categories, products }: ResponsiveHomeProps) {
  // Use CSS media queries for responsive design instead of JS detection
  // This works better with SSR and has no flash

  return (
    <>
      {/* Mobile Version - Hidden on desktop with CSS */}
      <div className="md:hidden">
        <MobileLayout>
          <MobileHome
            categories={categories}
            products={products}
          />
        </MobileLayout>
      </div>

      {/* Desktop Version - Hidden on mobile with CSS */}
      <div className="hidden md:block">
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Modern Navbar */}
      <ModernNavbar />

      {/* Modern Hero Section */}
      <ModernHero />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold text-sm mb-4">
              الفئات
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
              تسوق حسب الفئة
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
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
                icon={category.icon || null}
                index={index}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-2xl hover:shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300"
            >
              عرض جميع الفئات ←
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Recent Products Section */}
      <section id="products" className="py-20 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold text-sm mb-4">
              أحدث المنتجات
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
              اكتشف منتجات جديدة
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              أحدث الإضافات من البائعين الموثوقين في جميع أنحاء موريتانيا
            </p>
          </div>

          {/* Location Filter */}
          <div className="flex justify-center mb-8">
            <LocationFilter />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products?.map((product, index: number) => (
              <ModernProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description || null}
                price={product.price}
                city={product.cities?.name || product.city_deprecated || null}
                images={product.images || null}
                index={index}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-2xl hover:shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300"
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
      </div>
    </>
  )
}
