# Sistema de Gestión de Finanzas Personales

Sistema completo para gestionar tus finanzas personales con seguimiento de ingresos, gastos, tarjetas de crédito, préstamos, inversiones y más. Incluye sistema de alertas inteligente y reportes detallados.

## Características

- ✅ **Gestión de Ingresos**: Registra múltiples fuentes de ingresos (Salario ACN, Ventas Turismo, Auditorías, Clases Universidad, Ventas Just)
- ✅ **Gestión de Gastos**: Clasifica gastos en Fijos, Ordinarios y Extraordinarios
- ✅ **Tarjetas de Crédito**: Control de límites, saldos y fechas de cierre/vencimiento
- ✅ **Préstamos**: Seguimiento de préstamos con tasas de interés y cuotas
- ✅ **Inversiones**: Registro de inversiones con rendimientos
- ✅ **Proyecciones**: Planificación de pagos futuros
- ✅ **Reportes**: Egresos mensuales y saldos positivos
- ✅ **Alertas Inteligentes**: Sistema de IA que detecta incrementos en gastos, deudas y genera alertas con porcentajes

## Requisitos

- Python 3.8+
- Node.js 16+
- npm o yarn

## Instalación

### Backend

1. Navega al directorio del backend:
```bash
cd bkd_finanzas
```

2. Crea un entorno virtual (recomendado):
```bash
python -m venv venv
```

3. Activa el entorno virtual:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

4. Instala las dependencias:
```bash
pip install -r requirements.txt
```

5. Ejecuta el servidor:
```bash
python main.py
```

El backend estará disponible en `http://localhost:8000`

### Frontend

1. Navega al directorio del frontend:
```bash
cd front_finanzas
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## Uso

1. Inicia el backend primero (puerto 8000)
2. Luego inicia el frontend (puerto 3000)
3. Abre tu navegador en `http://localhost:3000`

### Navegación

- **Dashboard**: Vista general con resumen del mes actual y alertas
- **Ingresos**: Registra tus ingresos por tipo y moneda
- **Gastos**: Registra gastos clasificados por tipo
- **Tarjetas**: Gestiona tus tarjetas de crédito
- **Préstamos**: Controla tus préstamos activos
- **Inversiones**: Registra y sigue tus inversiones
- **Proyecciones**: Planifica pagos futuros
- **Reportes**: Genera reportes mensuales detallados
- **Alertas**: Visualiza alertas y tendencias financieras

## Tipos de Ingresos Soportados

- Salario ACN
- Ventas Turismo Volá Barato
- Ingresos por Auditorías
- Clases en Universidad
- Ventas Productos Just

## Sistema de Alertas

El sistema de alertas inteligente detecta automáticamente:

- **Incrementos en gastos**: Alerta cuando los gastos aumentan más del 20% respecto al mes anterior
- **Alto uso de tarjetas**: Alerta cuando el uso supera el 80% del límite
- **Préstamos próximos a vencer**: Alerta cuando faltan menos de 30 días para el vencimiento
- **Saldo negativo**: Alerta cuando los egresos superan los ingresos
- **Pagos próximos**: Alerta sobre pagos que vencen en los próximos 7 días

Las alertas muestran porcentajes de cambio y detalles específicos para ayudarte a tomar decisiones informadas.

## Estructura del Proyecto

```
Finanzas Personales/
├── bkd_finanzas/          # Backend FastAPI
│   ├── main.py           # Aplicación principal
│   ├── database.py       # Configuración de base de datos
│   ├── models.py         # Modelos de datos
│   ├── schemas.py        # Esquemas Pydantic
│   ├── crud.py           # Operaciones CRUD
│   ├── reports.py        # Generación de reportes
│   ├── alerts.py         # Sistema de alertas
│   └── requirements.txt  # Dependencias Python
│
└── front_finanzas/        # Frontend React
    ├── src/
    │   ├── components/   # Componentes React
    │   ├── services/     # Servicios API
    │   └── App.tsx       # Componente principal
    └── package.json      # Dependencias Node
```

## Base de Datos

El sistema utiliza SQLite por defecto. La base de datos se crea automáticamente al ejecutar el backend por primera vez.

## API Endpoints

### Ingresos
- `GET /api/ingresos` - Listar ingresos
- `POST /api/ingresos` - Crear ingreso
- `GET /api/ingresos/{id}` - Obtener ingreso
- `PUT /api/ingresos/{id}` - Actualizar ingreso
- `DELETE /api/ingresos/{id}` - Eliminar ingreso

### Gastos
- `GET /api/gastos` - Listar gastos
- `POST /api/gastos` - Crear gasto
- Similar estructura para otras operaciones

### Reportes
- `GET /api/reportes/egresos-mensuales?ano={ano}&mes={mes}`
- `GET /api/reportes/saldos-positivos?ano={ano}&mes={mes}`
- `GET /api/reportes/resumen-mensual?ano={ano}&mes={mes}`

### Alertas
- `GET /api/alertas` - Obtener todas las alertas
- `GET /api/alertas/tendencias` - Obtener análisis de tendencias

## Desarrollo

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Realiza tus cambios
4. Envía un pull request

## Licencia

Este proyecto es de uso personal.

## Soporte

Para problemas o preguntas, revisa la documentación de la API en `http://localhost:8000/docs` cuando el backend esté ejecutándose.


