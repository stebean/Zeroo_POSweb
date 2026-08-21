// src/context/AuthContext.jsx
// Contexto de autenticación — maneja sesión de usuario globalmente

import { createContext, useContext, useState, useEffect } from 'react'
import { signInWithGoogle, signOut, onAuthStateChange } from '../lib/auth'
import { clientRateLimit } from '../lib/validate'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Suscribir a cambios de sesión
    const unsubscribe = onAuthStateChange((session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async () => {
    setAuthError('')
    try {
      // Rate limiting en cliente: máx 3 intentos por minuto
      clientRateLimit('google-signin', 3)
      await signInWithGoogle()
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const logout = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (err) {
      setAuthError(err.message)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
