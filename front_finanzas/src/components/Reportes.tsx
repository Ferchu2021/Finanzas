import { useEffect, useState } from 'react'
import { reportesApi } from '../services/api'

function Reportes() {
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [egresos, setEgresos] = useState<any>(null)
  const [saldos, setSaldos] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    cargarReportes()
  }, [ano, mes])

  const cargarReportes = async () => {
    try {
      setLoading(true)
      const [egresosRes, saldosRes] = await Promise.all([
        reportesApi.egresosMensuales(ano, mes),
        reportesApi.saldosPositivos(ano, mes)
      ])
      setEgresos(egresosRes.data)
      setSaldos(saldosRes.data)
    } catch (error) {
      console.error('Error cargando reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Reportes</h1>
      
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2>Seleccionar Período</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Año</label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value))}
              min="2020"
              max="2030"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Mes</label>
            <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('es-AR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">Cargando...</div>
      ) : (
        <>
          {saldos && (
            <div className="card">
              <h2>Resumen de Saldos</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Ingresos Total (ARS)</h3>
                  <div className="value positive">${saldos.ingresos?.total_ars?.toLocaleString('es-AR') || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Egresos Total (ARS)</h3>
                  <div className="value negative">${saldos.egresos?.total_ars?.toLocaleString('es-AR') || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Saldo (ARS)</h3>
                  <div className={`value ${saldos.saldo?.ars >= 0 ? 'positive' : 'negative'}`}>
                    ${saldos.saldo?.ars?.toLocaleString('es-AR') || 0}
                  </div>
                </div>
              </div>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Ingresos por Tipo</h3>
              {saldos.ingresos?.por_tipo && Object.keys(saldos.ingresos.por_tipo).length > 0 ? (
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
                    {Object.entries(saldos.ingresos.por_tipo).map(([tipo, datos]: [string, any]) => (
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
                <p>No hay ingresos registrados</p>
              )}
            </div>
          )}

          {egresos && (
            <div className="card">
              <h2>Egresos Mensuales</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Gastos (ARS)</h3>
                  <div className="value negative">${egresos.totales?.gastos_ars?.toLocaleString('es-AR') || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Pagos Tarjetas (ARS)</h3>
                  <div className="value negative">${egresos.totales?.pagos_tarjetas_ars?.toLocaleString('es-AR') || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Pagos Préstamos (ARS)</h3>
                  <div className="value negative">${egresos.totales?.pagos_prestamos_ars?.toLocaleString('es-AR') || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Total Egresos (ARS)</h3>
                  <div className="value negative">${egresos.totales?.total_egresos_ars?.toLocaleString('es-AR') || 0}</div>
                </div>
              </div>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Egresos por Tipo</h3>
              {egresos.por_tipo && (
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
                      <td>{egresos.por_tipo.fijos.cantidad}</td>
                      <td>${egresos.por_tipo.fijos.total_ars?.toLocaleString('es-AR') || 0}</td>
                      <td>${egresos.por_tipo.fijos.total_usd?.toLocaleString('es-AR') || 0}</td>
                    </tr>
                    <tr>
                      <td>Ordinarios</td>
                      <td>{egresos.por_tipo.ordinarios.cantidad}</td>
                      <td>${egresos.por_tipo.ordinarios.total_ars?.toLocaleString('es-AR') || 0}</td>
                      <td>${egresos.por_tipo.ordinarios.total_usd?.toLocaleString('es-AR') || 0}</td>
                    </tr>
                    <tr>
                      <td>Extraordinarios</td>
                      <td>{egresos.por_tipo.extraordinarios.cantidad}</td>
                      <td>${egresos.por_tipo.extraordinarios.total_ars?.toLocaleString('es-AR') || 0}</td>
                      <td>${egresos.por_tipo.extraordinarios.total_usd?.toLocaleString('es-AR') || 0}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Reportes


