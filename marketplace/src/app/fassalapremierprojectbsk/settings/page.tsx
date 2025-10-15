'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-gray-500/10 to-gray-600/10 backdrop-blur-xl border border-gray-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-gray-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-400 to-gray-200 bg-clip-text text-transparent">
                Platform Settings
              </h1>
              <p className="text-gray-400">Configure platform settings and preferences</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-lg">Settings interface coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  )
}
