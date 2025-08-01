const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Preparando despliegue en Vercel...\n');

try {
  // Navegar al directorio del proyecto
  const projectDir = path.resolve(__dirname, '..');
  process.chdir(projectDir);

  // 1. Verificar que estamos en el directorio correcto
  console.log('1️⃣ Verificando directorio del proyecto...');
  const packageJson = require('../package.json');
  console.log(`✅ Proyecto: ${packageJson.name}`);

  // 2. Verificar que pnpm esté instalado
  console.log('\n2️⃣ Verificando pnpm...');
  try {
    execSync('pnpm --version', { stdio: 'pipe' });
    console.log('✅ pnpm está instalado');
  } catch (error) {
    console.error('❌ pnpm no está instalado. Instalando...');
    execSync('npm install -g pnpm', { stdio: 'inherit' });
  }

  // 3. Instalar dependencias
  console.log('\n3️⃣ Instalando dependencias...');
  execSync('pnpm install', { stdio: 'inherit' });

  // 4. Verificar build local
  console.log('\n4️⃣ Verificando build local...');
  execSync('pnpm build', { stdio: 'inherit' });
  console.log('✅ Build exitoso');

  // 5. Verificar que Vercel CLI esté instalado
  console.log('\n5️⃣ Verificando Vercel CLI...');
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI está instalado');
  } catch (error) {
    console.log('📦 Instalando Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }

  // 6. Verificar configuración
  console.log('\n6️⃣ Verificando configuración...');
  
  // Verificar archivo vercel.json
  const fs = require('fs');
  if (!fs.existsSync('vercel.json')) {
    console.error('❌ Archivo vercel.json no encontrado');
    process.exit(1);
  }
  console.log('✅ vercel.json encontrado');

  // Verificar variables de entorno
  const envExample = fs.readFileSync('env.example', 'utf8');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_RESEND_API_KEY'
  ];

  console.log('\n📋 Variables de entorno requeridas:');
  requiredVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });

  console.log('\n⚠️  IMPORTANTE: Asegúrate de configurar estas variables en Vercel:');
  console.log('   1. Ve a tu proyecto en Vercel');
  console.log('   2. Settings > Environment Variables');
  console.log('   3. Agrega todas las variables listadas arriba');

  // 7. Instrucciones de despliegue
  console.log('\n🚀 Pasos para desplegar:');
  console.log('   1. Ve a https://vercel.com');
  console.log('   2. Crea una nueva cuenta o inicia sesión');
  console.log('   3. Haz clic en "New Project"');
  console.log('   4. Importa tu repositorio de GitHub');
  console.log('   5. Configura las variables de entorno');
  console.log('   6. Haz clic en "Deploy"');

  // 8. Verificar configuración de Supabase
  console.log('\n🔧 Configuración adicional requerida:');
  console.log('   - Agrega tu dominio de Vercel a CORS en Supabase');
  console.log('   - Verifica que las edge functions estén desplegadas');
  console.log('   - Confirma que el dominio de Resend esté verificado');

  console.log('\n✅ Preparación completada!');
  console.log('\n📚 Consulta VERCEL_DEPLOYMENT_GUIDE.md para instrucciones detalladas');

} catch (error) {
  console.error('❌ Error durante la preparación:', error.message);
  console.log('\n🔧 Posibles soluciones:');
  console.log('1. Verifica que estés en el directorio correcto del proyecto');
  console.log('2. Asegúrate de que Node.js esté instalado');
  console.log('3. Verifica que tengas permisos de escritura');
  process.exit(1);
} 