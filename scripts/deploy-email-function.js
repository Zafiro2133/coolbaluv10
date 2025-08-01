const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Desplegando edge function de email...');

try {
  // Navegar al directorio del proyecto
  const projectDir = path.resolve(__dirname, '..');
  process.chdir(projectDir);

  // Desplegar la función resend-email
  console.log('📧 Desplegando función resend-email...');
  execSync('npx supabase functions deploy resend-email', { 
    stdio: 'inherit',
    cwd: projectDir
  });

  console.log('✅ Edge function desplegada exitosamente!');
  console.log('🌐 URL de la función: https://rwgxdtfuzpdukaguogyh.supabase.co/functions/v1/resend-email');
  
} catch (error) {
  console.error('❌ Error al desplegar la edge function:', error.message);
  process.exit(1);
} 