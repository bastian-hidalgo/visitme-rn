# Flujo de notificaciones push en Visitme

## 1. Objetivo

Este documento describe el flujo actual de notificaciones push de la app móvil Visitme y sirve como guía para reparar o extender las notificaciones de encomiendas, chat, reservas y alertas.

La implementación usa:

- `react-native-onesignal` v5 para push.
- `Supabase Auth` para identificar al usuario.
- `AsyncStorage` para estado pendiente entre arranques.
- Expo Router para navegación.
- Supabase Realtime para actualizaciones en foreground.

Archivos principales:

- `providers/OneSignalProvider.tsx`
- `lib/notifications/oneSignal.ts`
- `lib/notifications/oneSignalSync.ts`
- `lib/navigation.ts`
- `app/_layout.tsx`
- `lib/chat/useChat.ts`
- `components/resident/QuickAccess.tsx`

---

## 2. Inicialización de OneSignal

`OneSignalProvider` está montado dentro de `AppProviders` y se inicializa una sola vez.

```text
RootLayout
  └─ AppProviders
      └─ SupabaseAuthProvider
          └─ UserProvider
              └─ OneSignalProvider
```

La inicialización ocurre en:

```ts
initializeOneSignal()
```

El SDK usa:

```env
EXPO_PUBLIC_ONESIGNAL_APP_ID=...
EXPO_PUBLIC_ONESIGNAL_MODE=development
```

Después de inicializarse:

1. Se registra el listener global de click.
2. Se marca el provider como `ready`.
3. Se sincroniza el usuario autenticado con `OneSignal.login(userId)`.
4. Se sincroniza el email.
5. Se sincronizan tags.
6. Se solicitan permisos push si corresponde.
7. Se sincroniza la suscripción actual con Supabase.

Logs principales:

```text
[OneSignalProvider] 🟢 Mounting Provider
[OneSignal] Inicializado correctamente
[OneSignalProvider] Adding GLOBAL click listener
```

---

## 3. Identidad y suscripciones

Cuando la sesión está lista y existe consentimiento de privacidad:

```ts
OneSignal.login(userId)
```

El identificador actual de la suscripción se obtiene con:

```ts
OneSignal.User.pushSubscription.getIdAsync()
```

Ese valor corresponde a un **subscription ID** de OneSignal v5, aunque la tabla existente se llame `onesignal_players` y la columna se llame `player_id`.

Se sincroniza en Supabase con datos equivalentes a:

```ts
{
  user_id,
  community_id,
  player_id: subscriptionId,
}
```

### Importante para el backend

Si el backend guarda valores obtenidos mediante `getIdAsync()`, debe enviar push con:

```json
{
  "include_subscription_ids": ["subscription-id"]
}
```

No debe enviarlos como:

```json
{
  "include_player_ids": ["subscription-id"]
}
```

Los logs siguientes indican una mezcla incorrecta entre player IDs antiguos y subscription IDs:

```text
invalid_player_ids
```

La alternativa más resistente es enviar por el alias externo que ya registra la app:

```json
{
  "include_aliases": {
    "external_id": ["supabase-user-id"]
  },
  "target_channel": "push"
}
```

---

## 4. Payload común de una notificación

Una notificación debe incluir información estructurada en `data`.

### Chat

```json
{
  "data": {
    "type": "chat_message",
    "conversation_id": "conversation-uuid",
    "message_id": "message-uuid"
  }
}
```

### Encomienda

El payload recomendado es:

```json
{
  "data": {
    "type": "package-arrived",
    "route": "encomienda",
    "parcel_id": "parcel-uuid"
  }
}
```

La app actualmente acepta también `data.id` como fallback para encomiendas:

```ts
const parcelId = data.parcel_id || data.id;
```

### Reserva

```json
{
  "data": {
    "route": "reservation",
    "reservation_id": "reservation-uuid"
  }
}
```

### Alerta

Se aceptan actualmente:

```json
{
  "data": {
    "type": "ALERTA",
    "id": "alert-uuid"
  }
}
```

También se reconocen:

```text
route=alerta
route=alert
type=info
```

---

## 5. `app_url` y deep links

El campo `data` es la fuente de verdad para abrir una entidad. `app_url` debe ser solamente un fallback.

El scheme canónico de la app es:

```text
visitmeapp
```

La app también mantiene compatibilidad con el scheme antiguo:

```text
visitme
```

Esto está configurado en `app.config.ts`:

