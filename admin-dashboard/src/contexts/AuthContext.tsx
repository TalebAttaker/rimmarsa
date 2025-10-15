import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'
import type { Tables } from '../lib/database.types'

type Admin = Tables<'admins'>

interface AuthContextType {
  admin: Admin | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if admin is logged in
    const storedAdmin = localStorage.getItem('admin')
    const loginTime = localStorage.getItem('loginTime')

    if (storedAdmin && loginTime) {
      const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60)
      if (hoursSinceLogin < 24) {
        setAdmin(JSON.parse(storedAdmin))
      } else {
        localStorage.removeItem('admin')
        localStorage.removeItem('loginTime')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Fetch admin from database
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValid = await bcrypt.compare(password, data.password_hash)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    // Store admin info
    localStorage.setItem('admin', JSON.stringify(data))
    localStorage.setItem('loginTime', Date.now().toString())
    setAdmin(data)
  }

  const logout = () => {
    localStorage.removeItem('admin')
    localStorage.removeItem('loginTime')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
