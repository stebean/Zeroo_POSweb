// src/data/sampleProducts.js
// Productos de demostración para el catálogo inicial

export const SAMPLE_PRODUCTS = [
  {
    id: 'demo-001',
    name: 'Leche Entera 1L',
    internal_key: 'LEC-ENT-1LT',
    description: 'Leche entera pasteurizada',
    cost_price: 18.50,
    sale_price: 24.00,
    stock: 48,
    low_stock_threshold: 10,
  },
  {
    id: 'demo-002',
    name: 'Refresco Cola 600ml',
    internal_key: 'REF-COL-600',
    description: 'Refresco de cola 600ml',
    cost_price: 11.00,
    sale_price: 16.00,
    stock: 72,
    low_stock_threshold: 12,
  },
  {
    id: 'demo-003',
    name: 'Aceite Vegetal 1L',
    internal_key: 'ACE-VEG-1LT',
    description: 'Aceite vegetal comestible',
    cost_price: 35.00,
    sale_price: 48.00,
    stock: 3,
    low_stock_threshold: 5,
  },
  {
    id: 'demo-004',
    name: 'Arroz Extra 1kg',
    internal_key: 'ARR-EXT-1KG',
    description: 'Arroz extra largo grano',
    cost_price: 22.00,
    sale_price: 30.00,
    stock: 25,
    low_stock_threshold: 8,
  },
  {
    id: 'demo-005',
    name: 'Jabón de Barra 150g',
    internal_key: 'JAB-BAR-150',
    description: 'Jabón de barra multiusos',
    cost_price: 8.50,
    sale_price: 13.00,
    stock: 0,
    low_stock_threshold: 5,
  },
  {
    id: 'demo-006',
    name: 'Papel Higiénico 4 rollos',
    internal_key: 'PAP-HIG-4R',
    description: 'Papel higiénico doble hoja',
    cost_price: 28.00,
    sale_price: 38.00,
    stock: 15,
    low_stock_threshold: 6,
  },
  {
    id: 'demo-007',
    name: 'Azúcar Refinada 1kg',
    internal_key: 'AZU-REF-1KG',
    description: 'Azúcar blanca refinada',
    cost_price: 19.00,
    sale_price: 26.00,
    stock: 18,
    low_stock_threshold: 5,
  },
  {
    id: 'demo-008',
    name: 'Detergente Líquido 500ml',
    internal_key: 'DET-LIQ-500',
    description: 'Detergente líquido ropa',
    cost_price: 30.00,
    sale_price: 42.00,
    stock: 2,
    low_stock_threshold: 5,
  },
]

export const SAMPLE_ALIASES = [
  { id: 'alias-001', product_id: 'demo-001', alias: 'LEC-CONT-1LT' },
  { id: 'alias-002', product_id: 'demo-002', alias: 'COL-600ML' },
  { id: 'alias-003', product_id: 'demo-004', alias: 'ARR-LARGOR-1KG' },
]

// PDF de ejemplo en base64 (factura simulada con productos de proveedor)
// Este PDF contiene: 8 productos con claves técnicas de proveedor
export const SAMPLE_INVOICE_URL = null // Se generará inline como texto
