-- Drop existing tables and types (in correct order due to foreign keys)
DROP TRIGGER IF EXISTS set_trip_number ON public.trips;
DROP TRIGGER IF EXISTS set_order_number ON public.orders;
DROP TRIGGER IF EXISTS generate_dress_unit_qr_code_trigger ON public.dress_units;
DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_dress_units_updated_at ON public.dress_units;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_motorizados_updated_at ON public.motorizados;
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;

DROP FUNCTION IF EXISTS public.assign_dress_unit_by_qr(TEXT, UUID);
DROP FUNCTION IF EXISTS public.generate_trip_number();
DROP FUNCTION IF EXISTS public.generate_order_number();
DROP FUNCTION IF EXISTS public.generate_dress_unit_qr_code();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

DROP TABLE IF EXISTS public.trip_orders CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.dress_units CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.motorizados CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;

DROP TYPE IF EXISTS public.trip_status;
DROP TYPE IF EXISTS public.trip_type;
DROP TYPE IF EXISTS public.dress_unit_status;
DROP TYPE IF EXISTS public.order_status;
DROP TYPE IF EXISTS public.letter_size;
DROP TYPE IF EXISTS public.size_system;

-- Create new enums with Spanish names
CREATE TYPE public.estado_producto_individual AS ENUM ('disponible', 'fuera_stock', 'en_transito', 'devuelto');
CREATE TYPE public.estado_pedido AS ENUM ('pendiente', 'confirmado', 'alistado', 'enviado', 'entregado', 'cancelado');
CREATE TYPE public.tipo_viaje AS ENUM ('entrega_inicial', 'cambio_producto', 'entallado');
CREATE TYPE public.estado_viaje AS ENUM ('programado', 'en_camino', 'entregado', 'con_devolucion');
CREATE TYPE public.tipo_movimiento AS ENUM ('envio', 'devolucion');

-- Tabla: productos
CREATE TABLE public.productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imei VARCHAR NOT NULL UNIQUE,
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: tipo_tallas
CREATE TABLE public.tipo_tallas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  valores JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Tabla: variaciones_producto
CREATE TABLE public.variaciones_producto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  tipo_talla_id UUID NOT NULL REFERENCES public.tipo_tallas(id) ON DELETE RESTRICT,
  talla VARCHAR NOT NULL,
  stock_disponible INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(producto_id, talla)
);

-- Tabla: clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  telefono VARCHAR NOT NULL,
  direccion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: pedidos
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido VARCHAR UNIQUE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  fecha_pedido TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estado public.estado_pedido NOT NULL DEFAULT 'pendiente',
  fecha_evento DATE,
  fecha_entrega DATE,
  fecha_devolucion DATE,
  direccion_entrega TEXT,
  distrito_entrega VARCHAR,
  referencia_entrega TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposito DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposito_pagado BOOLEAN NOT NULL DEFAULT false,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: detalle_pedido
