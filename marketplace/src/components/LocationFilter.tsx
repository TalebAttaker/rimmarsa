'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Region {
  id: string
  name: string
  name_ar: string
}

interface City {
  id: string
  name: string
  name_ar: string
  region_id: string
}

export default function LocationFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filteredCities, setFilteredCities] = useState<City[]>([])

  const [selectedRegionId, setSelectedRegionId] = useState(searchParams.get('region_id') || '')
  const [selectedCityId, setSelectedCityId] = useState(searchParams.get('city_id') || '')

  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    if (selectedRegionId) {
      const citiesInRegion = cities.filter(city => city.region_id === selectedRegionId)
      setFilteredCities(citiesInRegion)

      // Reset city selection if it's not in the new region
      if (selectedCityId) {
        const cityExists = citiesInRegion.some(city => city.id === selectedCityId)
        if (!cityExists) {
          setSelectedCityId('')
        }
      }
    } else {
      setFilteredCities([])
      setSelectedCityId('')
    }
  }, [selectedRegionId, cities, selectedCityId])

  const fetchLocations = async () => {
    const supabase = createClient()

    const { data: regionsData } = await supabase
      .from('regions')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    const { data: citiesData } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (regionsData) setRegions(regionsData)
    if (citiesData) setCities(citiesData)
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (selectedRegionId) {
      params.set('region_id', selectedRegionId)
    } else {
      params.delete('region_id')
    }

    if (selectedCityId) {
      params.set('city_id', selectedCityId)
    } else {
      params.delete('city_id')
    }

    router.push(`${pathname}?${params.toString()}`)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setSelectedRegionId('')
    setSelectedCityId('')
    router.push(pathname)
    setShowFilters(false)
  }

  const selectedRegion = regions.find(r => r.id === selectedRegionId)
  const selectedCity = filteredCities.find(c => c.id === selectedCityId)

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all duration-300"
      >
        <MapPin className="w-5 h-5 text-blue-600" />
        <span className="font-medium text-gray-700">
          {selectedRegion ? (
            <span>
              {selectedRegion.name}
              {selectedCity && ` - ${selectedCity.name}`}
            </span>
          ) : (
            'Filter by Location'
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </button>

      {/* Filter Dropdown */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {/* Region Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Region
                </label>
                <select
                  value={selectedRegionId}
                  onChange={(e) => setSelectedRegionId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                >
                  <option value="">All Regions</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name} - {region.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select City
                </label>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  disabled={!selectedRegionId}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
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

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={applyFilters}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-red-500 hover:text-red-600 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
