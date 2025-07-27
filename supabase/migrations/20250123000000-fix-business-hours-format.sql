-- MIGRACIÓN: Corregir formato de horarios de negocio
-- Propósito: Asegurar que los horarios de negocio tengan el formato correcto para la edición

-- 1. Corregir el formato de los horarios de negocio
UPDATE public.system_settings 
SET setting_value = '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "16:00"}, "sunday": {"open": null, "close": null}}',
    updated_at = NOW()
WHERE setting_key = 'business_hours';

-- 2. Verificar que la actualización fue exitosa
DO $$
DECLARE
    business_hours_value TEXT;
    parsed_hours JSONB;
BEGIN
    -- Obtener el valor actual
    SELECT setting_value INTO business_hours_value
    FROM public.system_settings
    WHERE setting_key = 'business_hours';
    
    -- Verificar que es JSON válido
    parsed_hours := business_hours_value::JSONB;
    
    -- Verificar que tiene todos los días de la semana
    IF jsonb_typeof(parsed_hours) = 'object' AND 
       parsed_hours ? 'monday' AND 
       parsed_hours ? 'tuesday' AND 
       parsed_hours ? 'wednesday' AND 
       parsed_hours ? 'thursday' AND 
       parsed_hours ? 'friday' AND 
       parsed_hours ? 'saturday' AND 
       parsed_hours ? 'sunday' THEN
        RAISE NOTICE '✅ Horarios de negocio actualizados correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Formato de horarios de negocio inválido';
    END IF;
END $$;

-- 3. Crear función helper para validar horarios de negocio
CREATE OR REPLACE FUNCTION validate_business_hours(hours_json TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    parsed_hours JSONB;
    day_name TEXT;
    day_value JSONB;
    required_days TEXT[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
BEGIN
    -- Verificar que es JSON válido
    BEGIN
        parsed_hours := hours_json::JSONB;
    EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
    END;
    
    -- Verificar que es un objeto
    IF jsonb_typeof(parsed_hours) != 'object' THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que tiene todos los días requeridos
    FOREACH day_name IN ARRAY required_days LOOP
        IF NOT (parsed_hours ? day_name) THEN
            RETURN FALSE;
        END IF;
        
        day_value := parsed_hours->day_name;
        
        -- Verificar que cada día tiene la estructura correcta
        IF jsonb_typeof(day_value) != 'object' OR 
           NOT (day_value ? 'open' AND day_value ? 'close') THEN
            RETURN FALSE;
        END IF;
        
        -- Verificar que los valores son válidos (null para cerrado, o string de tiempo)
        IF day_value->>'open' IS NOT NULL AND day_value->>'open' != '' THEN
            -- Si tiene hora de apertura, debe tener formato de tiempo válido
            IF day_value->>'open' !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' THEN
                RETURN FALSE;
            END IF;
        END IF;
        
        IF day_value->>'close' IS NOT NULL AND day_value->>'close' != '' THEN
            -- Si tiene hora de cierre, debe tener formato de tiempo válido
            IF day_value->>'close' !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' THEN
                RETURN FALSE;
            END IF;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear función para actualizar horarios de negocio con validación
CREATE OR REPLACE FUNCTION update_business_hours(hours_json TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validar el formato antes de actualizar
    IF NOT validate_business_hours(hours_json) THEN
        RAISE EXCEPTION 'Formato de horarios inválido';
    END IF;
    
    -- Actualizar los horarios
    UPDATE public.system_settings
    SET setting_value = hours_json,
        updated_at = NOW()
    WHERE setting_key = 'business_hours';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verificar que todo está funcionando correctamente
DO $$
DECLARE
    is_valid BOOLEAN;
BEGIN
    -- Verificar que los horarios actuales son válidos
    SELECT validate_business_hours(setting_value) INTO is_valid
    FROM public.system_settings
    WHERE setting_key = 'business_hours';
    
    IF is_valid THEN
        RAISE NOTICE '✅ Migración completada: Horarios de negocio están correctamente configurados';
    ELSE
        RAISE EXCEPTION '❌ Error: Los horarios de negocio no tienen el formato correcto';
    END IF;
END $$; 