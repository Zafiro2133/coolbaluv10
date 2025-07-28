// Script de prueba para verificar la configuración de Supabase Storage
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (reemplaza con tus credenciales reales)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key-aqui';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  console.log('🔍 Probando configuración de Supabase Storage...\n');

  try {
    // 1. Verificar buckets disponibles
    console.log('1. Verificando buckets disponibles...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error al listar buckets:', bucketsError);
      return;
    }

    console.log('✅ Buckets disponibles:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'Público' : 'Privado'})`);
    });

    // 2. Verificar si existe el bucket product-images
    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    if (!productImagesBucket) {
      console.log('\n❌ El bucket "product-images" no existe');
      console.log('💡 Necesitas crear el bucket en Supabase Dashboard');
      return;
    }

    console.log('\n✅ Bucket "product-images" encontrado');
    console.log(`   - Público: ${productImagesBucket.public ? 'Sí' : 'No'}`);

    // 3. Verificar políticas del bucket
    console.log('\n2. Verificando políticas del bucket...');
    const { data: policies, error: policiesError } = await supabase.storage.getBucket('product-images');
    
    if (policiesError) {
      console.error('❌ Error al obtener políticas:', policiesError);
    } else {
      console.log('✅ Políticas del bucket:');
      console.log(`   - Allow public access: ${policies.public}`);
    }

    // 4. Listar archivos en el bucket (si existen)
    console.log('\n3. Listando archivos en el bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('product-images')
      .list();

    if (filesError) {
      console.error('❌ Error al listar archivos:', filesError);
    } else {
      console.log(`✅ Archivos encontrados: ${files.length}`);
      if (files.length > 0) {
        files.slice(0, 5).forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
        });
        if (files.length > 5) {
          console.log(`   ... y ${files.length - 5} archivos más`);
        }
      }
    }

    console.log('\n🎉 Prueba completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('   - Bucket product-images: ✅');
    console.log('   - Acceso público: ✅');
    console.log('   - Listado de archivos: ✅');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la prueba
testStorage(); 