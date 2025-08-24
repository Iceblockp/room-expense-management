"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem("auth-token")
    if (token) {
      try {
        const data = await apiClient.getMe()
        setUser(data.user)
      } catch (error) {
        localStorage.removeItem("auth-token")
      }
    }
    setLoading(false)
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiClient.login(email, password)
      localStorage.setItem("auth-token", data.token)
      setUser(data.user)
      return true
    } catch (error) {
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("auth-token")
    setUser(null)
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
