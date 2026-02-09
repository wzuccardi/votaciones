@echo off
echo ========================================
echo   PRUEBAS AUTOMATICAS - AppVotaciones
echo ========================================
echo.

echo [1/2] Ejecutando pruebas de sistema...
echo.
call npx tsx scripts/test-complete-system.ts
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Las pruebas de sistema fallaron
    pause
    exit /b 1
)

echo.
echo ========================================
echo.
echo [2/2] Iniciando servidor para pruebas de API...
echo.
echo Presiona Ctrl+C cuando termines las pruebas
echo.

start "AppVotaciones Dev Server" cmd /k "npm run dev"

timeout /t 15 /nobreak

echo.
echo Ejecutando pruebas de API...
echo.
call npx tsx scripts/test-api-endpoints.ts

echo.
echo ========================================
echo   PRUEBAS COMPLETADAS
echo ========================================
echo.
echo Revisa RESUMEN-PRUEBAS.md para mas detalles
echo.
pause
