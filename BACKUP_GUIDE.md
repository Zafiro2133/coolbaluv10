# 📋 Guía de Backup de Base de Datos - Coolbalu

Esta guía explica cómo hacer backups de la base de datos de Supabase para el proyecto Coolbalu Entretenimientos.

## 🎯 Información del Proyecto

- **Proyecto**: Coolbalu Entretenimientos
- **Project ID**: `rwgxdtfuzpdukaguogyh`
- **URL**: `https://rwgxdtfuzpdukaguogyh.supabase.co`

## 📁 Tipos de Backup Disponibles

### 1. Exportación de Datos (Recomendado)
Exporta todos los datos de las tablas principales en formato JSON.

```bash
# Exportar todas las tablas
node scripts/export-database-data.js

# Exportar tabla específica
node scripts/export-database-data.js --table profiles

# Listar backups existentes
node scripts/export-database-data.js --list
```

**Ventajas:**
- ✅ No requiere Supabase CLI
- ✅ Exporta datos estructurados en JSON
- ✅ Fácil de leer y procesar
- ✅ Incluye metadatos del backup

### 2. Backup Completo con Supabase CLI
Crea un backup completo de la base de datos (estructura + datos).

```bash
# Crear backup completo
./scripts/backup-database.sh --full

# Crear backup de solo datos
./scripts/backup-database.sh --data

# Listar backups existentes
./scripts/backup-database.sh --list
```

**Requisitos:**
- Supabase CLI instalado: `npm install -g supabase`
- Usuario logueado: `supabase login`

## 📊 Tablas Incluidas en el Backup

El backup incluye las siguientes tablas:

| Tabla | Descripción | Registros Típicos |
|-------|-------------|-------------------|
| `profiles` | Perfiles de usuarios | ~3 |
| `user_roles` | Roles de usuarios | ~1 |
| `categories` | Categorías de productos | ~4 |
| `products` | Productos del catálogo | ~5 |
| `reservations` | Reservas | ~6 |
| `reservation_items` | Items de reservas | ~6 |
| `availabilities` | Disponibilidades | ~17 |
| `contact_messages` | Mensajes de contacto | ~0 |
| `cart_items` | Items del carrito | ~0 |
| `email_logs` | Logs de emails | ~3 |
| `email_templates` | Plantillas de email | ~3 |
| `email_config` | Configuración de email | ~7 |

## 📂 Ubicación de los Backups

Todos los backups se guardan en el directorio `./backups/`:

```
backups/
├── data-export-2025-08-01-0913.json          # Datos exportados
├── data-export-2025-08-01-0913-info.json     # Información del backup
├── backup-2025-07-31.bundle                   # Backup completo anterior
├── backup-2025-07-30-b.bundle                 # Backup completo anterior
└── backup-2025-07-30.bundle                   # Backup completo anterior
```

## 🔄 Frecuencia Recomendada de Backups

### Backups Automáticos
- **Diario**: Exportación de datos críticos
- **Semanal**: Backup completo con CLI
- **Antes de cambios importantes**: Backup completo

### Backups Manuales
- Antes de actualizaciones importantes
- Antes de cambios en la estructura de la base de datos
- Antes de migraciones

## 🛠️ Scripts Disponibles

### 1. `export-database-data.js`
Script principal para exportar datos.

```bash
# Uso básico
node scripts/export-database-data.js

# Opciones disponibles
node scripts/export-database-data.js --help
```

**Opciones:**
- `--list, -l`: Listar backups existentes
- `--table <nombre>, -t <nombre>`: Exportar tabla específica
- `--help, -h`: Mostrar ayuda

### 2. `backup-database.sh`
Script para backup completo con Supabase CLI.

```bash
# Hacer ejecutable (solo en Linux/Mac)
chmod +x scripts/backup-database.sh

# Uso
./scripts/backup-database.sh --full
```

**Opciones:**
- `--full, -f`: Backup completo (estructura + datos)
- `--data, -d`: Backup de solo datos
- `--list, -l`: Listar backups existentes
- `--help, -h`: Mostrar ayuda

## 🔍 Verificación de Backups

### Verificar Integridad
```bash
# Verificar que el archivo existe y tiene contenido
ls -la backups/data-export-*.json

# Verificar el tamaño del archivo
du -h backups/data-export-*.json

# Verificar la estructura JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('backups/data-export-*.json')).metadata)"
```

### Verificar Contenido
```bash
# Ver las primeras líneas del backup
head -20 backups/data-export-*.json

# Contar registros por tabla
node -e "
const data = JSON.parse(require('fs').readFileSync('backups/data-export-*.json'));
Object.entries(data.tables).forEach(([table, info]) => {
  console.log(\`\${table}: \${info.count} registros\`);
});
"
```

## 🚨 Restauración de Backups

### Restaurar Datos Exportados
```javascript
// Ejemplo de restauración de datos exportados
const backupData = JSON.parse(fs.readFileSync('backups/data-export-*.json'));

// Restaurar tabla específica
const profiles = backupData.tables.profiles.data;
// Insertar en la base de datos...
```

### Restaurar Backup Completo
```bash
# Restaurar backup completo (requiere Supabase CLI)
supabase db reset --linked
supabase db restore --linked --file backups/backup-*.bundle
```

## 📈 Monitoreo y Mantenimiento

### Limpieza de Backups Antiguos
```bash
# Eliminar backups más antiguos de 30 días
find backups/ -name "*.json" -mtime +30 -delete
find backups/ -name "*.bundle" -mtime +30 -delete
```

### Verificación Automática
```bash
# Script para verificar backups recientes
node scripts/verify-backups.js
```

## 🔐 Seguridad

### Almacenamiento Seguro
- Los backups contienen datos sensibles
- Almacenar en ubicación segura
- No subir a repositorios públicos
- Usar encriptación si es necesario

### Acceso Controlado
- Limitar acceso a los archivos de backup
- Usar permisos de archivo apropiados
- Mantener registro de accesos

## 📞 Soporte

Si tienes problemas con los backups:

1. Verifica la conectividad con Supabase
2. Revisa los logs de error
3. Verifica las credenciales de acceso
4. Contacta al administrador del sistema

## 📝 Notas Importantes

- Los backups incluyen datos sensibles de usuarios
- Mantener múltiples copias en diferentes ubicaciones
- Probar la restauración periódicamente
- Documentar cualquier cambio en la estructura de datos

---

**Última actualización**: 1 de Agosto, 2025
**Versión**: 1.0 