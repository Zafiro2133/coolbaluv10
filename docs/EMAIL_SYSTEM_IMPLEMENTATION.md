# Sistema de Emails - Implementación Completa

## 📋 Resumen

Se ha implementado un sistema completo de emails en Supabase que permite:

- **Almacenar logs** de todos los emails enviados
- **Gestionar plantillas** de email desde la base de datos
- **Configurar parámetros** del sistema de email
- **Monitorear el estado** de envío de emails
- **Administrar** todo desde el panel de administración

## 🏗️ Arquitectura

### Tablas de Base de Datos

#### 1. `email_logs`
Almacena el historial completo de emails enviados:

```sql
- id: UUID (PK)
- email_type: VARCHAR(50) - Tipo de email
- recipient_email: VARCHAR(255) - Email del destinatario
- recipient_name: VARCHAR(255) - Nombre del destinatario
- subject: VARCHAR(500) - Asunto del email
- content: TEXT - Contenido completo del email
- status: VARCHAR(20) - Estado (pending, sent, failed, bounced)
- error_message: TEXT - Mensaje de error si falló
- metadata: JSONB - Metadatos adicionales
- related_reservation_id: UUID - ID de reserva relacionada
- related_contact_message_id: UUID - ID de mensaje de contacto
- sent_at: TIMESTAMP - Fecha de envío
- created_at: TIMESTAMP - Fecha de creación
```

#### 2. `email_templates`
Gestiona las plantillas de email:

```sql
- id: UUID (PK)
- template_key: VARCHAR(100) - Clave única de la plantilla
- template_name: VARCHAR(255) - Nombre descriptivo
- subject: VARCHAR(500) - Asunto de la plantilla
- html_content: TEXT - Contenido HTML
- text_content: TEXT - Contenido de texto plano
- variables: JSONB - Variables disponibles
- is_active: BOOLEAN - Si está activa
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. `email_config`
Configuración del sistema de emails:

```sql
- id: UUID (PK)
- config_key: VARCHAR(100) - Clave de configuración
- config_value: TEXT - Valor de configuración
- description: TEXT - Descripción
- is_sensitive: BOOLEAN - Si es información sensible
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Políticas de Seguridad (RLS)

- **Solo administradores** pueden acceder a todas las tablas
- **Logs de email** solo visibles para admins
- **Plantillas** solo editables por admins
- **Configuración** protegida para admins

## 🔧 Funcionalidades Implementadas

### 1. Envío de Emails con Logging

```typescript
// Enviar email de confirmación de reserva
const result = await sendReservationConfirmationEmail({
  reservationId: 'uuid',
  customerName: 'Juan Pérez',
  customerEmail: 'juan@example.com',
  eventDate: '2025-02-15',
  eventTime: '14:00',
  eventAddress: 'Av. Corrientes 123',
  total: 50000,
  items: [...]
});

// Enviar notificación de formulario de contacto
const result = await sendContactFormEmail({
  nombre: 'María',
  apellido: 'González',
  email: 'maria@example.com',
  telefono: '+54 9 11 1234-5678',
  mensaje: 'Hola, necesito información...',
  contactMessageId: 'uuid'
});
```

### 2. Plantillas de Email

#### Plantillas Incluidas:

1. **`reservation_confirmation`** - Confirmación de reserva
2. **`contact_form_notification`** - Notificación de formulario de contacto
3. **`payment_confirmation`** - Confirmación de pago

#### Variables Disponibles:

- `{{customerName}}` - Nombre del cliente
- `{{reservationId}}` - ID de la reserva
- `{{eventDate}}` - Fecha del evento
- `{{eventTime}}` - Hora del evento
- `{{eventAddress}}` - Dirección del evento
- `{{total}}` - Total de la reserva
- `{{nombre}}`, `{{apellido}}`, `{{email}}`, `{{telefono}}`, `{{mensaje}}` - Datos de contacto

### 3. Configuración del Sistema

#### Configuraciones Incluidas:

- `sender_email` - Email del remitente
- `sender_name` - Nombre del remitente
- `reply_to_email` - Email de respuesta
- `max_retries` - Número máximo de reintentos
- `retry_delay_minutes` - Delay entre reintentos
- `enable_email_logging` - Habilitar logging
- `admin_notification_email` - Email para notificaciones

### 4. Panel de Administración

#### Nueva Sección: "Logs de Email"

- **Filtros avanzados** por tipo, estado y destinatario
- **Vista detallada** de cada email enviado
- **Estadísticas** de envío
- **Gestión de errores** y reintentos

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:

1. **`supabase/migrations/20250131000004-create-contact-messages-if-not-exists.sql`**
   - Migración para crear tabla contact_messages si no existe
2. **`supabase/migrations/20250131000003-create-email-system.sql`**
   - Migración completa del sistema de emails

2. **`services/supabase/email.ts`**
   - Servicio principal de emails con Supabase

3. **`components/admin/EmailLogs.tsx`**
   - Componente para administrar logs de email

