from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from database import SessionLocal, engine, Base
import models
import schemas
import reports
import alerts
import pdf_processor

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finanzas Personales API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002", "http://localhost:3003", "http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ========== INGRESOS ==========
@app.get("/api/ingresos", response_model=List[schemas.Ingreso])
def get_ingresos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    ingresos = db.query(models.Ingreso).offset(skip).limit(limit).all()
    return ingresos

@app.get("/api/ingresos/{ingreso_id}", response_model=schemas.Ingreso)
def get_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    ingreso = db.query(models.Ingreso).filter(models.Ingreso.id == ingreso_id).first()
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return ingreso

@app.post("/api/ingresos", response_model=schemas.Ingreso)
def create_ingreso(ingreso: schemas.IngresoCreate, db: Session = Depends(get_db)):
    db_ingreso = models.Ingreso(**ingreso.model_dump())
    db.add(db_ingreso)
    db.commit()
    db.refresh(db_ingreso)
    return db_ingreso

@app.put("/api/ingresos/{ingreso_id}", response_model=schemas.Ingreso)
def update_ingreso(ingreso_id: int, ingreso: schemas.IngresoUpdate, db: Session = Depends(get_db)):
    db_ingreso = db.query(models.Ingreso).filter(models.Ingreso.id == ingreso_id).first()
    if not db_ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    
    update_data = ingreso.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ingreso, field, value)
    
    db.commit()
    db.refresh(db_ingreso)
    return db_ingreso

@app.delete("/api/ingresos/{ingreso_id}")
def delete_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    db_ingreso = db.query(models.Ingreso).filter(models.Ingreso.id == ingreso_id).first()
    if not db_ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    db.delete(db_ingreso)
    db.commit()
    return {"message": "Ingreso eliminado"}


# ========== GASTOS ==========
@app.get("/api/gastos", response_model=List[schemas.Gasto])
def get_gastos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    gastos = db.query(models.Gasto).offset(skip).limit(limit).all()
    return gastos

@app.get("/api/gastos/{gasto_id}", response_model=schemas.Gasto)
def get_gasto(gasto_id: int, db: Session = Depends(get_db)):
    gasto = db.query(models.Gasto).filter(models.Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return gasto

@app.post("/api/gastos", response_model=schemas.Gasto)
def create_gasto(gasto: schemas.GastoCreate, db: Session = Depends(get_db)):
    db_gasto = models.Gasto(**gasto.model_dump())
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

@app.put("/api/gastos/{gasto_id}", response_model=schemas.Gasto)
def update_gasto(gasto_id: int, gasto: schemas.GastoUpdate, db: Session = Depends(get_db)):
    db_gasto = db.query(models.Gasto).filter(models.Gasto.id == gasto_id).first()
    if not db_gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    update_data = gasto.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_gasto, field, value)
    
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

@app.delete("/api/gastos/{gasto_id}")
def delete_gasto(gasto_id: int, db: Session = Depends(get_db)):
    db_gasto = db.query(models.Gasto).filter(models.Gasto.id == gasto_id).first()
    if not db_gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    db.delete(db_gasto)
    db.commit()
    return {"message": "Gasto eliminado"}


# ========== TARJETAS ==========
@app.get("/api/tarjetas", response_model=List[schemas.TarjetaCredito])
def get_tarjetas(db: Session = Depends(get_db)):
    tarjetas = db.query(models.TarjetaCredito).all()
    return tarjetas

@app.get("/api/tarjetas/{tarjeta_id}", response_model=schemas.TarjetaCredito)
def get_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    tarjeta = db.query(models.TarjetaCredito).filter(models.TarjetaCredito.id == tarjeta_id).first()
    if not tarjeta:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return tarjeta

@app.post("/api/tarjetas", response_model=schemas.TarjetaCredito)
def create_tarjeta(tarjeta: schemas.TarjetaCreditoCreate, db: Session = Depends(get_db)):
    db_tarjeta = models.TarjetaCredito(**tarjeta.model_dump())
    db.add(db_tarjeta)
    db.commit()
    db.refresh(db_tarjeta)
    return db_tarjeta

