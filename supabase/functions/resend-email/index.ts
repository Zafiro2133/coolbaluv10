import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'npm:resend'

const resend = new Resend('re_joWXR676_MZuHU9v6sMYBdZBMXB129XrF')

interface ReservationEmailData {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  eventDate: string;
  eventTime: string;
  eventAddress: string;
  adultCount: number;
  childCount: number;
  total: number;
  subtotal: number;
  transportCost: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    extraHours: number;
    itemTotal: number;
  }>;
  paymentProofUrl?: string;
  comments?: string;
  rainReschedule?: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  reservationData: ReservationEmailData;
}

// Función para generar el HTML del email
function generateEmailHTML(data: ReservationEmailData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Formato HH:MM
  };

  const rainRescheduleText = {
    'no': 'No reprogramar',
    'indoor': 'Mover a interior',
    'reschedule': 'Reprogramar fecha'
  };

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Reserva - Coolbalu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6c757d;
          font-size: 16px;
        }
        .success-message {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
          color: #155724;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #495057;
          margin-bottom: 15px;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 8px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-item {
          background-color: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid #007bff;
        }
        .info-label {
          font-weight: bold;
          color: #495057;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .info-value {
          color: #212529;
          font-size: 16px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }
        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #495057;
        }
        .total-section {
          background-color: #e9ecef;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .total-final {
          font-size: 20px;
          font-weight: bold;
          color: #007bff;
          border-top: 2px solid #007bff;
          padding-top: 10px;
          margin-top: 10px;
        }
        .payment-info {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin-top: 25px;
        }
        .payment-title {
          font-weight: bold;
          color: #856404;
          margin-bottom: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          color: #6c757d;
          font-size: 14px;
        }
        @media (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          .container {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎉 Coolbalu</div>
          <div class="subtitle">Tu evento inolvidable está confirmado</div>
        </div>

        <div class="success-message">
          <strong>¡Felicitaciones ${data.customerName}!</strong><br>
          Tu reserva ha sido confirmada exitosamente. Estamos emocionados de ser parte de tu evento especial.
        </div>

        <div class="section">
          <div class="section-title">📅 Detalles del Evento</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Fecha</div>
              <div class="info-value">${formatDate(data.eventDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Hora</div>
              <div class="info-value">${formatTime(data.eventTime)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Adultos</div>
              <div class="info-value">${data.adultCount}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Niños</div>
              <div class="info-value">${data.childCount}</div>
            </div>
          </div>
          <div class="info-item" style="grid-column: 1 / -1;">
            <div class="info-label">📍 Dirección del Evento</div>
            <div class="info-value">${data.eventAddress}</div>
          </div>
          ${data.rainReschedule && data.rainReschedule !== 'no' ? `
            <div class="info-item" style="grid-column: 1 / -1; background-color: #fff3cd; border-left-color: #ffc107;">
              <div class="info-label">🌧️ Plan de Lluvia</div>
              <div class="info-value">${rainRescheduleText[data.rainReschedule as keyof typeof rainRescheduleText]}</div>
            </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">🛍️ Productos Reservados</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>
                    <strong>${item.productName}</strong>
                    ${item.extraHours > 0 ? `<br><small>+${item.extraHours} horas extra</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td><strong>${formatCurrency(item.itemTotal)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(data.subtotal)}</span>
          </div>
          <div class="total-row">
            <span>Transporte:</span>
            <span>${formatCurrency(data.transportCost)}</span>
          </div>
          <div class="total-row total-final">
            <span>Total Final:</span>
            <span>${formatCurrency(data.total)}</span>
          </div>
        </div>

        <div class="payment-info">
          <div class="payment-title">💳 Información de Pago</div>
          <p>Tu reserva está confirmada y el pago ha sido verificado. No necesitas realizar ningún pago adicional.</p>
          ${data.paymentProofUrl ? `
            <p><strong>Comprobante de pago:</strong> Ya fue subido y verificado.</p>
          ` : ''}
        </div>

        ${data.comments ? `
          <div class="section">
            <div class="section-title">📝 Comentarios Adicionales</div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-value">${data.comments}</div>
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>Coolbalu</strong> - Hacemos que tu evento sea inolvidable</p>
          <p>📧 hola@estudiomaters.com | 📱 +54 9 11 1234-5678</p>
          <p>ID de Reserva: ${data.reservationId}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Configurar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    const { to, subject, reservationData }: EmailRequest = await req.json();

    if (!to || !subject || !reservationData) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: to, subject, reservationData' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    console.log('📧 Enviando email a:', to);
    console.log('📋 Datos de reserva:', reservationData.reservationId);

    const htmlContent = generateEmailHTML(reservationData);

    const { data, error } = await resend.emails.send({
      from: 'Coolbalu <hola@estudiomaters.com>',
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Error al enviar email:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    console.log('✅ Email enviado exitosamente:', data);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email enviado exitosamente',
        data: data 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('❌ Error en la función:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}); 