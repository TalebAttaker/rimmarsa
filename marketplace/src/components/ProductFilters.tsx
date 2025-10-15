'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { useState } from 'react'

type Category = Database['public']['Tables']['categories']['Row']

interface ProductFiltersProps {
  categories: Category[]
  states: string[]
  cities: string[]
  searchParams: {
    category?: string
    state?: string
    city?: string
    search?: string
    minPrice?: string
    maxPrice?: string
  }
}

export default function ProductFilters({
  categories,
  states,
  cities,
  searchParams,
}: ProductFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()

  const [search, setSearch] = useState(searchParams.search || '')
  const [minPrice, setMinPrice] = useState(searchParams.minPrice || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice || '')

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(params)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    router.push(`/products?${newParams.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('search', search)
  }

  const handlePriceFilter = () => {
    const newParams = new URLSearchParams(params)
    if (minPrice) newParams.set('minPrice', minPrice)
    else newParams.delete('minPrice')
    if (maxPrice) newParams.set('maxPrice', maxPrice)
    else newParams.delete('maxPrice')
    router.push(`/products?${newParams.toString()}`)
  }

  const clearAllFilters = () => {
    setSearch('')
    setMinPrice('')
    setMaxPrice('')
    router.push('/products')
  }

  const hasActiveFilters =
    searchParams.category ||
    searchParams.state ||
    searchParams.city ||
    searchParams.search ||
    searchParams.minPrice ||
    searchParams.maxPrice

  return (
    <div className="bg-white p-6 rounded-lg border sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Search</label>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          value={searchParams.category || ''}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name} ({category.name_ar})
            </option>
          ))}
        </select>
      </div>

      {/* State */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">State</label>
        <select
          value={searchParams.state || ''}
          onChange={(e) => updateFilter('state', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All States</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">City</label>
        <select
          value={searchParams.city || ''}
          onChange={(e) => updateFilter('city', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Price Range (MRU)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handlePriceFilter}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Apply Price Filter
        </button>
      </div>
    </div>
  )
}
