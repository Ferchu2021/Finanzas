from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Dict
from datetime import date

import database
import models
import schemas
import crud
import reports
import alerts
import pdf_processor

# Crear las tablas
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="API Finanzas Personales")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],  # Vite y otros puertos comunes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ========== INGRESOS ==========
@app.get("/api/ingresos", response_model=List[schemas.Ingreso])
def read_ingresos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    ingresos = crud.get_ingresos(db, skip=skip, limit=limit)
    return ingresos


@app.get("/api/ingresos/{ingreso_id}", response_model=schemas.Ingreso)
def read_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    db_ingreso = crud.get_ingreso(db, ingreso_id=ingreso_id)
    if db_ingreso is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return db_ingreso


@app.post("/api/ingresos", response_model=schemas.Ingreso)
def create_ingreso(ingreso: schemas.IngresoCreate, db: Session = Depends(get_db)):
    return crud.create_ingreso(db=db, ingreso=ingreso)


@app.put("/api/ingresos/{ingreso_id}", response_model=schemas.Ingreso)
def update_ingreso(ingreso_id: int, ingreso: schemas.IngresoUpdate, db: Session = Depends(get_db)):
    db_ingreso = crud.update_ingreso(db, ingreso_id=ingreso_id, ingreso=ingreso)
    if db_ingreso is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return db_ingreso


@app.delete("/api/ingresos/{ingreso_id}")
def delete_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    success = crud.delete_ingreso(db, ingreso_id=ingreso_id)
    if not success:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return {"message": "Ingreso eliminado exitosamente"}


# ========== GASTOS ==========
@app.get("/api/gastos", response_model=List[schemas.Gasto])
def read_gastos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    gastos = crud.get_gastos(db, skip=skip, limit=limit)
    return gastos


@app.get("/api/gastos/{gasto_id}", response_model=schemas.Gasto)
def read_gasto(gasto_id: int, db: Session = Depends(get_db)):
    db_gasto = crud.get_gasto(db, gasto_id=gasto_id)
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return db_gasto


@app.post("/api/gastos", response_model=schemas.Gasto)
def create_gasto(gasto: schemas.GastoCreate, db: Session = Depends(get_db)):
    return crud.create_gasto(db=db, gasto=gasto)


@app.put("/api/gastos/{gasto_id}", response_model=schemas.Gasto)
def update_gasto(gasto_id: int, gasto: schemas.GastoUpdate, db: Session = Depends(get_db)):
    db_gasto = crud.update_gasto(db, gasto_id=gasto_id, gasto=gasto)
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return db_gasto


@app.delete("/api/gastos/{gasto_id}")
def delete_gasto(gasto_id: int, db: Session = Depends(get_db)):
    success = crud.delete_gasto(db, gasto_id=gasto_id)
    if not success:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return {"message": "Gasto eliminado exitosamente"}


# ========== TARJETAS DE CRÉDITO ==========
@app.get("/api/tarjetas")
def read_tarjetas(db: Session = Depends(get_db)):
    try:
        tarjetas = crud.get_tarjetas(db)
        # Serializar manualmente para evitar problemas con campos que no existen en la BD
        resultado = []
        for tarjeta in tarjetas:
            # Verificar si tiene pagos parciales
            pagos = db.query(models.PagoTarjeta).filter(
                models.PagoTarjeta.tarjeta_id == tarjeta.id
            ).order_by(models.PagoTarjeta.fecha_pago.desc()).all()
            
            tiene_pagos_parciales = False
            cantidad_pagos_parciales = 0
            if pagos and tarjeta.saldo_actual > 0:
                # Si hay saldo pendiente y hay pagos, es probable que haya pagos parciales
                total_pagado = sum(pago.monto for pago in pagos)
                saldo_original = tarjeta.saldo_actual + total_pagado
                
                # Contar pagos parciales
                saldo_antes = saldo_original
                for pago in pagos:
                    if pago.monto < saldo_antes:
                        tiene_pagos_parciales = True
                        cantidad_pagos_parciales += 1
                    saldo_antes -= pago.monto
            resultado.append({
                "id": tarjeta.id,
                "nombre": tarjeta.nombre,
                "banco": tarjeta.banco,
                "limite": tarjeta.limite,
                "moneda": tarjeta.moneda.value if hasattr(tarjeta.moneda, 'value') else str(tarjeta.moneda),
                "fecha_cierre": tarjeta.fecha_cierre,
                "fecha_vencimiento": tarjeta.fecha_vencimiento,
                "saldo_actual": tarjeta.saldo_actual,
                "created_at": tarjeta.created_at.isoformat() if hasattr(tarjeta.created_at, 'isoformat') else str(tarjeta.created_at),
                "tiene_pagos_parciales": tiene_pagos_parciales,
                "cantidad_pagos_parciales": cantidad_pagos_parciales
            })
        return resultado
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener tarjetas: {str(e)}")


@app.get("/api/tarjetas/{tarjeta_id}", response_model=schemas.TarjetaCredito)
def read_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    db_tarjeta = crud.get_tarjeta(db, tarjeta_id=tarjeta_id)
    if db_tarjeta is None:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return db_tarjeta


