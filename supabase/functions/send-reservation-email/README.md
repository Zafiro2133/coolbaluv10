# send-reservation-email

Función Edge de Supabase para enviar un email de confirmación de reserva usando Resend.

## Variables de entorno

Crea un archivo `.env` en `supabase/functions/send-reservation-email/` con:

```
RESEND_API_KEY=re_Ja47ULaC_MNpwh3VonXuRhU3vx9y7b4b2
```

## Cómo probar localmente

1. Inicia la función:

```sh
supabase functions serve send-reservation-email
```

2. Endpoint local:

```
http://localhost:54321/functions/v1/send-reservation-email
```

3. Headers necesarios:
- `Content-Type: application/json`

4. Ejemplo de body JSON:

```json
{
  "email": "cliente@ejemplo.com",
  "nombre": "Juan Pérez",
  "fecha": "2024-07-20",
  "detalle": "Cancha de fútbol 5, 18:00 a 19:00",
  "monto": "$5000"
}
```

## Ejemplo con fetch

```js
fetch("http://localhost:54321/functions/v1/send-reservation-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "cliente@ejemplo.com",
    nombre: "Juan Pérez",
    fecha: "2024-07-20",
    detalle: "Cancha de fútbol 5, 18:00 a 19:00",
    monto: "$5000"
  })
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
```

## Ejemplo en Postman
- Método: `POST`
- URL: `http://localhost:54321/functions/v1/send-reservation-email`
- Headers:
  - `Content-Type: application/json`
- Body (raw, JSON):

```json
{
  "email": "cliente@ejemplo.com",
  "nombre": "Juan Pérez",
  "fecha": "2024-07-20",
  "detalle": "Cancha de fútbol 5, 18:00 a 19:00",
  "monto": "$5000"
}
``` 