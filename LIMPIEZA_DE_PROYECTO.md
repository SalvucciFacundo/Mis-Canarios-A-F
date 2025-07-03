# Limpieza de archivos innecesarios

## Archivos detectados para eliminar

- `src/app/couples/services/couples.service.new.ts`: No es referenciado en el código, es seguro eliminarlo.
- `src/app/shared/layout.component.html.bak`: Archivo de respaldo, no es usado por el runtime ni por el build.

## Archivos que NO deben eliminarse

- `src/app/shared/layout.component.ts` y `src/app/shared/layout.component.html`: Son usados activamente en rutas y componentes.

## Recomendación

Puedes eliminar los archivos listados arriba para mantener el proyecto limpio y profesional. Hazlo manualmente o solicita que lo elimine automáticamente.
