import pdfplumber
import re
from datetime import datetime, date
from typing import Dict, List, Optional
from decimal import Decimal

# Mapeo de meses en español
MESES_ESPANOL = {
    'ene': 1, 'jan': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'apr': 4,
    'may': 5, 'jun': 6, 'jul': 7, 'ago': 8, 'aug': 8, 'sep': 9,
    'oct': 10, 'nov': 11, 'dic': 12, 'dec': 12
}


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


def parsear_fecha_mastercard(fecha_str: str) -> Optional[date]:
    """Parsea fechas en formato DD-MMM-YY de Mastercard"""
    # Formato: 20-Nov-25, 16-Ago-25, etc.
    patron = r'(\d{1,2})-([A-Za-z]{3})-(\d{2})'
    match = re.match(patron, fecha_str.strip())
    if match:
        try:
            d = int(match.group(1))
            mes_str = match.group(2).lower()
            y = int(match.group(3))
            # Ajustar año (asumimos años 2000+)
            if y < 100:
                y = 2000 + y
            mes = MESES_ESPANOL.get(mes_str)
            if mes:
                return date(y, mes, d)
        except:
            pass
    return None


def extraer_fecha_liquidacion(texto: str) -> Optional[date]:
    """Extrae la fecha de liquidación del texto"""
    # Buscar formato Mastercard específico: fecha de cierre en la línea de fechas
    # Formato: "23-Oct-25 03-Nov-25 20-Nov-25 01-Dic-25 24-Dic-25 05-Ene-26"
    # La tercera fecha suele ser la fecha de cierre/cierre del período
    match = re.search(r'(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})', texto)
    if match:
        fecha_str = match.group(3)  # Tercera fecha (fecha de cierre)
        fecha = parsear_fecha_mastercard(fecha_str)
        if fecha:
            return fecha
    
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


def convertir_monto_argentino(monto_str: str) -> Optional[float]:
    """Convierte monto en formato argentino (1.234,56) a float"""
    try:
        # Formato argentino: punto para miles, coma para decimales
        # Ejemplo: "3.661.880,58" -> 3661880.58
        monto_str = monto_str.strip().replace('$', '').strip()
        # Remover puntos (separadores de miles) y cambiar coma por punto
        monto_str = monto_str.replace('.', '').replace(',', '.')
        return float(monto_str)
    except:
        return None


def extraer_monto_total(texto: str) -> Optional[float]:
    """Extrae el monto total de la liquidación"""
    # Patrón específico de Mastercard: "TOTAL A PAGAR 3.661.880,58 0,00"
    patrones = [
        r'TOTAL\s+A\s+PAGAR\s+([\d.,]+)',  # Formato Mastercard
        r'Total\s+a\s+pagar[:\s]+[\$]?\s*([\d.,]+)',
        r'Total\s+general[:\s]+[\$]?\s*([\d.,]+)',
        r'Importe\s+total[:\s]+[\$]?\s*([\d.,]+)',
        r'Total[:\s]+[\$]?\s*([\d.,]+)',
        r'[\$]\s*([\d.,]+)\s*Total',
    ]
    
    for patron in patrones:
        match = re.search(patron, texto, re.IGNORECASE)
        if match:
            monto = convertir_monto_argentino(match.group(1))
            if monto:
                return monto
    
    return None