CREATE TABLE public.detalle_pedido (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  variacion_id UUID NOT NULL REFERENCES public.variaciones_producto(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: productos_individuales (vestidos físicos con QR)
CREATE TABLE public.productos_individuales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variacion_id UUID NOT NULL REFERENCES public.variaciones_producto(id) ON DELETE CASCADE,
  qr_code VARCHAR NOT NULL UNIQUE,
  estado public.estado_producto_individual NOT NULL DEFAULT 'disponible',
  entallado BOOLEAN NOT NULL DEFAULT false,
  pedido_original_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  notas_condicion TEXT,
  fecha_adquisicion DATE,
  ultima_fecha_mantenimiento DATE,
  total_alquileres INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: asignacion_productos (vincula detalle_pedido con productos_individuales)
CREATE TABLE public.asignacion_productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  detalle_pedido_id UUID NOT NULL REFERENCES public.detalle_pedido(id) ON DELETE CASCADE,
  producto_individual_id UUID NOT NULL REFERENCES public.productos_individuales(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(detalle_pedido_id, producto_individual_id)
);

-- Tabla: motorizados
CREATE TABLE public.motorizados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  telefono VARCHAR NOT NULL,
  placa VARCHAR,
  activo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: viajes
CREATE TABLE public.viajes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_viaje VARCHAR UNIQUE,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  motorizado_id UUID REFERENCES public.motorizados(id) ON DELETE SET NULL,
  tipo_viaje public.tipo_viaje NOT NULL DEFAULT 'entrega_inicial',
  estado public.estado_viaje NOT NULL DEFAULT 'programado',
  fecha_envio DATE NOT NULL,
  fecha_retorno DATE,
  hora_salida TIME,
  hora_llegada TIME,
  observaciones TEXT,
  firma_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: productos_viaje
CREATE TABLE public.productos_viaje (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viaje_id UUID NOT NULL REFERENCES public.viajes(id) ON DELETE CASCADE,
  producto_individual_id UUID NOT NULL REFERENCES public.productos_individuales(id) ON DELETE RESTRICT,
  tipo_movimiento public.tipo_movimiento NOT NULL DEFAULT 'envio',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: cambios_producto
CREATE TABLE public.cambios_producto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viaje_id UUID NOT NULL REFERENCES public.viajes(id) ON DELETE CASCADE,
  producto_original_id UUID NOT NULL REFERENCES public.productos_individuales(id) ON DELETE RESTRICT,
  producto_nuevo_id UUID NOT NULL REFERENCES public.productos_individuales(id) ON DELETE RESTRICT,
  motivo TEXT,
  es_entallado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_variaciones_producto_id ON public.variaciones_producto(producto_id);
CREATE INDEX idx_variaciones_tipo_talla ON public.variaciones_producto(tipo_talla_id);
CREATE INDEX idx_productos_individuales_variacion ON public.productos_individuales(variacion_id);
CREATE INDEX idx_productos_individuales_estado ON public.productos_individuales(estado);
CREATE INDEX idx_productos_individuales_qr ON public.productos_individuales(qr_code);
CREATE INDEX idx_pedidos_cliente ON public.pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON public.pedidos(fecha_pedido);
CREATE INDEX idx_detalle_pedido_pedido ON public.detalle_pedido(pedido_id);
CREATE INDEX idx_detalle_pedido_variacion ON public.detalle_pedido(variacion_id);
CREATE INDEX idx_asignacion_detalle ON public.asignacion_productos(detalle_pedido_id);
CREATE INDEX idx_asignacion_producto ON public.asignacion_productos(producto_individual_id);
CREATE INDEX idx_viajes_pedido ON public.viajes(pedido_id);
CREATE INDEX idx_viajes_motorizado ON public.viajes(motorizado_id);
CREATE INDEX idx_viajes_fecha ON public.viajes(fecha_envio);
CREATE INDEX idx_viajes_estado ON public.viajes(estado);
CREATE INDEX idx_productos_viaje_viaje ON public.productos_viaje(viaje_id);
CREATE INDEX idx_cambios_viaje ON public.cambios_producto(viaje_id);

-- Enable Row Level Security
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipo_tallas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variaciones_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_individuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignacion_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_viaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cambios_producto ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
-- Productos
CREATE POLICY "Auth users can view productos" ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert productos" ON public.productos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update productos" ON public.productos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete productos" ON public.productos FOR DELETE TO authenticated USING (true);

-- Tipo tallas
CREATE POLICY "Auth users can view tipo_tallas" ON public.tipo_tallas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert tipo_tallas" ON public.tipo_tallas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update tipo_tallas" ON public.tipo_tallas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete tipo_tallas" ON public.tipo_tallas FOR DELETE TO authenticated USING (true);

-- Variaciones producto
CREATE POLICY "Auth users can view variaciones_producto" ON public.variaciones_producto FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert variaciones_producto" ON public.variaciones_producto FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update variaciones_producto" ON public.variaciones_producto FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete variaciones_producto" ON public.variaciones_producto FOR DELETE TO authenticated USING (true);

-- Productos individuales
CREATE POLICY "Auth users can view productos_individuales" ON public.productos_individuales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert productos_individuales" ON public.productos_individuales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update productos_individuales" ON public.productos_individuales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete productos_individuales" ON public.productos_individuales FOR DELETE TO authenticated USING (true);

-- Clientes
CREATE POLICY "Auth users can view clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update clientes" ON public.clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete clientes" ON public.clientes FOR DELETE TO authenticated USING (true);

-- Pedidos
CREATE POLICY "Auth users can view pedidos" ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert pedidos" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update pedidos" ON public.pedidos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete pedidos" ON public.pedidos FOR DELETE TO authenticated USING (true);

-- Detalle pedido
CREATE POLICY "Auth users can view detalle_pedido" ON public.detalle_pedido FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert detalle_pedido" ON public.detalle_pedido FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update detalle_pedido" ON public.detalle_pedido FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete detalle_pedido" ON public.detalle_pedido FOR DELETE TO authenticated USING (true);

-- Asignacion productos
CREATE POLICY "Auth users can view asignacion_productos" ON public.asignacion_productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert asignacion_productos" ON public.asignacion_productos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update asignacion_productos" ON public.asignacion_productos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete asignacion_productos" ON public.asignacion_productos FOR DELETE TO authenticated USING (true);

-- Motorizados
CREATE POLICY "Auth users can view motorizados" ON public.motorizados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert motorizados" ON public.motorizados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update motorizados" ON public.motorizados FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete motorizados" ON public.motorizados FOR DELETE TO authenticated USING (true);

-- Viajes
CREATE POLICY "Auth users can view viajes" ON public.viajes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert viajes" ON public.viajes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update viajes" ON public.viajes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete viajes" ON public.viajes FOR DELETE TO authenticated USING (true);

-- Productos viaje
CREATE POLICY "Auth users can view productos_viaje" ON public.productos_viaje FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert productos_viaje" ON public.productos_viaje FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update productos_viaje" ON public.productos_viaje FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete productos_viaje" ON public.productos_viaje FOR DELETE TO authenticated USING (true);

-- Cambios producto
CREATE POLICY "Auth users can view cambios_producto" ON public.cambios_producto FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert cambios_producto" ON public.cambios_producto FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update cambios_producto" ON public.cambios_producto FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete cambios_producto" ON public.cambios_producto FOR DELETE TO authenticated USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_variaciones_updated_at BEFORE UPDATE ON public.variaciones_producto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_productos_ind_updated_at BEFORE UPDATE ON public.productos_individuales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_motorizados_updated_at BEFORE UPDATE ON public.motorizados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_viajes_updated_at BEFORE UPDATE ON public.viajes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generar_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  next_number INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pedido FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.pedidos
  WHERE numero_pedido LIKE year_prefix || '-%';
  
  NEW.numero_pedido := year_prefix || '-' || LPAD(next_number::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_numero_pedido BEFORE INSERT ON public.pedidos 
FOR EACH ROW WHEN (NEW.numero_pedido IS NULL) 
EXECUTE FUNCTION public.generar_numero_pedido();

-- Function to generate trip numbers
CREATE OR REPLACE FUNCTION public.generar_numero_viaje()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix TEXT;
  next_number INTEGER;
BEGIN
  date_prefix := TO_CHAR(NEW.fecha_envio, 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_viaje FROM 10) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.viajes
  WHERE numero_viaje LIKE 'V' || date_prefix || '-%';
  
  NEW.numero_viaje := 'V' || date_prefix || '-' || LPAD(next_number::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_numero_viaje BEFORE INSERT ON public.viajes 
FOR EACH ROW WHEN (NEW.numero_viaje IS NULL) 
EXECUTE FUNCTION public.generar_numero_viaje();

-- Function to auto-generate QR codes for productos_individuales
CREATE OR REPLACE FUNCTION public.generar_qr_producto_individual()
RETURNS TRIGGER AS $$
DECLARE
  producto_imei TEXT;
  talla_valor TEXT;
  unit_count INTEGER;
BEGIN
  -- Get product imei and talla from variacion
  SELECT p.imei, v.talla 
  INTO producto_imei, talla_valor
  FROM public.variaciones_producto v
  JOIN public.productos p ON p.id = v.producto_id
  WHERE v.id = NEW.variacion_id;
  
  -- Count existing units for this variacion to generate sequence
  SELECT COUNT(*) + 1 INTO unit_count
  FROM public.productos_individuales
  WHERE variacion_id = NEW.variacion_id;
  
  -- Generate QR code: IMEI-TALLA-SECUENCIA-RANDOM
  NEW.qr_code := UPPER(producto_imei) || '-' || UPPER(talla_valor) || '-' || LPAD(unit_count::TEXT, 4, '0') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 4));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generar_qr_producto_trigger
BEFORE INSERT ON public.productos_individuales
FOR EACH ROW
WHEN (NEW.qr_code IS NULL OR NEW.qr_code = '')
EXECUTE FUNCTION public.generar_qr_producto_individual();

-- Function to assign product by QR scan
CREATE OR REPLACE FUNCTION public.asignar_producto_por_qr(
  p_qr_code TEXT,
  p_pedido_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_producto_ind RECORD;
  v_detalle RECORD;
  v_variacion RECORD;
  v_producto RECORD;
  v_asignados INTEGER;
  v_solicitados INTEGER;
BEGIN
  -- Find the individual product by QR code
  SELECT * INTO v_producto_ind
  FROM public.productos_individuales
  WHERE qr_code = p_qr_code;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Código QR no encontrado');
  END IF;
  
  -- Check if product is available
  IF v_producto_ind.estado != 'disponible' THEN
    RETURN json_build_object('success', false, 'error', 'Esta unidad no está disponible. Estado actual: ' || v_producto_ind.estado);
  END IF;
  
  -- Get variacion and producto info
  SELECT v.*, p.nombre as producto_nombre, p.imei as producto_imei
  INTO v_variacion
  FROM public.variaciones_producto v
  JOIN public.productos p ON p.id = v.producto_id
  WHERE v.id = v_producto_ind.variacion_id;
  
  -- Find a detalle_pedido for this variacion that needs more assignments
  SELECT dp.* INTO v_detalle
  FROM public.detalle_pedido dp
  WHERE dp.pedido_id = p_pedido_id
    AND dp.variacion_id = v_producto_ind.variacion_id
    AND (
      SELECT COUNT(*) 
      FROM public.asignacion_productos ap 
      WHERE ap.detalle_pedido_id = dp.id
    ) < dp.cantidad
  ORDER BY dp.created_at
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Check if variacion is even in the order
    SELECT COUNT(*) INTO v_solicitados
    FROM public.detalle_pedido
    WHERE pedido_id = p_pedido_id AND variacion_id = v_producto_ind.variacion_id;
    
    IF v_solicitados = 0 THEN
      RETURN json_build_object('success', false, 'error', 'Este producto/talla no está en el pedido');
    ELSE
      RETURN json_build_object('success', false, 'error', 'Ya se asignaron todas las unidades de este producto/talla');
    END IF;
  END IF;
  
  -- Create assignment
  INSERT INTO public.asignacion_productos (detalle_pedido_id, producto_individual_id)
  VALUES (v_detalle.id, v_producto_ind.id);
  
  -- Update product status
  UPDATE public.productos_individuales
  SET estado = 'en_transito'
  WHERE id = v_producto_ind.id;
  
  -- Count assigned vs requested for this variacion in this order
  SELECT 
    COALESCE(SUM(dp.cantidad), 0) as solicitados,
    (SELECT COUNT(*) FROM public.asignacion_productos ap 
     JOIN public.detalle_pedido dp2 ON dp2.id = ap.detalle_pedido_id
     WHERE dp2.pedido_id = p_pedido_id AND dp2.variacion_id = v_producto_ind.variacion_id) as asignados
  INTO v_solicitados, v_asignados
  FROM public.detalle_pedido dp
  WHERE dp.pedido_id = p_pedido_id AND dp.variacion_id = v_producto_ind.variacion_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Unidad asignada correctamente',
    'producto_individual_id', v_producto_ind.id,
    'producto_nombre', v_variacion.producto_nombre,
    'talla', v_variacion.talla,
    'qr_code', v_producto_ind.qr_code,
    'asignados', v_asignados,
    'solicitados', v_solicitados,
    'completo', v_asignados >= v_solicitados
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.asignar_producto_por_qr(TEXT, UUID) TO authenticated;

-- Insert default size types
INSERT INTO public.tipo_tallas (nombre, valores) VALUES 
  ('Letras', '["XS", "S", "M", "L", "XL", "XXL"]'::jsonb),
  ('Números Niños', '[2, 4, 6, 8, 10, 12]'::jsonb),
  ('Números Adultos', '[36, 38, 40, 42, 44, 46]'::jsonb);