@app.get("/api/tarjetas/{tarjeta_id}/desglose-cuota")
def get_desglose_cuota_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    """Calcula el desglose de la próxima cuota de una tarjeta"""
    from datetime import date as date_type, timedelta
    from calendar import monthrange
    
    tarjeta = crud.get_tarjeta(db, tarjeta_id=tarjeta_id)
    if tarjeta is None:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    
    if tarjeta.saldo_actual <= 0:
        return {
            "mensaje": "La tarjeta está pagada, no hay cuota a calcular",
            "desglose": None
        }
    
    # Calcular próxima fecha de vencimiento
    hoy = date_type.today()
    mes_actual = hoy.replace(day=1)
    
    ultimo_dia_mes = monthrange(hoy.year, hoy.month)[1]
    dia_cierre = min(tarjeta.fecha_cierre, ultimo_dia_mes)
    fecha_cierre_actual = hoy.replace(day=dia_cierre)
    
    if hoy.day > tarjeta.fecha_cierre:
        if hoy.month == 12:
            fecha_cierre_proxima = date_type(hoy.year + 1, 1, min(tarjeta.fecha_cierre, 31))
        else:
            ultimo_dia_sig = monthrange(hoy.year, hoy.month + 1)[1]
            fecha_cierre_proxima = date_type(hoy.year, hoy.month + 1, min(tarjeta.fecha_cierre, ultimo_dia_sig))
    else:
        fecha_cierre_proxima = fecha_cierre_actual
    
    dias_hasta_vencimiento = tarjeta.fecha_vencimiento - tarjeta.fecha_cierre
    if dias_hasta_vencimiento < 0:
        if fecha_cierre_proxima.month == 12:
            siguiente_mes = fecha_cierre_proxima.replace(year=fecha_cierre_proxima.year + 1, month=1, day=1)
        else:
            siguiente_mes = fecha_cierre_proxima.replace(month=fecha_cierre_proxima.month + 1, day=1)
        ultimo_dia_sig = monthrange(siguiente_mes.year, siguiente_mes.month)[1]
        dia_vencimiento = min(tarjeta.fecha_vencimiento, ultimo_dia_sig)
        fecha_vencimiento_proxima = siguiente_mes.replace(day=dia_vencimiento)
    else:
        fecha_vencimiento_proxima = fecha_cierre_proxima + timedelta(days=dias_hasta_vencimiento)
        if fecha_vencimiento_proxima.month != fecha_cierre_proxima.month:
            ultimo_dia_sig = monthrange(fecha_vencimiento_proxima.year, fecha_vencimiento_proxima.month)[1]
            dia_vencimiento = min(tarjeta.fecha_vencimiento, ultimo_dia_sig)
            fecha_vencimiento_proxima = fecha_vencimiento_proxima.replace(day=dia_vencimiento)
    
    # Calcular desglose
    monto_total = tarjeta.saldo_actual
    
    # Calcular intereses (usar tasa mensual si está configurada, sino calcular desde anual)
    try:
        tasa_mensual = getattr(tarjeta, 'tasa_interes_mensual', 0.0) or 0.0
        if tasa_mensual == 0:
            tasa_anual = getattr(tarjeta, 'tasa_interes_anual', 0.0) or 0.0
            if tasa_anual > 0:
                tasa_mensual = tasa_anual / 12.0
    except:
        tasa_mensual = 0.0
    
    intereses = monto_total * (tasa_mensual / 100.0) if tasa_mensual > 0 else 0.0
    
    # Calcular impuestos sobre intereses
    try:
        impuesto_iva_pct = getattr(tarjeta, 'impuesto_iva', 21.0) or 21.0
    except:
        impuesto_iva_pct = 21.0
    
    iva_intereses = intereses * (impuesto_iva_pct / 100.0) if intereses > 0 else 0.0
    
    try:
        impuesto_ganancias_pct = getattr(tarjeta, 'impuesto_ganancias', 0.0) or 0.0
    except:
        impuesto_ganancias_pct = 0.0
    
    impuesto_ganancias = intereses * (impuesto_ganancias_pct / 100.0) if intereses > 0 and impuesto_ganancias_pct > 0 else 0.0
    
    # Gastos administrativos (siempre se cobran, incluso si no hay intereses)
    try:
        gastos_admin = getattr(tarjeta, 'gastos_administrativos', 1000.0) or 1000.0
    except:
        gastos_admin = 1000.0
    
    # IVA sobre gastos administrativos (los bancos cobran IVA sobre los gastos administrativos)
    iva_gastos_admin = gastos_admin * (impuesto_iva_pct / 100.0) if gastos_admin > 0 else 0.0
    
    # Impuesto a los sellos (si aplica)
    try:
        impuesto_sellos_pct = getattr(tarjeta, 'impuesto_sellos', 0.0) or 0.0
    except:
        impuesto_sellos_pct = 0.0
    
    impuesto_sellos = monto_total * (impuesto_sellos_pct / 100.0) if impuesto_sellos_pct > 0 else 0.0
    
    # Otros impuestos y cargos bancarios típicos
    cargo_mantenimiento = 0.0  # Se puede configurar por tarjeta
    
    # Capital (monto total menos todos los cargos)
    total_cargos = intereses + iva_intereses + impuesto_ganancias + gastos_admin + iva_gastos_admin + impuesto_sellos + cargo_mantenimiento
    capital = monto_total - total_cargos
    if capital < 0:
        capital = 0
    
    otros_impuestos = impuesto_sellos + cargo_mantenimiento
    
    # Obtener gastos del período de cierre actual
    # Calcular período de cierre (desde el cierre anterior hasta el próximo cierre)
    if fecha_cierre_proxima.month == 1:
        fecha_cierre_anterior = date_type(fecha_cierre_proxima.year - 1, 12, min(tarjeta.fecha_cierre, 31))
    else:
        ultimo_dia_anterior = monthrange(fecha_cierre_proxima.year, fecha_cierre_proxima.month - 1)[1]
        fecha_cierre_anterior = date_type(fecha_cierre_proxima.year, fecha_cierre_proxima.month - 1, min(tarjeta.fecha_cierre, ultimo_dia_anterior))
    
    fecha_inicio_periodo = fecha_cierre_anterior + timedelta(days=1)
    fecha_fin_periodo = fecha_cierre_proxima
    
    # Obtener gastos del período
    gastos_periodo = db.query(models.Gasto).filter(
        and_(
            models.Gasto.fecha >= fecha_inicio_periodo,
            models.Gasto.fecha <= fecha_fin_periodo,
            models.Gasto.moneda == tarjeta.moneda
        )
    ).order_by(models.Gasto.fecha.desc()).all()
    
    total_gastos_periodo = sum(gasto.monto for gasto in gastos_periodo)
    
    # Preparar lista de gastos con información detallada
    gastos_detalle = []
    for gasto in gastos_periodo:
        gastos_detalle.append({
            "id": gasto.id,
            "fecha": gasto.fecha.isoformat(),
            "monto": gasto.monto,
            "descripcion": gasto.descripcion or "Sin descripción",
            "categoria": gasto.categoria or "Sin categoría",
            "tipo": gasto.tipo.value if hasattr(gasto.tipo, 'value') else str(gasto.tipo)
        })
    
    return {
        "tarjeta_id": tarjeta.id,
        "tarjeta_nombre": tarjeta.nombre,
        "fecha_vencimiento": fecha_vencimiento_proxima.isoformat(),
        "fecha_cierre": fecha_cierre_proxima.isoformat(),
        "moneda": tarjeta.moneda.value,
        "periodo_cierre": {
            "fecha_inicio": fecha_inicio_periodo.isoformat(),
            "fecha_fin": fecha_fin_periodo.isoformat()
        },
        "desglose": {
            "monto_total": monto_total,
            "capital": capital,
            "intereses": intereses,
            "iva_intereses": iva_intereses,
            "impuesto_ganancias": impuesto_ganancias,
            "gastos_administrativos": gastos_admin,
            "otros_impuestos": otros_impuestos,
            "iva_gastos_admin": iva_gastos_admin,
            "total_impuestos": iva_intereses + impuesto_ganancias + iva_gastos_admin + otros_impuestos,
            "total_cargos": intereses + iva_intereses + impuesto_ganancias + gastos_admin + iva_gastos_admin + otros_impuestos
        },
        "gastos_periodo": {
            "gastos": gastos_detalle,
            "total": total_gastos_periodo,
            "cantidad": len(gastos_periodo)
        },
        "porcentajes": {
            "tasa_interes_mensual": tasa_mensual,
            "tasa_interes_anual": getattr(tarjeta, 'tasa_interes_anual', 0.0) or 0.0,
            "impuesto_iva": impuesto_iva_pct,
            "impuesto_ganancias": impuesto_ganancias_pct
        }
    }


