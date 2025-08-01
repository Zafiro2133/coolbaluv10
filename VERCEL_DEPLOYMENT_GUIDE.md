# 🚀 Guía de Despliegue en Vercel - Coolbalu

## 📋 Configuración Necesaria

### 1. **Variables de Entorno en Vercel**

Configura las siguientes variables de entorno en el dashboard de Vercel:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://rwgxdtfuzpdukaguogyh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzEyOTEsImV4cCI6MjA2ODk0NzI5MX0.6zUaR58p-SHC8axMZ3KzMWCEGeIfBQp2VKVAb0wvVW0

# Resend Configuration
VITE_RESEND_API_KEY=re_joWXR676_MZuHU9v6sMYBdZBMXB129XrF
VITE_RESEND_FROM_EMAIL=hola@estudiomaters.com
VITE_RESEND_FROM_NAME=Coolbalu

# App Configuration
VITE_APP_NAME=Coolbalu
VITE_APP_URL=https://tu-dominio.vercel.app
```

### 2. **Configuración de Supabase**

#### CORS Settings
Agrega tu dominio de Vercel a los orígenes permitidos en Supabase:

1. Ve a **Settings > API** en tu proyecto de Supabase
2. En **CORS (Cross-Origin Resource Sharing)**, agrega:
   ```
   https://tu-dominio.vercel.app
   https://tu-dominio.vercel.app/*
   ```

#### Edge Functions
Asegúrate de que las edge functions estén desplegadas:

```bash
npx supabase functions deploy resend-email
```

### 3. **Configuración de Resend**

#### Dominio Verificado
- ✅ `estudiomaters.com` ya está verificado
- ✅ API Key configurada: `re_joWXR676_MZuHU9v6sMYBdZBMXB129XrF`

### 4. **Configuración de Cloudinary (si aplica)**

Si usas Cloudinary para subida de imágenes, agrega:

```env
VITE_CLOUDINARY_CLOUD_NAME=tu-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=tu-upload-preset
```

## 🚀 Pasos para Desplegar

### 1. **Preparar el Repositorio**

```bash
# Asegúrate de que todos los archivos estén commitados
git add .
git commit -m "Preparar para despliegue en Vercel"
git push origin main
```

### 2. **Conectar con Vercel**

1. Ve a [vercel.com](https://vercel.com)
2. Crea una nueva cuenta o inicia sesión
3. Haz clic en **"New Project"**
4. Importa tu repositorio de GitHub
5. Vercel detectará automáticamente que es un proyecto Vite

### 3. **Configurar Variables de Entorno**

1. En el dashboard de Vercel, ve a **Settings > Environment Variables**
2. Agrega todas las variables listadas arriba
3. Asegúrate de que estén marcadas para **Production**, **Preview** y **Development**

### 4. **Configuración del Proyecto**

Vercel detectará automáticamente:
- **Framework**: Vite
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

### 5. **Desplegar**

1. Haz clic en **"Deploy"**
2. Vercel construirá y desplegará tu aplicación
3. Obtendrás una URL como: `https://tu-proyecto.vercel.app`

## 🔧 Configuraciones Específicas

### **vercel.json**
Ya está configurado con:
- ✅ Build commands para pnpm
- ✅ Headers de seguridad
- ✅ Rewrites para SPA
- ✅ Configuración de funciones

### **Variables de Entorno**
- ✅ Prefijo `VITE_` para variables del cliente
- ✅ Fallbacks para desarrollo local
- ✅ Configuración centralizada

## 🧪 Verificar el Despliegue

### 1. **Probar la Aplicación**
- ✅ Navega a tu URL de Vercel
- ✅ Verifica que la aplicación cargue correctamente
- ✅ Prueba la funcionalidad de reservas

### 2. **Probar el Sistema de Emails**
- ✅ Confirma una reserva como admin
- ✅ Verifica que se envíe el email automáticamente
- ✅ Revisa los logs en Supabase Edge Functions

### 3. **Verificar Integraciones**
- ✅ Supabase: Conexión a la base de datos
- ✅ Resend: Envío de emails
- ✅ Cloudinary: Subida de imágenes (si aplica)

## 🔍 Monitoreo

### **Logs de Vercel**
- Ve a **Functions** en el dashboard de Vercel
- Revisa los logs de construcción y ejecución

### **Logs de Supabase**
- Ve a **Edge Functions** en Supabase
- Revisa los logs de la función `resend-email`

### **Dashboard de Resend**
- Monitorea emails enviados
- Verifica tasas de entrega

## 🚨 Solución de Problemas

### **Error 500 en Variables de Entorno**
- Verifica que todas las variables estén configuradas en Vercel
- Asegúrate de que tengan el prefijo `VITE_`

### **Error de CORS**
- Agrega tu dominio de Vercel a los orígenes permitidos en Supabase
- Verifica la configuración de CORS en la edge function

### **Error de Build**
- Verifica que `pnpm` esté configurado correctamente
- Revisa los logs de construcción en Vercel

### **Emails no se envían**
- Verifica que la edge function esté desplegada
- Revisa los logs de Supabase Edge Functions
- Verifica la API key de Resend

## 🎯 Configuración de Dominio Personalizado

### 1. **Agregar Dominio**
1. Ve a **Settings > Domains** en Vercel
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de DNS

### 2. **Actualizar CORS**
Agrega tu dominio personalizado a los orígenes permitidos en Supabase.

### 3. **Actualizar Variables de Entorno**
Actualiza `VITE_APP_URL` con tu dominio personalizado.

## ✅ Checklist de Despliegue

- [ ] Variables de entorno configuradas en Vercel
- [ ] CORS configurado en Supabase
- [ ] Edge functions desplegadas
- [ ] Dominio de Resend verificado
- [ ] Repositorio conectado a Vercel
- [ ] Build exitoso
- [ ] Aplicación funcionando en producción
- [ ] Sistema de emails probado
- [ ] Dominio personalizado configurado (opcional)

---

**¡Tu aplicación estará lista para producción en Vercel!** 🚀 