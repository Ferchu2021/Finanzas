#!/usr/bin/env python3
"""
Script para gestionar tarjetas y procesar PDFs
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'bkd_finanzas'))

import requests
import pdf_processor
from datetime import datetime

API_URL = 'http://localhost:8000/api'

def crear_tarjeta_desde_pdf(ruta_pdf):
    """Crea una tarjeta basándose en los datos del PDF"""
    datos = pdf_processor.procesar_pdf_liquidacion(ruta_pdf)
    
    banco = datos.get('banco', 'Tarjeta')
    fecha_cierre_str = datos.get('fecha_cierre')
    fecha_vencimiento_str = datos.get('fecha_vencimiento')
    
    # Extraer días de cierre y vencimiento
    fecha_cierre_dia = 20  # default
    fecha_vencimiento_dia = 25  # default
    
    if fecha_cierre_str:
        fecha_cierre_obj = datetime.fromisoformat(fecha_cierre_str).date()
        fecha_cierre_dia = fecha_cierre_obj.day
    
    if fecha_vencimiento_str:
        fecha_vencimiento_obj = datetime.fromisoformat(fecha_vencimiento_str).date()
        fecha_vencimiento_dia = fecha_vencimiento_obj.day
    else:
        # Intentar extraer de las fechas del PDF
        texto = pdf_processor.extraer_texto_pdf(ruta_pdf)
        # Formato: "28-Ago-25 05-Sep-25 02-Oct-25 13-Oct-25 30-Oct-25 07-Nov-25"
        # Tercera es cierre, cuarta es vencimiento
        import re
        match = re.search(r'(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})', texto)
        if match:
            fecha_cierre_str_pdf = match.group(3)
            fecha_vencimiento_str_pdf = match.group(4)
            fecha_cierre_obj = pdf_processor.parsear_fecha_mastercard(fecha_cierre_str_pdf)
            fecha_vencimiento_obj = pdf_processor.parsear_fecha_mastercard(fecha_vencimiento_str_pdf)
            if fecha_cierre_obj:
                fecha_cierre_dia = fecha_cierre_obj.day
            if fecha_vencimiento_obj:
                fecha_vencimiento_dia = fecha_vencimiento_obj.day
    
    # Estimar límite basado en el monto (si es grande, límite alto)
    monto_total = datos.get('monto_total', 0) or 0
    if monto_total > 1000000:
        limite = 5000000.0
    elif monto_total > 100000:
        limite = 1000000.0
    else:
        limite = 500000.0
    
    tarjeta_data = {
        'nombre': banco,
        'banco': banco,
        'limite': limite,
        'moneda': 'ARS',
        'fecha_cierre': fecha_cierre_dia,
        'fecha_vencimiento': fecha_vencimiento_dia
    }
    
    response = requests.post(f'{API_URL}/tarjetas', json=tarjeta_data)
    return response.json()

def listar_tarjetas():
    """Lista todas las tarjetas"""
    response = requests.get(f'{API_URL}/tarjetas')
    return response.json()

def procesar_pdf(ruta_pdf, tarjeta_id):
    """Procesa un PDF y lo asocia a una tarjeta"""
    with open(ruta_pdf, 'rb') as f:
        files = {'file': (os.path.basename(ruta_pdf), f, 'application/pdf')}
        response = requests.post(f'{API_URL}/pdf/procesar-liquidacion?tarjeta_id={tarjeta_id}', files=files)
    return response.json()

if __name__ == '__main__':
    # Obtener tarjetas existentes
    tarjetas = listar_tarjetas()
    print("\n=== Tarjetas existentes ===")
    for t in tarjetas:
        print(f"ID {t['id']}: {t['nombre']} ({t.get('banco', 'N/A')}) - Saldo: ${t['saldo_actual']:,.2f}")
    
    # Procesar PDFs
    pdfs = [
        r'C:\Users\Administrator\Downloads\Resumen Octubre 2025-2.pdf',
        r'C:\Users\Administrator\Downloads\Resumen Octubre 2025-4.pdf',
        r'C:\Users\Administrator\Downloads\Resumen Octubre 2025-3.pdf',
    ]
    
    print("\n=== Procesando PDFs ===")
    for ruta_pdf in pdfs:
        if not os.path.exists(ruta_pdf):
            print(f"Archivo no encontrado: {ruta_pdf}")
            continue
        
        print(f"\nProcesando: {os.path.basename(ruta_pdf)}")
        datos = pdf_processor.procesar_pdf_liquidacion(ruta_pdf)
        banco = datos.get('banco')
        
        if not banco:
            print(f"  No se pudo identificar el banco")
            continue
        
        # Buscar tarjeta existente por banco
        tarjeta_existente = None
        for t in tarjetas:
            if t.get('banco', '').upper() == banco.upper() or t['nombre'].upper() == banco.upper():
                tarjeta_existente = t
                break
        
        if tarjeta_existente:
            print(f"  Usando tarjeta existente: {tarjeta_existente['nombre']} (ID {tarjeta_existente['id']})")
            tarjeta_id = tarjeta_existente['id']
        else:
            print(f"  Creando nueva tarjeta: {banco}")
            nueva_tarjeta = crear_tarjeta_desde_pdf(ruta_pdf)
            tarjeta_id = nueva_tarjeta['id']
            tarjetas = listar_tarjetas()  # Actualizar lista
        
        # Procesar PDF
        try:
            resultado = procesar_pdf(ruta_pdf, tarjeta_id)
            print(f"  OK Procesado: {resultado.get('gastos_creados', 0)} gastos creados")
        except Exception as e:
            print(f"  ERROR: {str(e)}")
    
    # Resumen final
    print("\n=== RESUMEN FINAL ===")
    tarjetas_final = listar_tarjetas()
    total_pagos = 0
    for t in tarjetas_final:
        if t['saldo_actual'] > 0:
            print(f"{t['nombre']} ({t.get('banco', 'N/A')}): ${t['saldo_actual']:,.2f}")
            total_pagos += t['saldo_actual']
    
    print(f"\nTOTAL A PAGAR: ${total_pagos:,.2f}")

