# Guía de Implementación: Subida de Comprobantes de Pago

## Descripción

Esta funcionalidad permite a los administradores aceptar reservas y subir comprobantes de pago directamente desde la gestión de reservas. Los comprobantes pueden ser imágenes (JPG, PNG, WebP) o PDFs.

## Características

- ✅ Subida de archivos (imágenes y PDFs)
- ✅ Validación de tipos de archivo
- ✅ Límite de tamaño (10MB)
- ✅ Preview de imágenes
- ✅ Almacenamiento seguro en Cloudinary
- ✅ Integración con el flujo de aceptación de reservas
- ✅ Soporte para PDFs e imágenes

## Archivos Modificados/Creados

### Nuevos Componentes
- `components/ui/payment-proof-upload.tsx` - Componente de subida de comprobantes
- `components/admin/AcceptReservationDialog.tsx` - Diálogo de aceptación con subida

### Componentes Modificados
- `components/admin/ReservationManagement.tsx` - Integración de la nueva funcionalidad

### Configuración
- `config/cloudinary.ts` - Configuración y funciones para Cloudinary

### Scripts SQL
- `supabase/scripts/cleanup-supabase-storage-policies.sql` - Limpiar políticas innecesarias

## Configuración

### 1. Cloudinary (Ya configurado)

La funcionalidad utiliza la configuración existente de Cloudinary:
- **Cloud Name**: coolbaluv10
- **API Key**: 428128483696796
- **Upload Preset**: coolbaluv10_products
- **Folder**: payment-proofs/{userId}

### 2. Limpiar Supabase Storage (Opcional)

Si ya no necesitas el bucket de Supabase Storage, puedes ejecutar:

```sql
-- Ejecutar el archivo: supabase/scripts/cleanup-supabase-storage-policies.sql
```

Este script elimina las políticas RLS que ya no son necesarias.

### 3. Verificar Campo en Base de Datos

Asegúrate de que el campo `payment_proof_url` existe en la tabla `reservations`:

```sql
-- Verificar que el campo existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name = 'payment_proof_url';

-- Si no existe, agregarlo
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
```

## Uso de la Funcionalidad

### Para Administradores

1. **Acceder a Gestión de Reservas**
   - Ir al panel de administración
   - Navegar a "Gestión de Reservas"

2. **Aceptar Reserva con Comprobante**
   - Buscar reserva con estado "Pendiente Pago"
   - Hacer clic en "Aceptar y subir comprobante"
   - Se abrirá el diálogo de aceptación

3. **Subir Comprobante**
   - Seleccionar archivo (imagen o PDF)
   - Verificar preview (si es imagen)
   - Hacer clic en "Subir Comprobante"
   - Confirmar aceptación de la reserva

4. **Verificar Resultado**
   - La reserva cambiará a estado "Confirmada"
   - El comprobante quedará asociado a la reserva
   - Se puede ver el comprobante en los detalles de la reserva

### Flujo de Trabajo

```
Reserva Pendiente → Aceptar y subir comprobante → Subir archivo → Confirmar → Reserva Confirmada
```

## Estructura de Datos

### Tabla `reservations`
- Campo `payment_proof_url`: URL del comprobante subido

### Cloudinary Folder `payment-proofs`
- Estructura: `payment-proofs/{user_id}/{timestamp}-{random_id}.{extension}`
- Ejemplo: `payment-proofs/123e4567-e89b-12d3-a456-426614174000/1706313600000-abc123.jpg`

## Políticas de Seguridad

### Cloudinary Security
- **Upload Preset**: Configurado para permitir subidas autenticadas
- **Folder Structure**: Organizado por usuario para mejor gestión
- **Validación**: Tipos de archivo y tamaño máximo

### Validaciones
- Tipos de archivo: JPG, PNG, WebP, PDF
- Tamaño máximo: 10MB
- Validación de extensión y tipo MIME
- Organización por usuario en Cloudinary

## Manejo de Errores

### Errores Comunes
1. **Archivo no válido**: Mostrar mensaje de error específico
2. **Tamaño excesivo**: Informar límite de 10MB
3. **Error de subida**: Reintentar o mostrar error de red
4. **Permisos**: Verificar autenticación y roles

### Logs
- Todos los errores se registran en la consola
- Mensajes de toast para feedback al usuario
- Validación en tiempo real

## Mantenimiento

### Limpieza de Archivos
- Los archivos se almacenan permanentemente
- Considerar implementar limpieza automática para archivos antiguos
- Backup automático en Supabase

### Monitoreo
- Verificar uso de storage regularmente
- Monitorear errores de subida
- Revisar políticas RLS periódicamente

## Troubleshooting

### Problemas Comunes

1. **Error 403 al subir archivo**
   - Verificar políticas RLS
   - Confirmar que el bucket existe
   - Verificar autenticación del usuario

2. **Archivo no se sube**
   - Verificar tamaño del archivo
   - Confirmar tipo MIME permitido
   - Revisar conexión a internet

3. **Preview no se muestra**
   - Verificar que el archivo sea una imagen
   - Confirmar que el archivo se subió correctamente
   - Revisar permisos de acceso a la URL

### Comandos de Verificación

```sql
-- Verificar que el campo existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name = 'payment_proof_url';

-- Verificar políticas RLS
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

## Consideraciones de Rendimiento

- Los archivos se suben directamente a Supabase Storage
- No hay procesamiento de imagen en el servidor
- Las imágenes se sirven desde CDN de Supabase
- Considerar compresión de imágenes para archivos grandes

## Seguridad

- Archivos privados por defecto
- Validación de tipos MIME
- Límites de tamaño estrictos
- Autenticación requerida para todas las operaciones
- Políticas RLS para control de acceso granular 