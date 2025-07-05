# 🐦 Mis Canarios - Aplicación de Registro de Canarios

Una aplicación web moderna para el registro y gestión de canarios, construida con Angular 17+, Firebase y Tailwind CSS.

## ✨ Características

- 🔐 **Autenticación**: Sistema completo con Firebase Auth
- 🐦 **Gestión de Aves**: Registro y seguimiento de canarios
- 👥 **Gestión de Parejas**: Control de apareamientos
- 📊 **Dashboard Administrativo**: Panel de control para administradores
- 💳 **Sistema de Suscripciones**: Integración con Mercado Pago
- 📱 **Responsive**: Diseño adaptable para todos los dispositivos
- 🎨 **UI Moderna**: Interfaz con Tailwind CSS y Angular Signals

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Windows)
```bash
# Ejecutar el script de inicio rápido
./start-dev.bat
```

### Opción 2: Manual
```bash
# Instalar dependencias
npm install
cd functions && npm install && cd ..

# Iniciar Firebase Emulators
firebase emulators:start --only functions

# En otra terminal, iniciar Angular
ng serve
```

## 💳 Sistema de Suscripciones

Este proyecto incluye un sistema completo de suscripciones con Mercado Pago:

- ✅ 3 planes de suscripción (Mensual, Semestral, Anual)
- ✅ Integración segura con Mercado Pago Checkout Pro
- ✅ Manejo de webhooks para confirmación de pagos
- ✅ Páginas de resultado (éxito, error, pendiente)
- ✅ Verificación automática de estado de suscripción

### Configuración de Suscripciones

Para configurar las suscripciones, consulta la **[Guía Completa de Mercado Pago](./GUIA_MERCADO_PAGO.md)**.

## 🛠️ Tecnologías

- **Frontend**: Angular 17+, TypeScript, Tailwind CSS
- **Backend**: Firebase Functions (Node.js)
- **Base de Datos**: Firestore
- **Autenticación**: Firebase Auth
- **Pagos**: Mercado Pago
- **Hosting**: Firebase Hosting

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── admin/          # Módulo de administración
│   ├── auth/           # Autenticación
│   ├── birds/          # Gestión de aves
│   ├── couples/        # Gestión de parejas
│   ├── subscription/   # Sistema de suscripciones
│   └── shared/         # Componentes compartidos
└── environments/       # Variables de entorno

functions/
├── index.js           # Functions principales
├── mercadoPago.js     # Lógica de Mercado Pago
└── package.json       # Dependencias del backend
```

## 🔧 Configuración

1. **Firebase**: Configura tu proyecto en Firebase Console
2. **Mercado Pago**: Obtén tus credenciales en Mercado Pago Developers
3. **Variables de Entorno**: Copia y configura los archivos de entorno

Ver la [Guía de Mercado Pago](./GUIA_MERCADO_PAGO.md) para instrucciones detalladas.

## 📚 Documentación

- [Guía Completa de Mercado Pago](./GUIA_MERCADO_PAGO.md)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de Angular](https://angular.io/docs)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

¿Necesitas ayuda? 

- 📖 Consulta la [Guía de Mercado Pago](./GUIA_MERCADO_PAGO.md)
- 🐛 Reporta bugs en [Issues](../../issues)
- 💬 Pregunta en [Discussions](../../discussions)

