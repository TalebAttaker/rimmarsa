'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import { Package } from 'lucide-react'

export default function ProductsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">
                Products Management
              </h1>
              <p className="text-gray-400">Manage all products listed on your platform</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-lg">Products management interface coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  )
}
