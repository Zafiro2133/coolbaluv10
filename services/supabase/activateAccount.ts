import { supabase } from './client';
import { EmailService } from '../email/emailService';

export async function activateAccount(token: string) {
  try {
    // Buscar el token de activación
    const { data: tokenData, error: tokenError } = await supabase
      .from('activation_tokens')
      .select('*')
      .eq('token', token)
      .eq('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      return { error: { message: 'Token de activación inválido o expirado' } };
    }

    // Verificar si el token ha expirado
    if (new Date(tokenData.expires_at) < new Date()) {
      return { error: { message: 'Token de activación expirado' } };
    }

    // Obtener información del usuario
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(tokenData.user_id);
    
    if (userError || !userData.user) {
      return { error: { message: 'Usuario no encontrado' } };
    }

    // Marcar el token como usado
    const { error: updateError } = await supabase
      .from('activation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Error updating token:', updateError);
    }

    // Actualizar el estado del usuario en profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', tokenData.user_id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Enviar email de bienvenida
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', tokenData.user_id)
        .single();

      if (profileData) {
        const fullName = `${profileData.first_name} ${profileData.last_name}`;
        await EmailService.sendWelcomeEmail(userData.user.email!, fullName);
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // No fallamos la activación si el email falla
    }

    return { success: true, user: userData.user };
  } catch (error) {
    console.error('Error activating account:', error);
    return { error: { message: 'Error interno del servidor' } };
  }
}

export async function resendActivationEmail(email: string) {
  try {
    // Buscar el usuario por email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      return { error: { message: 'Error al buscar usuario' } };
    }

    const user = userData.users.find(u => u.email === email);
    if (!user) {
      return { error: { message: 'Usuario no encontrado' } };
    }

    // Verificar si ya está activado
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email_verified, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    if (profileData?.email_verified) {
      return { error: { message: 'La cuenta ya está activada' } };
    }

    // Generar nuevo token de activación
    const { v4: uuidv4 } = await import('uuid');
    const activationToken = uuidv4();

    // Eliminar tokens anteriores del usuario
    await supabase
      .from('activation_tokens')
      .delete()
      .eq('user_id', user.id);

    // Guardar nuevo token
    const { error: tokenError } = await supabase
      .from('activation_tokens')
      .insert({
        user_id: user.id,
        token: activationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      });

    if (tokenError) {
      return { error: { message: 'Error al generar token de activación' } };
    }

    // Enviar email de activación
    const fullName = `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim();
    const success = await EmailService.sendAccountActivationEmail(email, fullName || 'Usuario', activationToken);

    if (success) {
      return { success: true };
    } else {
      return { error: { message: 'Error al enviar email de activación' } };
    }
  } catch (error) {
    console.error('Error resending activation email:', error);
    return { error: { message: 'Error interno del servidor' } };
  }
} 