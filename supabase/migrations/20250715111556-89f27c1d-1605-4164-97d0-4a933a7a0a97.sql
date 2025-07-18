-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  extra_hour_percentage INTEGER DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (catalog is public)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (is_active = true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Create storage policies for public access
CREATE POLICY "Category images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'category-images');

CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

-- Insert initial categories
INSERT INTO public.categories (name, description, display_order) VALUES
  ('Inflables', 'Juegos inflables para todas las edades', 1),
  ('Catering', 'Servicios de comida y bebida para tu evento', 2),
  ('Mobiliario', 'Mesas, sillas y mobiliario para eventos', 3),
  ('Combos', 'Paquetes completos con descuentos especiales', 4);

-- Insert sample products
INSERT INTO public.products (category_id, name, description, base_price, extra_hour_percentage, display_order)
VALUES
  -- Inflables
  ((SELECT id FROM public.categories WHERE name = 'Inflables'), 'Castillo Princesas', 'Castillo inflable temático de princesas, ideal para niñas de 3 a 12 años', 15000.00, 20, 1),
  ((SELECT id FROM public.categories WHERE name = 'Inflables'), 'Tobogán Gigante', 'Tobogán inflable de 5 metros de altura con piscina de pelotas', 18000.00, 20, 2),
  ((SELECT id FROM public.categories WHERE name = 'Inflables'), 'Cama Elástica', 'Cama elástica profesional de 3x3 metros con red de seguridad', 12000.00, 15, 3),
  
  -- Catering
  ((SELECT id FROM public.categories WHERE name = 'Catering'), 'Mesa Dulce Infantil', 'Mesa dulce completa con torta, cupcakes y golosinas para 20 personas', 8000.00, 10, 1),
  ((SELECT id FROM public.categories WHERE name = 'Catering'), 'Asado Completo', 'Servicio de asado completo con ensaladas y bebidas para 30 personas', 25000.00, 15, 2),
  ((SELECT id FROM public.categories WHERE name = 'Catering'), 'Candy Bar', 'Barra de dulces y golosinas con decoración temática', 6000.00, 10, 3),
  
  -- Mobiliario
  ((SELECT id FROM public.categories WHERE name = 'Mobiliario'), 'Set Mesa + 4 Sillas', 'Mesa rectangular con 4 sillas plásticas, ideal para exteriores', 3000.00, 5, 1),
  ((SELECT id FROM public.categories WHERE name = 'Mobiliario'), 'Carpa 3x3', 'Carpa blanca de 3x3 metros, protección solar y lluvia', 4500.00, 10, 2),
  ((SELECT id FROM public.categories WHERE name = 'Mobiliario'), 'Mantelería Completa', 'Manteles, servilletas y decoración de mesa para 20 personas', 2500.00, 5, 3),
  
  -- Combos
  ((SELECT id FROM public.categories WHERE name = 'Combos'), 'Combo Cumpleaños Básico', 'Castillo inflable + mesa dulce + decoración básica', 20000.00, 15, 1),
  ((SELECT id FROM public.categories WHERE name = 'Combos'), 'Combo Evento Completo', 'Inflable + catering + mobiliario + animación', 45000.00, 20, 2),
  ((SELECT id FROM public.categories WHERE name = 'Combos'), 'Combo Jardín', 'Tobogán + asado + carpa + mesa y sillas', 35000.00, 18, 3);