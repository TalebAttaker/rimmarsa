'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if the device is mobile
 * Returns true for mobile devices (width < 768px)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === 'undefined') return

    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Check on mount
    checkMobile()

    // Add resize listener
    window.addEventListener('resize', checkMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}
