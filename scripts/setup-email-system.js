#!/usr/bin/env node

/**
 * Script para configurar el sistema de emails en Supabase
 * Ejecuta la migración y configura las tablas necesarias
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const SUPABASE_URL = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM3MTI5MSwiZXhwIjoyMDY4OTQ3MjkxfQ.yGa3Q8T9y9e6SdE08jH1_2SqhYmk1q18Tm_16izohno';

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupEmailSystem() {
  console.log('🚀 Configurando sistema de emails en Supabase...\n');

  try {
    // 1. Leer el archivo de migración de contact_messages
    const contactMigrationPath = path.join(__dirname, '../supabase/migrations/20250131000004-create-contact-messages-if-not-exists.sql');
    
    if (!fs.existsSync(contactMigrationPath)) {
      console.error('❌ No se encontró el archivo de migración de contact_messages:', contactMigrationPath);
      process.exit(1);
    }

    const contactMigrationSQL = fs.readFileSync(contactMigrationPath, 'utf8');
    console.log('📄 Archivo de migración de contact_messages leído correctamente');

    // 2. Ejecutar la migración de contact_messages
    console.log('⚡ Ejecutando migración de contact_messages...');
    const { error: contactError } = await supabase.rpc('exec_sql', { sql: contactMigrationSQL });

    if (contactError) {
      console.error('❌ Error al ejecutar la migración de contact_messages:', contactError);
      process.exit(1);
    }

    console.log('✅ Migración de contact_messages ejecutada correctamente');

    // 3. Leer el archivo de migración del sistema de emails
    const emailMigrationPath = path.join(__dirname, '../supabase/migrations/20250131000003-create-email-system.sql');
    
    if (!fs.existsSync(emailMigrationPath)) {
      console.error('❌ No se encontró el archivo de migración del sistema de emails:', emailMigrationPath);
      process.exit(1);
    }

    const emailMigrationSQL = fs.readFileSync(emailMigrationPath, 'utf8');
    console.log('📄 Archivo de migración del sistema de emails leído correctamente');

    // 4. Ejecutar la migración del sistema de emails
    console.log('⚡ Ejecutando migración del sistema de emails...');
    const { error } = await supabase.rpc('exec_sql', { sql: emailMigrationSQL });

    if (error) {
      console.error('❌ Error al ejecutar la migración:', error);
      process.exit(1);
    }

    console.log('✅ Migración ejecutada correctamente');

    // 5. Verificar que las tablas se crearon
    console.log('🔍 Verificando tablas creadas...');
    
    const tablesToCheck = ['contact_messages', 'email_logs', 'email_templates', 'email_config'];
    
    for (const tableName of tablesToCheck) {
      const { data, error } = await supabase
        .from(tableName)
        .select('count(*)')
        .limit(1);

      if (error) {
        console.error(`❌ Error al verificar tabla ${tableName}:`, error);
      } else {
        console.log(`✅ Tabla ${tableName} creada correctamente`);
      }
    }

    // 4. Verificar plantillas de email
    console.log('📧 Verificando plantillas de email...');
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('template_key, template_name');

    if (templatesError) {
      console.error('❌ Error al verificar plantillas:', templatesError);
    } else {
      console.log('✅ Plantillas de email configuradas:');
      templates.forEach(template => {
        console.log(`   - ${template.template_key}: ${template.template_name}`);
      });
    }

    // 5. Verificar configuración de email
    console.log('⚙️ Verificando configuración de email...');
    const { data: config, error: configError } = await supabase
      .from('email_config')
      .select('config_key, config_value');

    if (configError) {
      console.error('❌ Error al verificar configuración:', configError);
    } else {
      console.log('✅ Configuración de email configurada:');
      config.forEach(item => {
        console.log(`   - ${item.config_key}: ${item.config_value}`);
      });
    }

    console.log('\n🎉 Sistema de emails configurado exitosamente!');
    console.log('\n📋 Resumen de lo que se configuró:');
    console.log('   ✅ Tabla email_logs - Para registrar emails enviados');
    console.log('   ✅ Tabla email_templates - Para plantillas de email');
    console.log('   ✅ Tabla email_config - Para configuración del sistema');
    console.log('   ✅ Políticas RLS - Para seguridad de datos');
    console.log('   ✅ Funciones helper - Para facilitar el uso');
    console.log('   ✅ Plantillas por defecto - Confirmación de reserva, contacto, etc.');
    console.log('   ✅ Configuración por defecto - Remitente, reintentos, etc.');

    console.log('\n🔧 Próximos pasos:');
    console.log('   1. Verificar que las políticas RLS estén funcionando');
    console.log('   2. Probar el envío de emails desde la aplicación');
    console.log('   3. Revisar los logs en el panel de administración');

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  setupEmailSystem()
    .then(() => {
      console.log('\n✨ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { setupEmailSystem }; 