@app.post("/api/tarjetas/{tarjeta_id}/pagos", response_model=schemas.PagoTarjeta)
def create_pago_tarjeta(tarjeta_id: int, pago: schemas.PagoTarjetaCreate, db: Session = Depends(get_db)):
    """Registra un pago de tarjeta y actualiza el saldo"""
    # Verificar que la tarjeta existe
    tarjeta = crud.get_tarjeta(db, tarjeta_id=tarjeta_id)
    if tarjeta is None:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    
    # Asegurar que el tarjeta_id del pago coincida
    pago.tarjeta_id = tarjeta_id
    
    # Crear el pago (esto actualiza automáticamente el saldo)
    db_pago = crud.create_pago_tarjeta(db, pago=pago)
    
    return db_pago


@app.get("/api/tarjetas/{tarjeta_id}/detalles")
def get_detalles_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    """Obtiene detalles completos de una tarjeta incluyendo pagos y estado"""
    from datetime import date as date_type, timedelta
    from calendar import monthrange
    
    tarjeta = crud.get_tarjeta(db, tarjeta_id=tarjeta_id)
    if tarjeta is None:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    
    # Obtener TODOS los pagos realizados (sin límite para ver historial completo)
    pagos = db.query(models.PagoTarjeta).filter(
        models.PagoTarjeta.tarjeta_id == tarjeta_id
    ).order_by(models.PagoTarjeta.fecha_pago.desc()).all()
    
    # Calcular próxima fecha de cierre y vencimiento
    hoy = date_type.today()
    mes_actual = hoy.replace(day=1)
    
    # Calcular fecha de cierre del mes actual
    ultimo_dia_mes = monthrange(hoy.year, hoy.month)[1]
    dia_cierre = min(tarjeta.fecha_cierre, ultimo_dia_mes)
    fecha_cierre_actual = hoy.replace(day=dia_cierre)
    
    # Si ya pasó el cierre de este mes, calcular el próximo
    if hoy.day > tarjeta.fecha_cierre:
        if hoy.month == 12:
            fecha_cierre_proxima = date_type(hoy.year + 1, 1, min(tarjeta.fecha_cierre, 31))
        else:
            ultimo_dia_sig = monthrange(hoy.year, hoy.month + 1)[1]
            fecha_cierre_proxima = date_type(hoy.year, hoy.month + 1, min(tarjeta.fecha_cierre, ultimo_dia_sig))
    else:
        fecha_cierre_proxima = fecha_cierre_actual
    
    # Calcular fecha de vencimiento
    dias_hasta_vencimiento = tarjeta.fecha_vencimiento - tarjeta.fecha_cierre
    if dias_hasta_vencimiento < 0:
        # Vencimiento es el mes siguiente
        if fecha_cierre_proxima.month == 12:
            siguiente_mes = fecha_cierre_proxima.replace(year=fecha_cierre_proxima.year + 1, month=1, day=1)
        else:
            siguiente_mes = fecha_cierre_proxima.replace(month=fecha_cierre_proxima.month + 1, day=1)
        ultimo_dia_sig = monthrange(siguiente_mes.year, siguiente_mes.month)[1]
        dia_vencimiento = min(tarjeta.fecha_vencimiento, ultimo_dia_sig)
        fecha_vencimiento_proxima = siguiente_mes.replace(day=dia_vencimiento)
    else:
        fecha_vencimiento_proxima = fecha_cierre_proxima + timedelta(days=dias_hasta_vencimiento)
        if fecha_vencimiento_proxima.month != fecha_cierre_proxima.month:
            ultimo_dia_sig = monthrange(fecha_vencimiento_proxima.year, fecha_vencimiento_proxima.month)[1]
            dia_vencimiento = min(tarjeta.fecha_vencimiento, ultimo_dia_sig)
            fecha_vencimiento_proxima = fecha_vencimiento_proxima.replace(day=dia_vencimiento)
    
    # Determinar estado
    esta_pagada = tarjeta.saldo_actual <= 0
    disponible = tarjeta.limite - tarjeta.saldo_actual
    porcentaje_uso = (tarjeta.saldo_actual / tarjeta.limite * 100) if tarjeta.limite > 0 else 0
    
    # Calcular monto total a pagar (saldo actual) para comparar con pagos
    monto_total_pendiente = tarjeta.saldo_actual
    
    # Calcular total pagado (suma de todos los pagos)
    total_pagado = sum(pago.monto for pago in pagos) if pagos else 0.0
    
    # Para cada pago, determinar si fue parcial comparando con el saldo que había antes del pago
    # Necesitamos reconstruir el saldo histórico
    pagos_con_info = []
    saldo_antes_pago = tarjeta.saldo_actual + total_pagado  # Saldo original antes de cualquier pago
    
    for pago in pagos:
        # El saldo antes de este pago es el saldo actual + todos los pagos hasta este punto
        # Como los pagos están ordenados descendente, necesitamos calcular hacia atrás
        saldo_antes = saldo_antes_pago
        saldo_antes_pago -= pago.monto  # Restar este pago para obtener el saldo antes
        
        # Determinar si fue pago parcial (si el monto pagado es menor al saldo que había)
        es_parcial = pago.monto < saldo_antes
        porcentaje_pagado = (pago.monto / saldo_antes * 100) if saldo_antes > 0 else 0
        
        pagos_con_info.append({
            "id": pago.id,
            "fecha_pago": pago.fecha_pago.isoformat(),
            "monto": pago.monto,
            "descripcion": pago.descripcion,
            "es_parcial": es_parcial,
            "saldo_antes_pago": saldo_antes,
            "saldo_despues_pago": saldo_antes - pago.monto,
            "porcentaje_del_saldo": porcentaje_pagado
        })
    
    return {
        "tarjeta": {
            "id": tarjeta.id,
            "nombre": tarjeta.nombre,
            "banco": tarjeta.banco,
            "limite": tarjeta.limite,
            "saldo_actual": tarjeta.saldo_actual,
            "disponible": disponible,
            "moneda": tarjeta.moneda.value,
            "fecha_cierre": tarjeta.fecha_cierre,
            "fecha_vencimiento": tarjeta.fecha_vencimiento,
            "porcentaje_uso": porcentaje_uso,
            "esta_pagada": esta_pagada
        },
        "proximas_fechas": {
            "fecha_cierre": fecha_cierre_proxima.isoformat(),
            "fecha_vencimiento": fecha_vencimiento_proxima.isoformat(),
            "dias_hasta_vencimiento": (fecha_vencimiento_proxima - hoy).days
        },
        "pagos": pagos_con_info,
        "total_pagado": total_pagado,
        "monto_total_pendiente": monto_total_pendiente
    }


