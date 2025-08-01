#!/bin/bash

# Script para crear backup completo de la base de datos Supabase
# Proyecto: Coolbalu Entretenimientos
# Project ID: rwgxdtfuzpdukaguogyh

# Configuración
PROJECT_ID="rwgxdtfuzpdukaguogyh"
PROJECT_NAME="Coolbalu Entretenimientos"
BACKUP_DIR="./backups"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

print_info() {
    echo -e "${BLUE}$1${NC}"
}

# Función para obtener timestamp
get_timestamp() {
    date +"%Y-%m-%d-%H%M"
}

# Función para crear directorio de backups
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_message "✅ Directorio de backups creado"
    fi
}

# Función para verificar si Supabase CLI está instalado
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_error "❌ Supabase CLI no está instalado"
        print_info "📦 Instala Supabase CLI con: npm install -g supabase"
        exit 1
    fi
    
    print_message "✅ Supabase CLI encontrado"
    supabase --version
}

# Función para verificar si el usuario está logueado
check_login() {
    if ! supabase projects list &> /dev/null; then
        print_error "❌ No estás logueado en Supabase CLI"
        print_info "🔑 Inicia sesión con: supabase login"
        exit 1
    fi
    
    print_message "✅ Usuario logueado en Supabase CLI"
}

# Función para crear backup completo
create_full_backup() {
    print_message "🔄 Iniciando backup completo de la base de datos..."
    print_info "📊 Proyecto: $PROJECT_NAME"
    print_info "🆔 Project ID: $PROJECT_ID"
    
    # Crear directorio de backups
    create_backup_dir
    
    # Generar nombre del archivo
    TIMESTAMP=$(get_timestamp)
    BACKUP_FILE="backup-full-$TIMESTAMP.bundle"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
    
    print_info "📁 Archivo de backup: $BACKUP_FILE"
    
    # Crear backup usando Supabase CLI
    print_warning "⏳ Creando backup... (esto puede tomar varios minutos)"
    
    if supabase db dump --linked --file "$BACKUP_PATH"; then
        if [ -f "$BACKUP_PATH" ]; then
            FILE_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
            print_message "✅ Backup completo creado exitosamente!"
            print_info "📊 Tamaño del archivo: $FILE_SIZE"
            print_info "📁 Ubicación: $BACKUP_PATH"
            
            # Crear archivo de información
            INFO_FILE="backup-full-$TIMESTAMP-info.json"
            INFO_PATH="$BACKUP_DIR/$INFO_FILE"
            
            cat > "$INFO_PATH" << EOF
{
  "projectId": "$PROJECT_ID",
  "projectName": "$PROJECT_NAME",
  "backupDate": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "backupFile": "$BACKUP_FILE",
  "fileSize": "$FILE_SIZE",
  "createdBy": "backup-database.sh",
  "description": "Backup completo de la base de datos Supabase usando CLI",
  "type": "full_backup"
}
EOF
            
            print_message "📋 Información del backup guardada en: $INFO_FILE"
        else
            print_error "❌ El archivo de backup no se creó correctamente"
            exit 1
        fi
    else
        print_error "❌ Error al crear el backup"
        exit 1
    fi
}

# Función para crear backup de solo datos
create_data_backup() {
    print_message "🔄 Iniciando backup de solo datos..."
    
    create_backup_dir
    
    TIMESTAMP=$(get_timestamp)
    BACKUP_FILE="backup-data-$TIMESTAMP.sql"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
    
    print_info "📁 Archivo de backup: $BACKUP_FILE"
    
    if supabase db dump --linked --data-only --file "$BACKUP_PATH"; then
        if [ -f "$BACKUP_PATH" ]; then
            FILE_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
            print_message "✅ Backup de datos creado exitosamente!"
            print_info "📊 Tamaño del archivo: $FILE_SIZE"
            print_info "📁 Ubicación: $BACKUP_PATH"
        else
            print_error "❌ El archivo de backup no se creó correctamente"
            exit 1
        fi
    else
        print_error "❌ Error al crear el backup de datos"
        exit 1
    fi
}

# Función para listar backups existentes
list_backups() {
    if [ ! -d "$BACKUP_DIR" ]; then
        print_warning "📁 No hay directorio de backups"
        return
    fi
    
    BACKUP_FILES=$(find "$BACKUP_DIR" -name "*.bundle" -o -name "*.sql" | sort)
    
    if [ -z "$BACKUP_FILES" ]; then
        print_warning "📁 No hay backups existentes"
        return
    fi
    
    print_message "📋 Backups existentes:"
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            FILE_SIZE=$(du -h "$file" | cut -f1)
            FILE_DATE=$(stat -c "%y" "$file" | cut -d' ' -f1)
            FILE_TIME=$(stat -c "%y" "$file" | cut -d' ' -f2 | cut -d'.' -f1)
            FILENAME=$(basename "$file")
            print_info "  📄 $FILENAME ($FILE_SIZE) - $FILE_DATE $FILE_TIME"
        fi
    done <<< "$BACKUP_FILES"
}

# Función para mostrar ayuda
show_help() {
    echo "
📋 Script de Backup de Base de Datos Supabase

Uso:
  ./backup-database.sh [opciones]

Opciones:
  --full, -f        Crear backup completo (estructura + datos)
  --data, -d        Crear backup de solo datos
  --list, -l        Listar backups existentes
  --help, -h        Mostrar esta ayuda

Ejemplos:
  ./backup-database.sh --full     # Crear backup completo
  ./backup-database.sh --data     # Crear backup de solo datos
  ./backup-database.sh --list     # Listar backups existentes
"
}

# Función principal
main() {
    case "${1:-}" in
        --full|-f)
            check_supabase_cli
            check_login
            create_full_backup
            ;;
        --data|-d)
            check_supabase_cli
            check_login
            create_data_backup
            ;;
        --list|-l)
            list_backups
            ;;
        --help|-h|"")
            show_help
            ;;
        *)
            print_error "❌ Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@" 