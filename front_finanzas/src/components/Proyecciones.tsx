import { useEffect, useState } from 'react'
import { proyeccionesApi, ProyeccionPago, ProyeccionPagoCreate } from '../services/api'

function Proyecciones() {
  const [proyecciones, setProyecciones] = useState<ProyeccionPago[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<ProyeccionPagoCreate>({
    tipo: '',
    entidad_id: undefined,
    fecha_vencimiento: new Date().toISOString().split('T')[0],
    monto_estimado: 0,
    moneda: 'ARS',
    descripcion: ''
  })

  useEffect(() => {
    cargarProyecciones()
  }, [])

  const cargarProyecciones = async () => {
    try {
      setLoading(true)
      const response = await proyeccionesApi.getAll()
      setProyecciones(response.data)
    } catch (error) {
      console.error('Error cargando proyecciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await proyeccionesApi.create(formData)
      setShowForm(false)
      setFormData({
        tipo: '',
        entidad_id: undefined,
        fecha_vencimiento: new Date().toISOString().split('T')[0],
        monto_estimado: 0,
        moneda: 'ARS',
        descripcion: ''
      })
      cargarProyecciones()
    } catch (error) {
      console.error('Error creando proyección:', error)
      alert('Error al crear la proyección')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta proyección?')) return
    try {
      await proyeccionesApi.delete(id)
      cargarProyecciones()
    } catch (error) {
      console.error('Error eliminando proyección:', error)
      alert('Error al eliminar la proyección')
    }
  }

  if (loading) {
    return <div className="card">Cargando...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Proyecciones de Pagos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Proyección'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Nueva Proyección de Pago</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="tarjeta">Tarjeta de Crédito</option>
                <option value="prestamo">Préstamo</option>
                <option value="gasto_fijo">Gasto Fijo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label>ID de Entidad (opcional)</label>
              <input
                type="number"
                value={formData.entidad_id || ''}
                onChange={(e) => setFormData({ ...formData, entidad_id: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
            <div className="form-group">
              <label>Fecha de Vencimiento</label>
              <input
                type="date"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Monto Estimado</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto_estimado}
                onChange={(e) => setFormData({ ...formData, monto_estimado: parseFloat(e.target.value) })}
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
        <h2>Listado de Proyecciones</h2>
        {proyecciones.length === 0 ? (
          <p>No hay proyecciones registradas</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Fecha Vencimiento</th>
                <th>Monto Estimado</th>
                <th>Moneda</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proyecciones.map(proyeccion => (
                <tr key={proyeccion.id}>
                  <td>{proyeccion.tipo}</td>
                  <td>{new Date(proyeccion.fecha_vencimiento).toLocaleDateString('es-AR')}</td>
                  <td>${proyeccion.monto_estimado.toLocaleString('es-AR')}</td>
                  <td>{proyeccion.moneda}</td>
                  <td>{proyeccion.descripcion || '-'}</td>
                  <td>{proyeccion.pagado ? 'Pagado' : 'Pendiente'}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(proyeccion.id)}
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

export default Proyecciones


