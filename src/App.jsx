// src/App.jsx
// Componente raíz — navegación principal, providers y autenticación

import { useState } from 'react'
import { ShoppingCart, Package, Wifi, WifiOff, LogOut, LogIn } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useToast } from './hooks/useToast'
import Toast from './components/Toast'
import LoginScreen from './components/LoginScreen'
import Caja from './modules/Caja/Caja'
import Inventario from './modules/Inventario/Inventario'
import './App.css'

// Shell principal — accesible solo con sesión
function AppShell() {
  const [activeTab, setActiveTab] = useState('caja')
  const { toasts, addToast, removeToast } = useToast()
  const { isDemo } = useApp()
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      {/* Barra de navegación superior */}
      <nav className="nav-top" role="navigation" aria-label="Navegación principal">
        {/* Logo */}
        <div className="nav-logo" aria-label="Zeroo">
          Zer<span>oo</span>
        </div>

        {/* Tabs — desktop */}
        <div className="tab-group" role="tablist" aria-label="Módulos">
          <button
            className={`tab-item ${activeTab === 'caja' ? 'active' : ''}`}
            onClick={() => setActiveTab('caja')}
            role="tab"
            aria-selected={activeTab === 'caja'}
            id="tab-caja"
          >
            <ShoppingCart size={15} />
            Caja
          </button>
          <button
            className={`tab-item ${activeTab === 'inventario' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventario')}
            role="tab"
            aria-selected={activeTab === 'inventario'}
            id="tab-inventario-main"
          >
            <Package size={15} />
            Inventario
          </button>
        </div>

        {/* Usuario + modo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className="nav-mode-indicator"
            title={isDemo ? 'Modo demo — sin Supabase' : 'Conectado a Supabase'}
          >
            {isDemo ? (
              <><WifiOff size={13} /><span>Demo</span></>
            ) : (
              <><Wifi size={13} /><span>Conectado</span></>
            )}
          </div>

          {/* Avatar y logout */}
          {user && (
            <div className="nav-user">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || 'Usuario'}
                  className="nav-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="nav-avatar-placeholder">
                  {(user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <button
                className="btn btn-icon btn-sm"
                onClick={logout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                id="logout-btn"
              >
                <LogOut size={14} color="var(--text-secondary)" />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Contenido activo */}
      <main id="main-content" role="main">
        {activeTab === 'caja' ? (
          <Caja addToast={addToast} />
        ) : (
          <Inventario addToast={addToast} />
        )}
      </main>

      {/* Bottom Nav — mobile */}
      <nav className="bottom-nav" role="navigation" aria-label="Navegación móvil">
        <div className="bottom-nav-inner">
          <button
            className={`bottom-nav-item ${activeTab === 'caja' ? 'active' : ''}`}
            onClick={() => setActiveTab('caja')}
            id="bottom-tab-caja"
            aria-label="Caja"
          >
            <ShoppingCart size={18} />
            <span>Caja</span>
          </button>
          <button
            className={`bottom-nav-item ${activeTab === 'inventario' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventario')}
            id="bottom-tab-inventario"
            aria-label="Inventario"
          >
            <Package size={18} />
            <span>Inventario</span>
          </button>
        </div>
      </nav>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

// Gate de autenticación
function AuthGate() {
  const { user, loading } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  // Spinner mientras carga la sesión
  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div className="spinner" style={{ width: 28, height: 28, borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  // Sin sesión → mostrar login
  if (!user) return <LoginScreen />

  // Con sesión → mostrar app (pasamos user para aislar datos por usuario)
  return (
    <AppProvider addToast={addToast} user={user}>
      <AppShell />
      <Toast toasts={toasts} removeToast={removeToast} />
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