@app.put("/api/tarjetas/{tarjeta_id}", response_model=schemas.TarjetaCredito)
def update_tarjeta(tarjeta_id: int, tarjeta: schemas.TarjetaCreditoUpdate, db: Session = Depends(get_db)):
    db_tarjeta = db.query(models.TarjetaCredito).filter(models.TarjetaCredito.id == tarjeta_id).first()
    if not db_tarjeta:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    
    update_data = tarjeta.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tarjeta, field, value)
    
    db.commit()
    db.refresh(db_tarjeta)
    return db_tarjeta

@app.delete("/api/tarjetas/{tarjeta_id}")
def delete_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    db_tarjeta = db.query(models.TarjetaCredito).filter(models.TarjetaCredito.id == tarjeta_id).first()
    if not db_tarjeta:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    db.delete(db_tarjeta)
    db.commit()
    return {"message": "Tarjeta eliminada"}


# ========== PRESTAMOS ==========
@app.get("/api/prestamos", response_model=List[schemas.Prestamo])
def get_prestamos(db: Session = Depends(get_db)):
    prestamos = db.query(models.Prestamo).all()
    return prestamos

@app.get("/api/prestamos/{prestamo_id}", response_model=schemas.Prestamo)
def get_prestamo(prestamo_id: int, db: Session = Depends(get_db)):
    prestamo = db.query(models.Prestamo).filter(models.Prestamo.id == prestamo_id).first()
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return prestamo

@app.post("/api/prestamos", response_model=schemas.Prestamo)
def create_prestamo(prestamo: schemas.PrestamoCreate, db: Session = Depends(get_db)):
    db_prestamo = models.Prestamo(**prestamo.model_dump())
    db.add(db_prestamo)
    db.commit()
    db.refresh(db_prestamo)
    return db_prestamo

@app.put("/api/prestamos/{prestamo_id}", response_model=schemas.Prestamo)
def update_prestamo(prestamo_id: int, prestamo: schemas.PrestamoUpdate, db: Session = Depends(get_db)):
    db_prestamo = db.query(models.Prestamo).filter(models.Prestamo.id == prestamo_id).first()
    if not db_prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    
    update_data = prestamo.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_prestamo, field, value)
    
    db.commit()
    db.refresh(db_prestamo)
    return db_prestamo

@app.delete("/api/prestamos/{prestamo_id}")
def delete_prestamo(prestamo_id: int, db: Session = Depends(get_db)):
    db_prestamo = db.query(models.Prestamo).filter(models.Prestamo.id == prestamo_id).first()
    if not db_prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    db.delete(db_prestamo)
    db.commit()
    return {"message": "Préstamo eliminado"}

