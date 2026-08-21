// src/lib/gemini.js
// Integración con Google Gemini Flash para extracción de documentos

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

/**
 * Convierte un File/Blob a base64
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Extrae productos de un documento (imagen o PDF) usando Gemini Flash
 * @param {File} file - Archivo a analizar
 * @returns {Promise<{items: Array<{raw_name: string, quantity: number, unit_cost: number}>}>}
 */
export async function extractProductsFromDocument(file) {
  if (!GEMINI_API_KEY) {
    throw new Error('API key de Gemini no configurada. Por favor agrega VITE_GEMINI_API_KEY en tu archivo .env')
  }

  const base64Data = await fileToBase64(file)
  const mimeType = file.type || 'application/pdf'

  // Prompt estructurado para extracción de productos
  const prompt = `Analiza este documento (factura, ticket o nota de compra de proveedor) y extrae TODOS los productos listados.

Devuelve ÚNICAMENTE un objeto JSON válido con este schema exacto, sin texto adicional:
{
  "items": [
    {
      "raw_name": "nombre o clave exacta del producto tal como aparece en el documento",
      "quantity": número entero de unidades,
      "unit_cost": precio unitario como número decimal
    }
  ]
}

Reglas importantes:
- raw_name: copia exactamente la clave o nombre del proveedor (ej: "VC-0200.50", "LEC-CONT-1LT")
- quantity: si no está claro, usa 1
- unit_cost: el precio por unidad (no el total). Si no hay precio, usa 0
- Incluye todos los productos visibles, incluso si tienen datos incompletos
- No incluyas encabezados, totales ni servicios — solo productos individuales
- La respuesta debe ser JSON puro, sin markdown ni explicaciones`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Error de Gemini: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('Gemini no devolvió respuesta. Intenta con otro documento.')
  }

  // Limpiar respuesta y parsear JSON
  const cleanText = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
  
  try {
    const parsed = JSON.parse(cleanText)
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('Formato de respuesta inesperado')
    }
    return parsed
  } catch {
    throw new Error('No se pudo interpretar la respuesta de la IA. Intenta con una imagen más clara.')
  }
}
