from sqlalchemy.orm import Session
from sqlalchemy import and_, extract, func
from datetime import date, timedelta
from typing import List, Dict
import models
import reports


def obtener_alertas(db: Session) -> List[Dict]:
    """Obtiene todas las alertas del sistema"""
    alertas = []
    
    # Obtener mes actual
    hoy = date.today()
    mes_actual = hoy.month
    ano_actual = hoy.year
    
    # Alertas de incremento de gastos
    alertas_gastos = analizar_incremento_gastos(db, ano_actual, mes_actual)
    alertas.extend(alertas_gastos)
    
    # Alertas de deudas
    alertas_deudas = analizar_deudas(db)
    alertas.extend(alertas_deudas)
    
    # Alertas de proyecciones próximas
    alertas_proyecciones = analizar_proyecciones_proximas(db)
    alertas.extend(alertas_proyecciones)
    
    # Alertas de saldo negativo
    alertas_saldo = analizar_saldo_negativo(db, ano_actual, mes_actual)
    alertas.extend(alertas_saldo)
    
    return alertas


def analizar_incremento_gastos(db: Session, ano: int, mes: int) -> List[Dict]:
    """Analiza incrementos en gastos comparando con meses anteriores"""
    alertas = []
    
    # Obtener gastos del mes actual
    gastos_actuales = db.query(models.Gasto).filter(
        and_(
            extract('year', models.Gasto.fecha) == ano,
            extract('month', models.Gasto.fecha) == mes
        )
    ).all()
    
    total_actual_ars = sum(g.monto for g in gastos_actuales if g.moneda == models.TipoMoneda.PESOS)
    total_actual_usd = sum(g.monto for g in gastos_actuales if g.moneda == models.TipoMoneda.DOLARES)
    
    # Comparar con mes anterior
    mes_anterior = mes - 1
    ano_anterior = ano
    if mes_anterior == 0:
        mes_anterior = 12
        ano_anterior = ano - 1
    
    gastos_anteriores = db.query(models.Gasto).filter(
        and_(
            extract('year', models.Gasto.fecha) == ano_anterior,
            extract('month', models.Gasto.fecha) == mes_anterior
        )
    ).all()
    
    total_anterior_ars = sum(g.monto for g in gastos_anteriores if g.moneda == models.TipoMoneda.PESOS)
    total_anterior_usd = sum(g.monto for g in gastos_anteriores if g.moneda == models.TipoMoneda.DOLARES)
    
    if total_anterior_ars > 0:
        incremento_porcentual_ars = ((total_actual_ars - total_anterior_ars) / total_anterior_ars) * 100
        if incremento_porcentual_ars > 20:  # Alerta si incremento > 20%
            alertas.append({
                "tipo": "incremento_gastos",
                "severidad": "alta" if incremento_porcentual_ars > 50 else "media",
                "titulo": "Incremento significativo en gastos (ARS)",
                "mensaje": f"Los gastos en pesos aumentaron un {incremento_porcentual_ars:.1f}% respecto al mes anterior",
                "detalle": {
                    "mes_actual": f"{ano}-{mes:02d}",
                    "mes_anterior": f"{ano_anterior}-{mes_anterior:02d}",
                    "total_actual": total_actual_ars,
                    "total_anterior": total_anterior_ars,
                    "incremento_porcentual": round(incremento_porcentual_ars, 2),
                    "incremento_absoluto": total_actual_ars - total_anterior_ars
                }
            })
    
    # Analizar por tipo de gasto
    tipos_gasto = [models.TipoGasto.FIJO, models.TipoGasto.ORDINARIO, models.TipoGasto.EXTRAORDINARIO]
    for tipo in tipos_gasto:
        gastos_tipo_actual = [g for g in gastos_actuales if g.tipo == tipo]
        gastos_tipo_anterior = [g for g in gastos_anteriores if g.tipo == tipo]
        
        total_tipo_actual = sum(g.monto for g in gastos_tipo_actual if g.moneda == models.TipoMoneda.PESOS)
        total_tipo_anterior = sum(g.monto for g in gastos_tipo_anterior if g.moneda == models.TipoMoneda.PESOS)
        
        if total_tipo_anterior > 0:
            incremento = ((total_tipo_actual - total_tipo_anterior) / total_tipo_anterior) * 100
            if incremento > 30:
                alertas.append({
                    "tipo": "incremento_gasto_tipo",
                    "severidad": "media",
                    "titulo": f"Incremento en gastos {tipo.value}",
                    "mensaje": f"Los gastos {tipo.value.lower()} aumentaron un {incremento:.1f}% respecto al mes anterior",
                    "detalle": {
                        "tipo_gasto": tipo.value,
                        "incremento_porcentual": round(incremento, 2),
                        "total_actual": total_tipo_actual,
                        "total_anterior": total_tipo_anterior
                    }
                })
    
    return alertas


