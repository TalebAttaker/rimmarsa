'use client'

import { ReactNode } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import MobileBottomNav from './MobileBottomNav'

interface MobileLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

export default function MobileLayout({ children, showBottomNav = true }: MobileLayoutProps) {
  const isMobile = useIsMobile()

  if (!isMobile) {
    // Desktop: render children as-is
    return <>{children}</>
  }

  // Mobile: add bottom navigation and padding
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
