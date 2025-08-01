#!/usr/bin/env node

/**
 * Script para exportar datos de la base de datos Supabase
 * Proyecto: Coolbalu Entretenimientos
 * Project ID: rwgxdtfuzpdukaguogyh
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración del proyecto
const PROJECT_ID = 'rwgxdtfuzpdukaguogyh';
const PROJECT_NAME = 'Coolbalu Entretenimientos';

// Configuración de Supabase
const SUPABASE_URL = 'https://rwgxdtfuzpdukaguogyh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM3MTI5MSwiZXhwIjoyMDY4OTQ3MjkxfQ.yGa3Q8T9y9e6SdE08jH1_2SqhYmk1q18Tm_16izohno';

// Crear cliente de Supabase con service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Función para obtener la fecha actual en formato YYYY-MM-DD-HHMM
function getCurrentTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}-${hours}${minutes}`;
}

// Función para crear el directorio de backups si no existe
function ensureBackupDirectory() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('✅ Directorio de backups creado');
  }
  return backupDir;
}

// Función para exportar datos de una tabla
async function exportTableData(tableName) {
  try {
    console.log(`📊 Exportando datos de la tabla: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error al exportar ${tableName}:`, error.message);
      return null;
    }
    
    console.log(`✅ ${tableName}: ${data.length} registros exportados`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error al exportar ${tableName}:`, error.message);
    return null;
  }
}

// Función principal para exportar todos los datos
async function exportAllData() {
  try {
    console.log('🔄 Iniciando exportación de datos de la base de datos...');
    console.log(`📊 Proyecto: ${PROJECT_NAME}`);
    console.log(`🆔 Project ID: ${PROJECT_ID}`);
    
    // Crear directorio de backups
    const backupDir = ensureBackupDirectory();
    
    // Generar nombre del archivo de backup
    const timestamp = getCurrentTimestamp();
    const backupFileName = `data-export-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);
    
    console.log(`📁 Archivo de backup: ${backupFileName}`);
    
    // Lista de tablas a exportar
    const tables = [
      'profiles',
      'user_roles',
      'categories',
      'products',
      'reservations',
      'reservation_items',
      'availabilities',
      'contact_messages',
      'cart_items',
      'email_logs',
      'email_templates',
      'email_config'
    ];
    
    const exportData = {
      metadata: {
        projectId: PROJECT_ID,
        projectName: PROJECT_NAME,
        exportDate: new Date().toISOString(),
        totalTables: tables.length,
        createdBy: 'export-database-data.js'
      },
      tables: {}
    };
    
    // Exportar datos de cada tabla
    for (const table of tables) {
      const tableData = await exportTableData(table);
      if (tableData !== null) {
        exportData.tables[table] = {
          count: tableData.length,
          data: tableData
        };
      }
    }
    
    // Guardar datos exportados
    fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2));
    
    // Calcular estadísticas
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Exportación completada exitosamente!');
    console.log(`📊 Tamaño del archivo: ${fileSizeInMB} MB`);
    console.log(`📁 Ubicación: ${backupPath}`);
    
    // Mostrar resumen
    console.log('\n📋 Resumen de la exportación:');
    Object.entries(exportData.tables).forEach(([table, info]) => {
      console.log(`  📄 ${table}: ${info.count} registros`);
    });
    
    // Crear archivo de información del backup
    const infoFileName = `data-export-${timestamp}-info.json`;
    const infoPath = path.join(backupDir, infoFileName);
    
    const backupInfo = {
      projectId: PROJECT_ID,
      projectName: PROJECT_NAME,
      exportDate: new Date().toISOString(),
      backupFile: backupFileName,
      fileSize: `${fileSizeInMB} MB`,
      createdBy: 'export-database-data.js',
      description: 'Exportación completa de datos de la base de datos Supabase',
      tablesExported: Object.keys(exportData.tables),
      totalRecords: Object.values(exportData.tables).reduce((sum, table) => sum + table.count, 0)
    };
    
    fs.writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2));
    console.log(`📋 Información del backup guardada en: ${infoFileName}`);
    
  } catch (error) {
    console.error('❌ Error al exportar los datos:', error.message);
    process.exit(1);
  }
}

// Función para exportar solo una tabla específica
async function exportSpecificTable(tableName) {
  try {
    console.log(`🔄 Exportando tabla específica: ${tableName}`);
    
    const backupDir = ensureBackupDirectory();
    const timestamp = getCurrentTimestamp();
    const backupFileName = `${tableName}-export-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);
    
    const tableData = await exportTableData(tableName);
    
    if (tableData !== null) {
      const exportData = {
        metadata: {
          table: tableName,
          exportDate: new Date().toISOString(),
          recordCount: tableData.length
        },
        data: tableData
      };
      
      fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2));
      
      const stats = fs.statSync(backupPath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log('✅ Exportación completada!');
      console.log(`📊 Tamaño del archivo: ${fileSizeInMB} MB`);
      console.log(`📁 Ubicación: ${backupPath}`);
    }
    
  } catch (error) {
    console.error('❌ Error al exportar la tabla:', error.message);
  }
}

// Función para listar backups existentes
function listBackups() {
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.log('📁 No hay directorio de backups');
    return;
  }
  
  const files = fs.readdirSync(backupDir);
  const backupFiles = files.filter(file => file.includes('export') || file.endsWith('.json'));
  
  if (backupFiles.length === 0) {
    console.log('📁 No hay backups existentes');
    return;
  }
  
  console.log('📋 Backups existentes:');
  backupFiles.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    const date = stats.mtime.toLocaleDateString('es-ES');
    const time = stats.mtime.toLocaleTimeString('es-ES');
    
    console.log(`  📄 ${file} (${fileSizeInMB} MB) - ${date} ${time}`);
  });
}

// Manejar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--list') || args.includes('-l')) {
  listBackups();
} else if (args.includes('--table') || args.includes('-t')) {
  const tableIndex = args.indexOf('--table') !== -1 ? args.indexOf('--table') : args.indexOf('-t');
  const tableName = args[tableIndex + 1];
  if (tableName) {
    exportSpecificTable(tableName);
  } else {
    console.log('❌ Error: Debes especificar el nombre de la tabla');
    console.log('Ejemplo: node export-database-data.js --table profiles');
  }
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📋 Script de Exportación de Datos de Base de Datos Supabase

Uso:
  node export-database-data.js [opciones]

Opciones:
  --list, -l           Listar backups existentes
  --table <nombre>, -t <nombre>  Exportar tabla específica
  --help, -h           Mostrar esta ayuda

Ejemplos:
  node export-database-data.js                    # Exportar todas las tablas
  node export-database-data.js --list             # Listar backups existentes
  node export-database-data.js --table profiles   # Exportar solo la tabla profiles
  `);
} else {
  exportAllData();
} 