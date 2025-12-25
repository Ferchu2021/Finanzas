from sqlalchemy.orm import Session
from sqlalchemy import and_, extract, func
from datetime import date
from typing import Dict, List
import models


def egresos_mensuales(db: Session, ano: int, mes: int) -> Dict:
    """Genera reporte de egresos mensuales"""
    gastos = db.query(models.Gasto).filter(
        and_(
            extract('year', models.Gasto.fecha) == ano,
            extract('month', models.Gasto.fecha) == mes
        )
    ).all()
    
    pagos_tarjetas = db.query(models.PagoTarjeta).filter(
        and_(
            extract('year', models.PagoTarjeta.fecha_pago) == ano,
            extract('month', models.PagoTarjeta.fecha_pago) == mes
        )
    ).all()
    
    pagos_prestamos = db.query(models.PagoPrestamo).filter(
        and_(
            extract('year', models.PagoPrestamo.fecha_pago) == ano,
            extract('month', models.PagoPrestamo.fecha_pago) == mes
        )
    ).all()
    
    # Calcular totales por moneda
    total_gastos_ars = sum(g.monto for g in gastos if g.moneda == models.TipoMoneda.PESOS)
    total_gastos_usd = sum(g.monto for g in gastos if g.moneda == models.TipoMoneda.DOLARES)
    
    total_tarjetas_ars = sum(p.monto for p in pagos_tarjetas)
    total_tarjetas_usd = 0  # Asumiendo que los pagos de tarjeta están en la misma moneda de la tarjeta
    
    total_prestamos_ars = sum(p.monto for p in pagos_prestamos)
    total_prestamos_usd = 0
    
    # Agrupar por tipo de gasto
    gastos_fijos = [g for g in gastos if g.tipo == models.TipoGasto.FIJO]
    gastos_ordinarios = [g for g in gastos if g.tipo == models.TipoGasto.ORDINARIO]
    gastos_extraordinarios = [g for g in gastos if g.tipo == models.TipoGasto.EXTRAORDINARIO]
    
    return {
        "ano": ano,
        "mes": mes,
        "totales": {
            "gastos_ars": total_gastos_ars,
            "gastos_usd": total_gastos_usd,
            "pagos_tarjetas_ars": total_tarjetas_ars,
            "pagos_prestamos_ars": total_prestamos_ars,
            "total_egresos_ars": total_gastos_ars + total_tarjetas_ars + total_prestamos_ars,
            "total_egresos_usd": total_gastos_usd + total_tarjetas_usd + total_prestamos_usd
        },
        "por_tipo": {
            "fijos": {
                "cantidad": len(gastos_fijos),
                "total_ars": sum(g.monto for g in gastos_fijos if g.moneda == models.TipoMoneda.PESOS),
                "total_usd": sum(g.monto for g in gastos_fijos if g.moneda == models.TipoMoneda.DOLARES)
            },
            "ordinarios": {
                "cantidad": len(gastos_ordinarios),
                "total_ars": sum(g.monto for g in gastos_ordinarios if g.moneda == models.TipoMoneda.PESOS),
                "total_usd": sum(g.monto for g in gastos_ordinarios if g.moneda == models.TipoMoneda.DOLARES)
            },
            "extraordinarios": {
                "cantidad": len(gastos_extraordinarios),
                "total_ars": sum(g.monto for g in gastos_extraordinarios if g.moneda == models.TipoMoneda.PESOS),
                "total_usd": sum(g.monto for g in gastos_extraordinarios if g.moneda == models.TipoMoneda.DOLARES)
            }
        },
        "detalle": {
            "gastos": [{"id": g.id, "fecha": g.fecha.isoformat(), "monto": g.monto, "moneda": g.moneda.value, "tipo": g.tipo.value, "categoria": g.categoria, "descripcion": g.descripcion} for g in gastos],
            "pagos_tarjetas": [{"id": p.id, "fecha": p.fecha_pago.isoformat(), "monto": p.monto, "descripcion": p.descripcion} for p in pagos_tarjetas],
            "pagos_prestamos": [{"id": p.id, "fecha": p.fecha_pago.isoformat(), "monto": p.monto, "descripcion": p.descripcion} for p in pagos_prestamos]
        }
    }


