'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Check,
  AlertCircle,
  Upload,
  Store,
  User,
  MapPin,
  Shield,
  Tag
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Region {
  id: string
  name: string
  name_ar: string
  code: string
}

interface City {
  id: string
  name: string
  name_ar: string
  region_id: string
}

interface Vendor {
  id: string
  business_name: string
  owner_name: string
  email: string
  phone: string
  nni_image_url?: string | null
  logo_url?: string
  personal_picture_url?: string
  promo_code?: string
  description?: string
  region_id?: string
  city_id?: string
  address?: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  regions?: Region
  cities?: City
}

export default function VendorsPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filteredCities, setFilteredCities] = useState<City[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    nni_image_url: '',
    logo_url: '',
    personal_picture_url: '',
    promo_code: '',
    description: '',
    region_id: '',
    city_id: '',
    address: '',
    is_verified: false,
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingPersonal, setUploadingPersonal] = useState(false)

  useEffect(() => {
    // Check authentication
    const storedAdmin = localStorage.getItem('admin')
    const loginTime = localStorage.getItem('loginTime')

    if (!storedAdmin || !loginTime) {
      router.push('/fassalapremierprojectbsk/login')
      return
    }

    const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60)
    if (hoursSinceLogin > 24) {
      localStorage.removeItem('admin')
      localStorage.removeItem('loginTime')
      router.push('/fassalapremierprojectbsk/login')
      return
    }

    fetchData()
  }, [router])

  useEffect(() => {
    const filtered = vendors.filter(vendor =>
      vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.phone.includes(searchQuery)
    )
    setFilteredVendors(filtered)
  }, [searchQuery, vendors])

  useEffect(() => {
    if (formData.region_id) {
      const citiesInRegion = cities.filter(city => city.region_id === formData.region_id)
      setFilteredCities(citiesInRegion)
      // Reset city_id if it's not in the filtered cities
      if (!citiesInRegion.find(c => c.id === formData.city_id)) {
        setFormData(prev => ({ ...prev, city_id: '' }))
      }
    } else {
      setFilteredCities([])
    }
  }, [formData.region_id, cities, formData.city_id])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      // Fetch regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (regionsError) throw regionsError
      setRegions(regionsData || [])

      // Fetch cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (citiesError) throw citiesError
      setCities(citiesData || [])

      // Fetch vendors with regions and cities
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*, regions(*), cities(*)')
        .order('created_at', { ascending: false })

      if (vendorsError) throw vendorsError
      setVendors(vendorsData || [])
      setFilteredVendors(vendorsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const generatePromoCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    setFormData(prev => ({ ...prev, promo_code: code }))
  }

  const handleImageUpload = async (file: File, type: 'logo' | 'personal') => {
    if (type === 'logo') setUploadingLogo(true)
    else setUploadingPersonal(true)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `vendors/${type}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logo_url: publicUrl }))
      } else {
        setFormData(prev => ({ ...prev, personal_picture_url: publicUrl }))
      }

      toast.success(`${type === 'logo' ? 'Logo' : 'Personal picture'} uploaded successfully!`)
    } catch (error: unknown) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image'
      toast.error(errorMessage)
    } finally {
      if (type === 'logo') setUploadingLogo(false)
      else setUploadingPersonal(false)
    }
  }

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor)
      setFormData({
        business_name: vendor.business_name,
        owner_name: vendor.owner_name,
        email: vendor.email,
        phone: vendor.phone,
        nni_image_url: vendor.nni_image_url || '',
        logo_url: vendor.logo_url || '',
        personal_picture_url: vendor.personal_picture_url || '',
        promo_code: vendor.promo_code || '',
        description: vendor.description || '',
        region_id: vendor.region_id || '',
        city_id: vendor.city_id || '',
        address: vendor.address || '',
        is_verified: vendor.is_verified,
        is_active: vendor.is_active
      })
    } else {
      setEditingVendor(null)
      setFormData({
        business_name: '',
        owner_name: '',
        email: '',
        phone: '',
        nni_image_url: '',
        logo_url: '',
        personal_picture_url: '',
        promo_code: '',
        description: '',
        region_id: regions[0]?.id || '',
        city_id: '',
        address: '',
        is_verified: false,
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingVendor(null)
    setFormData({
      business_name: '',
      owner_name: '',
      email: '',
      phone: '',
      nni_image_url: '',
      logo_url: '',
      personal_picture_url: '',
      promo_code: '',
      description: '',
      region_id: '',
      city_id: '',
      address: '',
      is_verified: false,
      is_active: true
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const supabase = createClient()

      // Prepare data (remove empty strings)
      const vendorData = {
        ...formData,
        nni_image_url: formData.nni_image_url || null,
        logo_url: formData.logo_url || null,
        personal_picture_url: formData.personal_picture_url || null,
        promo_code: formData.promo_code || null,
        description: formData.description || null,
        region_id: formData.region_id || null,
        city_id: formData.city_id || null,
        address: formData.address || null
      }

      if (editingVendor) {
        // Update existing vendor
        const { error } = await supabase
          .from('vendors')
          .update({
            ...vendorData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingVendor.id)

        if (error) throw error
        toast.success('Vendor updated successfully!')
      } else {
        // Create new vendor
        const { error } = await supabase
          .from('vendors')
          .insert([vendorData])

        if (error) throw error
        toast.success('Vendor created successfully!')
      }

      handleCloseModal()
      fetchData()
    } catch (error: unknown) {
      console.error('Error saving vendor:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save vendor'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to delete ${vendor.business_name}?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendor.id)

      if (error) throw error
      toast.success('Vendor deleted successfully!')
      fetchData()
    } catch (error: unknown) {
      console.error('Error deleting vendor:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete vendor'
      toast.error(errorMessage)
    }
  }

  const handleToggleVerified = async (vendor: Vendor) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vendors')
        .update({
          is_verified: !vendor.is_verified,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id)

      if (error) throw error
      toast.success(`Vendor ${vendor.is_verified ? 'unverified' : 'verified'}!`)
      fetchData()
    } catch (error: unknown) {
      console.error('Error toggling vendor:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vendor'
      toast.error(errorMessage)
    }
  }

  const handleToggleActive = async (vendor: Vendor) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vendors')
        .update({
          is_active: !vendor.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id)

      if (error) throw error
      toast.success(`Vendor ${vendor.is_active ? 'deactivated' : 'activated'}!`)
      fetchData()
    } catch (error: unknown) {
      console.error('Error toggling vendor:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vendor'
      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 font-medium">Loading Vendors...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-400" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
                  Vendors Management
                </h1>
                <p className="text-gray-400">Manage all marketplace vendors</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-green-500/50"
            >
              <Plus className="w-5 h-5" />
              Add Vendor
            </button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by business name, owner, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
        </motion.div>

        {/* Vendors Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Business</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Owner</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Promo Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredVendors.map((vendor, index) => (
                  <motion.tr
                    key={vendor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {vendor.logo_url ? (
                          <img src={vendor.logo_url} alt={vendor.business_name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <Store className="w-5 h-5 text-green-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{vendor.business_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{vendor.owner_name}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-300">{vendor.email}</p>
                        <p className="text-gray-500">{vendor.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {vendor.cities ? (
                        <div className="text-sm">
                          <p className="text-gray-300">{vendor.cities.name}</p>
                          <p className="text-gray-500">{vendor.regions?.name}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {vendor.promo_code ? (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg font-mono text-sm">
                          {vendor.promo_code}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleToggleVerified(vendor)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            vendor.is_verified
                              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {vendor.is_verified ? 'Verified' : 'Unverified'}
                        </button>
                        <button
                          onClick={() => handleToggleActive(vendor)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            vendor.is_active
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {vendor.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {vendor.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(vendor)}
                          className="p-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor)}
                          className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filteredVendors.length === 0 && (
              <div className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No vendors found</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-900 pb-4 z-10">
                <h2 className="text-2xl font-bold text-yellow-400">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Information */}
                <div className="bg-gray-800/30 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Business Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                        placeholder="Enter business name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                        placeholder="vendor@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                      placeholder="Brief description of the business..."
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Business Logo
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.logo_url && (
                        <img src={formData.logo_url} alt="Logo" className="w-20 h-20 rounded-lg object-cover" />
                      )}
                      <label className="flex items-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:border-yellow-500 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file, 'logo')
                          }}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="bg-gray-800/30 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Owner Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Owner Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.owner_name}
                        onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                        placeholder="Full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                        placeholder="+222 XX XX XX XX"
                      />
                    </div>

                  </div>

                  {/* NNI Image Display (Read-only) */}
                  {formData.nni_image_url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        NNI (National ID) Image
                      </label>
                      <img src={formData.nni_image_url} alt="NNI" className="w-full max-w-md h-40 object-cover rounded-lg border border-gray-700" />
                      <p className="text-xs text-gray-500 mt-2">NNI image (from vendor registration)</p>
                    </div>
                  )}

                  {/* Personal Picture Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Personal Picture
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.personal_picture_url && (
                        <img src={formData.personal_picture_url} alt="Personal" className="w-20 h-20 rounded-lg object-cover" />
                      )}
                      <label className="flex items-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:border-yellow-500 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploadingPersonal ? 'Uploading...' : 'Upload Picture'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file, 'personal')
                          }}
                          className="hidden"
                          disabled={uploadingPersonal}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-800/30 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Region
                      </label>
                      <select
                        value={formData.region_id}
                        onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                      >
                        <option value="">Select a region</option>
                        {regions.map(region => (
                          <option key={region.id} value={region.id}>
                            {region.name} ({region.name_ar})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        City
                      </label>
                      <select
                        value={formData.city_id}
                        onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                        disabled={!formData.region_id}
                      >
                        <option value="">Select a city</option>
                        {filteredCities.map(city => (
                          <option key={city.id} value={city.id}>
                            {city.name} ({city.name_ar})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                      placeholder="Street address"
                    />
                  </div>
                </div>

                {/* Promo Code & Status */}
                <div className="bg-gray-800/30 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Promo Code & Status
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.promo_code}
                        onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors font-mono"
                        placeholder="PROMO2025"
                      />
                      <button
                        type="button"
                        onClick={generatePromoCode}
                        className="px-4 py-3 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-xl transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_verified"
                        checked={formData.is_verified}
                        onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                        className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="is_verified" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        Verified
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-green-500 focus:ring-green-500"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        Active
                      </label>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 sticky bottom-0 bg-gray-900 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Create Vendor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
