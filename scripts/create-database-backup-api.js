#!/usr/bin/env node

/**
 * Script para crear backup de la base de datos Supabase usando la API
 * Proyecto: Coolbalu Entretenimientos
 * Project ID: rwgxdtfuzpdukaguogyh
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración del proyecto
const PROJECT_ID = 'rwgxdtfuzpdukaguogyh';
const PROJECT_NAME = 'Coolbalu Entretenimientos';

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

// Función para obtener el token de acceso de Supabase
async function getSupabaseToken() {
  // Verificar si existe el archivo .env o variables de entorno
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3hkdGZ1enBkdWthZ3VvZ3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM3MTI5MSwiZXhwIjoyMDY4OTQ3MjkxfQ.yGa3Q8T9y9e6SdE08jH1_2SqhYmk1q18Tm_16izohno';
  
  return serviceRoleKey;
}

// Función para crear backup usando la API de Supabase
async function createBackupViaAPI() {
  try {
    console.log('🔄 Iniciando backup de la base de datos via API...');
    console.log(`📊 Proyecto: ${PROJECT_NAME}`);
    console.log(`🆔 Project ID: ${PROJECT_ID}`);
    
    // Crear directorio de backups
    const backupDir = ensureBackupDirectory();
    
    // Generar nombre del archivo de backup
    const timestamp = getCurrentTimestamp();
    const backupFileName = `backup-${timestamp}.sql`;
    const backupPath = path.join(backupDir, backupFileName);
    
    console.log(`📁 Archivo de backup: ${backupFileName}`);
    
    // Obtener token de acceso
    const serviceRoleKey = await getSupabaseToken();
    
    // URL de la API de Supabase para backups
    const apiUrl = `https://api.supabase.com/v1/projects/${PROJECT_ID}/backups`;
    
    console.log('⏳ Solicitando backup via API...');
    
    // Crear backup usando la API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        type: 'full',
        description: `Backup automático - ${new Date().toISOString()}`
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la API: ${response.status} - ${errorText}`);
    }
    
    const backupData = await response.json();
    
    console.log('✅ Backup solicitado exitosamente!');
    console.log(`📋 ID del backup: ${backupData.id}`);
    console.log(`📁 Estado: ${backupData.status}`);
    
    // Crear archivo de información del backup
    const infoFileName = `backup-${timestamp}-info.json`;
    const infoPath = path.join(backupDir, infoFileName);
    
    const backupInfo = {
      projectId: PROJECT_ID,
      projectName: PROJECT_NAME,
      backupDate: new Date().toISOString(),
      backupId: backupData.id,
      status: backupData.status,
      backupFile: backupFileName,
      createdBy: 'create-database-backup-api.js',
      description: 'Backup completo de la base de datos Supabase via API',
      apiResponse: backupData
    };
    
    fs.writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2));
    console.log(`📋 Información del backup guardada en: ${infoFileName}`);
    
    return backupData;
    
  } catch (error) {
    console.error('❌ Error al crear el backup:', error.message);
    process.exit(1);
  }
}

// Función para crear backup manual usando pg_dump (alternativa)
async function createManualBackup() {
  try {
    console.log('🔄 Creando backup manual usando pg_dump...');
    
    const backupDir = ensureBackupDirectory();
    const timestamp = getCurrentTimestamp();
    const backupFileName = `backup-${timestamp}.sql`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // Obtener la URL de conexión de la base de datos
    const dbUrl = process.env.DATABASE_URL || 
      'postgresql://postgres.rwgxdtfuzpdukaguogyh:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres';
    
    console.log('⏳ Ejecutando pg_dump...');
    
    // Comando pg_dump (requiere que pg_dump esté instalado)
    const { execSync } = await import('child_process');
    const dumpCommand = `pg_dump "${dbUrl}" > "${backupPath}"`;
    
    execSync(dumpCommand, { 
      stdio: 'inherit',
      shell: true
    });
    
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log('✅ Backup manual creado exitosamente!');
      console.log(`📊 Tamaño del archivo: ${fileSizeInMB} MB`);
      console.log(`📁 Ubicación: ${backupPath}`);
    }
    
  } catch (error) {
    console.error('❌ Error en backup manual:', error.message);
    console.log('💡 Asegúrate de tener pg_dump instalado y configurado');
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
  const backupFiles = files.filter(file => file.endsWith('.sql') || file.endsWith('.bundle'));
  
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
} else if (args.includes('--manual') || args.includes('-m')) {
  createManualBackup();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📋 Script de Backup de Base de Datos Supabase (API)

Uso:
  node create-database-backup-api.js [opciones]

Opciones:
  --list, -l       Listar backups existentes
  --manual, -m     Crear backup manual con pg_dump
  --help, -h       Mostrar esta ayuda

Ejemplos:
  node create-database-backup-api.js          # Crear backup via API
  node create-database-backup-api.js --list   # Listar backups existentes
  node create-database-backup-api.js --manual # Crear backup manual
  `);
} else {
  createBackupViaAPI();
} 