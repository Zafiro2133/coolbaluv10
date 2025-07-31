import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const { client_email, client_name, reservation_date, service, price } = await req.json();

  try {
    // Mail al cliente
    await resend.emails.send({
      from: "Reservas <reservas@tudominio.com>",
      to: client_email,
      subject: "Confirmación de tu reserva",
      html: `
        <h1>¡Gracias por tu reserva, ${client_name}!</h1>
        <p>Servicio: ${service}</p>
        <p>Fecha: ${new Date(reservation_date).toLocaleString()}</p>
        <p>Precio: $${price}</p>
        <p>Para confirmar tu reserva, realizá el pago según las instrucciones en nuestro sitio.</p>
      `
    });

    // Mail al admin
    await resend.emails.send({
      from: "Reservas <reservas@tudominio.com>",
      to: "hola@estudiomaters.com",
      subject: `Nueva reserva de ${client_name}`,
      html: `
        <h1>Reserva pendiente de pago</h1>
        <p>Cliente: ${client_name}</p>
        <p>Email: ${client_email}</p>
        <p>Servicio: ${service}</p>
        <p>Fecha: ${new Date(reservation_date).toLocaleString()}</p>
        <p>Precio: $${price}</p>
      `
    });

    return new Response("Emails enviados", { status: 200 });

  } catch (error) {
    console.error("Error al enviar emails:", error);
    return new Response("Error", { status: 500 });
  }
});