def analizar_deudas(db: Session) -> List[Dict]:
    """Analiza deudas y genera alertas"""
    alertas = []
    
    # Analizar tarjetas de crédito
    tarjetas = db.query(models.TarjetaCredito).all()
    for tarjeta in tarjetas:
        porcentaje_uso = (tarjeta.saldo_actual / tarjeta.limite) * 100 if tarjeta.limite > 0 else 0
        
        if porcentaje_uso > 80:
            alertas.append({
                "tipo": "deuda_tarjeta",
                "severidad": "alta" if porcentaje_uso > 90 else "media",
                "titulo": f"Alto uso de tarjeta: {tarjeta.nombre}",
                "mensaje": f"La tarjeta {tarjeta.nombre} tiene un {porcentaje_uso:.1f}% de uso ({tarjeta.saldo_actual:.2f} {tarjeta.moneda.value} de {tarjeta.limite:.2f} {tarjeta.moneda.value})",
                "detalle": {
                    "tarjeta_id": tarjeta.id,
                    "nombre": tarjeta.nombre,
                    "saldo_actual": tarjeta.saldo_actual,
                    "limite": tarjeta.limite,
                    "porcentaje_uso": round(porcentaje_uso, 2)
                }
            })
    
    # Analizar préstamos
    prestamos = db.query(models.Prestamo).filter(models.Prestamo.activo == True).all()
    for prestamo in prestamos:
        porcentaje_pagado = (prestamo.monto_pagado / prestamo.monto_total) * 100 if prestamo.monto_total > 0 else 0
        saldo_pendiente = prestamo.monto_total - prestamo.monto_pagado
        
        # Alerta si falta poco para vencer y hay saldo pendiente
        if prestamo.fecha_vencimiento:
            dias_restantes = (prestamo.fecha_vencimiento - date.today()).days
            if dias_restantes < 30 and saldo_pendiente > 0:
                alertas.append({
                    "tipo": "prestamo_vencimiento",
                    "severidad": "alta",
                    "titulo": f"Préstamo próximo a vencer: {prestamo.nombre}",
                    "mensaje": f"El préstamo {prestamo.nombre} vence en {dias_restantes} días. Saldo pendiente: {saldo_pendiente:.2f} {prestamo.moneda.value}",
                    "detalle": {
                        "prestamo_id": prestamo.id,
                        "nombre": prestamo.nombre,
                        "fecha_vencimiento": prestamo.fecha_vencimiento.isoformat(),
                        "dias_restantes": dias_restantes,
                        "saldo_pendiente": saldo_pendiente
                    }
                })
    
    return alertas


