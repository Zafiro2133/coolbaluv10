# Sistema de Emails - Coolbalu

## 📧 Descripción General

Se ha implementado un sistema completo de emails automatizados usando **Resend** como proveedor de emails transaccionales. El sistema incluye:

- ✅ Emails de activación de cuenta
- ✅ Emails de bienvenida
- ✅ Emails de confirmación de reserva
- ✅ Emails de notificación al admin
- ✅ Logs completos de emails
- ✅ Templates HTML profesionales
- ✅ Sistema de tokens de activación

## 🏗️ Arquitectura

### Estructura de Archivos

```
services/
├── email/
│   ├── emailTypes.ts          # Tipos TypeScript
│   └── emailService.ts        # Servicio principal de emails
├── supabase/
│   ├── registerUser.ts        # Registro con emails
│   ├── activateAccount.ts     # Activación de cuentas
│   └── reservations.ts        # Reservas con emails
hooks/
└── useEmail.ts               # Hook personalizado
components/
└── admin/
    └── EmailLogs.tsx         # Panel de logs
pages/
└── ActivateAccount.tsx       # Página de activación
```

### Base de Datos

#### Tabla `email_logs`
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabla `activation_tokens`
```sql
CREATE TABLE activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Configuración

### 1. Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```env
# Resend Configuration
VITE_RESEND_API_KEY=re_tu_api_key_aqui
VITE_RESEND_FROM_EMAIL=hola@estudiomaters.com
VITE_RESEND_FROM_NAME=Coolbalu

# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### 2. Configurar Base de Datos

Ejecuta el script de configuración:

```bash
node scripts/setup-email-system.js
```

### 3. Probar el Sistema

```bash
node scripts/test-email-system.js
```

## 📨 Tipos de Emails

### 1. Activación de Cuenta
- **Trigger**: Registro de usuario
- **Destinatario**: Nuevo usuario
- **Contenido**: Enlace de activación con token único
- **Expiración**: 24 horas

### 2. Bienvenida
- **Trigger**: Activación de cuenta exitosa
- **Destinatario**: Usuario activado
- **Contenido**: Confirmación y bienvenida

### 3. Reserva Creada
- **Trigger**: Creación de nueva reserva
- **Destinatario**: Cliente
- **Contenido**: Detalles de reserva y datos de pago

### 4. Notificación Admin
- **Trigger**: Creación de nueva reserva
- **Destinatario**: Administrador
- **Contenido**: Notificación de nueva reserva pendiente

### 5. Reserva Confirmada
- **Trigger**: Confirmación de pago por admin
- **Destinatario**: Cliente
- **Contenido**: Confirmación y detalles finales

## 🔧 Uso en el Código

### Registro de Usuario

```typescript
import { registerUser } from '../services/supabase/registerUser';

// El email de activación se envía automáticamente
const result = await registerUser({
  email: 'usuario@ejemplo.com',
  password: 'password123',
  firstName: 'Juan',
  lastName: 'Pérez'
});
```

### Activación de Cuenta

```typescript
import { activateAccount } from '../services/supabase/activateAccount';

// El email de bienvenida se envía automáticamente
const result = await activateAccount(token);
```

### Creación de Reserva

```typescript
import { createReservationWithEmails } from '../services/supabase/reservations';

// Los emails se envían automáticamente
const result = await createReservationWithEmails(
  reservationData,
  itemsData,
  'admin@coolbalu.com'
);
```

### Confirmación de Reserva

```typescript
import { confirmReservationWithEmail } from '../services/supabase/reservations';

// El email de confirmación se envía automáticamente
const result = await confirmReservationWithEmail(
  reservationId,
  'admin@coolbalu.com'
);
```

### Hook Personalizado

```typescript
import { useEmail } from '../hooks/useEmail';

const { sendAccountActivationEmail, sendReservationEmails } = useEmail();

// Enviar email manualmente si es necesario
await sendAccountActivationEmail(email, name, token);
```

## 🎨 Templates HTML

Los templates están diseñados con:

