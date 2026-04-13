# Visitme Edge - API Documentation
## Cloud Backend Implementation Guide

---

## 1. Overview

Visitme Edge es un servidor local (Edge Computing) que corre en las instalaciones del cliente y se comunica con Visitme Cloud para:
- Sincronizar configuración de bahías y dispositivos
- Registrar eventos de hardware (accesos, llegadas, errores)
- Reportar estado de salud del nodo y sus drivers

### Base URL
- **Staging**: `https://api-staging.visitme.cl`
- **Production**: `https://api.visitme.cl`
- **Autenticación**: Bearer token (API Key del Edge)

---

## 2. Authentication

El Edge se autentica mediante una API Key almacenada localmente. En la primera configuración, el usuario ingresa la clave que se guarda en la base de datos SQLite local.

**Headers requeridos:**
```
Authorization: Bearer <EDGE_API_KEY>
Content-Type: application/json
```

---

## 3. Endpoints

### 3.1 Site Configuration (Edge ← Cloud)

#### `GET /edge/site/config`
Obtiene la configuración completa del sitio incluyendo bahías y dispositivos.

**Response:**
```json
{
  "site_id": "site-001",
  "site_name": "Condominio Los Andes",
  "community_name": "Los Andes Residence",
  "bays": [
    {
      "id": "bay-1",
      "name": "Entrada Principal",
      "type": "entrada_peatonal",
      "description": "Acceso principal con lector QR y NFC",
      "site_id": "site-001",
      "is_active": true,
      "devices": [
        {
          "id": "dev-qr-1",
          "name": "Lector QR Principal",
          "type": "qr_reader",
          "bay_id": "bay-1",
          "connection_status": "online",
          "last_seen": "2024-01-15T10:30:00Z",
          "config": { "baudRate": 9600 }
        }
      ]
    }
  ],
  "last_sync": "2024-01-15T10:00:00Z"
}
```

---

#### `GET /edge/site/info`
Obtiene información resumida del sitio.

**Response:**
```json
{
  "site_id": "site-001",
  "site_name": "Condominio Los Andes",
  "community_id": "comm-001",
  "community_name": "Los Andes Residence",
  "active_bays": 4,
  "total_devices": 9
}
```

---

#### `GET /edge/bays`
Lista todas las bahías configuradas para este edge.

**Response:**
```json
{
  "bays": [
    {
      "id": "bay-1",
      "name": "Entrada Principal",
      "type": "entrada_peatonal",
      "description": "Acceso principal",
      "site_id": "site-001",
      "is_active": true,
      "devices": []
    }
  ]
}
```

---

#### `GET /edge/bays/:bayId/devices`
Lista los dispositivos de una bahía específica.

**Response:**
```json
{
  "devices": [
    {
      "id": "dev-qr-1",
      "name": "Lector QR Principal",
      "type": "qr_reader",
      "bay_id": "bay-1",
      "connection_status": "online",
      "last_seen": "2024-01-15T10:30:00Z",
      "config": {}
    }
  ]
}
```

---

### 3.2 Device Heartbeat (Edge → Cloud)

#### `POST /edge/devices/heartbeat`
Registra el heartbeat de un dispositivo.

