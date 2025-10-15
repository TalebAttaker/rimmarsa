'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import { DollarSign } from 'lucide-react'

export default function ReferralsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                Referrals Management
              </h1>
              <p className="text-gray-400">Process and manage referral commissions</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-lg">Referrals management interface coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  )
}
