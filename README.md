# Coolbalu App

Aplicación de reservas para una empresa de entretenimiento infantil.

## Stack Tecnológico

- **Frontend:** React (Vite)
- **Backend y Base de datos:** Supabase (PostgreSQL)
- **Deploy:** Netlify (puede migrar fácilmente a Vercel)

## Funcionalidades Clave

- Reservas con fechas y disponibilidad
- Gestión de juegos inflables y categorías
- Carrito de compras dinámico
- Panel administrativo básico
- Autenticación y gestión de usuarios

## Estructura del Proyecto

```
/components         # Componentes React reutilizables
  /ui               # Componentes de UI puros (botones, inputs, etc.)
  /[caso-uso]       # Componentes agrupados por funcionalidad (admin, cart, etc.)
/contexts           # Contextos globales (Auth, Cart, etc.)
/hooks              # Hooks personalizados
/pages              # Páginas principales
/services           # Lógica de acceso a Supabase y otros servicios
/utils              # Utilidades y helpers
/styles             # Estilos globales
/public             # Archivos estáticos
```

## Instalación y Desarrollo

1. **Clona el repositorio:**
   ```bash
   git clone <repo-url>
   cd coolbaluv10
   ```
2. **Instala dependencias:**
   ```bash
   pnpm install
   ```
3. **Configura las variables de entorno:**
   - Copia `.env.env.example` a `.env.local` y completa los valores de Supabase:
     ```env
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_ANON_KEY=...
     ```
4. **Ejecuta el proyecto en desarrollo:**
   ```bash
   pnpm dev
   ```
   El servidor corre en [http://localhost:3000](http://localhost:3000)

## Sincronización de Tipos con Supabase

Cada vez que cambies la base de datos, ejecuta:
```bash
npx supabase gen types typescript --project-id <tu_project_id> --schema public > services/supabase/types.ts
```
Esto mantiene los tipos de TypeScript sincronizados con tu base real.

## Buenas Prácticas

- Usa `/components/ui` para UI pura y reutilizable.
- Agrupa componentes por caso de uso en subcarpetas.
- Mantén la lógica de negocio en hooks y servicios, no en los componentes.
- Usa contextos solo para estado global real.
- No mezcles código autogenerado con manual.
- Refactoriza y elimina código muerto regularmente.
- Usa `pnpm` para todo (no npm ni yarn).

## Migración a Next.js (opcional)

La estructura es compatible para migrar a Next.js si necesitas SSR o rutas avanzadas. Consulta la documentación oficial para detalles.

## Contacto y soporte

Para dudas o soporte, contacta a los administradores del proyecto o abre un issue. 