#!/usr/bin/env python3
"""
Script para consolidar tarjetas y eliminar duplicados
"""
import requests

API_URL = 'http://localhost:8000/api'

# Obtener todas las tarjetas
tarjetas = requests.get(f'{API_URL}/tarjetas').json()

print("=== TARJETAS ACTUALES ===")
for t in tarjetas:
    print(f"ID {t['id']}: {t['nombre']} ({t.get('banco', 'N/A')}) - Saldo: ${t['saldo_actual']:,.2f}")

# Identificar duplicados
# Mastercard: ID 1 y otra MASTERCARD PLATINUM deben consolidarse
mastercards = [t for t in tarjetas if 'MASTERCARD' in t.get('banco', '').upper() or 'MASTERCARD' in t['nombre'].upper()]
visas = [t for t in tarjetas if 'VISA' in t.get('banco', '').upper()]

print("\n=== CONSOLIDANDO ===")

# Consolidar Mastercard - mantener la que tiene más saldo
if len(mastercards) > 1:
    mastercards_sorted = sorted(mastercards, key=lambda x: x['saldo_actual'], reverse=True)
    tarjeta_principal = mastercards_sorted[0]
    tarjetas_a_eliminar = mastercards_sorted[1:]
    
    print(f"Mastercard principal: ID {tarjeta_principal['id']} (Saldo: ${tarjeta_principal['saldo_actual']:,.2f})")
    for t in tarjetas_a_eliminar:
        print(f"  Eliminando duplicado: ID {t['id']} (Saldo: ${t['saldo_actual']:,.2f})")
        requests.delete(f"{API_URL}/tarjetas/{t['id']}")

# Las Visas ya están consolidadas en una sola
print(f"\nVisa: {len(visas)} tarjeta(s) encontrada(s)")

# Resumen final
print("\n=== RESUMEN FINAL ===")
tarjetas_final = requests.get(f'{API_URL}/tarjetas').json()
total_pagos = 0

for t in sorted(tarjetas_final, key=lambda x: x.get('banco', '') + x['nombre']):
    if t['saldo_actual'] > 0:
        print(f"{t['nombre']} ({t.get('banco', 'N/A')}): ${t['saldo_actual']:,.2f}")
        total_pagos += t['saldo_actual']

print(f"\nTOTAL A PAGAR: ${total_pagos:,.2f}")


