import React, { useState, useEffect } from 'react'
import api from '../services/api'

interface ProyeccionTarjeta {
  mes: string
  fecha_vencimiento: string
  cantidad_cuotas: number
  total_ars: number
  total_usd: number
  detalle: Array<{
    tarjeta_id: number
    tarjeta_nombre: string
    tarjeta_banco?: string
    fecha_cierre: string
    fecha_vencimiento: string
    monto_estimado: number
    moneda: string
  }>
}

const Proyecciones: React.FC = () => {
  const [proyecciones, setProyecciones] = useState<ProyeccionTarjeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meses, setMeses] = useState(6)

  useEffect(() => {
    cargarProyecciones()
  }, [meses])

  const cargarProyecciones = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/proyecciones/tarjetas?meses=${meses}`)
      setProyecciones(response.data)
      setError(null)
    } catch (err: any) {
      setError('Error al cargar las proyecciones: ' + (err.message || 'Error desconocido'))
      console.error('Error al cargar proyecciones:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatearMonto = (monto: number, moneda: string): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto)
  }

  const formatearFecha = (fechaStr: string): string => {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatearMes = (mesStr: string): string => {
    const [ano, mes] = mesStr.split('-')
    const fecha = new Date(parseInt(ano), parseInt(mes) - 1, 1)
    return fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando proyecciones...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <p>{error}</p>
        <button onClick={cargarProyecciones}>Reintentar</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Proyecciones de Pagos - Tarjetas de Crédito</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label htmlFor="meses">Meses a proyectar:</label>
          <select
            id="meses"
            value={meses}
            onChange={(e) => setMeses(parseInt(e.target.value))}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
          </select>
        </div>
      </div>

      {proyecciones.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px', marginTop: '1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#27ae60' }}>¡Excelente!</h3>
          <p style={{ margin: 0, color: '#7f8c8d' }}>
            No hay proyecciones de pagos de tarjetas para los próximos {meses} meses.
            <br />
            Esto significa que todas tus tarjetas están pagadas o no tienen saldo pendiente.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {proyecciones.map((proyeccion, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#fff',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid #ecf0f1' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#2c3e50', textTransform: 'capitalize' }}>
                    {formatearMes(proyeccion.mes)}
                  </h2>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                    Vencimiento: {formatearFecha(proyeccion.fecha_vencimiento)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>
                    {proyeccion.cantidad_cuotas} {proyeccion.cantidad_cuotas === 1 ? 'cuota' : 'cuotas'}
                  </p>
                  {proyeccion.total_ars > 0 && (
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
                      {formatearMonto(proyeccion.total_ars, 'ARS')}
                    </p>
                  )}
                  {proyeccion.total_usd > 0 && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#3498db' }}>
                      {formatearMonto(proyeccion.total_usd, 'USD')}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {proyeccion.detalle.map((detalle, detalleIndex) => {
                  const diasRestantes = Math.ceil((new Date(detalle.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  const estaPagada = detalle.monto_estimado <= 0
                  
                  return (
                    <div
                      key={detalleIndex}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: estaPagada ? '#d4edda' : '#f8f9fa',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${estaPagada ? '#27ae60' : '#3498db'}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        opacity: estaPagada ? 0.7 : 1
                      }}
                    >
                      {estaPagada && (
                        <div style={{
                          marginBottom: '1rem',
                          padding: '0.75rem',
                          backgroundColor: '#c3e6cb',
                          borderRadius: '4px',
                          border: '1px solid #b1dfbb'
                        }}>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#155724', fontWeight: '500' }}>
                            ✓ Esta tarjeta está pagada (saldo: {formatearMonto(0, detalle.moneda)})
                          </p>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#2c3e50', fontWeight: '600' }}>
                            {detalle.tarjeta_nombre}
                            {detalle.tarjeta_banco && (
                              <span style={{ fontSize: '0.9rem', color: '#7f8c8d', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                                ({detalle.tarjeta_banco})
                              </span>
                            )}
                          </h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Fecha de Cierre
                              </p>
                              <p style={{ margin: 0, fontSize: '0.95rem', color: '#2c3e50', fontWeight: '500' }}>
                                {formatearFecha(detalle.fecha_cierre)}
                              </p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Fecha de Vencimiento
                              </p>
                              <p style={{ margin: 0, fontSize: '0.95rem', color: '#2c3e50', fontWeight: '500' }}>
                                {formatearFecha(detalle.fecha_vencimiento)}
                              </p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Días Restantes
                              </p>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '0.95rem', 
                                color: diasRestantes <= 7 ? '#e74c3c' : diasRestantes <= 15 ? '#f39c12' : '#27ae60',
                                fontWeight: '600'
                              }}>
                                {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
                              </p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Moneda
                              </p>
                              <p style={{ margin: 0, fontSize: '0.95rem', color: '#2c3e50', fontWeight: '500' }}>
                                {detalle.moneda}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: '1.5rem' }}>
                          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Monto a Pagar
                          </p>
                          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
                            {formatearMonto(detalle.monto_estimado, detalle.moneda)}
                          </p>
                        </div>
                      </div>
                      
                      {diasRestantes <= 7 && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          backgroundColor: '#fee',
                          borderRadius: '6px',
                          border: '1px solid #fcc',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#c0392b' }}>
                            <strong>Atención:</strong> Esta cuota vence en {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {proyecciones.length > 0 && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#2c3e50',
          color: '#fff',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Resumen Total</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {proyecciones.reduce((sum, p) => sum + p.total_ars, 0) > 0 && (
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total ARS</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {formatearMonto(proyecciones.reduce((sum, p) => sum + p.total_ars, 0), 'ARS')}
                </p>
              </div>
            )}
            {proyecciones.reduce((sum, p) => sum + p.total_usd, 0) > 0 && (
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total USD</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {formatearMonto(proyecciones.reduce((sum, p) => sum + p.total_usd, 0), 'USD')}
                </p>
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total de Cuotas</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {proyecciones.reduce((sum, p) => sum + p.cantidad_cuotas, 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proyecciones