def analizar_proyecciones_proximas(db: Session) -> List[Dict]:
    """Analiza proyecciones de pagos próximas"""
    alertas = []
    
    hoy = date.today()
    fecha_limite = hoy + timedelta(days=7)  # Próximos 7 días
    
    proyecciones = db.query(models.ProyeccionPago).filter(
        and_(
            models.ProyeccionPago.fecha_vencimiento <= fecha_limite,
            models.ProyeccionPago.fecha_vencimiento >= hoy,
            models.ProyeccionPago.pagado == False
        )
    ).all()
    
    total_proyecciones_ars = sum(p.monto_estimado for p in proyecciones if p.moneda == models.TipoMoneda.PESOS)
    total_proyecciones_usd = sum(p.monto_estimado for p in proyecciones if p.moneda == models.TipoMoneda.DOLARES)
    
    if proyecciones:
        alertas.append({
            "tipo": "proyecciones_proximas",
            "severidad": "media",
            "titulo": f"Pagos próximos a vencer",
            "mensaje": f"Tienes {len(proyecciones)} pagos próximos a vencer en los próximos 7 días. Total estimado: {total_proyecciones_ars:.2f} ARS, {total_proyecciones_usd:.2f} USD",
            "detalle": {
                "cantidad": len(proyecciones),
                "total_ars": total_proyecciones_ars,
                "total_usd": total_proyecciones_usd,
                "proyecciones": [{
                    "id": p.id,
                    "tipo": p.tipo,
                    "fecha": p.fecha_vencimiento.isoformat(),
                    "monto": p.monto_estimado,
                    "moneda": p.moneda.value,
                    "descripcion": p.descripcion
                } for p in proyecciones]
            }
        })
    
    return alertas


def analizar_saldo_negativo(db: Session, ano: int, mes: int) -> List[Dict]:
    """Analiza si hay saldo negativo en el mes"""
    alertas = []
    
    resumen = reports.saldos_positivos(db, ano, mes)
    
    if resumen["saldo"]["ars"] < 0:
        alertas.append({
            "tipo": "saldo_negativo",
            "severidad": "alta",
            "titulo": "Saldo negativo en el mes",
            "mensaje": f"El saldo del mes es negativo: {resumen['saldo']['ars']:.2f} ARS. Los egresos superan los ingresos.",
            "detalle": {
                "saldo_ars": resumen["saldo"]["ars"],
                "ingresos_ars": resumen["ingresos"]["total_ars"],
                "egresos_ars": resumen["egresos"]["total_ars"]
            }
        })
    
    return alertas


def analizar_tendencias(db: Session) -> Dict:
    """Analiza tendencias de los últimos 6 meses"""
    hoy = date.today()
    tendencias = {
        "gastos": [],
        "ingresos": [],
        "saldos": []
    }
    
    for i in range(6):
        mes = hoy.month - i
        ano = hoy.year
        
        if mes <= 0:
            mes += 12
            ano -= 1
        
        # Gastos
        gastos = db.query(models.Gasto).filter(
            and_(
                extract('year', models.Gasto.fecha) == ano,
                extract('month', models.Gasto.fecha) == mes
            )
        ).all()
        total_gastos = sum(g.monto for g in gastos if g.moneda == models.TipoMoneda.PESOS)
        
        # Ingresos
        ingresos = db.query(models.Ingreso).filter(
            and_(
                extract('year', models.Ingreso.fecha) == ano,
                extract('month', models.Ingreso.fecha) == mes
            )
        ).all()
        total_ingresos = sum(i.monto for i in ingresos if i.moneda == models.TipoMoneda.PESOS)
        
        saldo = total_ingresos - total_gastos
        
        tendencias["gastos"].append({
            "mes": f"{ano}-{mes:02d}",
            "total": total_gastos
        })
        tendencias["ingresos"].append({
            "mes": f"{ano}-{mes:02d}",
            "total": total_ingresos
        })
        tendencias["saldos"].append({
            "mes": f"{ano}-{mes:02d}",
            "total": saldo
        })
    
    # Calcular porcentajes de cambio
    if len(tendencias["gastos"]) >= 2:
        gasto_actual = tendencias["gastos"][0]["total"]
        gasto_anterior = tendencias["gastos"][1]["total"]
        if gasto_anterior > 0:
            tendencias["cambio_gastos"] = ((gasto_actual - gasto_anterior) / gasto_anterior) * 100
    
    if len(tendencias["ingresos"]) >= 2:
        ingreso_actual = tendencias["ingresos"][0]["total"]
        ingreso_anterior = tendencias["ingresos"][1]["total"]
        if ingreso_anterior > 0:
            tendencias["cambio_ingresos"] = ((ingreso_actual - ingreso_anterior) / ingreso_anterior) * 100
    
    return tendencias




