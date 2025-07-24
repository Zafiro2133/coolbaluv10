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

  return { success: true };
} 