# Sistema de Auditoría y Reversión de Acciones

## Descripción General

El sistema de auditoría permite al administrador rastrear todas las acciones realizadas en el sistema y revertir cambios cuando sea necesario, especialmente en las reservas.

## Características Principales

### 1. Registro Automático de Cambios
- **Tabla de Auditoría**: `audit_logs` almacena todos los cambios realizados
- **Triggers Automáticos**: Se registran automáticamente todos los cambios en reservas
- **Contexto de Admin**: Se registra qué administrador realizó cada acción

### 2. Historial de Reservas
- **Vista Individual**: Cada reserva tiene su propio historial de cambios
- **Estados Anteriores**: Se pueden ver todos los estados por los que pasó la reserva
- **Reversión Selectiva**: Permite volver a cualquier estado anterior

### 3. Panel de Auditoría General
- **Vista Completa**: Todos los logs de auditoría del sistema
- **Filtros Avanzados**: Por tabla, acción, fecha, etc.
- **Estadísticas**: Resumen de acciones realizadas

## Estructura de la Base de Datos

### Tabla `audit_logs`
```sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    admin_user_id UUID,
    admin_user_email TEXT,
    timestamp TIMESTAMP WITH TIME ZONE,
    description TEXT
);
```

### Funciones Principales
- `log_reservation_change()`: Trigger para registrar cambios
- `revert_reservation_status()`: Revertir estado de reserva
- `get_reservation_history()`: Obtener historial de una reserva
- `set_admin_context()`: Establecer contexto de admin

## Uso del Sistema

### 1. Ver Historial de una Reserva

1. Ir al panel de administración → Reservas
2. Seleccionar una reserva
3. Hacer clic en "Ver Detalles"
4. En la pestaña "Acciones", hacer clic en "Historial"
5. Se mostrará:
   - Estado actual
   - Opciones de reversión disponibles
   - Historial completo de cambios

### 2. Revertir Estado de Reserva

1. En el historial de la reserva, seleccionar el estado al que se quiere revertir
2. Hacer clic en "Revertir a [Estado]"
3. Confirmar la acción en el diálogo
4. El estado se revertirá y se registrará la acción

### 3. Panel de Auditoría General

1. Ir al panel de administración → Auditoría
2. Usar los filtros para buscar acciones específicas:
   - **Tabla**: Reservas, Usuarios, Productos, etc.
   - **Acción**: Creación, Actualización, Eliminación, Cambio de Estado
   - **Fecha**: Rango de fechas específico
3. Ver estadísticas en tiempo real

## Estados de Reserva

### Estados Disponibles
- `pending_payment`: Pendiente de Pago
- `confirmed`: Confirmada
- `completed`: Completada
- `cancelled`: Cancelada

### Flujo de Estados
```
pending_payment → confirmed → completed
     ↓
  cancelled
```

## Seguridad y Permisos

### Restricciones
- Solo administradores pueden acceder al sistema de auditoría
- Las reversiones solo pueden ser realizadas por administradores
- Todos los cambios se registran con el usuario que los realizó

### Políticas RLS
```sql
-- Solo admins pueden ver logs de auditoría
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- El sistema puede insertar logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);
```

## Casos de Uso Comunes

### 1. Error al Completar Reserva
**Problema**: El admin marcó una reserva como "completada" por error
**Solución**: 
1. Ir al historial de la reserva
2. Revertir a estado "confirmada"
3. La reserva vuelve al estado anterior

### 2. Cancelación Accidental
**Problema**: Se canceló una reserva por error
**Solución**:
1. Ir al historial de la reserva
2. Revertir al estado anterior (confirmada o pendiente)
3. La reserva se reactiva

### 3. Seguimiento de Cambios
**Problema**: Necesitas saber quién cambió el estado de una reserva
**Solución**:
1. Ver el historial de la reserva
2. Cada cambio muestra el admin responsable y la fecha
3. Se puede rastrear toda la cadena de cambios

## Mejores Prácticas

### Para Administradores
1. **Revisar antes de revertir**: Siempre verificar el historial completo
2. **Documentar cambios importantes**: Usar el campo de descripción cuando sea necesario
3. **Monitorear regularmente**: Revisar el panel de auditoría periódicamente

### Para Desarrolladores
1. **Mantener triggers**: Asegurar que todos los cambios importantes se registren
2. **Optimizar consultas**: Los logs pueden crecer rápidamente
3. **Backup regular**: Los logs son críticos para auditoría

## Limitaciones

### Técnicas
- Los logs se almacenan indefinidamente (considerar limpieza periódica)
- No se pueden revertir eliminaciones completas de registros
- El contexto de admin debe establecerse antes de cada operación

### Funcionales
- Solo se pueden revertir cambios de estado, no otros campos
- Las reversiones son manuales, no automáticas
- No hay notificaciones automáticas de cambios

## Mantenimiento

### Limpieza de Logs
```sql
-- Eliminar logs antiguos (ejemplo: más de 1 año)
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '1 year';
```

### Optimización
```sql
-- Índices recomendados
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_admin_user ON audit_logs(admin_user_id);
```

## Troubleshooting

### Problemas Comunes

1. **No se registran cambios**
   - Verificar que el trigger esté activo
   - Comprobar que el contexto de admin se establezca

2. **Error al revertir**
   - Verificar permisos de admin
   - Comprobar que el estado objetivo existe en el historial

3. **Rendimiento lento**
   - Revisar índices en la tabla audit_logs
   - Considerar paginación en consultas grandes

### Logs de Debug
```sql
-- Verificar triggers activos
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'audit_reservations_trigger';

-- Verificar contexto de admin
SELECT current_setting('app.admin_user_id', true);
SELECT current_setting('app.admin_user_email', true);
``` 