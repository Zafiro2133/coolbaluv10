# 📊 Información del Proyecto Supabase - Coolbalu

## 🔑 Datos del Proyecto

**Project ID:** `rwgxdtfuzpdukaguogyh`  
**Project Name:** Coolbalu Entretenimientos  
**URL:** `https://rwgxdtfuzpdukaguogyh.supabase.co`

## 🔐 API Keys

### Anon Public Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0
```

### Service Role Secret Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM3MTI5MSwiZXhwIjoyMDY4OTQ3MjkxfQ.yGa3Q8T9y9e6SdE08jH1_2SqhYmk1q18Tm_16izohno
```

## 🗄️ Tablas de la Base de Datos

- `reservations` - Reservas de eventos
- `reservation_items` - Items de las reservas
- `products` - Productos/servicios
- `categories` - Categorías de productos
- `profiles` - Perfiles de usuarios
- `user_roles` - Roles de usuarios
- `zones` - Zonas de servicio
- `availabilities` - Disponibilidades
- `contact_messages` - Mensajes de contacto
- `cart_items` - Items del carrito

## 🔧 Problema Resuelto: Columna "key"

### Problema
Error: `column "key" does not exist` en la tabla `reservation_items`

### Solución
Ejecutar este SQL en Supabase SQL Editor:

```sql
-- Agregar columna key a reservation_items
ALTER TABLE public.reservation_items 
ADD COLUMN IF NOT EXISTS "key" TEXT;

-- Agregar comentario
COMMENT ON COLUMN public.reservation_items."key" IS 'Columna para manejar propiedades extra de React (como key)';
```

### Verificación
Después de ejecutar el SQL, verificar con:

```sql
-- Verificar que la columna se agregó
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reservation_items' 
AND column_name = 'key'
AND table_schema = 'public';
```

## 📁 Archivos de Configuración

### Configuración Centralizada
- `config/supabase-config.js` - Configuración centralizada del proyecto

### Scripts de Utilidad
- `scripts/test-supabase-connection.js` - Probar conexión
- `scripts/verify-key-column.js` - Verificar columna key
- `scripts/final-key-column-fix.js` - Solución final

### Migraciones
- `supabase/migrations/20250130000000-add-key-column-to-reservation-items.sql`
- `supabase/scripts/fix-key-column-final.sql`

## 🚀 Uso en el Código

### Cliente de Supabase
```typescript
import { supabase } from '@/services/supabase/client';
```

### Configuración
```typescript
import { SUPABASE_CONFIG } from '@/config/supabase-config';
```

## 🔒 Seguridad

- **Anon Key:** Usar solo para operaciones públicas
- **Service Role Key:** Usar solo para operaciones administrativas
- **RLS:** Row Level Security habilitado en todas las tablas
- **Políticas:** Políticas de acceso configuradas por tabla

## 📝 Notas Importantes

1. **URL Correcta:** `https://rwgxdtfuzpdukaguogyh.supabase.co`
2. **Configuración Centralizada:** Usar `config/supabase-config.js`
3. **Columna Key:** Agregada para manejar propiedades extra de React
4. **Variables de Entorno:** Fallback a `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

## 🛠️ Comandos Útiles

```bash
# Probar conexión
node scripts/test-supabase-connection.js

# Verificar columna key
node scripts/verify-key-column.js

# Ejecutar solución final
node scripts/final-key-column-fix.js
```

## 📞 Soporte

Para problemas con Supabase:
1. Verificar configuración en `config/supabase-config.js`
2. Probar conexión con `scripts/test-supabase-connection.js`
3. Revisar logs en Supabase Dashboard
4. Verificar políticas RLS en cada tabla 