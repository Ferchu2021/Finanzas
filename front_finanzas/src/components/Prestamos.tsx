import { useEffect, useState } from 'react'
import { prestamosApi, Prestamo, PrestamoCreate } from '../services/api'

function Prestamos() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<PrestamoCreate>({
    nombre: '',
    prestamista: '',
    monto_total: 0,
    moneda: 'ARS',
    tasa_interes: 0,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    cuota_mensual: 0,
    descripcion: ''
  })

  useEffect(() => {
    cargarPrestamos()
  }, [])

  const cargarPrestamos = async () => {
    try {
      setLoading(true)
      const response = await prestamosApi.getAll()
      setPrestamos(response.data)
    } catch (error) {
      console.error('Error cargando préstamos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await prestamosApi.create(formData)
      setShowForm(false)
      setFormData({
        nombre: '',
        prestamista: '',
        monto_total: 0,
        moneda: 'ARS',
        tasa_interes: 0,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        cuota_mensual: 0,
        descripcion: ''
      })
      cargarPrestamos()
    } catch (error) {
      console.error('Error creando préstamo:', error)
      alert('Error al crear el préstamo')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este préstamo?')) return
    try {
      await prestamosApi.delete(id)
      cargarPrestamos()
    } catch (error) {
      console.error('Error eliminando préstamo:', error)
      alert('Error al eliminar el préstamo')
    }
  }

  if (loading) {
    return <div className="card">Cargando...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Préstamos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Préstamo'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Nuevo Préstamo</h2>
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
              <label>Prestamista</label>
              <input
                type="text"
                value={formData.prestamista}
                onChange={(e) => setFormData({ ...formData, prestamista: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Monto Total</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto_total}
                onChange={(e) => setFormData({ ...formData, monto_total: parseFloat(e.target.value) })}
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
              <label>Tasa de Interés (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.tasa_interes}
                onChange={(e) => setFormData({ ...formData, tasa_interes: parseFloat(e.target.value) })}
              />
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
              <label>Cuota Mensual</label>
              <input
                type="number"
                step="0.01"
                value={formData.cuota_mensual}
                onChange={(e) => setFormData({ ...formData, cuota_mensual: parseFloat(e.target.value) })}
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
        <h2>Listado de Préstamos</h2>
        {prestamos.length === 0 ? (
          <p>No hay préstamos registrados</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Prestamista</th>
                <th>Monto Total</th>
                <th>Pagado</th>
                <th>Pendiente</th>
                <th>Cuota Mensual</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {prestamos.map(prestamo => {
                const pendiente = prestamo.monto_total - prestamo.monto_pagado
                return (
                  <tr key={prestamo.id}>
                    <td>{prestamo.nombre}</td>
                    <td>{prestamo.prestamista || '-'}</td>
                    <td>${prestamo.monto_total.toLocaleString('es-AR')} {prestamo.moneda}</td>
                    <td>${prestamo.monto_pagado.toLocaleString('es-AR')}</td>
                    <td>${pendiente.toLocaleString('es-AR')}</td>
                    <td>${prestamo.cuota_mensual?.toLocaleString('es-AR') || '-'}</td>
                    <td>{prestamo.activo ? 'Activo' : 'Finalizado'}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(prestamo.id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Prestamos


