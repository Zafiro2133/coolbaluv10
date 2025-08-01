import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY no está configurado en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseEmailSystem() {
  console.log('🔍 Diagnóstico del Sistema de Email\n');

  try {
    // 1. Verificar configuración de email
    console.log('1. Verificando configuración de email...');
    const { data: emailConfig, error: configError } = await supabase
      .from('email_config')
      .select('*');

    if (configError) {
      console.error('❌ Error al obtener configuración de email:', configError);
    } else if (!emailConfig || emailConfig.length === 0) {
      console.error('❌ No se encontró configuración de email');
    } else {
      console.log('✅ Configuración de email encontrada:');
      emailConfig.forEach(config => {
        console.log(`   - ${config.config_key}: ${config.config_value}`);
      });
    }

    // 2. Verificar plantillas de email
    console.log('\n2. Verificando plantillas de email...');
    const { data: emailTemplates, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true);

    if (templateError) {
      console.error('❌ Error al obtener plantillas de email:', templateError);
    } else if (!emailTemplates || emailTemplates.length === 0) {
      console.error('❌ No se encontraron plantillas de email activas');
    } else {
      console.log('✅ Plantillas de email encontradas:');
      emailTemplates.forEach(template => {
        console.log(`   - ${template.template_key}: ${template.template_name}`);
      });
    }

    // 3. Verificar logs de email recientes
    console.log('\n3. Verificando logs de email recientes...');
    const { data: emailLogs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('❌ Error al obtener logs de email:', logsError);
    } else if (!emailLogs || emailLogs.length === 0) {
      console.log('ℹ️ No se encontraron logs de email recientes');
    } else {
      console.log('✅ Logs de email encontrados:');
      emailLogs.forEach(log => {
        console.log(`   - ${log.email_type} -> ${log.recipient_email} (${log.status})`);
        if (log.error_message) {
          console.log(`     Error: ${log.error_message}`);
        }
      });
    }

    // 4. Verificar función get_user_email
    console.log('\n4. Verificando función get_user_email...');
    try {
      const { data: testUserEmail, error: userEmailError } = await supabase.rpc('get_user_email', {
        user_id_param: 'test-user-id'
      });

      if (userEmailError) {
        console.error('❌ Error al probar función get_user_email:', userEmailError);
      } else {
        console.log('✅ Función get_user_email funciona correctamente');
      }
    } catch (error) {
      console.error('❌ Error al probar función get_user_email:', error.message);
    }

    // 5. Verificar función log_email_sent
    console.log('\n5. Verificando función log_email_sent...');
    try {
      const { data: testLogId, error: logError } = await supabase.rpc('log_email_sent', {
        email_type_param: 'reservation_confirmation',
        recipient_email_param: 'test@example.com',
        recipient_name_param: 'Test User',
        subject_param: 'Test Subject',
        content_param: 'Test Content',
        metadata_param: { test: true },
        related_reservation_id_param: null,
        related_contact_message_id_param: null
      });

      if (logError) {
        console.error('❌ Error al probar función log_email_sent:', logError);
      } else {
        console.log('✅ Función log_email_sent funciona correctamente');
        console.log(`   Log ID generado: ${testLogId}`);
      }
    } catch (error) {
      console.error('❌ Error al probar función log_email_sent:', error.message);
    }

    // 6. Verificar API key de Resend
    console.log('\n6. Verificando API key de Resend...');
    const resendApiKey = process.env.RESEND_API_KEY || 're_joWXR676_MZuHU9v6sMYBdZBMXB129XrF';
    
    if (!resendApiKey || resendApiKey === 'your-resend-api-key') {
      console.error('❌ API key de Resend no está configurada correctamente');
    } else {
      console.log('✅ API key de Resend encontrada');
      
      // Probar la API de Resend
      try {
        const response = await fetch('https://api.resend.com/domains', {
          headers: {
            'Authorization': `Bearer ${resendApiKey}`
          }
        });

        if (response.ok) {
          console.log('✅ API de Resend responde correctamente');
        } else {
          console.error('❌ Error en API de Resend:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Error al conectar con API de Resend:', error.message);
      }
    }

    // 7. Verificar reservas recientes
    console.log('\n7. Verificando reservas recientes...');
    const { data: recentReservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id, user_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (reservationsError) {
      console.error('❌ Error al obtener reservas:', reservationsError);
    } else if (!recentReservations || recentReservations.length === 0) {
      console.log('ℹ️ No se encontraron reservas recientes');
    } else {
      console.log('✅ Reservas recientes encontradas:');
      recentReservations.forEach(reservation => {
        console.log(`   - ID: ${reservation.id}, Status: ${reservation.status}, User: ${reservation.user_id}`);
      });
    }

    console.log('\n📋 Resumen del diagnóstico:');
    console.log('Para que los emails funcionen correctamente, asegúrate de:');
    console.log('1. Tener configuración de email en la tabla email_config');
    console.log('2. Tener plantillas de email activas en email_templates');
    console.log('3. Tener una API key válida de Resend');
    console.log('4. Que las funciones RPC estén creadas correctamente');
    console.log('5. Que las políticas RLS permitan acceso a los admins');

  } catch (error) {
    console.error('❌ Error general en el diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnoseEmailSystem().then(() => {
  console.log('\n✅ Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 