/**
 * Script de configuración para la integración con Resend
 * Ejecutar: node scripts/setup-resend.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const RESEND_API_KEY = 're_BtA3bmsH_HCeHbsLGqwkmF4iy5dHyDg7t';
const ADMIN_EMAIL = 'admin@miweb.com';
const SUPABASE_URL = 'https://rwgxdtfuzpdukaguogyh.supabase.co';

console.log('🚀 Configurando integración con Resend...\n');

// 1. Verificar que existe el archivo .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
const envLocalExists = fs.existsSync(envLocalPath);

if (!envLocalExists) {
  console.log('📝 Creando archivo .env.local...');
  
  const envContent = `# Resend API Key
RESEND_API_KEY=${RESEND_API_KEY}

# Supabase Configuration
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzQsImV4cCI6MjA1MDU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8

# Admin Email Configuration
ADMIN_EMAIL=${ADMIN_EMAIL}
`;

  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Archivo .env.local creado exitosamente');
} else {
  console.log('✅ Archivo .env.local ya existe');
}

// 2. Verificar que existe la Edge Function
const edgeFunctionPath = path.join(process.cwd(), 'supabase', 'functions', 'send-reservation-emails');
const edgeFunctionExists = fs.existsSync(edgeFunctionPath);

if (!edgeFunctionExists) {
  console.log('❌ Edge Function no encontrada. Asegúrate de que existe:');
  console.log('   supabase/functions/send-reservation-emails/index.ts');
  console.log('\n📋 Pasos para crear la Edge Function:');
  console.log('   1. Crear directorio: mkdir -p supabase/functions/send-reservation-emails');
  console.log('   2. Crear archivo index.ts con el código proporcionado');
  console.log('   3. Desplegar: supabase functions deploy send-reservation-emails');
} else {
  console.log('✅ Edge Function encontrada');
}

// 3. Verificar dependencias
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.dependencies?.resend) {
  console.log('📦 Instalando dependencia de Resend...');
  console.log('   Ejecuta: pnpm add resend');
} else {
  console.log('✅ Dependencia de Resend instalada');
}

// 4. Verificar archivos del proyecto
const filesToCheck = [
  'services/supabase/sendReservationEmails.ts',
  'hooks/useReservationEmails.ts',
  'docs/RESEND_INTEGRATION.md'
];

console.log('\n📁 Verificando archivos del proyecto...');

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - No encontrado`);
  }
});

// 5. Instrucciones de configuración
console.log('\n🔧 Pasos de configuración requeridos:');
console.log('\n1. 📧 Configurar Resend:');
console.log('   - Ir a https://resend.com');
console.log('   - Verificar dominio coolbalu.com');
console.log('   - Configurar DNS records');
console.log('   - Usar noreply@coolbalu.com como remitente');

console.log('\n2. 🔑 Configurar Supabase Secrets:');
console.log('   - Ir a Supabase Dashboard > Settings > Edge Functions');
console.log('   - Agregar RESEND_API_KEY:', RESEND_API_KEY);
console.log('   - Agregar ADMIN_EMAIL:', ADMIN_EMAIL);

console.log('\n3. 🚀 Desplegar Edge Function:');
console.log('   cd supabase');
console.log('   supabase functions deploy send-reservation-emails');

console.log('\n4. 🧪 Probar la integración:');
console.log('   - Crear una reserva de prueba');
console.log('   - Verificar que se envían los correos');
console.log('   - Revisar logs en Supabase Dashboard');

// 6. Ejemplo de uso
console.log('\n💡 Ejemplo de uso en código:');
console.log(`
import { useReservationEmails } from '@/hooks/useReservationEmails';

function MyComponent() {
  const { sendEmailsForCurrentUser, isLoading } = useReservationEmails();

  const handleSendEmails = async (reservationId: string) => {
    const result = await sendEmailsForCurrentUser(reservationId);
    
    if (result.success) {
      console.log('✅ Correos enviados exitosamente');
    } else {
      console.error('❌ Error:', result.error);
    }
  };

  return (
    <button onClick={() => handleSendEmails('reservation-id')} disabled={isLoading}>
      {isLoading ? 'Enviando...' : 'Enviar Confirmación'}
    </button>
  );
}
`);

console.log('\n🎉 ¡Configuración completada!');
console.log('📚 Consulta docs/RESEND_INTEGRATION.md para más detalles'); 