-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'vendedor', 'motorizado');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Function to check if user can manage products (only admin)
CREATE OR REPLACE FUNCTION public.can_manage_products(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Function to check if user can manage orders (admin or vendedor)
CREATE OR REPLACE FUNCTION public.can_manage_orders(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'vendedor')
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- User roles policies (only admin can manage)
CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Update timestamps trigger for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, user_id, nombre, email)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', NEW.email),
    NEW.email
  );
  
  -- Assign default role (vendedor) - first user becomes admin
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendedor');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop existing RLS policies and recreate with role-based access
-- PRODUCTOS: Only admin can create/update/delete
DROP POLICY IF EXISTS "Auth users can view productos" ON public.productos;
DROP POLICY IF EXISTS "Auth users can insert productos" ON public.productos;
DROP POLICY IF EXISTS "Auth users can update productos" ON public.productos;
DROP POLICY IF EXISTS "Auth users can delete productos" ON public.productos;

CREATE POLICY "All auth users can view productos" ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can insert productos" ON public.productos FOR INSERT TO authenticated WITH CHECK (public.can_manage_products(auth.uid()));
CREATE POLICY "Only admin can update productos" ON public.productos FOR UPDATE TO authenticated USING (public.can_manage_products(auth.uid()));
CREATE POLICY "Only admin can delete productos" ON public.productos FOR DELETE TO authenticated USING (public.can_manage_products(auth.uid()));

-- TIPO_TALLAS: Only admin can manage
DROP POLICY IF EXISTS "Auth users can view tipo_tallas" ON public.tipo_tallas;
DROP POLICY IF EXISTS "Auth users can insert tipo_tallas" ON public.tipo_tallas;
DROP POLICY IF EXISTS "Auth users can update tipo_tallas" ON public.tipo_tallas;
DROP POLICY IF EXISTS "Auth users can delete tipo_tallas" ON public.tipo_tallas;

CREATE POLICY "All auth users can view tipo_tallas" ON public.tipo_tallas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can insert tipo_tallas" ON public.tipo_tallas FOR INSERT TO authenticated WITH CHECK (public.can_manage_products(auth.uid()));
CREATE POLICY "Only admin can update tipo_tallas" ON public.tipo_tallas FOR UPDATE TO authenticated USING (public.can_manage_products(auth.uid()));
CREATE POLICY "Only admin can delete tipo_tallas" ON public.tipo_tallas FOR DELETE TO authenticated USING (public.can_manage_products(auth.uid()));

-- VARIACIONES_PRODUCTO: Only admin can manage
DROP POLICY IF EXISTS "Auth users can view variaciones_producto" ON public.variaciones_producto;
DROP POLICY IF EXISTS "Auth users can insert variaciones_producto" ON public.variaciones_producto;
DROP POLICY IF EXISTS "Auth users can update variaciones_producto" ON public.variaciones_producto;
DROP POLICY IF EXISTS "Auth users can delete variaciones_producto" ON public.variaciones_producto;

CREATE POLICY "All auth users can view variaciones" ON public.variaciones_producto FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can insert variaciones" ON public.variaciones_producto FOR INSERT TO authenticated WITH CHECK (public.can_manage_products(auth.uid()));
CREATE POLICY "Only admin can update variaciones" ON public.variaciones_producto FOR UPDATE TO authenticated USING (public.can_manage_products(auth.uid()));
CREATE POLICY "Only admin can delete variaciones" ON public.variaciones_producto FOR DELETE TO authenticated USING (public.can_manage_products(auth.uid()));

-- PRODUCTOS_INDIVIDUALES: Only admin can manage
DROP POLICY IF EXISTS "Auth users can view productos_individuales" ON public.productos_individuales;
DROP POLICY IF EXISTS "Auth users can insert productos_individuales" ON public.productos_individuales;
DROP POLICY IF EXISTS "Auth users can update productos_individuales" ON public.productos_individuales;
DROP POLICY IF EXISTS "Auth users can delete productos_individuales" ON public.productos_individuales;

CREATE POLICY "All auth users can view productos_ind" ON public.productos_individuales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can insert productos_ind" ON public.productos_individuales FOR INSERT TO authenticated WITH CHECK (public.can_manage_products(auth.uid()));
CREATE POLICY "Admin or vendedor can update productos_ind" ON public.productos_individuales FOR UPDATE TO authenticated USING (public.can_manage_orders(auth.uid()));
CREATE POLICY "Only admin can delete productos_ind" ON public.productos_individuales FOR DELETE TO authenticated USING (public.can_manage_products(auth.uid()));

-- CLIENTES: Admin and vendedor can manage
DROP POLICY IF EXISTS "Auth users can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Auth users can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Auth users can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Auth users can delete clientes" ON public.clientes;

CREATE POLICY "All auth users can view clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/vendedor can insert clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can update clientes" ON public.clientes FOR UPDATE TO authenticated USING (public.can_manage_orders(auth.uid()));
CREATE POLICY "Only admin can delete clientes" ON public.clientes FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- PEDIDOS: Admin and vendedor can manage
DROP POLICY IF EXISTS "Auth users can view pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Auth users can insert pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Auth users can update pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Auth users can delete pedidos" ON public.pedidos;

