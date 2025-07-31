const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY no está configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseErrors() {
  console.log('🔍 Diagnóstico de errores en CoolBalu...\n');

  try {
    // 1. Verificar conexión a Supabase
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);

    if (testError) {
      console.error('❌ Error de conexión a Supabase:', testError.message);
    } else {
      console.log('✅ Conexión a Supabase funcionando correctamente');
    }

    // 2. Verificar productos
    console.log('\n2️⃣ Verificando productos...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, is_active, category_id')
      .eq('is_active', true);

    if (productsError) {
      console.error('❌ Error cargando productos:', productsError.message);
    } else {
      console.log(`✅ Productos cargados: ${products?.length || 0} productos activos`);
      
      if (products && products.length > 0) {
        console.log('📋 Primeros 3 productos:');
        products.slice(0, 3).forEach((product, index) => {
          console.log(`   ${index + 1}. ID: ${product.id}, Nombre: ${product.name}`);
        });
      } else {
        console.warn('⚠️ No hay productos activos en la base de datos');
      }
    }

    // 3. Verificar categorías
    console.log('\n3️⃣ Verificando categorías...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, is_active')
      .eq('is_active', true);

    if (categoriesError) {
      console.error('❌ Error cargando categorías:', categoriesError.message);
    } else {
      console.log(`✅ Categorías cargadas: ${categories?.length || 0} categorías activas`);
      
      if (categories && categories.length > 0) {
        console.log('📋 Categorías disponibles:');
        categories.forEach((category, index) => {
          console.log(`   ${index + 1}. ID: ${category.id}, Nombre: ${category.name}`);
        });
      } else {
        console.warn('⚠️ No hay categorías activas en la base de datos');
      }
    }

    // 4. Sistema de emails removido temporalmente
    console.log('\n4️⃣ Sistema de emails removido temporalmente para reconfiguración');

    // 5. Verificar variables de entorno
    console.log('\n5️⃣ Verificando variables de entorno...');
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
    } else {
      console.log('✅ Variables de entorno básicas configuradas');
    }

    // 6. Verificar estructura de datos
    console.log('\n6️⃣ Verificando estructura de datos...');
    const { data: productWithCategory, error: structureError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category:categories(id, name)
      `)
      .eq('is_active', true)
      .limit(1);

    if (structureError) {
      console.error('❌ Error en estructura de datos:', structureError.message);
    } else if (productWithCategory && productWithCategory.length > 0) {
      const product = productWithCategory[0];
      console.log('✅ Estructura de datos correcta');
      console.log(`   Producto: ${product.name} (ID: ${product.id})`);
      console.log(`   Categoría: ${product.category?.name || 'Sin categoría'} (ID: ${product.category?.id || 'N/A'})`);
    } else {
      console.warn('⚠️ No se pudo verificar la estructura de datos');
    }

    console.log('\n🎯 Resumen del diagnóstico:');
    console.log('=====================================');
    
    if (testError) {
      console.log('❌ Problema principal: Conexión a Supabase');
      console.log('💡 Solución: Verificar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
    } else if (productsError) {
      console.log('❌ Problema principal: Error cargando productos');
      console.log('💡 Solución: Verificar permisos RLS en tabla products');
    } else if (categoriesError) {
      console.log('❌ Problema principal: Error cargando categorías');
      console.log('💡 Solución: Verificar permisos RLS en tabla categories');
    } else if (!products || products.length === 0) {
      console.log('❌ Problema principal: No hay productos en la base de datos');
      console.log('💡 Solución: Agregar productos a la tabla products');
    } else {
      console.log('✅ Sistema funcionando correctamente');
      console.log('💡 Los errores pueden ser temporales o de red');
    }

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
diagnoseErrors().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 