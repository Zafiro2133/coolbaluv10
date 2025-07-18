-- Create zones table for coverage areas
CREATE TABLE public.zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  postal_codes TEXT[], -- Array of postal codes
  neighborhoods TEXT[], -- Array of neighborhood names  
  transport_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart_items table for shopping cart
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  extra_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  event_address TEXT NOT NULL,
  zone_id UUID REFERENCES public.zones(id),
  adult_count INTEGER NOT NULL DEFAULT 0,
  child_count INTEGER NOT NULL DEFAULT 0,
  comments TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  transport_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'confirmed', 'cancelled')),
  payment_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reservation_items table (snapshot of cart items at reservation time)
CREATE TABLE public.reservation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  extra_hours INTEGER NOT NULL DEFAULT 0,
  extra_hour_percentage INTEGER NOT NULL DEFAULT 0,
  item_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_items ENABLE ROW LEVEL SECURITY;

-- Zones are publicly viewable (for address validation)
CREATE POLICY "Zones are viewable by everyone" 
ON public.zones 
FOR SELECT 
USING (is_active = true);

-- Cart items policies
CREATE POLICY "Users can view their own cart items" 
ON public.cart_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" 
ON public.cart_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" 
ON public.cart_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" 
ON public.cart_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Reservations policies
CREATE POLICY "Users can view their own reservations" 
ON public.reservations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Reservation items policies
CREATE POLICY "Users can view their own reservation items" 
ON public.reservation_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = reservation_items.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON public.zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample zones
INSERT INTO public.zones (name, description, postal_codes, neighborhoods, transport_cost) VALUES
  ('Zona Centro', 'Centro de la ciudad', ARRAY['1000', '1001', '1002', '1003'], ARRAY['Centro', 'Microcentro', 'San Nicolás'], 2000.00),
  ('Zona Norte', 'Zona norte de la ciudad', ARRAY['1400', '1401', '1402'], ARRAY['Palermo', 'Belgrano', 'Núñez'], 3500.00),
  ('Zona Sur', 'Zona sur de la ciudad', ARRAY['1200', '1201', '1202'], ARRAY['San Telmo', 'La Boca', 'Barracas'], 3000.00),
  ('Zona Oeste', 'Zona oeste de la ciudad', ARRAY['1600', '1601', '1602'], ARRAY['Villa Crespo', 'Almagro', 'Flores'], 4000.00);