#!/usr/bin/env python3
"""
Script para procesar todas las tarjetas correctamente
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'bkd_finanzas'))

import requests
import pdf_processor
from datetime import datetime
import re

API_URL = 'http://localhost:8000/api'

def extraer_fechas_del_pdf(texto):
    """Extrae fechas de cierre y vencimiento del PDF"""
    # Formato: "28-Ago-25 05-Sep-25 02-Oct-25 13-Oct-25 30-Oct-25 07-Nov-25"
    # Tercera es cierre, cuarta es vencimiento
    match = re.search(r'(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})', texto)
    if match:
        fecha_cierre_str = match.group(3)
        fecha_vencimiento_str = match.group(4)
        fecha_cierre = pdf_processor.parsear_fecha_mastercard(fecha_cierre_str)
        fecha_vencimiento = pdf_processor.parsear_fecha_mastercard(fecha_vencimiento_str)
        if fecha_cierre and fecha_vencimiento:
            return fecha_cierre.day, fecha_vencimiento.day
    return 20, 25  # defaults

def crear_o_buscar_tarjeta(datos_pdf, texto_pdf):
    """Crea una tarjeta o la busca si ya existe"""
    banco = datos_pdf.get('banco', 'Tarjeta')
    fecha_cierre_dia, fecha_vencimiento_dia = extraer_fechas_del_pdf(texto_pdf)
    
    # Buscar tarjeta existente por banco
    tarjetas = requests.get(f'{API_URL}/tarjetas').json()
    for t in tarjetas:
        if t.get('banco', '').upper() == banco.upper():
            return t['id']
    
    # Crear nueva tarjeta
    monto_total = datos_pdf.get('monto_total', 0) or 0
    if monto_total > 2000000:
        limite = 5000000.0
    elif monto_total > 500000:
        limite = 3000000.0
    else:
        limite = 1000000.0
    
    tarjeta_data = {
        'nombre': banco,
        'banco': banco,
        'limite': limite,
        'moneda': 'ARS',
        'fecha_cierre': fecha_cierre_dia,
        'fecha_vencimiento': fecha_vencimiento_dia
    }
    
    response = requests.post(f'{API_URL}/tarjetas', json=tarjeta_data)
    return response.json()['id']

def procesar_pdf(ruta_pdf, tarjeta_id):
    """Procesa un PDF y lo asocia a una tarjeta"""
    with open(ruta_pdf, 'rb') as f:
        files = {'file': (os.path.basename(ruta_pdf), f, 'application/pdf')}
        response = requests.post(f'{API_URL}/pdf/procesar-liquidacion?tarjeta_id={tarjeta_id}', files=files)
    return response.json()

# PDFs a procesar organizados por tipo
pdfs_amex = [
    r'C:\Users\Administrator\Downloads\Resumen Octubre 2025-3.pdf',
    r'C:\Users\Administrator\Downloads\Resumen Octubre 2025-4.pdf',
]

pdfs_mastercard = [
    r'C:\Users\Administrator\Downloads\Resumen Octubre 2025-2.pdf',
]

pdfs_visa = [
    r'C:\Users\Administrator\Downloads\Resumen Noviembre 2025-2.pdf',
    r'C:\Users\Administrator\Downloads\Resumen Octubre 2025-5.pdf',
    r'C:\Users\Administrator\Downloads\Resumen Octubre 2025-6.pdf',
]

print("=== PROCESANDO TARJETAS ===\n")

# Procesar AMEX (consolidar en una sola tarjeta)
print("1. Procesando AMEX...")
tarjeta_amex_id = None
for ruta_pdf in pdfs_amex:
    if not os.path.exists(ruta_pdf):
        continue
    datos = pdf_processor.procesar_pdf_liquidacion(ruta_pdf)
    texto = pdf_processor.extraer_texto_pdf(ruta_pdf)
    
    if not tarjeta_amex_id:
        tarjeta_amex_id = crear_o_buscar_tarjeta(datos, texto)
        print(f"   Tarjeta AMEX ID: {tarjeta_amex_id}")
    
    resultado = procesar_pdf(ruta_pdf, tarjeta_amex_id)
    print(f"   {os.path.basename(ruta_pdf)}: {resultado.get('gastos_creados', 0)} gastos")

# Procesar Mastercard
print("\n2. Procesando Mastercard...")
for ruta_pdf in pdfs_mastercard:
    if not os.path.exists(ruta_pdf):
        continue
    datos = pdf_processor.procesar_pdf_liquidacion(ruta_pdf)
    texto = pdf_processor.extraer_texto_pdf(ruta_pdf)
    
    tarjeta_mc_id = crear_o_buscar_tarjeta(datos, texto)
    resultado = procesar_pdf(ruta_pdf, tarjeta_mc_id)
    print(f"   {os.path.basename(ruta_pdf)}: {resultado.get('gastos_creados', 0)} gastos")

# Procesar Visa - necesitamos identificar si son 2 tarjetas diferentes
print("\n3. Procesando Visa...")
# Primero, obtener los números de resumen o identificadores para distinguir
visa_tarjetas = {}
for ruta_pdf in pdfs_visa:
    if not os.path.exists(ruta_pdf):
        continue
    texto = pdf_processor.extraer_texto_pdf(ruta_pdf)
    # Buscar número de resumen para identificar tarjeta
    match = re.search(r'Resumen\s+N[o°]\s+([A-Z0-9]+)', texto, re.IGNORECASE)
    num_resumen = match.group(1) if match else None
    
    datos = pdf_processor.procesar_pdf_liquidacion(ruta_pdf)
    
    # Usar número de resumen o fecha para identificar tarjeta
    clave_tarjeta = num_resumen if num_resumen else os.path.basename(ruta_pdf)
    
    if clave_tarjeta not in visa_tarjetas:
        visa_id = crear_o_buscar_tarjeta(datos, texto)
        visa_tarjetas[clave_tarjeta] = visa_id
        print(f"   Visa identificada (clave: {clave_tarjeta[:20]}...): ID {visa_id}")
    
    resultado = procesar_pdf(ruta_pdf, visa_tarjetas[clave_tarjeta])
    print(f"   {os.path.basename(ruta_pdf)}: {resultado.get('gastos_creados', 0)} gastos")

# Resumen final
print("\n=== RESUMEN FINAL ===")
tarjetas = requests.get(f'{API_URL}/tarjetas').json()
total_pagos = 0
for t in sorted(tarjetas, key=lambda x: x.get('banco', '') + x['nombre']):
    if t['saldo_actual'] > 0:
        print(f"{t['nombre']} ({t.get('banco', 'N/A')}): ${t['saldo_actual']:,.2f}")
        total_pagos += t['saldo_actual']

print(f"\nTOTAL A PAGAR: ${total_pagos:,.2f}")




