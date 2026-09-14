# Contrato de API: Chat

## 1. Reglas generales

- La identidad se obtiene de la sesión autenticada.
- Nunca aceptar desde el cliente `sender_id`, `community_id`, `department_id` o permisos.
- Las operaciones mutantes deben validar RLS y autorización.
- Usar paginación por cursor.
- Usar `client_message_id` e `Idempotency-Key` para reintentos.
- La base de datos es la fuente de verdad; Realtime y OneSignal son mecanismos de distribución.

## 2. Endpoints

### Crear conversación

```http
POST /api/chat/conversations
```

```json
{"category":"consulta_general","priority":"normal","subject":"Consulta","body":"Mensaje inicial"}
```

El servidor deriva residente, departamento y comunidad. Responde `201` con conversación y primer mensaje.

### Listar residente

```http
GET /api/chat/conversations?status=open&cursor=<cursor>&limit=20
```

### Listar bandeja de conserjería

```http
GET /api/chat/inbox?status=open&assigned=unassigned&cursor=<cursor>&limit=50
```

El resultado se filtra por las comunidades autorizadas del usuario.

### Obtener detalle

```http
GET /api/chat/conversations/{conversation_id}
```

### Listar mensajes

```http
GET /api/chat/conversations/{conversation_id}/messages?before=<cursor>&limit=50
```

Ordenar de forma estable por `created_at` e `id`.

### Enviar mensaje

```http
POST /api/chat/conversations/{conversation_id}/messages
Idempotency-Key: <unique-key>
```

```json
{"body":"Respuesta","message_type":"text","client_message_id":"uuid"}
```

### Marcar leído

```http
POST /api/chat/conversations/{conversation_id}/read
```

```json
{"last_read_message_id":"uuid"}
```

### Tomar conversación

```http
POST /api/chat/conversations/{conversation_id}/claim
```

Debe ser atómico. Si otro conserje ganó, responder `409 Conflict`.

### Reasignar

```http
POST /api/chat/conversations/{conversation_id}/assign
```

```json
{"assigned_to":"uuid","reason":"Cambio de turno"}
```

### Cambiar estado

```http
POST /api/chat/conversations/{conversation_id}/status
```

```json
{"status":"resolved"}
```

### Nota interna

```http
POST /api/chat/conversations/{conversation_id}/internal-notes
```

Nunca debe estar disponible para residentes.

### Adjuntos

```http
POST /api/chat/conversations/{conversation_id}/attachments/sign
POST /api/chat/messages/{message_id}/attachments/confirm
```

El backend valida permiso, MIME y tamaño antes de generar URL firmada y al confirmar el upload.

## 3. Respuesta de error

```json
{"error":{"code":"FORBIDDEN","message":"Sin permisos","requestId":"uuid"}}
```

Códigos mínimos:

```text
400 VALIDATION_ERROR
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
413 FILE_TOO_LARGE
422 INVALID_STATUS_TRANSITION
429 RATE_LIMITED
500 INTERNAL_ERROR
```

## 4. Eventos Realtime

Canales lógicos:

```text
conversation:{conversation_id}
community:{community_id}:chat-inbox
```

Eventos:

```text
conversation.created
conversation.updated
message.created
message.updated
message.deleted
conversation.read
```

Al reconectar, el cliente debe volver a consultar desde el último cursor conocido.

## 5. Notificaciones

Persistir primero y notificar después. Un fallo de OneSignal no debe revertir el mensaje. El payload debe incluir sólo:

```json
{"conversation_id":"uuid","message_id":"uuid","type":"chat_message"}
```

No incluir contenido sensible completo en el push.

---

## 6. Implementación vigente

La bandeja web utiliza actualmente:

```http
GET /api/chat/conversations
```

No se utiliza una ruta separada `/api/chat/inbox` en la implementación actual.

Rutas implementadas:

```http
POST /api/chat/conversations
GET  /api/chat/conversations

GET  /api/chat/conversations/{conversationId}/messages
POST /api/chat/conversations/{conversationId}/messages

POST /api/chat/conversations/{conversationId}/claim
POST /api/chat/conversations/{conversationId}/assign
POST /api/chat/conversations/{conversationId}/status
POST /api/chat/conversations/{conversationId}/read
POST /api/chat/conversations/{conversationId}/internal-notes
GET  /api/chat/conversations/{conversationId}/events

GET /api/chat/staff
```

La idempotencia vigente utiliza `client_message_id` y la restricción única en base de datos. El header `Idempotency-Key` queda como mejora futura.

La paginación por cursor y los adjuntos con Storage todavía están pendientes.