@app.get("/api/prestamos/{prestamo_id}/desglose-cuota")
def get_desglose_cuota_prestamo(prestamo_id: int, db: Session = Depends(get_db)):
    """Calcula el desglose de la próxima cuota de un préstamo"""
    prestamo = db.query(models.Prestamo).filter(models.Prestamo.id == prestamo_id).first()
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    
    if not prestamo.activo:
        raise HTTPException(status_code=400, detail="El préstamo no está activo")
    
    # Calcular monto pendiente
    monto_pendiente = prestamo.monto_total - prestamo.monto_pagado
    
    if monto_pendiente <= 0:
        raise HTTPException(status_code=400, detail="El préstamo está completamente pagado")
    
    # Valores por defecto (típicos en Argentina)
    tasa_interes_anual = prestamo.tasa_interes if prestamo.tasa_interes else 0.0
    tasa_interes_mensual = tasa_interes_anual / 12.0 if tasa_interes_anual > 0 else 0.0
    impuesto_iva = 21.0  # IVA estándar en Argentina
    impuesto_ganancias = 0.0  # Por defecto, puede variar
    gastos_administrativos = 500.0  # Valor por defecto
    seguro = 0.0  # Por defecto
    impuesto_sellos = 0.0  # Por defecto
    
    # Calcular intereses sobre el saldo pendiente
    intereses = (monto_pendiente * tasa_interes_mensual / 100.0) if tasa_interes_mensual > 0 else 0.0
    
    # IVA sobre intereses
    iva_intereses = (intereses * impuesto_iva / 100.0) if intereses > 0 else 0.0
    
    # IVA sobre gastos administrativos
    iva_gastos_admin = (gastos_administrativos * impuesto_iva / 100.0) if gastos_administrativos > 0 else 0.0
    
    # IVA sobre seguro
    iva_seguro = (seguro * impuesto_iva / 100.0) if seguro > 0 else 0.0
    
    # Calcular capital (si hay cuota mensual, usar ese valor menos los cargos)
    if prestamo.cuota_mensual and prestamo.cuota_mensual > 0:
        # El capital es la cuota menos todos los cargos
        total_cargos = intereses + iva_intereses + gastos_administrativos + iva_gastos_admin + seguro + iva_seguro + impuesto_ganancias + impuesto_sellos
        capital = max(0, prestamo.cuota_mensual - total_cargos)
        monto_total = prestamo.cuota_mensual
    else:
        # Si no hay cuota mensual definida, calcular aproximado
        # Capital aproximado: 70% del monto pendiente (ajustable)
        capital = monto_pendiente * 0.7
        total_cargos = intereses + iva_intereses + gastos_administrativos + iva_gastos_admin + seguro + iva_seguro + impuesto_ganancias + impuesto_sellos
        monto_total = capital + total_cargos
    
    # Calcular totales
    total_impuestos = iva_intereses + iva_gastos_admin + iva_seguro + impuesto_ganancias + impuesto_sellos
    total_cargos_calc = intereses + gastos_administrativos + seguro + total_impuestos
    
    # Calcular número de cuota aproximado
    if prestamo.cuota_mensual and prestamo.cuota_mensual > 0:
        numero_cuota = int((prestamo.monto_total - monto_pendiente) / prestamo.cuota_mensual) + 1
    else:
        numero_cuota = 1
    
    # Fecha de vencimiento (usar la del préstamo o calcular próxima)
    fecha_vencimiento = prestamo.fecha_vencimiento if prestamo.fecha_vencimiento else date.today()
    
    return {
        "prestamo_id": prestamo.id,
        "prestamo_nombre": prestamo.nombre,
        "fecha_vencimiento": fecha_vencimiento.isoformat(),
        "numero_cuota": numero_cuota,
        "moneda": prestamo.moneda.value,
        "monto_pendiente": monto_pendiente,
        "desglose": {
            "monto_total": monto_total,
            "capital": capital,
            "intereses": intereses,
            "iva_intereses": iva_intereses,
            "impuesto_ganancias": impuesto_ganancias,
            "gastos_administrativos": gastos_administrativos,
            "iva_gastos_admin": iva_gastos_admin,
            "seguro": seguro,
            "iva_seguro": iva_seguro,
            "otros_impuestos": impuesto_sellos,
            "total_impuestos": total_impuestos,
            "total_cargos": total_cargos_calc
        },
        "porcentajes": {
            "tasa_interes_anual": tasa_interes_anual,
            "tasa_interes_mensual": tasa_interes_mensual,
            "impuesto_iva": impuesto_iva,
            "impuesto_ganancias": impuesto_ganancias
        }
    }


# ========== INVERSIONES ==========
@app.get("/api/inversiones", response_model=List[schemas.Inversion])
def get_inversiones(db: Session = Depends(get_db)):
    inversiones = db.query(models.Inversion).all()
    return inversiones

@app.get("/api/inversiones/{inversion_id}", response_model=schemas.Inversion)
def get_inversion(inversion_id: int, db: Session = Depends(get_db)):
    inversion = db.query(models.Inversion).filter(models.Inversion.id == inversion_id).first()
    if not inversion:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    return inversion

@app.post("/api/inversiones", response_model=schemas.Inversion)
def create_inversion(inversion: schemas.InversionCreate, db: Session = Depends(get_db)):
    db_inversion = models.Inversion(**inversion.model_dump())
    db.add(db_inversion)
    db.commit()
    db.refresh(db_inversion)
    return db_inversion

@app.put("/api/inversiones/{inversion_id}", response_model=schemas.Inversion)
def update_inversion(inversion_id: int, inversion: schemas.InversionUpdate, db: Session = Depends(get_db)):
    db_inversion = db.query(models.Inversion).filter(models.Inversion.id == inversion_id).first()
    if not db_inversion:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    
    update_data = inversion.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_inversion, field, value)
    
    db.commit()
    db.refresh(db_inversion)
    return db_inversion

@app.delete("/api/inversiones/{inversion_id}")
def delete_inversion(inversion_id: int, db: Session = Depends(get_db)):
    db_inversion = db.query(models.Inversion).filter(models.Inversion.id == inversion_id).first()
    if not db_inversion:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    db.delete(db_inversion)
    db.commit()
    return {"message": "Inversión eliminada"}


