import { useEffect, useState } from 'react'
import { alertasApi, Alerta } from '../services/api'

function Alertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [tendencias, setTendencias] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarAlertas()
  }, [])

  const cargarAlertas = async () => {
    try {
      setLoading(true)
      const [alertasRes, tendenciasRes] = await Promise.all([
        alertasApi.getAll(),
        alertasApi.getTendencias()
      ])
      setAlertas(alertasRes.data)
      setTendencias(tendenciasRes.data)
    } catch (error) {
      console.error('Error cargando alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityClass = (severidad: string) => {
    switch (severidad) {
      case 'alta':
        return 'alert-high'
      case 'media':
        return 'alert-medium'
      default:
        return 'alert-low'
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Cargando alertas...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>⚠️ Alertas y Tendencias</h1>

      {tendencias && (
        <div className="card">
          <h2>Tendencias de los Últimos 6 Meses</h2>
          {tendencias.cambio_gastos !== undefined && (
            <div className={`alert ${tendencias.cambio_gastos > 0 ? 'alert-medium' : 'alert-low'}`}>
              <strong>Cambio en Gastos:</strong> {tendencias.cambio_gastos > 0 ? '+' : ''}
              {tendencias.cambio_gastos.toFixed(2)}% respecto al mes anterior
            </div>
          )}
          {tendencias.cambio_ingresos !== undefined && (
            <div className={`alert ${tendencias.cambio_ingresos > 0 ? 'alert-low' : 'alert-medium'}`}>
              <strong>Cambio en Ingresos:</strong> {tendencias.cambio_ingresos > 0 ? '+' : ''}
              {tendencias.cambio_ingresos.toFixed(2)}% respecto al mes anterior
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2>Alertas Activas</h2>
        {alertas.length === 0 ? (
          <p>No hay alertas activas. ¡Todo está bajo control!</p>
        ) : (
          <div>
            {alertas.map((alerta, idx) => (
              <div key={idx} className={`alert ${getSeverityClass(alerta.severidad)}`}>
                <strong>{alerta.titulo}</strong>
                <p>{alerta.mensaje}</p>
                {alerta.detalle && (
                  <details style={{ marginTop: '0.5rem' }}>
                    <summary>Ver detalles</summary>
                    <pre style={{ marginTop: '0.5rem', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(alerta.detalle, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Alertas




