# Visitme App 📱

Aplicación móvil desarrollada con React Native (Expo) para la gestión de visitas, reservas y paquetes en comunidades.

## Tabla de Contenidos
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Ejecutar la Aplicación](#ejecutar-la-aplicación)
- [Construir para Producción](#construir-para-producción)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Variables de Entorno](#variables-de-entorno)
- [Solucionar Problemas](#solucionar-problemas)
- [Recursos](#recursos)

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu máquina:

### 🍎 macOS (para desarrollo iOS y Android)
- **Node.js v20** (recomendado usar [nvm](https://github.com/nvm-sh/nvm))
  ```bash
  nvm install 20
  nvm use 20
  ```
- **Yarn** (gestor de paquetes)
  ```bash
  npm install -g yarn
  ```
- **Expo CLI** (opcional, se puede usar `npx expo`)
  ```bash
  npm install -g expo-cli
  ```
- **Watchman** (recomendado para React Native)
  ```bash
  brew install watchman
  ```
- **Ruby** (v3.2.0 o superior) y **Bundler**
  ```bash
  brew install ruby
  gem install bundler
  ```
- **CocoaPods** (para dependencias nativas de iOS)
  ```bash
  sudo gem install cocoapods
  ```
- **Xcode** (v15.0 o superior) – descargar desde la Mac App Store
  - Asegúrate de instalar las herramientas de línea de comandos:
    ```bash
    xcode-select --install
    ```
- **Android Studio** (para emulador Android y SDK)
  - Descargar e instalar desde [developer.android.com](https://developer.android.com/studio)
  - Configurar las variables de entorno `ANDROID_HOME` y agregar `platform-tools` a tu `PATH`
  - Crear un dispositivo virtual (AVD) desde Android Studio
- **JDK 17** (recomendado)
  ```bash
  brew install openjdk@17
  ```
- **EAS CLI** (para builds con Expo Application Services)
  ```bash
  npm install -g eas-cli
  ```

### 🪟 Windows / 🐧 Linux (solo desarrollo Android)
- Node.js, Yarn, Watchman (solo Linux), Android Studio, JDK.
- No es posible desarrollar para iOS fuera de macOS.

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <URL-del-repositorio>
   cd visitme-app
   ```

2. **Instalar dependencias de JavaScript**
   ```bash
   yarn
   ```
   *Nota: Este proyecto utiliza Yarn como gestor de paquetes. Si prefieres npm, ejecuta `npm install`.*

3. **Configurar variables de entorno** (opcional)
   El proyecto ya incluye un archivo `.env` con valores de desarrollo. Si necesitas sobrescribirlos, crea un archivo `.env.local` con tus propias variables.

4. **Generar proyectos nativos (solo para desarrollo nativo)**
   Si planeas ejecutar en un simulador iOS o construir un binary nativo, primero genera los proyectos nativos:
   ```bash
   npx expo prebuild
   ```
   Luego, instala las dependencias de iOS:
   ```bash
   cd ios && pod install && cd ..
   ```
   *Nota: Si usas Expo Go, puedes saltar este paso. También puedes usar `npx expo run:ios` que realiza estos pasos automáticamente.*

5. **Verificar la configuración de Expo**
   ```bash
   npx expo doctor
   ```
   Resuelve cualquier advertencia que aparezca.

## Ejecutar la Aplicación

### 📱 En un dispositivo físico con Expo Go
- Instala la app **Expo Go** desde la App Store (iOS) o Google Play (Android).
- Inicia el servidor de desarrollo:
  ```bash
  npx expo start
  ```
- Escanea el código QR con la cámara de tu dispositivo (iOS) o con la app Expo Go (Android).

### 🖥️ En un simulador/emulador
- **iOS Simulator** (solo macOS):
  ```bash
  npx expo start --ios
  ```
- **Android Emulator**:
  Asegúrate de tener un AVD corriendo.
  ```bash
  npx expo start --android
  ```

### 🛠️ Usando un Development Build (recomendado para mejor rendimiento)
Si has configurado EAS Build localmente, puedes ejecutar:
```bash
npx expo run:ios   # o npx expo run:android
```

## Construir para Producción

Este proyecto utiliza **EAS Build** para generar binaries listos para distribución.

### 1. Configurar EAS
```bash
eas login
eas build:configure
```

### 2. Construir localmente (requiere entorno nativo completo)
- **APK de prueba**:
  ```bash
  yarn apk
  ```
- **AAB (Android App Bundle)**:
  ```bash
  yarn aab
  ```
- **IPA (iOS)**:
  ```bash
  yarn ipa
  ```

### 3. Construir en la nube (recomendado)
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

Los artefactos resultantes se almacenarán en `builds/` (construcciones locales) o estarán disponibles en tu cuenta de Expo.

## Estructura del Proyecto

```
visitme-app/
├── app/                 # Rutas basadas en archivos (Expo Router)
├── components/          # Componentes React reutilizables
├── lib/                 # Utilidades y configuraciones (Supabase, API, etc.)
├── hooks/               # Custom Hooks
├── providers/           # Context Providers
├── assets/              # Imágenes, fuentes, videos
├── constants/           # Constantes de la app
├── scripts/             # Scripts auxiliares
├── types/               # Definiciones TypeScript
├── app.config.ts        # Configuración de Expo
├── app.json             # Metadatos de la app
├── eas.json             # Configuración de EAS Build
└── package.json         # Dependencias y scripts
```

## Variables de Entorno

Las siguientes variables deben estar definidas (ya están en `.env`):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase | `eyJhbGci...` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Client ID para Google Sign‑In web | `...` |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Client ID para Google Sign‑In Android | `...` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Client ID para Google Sign‑In iOS | `...` |
| `EXPO_PUBLIC_ONESIGNAL_APP_ID` | App ID de OneSignal para notificaciones push | `...` |

No commits estas claves en el repositorio público.

## Solucionar Problemas

### ❌ Error: "SDK not found"
Asegúrate de tener la versión correcta de Expo SDK instalada. Este proyecto usa Expo SDK 54.

### ❌ Error: "Cannot read property 'Supabase' of undefined"
Verifica que las variables de entorno estén cargadas correctamente. Reinicia el servidor de Expo.

### ❌ Error: "Pod install failed"
Ejecuta `pod repo update` y luego `cd ios && pod install --repo-update`.

### ❌ Error: "Java not found"
Configura la variable `JAVA_HOME` apuntando a tu JDK.

### 📚 Más ayuda
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- [Expo Discord](https://chat.expo.dev)

## Recursos

- [Expo Documentation](https://docs.expo.dev/) – Guías oficiales de Expo
- [React Native Docs](https://reactnative.dev/docs/getting-started) – Documentación de React Native
- [Supabase Docs](https://supabase.com/docs) – Cómo usar Supabase como backend
- [EAS Build Docs](https://docs.expo.dev/build/intro/) – Construir binaries nativos
- [OneSignal Docs](https://documentation.onesignal.com/docs/react-native-sdk-setup) – Notificaciones push

---

**¿Necesitas ayuda?** Abre un issue en el repositorio o contacta al equipo de desarrollo.

---

*Este proyecto fue creado con [create-expo-app](https://www.npmjs.com/package/create-expo-app).*
