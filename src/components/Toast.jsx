// src/components/Toast.jsx
// Componente de notificaciones toast

import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const ICONS = {
  success: <CheckCircle size={16} color="var(--success)" />,
  error: <AlertCircle size={16} color="var(--danger)" />,
  warning: <AlertTriangle size={16} color="var(--warning)" />,
  info: <Info size={16} color="var(--accent)" />,
}

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container" role="region" aria-label="Notificaciones">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${toast.exiting ? 'exiting' : ''}`}
          role="alert"
        >
          {ICONS[toast.type] || ICONS.info}
          <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-disabled)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Cerrar notificación"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
