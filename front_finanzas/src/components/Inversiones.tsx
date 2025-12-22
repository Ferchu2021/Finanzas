import { useEffect, useState } from 'react'
import { inversionesApi, Inversion, InversionCreate } from '../services/api'

function Inversiones() {
  const [inversiones, setInversiones] = useState<Inversion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<InversionCreate>({
    nombre: '',
    tipo: '',
    monto_inicial: 0,
    moneda: 'ARS',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    tasa_rendimiento: 0,
    descripcion: ''
  })

  useEffect(() => {
    cargarInversiones()
  }, [])

  const cargarInversiones = async () => {
    try {
      setLoading(true)
      const response = await inversionesApi.getAll()
      setInversiones(response.data)
    } catch (error) {
      console.error('Error cargando inversiones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await inversionesApi.create(formData)
      setShowForm(false)
      setFormData({
        nombre: '',
        tipo: '',
        monto_inicial: 0,
        moneda: 'ARS',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        tasa_rendimiento: 0,
        descripcion: ''
      })
      cargarInversiones()
    } catch (error) {
      console.error('Error creando inversión:', error)
      alert('Error al crear la inversión')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta inversión?')) return
    try {
      await inversionesApi.delete(id)
      cargarInversiones()
    } catch (error) {
      console.error('Error eliminando inversión:', error)
      alert('Error al eliminar la inversión')
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Cargando inversiones...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>📈 Inversiones</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Nueva Inversión'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Nueva Inversión</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <input
                type="text"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Ej: Plazo fijo, Acciones, Bonos, etc."
              />
            </div>
            <div className="form-group">
              <label>Monto Inicial</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto_inicial}
                onChange={(e) => setFormData({ ...formData, monto_inicial: parseFloat(e.target.value) })}
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
              <label>Fecha de Inicio</label>
              <input
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Fecha de Vencimiento</label>
              <input
                type="date"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Tasa de Rendimiento (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.tasa_rendimiento}
                onChange={(e) => setFormData({ ...formData, tasa_rendimiento: parseFloat(e.target.value) })}
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
        <h2>Listado de Inversiones</h2>
        {inversiones.length === 0 ? (
          <p>No hay inversiones registradas</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Monto Inicial</th>
                <th>Monto Actual</th>
                <th>Tasa Rendimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inversiones.map(inversion => (
                <tr key={inversion.id}>
                  <td>{inversion.nombre}</td>
                  <td>{inversion.tipo || '-'}</td>
                  <td>${inversion.monto_inicial.toLocaleString('es-AR')} {inversion.moneda}</td>
                  <td>${inversion.monto_actual?.toLocaleString('es-AR') || inversion.monto_inicial.toLocaleString('es-AR')} {inversion.moneda}</td>
                  <td>{inversion.tasa_rendimiento}%</td>
                  <td>{inversion.activa ? 'Activa' : 'Finalizada'}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(inversion.id)}
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

export default Inversiones




