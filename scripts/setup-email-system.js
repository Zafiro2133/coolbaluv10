#!/usr/bin/env node

/**
 * Script para configurar el sistema de emails en Supabase
 * Ejecuta la migración y configura las tablas necesarias
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupEmailSystem() {
  console.log('🚀 Configurando sistema de emails...\n');

  try {
    // 1. Crear tabla email_logs
    console.log('📧 Creando tabla email_logs...');
    const { error: emailLogsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create email_logs table
        CREATE TABLE IF NOT EXISTS email_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          email_type VARCHAR(50) NOT NULL,
          recipient_email VARCHAR(255) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
          sent_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
        CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
        CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

        -- Enable RLS
        ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

        -- RLS Policies
        -- Admins can view all email logs
        DROP POLICY IF EXISTS "Admins can view all email logs" ON email_logs;
        CREATE POLICY "Admins can view all email logs" ON email_logs
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM user_profiles 
              WHERE user_profiles.user_id = auth.uid() 
              AND user_profiles.role = 'admin'
            )
          );

        -- Users can view their own email logs
        DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
        CREATE POLICY "Users can view their own email logs" ON email_logs
          FOR SELECT USING (user_id = auth.uid());

        -- Service role can insert email logs
        DROP POLICY IF EXISTS "Service role can insert email logs" ON email_logs;
        CREATE POLICY "Service role can insert email logs" ON email_logs
          FOR INSERT WITH CHECK (true);

        -- Service role can update email logs
        DROP POLICY IF EXISTS "Service role can update email logs" ON email_logs;
        CREATE POLICY "Service role can update email logs" ON email_logs
          FOR UPDATE USING (true);
      `
    });

    if (emailLogsError) {
      console.error('❌ Error creando tabla email_logs:', emailLogsError);
    } else {
      console.log('✅ Tabla email_logs creada exitosamente');
    }

    // 2. Crear tabla activation_tokens
    console.log('\n🔑 Creando tabla activation_tokens...');
    const { error: activationTokensError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create activation_tokens table
        CREATE TABLE IF NOT EXISTS activation_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_activation_tokens_user_id ON activation_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_activation_tokens_token ON activation_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_activation_tokens_expires_at ON activation_tokens(expires_at);

        -- Enable RLS
        ALTER TABLE activation_tokens ENABLE ROW LEVEL SECURITY;

        -- RLS Policies
        -- Users can view their own activation tokens
        DROP POLICY IF EXISTS "Users can view their own activation tokens" ON activation_tokens;
        CREATE POLICY "Users can view their own activation tokens" ON activation_tokens
          FOR SELECT USING (user_id = auth.uid());

        -- Service role can insert activation tokens
        DROP POLICY IF EXISTS "Service role can insert activation tokens" ON activation_tokens;
        CREATE POLICY "Service role can insert activation tokens" ON activation_tokens
          FOR INSERT WITH CHECK (true);

        -- Service role can update activation tokens
        DROP POLICY IF EXISTS "Service role can update activation tokens" ON activation_tokens;
        CREATE POLICY "Service role can update activation tokens" ON activation_tokens
          FOR UPDATE USING (true);

        -- Function to clean up expired tokens
        CREATE OR REPLACE FUNCTION cleanup_expired_activation_tokens()
        RETURNS void AS $$
        BEGIN
          DELETE FROM activation_tokens 
          WHERE expires_at < NOW() AND used_at IS NULL;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (activationTokensError) {
      console.error('❌ Error creando tabla activation_tokens:', activationTokensError);
    } else {
      console.log('✅ Tabla activation_tokens creada exitosamente');
    }

    // 3. Agregar columna email_verified a profiles si no existe
    console.log('\n👤 Verificando columna email_verified en profiles...');
    const { error: profileError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add email_verified column if it doesn't exist
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'email_verified'
          ) THEN
            ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
          END IF;
        END $$;
      `
    });

    if (profileError) {
      console.error('❌ Error verificando columna email_verified:', profileError);
    } else {
      console.log('✅ Columna email_verified verificada');
    }

    // 4. Verificar configuración de Resend
    console.log('\n📧 Verificando configuración de Resend...');
         const resendApiKey = process.env.VITE_RESEND_API_KEY;
     const resendFromEmail = process.env.VITE_RESEND_FROM_EMAIL;
     const resendFromName = process.env.VITE_APP_NAME;

         if (!resendApiKey) {
       console.warn('⚠️  VITE_RESEND_API_KEY no está configurado');
     } else {
       console.log('✅ VITE_RESEND_API_KEY configurado');
     }

     if (!resendFromEmail) {
       console.warn('⚠️  VITE_RESEND_FROM_EMAIL no está configurado');
     } else {
       console.log('✅ VITE_RESEND_FROM_EMAIL configurado:', resendFromEmail);
     }

     if (!resendFromName) {
       console.warn('⚠️  VITE_APP_NAME no está configurado');
     } else {
       console.log('✅ VITE_APP_NAME configurado:', resendFromName);
     }

    console.log('\n🎉 ¡Sistema de emails configurado exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Asegúrate de que las variables de entorno de Resend estén configuradas');
    console.log('2. Verifica que el dominio de envío esté verificado en Resend');
    console.log('3. Prueba el sistema enviando un email de prueba');
    console.log('4. Configura los datos bancarios en el servicio de reservas');

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

setupEmailSystem(); 