```ts
scheme: ["visitmeapp", "visitme"]
```

### Deep link de chat

La pantalla está definida en:

```text
app/chat/[id].tsx
```

Por lo tanto, la forma canónica es:

```text
visitmeapp://chat/{conversation_id}
```

No usar:

```text
visitme://chat/conversations/{conversation_id}
```

El path `/chat/conversations/...` no corresponde directamente al archivo `[id].tsx`.

### Deep link de encomienda

Las encomiendas no deberían depender de un deep link como fuente primaria. El backend debe enviar `parcel_id` en `data` y la app debe navegar a Home con parámetros:

```text
/(tabs)?parcelId={parcel_id}
```

Esto permite que `ResidentDashboard` entregue el ID al `ResidentContext`, que abre el detalle mediante `PackageDetailSheet`.

---

## 6. Recepción del click

El listener actual es:

```ts
OneSignal.Notifications.addEventListener("click", handler)
```

El handler procesa en este orden:

1. Obtiene `notification.notificationId`.
2. Evita el mismo click duplicado durante dos segundos.
3. Lee `notification.additionalData`.
4. Prioriza `conversation_id`, `parcel_id`, `reservation_id` o `id`.
5. Usa `notification.launchURL` o `data.app_url` solamente como fallback.
6. Para chat, entrega el ID a `openChatFromNotification`.
7. Para encomiendas, reservas y alertas, usa el helper existente `navigateToDeepLink`.

Logs de diagnóstico:

```text
[ChatPush] notification clicked
[ChatPush] payload parsed
```

No deben imprimirse tokens, API keys ni contenido privado del mensaje.

---

## 7. Flujo centralizado de chat

El chat utiliza un flujo pendiente porque una notificación puede abrir la app en cualquiera de estos estados:

- App abierta.
- App en background.
- App completamente cerrada.
- Splash visible.
- Sesión todavía restaurándose.
- Modal de consentimiento visible.
- Root navigation todavía no listo.

El estado persistido es:

```ts
type PendingChatNotification = {
  conversationId: string;
  messageId?: string;
};
```

Se guarda en:

```text
pending_chat_notification
```

Flujo:

```text
Push click
   |
   v
Leer additionalData
   |
   v
Guardar conversación pendiente si falta sesión/navegación
   |
   v
Restaurar sesión
   |
   v
Esperar root navigation
   |
   v
Esperar consentimiento/modal/splash
   |
   v
InteractionManager.runAfterInteractions
   |
   v
router.push('/chat/[id]')
   |
   v
Limpiar estado pendiente
```

Logs esperados:

```text
[ChatPush] pending notification saved
[ChatPush] checking pending notification
[ChatPush] pending notification ready to open
[ChatPush] session ready
[ChatPush] navigation ready
[ChatPush] splash dismissed
[ChatPush] navigating to conversation
[ChatPush] navigation completed
```

---

## 8. Flujo actual de encomiendas

Actualmente el flujo de encomiendas es más simple que el de chat:

```text
OneSignal click
   |
   v
data.type === "package-arrived"
OR data.route === "encomienda"
   |
   v
parcelId = data.parcel_id || data.id
   |
   v
navigateToDeepLink('/(tabs)', { parcelId })
   |
   v
ResidentDashboard lee parcelId
   |
   v
setPendingParcelId(parcelId)
   |
   v
ResidentContext carga el paquete
   |
   v
PackageDetailSheet.present()
```

El código actual navega directamente desde el listener para encomiendas:

```ts
navigateToDeepLink("/(tabs)", { parcelId });
```

### Riesgo actual

Este flujo puede fallar cuando:

- La sesión aún no está restaurada.
- Expo Router no está listo.
- La app se abre desde cold start.
- El `ResidentContext` todavía no cargó comunidades/usuario.
- `parcel_id` no está presente.
- El push contiene solo `app_url`.
- Hay una modal global visible.

### Recomendación para reparar encomiendas

Aplicar el mismo patrón de estado pendiente usado por chat:

```ts
type PendingParcelNotification = {
  parcelId: string;
  notificationId?: string;
};
```

Y procesarlo solamente cuando:

```text
session ready
+ root navigation ready
+ user ready
+ community ready
+ modal cerrada
```

La navegación final debería seguir siendo:

```ts
router.replace({
  pathname: "/(tabs)",
  params: { parcelId },
});
```

El `ResidentDashboard` se encarga de abrir el detalle del paquete.

