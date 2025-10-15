'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import { Users } from 'lucide-react'

export default function VendorsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                Vendors Management
              </h1>
              <p className="text-gray-400">Manage all vendors on your platform</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-lg">Vendors management interface coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  )
}
