# Solución: Error al Confirmar Reserva después de Subir Comprobante

## Problema Identificado

Al subir un comprobante de pago y intentar confirmar la reserva, aparece un toast de error que dice:
> "El comprobante se subió pero hubo un error al confirmar la reserva."

## Causas del Error

Se identificaron dos problemas principales:

### 1. Error de Columna "key" (Principal)
```
Error: column "key" does not exist
Código: 42703
```
- La tabla `reservation_items` no tiene la columna `key` que React necesita para manejar las propiedades de los componentes.

### 2. Error de Referencia Ambigua (Secundario)
```
Error: column reference "user_id" is ambiguous
Código: 42702
```
- La función `set_admin_context` tiene una referencia ambigua al parámetro `user_id`.

## Solución

### Paso 1: Ejecutar Script SQL en Supabase

1. Ve al **Supabase Dashboard** de tu proyecto
2. Navega a **SQL Editor**
3. Ejecuta el siguiente script SQL:

```sql
-- SOLUCIÓN: Errores de confirmación de reserva
-- Archivo: supabase/scripts/fix-reservation-confirmation-errors.sql

-- PASO 1: Agregar columna key a reservation_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservation_items' 
        AND column_name = 'key'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservation_items 
        ADD COLUMN "key" TEXT;
        
        COMMENT ON COLUMN public.reservation_items."key" IS 'Columna para manejar propiedades extra de React (como key)';
        
        RAISE NOTICE '✅ Columna key agregada a reservation_items';
    ELSE
        RAISE NOTICE 'ℹ️ Columna key ya existe en reservation_items';
    END IF;
END $$;

-- PASO 2: Corregir función set_admin_context
CREATE OR REPLACE FUNCTION public.set_admin_context(admin_user_id UUID, admin_user_email TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.admin_user_id', admin_user_id::TEXT, false);
    PERFORM set_config('app.admin_user_email', admin_user_email, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Paso 2: Verificar la Solución

Ejecuta el script de prueba para verificar que todo funciona:

```bash
node scripts/test-reservation-confirmation-fix.cjs
```

### Paso 3: Probar en la Aplicación

1. Ve a la aplicación web
2. Intenta subir un comprobante de pago
3. Confirma la reserva
4. Verifica que no aparezca el error

## Archivos Modificados

- `supabase/scripts/fix-reservation-confirmation-errors.sql` - Script de solución
- `scripts/test-reservation-confirmation-fix.cjs` - Script de prueba
- `docs/SOLUCION_ERROR_CONFIRMACION_RESERVA.md` - Esta documentación

## Verificación

Después de aplicar la solución, deberías ver:

✅ **Comprobante subido exitosamente**  
✅ **Reserva confirmada automáticamente**  
❌ **NO** "Error al confirmar reserva"

## Logs de Consola

Si necesitas verificar los logs, busca estos mensajes en la consola del navegador:

```
🚀 Subiendo comprobante a Cloudinary: {...}
✅ Comprobante subido exitosamente: [URL]
✅ Reserva confirmada automáticamente
```

## Troubleshooting

Si el error persiste después de aplicar la solución:

1. **Verifica que el script SQL se ejecutó correctamente**
2. **Revisa los logs de la consola del navegador**
3. **Ejecuta el script de prueba para diagnosticar**
4. **Verifica que las políticas RLS están correctas**

## Notas Técnicas

- La columna `key` es necesaria para que React maneje correctamente las propiedades de los componentes
- La función `set_admin_context` se usa para establecer el contexto de administrador antes de actualizar reservas
- Los errores se originan en el hook `useUpdateReservationStatus` en `hooks/useAdmin.ts`

## Estado del Proyecto

- ✅ **Problema identificado**
- ✅ **Solución creada**
- ⏳ **Pendiente de ejecutar en Supabase**
- ⏳ **Pendiente de verificar en aplicación** 