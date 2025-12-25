from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite y otros puertos comunes
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
@app.get("/api/tarjetas", response_model=List[schemas.TarjetaCredito])
def read_tarjetas(db: Session = Depends(get_db)):
    tarjetas = crud.get_tarjetas(db)
    return tarjetas


@app.get("/api/tarjetas/{tarjeta_id}", response_model=schemas.TarjetaCredito)
def read_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    db_tarjeta = crud.get_tarjeta(db, tarjeta_id=tarjeta_id)
    if db_tarjeta is None:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return db_tarjeta


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
@app.get("/api/proyecciones/tarjetas")
def get_proyecciones_tarjetas(meses: int = Query(6, description="Número de meses a proyectar"), db: Session = Depends(get_db)):
    """Genera proyecciones de pagos de tarjetas para los próximos meses"""
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
                # Para simplificar, proyectamos el saldo actual como pago
                # En una implementación más avanzada se podría calcular cuotas mínimas o porcentajes
                monto_estimado = tarjeta.saldo_actual
                
                proyecciones.append({
                    'tarjeta_id': tarjeta.id,
                    'tarjeta_nombre': tarjeta.nombre,
                    'tarjeta_banco': tarjeta.banco,
                    'fecha_cierre': fecha_cierre.isoformat(),
                    'fecha_vencimiento': fecha_vencimiento.isoformat(),
                    'monto_estimado': monto_estimado,
                    'moneda': tarjeta.moneda.value,
                    'mes': fecha_vencimiento.strftime('%Y-%m')
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

