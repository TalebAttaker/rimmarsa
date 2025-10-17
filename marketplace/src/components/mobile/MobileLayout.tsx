'use client'

import { ReactNode } from 'react'
import MobileBottomNav from './MobileBottomNav'

interface MobileLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

export default function MobileLayout({ children, showBottomNav = true }: MobileLayoutProps) {
  // Mobile layout wrapper with bottom navigation
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content with bottom padding for nav */}
      <main className={showBottomNav ? 'pb-20' : ''}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  )
}
