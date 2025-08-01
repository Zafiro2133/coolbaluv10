#!/usr/bin/env node

/**
 * Script para crear backup de la base de datos Supabase
 * Proyecto: Coolbalu Entretenimientos
 * Project ID: rwgxdtfuzpdukaguogyh
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Función principal para crear el backup
async function createBackup() {
  try {
    console.log('🔄 Iniciando backup de la base de datos...');
    console.log(`📊 Proyecto: ${PROJECT_NAME}`);
    console.log(`🆔 Project ID: ${PROJECT_ID}`);
    
    // Verificar si Supabase CLI está instalado
    try {
      execSync('supabase --version', { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ Error: Supabase CLI no está instalado');
      console.log('📦 Instala Supabase CLI con: npm install -g supabase');
      process.exit(1);
    }
    
    // Crear directorio de backups
    const backupDir = ensureBackupDirectory();
    
    // Generar nombre del archivo de backup
    const timestamp = getCurrentTimestamp();
    const backupFileName = `backup-${timestamp}.bundle`;
    const backupPath = path.join(backupDir, backupFileName);
    
    console.log(`📁 Archivo de backup: ${backupFileName}`);
    
    // Comando para crear el backup
    const backupCommand = `supabase db dump --linked --file ${backupPath}`;
    
    console.log('⏳ Creando backup... (esto puede tomar varios minutos)');
    
    // Ejecutar el comando de backup
    execSync(backupCommand, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Verificar que el archivo se creó correctamente
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log('✅ Backup creado exitosamente!');
      console.log(`📊 Tamaño del archivo: ${fileSizeInMB} MB`);
      console.log(`📁 Ubicación: ${backupPath}`);
      
      // Crear un archivo de información del backup
      const infoFileName = `backup-${timestamp}-info.json`;
      const infoPath = path.join(backupDir, infoFileName);
      
      const backupInfo = {
        projectId: PROJECT_ID,
        projectName: PROJECT_NAME,
        backupDate: new Date().toISOString(),
        backupFile: backupFileName,
        fileSize: `${fileSizeInMB} MB`,
        createdBy: 'create-database-backup.js',
        description: 'Backup completo de la base de datos Supabase'
      };
      
      fs.writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2));
      console.log(`📋 Información del backup guardada en: ${infoFileName}`);
      
    } else {
      throw new Error('El archivo de backup no se creó correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error al crear el backup:', error.message);
    
    if (error.message.includes('not logged in')) {
      console.log('🔑 Solución: Inicia sesión en Supabase CLI con: supabase login');
    } else if (error.message.includes('not found')) {
      console.log('🔍 Solución: Verifica que el Project ID sea correcto');
    }
    
    process.exit(1);
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
  const backupFiles = files.filter(file => file.endsWith('.bundle'));
  
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
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📋 Script de Backup de Base de Datos Supabase

Uso:
  node create-database-backup.js [opciones]

Opciones:
  --list, -l     Listar backups existentes
  --help, -h     Mostrar esta ayuda

Ejemplos:
  node create-database-backup.js          # Crear nuevo backup
  node create-database-backup.js --list   # Listar backups existentes
  `);
} else {
  createBackup();
} 