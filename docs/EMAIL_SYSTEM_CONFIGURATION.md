# Sistema de Envío de Emails - CoolBalu

## 📧 Configuración Completa

### Variables de Entorno Configuradas

#### Supabase Edge Functions
```bash
RESEND_API_KEY=re_BtA3bmsH_HCeHbsLGqwkmF4iy5dHyDg7t
ADMIN_EMAIL=hola@estudiomaters.com
```

#### Archivo .env.local
```bash
VITE_SUPABASE_URL=https://rwgxdtfuzpdukaguogyh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_BtA3bmsH_HCeHbsLGqwkmF4iy5dHyDg7t
ADMIN_EMAIL=hola@estudiomaters.com
```

### 🚀 Edge Functions Desplegadas

#### send-reservation-emails
- **URL**: `https://rwgxdtfuzpdukaguogyh.supabase.co/functions/v1/send-reservation-emails`
- **Estado**: ✅ Desplegada y configurada
- **Funcionalidad**: Envía emails de confirmación al cliente y notificación al admin

### 📋 Funcionalidades Implementadas

#### 1. Envío Automático de Emails
- **Cuándo**: Al crear una nueva reserva
- **Para el Cliente**: Email de confirmación con detalles de la reserva
- **Para el Admin**: Notificación de nueva reserva pendiente de pago

#### 2. Emails Enviados

##### Email al Cliente
- ✅ Confirmación de reserva
- ✅ Detalles del evento (fecha, hora, dirección)
- ✅ Lista de servicios reservados
- ✅ Información de pago (50% del total)
- ✅ Datos de contacto
- ✅ Link al perfil del usuario

##### Email al Admin
- ✅ Notificación de nueva reserva
- ✅ Información completa del cliente
- ✅ Detalles del evento
- ✅ Lista de servicios solicitados
- ✅ Monto total y pago requerido
- ✅ Link al dashboard de administración

#### 3. Funcionalidades del Panel de Admin
- ✅ Botón para reenviar emails desde el panel de reservas
- ✅ Visualización del estado de envío de emails
- ✅ Manejo de errores con notificaciones toast

### 🔧 Archivos Principales

#### Edge Function
- `supabase/functions/send-reservation-emails/index.ts`
  - Maneja el envío de emails usando Resend
  - Obtiene datos completos de la reserva desde Supabase
  - Genera emails HTML personalizados
  - Maneja errores y CORS

#### Hook de React
- `hooks/useReservationEmails.ts`
  - Hook personalizado para manejar emails
  - Función `sendEmailsForCurrentUser()` para envío automático
  - Función `resendEmails()` para reenvío manual
  - Manejo de estados de carga y errores

#### Componente de Admin
- `components/admin/ReservationManagement.tsx`
  - Botón para reenviar emails
  - Integración con el hook de emails
  - Notificaciones de éxito/error

### 🎨 Plantillas de Email

#### Email del Cliente
- **Asunto**: `🎉 Confirmación de Reserva #XXXX - CoolBalu`
- **Diseño**: Gradiente azul/púrpura
- **Contenido**: Confirmación, detalles, servicios, pago, contacto

#### Email del Admin
- **Asunto**: `🆕 Nueva Reserva #XXXX - [Nombre Cliente]`
- **Diseño**: Rojo para indicar urgencia
- **Contenido**: Notificación, información del cliente, detalles, servicios

### 🔍 Pruebas y Verificación

#### Script de Prueba
```bash
node scripts/test-email-system.js
```

Este script verifica:
- ✅ Conexión a Supabase
- ✅ Obtención de reservas
- ✅ Funcionamiento de la Edge Function
- ✅ Envío de emails de prueba

### 🛠️ Comandos de Despliegue

#### Configurar Variables de Entorno
```bash
supabase secrets set RESEND_API_KEY=re_BtA3bmsH_HCeHbsLGqwkmF4iy5dHyDg7t --project-ref rwgxdtfuzpdukaguogyh
supabase secrets set ADMIN_EMAIL=hola@estudiomaters.com --project-ref rwgxdtfuzpdukaguogyh
```

#### Desplegar Edge Function
```bash
supabase functions deploy send-reservation-emails --project-ref rwgxdtfuzpdukaguogyh
```

### 📊 Flujo de Funcionamiento

1. **Usuario crea reserva** → Se llama a `sendEmailsForCurrentUser()`
2. **Hook obtiene email del usuario** → Desde Supabase Auth
3. **Se llama a Edge Function** → Con ID de reserva y email del cliente
4. **Edge Function obtiene datos** → Reserva completa con items y perfil
5. **Se generan emails HTML** → Plantillas personalizadas
6. **Se envían emails** → Cliente y admin vía Resend
7. **Se retorna resultado** → Éxito o error con detalles

### 🔒 Seguridad

- ✅ API Key de Resend configurada como secret
- ✅ Validación de datos de entrada
- ✅ Manejo de errores robusto
- ✅ CORS configurado correctamente
- ✅ Variables de entorno protegidas

### 📱 Integración con la App

#### En Reservation.tsx
```typescript
const emailResult = await sendEmailsForCurrentUser(data.id);
if (emailResult.success) {
  console.log('✅ Correos enviados exitosamente');
} else {
  console.warn('⚠️ Error enviando correos:', emailResult.error);
}
```

#### En Admin Panel
```typescript
const result = await resendEmails(reservation.id, userEmail);
if (result.success) {
  toast({
    title: "✅ Correos reenviados",
    description: `Enviados a ${result.sentTo?.cliente} y ${result.sentTo?.admin}`
  });
}
```

### 🎯 Estado Actual

- ✅ **Configuración completa**: Variables de entorno, Edge Function, hooks
- ✅ **Funcionalidad básica**: Envío automático al crear reserva
- ✅ **Panel de admin**: Reenvío manual de emails
- ✅ **Manejo de errores**: Notificaciones y logging
- ✅ **Plantillas HTML**: Emails profesionales y responsivos
- ✅ **Pruebas**: Script de verificación del sistema

### 🚀 Próximos Pasos

1. **Personalizar plantillas**: Agregar logo, colores de marca
2. **Configurar datos bancarios**: En el email de pago
3. **Agregar tracking**: Seguimiento de apertura de emails
4. **Plantillas adicionales**: Recordatorios, confirmaciones de pago
5. **Configuración de Resend**: Dominio personalizado para emails

---

**Última actualización**: 31 de Julio, 2025
**Estado**: ✅ Completamente funcional
**Admin Email**: hola@estudiomaters.com
**API Key**: Configurada y funcionando 