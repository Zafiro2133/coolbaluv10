# Sistema de Emails - Coolbalu

## 📧 Configuración del Sistema de Emails

Este documento describe la configuración y funcionamiento del sistema de emails automáticos para confirmaciones de reservas.

### 🔧 Componentes del Sistema

#### 1. **Configuración de Resend**
- **Archivo**: `config/resend.ts`
- **API Key**: `re_joWXR676_MZuHU9v6sMYBdZBMXB129XrF`
- **Dominio**: `estudiomaters.com`
- **Remitente**: `hola@estudiomaters.com`

#### 2. **Servicio de Email**
- **Archivo**: `services/email.ts`
- **Funciones principales**:
  - `sendReservationConfirmationEmail()`: Envía email de confirmación
  - `getReservationEmailData()`: Obtiene datos completos de la reserva
  - `sendConfirmationEmailOnReservationUpdate()`: Función principal para envío automático

#### 3. **Edge Function de Supabase**
- **Archivo**: `supabase/functions/resend-email/index.ts`
- **URL**: `https://rwgxdtfuzpdukaguogyh.supabase.co/functions/v1/resend-email`
- **Función**: Maneja el envío de emails usando Resend

### 🚀 Flujo de Funcionamiento

1. **Admin confirma reserva** → Se actualiza el estado a 'confirmed'
2. **Hook detecta cambio** → `useUpdateReservationStatus` se ejecuta
3. **Se obtienen datos** → `getReservationEmailData()` obtiene información completa
4. **Se llama edge function** → `sendReservationConfirmationEmail()` envía el email
5. **Email se envía** → Cliente recibe confirmación automática

### 📋 Datos Incluidos en el Email

- ✅ Nombre del cliente
- ✅ Fecha y hora del evento
- ✅ Dirección del evento
- ✅ Cantidad de adultos y niños
- ✅ Lista de productos reservados
- ✅ Precios y totales
- ✅ Información de pago
- ✅ Comentarios adicionales
- ✅ Plan de lluvia (si aplica)
- ✅ ID de reserva

### 🎨 Diseño del Email

El email incluye:
- **Header con logo**: Coolbalu con emoji de celebración
- **Mensaje de éxito**: Confirmación personalizada
- **Detalles del evento**: Información organizada en grid
- **Tabla de productos**: Lista detallada con precios
- **Resumen de costos**: Subtotal, transporte y total
- **Información de pago**: Estado del pago
- **Footer**: Datos de contacto y ID de reserva

### 🔄 Integración con el Sistema

#### Hook Modificado: `useUpdateReservationStatus`

```typescript
// Envío automático de email cuando se confirma
if (status === 'confirmed') {
  const emailResult = await sendConfirmationEmailOnReservationUpdate(reservationId);
  // Manejo de errores sin afectar la confirmación
}
```

#### Componente: `AcceptReservationDialog`

El diálogo de confirmación ahora incluye:
- Subida de comprobante de pago
- Confirmación automática de reserva
- Envío automático de email

### 🛠️ Despliegue

#### 1. Desplegar Edge Function
```bash
node scripts/deploy-email-function.js
```

#### 2. Verificar Configuración
- ✅ API Key de Resend configurada
- ✅ Dominio verificado en Resend
- ✅ Edge function desplegada
- ✅ Permisos de CORS configurados

### 🔍 Monitoreo y Logs

#### Logs del Cliente
- `📧 Enviando email de confirmación...`
- `✅ Email de confirmación enviado exitosamente`
- `⚠️ Error al enviar email de confirmación: [error]`

#### Logs de la Edge Function
- `📧 Enviando email a: [email]`
- `📋 Datos de reserva: [id]`
- `✅ Email enviado exitosamente: [data]`
- `❌ Error al enviar email: [error]`

### 🚨 Manejo de Errores

#### Estrategia de Fallback
- Los errores de email **NO** afectan la confirmación de la reserva
- Se registran warnings en lugar de errores críticos
- El admin puede reenviar emails manualmente si es necesario

#### Errores Comunes
1. **Email no encontrado**: Cliente sin email en perfil
2. **API Key inválida**: Verificar configuración de Resend
3. **Dominio no verificado**: Verificar en panel de Resend
4. **Edge function no desplegada**: Ejecutar script de despliegue

### 🔧 Configuración Adicional

#### Variables de Entorno (Opcional)
```env
RESEND_API_KEY=re_joWXR676_MZuHU9v6sMYBdZBMXB129XrF
RESEND_FROM_EMAIL=hola@estudiomaters.com
RESEND_FROM_NAME=Coolbalu
```

#### Personalización de Plantilla
- Modificar `generateEmailHTML()` en la edge function
- Actualizar estilos CSS inline
- Agregar campos adicionales según necesidades

### 📊 Métricas y Seguimiento

#### Datos a Monitorear
- Tasa de envío exitoso
- Tiempo de entrega
- Tasa de apertura (si se configura tracking)
- Errores por tipo

#### Herramientas de Monitoreo
- Logs de Supabase Edge Functions
- Dashboard de Resend
- Logs del cliente en consola

### 🔐 Seguridad

#### Medidas Implementadas
- ✅ API Key en edge function (no expuesta al cliente)
- ✅ Validación de datos de entrada
- ✅ Manejo seguro de errores
- ✅ CORS configurado correctamente

#### Recomendaciones
- Rotar API Key periódicamente
- Monitorear uso de la API
- Implementar rate limiting si es necesario

### 🎯 Próximos Pasos

#### Mejoras Futuras
1. **Templates adicionales**: Emails de recordatorio, cancelación
2. **Tracking de emails**: Apertura, clics
3. **Notificaciones push**: Integración con web push
4. **SMS**: Notificaciones por mensaje de texto
5. **WhatsApp**: Integración con WhatsApp Business API

#### Optimizaciones
1. **Queue de emails**: Para manejo de alto volumen
2. **Retry automático**: Reintentos en caso de fallo
3. **Plantillas dinámicas**: Sistema de templates más flexible
4. **A/B testing**: Probar diferentes versiones de emails

---

**Nota**: Este sistema está diseñado para ser robusto y no afectar el flujo principal de confirmación de reservas. Los errores de email se manejan de forma elegante sin interrumpir la experiencia del usuario. 