-- =====================================================
-- MIGRACIÓN: Agregar soporte para subida de comprobantes de pago
-- Fecha: 2025-01-27
-- Descripción: Configuración para permitir subida de comprobantes de pago
-- =====================================================

-- 1. Crear bucket para comprobantes de pago si no existe
-- Nota: Los buckets se crean manualmente en Supabase Dashboard
-- Bucket: payment-proofs

-- 2. Crear políticas RLS para el bucket payment-proofs
-- Los usuarios pueden subir sus propios comprobantes
CREATE POLICY "Users can upload their own payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden ver sus propios comprobantes
CREATE POLICY "Users can view their own payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Los administradores pueden ver todos los comprobantes
CREATE POLICY "Admins can view all payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Los usuarios pueden eliminar sus propios comprobantes
CREATE POLICY "Users can delete their own payment proofs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Verificar que el campo payment_proof_url existe en reservations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'payment_proof_url'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN payment_proof_url TEXT;
        
        RAISE NOTICE '✅ Campo payment_proof_url agregado a la tabla reservations';
    ELSE
        RAISE NOTICE 'ℹ️ Campo payment_proof_url ya existe en la tabla reservations';
    END IF;
END $$;

-- 4. Agregar comentarios para documentar el uso
COMMENT ON COLUMN public.reservations.payment_proof_url IS 'URL del comprobante de pago subido por el usuario';

-- 5. Verificar que todo esté configurado correctamente
DO $$
BEGIN
    -- Verificar que el campo payment_proof_url existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'payment_proof_url'
    ) THEN
        RAISE EXCEPTION 'El campo payment_proof_url no existe en la tabla reservations';
    END IF;
    
    RAISE NOTICE '✅ Configuración de comprobantes de pago completada correctamente.';
    RAISE NOTICE '📝 Recuerda crear el bucket "payment-proofs" en Supabase Dashboard si no existe.';
END $$; 