---

## 9. Foreground y Realtime

Cuando la app está abierta, los mensajes de chat también llegan por Supabase Realtime:

```text
public.chat_messages INSERT
```

Esto se usa para:

- Actualizar mensajes en la conversación.
- Actualizar el contador de no leídos.
- Reproducir sonido local para mensajes recibidos de otros usuarios.

El sonido usa:

```text
assets/sounds/notification.mp3
```

Los mensajes enviados por el usuario actual no deben reproducir sonido.

OneSignal también tiene listener de foreground:

```ts
foregroundWillDisplay
```

Si se muestra la notificación desde OneSignal en foreground y además se reproduce sonido por Realtime, puede producirse doble sonido. Si se desea una sola señal en foreground, se debe decidir una única fuente:

- OneSignal para notificación visual/sonido, o
- Realtime para sonido local y badge.

---

## 10. Pruebas obligatorias para encomiendas

### Payload

Probar como mínimo:

```json
{
  "data": {
    "type": "package-arrived",
    "route": "encomienda",
    "parcel_id": "valid-uuid"
  }
}
```

### Estados de la app

1. App abierta en Home.
2. App abierta en otra sección.
3. App en background.
4. App cerrada completamente.
5. Splash visible.
6. Sesión restaurándose.
7. Usuario sin sesión.
8. Sesión expirada.
9. Consentimiento pendiente.
10. Comunidad todavía no seleccionada.
11. Notificación duplicada.
12. Dos encomiendas consecutivas.
13. Click repetido en la misma notificación.
14. Android físico.
15. iOS físico.

### Logs esperados para encomienda

Conviene agregar logs equivalentes:

```text
[ParcelPush] notification clicked
[ParcelPush] payload parsed
[ParcelPush] session ready
[ParcelPush] navigation ready
[ParcelPush] dashboard ready
[ParcelPush] parcel pending stored
[ParcelPush] opening parcel detail
[ParcelPush] navigation completed
```

---

## 11. Diagnóstico de OneSignal

Si el backend registra:

```text
invalid_player_ids
```

revisar inmediatamente:

1. Si el valor viene de `getIdAsync()`.
2. Si el backend lo envía como `include_subscription_ids`.
3. Si se está usando el mismo `app_id` de la build.
4. Si el usuario tiene permiso de notificaciones.
5. Si el `player_id`/subscription ID fue invalidado por reinstalación.
6. Si existe una fila actualizada en `onesignal_players`.

Un `HTTP 200` de OneSignal no significa que todos los destinatarios sean válidos. Siempre revisar:

```text
invalid_player_ids
invalid_subscription_ids
recipients
```

---

## 12. Checklist de reparación de encomiendas

- [ ] Backend envía `data.type = "package-arrived"`.
- [ ] Backend envía `data.parcel_id`.
- [ ] El ID corresponde a un paquete existente.
- [ ] OneSignal usa subscription IDs o aliases correctamente.
- [ ] La app guarda el push si la sesión no está lista.
- [ ] La navegación espera root navigation.
- [ ] La navegación espera usuario/comunidad.
- [ ] La navegación no ocurre dos veces.
- [ ] El splash se oculta aunque falle la carga.
- [ ] La modal global no queda visible como overlay transparente.
- [ ] `ResidentDashboard` recibe `parcelId`.
- [ ] `ResidentContext` procesa `setPendingParcelId`.
- [ ] `PackageDetailSheet.present()` se ejecuta una sola vez.
- [ ] Android usa `launchMode = singleTask`.
- [ ] El scheme canónico de deep links es `visitmeapp`.
- [ ] Se prueba cold start en Android físico.
- [ ] Se prueban logs en Metro y `adb logcat`.

---

## 13. Comandos de diagnóstico

### Logs Android

```bash
adb logcat -c
adb logcat -s ReactNativeJS
```

### Reiniciar development build

```bash
npx expo start -c
npx expo run:android
```

### Reinstalar completamente

```bash
adb uninstall cl.visitme.app
npx expo run:android
```

### Validar el payload en backend

Registrar solamente:

```text
notificationId
userId destinatario
subscriptionId anonimizado o hash
notification type
conversation_id / parcel_id
message_id
app_url
resultado de OneSignal
invalid IDs
```

Nunca registrar:

- Access tokens.
- Refresh tokens.
- API keys.
- Service role keys.
- Contenido privado del mensaje.