CREATE POLICY "All auth users can view pedidos" ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/vendedor can insert pedidos" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can update pedidos" ON public.pedidos FOR UPDATE TO authenticated USING (public.can_manage_orders(auth.uid()));
CREATE POLICY "Only admin can delete pedidos" ON public.pedidos FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- DETALLE_PEDIDO: Admin and vendedor can manage
DROP POLICY IF EXISTS "Auth users can view detalle_pedido" ON public.detalle_pedido;
DROP POLICY IF EXISTS "Auth users can insert detalle_pedido" ON public.detalle_pedido;
DROP POLICY IF EXISTS "Auth users can update detalle_pedido" ON public.detalle_pedido;
DROP POLICY IF EXISTS "Auth users can delete detalle_pedido" ON public.detalle_pedido;

CREATE POLICY "All auth users can view detalle_pedido" ON public.detalle_pedido FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/vendedor can insert detalle" ON public.detalle_pedido FOR INSERT TO authenticated WITH CHECK (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can update detalle" ON public.detalle_pedido FOR UPDATE TO authenticated USING (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can delete detalle" ON public.detalle_pedido FOR DELETE TO authenticated USING (public.can_manage_orders(auth.uid()));

-- ASIGNACION_PRODUCTOS: Admin and vendedor can manage
DROP POLICY IF EXISTS "Auth users can view asignacion_productos" ON public.asignacion_productos;
DROP POLICY IF EXISTS "Auth users can insert asignacion_productos" ON public.asignacion_productos;
DROP POLICY IF EXISTS "Auth users can update asignacion_productos" ON public.asignacion_productos;
DROP POLICY IF EXISTS "Auth users can delete asignacion_productos" ON public.asignacion_productos;

CREATE POLICY "All auth users can view asignaciones" ON public.asignacion_productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/vendedor can insert asignaciones" ON public.asignacion_productos FOR INSERT TO authenticated WITH CHECK (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can update asignaciones" ON public.asignacion_productos FOR UPDATE TO authenticated USING (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can delete asignaciones" ON public.asignacion_productos FOR DELETE TO authenticated USING (public.can_manage_orders(auth.uid()));

-- MOTORIZADOS: Only admin can manage
DROP POLICY IF EXISTS "Auth users can view motorizados" ON public.motorizados;
DROP POLICY IF EXISTS "Auth users can insert motorizados" ON public.motorizados;
DROP POLICY IF EXISTS "Auth users can update motorizados" ON public.motorizados;
DROP POLICY IF EXISTS "Auth users can delete motorizados" ON public.motorizados;

CREATE POLICY "All auth users can view motorizados" ON public.motorizados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can insert motorizados" ON public.motorizados FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Only admin can update motorizados" ON public.motorizados FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Only admin can delete motorizados" ON public.motorizados FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- VIAJES: Admin and vendedor can manage, motorizado can only view
DROP POLICY IF EXISTS "Auth users can view viajes" ON public.viajes;
DROP POLICY IF EXISTS "Auth users can insert viajes" ON public.viajes;
DROP POLICY IF EXISTS "Auth users can update viajes" ON public.viajes;
DROP POLICY IF EXISTS "Auth users can delete viajes" ON public.viajes;

CREATE POLICY "All auth users can view viajes" ON public.viajes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/vendedor can insert viajes" ON public.viajes FOR INSERT TO authenticated WITH CHECK (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can update viajes" ON public.viajes FOR UPDATE TO authenticated USING (public.can_manage_orders(auth.uid()));
CREATE POLICY "Only admin can delete viajes" ON public.viajes FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- PRODUCTOS_VIAJE: Admin and vendedor can manage
DROP POLICY IF EXISTS "Auth users can view productos_viaje" ON public.productos_viaje;
DROP POLICY IF EXISTS "Auth users can insert productos_viaje" ON public.productos_viaje;
DROP POLICY IF EXISTS "Auth users can update productos_viaje" ON public.productos_viaje;
DROP POLICY IF EXISTS "Auth users can delete productos_viaje" ON public.productos_viaje;

CREATE POLICY "All auth users can view productos_viaje" ON public.productos_viaje FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/vendedor can insert productos_viaje" ON public.productos_viaje FOR INSERT TO authenticated WITH CHECK (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can update productos_viaje" ON public.productos_viaje FOR UPDATE TO authenticated USING (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can delete productos_viaje" ON public.productos_viaje FOR DELETE TO authenticated USING (public.can_manage_orders(auth.uid()));

-- CAMBIOS_PRODUCTO: Admin and vendedor can manage
DROP POLICY IF EXISTS "Auth users can view cambios_producto" ON public.cambios_producto;
DROP POLICY IF EXISTS "Auth users can insert cambios_producto" ON public.cambios_producto;
DROP POLICY IF EXISTS "Auth users can update cambios_producto" ON public.cambios_producto;
DROP POLICY IF EXISTS "Auth users can delete cambios_producto" ON public.cambios_producto;

CREATE POLICY "All auth users can view cambios_producto" ON public.cambios_producto FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/vendedor can insert cambios" ON public.cambios_producto FOR INSERT TO authenticated WITH CHECK (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can update cambios" ON public.cambios_producto FOR UPDATE TO authenticated USING (public.can_manage_orders(auth.uid()));
CREATE POLICY "Admin/vendedor can delete cambios" ON public.cambios_producto FOR DELETE TO authenticated USING (public.can_manage_orders(auth.uid()));