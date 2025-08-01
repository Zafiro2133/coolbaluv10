import { supabase } from '@/services/supabase/client';

interface RegisterUserParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function registerUser({ email, password, firstName, lastName }: RegisterUserParams) {
  // Paso 1: Crear usuario en auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: signUpError };
  }

  const userId = signUpData?.user?.id;
  if (!userId) {
    return { error: { message: 'No se pudo obtener el ID del usuario' } };
  }

  // Paso 2: Insertar datos adicionales en la tabla 'profiles'
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
    });

  if (profileError) {
    return { error: profileError };
  }

  // Paso 3: Asignar rol de cliente por defecto
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: 'customer',
    });

  if (roleError) {
    console.warn('Error al asignar rol de cliente:', roleError);
    // No retornamos error aquí porque el usuario ya se creó correctamente
    // El trigger handle_new_user debería haber manejado esto automáticamente
  }

  return { success: true };
} 