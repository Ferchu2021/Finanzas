import React, { useState, useEffect } from 'react'
import { gastosApi, Gasto, GastoCreate } from '../services/api'

const Gastos: React.FC = () => {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null)
  const [filtroMes, setFiltroMes] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')

  const [formData, setFormData] = useState<GastoCreate>({
    fecha: new Date().toISOString().split('T')[0],
    monto: 0,
    moneda: 'ARS',
    tipo: 'Ordinario',
    categoria: '',
    descripcion: ''
  })

  useEffect(() => {
    cargarGastos()
  }, [])

  const cargarGastos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await gastosApi.getAll()
      setGastos(response.data || [])
    } catch (err: any) {
      console.error('Error al cargar gastos:', err)
      setError('Error al cargar los gastos. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (gastoEditando) {
        // Actualizar gasto existente
        await gastosApi.update(gastoEditando.id, formData)
      } else {
        // Crear nuevo gasto
        await gastosApi.create(formData)
      }
      await cargarGastos()
      resetearFormulario()
      setError(null)
    } catch (err: any) {
      console.error('Error al guardar gasto:', err)
      setError(err.response?.data?.detail || 'Error al guardar el gasto. Por favor, intenta nuevamente.')
    }
  }

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      return
    }
    try {
      await gastosApi.delete(id)
      await cargarGastos()
      setError(null)
    } catch (err: any) {
      console.error('Error al eliminar gasto:', err)
      setError('Error al eliminar el gasto. Por favor, intenta nuevamente.')
    }
  }

  const handleEditar = (gasto: Gasto) => {
    setGastoEditando(gasto)
    setFormData({
      fecha: gasto.fecha,
      monto: gasto.monto,
      moneda: gasto.moneda,
      tipo: gasto.tipo,
      categoria: gasto.categoria || '',
      descripcion: gasto.descripcion || ''
    })
    setMostrarFormulario(true)
  }

  const resetearFormulario = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      monto: 0,
      moneda: 'ARS',
      tipo: 'Ordinario',
      categoria: '',
      descripcion: ''
    })
    setGastoEditando(null)
    setMostrarFormulario(false)
  }

  const formatearMonto = (monto: number, moneda: string): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(monto)
  }

  const formatearFecha = (fecha: string): string => {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'Fijo':
        return { bg: '#fff3cd', border: '#ffc107', text: '#856404' }
      case 'Ordinario':
        return { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' }
      case 'Extraordinario':
        return { bg: '#f8d7da', border: '#dc3545', text: '#721c24' }
      default:
        return { bg: '#f8f9fa', border: '#6c757d', text: '#495057' }
    }
  }

  // Filtrar gastos
  const gastosFiltrados = gastos.filter(gasto => {
    const fechaGasto = new Date(gasto.fecha)
    const mesGasto = `${fechaGasto.getFullYear()}-${String(fechaGasto.getMonth() + 1).padStart(2, '0')}`
    
    const cumpleMes = !filtroMes || mesGasto === filtroMes
    const cumpleTipo = !filtroTipo || gasto.tipo === filtroTipo
    
    return cumpleMes && cumpleTipo
  })

  // Calcular totales
  const totales = gastosFiltrados.reduce((acc, gasto) => {
    if (gasto.moneda === 'ARS') {
      acc.ars += gasto.monto
    } else {
      acc.usd += gasto.monto
    }
    return acc
  }, { ars: 0, usd: 0 })

  // Obtener meses únicos para el filtro
  const mesesUnicos = Array.from(new Set(
    gastos.map(g => {
      const fecha = new Date(g.fecha)
      return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    })
  )).sort().reverse()

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando gastos...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>Gastos</h1>
        <button
          onClick={() => {
            resetearFormulario()
            setMostrarFormulario(true)
          }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#27ae60',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          + Nuevo Gasto
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Filtros */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
            Filtrar por mes:
          </label>
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            <option value="">Todos los meses</option>
            {mesesUnicos.map(mes => {
              const [ano, mesNum] = mes.split('-')
              const fecha = new Date(parseInt(ano), parseInt(mesNum) - 1)
              return (
                <option key={mes} value={mes}>
                  {fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })}
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
            Filtrar por tipo:
          </label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            <option value="">Todos los tipos</option>
            <option value="Fijo">Fijo</option>
            <option value="Ordinario">Ordinario</option>
            <option value="Extraordinario">Extraordinario</option>
          </select>
        </div>
      </div>

      {/* Resumen de totales */}
      {(totales.ars > 0 || totales.usd > 0) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {totales.ars > 0 && (
            <div style={{
              backgroundColor: '#fff',
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #e74c3c'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>Total ARS</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
                {formatearMonto(totales.ars, 'ARS')}
              </p>
            </div>
          )}
          {totales.usd > 0 && (
            <div style={{
              backgroundColor: '#fff',
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #3498db'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>Total USD</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>
                {formatearMonto(totales.usd, 'USD')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, color: '#2c3e50' }}>
              {gastoEditando ? 'Editar Gasto' : 'Nuevo Gasto'}
            </h2>
            <button
              onClick={resetearFormulario}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#95a5a6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
                  Moneda *
                </label>
                <select
                  value={formData.moneda}
                  onChange={(e) => setFormData({ ...formData, moneda: e.target.value as 'ARS' | 'USD' })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="ARS">ARS (Pesos)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Fijo">Fijo</option>
                  <option value="Ordinario">Ordinario</option>
                  <option value="Extraordinario">Extraordinario</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
                  Categoría
                </label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ej: Alimentación, Transporte, etc."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del gasto..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={resetearFormulario}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                {gastoEditando ? 'Actualizar' : 'Guardar'} Gasto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de gastos */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {gastosFiltrados.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#7f8c8d' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay gastos registrados</p>
            <p style={{ fontSize: '0.9rem' }}>
              {filtroMes || filtroTipo ? 'Intenta cambiar los filtros' : 'Comienza agregando tu primer gasto'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', color: '#7f8c8d', fontWeight: '600' }}>Fecha</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', color: '#7f8c8d', fontWeight: '600' }}>Descripción</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', color: '#7f8c8d', fontWeight: '600' }}>Categoría</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', color: '#7f8c8d', fontWeight: '600' }}>Tipo</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', color: '#7f8c8d', fontWeight: '600' }}>Monto</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#7f8c8d', fontWeight: '600' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gastosFiltrados.map((gasto) => {
                  const colors = getColorTipo(gasto.tipo)
                  return (
                    <tr key={gasto.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#2c3e50' }}>
                        {formatearFecha(gasto.fecha)}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#2c3e50' }}>
                        {gasto.descripcion || '-'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#2c3e50' }}>
                        {gasto.categoria || '-'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`
                        }}>
                          {gasto.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: '600', color: '#e74c3c' }}>
                        {formatearMonto(gasto.monto, gasto.moneda)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditar(gasto)}
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
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(gasto.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#e74c3c',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Gastos
