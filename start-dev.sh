#!/bin/bash

# 🚀 Script de Inicio Rápido - Suscripciones Mercado Pago
# Este script te ayuda a iniciar rápidamente el desarrollo

echo "🚀 Iniciando entorno de desarrollo..."

# Verificar si estamos en la raíz del proyecto
if [ ! -f "angular.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto Angular"
    exit 1
fi

echo "📦 Instalando dependencias del frontend..."
npm install

echo "📦 Instalando dependencias del backend..."
cd functions
npm install
cd ..

echo "🔥 Iniciando Firebase Emulators..."
# Iniciar emulators en background
firebase emulators:start --only functions &
FIREBASE_PID=$!

# Esperar un poco para que se inicien
sleep 5

echo "🌐 Iniciando servidor de desarrollo Angular..."
ng serve &
ANGULAR_PID=$!

echo ""
echo "✅ ¡Entorno iniciado!"
echo "📱 Frontend: http://localhost:4200"
echo "⚡ Functions: http://localhost:5001"
echo ""
echo "📋 Para detener todo, presiona Ctrl+C"
echo ""

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $FIREBASE_PID 2>/dev/null
    kill $ANGULAR_PID 2>/dev/null
    exit 0
}

# Capturar señal de interrupción
trap cleanup INT

# Mantener el script corriendo
wait
