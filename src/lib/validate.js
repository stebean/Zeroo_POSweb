// src/lib/validate.js
// Validación y sanitización de todas las entradas del usuario

/**
 * Elimina caracteres peligrosos para prevenir XSS
 */
export function sanitizeText(value) {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .replace(/[<>'"&]/g, (char) => ({
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#x27;',
      '"': '&quot;',
      '&': '&amp;',
    }[char]))
    .slice(0, 500) // máximo 500 caracteres
}

/**
 * Valida que un número sea positivo y finito
 */
export function validatePositiveNumber(value, fieldName = 'valor') {
  const num = parseFloat(value)
  if (isNaN(num)) throw new Error(`${fieldName} debe ser un número`)
  if (num < 0) throw new Error(`${fieldName} no puede ser negativo`)
  if (!isFinite(num)) throw new Error(`${fieldName} inválido`)
  return parseFloat(num.toFixed(2))
}

/**
 * Valida que una cantidad sea un entero positivo
 */
export function validateQuantity(value, fieldName = 'cantidad') {
  const num = parseInt(value)
  if (isNaN(num) || num < 1) throw new Error(`${fieldName} debe ser al menos 1`)
  if (num > 999999) throw new Error(`${fieldName} excede el límite permitido`)
  return num
}

/**
 * Valida email para autenticación
 */
export function validateEmail(email) {
  const clean = sanitizeText(email)
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(clean)) throw new Error('Email inválido')
  if (clean.length > 254) throw new Error('Email demasiado largo')
  return clean.toLowerCase()
}

/**
 * Valida un archivo antes de procesarlo
 */
export function validateFile(file) {
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB

  if (!file) throw new Error('No se seleccionó ningún archivo')
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Solo JPG, PNG, WEBP y PDF.')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('El archivo supera el límite de 10MB')
  }
  if (file.size === 0) {
    throw new Error('El archivo está vacío')
  }
  return true
}

/**
 * Valida y sanitiza un producto antes de guardarlo
 */
export function validateProduct(data) {
  return {
    name: sanitizeText(data.name),
    internal_key: data.internal_key ? sanitizeText(data.internal_key) : null,
    description: data.description ? sanitizeText(data.description) : null,
    sale_price: validatePositiveNumber(data.sale_price, 'Precio de venta'),
    cost_price: validatePositiveNumber(data.cost_price, 'Costo'),
    stock: validateQuantity(data.stock, 'Stock') - 1 + 1, // fuerza entero
    low_stock_threshold: validateQuantity(data.low_stock_threshold || 5, 'Umbral de stock bajo'),
  }
}

/**
 * Valida los items extraídos antes de confirmar ingreso
 */
export function validatePurchaseItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No hay productos para confirmar')
  }
  if (items.length > 500) {
    throw new Error('Demasiados productos en una sola compra (máx. 500)')
  }

  return items.map((item, idx) => {
    if (!item.mapped_name?.trim()) {
      throw new Error(`El producto en la fila ${idx + 1} no tiene nombre`)
    }
    return {
      ...item,
      mapped_name: sanitizeText(item.mapped_name),
      raw_name: sanitizeText(item.raw_name),
      quantity: validateQuantity(item.quantity, `Cantidad en fila ${idx + 1}`),
      unit_cost: validatePositiveNumber(item.unit_cost, `Costo en fila ${idx + 1}`),
      sale_price: validatePositiveNumber(item.sale_price || 0, `Precio venta en fila ${idx + 1}`),
    }
  })
}

/**
 * Rate limiting simple en cliente (defensa en profundidad)
 * La protección real está en Supabase Auth y RLS
 */
const _actionTimestamps = {}

export function clientRateLimit(action, maxPerMinute = 5) {
  const now = Date.now()
  const key = action
  const oneMinuteAgo = now - 60_000

  if (!_actionTimestamps[key]) _actionTimestamps[key] = []

  // Limpiar timestamps viejos
  _actionTimestamps[key] = _actionTimestamps[key].filter(t => t > oneMinuteAgo)

  if (_actionTimestamps[key].length >= maxPerMinute) {
    throw new Error('Demasiados intentos. Espera un momento antes de continuar.')
  }

  _actionTimestamps[key].push(now)
}
