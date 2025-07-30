-- =====================================================
-- SCRIPT: Configurar bucket para comprobantes de pago
-- Fecha: 2025-01-27
-- Descripción: Configuración del bucket payment-proofs en Supabase Storage
-- =====================================================

-- NOTA: Este script debe ejecutarse en Supabase Dashboard > Storage
-- Los buckets se crean manualmente en la interfaz web

-- 1. Crear bucket "payment-proofs" en Supabase Dashboard:
-- - Ir a Storage en el panel de control
-- - Hacer clic en "New bucket"
-- - Nombre: payment-proofs
-- - Public bucket: NO (privado)
-- - File size limit: 10MB
-- - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, application/pdf

-- 2. Configurar políticas RLS para el bucket (ya incluidas en la migración):
-- Las políticas se crean automáticamente con la migración 20250127000000-add-payment-proof-upload.sql

-- 3. Verificar configuración:
DO $$
BEGIN
    -- Verificar que el bucket existe (esto solo funciona si el bucket ya está creado)
    IF EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'payment-proofs'
    ) THEN
        RAISE NOTICE '✅ Bucket payment-proofs existe';
    ELSE
        RAISE NOTICE '⚠️ Bucket payment-proofs no existe. Crea el bucket manualmente en Supabase Dashboard > Storage';
    END IF;
    
    -- Verificar políticas RLS
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Users can upload their own payment proofs'
    ) THEN
        RAISE NOTICE '✅ Políticas RLS configuradas correctamente';
    ELSE
        RAISE NOTICE '⚠️ Políticas RLS no encontradas. Ejecuta la migración 20250127000000-add-payment-proof-upload.sql';
    END IF;
    
    RAISE NOTICE '📝 Configuración de comprobantes de pago completada.';
    RAISE NOTICE '💡 Recuerda crear el bucket "payment-proofs" en Supabase Dashboard si no existe.';
END $$; 