# ========== PROYECCIONES ==========
@app.get("/api/proyecciones", response_model=List[schemas.ProyeccionPago])
def get_proyecciones(db: Session = Depends(get_db)):
    proyecciones = db.query(models.ProyeccionPago).all()
    return proyecciones

@app.post("/api/proyecciones", response_model=schemas.ProyeccionPago)
def create_proyeccion(proyeccion: schemas.ProyeccionPagoCreate, db: Session = Depends(get_db)):
    db_proyeccion = models.ProyeccionPago(**proyeccion.model_dump())
    db.add(db_proyeccion)
    db.commit()
    db.refresh(db_proyeccion)
    return db_proyeccion

@app.delete("/api/proyecciones/{proyeccion_id}")
def delete_proyeccion(proyeccion_id: int, db: Session = Depends(get_db)):
    db_proyeccion = db.query(models.ProyeccionPago).filter(models.ProyeccionPago.id == proyeccion_id).first()
    if not db_proyeccion:
        raise HTTPException(status_code=404, detail="Proyección no encontrada")
    db.delete(db_proyeccion)
    db.commit()
    return {"message": "Proyección eliminada"}

@app.get("/api/proyecciones/tarjetas")
def get_proyecciones_tarjetas(meses: int = Query(default=6, ge=1, le=24), db: Session = Depends(get_db)):
    """Calcula las proyecciones de pagos de tarjetas para los próximos N meses"""
    from calendar import monthrange
    from datetime import timedelta
    
    hoy = date.today()
    tarjetas = db.query(models.TarjetaCredito).filter(models.TarjetaCredito.saldo_actual > 0).all()
    
    if not tarjetas:
        return []
    
    proyecciones_por_mes = {}
    
    for mes_offset in range(meses):
        # Calcular fecha del mes objetivo
        mes_objetivo = hoy.month + mes_offset
        ano_objetivo = hoy.year
        
        while mes_objetivo > 12:
            mes_objetivo -= 12
            ano_objetivo += 1
        
        mes_key = f"{ano_objetivo}-{mes_objetivo:02d}"
        
        if mes_key not in proyecciones_por_mes:
            proyecciones_por_mes[mes_key] = {
                "mes": mes_key,
                "fecha_vencimiento": None,
                "cantidad_cuotas": 0,
                "total_ars": 0,
                "total_usd": 0,
                "detalle": []
            }
        
        for tarjeta in tarjetas:
            # Calcular fecha de cierre para este mes
            ultimo_dia_mes = monthrange(ano_objetivo, mes_objetivo)[1]
            dia_cierre = min(tarjeta.fecha_cierre, ultimo_dia_mes)
            fecha_cierre = date(ano_objetivo, mes_objetivo, dia_cierre)
            
            # Calcular fecha de vencimiento (días después del cierre)
            dias_hasta_vencimiento = tarjeta.fecha_vencimiento - tarjeta.fecha_cierre
            if dias_hasta_vencimiento < 0:
                # Si el vencimiento es antes del cierre, es del mes siguiente
                if mes_objetivo == 12:
                    fecha_vencimiento = date(ano_objetivo + 1, 1, min(tarjeta.fecha_vencimiento, 31))
                else:
                    ultimo_dia_sig = monthrange(ano_objetivo, mes_objetivo + 1)[1]
                    fecha_vencimiento = date(ano_objetivo, mes_objetivo + 1, min(tarjeta.fecha_vencimiento, ultimo_dia_sig))
            else:
                fecha_vencimiento = fecha_cierre + timedelta(days=dias_hasta_vencimiento)
                # Ajustar si se pasa del mes
                if fecha_vencimiento.month != mes_objetivo:
                    if mes_objetivo == 12:
                        ultimo_dia_sig = monthrange(ano_objetivo + 1, 1)[1]
                        fecha_vencimiento = date(ano_objetivo + 1, 1, min(tarjeta.fecha_vencimiento, ultimo_dia_sig))
                    else:
                        ultimo_dia_sig = monthrange(ano_objetivo, mes_objetivo + 1)[1]
                        fecha_vencimiento = date(ano_objetivo, mes_objetivo + 1, min(tarjeta.fecha_vencimiento, ultimo_dia_sig))
            
            # Obtener gastos del período (desde el cierre anterior hasta el cierre actual)
            if mes_offset == 0:
                # Para el mes actual, usar gastos desde el inicio del mes
                fecha_inicio_periodo = date(ano_objetivo, mes_objetivo, 1)
            else:
                # Para meses futuros, calcular desde el cierre del mes anterior
                mes_anterior = mes_objetivo - 1
                ano_anterior = ano_objetivo
                if mes_anterior == 0:
                    mes_anterior = 12
                    ano_anterior -= 1
                ultimo_dia_ant = monthrange(ano_anterior, mes_anterior)[1]
                dia_cierre_ant = min(tarjeta.fecha_cierre, ultimo_dia_ant)
                fecha_inicio_periodo = date(ano_anterior, mes_anterior, dia_cierre_ant) + timedelta(days=1)
            
            fecha_fin_periodo = fecha_cierre
            
            # Obtener gastos del período (asumiendo que los gastos tienen una relación con las tarjetas)
            # Por ahora, usaremos el saldo actual como estimación
            gastos_periodo = db.query(models.Gasto).filter(
                models.Gasto.fecha >= fecha_inicio_periodo,
                models.Gasto.fecha <= fecha_fin_periodo
            ).all()
            
            # Filtrar gastos que podrían ser de esta tarjeta (por ahora todos)
            gastos_tarjeta = [g for g in gastos_periodo if g.moneda == tarjeta.moneda]
            total_gastos_periodo = sum(g.monto for g in gastos_tarjeta)
            
            # Calcular desglose de cuota (similar al de préstamos)
            # Valores por defecto para tarjetas
            tasa_interes_anual = 90.0  # Tasa típica en Argentina
            tasa_interes_mensual = 7.5
            impuesto_iva = 21.0
            gastos_administrativos = 1000.0
            
            # Calcular intereses sobre el saldo pendiente
            saldo_para_calculo = tarjeta.saldo_actual + total_gastos_periodo
            intereses = (saldo_para_calculo * tasa_interes_mensual / 100.0) if tasa_interes_mensual > 0 else 0.0
            iva_intereses = (intereses * impuesto_iva / 100.0) if intereses > 0 else 0.0
            iva_gastos_admin = (gastos_administrativos * impuesto_iva / 100.0) if gastos_administrativos > 0 else 0.0
            
            # Calcular monto total de la cuota
            capital = saldo_para_calculo
            total_impuestos = iva_intereses + iva_gastos_admin
            total_cargos = intereses + gastos_administrativos + total_impuestos
            monto_total = capital + total_cargos
            
            # Solo agregar si hay algo que pagar
            if monto_total > 0:
                detalle = {
                    "tarjeta_id": tarjeta.id,
                    "tarjeta_nombre": tarjeta.nombre,
                    "tarjeta_banco": tarjeta.banco,
                    "fecha_cierre": fecha_cierre.isoformat(),
                    "fecha_vencimiento": fecha_vencimiento.isoformat(),
                    "monto_estimado": monto_total,
                    "moneda": tarjeta.moneda.value,
                    "periodo_cierre": {
                        "fecha_inicio": fecha_inicio_periodo.isoformat(),
                        "fecha_fin": fecha_fin_periodo.isoformat()
                    },
                    "gastos": [{
                        "id": g.id,
                        "fecha": g.fecha.isoformat(),
                        "monto": g.monto,
                        "tipo": g.tipo.value,
                        "categoria": g.categoria,
                        "descripcion": g.descripcion
                    } for g in gastos_tarjeta],
                    "total_gastos_periodo": total_gastos_periodo,
                    "cantidad_gastos": len(gastos_tarjeta),
                    "desglose": {
                        "monto_total": monto_total,
                        "capital": capital,
                        "intereses": intereses,
                        "iva_intereses": iva_intereses,
                        "impuesto_ganancias": 0.0,
                        "gastos_administrativos": gastos_administrativos,
                        "iva_gastos_admin": iva_gastos_admin,
                        "otros_impuestos": 0.0,
                        "total_impuestos": total_impuestos,
                        "total_cargos": total_cargos
                    }
                }
                
                proyecciones_por_mes[mes_key]["detalle"].append(detalle)
                proyecciones_por_mes[mes_key]["cantidad_cuotas"] += 1
                
                if tarjeta.moneda == models.TipoMoneda.PESOS:
                    proyecciones_por_mes[mes_key]["total_ars"] += monto_total
                else:
                    proyecciones_por_mes[mes_key]["total_usd"] += monto_total
                
                # Establecer fecha de vencimiento (la más temprana del mes)
                if not proyecciones_por_mes[mes_key]["fecha_vencimiento"] or fecha_vencimiento < date.fromisoformat(proyecciones_por_mes[mes_key]["fecha_vencimiento"]):
                    proyecciones_por_mes[mes_key]["fecha_vencimiento"] = fecha_vencimiento.isoformat()
    
    # Convertir a lista y ordenar por mes
    resultado = list(proyecciones_por_mes.values())
    resultado.sort(key=lambda x: x["mes"])
    
    return resultado


