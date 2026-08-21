// src/modules/Caja/Caja.jsx
// Módulo principal de Punto de Venta

import { useState, useMemo } from 'react'
import { Search, Package } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import ProductCard from './ProductCard'
import Cart from './Cart'
import './Caja.css'

export default function Caja({ addToast }) {
  const { products, loadingProducts } = useApp()
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrar productos en tiempo real
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return products
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.internal_key && p.internal_key.toLowerCase().includes(q))
    )
  }, [products, searchQuery])

  return (
    <div className="caja-layout">
      {/* Área principal de productos */}
      <main className="caja-main">
        {/* Buscador */}
        <div className="caja-search-bar">
          <Search size={16} color="var(--text-disabled)" className="search-icon" />
          <input
            type="search"
            className="input caja-search-input"
            placeholder="Buscar producto o clave..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="caja-search"
            aria-label="Buscar productos"
          />
        </div>

        {/* Grid de productos */}
        {loadingProducts ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="product-card-skeleton" aria-hidden="true" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="caja-empty-state">
            <Package size={40} color="var(--text-disabled)" />
            <p>No se encontraron productos</p>
            {searchQuery && (
              <span>Intenta con otra búsqueda</span>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Carrito */}
      <Cart addToast={addToast} />
    </div>
  )
}
