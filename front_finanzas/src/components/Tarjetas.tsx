import React, { useState, useEffect } from 'react'
import { tarjetasApi, TarjetaCredito } from '../services/api'
import api from '../services/api'

interface DetallesTarjeta {
  tarjeta: {
    id: number
    nombre: string
    banco?: string
    limite: number
    saldo_actual: number
    disponible: number
    moneda: string
    fecha_cierre: number
    fecha_vencimiento: number
    porcentaje_uso: number
    esta_pagada: boolean
  }
  proximas_fechas: {
    fecha_cierre: string
    fecha_vencimiento: string
    dias_hasta_vencimiento: number
  }
  pagos: Array<{
    id: number
    fecha_pago: string
    monto: number
    descripcion?: string
  }>
  total_pagado: number
}

interface DesgloseCuota {
  tarjeta_id: number
  tarjeta_nombre: string
  fecha_vencimiento: string
  moneda: string
  desglose: {
    monto_total: number
    capital: number
    intereses: number
    iva_intereses: number
    impuesto_ganancias: number
    gastos_administrativos: number
    iva_gastos_admin?: number
    otros_impuestos: number
    total_impuestos: number
    total_cargos: number
  }
  porcentajes: {
    tasa_interes_mensual: number
    tasa_interes_anual: number
    impuesto_iva: number
    impuesto_ganancias: number
  }
}

