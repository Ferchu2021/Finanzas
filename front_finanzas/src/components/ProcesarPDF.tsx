import { useState, useEffect } from 'react'
import { tarjetasApi, TarjetaCredito } from '../services/api'
import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

function ProcesarPDF() {
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState<number | ''>('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [previsualizacion, setPrevisualizacion] = useState<any>(null)
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [cargandoTarjetas, setCargandoTarjetas] = useState(true)

  useEffect(() => {
    cargarTarjetas()
  }, [])

  const cargarTarjetas = async () => {
    try {
      setCargandoTarjetas(true)
      const response = await tarjetasApi.getAll()
      setTarjetas(response.data)
      if (response.data.length > 0) {
        setTarjetaSeleccionada(response.data[0].id)
      }
    } catch (error) {
      console.error('Error cargando tarjetas:', error)
      setMensaje({ tipo: 'error', texto: 'Error al cargar las tarjetas' })
    } finally {
      setCargandoTarjetas(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type !== 'application/pdf') {
        setMensaje({ tipo: 'error', texto: 'Por favor selecciona un archivo PDF' })
        return
      }
      setArchivo(file)
      setPrevisualizacion(null)
      setMensaje(null)
    }
  }

  const previsualizarPDF = async () => {
    if (!archivo || !tarjetaSeleccionada) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona una tarjeta y un archivo PDF' })
      return
    }

    try {
      setProcesando(true)
      setMensaje(null)

      const formData = new FormData()
      formData.append('archivo', archivo)

      const response = await axios.post(
        `${API_URL}/pdf/previsualizar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setPrevisualizacion(response.data.datos_extraidos)
      setMensaje({ tipo: 'success', texto: response.data.mensaje })
    } catch (error: any) {
      console.error('Error previsualizando PDF:', error)
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.detail || 'Error al procesar el PDF'
      })
    } finally {
      setProcesando(false)
    }
  }

  const procesarPDF = async () => {
    if (!archivo || !tarjetaSeleccionada) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona una tarjeta y un archivo PDF' })
      return
    }

    if (!confirm('¿Estás seguro de procesar este PDF? Se crearán gastos y actualizará el saldo de la tarjeta.')) {
      return
    }

    try {
      setProcesando(true)
      setMensaje(null)

      const formData = new FormData()
      formData.append('archivo', archivo)

      const response = await axios.post(
        `${API_URL}/pdf/procesar-liquidacion?tarjeta_id=${tarjetaSeleccionada}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setMensaje({
        tipo: 'success',
        texto: `PDF procesado exitosamente. Se crearon ${response.data.gastos_creados} gastos.`
      })
      
      // Limpiar formulario
      setArchivo(null)
      setPrevisualizacion(null)
      const fileInput = document.getElementById('pdf-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Recargar tarjetas para ver el saldo actualizado
      setTimeout(() => {
        cargarTarjetas()
      }, 1000)
    } catch (error: any) {
      console.error('Error procesando PDF:', error)
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.detail || 'Error al procesar el PDF'
      })
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>📄 Procesar Liquidaciones de Tarjetas (PDF)</h1>

      <div className="card">
        <h2>Subir PDF de Liquidación</h2>
        
        <div className="form-group">
          <label>Seleccionar Tarjeta</label>
          {cargandoTarjetas ? (
            <div className="loading">Cargando tarjetas...</div>
          ) : tarjetas.length === 0 ? (
            <div className="empty-state" style={{ padding: '1rem' }}>
              <p>No hay tarjetas registradas. Por favor, crea una tarjeta primero.</p>
            </div>
          ) : (
            <select
              value={tarjetaSeleccionada}
              onChange={(e) => setTarjetaSeleccionada(parseInt(e.target.value))}
              required
            >
              {tarjetas.map(tarjeta => (
                <option key={tarjeta.id} value={tarjeta.id}>
                  {tarjeta.nombre} - {tarjeta.banco || 'Sin banco'} ({tarjeta.moneda})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label>Seleccionar Archivo PDF</label>
          <input
            id="pdf-file"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
          {archivo && (
            <p style={{ marginTop: '0.5rem', color: '#666' }}>
              Archivo seleccionado: {archivo.name} ({(archivo.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={previsualizarPDF}
            disabled={!archivo || !tarjetaSeleccionada || procesando}
          >
            {procesando ? 'Procesando...' : 'Previsualizar'}
          </button>
          <button
            className="btn btn-primary"
            onClick={procesarPDF}
            disabled={!archivo || !tarjetaSeleccionada || procesando}
          >
            {procesando ? 'Procesando...' : 'Procesar PDF'}
          </button>
        </div>

        {mensaje && (
          <div
            className={`alert alert-${mensaje.tipo === 'success' ? 'low' : 'high'}`}
            style={{ marginTop: '1rem' }}
          >
            {mensaje.texto}
          </div>
        )}
      </div>

      {previsualizacion && (
        <div className="card">
          <h2>Previsualización de Datos Extraídos</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Fecha de Liquidación:</strong>{' '}
            {previsualizacion.fecha_liquidacion || 'No encontrada'}
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Monto Total:</strong>{' '}
            {previsualizacion.monto_total
              ? `$${previsualizacion.monto_total.toLocaleString('es-AR')}`
              : 'No encontrado'}
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Monto Mínimo:</strong>{' '}
            {previsualizacion.monto_minimo
              ? `$${previsualizacion.monto_minimo.toLocaleString('es-AR')}`
              : 'No encontrado'}
          </div>
          
          {previsualizacion.banco && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Banco:</strong> {previsualizacion.banco}
            </div>
          )}
          
          {previsualizacion.numero_tarjeta && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Número de Tarjeta (últimos 4 dígitos):</strong> {previsualizacion.numero_tarjeta}
            </div>
          )}

          {previsualizacion.movimientos && previsualizacion.movimientos.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3>Movimientos Detectados ({previsualizacion.movimientos.length})</h3>
              <table className="table" style={{ marginTop: '1rem' }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {previsualizacion.movimientos.slice(0, 10).map((mov: any, idx: number) => (
                    <tr key={idx}>
                      <td>{new Date(mov.fecha).toLocaleDateString('es-AR')}</td>
                      <td>{mov.descripcion}</td>
                      <td>${mov.monto.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previsualizacion.movimientos.length > 10 && (
                <p style={{ marginTop: '0.5rem', color: '#666' }}>
                  ... y {previsualizacion.movimientos.length - 10} movimientos más
                </p>
              )}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Nota:</strong> Revisa los datos extraídos antes de procesar. Si algo no es correcto, 
            puedes ajustar manualmente después de procesar.
          </div>
        </div>
      )}
    </div>
  )
}

export default ProcesarPDF



