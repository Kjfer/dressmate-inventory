-- Add precio column to variaciones_producto
ALTER TABLE public.variaciones_producto 
ADD COLUMN precio numeric NOT NULL DEFAULT 0;