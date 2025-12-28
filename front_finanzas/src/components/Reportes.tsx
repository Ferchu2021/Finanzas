import React, { useState } from 'react'
import api from '../services/api'

const Reportes: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')
  const [generando, setGenerando] = useState<{ pdf: boolean; excel: boolean }>({ pdf: false, excel: false })

  // Establecer fechas por defecto (mes actual)
  React.useEffect(() => {
    const hoy = new Date()
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    
    setFechaInicio(primerDia.toISOString().split('T')[0])
    setFechaFin(ultimoDia.toISOString().split('T')[0])
  }, [])

  const descargarReporte = async (tipo: 'pdf' | 'excel') => {
    if (!fechaInicio || !fechaFin) {
      alert('Por favor, selecciona las fechas de inicio y fin')
      return
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin')
      return
    }

    try {
      setGenerando(prev => ({ ...prev, [tipo]: true }))
      
      const extension = tipo === 'pdf' ? 'pdf' : 'xlsx'
      const url = `/api/reportes/gastos/${tipo}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      
      const response = await api.get(url, {
        responseType: 'blob'
      })
      
      // Crear blob y descargar
      const blob = new Blob([response.data], {
        type: tipo === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      
      const url_blob = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url_blob
      link.download = `reporte_gastos_${fechaInicio}_${fechaFin}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url_blob)
      
    } catch (error: any) {
      console.error('Error al generar reporte:', error)
      alert('Error al generar el reporte. Por favor, intenta nuevamente.')
    } finally {
      setGenerando(prev => ({ ...prev, [tipo]: false }))
    }
  }

  const seleccionarPeriodo = (periodo: 'mes' | 'trimestre' | 'ano') => {
    const hoy = new Date()
    let inicio: Date
    let fin: Date = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

    switch (periodo) {
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        break
      case 'trimestre':
        const trimestre = Math.floor(hoy.getMonth() / 3)
        inicio = new Date(hoy.getFullYear(), trimestre * 3, 1)
        break
      case 'ano':
        inicio = new Date(hoy.getFullYear(), 0, 1)
        break
      default:
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    }

    setFechaInicio(inicio.toISOString().split('T')[0])
    setFechaFin(fin.toISOString().split('T')[0])
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>Generar Reportes de Gastos</h1>

      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '800px'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#2c3e50', fontSize: '1.3rem' }}>
          Seleccionar Período
        </h2>

        {/* Selectores rápidos de período */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '0.75rem', color: '#7f8c8d', fontSize: '0.9rem' }}>
            Períodos rápidos:
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => seleccionarPeriodo('mes')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ecf0f1',
                color: '#2c3e50',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Mes Actual
            </button>
            <button
              onClick={() => seleccionarPeriodo('trimestre')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ecf0f1',
                color: '#2c3e50',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Trimestre Actual
            </button>
            <button
              onClick={() => seleccionarPeriodo('ano')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ecf0f1',
                color: '#2c3e50',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Año Actual
            </button>
          </div>
        </div>

        {/* Selectores de fecha */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <label htmlFor="fecha-inicio" style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50', fontWeight: '500' }}>
              Fecha de Inicio
            </label>
            <input
              id="fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div>
            <label htmlFor="fecha-fin" style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50', fontWeight: '500' }}>
              Fecha de Fin
            </label>
            <input
              id="fecha-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        {/* Botones de descarga */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => descargarReporte('pdf')}
            disabled={generando.pdf}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '1rem 2rem',
              backgroundColor: generando.pdf ? '#95a5a6' : '#e74c3c',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: generando.pdf ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {generando.pdf ? (
              <>
                <span>Generando...</span>
                <span>⏳</span>
              </>
            ) : (
              <>
                <span>📄</span>
                <span>Descargar PDF</span>
              </>
            )}
          </button>

          <button
            onClick={() => descargarReporte('excel')}
            disabled={generando.excel}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '1rem 2rem',
              backgroundColor: generando.excel ? '#95a5a6' : '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: generando.excel ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {generando.excel ? (
              <>
                <span>Generando...</span>
                <span>⏳</span>
              </>
            ) : (
              <>
                <span>📊</span>
                <span>Descargar Excel</span>
              </>
            )}
          </button>
        </div>

        {/* Información */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#e8f4f8',
          borderRadius: '4px',
          border: '1px solid #3498db'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c5460' }}>
            <strong>ℹ️ Información:</strong> Los reportes incluyen todos los gastos registrados en el período seleccionado,
            con detalles de fecha, descripción, tipo, categoría, monto y moneda. Los reportes se descargan automáticamente
            al hacer clic en los botones.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Reportes