**Request:**
```json
{
  "device_id": "dev-qr-1",
  "status": "online",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 3.3 Node Health (Edge → Cloud)

#### `POST /edge/health`
Registra el estado de salud del nodo Edge.

**Request:**
```json
{
  "node_id": "node-001",
  "hwid": "HWID-ABC123",
  "timestamp": "2024-01-15T10:30:00Z",
  "health_payload": {
    "cpu_usage": 45.2,
    "memory_usage": 62.1,
    "disk_usage": 23.5,
    "network_status": "connected",
    "drivers_status": {
      "qr-main-001": "online",
      "relay-barrier-001": "online",
      "lpr-camera-001": "online"
    }
  }
}
```

**Response:**
```json
{
  "status": "acknowledged",
  "server_time": "2024-01-15T10:30:01Z"
}
```

---

### 3.4 Events Sync (Edge → Cloud)

#### `POST /edge/events/sync`
Sincroniza eventos de hardware desde el Edge al Cloud.

**Request:**
```json
{
  "node_id": "node-001",
  "community_id": "comm-001",
  "events": [
    {
      "id": "evt-001",
      "device_id": "dev-qr-1",
      "bay_id": "bay-1",
      "event_type": "qr_read",
      "event_value": {
        "code": "VISIT-2024-001",
        "visitor_name": "Juan Pérez",
        "result": "granted"
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "synced_ids": ["evt-001"],
  "failed_ids": []
}
```

---

### 3.5 Visits (Edge ← Cloud)

#### `GET /edge/visits/active`
Obtiene las visitas activas (llegadas pero no exits) para este sitio.

**Response:**
```json
{
  "visits": [
    {
      "id": "visit-001",
      "visitor_name": "Juan Pérez",
      "license_plate": "BXRT-45",
      "contact": "+56 9 1234 5678",
      "department_id": "dept-101",
      "community_id": "comm-001",
      "code": "VISIT-2024-001",
      "scheduled_at": "2024-01-15T14:00:00Z",
      "status": "arrived",
      "type": "vehicular",
      "resident_name": "María González",
      "department": "Torre A, Depto 101",
      "arrived_at": "2024-01-15T10:30:00Z",
      "guests": 2
    }
  ]
}
```

---

#### `POST /edge/visits/:visitId/arrive`
Registra la llegada de un visitante.

**Request:**
```json
{
  "arrived_at": "2024-01-15T10:30:00Z",
  "guests": 2,
  "document_type": "rut",
  "document_mrz": "12345678-9"
}
```

**Response:**
```json
{
  "success": true,
  "visit": {
    "id": "visit-001",
    "status": "arrived",
    "arrived_at": "2024-01-15T10:30:00Z"
  }
}
```

---

#### `POST /edge/visits/:visitId/exit`
Registra la salida de un visitante.

**Response:**
```json
{
  "success": true,
  "visit": {
    "id": "visit-001",
    "status": "exited",
    "exited_at": "2024-01-15T12:30:00Z"
  }
}
```

---

## 4. Data Types

### Bay Types
```typescript
type BayType = 
  | 'entrada_peatonal'    // Acceso peatonal de entrada
  | 'salida_peatonal'     // Acceso peatonal de salida
  | 'entrada_vehicular'   // Acceso vehicular de entrada
  | 'salida_vehicular';   // Acceso vehicular de salida
```

### Device Types
```typescript
type DeviceType = 
  | 'qr_reader'    // Lector de códigos QR
  | 'nfc_reader'   // Lector de tarjetas NFC
  | 'lpr_camera'   // Cámara de reconocimiento de patentes (License Plate Recognition)
  | 'rfid_reader'  // Lector de tags RFID
  | 'keypad'       // Teclado numérico
  | 'relay';       // Relé para abrir/cerrar barreras
```

### Device Connection Status
```typescript
type DeviceConnectionStatus = 
  | 'online'   // Dispositivo conectado y funcionando
  | 'offline'  // Dispositivo desconectado
  | 'error';   // Dispositivo con errores
```

---

## 5. Database Schema (Referencia para migraciones)

Ver documento: `docs/BAYS_DEVICES_MIGRATIONS.md`

---

## 6. Edge → Cloud Sync Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        EDGE (Local)                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Drivers    │───▶│ Hardware    │───▶│ SyncManager │     │
│  │  (QR, NFC)  │    │ Manager     │    │             │     │
│  └─────────────┘    └─────────────┘    └──────┬──────┘     │
│                                               │             │
│                    ┌─────────────┐             │             │
│                    │ SQLite DB   │◀────────────┘             │
│                    │ (pending)   │                           │
│                    └─────────────┘                           │
└───────────────────────────┬─────────────────────────────────┘
                            │ POST /edge/events/sync
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUD (API)                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Validate   │───▶│  Process    │───▶│  Store in   │     │
│  │  API Key    │    │  Events     │    │  DB         │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Configuration Pull Flow (Cloud → Edge)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUD (API)                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Validate   │───▶│  Get Site   │───▶│  Return     │     │
│  │  API Key    │    │  Config     │    │  Config     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │ GET /edge/site/config
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        EDGE (Local)                         │
│                   ┌─────────────┐                           │
│                   │ SyncManager │                           │
│                   │ .pullSiteConfig()                       │
│                   └──────┬──────┘                           │
│                          │                                   │
│                    ┌─────────────┐                          │
│                    │ Update      │                          │
│                    │ Local Bays  │                          │
│                    │ & Devices   │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "La API key proporcionada no es válida",
    "details": {}
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_API_KEY` | 401 | API key inválida o expirada |
| `NODE_NOT_FOUND` | 404 | Nodo edge no registrado |
| `COMMUNITY_MISMATCH` | 403 | El nodo no pertenece a esta comunidad |
| `INVALID_EVENT_TYPE` | 400 | Tipo de evento no reconocido |
| `VALIDATION_ERROR` | 400 | Datos de entrada inválidos |

---

## 9. Rate Limits

- **Health heartbeats**: Max 1 por minuto por dispositivo
- **Events sync**: Max 100 eventos por request, max 10 requests por minuto
- **Config pull**: Max 1 por minuto

---

## 10. Implementation Notes for Cloud Team

1. **API Key validation**: Cada request debe validar que el `node_id` en el token coincide con el enterprise_node registrado
2. **Community scoping**: Los datos devueltos deben filtrarse por `community_id` del nodo
3. **Async processing**: Los eventos pueden procesarse de forma asíncrona
4. **Batch support**: Soportar batch de eventos para reducir overhead
5. **Offline tolerance**: El cloud debe poder recibir eventos con timestamps antiguos (up to 24h)
6. **Driver status aggregation**: Agregar status de drivers en el health payload para monitoreo