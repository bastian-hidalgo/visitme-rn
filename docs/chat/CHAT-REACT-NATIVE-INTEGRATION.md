# Integración React Native: Chat de residentes

Complementa el plan funcional y la arquitectura del chat.

## 1. Navegación

Agregar una sección:

```text
Chat
  ├── ConversationListScreen
  ├── NewConversationScreen
  └── ConversationDetailScreen
```

Integrarla con la navegación existente sin duplicar el cliente de autenticación ni el cliente Supabase.

## 2. Lista de conversaciones

Mostrar:

- Categoría o asunto.
- Último mensaje.
- Fecha de actividad.
- Estado.
- Contador de no leídos.
- Indicador de conversación reabierta.

Cargar por páginas y actualizar mediante Realtime.

## 3. Detalle

Mostrar:

- Mensajes cronológicos.
- Mensajes de sistema: toma, reasignación, resolución, cierre y reapertura.
- Adjuntos permitidos.
- Composer de texto.
- Estados `sending`, `sent` y `failed`.
- Acción de reintento.
- Indicador de desconexión.

Las notas `internal_note` nunca deben solicitarse ni renderizarse en la aplicación del residente.

## 4. Envío idempotente

Flujo:

1. Validar texto localmente.
2. Generar `client_message_id`.
3. Mostrar mensaje optimista como `sending`.
4. Enviar usando `Idempotency-Key`.
5. Reemplazar por la respuesta persistida.
6. Marcar `failed` y conservar el texto si falla.
7. Reintentar sin crear duplicados.

## 5. Realtime y reconexión

Al abrir una conversación:

- Suscribirse a `conversation:{id}`.
- Cargar la página más reciente.
- Marcar como leído cuando el detalle sea visible.

Al reconectar:

1. Validar sesión.
2. Re-suscribirse.
3. Consultar mensajes posteriores al último `created_at/id` conocido.
4. Fusionar por `id` y `client_message_id`.
5. Reconciliar mensajes pendientes.

No asumir que un evento Realtime siempre llegó.

## 6. OneSignal y deep links

El deep link debe seguir el formato:

```text
visitme://chat/conversations/{conversation_id}
```

Casos a cubrir:

- App abierta.
- Background.
- App cerrada.
- Sesión expirada.
- Conversación no autorizada.
- Conversación cerrada.
- Notificación duplicada.

Antes de mostrar la conversación, consultar autorización en backend.

## 7. Adjuntos

Primera versión:

```text
JPG, JPEG, PNG, WEBP y PDF
Imagen: máximo 5 MB
PDF: máximo 10 MB
```

Implementar permisos de cámara/galería/archivos, compresión, progreso, cancelación, reintento y error de tipo/tamaño. No subir directamente a un bucket público.

## 8. Seguridad y UX

- No incluir service role key.
- No imprimir mensajes ni tokens en logs.
- Usar almacenamiento seguro para sesión.
- Mantener borrador si expira la sesión o falla la red.
- Mostrar claramente que el chat no reemplaza canales de emergencia.
- Probar lector de pantalla, tamaños de fuente, teclado y orientación.

---

## 9. Condición de integración

La app React Native ya existe y ya tiene OneSignal integrado. No se debe crear un cliente Supabase, sistema de autenticación o integración OneSignal paralelos.

La implementación móvil debe reutilizar:

- Sesión autenticada actual.
- Cliente Supabase actual.
- Navegación actual.
- Sistema de estado existente.
- Registro actual de dispositivos OneSignal.
- Sistema existente de deep links.

Las tareas específicas del chat están detalladas en [`PLAN-CHAT-REACT-NATIVE.md`](./PLAN-CHAT-REACT-NATIVE.md).
