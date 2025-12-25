import React, { useState, useEffect } from 'react'
import api, { gastosApi } from '../services/api'

interface GastoPeriodo {
  id: number
  fecha: string
  monto: number
  tipo: string
  categoria?: string
  descripcion?: string
}

interface DesgloseCuota {
  monto_total: number
  capital: number
  intereses: number
  iva_intereses: number
  impuesto_ganancias: number
  gastos_administrativos: number
  iva_gastos_admin?: number
  seguro?: number
  iva_seguro?: number
  otros_impuestos: number
  total_impuestos: number
  total_cargos: number
}

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
    periodo_cierre?: {
      fecha_inicio: string
      fecha_fin: string
    }
    gastos?: GastoPeriodo[]
    total_gastos_periodo?: number
    cantidad_gastos?: number
    desglose?: DesgloseCuota
  }>
}

interface ProyeccionPrestamo {
  mes: string
  fecha_vencimiento: string
  cantidad_cuotas: number
  total_ars: number
  total_usd: number
  detalle: Array<{
    prestamo_id: number
    prestamo_nombre: string
    prestamista?: string
    fecha_vencimiento: string
    numero_cuota: number
    monto_pendiente: number
    moneda: string
    desglose?: DesgloseCuota
    porcentajes?: {
      tasa_interes_anual: number
      tasa_interes_mensual: number
      impuesto_iva: number
      impuesto_ganancias: number
    }
  }>
}

