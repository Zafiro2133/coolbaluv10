-- Create availabilities table for admin-configured available dates and times
CREATE TABLE public.availabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  hour TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, hour)
);

-- Enable Row Level Security
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;

-- Create policies for availabilities
-- Everyone can view availabilities (for reservation form)
CREATE POLICY "Availabilities are viewable by everyone" 
ON public.availabilities 
FOR SELECT 
USING (true);

-- Only admins can manage availabilities
CREATE POLICY "Admins can manage availabilities" 
ON public.availabilities 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX idx_availabilities_date_hour ON public.availabilities(date, hour); 