4. **`scripts/setup-email-system.js`**
   - Script para configurar el sistema

5. **`docs/EMAIL_SYSTEM_IMPLEMENTATION.md`**
   - Esta documentación

### Archivos Modificados:

1. **`services/email.ts`**
   - Actualizado para usar el nuevo sistema

2. **`hooks/useContact.ts`**
   - Agregado envío de email de notificación

3. **`pages/Reservation.tsx`**
   - Agregado envío de email de confirmación

4. **`pages/AdminPanel.tsx`**
   - Agregada sección de logs de email

5. **`config/supabase-config.js`**
   - Agregadas nuevas tablas

## 🚀 Instalación y Configuración

### 1. Ejecutar la Migración

```bash
# Opción 1: Usar el script automatizado (recomendado)
node scripts/setup-email-system.js

# Opción 2: Ejecutar manualmente en Supabase
# 1. Primero ejecutar:
# supabase/migrations/20250131000004-create-contact-messages-if-not-exists.sql
# 2. Luego ejecutar:
# supabase/migrations/20250131000003-create-email-system.sql
```

### 2. Verificar Configuración

```bash
# Verificar que las tablas se crearon
# Verificar que las plantillas están cargadas
# Verificar que la configuración está establecida
```

### 3. Probar el Sistema

1. **Crear una reserva** - Debería enviar email de confirmación
2. **Enviar formulario de contacto** - Debería enviar notificación al admin
3. **Revisar logs** en el panel de administración

## 🔍 Monitoreo y Debugging

### Logs de Consola

El sistema genera logs detallados:

```
📧 Enviando email con plantilla: reservation_confirmation
✅ Email enviado exitosamente: { id: "res_123" }
✅ Email registrado exitosamente: log_uuid
```

### Panel de Administración

- **Filtros** por tipo, estado y destinatario
- **Vista detallada** de cada email
- **Estadísticas** de envío
- **Gestión de errores**

### Estados de Email

- `pending` - Pendiente de envío
- `sent` - Enviado exitosamente
- `failed` - Falló el envío
- `bounced` - Email rebotado

## 🔒 Seguridad

### Políticas RLS Implementadas

- **Solo administradores** pueden acceder a logs
- **Configuración protegida** para admins
- **Plantillas editables** solo por admins
- **Datos sensibles** marcados apropiadamente

### Funciones Helper Seguras

- `get_email_config()` - Obtener configuración
- `get_email_template()` - Obtener plantilla
- `log_email_sent()` - Registrar email enviado

## 📊 Rendimiento

### Optimizaciones Implementadas

- **Índices** en campos de búsqueda frecuente
- **Paginación** en logs de email
- **Filtros eficientes** por tipo y estado
- **Caché** de plantillas y configuración

### Límites Configurados

- **50 logs** por página por defecto
- **3 reintentos** máximo por email
- **5 minutos** entre reintentos

## 🛠️ Mantenimiento

### Tareas Regulares

1. **Revisar logs fallidos** semanalmente
2. **Actualizar plantillas** según necesidades
3. **Monitorear métricas** de envío
4. **Limpiar logs antiguos** mensualmente

### Comandos Útiles

```bash
# Verificar estado del sistema
node scripts/setup-email-system.js

# Revisar logs en Supabase
SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC;

# Verificar plantillas activas
SELECT template_key, template_name FROM email_templates WHERE is_active = true;
```

## 🎯 Próximos Pasos

### Mejoras Futuras

1. **Webhooks** para notificaciones en tiempo real
2. **Plantillas dinámicas** con editor visual
3. **Métricas avanzadas** y reportes
4. **Integración** con otros proveedores de email
5. **Automatización** de reintentos fallidos

### Integración con Otros Sistemas

- **Notificaciones push** para admins
- **Reportes automáticos** de métricas
- **Integración** con CRM
- **Analytics** de engagement

## ✅ Checklist de Verificación

- [ ] Migración ejecutada correctamente
- [ ] Tablas creadas en Supabase
- [ ] Plantillas cargadas
- [ ] Configuración establecida
- [ ] Políticas RLS funcionando
- [ ] Panel de administración accesible
- [ ] Emails de reserva funcionando
- [ ] Emails de contacto funcionando
- [ ] Logs registrándose correctamente
- [ ] Filtros del panel funcionando

## 🆘 Solución de Problemas

### Problemas Comunes

1. **Emails no se envían**
   - Verificar API key de Resend
   - Revisar configuración de remitente
   - Verificar logs de error

2. **Logs no se registran**
   - Verificar políticas RLS
   - Revisar permisos de usuario
   - Verificar función `log_email_sent`

3. **Plantillas no cargan**
   - Verificar tabla `email_templates`
   - Revisar campo `is_active`
   - Verificar variables en plantilla

### Contacto para Soporte

Para problemas técnicos, revisar:
- Logs de consola del navegador
- Logs de Supabase
- Documentación de Resend
- Esta documentación 