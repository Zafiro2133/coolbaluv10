# Mejores Prácticas de Supabase

## 🚨 Reglas Críticas

### 1. Palabras Reservadas en SQL

**❌ NUNCA usar `timestamp` como nombre de columna**
```sql
-- INCORRECTO - timestamp es palabra reservada
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE,  -- ❌ PROBLEMA
    description TEXT
);
```

**✅ SIEMPRE usar `created_at` o `updated_at`**
```sql
-- CORRECTO - usar nombres descriptivos
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE,  -- ✅ CORRECTO
    updated_at TIMESTAMP WITH TIME ZONE,  -- ✅ CORRECTO
    description TEXT
);
```

#### Palabras Reservadas Comunes a Evitar:
- `timestamp`
- `order`
- `group`
- `user`
- `key`
- `index`
- `table`
- `schema`
- `database`

### 2. Convenciones de Nomenclatura

#### Tablas
```sql
-- ✅ Usar plural y snake_case
CREATE TABLE user_roles ();      -- ✅
CREATE TABLE audit_logs ();      -- ✅
CREATE TABLE reservation_items (); -- ✅

-- ❌ Evitar
CREATE TABLE userRole ();        -- ❌ camelCase
CREATE TABLE auditLogs ();       -- ❌ camelCase
CREATE TABLE reservation_item (); -- ❌ singular
```

#### Columnas
```sql
-- ✅ Usar snake_case
user_id UUID,           -- ✅
created_at TIMESTAMP,   -- ✅
updated_at TIMESTAMP,   -- ✅
first_name TEXT,        -- ✅

-- ❌ Evitar
userId UUID,            -- ❌ camelCase
createdAt TIMESTAMP,    -- ❌ camelCase
firstName TEXT,         -- ❌ camelCase
```

### 3. Tipos de Datos Recomendados

#### Identificadores
```sql
-- ✅ Usar UUID para IDs
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

-- ✅ Para referencias externas
user_id UUID REFERENCES auth.users(id),
```

#### Fechas y Tiempo
```sql
-- ✅ Siempre usar WITH TIME ZONE
created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
```

#### Texto
```sql
-- ✅ Para texto corto
name TEXT NOT NULL,

-- ✅ Para texto largo
description TEXT,

-- ✅ Para texto con límite
email VARCHAR(255),
```

### 4. Políticas de Seguridad (RLS)

#### Habilitar RLS
```sql
-- ✅ Siempre habilitar RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

#### Políticas Básicas
```sql
-- ✅ Política para admins
CREATE POLICY "Admins can do everything" ON table_name
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ✅ Política para usuarios autenticados
CREATE POLICY "Users can view their own data" ON table_name
    FOR SELECT USING (auth.uid() = user_id);
```

### 5. Funciones y Triggers

#### Funciones
```sql
-- ✅ Usar SECURITY DEFINER para funciones admin
CREATE OR REPLACE FUNCTION function_name()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- ✅ Importante para funciones admin
AS $$
BEGIN
    -- código aquí
END;
$$;
```

#### Triggers
```sql
-- ✅ Crear triggers con nombres descriptivos
CREATE TRIGGER audit_table_changes
    AFTER INSERT OR UPDATE OR DELETE ON table_name
    FOR EACH ROW EXECUTE FUNCTION log_changes();
```

### 6. Índices

#### Índices Básicos
```sql
-- ✅ Índices para consultas frecuentes
CREATE INDEX idx_table_name_user_id ON table_name(user_id);
CREATE INDEX idx_table_name_created_at ON table_name(created_at DESC);

-- ✅ Índices parciales para mejor rendimiento
CREATE INDEX idx_table_name_active ON table_name(user_id) 
WHERE is_active = true;
```

### 7. Migraciones

#### Estructura de Migración
```sql
-- =====================================================
-- MIGRACIÓN: Descripción de la migración
-- Fecha: YYYY-MM-DD
-- Propósito: Explicar qué hace esta migración
-- =====================================================

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS table_name (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas
CREATE POLICY "policy_name" ON table_name
    FOR SELECT USING (condition);

-- 4. Crear índices
CREATE INDEX idx_table_name_column ON table_name(column_name);

-- 5. Crear funciones
CREATE OR REPLACE FUNCTION function_name()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- código aquí
END;
$$;
```

### 8. Validaciones

#### Constraints
```sql
-- ✅ Usar constraints para validación
ALTER TABLE table_name 
ADD CONSTRAINT check_status 
CHECK (status IN ('pending', 'confirmed', 'cancelled'));

-- ✅ Constraints de longitud
ALTER TABLE table_name 
ADD CONSTRAINT check_email_length 
CHECK (length(email) > 0 AND length(email) <= 255);
```

### 9. Manejo de Errores

#### Funciones con Manejo de Errores
```sql
CREATE OR REPLACE FUNCTION safe_function()
RETURNS JSONB AS $$
BEGIN
    -- código aquí
    RETURN jsonb_build_object('success', true);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 10. Documentación

#### Comentarios en SQL
```sql
-- ✅ Comentar tablas y columnas importantes
COMMENT ON TABLE table_name IS 'Descripción de la tabla';
COMMENT ON COLUMN table_name.column_name IS 'Descripción de la columna';

-- ✅ Documentar funciones
COMMENT ON FUNCTION function_name() IS 'Descripción de la función';
```

## 🔧 Checklist de Verificación

Antes de crear una migración, verificar:

- [ ] ¿Evito palabras reservadas como `timestamp`, `order`, `user`?
- [ ] ¿Uso `created_at` y `updated_at` para fechas?
- [ ] ¿Habilito RLS en todas las tablas?
- [ ] ¿Creo políticas de seguridad apropiadas?
- [ ] ¿Uso UUID para IDs?
- [ ] ¿Agrego índices para consultas frecuentes?
- [ ] ¿Documento la migración con comentarios?
- [ ] ¿Manejo errores en funciones críticas?
- [ ] ¿Uso `SECURITY DEFINER` cuando es necesario?
- [ ] ¿Sigo las convenciones de nomenclatura?

## 📚 Recursos Adicionales

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [PostgreSQL Keywords](https://www.postgresql.org/docs/current/sql-keywords-appendix.html)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Design Best Practices](https://supabase.com/docs/guides/database/best-practices) 