import pdfplumber
import re
from datetime import datetime, date
from typing import Dict, List, Optional
from decimal import Decimal


def extraer_texto_pdf(archivo_pdf) -> str:
    """Extrae todo el texto de un PDF"""
    texto_completo = ""
    try:
        with pdfplumber.open(archivo_pdf) as pdf:
            for pagina in pdf.pages:
                texto = pagina.extract_text()
                if texto:
                    texto_completo += texto + "\n"
    except Exception as e:
        raise Exception(f"Error al leer el PDF: {str(e)}")
    
    return texto_completo


def extraer_fecha_liquidacion(texto: str) -> Optional[date]:
    """Extrae la fecha de liquidación del texto"""
    # Patrones comunes para fechas de liquidación
    patrones = [
        r'Liquidaci[oó]n\s+del\s+(\d{1,2})[/-](\d{1,2})[/-](\d{4})',
        r'Per[ií]odo\s+(\d{1,2})[/-](\d{1,2})[/-](\d{4})',
        r'Fecha\s+de\s+cierre[:\s]+(\d{1,2})[/-](\d{1,2})[/-](\d{4})',
        r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',  # Formato genérico DD/MM/YYYY o MM/DD/YYYY
    ]
    
    for patron in patrones:
        match = re.search(patron, texto, re.IGNORECASE)
        if match:
            try:
                if len(match.groups()) == 3:
                    d, m, y = match.groups()
                    # Intentar formato DD/MM/YYYY primero
                    try:
                        return date(int(y), int(m), int(d))
                    except:
                        # Si falla, intentar MM/DD/YYYY
                        return date(int(y), int(d), int(m))
            except:
                continue
    
    return None


def extraer_monto_total(texto: str) -> Optional[float]:
    """Extrae el monto total de la liquidación"""
    # Patrones comunes para montos totales
    patrones = [
        r'Total\s+a\s+pagar[:\s]+[\$]?\s*([\d.,]+)',
        r'Total\s+general[:\s]+[\$]?\s*([\d.,]+)',
        r'Importe\s+total[:\s]+[\$]?\s*([\d.,]+)',
        r'Total[:\s]+[\$]?\s*([\d.,]+)',
        r'[\$]\s*([\d.,]+)\s*Total',
    ]
    
    for patron in patrones:
        match = re.search(patron, texto, re.IGNORECASE)
        if match:
            try:
                monto_str = match.group(1).replace('.', '').replace(',', '.')
                return float(monto_str)
            except:
                continue
    
    return None


def extraer_movimientos(texto: str) -> List[Dict]:
    """Extrae los movimientos/transacciones del PDF"""
    movimientos = []
    
    # Buscar secciones de movimientos
    # Patrón común: fecha, descripción, monto
    lineas = texto.split('\n')
    
    # Buscar líneas que parezcan movimientos (contienen fecha y monto)
    patron_movimiento = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([\d.,]+)'
    
    for linea in lineas:
        match = re.search(patron_movimiento, linea)
        if match:
            try:
                fecha_str = match.group(1)
                descripcion = match.group(2).strip()
                monto_str = match.group(3).replace('.', '').replace(',', '.')
                monto = float(monto_str)
                
                # Parsear fecha
                try:
                    partes_fecha = fecha_str.split('/')
                    if len(partes_fecha) == 3:
                        d, m, y = partes_fecha
                        if len(y) == 2:
                            y = '20' + y
                        fecha = date(int(y), int(m), int(d))
                    else:
                        continue
                except:
                    continue
                
                movimientos.append({
                    'fecha': fecha,
                    'descripcion': descripcion,
                    'monto': monto
                })
            except:
                continue
    
    return movimientos


def extraer_datos_tarjeta(texto: str) -> Dict:
    """Extrae información de la tarjeta del PDF"""
    datos = {
        'numero_tarjeta': None,
        'banco': None,
        'titular': None,
        'fecha_cierre': None,
        'fecha_vencimiento': None,
        'monto_total': None,
        'monto_minimo': None,
    }
    
    # Buscar número de tarjeta (últimos 4 dígitos)
    match = re.search(r'(\d{4})\s*\*{4,}', texto)
    if match:
        datos['numero_tarjeta'] = match.group(1)
    
    # Buscar banco
    bancos_comunes = ['VISA', 'MASTERCARD', 'AMEX', 'NARANJA', 'CABAL', 'ARGENCARD']
    for banco in bancos_comunes:
        if banco.lower() in texto.lower():
            datos['banco'] = banco
            break
    
    # Buscar titular
    match = re.search(r'Titular[:\s]+([A-Z\s]+)', texto, re.IGNORECASE)
    if match:
        datos['titular'] = match.group(1).strip()
    
    # Buscar fecha de cierre
    match = re.search(r'Cierre[:\s]+(\d{1,2})[/-](\d{1,2})[/-](\d{4})', texto, re.IGNORECASE)
    if match:
        try:
            d, m, y = match.groups()
            datos['fecha_cierre'] = date(int(y), int(m), int(d))
        except:
            pass
    
    # Buscar fecha de vencimiento
    match = re.search(r'Vencimiento[:\s]+(\d{1,2})[/-](\d{1,2})[/-](\d{4})', texto, re.IGNORECASE)
    if match:
        try:
            d, m, y = match.groups()
            datos['fecha_vencimiento'] = date(int(y), int(m), int(d))
        except:
            pass
    
    # Buscar monto mínimo
    match = re.search(r'Pago\s+m[ií]nimo[:\s]+[\$]?\s*([\d.,]+)', texto, re.IGNORECASE)
    if match:
        try:
            monto_str = match.group(1).replace('.', '').replace(',', '.')
            datos['monto_minimo'] = float(monto_str)
        except:
            pass
    
    return datos


def procesar_pdf_liquidacion(archivo_pdf) -> Dict:
    """Procesa un PDF de liquidación de tarjeta y extrae la información"""
    texto = extraer_texto_pdf(archivo_pdf)
    
    datos_tarjeta = extraer_datos_tarjeta(texto)
    fecha_liquidacion = extraer_fecha_liquidacion(texto)
    monto_total = extraer_monto_total(texto)
    movimientos = extraer_movimientos(texto)
    
    # Si no encontramos monto total pero tenemos movimientos, calcularlo
    if not monto_total and movimientos:
        monto_total = sum(m['monto'] for m in movimientos)
    
    return {
        'fecha_liquidacion': fecha_liquidacion.isoformat() if fecha_liquidacion else None,
        'monto_total': monto_total,
        'monto_minimo': datos_tarjeta.get('monto_minimo'),
        'numero_tarjeta': datos_tarjeta.get('numero_tarjeta'),
        'banco': datos_tarjeta.get('banco'),
        'titular': datos_tarjeta.get('titular'),
        'fecha_cierre': datos_tarjeta.get('fecha_cierre').isoformat() if datos_tarjeta.get('fecha_cierre') else None,
        'fecha_vencimiento': datos_tarjeta.get('fecha_vencimiento').isoformat() if datos_tarjeta.get('fecha_vencimiento') else None,
        'movimientos': movimientos,
        'texto_extraido': texto[:1000]  # Primeros 1000 caracteres para debugging
    }


