'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import { Tags } from 'lucide-react'

export default function CategoriesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Tags className="w-8 h-8 text-green-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
                Categories Management
              </h1>
              <p className="text-gray-400">Manage product categories</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-lg">Categories management interface coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  )
}