const Proyecciones: React.FC = () => {
  const [proyeccionesTarjetas, setProyeccionesTarjetas] = useState<ProyeccionTarjeta[]>([])
  const [proyeccionesPrestamos, setProyeccionesPrestamos] = useState<ProyeccionPrestamo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meses, setMeses] = useState(6)
  const [tarjetasExpandidas, setTarjetasExpandidas] = useState<Set<string>>(new Set())
  const [prestamosExpandidos, setPrestamosExpandidos] = useState<Set<string>>(new Set())
  const [gastosEditando, setGastosEditando] = useState<Map<number, string>>(new Map())
  const [gastosGuardando, setGastosGuardando] = useState<Set<number>>(new Set())

  useEffect(() => {
    cargarProyecciones()
  }, [meses])

  const cargarProyecciones = async () => {
    try {
      setLoading(true)
      const [responseTarjetas, responsePrestamos] = await Promise.all([
        api.get(`/proyecciones/tarjetas?meses=${meses}`),
        api.get(`/proyecciones/prestamos?meses=${meses}`)
      ])
      setProyeccionesTarjetas(responseTarjetas.data)
      setProyeccionesPrestamos(responsePrestamos.data)
      setError(null)
    } catch (err: any) {
      setError('Error al cargar las proyecciones: ' + (err.message || 'Error desconocido'))
      console.error('Error al cargar proyecciones:', err)
    } finally {
      setLoading(false)
    }
  }

  // Obtener todos los meses únicos
  const obtenerTodosLosMeses = (): string[] => {
    const mesesSet = new Set<string>()
    proyeccionesTarjetas.forEach(p => mesesSet.add(p.mes))
    proyeccionesPrestamos.forEach(p => mesesSet.add(p.mes))
    return Array.from(mesesSet).sort()
  }

  // Obtener proyección de tarjetas para un mes
  const getProyeccionTarjetasPorMes = (mes: string): ProyeccionTarjeta | null => {
    return proyeccionesTarjetas.find(p => p.mes === mes) || null
  }

  // Obtener proyección de préstamos para un mes
  const getProyeccionPrestamosPorMes = (mes: string): ProyeccionPrestamo | null => {
    return proyeccionesPrestamos.find(p => p.mes === mes) || null
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

  const toggleGastos = (tarjetaId: number, mes: string) => {
    const key = `${tarjetaId}-${mes}`
    const nuevas = new Set(tarjetasExpandidas)
    if (nuevas.has(key)) {
      nuevas.delete(key)
    } else {
      nuevas.add(key)
    }
    setTarjetasExpandidas(nuevas)
  }

  const togglePrestamo = (prestamoId: number, mes: string) => {
    const key = `${prestamoId}-${mes}`
    const nuevas = new Set(prestamosExpandidos)
    if (nuevas.has(key)) {
      nuevas.delete(key)
    } else {
      nuevas.add(key)
    }
    setPrestamosExpandidos(nuevas)
  }

  const iniciarEdicionGasto = (gastoId: number, descripcionActual: string) => {
    const nuevas = new Map(gastosEditando)
    nuevas.set(gastoId, descripcionActual || '')
    setGastosEditando(nuevas)
  }

  const cancelarEdicionGasto = (gastoId: number) => {
    const nuevas = new Map(gastosEditando)
    nuevas.delete(gastoId)
    setGastosEditando(nuevas)
  }

  const guardarGasto = async (gastoId: number) => {
    const nuevaDescripcion = gastosEditando.get(gastoId)
    if (nuevaDescripcion === undefined) return

    try {
      setGastosGuardando(prev => new Set(prev).add(gastoId))
      await gastosApi.update(gastoId, { descripcion: nuevaDescripcion })
      
      // Actualizar la proyección local
      setProyeccionesTarjetas(prev => prev.map(proy => ({
        ...proy,
        detalle: proy.detalle.map(det => ({
          ...det,
          gastos: det.gastos?.map(g => 
            g.id === gastoId ? { ...g, descripcion: nuevaDescripcion } : g
          )
        }))
      })))
      
      cancelarEdicionGasto(gastoId)
    } catch (error) {
      console.error('Error al guardar gasto:', error)
      alert('Error al guardar la descripción. Por favor, intenta nuevamente.')
    } finally {
      setGastosGuardando(prev => {
        const nuevas = new Set(prev)
        nuevas.delete(gastoId)
        return nuevas
      })
    }
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
        <h1>Proyecciones de Pagos</h1>
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

      {obtenerTodosLosMeses().length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px', marginTop: '1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#27ae60' }}>¡Excelente!</h3>
          <p style={{ margin: 0, color: '#7f8c8d' }}>
            No hay proyecciones de pagos para los próximos {meses} meses.
            <br />
            Esto significa que todas tus tarjetas y préstamos están pagados o no tienen saldo pendiente.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {obtenerTodosLosMeses().map((mes) => {
            const proyTarjetas = getProyeccionTarjetasPorMes(mes)
            const proyPrestamos = getProyeccionPrestamosPorMes(mes)
            
            const totalCuotas = (proyTarjetas?.cantidad_cuotas || 0) + (proyPrestamos?.cantidad_cuotas || 0)
            const totalArs = (proyTarjetas?.total_ars || 0) + (proyPrestamos?.total_ars || 0)
            const totalUsd = (proyTarjetas?.total_usd || 0) + (proyPrestamos?.total_usd || 0)
            const fechaVencimiento = proyTarjetas?.fecha_vencimiento || proyPrestamos?.fecha_vencimiento || ''
            
            return (
            <div
              key={mes}
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
                    {formatearMes(mes)}
                  </h2>
                  {fechaVencimiento && (
                    <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                      Vencimiento: {formatearFecha(fechaVencimiento)}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>
                    {totalCuotas} {totalCuotas === 1 ? 'cuota' : 'cuotas'}
                  </p>
                  {totalArs > 0 && (
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
                      {formatearMonto(totalArs, 'ARS')}
                    </p>
                  )}
                  {totalUsd > 0 && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#3498db' }}>
                      {formatearMonto(totalUsd, 'USD')}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Renderizar tarjetas */}
                {proyTarjetas && proyTarjetas.detalle.map((detalle, detalleIndex) => {
                  const diasRestantes = Math.ceil((new Date(detalle.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  const estaPagada = detalle.monto_estimado <= 0
                  
                  return (
                    <div
                      key={`tarjeta-${detalleIndex}`}
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

                      {/* Resumen de gastos y desglose - siempre visible */}
                      {!estaPagada && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                          {/* Resumen compacto */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                            {detalle.total_gastos_periodo !== undefined && detalle.total_gastos_periodo > 0 && (
                              <div style={{ padding: '0.75rem', backgroundColor: '#e8f4f8', borderRadius: '4px', border: '1px solid #bee5eb' }}>
                                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#0c5460', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Total Gastos
                                </p>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#0c5460' }}>
                                  {formatearMonto(detalle.total_gastos_periodo, detalle.moneda)}
                                </p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#0c5460' }}>
                                  {detalle.cantidad_gastos || 0} {detalle.cantidad_gastos === 1 ? 'gasto' : 'gastos'}
                                </p>
                              </div>
                            )}
                            {detalle.desglose && detalle.desglose.total_cargos > 0 && (
                              <div style={{ padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#856404', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Cargos e Impuestos
                                </p>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#856404' }}>
                                  {formatearMonto(detalle.desglose.total_cargos, detalle.moneda)}
                                </p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#856404' }}>
                                  {((detalle.desglose.total_cargos / detalle.desglose.monto_total) * 100).toFixed(1)}% del total
                                </p>
                              </div>
                            )}
                            {detalle.desglose && detalle.desglose.capital > 0 && (
                              <div style={{ padding: '0.75rem', backgroundColor: '#d4edda', borderRadius: '4px', border: '1px solid #28a745' }}>
                                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#155724', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Capital
                                </p>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#155724' }}>
                                  {formatearMonto(detalle.desglose.capital, detalle.moneda)}
                                </p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#155724' }}>
                                  {((detalle.desglose.capital / detalle.desglose.monto_total) * 100).toFixed(1)}% del total
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Botón para ver detalles completos */}
                          <button
                            onClick={() => toggleGastos(detalle.tarjeta_id, mes)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              backgroundColor: tarjetasExpandidas.has(`${detalle.tarjeta_id}-${mes}`) ? '#3498db' : '#ecf0f1',
                              color: tarjetasExpandidas.has(`${detalle.tarjeta_id}-${mes}`) ? '#fff' : '#2c3e50',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span>{tarjetasExpandidas.has(`${detalle.tarjeta_id}-${mes}`) ? '▼' : '▶'}</span>
                            <span>{tarjetasExpandidas.has(`${detalle.tarjeta_id}-${mes}`) ? 'Ocultar' : 'Ver'} detalles completos de gastos y desglose</span>
                          </button>
                        </div>
                      )}

                      {/* Panel de gastos y desglose expandido */}
                      {!estaPagada && tarjetasExpandidas.has(`${detalle.tarjeta_id}-${mes}`) && (
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                          {/* Período de cierre */}
                          {detalle.periodo_cierre && (
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#7f8c8d', fontWeight: '600' }}>
                                Período de Cierre:
                              </p>
                              <p style={{ margin: 0, fontSize: '0.9rem', color: '#2c3e50' }}>
                                {formatearFecha(detalle.periodo_cierre.fecha_inicio)} - {formatearFecha(detalle.periodo_cierre.fecha_fin)}
                              </p>
                            </div>
                          )}

                          {/* Explicación sobre descripciones incompletas */}
                          {detalle.gastos && detalle.gastos.some(g => !g.descripcion || g.descripcion.length < 10 || g.descripcion.toLowerCase().includes('llamando al')) && (
                            <div style={{
                              marginBottom: '1rem',
                              padding: '0.75rem',
                              backgroundColor: '#fff3cd',
                              borderRadius: '4px',
                              border: '1px solid #ffc107'
                            }}>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#856404', fontWeight: '600' }}>
                                ⚠️ Sobre las descripciones incompletas:
                              </p>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#856404', lineHeight: '1.5' }}>
                                Si ves "LLAMANDO AL" o descripciones muy cortas, significa que el PDF del banco no tenía la descripción completa. 
                                Puedes hacer clic en el botón ✏️ para editar y completar con lo que recuerdes de la compra.
                              </p>
                            </div>
                          )}

                          {/* Gastos del período */}
                          {detalle.gastos && detalle.gastos.length > 0 ? (
                            <div style={{ marginBottom: '1.5rem' }}>
                              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#2c3e50' }}>
                                Gastos del Período ({detalle.cantidad_gastos || detalle.gastos.length})
                              </h4>
                              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#7f8c8d', fontStyle: 'italic' }}>
                                Estos son solo los gastos nuevos del período. El monto total a pagar incluye también saldo anterior y cargos del banco.
                              </p>
                              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Fecha</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Descripción</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Categoría</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#2c3e50' }}>Monto</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detalle.gastos.map((gasto) => {
                                      // Detectar si tiene información de cuotas en la descripción
                                      const descripcionLimpia = gasto.descripcion ? gasto.descripcion.replace(/\s*\(Cuota\s+\d+\/\d+\)/i, '').trim() : gasto.tipo
                                      const matchCuotas = gasto.descripcion ? gasto.descripcion.match(/\(Cuota\s+(\d+)\/(\d+)\)/i) : null
                                      const estaEditando = gastosEditando.has(gasto.id)
                                      const estaGuardando = gastosGuardando.has(gasto.id)
                                      const descripcionEditando = gastosEditando.get(gasto.id) || ''
                                      
                                      return (
                                        <tr key={gasto.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                          <td style={{ padding: '0.75rem', color: '#2c3e50' }}>{formatearFecha(gasto.fecha)}</td>
                                          <td style={{ padding: '0.75rem', color: '#2c3e50' }}>
                                            {estaEditando ? (
                                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                  type="text"
                                                  value={descripcionEditando}
                                                  onChange={(e) => {
                                                    const nuevas = new Map(gastosEditando)
                                                    nuevas.set(gasto.id, e.target.value)
                                                    setGastosEditando(nuevas)
                                                  }}
                                                  style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    border: '1px solid #3498db',
                                                    borderRadius: '4px',
                                                    fontSize: '0.9rem'
                                                  }}
                                                  autoFocus
                                                  disabled={estaGuardando}
                                                />
                                                <button
                                                  onClick={() => guardarGasto(gasto.id)}
                                                  disabled={estaGuardando}
                                                  style={{
                                                    padding: '0.5rem 1rem',
                                                    backgroundColor: '#27ae60',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: estaGuardando ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.85rem',
                                                    opacity: estaGuardando ? 0.6 : 1
                                                  }}
                                                >
                                                  {estaGuardando ? 'Guardando...' : '✓'}
                                                </button>
                                                <button
                                                  onClick={() => cancelarEdicionGasto(gasto.id)}
                                                  disabled={estaGuardando}
                                                  style={{
                                                    padding: '0.5rem 1rem',
                                                    backgroundColor: '#e74c3c',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: estaGuardando ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.85rem',
                                                    opacity: estaGuardando ? 0.6 : 1
                                                  }}
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            ) : (
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span
                                                  onClick={() => iniciarEdicionGasto(gasto.id, descripcionLimpia)}
                                                  style={{
                                                    cursor: 'pointer',
                                                    flex: 1,
                                                    padding: '0.25rem',
                                                    borderRadius: '4px',
                                                    transition: 'background-color 0.2s'
                                                  }}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                  title="Haz clic para editar"
                                                >
                                                  {descripcionLimpia || 'Sin descripción'}
                                                </span>
                                                {matchCuotas && (
                                                  <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    backgroundColor: '#fff3cd',
                                                    color: '#856404',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                  }}>
                                                    Cuota {matchCuotas[1]}/{matchCuotas[2]}
                                                  </span>
                                                )}
                                                {(!gasto.descripcion || gasto.descripcion.length < 10 || gasto.descripcion.toLowerCase().includes('llamando al')) && (
                                                  <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    backgroundColor: '#fee',
                                                    color: '#c0392b',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    fontStyle: 'italic'
                                                  }}>
                                                    ⚠ Incompleta
                                                  </span>
                                                )}
                                                <button
                                                  onClick={() => iniciarEdicionGasto(gasto.id, descripcionLimpia)}
                                                  style={{
                                                    padding: '0.25rem 0.5rem',
                                                    backgroundColor: '#ecf0f1',
                                                    color: '#2c3e50',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                  }}
                                                  title="Editar descripción"
                                                >
                                                  ✏️
                                                </button>
                                              </div>
                                            )}
                                          </td>
                                          <td style={{ padding: '0.75rem', color: '#7f8c8d' }}>
                                            {gasto.categoria || '-'}
                                          </td>
                                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#e74c3c' }}>
                                            {formatearMonto(gasto.monto, detalle.moneda)}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #e0e0e0' }}>
                                      <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#2c3e50' }}>
                                        Total Gastos:
                                      </td>
                                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#e74c3c', fontSize: '1rem' }}>
                                        {formatearMonto(detalle.total_gastos_periodo || 0, detalle.moneda)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', textAlign: 'center' }}>
                              <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>
                                No hay gastos registrados para este período
                              </p>
                            </div>
                          )}

                          {/* Desglose de la cuota */}
                          {detalle.desglose && (
                            <div>
                              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#2c3e50' }}>
                                Desglose de la Cuota
                              </h4>
                              <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                                  <span style={{ fontSize: '0.9rem', color: '#155724' }}>Capital</span>
                                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#155724' }}>
                                    {formatearMonto(detalle.desglose.capital, detalle.moneda)}
                                  </span>
                                </div>
                                
                                {detalle.desglose.intereses > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#856404' }}>Intereses</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                      {formatearMonto(detalle.desglose.intereses, detalle.moneda)}
                                    </span>
                                  </div>
                                )}
                                
                                {detalle.desglose.iva_intereses > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#856404' }}>IVA sobre Intereses</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                      {formatearMonto(detalle.desglose.iva_intereses, detalle.moneda)}
                                    </span>
                                  </div>
                                )}
                                
                                {detalle.desglose.gastos_administrativos > 0 && (
                                  <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                      <span style={{ fontSize: '0.9rem', color: '#856404' }}>Gastos Administrativos</span>
                                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                        {formatearMonto(detalle.desglose.gastos_administrativos, detalle.moneda)}
                                      </span>
                                    </div>
                                    {detalle.desglose.iva_gastos_admin && detalle.desglose.iva_gastos_admin > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px', marginLeft: '1rem', borderLeft: '3px solid #f39c12' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#856404' }}>→ IVA sobre Gastos Admin.</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#856404' }}>
                                          {formatearMonto(detalle.desglose.iva_gastos_admin, detalle.moneda)}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {detalle.desglose.otros_impuestos > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#856404' }}>Otros Impuestos</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                      {formatearMonto(detalle.desglose.otros_impuestos, detalle.moneda)}
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
                                alignItems: 'center',
                                marginBottom: '0.75rem'
                              }}>
                                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#fff' }}>Total a Pagar</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
                                  {formatearMonto(detalle.desglose.monto_total, detalle.moneda)}
                                </span>
                              </div>

                              <div style={{ padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#c0392b' }}>
                                  <strong>Total de Cargos:</strong> {formatearMonto(detalle.desglose.total_cargos, detalle.moneda)} 
                                  ({((detalle.desglose.total_cargos / detalle.desglose.monto_total) * 100).toFixed(2)}% del total)
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {/* Renderizar préstamos */}
                {proyPrestamos && proyPrestamos.detalle.map((detalle, detalleIndex) => {
                  const diasRestantes = Math.ceil((new Date(detalle.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  const montoEstimado = detalle.desglose?.monto_total || 0
                  
                  return (
                    <div
                      key={`prestamo-${detalleIndex}`}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        borderLeft: '4px solid #9b59b6',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        marginTop: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#2c3e50', fontWeight: '600' }}>
                            {detalle.prestamo_nombre}
                            {detalle.prestamista && (
                              <span style={{ fontSize: '0.9rem', color: '#7f8c8d', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                                ({detalle.prestamista})
                              </span>
                            )}
                            <span style={{ fontSize: '0.9rem', color: '#9b59b6', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                              - Cuota #{detalle.numero_cuota}
                            </span>
                          </h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
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
                            {formatearMonto(montoEstimado, detalle.moneda)}
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

                      {/* Botón para ver desglose */}
                      {detalle.desglose && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                          <button
                            onClick={() => togglePrestamo(detalle.prestamo_id, mes)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              backgroundColor: prestamosExpandidos.has(`${detalle.prestamo_id}-${mes}`) ? '#9b59b6' : '#ecf0f1',
                              color: prestamosExpandidos.has(`${detalle.prestamo_id}-${mes}`) ? '#fff' : '#2c3e50',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span>{prestamosExpandidos.has(`${detalle.prestamo_id}-${mes}`) ? '▼' : '▶'}</span>
                            <span>{prestamosExpandidos.has(`${detalle.prestamo_id}-${mes}`) ? 'Ocultar' : 'Ver'} desglose completo de la cuota</span>
                          </button>
                        </div>
                      )}

                      {/* Desglose expandido */}
                      {detalle.desglose && prestamosExpandidos.has(`${detalle.prestamo_id}-${mes}`) && (
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#2c3e50' }}>
                            Desglose de la Cuota #{detalle.numero_cuota}
                          </h4>
                          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                              <span style={{ fontSize: '0.9rem', color: '#2c3e50' }}>Monto Pendiente</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2c3e50' }}>
                                {formatearMonto(detalle.monto_pendiente, detalle.moneda)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                              <span style={{ fontSize: '0.9rem', color: '#155724' }}>Capital</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#155724' }}>
                                {formatearMonto(detalle.desglose.capital, detalle.moneda)}
                              </span>
                            </div>
                            
                            {detalle.desglose.intereses > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                                <span style={{ fontSize: '0.9rem', color: '#856404' }}>Intereses</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                  {formatearMonto(detalle.desglose.intereses, detalle.moneda)}
                                </span>
                              </div>
                            )}
                            
                            {detalle.desglose.iva_intereses > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                <span style={{ fontSize: '0.9rem', color: '#856404' }}>IVA sobre Intereses</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                  {formatearMonto(detalle.desglose.iva_intereses, detalle.moneda)}
                                </span>
                              </div>
                            )}
                            
                            {detalle.desglose.gastos_administrativos > 0 && (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                  <span style={{ fontSize: '0.9rem', color: '#856404' }}>Gastos Administrativos</span>
                                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                    {formatearMonto(detalle.desglose.gastos_administrativos, detalle.moneda)}
                                  </span>
                                </div>
                                {detalle.desglose.iva_gastos_admin && detalle.desglose.iva_gastos_admin > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px', marginLeft: '1rem', borderLeft: '3px solid #f39c12' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#856404' }}>→ IVA sobre Gastos Admin.</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#856404' }}>
                                      {formatearMonto(detalle.desglose.iva_gastos_admin, detalle.moneda)}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {detalle.desglose.seguro && detalle.desglose.seguro > 0 && (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                  <span style={{ fontSize: '0.9rem', color: '#856404' }}>Seguro</span>
                                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                    {formatearMonto(detalle.desglose.seguro, detalle.moneda)}
                                  </span>
                                </div>
                                {detalle.desglose.iva_seguro && detalle.desglose.iva_seguro > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px', marginLeft: '1rem', borderLeft: '3px solid #f39c12' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#856404' }}>→ IVA sobre Seguro</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#856404' }}>
                                      {formatearMonto(detalle.desglose.iva_seguro, detalle.moneda)}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {detalle.desglose.otros_impuestos > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                                <span style={{ fontSize: '0.9rem', color: '#856404' }}>Otros Impuestos</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#856404' }}>
                                  {formatearMonto(detalle.desglose.otros_impuestos, detalle.moneda)}
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
                            alignItems: 'center',
                            marginBottom: '0.75rem'
                          }}>
                            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#fff' }}>Total a Pagar</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
                              {formatearMonto(detalle.desglose.monto_total, detalle.moneda)}
                            </span>
                          </div>

                          <div style={{ padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#c0392b' }}>
                              <strong>Total de Cargos:</strong> {formatearMonto(detalle.desglose.total_cargos, detalle.moneda)} 
                              ({((detalle.desglose.total_cargos / detalle.desglose.monto_total) * 100).toFixed(2)}% del total)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            )
          })}
        </div>
      )}

      {obtenerTodosLosMeses().length > 0 && (
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
            {(() => {
              const totalArs = proyeccionesTarjetas.reduce((sum, p) => sum + p.total_ars, 0) + proyeccionesPrestamos.reduce((sum, p) => sum + p.total_ars, 0)
              const totalUsd = proyeccionesTarjetas.reduce((sum, p) => sum + p.total_usd, 0) + proyeccionesPrestamos.reduce((sum, p) => sum + p.total_usd, 0)
              const totalCuotas = proyeccionesTarjetas.reduce((sum, p) => sum + p.cantidad_cuotas, 0) + proyeccionesPrestamos.reduce((sum, p) => sum + p.cantidad_cuotas, 0)
              
              return (
                <>
                  {totalArs > 0 && (
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total ARS</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {formatearMonto(totalArs, 'ARS')}
                      </p>
                    </div>
                  )}
                  {totalUsd > 0 && (
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total USD</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {formatearMonto(totalUsd, 'USD')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total de Cuotas</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {totalCuotas}
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default Proyecciones
