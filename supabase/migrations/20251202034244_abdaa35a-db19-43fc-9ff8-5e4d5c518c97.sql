-- Create enums for the system
CREATE TYPE public.size_system AS ENUM ('letter', 'children_number', 'adult_number');
CREATE TYPE public.letter_size AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'in_preparation', 'ready', 'delivered', 'returned', 'cancelled');
CREATE TYPE public.trip_type AS ENUM ('delivery', 'return', 'entallado');
CREATE TYPE public.trip_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.dress_unit_status AS ENUM ('available', 'reserved', 'rented', 'in_transit', 'maintenance', 'retired');

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  district TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create motorizados (delivery drivers) table
CREATE TABLE public.motorizados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_plate TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table (dress models)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  color TEXT,
  size_system public.size_system NOT NULL DEFAULT 'letter',
  base_rental_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dress_units table (individual dress items with QR codes)
CREATE TABLE public.dress_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  -- Size fields (only one will be used based on product's size_system)
  letter_size public.letter_size,
  number_size INTEGER,
  status public.dress_unit_status NOT NULL DEFAULT 'available',
  condition_notes TEXT,
  acquisition_date DATE,
  last_maintenance_date DATE,
  total_rentals INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'pending',
  event_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  return_date DATE NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_district TEXT,
  delivery_reference TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_paid BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table (links orders to specific dress units)
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  dress_unit_id UUID REFERENCES public.dress_units(id) ON DELETE SET NULL,
  requested_size TEXT NOT NULL,
  rental_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trips table (delivery/return trips)
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_number TEXT NOT NULL UNIQUE,
  motorizado_id UUID REFERENCES public.motorizados(id) ON DELETE SET NULL,
  trip_type public.trip_type NOT NULL DEFAULT 'delivery',
  status public.trip_status NOT NULL DEFAULT 'pending',
  scheduled_date DATE NOT NULL,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  actual_departure_time TIMESTAMP WITH TIME ZONE,
  actual_completion_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip_orders junction table (links trips to orders)
CREATE TABLE public.trip_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_sequence INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivery_notes TEXT,
  signature_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, order_id)
);

-- Create indexes for better performance
CREATE INDEX idx_dress_units_product_id ON public.dress_units(product_id);
CREATE INDEX idx_dress_units_status ON public.dress_units(status);
CREATE INDEX idx_dress_units_qr_code ON public.dress_units(qr_code);
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_dress_unit_id ON public.order_items(dress_unit_id);
CREATE INDEX idx_trips_motorizado_id ON public.trips(motorizado_id);
CREATE INDEX idx_trips_scheduled_date ON public.trips(scheduled_date);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trip_orders_trip_id ON public.trip_orders(trip_id);
CREATE INDEX idx_trip_orders_order_id ON public.trip_orders(order_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dress_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables (allowing authenticated users full access for now)
-- Clients policies
CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- Motorizados policies
CREATE POLICY "Authenticated users can view motorizados" ON public.motorizados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert motorizados" ON public.motorizados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update motorizados" ON public.motorizados FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete motorizados" ON public.motorizados FOR DELETE TO authenticated USING (true);

-- Products policies
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE TO authenticated USING (true);

-- Dress units policies
CREATE POLICY "Authenticated users can view dress_units" ON public.dress_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert dress_units" ON public.dress_units FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update dress_units" ON public.dress_units FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete dress_units" ON public.dress_units FOR DELETE TO authenticated USING (true);

-- Orders policies
CREATE POLICY "Authenticated users can view orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete orders" ON public.orders FOR DELETE TO authenticated USING (true);

-- Order items policies
CREATE POLICY "Authenticated users can view order_items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert order_items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update order_items" ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete order_items" ON public.order_items FOR DELETE TO authenticated USING (true);

-- Trips policies
CREATE POLICY "Authenticated users can view trips" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update trips" ON public.trips FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete trips" ON public.trips FOR DELETE TO authenticated USING (true);

-- Trip orders policies
CREATE POLICY "Authenticated users can view trip_orders" ON public.trip_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert trip_orders" ON public.trip_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update trip_orders" ON public.trip_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete trip_orders" ON public.trip_orders FOR DELETE TO authenticated USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_motorizados_updated_at BEFORE UPDATE ON public.motorizados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dress_units_updated_at BEFORE UPDATE ON public.dress_units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  next_number INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.orders
  WHERE order_number LIKE year_prefix || '-%';
  
  NEW.order_number := year_prefix || '-' || LPAD(next_number::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders FOR EACH ROW WHEN (NEW.order_number IS NULL) EXECUTE FUNCTION public.generate_order_number();

-- Create function to generate trip numbers
CREATE OR REPLACE FUNCTION public.generate_trip_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix TEXT;
  next_number INTEGER;
BEGIN
  date_prefix := TO_CHAR(NEW.scheduled_date, 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(trip_number FROM 10) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.trips
  WHERE trip_number LIKE 'T' || date_prefix || '-%';
  
  NEW.trip_number := 'T' || date_prefix || '-' || LPAD(next_number::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_trip_number BEFORE INSERT ON public.trips FOR EACH ROW WHEN (NEW.trip_number IS NULL) EXECUTE FUNCTION public.generate_trip_number();