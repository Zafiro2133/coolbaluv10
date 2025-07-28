// Script para probar la carga de imágenes y diagnosticar problemas
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key-aqui';

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para crear un archivo de prueba
function createTestImage() {
  // Crear un archivo de imagen de prueba simple (1x1 pixel PNG)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  const testImagePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(testImagePath, pngHeader);
  return testImagePath;
}

async function testImageUpload() {
  console.log('🧪 Probando carga de imágenes...\n');

  try {
    // 1. Verificar bucket
    console.log('1. Verificando bucket product-images...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error al listar buckets:', bucketsError);
      return;
    }

    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    if (!productImagesBucket) {
      console.error('❌ El bucket "product-images" no existe');
      return;
    }

    console.log('✅ Bucket product-images encontrado');
    console.log(`   - Público: ${productImagesBucket.public ? 'Sí' : 'No'}`);

    // 2. Crear archivo de prueba
    console.log('\n2. Creando archivo de prueba...');
    const testImagePath = createTestImage();
    const testImageBuffer = fs.readFileSync(testImagePath);
    
    console.log('✅ Archivo de prueba creado:', testImagePath);
    console.log(`   - Tamaño: ${testImageBuffer.length} bytes`);

    // 3. Crear un Blob/File para simular el input de archivo
    const testFile = new Blob([testImageBuffer], { type: 'image/png' });
    const fileName = `test-${Date.now()}.png`;
    
    console.log('\n3. Probando carga de archivo...');
    console.log(`   - Nombre: ${fileName}`);
    console.log(`   - Tipo MIME: ${testFile.type}`);
    console.log(`   - Tamaño: ${testFile.size} bytes`);

    // 4. Intentar subir el archivo
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(`test/${fileName}`, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error al subir archivo:', error);
      console.log('\n🔍 Información de diagnóstico:');
      console.log(`   - Código de error: ${error.statusCode}`);
      console.log(`   - Mensaje: ${error.message}`);
      console.log(`   - Detalles: ${error.details}`);
      console.log(`   - Sugerencia: ${error.suggestion}`);
    } else {
      console.log('✅ Archivo subido exitosamente!');
      console.log(`   - Path: ${data.path}`);
      
      // 5. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);
      
      console.log(`   - URL pública: ${urlData.publicUrl}`);
    }

    // 6. Limpiar archivo de prueba
    fs.unlinkSync(testImagePath);
    console.log('\n🧹 Archivo de prueba eliminado');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Función para probar diferentes tipos de archivos
async function testFileTypes() {
  console.log('\n📋 Probando diferentes tipos de archivos...\n');

  const testFiles = [
    { name: 'test.json', content: '{"test": true}', type: 'application/json' },
    { name: 'test.txt', content: 'Hello World', type: 'text/plain' },
    { name: 'test.png', content: 'fake-png-content', type: 'image/png' },
    { name: 'test.jpg', content: 'fake-jpg-content', type: 'image/jpeg' }
  ];

  for (const testFile of testFiles) {
    console.log(`Probando: ${testFile.name} (${testFile.type})`);
    
    const blob = new Blob([testFile.content], { type: testFile.type });
    const fileName = `test-${Date.now()}-${testFile.name}`;

    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`test/${fileName}`, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Éxito: ${data.path}`);
      }
    } catch (error) {
      console.log(`   ❌ Excepción: ${error.message}`);
    }
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de carga de imágenes...\n');
  
  await testImageUpload();
  await testFileTypes();
  
  console.log('\n🎉 Pruebas completadas!');
}

runTests(); 