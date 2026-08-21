// src/modules/Inventario/Inventario.jsx
// Módulo de inventario: upload + extracción IA + Split View + lista de inventario

import { useState, useCallback } from 'react'
import { Upload, List, RotateCcw, FileText } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { extractProductsFromDocument } from '../../lib/gemini'
import { matchExtractedItems } from '../../lib/matching'
import UploadZone from './UploadZone'
import ExtractionTable from './ExtractionTable'
import ProductList from './ProductList'
import './Inventario.css'

// Factura de ejemplo: simula lo que Gemini devolvería
const SAMPLE_EXTRACTED = {
  items: [
    { raw_name: 'LEC-CONT-1LT', quantity: 48, unit_cost: 18.50 },
    { raw_name: 'REF-COL-600ML', quantity: 72, unit_cost: 11.00 },
    { raw_name: 'ACE-VEG-1LT',  quantity: 24, unit_cost: 35.00 },
    { raw_name: 'ARR-EXT-1KG',  quantity: 36, unit_cost: 22.00 },
    { raw_name: 'DET-LIQ-500',  quantity: 18, unit_cost: 30.00 },
    { raw_name: 'AZU-REF-1KG',  quantity: 30, unit_cost: 19.00 },
    { raw_name: 'ATU-LAT-145',  quantity: 60, unit_cost: 14.50 },
    { raw_name: 'GAL-INT-500',  quantity: 24, unit_cost: 28.00 },
  ]
}

export default function Inventario({ addToast }) {
  const { products, aliases, confirmInventoryEntry } = useApp()

  // Vista activa: 'upload' | 'review' | 'list'
  const [view, setView] = useState('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // Datos de extracción
  const [selectedFile, setSelectedFile] = useState(null)
  const [extractedItems, setExtractedItems] = useState([])
  const [purchaseId, setPurchaseId] = useState(null)

  // Manejar archivo seleccionado
  const handleFileSelected = useCallback(async (file) => {
    setSelectedFile(file)
    setIsProcessing(true)

    try {
      const result = await extractProductsFromDocument(file)
      const matched = matchExtractedItems(result.items, products, aliases)
      setExtractedItems(matched)
      setView('review')
      addToast(`${result.items.length} productos detectados con IA`, 'success')
    } catch (err) {
      addToast('Error al analizar: ' + err.message, 'error')
    } finally {
      setIsProcessing(false)
    }
  }, [products, aliases, addToast])

  // Manejar factura de ejemplo (US-05)
  const handleSampleInvoice = useCallback(async (sampleText) => {
    setIsProcessing(true)

    try {
      // Usar datos de extracción pre-definidos para el demo
      await new Promise(resolve => setTimeout(resolve, 1800)) // simular procesamiento
      const matched = matchExtractedItems(SAMPLE_EXTRACTED.items, products, aliases)
      setExtractedItems(matched)
      setView('review')
      addToast('Factura de ejemplo cargada — 8 productos detectados', 'success')
    } catch (err) {
      addToast('Error: ' + err.message, 'error')
    } finally {
      setIsProcessing(false)
    }
  }, [products, aliases, addToast])

  // Confirmar ingreso al inventario
  const handleConfirmEntry = async () => {
    setIsConfirming(true)
    try {
      const result = await confirmInventoryEntry(extractedItems, purchaseId)
      addToast(
        `✓ ${result.updated} actualizados · ${result.created} nuevos creados`,
        'success'
      )
      // Resetear flujo
      setView('upload')
      setSelectedFile(null)
      setExtractedItems([])
    } catch (err) {
      addToast('Error al confirmar: ' + err.message, 'error')
    } finally {
      setIsConfirming(false)
    }
  }

  const resetFlow = () => {
    setView('upload')
    setSelectedFile(null)
    setExtractedItems([])
  }

  return (
    <div className="inventario-layout">
      {/* Sub-navegación del módulo */}
      <div className="inventario-subnav">
        <button
          className={`subnav-tab ${view !== 'list' ? 'active' : ''}`}
          onClick={() => view === 'list' && setView('upload')}
          id="tab-ingreso"
        >
          <Upload size={15} />
          Ingresar Productos
        </button>
        <button
          className={`subnav-tab ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
          id="tab-inventario"
        >
          <List size={15} />
          Inventario actual
        </button>
      </div>

      {/* Vista de inventario */}
      {view === 'list' ? (
        <div className="inventario-list-view">
          <ProductList addToast={addToast} />
        </div>
      ) : (
        /* Vista de ingreso — Split View o flujo lineal */
        <div className={`inventario-split ${view === 'review' ? 'show-split' : ''}`}>
          {/* Panel izquierdo: upload / preview documento */}
          <div className="split-left">
            <div className="split-section-header">
              <h2>{view === 'review' ? 'Comprobante analizado' : 'Factura, ticket o nota de compra'}</h2>
              {view === 'review' && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={resetFlow}
                  id="upload-reset-btn"
                >
                  <RotateCcw size={13} />
                  Nuevo comprobante
                </button>
              )}
            </div>

            {view === 'review' ? (
              <div className="analyzed-doc-card">
                <div className="analyzed-doc-icon">
                  <FileText size={22} color="var(--accent)" />
                </div>
                <div className="analyzed-doc-details">
                  <span className="analyzed-doc-name">
                    {selectedFile ? selectedFile.name : 'factura-ejemplo.txt'}
                  </span>
                  <span className="analyzed-doc-badge">
                    ✓ IA completada · {extractedItems.length} productos
                  </span>
                </div>
              </div>
            ) : (
              <UploadZone
                onFileSelected={handleFileSelected}
                onSampleInvoice={handleSampleInvoice}
                isProcessing={isProcessing}
              />
            )}

            {/* Preview del documento seleccionado (imagen) */}
            {selectedFile && selectedFile.type?.startsWith('image/') && view === 'review' && (
              <div className="doc-preview-img">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Documento analizado"
                />
              </div>
            )}
          </div>

          {/* Panel derecho: tabla editable (solo en review) */}
          {view === 'review' && (
            <div className="split-right">
              <div className="split-section-header">
                <h2>Productos extraídos</h2>
                <span className="badge badge-success">IA completada</span>
              </div>
              <ExtractionTable
                items={extractedItems}
                onItemsChange={setExtractedItems}
                onConfirm={handleConfirmEntry}
                isConfirming={isConfirming}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
