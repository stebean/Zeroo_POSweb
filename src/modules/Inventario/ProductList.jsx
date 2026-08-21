// src/modules/Inventario/ProductList.jsx
// Lista del inventario actual con búsqueda y edición manual

import { useState, useMemo } from 'react'
import { Search, Edit2, Check, X, AlertTriangle, Package } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import './ProductList.css'

export default function ProductList({ addToast }) {
  const { products, isDemo, loadProducts, loadingProducts } = useApp()
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return products
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.internal_key && p.internal_key.toLowerCase().includes(q))
    )
  }, [products, search])

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditValues({
      name: product.name,
      internal_key: product.internal_key || '',
      sale_price: product.sale_price,
      cost_price: product.cost_price,
      stock: product.stock,
      low_stock_threshold: product.low_stock_threshold,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({})
  }

  const saveEdit = async (productId) => {
    setSaving(true)
    try {
      if (isDemo) {
        // Demo: actualizar solo estado local via loadProducts (simplificado)
        addToast('Cambios guardados (modo demo — no persistido)', 'info')
      } else {
        const { error } = await supabase
          .from('products')
          .update({
            ...editValues,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId)

        if (error) throw error
        await loadProducts()
        addToast('Producto actualizado', 'success')
      }
      cancelEdit()
    } catch (err) {
      addToast('Error al guardar: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loadingProducts) {
    return (
      <div className="product-list-loading">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="product-list-skeleton" />
        ))}
      </div>
    )
  }

  return (
    <div className="product-list-wrapper">
      {/* Buscador */}
      <div className="product-list-search">
        <Search size={15} color="var(--text-disabled)" className="pl-search-icon" />
        <input
          type="search"
          className="input"
          style={{ paddingLeft: 36 }}
          placeholder="Buscar por nombre o clave..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="inventory-search"
          aria-label="Buscar en inventario"
        />
      </div>

      {/* Tabla */}
      <div className="product-list-table-wrap">
        <table className="product-list-table" aria-label="Inventario de productos">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Clave</th>
              <th>Stock</th>
              <th>Costo</th>
              <th>P. Venta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="product-list-empty">
                    <Package size={28} color="var(--text-disabled)" />
                    <span>No hay productos</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(product => {
                const isLow = product.stock > 0 && product.stock < product.low_stock_threshold
                const isZero = product.stock === 0
                const isEditing = editingId === product.id

                return (
                  <tr key={product.id} className={isEditing ? 'editing-row' : ''}>
                    {/* Nombre */}
                    <td>
                      {isEditing ? (
                        <input
                          className="input input-sm"
                          value={editValues.name}
                          onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                          id={`edit-name-${product.id}`}
                        />
                      ) : (
                        <span className="product-list-name">{product.name}</span>
                      )}
                    </td>

                    {/* Clave */}
                    <td>
                      {isEditing ? (
                        <input
                          className="input input-sm"
                          style={{ width: 100 }}
                          value={editValues.internal_key}
                          onChange={e => setEditValues(v => ({ ...v, internal_key: e.target.value }))}
                          id={`edit-key-${product.id}`}
                        />
                      ) : (
                        <span className="product-list-key">{product.internal_key || '—'}</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td>
                      <div className="stock-cell">
                        {isEditing ? (
                          <input
                            type="number"
                            className="input input-sm"
                            style={{ width: 70 }}
                            value={editValues.stock}
                            min={0}
                            onChange={e => setEditValues(v => ({ ...v, stock: parseInt(e.target.value) || 0 }))}
                            id={`edit-stock-${product.id}`}
                          />
                        ) : (
                          <>
                            <span className={`stock-value ${isLow ? 'low' : ''} ${isZero ? 'zero' : ''}`}>
                              {product.stock}
                            </span>
                            {isLow && <AlertTriangle size={13} color="var(--warning)" />}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Costo */}
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          className="input input-sm"
                          style={{ width: 80 }}
                          value={editValues.cost_price}
                          step={0.01}
                          onChange={e => setEditValues(v => ({ ...v, cost_price: parseFloat(e.target.value) || 0 }))}
                          id={`edit-cost-${product.id}`}
                        />
                      ) : (
                        <span>${product.cost_price?.toFixed(2)}</span>
                      )}
                    </td>

                    {/* Precio venta */}
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          className="input input-sm"
                          style={{ width: 80 }}
                          value={editValues.sale_price}
                          step={0.01}
                          onChange={e => setEditValues(v => ({ ...v, sale_price: parseFloat(e.target.value) || 0 }))}
                          id={`edit-price-${product.id}`}
                        />
                      ) : (
                        <span className="sale-price">${product.sale_price?.toFixed(2)}</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {isEditing ? (
                          <>
                            <button
                              className="btn btn-icon"
                              style={{ width: 30, height: 30, background: 'var(--success-light)' }}
                              onClick={() => saveEdit(product.id)}
                              disabled={saving}
                              aria-label="Guardar cambios"
                              id={`save-product-${product.id}`}
                            >
                              {saving ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Check size={13} color="var(--success)" />}
                            </button>
                            <button
                              className="btn btn-icon"
                              style={{ width: 30, height: 30 }}
                              onClick={cancelEdit}
                              aria-label="Cancelar edición"
                            >
                              <X size={13} color="var(--text-disabled)" />
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-icon"
                            style={{ width: 30, height: 30 }}
                            onClick={() => startEdit(product)}
                            aria-label={`Editar ${product.name}`}
                            id={`edit-product-${product.id}`}
                          >
                            <Edit2 size={13} color="var(--text-secondary)" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
