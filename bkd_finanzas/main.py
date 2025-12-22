from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional
import database
import models
import schemas
import crud
import alerts
import reports
import pdf_processor

app = FastAPI(title="Sistema de Gestión de Finanzas Personales")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear tablas
models.Base.metadata.create_all(bind=database.engine)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ========== INGRESOS ==========
@app.post("/api/ingresos", response_model=schemas.Ingreso)
def crear_ingreso(ingreso: schemas.IngresoCreate, db: Session = Depends(get_db)):
    return crud.create_ingreso(db=db, ingreso=ingreso)

@app.get("/api/ingresos", response_model=List[schemas.Ingreso])
def listar_ingresos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_ingresos(db=db, skip=skip, limit=limit)

@app.get("/api/ingresos/{ingreso_id}", response_model=schemas.Ingreso)
def obtener_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    db_ingreso = crud.get_ingreso(db=db, ingreso_id=ingreso_id)
    if db_ingreso is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return db_ingreso

@app.put("/api/ingresos/{ingreso_id}", response_model=schemas.Ingreso)
def actualizar_ingreso(ingreso_id: int, ingreso: schemas.IngresoUpdate, db: Session = Depends(get_db)):
    db_ingreso = crud.update_ingreso(db=db, ingreso_id=ingreso_id, ingreso=ingreso)
    if db_ingreso is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return db_ingreso

@app.delete("/api/ingresos/{ingreso_id}")
def eliminar_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    if not crud.delete_ingreso(db=db, ingreso_id=ingreso_id):
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return {"message": "Ingreso eliminado exitosamente"}


# ========== GASTOS ==========
@app.post("/api/gastos", response_model=schemas.Gasto)
def crear_gasto(gasto: schemas.GastoCreate, db: Session = Depends(get_db)):
    return crud.create_gasto(db=db, gasto=gasto)

@app.get("/api/gastos", response_model=List[schemas.Gasto])
def listar_gastos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_gastos(db=db, skip=skip, limit=limit)

@app.get("/api/gastos/{gasto_id}", response_model=schemas.Gasto)
def obtener_gasto(gasto_id: int, db: Session = Depends(get_db)):
    db_gasto = crud.get_gasto(db=db, gasto_id=gasto_id)
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return db_gasto

@app.put("/api/gastos/{gasto_id}", response_model=schemas.Gasto)
def actualizar_gasto(gasto_id: int, gasto: schemas.GastoUpdate, db: Session = Depends(get_db)):
    db_gasto = crud.update_gasto(db=db, gasto_id=gasto_id, gasto=gasto)
    if db_gasto is None:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return db_gasto

@app.delete("/api/gastos/{gasto_id}")
def eliminar_gasto(gasto_id: int, db: Session = Depends(get_db)):
    if not crud.delete_gasto(db=db, gasto_id=gasto_id):
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return {"message": "Gasto eliminado exitosamente"}


# ========== TARJETAS DE CRÉDITO ==========
@app.post("/api/tarjetas", response_model=schemas.TarjetaCredito)
def crear_tarjeta(tarjeta: schemas.TarjetaCreditoCreate, db: Session = Depends(get_db)):
    return crud.create_tarjeta(db=db, tarjeta=tarjeta)

@app.get("/api/tarjetas", response_model=List[schemas.TarjetaCredito])
def listar_tarjetas(db: Session = Depends(get_db)):
    return crud.get_tarjetas(db=db)

@app.get("/api/tarjetas/{tarjeta_id}", response_model=schemas.TarjetaCredito)
def obtener_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    db_tarjeta = crud.get_tarjeta(db=db, tarjeta_id=tarjeta_id)
    if db_tarjeta is None:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return db_tarjeta

@app.put("/api/tarjetas/{tarjeta_id}", response_model=schemas.TarjetaCredito)
def actualizar_tarjeta(tarjeta_id: int, tarjeta: schemas.TarjetaCreditoUpdate, db: Session = Depends(get_db)):
    db_tarjeta = crud.update_tarjeta(db=db, tarjeta_id=tarjeta_id, tarjeta=tarjeta)
    if db_tarjeta is None:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return db_tarjeta

