// src/lib/matching.js
// Matching semántico básico entre nombres de proveedor y catálogo de productos

/**
 * Normaliza un string para comparación: minúsculas, sin acentos, sin caracteres especiales
 */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, ' ')    // solo alfanumérico
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calcula similitud de Jaccard entre dos strings tokenizados
 */
function jaccardSimilarity(a, b) {
  const tokensA = new Set(normalize(a).split(' ').filter(Boolean))
  const tokensB = new Set(normalize(b).split(' ').filter(Boolean))
  
  if (tokensA.size === 0 && tokensB.size === 0) return 1
  if (tokensA.size === 0 || tokensB.size === 0) return 0

  const intersection = new Set([...tokensA].filter(t => tokensB.has(t)))
  const union = new Set([...tokensA, ...tokensB])
  
  return intersection.size / union.size
}

/**
 * Verifica si un alias (clave de proveedor) hace match exacto con raw_name
 */
function aliasExactMatch(rawName, aliases) {
  const normalizedRaw = normalize(rawName)
  return aliases.find(a => normalize(a.alias) === normalizedRaw)
}

/**
 * Busca el mejor match en el catálogo para un nombre/clave de proveedor
 * @param {string} rawName - Nombre crudo del proveedor
 * @param {Array} products - Lista de productos del catálogo
 * @param {Array} aliases - Lista de todos los aliases (product_id, alias)
 * @param {number} threshold - Umbral mínimo de similitud (0-1)
 * @returns {{ product: object|null, score: number, matchType: 'alias'|'name'|'none' }}
 */
export function findBestMatch(rawName, products, aliases, threshold = 0.35) {
  if (!rawName || products.length === 0) {
    return { product: null, score: 0, matchType: 'none' }
  }

  // 1. Coincidencia exacta por alias
  const aliasMatch = aliasExactMatch(rawName, aliases)
  if (aliasMatch) {
    const product = products.find(p => p.id === aliasMatch.product_id)
    if (product) return { product, score: 1, matchType: 'alias' }
  }

  // 2. Similitud por nombre del producto y alias
  let bestScore = 0
  let bestProduct = null

  for (const product of products) {
    // Comparar con nombre del producto
    const nameScore = jaccardSimilarity(rawName, product.name)
    if (nameScore > bestScore) {
      bestScore = nameScore
      bestProduct = product
    }

    // Comparar con clave interna
    if (product.internal_key) {
      const keyScore = jaccardSimilarity(rawName, product.internal_key)
      if (keyScore > bestScore) {
        bestScore = keyScore
        bestProduct = product
      }
    }

    // Comparar con aliases del producto
    const productAliases = aliases.filter(a => a.product_id === product.id)
    for (const alias of productAliases) {
      const aliasScore = jaccardSimilarity(rawName, alias.alias)
      if (aliasScore > bestScore) {
        bestScore = aliasScore
        bestProduct = product
      }
    }
  }

  if (bestScore >= threshold && bestProduct) {
    return { product: bestProduct, score: bestScore, matchType: 'name' }
  }

  return { product: null, score: bestScore, matchType: 'none' }
}

/**
 * Aplica matching a todos los items extraídos por la IA
 */
export function matchExtractedItems(extractedItems, products, aliases) {
  return extractedItems.map(item => {
    const { product, score, matchType } = findBestMatch(item.raw_name, products, aliases)
    
    return {
      ...item,
      // ID temporal para la tabla editable
      _id: Math.random().toString(36).slice(2),
      // Producto matcheado (si hay)
      matched_product: product,
      match_score: score,
      match_type: matchType,
      is_new: !product,
      // Datos editables con defaults del match
      mapped_name: product ? product.name : item.raw_name,
      sale_price: product ? product.sale_price : (item.unit_cost * 1.3).toFixed(2),
    }
  })
}