# ========== REPORTES ==========
@app.get("/api/reportes/egresos-mensuales")
def get_egresos_mensuales(ano: int = Query(...), mes: int = Query(...), db: Session = Depends(get_db)):
    return reports.egresos_mensuales(db, ano, mes)

@app.get("/api/reportes/saldos-positivos")
def get_saldos_positivos(ano: int = Query(...), mes: int = Query(...), db: Session = Depends(get_db)):
    return reports.saldos_positivos(db, ano, mes)

@app.get("/api/reportes/resumen-mensual")
def get_resumen_mensual(ano: int = Query(...), mes: int = Query(...), db: Session = Depends(get_db)):
    return reports.resumen_mensual(db, ano, mes)


# ========== ALERTAS ==========
@app.get("/api/alertas")
def get_alertas(db: Session = Depends(get_db)):
    return alerts.obtener_alertas(db)

@app.get("/api/alertas/tendencias")
def get_tendencias(db: Session = Depends(get_db)):
    return alerts.analizar_tendencias(db)


# ========== PDF PROCESSING ==========
@app.post("/api/pdf/previsualizar")
async def previsualizar_pdf(file: UploadFile = File(...)):
    try:
        contenido = await file.read()
        # Crear un archivo temporal en memoria
        import io
        archivo_pdf = io.BytesIO(contenido)
        datos = pdf_processor.procesar_pdf_liquidacion(archivo_pdf)
        return datos
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar PDF: {str(e)}")

