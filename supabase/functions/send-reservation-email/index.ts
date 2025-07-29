// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "hola@estudiomaters.com"; // Dominio real

function log(message: string, data?: unknown) {
  const time = new Date().toISOString();
  console.log(`[send-reservation-email] [${time}] ${message}`, data ?? "");
}

function validatePayload(data: any) {
  const required = ["email", "nombre", "fecha", "detalle", "monto"];
  for (const key of required) {
    if (!data[key] || typeof data[key] !== "string") {
      return `Falta el campo o tipo incorrecto: ${key}`;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method !== "POST") {
    log("Método no permitido", req.method);
    return new Response(
      JSON.stringify({ error: "Método no permitido. Usa POST." }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  let data;
  try {
    data = await req.json();
  } catch {
    log("JSON inválido", undefined);
    return new Response(
      JSON.stringify({ error: "El cuerpo debe ser un JSON válido." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validationError = validatePayload(data);
  if (validationError) {
    log("Validación fallida", validationError);
    return new Response(
      JSON.stringify({ error: validationError }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { email, nombre, fecha, detalle, monto } = data;
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    log("API Key de Resend no encontrada");
    return new Response(
      JSON.stringify({ error: "No se encontró la API Key de Resend." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const subject = "Confirmación de tu reserva";
  const html = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>¡Gracias por tu reserva! Aquí tienes los detalles:</p>
    <ul>
      <li><strong>Fecha:</strong> ${fecha}</li>
      <li><strong>Detalle:</strong> ${detalle}</li>
      <li><strong>Monto a abonar:</strong> ${monto}</li>
    </ul>
    <p><b>Pasos para abonar tu reserva:</b></p>
    <ol>
      <li>Realizá una transferencia a la cuenta bancaria:
        <ul>
          <li>CBU: 0000000000000000000000</li>
          <li>Alias: ESTUDIOMATERS.BANCO</li>
          <li>Titular: Estudio Maters</li>
        </ul>
      </li>
      <li>Enviá el comprobante de pago por WhatsApp al <a href="https://wa.me/549XXXXXXXXXX">+54 XXXXXXXXXX</a>.</li>
      <li>Una vez recibido el comprobante, confirmaremos tu reserva.</li>
    </ol>
    <p>Te agradecemos por confiar en nosotros.<br/>¡Te esperamos!</p>
    <p style="font-size:0.9em;color:#888;">Este es un mensaje automático, por favor no respondas a este correo.</p>
  `;

  try {
    const resendRes = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errorText = await resendRes.text();
      log("Error al enviar email", errorText);
      return new Response(
        JSON.stringify({
          error: "Error al enviar el email.",
          details: errorText,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    log("Email enviado", { to: email, nombre, fecha });
    return new Response(
      JSON.stringify({ success: true, message: "Email enviado correctamente." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    log("Excepción al enviar email", e);
    return new Response(
      JSON.stringify({ error: "Excepción al enviar el email.", details: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// --- TESTS AUTOMÁTICOS BÁSICOS ---
if (import.meta.main) {
  // Solo ejecuta si se corre directamente con Deno
  Deno.test("Validación de payload: todos los campos presentes", () => {
    const payload = { email: "a", nombre: "b", fecha: "c", detalle: "d", monto: "e" };
    if (validatePayload(payload) !== null) throw new Error("Validación falló");
  });
  Deno.test("Validación de payload: falta campo", () => {
    const payload = { email: "a", nombre: "b", fecha: "c", detalle: "d" };
    if (!validatePayload(payload)?.includes("monto")) throw new Error("No detectó campo faltante");
  });
  Deno.test("Validación de payload: tipo incorrecto", () => {
    const payload = { email: "a", nombre: "b", fecha: "c", detalle: "d", monto: 123 };
    if (!validatePayload(payload)?.includes("monto")) throw new Error("No detectó tipo incorrecto");
  });
} 