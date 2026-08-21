// src/modules/Caja/ProductCard.jsx
// Tarjeta de producto para el módulo Caja

import { useApp } from '../../context/AppContext'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const { cart, addToCart } = useApp()

  const cartItem = cart.find(item => item.product_id === product.id)
  const quantityInCart = cartItem?.quantity || 0
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock < product.low_stock_threshold

  const handleClick = () => {
    if (isOutOfStock) return
    if (quantityInCart >= product.stock) return
    addToCart(product)
  }

  return (
    <button
      className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
      onClick={handleClick}
      disabled={isOutOfStock}
      aria-label={`Agregar ${product.name} al carrito`}
      id={`product-${product.id}`}
    >
      {/* Badge de cantidad en carrito */}
      {quantityInCart > 0 && (
        <span className="product-cart-badge" aria-label={`${quantityInCart} en carrito`}>
          {quantityInCart}
        </span>
      )}

      {/* Indicador de stock bajo */}
      {isLowStock && (
        <span className="product-stock-warning">
          Bajo
        </span>
      )}

      {/* Contenido de la tarjeta */}
      <div className="product-card-body">
        <div className="product-icon">
          {product.name.charAt(0).toUpperCase()}
        </div>
        <div className="product-info">
          <p className="product-name">{product.name}</p>
          {product.internal_key && (
            <p className="product-key">{product.internal_key}</p>
          )}
        </div>
        <div className="product-footer">
          <span className="product-price">
            ${product.sale_price?.toFixed(2)}
          </span>
          <span className={`product-stock ${isLowStock ? 'low' : ''} ${isOutOfStock ? 'zero' : ''}`}>
            {isOutOfStock ? 'Sin stock' : `${product.stock} uds`}
          </span>
        </div>
      </div>
    </button>
  )
}