@app.post("/api/pdf/procesar-liquidacion")
async def procesar_liquidacion(
    tarjeta_id: int = Query(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que la tarjeta existe
        tarjeta = db.query(models.TarjetaCredito).filter(models.TarjetaCredito.id == tarjeta_id).first()
        if not tarjeta:
            raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
        
        # Procesar PDF
        contenido = await file.read()
        import io
        archivo_pdf = io.BytesIO(contenido)
        datos = pdf_processor.procesar_pdf_liquidacion(archivo_pdf)
        
        # Actualizar saldo de la tarjeta
        if datos.get('monto_total'):
            tarjeta.saldo_actual = datos['monto_total']
        
        # Crear gastos para cada movimiento
        movimientos_creados = []
        for mov in datos.get('movimientos', []):
            fecha_str = mov.get('fecha')
            if isinstance(fecha_str, str):
                fecha = date.fromisoformat(fecha_str)
            else:
                fecha = fecha_str
            
            gasto = models.Gasto(
                fecha=fecha,
                monto=mov['monto'],
                moneda=tarjeta.moneda,
                tipo=models.TipoGasto.ORDINARIO,
                descripcion=mov.get('descripcion', 'Compra en tarjeta')
            )
            db.add(gasto)
            movimientos_creados.append(gasto)
        
        # Registrar el pago de la liquidación
        if datos.get('fecha_liquidacion'):
            fecha_liquidacion = date.fromisoformat(datos['fecha_liquidacion'])
            pago = models.PagoTarjeta(
                tarjeta_id=tarjeta_id,
                fecha_pago=fecha_liquidacion,
                monto=datos.get('monto_total', 0),
                descripcion=f"Liquidación procesada automáticamente"
            )
            db.add(pago)
        
        db.commit()
        
        return {
            "message": "Liquidación procesada exitosamente",
            "datos": datos,
            "gastos_creados": len(movimientos_creados)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al procesar liquidación: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
