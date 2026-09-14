# Plan de integración del chat en React Native

## 1. Contexto

La aplicación React Native de Visitme ya existe y cuenta con autenticación, navegación y OneSignal. Este documento no describe la creación de una app nueva. Describe la integración del módulo de chat de residentes sobre la app existente.

## 2. Objetivo

Permitir que un residente pueda:

- Crear una conversación con conserjería.
- Ver sus conversaciones activas e históricas.
- Recibir respuestas en tiempo real.
- Enviar mensajes de texto.
- Recibir notificaciones push.
- Abrir una conversación desde una notificación.
- Ver cuando otro turno retomó la conversación.
- Marcar mensajes como leídos.
- Reabrir una conversación según el estado permitido.

## 3. Reutilizar antes de crear

Antes de implementar, localizar y reutilizar:

- Provider o hook de autenticación.
- Cliente Supabase.
- Navegador principal.
- Cliente/configuración OneSignal.
- Sistema de permisos de notificaciones.
- Sistema de deep links.
- Store global o solución de cache.
- Componentes de botones, inputs, headers, avatars y listas.

No agregar una segunda instancia de autenticación, Supabase o OneSignal.

## 4. Navegación

Agregar al flujo existente:

```text
Chat
  ├── ConversationListScreen
  ├── NewConversationScreen
  └── ConversationDetailScreen
```

La notificación debe abrir:

```text
visitme://chat/conversations/{conversation_id}
```

Si el usuario no está autenticado, guardar el destino y abrirlo después del login.

## 5. API vigente

### Crear conversación

```http
POST /api/chat/conversations
```

```json
{
  "category": "consulta_general",
  "priority": "normal",
  "subject": "Consulta opcional",
  "body": "Mensaje inicial",
  "client_message_id": "uuid"
}
```

El backend determina automáticamente el usuario, departamento y comunidad. La app no debe enviar esos datos como fuente de autoridad.

### Listar conversaciones

```http
GET /api/chat/conversations?limit=20&status=open
```

El residente sólo recibe sus propias conversaciones.

### Obtener mensajes

```http
GET /api/chat/conversations/{conversationId}/messages?limit=50
```

### Enviar mensaje

```http
POST /api/chat/conversations/{conversationId}/messages
```

```json
{
  "body": "Mensaje del residente",
  "client_message_id": "uuid"
}
```

### Marcar leído

```http
POST /api/chat/conversations/{conversationId}/read
```

```json
{"last_read_message_id":"uuid"}
```

## 6. Modelos de estado

Mensaje local:

```text
sending
sent
failed
```

Conversación:

```text
open
assigned
pending_resident
pending_internal
resolved
closed
```

Los mensajes `internal_note` nunca deben solicitarse ni renderizarse en React Native.

## 7. Envío optimista e idempotencia

1. Validar que el texto no esté vacío.
2. Generar `client_message_id` con UUID.
3. Insertar el mensaje temporalmente con estado `sending`.
4. Enviar al endpoint.
5. Reemplazar el mensaje temporal por la respuesta del backend.
6. Si falla, conservar el texto y mostrar `failed`.
7. Reintentar usando el mismo `client_message_id`.
8. No crear un segundo mensaje si el backend ya confirmó el primero.

## 8. Realtime

El cliente debe suscribirse a los cambios de mensajes de la conversación usando el cliente Supabase existente.

Nombre lógico recomendado:

```text
chat-conversation-{conversationId}
```

Eventos relevantes:

- Insert de `chat_messages`.
- Cambio de `chat_conversations`.
- Mensaje de sistema por toma o retoma.
- Resolución, cierre o reapertura.

Realtime no es la fuente única de verdad. Al reconectar:

1. Validar sesión.
2. Re-suscribirse.
3. Recargar la conversación y mensajes.
4. Fusionar por `id` y `client_message_id`.
5. Reconciliar mensajes locales pendientes.

## 9. OneSignal existente

Reutilizar la configuración existente de OneSignal.

El backend enviará payloads con:

```json
{
  "conversation_id": "uuid",
  "message_id": "uuid",
  "type": "chat_message"
}
```

El push no debe mostrar el contenido sensible completo del mensaje.

Casos obligatorios:

- App abierta.
- App en background.
- App cerrada.
- Usuario sin sesión.
- Notificación duplicada.
- Conversación cerrada.
- Conversación no autorizada.
- Permiso de notificaciones denegado.

## 10. Pantalla de lista

Mostrar:

- Categoría o asunto.
- Último mensaje.
- Fecha de última actividad.
- Estado.
- Contador de no leídos.
- Indicador de conversación reabierta.
- Estado vacío.
- Estado de carga.
- Error con reintento.

## 11. Pantalla de detalle

Mostrar:

- Mensajes cronológicos.
- Mensajes de sistema.
- Nombre del equipo o conserje cuando corresponda.
- Composer de texto.
- Estado de envío.
- Reintento.
- Indicador de conexión.
- Marcar leído al entrar y cuando el detalle sea visible.
- Aviso de que el chat no reemplaza emergencias.

## 12. Adjuntos

La API de adjuntos aún está pendiente en Next.js. No implementar una subida directa al Storage hasta que existan endpoints de URL firmada y confirmación.

Cuando esté disponible, soportar inicialmente:

```text
JPG, JPEG, PNG, WEBP y PDF
```

## 13. Seguridad

- No incluir `SUPABASE_SERVICE_ROLE_KEY`.
- No permitir que el cliente determine departamento, comunidad o remitente.
- No mostrar `internal_note`.
- Validar autorización al abrir deep links.
- No escribir tokens ni mensajes sensibles en logs.
- Usar almacenamiento seguro para credenciales según la solución existente.

## 14. Pruebas móviles

Probar:

- Crear conversación.
- Recibir mensaje de conserjería.
- Responder.
- Realtime con app abierta.
- Push en background.
- Deep link con app cerrada.
- Reintento sin duplicar.
- Sesión expirada.
- Conversación cerrada.
- Retoma por otro turno.
- Mensaje de sistema visible.
- Residente intentando acceder a otra conversación.

## 15. Criterio de finalización

El módulo estará listo cuando el residente pueda completar el flujo:

```text
Abrir Chat
  -> Crear conversación
  -> Recibir respuesta push/Realtime
  -> Leer historial
  -> Responder
  -> Ver cambio de turno
  -> Marcar como leído
  -> Reabrir si corresponde
```

sin duplicar autenticación, Supabase ni OneSignal existentes.
