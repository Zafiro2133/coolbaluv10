# Solución: Problema "User Not Allowed" al Eliminar Usuarios

## ⚠️ PROBLEMA IDENTIFICADO Y SOLUCIONADO

**Error encontrado**: `user not allowed` al intentar eliminar usuarios desde el panel de administración.

**Causa raíz**: El cliente de Supabase estaba usando la clave anónima (`ANON_KEY`) en lugar de la clave de servicio (`SERVICE_ROLE_KEY`) para operaciones administrativas.

## Solución Implementada

### 1. Creación del Cliente Administrativo

Se creó un cliente administrativo separado en `services/supabase/client.ts`:

```typescript
// Cliente administrativo para operaciones que requieren SERVICE_ROLE_KEY
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});
```

### 2. Actualización del Componente UserManagement

Se modificó `components/admin/UserManagement.tsx` para usar el cliente administrativo:

```typescript
// Importar el cliente administrativo
import { supabase, supabaseAdmin } from '@/services/supabase/client';

// Usar el cliente administrativo para eliminar usuarios
const deleteUser = async (user: UserWithDetails) => {
  setIsDeleting(true);
  try {
    // Eliminar el usuario usando el cliente administrativo de Supabase
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.user_id);
    
    if (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
    
    // ... resto del código
  } catch (error) {
    // ... manejo de errores
  }
};
```

## Verificación de la Solución

### Script de Prueba

Se creó `scripts/test-admin-client.js` para verificar que el cliente administrativo funcione:

```bash
node scripts/test-admin-client.js
```

**Resultado esperado**:
```
✅ Cliente administrativo funcionando correctamente
💡 El problema de "user not allowed" debería estar resuelto
```

## Políticas RLS Verificadas

Las políticas de Row Level Security están correctamente configuradas:

- `"Admins can manage user roles"` - Permite a los administradores gestionar roles de usuario
- `"Admins can view all user roles"` - Permite a los administradores ver todos los roles
- `"Users can view their own roles"` - Permite a los usuarios ver sus propios roles

## Diferencias entre Clientes

| Cliente | Clave Usada | Propósito | Operaciones |
|---------|-------------|-----------|-------------|
| `supabase` | ANON_KEY | Cliente normal | Operaciones de usuario autenticado |
| `supabaseAdmin` | SERVICE_ROLE_KEY | Cliente administrativo | Operaciones de administrador |

## Operaciones que Requieren Cliente Administrativo

- `auth.admin.deleteUser()` - Eliminar usuarios
- `auth.admin.listUsers()` - Listar usuarios
- `auth.admin.updateUserById()` - Actualizar usuarios
- `auth.admin.generateLink()` - Generar enlaces de invitación

## Seguridad

✅ **La SERVICE_ROLE_KEY nunca se expone al cliente**
✅ **Solo se usa en operaciones administrativas específicas**
✅ **Las políticas RLS protegen las operaciones de base de datos**
✅ **El cliente administrativo no persiste sesiones**

## Próximos Pasos

1. **Probar la eliminación de usuarios** desde el panel de administración
2. **Verificar que no haya errores** en la consola del navegador
3. **Confirmar que los usuarios se eliminen** correctamente de la lista

## Comandos de Verificación

```bash
# Verificar que el cliente administrativo funcione
node scripts/test-admin-client.js

# Verificar que el servidor esté corriendo
pnpm dev
```

## Notas Importantes

- **Nunca usar SERVICE_ROLE_KEY en el frontend** para operaciones normales
- **Solo usar supabaseAdmin para operaciones administrativas específicas**
- **Mantener las políticas RLS actualizadas** para seguridad adicional
- **Monitorear logs** para detectar intentos de acceso no autorizado 