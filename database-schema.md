# Schema de Base de Datos - Sistema de Inventario de Vestidos

## Tabla: productos
Almacena la información básica de cada producto del catálogo.

- `id` (PK, UUID) - Identificador único del producto
- `imei` (UNIQUE, VARCHAR) - Código IMEI único del producto
- `nombre` (VARCHAR) - Nombre descriptivo del producto
- `descripcion` (TEXT, nullable) - Descripción detallada del producto
- `imagen_url` (VARCHAR, nullable) - URL de la imagen del producto
- `activo` (BOOLEAN, default: true) - Indica si el producto está activo
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

**Índices:**
- `idx_productos_imei` en `imei`
- `idx_productos_activo` en `activo`

---

## Tabla: tipo_tallas
Define los diferentes tipos de sistemas de tallas disponibles.

- `id` (PK, UUID) - Identificador único del tipo de talla
- `nombre` (VARCHAR) - Nombre del tipo: "Letras", "Números Niños", "Números Adultos"
- `descripcion` (TEXT, nullable) - Descripción del tipo de talla
- `valores` (JSON) - Array de valores posibles. Ejemplos:
  - Letras: `["S", "M", "L", "XL"]`
  - Números Niños: `["2", "4", "6", "8", "10", "12"]`
  - Números Adultos: `["36", "38", "40", "42", "44", "46"]`
- `activo` (BOOLEAN, default: true) - Indica si el tipo está activo
- `created_at` (TIMESTAMP) - Fecha de creación

**Datos iniciales:**
```sql
INSERT INTO tipo_tallas (nombre, valores) VALUES
  ('Letras', '["S","M","L","XL"]'),
  ('Números Niños', '["2","4","6","8","10","12"]'),
  ('Números Adultos', '["36","38","40","42","44","46"]');
```

---

## Tabla: variaciones_producto
Representa las variaciones de talla disponibles para cada producto.

- `id` (PK, UUID) - Identificador único de la variación
- `producto_id` (FK -> productos.id) - Producto al que pertenece
- `tipo_talla_id` (FK -> tipo_tallas.id) - Tipo de sistema de tallas
- `talla` (VARCHAR) - Valor específico de la talla (debe existir en tipo_tallas.valores)
- `stock_disponible` (INTEGER, default: 0) - Cantidad de unidades disponibles
- `stock_total` (INTEGER, default: 0) - Cantidad total de unidades generadas
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

**Índices:**
- `idx_variaciones_producto_id` en `producto_id`
- `idx_variaciones_talla` en `talla`
- UNIQUE constraint en `(producto_id, talla)` - No puede haber duplicados

---

## Tabla: productos_individuales
Cada registro representa un vestido físico único con su QR code.

- `id` (PK, UUID) - ID único de cada vestido físico
- `variacion_id` (FK -> variaciones_producto.id) - Variación a la que pertenece
- `qr_code` (VARCHAR, UNIQUE) - Código QR único del vestido
- `estado` (ENUM) - Estado actual del vestido:
  - `disponible` - En stock y listo para rentar
  - `fuera_stock` - Asignado a un pedido
  - `en_transito` - En camino con el motorizado
  - `devuelto` - Devuelto por el cliente
  - `mantenimiento` - En reparación o limpieza
- `entallado` (BOOLEAN, default: false) - TRUE si fue resultado de un cambio de talla
- `pedido_original_id` (FK -> pedidos.id, nullable) - Si fue entallado, referencia al pedido que lo generó
- `observaciones` (TEXT, nullable) - Notas adicionales sobre el vestido
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

**Índices:**
- `idx_productos_individuales_qr` en `qr_code`
- `idx_productos_individuales_estado` en `estado`
- `idx_productos_individuales_variacion` en `variacion_id`

**Trigger:**
- Al insertar o actualizar estado, actualizar `stock_disponible` en `variaciones_producto`

---

## Tabla: clientes
Información de los clientes que realizan pedidos.

- `id` (PK, UUID) - Identificador único del cliente
- `nombre` (VARCHAR) - Nombre completo del cliente
- `telefono` (VARCHAR) - Teléfono de contacto
- `direccion` (TEXT) - Dirección de entrega
- `email` (VARCHAR, nullable) - Correo electrónico (opcional)
- `notas` (TEXT, nullable) - Notas adicionales sobre el cliente
- `activo` (BOOLEAN, default: true) - Cliente activo o inactivo
- `created_at` (TIMESTAMP) - Fecha de registro
- `updated_at` (TIMESTAMP) - Fecha de última actualización

