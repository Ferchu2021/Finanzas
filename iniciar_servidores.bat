@echo off
echo Iniciando servidores de Finanzas Personales...
echo.

echo Verificando dependencias del Backend...
cd /d %~dp0bkd_finanzas
python -c "import reportlab, openpyxl" 2>nul
if errorlevel 1 (
    echo Instalando dependencias del Backend...
    pip install -r requirements.txt
)
cd /d %~dp0

echo [1/2] Iniciando Backend (puerto 8000)...
start "Backend - Finanzas" cmd /k "cd /d %~dp0bkd_finanzas && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8000) else (python -m uvicorn main:app --host 0.0.0.0 --port 8000)"

ping 127.0.0.1 -n 4 >nul

echo [2/2] Iniciando Frontend (puerto 3002)...
start "Frontend - Finanzas" cmd /k "cd /d %~dp0front_finanzas && npm run dev"

echo.
echo Servidores iniciados!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3002
echo.
echo Abre tu navegador en: http://localhost:3002
echo.
echo Presiona cualquier tecla para cerrar esta ventana (los servidores seguirán corriendo)...
pause >nul

