'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { useState, useEffect, useMemo } from 'react'

type Region = Database['public']['Tables']['regions']['Row']
type City = Database['public']['Tables']['cities']['Row']

interface VendorFiltersProps {
  regions: Region[]
  cities: City[]
  searchParams: {
    region_id?: string
    city_id?: string
    search?: string
  }
}

export default function VendorFilters({
  regions,
  cities,
  searchParams,
}: VendorFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()

  const [search, setSearch] = useState(searchParams.search || '')
  const [selectedRegionId, setSelectedRegionId] = useState(searchParams.region_id || '')

  // Filter cities based on selected region
  const filteredCities = useMemo(() => {
    if (!selectedRegionId) return cities
    return cities.filter(city => city.region_id === selectedRegionId)
  }, [selectedRegionId, cities])

  // Update selectedRegionId when searchParams change
  useEffect(() => {
    setSelectedRegionId(searchParams.region_id || '')
  }, [searchParams.region_id])

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(params)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }

    // If changing region, clear city filter
    if (key === 'region_id') {
      newParams.delete('city_id')
      setSelectedRegionId(value)
    }

    router.push(`/vendors?${newParams.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('search', search)
  }

  const clearAllFilters = () => {
    setSearch('')
    setSelectedRegionId('')
    router.push('/vendors')
  }

  const hasActiveFilters =
    searchParams.region_id ||
    searchParams.city_id ||
    searchParams.search

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
            placeholder="Search vendors..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Region */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Region</label>
        <select
          value={searchParams.region_id || ''}
          onChange={(e) => updateFilter('region_id', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Regions</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name} - {region.name_ar}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">City</label>
        <select
          value={searchParams.city_id || ''}
          onChange={(e) => updateFilter('city_id', e.target.value)}
          disabled={!selectedRegionId}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
          <option value="">All Cities</option>
          {filteredCities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name} - {city.name_ar}
            </option>
          ))}
        </select>
        {!selectedRegionId && (
          <p className="text-xs text-gray-500 mt-1">Select a region first</p>
        )}
      </div>
    </div>
  )
}
