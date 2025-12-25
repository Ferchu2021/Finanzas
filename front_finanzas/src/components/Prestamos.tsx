import React, { useState, useEffect } from 'react'
import { prestamosApi, Prestamo } from '../services/api'
import api from '../services/api'

interface DesgloseCuotaPrestamo {
  prestamo_id: number
  prestamo_nombre: string
  fecha_vencimiento: string
  numero_cuota: number
  moneda: string
  monto_pendiente: number
  desglose: {
    monto_total: number
    capital: number
    intereses: number
    iva_intereses: number
    impuesto_ganancias: number
    gastos_administrativos: number
    iva_gastos_admin?: number
    seguro: number
    iva_seguro?: number
    otros_impuestos: number
    total_impuestos: number
    total_cargos: number
  }
  porcentajes: {
    tasa_interes_anual: number
    tasa_interes_mensual: number
    impuesto_iva: number
    impuesto_ganancias: number
  }
}

const Prestamos: React.FC = () => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<number | null>(null)
  const [desglose, setDesglose] = useState<DesgloseCuotaPrestamo | null>(null)
  const [cargandoDesglose, setCargandoDesglose] = useState(false)
  const [mostrarDesglose, setMostrarDesglose] = useState(false)

  useEffect(() => {
    cargarPrestamos()
  }, [])

  const cargarPrestamos = async () => {
    try {
      setLoading(true)
      const response = await prestamosApi.getAll()
      setPrestamos(response.data)
      setError(null)
    } catch (err: any) {
      setError('Error al cargar los préstamos: ' + (err.message || 'Error desconocido'))
      console.error('Error al cargar préstamos:', err)
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

  const calcularPorcentajePagado = (pagado: number, total: number): number => {
    if (total === 0) return 0
    return (pagado / total) * 100
  }

  const verDesglose = async (prestamoId: number) => {
    if (prestamoSeleccionado === prestamoId && desglose) {
      setPrestamoSeleccionado(null)
      setDesglose(null)
      setMostrarDesglose(false)
      return
    }

    try {
      setCargandoDesglose(true)
      setPrestamoSeleccionado(prestamoId)
      const response = await api.get(`/prestamos/${prestamoId}/desglose-cuota`)
      if (response.data.desglose) {
        setDesglose(response.data)
      }
    } catch (err: any) {
      setError('Error al cargar el desglose: ' + (err.message || 'Error desconocido'))
      console.error('Error al cargar desglose:', err)
    } finally {
      setCargandoDesglose(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando préstamos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <p>{error}</p>
        <button onClick={cargarPrestamos}>Reintentar</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Préstamos</h1>
      
      {prestamos.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px', marginTop: '1rem' }}>
          <p>No hay préstamos registrados</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
          {prestamos.map((prestamo) => {
            const porcentajePagado = calcularPorcentajePagado(prestamo.monto_pagado, prestamo.monto_total)
            const montoPendiente = prestamo.monto_total - prestamo.monto_pagado
            const estaPagado = prestamo.monto_pagado >= prestamo.monto_total || !prestamo.activo
            const mostrarDetalles = prestamoSeleccionado === prestamo.id

            return (
              <div
                key={prestamo.id}
                style={{
                  backgroundColor: '#fff',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: estaPagado ? '2px solid #27ae60' : '1px solid #ddd'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h2 style={{ margin: 0, color: '#2c3e50' }}>{prestamo.nombre}</h2>
                      {estaPagado && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          backgroundColor: '#27ae60',
                          color: '#fff'
                        }}>
                          ✓ PAGADO
                        </span>
                      )}
                    </div>
                    {prestamo.prestamista && (
                      <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>Prestamista: {prestamo.prestamista}</p>
                    )}
                    {prestamo.fecha_vencimiento && (
                      <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                        Vencimiento: {formatearFecha(prestamo.fecha_vencimiento)}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>Monto Total</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#2c3e50' }}>
                      {formatearMonto(prestamo.monto_total, prestamo.moneda)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>Monto Pagado</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#27ae60' }}>
                      {formatearMonto(prestamo.monto_pagado, prestamo.moneda)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>Monto Pendiente</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: estaPagado ? '#27ae60' : '#e74c3c' }}>
                      {formatearMonto(montoPendiente, prestamo.moneda)}
                    </p>
                  </div>
                  {prestamo.cuota_mensual && (
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>Cuota Mensual</p>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#2c3e50' }}>
                        {formatearMonto(prestamo.cuota_mensual, prestamo.moneda)}
                      </p>
                    </div>
                  )}
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
                        width: `${Math.min(porcentajePagado, 100)}%`,
                        height: '100%',
                        backgroundColor: estaPagado ? '#27ae60' : '#3498db',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#7f8c8d', textAlign: 'right' }}>
                    {porcentajePagado.toFixed(1)}% pagado
                  </p>
                </div>

                {prestamo.tasa_interes > 0 && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#2c3e50' }}>
                      <strong>Tasa de Interés:</strong> {prestamo.tasa_interes.toFixed(2)}% anual
                    </p>
                  </div>
                )}

                {estaPagado && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: '#155724',
                    border: '1px solid #c3e6cb'
                  }}>
                    ✓ Este préstamo está completamente pagado.
                  </div>
                )}

                {!estaPagado && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ecf0f1' }}>
                    <button
                      onClick={() => verDesglose(prestamo.id)}
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
                      {mostrarDetalles ? '▼ Ocultar desglose' : '▶ Ver desglose de cuota'}
                    </button>
                  </div>
                )}

                {mostrarDetalles && !estaPagado && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {cargandoDesglose ? (
                      <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Calculando desglose...</p>
                    ) : desglose && desglose.desglose ? (
                      <div>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50', fontSize: '1.1rem' }}>
                          Desglose de Cuota #{desglose.numero_cuota}
                        </h3>

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
                            <li><strong>Intereses:</strong> Se calculan sobre el saldo pendiente (típicamente 40-80% anual en Argentina)</li>
                            <li><strong>IVA (21%):</strong> Se aplica sobre intereses, gastos administrativos y seguro</li>
                            <li><strong>Gastos Administrativos:</strong> Cargo mensual por gestión del préstamo (variable)</li>
                            <li><strong>Seguro:</strong> Seguro de vida o desempleo que algunos bancos requieren</li>
                            <li><strong>Impuesto a los Sellos:</strong> Impuesto provincial que algunos bancos aplican</li>
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
                              <span style={{ fontSize: '0.9rem', color: '#2c3e50' }}>Monto Pendiente</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2c3e50' }}>
                                {formatearMonto(desglose.monto_pendiente, desglose.moneda)}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                              <span style={{ fontSize: '0.9rem', color: '#155724' }}>Capital</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#155724' }}>
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
                            
                            {desglose.desglose.seguro > 0 && (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                  <span style={{ fontSize: '0.9rem', color: '#856404' }}>Seguro</span>
                                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                    {formatearMonto(desglose.desglose.seguro, desglose.moneda)}
                                  </span>
                                </div>
                                {desglose.desglose.iva_seguro && desglose.desglose.iva_seguro > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px', marginLeft: '1rem', borderLeft: '3px solid #f39c12' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#856404' }}>→ IVA sobre Seguro ({desglose.porcentajes.impuesto_iva}%)</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#856404' }}>
                                      {formatearMonto(desglose.desglose.iva_seguro, desglose.moneda)}
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
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Prestamos
