# Database Migrations: Bays & Devices

## Contexto

Este documento define las migraciones necesarias para crear las tablas de **Bahías** y **Dispositivos** en Visitme Cloud. Estas tablas permiten administrar los puntos de acceso de las comunidades bajo la estructura de **Enterprise → Communities**.

---

## Estructura de Jerarquía

```
Enterprise
  └── Community (comunidad/edificio)
        └── Bay (bahía/punto de acceso: entrada peat., salida peat., entrada vehic., salida vehic.)
              └── Device (dispositivo: QR, NFC, LPR, RFID, Relay, Keypad)
```

---

## Tablas a Crear

### 1. `bays` - Puntos de Acceso

```sql
CREATE TABLE public.bays (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    community_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL CHECK (type = ANY (ARRAY[
        'entrada_peatonal',
        'salida_peatonal', 
        'entrada_vehicular',
        'salida_vehicular'
    ])),
    description text,
    is_active boolean DEFAULT true,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bays_pkey PRIMARY KEY (id),
    CONSTRAINT bays_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id)
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_bays_community_id ON public.bays(community_id);
CREATE INDEX idx_bays_type ON public.bays(type);
CREATE INDEX idx_bays_is_active ON public.bays(is_active);
```

### 2. `devices` - Dispositivos por Bahía

```sql
CREATE TABLE public.devices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bay_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL CHECK (type = ANY (ARRAY[
        'qr_reader',
        'nfc_reader',
        'lpr_camera',
        'rfid_reader',
        'keypad',
        'relay'
    ])),
    connection_status text DEFAULT 'offline'::text CHECK (connection_status = ANY (ARRAY[
        'online',
        'offline',
        'error'
    ])),
    last_seen_at timestamp with time zone,
    config jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT devices_pkey PRIMARY KEY (id),
    CONSTRAINT devices_bay_id_fkey FOREIGN KEY (bay_id) REFERENCES public.bays(id) ON DELETE CASCADE
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_devices_bay_id ON public.devices(bay_id);
CREATE INDEX idx_devices_type ON public.devices(type);
CREATE INDEX idx_devices_connection_status ON public.devices(connection_status);
```

---

## Tabla de Sincronización (para Edge → Cloud)

Esta tabla permite que el Edge envíe eventos de hardware al cloud:

```sql
CREATE TABLE public.hardware_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    device_id uuid NOT NULL,
    bay_id uuid NOT NULL,
    community_id uuid NOT NULL,
    event_type text NOT NULL,
    event_value jsonb DEFAULT '{}'::jsonb,
    timestamp timestamp with time zone DEFAULT now(),
    synced boolean DEFAULT false,
    synced_at timestamp with time zone,
    edge_node_id uuid,
    CONSTRAINT hardware_events_pkey PRIMARY KEY (id),
    CONSTRAINT hardware_events_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id),
    CONSTRAINT hardware_events_bay_id_fkey FOREIGN KEY (bay_id) REFERENCES public.bays(id),
    CONSTRAINT hardware_events_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id)
);

-- Índices para eventos pendientes de sincronización
CREATE INDEX idx_hardware_events_synced ON public.hardware_events(synced) WHERE synced = false;
CREATE INDEX idx_hardware_events_timestamp ON public.hardware_events(timestamp DESC);
```

---

## Enum Types (Crear si no existen)

```sql
-- Bay types
CREATE TYPE bay_type AS ENUM (
    'entrada_peatonal',
    'salida_peatonal',
    'entrada_vehicular',
    'salida_vehicular'
);

-- Device types
CREATE TYPE device_type AS ENUM (
    'qr_reader',
    'nfc_reader',
    'lpr_camera',
    'rfid_reader',
    'keypad',
    'relay'
);

-- Device connection status
CREATE TYPE device_connection_status AS ENUM (
    'online',
    'offline',
    'error'
);
```

---

## Relaciones con Tablas Existentes

### Communities
Ya tiene `enterprise_id` (línea 175 del schema.sql), lo que permite la jerarquía Enterprise → Community.

### Enterprise Nodes
La tabla `enterprise_nodes` (línea 326) tiene:
- `community_id` - vínculo a comunidad
- `enterprise_id` - vínculo a enterprise
- `hwid` - Hardware ID del Edge
- `status` - estado del nodo (offline/online/etc.)
- `last_heartbeat_at` - último latido

**Relación sugerida**: Cada comunidad puede tener N nodos Edge. Cada nodo gestiona las bahías de su comunidad.

---

## API Endpoints Requeridos

### Bays
- `GET /communities/:id/bays` - Listar bahías de una comunidad
- `POST /communities/:id/bays` - Crear bahía
- `GET /bays/:id` - Obtener bahía con sus dispositivos
- `PUT /bays/:id` - Actualizar bahía
- `DELETE /bays/:id` - Eliminar bahía

### Devices
- `GET /bays/:bayId/devices` - Listar dispositivos de una bahía
- `POST /bays/:bayId/devices` - Crear dispositivo
- `GET /devices/:id` - Obtener dispositivo
- `PUT /devices/:id` - Actualizar dispositivo
- `DELETE /devices/:id` - Eliminar dispositivo

### Hardware Events (Edge → Cloud sync)
- `POST /events/sync` - Sincronizar eventos desde Edge
- `GET /communities/:id/events` - Obtener eventos de una comunidad

---

## Notas de Implementación

1. **UUIDs**: Usar `gen_random_uuid()` para IDs
2. **Timestamps**: Usar `timestamp with time zone DEFAULT now()`
3. **JSONB config**: Permite almacenar configuración específica por bahía/dispositivo
4. **Soft delete**: Considerar agregar `deleted_at` para eliminación lógica
5. **Auditoría**: Considerar usar la tabla `audit_logs` existente para tracking de cambios