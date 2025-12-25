#!/usr/bin/env python3
"""
Script para procesar imágenes JPEG y extraer información de préstamos usando OCR
"""
import sys
import os
from pathlib import Path
import re
from datetime import datetime

try:
    import easyocr
    OCR_METHOD = 'easyocr'
except ImportError:
    try:
        import pytesseract
        from PIL import Image
        OCR_METHOD = 'pytesseract'
    except ImportError:
        print("Error: Necesitas instalar easyocr o pytesseract")
        print("pip install easyocr")
        print("O: pip install pytesseract pillow")
        sys.exit(1)

# Inicializar el reader de easyocr una sola vez (es costoso)
reader = None

def extraer_texto_imagen(ruta_imagen):
    """Extrae texto de una imagen usando OCR"""
    global reader
    try:
        if OCR_METHOD == 'easyocr':
            if reader is None:
                print("Inicializando EasyOCR (esto puede tardar la primera vez)...")
                reader = easyocr.Reader(['es', 'en'])
            resultados = reader.readtext(ruta_imagen)
            texto = '\n'.join([resultado[1] for resultado in resultados])
        else:  # pytesseract
            imagen = Image.open(ruta_imagen)
            texto = pytesseract.image_to_string(imagen, lang='spa')
        return texto
    except Exception as e:
        print(f"Error al procesar {ruta_imagen}: {str(e)}")
        return ""

def extraer_datos_prestamo(texto_completo):
    """Extrae datos del préstamo del texto"""
    datos = {
        'nombre': None,
        'prestamista': None,
        'monto_total': None,
        'monto_pagado': None,
        'saldo_pendiente': None,
        'tasa_interes': None,
        'cuota_mensual': None,
        'fecha_inicio': None,
        'fecha_vencimiento': None,
        'plazo': None,
        'descripcion': None
    }
    
    texto_upper = texto_completo.upper()
    
    # Buscar montos
    patrones_monto = [
        r'MONTO[:\s]+[\$]?\s*([\d.,]+)',
        r'TOTAL[:\s]+[\$]?\s*([\d.,]+)',
        r'CAPITAL[:\s]+[\$]?\s*([\d.,]+)',
    ]
    
    for patron in patrones_monto:
        match = re.search(patron, texto_completo, re.IGNORECASE)
        if match:
            monto_str = match.group(1).replace('.', '').replace(',', '.')
            try:
                datos['monto_total'] = float(monto_str)
                break
            except:
                pass
    
    # Buscar monto pagado
    patrones_pagado = [
        r'PAGADO[:\s]+[\$]?\s*([\d.,]+)',
        r'AMORTIZADO[:\s]+[\$]?\s*([\d.,]+)',
    ]
    
    for patron in patrones_pagado:
        match = re.search(patron, texto_completo, re.IGNORECASE)
        if match:
            monto_str = match.group(1).replace('.', '').replace(',', '.')
            try:
                datos['monto_pagado'] = float(monto_str)
                break
            except:
                pass
    
    # Buscar saldo pendiente
    patrones_saldo = [
        r'SALDO[:\s]+[\$]?\s*([\d.,]+)',
        r'PENDIENTE[:\s]+[\$]?\s*([\d.,]+)',
        r'DEUDA[:\s]+[\$]?\s*([\d.,]+)',
    ]
    
    for patron in patrones_saldo:
        match = re.search(patron, texto_completo, re.IGNORECASE)
        if match:
            monto_str = match.group(1).replace('.', '').replace(',', '.')
            try:
                datos['saldo_pendiente'] = float(monto_str)
                break
            except:
                pass
    
    # Buscar cuota mensual
    patrones_cuota = [
        r'CUOTA[:\s]+[\$]?\s*([\d.,]+)',
        r'PAGO\s+MENSUAL[:\s]+[\$]?\s*([\d.,]+)',
        r'VALOR\s+CUOTA[:\s]+[\$]?\s*([\d.,]+)',
    ]
    
    for patron in patrones_cuota:
        match = re.search(patron, texto_completo, re.IGNORECASE)
        if match:
            monto_str = match.group(1).replace('.', '').replace(',', '.')
            try:
                datos['cuota_mensual'] = float(monto_str)
                break
            except:
                pass
    
    # Buscar tasa de interés
    patrones_tasa = [
        r'TASA[:\s]+([\d.,]+)\s*%',
        r'INTERES[:\s]+([\d.,]+)\s*%',
        r'TNA[:\s]+([\d.,]+)\s*%',
        r'TEA[:\s]+([\d.,]+)\s*%',
    ]
    
    for patron in patrones_tasa:
        match = re.search(patron, texto_completo, re.IGNORECASE)
        if match:
            tasa_str = match.group(1).replace(',', '.')
            try:
                datos['tasa_interes'] = float(tasa_str)
                break
            except:
                pass
    
    # Buscar fechas
    patron_fecha = r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})'
    fechas = re.findall(patron_fecha, texto_completo)
    
    if fechas:
        # Usar la primera fecha como fecha de inicio
        try:
            d, m, y = fechas[0]
            y = int(y) if len(y) == 4 else 2000 + int(y)
            datos['fecha_inicio'] = datetime(y, int(m), int(d)).date().isoformat()
        except:
            pass
        
        # Usar la última fecha como fecha de vencimiento
        if len(fechas) > 1:
            try:
                d, m, y = fechas[-1]
                y = int(y) if len(y) == 4 else 2000 + int(y)
                datos['fecha_vencimiento'] = datetime(y, int(m), int(d)).date().isoformat()
            except:
                pass
    
    # Buscar nombre/prestamista
    if 'PRESTAMO' in texto_upper or 'CREDITO' in texto_upper:
        lineas = texto_completo.split('\n')
        for linea in lineas[:10]:  # Primeras líneas
            linea_clean = linea.strip()
            if len(linea_clean) > 5 and len(linea_clean) < 100:
                if not re.search(r'\d{4,}', linea_clean):  # No tiene muchos números
                    datos['nombre'] = linea_clean
                    break
    
    return datos

def procesar_imagenes_prestamo(rutas_imagenes):
    """Procesa múltiples imágenes y combina el texto"""
    texto_completo = ""
    
    for ruta in rutas_imagenes:
        if os.path.exists(ruta):
            print(f"Procesando: {os.path.basename(ruta)}...")
            texto = extraer_texto_imagen(ruta)
            texto_completo += texto + "\n\n"
        else:
            print(f"Archivo no encontrado: {ruta}")
    
    return texto_completo

if __name__ == '__main__':
    rutas_imagenes = [
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.48 PM.jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.48 PM (1).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.48 PM (2).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.49 PM.jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.49 PM (1).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.49 PM (2).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.49 PM (3).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.49 PM (4).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.50 PM.jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.50 PM (1).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.50 PM (2).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.50 PM (3).jpeg',
    ]
    
    print("=== PROCESANDO IMAGENES DEL PRESTAMO ===\n")
    texto_completo = procesar_imagenes_prestamo(rutas_imagenes)
    
    print("\n=== TEXTO EXTRAIDO (primeros 2000 caracteres) ===")
    print(texto_completo[:2000])
    
    print("\n=== DATOS DEL PRESTAMO EXTRAIDOS ===")
    datos = extraer_datos_prestamo(texto_completo)
    for key, value in datos.items():
        if value:
            print(f"{key}: {value}")

