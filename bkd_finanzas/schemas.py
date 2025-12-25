from pydantic import BaseModel, ConfigDict, model_validator
from datetime import date
from typing import Optional
from models import TipoIngreso, TipoGasto, TipoMoneda


# ========== INGRESOS ==========
class IngresoBase(BaseModel):
    fecha: date
    monto: float
    moneda: TipoMoneda
    tipo: TipoIngreso
    descripcion: Optional[str] = None


class IngresoCreate(IngresoBase):
    pass


class IngresoUpdate(BaseModel):
    fecha: Optional[date] = None
    monto: Optional[float] = None
    moneda: Optional[TipoMoneda] = None
    tipo: Optional[TipoIngreso] = None
    descripcion: Optional[str] = None


class Ingreso(IngresoBase):
    id: int
    created_at: date
    model_config = ConfigDict(from_attributes=True)


# ========== GASTOS ==========
class GastoBase(BaseModel):
    fecha: date
    monto: float
    moneda: TipoMoneda
    tipo: TipoGasto
    categoria: Optional[str] = None
    descripcion: Optional[str] = None


class GastoCreate(GastoBase):
    pass


class GastoUpdate(BaseModel):
    fecha: Optional[date] = None
    monto: Optional[float] = None
    moneda: Optional[TipoMoneda] = None
    tipo: Optional[TipoGasto] = None
    categoria: Optional[str] = None
    descripcion: Optional[str] = None


class Gasto(GastoBase):
    id: int
    created_at: date
    model_config = ConfigDict(from_attributes=True)


# ========== TARJETAS DE CRÉDITO ==========
class TarjetaCreditoBase(BaseModel):
    nombre: str
    banco: Optional[str] = None
    limite: float
    moneda: TipoMoneda
    fecha_cierre: int
    fecha_vencimiento: int


class TarjetaCreditoCreate(TarjetaCreditoBase):
    tasa_interes_anual: Optional[float] = 90.0
    tasa_interes_mensual: Optional[float] = 7.5
    impuesto_iva: Optional[float] = 21.0
    impuesto_ganancias: Optional[float] = 0.0
    gastos_administrativos: Optional[float] = 1000.0
    impuesto_sellos: Optional[float] = 0.0


class TarjetaCreditoUpdate(BaseModel):
    nombre: Optional[str] = None
    banco: Optional[str] = None
    limite: Optional[float] = None
    moneda: Optional[TipoMoneda] = None
    fecha_cierre: Optional[int] = None
    fecha_vencimiento: Optional[int] = None
    saldo_actual: Optional[float] = None
    tasa_interes_anual: Optional[float] = None
    tasa_interes_mensual: Optional[float] = None
    impuesto_iva: Optional[float] = None
    impuesto_ganancias: Optional[float] = None
    gastos_administrativos: Optional[float] = None


class TarjetaCredito(TarjetaCreditoBase):
    id: int
    saldo_actual: float
    created_at: date
    model_config = ConfigDict(from_attributes=True)


class DesgloseCuotaTarjeta(BaseModel):
    tarjeta_id: int
    fecha_vencimiento: date
    monto_total: float
    capital: float
    intereses: float
    iva_intereses: float
    impuesto_ganancias: float
    gastos_administrativos: float
    otros_impuestos: float
    moneda: TipoMoneda
    descripcion: Optional[str] = None


class PagoTarjetaCreate(BaseModel):
    tarjeta_id: int
    fecha_pago: date
    monto: float
    descripcion: Optional[str] = None


# ========== PRÉSTAMOS ==========
class PrestamoBase(BaseModel):
    nombre: str
    prestamista: Optional[str] = None
    monto_total: float
    moneda: TipoMoneda
    tasa_interes: Optional[float] = 0.0
    fecha_inicio: date
    fecha_vencimiento: Optional[date] = None
    cuota_mensual: Optional[float] = None
    descripcion: Optional[str] = None


class PrestamoCreate(PrestamoBase):
    impuesto_iva: Optional[float] = 21.0
    impuesto_ganancias: Optional[float] = 0.0
    gastos_administrativos: Optional[float] = 500.0
    seguro: Optional[float] = 0.0
    impuesto_sellos: Optional[float] = 0.0


class PrestamoUpdate(BaseModel):
    nombre: Optional[str] = None
    prestamista: Optional[str] = None
    monto_total: Optional[float] = None
    moneda: Optional[TipoMoneda] = None
    tasa_interes: Optional[float] = None
    impuesto_iva: Optional[float] = None
    impuesto_ganancias: Optional[float] = None
    gastos_administrativos: Optional[float] = None
    seguro: Optional[float] = None
    fecha_inicio: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    cuota_mensual: Optional[float] = None
    monto_pagado: Optional[float] = None
    activo: Optional[bool] = None
    descripcion: Optional[str] = None


class Prestamo(PrestamoBase):
    id: int
    monto_pagado: float
    activo: bool
    created_at: date
    model_config = ConfigDict(from_attributes=True)


class DesgloseCuotaPrestamo(BaseModel):
    prestamo_id: int
    fecha_vencimiento: date
    numero_cuota: int
    monto_total: float
    capital: float
    intereses: float
    iva_intereses: float
    impuesto_ganancias: float
    gastos_administrativos: float
    seguro: float
    otros_impuestos: float
    moneda: TipoMoneda
    descripcion: Optional[str] = None


class PagoPrestamoCreate(BaseModel):
    prestamo_id: int
    fecha_pago: date
    monto: float
    descripcion: Optional[str] = None


# ========== INVERSIONES ==========
class InversionBase(BaseModel):
    nombre: str
    tipo: Optional[str] = None
    monto_inicial: float
    moneda: TipoMoneda
    fecha_inicio: date
    fecha_vencimiento: Optional[date] = None
    tasa_rendimiento: Optional[float] = 0.0
    descripcion: Optional[str] = None


class InversionCreate(InversionBase):
    pass


class InversionUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    monto_inicial: Optional[float] = None
    monto_actual: Optional[float] = None
    moneda: Optional[TipoMoneda] = None
    fecha_inicio: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    tasa_rendimiento: Optional[float] = None
    activa: Optional[bool] = None
    descripcion: Optional[str] = None


class Inversion(InversionBase):
    id: int
    monto_actual: Optional[float]
    activa: bool
    created_at: date
    model_config = ConfigDict(from_attributes=True)


# ========== PROYECCIONES ==========
class ProyeccionPagoBase(BaseModel):
    tipo: str
    entidad_id: Optional[int] = None
    fecha_vencimiento: date
    monto_estimado: float
    moneda: TipoMoneda
    descripcion: Optional[str] = None


class ProyeccionPagoCreate(ProyeccionPagoBase):
    pass


class ProyeccionPago(ProyeccionPagoBase):
    id: int
    pagado: bool
    created_at: date
    model_config = ConfigDict(from_attributes=True)