def extraer_movimientos(texto: str) -> List[Dict]:
    """Extrae los movimientos/transacciones del PDF"""
    movimientos = []
    lineas = texto.split('\n')
    
    # Buscar sección "DETALLE DEL CONSUMO" para Mastercard
    inicio_detalle = False
    dentro_detalle = False
    
    for i, linea in enumerate(lineas):
        # Detectar inicio de la sección de movimientos
        if 'DETALLE DEL CONSUMO' in linea.upper() or 'CUOTAS DEL MES' in linea.upper():
            inicio_detalle = True
            dentro_detalle = True
            continue
        
        # Si encontramos subtotales o totales después del detalle, terminar
        if dentro_detalle and ('SUBTOTAL' in linea.upper() or 'TOTAL' in linea.upper()):
            if 'TOTAL A PAGAR' not in linea.upper():  # No terminar en el total final
                dentro_detalle = False
                continue
        
        if dentro_detalle:
            # Formato Mastercard: "16-Ago-25 MERPAGO*PUMA 04/06 00229 57.561,75"
            # También puede tener signo negativo: "20-Abr-24 PERFUMERIAS JULERIAQUE 10/12 03491 -450,00"
            # Patrón mejorado: fecha (DD-MMM-YY) seguido de descripción y monto (puede tener signo)
            # Buscar fecha al inicio de la línea
            patron_fecha = r'^(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(.+)$'
            match = re.match(patron_fecha, linea.strip())
            
            if match:
                try:
                    fecha_str = match.group(1)
                    resto = match.group(2).strip()
                    
                    # Buscar monto al final (puede tener signo negativo)
                    # El monto está al final, puede tener formato: "-450,00" o "57.561,75"
                    patron_monto = r'([-]?[\d.,]+)\s*$'
                    match_monto = re.search(patron_monto, resto)
                    
                    if match_monto:
                        monto_str = match_monto.group(1)
                        fecha = parsear_fecha_mastercard(fecha_str)
                        monto = convertir_monto_argentino(monto_str.replace('-', ''))  # Remover signo para conversión
                        
                        # Si el monto original tenía signo negativo, mantenerlo
                        if monto_str.strip().startswith('-'):
                            monto = -monto
                        
                        if fecha and monto is not None and monto != 0:
                            # Extraer descripción (todo menos el monto y info de cuotas/números)
                            descripcion_completa = resto[:match_monto.start()].strip()
                            
                            # Extraer información de cuotas antes de limpiar (formato: XX/YY)
                            info_cuotas = None
                            match_cuotas = re.search(r'(\d{1,2}/\d{1,2})', descripcion_completa)
                            if match_cuotas:
                                info_cuotas = match_cuotas.group(1)
                            
                            # Limpiar descripción: remover números de comprobante (5 dígitos) pero preservar cuotas
                            # Primero, intentar capturar descripción completa incluyendo cuotas
                            descripcion_limpia = descripcion_completa
                            
                            # Remover números de comprobante (5 dígitos seguidos)
                            descripcion_limpia = re.sub(r'\b\d{5}\b', '', descripcion_limpia).strip()
                            
                            # Si la descripción parece incompleta (muy corta o termina en "al", "de", etc.), 
                            # intentar buscar en la línea siguiente
                            if len(descripcion_limpia) < 10 or descripcion_limpia.lower().endswith((' al', ' de', ' en', ' con')):
                                # Buscar en la siguiente línea si existe
                                if i + 1 < len(lineas):
                                    siguiente_linea = lineas[i + 1].strip()
                                    # Si la siguiente línea no tiene fecha ni monto, puede ser continuación
                                    if not re.match(r'^\d{1,2}-[A-Za-z]{3}-\d{2}', siguiente_linea) and not re.search(r'([-]?[\d.,]+)\s*$', siguiente_linea):
                                        descripcion_limpia = (descripcion_limpia + ' ' + siguiente_linea).strip()
                            
                            # Normalizar espacios
                            descripcion_limpia = re.sub(r'\s+', ' ', descripcion_limpia).strip()
                            
                            # Si tenemos información de cuotas, agregarla a la descripción
                            if info_cuotas:
                                descripcion_final = f"{descripcion_limpia} (Cuota {info_cuotas})"
                            else:
                                descripcion_final = descripcion_limpia
                            
                            # Si la descripción está vacía o es muy corta, usar un placeholder
                            if not descripcion_final or len(descripcion_final) < 3:
                                descripcion_final = "Compra sin descripción"
                            
                            movimientos.append({
                                'fecha': fecha,
                                'descripcion': descripcion_final,
                                'monto': abs(monto),  # Usar valor absoluto para gastos
                                'cuotas': info_cuotas  # Guardar info de cuotas por separado
                            })
                except Exception as e:
                    continue
            
            # También buscar formato genérico DD/MM/YYYY
            patron_generico = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([\d.,]+)'
            match = re.search(patron_generico, linea)
            if match and not any(c.isalpha() for c in match.group(1) if '-' in match.group(1)):
                try:
                    fecha_str = match.group(1)
                    descripcion = match.group(2).strip()
                    monto_str = match.group(3)
                    
                    # Parsear fecha genérica
                    partes_fecha = re.split(r'[/-]', fecha_str)
                    if len(partes_fecha) == 3:
                        d, m, y = partes_fecha
                        y = int(y) if len(y) == 4 else 2000 + int(y)
                        fecha = date(y, int(m), int(d))
                    else:
                        continue
                    
                    monto = convertir_monto_argentino(monto_str)
                    if fecha and monto and monto != 0:
                        movimientos.append({
                            'fecha': fecha,
                            'descripcion': descripcion,
                            'monto': abs(monto)
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
    
    # Buscar banco/tipo de tarjeta
    texto_upper = texto.upper()
    
    # Buscar AMERICAN EXPRESS primero (antes de AMEX genérico)
    if 'AMERICAN EXPRESS' in texto_upper or 'AMEX' in texto_upper:
        datos['banco'] = 'AMEX'
    elif 'MASTERCARD' in texto_upper:
        datos['banco'] = 'MASTERCARD'
        # Buscar tipo específico de Mastercard
        if 'PLATINUM' in texto_upper:
            datos['banco'] = 'MASTERCARD PLATINUM'
        elif 'GOLD' in texto_upper:
            datos['banco'] = 'MASTERCARD GOLD'
    elif 'VISA' in texto_upper:
        datos['banco'] = 'VISA'
        # Buscar tipo específico de Visa
        if 'BLACK' in texto_upper:
            datos['banco'] = 'VISA BLACK'
        elif 'PLATINUM' in texto_upper:
            datos['banco'] = 'VISA PLATINUM'
        elif 'GOLD' in texto_upper:
            datos['banco'] = 'VISA GOLD'
    elif 'NARANJA' in texto_upper:
        datos['banco'] = 'NARANJA'
    elif 'CABAL' in texto_upper:
        datos['banco'] = 'CABAL'
    elif 'ARGENCARD' in texto_upper:
        datos['banco'] = 'ARGENCARD'
    
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
    
    # Buscar monto mínimo - formato Mastercard específico
    # En Mastercard aparece como "PAGO MINIMO" seguido de límites
    # Luego en una línea separada aparece el monto
    patrones_minimo = [
        r'PAGO\s+MINIMO[^\d]*[\$]?\s*([\d.,]+)',  # Formato directo
        r'Pago\s+m[ií]nimo[:\s]+[\$]?\s*([\d.,]+)',  # Formato genérico
    ]
    for patron in patrones_minimo:
        match = re.search(patron, texto, re.IGNORECASE)
        if match:
            monto = convertir_monto_argentino(match.group(1))
            if monto:
                datos['monto_minimo'] = monto
                break
    
    # Si no encontramos mínimo directo, buscar en la línea de límites
    if not datos['monto_minimo']:
        # Buscar línea con límites: "$ 1.510.840,00 $ 3.000.000,00 $ 3.000.000,00"
        match = re.search(r'PAGO\s+MINIMO[^\n]*\n[^\n]*[\$]?\s*([\d.,]+)', texto, re.IGNORECASE | re.MULTILINE)
        if match:
            monto = convertir_monto_argentino(match.group(1))
            if monto:
                datos['monto_minimo'] = monto
    
    # Buscar fechas de cierre y vencimiento en formato Mastercard
    # Formato: "23-Oct-25 03-Nov-25 20-Nov-25 01-Dic-25 24-Dic-25 05-Ene-26"
    match = re.search(r'(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d{1,2}-[A-Za-z]{3}-\d{2})', texto)
    if match:
        # Tercera fecha es fecha de cierre, cuarta es fecha de vencimiento
        fecha_cierre = parsear_fecha_mastercard(match.group(3))
        fecha_vencimiento = parsear_fecha_mastercard(match.group(4))
        if fecha_cierre:
            datos['fecha_cierre'] = date(fecha_cierre.year, fecha_cierre.month, fecha_cierre.day)
        if fecha_vencimiento:
            datos['fecha_vencimiento'] = date(fecha_vencimiento.year, fecha_vencimiento.month, fecha_vencimiento.day)
    
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
    
    # Convertir fechas en movimientos a formato string
    movimientos_serializados = []
    for mov in movimientos:
        mov_serializado = mov.copy()
        if isinstance(mov['fecha'], date):
            mov_serializado['fecha'] = mov['fecha'].isoformat()
        movimientos_serializados.append(mov_serializado)
    
    return {
        'fecha_liquidacion': fecha_liquidacion.isoformat() if fecha_liquidacion else None,
        'monto_total': monto_total,
        'monto_minimo': datos_tarjeta.get('monto_minimo'),
        'numero_tarjeta': datos_tarjeta.get('numero_tarjeta'),
        'banco': datos_tarjeta.get('banco'),
        'titular': datos_tarjeta.get('titular'),
        'fecha_cierre': datos_tarjeta.get('fecha_cierre').isoformat() if datos_tarjeta.get('fecha_cierre') else None,
        'fecha_vencimiento': datos_tarjeta.get('fecha_vencimiento').isoformat() if datos_tarjeta.get('fecha_vencimiento') else None,
        'movimientos': movimientos_serializados,
        'texto_extraido': texto[:1000]  # Primeros 1000 caracteres para debugging
    }




