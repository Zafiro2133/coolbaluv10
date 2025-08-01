# 🔧 Guía de Configuración CORS en Supabase

## 📋 Pasos Detallados

### 1. **Acceder al Dashboard de Supabase**

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: **Coolbalu Entretenimientos**

### 2. **Navegar a la Configuración de API**

1. En el menú lateral izquierdo, haz clic en **"Settings"**
2. Luego haz clic en **"API"**
3. Desplázate hacia abajo hasta encontrar la sección **"CORS (Cross-Origin Resource Sharing)"**

### 3. **Configurar Orígenes Permitidos**

En la sección CORS, agrega los siguientes orígenes uno por uno:

#### **Para Desarrollo Local:**
```
http://localhost:3000
http://localhost:3001
http://127.0.0.1:3000
http://127.0.0.1:3001
```

#### **Para Producción (Vercel):**
```
https://tu-proyecto.vercel.app
https://*.vercel.app
```

#### **Para Dominio Personalizado:**
```
https://estudiomaters.com
https://www.estudiomaters.com
```

### 4. **Guardar la Configuración**

1. Después de agregar todos los orígenes, haz clic en **"Save"**
2. Espera a que se confirme que los cambios se guardaron
3. Verifica que todos los orígenes aparezcan en la lista

## 🔍 Verificación de la Configuración

### **Probar CORS Localmente:**

1. Inicia tu aplicación de desarrollo:
   ```bash
   pnpm dev
   ```

2. Abre la consola del navegador (F12)
3. Verifica que no haya errores de CORS
4. Intenta hacer una petición a Supabase

### **Probar CORS en Producción:**

1. Despliega tu aplicación en Vercel
2. Navega a tu URL de Vercel
3. Verifica que la aplicación funcione correctamente
4. Prueba la funcionalidad de reservas

## 🚨 Solución de Problemas

### **Error: "CORS policy: No 'Access-Control-Allow-Origin' header"**

**Solución:**
1. Verifica que el origen esté agregado correctamente en Supabase
2. Asegúrate de que no haya espacios extra en los orígenes
3. Verifica que el protocolo (http/https) sea correcto
4. Espera unos minutos para que los cambios se propaguen

### **Error: "CORS policy: The request client is not a secure context"**

**Solución:**
1. Asegúrate de usar `https://` para orígenes de producción
2. Verifica que tu dominio esté configurado correctamente
3. Si estás en desarrollo local, usa `http://localhost:3000`

### **Error: "CORS policy: Multiple CORS error"**

**Solución:**
1. Limpia la caché del navegador
2. Verifica que no haya orígenes duplicados
3. Reinicia tu servidor de desarrollo

## 📋 Checklist de Configuración

- [ ] Accedí al dashboard de Supabase
- [ ] Navegué a Settings > API
- [ ] Encontré la sección CORS
- [ ] Agregué todos los orígenes de desarrollo
- [ ] Agregué todos los orígenes de producción
- [ ] Agregué dominios personalizados (si aplica)
- [ ] Guardé la configuración
- [ ] Verifiqué que los cambios se aplicaron
- [ ] Probé la aplicación localmente
- [ ] Probé la aplicación en producción

## 🔧 Configuración Avanzada

### **Wildcards en CORS:**

Puedes usar wildcards para permitir subdominios:
```
https://*.vercel.app
https://*.estudiomaters.com
```

### **Configuración por Entorno:**

Puedes configurar diferentes orígenes para diferentes entornos:

**Desarrollo:**
```
http://localhost:3000
http://localhost:3001
```

**Staging:**
```
https://staging-tu-proyecto.vercel.app
```

**Producción:**
```
https://tu-proyecto.vercel.app
https://estudiomaters.com
```

## 📚 Recursos Adicionales

- [Documentación oficial de CORS en Supabase](https://supabase.com/docs/guides/api/api-overview#cors)
- [Guía de CORS de MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Dashboard de Supabase](https://supabase.com/dashboard/project/rwgxdtfuzpdukaguogyh)

## 🎯 Próximos Pasos

Después de configurar CORS:

1. **Desplegar en Vercel** siguiendo la guía de despliegue
2. **Actualizar orígenes** con tu dominio real de Vercel
3. **Probar todas las funcionalidades** en producción
4. **Configurar dominio personalizado** (opcional)

---

**¡La configuración de CORS está completa!** 🎉 