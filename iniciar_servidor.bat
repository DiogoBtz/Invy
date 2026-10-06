@echo off
setlocal EnableExtensions

title Invy - Servidor
cd /d "%~dp0"

if not exist "Invy\Invy.exe" (
    echo.
    echo [ERRO] Nao encontrei Invy\Invy.exe.
    echo Abra este BAT dentro da pasta do pacote completo do Invy.
    echo.
    pause
    exit /b 1
)

if not exist "Invy\.env" (
    echo.
    echo [ERRO] Nao encontrei Invy\.env.
    echo O arquivo .env precisa ficar dentro da pasta Invy, ao lado do Invy.exe.
    echo.
    pause
    exit /b 1
)

rem Por padrao, aceita conexoes apenas deste computador.
rem Para uso em rede, defina INVY_DESKTOP_HOST explicitamente antes de iniciar.
if not defined INVY_DESKTOP_HOST set "INVY_DESKTOP_HOST=127.0.0.1"
if not defined INVY_DESKTOP_PORT set "INVY_DESKTOP_PORT=8000"
if not defined INVY_OPEN_BROWSER set "INVY_OPEN_BROWSER=true"

echo.
echo Iniciando Invy...
echo Pasta: %CD%\Invy
echo Servidor: %INVY_DESKTOP_HOST%:%INVY_DESKTOP_PORT%
echo.

cd /d "%~dp0Invy"
"%CD%\Invy.exe"
