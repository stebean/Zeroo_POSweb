// src/context/AppContext.jsx
// Contexto global de la app — maneja productos, carrito y estado de carga

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { validatePurchaseItems } from '../lib/validate'
import { SAMPLE_PRODUCTS, SAMPLE_ALIASES } from '../data/sampleProducts'

const AppContext = createContext(null)

export function AppProvider({ children, addToast }) {
  // Estado de productos y catálogo
  const [products, setProducts] = useState([])
  const [aliases, setAliases] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  // Estado del carrito
  const [cart, setCart] = useState([])

  // Carga de productos desde Supabase o datos de demo
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error

      const { data: aliasData } = await supabase
        .from('product_aliases')
        .select('*')

      setProducts(data || [])
      setAliases(aliasData || [])
      setIsDemo(false)
    } catch (err) {
      // Fallback a datos de demostración si Supabase no está configurado
      console.warn('Usando datos de demostración:', err.message)
      setProducts(SAMPLE_PRODUCTS)
      setAliases(SAMPLE_ALIASES)
      setIsDemo(true)
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // --- Carrito ---

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        sale_price: product.sale_price,
        quantity: 1,
        stock: product.stock,
      }]
    })
  }, [])

  const updateCartQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) {
      setCart(prev => prev.filter(item => item.product_id !== productId))
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    )
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const cartTotal = cart.reduce((sum, item) => sum + item.sale_price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // --- Confirmar venta ---

  const confirmSale = useCallback(async () => {
    if (cart.length === 0) return

    // Verificar stock suficiente
    const stockIssues = cart.filter(item => item.quantity > item.stock)
    if (stockIssues.length > 0) {
      throw new Error(
        `Stock insuficiente para: ${stockIssues.map(i => i.name).join(', ')}`
      )
    }

    if (isDemo) {
      // Modo demo: solo actualizar estado local
      setProducts(prev =>
        prev.map(product => {
          const cartItem = cart.find(item => item.product_id === product.id)
          if (cartItem) {
            return { ...product, stock: product.stock - cartItem.quantity }
          }
          return product
        })
      )
      // Actualizar stock en el carrito también
      setCart(prev =>
        prev.map(item => ({
          ...item,
          stock: item.stock - item.quantity,
        }))
      )
      clearCart()
      return
    }

    // Modo real: guardar en Supabase
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({ total: cartTotal })
      .select()
      .single()

    if (saleError) throw saleError

    // Insertar líneas de venta
    const saleItems = cart.map(item => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.sale_price,
      subtotal: item.sale_price * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)

    if (itemsError) throw itemsError

    // Descontar stock (RPC o update individual)
    for (const item of cart) {
      await supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
    }

    await loadProducts()
    clearCart()
  }, [cart, cartTotal, isDemo, clearCart, loadProducts])

  // --- Confirmar ingreso de inventario ---

  const confirmInventoryEntry = useCallback(async (rawItems, purchaseId) => {
    // Validar y sanitizar todos los items antes de persistir
    const items = validatePurchaseItems(rawItems)
    if (isDemo) {
      // Modo demo: actualizar estado local
      setProducts(prev => {
        const updated = [...prev]
        const newProducts = []

        for (const item of items) {
          if (item.matched_product && !item.is_new) {
            const idx = updated.findIndex(p => p.id === item.matched_product.id)
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                stock: updated[idx].stock + item.quantity,
                cost_price: item.unit_cost,
              }
            }
          } else {
            newProducts.push({
              id: `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: item.mapped_name,
              internal_key: item.raw_name,
              cost_price: item.unit_cost,
              sale_price: parseFloat(item.sale_price) || item.unit_cost * 1.3,
              stock: item.quantity,
              low_stock_threshold: 5,
            })
          }
        }

        return [...updated, ...newProducts]
      })
      return { updated: items.filter(i => !i.is_new).length, created: items.filter(i => i.is_new).length }
    }

    // Modo real: Supabase
    let updatedCount = 0
    let createdCount = 0

    for (const item of items) {
      if (!item.is_new && item.matched_product) {
        // Actualizar stock existente
        const { error } = await supabase
          .from('products')
          .update({
            stock: item.matched_product.stock + item.quantity,
            cost_price: item.unit_cost,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.matched_product.id)

        if (!error) {
          updatedCount++
          // Guardar alias si es nuevo
          const existingAlias = aliases.find(
            a => a.product_id === item.matched_product.id && a.alias === item.raw_name
          )
          if (!existingAlias) {
            await supabase.from('product_aliases').insert({
              product_id: item.matched_product.id,
              alias: item.raw_name,
            })
          }
        }
      } else {
        // Crear producto nuevo
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            name: item.mapped_name,
            internal_key: item.raw_name,
            cost_price: item.unit_cost,
            sale_price: parseFloat(item.sale_price) || item.unit_cost * 1.3,
            stock: item.quantity,
          })
          .select()
          .single()

        if (!error && newProduct) {
          createdCount++
          // Guardar alias original del proveedor
          await supabase.from('product_aliases').insert({
            product_id: newProduct.id,
            alias: item.raw_name,
          })
        }
      }
    }

    // Actualizar estado de la compra
    if (purchaseId) {
      await supabase
        .from('purchases')
        .update({ status: 'confirmed' })
        .eq('id', purchaseId)
    }

    await loadProducts()
    return { updated: updatedCount, created: createdCount }
  }, [isDemo, aliases, loadProducts])

  const value = {
    products,
    aliases,
    loadingProducts,
    isDemo,
    loadProducts,
    // Carrito
    cart,
    cartTotal,
    cartCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    confirmSale,
    // Inventario
    confirmInventoryEntry,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
