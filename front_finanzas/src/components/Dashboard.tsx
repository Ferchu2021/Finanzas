import React, { useState, useEffect } from 'react'
import { reportesApi, alertasApi, tarjetasApi, prestamosApi } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Dashboard: React.FC = () => {
  const [resumen, setResumen] = useState<any>(null)
  const [alertas, setAlertas] = useState<any[]>([])
  const [tarjetas, setTarjetas] = useState<any[]>([])
  const [prestamos, setPrestamos] = useState<any[]>([])
  const [tendencias, setTendencias] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const hoy = new Date()
  const mesActual = hoy.getMonth() + 1
  const anoActual = hoy.getFullYear()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Cargar resumen del mes actual
      try {
        const resumenResponse = await reportesApi.resumenMensual(anoActual, mesActual)
        setResumen(resumenResponse.data)
      } catch (err) {
        console.warn('Error al cargar resumen:', err)
        setResumen(null)
      }

      // Cargar alertas (solo las más importantes)
      try {
        const alertasResponse = await alertasApi.getAll()
        setAlertas(alertasResponse.data?.slice(0, 5) || []) // Solo las primeras 5
      } catch (err) {
        console.warn('Error al cargar alertas:', err)
        setAlertas([])
      }

      // Cargar tendencias
      try {
        const tendenciasResponse = await alertasApi.getTendencias()
        setTendencias(tendenciasResponse.data)
      } catch (err) {
        console.warn('Error al cargar tendencias:', err)
        setTendencias(null)
      }

      // Cargar tarjetas
      try {
        const tarjetasResponse = await tarjetasApi.getAll()
        setTarjetas(tarjetasResponse.data || [])
      } catch (err) {
        console.warn('Error al cargar tarjetas:', err)
        setTarjetas([])
      }

      // Cargar préstamos activos
      try {
        const prestamosResponse = await prestamosApi.getAll()
        setPrestamos((prestamosResponse.data || []).filter((p: any) => p.activo))
      } catch (err) {
        console.warn('Error al cargar préstamos:', err)
        setPrestamos([])
      }
    } catch (err: any) {
      console.error('Error general al cargar dashboard:', err)
      setError('Error al cargar algunos datos. Algunas secciones pueden no estar disponibles.')
    } finally {
      setLoading(false)
    }
  }

  const formatearMonto = (monto: number, moneda: string): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto)
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

  const calcularTotalTarjetas = () => {
    const totalSaldo = tarjetas.reduce((sum, t) => sum + t.saldo_actual, 0)
    const totalLimite = tarjetas.reduce((sum, t) => sum + t.limite, 0)
    const porcentajeUso = totalLimite > 0 ? (totalSaldo / totalLimite) * 100 : 0
    return { totalSaldo, totalLimite, porcentajeUso }
  }

  const calcularTotalPrestamos = () => {
    const totalPendiente = prestamos.reduce((sum, p) => sum + (p.monto_total - p.monto_pagado), 0)
    const totalPagado = prestamos.reduce((sum, p) => sum + p.monto_pagado, 0)
    const totalOriginal = prestamos.reduce((sum, p) => sum + p.monto_total, 0)
    return { totalPendiente, totalPagado, totalOriginal }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <p>{error}</p>
        <button onClick={cargarDatos}>Reintentar</button>
      </div>
    )
  }

  const totalTarjetas = calcularTotalTarjetas()
  const totalPrestamos = calcularTotalPrestamos()
  const saldoMensual = resumen?.saldo?.ars || 0
  const ingresosMensual = resumen?.ingresos?.total_ars || 0
  const egresosMensual = resumen?.egresos?.total_ars || 0

  // Preparar datos para gráficos
  const datosGrafico = (tendencias?.saldos && tendencias?.ingresos && tendencias?.gastos) 
    ? tendencias.saldos.slice().reverse().map((item: any, index: number) => ({
        mes: item?.mes || '',
        ingresos: tendencias.ingresos[index]?.total || 0,
        gastos: tendencias.gastos[index]?.total || 0,
        saldo: item?.total || 0
      }))
    : []

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>Dashboard</h1>

      {/* Resumen del Mes Actual */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #27ae60'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>Ingresos del Mes</h3>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#27ae60' }}>
            {formatearMonto(ingresosMensual, 'ARS')}
          </p>
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #e74c3c'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>Gastos del Mes</h3>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#e74c3c' }}>
            {formatearMonto(egresosMensual, 'ARS')}
          </p>
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: `4px solid ${saldoMensual >= 0 ? '#27ae60' : '#e74c3c'}`
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>Saldo del Mes</h3>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: saldoMensual >= 0 ? '#27ae60' : '#e74c3c' }}>
            {formatearMonto(saldoMensual, 'ARS')}
          </p>
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3498db'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>Deudas Totales</h3>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#3498db' }}>
            {formatearMonto(totalTarjetas.totalSaldo + totalPrestamos.totalPendiente, 'ARS')}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Gráfico de Tendencias */}
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#2c3e50' }}>
            Tendencias de los Últimos 6 Meses
          </h2>
          {datosGrafico.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatearMonto(value, 'ARS')} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#27ae60" strokeWidth={2} name="Ingresos" />
                <Line type="monotone" dataKey="gastos" stroke="#e74c3c" strokeWidth={2} name="Gastos" />
                <Line type="monotone" dataKey="saldo" stroke="#3498db" strokeWidth={2} name="Saldo" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>No hay datos suficientes para mostrar</p>
          )}
        </div>

        {/* Alertas Importantes */}
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#2c3e50' }}>Alertas</h2>
            <button
              onClick={() => navigate('/alertas')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Ver todas
            </button>
          </div>
          {alertas.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {alertas.map((alerta, index) => {
                const colors = getColorSeveridad(alerta.severidad)
                return (
                  <div
                    key={index}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (alerta.tipo === 'deuda_tarjeta' || alerta.tipo === 'vencimiento_proximo') {
                        navigate('/tarjetas')
                      } else if (alerta.tipo === 'proyecciones_proximas') {
                        navigate('/proyecciones')
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{colors.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: '600', color: colors.text }}>
                          {alerta.titulo}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: colors.text }}>
                          {alerta.mensaje}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '0.9rem' }}>
              No hay alertas en este momento
            </p>
          )}
        </div>
      </div>

      {/* Resumen de Tarjetas y Préstamos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Tarjetas de Crédito */}
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#2c3e50' }}>Tarjetas de Crédito</h2>
            <button
              onClick={() => navigate('/tarjetas')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Ver todas
            </button>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>
              Saldo Total: <strong style={{ color: '#2c3e50' }}>{formatearMonto(totalTarjetas.totalSaldo, 'ARS')}</strong>
            </p>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>
              Límite Total: <strong style={{ color: '#2c3e50' }}>{formatearMonto(totalTarjetas.totalLimite, 'ARS')}</strong>
            </p>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#ecf0f1', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(totalTarjetas.porcentajeUso, 100)}%`,
                  height: '100%',
                  backgroundColor: totalTarjetas.porcentajeUso > 80 ? '#e74c3c' : totalTarjetas.porcentajeUso > 60 ? '#ffc107' : '#27ae60',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#7f8c8d', textAlign: 'right' }}>
              {totalTarjetas.porcentajeUso.toFixed(1)}% de uso
            </p>
          </div>
          {tarjetas.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tarjetas.slice(0, 3).map((tarjeta) => (
                <div key={tarjeta.id} style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#2c3e50' }}>
                    {tarjeta.nombre}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f8c8d' }}>
                    {formatearMonto(tarjeta.saldo_actual, tarjeta.moneda)} / {formatearMonto(tarjeta.limite, tarjeta.moneda)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '0.9rem' }}>No hay tarjetas registradas</p>
          )}
        </div>

        {/* Préstamos */}
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#2c3e50' }}>Préstamos Activos</h2>
            <button
              onClick={() => navigate('/prestamos')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Ver todos
            </button>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>
              Total Pendiente: <strong style={{ color: '#2c3e50' }}>{formatearMonto(totalPrestamos.totalPendiente, 'ARS')}</strong>
            </p>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>
              Total Pagado: <strong style={{ color: '#27ae60' }}>{formatearMonto(totalPrestamos.totalPagado, 'ARS')}</strong>
            </p>
            {totalPrestamos.totalOriginal > 0 && (
              <div style={{ width: '100%', height: '8px', backgroundColor: '#ecf0f1', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(totalPrestamos.totalPagado / totalPrestamos.totalOriginal) * 100}%`,
                    height: '100%',
                    backgroundColor: '#27ae60',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            )}
          </div>
          {prestamos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {prestamos.slice(0, 3).map((prestamo) => {
                const porcentajePagado = (prestamo.monto_pagado / prestamo.monto_total) * 100
                return (
                  <div key={prestamo.id} style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#2c3e50' }}>
                      {prestamo.nombre}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f8c8d' }}>
                      {formatearMonto(prestamo.monto_total - prestamo.monto_pagado, prestamo.moneda)} pendiente
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#7f8c8d' }}>
                      {porcentajePagado.toFixed(1)}% pagado
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '0.9rem' }}>No hay préstamos activos</p>
          )}
        </div>
      </div>

      {/* Gráfico de Ingresos vs Gastos */}
      {datosGrafico.length > 0 && (
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#2c3e50' }}>
            Comparación Ingresos vs Gastos
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatearMonto(value, 'ARS')} />
              <Legend />
              <Bar dataKey="ingresos" fill="#27ae60" name="Ingresos" />
              <Bar dataKey="gastos" fill="#e74c3c" name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default Dashboard
