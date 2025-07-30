-- =====================================================
-- SCRIPT: Limpiar políticas de Supabase Storage
-- Fecha: 2025-01-27
-- Descripción: Eliminar políticas de payment-proofs ya que usamos Cloudinary
-- =====================================================

-- Eliminar políticas RLS para payment-proofs (ya no necesarias)
DROP POLICY IF EXISTS "Users can upload their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own payment proofs" ON storage.objects;

-- Verificar que las políticas se eliminaron
DO $$
BEGIN
    -- Verificar que las políticas ya no existen
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname LIKE '%payment%'
    ) THEN
        RAISE NOTICE '✅ Políticas de payment-proofs eliminadas correctamente';
    ELSE
        RAISE NOTICE '⚠️ Algunas políticas de payment-proofs aún existen';
    END IF;
    
    RAISE NOTICE '📝 Ahora usando Cloudinary para comprobantes de pago';
    RAISE NOTICE '💡 El bucket payment-proofs en Supabase puede eliminarse si no se usa para otros propósitos';
END $$; 