// src/App.jsx
// Componente raíz — navegación principal y providers

import { useState } from 'react'
import { ShoppingCart, Package, Wifi, WifiOff } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import { useToast } from './hooks/useToast'
import Toast from './components/Toast'
import Caja from './modules/Caja/Caja'
import Inventario from './modules/Inventario/Inventario'
import './App.css'

// Componente interno que consume el contexto
function AppShell() {
  const [activeTab, setActiveTab] = useState('caja')
  const { toasts, addToast, removeToast } = useToast()
  const { isDemo } = useApp()

  return (
    <div className="app-shell">
      {/* Barra de navegación superior */}
      <nav className="nav-top" role="navigation" aria-label="Navegación principal">
        {/* Logo */}
        <div className="nav-logo" aria-label="POSWeb">
          POS<span>Web</span>
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

        {/* Indicador de modo */}
        <div className="nav-mode-indicator" title={isDemo ? 'Modo demo — configura Supabase para persistencia' : 'Conectado a Supabase'}>
          {isDemo ? (
            <><WifiOff size={13} /><span>Demo</span></>
          ) : (
            <><Wifi size={13} /><span>Conectado</span></>
          )}
        </div>
      </nav>

      {/* Contenido del módulo activo */}
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
            <ShoppingCart size={22} />
            <span>Caja</span>
          </button>
          <button
            className={`bottom-nav-item ${activeTab === 'inventario' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventario')}
            id="bottom-tab-inventario"
            aria-label="Inventario"
          >
            <Package size={22} />
            <span>Inventario</span>
          </button>
        </div>
      </nav>

      {/* Notificaciones toast */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default function App() {
  const { toasts, addToast, removeToast } = useToast()

  return (
    <AppProvider addToast={addToast}>
      <AppShell />
      <Toast toasts={toasts} removeToast={removeToast} />
    </AppProvider>
  )
}