@app.delete("/api/tarjetas/{tarjeta_id}")
def eliminar_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    if not crud.delete_tarjeta(db=db, tarjeta_id=tarjeta_id):
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return {"message": "Tarjeta eliminada exitosamente"}


# ========== PRÉSTAMOS ==========
@app.post("/api/prestamos", response_model=schemas.Prestamo)
def crear_prestamo(prestamo: schemas.PrestamoCreate, db: Session = Depends(get_db)):
    return crud.create_prestamo(db=db, prestamo=prestamo)

@app.get("/api/prestamos", response_model=List[schemas.Prestamo])
def listar_prestamos(db: Session = Depends(get_db)):
    return crud.get_prestamos(db=db)

@app.get("/api/prestamos/{prestamo_id}", response_model=schemas.Prestamo)
def obtener_prestamo(prestamo_id: int, db: Session = Depends(get_db)):
    db_prestamo = crud.get_prestamo(db=db, prestamo_id=prestamo_id)
    if db_prestamo is None:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return db_prestamo

@app.put("/api/prestamos/{prestamo_id}", response_model=schemas.Prestamo)
def actualizar_prestamo(prestamo_id: int, prestamo: schemas.PrestamoUpdate, db: Session = Depends(get_db)):
    db_prestamo = crud.update_prestamo(db=db, prestamo_id=prestamo_id, prestamo=prestamo)
    if db_prestamo is None:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return db_prestamo

@app.delete("/api/prestamos/{prestamo_id}")
def eliminar_prestamo(prestamo_id: int, db: Session = Depends(get_db)):
    if not crud.delete_prestamo(db=db, prestamo_id=prestamo_id):
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return {"message": "Préstamo eliminado exitosamente"}


# ========== INVERSIONES ==========
@app.post("/api/inversiones", response_model=schemas.Inversion)
def crear_inversion(inversion: schemas.InversionCreate, db: Session = Depends(get_db)):
    return crud.create_inversion(db=db, inversion=inversion)

@app.get("/api/inversiones", response_model=List[schemas.Inversion])
def listar_inversiones(db: Session = Depends(get_db)):
    return crud.get_inversiones(db=db)

@app.get("/api/inversiones/{inversion_id}", response_model=schemas.Inversion)
def obtener_inversion(inversion_id: int, db: Session = Depends(get_db)):
    db_inversion = crud.get_inversion(db=db, inversion_id=inversion_id)
    if db_inversion is None:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    return db_inversion

@app.put("/api/inversiones/{inversion_id}", response_model=schemas.Inversion)
def actualizar_inversion(inversion_id: int, inversion: schemas.InversionUpdate, db: Session = Depends(get_db)):
    db_inversion = crud.update_inversion(db=db, inversion_id=inversion_id, inversion=inversion)
    if db_inversion is None:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    return db_inversion

@app.delete("/api/inversiones/{inversion_id}")
def eliminar_inversion(inversion_id: int, db: Session = Depends(get_db)):
    if not crud.delete_inversion(db=db, inversion_id=inversion_id):
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    return {"message": "Inversión eliminada exitosamente"}


# ========== PROYECCIONES FUTURAS ==========
@app.post("/api/proyecciones", response_model=schemas.ProyeccionPago)
def crear_proyeccion(proyeccion: schemas.ProyeccionPagoCreate, db: Session = Depends(get_db)):
    return crud.create_proyeccion(db=db, proyeccion=proyeccion)

@app.get("/api/proyecciones", response_model=List[schemas.ProyeccionPago])
def listar_proyecciones(db: Session = Depends(get_db)):
    return crud.get_proyecciones(db=db)

@app.delete("/api/proyecciones/{proyeccion_id}")
def eliminar_proyeccion(proyeccion_id: int, db: Session = Depends(get_db)):
    if not crud.delete_proyeccion(db=db, proyeccion_id=proyeccion_id):
        raise HTTPException(status_code=404, detail="Proyección no encontrada")
    return {"message": "Proyección eliminada exitosamente"}


