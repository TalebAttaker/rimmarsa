/**
 * Location Data Hook
 *
 * Fetches and manages regions and cities data for forms.
 * Provides filtered cities based on selected region.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface Region {
  id: string
  name: string
  name_ar: string
  code?: string
  is_active: boolean
}

export interface City {
  id: string
  name: string
  name_ar: string
  region_id: string
  is_active: boolean
}

export function useLocationData(selectedRegionId?: string) {
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filteredCities, setFilteredCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)

  /**
   * Fetch regions and cities from database
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        // Fetch regions
        const { data: regionsData, error: regionsError } = await supabase
          .from('regions')
          .select('*')
          .eq('is_active', true)
          .order('name_ar')

        if (regionsError) {
          console.error('Error fetching regions:', regionsError)
          toast.error('فشل في تحميل الولايات')
        } else {
          setRegions(regionsData || [])
        }

        // Fetch cities
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('*')
          .eq('is_active', true)
          .order('name_ar')

        if (citiesError) {
          console.error('Error fetching cities:', citiesError)
          toast.error('فشل في تحميل المقاطعات')
        } else {
          setCities(citiesData || [])
        }
      } catch (error) {
        console.error('Unexpected error fetching location data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  /**
   * Filter cities when region changes
   */
  useEffect(() => {
    if (selectedRegionId) {
      const filtered = cities.filter(
        (city) => city.region_id === selectedRegionId
      )
      setFilteredCities(filtered)
    } else {
      setFilteredCities([])
    }
  }, [selectedRegionId, cities])

  /**
   * Get region by ID
   */
  const getRegionById = (regionId: string): Region | undefined => {
    return regions.find((r) => r.id === regionId)
  }

  /**
   * Get city by ID
   */
  const getCityById = (cityId: string): City | undefined => {
    return cities.find((c) => c.id === cityId)
  }

  /**
   * Get cities for a specific region
   */
  const getCitiesForRegion = (regionId: string): City[] => {
    return cities.filter((city) => city.region_id === regionId)
  }

  return {
    regions,
    cities,
    filteredCities,
    loading,
    getRegionById,
    getCityById,
    getCitiesForRegion,
  }
}
