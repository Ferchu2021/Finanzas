import { useEffect, useState } from 'react'
import { reportesApi, alertasApi, Alerta } from '../services/api'
// Formateo de fecha simple sin date-fns
const formatMonthYear = (ano: number, mes: number) => {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${meses[mes - 1]} ${ano}`
}

function Dashboard() {
  const [resumen, setResumen] = useState<any>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const hoy = new Date()
  const ano = hoy.getFullYear()
  const mes = hoy.getMonth() + 1

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [resumenRes, alertasRes] = await Promise.all([
        reportesApi.resumenMensual(ano, mes),
        alertasApi.getAll()
      ])
      setResumen(resumenRes.data)
      setAlertas(alertasRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="card">Cargando...</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="card" style={{ marginBottom: '1rem' }}>
        Resumen del mes de {formatMonthYear(ano, mes)}
      </p>

      {alertas.length > 0 && (
        <div className="card">
          <h2>⚠️ Alertas</h2>
          {alertas.slice(0, 5).map((alerta, idx) => (
            <div key={idx} className={`alert alert-${alerta.severidad}`}>
              <strong>{alerta.titulo}</strong>
              <p>{alerta.mensaje}</p>
            </div>
          ))}
        </div>
      )}

      {resumen && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Ingresos Total (ARS)</h3>
              <div className="value positive">${resumen.ingresos?.total_ars?.toLocaleString('es-AR') || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Egresos Total (ARS)</h3>
              <div className="value negative">${resumen.egresos?.total_ars?.toLocaleString('es-AR') || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Saldo (ARS)</h3>
              <div className={`value ${resumen.saldo?.ars >= 0 ? 'positive' : 'negative'}`}>
                ${resumen.saldo?.ars?.toLocaleString('es-AR') || 0}
              </div>
            </div>
            <div className="stat-card">
              <h3>Proyecciones Pendientes</h3>
              <div className="value">${resumen.proyecciones?.total_ars?.toLocaleString('es-AR') || 0}</div>
            </div>
          </div>

          <div className="card">
            <h2>Ingresos por Tipo</h2>
            {resumen.ingresos?.por_tipo && Object.keys(resumen.ingresos.por_tipo).length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>ARS</th>
                    <th>USD</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(resumen.ingresos.por_tipo).map(([tipo, datos]: [string, any]) => (
                    <tr key={tipo}>
                      <td>{tipo}</td>
                      <td>${datos.ars?.toLocaleString('es-AR') || 0}</td>
                      <td>${datos.usd?.toLocaleString('es-AR') || 0}</td>
                      <td>{datos.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay ingresos registrados este mes</p>
            )}
          </div>

          <div className="card">
            <h2>Egresos por Tipo</h2>
            {resumen.resumen_egresos?.por_tipo && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Total ARS</th>
                    <th>Total USD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Fijos</td>
                    <td>{resumen.resumen_egresos.por_tipo.fijos.cantidad}</td>
                    <td>${resumen.resumen_egresos.por_tipo.fijos.total_ars?.toLocaleString('es-AR') || 0}</td>
                    <td>${resumen.resumen_egresos.por_tipo.fijos.total_usd?.toLocaleString('es-AR') || 0}</td>
                  </tr>
                  <tr>
                    <td>Ordinarios</td>
                    <td>{resumen.resumen_egresos.por_tipo.ordinarios.cantidad}</td>
                    <td>${resumen.resumen_egresos.por_tipo.ordinarios.total_ars?.toLocaleString('es-AR') || 0}</td>
                    <td>${resumen.resumen_egresos.por_tipo.ordinarios.total_usd?.toLocaleString('es-AR') || 0}</td>
                  </tr>
                  <tr>
                    <td>Extraordinarios</td>
                    <td>{resumen.resumen_egresos.por_tipo.extraordinarios.cantidad}</td>
                    <td>${resumen.resumen_egresos.por_tipo.extraordinarios.total_ars?.toLocaleString('es-AR') || 0}</td>
                    <td>${resumen.resumen_egresos.por_tipo.extraordinarios.total_usd?.toLocaleString('es-AR') || 0}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard

