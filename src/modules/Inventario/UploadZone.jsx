// src/modules/Inventario/UploadZone.jsx
// Zona de carga de documentos: drag & drop, clic, Ctrl+V

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, FileText, Image, X, Sparkles, FlaskConical } from 'lucide-react'
import './UploadZone.css'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

// Factura de ejemplo hardcodeada como texto (para US-05)
const SAMPLE_INVOICE_TEXT = `DISTRIBUIDORA OMEGA S.A. DE C.V.
RFC: DOM901231AB3 | Tel: 555-123-4567
Factura No: F-2024-0891 | Fecha: 15/01/2024
===========================================
DETALLE DE COMPRA:

Clave          Descripción              Cant  P.Unit   Total
LEC-CONT-1LT   Leche Cont. Entera 1L    48    $18.50   $888.00
REF-COL-600ML  Refresco Cola 600ml      72    $11.00   $792.00
ACE-VEG-1LT    Aceite Vegetal 1L        24    $35.00   $840.00
ARR-EXT-1KG    Arroz Extra Grano 1kg    36    $22.00   $792.00
DET-LIQ-500    Detergente Líq. 500ml    18    $30.00   $540.00
AZU-REF-1KG    Azúcar Refinada 1kg      30    $19.00   $570.00
ATU-LAT-145    Atún en Lata 145g        60    $14.50   $870.00
GAL-INT-500    Galletas Integrales 500g 24    $28.00   $672.00
===========================================
Subtotal:                                              $5,964.00
IVA (16%):                                              $954.24
TOTAL:                                                $6,918.24
===========================================
Condiciones: Pago a 30 días.`

export default function UploadZone({ onFileSelected, onSampleInvoice, isProcessing }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null) // { url, name, type }
  const inputRef = useRef(null)
  const dragCounter = useRef(0)

  // Manejar Ctrl+V para pegar imágenes del portapapeles
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) handleFile(file)
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const handleFile = useCallback((file) => {
    setError('')

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`Formato no soportado. Acepta: JPG, PNG, WEBP, PDF`)
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`El archivo es demasiado grande. Máximo ${MAX_SIZE_MB}MB`)
      return
    }

    // Generar preview
    if (file.type === 'application/pdf') {
      setPreview({ url: null, name: file.name, type: 'pdf' })
    } else {
      const url = URL.createObjectURL(file)
      setPreview({ url, name: file.name, type: 'image' })
    }

    onFileSelected(file)
  }, [onFileSelected])

  const handleDragEnter = (e) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const clearPreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
    setError('')
  }

  const handleSampleInvoice = () => {
    // Crear un Blob de texto como si fuera un archivo subido
    const blob = new Blob([SAMPLE_INVOICE_TEXT], { type: 'text/plain' })
    const file = new File([blob], 'factura-ejemplo.txt', { type: 'text/plain' })
    setPreview({ url: null, name: 'factura-ejemplo.txt', type: 'sample' })
    onSampleInvoice(SAMPLE_INVOICE_TEXT)
  }

  return (
    <div className="upload-zone-wrapper">
      {/* Botón de prueba (US-05) */}
      <div className="sample-invoice-bar">
        <FlaskConical size={15} />
        <span>¿Quieres probar sin una factura real?</span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleSampleInvoice}
          disabled={isProcessing}
          id="sample-invoice-btn"
        >
          <Sparkles size={13} />
          Probar con factura de ejemplo
        </button>
      </div>

      {/* Zona de drop */}
      {!preview ? (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Zona de carga de documentos. Haz clic o arrastra un archivo."
          id="upload-dropzone"
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleInputChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <div className="upload-zone-content">
            <div className={`upload-icon-wrap ${isDragging ? 'bounce' : ''}`}>
              <Upload size={28} color="var(--accent)" />
            </div>
            <div>
              <p className="upload-title">
                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra tu factura aquí'}
              </p>
              <p className="upload-subtitle">
                o <span className="upload-link">haz clic para seleccionar</span> · también puedes pegar con Ctrl+V
              </p>
            </div>
            <div className="upload-types">
              <span>JPG</span>
              <span>PNG</span>
              <span>WEBP</span>
              <span>PDF</span>
              <span className="upload-size">Máx. 10MB</span>
            </div>
          </div>
        </div>
      ) : (
        /* Preview del archivo */
        <div className="file-preview">
          <div className="file-preview-icon">
            {preview.type === 'image' ? (
              <img src={preview.url} alt="Vista previa" />
            ) : (
              <div className="file-preview-placeholder">
                {preview.type === 'pdf' ? (
                  <FileText size={36} color="var(--accent)" />
                ) : (
                  <Sparkles size={36} color="var(--accent)" />
                )}
                <span>{preview.type === 'sample' ? 'Factura de ejemplo' : 'PDF'}</span>
              </div>
            )}
          </div>
          <div className="file-preview-info">
            <p className="file-preview-name">{preview.name}</p>
            {isProcessing ? (
              <div className="file-processing">
                <div className="spinner" style={{ borderTopColor: 'var(--accent)' }} />
                <span>Analizando documento con IA...</span>
              </div>
            ) : (
              <button
                className="btn btn-secondary btn-sm"
                onClick={clearPreview}
                id="upload-change-btn"
              >
                <X size={13} />
                Cambiar archivo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="upload-error" role="alert">{error}</p>
      )}
    </div>
  )
}
