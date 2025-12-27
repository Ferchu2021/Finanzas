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
                reader = easyocr.Reader(['es', 'en'], gpu=False)
            resultados = reader.readtext(ruta_imagen)
            texto = '\n'.join([resultado[1] for resultado in resultados])
        else:  # pytesseract
            imagen = Image.open(ruta_imagen)
            texto = pytesseract.image_to_string(imagen, lang='spa')
        return texto
    except Exception as e:
        error_msg = str(e)
        # Evitar errores de codificación al imprimir
        try:
            print(f"Error al procesar {os.path.basename(ruta_imagen)}: {error_msg}")
        except:
            print(f"Error al procesar imagen")
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
    
    # Buscar montos totales (buscar los más grandes que sean razonables para un préstamo)
    patrones_monto = [
        r'MONTO[:\s]+[\$]?\s*([\d.,]+)',
        r'TOTAL[:\s]+[\$]?\s*([\d.,]+)',
        r'CAPITAL[:\s]+[\$]?\s*([\d.,]+)',
        r'PRESTAMO[:\s]+[\$]?\s*([\d.,]+)',
    ]
    
    montos_totales = []
    for patron in patrones_monto:
        matches = re.finditer(patron, texto_completo, re.IGNORECASE)
        for match in matches:
            monto_str = match.group(1).replace('.', '').replace(',', '.')
            try:
                monto = float(monto_str)
                # Filtrar montos razonables (mayores a $100,000 para préstamos grandes)
                if 100000 < monto < 100000000:
                    montos_totales.append(monto)
            except:
                pass
    
    if montos_totales:
        # Usar el monto más grande encontrado como monto total
        datos['monto_total'] = max(montos_totales)
    
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
    
    # Buscar cuota mensual (buscar montos después de "Cuota X" y estado como "Pagada"/"Vencer")
    # Patrón: "Cuota X\nEstado\n$monto" o "$monto\nCuota X"
    patrones_cuota = [
        r'CUOTA\s+\d+.*?\n.*?\n.*?\$([\d.,]+)',  # Cuota X, estado, $monto
        r'\$([\d.,]+)\s*\n.*?CUOTA\s+\d+',  # $monto, luego Cuota X
        r'CUOTA[:\s]+\d+[:\s]+[\$]?\s*([\d.,]+)',  # Cuota X: $monto
        r'PAGO\s+MENSUAL[:\s]+[\$]?\s*([\d.,]+)',
        r'VALOR\s+CUOTA[:\s]+[\$]?\s*([\d.,]+)',
    ]
    
    for patron in patrones_cuota:
        matches = re.finditer(patron, texto_completo, re.IGNORECASE | re.MULTILINE)
        montos_cuota = []
        for match in matches:
            monto_str = match.group(1).replace('.', '').replace(',', '.')
            try:
                monto = float(monto_str)
                if 1000 < monto < 10000000:  # Validar rango razonable para cuotas
                    montos_cuota.append(monto)
            except:
                pass
        if montos_cuota:
            # Usar el monto más común o el promedio
            datos['cuota_mensual'] = sum(montos_cuota) / len(montos_cuota)
            break
    
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
        
        # Usar la fecha más reciente como fecha de vencimiento (filtrar fechas futuras razonables)
        fechas_parseadas = []
        for fecha_match in fechas:
            try:
                d, m, y = fecha_match
                y = int(y) if len(y) == 4 else (2000 + int(y) if int(y) < 100 else int(y))
                fecha_obj = datetime(y, int(m), int(d)).date()
                # Solo fechas futuras razonables (hasta 2050)
                if fecha_obj.year <= 2050:
                    fechas_parseadas.append((fecha_obj, fecha_match))
            except:
                pass
        
        if fechas_parseadas:
            # Ordenar por fecha y usar la más reciente
            fechas_parseadas.sort(key=lambda x: x[0], reverse=True)
            fecha_venc_obj, (d, m, y) = fechas_parseadas[0]
            datos['fecha_vencimiento'] = fecha_venc_obj.isoformat()
    
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
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.50 PM (3).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.50 PM (2).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.50 PM (1).jpeg',
        r'C:\Users\Administrator\Downloads\WhatsApp Image 2025-12-25 at 1.19.50 PM.jpeg',
    ]
    
    print("=== PROCESANDO IMAGENES DEL PRESTAMO ===\n")
    texto_completo = procesar_imagenes_prestamo(rutas_imagenes)
    
    print("\n=== TEXTO EXTRAIDO (primeros 2000 caracteres) ===")
    try:
        print(texto_completo[:2000] if texto_completo else "(Sin texto extraído)")
    except:
        print("(Error al mostrar el texto)")
    
    print("\n=== DATOS DEL PRESTAMO EXTRAIDOS ===")
    datos = extraer_datos_prestamo(texto_completo)
    datos_extraidos = False
    for key, value in datos.items():
        if value:
            try:
                print(f"{key}: {value}")
                datos_extraidos = True
            except:
                pass
    
    if not datos_extraidos:
        print("No se pudieron extraer datos del préstamo.")
        print("\nEl texto extraído está vacío o no contiene información reconocible.")
        print("Intenta:")
        print("1. Asegurarte de que las imágenes estén claras y legibles")
        print("2. Verificar que las imágenes contengan texto")
        print("3. Procesar las imágenes de una en una para identificar problemas")
    
    # Guardar en archivo de texto para revisión
    try:
        with open('prestamo_extraido.txt', 'w', encoding='utf-8') as f:
            f.write("=== TEXTO EXTRAIDO ===\n\n")
            f.write(texto_completo)
            f.write("\n\n=== DATOS EXTRAIDOS ===\n\n")
            for key, value in datos.items():
                if value:
                    f.write(f"{key}: {value}\n")
        print(f"\n✓ Texto y datos guardados en: prestamo_extraido.txt")
    except Exception as e:
        print(f"\nNo se pudo guardar el archivo: {str(e)}")

