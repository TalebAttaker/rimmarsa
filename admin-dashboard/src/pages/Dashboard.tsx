import { useEffect, useState } from 'react'
import { Users, ShoppingBag, FileText, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Stats {
  totalVendors: number
  totalProducts: number
  pendingRequests: number
  totalRevenue: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalVendors: 0,
    totalProducts: 0,
    pendingRequests: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch vendor requests count
      const { count: requestsCount } = await supabase
        .from('vendor_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Fetch vendors count
      const { count: vendorsCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalVendors: vendorsCount || 0,
        totalProducts: productsCount || 0,
        pendingRequests: requestsCount || 0,
        totalRevenue: 0, // TODO: Calculate from orders
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'طلبات البائعين المعلقة',
      value: stats.pendingRequests,
      icon: FileText,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'إجمالي البائعين',
      value: stats.totalVendors,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'إجمالي المنتجات',
      value: stats.totalProducts,
      icon: ShoppingBag,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'الإيرادات الإجمالية',
      value: `${stats.totalRevenue} أوقية`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          النشاط الأخير
        </h3>
        <div className="text-center text-gray-500 py-8">
          لا توجد أنشطة حديثة
        </div>
      </div>
    </div>
  )
}