**Índices:**
- `idx_clientes_telefono` en `telefono`
- `idx_clientes_activo` en `activo`

---

## Tabla: pedidos
Registro de todos los pedidos realizados.

- `id` (PK, UUID) - Identificador único del pedido
- `numero_pedido` (VARCHAR, UNIQUE) - Número legible del pedido (ej: PED-001)
- `cliente_id` (FK -> clientes.id) - Cliente que realiza el pedido
- `fecha_pedido` (TIMESTAMP) - Fecha y hora del pedido
- `estado` (ENUM) - Estado del pedido:
  - `pendiente` - Pedido registrado, no confirmado
  - `confirmado` - Pedido confirmado, pendiente de alistar
  - `alistado` - Productos asignados, listo para enviar
  - `enviado` - En camino al cliente
  - `entregado` - Entregado al cliente
  - `con_cambios` - Requiere cambio de productos
  - `completado` - Pedido completado y cerrado
  - `cancelado` - Pedido cancelado
- `total_items` (INTEGER) - Número total de items en el pedido
- `items_asignados` (INTEGER, default: 0) - Número de items ya asignados
- `observaciones` (TEXT, nullable) - Notas sobre el pedido
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

**Índices:**
- `idx_pedidos_numero` en `numero_pedido`
- `idx_pedidos_cliente` en `cliente_id`
- `idx_pedidos_estado` en `estado`
- `idx_pedidos_fecha` en `fecha_pedido`

---

## Tabla: detalle_pedido
Items específicos solicitados en cada pedido.

- `id` (PK, UUID) - Identificador único del detalle
- `pedido_id` (FK -> pedidos.id) - Pedido al que pertenece
- `variacion_id` (FK -> variaciones_producto.id) - Variación solicitada
- `cantidad` (INTEGER) - Cantidad solicitada
- `cantidad_asignada` (INTEGER, default: 0) - Cantidad ya asignada
- `created_at` (TIMESTAMP) - Fecha de creación

**Índices:**
- `idx_detalle_pedido` en `pedido_id`
- `idx_detalle_variacion` en `variacion_id`

---

## Tabla: asignacion_productos
Relación entre productos individuales y pedidos.

- `id` (PK, UUID) - Identificador único de la asignación
- `detalle_pedido_id` (FK -> detalle_pedido.id) - Detalle del pedido
- `producto_individual_id` (FK -> productos_individuales.id) - Vestido asignado
- `fecha_asignacion` (TIMESTAMP) - Fecha de asignación
- `asignado_por` (VARCHAR, nullable) - Usuario que realizó la asignación
- `created_at` (TIMESTAMP) - Fecha de creación

**Índices:**
- `idx_asignacion_detalle` en `detalle_pedido_id`
- `idx_asignacion_producto` en `producto_individual_id`
- UNIQUE constraint en `producto_individual_id` - Un vestido solo puede estar en un pedido activo

**Trigger:**
- Al insertar, actualizar estado del producto_individual a 'fuera_stock'
- Al insertar, incrementar `cantidad_asignada` en `detalle_pedido`

---

## Tabla: motorizados
Personal encargado de las entregas.

- `id` (PK, UUID) - Identificador único del motorizado
- `nombre` (VARCHAR) - Nombre completo del motorizado
- `telefono` (VARCHAR) - Teléfono de contacto
- `documento_identidad` (VARCHAR, nullable) - Cédula o documento
- `vehiculo` (VARCHAR, nullable) - Descripción del vehículo
- `activo` (BOOLEAN, default: true) - Motorizado activo o inactivo
- `created_at` (TIMESTAMP) - Fecha de registro
- `updated_at` (TIMESTAMP) - Fecha de última actualización

**Índices:**
- `idx_motorizados_activo` en `activo`

---

## Tabla: viajes
Registro de viajes de entrega y recolección.

