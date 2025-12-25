import React, { useState, useEffect } from 'react'
import { tarjetasApi, TarjetaCredito } from '../services/api'

const Tarjetas: React.FC = () => {
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

            return (
              <div
                key={tarjeta.id}
                style={{
                  backgroundColor: '#fff',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: nivelAlerta === 'alta' ? '2px solid #e74c3c' : nivelAlerta === 'media' ? '2px solid #f39c12' : '1px solid #ddd'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>{tarjeta.nombre}</h2>
                    {tarjeta.banco && (
                      <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>Banco: {tarjeta.banco}</p>
                    )}
                    <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                      Cierre: día {tarjeta.fecha_cierre} | Vencimiento: día {tarjeta.fecha_vencimiento}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
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

                {nivelAlerta !== 'normal' && (
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Tarjetas
