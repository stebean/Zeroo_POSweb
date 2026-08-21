// src/modules/Inventario/ExtractionTable.jsx
// Tabla editable de productos extraídos por la IA con matching semántico

import { useState } from 'react'
import { Trash2, Check, ChevronDown, AlertCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import './ExtractionTable.css'

export default function ExtractionTable({ items, onItemsChange, onConfirm, isConfirming }) {
  const { products } = useApp()
  const [expandedRow, setExpandedRow] = useState(null)

  const updateItem = (id, field, value) => {
    onItemsChange(prev =>
      prev.map(item => item._id === id ? { ...item, [field]: value } : item)
    )
  }

  const removeItem = (id) => {
    onItemsChange(prev => prev.filter(item => item._id !== id))
  }

  const toggleNew = (id) => {
    onItemsChange(prev =>
      prev.map(item => {
        if (item._id !== id) return item
        return {
          ...item,
          is_new: !item.is_new,
          matched_product: !item.is_new ? null : item.matched_product,
        }
      })
    )
  }

  const setMatchedProduct = (id, productId) => {
    const product = products.find(p => p.id === productId)
    onItemsChange(prev =>
      prev.map(item => {
        if (item._id !== id) return item
        return {
          ...item,
          matched_product: product,
          mapped_name: product ? product.name : item.raw_name,
          sale_price: product ? product.sale_price : item.sale_price,
          is_new: !product,
        }
      })
    )
  }

  const newCount = items.filter(i => i.is_new).length
  const existingCount = items.filter(i => !i.is_new).length

  return (
    <div className="extraction-table-wrapper">
      {/* Resumen */}
      <div className="extraction-summary">
        <span className="badge badge-success">{existingCount} existentes</span>
        <span className="badge badge-new">{newCount} nuevos</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {items.length} productos detectados
        </span>
      </div>

      <span className="mobile-scroll-hint">
        Desliza a la derecha para ver costos y precios →
      </span>

      {/* Tabla */}
      <div className="extraction-table-container">
        <table className="extraction-table" aria-label="Productos extraídos para revisión">
          <thead>
            <tr>
              <th>Clave proveedor</th>
              <th>Producto catálogo</th>
              <th>Cant.</th>
              <th>Costo</th>
              <th>P. Venta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <>
                <tr
                  key={item._id}
                  className={`extraction-row ${item.is_new ? 'is-new' : ''}`}
                >
                  {/* Clave del proveedor */}
                  <td>
                    <div className="raw-name-cell">
                      <span className="raw-name">{item.raw_name}</span>
                      {item.is_new ? (
                        <span className="badge badge-new">NUEVO</span>
                      ) : item.match_score < 0.6 && (
                        <span
                          className="match-warning"
                          title={`Similitud: ${Math.round(item.match_score * 100)}%`}
                        >
                          <AlertCircle size={12} />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Nombre mapeado / selector de producto */}
                  <td>
                    {item.is_new ? (
                      <input
                        className="input input-sm"
                        value={item.mapped_name}
                        onChange={e => updateItem(item._id, 'mapped_name', e.target.value)}
                        placeholder="Nombre del nuevo producto"
                        aria-label="Nombre del nuevo producto"
                        id={`item-name-${item._id}`}
                      />
                    ) : (
                      <select
                        className="input input-sm product-select"
                        value={item.matched_product?.id || ''}
                        onChange={e => setMatchedProduct(item._id, e.target.value)}
                        aria-label="Seleccionar producto del catálogo"
                        id={`item-product-${item._id}`}
                      >
                        <option value="">— Sin coincidencia —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                    <button
                      className="toggle-new-btn"
                      onClick={() => toggleNew(item._id)}
                      title={item.is_new ? 'Asociar a producto existente' : 'Marcar como nuevo'}
                    >
                      {item.is_new ? 'Asociar existente' : 'Crear nuevo'}
                    </button>
                  </td>

                  {/* Cantidad */}
                  <td>
                    <input
                      type="number"
                      className="input input-sm"
                      style={{ width: 70, textAlign: 'right' }}
                      value={item.quantity}
                      min={1}
                      onChange={e => updateItem(item._id, 'quantity', parseInt(e.target.value) || 1)}
                      aria-label="Cantidad"
                      id={`item-qty-${item._id}`}
                    />
                  </td>

                  {/* Costo */}
                  <td>
                    <div className="price-input-wrap">
                      <span>$</span>
                      <input
                        type="number"
                        className="input input-sm"
                        style={{ width: 80, textAlign: 'right' }}
                        value={item.unit_cost}
                        min={0}
                        step={0.01}
                        onChange={e => updateItem(item._id, 'unit_cost', parseFloat(e.target.value) || 0)}
                        aria-label="Costo unitario"
                        id={`item-cost-${item._id}`}
                      />
                    </div>
                  </td>

                  {/* Precio de venta */}
                  <td>
                    <div className="price-input-wrap">
                      <span>$</span>
                      <input
                        type="number"
                        className="input input-sm"
                        style={{ width: 80, textAlign: 'right' }}
                        value={item.sale_price}
                        min={0}
                        step={0.01}
                        onChange={e => updateItem(item._id, 'sale_price', parseFloat(e.target.value) || 0)}
                        aria-label="Precio de venta"
                        id={`item-price-${item._id}`}
                      />
                    </div>
                  </td>

                  {/* Eliminar */}
                  <td>
                    <button
                      className="btn btn-icon"
                      style={{ width: 30, height: 30 }}
                      onClick={() => removeItem(item._id)}
                      aria-label={`Eliminar ${item.raw_name}`}
                      id={`item-delete-${item._id}`}
                    >
                      <Trash2 size={13} color="var(--text-disabled)" />
                    </button>
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botón confirmar */}
      <div className="extraction-confirm-bar">
        <div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Revisa los datos antes de confirmar el ingreso al inventario.
          </p>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={onConfirm}
          disabled={isConfirming || items.length === 0}
          id="confirm-inventory-btn"
        >
          {isConfirming ? (
            <><div className="spinner" /> Agregando...</>
          ) : (
            <><Check size={17} /> Agregar al inventario</>
          )}
        </button>
      </div>
    </div>
  )
}
