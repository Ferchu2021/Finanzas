import { useEffect, useState } from 'react'
import { ingresosApi, Ingreso, IngresoCreate } from '../services/api'

const TIPOS_INGRESO = [
  'Salario ACN',
  'Ventas Turismo Volá Barato',
  'Ingresos por Auditorías',
  'Clases en Universidad',
  'Ventas Productos Just'
]

function Ingresos() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<IngresoCreate>({
    fecha: new Date().toISOString().split('T')[0],
    monto: 0,
    moneda: 'ARS',
    tipo: TIPOS_INGRESO[0],
    descripcion: ''
  })

  useEffect(() => {
    cargarIngresos()
  }, [])

  const cargarIngresos = async () => {
    try {
      setLoading(true)
      const response = await ingresosApi.getAll()
      setIngresos(response.data)
    } catch (error) {
      console.error('Error cargando ingresos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await ingresosApi.create(formData)
      setShowForm(false)
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        monto: 0,
        moneda: 'ARS',
        tipo: TIPOS_INGRESO[0],
        descripcion: ''
      })
      cargarIngresos()
    } catch (error) {
      console.error('Error creando ingreso:', error)
      alert('Error al crear el ingreso')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este ingreso?')) return
    try {
      await ingresosApi.delete(id)
      cargarIngresos()
    } catch (error) {
      console.error('Error eliminando ingreso:', error)
      alert('Error al eliminar el ingreso')
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Cargando ingresos...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>💵 Ingresos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Nuevo Ingreso'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Nuevo Ingreso</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Monto</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>Moneda</label>
              <select
                value={formData.moneda}
                onChange={(e) => setFormData({ ...formData, moneda: e.target.value as 'ARS' | 'USD' })}
                required
              >
                <option value="ARS">Pesos (ARS)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tipo de Ingreso</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                required
              >
                {TIPOS_INGRESO.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Listado de Ingresos</h2>
        {ingresos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3>No hay ingresos registrados</h3>
            <p>Comienza agregando tu primer ingreso usando el botón "Nuevo Ingreso"</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Moneda</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.map(ingreso => (
                <tr key={ingreso.id}>
                  <td>{new Date(ingreso.fecha).toLocaleDateString('es-AR')}</td>
                  <td>{ingreso.tipo}</td>
                  <td>${ingreso.monto.toLocaleString('es-AR')}</td>
                  <td>{ingreso.moneda}</td>
                  <td>{ingreso.descripcion || '-'}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(ingreso.id)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      title="Eliminar ingreso"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Ingresos




