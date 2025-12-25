import React, { useState, useEffect } from 'react'
import { alertasApi, Alerta } from '../services/api'
import { useNavigate } from 'react-router-dom'

const Alertas: React.FC = () => {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroSeveridad, setFiltroSeveridad] = useState<'todas' | 'alta' | 'media' | 'baja'>('todas')
  const navigate = useNavigate()

  useEffect(() => {
    cargarAlertas()
    // Recargar alertas cada 30 segundos
    const intervalo = setInterval(cargarAlertas, 30000)
    return () => clearInterval(intervalo)
  }, [])

  const cargarAlertas = async () => {
    try {
      setLoading(true)
      const response = await alertasApi.getAll()
      setAlertas(response.data)
      setError(null)
    } catch (err: any) {
      setError('Error al cargar las alertas: ' + (err.message || 'Error desconocido'))
      console.error('Error al cargar alertas:', err)
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

  const getColorSeveridad = (severidad: string) => {
    switch (severidad) {
      case 'alta':
        return { bg: '#fee', border: '#e74c3c', text: '#c0392b', icon: '🚨' }
      case 'media':
        return { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: '⚠️' }
      case 'baja':
        return { bg: '#e8f4f8', border: '#3498db', text: '#0c5460', icon: 'ℹ️' }
      default:
        return { bg: '#f8f9fa', border: '#6c757d', text: '#495057', icon: '📌' }
    }
  }

  const handleAccion = (alerta: Alerta) => {
    switch (alerta.tipo) {
      case 'pagos_parciales':
      case 'deuda_tarjeta':
      case 'vencimiento_proximo':
        if (alerta.detalle?.tarjeta_id) {
          navigate('/tarjetas')
        }
        break
      case 'descripciones_incompletas':
        navigate('/proyecciones')
        break
      case 'proyecciones_proximas':
        navigate('/proyecciones')
        break
      default:
        break
    }
  }

  const alertasFiltradas = filtroSeveridad === 'todas' 
    ? alertas 
    : alertas.filter(a => a.severidad === filtroSeveridad)

  const contarPorSeveridad = (severidad: string) => {
    return alertas.filter(a => a.severidad === severidad).length
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando alertas inteligentes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <p>{error}</p>
        <button onClick={cargarAlertas}>Reintentar</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>🤖 Alertas Inteligentes</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
            Análisis automático de tu situación financiera
          </p>
        </div>
        <button
          onClick={cargarAlertas}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Resumen de alertas */}
      {alertas.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{ 
            padding: '1rem', backgroundColor: '#fee', borderRadius: '8px', border: '2px solid #e74c3c' 
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚨</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f8c8d' }}>Alta Prioridad</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#c0392b' }}>
              {contarPorSeveridad('alta')}
            </p>
          </div>
          <div style={{ 
            padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' 
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f8c8d' }}>Media Prioridad</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#856404' }}>
              {contarPorSeveridad('media')}
            </p>
          </div>
          <div style={{ 
            padding: '1rem', backgroundColor: '#e8f4f8', borderRadius: '8px', border: '2px solid #3498db' 
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>ℹ️</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f8c8d' }}>Baja Prioridad</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#0c5460' }}>
              {contarPorSeveridad('baja')}
            </p>
          </div>
          <div style={{ 
            padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '2px solid #6c757d' 
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f8c8d' }}>Total Alertas</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
              {alertas.length}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      {alertas.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFiltroSeveridad('todas')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filtroSeveridad === 'todas' ? '#2c3e50' : '#ecf0f1',
              color: filtroSeveridad === 'todas' ? '#fff' : '#2c3e50',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            Todas ({alertas.length})
          </button>
          <button
            onClick={() => setFiltroSeveridad('alta')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filtroSeveridad === 'alta' ? '#e74c3c' : '#fee',
              color: filtroSeveridad === 'alta' ? '#fff' : '#c0392b',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            Alta ({contarPorSeveridad('alta')})
          </button>
          <button
            onClick={() => setFiltroSeveridad('media')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filtroSeveridad === 'media' ? '#ffc107' : '#fff3cd',
              color: filtroSeveridad === 'media' ? '#856404' : '#856404',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            Media ({contarPorSeveridad('media')})
          </button>
          <button
            onClick={() => setFiltroSeveridad('baja')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filtroSeveridad === 'baja' ? '#3498db' : '#e8f4f8',
              color: filtroSeveridad === 'baja' ? '#fff' : '#0c5460',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            Baja ({contarPorSeveridad('baja')})
          </button>
        </div>
      )}

      {/* Lista de alertas */}
      {alertasFiltradas.length === 0 ? (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          backgroundColor: '#fff', 
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#27ae60' }}>¡Todo en orden!</h3>
          <p style={{ margin: 0, color: '#7f8c8d' }}>
            {filtroSeveridad === 'todas' 
              ? 'No hay alertas pendientes. Tu situación financiera está bajo control.'
              : `No hay alertas de severidad ${filtroSeveridad}.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {alertasFiltradas.map((alerta, index) => {
            const colores = getColorSeveridad(alerta.severidad)
            
            return (
              <div
                key={index}
                style={{
                  padding: '1.5rem',
                  backgroundColor: colores.bg,
                  borderRadius: '8px',
                  border: `2px solid ${colores.border}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                onClick={() => handleAccion(alerta)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>{colores.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, color: colores.text, fontSize: '1.1rem' }}>
                        {alerta.titulo}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: colores.border,
                        color: colores.text,
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {alerta.severidad}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 1rem 0', color: colores.text, fontSize: '0.95rem', lineHeight: '1.5' }}>
                      {alerta.mensaje}
                    </p>
                    
                    {/* Detalles adicionales según el tipo de alerta */}
                    {alerta.tipo === 'pagos_parciales' && alerta.detalle && (
                      <div style={{ 
                        padding: '0.75rem', 
                        backgroundColor: '#fff', 
                        borderRadius: '4px',
                        marginTop: '0.5rem'
                      }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '600', color: '#2c3e50' }}>
                          Detalles:
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <div>
                            <span style={{ color: '#7f8c8d' }}>Pagos parciales:</span>
                            <strong style={{ color: '#2c3e50', marginLeft: '0.5rem' }}>
                              {alerta.detalle.cantidad_pagos_parciales}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#7f8c8d' }}>Total pagado:</span>
                            <strong style={{ color: '#27ae60', marginLeft: '0.5rem' }}>
                              {formatearMonto(alerta.detalle.total_pagado, alerta.detalle.tarjeta_nombre.includes('USD') ? 'USD' : 'ARS')}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#7f8c8d' }}>Saldo pendiente:</span>
                            <strong style={{ color: '#e74c3c', marginLeft: '0.5rem' }}>
                              {formatearMonto(alerta.detalle.saldo_actual, alerta.detalle.tarjeta_nombre.includes('USD') ? 'USD' : 'ARS')}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {alerta.tipo === 'vencimiento_proximo' && alerta.detalle && (
                      <div style={{ 
                        padding: '0.75rem', 
                        backgroundColor: '#fff', 
                        borderRadius: '4px',
                        marginTop: '0.5rem'
                      }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '600', color: '#2c3e50' }}>
                          Acción requerida:
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#2c3e50' }}>
                          Debes pagar <strong>{formatearMonto(alerta.detalle.monto, alerta.detalle.moneda)}</strong> antes del <strong>{formatearFecha(alerta.detalle.fecha_vencimiento)}</strong>
                        </p>
                      </div>
                    )}

                    {alerta.tipo === 'descripciones_incompletas' && alerta.detalle && (
                      <div style={{ 
                        padding: '0.75rem', 
                        backgroundColor: '#fff', 
                        borderRadius: '4px',
                        marginTop: '0.5rem'
                      }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '600', color: '#2c3e50' }}>
                          Gastos a revisar:
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#2c3e50' }}>
                          {alerta.detalle.cantidad} gasto(s) con descripciones incompletas. 
                          Haz clic para editarlos desde las proyecciones.
                        </p>
                      </div>
                    )}

                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colores.border}` }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: colores.text, fontStyle: 'italic' }}>
                        💡 Haz clic para ver más detalles y tomar acción
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Alertas
