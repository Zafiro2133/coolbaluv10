# Implementación: Asignación Automática de Rol de Cliente

## Resumen
Se ha implementado un sistema para asegurar que todos los usuarios se registren por defecto con el rol de "cliente" (customer).

## Cambios Realizados

### 1. Migración de Base de Datos
**Archivo:** `supabase/migrations/20250131000005-update-handle-new-user-function.sql`

Se actualizó la función `handle_new_user()` para que automáticamente asigne el rol de "customer" a todos los usuarios nuevos cuando se registran.

### 2. Servicio de Registro
**Archivo:** `services/supabase/registerUser.ts`

Se agregó un paso adicional para asignar el rol de "customer" después de crear el perfil del usuario.

### 3. Contexto de Autenticación
**Archivo:** `contexts/AuthContext.tsx`

Se actualizó el `AuthProvider` para:
- Verificar y asignar el rol de "customer" cuando se crea un perfil automáticamente
- Asignar el rol de "customer" durante el proceso de registro

### 4. Hook de Rol de Usuario
**Archivo:** `hooks/useUserRole.ts`

Se creó un hook personalizado que:
- Obtiene el rol del usuario actual
- Asigna automáticamente el rol de "customer" si no existe
- Proporciona helpers para verificar si el usuario es admin o customer

### 5. Script de Migración
**Archivo:** `scripts/assign-customer-role-to-existing-users.sql`

Script SQL para asignar el rol de "customer" a todos los usuarios existentes que no lo tengan.

## Instrucciones de Implementación

### Paso 1: Ejecutar la Migración
Ejecuta la siguiente migración en tu proyecto de Supabase:

```sql
-- Update handle_new_user function to also assign customer role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Assign customer role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Paso 2: Asignar Roles a Usuarios Existentes
Ejecuta el script `scripts/assign-customer-role-to-existing-users.sql` en Supabase para asignar el rol de "customer" a todos los usuarios existentes.

### Paso 3: Verificar la Implementación
1. Registra un nuevo usuario
2. Verifica que se cree automáticamente el registro en `user_roles` con rol "customer"
3. Usa el hook `useUserRole()` en componentes que necesiten verificar el rol

## Uso del Hook useUserRole

```tsx
import { useUserRole } from '@/hooks/useUserRole';

const MyComponent = () => {
  const { role, loading, isAdmin, isCustomer } = useUserRole();

  if (loading) return <div>Cargando...</div>;

  if (isAdmin) {
    return <div>Panel de Administrador</div>;
  }

  if (isCustomer) {
    return <div>Panel de Cliente</div>;
  }

  return <div>Sin rol asignado</div>;
};
```

## Beneficios

1. **Consistencia**: Todos los usuarios nuevos tendrán automáticamente el rol de "customer"
2. **Seguridad**: Los usuarios sin rol no pueden acceder a funcionalidades restringidas
3. **Automatización**: No es necesario asignar manualmente roles a cada usuario
4. **Compatibilidad**: Los usuarios existentes mantienen sus roles actuales

## Notas Importantes

- Los usuarios administradores existentes mantendrán su rol de "admin"
- El sistema es retrocompatible con usuarios existentes
- Si un usuario no tiene rol asignado, se le asignará automáticamente "customer"
- El hook `useUserRole()` maneja automáticamente la asignación de roles faltantes 