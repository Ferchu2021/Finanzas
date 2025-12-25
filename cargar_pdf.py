#!/usr/bin/env python3
"""
Script para cargar un PDF de liquidación de tarjeta a la API
"""
import sys
import requests
import os

def cargar_pdf(ruta_pdf: str, previsualizar: bool = True, tarjeta_id: int = None):
    """
    Carga un PDF de liquidación a la API
    
    Args:
        ruta_pdf: Ruta completa al archivo PDF
        previsualizar: Si True, solo previsualiza sin guardar. Si False, procesa y guarda.
        tarjeta_id: ID de la tarjeta (opcional, solo si previsualizar=False)
    """
    if not os.path.exists(ruta_pdf):
        print(f"Error: El archivo {ruta_pdf} no existe")
        return
    
    print(f"Procesando PDF: {os.path.basename(ruta_pdf)}...")
    
    url = "http://localhost:8000/api/pdf/previsualizar"
    if not previsualizar:
        url = "http://localhost:8000/api/pdf/procesar-liquidacion"
        if tarjeta_id:
            url += f"?tarjeta_id={tarjeta_id}"
    
    try:
        with open(ruta_pdf, 'rb') as f:
            files = {'file': (os.path.basename(ruta_pdf), f, 'application/pdf')}
            response = requests.post(url, files=files)
        
        if response.status_code == 200:
            datos = response.json()
            print("OK: PDF procesado exitosamente")
            print("\nDatos extraidos:")
            print(f"  Banco: {datos.get('banco', 'N/A')}")
            print(f"  Numero de tarjeta: {datos.get('numero_tarjeta', 'N/A')}")
            print(f"  Fecha de liquidacion: {datos.get('fecha_liquidacion', 'N/A')}")
            monto_total = datos.get('monto_total')
            if monto_total is not None:
                print(f"  Monto total: ${monto_total:,.2f}")
            else:
                print("  Monto total: N/A")
            
            monto_minimo = datos.get('monto_minimo')
            if monto_minimo is not None:
                print(f"  Monto minimo: ${monto_minimo:,.2f}")
            else:
                print("  Monto minimo: N/A")
            print(f"  Movimientos encontrados: {len(datos.get('movimientos', []))}")
            
            if not previsualizar and 'gastos_creados' in datos:
                print(f"\nOK: Gastos creados: {datos['gastos_creados']}")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print("Error: No se pudo conectar al servidor. Esta corriendo el backend en http://localhost:8000?")
    except Exception as e:
        print(f"Error al procesar el PDF: {str(e)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python cargar_pdf.py <ruta_al_pdf> [--guardar] [--tarjeta_id ID]")
        print("\nEjemplos:")
        print("  python cargar_pdf.py documento.pdf              # Solo previsualizar")
        print("  python cargar_pdf.py documento.pdf --guardar    # Procesar y guardar")
        print("  python cargar_pdf.py documento.pdf --guardar --tarjeta_id 1  # Procesar y asociar a tarjeta")
        sys.exit(1)
    
    ruta_pdf = sys.argv[1]
    previsualizar = "--guardar" not in sys.argv
    tarjeta_id = None
    
    if "--tarjeta_id" in sys.argv:
        try:
            idx = sys.argv.index("--tarjeta_id")
            tarjeta_id = int(sys.argv[idx + 1])
        except (ValueError, IndexError):
            print("Error: --tarjeta_id requiere un número")
            sys.exit(1)
    
    cargar_pdf(ruta_pdf, previsualizar, tarjeta_id)