- `id` (PK, UUID) - Identificador único del viaje
- `numero_viaje` (VARCHAR, UNIQUE) - Número legible del viaje (ej: VIA-001)
- `pedido_id` (FK -> pedidos.id) - Pedido relacionado con el viaje
- `motorizado_id` (FK -> motorizados.id) - Motorizado asignado
- `tipo_viaje` (ENUM) - Tipo de viaje:
  - `entrega_inicial` - Primera entrega del pedido
  - `cambio_producto` - Cambio de producto por otro modelo
  - `entallado` - Cambio por diferente talla del mismo producto
  - `devolucion` - Solo devolución de productos
- `estado` (ENUM) - Estado del viaje:
  - `programado` - Viaje programado, no iniciado
  - `en_camino` - Motorizado en camino
  - `entregado` - Entrega completada
  - `con_devolucion` - Entregado con devolución de productos
  - `cancelado` - Viaje cancelado
- `fecha_envio` (DATE) - Fecha programada de envío
- `fecha_retorno` (DATE, nullable) - Fecha estimada de retorno (si hay devolución)
- `fecha_real_envio` (TIMESTAMP, nullable) - Fecha real de inicio del viaje
- `fecha_real_retorno` (TIMESTAMP, nullable) - Fecha real de retorno
- `observaciones` (TEXT, nullable) - Notas sobre el viaje
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

**Índices:**
- `idx_viajes_numero` en `numero_viaje`
- `idx_viajes_pedido` en `pedido_id`
- `idx_viajes_motorizado` en `motorizado_id`
- `idx_viajes_estado` en `estado`
- `idx_viajes_fecha_envio` en `fecha_envio`

---

## Tabla: productos_viaje
Productos específicos que se envían o recogen en cada viaje.

- `id` (PK, UUID) - Identificador único del registro
- `viaje_id` (FK -> viajes.id) - Viaje al que pertenece
- `producto_individual_id` (FK -> productos_individuales.id) - Vestido específico
- `tipo_movimiento` (ENUM) - Tipo de movimiento:
  - `envio` - Producto que se envía al cliente
  - `devolucion` - Producto que se recoge del cliente
- `confirmado` (BOOLEAN, default: false) - Si se confirmó la entrega/recepción
- `fecha_confirmacion` (TIMESTAMP, nullable) - Fecha de confirmación
- `created_at` (TIMESTAMP) - Fecha de creación

**Índices:**
- `idx_productos_viaje_viaje` en `viaje_id`
- `idx_productos_viaje_producto` en `producto_individual_id`

**Trigger:**
- Al marcar confirmado=true con tipo_movimiento='envio', actualizar estado del producto a 'en_transito'
- Al marcar confirmado=true con tipo_movimiento='devolucion', actualizar estado del producto a 'devuelto'

---

## Tabla: cambios_producto
Registro de cambios de productos (intercambios, entallados).

- `id` (PK, UUID) - Identificador único del cambio
- `viaje_id` (FK -> viajes.id) - Viaje donde se realiza el cambio
- `producto_original_id` (FK -> productos_individuales.id) - Vestido que se devuelve
- `producto_nuevo_id` (FK -> productos_individuales.id) - Vestido que se entrega
- `motivo` (TEXT) - Razón del cambio
- `es_entallado` (BOOLEAN) - TRUE si es cambio de talla del mismo producto
- `autorizado_por` (VARCHAR, nullable) - Quien autorizó el cambio
- `fecha_cambio` (TIMESTAMP) - Fecha del cambio
- `created_at` (TIMESTAMP) - Fecha de creación

**Índices:**
- `idx_cambios_viaje` en `viaje_id`
- `idx_cambios_original` en `producto_original_id`
- `idx_cambios_nuevo` en `producto_nuevo_id`

**Trigger:**
- Si es_entallado=true, marcar producto_nuevo como entallado=true y guardar pedido_original_id

---

## Vistas Útiles

### vista_stock_disponible
Vista que muestra el stock actual por producto y talla.

```sql
CREATE VIEW vista_stock_disponible AS
SELECT 
  p.imei,
  p.nombre,
  vp.talla,
  tt.nombre as tipo_talla,
  vp.stock_disponible,
  vp.stock_total,
  COUNT(CASE WHEN pi.entallado = true THEN 1 END) as cantidad_entallados
FROM variaciones_producto vp
JOIN productos p ON vp.producto_id = p.id
JOIN tipo_tallas tt ON vp.tipo_talla_id = tt.id
LEFT JOIN productos_individuales pi ON pi.variacion_id = vp.id
WHERE p.activo = true
GROUP BY p.imei, p.nombre, vp.talla, tt.nombre, vp.stock_disponible, vp.stock_total;
```

