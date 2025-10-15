'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Region {
  id: string
  name: string
  name_ar: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function RegionsPage() {
  const router = useRouter()
  const [regions, setRegions] = useState<Region[]>([])
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    code: '',
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)

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

    fetchRegions()
  }, [router])

  useEffect(() => {
    const filtered = regions.filter(region =>
      region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.name_ar.includes(searchQuery) ||
      region.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredRegions(filtered)
  }, [searchQuery, regions])

  const fetchRegions = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('name')

      if (error) throw error
      setRegions(data || [])
      setFilteredRegions(data || [])
    } catch (error) {
      console.error('Error fetching regions:', error)
      toast.error('Failed to load regions')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (region?: Region) => {
    if (region) {
      setEditingRegion(region)
      setFormData({
        name: region.name,
        name_ar: region.name_ar,
        code: region.code,
        is_active: region.is_active
      })
    } else {
      setEditingRegion(null)
      setFormData({
        name: '',
        name_ar: '',
        code: '',
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRegion(null)
    setFormData({
      name: '',
      name_ar: '',
      code: '',
      is_active: true
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const supabase = createClient()

      if (editingRegion) {
        // Update existing region
        const { error } = await supabase
          .from('regions')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRegion.id)

        if (error) throw error
        toast.success('Region updated successfully!')
      } else {
        // Create new region
        const { error } = await supabase
          .from('regions')
          .insert([formData])

        if (error) throw error
        toast.success('Region created successfully!')
      }

      handleCloseModal()
      fetchRegions()
    } catch (error: unknown) {
      console.error('Error saving region:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save region'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (region: Region) => {
    if (!confirm(`Are you sure you want to delete ${region.name}? This will also delete all cities in this region.`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('regions')
        .delete()
        .eq('id', region.id)

      if (error) throw error
      toast.success('Region deleted successfully!')
      fetchRegions()
    } catch (error: unknown) {
      console.error('Error deleting region:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete region'
      toast.error(errorMessage)
    }
  }

  const handleToggleActive = async (region: Region) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('regions')
        .update({
          is_active: !region.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', region.id)

      if (error) throw error
      toast.success(`Region ${region.is_active ? 'deactivated' : 'activated'}!`)
      fetchRegions()
    } catch (error: unknown) {
      console.error('Error toggling region:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update region'
      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 font-medium">Loading Regions...</p>
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
          className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                  Regions Management
                </h1>
                <p className="text-gray-400">Manage Mauritania&apos;s regions (Wilayas)</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/50"
            >
              <Plus className="w-5 h-5" />
              Add Region
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
              placeholder="Search by name, Arabic name, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
        </motion.div>

        {/* Regions Table */}
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Arabic Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredRegions.map((region, index) => (
                  <motion.tr
                    key={region.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-mono text-sm">
                        {region.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{region.name}</td>
                    <td className="px-6 py-4 text-gray-300" dir="rtl">{region.name_ar}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(region)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          region.is_active
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                      >
                        {region.is_active ? (
                          <>
                            <Check className="w-4 h-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(region)}
                          className="p-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(region)}
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

            {filteredRegions.length === 0 && (
              <div className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No regions found</p>
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
              className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-yellow-400">
                  {editingRegion ? 'Edit Region' : 'Add New Region'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Region Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="e.g., Nouakchott"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Arabic Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="نواكشوط"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Region Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors font-mono"
                    placeholder="e.g., NKC"
                    maxLength={10}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-yellow-500 focus:ring-yellow-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-300">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
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
                    {submitting ? 'Saving...' : editingRegion ? 'Update' : 'Create'}
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
