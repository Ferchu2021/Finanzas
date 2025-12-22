import { useEffect, useState } from 'react'
import { tarjetasApi, TarjetaCredito, TarjetaCreditoCreate } from '../services/api'

function Tarjetas() {
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<TarjetaCreditoCreate>({
    nombre: '',
    banco: '',
    limite: 0,
    moneda: 'ARS',
    fecha_cierre: 1,
    fecha_vencimiento: 1
  })

  useEffect(() => {
    cargarTarjetas()
  }, [])

  const cargarTarjetas = async () => {
    try {
      setLoading(true)
      const response = await tarjetasApi.getAll()
      setTarjetas(response.data)
    } catch (error) {
      console.error('Error cargando tarjetas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await tarjetasApi.create(formData)
      setShowForm(false)
      setFormData({
        nombre: '',
        banco: '',
        limite: 0,
        moneda: 'ARS',
        fecha_cierre: 1,
        fecha_vencimiento: 1
      })
      cargarTarjetas()
    } catch (error) {
      console.error('Error creando tarjeta:', error)
      alert('Error al crear la tarjeta')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta tarjeta?')) return
    try {
      await tarjetasApi.delete(id)
      cargarTarjetas()
    } catch (error) {
      console.error('Error eliminando tarjeta:', error)
      alert('Error al eliminar la tarjeta')
    }
  }

  const getPorcentajeUso = (tarjeta: TarjetaCredito) => {
    return tarjeta.limite > 0 ? (tarjeta.saldo_actual / tarjeta.limite) * 100 : 0
  }

  if (loading) {
    return <div className="card">Cargando...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Tarjetas de Crédito</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Tarjeta'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Nueva Tarjeta de Crédito</h2>
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
              <label>Banco</label>
              <input
                type="text"
                value={formData.banco}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Límite</label>
              <input
                type="number"
                step="0.01"
                value={formData.limite}
                onChange={(e) => setFormData({ ...formData, limite: parseFloat(e.target.value) })}
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
              <label>Día de Cierre</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.fecha_cierre}
                onChange={(e) => setFormData({ ...formData, fecha_cierre: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>Día de Vencimiento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: parseInt(e.target.value) })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Listado de Tarjetas</h2>
        {tarjetas.length === 0 ? (
          <p>No hay tarjetas registradas</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Banco</th>
                <th>Límite</th>
                <th>Saldo Actual</th>
                <th>% Uso</th>
                <th>Moneda</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tarjetas.map(tarjeta => {
                const porcentaje = getPorcentajeUso(tarjeta)
                return (
                  <tr key={tarjeta.id}>
                    <td>{tarjeta.nombre}</td>
                    <td>{tarjeta.banco || '-'}</td>
                    <td>${tarjeta.limite.toLocaleString('es-AR')}</td>
                    <td>${tarjeta.saldo_actual.toLocaleString('es-AR')}</td>
                    <td style={{ color: porcentaje > 80 ? '#e74c3c' : porcentaje > 60 ? '#f39c12' : '#27ae60' }}>
                      {porcentaje.toFixed(1)}%
                    </td>
                    <td>{tarjeta.moneda}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(tarjeta.id)}
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

export default Tarjetas



