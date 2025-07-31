# Integración con Resend - Sistema de Correos de Confirmación

## 📧 Descripción

Esta integración implementa un sistema completo de envío de correos electrónicos usando **Resend** para las confirmaciones de reservas en CoolBalu. El sistema envía automáticamente dos correos cuando un cliente confirma una reserva:

1. **Correo al Cliente**: Con los detalles de la reserva e instrucciones de pago
2. **Correo al Admin**: Notificación de nueva reserva pendiente de pago

## 🏗️ Arquitectura

### Componentes Principales

1. **Edge Function** (`supabase/functions/send-reservation-emails/`)
   - Función segura en el servidor
   - Maneja el envío de correos sin exponer API keys
   - Validación y manejo de errores robusto

2. **Hook Personalizado** (`hooks/useReservationEmails.ts`)
   - Interfaz React para el envío de correos
   - Manejo de estados de carga y errores
   - Integración con el sistema de notificaciones

3. **Función Local** (`services/supabase/sendReservationEmails.ts`)
   - Versión para desarrollo local
   - Misma funcionalidad que la Edge Function
   - Útil para testing y desarrollo

## ⚙️ Configuración

### 1. Variables de Entorno

#### Desarrollo Local (`.env.local`)
```bash
# Resend API Key
RESEND_API_KEY=re_BtA3bmsH_HCeHbsLGqwkmF4iy5dHyDg7t

# Supabase Configuration
VITE_SUPABASE_URL=https://rwgxdtfuzpdukaguogyh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzQsImV4cCI6MjA1MDU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8

# Admin Email Configuration
ADMIN_EMAIL=admin@miweb.com
```

#### Supabase (Secrets)
```bash
# Configurar en Supabase Dashboard > Settings > Edge Functions
RESEND_API_KEY=re_BtA3bmsH_HCeHbsLGqwkmF4iy5dHyDg7t
ADMIN_EMAIL=admin@miweb.com
```

### 2. Despliegue de Edge Function

```bash
# Desde el directorio raíz del proyecto
cd supabase

# Desplegar la función
supabase functions deploy send-reservation-emails

# Verificar el estado
supabase functions list
```

### 3. Configuración de Dominio en Resend

