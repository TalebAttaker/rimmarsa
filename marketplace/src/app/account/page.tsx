'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  User,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
  TrendingUp,
  Package,
  DollarSign,
  Crown,
  Star,
  Gift,
  Users,
  ChevronRight,
  Award
} from 'lucide-react'
import MobileBottomNav from '@/components/mobile/MobileBottomNav'

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'subscription'>('stats')

  // Mock user data - replace with actual user data from Supabase
  const userData = {
    name: 'مستخدم ريمارسا',
    email: 'user@rimmarsa.com',
    phone: '+222 XX XX XX XX',
    joinDate: 'يناير 2024',
    avatar: null,
    stats: {
      totalOrders: 24,
      totalSpent: 125000,
      favoriteItems: 12,
      referralEarnings: 5000,
      referredUsers: 3,
      points: 450
    },
    subscription: {
      plan: 'free',
      name: 'مجاني',
      features: [
        'تصفح غير محدود',
        'إضافة للمفضلة',
        'نظام الإحالة الأساسي',
        'دعم عملاء'
      ]
    }
  }

  const subscriptionPlans = [
    {
      id: 'free',
      name: 'مجاني',
      price: 0,
      icon: Gift,
      color: 'from-gray-600 to-gray-700',
      features: [
        'تصفح غير محدود',
        'إضافة للمفضلة',
        'نظام الإحالة الأساسي',
        'دعم عملاء'
      ]
    },
    {
      id: 'premium',
      name: 'بريميوم',
      price: 2000,
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      features: [
        'جميع مميزات المجاني',
        'خصومات حصرية 10%',
        'شحن مجاني',
        'عمولات إحالة مضاعفة',
        'أولوية في الدعم',
        'إشعارات العروض المبكرة'
      ],
      recommended: true
    },
    {
      id: 'vip',
      name: 'VIP',
      price: 5000,
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      features: [
        'جميع مميزات البريميوم',
        'خصومات حصرية 20%',
        'شحن مجاني سريع',
        'عمولات إحالة 3x',
        'دعم VIP 24/7',
        'وصول مبكر للمنتجات',
        'هدايا شهرية مجانية'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 pt-6 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="text-black hover:text-gray-800">
              ← الرئيسية
            </Link>
            <button className="p-2 hover:bg-black/10 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-black" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-black/20 rounded-2xl flex items-center justify-center">
              <User className="w-10 h-10 text-black" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-black mb-1">{userData.name}</h1>
              <p className="text-black/70 text-sm">{userData.email}</p>
              <p className="text-black/60 text-xs mt-1">عضو منذ {userData.joinDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 -mt-12">
        {/* Tab Switcher */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-1 mb-6 border border-yellow-500/20 shadow-lg">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            >
              إحصائياتي
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'subscription'
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            >
              الاشتراكات
            </button>
          </div>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-400 text-sm">الطلبات</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{userData.stats.totalOrders}</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-400 text-sm">إجمالي الإنفاق</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {userData.stats.totalSpent.toLocaleString('ar-MR')}
                </p>
                <p className="text-xs text-gray-500">أوقية</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Heart className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-400 text-sm">المفضلة</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{userData.stats.favoriteItems}</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-400 text-sm">الإحالات</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{userData.stats.referredUsers}</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-400 text-sm">أرباح الإحالة</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {userData.stats.referralEarnings.toLocaleString('ar-MR')}
                </p>
                <p className="text-xs text-gray-500">أوقية</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Award className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-400 text-sm">النقاط</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{userData.stats.points}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 border border-yellow-500/20">
              <h3 className="text-lg font-bold text-yellow-400 mb-4">إجراءات سريعة</h3>
              <div className="space-y-2">
                <Link
                  href="/orders"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-yellow-500/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">طلباتي</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </Link>

                <Link
                  href="/favorites"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-yellow-500/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">المفضلة</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </Link>

                <Link
                  href="/referrals"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-yellow-500/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">برنامج الإحالة</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-yellow-500/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">الإعدادات</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </Link>
              </div>
            </div>

            {/* Logout Button */}
            <Link href="/login">
              <button className="w-full py-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2">
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </Link>
          </motion.div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pb-8"
          >
            {/* Current Plan */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-yellow-400">خطتك الحالية</h3>
                <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl font-semibold text-sm">
                  {userData.subscription.name}
                </span>
              </div>
              <ul className="space-y-2">
                {userData.subscription.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-300 text-sm">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Available Plans */}
            <h3 className="text-xl font-bold text-yellow-400 mt-6 mb-4">الخطط المتاحة</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => {
                const Icon = plan.icon
                const isCurrent = plan.id === userData.subscription.plan

                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.02 }}
                    className={`relative bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border transition-all duration-300 ${
                      plan.recommended
                        ? 'border-yellow-500 shadow-xl shadow-yellow-500/20'
                        : 'border-yellow-500/20'
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 right-4 px-4 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs font-bold rounded-full">
                        الأكثر شعبية
                      </div>
                    )}

                    <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <h4 className="text-xl font-bold text-yellow-400 mb-2">{plan.name}</h4>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400 text-sm mr-1">أوقية/شهر</span>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled={isCurrent}
                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                        isCurrent
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : plan.recommended
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:shadow-lg hover:shadow-yellow-500/50'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {isCurrent ? 'الخطة الحالية' : 'ترقية الآن'}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Spacing for Mobile Nav */}
      <div className="h-24 md:hidden"></div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
