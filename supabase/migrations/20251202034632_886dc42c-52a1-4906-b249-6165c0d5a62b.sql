-- Create function to auto-generate QR codes for dress_units
CREATE OR REPLACE FUNCTION public.generate_dress_unit_qr_code()
RETURNS TRIGGER AS $$
DECLARE
  product_code TEXT;
  size_part TEXT;
  unit_count INTEGER;
BEGIN
  -- Get product code
  SELECT code INTO product_code FROM public.products WHERE id = NEW.product_id;
  
  -- Determine size part
  IF NEW.letter_size IS NOT NULL THEN
    size_part := NEW.letter_size::TEXT;
  ELSIF NEW.number_size IS NOT NULL THEN
    size_part := NEW.number_size::TEXT;
  ELSE
    size_part := 'NS';
  END IF;
  
  -- Count existing units for this product to generate sequence
  SELECT COUNT(*) + 1 INTO unit_count
  FROM public.dress_units
  WHERE product_id = NEW.product_id;
  
  -- Generate QR code: PRODUCT_CODE-SIZE-SEQUENCE-RANDOM
  NEW.qr_code := UPPER(product_code) || '-' || size_part || '-' || LPAD(unit_count::TEXT, 4, '0') || '-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 4);
  
  -- Generate SKU if not provided
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := UPPER(product_code) || '-' || size_part || '-' || LPAD(unit_count::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate QR code on insert
CREATE TRIGGER generate_dress_unit_qr_code_trigger
BEFORE INSERT ON public.dress_units
FOR EACH ROW
WHEN (NEW.qr_code IS NULL OR NEW.qr_code = '')
EXECUTE FUNCTION public.generate_dress_unit_qr_code();

-- Create function to assign dress unit to order by QR scan
CREATE OR REPLACE FUNCTION public.assign_dress_unit_by_qr(
  p_qr_code TEXT,
  p_order_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_dress_unit RECORD;
  v_order_item RECORD;
  v_product RECORD;
  v_assigned_count INTEGER;
  v_requested_count INTEGER;
BEGIN
  -- Find the dress unit by QR code
  SELECT * INTO v_dress_unit
  FROM public.dress_units
  WHERE qr_code = p_qr_code;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Código QR no encontrado');
  END IF;
  
  -- Check if dress unit is available
  IF v_dress_unit.status != 'available' THEN
    RETURN json_build_object('success', false, 'error', 'Esta unidad no está disponible. Estado actual: ' || v_dress_unit.status);
  END IF;
  
  -- Get product info
  SELECT * INTO v_product FROM public.products WHERE id = v_dress_unit.product_id;
  
  -- Find an order item for this product that doesn't have a dress_unit assigned yet
  SELECT oi.* INTO v_order_item
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_id = v_dress_unit.product_id
    AND oi.dress_unit_id IS NULL
  ORDER BY oi.created_at
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Check if product is even in the order
    SELECT COUNT(*) INTO v_requested_count
    FROM public.order_items
    WHERE order_id = p_order_id AND product_id = v_dress_unit.product_id;
    
    IF v_requested_count = 0 THEN
      RETURN json_build_object('success', false, 'error', 'Este producto no está en el pedido');
    ELSE
      RETURN json_build_object('success', false, 'error', 'Ya se asignaron todas las unidades de este producto');
    END IF;
  END IF;
  
  -- Assign the dress unit to the order item
  UPDATE public.order_items
  SET dress_unit_id = v_dress_unit.id
  WHERE id = v_order_item.id;
  
  -- Update dress unit status to reserved
  UPDATE public.dress_units
  SET status = 'reserved'
  WHERE id = v_dress_unit.id;
  
  -- Count how many items are now assigned vs total for this product
  SELECT 
    COUNT(*) FILTER (WHERE dress_unit_id IS NOT NULL) as assigned,
    COUNT(*) as total
  INTO v_assigned_count, v_requested_count
  FROM public.order_items
  WHERE order_id = p_order_id AND product_id = v_dress_unit.product_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Unidad asignada correctamente',
    'dress_unit_id', v_dress_unit.id,
    'product_name', v_product.name,
    'qr_code', v_dress_unit.qr_code,
    'assigned_count', v_assigned_count,
    'total_count', v_requested_count,
    'is_complete', v_assigned_count = v_requested_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_dress_unit_by_qr(TEXT, UUID) TO authenticated;