# ========== PROCESAMIENTO DE PDFs ==========
@app.post("/api/pdf/procesar-liquidacion")
async def procesar_liquidacion_pdf(
    tarjeta_id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Procesa un PDF de liquidación de tarjeta y extrae la información"""
    try:
        # Verificar que la tarjeta existe
        tarjeta = crud.get_tarjeta(db=db, tarjeta_id=tarjeta_id)
        if not tarjeta:
            raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
        
        # Verificar que es un PDF
        if not archivo.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")
        
        # Procesar el PDF
        datos = pdf_processor.procesar_pdf_liquidacion(archivo.file)
        
        # Actualizar saldo de la tarjeta si tenemos monto total
        if datos.get('monto_total'):
            nuevo_saldo = tarjeta.saldo_actual + datos['monto_total']
            crud.update_tarjeta(
                db=db,
                tarjeta_id=tarjeta_id,
                tarjeta=schemas.TarjetaCreditoUpdate(saldo_actual=nuevo_saldo)
            )
        
        # Crear gastos para cada movimiento si existen
        gastos_creados = []
        if datos.get('movimientos'):
            for movimiento in datos['movimientos']:
                gasto = schemas.GastoCreate(
                    fecha=movimiento['fecha'],
                    monto=movimiento['monto'],
                    moneda=tarjeta.moneda,
                    tipo=models.TipoGasto.ORDINARIO,
                    categoria="Tarjeta de Crédito",
                    descripcion=f"{movimiento['descripcion']} - Liquidación {datos.get('fecha_liquidacion', '')}"
                )
                gasto_creado = crud.create_gasto(db=db, gasto=gasto)
                gastos_creados.append(gasto_creado.id)
        
        # Crear pago de tarjeta si tenemos monto total
        pago_creado = None
        if datos.get('monto_total'):
            from models import PagoTarjeta
            pago = PagoTarjeta(
                tarjeta_id=tarjeta_id,
                fecha_pago=date.today(),
                monto=datos['monto_total'],
                descripcion=f"Liquidación procesada desde PDF - {archivo.filename}"
            )
            db.add(pago)
            db.commit()
            db.refresh(pago)
            pago_creado = pago.id
        
        return {
            "mensaje": "PDF procesado exitosamente",
            "datos_extraidos": datos,
            "gastos_creados": len(gastos_creados),
            "pago_creado": pago_creado is not None,
            "tarjeta_actualizada": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar PDF: {str(e)}")


@app.post("/api/pdf/previsualizar")
async def previsualizar_pdf(archivo: UploadFile = File(...)):
    """Previsualiza los datos extraídos de un PDF sin guardarlos"""
    try:
        if not archivo.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")
        
        datos = pdf_processor.procesar_pdf_liquidacion(archivo.file)
        return {
            "datos_extraidos": datos,
            "mensaje": "Datos extraídos correctamente. Revisa la información antes de guardar."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar PDF: {str(e)}")


# ========== REPORTES ==========
@app.get("/api/reportes/egresos-mensuales")
def obtener_egresos_mensuales(ano: int, mes: int, db: Session = Depends(get_db)):
    return reports.egresos_mensuales(db=db, ano=ano, mes=mes)

@app.get("/api/reportes/saldos-positivos")
def obtener_saldos_positivos(ano: int, mes: int, db: Session = Depends(get_db)):
    return reports.saldos_positivos(db=db, ano=ano, mes=mes)

@app.get("/api/reportes/resumen-mensual")
def obtener_resumen_mensual(ano: int, mes: int, db: Session = Depends(get_db)):
    return reports.resumen_mensual(db=db, ano=ano, mes=mes)


# ========== ALERTAS ==========
@app.get("/api/alertas")
def obtener_alertas(db: Session = Depends(get_db)):
    return alerts.obtener_alertas(db=db)

@app.get("/api/alertas/tendencias")
def obtener_tendencias(db: Session = Depends(get_db)):
    return alerts.analizar_tendencias(db=db)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