1. Ir a [Resend Dashboard](https://resend.com)
2. Configurar dominio `coolbalu.com` para envío
3. Verificar DNS records
4. Usar `noreply@coolbalu.com` como remitente

## 🚀 Uso

### En Componentes React

```typescript
import { useReservationEmails } from '@/hooks/useReservationEmails';

function ReservationConfirmation({ reservationId }: { reservationId: string }) {
  const { sendEmailsForCurrentUser, isLoading } = useReservationEmails();

  const handleSendEmails = async () => {
    const result = await sendEmailsForCurrentUser(reservationId);
    
    if (result.success) {
      console.log('Correos enviados exitosamente');
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    <button 
      onClick={handleSendEmails} 
      disabled={isLoading}
    >
      {isLoading ? 'Enviando...' : 'Enviar Confirmación'}
    </button>
  );
}
```

### Envío Manual con Email Específico

```typescript
import { useReservationEmails } from '@/hooks/useReservationEmails';

function AdminPanel() {
  const { sendReservationEmails } = useReservationEmails();

  const handleResendEmail = async (reservationId: string, email: string) => {
    const result = await sendReservationEmails(reservationId, email);
    
    if (result.success) {
      console.log('Correo reenviado exitosamente');
    }
  };
}
```

### Integración en el Flujo de Reserva

```typescript
// En pages/Reservation.tsx o similar
import { useReservationEmails } from '@/hooks/useReservationEmails';

export default function Reservation() {
  const { sendEmailsForCurrentUser } = useReservationEmails();

  const handleConfirmReservation = async () => {
    try {
      // 1. Crear la reserva
      const { data: reservation, error } = await createReservation(reservationData);
      
      if (error) throw error;

      // 2. Crear los items de reserva
      await createReservationItems(items);

      // 3. Enviar correos de confirmación
      const emailResult = await sendEmailsForCurrentUser(reservation.id);
      
      if (emailResult.success) {
        // Redirigir a página de confirmación
        navigate('/reservation-success');
      } else {
        // Mostrar error pero no fallar la reserva
        console.warn('Error enviando correos:', emailResult.error);
      }

    } catch (error) {
      console.error('Error en reserva:', error);
    }
  };
}
```

## 📧 Plantillas de Correo

### Correo al Cliente
- **Asunto**: `🎉 Confirmación de Reserva #XXXX - CoolBalu`
- **Contenido**: 
  - Detalles completos de la reserva
  - Lista de servicios contratados
  - Información de pago (50% requerido)
  - Instrucciones para enviar comprobante
  - Datos de contacto

### Correo al Admin
- **Asunto**: `🆕 Nueva Reserva #XXXX - [Nombre Cliente]`
- **Contenido**:
  - Información del cliente
  - Detalles del evento
  - Servicios solicitados
  - Monto total y pago requerido
  - Link al dashboard

## 🔒 Seguridad

### Medidas Implementadas

1. **API Key Protegida**: Solo accesible en Edge Functions
2. **Validación de Entrada**: Verificación de datos antes del envío
3. **Manejo de Errores**: Logs detallados sin exponer información sensible
4. **Rate Limiting**: Implementado por Resend automáticamente
5. **CORS Configurado**: Solo permite requests autorizados

### Variables de Entorno Seguras

```typescript
// ✅ Correcto - En Edge Function
const apiKey = Deno.env.get('RESEND_API_KEY');

// ❌ Incorrecto - En Frontend
const apiKey = process.env.RESEND_API_KEY;
```

## 🧪 Testing

### Testing Local

```typescript
// Usar la función local para desarrollo
import { sendReservationEmails } from '@/services/supabase/sendReservationEmails';

const testReservation = {
  // ... datos de prueba
};

const result = await sendReservationEmails(testReservation, 'test@example.com');
console.log('Resultado:', result);
```

### Testing Edge Function

```bash
# Probar la función localmente
supabase functions serve send-reservation-emails

# Hacer request de prueba
curl -X POST http://localhost:54321/functions/v1/send-reservation-emails \
  -H "Content-Type: application/json" \
  -d '{"reservationId": "test-id", "clienteEmail": "test@example.com"}'
```

## 📊 Monitoreo

### Logs de Resend
- Dashboard de Resend para métricas de envío
- Tasa de entrega y apertura
- Bounces y errores

### Logs de Supabase
- Edge Function logs en Supabase Dashboard
- Errores y performance
- Uso de recursos

## 🚨 Troubleshooting

### Errores Comunes

1. **API Key no válida**
   ```
   Error: API key de Resend no configurada
   ```
   **Solución**: Verificar variable de entorno en Supabase

2. **Dominio no verificado**
   ```
   Error: Domain not verified
   ```
   **Solución**: Verificar DNS en Resend Dashboard

3. **Rate limit excedido**
   ```
   Error: Rate limit exceeded
   ```
   **Solución**: Esperar o contactar soporte de Resend

4. **Email inválido**
   ```
   Error: Email del cliente no válido
   ```
   **Solución**: Validar formato de email antes del envío

### Debugging

```typescript
// Habilitar logs detallados
console.log('Enviando correo a:', clienteEmail);
console.log('Datos de reserva:', reservation);

// Verificar configuración
console.log('API Key configurada:', !!process.env.RESEND_API_KEY);
console.log('Admin email:', process.env.ADMIN_EMAIL);
```

## 📈 Mejoras Futuras

1. **Plantillas Dinámicas**: Sistema de plantillas personalizables
2. **Seguimiento**: Tracking de apertura y clicks
3. **Automatización**: Triggers automáticos en base de datos
4. **Multiidioma**: Soporte para diferentes idiomas
5. **A/B Testing**: Pruebas de diferentes plantillas
6. **Analytics**: Métricas detalladas de engagement

## 🔗 Enlaces Útiles

- [Resend Documentation](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Supabase Dashboard](https://supabase.com/dashboard) 