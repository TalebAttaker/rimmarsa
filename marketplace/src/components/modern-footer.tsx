'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiShoppingBag } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'

export default function ModernFooter() {
  const footerLinks = {
    buyers: [
      { label: 'تصفح المنتجات', href: '/products' },
      { label: 'الفئات', href: '/products' },
      { label: 'البحث عن البائعين', href: '/vendors' },
      { label: 'كيف يعمل', href: '/#how-it-works' },
    ],
    vendors: [
      { label: 'كن بائعاً', href: '/vendor-registration' },
      { label: 'تسجيل دخول البائع', href: '/vendor/login' },
      { label: 'برنامج الإحالة', href: '/vendor-registration' },
      { label: 'الأسعار والخطط', href: '/vendor-registration' },
    ],
    support: [
      { label: 'مركز المساعدة', href: '/' },
      { label: 'اتصل بنا', href: '/' },
      { label: 'شروط الخدمة', href: '/' },
      { label: 'سياسة الخصوصية', href: '/' },
    ],
  }

  const socialLinks = [
    { icon: <FiFacebook />, href: '#', label: 'Facebook', color: 'hover:bg-blue-500' },
    { icon: <FiTwitter />, href: '#', label: 'Twitter', color: 'hover:bg-sky-500' },
    { icon: <FiInstagram />, href: '#', label: 'Instagram', color: 'hover:bg-pink-500' },
    { icon: <FiLinkedin />, href: '#', label: 'LinkedIn', color: 'hover:bg-blue-600' },
  ]

  const contactInfo = [
    { icon: <FiMail />, text: 'contact@rimmarsa.com', href: 'mailto:contact@rimmarsa.com' },
    { icon: <FiPhone />, text: '+222 XX XX XX XX', href: 'tel:+222XXXXXXXX' },
    { icon: <FiMapPin />, text: 'نواكشوط، موريتانيا', href: '#' },
  ]

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <Link href="/" className="flex items-center gap-3 group mb-6">
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
                  <span className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent block">
                    ريمارسا
                  </span>
                  <span className="text-xs text-gray-400 block">سوق موريتانيا الإلكتروني</span>
                </div>
              </Link>

              <p className="text-gray-300 mb-6 leading-relaxed">
                أفضل منصة للتجارة الإلكترونية في موريتانيا.
                نربط البائعين المحليين بآلاف العملاء في جميع أنحاء البلاد.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                {contactInfo.map((item, index) => (
                  <motion.a
                    key={index}
                    href={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 text-gray-300 hover:text-yellow-400 transition-colors duration-300 group"
                  >
                    <div className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors duration-300">
                      {item.icon}
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* For Buyers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-lg font-bold mb-6 text-white">
              للمشترين
            </h4>
            <ul className="space-y-3">
              {footerLinks.buyers.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full group-hover:bg-yellow-400 group-hover:scale-150 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* For Vendors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-lg font-bold mb-6 text-white">
              للبائعين
            </h4>
            <ul className="space-y-3">
              {footerLinks.vendors.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full group-hover:bg-yellow-400 group-hover:scale-150 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-lg font-bold mb-6 text-white">
              الدعم
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full group-hover:bg-yellow-400 group-hover:scale-150 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 pb-12 border-b border-white/10"
        >
          <div className="max-w-2xl mx-auto text-center">
            <HiSparkles className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">اشترك في نشرتنا الإخبارية</h3>
            <p className="text-gray-400 mb-6">احصل على آخر العروض والأخبار مباشرة في بريدك الإلكتروني</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-xl border border-yellow-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 text-white placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 whitespace-nowrap"
              >
                اشترك الآن
              </button>
            </form>
          </div>
        </motion.div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-gray-400 text-sm text-center md:text-right"
          >
            © 2025 ريمارسا. جميع الحقوق محفوظة. صُنع بـ ❤️ في موريتانيا
          </motion.p>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-3"
          >
            {socialLinks.map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                aria-label={social.label}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center hover:text-white transition-all duration-300 ${social.color}`}
              >
                {social.icon}
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
