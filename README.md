# SuperBot 🤖

> **La inteligencia artificial a tu servicio**  
> Plataforma para bots conversacionales automatizados enfocados en atención de dudas y registro de ventas mediante Meta API (WhatsApp Cloud API e Instagram Messaging API).

---

## 🚀 Características Implementadas

- **Diseño de Encabezado Premium**:
  - Color grafito con degradado sutil y apariencia metálica reflectiva.
  - Icono de bot metálico estilizado con indicador de estado en vivo.
  - Título `"SuperBot"` y subtítulo `"La inteligencia artificial a tu servicio"`.
  - Botón de **Iniciar sesión** con modal para **Google** y **Correo / Contraseña**.
  - Selector de temas con transición fluida entre **Modo Claro** y **Modo Oscuro**.
  - Cuerpo (`body`) limpio y minimalista, preparado para los módulos de flujo.
- **PWA Ready**:
  - `sw.js` (Service Worker) con estrategia de caché offline y actualización en segundo plano.
  - `manifest.json` configurado con iconos en alta resolución (192x192 y 512x512).
- **Firebase Ready**:
  - Configuración para Firebase Hosting (`firebase.json` y `.firebaserc`).
  - Módulo de autenticación modular (`src/firebase/config.ts`) con soporte para Google Auth Provider y Email/Password.

---

## 🛠️ Configuración de Firebase

### 1. Crear el proyecto en Firebase Console
1. Entra a [Firebase Console](https://console.firebase.google.com/).
2. Haz clic en **"Agregar proyecto"** y nómbralo `Super-Bot`.
3. En la sección **Authentication**:
   - Activa el proveedor **Google**.
   - Activa el proveedor **Correo electrónico / Contraseña**.
4. En la sección **Hosting**:
   - Haz clic en **Comenzar** para habilitar Firebase Hosting.
5. Ve a **Configuración del proyecto** (ícono de engranaje) > **General** > **Tus apps**, y crea una aplicación Web (`</>`).
6. Copia las credenciales en un archivo local llamado `.env.local`:

```bash
cp .env.example .env.local
```

Rellena las variables en `.env.local`:
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=super-bot.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=super-bot
VITE_FIREBASE_STORAGE_BUCKET=super-bot.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### 2. Despliegue en Firebase Hosting
Para desplegar la aplicación en Firebase Hosting:
```bash
# Iniciar sesión en Firebase (si aún no lo has hecho)
npx firebase login

# Compilar la aplicación React
npm run build

# Desplegar en Firebase Hosting
npx firebase deploy --only hosting
```

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

---

## 🗺️ Próximos Pasos (Meta API & Registro de Ventas)
1. **Webhook de Meta API**: Integración de endpoints para recibir mensajes de WhatsApp Cloud API y Messenger / Instagram Direct.
2. **Motor de IA Conversacional**: Reglas e IA para responder preguntas frecuentes y dudas de catálogo.
3. **Registro de Ventas**: Captura estructurada de pedidos, cliente, monto y confirmación de compra vinculable a Firebase Firestore o Google Sheets.
