// src/lib/auth.js
// Autenticación con Supabase Auth — Google OAuth

import { supabase } from './supabase'

// Detecta automáticamente si estamos en localhost o producción
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

/**
 * Inicia sesión con Google OAuth
 * Redirige al usuario a Google y vuelve a la app tras autenticarse
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${APP_URL}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) throw new Error('Error al iniciar sesión con Google: ' + error.message)
}

/**
 * Cierra la sesión actual
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error('Error al cerrar sesión: ' + error.message)
}

/**
 * Obtiene el usuario actualmente autenticado
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Suscribe a cambios de sesión (login/logout)
 * @param {function} callback - (session) => void
 * @returns Unsubscribe function
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session)
  )
  return () => subscription.unsubscribe()
}
