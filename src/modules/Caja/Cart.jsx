// src/modules/Caja/Cart.jsx
// Panel/Bottom Sheet del carrito de compras

import { useState } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, X, ChevronUp } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import './Cart.css'

export default function Cart({ addToast }) {
  const {
    cart, cartTotal, cartCount,
    updateCartQuantity, removeFromCart, clearCart,
    confirmSale,
  } = useApp()

  const [confirming, setConfirming] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // solo mobile

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await confirmSale()
      addToast('¡Venta confirmada exitosamente!', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setConfirming(false)
    }
  }

  const handleClearCart = () => {
    clearCart()
    setShowCancelConfirm(false)
    setIsOpen(false)
    addToast('Venta cancelada', 'info')
  }

  const cartContent = (
    <div className="cart-inner">
      {/* Header */}
      <div className="cart-header">
        <div className="cart-header-left">
          <ShoppingCart size={18} />
          <span>Carrito</span>
          {cartCount > 0 && (
            <span className="cart-count-badge">{cartCount}</span>
          )}
        </div>
        {cart.length > 0 && (
          <button
            className="btn btn-icon"
            onClick={() => setShowCancelConfirm(true)}
            title="Cancelar venta"
            aria-label="Cancelar venta"
            id="cart-cancel-btn"
          >
            <Trash2 size={15} color="var(--danger)" />
          </button>
        )}
      </div>

      {/* Líneas del carrito */}
      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={32} color="var(--text-disabled)" />
            <p>El carrito está vacío</p>
            <span>Toca un producto para agregarlo</span>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.product_id} className="cart-item">
              <div className="cart-item-info">
                <p className="cart-item-name">{item.name}</p>
                <p className="cart-item-price">${item.sale_price?.toFixed(2)} c/u</p>
              </div>
              <div className="cart-item-controls">
                <button
                  className="qty-btn"
                  onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                  aria-label="Quitar uno"
                  id={`cart-minus-${item.product_id}`}
                >
                  <Minus size={13} />
                </button>
                <span className="qty-value">{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  aria-label="Agregar uno"
                  id={`cart-plus-${item.product_id}`}
                >
                  <Plus size={13} />
                </button>
                <button
                  className="btn btn-icon"
                  onClick={() => removeFromCart(item.product_id)}
                  style={{ width: 28, height: 28 }}
                  aria-label={`Eliminar ${item.name}`}
                  id={`cart-remove-${item.product_id}`}
                >
                  <X size={13} color="var(--text-disabled)" />
                </button>
              </div>
              <span className="cart-item-subtotal">
                ${(item.sale_price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Total y botón cobrar */}
      {cart.length > 0 && (
        <div className="cart-footer">
          <div className="cart-total-row">
            <span className="cart-total-label">Total</span>
            <span className="cart-total-amount">${cartTotal.toFixed(2)}</span>
          </div>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleConfirm}
            disabled={confirming}
            id="cart-confirm-btn"
          >
            {confirming ? (
              <><div className="spinner" /> Procesando...</>
            ) : (
              `Cobrar $${cartTotal.toFixed(2)}`
            )}
          </button>
        </div>
      )}

      {/* Confirmación de cancelar */}
      {showCancelConfirm && (
        <div className="cart-cancel-confirm">
          <p>¿Cancelar la venta actual?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowCancelConfirm(false)}
            >
              No, volver
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleClearCart}
              id="cart-confirm-cancel-btn"
            >
              Sí, cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop: panel fijo derecha */}
      <aside className="cart-panel-desktop" aria-label="Carrito de compras">
        {cartContent}
      </aside>

      {/* Mobile: bottom sheet */}
      <div className="cart-mobile-trigger" onClick={() => setIsOpen(true)} id="cart-mobile-trigger">
        <div className="cart-mobile-trigger-inner">
          <ShoppingCart size={18} />
          <span>{cartCount > 0 ? `${cartCount} productos` : 'Carrito vacío'}</span>
        </div>
        {cartCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong>${cartTotal.toFixed(2)}</strong>
            <ChevronUp size={16} />
          </div>
        )}
      </div>

      {isOpen && (
        <>
          <div className="overlay" onClick={() => setIsOpen(false)} />
          <div className="cart-bottom-sheet">
            <div className="bottom-sheet-handle" />
            <button
              className="bottom-sheet-close"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar carrito"
            >
              <X size={18} />
            </button>
            {cartContent}
          </div>
        </>
      )}
    </>
  )
}
