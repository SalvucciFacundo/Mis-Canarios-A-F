# Análisis de Limpieza - Carpeta Functions

## Archivos analizados en functions/

### 📁 node_modules/ (ELIMINAR COMPLETO)
**Tamaño:** Extremadamente grande (miles de archivos)
**Motivo:** Dependencias instaladas que se pueden regenerar con `npm install`
**Acción:** ❌ ELIMINAR COMPLETA

### 📄 Archivos de configuración (MANTENER)
- `.env` - Variables de entorno (MANTENER si está en uso)
- `.env.example` - Ejemplo de variables de entorno (MANTENER)
- `.gitignore` - Configuración de Git (MANTENER)
- `package.json` - Configuración del proyecto (MANTENER)
- `package-lock.json` - Lock de dependencias (MANTENER)

### 📄 Archivos de código principal (MANTENER)
- `index.js` - Archivo principal de las funciones (MANTENER)
- `mercadoPago.js` - Lógica de MercadoPago (MANTENER)

### 📄 Archivos de utilidades/scripts (REVISAR)
- `add-history.js` - Script utilitario (REVISAR si se usa)
- `add-subscription-for-user.js` - Script utilitario (REVISAR si se usa)
- `fix-dates.js` - Script de corrección (REVISAR si se usa)
- `list-subscriptions.js` - Script de listado (REVISAR si se usa)
- `simulate-renewal.js` - Script de simulación (REVISAR si se usa)

### 📄 Archivos de log/debug (ELIMINAR)
- `pglite-debug.log` - Archivo de log/debug (❌ ELIMINAR)

## Resumen de acciones recomendadas:

### ❌ ELIMINAR (Seguro):
1. `node_modules/` - Completa (se regenera con npm install)
2. `pglite-debug.log` - Archivo de log/debug

### ⚠️ REVISAR (Posible eliminación):
Los siguientes archivos parecen ser scripts utilitarios o de desarrollo que podrían no ser necesarios en producción:
- `add-history.js`
- `add-subscription-for-user.js` 
- `fix-dates.js`
- `list-subscriptions.js`
- `simulate-renewal.js`

**Recomendación:** Revisar si estos scripts se usan activamente o se pueden mover a una carpeta de scripts de desarrollo.

### ✅ MANTENER:
- Todos los archivos de configuración (.env, .gitignore, package.json, etc.)
- `index.js` y `mercadoPago.js` (código principal)

## Espacio liberado estimado:
- `node_modules/`: ~200-500 MB
- `pglite-debug.log`: Variable (revisar tamaño)
- Scripts utilitarios: ~50-100 KB cada uno

**Total estimado:** 200-500 MB + archivos adicionales
