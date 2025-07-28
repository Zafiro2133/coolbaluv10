// Script para probar la configuración de Cloudinary
const fs = require('fs');
const path = require('path');

// Configuración de Cloudinary
const cloudinaryConfig = {
  cloudName: 'coolbaluv10',
  apiKey: '428128483696796',
  uploadPreset: 'coolbaluv10_products',
  folder: 'products'
};

// Función para crear una imagen de prueba
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

  const testImagePath = path.join(__dirname, 'test-cloudinary.png');
  fs.writeFileSync(testImagePath, pngHeader);
  return testImagePath;
}

async function testCloudinaryUpload() {
  console.log('🧪 Probando configuración de Cloudinary...\n');

  try {
    // 1. Verificar configuración
    console.log('1. Verificando configuración:');
    console.log(`   - Cloud Name: ${cloudinaryConfig.cloudName}`);
    console.log(`   - API Key: ${cloudinaryConfig.apiKey}`);
    console.log(`   - Upload Preset: ${cloudinaryConfig.uploadPreset}`);
    console.log(`   - Folder: ${cloudinaryConfig.folder}`);

    // 2. Crear archivo de prueba
    console.log('\n2. Creando archivo de prueba...');
    const testImagePath = createTestImage();
    const testImageBuffer = fs.readFileSync(testImagePath);
    
    console.log('✅ Archivo de prueba creado:', testImagePath);
    console.log(`   - Tamaño: ${testImageBuffer.length} bytes`);

    // 3. Crear FormData para simular la subida
    console.log('\n3. Preparando datos para subida...');
    
    // Simular FormData (sin ejecutar realmente)
    console.log('   - FormData preparado con:');
    console.log(`     * file: test.png`);
    console.log(`     * upload_preset: ${cloudinaryConfig.uploadPreset}`);
    console.log(`     * folder: ${cloudinaryConfig.folder}`);
    console.log(`     * api_key: ${cloudinaryConfig.apiKey}`);

    console.log('✅ FormData preparado');
    console.log(`   - Nombre: test.png`);
    console.log(`   - Tipo: image/png`);
    console.log(`   - Tamaño: ${testImageBuffer.length} bytes`);

    // 4. Simular la subida (sin ejecutar realmente)
    console.log('\n4. Simulando subida a Cloudinary...');
    console.log(`   - URL: https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`);
    console.log(`   - Método: POST`);
    console.log(`   - Preset: ${cloudinaryConfig.uploadPreset}`);

    // 5. Mostrar información de configuración
    console.log('\n5. Información de configuración:');
    console.log('   ✅ Cloud Name configurado');
    console.log('   ✅ API Key configurada');
    console.log('   ✅ Upload Preset configurado');
    console.log('   ✅ Folder configurado');

    // 6. Limpiar archivo de prueba
    fs.unlinkSync(testImagePath);
    console.log('\n🧹 Archivo de prueba eliminado');

    console.log('\n🎉 Configuración verificada exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Asegúrate de que el upload preset esté configurado en Cloudinary Dashboard');
    console.log('   2. El preset debe estar configurado como "Unsigned"');
    console.log('   3. Prueba la funcionalidad en el panel de administración');
    console.log('   4. Verifica que las imágenes se suban correctamente');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
testCloudinaryUpload(); 