const Tarjetas: React.FC = () => {
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState<number | null>(null)
  const [detalles, setDetalles] = useState<DetallesTarjeta | null>(null)
  const [desglose, setDesglose] = useState<DesgloseCuota | null>(null)
  const [cargandoDetalles, setCargandoDetalles] = useState(false)
  const [cargandoDesglose, setCargandoDesglose] = useState(false)
  const [mostrarDesglose, setMostrarDesglose] = useState(false)

  useEffect(() => {
    cargarTarjetas()
  }, [])

  const cargarTarjetas = async () => {
    try {
      setLoading(true)
      const response = await tarjetasApi.getAll()
      setTarjetas(response.data)
      setError(null)
    } catch (err: any) {
      setError('Error al cargar las tarjetas: ' + (err.message || 'Error desconocido'))
      console.error('Error al cargar tarjetas:', err)
    } finally {
      setLoading(false)
    }
  }

  const calcularPorcentajeUso = (saldo: number, limite: number): number => {
    if (limite === 0) return 0
    return (saldo / limite) * 100
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

  const verDetalles = async (tarjetaId: number) => {
    if (tarjetaSeleccionada === tarjetaId && detalles) {
      // Si ya está seleccionada, cerrar detalles
      setTarjetaSeleccionada(null)
      setDetalles(null)
      setDesglose(null)
      setMostrarDesglose(false)
      return
    }
    
    try {
      setCargandoDetalles(true)
      setTarjetaSeleccionada(tarjetaId)
      const response = await api.get(`/tarjetas/${tarjetaId}/detalles`)
      setDetalles(response.data)
      
      // Cargar desglose si la tarjeta no está pagada
      if (!response.data.tarjeta.esta_pagada) {
        cargarDesglose(tarjetaId)
      }
    } catch (err: any) {
      setError('Error al cargar detalles: ' + (err.message || 'Error desconocido'))
      console.error('Error al cargar detalles:', err)
    } finally {
      setCargandoDetalles(false)
    }
  }

  const cargarDesglose = async (tarjetaId: number) => {
    try {
      setCargandoDesglose(true)
      const response = await api.get(`/tarjetas/${tarjetaId}/desglose-cuota`)
      if (response.data && response.data.desglose) {
        setDesglose(response.data)
      } else if (response.data && response.data.mensaje) {
        // La tarjeta está pagada, no hay desglose
        setDesglose(null)
      }
    } catch (err: any) {
      console.error('Error al cargar desglose:', err)
      setDesglose(null)
    } finally {
      setCargandoDesglose(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando tarjetas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <p>{error}</p>
        <button onClick={cargarTarjetas}>Reintentar</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Tarjetas de Crédito</h1>
      
      {tarjetas.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px', marginTop: '1rem' }}>
          <p>No hay tarjetas registradas</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
          {tarjetas.map((tarjeta) => {
            const porcentajeUso = calcularPorcentajeUso(tarjeta.saldo_actual, tarjeta.limite)
            const disponible = tarjeta.limite - tarjeta.saldo_actual
            const nivelAlerta = porcentajeUso > 90 ? 'alta' : porcentajeUso > 80 ? 'media' : 'normal'
            const estaPagada = tarjeta.saldo_actual <= 0
            const mostrarDetalles = tarjetaSeleccionada === tarjeta.id

            return (
              <div
                key={tarjeta.id}
                style={{
                  backgroundColor: '#fff',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: estaPagada 
                    ? '2px solid #27ae60' 
                    : nivelAlerta === 'alta' 
                      ? '2px solid #e74c3c' 
                      : nivelAlerta === 'media' 
                        ? '2px solid #f39c12' 
                        : '1px solid #ddd'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h2 style={{ margin: 0, color: '#2c3e50' }}>{tarjeta.nombre}</h2>
                      {estaPagada && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          backgroundColor: '#27ae60',
                          color: '#fff'
                        }}>
                          ✓ PAGADA
                        </span>
                      )}
                    </div>
                    {tarjeta.banco && (
                      <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>Banco: {tarjeta.banco}</p>
                    )}
                    <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                      Cierre: día {tarjeta.fecha_cierre} | Vencimiento: día {tarjeta.fecha_vencimiento}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {!estaPagada && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        backgroundColor: nivelAlerta === 'alta' ? '#e74c3c' : nivelAlerta === 'media' ? '#f39c12' : '#27ae60',
                        color: '#fff'
                      }}>
                        {porcentajeUso.toFixed(1)}% usado
                      </span>
                    )}
                    {estaPagada && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        backgroundColor: '#ecf0f1',
                        color: '#27ae60'
                      }}>
                        Sin deuda
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>Límite</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#2c3e50' }}>
                      {formatearMonto(tarjeta.limite, tarjeta.moneda)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>Saldo Actual</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: porcentajeUso > 80 ? '#e74c3c' : '#2c3e50' }}>
                      {formatearMonto(tarjeta.saldo_actual, tarjeta.moneda)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>Disponible</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#27ae60' }}>
                      {formatearMonto(disponible, tarjeta.moneda)}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#ecf0f1',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        width: `${Math.min(porcentajeUso, 100)}%`,
                        height: '100%',
                        backgroundColor: nivelAlerta === 'alta' ? '#e74c3c' : nivelAlerta === 'media' ? '#f39c12' : '#27ae60',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                {estaPagada && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: '#155724',
                    border: '1px solid #c3e6cb'
                  }}>
                    ✓ Esta tarjeta está completamente pagada. No hay saldo pendiente.
                  </div>
                )}
                
                {!estaPagada && nivelAlerta !== 'normal' && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: nivelAlerta === 'alta' ? '#fee' : '#fff3cd',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: nivelAlerta === 'alta' ? '#c0392b' : '#856404'
                  }}>
                    ⚠️ {nivelAlerta === 'alta' ? 'Alerta: Uso muy alto de la tarjeta' : 'Atención: Uso elevado de la tarjeta'}
                  </div>
                )}

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ecf0f1' }}>
                  <button
                    onClick={() => verDetalles(tarjeta.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: mostrarDetalles ? '#3498db' : '#ecf0f1',
                      color: mostrarDetalles ? '#fff' : '#2c3e50',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {mostrarDetalles ? '▼ Ocultar detalles' : '▶ Ver detalles y consumos'}
                  </button>
                </div>

                {mostrarDetalles && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {cargandoDetalles ? (
                      <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Cargando detalles...</p>
                    ) : detalles ? (
                      <div>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50', fontSize: '1.1rem' }}>Detalles de la Tarjeta</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                          <div>
                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>Próximo Cierre</p>
                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#2c3e50' }}>
                              {formatearFecha(detalles.proximas_fechas.fecha_cierre)}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>Próximo Vencimiento</p>
                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#2c3e50' }}>
                              {formatearFecha(detalles.proximas_fechas.fecha_vencimiento)}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>Días hasta Vencimiento</p>
                            <p style={{ 
                              margin: 0, 
                              fontSize: '1rem', 
                              fontWeight: '600',
                              color: detalles.proximas_fechas.dias_hasta_vencimiento <= 7 ? '#e74c3c' : detalles.proximas_fechas.dias_hasta_vencimiento <= 15 ? '#f39c12' : '#27ae60'
                            }}>
                              {detalles.proximas_fechas.dias_hasta_vencimiento} días
                            </p>
                          </div>
                        </div>

                        {detalles.pagos.length > 0 && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', color: '#2c3e50', fontSize: '1rem' }}>
                              Pagos Realizados ({detalles.pagos.length})
                            </h4>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {detalles.pagos.map((pago) => (
                                <div
                                  key={pago.id}
                                  style={{
                                    padding: '0.75rem',
                                    marginBottom: '0.5rem',
                                    backgroundColor: '#fff',
                                    borderRadius: '4px',
                                    border: '1px solid #e0e0e0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div>
                                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '500', color: '#2c3e50' }}>
                                      {formatearFecha(pago.fecha_pago)}
                                    </p>
                                    {pago.descripcion && (
                                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f8c8d' }}>
                                        {pago.descripcion}
                                      </p>
                                    )}
                                  </div>
                                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: '#27ae60' }}>
                                    {formatearMonto(pago.monto, detalles.tarjeta.moneda)}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0' }}>
                              <p style={{ margin: 0, textAlign: 'right', fontSize: '0.9rem', color: '#7f8c8d' }}>
                                Total pagado: <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                                  {formatearMonto(detalles.total_pagado, detalles.tarjeta.moneda)}
                                </span>
                              </p>
                            </div>
                          </div>
                        )}

                        {detalles.pagos.length === 0 && (
                          <p style={{ margin: '1rem 0 0 0', color: '#7f8c8d', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            No hay registros de pagos para esta tarjeta.
                          </p>
                        )}

                        {/* Desglose de Cuota */}
                        {!detalles.tarjeta.esta_pagada && (
                          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e0e0e0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.1rem' }}>Desglose de Próxima Cuota</h3>
                              <button
                                onClick={() => setMostrarDesglose(!mostrarDesglose)}
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  backgroundColor: mostrarDesglose ? '#3498db' : '#ecf0f1',
                                  color: mostrarDesglose ? '#fff' : '#2c3e50',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: '500'
                                }}
                              >
                                {mostrarDesglose ? '▼ Ocultar' : '▶ Ver desglose'}
                              </button>
                            </div>

                            {mostrarDesglose && (
                              <div>
                                {cargandoDesglose ? (
                                  <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Calculando desglose...</p>
                                ) : desglose && desglose.desglose ? (
                                  <div>
                        {/* Información sobre cargos bancarios */}
                        <div style={{ 
                          padding: '1rem', 
                          backgroundColor: '#e3f2fd', 
                          borderRadius: '4px', 
                          marginBottom: '1rem',
                          border: '1px solid #90caf9'
                        }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1565c0', fontWeight: '600' }}>
                            ℹ️ Cargos que Aplican los Bancos:
                          </h4>
                          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#1565c0' }}>
                            <li><strong>Intereses:</strong> Se calculan sobre el saldo pendiente (típicamente 5-10% mensual en Argentina)</li>
                            <li><strong>IVA (21%):</strong> Se aplica sobre intereses, gastos administrativos y servicios</li>
                            <li><strong>Gastos Administrativos:</strong> Cargo mensual fijo por mantenimiento de cuenta (típicamente $500-2000 ARS)</li>
                            <li><strong>Impuesto a los Sellos:</strong> Impuesto provincial que algunos bancos aplican (variable por provincia)</li>
                            <li><strong>Impuesto a las Ganancias:</strong> Puede aplicarse en algunos casos específicos</li>
                          </ul>
                        </div>

                        {/* Resumen de tasas e impuestos */}
                        <div style={{ 
                          padding: '1rem', 
                          backgroundColor: '#fff', 
                          borderRadius: '4px', 
                          marginBottom: '1rem',
                          border: '1px solid #e0e0e0'
                        }}>
                          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#2c3e50' }}>Tasas e Impuestos Aplicados</h4>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                                        {desglose.porcentajes.tasa_interes_anual > 0 && (
                                          <div>
                                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#7f8c8d' }}>Tasa Interés Anual</p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#2c3e50' }}>
                                              {desglose.porcentajes.tasa_interes_anual.toFixed(2)}%
                                            </p>
                                          </div>
                                        )}
                                        {desglose.porcentajes.tasa_interes_mensual > 0 && (
                                          <div>
                                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#7f8c8d' }}>Tasa Interés Mensual</p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#2c3e50' }}>
                                              {desglose.porcentajes.tasa_interes_mensual.toFixed(2)}%
                                            </p>
                                          </div>
                                        )}
                                        {desglose.porcentajes.impuesto_iva > 0 && (
                                          <div>
                                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#7f8c8d' }}>IVA</p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#2c3e50' }}>
                                              {desglose.porcentajes.impuesto_iva.toFixed(2)}%
                                            </p>
                                          </div>
                                        )}
                                        {desglose.porcentajes.impuesto_ganancias > 0 && (
                                          <div>
                                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#7f8c8d' }}>Imp. Ganancias</p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#2c3e50' }}>
                                              {desglose.porcentajes.impuesto_ganancias.toFixed(2)}%
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Desglose detallado */}
                                    <div style={{ 
                                      padding: '1rem', 
                                      backgroundColor: '#fff', 
                                      borderRadius: '4px',
                                      border: '1px solid #e0e0e0'
                                    }}>
                                      <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#2c3e50' }}>
                                        Desglose de Cuota - {formatearFecha(desglose.fecha_vencimiento)}
                                      </h4>
                                      
                                      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                          <span style={{ fontSize: '0.9rem', color: '#2c3e50' }}>Capital</span>
                                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#27ae60' }}>
                                            {formatearMonto(desglose.desglose.capital, desglose.moneda)}
                                          </span>
                                        </div>
                                        
                                        {desglose.desglose.intereses > 0 && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#856404' }}>Intereses</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                              {formatearMonto(desglose.desglose.intereses, desglose.moneda)}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {desglose.desglose.iva_intereses > 0 && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#856404' }}>IVA sobre Intereses</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                              {formatearMonto(desglose.desglose.iva_intereses, desglose.moneda)}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {desglose.desglose.impuesto_ganancias > 0 && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#856404' }}>Impuesto a las Ganancias</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                              {formatearMonto(desglose.desglose.impuesto_ganancias, desglose.moneda)}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {desglose.desglose.gastos_administrativos > 0 && (
                                          <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                              <span style={{ fontSize: '0.9rem', color: '#856404' }}>Gastos Administrativos</span>
                                              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                                {formatearMonto(desglose.desglose.gastos_administrativos, desglose.moneda)}
                                              </span>
                                            </div>
                                            {desglose.desglose.iva_gastos_admin && desglose.desglose.iva_gastos_admin > 0 && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px', marginLeft: '1rem', borderLeft: '3px solid #f39c12' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#856404' }}>→ IVA sobre Gastos Admin. ({desglose.porcentajes.impuesto_iva}%)</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#856404' }}>
                                                  {formatearMonto(desglose.desglose.iva_gastos_admin, desglose.moneda)}
                                                </span>
                                              </div>
                                            )}
                                          </>
                                        )}
                                        
                                        {desglose.desglose.otros_impuestos > 0 && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#856404' }}>Otros Impuestos (Sellos, etc.)</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                              {formatearMonto(desglose.desglose.otros_impuestos, desglose.moneda)}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <div style={{ 
                                        padding: '1rem', 
                                        backgroundColor: '#2c3e50', 
                                        borderRadius: '4px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}>
                                        <span style={{ fontSize: '1rem', fontWeight: '600', color: '#fff' }}>Total a Pagar</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
                                          {formatearMonto(desglose.desglose.monto_total, desglose.moneda)}
                                        </span>
                                      </div>

                                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
                                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#c0392b', fontWeight: '600' }}>
                                          Resumen de Cargos Bancarios:
                                        </p>
                                        <div style={{ fontSize: '0.85rem', color: '#c0392b' }}>
                                          <p style={{ margin: '0.25rem 0' }}>
                                            • <strong>Total de Cargos:</strong> {formatearMonto(desglose.desglose.total_cargos, desglose.moneda)} 
                                            ({((desglose.desglose.total_cargos / desglose.desglose.monto_total) * 100).toFixed(2)}% del total)
                                          </p>
                                          <p style={{ margin: '0.25rem 0' }}>
                                            • <strong>Total de Impuestos:</strong> {formatearMonto(desglose.desglose.total_impuestos, desglose.moneda)}
                                          </p>
                                          <p style={{ margin: '0.25rem 0' }}>
                                            • <strong>Capital Real:</strong> {formatearMonto(desglose.desglose.capital, desglose.moneda)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '0.9rem' }}>
                                    No se pudo calcular el desglose
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#e74c3c' }}>Error al cargar detalles</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Tarjetas