def saldos_positivos(db: Session, ano: int, mes: int) -> Dict:
    """Genera reporte de saldos positivos (ingresos - egresos)"""
    ingresos = db.query(models.Ingreso).filter(
        and_(
            extract('year', models.Ingreso.fecha) == ano,
            extract('month', models.Ingreso.fecha) == mes
        )
    ).all()
    
    egresos_data = egresos_mensuales(db, ano, mes)
    
    total_ingresos_ars = sum(i.monto for i in ingresos if i.moneda == models.TipoMoneda.PESOS)
    total_ingresos_usd = sum(i.monto for i in ingresos if i.moneda == models.TipoMoneda.DOLARES)
    
    total_egresos_ars = egresos_data["totales"]["total_egresos_ars"]
    total_egresos_usd = egresos_data["totales"]["total_egresos_usd"]
    
    saldo_ars = total_ingresos_ars - total_egresos_ars
    saldo_usd = total_ingresos_usd - total_egresos_usd
    
    # Agrupar ingresos por tipo
    ingresos_por_tipo = {}
    for ingreso in ingresos:
        tipo = ingreso.tipo.value
        if tipo not in ingresos_por_tipo:
            ingresos_por_tipo[tipo] = {"ars": 0, "usd": 0, "cantidad": 0}
        if ingreso.moneda == models.TipoMoneda.PESOS:
            ingresos_por_tipo[tipo]["ars"] += ingreso.monto
        else:
            ingresos_por_tipo[tipo]["usd"] += ingreso.monto
        ingresos_por_tipo[tipo]["cantidad"] += 1
    
    return {
        "ano": ano,
        "mes": mes,
        "ingresos": {
            "total_ars": total_ingresos_ars,
            "total_usd": total_ingresos_usd,
            "por_tipo": ingresos_por_tipo,
            "detalle": [{"id": i.id, "fecha": i.fecha.isoformat(), "monto": i.monto, "moneda": i.moneda.value, "tipo": i.tipo.value, "descripcion": i.descripcion} for i in ingresos]
        },
        "egresos": {
            "total_ars": total_egresos_ars,
            "total_usd": total_egresos_usd
        },
        "saldo": {
            "ars": saldo_ars,
            "usd": saldo_usd,
            "positivo": saldo_ars > 0 and saldo_usd >= 0
        }
    }


def resumen_mensual(db: Session, ano: int, mes: int) -> Dict:
    """Genera un resumen completo del mes"""
    saldos = saldos_positivos(db, ano, mes)
    egresos = egresos_mensuales(db, ano, mes)
    
    # Obtener proyecciones para el mes
    proyecciones = db.query(models.ProyeccionPago).filter(
        and_(
            extract('year', models.ProyeccionPago.fecha_vencimiento) == ano,
            extract('month', models.ProyeccionPago.fecha_vencimiento) == mes,
            models.ProyeccionPago.pagado == False
        )
    ).all()
    
    total_proyecciones_ars = sum(p.monto_estimado for p in proyecciones if p.moneda == models.TipoMoneda.PESOS)
    total_proyecciones_usd = sum(p.monto_estimado for p in proyecciones if p.moneda == models.TipoMoneda.DOLARES)
    
    return {
        **saldos,
        "proyecciones": {
            "total_ars": total_proyecciones_ars,
            "total_usd": total_proyecciones_usd,
            "cantidad": len(proyecciones),
            "detalle": [{"id": p.id, "fecha": p.fecha_vencimiento.isoformat(), "monto": p.monto_estimado, "moneda": p.moneda.value, "tipo": p.tipo, "descripcion": p.descripcion} for p in proyecciones]
        },
        "resumen_egresos": egresos
    }






