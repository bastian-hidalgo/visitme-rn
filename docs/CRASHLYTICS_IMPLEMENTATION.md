# Guía de Implementación de Firebase Crashlytics

## ✅ Implementación Completada

Se ha implementado Firebase Crashlytics en tu aplicación React Native (Expo). Aquí está lo que se ha configurado:

### 1. **Dependencias Instaladas**
- `@react-native-firebase/app`
- `@react-native-firebase/crashlytics`

### 2. **Archivos Creados/Modificados**

#### Nuevos archivos:
- `lib/monitoring/crashlytics.ts` - Servicio principal de Crashlytics
- `lib/monitoring/index.ts` - Utilidades y helpers para fácil integración
- `components/ErrorBoundary.tsx` - Componente para capturar errores de React

#### Archivos modificados:
- `providers/AppProviders.tsx` - Inicialización de Crashlytics al iniciar la app
- `providers/supabase-auth-provider.tsx` - Tracking de usuario en Crashlytics
- `app/_layout.tsx` - Envolvido con ErrorBoundary

---

## 📍 Dónde están los errores controlados (y cómo integrar Crashlytics)

Basado en el análisis de tu aplicación, estos son los principales lugares donde ocurren errores y cómo integrar Crashlytics:

### 1. **Errores de Supabase (Base de Datos/Auth)**

**Patrón actual:** Usas `console.error()` y muestras Toast

**Ejemplo de integración en `app/choose-community.tsx`:**

```typescript
// ANTES:
try {
  const { data, error: membershipsError } = await supabase
    .from('user_communities')
    .select('...')
  
  if (membershipsError) throw membershipsError
} catch (err) {
  console.error('[choose-community] loadCommunities error', err)
  setError('No pudimos cargar tus comunidades...')
}

// DESPUÉS (con Crashlytics):
import { recordError, reportSupabaseError } from '@/lib/monitoring'

try {
  const { data, error: membershipsError } = await supabase
    .from('user_communities')
    .select('...')
  
  if (membershipsError) {
    reportSupabaseError(membershipsError, 'choose-community.loadCommunities')
    throw membershipsError
  }
} catch (err) {
  recordError(err as Error, 'choose-community.loadCommunities')
  console.error('[choose-community] loadCommunities error', err)
  setError('No pudimos cargar tus comunidades...')
}
```

### 2. **Errores de Autenticación**

**En `app/login.tsx` y `hooks/useAppleLogin.ts`:**

```typescript
import { recordError } from '@/lib/monitoring'

// En handleMagicLinkSubmit:
try {
  const { error: otpError } = await supabase.auth.signInWithOtp({...})
  if (otpError) throw otpError
} catch (error) {
  recordError(error as Error, 'LoginScreen.magicLink')
  setErrorMessage('Error al enviar el enlace...')
}

// En useAppleLogin:
try {
  const { data, error } = await supabase.auth.signInWithIdToken({...})
  if (error) throw error
} catch (error) {
  recordError(error as Error, 'AppleLogin.signIn')
  throw error
}
```

### 3. **Errores de Carga de Datos**

**En `app/(tabs)/library.tsx` y otros screens:**

```typescript
import { recordError } from '@/lib/monitoring'

const fetchDocuments = useCallback(async () => {
  try {
    const { data, error } = await supabase.from('community_documents').select('*')
    if (error) {
      reportSupabaseError(error, 'CommunityLibrary.fetchDocuments')
      throw error
    }
  } catch (err) {
    recordError(err as Error, 'CommunityLibrary.fetchDocuments')
    Toast.show({ type: 'error', text1: 'No pudimos cargar...' })
  }
}, [])
```

### 4. **Errores de Red/API**

**En `lib/api/` y llamadas a servicios externos:**

```typescript
import { reportNetworkError } from '@/lib/monitoring'

try {
  const response = await fetch('https://api.example.com/data')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
} catch (error) {
  reportNetworkError(error as Error, 'fetchUserData')
  // manejo del error...
}
```

### 5. **Usando el Wrapper `withErrorReporting`**

Para funciones async completas:

```typescript
import { withErrorReporting } from '@/lib/monitoring'

const handleSave = async () => {
  const result = await withErrorReporting(
    async () => {
      // Tu lógica async aquí
      const { data, error } = await supabase.from('profiles').update({...})
      if (error) throw error
      return data
    },
    'EditProfile.handleSave',
    false // no relanzar el error
  )
  
  if (result) {
    // éxito
  }
}
```

---

## 🎯 Puntos Críticos Identificados en tu App

1. **`app/choose-community.tsx`** - Carga de comunidades, selección de comunidad
2. **`app/login.tsx`** - Login con magic link, Google, Apple
3. **`app/(tabs)/library.tsx`** - Carga de documentos de la comunidad
4. **`components/resident/invitations/hooks/useInvitationCreator.ts`** - Creación de invitaciones
5. **`hooks/useEditProfile.ts`** - Actualización de perfil, subida de avatar
6. **`hooks/useCheckSession.ts`** - Verificación de sesión, validación de usuario
7. **`hooks/useHouseholdMembers.ts`** - Carga de miembros del hogar

---

## 🧪 Cómo Probar Crashlytics

### En desarrollo:

```typescript
import { crashlyticsService } from '@/lib/monitoring/crashlytics'

// Test crash (solo funciona en desarrollo __DEV__)
await crashlyticsService.testCrash()

// O reporta un error manual:
await crashlyticsService.recordError(new Error('Test error'), 'TestContext')
```

### En producción:
Los errores se reportarán automáticamente. Puedes verlos en:
- Firebase Console → Crashlytics
- Los errores aparecerán agrupados por tipo y stack trace

---

## 📊 Información Adicional en Crashlytics

Crashlytics ahora incluye automáticamente:
- **User ID**: Se establece cuando el usuario inicia sesión
- **Platform**: iOS o Android
- **App Version**: 1.54.0
- **Custom Keys**: Puedes agregar más contexto con `crashlyticsService.setAttribute()`

---

## ⚠️ Notas Importantes

1. **No reportes errores de validación de formularios** (ej: "email inválido") a menos que sea un error inesperado
2. **Los errores de red** son buenos candidatos para Crashlytics
3. **Los errores de Supabase** (cuando la query falla inesperadamente) deben reportarse
4. **ErrorBoundary** captura errores de renderizado de React que no están en try/catch

---

## 🚀 Próximos Pasos Recomendados

1. **Revisar y actualizar** los archivos mencionados arriba con `recordError()`
2. **Hacer un build de prueba** y verificar que los errores lleguen a Firebase Console
3. **Configurar alertas** en Firebase Console para errores críticos
4. **Monitorear regularmente** el dashboard de Crashlytics

---

## 📦 Configuración de Android/iOS

El archivo `google-services.json` ya está presente. Para iOS, asegúrate de tener `GoogleService-Info.plist` en la carpeta `ios/`.

Para builds de producción, Crashlytics se activará automáticamente. Para desarrollo, puedes controlar si enviar reports con:

```typescript
await crashlytics().setCrashlyticsCollectionEnabled(__DEV__ ? false : true)
```
