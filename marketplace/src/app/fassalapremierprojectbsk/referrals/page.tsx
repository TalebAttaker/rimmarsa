'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { DollarSign, Users, TrendingUp, Award, Search, Download, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'

interface VendorReferralStats {
  vendor_id: string
  business_name: string
  email: string
  promo_code: string | null
  total_referrals: number
  completed_referrals: number
  pending_referrals: number
  total_commission: number
  referrals: {
    id: string
    referred_vendor_business_name: string
    referred_vendor_email: string
    commission_earned: number
    status: string
    created_at: string
  }[]
}

export default function ReferralsPage() {
  const [vendorStats, setVendorStats] = useState<VendorReferralStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalCommission, setTotalCommission] = useState(0)
  const [totalReferrals, setTotalReferrals] = useState(0)
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)

  useEffect(() => {
    fetchReferralStats()
  }, [])

  const fetchReferralStats = async () => {
    try {
      const supabase = createClient()

      // Fetch all vendors with their promo codes
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, business_name, email, promo_code')
        .eq('is_approved', true)
        .order('business_name')

      if (vendorsError) throw vendorsError

      // Fetch all referrals with referred vendor info
      const { data: allReferrals, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_vendor:vendors!referred_vendor_id(business_name, email)
        `)
        .order('created_at', { ascending: false })

      if (referralsError) throw referralsError

      // Build stats for each vendor
      const stats: VendorReferralStats[] = vendors?.map(vendor => {
        const vendorReferrals = allReferrals?.filter(r => r.referrer_id === vendor.id) || []

        const referralDetails = vendorReferrals.map(r => ({
          id: r.id,
          referred_vendor_business_name: r.referred_vendor?.business_name || 'Unknown',
          referred_vendor_email: r.referred_vendor?.email || 'N/A',
          commission_earned: Number(r.commission_earned || 0),
          status: r.status,
          created_at: r.created_at
        }))

        const totalCommission = referralDetails.reduce((sum, r) => sum + r.commission_earned, 0)
        const completedCount = referralDetails.filter(r => r.status === 'completed').length
        const pendingCount = referralDetails.filter(r => r.status === 'pending').length

        return {
          vendor_id: vendor.id,
          business_name: vendor.business_name,
          email: vendor.email,
          promo_code: vendor.promo_code,
          total_referrals: referralDetails.length,
          completed_referrals: completedCount,
          pending_referrals: pendingCount,
          total_commission: totalCommission,
          referrals: referralDetails
        }
      }) || []

      // Calculate overall totals
      const totalComm = stats.reduce((sum, v) => sum + v.total_commission, 0)
      const totalRefs = stats.reduce((sum, v) => sum + v.total_referrals, 0)

      setVendorStats(stats)
      setTotalCommission(totalComm)
      setTotalReferrals(totalRefs)
    } catch (error) {
      console.error('Error fetching referral stats:', error)
      toast.error('Failed to load referral statistics')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const csvData = vendorStats.map(v => ({
      'Business Name': v.business_name,
      'Email': v.email,
      'Promo Code': v.promo_code || 'N/A',
      'Total Referrals': v.total_referrals,
      'Completed': v.completed_referrals,
      'Pending': v.pending_referrals,
      'Total Commission (MRU)': v.total_commission
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `referral-stats-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('CSV exported successfully!')
  }

  const filteredVendors = vendorStats.filter(v =>
    v.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.promo_code && v.promo_code.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const vendorsWithReferrals = filteredVendors.filter(v => v.total_referrals > 0)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading referral statistics...</p>
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
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-yellow-400" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                  Referral Statistics
                </h1>
                <p className="text-gray-400">Track vendor referral commissions and performance</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl border border-green-500/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm">Total Referrals</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalReferrals}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400 text-sm">Active Referrers</span>
            </div>
            <div className="text-3xl font-bold text-white">{vendorsWithReferrals.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">Total Commission</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalCommission.toLocaleString()} MRU</div>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by business name, email, or promo code..."
              className="w-full pr-12 pl-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-yellow-500/20">
            <h3 className="text-xl font-bold text-white">Vendor Referral Performance</h3>
            <p className="text-sm text-gray-400 mt-1">
              Showing {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredVendors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Promo Code</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Referrals</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-500/10">
                  {filteredVendors.map((vendor, index) => (
                    <>
                      <motion.tr
                        key={vendor.vendor_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-yellow-500/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-white">{vendor.business_name}</div>
                            <div className="text-sm text-gray-400">{vendor.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg font-mono text-sm">
                            {vendor.promo_code || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-semibold">{vendor.total_referrals}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                            {vendor.completed_referrals}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                            {vendor.pending_referrals}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-400 font-bold">
                            {vendor.total_commission.toLocaleString()} MRU
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {vendor.total_referrals > 0 && (
                            <button
                              onClick={() => setExpandedVendor(expandedVendor === vendor.vendor_id ? null : vendor.vendor_id)}
                              className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-all"
                            >
                              <Eye className="w-4 h-4" />
                              {expandedVendor === vendor.vendor_id ? 'Hide' : 'View'}
                            </button>
                          )}
                        </td>
                      </motion.tr>

                      {/* Expanded Referral Details */}
                      {expandedVendor === vendor.vendor_id && vendor.referrals.length > 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-800/30">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-yellow-400 mb-3">Referral Details</h4>
                              <div className="space-y-2">
                                {vendor.referrals.map((ref, refIndex) => (
                                  <div
                                    key={ref.id}
                                    className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-white">{ref.referred_vendor_business_name}</div>
                                      <div className="text-sm text-gray-400">{ref.referred_vendor_email}</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Joined: {new Date(ref.created_at).toLocaleDateString('en-US')}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span
                                        className={`px-3 py-1 rounded-lg text-sm ${
                                          ref.status === 'completed'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                        }`}
                                      >
                                        {ref.status}
                                      </span>
                                      <span className="text-green-400 font-semibold min-w-[100px] text-left">
                                        +{ref.commission_earned.toLocaleString()} MRU
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No vendors found</p>
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'Try adjusting your search query' : 'No referral data available yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
