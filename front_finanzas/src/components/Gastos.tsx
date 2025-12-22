import { useEffect, useState } from 'react'
import { gastosApi, Gasto, GastoCreate } from '../services/api'

const TIPOS_GASTO = ['Fijo', 'Ordinario', 'Extraordinario']

function Gastos() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<GastoCreate>({
    fecha: new Date().toISOString().split('T')[0],
    monto: 0,
    moneda: 'ARS',
    tipo: TIPOS_GASTO[0],
    categoria: '',
    descripcion: ''
  })

  useEffect(() => {
    cargarGastos()
  }, [])

  const cargarGastos = async () => {
    try {
      setLoading(true)
      const response = await gastosApi.getAll()
      setGastos(response.data)
    } catch (error) {
      console.error('Error cargando gastos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await gastosApi.create(formData)
      setShowForm(false)
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        monto: 0,
        moneda: 'ARS',
        tipo: TIPOS_GASTO[0],
        categoria: '',
        descripcion: ''
      })
      cargarGastos()
    } catch (error) {
      console.error('Error creando gasto:', error)
      alert('Error al crear el gasto')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return
    try {
      await gastosApi.delete(id)
      cargarGastos()
    } catch (error) {
      console.error('Error eliminando gasto:', error)
      alert('Error al eliminar el gasto')
    }
  }

  if (loading) {
    return <div className="card">Cargando...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Gastos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Gasto'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Nuevo Gasto</h2>
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
              <label>Tipo de Gasto</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                required
              >
                {TIPOS_GASTO.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ej: Alimentación, Transporte, etc."
              />
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
        <h2>Listado de Gastos</h2>
        {gastos.length === 0 ? (
          <p>No hay gastos registrados</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Monto</th>
                <th>Moneda</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map(gasto => (
                <tr key={gasto.id}>
                  <td>{new Date(gasto.fecha).toLocaleDateString('es-AR')}</td>
                  <td>{gasto.tipo}</td>
                  <td>{gasto.categoria || '-'}</td>
                  <td>${gasto.monto.toLocaleString('es-AR')}</td>
                  <td>{gasto.moneda}</td>
                  <td>{gasto.descripcion || '-'}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(gasto.id)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      Eliminar
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

export default Gastos



