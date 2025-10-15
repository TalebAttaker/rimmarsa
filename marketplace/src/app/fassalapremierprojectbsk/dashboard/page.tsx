'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react'

interface Stats {
  total_vendors: number
  active_vendors: number
  total_products: number
  active_products: number
  total_categories: number
  pending_referrals: number
}

const COLORS = ['#EAB308', '#F59E0B', '#FCD34D', '#FDE68A']

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<Array<{month: string; vendors: number; products: number; revenue: number}>>([])
  const [categoryData, setCategoryData] = useState<Array<{name: string; value: number}>>([])

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

    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()

      // Fetch statistics
      const [vendorsRes, productsRes, categoriesRes, referralsRes] = await Promise.all([
        supabase.from('vendors').select('*', { count: 'exact' }),
        supabase.from('products').select('*', { count: 'exact' }),
        supabase.from('categories').select('*', { count: 'exact' }),
        supabase.from('referrals').select('*', { count: 'exact' }).eq('status', 'pending'),
      ])

      const activeVendors = await supabase
        .from('vendors')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      const activeProducts = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      setStats({
        total_vendors: vendorsRes.count || 0,
        active_vendors: activeVendors.count || 0,
        total_products: productsRes.count || 0,
        active_products: activeProducts.count || 0,
        total_categories: categoriesRes.count || 0,
        pending_referrals: referralsRes.count || 0,
      })

      // Mock monthly data (in real app, fetch from analytics)
      setMonthlyData([
        { month: 'Jan', vendors: 12, products: 45, revenue: 25000 },
        { month: 'Feb', vendors: 19, products: 67, revenue: 38000 },
        { month: 'Mar', vendors: 25, products: 89, revenue: 52000 },
        { month: 'Apr', vendors: 32, products: 112, revenue: 68000 },
        { month: 'May', vendors: 41, products: 145, revenue: 85000 },
        { month: 'Jun', vendors: 48, products: 178, revenue: 102000 },
      ])

      // Fetch category distribution
      const { data: categoryProducts } = await supabase
        .from('products')
        .select('category_id, categories(name)')
        .eq('is_active', true)

      const categoryCounts: { [key: string]: number } = {}
      if (categoryProducts) {
        (categoryProducts as Array<{ categories?: { name?: string } | null }>).forEach((item) => {
          const name = item.categories?.name || 'Other'
          categoryCounts[name] = (categoryCounts[name] || 0) + 1
        })
      }

      setCategoryData(
        Object.entries(categoryCounts)
          .map(([name, value]) => ({ name, value }))
          .slice(0, 6)
      )
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 font-medium">Loading Dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: '102,000 MRU',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      gradient: 'from-yellow-500 to-yellow-600',
    },
    {
      title: 'Active Vendors',
      value: stats?.active_vendors || 0,
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Active Products',
      value: stats?.active_products || 0,
      change: '+15.3%',
      trend: 'up',
      icon: Package,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Pending Referrals',
      value: stats?.pending_referrals || 0,
      change: '-3.1%',
      trend: 'down',
      icon: Activity,
      gradient: 'from-pink-500 to-pink-600',
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-2">
                Welcome back, Admin!
              </h1>
              <p className="text-gray-400">Here&apos;s what&apos;s happening with your platform today.</p>
            </div>
            <ShoppingBag className="w-16 h-16 text-yellow-400 opacity-50" />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {card.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={card.trend === 'up' ? 'text-green-400' : 'text-red-400'}>
                      {card.change}
                    </span>
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #EAB308',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#EAB308"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-yellow-400 mb-6">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #EAB308',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-yellow-400 mb-6">Vendors & Products Growth</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #EAB308',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="vendors" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="products" fill="#EAB308" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
