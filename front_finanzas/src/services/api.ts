import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Tipos
export interface Ingreso {
  id: number
  fecha: string
  monto: number
  moneda: 'ARS' | 'USD'
  tipo: string
  descripcion?: string
  created_at: string
}

export interface IngresoCreate {
  fecha: string
  monto: number
  moneda: 'ARS' | 'USD'
  tipo: string
  descripcion?: string
}

export interface Gasto {
  id: number
  fecha: string
  monto: number
  moneda: 'ARS' | 'USD'
  tipo: string
  categoria?: string
  descripcion?: string
  created_at: string
}

export interface GastoCreate {
  fecha: string
  monto: number
  moneda: 'ARS' | 'USD'
  tipo: string
  categoria?: string
  descripcion?: string
}

export interface TarjetaCredito {
  id: number
  nombre: string
  banco?: string
  limite: number
  moneda: 'ARS' | 'USD'
  fecha_cierre: number
  fecha_vencimiento: number
  saldo_actual: number
  created_at: string
}

export interface TarjetaCreditoCreate {
  nombre: string
  banco?: string
  limite: number
  moneda: 'ARS' | 'USD'
  fecha_cierre: number
  fecha_vencimiento: number
}

export interface Prestamo {
  id: number
  nombre: string
  prestamista?: string
  monto_total: number
  monto_pagado: number
  moneda: 'ARS' | 'USD'
  tasa_interes: number
  fecha_inicio: string
  fecha_vencimiento?: string
  cuota_mensual?: number
  descripcion?: string
  activo: boolean
  created_at: string
}

export interface PrestamoCreate {
  nombre: string
  prestamista?: string
  monto_total: number
  moneda: 'ARS' | 'USD'
  tasa_interes?: number
  fecha_inicio: string
  fecha_vencimiento?: string
  cuota_mensual?: number
  descripcion?: string
}

export interface Inversion {
  id: number
  nombre: string
  tipo?: string
  monto_inicial: number
  monto_actual?: number
  moneda: 'ARS' | 'USD'
  fecha_inicio: string
  fecha_vencimiento?: string
  tasa_rendimiento: number
  descripcion?: string
  activa: boolean
  created_at: string
}

export interface InversionCreate {
  nombre: string
  tipo?: string
  monto_inicial: number
  moneda: 'ARS' | 'USD'
  fecha_inicio: string
  fecha_vencimiento?: string
  tasa_rendimiento?: number
  descripcion?: string
}

export interface ProyeccionPago {
  id: number
  tipo: string
  entidad_id?: number
  fecha_vencimiento: string
  monto_estimado: number
  moneda: 'ARS' | 'USD'
  descripcion?: string
  pagado: boolean
  created_at: string
}

export interface ProyeccionPagoCreate {
  tipo: string
  entidad_id?: number
  fecha_vencimiento: string
  monto_estimado: number
  moneda: 'ARS' | 'USD'
  descripcion?: string
}

export interface Alerta {
  tipo: string
  severidad: 'alta' | 'media' | 'baja'
  titulo: string
  mensaje: string
  detalle: any
}

// API calls
export const ingresosApi = {
  getAll: () => api.get<Ingreso[]>('/ingresos'),
  getById: (id: number) => api.get<Ingreso>(`/ingresos/${id}`),
  create: (data: IngresoCreate) => api.post<Ingreso>('/ingresos', data),
  update: (id: number, data: Partial<IngresoCreate>) => api.put<Ingreso>(`/ingresos/${id}`, data),
  delete: (id: number) => api.delete(`/ingresos/${id}`),
}

export const gastosApi = {
  getAll: () => api.get<Gasto[]>('/gastos'),
  getById: (id: number) => api.get<Gasto>(`/gastos/${id}`),
  create: (data: GastoCreate) => api.post<Gasto>('/gastos', data),
  update: (id: number, data: Partial<GastoCreate>) => api.put<Gasto>(`/gastos/${id}`, data),
  delete: (id: number) => api.delete(`/gastos/${id}`),
}

export const tarjetasApi = {
  getAll: () => api.get<TarjetaCredito[]>('/tarjetas'),
  getById: (id: number) => api.get<TarjetaCredito>(`/tarjetas/${id}`),
  create: (data: TarjetaCreditoCreate) => api.post<TarjetaCredito>('/tarjetas', data),
  update: (id: number, data: Partial<TarjetaCreditoCreate>) => api.put<TarjetaCredito>(`/tarjetas/${id}`, data),
  delete: (id: number) => api.delete(`/tarjetas/${id}`),
}

export const prestamosApi = {
  getAll: () => api.get<Prestamo[]>('/prestamos'),
  getById: (id: number) => api.get<Prestamo>(`/prestamos/${id}`),
  create: (data: PrestamoCreate) => api.post<Prestamo>('/prestamos', data),
  update: (id: number, data: Partial<PrestamoCreate>) => api.put<Prestamo>(`/prestamos/${id}`, data),
  delete: (id: number) => api.delete(`/prestamos/${id}`),
}

export const inversionesApi = {
  getAll: () => api.get<Inversion[]>('/inversiones'),
  getById: (id: number) => api.get<Inversion>(`/inversiones/${id}`),
  create: (data: InversionCreate) => api.post<Inversion>('/inversiones', data),
  update: (id: number, data: Partial<InversionCreate>) => api.put<Inversion>(`/inversiones/${id}`, data),
  delete: (id: number) => api.delete(`/inversiones/${id}`),
}

export const proyeccionesApi = {
  getAll: () => api.get<ProyeccionPago[]>('/proyecciones'),
  create: (data: ProyeccionPagoCreate) => api.post<ProyeccionPago>('/proyecciones', data),
  delete: (id: number) => api.delete(`/proyecciones/${id}`),
}

export const reportesApi = {
  egresosMensuales: (ano: number, mes: number) => api.get(`/reportes/egresos-mensuales?ano=${ano}&mes=${mes}`),
  saldosPositivos: (ano: number, mes: number) => api.get(`/reportes/saldos-positivos?ano=${ano}&mes=${mes}`),
  resumenMensual: (ano: number, mes: number) => api.get(`/reportes/resumen-mensual?ano=${ano}&mes=${mes}`),
}

export const alertasApi = {
  getAll: () => api.get<Alerta[]>('/alertas'),
  getTendencias: () => api.get('/alertas/tendencias'),
}

export default api










