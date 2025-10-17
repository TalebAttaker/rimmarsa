'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiMenu, FiX, FiShoppingBag, FiUser, FiHeart, FiSearch,
  FiPackage, FiMapPin, FiPhone
} from 'react-icons/fi'
import { HiOutlineShoppingBag } from 'react-icons/hi'
import { HiSparkles } from 'react-icons/hi'

export default function ModernNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const navLinks = [
    { href: '/products', label: 'المنتجات', icon: <FiShoppingBag />, color: 'primary' },
    { href: '/vendors', label: 'البائعون', icon: <HiOutlineShoppingBag />, color: 'primary' },
    { href: '/vendor-registration', label: 'كن بائعاً', icon: <HiSparkles />, highlight: true },
  ]

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-yellow-500/20'
            : 'bg-gray-900/90 backdrop-blur-md border-b border-yellow-500/10'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Navigation Row */}
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/50">
                  <FiShoppingBag className="w-6 h-6 text-black" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse-glow" />
              </motion.div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent block">
                  ريمارسا
                </span>
                <span className="text-xs text-gray-400 block">سوق موريتانيا</span>
              </div>
            </Link>

            {/* Desktop Search Bar */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن منتجات، بائعين، أو فئات..."
                  className="w-full pr-12 pl-4 py-3 bg-gray-800 border border-yellow-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 text-white placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="absolute left-2 top-1/2 -translate-y-1/2 px-6 py-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl font-medium hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300"
                >
                  بحث
                </button>
              </div>
            </form>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                      link.highlight
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg hover:shadow-xl hover:shadow-yellow-500/50'
                        : 'text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400'
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-all duration-300"
              >
                <FiHeart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-black text-xs rounded-full flex items-center justify-center font-bold">
                  0
                </span>
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl font-semibold shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/60 transition-all duration-300"
                >
                  <FiUser className="w-4 h-4" />
                  تسجيل الدخول
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 rounded-xl transition-colors duration-300"
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </motion.button>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-4">
            <form onSubmit={handleSearch} className="relative">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتجات..."
                className="w-full pr-12 pl-4 py-3 bg-gray-800 border border-yellow-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 text-white"
              />
            </form>
          </div>
        </div>

        {/* Quick Links Bar (Desktop only) */}
        <div className="hidden lg:block border-t border-yellow-500/10 bg-gray-800/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-8 py-3">
              <Link href="/products" className="flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors duration-300">
                <FiPackage className="w-4 h-4" />
                جميع المنتجات
              </Link>
              <Link href="/vendors" className="flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors duration-300">
                <HiOutlineShoppingBag className="w-4 h-4" />
                المتاجر المميزة
              </Link>
              <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors duration-300">
                <FiMapPin className="w-4 h-4" />
                التوصيل في جميع أنحاء موريتانيا
              </Link>
              <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors duration-300">
                <FiPhone className="w-4 h-4" />
                دعم عملاء 24/7
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-gray-900 shadow-2xl border-l border-yellow-500/20 md:hidden"
          >
            <div className="flex flex-col h-full pt-24 px-6 pb-6">
              {/* Mobile Nav Links */}
              <nav className="flex flex-col gap-2 flex-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-300 font-medium ${
                        link.highlight
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg'
                          : 'text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400'
                      }`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    href="/favorites"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-4 rounded-xl text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-300 font-medium"
                  >
                    <FiHeart />
                    المفضلة
                  </Link>
                </motion.div>
              </nav>

              {/* Mobile CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold shadow-lg shadow-yellow-500/50"
                >
                  <FiUser />
                  تسجيل الدخول
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl border-2 border-yellow-500 text-yellow-400 font-semibold hover:bg-yellow-500/10 transition-colors duration-300"
                >
                  إنشاء حساب
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-32 lg:h-40" />
    </>
  )
}