- ✅ Diseño responsive
- ✅ Compatibilidad con clientes de email
- ✅ Branding de Coolbalu
- ✅ Botones de acción claros
- ✅ Información estructurada
- ✅ Colores consistentes

### Estructura de Template

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <!-- Header con gradiente -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <h1>Coolbalu</h1>
  </div>
  
  <!-- Contenido principal -->
  <div style="background: white; padding: 30px;">
    <!-- Contenido específico del email -->
  </div>
</div>
```

## 📊 Monitoreo y Logs

### Panel de Administración

Accede a `/admin` → "Logs de Email" para ver:

- 📈 Estadísticas de emails enviados/fallidos
- 📋 Historial completo de emails
- 🔍 Filtros por tipo, estado y fecha
- ⚠️ Errores y mensajes de fallo

### Logs en Base de Datos

```sql
-- Ver todos los emails
SELECT * FROM email_logs ORDER BY created_at DESC;

-- Ver emails fallidos
SELECT * FROM email_logs WHERE status = 'failed';

-- Estadísticas por tipo
SELECT email_type, status, COUNT(*) 
FROM email_logs 
GROUP BY email_type, status;
```

## 🔒 Seguridad

### Tokens de Activación

- ✅ Tokens únicos por usuario
- ✅ Expiración automática (24 horas)
- ✅ Uso único (se marcan como usados)
- ✅ Limpieza automática de tokens expirados

### Políticas RLS

- ✅ Usuarios solo ven sus propios logs
- ✅ Admins ven todos los logs
- ✅ Service role puede insertar/actualizar
- ✅ Protección de datos sensibles

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Emails no se envían
```bash
# Verificar configuración de Resend
node scripts/test-email-system.js
```

#### 2. Error de dominio no verificado
- Verificar que el dominio esté verificado en Resend
- Usar un dominio verificado en `VITE_RESEND_FROM_EMAIL`

#### 3. Tokens de activación expirados
```sql
-- Limpiar tokens expirados manualmente
SELECT cleanup_expired_activation_tokens();
```

#### 4. Logs no aparecen en admin
- Verificar políticas RLS
- Verificar que el usuario tenga rol de admin

### Logs de Debug

```typescript
// Habilitar logs detallados
console.log('Email service error:', error);
console.log('Resend response:', response);
```

## 📈 Métricas y Analytics

### KPIs Recomendados

- 📧 Tasa de entrega de emails
- ⏱️ Tiempo de activación de cuentas
- 💰 Conversión de reservas
- 🔄 Tasa de reenvío de emails

### Dashboard Sugerido

```typescript
// Métricas para dashboard
const metrics = {
  totalEmails: await getEmailCount(),
  deliveryRate: await getDeliveryRate(),
  activationRate: await getActivationRate(),
  reservationConversion: await getReservationConversion()
};
```

## 🔄 Mantenimiento

### Limpieza Automática

```sql
-- Limpiar tokens expirados (ejecutar diariamente)
SELECT cleanup_expired_activation_tokens();

-- Limpiar logs antiguos (opcional)
DELETE FROM email_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Backup de Logs

```sql
-- Exportar logs importantes
SELECT * FROM email_logs 
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

## 🎯 Próximos Pasos

### Mejoras Sugeridas

1. **Templates Dinámicos**
   - Sistema de plantillas en base de datos
   - Editor visual de templates

2. **Automatización Avanzada**
   - Emails de recordatorio
   - Emails de seguimiento
   - Notificaciones push

3. **Analytics Avanzado**
   - Tracking de apertura y clics
   - A/B testing de templates
   - Métricas de engagement

4. **Integración con WhatsApp**
   - Notificaciones por WhatsApp Business API
   - Envío de comprobantes automático

## 📞 Soporte

Para problemas o consultas:

1. Revisar logs en `/admin/emails`
2. Ejecutar script de prueba
3. Verificar configuración de Resend
4. Consultar documentación de Resend

---

**¡El sistema de emails está listo para usar! 🎉** 