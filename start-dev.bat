@echo off
echo 🚀 Iniciando entorno de desarrollo...

REM Verificar si estamos en la raíz del proyecto
if not exist "angular.json" (
    echo ❌ Error: Ejecuta este script desde la raíz del proyecto Angular
    pause
    exit /b 1
)

echo 📦 Instalando dependencias del frontend...
call npm install

echo 📦 Instalando dependencias del backend...
cd functions
call npm install
cd ..

echo 🔥 Iniciando Firebase Emulators...
start "Firebase Emulators" cmd /k "firebase emulators:start --only functions"

REM Esperar un poco para que se inicien
timeout /t 5 /nobreak >nul

echo 🌐 Iniciando servidor de desarrollo Angular...
start "Angular Dev Server" cmd /k "ng serve"

echo.
echo ✅ ¡Entorno iniciado!
echo 📱 Frontend: http://localhost:4200
echo ⚡ Functions: http://localhost:5001
echo.
echo 📋 Se abrieron nuevas ventanas de terminal
echo 💡 Para detener, cierra las ventanas de terminal
echo.

pause
