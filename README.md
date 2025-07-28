# Coolbalu App

Aplicación de reservas para una empresa de entretenimiento infantil.

## Stack Tecnológico

- **Frontend:** React (Vite) + TypeScript
- **Backend y Base de datos:** Supabase (PostgreSQL)
- **UI:** Tailwind CSS + Shadcn/ui
- **Deploy:** Netlify (compatible con Vercel)

## Funcionalidades Clave

### 🎯 Sistema de Reservas
- Reservas con fechas y disponibilidad en tiempo real
- Gestión de zonas geográficas (Rosario)
- Reprogramación por lluvia
- Horas extra configurables
- Sistema de confirmación y cancelación

### 🎪 Gestión de Productos
- Catálogo de juegos inflables con categorías
- **Imágenes múltiples** (hasta 3 por producto)
- Carrusel de imágenes en frontend
- Subida de archivos desde ordenador
- Validación de formatos (JPG, PNG, WebP)

### 🛒 Carrito de Compras
- Carrito dinámico con persistencia
- Gestión de cantidades
- Cálculo automático de precios
- Integración con reservas

### 👨‍💼 Panel Administrativo
- Gestión completa de productos
- Administración de disponibilidades
- Gestión de usuarios y roles
- Configuración del sistema
- Gestión de reservas

### 🔐 Autenticación y Seguridad
- Autenticación con Supabase Auth
- Roles de usuario (admin, user)
- Row Level Security (RLS)
- Políticas de acceso granulares

## Estructura del Proyecto

```
/components         # Componentes React reutilizables
  /ui               # Componentes de UI puros (shadcn/ui)
  /admin            # Componentes del panel administrativo
  /product          # Componentes relacionados con productos
/contexts           # Contextos globales (Auth, Cart)
/hooks              # Hooks personalizados
/pages              # Páginas principales
/services           # Lógica de acceso a Supabase
/utils              # Utilidades esenciales
/styles             # Estilos globales
/public             # Archivos estáticos
/supabase           # Configuración y migraciones de Supabase
```

## Instalación y Desarrollo

### 1. **Clona el repositorio:**
```bash
git clone <repo-url>
cd coolbaluv10
```

### 2. **Instala dependencias:**
```bash
pnpm install
```

### 3. **Configura las variables de entorno:**
Crea un archivo `.env.local` con:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 4. **Configura Supabase:**
1. Crea un proyecto en Supabase
2. Ejecuta las migraciones en orden cronológico desde `supabase/migrations/`
3. Ejecuta el script de configuración: `supabase/scripts/setup-database.sql`
4. Verifica que todas las políticas y configuraciones estén aplicadas

### 5. **Ejecuta el proyecto:**
```bash
pnpm dev
```
El servidor corre en [http://localhost:3000](http://localhost:3000)

## Configuración de Base de Datos

### Migraciones Principales
Las migraciones se ejecutan automáticamente en orden cronológico. Las más importantes:

- **Sistema de usuarios y roles**
- **Tabla de productos con imágenes múltiples**
- **Sistema de reservas completo**
- **Configuración de zonas geográficas**
- **Sistema de disponibilidades**
- **Configuración del sistema**

### Políticas de Seguridad
El sistema implementa Row Level Security (RLS) con políticas granulares:
- Usuarios normales: solo lectura de productos y disponibilidades
- Admins: acceso completo a todas las funcionalidades
- Reservas: usuarios solo ven sus propias reservas

## Características Técnicas

### 🖼️ Sistema de Imágenes
- **Subida múltiple**: Hasta 3 imágenes por producto
- **Formatos soportados**: JPG, PNG, WebP
- **Tamaño máximo**: 5MB por imagen
- **Dimensiones recomendadas**: 800x600px
- **Carrusel automático** en frontend
- **Gestión de imagen principal**

### 📅 Sistema de Reservas
- **Disponibilidad en tiempo real**
- **Zonas geográficas** configurables
- **Reprogramación por lluvia**
- **Horas extra** configurables
- **Confirmación automática**

### 🔧 Configuración del Sistema
- **Horarios de negocio** configurables
- **Zonas de servicio** con coordenadas
- **Configuración de precios**
- **Mensajes del sistema**

## Sincronización de Tipos con Supabase

Cada vez que cambies la base de datos, ejecuta:
```bash
npx supabase gen types typescript --project-id <tu_project_id> --schema public > services/supabase/types.ts
```

## Buenas Prácticas

- ✅ Usa `/components/ui` para UI pura y reutilizable
- ✅ Agrupa componentes por caso de uso en subcarpetas
- ✅ Mantén la lógica de negocio en hooks y servicios
- ✅ Usa contextos solo para estado global real
- ✅ No mezcles código autogenerado con manual
- ✅ Refactoriza y elimina código muerto regularmente
- ✅ Usa `pnpm` para todo (no npm ni yarn)

## Migración a Next.js (opcional)

La estructura es compatible para migrar a Next.js si necesitas SSR o rutas avanzadas. Consulta la documentación oficial para detalles.

## Troubleshooting

### Problemas Comunes

1. **Error de CORS**: Verifica la configuración de dominios en Supabase
2. **Imágenes no cargan**: Revisa las políticas del bucket `product-images`
3. **Error de autenticación**: Verifica las variables de entorno
4. **Reservas no funcionan**: Ejecuta las migraciones en orden cronológico

### Debugging
Para debugging, usa las herramientas del navegador:
- Console para errores de JavaScript
- Network tab para problemas de API
- Application tab para verificar autenticación

## Contacto y Soporte

Para dudas o soporte, contacta a los administradores del proyecto o abre un issue. 