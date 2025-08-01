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

async function updateSupabaseUrls() {
  console.log('🔧 Configuración de URLs para Supabase Dashboard\n');

  try {
    // URLs para desarrollo local
    const localUrls = {
      siteUrl: 'http://localhost:3000',
      redirectUrls: [
        'http://localhost:3000/confirm-email',
        'http://localhost:3000/',
        'http://localhost:3000/auth'
      ]
    };

    // URLs para producción (Vercel)
    const productionUrls = {
      siteUrl: 'https://coolbaluv10.vercel.app',
      redirectUrls: [
        'https://coolbaluv10.vercel.app/confirm-email',
        'https://coolbaluv10.vercel.app/',
        'https://coolbaluv10.vercel.app/auth'
      ]
    };

    console.log('📋 URLs para configurar en Supabase Dashboard:\n');

    console.log('🌐 DESARROLLO LOCAL:');
    console.log('   Site URL: http://localhost:3000');
    console.log('   Redirect URLs:');
    localUrls.redirectUrls.forEach(url => {
      console.log(`     - ${url}`);
    });

    console.log('\n🚀 PRODUCCIÓN (Vercel):');
    console.log('   Site URL: https://coolbaluv10.vercel.app');
    console.log('   Redirect URLs:');
    productionUrls.redirectUrls.forEach(url => {
      console.log(`     - ${url}`);
    });

    console.log('\n🔧 Pasos para configurar:');
    console.log('1. Ve a: https://rwgxdtfuzpdukaguogyh.supabase.co');
    console.log('2. Ve a Authentication > URL Configuration');
    console.log('3. En "Site URL" configura: http://localhost:3000 (para desarrollo)');
    console.log('4. En "Redirect URLs" agrega TODAS las URLs listadas arriba');
    console.log('5. Guarda los cambios');

    console.log('\n💡 Recomendación:');
    console.log('   - Para desarrollo: usa http://localhost:3000 como Site URL');
    console.log('   - Para producción: usa https://coolbaluv10.vercel.app como Site URL');
    console.log('   - Agrega TODAS las Redirect URLs de ambos entornos');

    console.log('\n🧪 Para probar:');
    console.log('   - Desarrollo: pnpm dev → http://localhost:3000');
    console.log('   - Producción: https://coolbaluv10.vercel.app');
    console.log('   - Ambos deberían funcionar con la confirmación de email');

    // Verificar configuración actual
    console.log('\n🔍 Verificando configuración actual...');
    const { data: authConfig, error: configError } = await supabase.auth.getSession();
    
    if (configError) {
      console.error('❌ Error al verificar configuración:', configError);
    } else {
      console.log('✅ Conexión con Supabase establecida correctamente');
      console.log('💡 La configuración de URLs debe hacerse manualmente en el Dashboard');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar configuración
updateSupabaseUrls().then(() => {
  console.log('\n✅ Configuración mostrada');
  console.log('🔧 Recuerda configurar las URLs en Supabase Dashboard');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 