### vista_pedidos_pendientes
Vista de pedidos que requieren atención.

```sql
CREATE VIEW vista_pedidos_pendientes AS
SELECT 
  ped.numero_pedido,
  ped.estado,
  c.nombre as cliente,
  c.telefono,
  ped.total_items,
  ped.items_asignados,
  (ped.total_items - ped.items_asignados) as items_pendientes,
  ped.fecha_pedido
FROM pedidos ped
JOIN clientes c ON ped.cliente_id = c.id
WHERE ped.estado IN ('confirmado', 'alistado')
ORDER BY ped.fecha_pedido DESC;
```

### vista_viajes_dia
Vista de viajes programados para el día actual.

```sql
CREATE VIEW vista_viajes_dia AS
SELECT 
  v.numero_viaje,
  v.tipo_viaje,
  v.estado,
  ped.numero_pedido,
  c.nombre as cliente,
  c.direccion,
  m.nombre as motorizado,
  m.telefono as telefono_motorizado,
  v.fecha_envio,
  COUNT(pv.id) as total_productos
FROM viajes v
JOIN pedidos ped ON v.pedido_id = ped.id
JOIN clientes c ON ped.cliente_id = c.id
JOIN motorizados m ON v.motorizado_id = m.id
LEFT JOIN productos_viaje pv ON pv.viaje_id = v.id
WHERE v.fecha_envio = CURRENT_DATE
GROUP BY v.id, v.numero_viaje, v.tipo_viaje, v.estado, ped.numero_pedido, 
         c.nombre, c.direccion, m.nombre, m.telefono, v.fecha_envio
ORDER BY v.estado, v.numero_viaje;
```

---

## Reglas de Negocio Implementadas

1. **Stock Automático**: Al crear/actualizar productos_individuales, se actualiza automáticamente el stock_disponible en variaciones_producto.

2. **Asignación Única**: Un producto_individual solo puede estar asignado a un pedido activo a la vez (constraint UNIQUE).

3. **Control de Estado**: Los cambios de estado de productos_individuales se registran y afectan el stock disponible.

4. **Entallados**: Los productos marcados como entallado=true mantienen referencia al pedido original para trazabilidad.

5. **Validación de Cantidades**: Las cantidades asignadas no pueden exceder las solicitadas (trigger o constraint check).

6. **Viajes por Pedido**: Un pedido puede tener múltiples viajes (entrega inicial + cambios/entallados).

7. **Numeración Automática**: Los números de pedido y viaje se generan automáticamente con secuencia (función o trigger).

---

## Índices Adicionales Recomendados

```sql
-- Para reportes de motorizados
CREATE INDEX idx_viajes_motorizado_fecha ON viajes(motorizado_id, fecha_envio);

-- Para búsqueda de clientes
CREATE INDEX idx_clientes_nombre ON clientes(nombre);

-- Para historial de productos
CREATE INDEX idx_productos_individuales_pedido ON productos_individuales(pedido_original_id) 
WHERE pedido_original_id IS NOT NULL;

-- Para análisis de cambios
CREATE INDEX idx_cambios_fecha ON cambios_producto(fecha_cambio);
```

---

## Consideraciones de Seguridad

1. **RLS (Row Level Security)**: Implementar políticas según roles de usuario (Mariana, motorizados, administradores).

2. **Auditoría**: Agregar campos `created_by` y `updated_by` en tablas críticas.

3. **Soft Delete**: Considerar usar `deleted_at` en lugar de eliminar registros físicamente.

4. **Encriptación**: Los datos sensibles como teléfonos y direcciones deben encriptarse en producción.

---

## Migraciones y Datos Iniciales

Al crear la base de datos, ejecutar en orden:

1. Crear tablas base (productos, tipo_tallas, clientes, motorizados)
2. Crear tablas de variaciones (variaciones_producto, productos_individuales)
3. Crear tablas de pedidos (pedidos, detalle_pedido, asignacion_productos)
4. Crear tablas de viajes (viajes, productos_viaje, cambios_producto)
5. Insertar datos iniciales de tipo_tallas
6. Crear vistas
7. Crear índices adicionales
8. Aplicar políticas de seguridad
