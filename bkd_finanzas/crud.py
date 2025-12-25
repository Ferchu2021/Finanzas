from sqlalchemy.orm import Session
from sqlalchemy import and_, extract
from typing import List, Optional
from datetime import date
import models
import schemas


# ========== INGRESOS ==========
def create_ingreso(db: Session, ingreso: schemas.IngresoCreate):
    db_ingreso = models.Ingreso(**ingreso.model_dump())
    db.add(db_ingreso)
    db.commit()
    db.refresh(db_ingreso)
    return db_ingreso


def get_ingresos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Ingreso).offset(skip).limit(limit).all()


def get_ingreso(db: Session, ingreso_id: int):
    return db.query(models.Ingreso).filter(models.Ingreso.id == ingreso_id).first()


def update_ingreso(db: Session, ingreso_id: int, ingreso: schemas.IngresoUpdate):
    db_ingreso = get_ingreso(db, ingreso_id)
    if db_ingreso:
        update_data = ingreso.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_ingreso, key, value)
        db.commit()
        db.refresh(db_ingreso)
    return db_ingreso


def delete_ingreso(db: Session, ingreso_id: int):
    db_ingreso = get_ingreso(db, ingreso_id)
    if db_ingreso:
        db.delete(db_ingreso)
        db.commit()
        return True
    return False


# ========== GASTOS ==========
def create_gasto(db: Session, gasto: schemas.GastoCreate):
    db_gasto = models.Gasto(**gasto.model_dump())
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto


def get_gastos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Gasto).offset(skip).limit(limit).all()


def get_gasto(db: Session, gasto_id: int):
    return db.query(models.Gasto).filter(models.Gasto.id == gasto_id).first()


def update_gasto(db: Session, gasto_id: int, gasto: schemas.GastoUpdate):
    db_gasto = get_gasto(db, gasto_id)
    if db_gasto:
        update_data = gasto.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_gasto, key, value)
        db.commit()
        db.refresh(db_gasto)
    return db_gasto


def delete_gasto(db: Session, gasto_id: int):
    db_gasto = get_gasto(db, gasto_id)
    if db_gasto:
        db.delete(db_gasto)
        db.commit()
        return True
    return False


# ========== TARJETAS DE CRÉDITO ==========
def create_tarjeta(db: Session, tarjeta: schemas.TarjetaCreditoCreate):
    db_tarjeta = models.TarjetaCredito(**tarjeta.model_dump())
    db.add(db_tarjeta)
    db.commit()
    db.refresh(db_tarjeta)
    return db_tarjeta


def get_tarjetas(db: Session):
    return db.query(models.TarjetaCredito).all()


def get_tarjeta(db: Session, tarjeta_id: int):
    return db.query(models.TarjetaCredito).filter(models.TarjetaCredito.id == tarjeta_id).first()


def update_tarjeta(db: Session, tarjeta_id: int, tarjeta: schemas.TarjetaCreditoUpdate):
    db_tarjeta = get_tarjeta(db, tarjeta_id)
    if db_tarjeta:
        update_data = tarjeta.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_tarjeta, key, value)
        db.commit()
        db.refresh(db_tarjeta)
    return db_tarjeta


def delete_tarjeta(db: Session, tarjeta_id: int):
    db_tarjeta = get_tarjeta(db, tarjeta_id)
    if db_tarjeta:
        db.delete(db_tarjeta)
        db.commit()
        return True
    return False


# ========== PAGOS DE TARJETAS ==========
def create_pago_tarjeta(db: Session, pago: schemas.PagoTarjetaCreate):
    """Crea un pago de tarjeta y actualiza el saldo de la tarjeta"""
    # Crear el registro de pago
    db_pago = models.PagoTarjeta(**pago.model_dump())
    db.add(db_pago)
    
    # Actualizar el saldo de la tarjeta
    tarjeta = get_tarjeta(db, pago.tarjeta_id)
    if tarjeta:
        # Reducir el saldo actual (no puede ser negativo)
        nuevo_saldo = max(0.0, tarjeta.saldo_actual - pago.monto)
        tarjeta.saldo_actual = nuevo_saldo
    
    db.commit()
    db.refresh(db_pago)
    return db_pago


# ========== PRÉSTAMOS ==========
def create_prestamo(db: Session, prestamo: schemas.PrestamoCreate):
    db_prestamo = models.Prestamo(**prestamo.model_dump())
    db.add(db_prestamo)
    db.commit()
    db.refresh(db_prestamo)
    return db_prestamo


def get_prestamos(db: Session):
    return db.query(models.Prestamo).all()


def get_prestamo(db: Session, prestamo_id: int):
    return db.query(models.Prestamo).filter(models.Prestamo.id == prestamo_id).first()


def update_prestamo(db: Session, prestamo_id: int, prestamo: schemas.PrestamoUpdate):
    db_prestamo = get_prestamo(db, prestamo_id)
    if db_prestamo:
        update_data = prestamo.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_prestamo, key, value)
        db.commit()
        db.refresh(db_prestamo)
    return db_prestamo


def delete_prestamo(db: Session, prestamo_id: int):
    db_prestamo = get_prestamo(db, prestamo_id)
    if db_prestamo:
        db.delete(db_prestamo)
        db.commit()
        return True
    return False


# ========== INVERSIONES ==========
def create_inversion(db: Session, inversion: schemas.InversionCreate):
    db_inversion = models.Inversion(**inversion.model_dump())
    db.add(db_inversion)
    db.commit()
    db.refresh(db_inversion)
    return db_inversion


def get_inversiones(db: Session):
    return db.query(models.Inversion).all()


def get_inversion(db: Session, inversion_id: int):
    return db.query(models.Inversion).filter(models.Inversion.id == inversion_id).first()


def update_inversion(db: Session, inversion_id: int, inversion: schemas.InversionUpdate):
    db_inversion = get_inversion(db, inversion_id)
    if db_inversion:
        update_data = inversion.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_inversion, key, value)
        db.commit()
        db.refresh(db_inversion)
    return db_inversion


def delete_inversion(db: Session, inversion_id: int):
    db_inversion = get_inversion(db, inversion_id)
    if db_inversion:
        db.delete(db_inversion)
        db.commit()
        return True
    return False


# ========== PROYECCIONES ==========
def create_proyeccion(db: Session, proyeccion: schemas.ProyeccionPagoCreate):
    db_proyeccion = models.ProyeccionPago(**proyeccion.model_dump())
    db.add(db_proyeccion)
    db.commit()
    db.refresh(db_proyeccion)
    return db_proyeccion


def get_proyecciones(db: Session):
    return db.query(models.ProyeccionPago).filter(models.ProyeccionPago.pagado == False).all()


def delete_proyeccion(db: Session, proyeccion_id: int):
    db_proyeccion = db.query(models.ProyeccionPago).filter(models.ProyeccionPago.id == proyeccion_id).first()
    if db_proyeccion:
        db.delete(db_proyeccion)
        db.commit()
        return True
    return False





