from sqlalchemy import Column, Integer, String, Float, Date, Boolean, Enum, Text
from sqlalchemy.orm import relationship
import enum
from datetime import date
from database import Base


class TipoIngreso(str, enum.Enum):
    SALARIO_ACN = "Salario ACN"
    VENTAS_TURISMO = "Ventas Turismo Volá Barato"
    AUDITORIAS = "Ingresos por Auditorías"
    CLASES_UNIVERSIDAD = "Clases en Universidad"
    VENTAS_JUST = "Ventas Productos Just"


class TipoGasto(str, enum.Enum):
    FIJO = "Fijo"
    ORDINARIO = "Ordinario"
    EXTRAORDINARIO = "Extraordinario"


class TipoMoneda(str, enum.Enum):
    PESOS = "ARS"
    DOLARES = "USD"


class Ingreso(Base):
    __tablename__ = "ingresos"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    monto = Column(Float, nullable=False)
    moneda = Column(Enum(TipoMoneda), nullable=False)
    tipo = Column(Enum(TipoIngreso), nullable=False)
    descripcion = Column(String(500))
    created_at = Column(Date, default=date.today)


class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    monto = Column(Float, nullable=False)
    moneda = Column(Enum(TipoMoneda), nullable=False)
    tipo = Column(Enum(TipoGasto), nullable=False)
    categoria = Column(String(100))
    descripcion = Column(String(500))
    created_at = Column(Date, default=date.today)


class TarjetaCredito(Base):
    __tablename__ = "tarjetas_credito"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    banco = Column(String(100))
    limite = Column(Float, nullable=False)
    moneda = Column(Enum(TipoMoneda), nullable=False)
    fecha_cierre = Column(Integer, nullable=False)  # Día del mes
    fecha_vencimiento = Column(Integer, nullable=False)  # Día del mes
    saldo_actual = Column(Float, default=0.0)
    # Campos nuevos - descomentar después de migrar la BD
    # tasa_interes_anual = Column(Float, default=90.0)  # Tasa de interés anual (%) - Típico en Argentina: 60-120%
    # tasa_interes_mensual = Column(Float, default=7.5)  # Tasa de interés mensual (%) - Típico: 5-10%
    # impuesto_iva = Column(Float, default=21.0)  # IVA (%) - Obligatorio en Argentina
    # impuesto_ganancias = Column(Float, default=0.0)  # Impuesto a las ganancias (%) - Puede aplicarse
    # gastos_administrativos = Column(Float, default=1000.0)  # Gastos administrativos mensuales (ARS) - Típico: $500-2000
    # impuesto_sellos = Column(Float, default=0.0)  # Impuesto a los sellos provincial (%) - Variable por provincia
    created_at = Column(Date, default=date.today)


class PagoTarjeta(Base):
    __tablename__ = "pagos_tarjeta"

    id = Column(Integer, primary_key=True, index=True)
    tarjeta_id = Column(Integer, nullable=False)
    fecha_pago = Column(Date, nullable=False)
    monto = Column(Float, nullable=False)
    descripcion = Column(String(500))
    created_at = Column(Date, default=date.today)


class DesgloseCuotaTarjeta(Base):
    __tablename__ = "desglose_cuota_tarjeta"

    id = Column(Integer, primary_key=True, index=True)
    tarjeta_id = Column(Integer, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    monto_total = Column(Float, nullable=False)
    capital = Column(Float, default=0.0)  # Monto del capital
    intereses = Column(Float, default=0.0)  # Intereses
    iva_intereses = Column(Float, default=0.0)  # IVA sobre intereses
    impuesto_ganancias = Column(Float, default=0.0)  # Impuesto a las ganancias
    gastos_administrativos = Column(Float, default=0.0)  # Gastos administrativos
    otros_impuestos = Column(Float, default=0.0)  # Otros impuestos
    moneda = Column(Enum(TipoMoneda), nullable=False)
    descripcion = Column(String(500))
    created_at = Column(Date, default=date.today)


class Prestamo(Base):
    __tablename__ = "prestamos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    prestamista = Column(String(100))
    monto_total = Column(Float, nullable=False)
    monto_pagado = Column(Float, default=0.0)
    moneda = Column(Enum(TipoMoneda), nullable=False)
    tasa_interes = Column(Float, default=0.0)  # Tasa de interés anual (%)
    # Campos nuevos - descomentar después de migrar la BD
    # impuesto_iva = Column(Float, default=21.0)  # IVA (%) - Obligatorio en Argentina
    # impuesto_ganancias = Column(Float, default=0.0)  # Impuesto a las ganancias (%) - Puede aplicarse
    # gastos_administrativos = Column(Float, default=500.0)  # Gastos administrativos mensuales (ARS) - Variable
    # seguro = Column(Float, default=0.0)  # Seguro mensual (ARS) - Si aplica
    # impuesto_sellos = Column(Float, default=0.0)  # Impuesto a los sellos provincial (%) - Variable por provincia
    fecha_inicio = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date)
    cuota_mensual = Column(Float)
    descripcion = Column(String(500))
    activo = Column(Boolean, default=True)
    created_at = Column(Date, default=date.today)


class PagoPrestamo(Base):
    __tablename__ = "pagos_prestamo"

    id = Column(Integer, primary_key=True, index=True)
    prestamo_id = Column(Integer, nullable=False)
    fecha_pago = Column(Date, nullable=False)
    monto = Column(Float, nullable=False)
    descripcion = Column(String(500))
    created_at = Column(Date, default=date.today)


class DesgloseCuotaPrestamo(Base):
    __tablename__ = "desglose_cuota_prestamo"

    id = Column(Integer, primary_key=True, index=True)
    prestamo_id = Column(Integer, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    numero_cuota = Column(Integer, nullable=False)
    monto_total = Column(Float, nullable=False)
    capital = Column(Float, default=0.0)  # Monto del capital
    intereses = Column(Float, default=0.0)  # Intereses
    iva_intereses = Column(Float, default=0.0)  # IVA sobre intereses
    impuesto_ganancias = Column(Float, default=0.0)  # Impuesto a las ganancias
    gastos_administrativos = Column(Float, default=0.0)  # Gastos administrativos
    seguro = Column(Float, default=0.0)  # Seguro
    otros_impuestos = Column(Float, default=0.0)  # Otros impuestos
    moneda = Column(Enum(TipoMoneda), nullable=False)
    descripcion = Column(String(500))
    created_at = Column(Date, default=date.today)


class Inversion(Base):
    __tablename__ = "inversiones"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(100))  # Plazo fijo, acciones, bonos, etc.
    monto_inicial = Column(Float, nullable=False)
    monto_actual = Column(Float)
    moneda = Column(Enum(TipoMoneda), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date)
    tasa_rendimiento = Column(Float, default=0.0)
    descripcion = Column(String(500))
    activa = Column(Boolean, default=True)
    created_at = Column(Date, default=date.today)


class ProyeccionPago(Base):
    __tablename__ = "proyecciones_pago"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(50), nullable=False)  # "tarjeta", "prestamo", "gasto_fijo", etc.
    entidad_id = Column(Integer)  # ID de la tarjeta, préstamo, etc.
    fecha_vencimiento = Column(Date, nullable=False)
    monto_estimado = Column(Float, nullable=False)
    moneda = Column(Enum(TipoMoneda), nullable=False)
    descripcion = Column(String(500))
    pagado = Column(Boolean, default=False)
    created_at = Column(Date, default=date.today)