@app.post("/api/tarjetas", response_model=schemas.TarjetaCredito)
def create_tarjeta(tarjeta: schemas.TarjetaCreditoCreate, db: Session = Depends(get_db)):
    return crud.create_tarjeta(db=db, tarjeta=tarjeta)


@app.put("/api/tarjetas/{tarjeta_id}", response_model=schemas.TarjetaCredito)
def update_tarjeta(tarjeta_id: int, tarjeta: schemas.TarjetaCreditoUpdate, db: Session = Depends(get_db)):
    db_tarjeta = crud.update_tarjeta(db, tarjeta_id=tarjeta_id, tarjeta=tarjeta)
    if db_tarjeta is None:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return db_tarjeta


@app.delete("/api/tarjetas/{tarjeta_id}")
def delete_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    success = crud.delete_tarjeta(db, tarjeta_id=tarjeta_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return {"message": "Tarjeta eliminada exitosamente"}


# ========== PRÉSTAMOS ==========
@app.get("/api/prestamos", response_model=List[schemas.Prestamo])
def read_prestamos(db: Session = Depends(get_db)):
    prestamos = crud.get_prestamos(db)
    return prestamos


@app.get("/api/prestamos/{prestamo_id}", response_model=schemas.Prestamo)
def read_prestamo(prestamo_id: int, db: Session = Depends(get_db)):
    db_prestamo = crud.get_prestamo(db, prestamo_id=prestamo_id)
    if db_prestamo is None:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return db_prestamo


@app.get("/api/prestamos/{prestamo_id}/desglose-cuota")
def get_desglose_cuota_prestamo(prestamo_id: int, db: Session = Depends(get_db)):
    """Calcula el desglose de la próxima cuota de un préstamo"""
    from datetime import date as date_type, timedelta
    
    prestamo = crud.get_prestamo(db, prestamo_id=prestamo_id)
    if prestamo is None:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    
    if not prestamo.activo or prestamo.monto_pagado >= prestamo.monto_total:
        return {
            "mensaje": "El préstamo está pagado o inactivo",
            "desglose": None
        }
    
    # Calcular próxima fecha de vencimiento (asumiendo cuota mensual)
    hoy = date_type.today()
    if prestamo.fecha_vencimiento and prestamo.fecha_vencimiento > hoy:
        fecha_vencimiento_proxima = prestamo.fecha_vencimiento
    else:
        # Calcular basándose en la fecha de inicio
        meses_transcurridos = (hoy.year - prestamo.fecha_inicio.year) * 12 + (hoy.month - prestamo.fecha_inicio.month)
        fecha_vencimiento_proxima = prestamo.fecha_inicio
        for _ in range(meses_transcurridos + 1):
            if fecha_vencimiento_proxima.month == 12:
                fecha_vencimiento_proxima = fecha_vencimiento_proxima.replace(year=fecha_vencimiento_proxima.year + 1, month=1)
            else:
                fecha_vencimiento_proxima = fecha_vencimiento_proxima.replace(month=fecha_vencimiento_proxima.month + 1)
    
    # Monto pendiente
    monto_pendiente = prestamo.monto_total - prestamo.monto_pagado
    
    # Usar cuota mensual si está definida, sino calcular
    if prestamo.cuota_mensual and prestamo.cuota_mensual > 0:
        monto_total = prestamo.cuota_mensual
    else:
        # Calcular cuota aproximada (simplificado)
        monto_total = monto_pendiente * 0.1  # 10% aproximado, se puede mejorar
    
    # Calcular intereses
    try:
        tasa_anual = getattr(prestamo, 'tasa_interes', 0.0) or 0.0
        tasa_mensual = tasa_anual / 12.0 if tasa_anual > 0 else 0.0
    except:
        tasa_mensual = 0.0
    
    intereses = monto_pendiente * (tasa_mensual / 100.0) if tasa_mensual > 0 else 0.0
    
    # Calcular impuestos sobre intereses
    try:
        impuesto_iva_pct = getattr(prestamo, 'impuesto_iva', 21.0) or 21.0
    except:
        impuesto_iva_pct = 21.0
    
    iva_intereses = intereses * (impuesto_iva_pct / 100.0) if intereses > 0 else 0.0
    
    try:
        impuesto_ganancias_pct = getattr(prestamo, 'impuesto_ganancias', 0.0) or 0.0
    except:
        impuesto_ganancias_pct = 0.0
    
    impuesto_ganancias = intereses * (impuesto_ganancias_pct / 100.0) if intereses > 0 and impuesto_ganancias_pct > 0 else 0.0
    
    # Gastos administrativos y seguro
    try:
        gastos_admin = getattr(prestamo, 'gastos_administrativos', 500.0) or 500.0
    except:
        gastos_admin = 500.0
    
    try:
        seguro = getattr(prestamo, 'seguro', 0.0) or 0.0
    except:
        seguro = 0.0
    
    # IVA sobre gastos administrativos y seguro
    iva_gastos_admin = gastos_admin * (impuesto_iva_pct / 100.0) if gastos_admin > 0 else 0.0
    iva_seguro = seguro * (impuesto_iva_pct / 100.0) if seguro > 0 else 0.0
    
    # Impuesto a los sellos (si aplica)
    try:
        impuesto_sellos_pct = getattr(prestamo, 'impuesto_sellos', 0.0) or 0.0
    except:
        impuesto_sellos_pct = 0.0
    
    impuesto_sellos = monto_total * (impuesto_sellos_pct / 100.0) if impuesto_sellos_pct > 0 else 0.0
    
    # Capital (monto total menos todos los cargos)
    total_cargos = intereses + iva_intereses + impuesto_ganancias + gastos_admin + iva_gastos_admin + seguro + iva_seguro + impuesto_sellos
    capital = monto_total - total_cargos
    if capital < 0:
        capital = 0
    
    otros_impuestos = impuesto_sellos
    
    # Calcular número de cuota
    if prestamo.fecha_vencimiento:
        meses_totales = (prestamo.fecha_vencimiento.year - prestamo.fecha_inicio.year) * 12 + (prestamo.fecha_vencimiento.month - prestamo.fecha_inicio.month)
        meses_pagados = (hoy.year - prestamo.fecha_inicio.year) * 12 + (hoy.month - prestamo.fecha_inicio.month)
        numero_cuota = meses_pagados + 1
    else:
        numero_cuota = 1
    
    return {
        "prestamo_id": prestamo.id,
        "prestamo_nombre": prestamo.nombre,
        "fecha_vencimiento": fecha_vencimiento_proxima.isoformat(),
        "numero_cuota": numero_cuota,
        "moneda": prestamo.moneda.value,
        "monto_pendiente": monto_pendiente,
        "desglose": {
            "monto_total": monto_total,
            "capital": capital,
            "intereses": intereses,
            "iva_intereses": iva_intereses,
            "impuesto_ganancias": impuesto_ganancias,
            "gastos_administrativos": gastos_admin,
            "seguro": seguro,
            "otros_impuestos": otros_impuestos,
            "iva_gastos_admin": iva_gastos_admin,
            "iva_seguro": iva_seguro,
            "total_impuestos": iva_intereses + impuesto_ganancias + iva_gastos_admin + iva_seguro + otros_impuestos,
            "total_cargos": intereses + iva_intereses + impuesto_ganancias + gastos_admin + iva_gastos_admin + seguro + iva_seguro + otros_impuestos
        },
        "porcentajes": {
            "tasa_interes_anual": tasa_anual,
            "tasa_interes_mensual": tasa_mensual,
            "impuesto_iva": impuesto_iva_pct,
            "impuesto_ganancias": impuesto_ganancias_pct
        }
    }


@app.post("/api/prestamos", response_model=schemas.Prestamo)
def create_prestamo(prestamo: schemas.PrestamoCreate, db: Session = Depends(get_db)):
    return crud.create_prestamo(db=db, prestamo=prestamo)


@app.put("/api/prestamos/{prestamo_id}", response_model=schemas.Prestamo)
def update_prestamo(prestamo_id: int, prestamo: schemas.PrestamoUpdate, db: Session = Depends(get_db)):
    db_prestamo = crud.update_prestamo(db, prestamo_id=prestamo_id, prestamo=prestamo)
    if db_prestamo is None:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return db_prestamo


@app.delete("/api/prestamos/{prestamo_id}")
def delete_prestamo(prestamo_id: int, db: Session = Depends(get_db)):
    success = crud.delete_prestamo(db, prestamo_id=prestamo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return {"message": "Préstamo eliminado exitosamente"}


# ========== INVERSIONES ==========
@app.get("/api/inversiones", response_model=List[schemas.Inversion])
def read_inversiones(db: Session = Depends(get_db)):
    inversiones = crud.get_inversiones(db)
    return inversiones


@app.get("/api/inversiones/{inversion_id}", response_model=schemas.Inversion)
def read_inversion(inversion_id: int, db: Session = Depends(get_db)):
    db_inversion = crud.get_inversion(db, inversion_id=inversion_id)
    if db_inversion is None:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    return db_inversion


@app.post("/api/inversiones", response_model=schemas.Inversion)
def create_inversion(inversion: schemas.InversionCreate, db: Session = Depends(get_db)):
    return crud.create_inversion(db=db, inversion=inversion)


@app.put("/api/inversiones/{inversion_id}", response_model=schemas.Inversion)
def update_inversion(inversion_id: int, inversion: schemas.InversionUpdate, db: Session = Depends(get_db)):
    db_inversion = crud.update_inversion(db, inversion_id=inversion_id, inversion=inversion)
    if db_inversion is None:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    return db_inversion


@app.delete("/api/inversiones/{inversion_id}")
def delete_inversion(inversion_id: int, db: Session = Depends(get_db)):
    success = crud.delete_inversion(db, inversion_id=inversion_id)
    if not success:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    return {"message": "Inversión eliminada exitosamente"}


# ========== PROYECCIONES ==========
@app.get("/api/tarjetas/{tarjeta_id}/gastos-periodo")
def get_gastos_periodo_tarjeta(
    tarjeta_id: int,
    fecha_inicio: str = Query(..., description="Fecha de inicio del período (YYYY-MM-DD)"),
    fecha_fin: str = Query(..., description="Fecha de fin del período (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Obtiene los gastos de un período específico que corresponden a una tarjeta"""
    from datetime import date as date_type
    
    tarjeta = crud.get_tarjeta(db, tarjeta_id=tarjeta_id)
    if tarjeta is None:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    
    try:
        fecha_inicio_obj = date_type.fromisoformat(fecha_inicio)
        fecha_fin_obj = date_type.fromisoformat(fecha_fin)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")
    
    # Obtener gastos del período (filtrar por moneda de la tarjeta y fecha)
    gastos = db.query(models.Gasto).filter(
        and_(
            models.Gasto.fecha >= fecha_inicio_obj,
            models.Gasto.fecha <= fecha_fin_obj,
            models.Gasto.moneda == tarjeta.moneda
        )
    ).order_by(models.Gasto.fecha.desc()).all()
    
    total_gastos = sum(gasto.monto for gasto in gastos)
    
    return {
        "tarjeta_id": tarjeta_id,
        "tarjeta_nombre": tarjeta.nombre,
        "periodo": {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin
        },
        "gastos": [
            {
                "id": gasto.id,
                "fecha": gasto.fecha.isoformat(),
                "monto": gasto.monto,
                "moneda": gasto.moneda.value,
                "tipo": gasto.tipo.value,
                "categoria": gasto.categoria,
                "descripcion": gasto.descripcion
            }
            for gasto in gastos
        ],
        "total_gastos": total_gastos,
        "cantidad_gastos": len(gastos)
    }


@app.get("/api/proyecciones/tarjetas")
def get_proyecciones_tarjetas(meses: int = Query(6, description="Número de meses a proyectar"), db: Session = Depends(get_db)):
    """Genera proyecciones de pagos de tarjetas para los próximos meses con desglose de gastos"""
    from datetime import date as date_type, timedelta
    from calendar import monthrange
    
    tarjetas = crud.get_tarjetas(db)
    proyecciones = []
    hoy = date_type.today()
    
    for tarjeta in tarjetas:
        if tarjeta.saldo_actual <= 0:
            continue  # No hay saldo para proyectar
        
        # Calcular fechas de cierre y vencimiento para los próximos meses
        for mes_offset in range(meses):
            # Calcular fecha de cierre del mes
            if hoy.day <= tarjeta.fecha_cierre:
                # El cierre de este mes aún no pasó o es hoy
                mes_cierre = hoy.replace(day=1)
                mes_offset_ajustado = mes_offset
            else:
                # Ya pasó el cierre de este mes, empezar desde el próximo mes
                mes_cierre = (hoy.replace(day=1) + timedelta(days=32)).replace(day=1)
                mes_offset_ajustado = mes_offset
            
            # Añadir meses offset
            mes_calculo = mes_cierre
            for _ in range(mes_offset_ajustado):
                if mes_calculo.month == 12:
                    mes_calculo = mes_calculo.replace(year=mes_calculo.year + 1, month=1, day=1)
                else:
                    mes_calculo = mes_calculo.replace(month=mes_calculo.month + 1, day=1)
            
            # Calcular día de cierre (ajustar si el día no existe en el mes)
            ultimo_dia_mes = monthrange(mes_calculo.year, mes_calculo.month)[1]
            dia_cierre = min(tarjeta.fecha_cierre, ultimo_dia_mes)
            fecha_cierre = mes_calculo.replace(day=dia_cierre)
            
            # Fecha de vencimiento (días después del cierre, normalmente 5 días después)
            dias_hasta_vencimiento = tarjeta.fecha_vencimiento - tarjeta.fecha_cierre
            if dias_hasta_vencimiento < 0:
                # El vencimiento es el mes siguiente
                if fecha_cierre.month == 12:
                    siguiente_mes = fecha_cierre.replace(year=fecha_cierre.year + 1, month=1, day=1)
                else:
                    siguiente_mes = fecha_cierre.replace(month=fecha_cierre.month + 1, day=1)
                ultimo_dia_sig = monthrange(siguiente_mes.year, siguiente_mes.month)[1]
                dia_vencimiento = min(tarjeta.fecha_vencimiento, ultimo_dia_sig)
                fecha_vencimiento = siguiente_mes.replace(day=dia_vencimiento)
            else:
                fecha_vencimiento = fecha_cierre + timedelta(days=dias_hasta_vencimiento)
                # Ajustar si se pasa del mes
                if fecha_vencimiento.month != fecha_cierre.month:
                    ultimo_dia_sig = monthrange(fecha_vencimiento.year, fecha_vencimiento.month)[1]
                    dia_vencimiento = min(tarjeta.fecha_vencimiento, ultimo_dia_sig)
                    fecha_vencimiento = fecha_vencimiento.replace(day=dia_vencimiento)
            
            # Solo agregar si la fecha de vencimiento es futura
            if fecha_vencimiento >= hoy:
                # Calcular el período de cierre (desde el cierre anterior hasta este cierre)
                # Calcular fecha de cierre anterior
                try:
                    if fecha_cierre.month == 1:
                        fecha_cierre_anterior = date_type(fecha_cierre.year - 1, 12, min(tarjeta.fecha_cierre, 31))
                    else:
                        ultimo_dia_anterior = monthrange(fecha_cierre.year, fecha_cierre.month - 1)[1]
                        fecha_cierre_anterior = date_type(fecha_cierre.year, fecha_cierre.month - 1, min(tarjeta.fecha_cierre, ultimo_dia_anterior))
                    fecha_inicio_periodo = fecha_cierre_anterior + timedelta(days=1)
                    fecha_fin_periodo = fecha_cierre
                except Exception as e:
                    # Si hay error calculando el período, usar el mes actual
                    fecha_inicio_periodo = fecha_cierre.replace(day=1)
                    fecha_fin_periodo = fecha_cierre
                
                # Obtener gastos del período de cierre
                gastos_periodo = db.query(models.Gasto).filter(
                    and_(
                        models.Gasto.fecha >= fecha_inicio_periodo,
                        models.Gasto.fecha <= fecha_fin_periodo,
                        models.Gasto.moneda == tarjeta.moneda
                    )
                ).order_by(models.Gasto.fecha.desc()).all()
                
                total_gastos_periodo = sum(gasto.monto for gasto in gastos_periodo)
                
                # Calcular monto estimado (saldo actual o gastos del período, el que sea mayor)
                # Para proyecciones futuras, usar los gastos del período si están disponibles
                monto_estimado = tarjeta.saldo_actual if mes_offset_ajustado == 0 else max(tarjeta.saldo_actual, total_gastos_periodo)
                
                # Obtener desglose de la cuota
                desglose_info = {
                    'monto_total': monto_estimado,
                    'capital': 0,
                    'intereses': 0,
                    'iva_intereses': 0,
                    'impuesto_ganancias': 0,
                    'gastos_administrativos': 0,
                    'iva_gastos_admin': 0,
                    'otros_impuestos': 0,
                    'total_impuestos': 0,
                    'total_cargos': 0
                }
                
                # Calcular desglose si hay saldo
                if monto_estimado > 0:
                    try:
                        tasa_mensual = getattr(tarjeta, 'tasa_interes_mensual', 0.0) or 0.0
                        if tasa_mensual == 0:
                            tasa_anual = getattr(tarjeta, 'tasa_interes_anual', 0.0) or 0.0
                            if tasa_anual > 0:
                                tasa_mensual = tasa_anual / 12.0
                    except:
                        tasa_mensual = 0.0
                    
                    intereses = monto_estimado * (tasa_mensual / 100.0) if tasa_mensual > 0 else 0.0
                    impuesto_iva_pct = getattr(tarjeta, 'impuesto_iva', 21.0) or 21.0
                    iva_intereses = intereses * (impuesto_iva_pct / 100.0) if intereses > 0 else 0.0
                    impuesto_ganancias_pct = getattr(tarjeta, 'impuesto_ganancias', 0.0) or 0.0
                    impuesto_ganancias = intereses * (impuesto_ganancias_pct / 100.0) if intereses > 0 and impuesto_ganancias_pct > 0 else 0.0
                    gastos_admin = getattr(tarjeta, 'gastos_administrativos', 1000.0) or 1000.0
                    iva_gastos_admin = gastos_admin * (impuesto_iva_pct / 100.0) if gastos_admin > 0 else 0.0
                    impuesto_sellos_pct = getattr(tarjeta, 'impuesto_sellos', 0.0) or 0.0
                    impuesto_sellos = monto_estimado * (impuesto_sellos_pct / 100.0) if impuesto_sellos_pct > 0 else 0.0
                    
                    total_cargos = intereses + iva_intereses + impuesto_ganancias + gastos_admin + iva_gastos_admin + impuesto_sellos
                    capital = monto_estimado - total_cargos
                    if capital < 0:
                        capital = 0
                    
                    desglose_info = {
                        'monto_total': monto_estimado,
                        'capital': capital,
                        'intereses': intereses,
                        'iva_intereses': iva_intereses,
                        'impuesto_ganancias': impuesto_ganancias,
                        'gastos_administrativos': gastos_admin,
                        'iva_gastos_admin': iva_gastos_admin,
                        'otros_impuestos': impuesto_sellos,
                        'total_impuestos': iva_intereses + impuesto_ganancias + iva_gastos_admin + impuesto_sellos,
                        'total_cargos': total_cargos
                    }
                
                # Asegurar que descripcion no sea None
                gastos_lista = []
                for gasto in gastos_periodo:
                    gastos_lista.append({
                        'id': gasto.id,
                        'fecha': gasto.fecha.isoformat(),
                        'monto': gasto.monto,
                        'tipo': gasto.tipo.value,
                        'categoria': gasto.categoria if gasto.categoria else None,
                        'descripcion': gasto.descripcion if gasto.descripcion else None
                    })
                
                proyecciones.append({
                    'tarjeta_id': tarjeta.id,
                    'tarjeta_nombre': tarjeta.nombre,
                    'tarjeta_banco': tarjeta.banco,
                    'fecha_cierre': fecha_cierre.isoformat(),
                    'fecha_vencimiento': fecha_vencimiento.isoformat(),
                    'monto_estimado': monto_estimado,
                    'moneda': tarjeta.moneda.value,
                    'mes': fecha_vencimiento.strftime('%Y-%m'),
                    'periodo_cierre': {
                        'fecha_inicio': fecha_inicio_periodo.isoformat(),
                        'fecha_fin': fecha_fin_periodo.isoformat()
                    },
                    'gastos': gastos_lista,
                    'total_gastos_periodo': total_gastos_periodo,
                    'cantidad_gastos': len(gastos_periodo),
                    'desglose': desglose_info
                })
    
    # Agrupar por mes
    proyecciones_por_mes: Dict[str, List] = {}
    for proy in proyecciones:
        mes = proy['mes']
        if mes not in proyecciones_por_mes:
            proyecciones_por_mes[mes] = []
        proyecciones_por_mes[mes].append(proy)
    
    # Calcular totales por mes
    resultado = []
    for mes in sorted(proyecciones_por_mes.keys()):
        proys_mes = proyecciones_por_mes[mes]
        total_ars = sum(p['monto_estimado'] for p in proys_mes if p['moneda'] == 'ARS')
        total_usd = sum(p['monto_estimado'] for p in proys_mes if p['moneda'] == 'USD')
        
        resultado.append({
            'mes': mes,
            'fecha_vencimiento': proys_mes[0]['fecha_vencimiento'],
            'cantidad_cuotas': len(proys_mes),
            'total_ars': total_ars,
            'total_usd': total_usd,
            'detalle': proys_mes
        })
    
    return resultado


@app.get("/api/proyecciones", response_model=List[schemas.ProyeccionPago])
def read_proyecciones(db: Session = Depends(get_db)):
    proyecciones = crud.get_proyecciones(db)
    return proyecciones


@app.post("/api/proyecciones", response_model=schemas.ProyeccionPago)
def create_proyeccion(proyeccion: schemas.ProyeccionPagoCreate, db: Session = Depends(get_db)):
    return crud.create_proyeccion(db=db, proyeccion=proyeccion)


@app.delete("/api/proyecciones/{proyeccion_id}")
def delete_proyeccion(proyeccion_id: int, db: Session = Depends(get_db)):
    success = crud.delete_proyeccion(db, proyeccion_id=proyeccion_id)
    if not success:
        raise HTTPException(status_code=404, detail="Proyección no encontrada")
    return {"message": "Proyección eliminada exitosamente"}


# ========== REPORTES ==========
@app.get("/api/reportes/egresos-mensuales")
def get_egresos_mensuales(
    ano: int = Query(..., description="Año"),
    mes: int = Query(..., description="Mes (1-12)"),
    db: Session = Depends(get_db)
):
    return reports.egresos_mensuales(db, ano=ano, mes=mes)


@app.get("/api/reportes/saldos-positivos")
def get_saldos_positivos(
    ano: int = Query(..., description="Año"),
    mes: int = Query(..., description="Mes (1-12)"),
    db: Session = Depends(get_db)
):
    return reports.saldos_positivos(db, ano=ano, mes=mes)


@app.get("/api/reportes/resumen-mensual")
def get_resumen_mensual(
    ano: int = Query(..., description="Año"),
    mes: int = Query(..., description="Mes (1-12)"),
    db: Session = Depends(get_db)
):
    return reports.resumen_mensual(db, ano=ano, mes=mes)


# ========== ALERTAS ==========
@app.get("/api/alertas")
def get_alertas(db: Session = Depends(get_db)):
    return alerts.obtener_alertas(db)


@app.get("/api/alertas/tendencias")
def get_tendencias(db: Session = Depends(get_db)):
    return alerts.analizar_tendencias(db)


# ========== PROCESAMIENTO DE PDFs ==========
@app.post("/api/pdf/previsualizar")
async def previsualizar_pdf(file: UploadFile = File(...)):
    """Previsualiza los datos extraídos de un PDF sin guardar"""
    try:
        # Guardar temporalmente el archivo
        contents = await file.read()
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(contents)
            tmp_path = tmp_file.name
        
        try:
            # Procesar el PDF
            resultado = pdf_processor.procesar_pdf_liquidacion(tmp_path)
            return resultado
        finally:
            # Limpiar archivo temporal
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar el PDF: {str(e)}")


@app.post("/api/pdf/procesar-liquidacion")
async def procesar_liquidacion_pdf(
    file: UploadFile = File(...),
    tarjeta_id: Optional[int] = Query(None, description="ID de la tarjeta (opcional)"),
    db: Session = Depends(get_db)
):
    """Procesa un PDF de liquidación y guarda los datos"""
    try:
        # Guardar temporalmente el archivo
        contents = await file.read()
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(contents)
            tmp_path = tmp_file.name
        
        try:
            # Procesar el PDF
            datos = pdf_processor.procesar_pdf_liquidacion(tmp_path)
            
            # Si hay tarjeta_id, actualizar el saldo de la tarjeta
            if tarjeta_id and datos.get('monto_total'):
                tarjeta = crud.get_tarjeta(db, tarjeta_id=tarjeta_id)
                if tarjeta:
                    # Actualizar saldo actual
                    update_data = schemas.TarjetaCreditoUpdate(saldo_actual=datos['monto_total'])
                    crud.update_tarjeta(db, tarjeta_id=tarjeta_id, tarjeta=update_data)
            
            # Crear gastos para cada movimiento
            gastos_creados = []
            if datos.get('movimientos'):
                for movimiento in datos['movimientos']:
                    try:
                        # Convertir fecha de string a date si es necesario
                        fecha_mov = movimiento['fecha']
                        if isinstance(fecha_mov, str):
                            fecha_mov = date.fromisoformat(fecha_mov)
                        
                        gasto_data = schemas.GastoCreate(
                            fecha=fecha_mov,
                            monto=abs(float(movimiento['monto'])),  # Asegurar valor positivo
                            moneda=models.TipoMoneda.PESOS,  # Por defecto, se puede mejorar
                            tipo=models.TipoGasto.ORDINARIO,
                            descripcion=movimiento.get('descripcion', '')[:500]  # Limitar longitud
                        )
                        gasto = crud.create_gasto(db=db, gasto=gasto_data)
                        gastos_creados.append(gasto.id)
                    except Exception as e:
                        import traceback
                        print(f"Error al crear gasto: {str(e)}")
                        traceback.print_exc()
                        continue  # Continuar con el siguiente movimiento si hay error
            
            return {
                "mensaje": "PDF procesado exitosamente",
                "datos_extraidos": datos,
                "gastos_creados": len(gastos_creados),
                "gastos_ids": gastos_creados
            }
        finally:
            # Limpiar archivo temporal
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar el PDF: {str(e)}")


@app.get("/")
def root():
    return {"message": "API de Finanzas Personales"}

