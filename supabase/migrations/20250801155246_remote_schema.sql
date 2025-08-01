create sequence "public"."configuracion_id_seq";

drop trigger if exists "update_cart_items_updated_at" on "public"."cart_items";

drop trigger if exists "update_contact_messages_updated_at" on "public"."contact_messages";

drop trigger if exists "update_profiles_updated_at" on "public"."profiles";

drop trigger if exists "validate_reservation_user" on "public"."reservations";

drop policy "admins_full_access_email_config" on "public"."email_config";

drop policy "admins_can_insert_email_logs" on "public"."email_logs";

drop policy "admins_can_update_email_logs" on "public"."email_logs";

drop policy "admins_can_view_all_email_logs" on "public"."email_logs";

drop policy "admins_full_access_email_templates" on "public"."email_templates";

drop policy "admin_full_access_system_settings" on "public"."system_settings";

drop policy "authenticated_read_public_settings" on "public"."system_settings";

drop policy "Admins can view audit_log" on "public"."audit_log";

drop policy "Admins can manage availabilities" on "public"."availabilities";

drop policy "Admins can manage categories" on "public"."categories";

drop policy "Admins can delete all contact messages" on "public"."contact_messages";

drop policy "Admins can update all contact messages" on "public"."contact_messages";

drop policy "Admins can view all contact messages" on "public"."contact_messages";

drop policy "Admins can manage products" on "public"."products";

drop policy "Admins can view all profiles" on "public"."profiles";

drop policy "Admins can insert all reservation items" on "public"."reservation_items";

drop policy "Admins can view all reservation items" on "public"."reservation_items";

drop policy "Admins can update all reservations" on "public"."reservations";

drop policy "Admins can view all reservations" on "public"."reservations";

drop policy "Admins can manage user roles" on "public"."user_roles";

drop policy "Admins can view all user roles" on "public"."user_roles";

alter table "public"."availabilities" drop constraint "availabilities_date_hour_key";

alter table "public"."profiles" drop constraint "profiles_user_id_key";

alter table "public"."audit_log" drop constraint "audit_log_user_id_fkey";

alter table "public"."reservation_items" drop constraint "reservation_items_product_id_fkey";

drop function if exists "public"."validate_user_exists"();

alter table "public"."profiles" drop constraint "profiles_pkey";

drop index if exists "public"."availabilities_date_hour_key";

drop index if exists "public"."idx_availabilities_date_hour";

drop index if exists "public"."idx_cart_items_user_id";

drop index if exists "public"."idx_categories_active";

drop index if exists "public"."idx_products_active";

drop index if exists "public"."idx_products_category_id";

drop index if exists "public"."idx_profiles_user_id";

drop index if exists "public"."idx_user_roles_user_id";

drop index if exists "public"."profiles_user_id_key";

drop index if exists "public"."profiles_pkey";

create table "public"."configuracion" (
    "id" integer not null default nextval('configuracion_id_seq'::regclass),
    "clave" text not null,
    "valor" text not null
);


alter table "public"."configuracion" enable row level security;

create table "public"."resources" (
    "id" bigint generated always as identity not null,
    "name" text not null,
    "description" text,
    "owner_id" uuid,
    "is_available" boolean default true,
    "capacity" integer,
    "location" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."resources" enable row level security;

alter table "public"."availabilities" alter column "created_at" drop not null;

alter table "public"."availabilities" alter column "id" set default uuid_generate_v4();

alter table "public"."profiles" add column "email" text;

alter table "public"."profiles" alter column "user_id" set default auth.uid();

alter table "public"."reservation_items" add column "key" text;

alter table "public"."reservation_items" alter column "created_at" drop not null;

alter table "public"."reservation_items" alter column "extra_hour_percentage" set data type numeric(5,2) using "extra_hour_percentage"::numeric(5,2);

alter table "public"."reservation_items" alter column "item_total" drop default;

alter table "public"."reservation_items" alter column "product_id" drop not null;

alter table "public"."reservation_items" alter column "reservation_id" drop not null;

alter table "public"."reservations" add column "extra_hours" integer not null default 0;

alter table "public"."reservations" add column "key" text;

alter table "public"."reservations" add column "user_email" text;

alter table "public"."reservations" alter column "created_at" drop not null;

alter table "public"."reservations" alter column "subtotal" drop default;

alter table "public"."reservations" alter column "total" drop default;

alter table "public"."reservations" alter column "updated_at" drop not null;

alter table "public"."reservations" alter column "user_id" drop not null;

alter sequence "public"."configuracion_id_seq" owned by "public"."configuracion"."id";

CREATE UNIQUE INDEX configuracion_clave_key ON public.configuracion USING btree (clave);

CREATE UNIQUE INDEX configuracion_pkey ON public.configuracion USING btree (id);

CREATE INDEX idx_reservation_items_extra_hours ON public.reservation_items USING btree (extra_hours);

CREATE INDEX idx_reservation_items_product_id ON public.reservation_items USING btree (product_id);

CREATE INDEX idx_reservations_extra_hours ON public.reservations USING btree (extra_hours);

CREATE INDEX idx_resources_owner_id ON public.resources USING btree (owner_id);

CREATE UNIQUE INDEX profiles_user_id_unique ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX resources_pkey ON public.resources USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id, user_id);

alter table "public"."configuracion" add constraint "configuracion_pkey" PRIMARY KEY using index "configuracion_pkey";

alter table "public"."resources" add constraint "resources_pkey" PRIMARY KEY using index "resources_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."configuracion" add constraint "configuracion_clave_key" UNIQUE using index "configuracion_clave_key";

alter table "public"."email_logs" add constraint "fk_email_logs_contact_message_id" FOREIGN KEY (related_contact_message_id) REFERENCES contact_messages(id) ON DELETE SET NULL not valid;

alter table "public"."email_logs" validate constraint "fk_email_logs_contact_message_id";

alter table "public"."email_logs" add constraint "fk_email_logs_reservation_id" FOREIGN KEY (related_reservation_id) REFERENCES reservations(id) ON DELETE SET NULL not valid;

alter table "public"."email_logs" validate constraint "fk_email_logs_reservation_id";

alter table "public"."profiles" add constraint "profiles_user_id_unique" UNIQUE using index "profiles_user_id_unique";

alter table "public"."reservation_items" add constraint "check_extra_hours" CHECK ((extra_hours >= 0)) not valid;

alter table "public"."reservation_items" validate constraint "check_extra_hours";

alter table "public"."reservation_items" add constraint "check_extra_hours_reservation_items" CHECK ((extra_hours >= 0)) not valid;

alter table "public"."reservation_items" validate constraint "check_extra_hours_reservation_items";

alter table "public"."reservation_items" add constraint "check_item_total" CHECK ((item_total >= (0)::numeric)) not valid;

alter table "public"."reservation_items" validate constraint "check_item_total";

alter table "public"."reservation_items" add constraint "check_product_price" CHECK ((product_price >= (0)::numeric)) not valid;

alter table "public"."reservation_items" validate constraint "check_product_price";

alter table "public"."reservation_items" add constraint "check_quantity" CHECK ((quantity >= 1)) not valid;

alter table "public"."reservation_items" validate constraint "check_quantity";

alter table "public"."reservations" add constraint "check_adult_count" CHECK ((adult_count >= 1)) not valid;

alter table "public"."reservations" validate constraint "check_adult_count";

alter table "public"."reservations" add constraint "check_child_count" CHECK ((child_count >= 0)) not valid;

alter table "public"."reservations" validate constraint "check_child_count";

alter table "public"."reservations" add constraint "check_extra_hours_reservations" CHECK ((extra_hours >= 0)) not valid;

alter table "public"."reservations" validate constraint "check_extra_hours_reservations";

alter table "public"."reservations" add constraint "check_rain_reschedule" CHECK ((rain_reschedule = ANY (ARRAY['no'::text, 'indoor'::text, 'reschedule'::text]))) not valid;

alter table "public"."reservations" validate constraint "check_rain_reschedule";

alter table "public"."reservations" add constraint "check_status" CHECK ((status = ANY (ARRAY['pending_payment'::text, 'paid'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text]))) not valid;

alter table "public"."reservations" validate constraint "check_status";

alter table "public"."reservations" add constraint "check_subtotal" CHECK ((subtotal >= (0)::numeric)) not valid;

alter table "public"."reservations" validate constraint "check_subtotal";

alter table "public"."reservations" add constraint "check_total" CHECK ((total >= (0)::numeric)) not valid;

alter table "public"."reservations" validate constraint "check_total";

alter table "public"."reservations" add constraint "check_transport_cost" CHECK ((transport_cost >= (0)::numeric)) not valid;

alter table "public"."reservations" validate constraint "check_transport_cost";

alter table "public"."resources" add constraint "resources_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) not valid;

alter table "public"."resources" validate constraint "resources_owner_id_fkey";

alter table "public"."audit_log" add constraint "audit_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."audit_log" validate constraint "audit_log_user_id_fkey";

alter table "public"."reservation_items" add constraint "reservation_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."reservation_items" validate constraint "reservation_items_product_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_user_email_to_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Obtener el email del usuario y agregarlo a la reserva
    UPDATE public.reservations
    SET user_email = (
        SELECT email 
        FROM auth.users 
        WHERE id = NEW.user_id
    )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_item_total_with_extra_hours(base_price numeric, extra_hours integer DEFAULT 0, extra_hour_rate numeric DEFAULT 0)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN base_price + (extra_hours * extra_hour_rate);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.change_user_role()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Use fully qualified schema references
  update auth.users 
  set raw_app_meta_data = jsonb_set(
    raw_app_meta_data, 
    '{role}', 
    to_jsonb('new_role'::text)
  )
  where id = auth.uid();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.change_user_role(target_user_id uuid, new_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Verificar que el usuario actual es admin
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden cambiar roles';
    END IF;
    
    -- Actualizar o insertar el rol
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, new_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_storage_config()
 RETURNS TABLE(bucket_id text, bucket_name text, is_public boolean, file_size_limit bigint, allowed_mime_types text[])
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
  FROM storage.buckets
  ORDER BY name;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_files()
 RETURNS TABLE(bucket_name text, orphaned_count bigint, cleaned_files text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  bucket_record RECORD;
  orphaned_record RECORD;
  cleaned_files_array TEXT[] := '{}';
  orphaned_count_val BIGINT := 0;
BEGIN
  FOR bucket_record IN 
    SELECT id, name FROM storage.buckets 
    WHERE public = true
  LOOP
    -- Buscar archivos huérfanos (archivos sin referencia en la base de datos)
    FOR orphaned_record IN
      SELECT o.name
      FROM storage.objects o
      LEFT JOIN public.products p ON o.name LIKE '%' || p.id || '%'
      WHERE o.bucket_id = bucket_record.id
        AND p.id IS NULL
        AND o.name LIKE 'temp/%'
    LOOP
      -- Agregar a la lista de archivos limpiados
      cleaned_files_array := array_append(cleaned_files_array, orphaned_record.name);
      orphaned_count_val := orphaned_count_val + 1;
    END LOOP;
    
    bucket_name := bucket_record.name;
    orphaned_count := orphaned_count_val;
    cleaned_files := cleaned_files_array;
    
    RETURN NEXT;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_storage_urls()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Limpiar URLs obsoletas en productos
  UPDATE public.products
  SET image_url = NULL
  WHERE image_url LIKE '%temp%' OR image_url = '';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_audit_log_details(audit_log_id uuid)
 RETURNS TABLE(id uuid, table_name text, record_id uuid, action text, old_values jsonb, new_values jsonb, changed_fields text[], admin_user_email text, "timestamp" timestamp with time zone, description text, can_revert boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.table_name,
    al.record_id,
    al.action,
    al.old_values,
    al.new_values,
    al.changed_fields,
    u.email as admin_user_email,
    al.timestamp,
    al.description,
    CASE
      WHEN al.action = 'UPDATE'
           AND al.old_values IS NOT NULL
           AND al.table_name = 'reservations'
           AND al.changed_fields IS NOT NULL
           AND array_length(al.changed_fields, 1) > 0
      THEN true
      ELSE false
    END as can_revert
  FROM audit_logs al
  LEFT JOIN auth.users u ON al.admin_user_id = u.id
  WHERE al.id = audit_log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_product_images_stats()
 RETURNS TABLE(total_products bigint, products_with_images bigint, products_without_images bigint, total_images bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as products_with_images,
    COUNT(CASE WHEN image_url IS NULL OR image_url = '' THEN 1 END) as products_without_images,
    COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as total_images
  FROM public.products;
$function$
;

CREATE OR REPLACE FUNCTION public.get_product_with_images(product_id uuid)
 RETURNS TABLE(id uuid, name text, description text, base_price numeric, category_id uuid, image_url text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.name,
    p.description,
    p.base_price,
    p.category_id,
    p.image_url,
    p.created_at,
    p.updated_at
  FROM public.products p
  WHERE p.id = product_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_products_with_images()
 RETURNS TABLE(id uuid, name text, description text, base_price numeric, category_id uuid, image_url text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.name,
    p.description,
    p.base_price,
    p.category_id,
    p.image_url,
    p.created_at,
    p.updated_at
  FROM public.products p
  ORDER BY p.created_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_products_with_images(category_uuid uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, category_id uuid, name text, description text, image_url text, base_price numeric, extra_hour_percentage integer, is_active boolean, display_order integer, created_at timestamp with time zone, updated_at timestamp with time zone, images json)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.category_id,
    p.name,
    p.description,
    p.image_url,
    p.base_price,
    p.extra_hour_percentage,
    p.is_active,
    p.display_order,
    p.created_at,
    p.updated_at,
    COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', pi.id,
          'image_url', pi.image_url,
          'display_order', pi.display_order,
          'is_primary', pi.is_primary
        ) ORDER BY pi.display_order
      ) FROM public.product_images pi WHERE pi.product_id = p.id),
      '[]'::json
    ) as images
  FROM public.products p
  WHERE (category_uuid IS NULL OR p.category_id = category_uuid)
  ORDER BY p.display_order, p.name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_reservation_history(reservation_id uuid)
 RETURNS TABLE(audit_id uuid, action text, old_status text, new_status text, admin_user_email text, change_timestamp timestamp with time zone, description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Verificar que el usuario tiene permisos para ver esta reserva
    IF NOT EXISTS (
        SELECT 1 FROM public.reservations 
        WHERE id = reservation_id
        AND (
            user_id = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
    ) THEN
        RAISE EXCEPTION 'No tienes permisos para ver esta reserva';
    END IF;

    RETURN QUERY
    SELECT 
        al.id as audit_id,
        al.action,
        COALESCE(al.old_values->>'status', 'N/A') as old_status,
        COALESCE(al.new_values->>'status', 'N/A') as new_status,
        al.admin_user_email,
        al.timestamp as change_timestamp,
        COALESCE(al.description, 'Sin descripción') as description
    FROM public.audit_logs al
    WHERE al.table_name = 'reservations'
    AND al.record_id = reservation_id::TEXT
    ORDER BY al.timestamp DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_storage_stats()
 RETURNS TABLE(bucket_name text, total_files bigint, total_size bigint, avg_file_size bigint, oldest_file timestamp with time zone, newest_file timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    b.name as bucket_name,
    COUNT(o.id) as total_files,
    COALESCE(SUM((o.metadata->>'size')::bigint), 0) as total_size,
    COALESCE(AVG((o.metadata->>'size')::bigint), 0) as avg_file_size,
    MIN(o.created_at) as oldest_file,
    MAX(o.created_at) as newest_file
  FROM storage.buckets b
  LEFT JOIN storage.objects o ON b.id = o.bucket_id
  GROUP BY b.id, b.name
  ORDER BY b.name;
$function$
;

CREATE OR REPLACE FUNCTION public.get_storage_url(bucket_name text, file_path text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN bucket_name = 'product-images' OR bucket_name = 'category-images' THEN
        'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/public/' || bucket_name || '/' || file_path
      ELSE
        'https://rwgxdtfuzpdukaguogyh.supabase.co/storage/v1/object/authenticated/' || bucket_name || '/' || file_path
    END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_system_settings_for_user()
 RETURNS TABLE(setting_key character varying, setting_value text, setting_type character varying, description text, is_public boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Si es administrador, devolver todas las configuraciones
    IF public.is_admin_user() THEN
        RETURN QUERY
        SELECT 
            ss.setting_key,
            ss.setting_value,
            ss.setting_type,
            ss.description,
            ss.is_public,
            ss.created_at,
            ss.updated_at
        FROM public.system_settings ss
        ORDER BY ss.setting_key;
    ELSE
        -- Si es usuario autenticado, devolver solo configuraciones públicas
        RETURN QUERY
        SELECT 
            ss.setting_key,
            ss.setting_value,
            ss.setting_type,
            ss.description,
            ss.is_public,
            ss.created_at,
            ss.updated_at
        FROM public.system_settings ss
        WHERE ss.is_public = true
        ORDER BY ss.setting_key;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_email(user_id_param uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id_param;
    
    RETURN user_email;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.insert_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Insert a new profile linked to the newly created user
    INSERT INTO public.profiles (user_id, first_name, last_name)
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'first_name', 
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_user_profile(user_id_param uuid, first_name_param text, last_name_param text, phone_param text DEFAULT NULL::text, address_param text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, phone, address)
    VALUES (user_id_param, first_name_param, last_name_param, phone_param, address_param)
    ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin')
$function$
;

CREATE OR REPLACE FUNCTION public.is_public_setting(setting_key_param character varying)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT is_public FROM public.system_settings WHERE setting_key = setting_key_param
$function$
;

CREATE OR REPLACE FUNCTION public.revert_reservation_change(reservation_id uuid, audit_log_id uuid, admin_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    audit_record RECORD;
    current_reservation RECORD;
    reverted_data JSONB;
    old_values JSONB;
    new_values JSONB;
    changed_fields TEXT[];
    field_name TEXT;
    field_value TEXT;
BEGIN
    -- Verificar que el usuario es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = admin_user_id 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Usuario no autorizado para realizar reversiones';
    END IF;
    
    -- Obtener el registro de auditoría específico
    SELECT * INTO audit_record
    FROM public.audit_logs
    WHERE id = audit_log_id
    AND table_name = 'reservations'
    AND record_id = reservation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registro de auditoría no encontrado';
    END IF;
    
    -- Obtener el estado actual de la reserva
    SELECT * INTO current_reservation
    FROM public.reservations
    WHERE id = reservation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reserva no encontrada';
    END IF;
    
    -- Preparar los valores para la reversión
    old_values = audit_record.old_values;
    new_values = audit_record.new_values;
    changed_fields = audit_record.changed_fields;
    
    -- Crear objeto con los valores actuales
    reverted_data = to_jsonb(current_reservation);
    
    -- Revertir cada campo que cambió
    FOREACH field_name IN ARRAY changed_fields
    LOOP
        -- Obtener el valor anterior del campo
        field_value = old_values->>field_name;
        
        -- Actualizar el valor en el objeto de reversión
        reverted_data = jsonb_set(reverted_data, ARRAY[field_name], to_jsonb(field_value));
    END LOOP;
    
    -- Actualizar la reserva con los valores revertidos
    UPDATE public.reservations
    SET 
        event_date = (reverted_data->>'event_date')::DATE,
        event_time = (reverted_data->>'event_time')::TIME,
        event_address = reverted_data->>'event_address',
        zone_id = CASE 
            WHEN reverted_data->>'zone_id' IS NULL OR reverted_data->>'zone_id' = 'null' 
            THEN NULL 
            ELSE (reverted_data->>'zone_id')::UUID 
        END,
        phone = reverted_data->>'phone',
        adult_count = (reverted_data->>'adult_count')::INTEGER,
        child_count = (reverted_data->>'child_count')::INTEGER,
        comments = reverted_data->>'comments',
        rain_reschedule = reverted_data->>'rain_reschedule',
        subtotal = (reverted_data->>'subtotal')::DECIMAL(10,2),
        transport_cost = (reverted_data->>'transport_cost')::DECIMAL(10,2),
        total = (reverted_data->>'total')::DECIMAL(10,2),
        status = reverted_data->>'status',
        payment_proof_url = reverted_data->>'payment_proof_url',
        updated_at = now()
    WHERE id = reservation_id;
    
    -- Registrar la reversión en el log de auditoría
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields,
        admin_user_id,
        description
    ) VALUES (
        'reservations',
        reservation_id,
        'REVERT',
        to_jsonb(current_reservation),
        reverted_data,
        changed_fields,
        admin_user_id,
        'Reversión de cambio realizado por admin'
    );
    
    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Cambio revertido correctamente',
        'reverted_fields', changed_fields,
        'audit_log_id', audit_log_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.revert_reservation_status(reservation_id uuid, target_status text, admin_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_status TEXT;
    audit_record RECORD;
BEGIN
    -- Verificar que el usuario es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = admin_user_id 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Usuario no autorizado';
    END IF;
    
    -- Obtener estado actual
    SELECT status INTO current_status
    FROM public.reservations
    WHERE id = reservation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reserva no encontrada';
    END IF;
    
    -- Buscar el registro de auditoría más reciente con el estado objetivo
    SELECT * INTO audit_record
    FROM public.audit_logs
    WHERE table_name = 'reservations'
    AND record_id = reservation_id
    AND action = 'UPDATE'
    AND new_values->>'status' = target_status
    ORDER BY timestamp DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró historial para el estado solicitado';
    END IF;
    
    -- Revertir al estado anterior
    UPDATE public.reservations
    SET 
        status = target_status,
        updated_at = now()
    WHERE id = reservation_id;
    
    -- Registrar la reversión en el log de auditoría
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields,
        admin_user_id,
        description
    ) VALUES (
        'reservations',
        reservation_id,
        'UPDATE',
        jsonb_build_object('status', current_status),
        jsonb_build_object('status', target_status),
        ARRAY['status'],
        admin_user_id,
        'Reversión manual de estado: ' || current_status || ' → ' || target_status
    );
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_admin_context(user_id uuid, user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Verificar que los parámetros no sean nulos
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'user_id no puede ser nulo';
    END IF;
    
    IF user_email IS NULL OR user_email = '' THEN
        RAISE EXCEPTION 'user_email no puede ser nulo o vacío';
    END IF;
    
    -- Verificar que el usuario existe
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_id
    ) THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;
    
    -- Verificar que el usuario es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_id 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Usuario no tiene permisos de administrador';
    END IF;
    
    -- Establecer el contexto de admin
    PERFORM set_config('app.admin_user_id', user_id::TEXT, false);
    PERFORM set_config('app.admin_user_email', user_email, false);
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log del error
        RAISE NOTICE 'Error al establecer contexto de admin: %', SQLERRM;
        -- Re-lanzar el error
        RAISE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_admin_context_simple(user_id uuid, user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Establecer el contexto sin verificaciones adicionales
    PERFORM set_config('app.admin_user_id', user_id::TEXT, false);
    PERFORM set_config('app.admin_user_email', user_email, false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_storage_connection()
 RETURNS TABLE(bucket_name text, is_accessible boolean, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  bucket_record RECORD;
  test_file_path TEXT;
  test_result BOOLEAN;
BEGIN
  FOR bucket_record IN 
    SELECT id, name FROM storage.buckets 
    WHERE public = true
  LOOP
    test_file_path := 'test-connection-' || gen_random_uuid()::text || '.txt';
    
    BEGIN
      -- Intentar insertar un archivo de prueba
      INSERT INTO storage.objects (bucket_id, name, metadata)
      VALUES (bucket_record.id, test_file_path, '{"test": true}'::jsonb);
      
      -- Si llega aquí, la inserción fue exitosa
      test_result := true;
      
      -- Limpiar el archivo de prueba
      DELETE FROM storage.objects 
      WHERE bucket_id = bucket_record.id AND name = test_file_path;
      
    EXCEPTION WHEN OTHERS THEN
      test_result := false;
    END;
    
    bucket_name := bucket_record.name;
    is_accessible := test_result;
    error_message := CASE WHEN test_result THEN NULL ELSE 'Error de conexión al bucket' END;
    
    RETURN NEXT;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_business_hours(hours_json text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Verificar que el usuario es administrador
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden actualizar horarios de negocio';
    END IF;
    
    -- Validar el formato JSON
    IF NOT public.validate_business_hours(hours_json) THEN
        RAISE EXCEPTION 'Formato de horarios inválido';
    END IF;
    
    -- Actualizar la configuración
    UPDATE public.system_settings
    SET setting_value = hours_json,
        updated_at = NOW()
    WHERE setting_key = 'business_hours';
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_contact_messages_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set an explicit, empty search path to prevent path mutations
    SET search_path = '';
    
    -- Your existing function logic here
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_modified_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.modified = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_system_setting_secure(setting_key_param character varying, setting_value_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Verificar que el usuario es administrador
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden actualizar configuraciones del sistema';
    END IF;
    
    -- Actualizar la configuración
    UPDATE public.system_settings
    SET setting_value = setting_value_param,
        updated_at = NOW()
    WHERE setting_key = setting_key_param;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_business_hours(hours_json text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    parsed_json JSONB;
    day_record RECORD;
    day_name TEXT;
    day_data JSONB;
BEGIN
    -- Intentar parsear el JSON
    BEGIN
        parsed_json := hours_json::JSONB;
    EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
    END;
    
    -- Verificar que es un objeto
    IF jsonb_typeof(parsed_json) != 'object' THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar cada día
    FOR day_record IN SELECT * FROM jsonb_each(parsed_json)
    LOOP
        day_name := day_record.key;
        day_data := day_record.value;
        
        -- Verificar que el día tiene la estructura correcta
        IF NOT (day_data ? 'open' AND day_data ? 'close' AND day_data ? 'enabled') THEN
            RETURN FALSE;
        END IF;
        
        -- Verificar que enabled es booleano
        IF jsonb_typeof(day_data->'enabled') != 'boolean' THEN
            RETURN FALSE;
        END IF;
        
        -- Si está habilitado, verificar que tiene horarios válidos
        IF (day_data->>'enabled')::boolean THEN
            IF NOT (day_data ? 'open' AND day_data ? 'close') THEN
                RETURN FALSE;
            END IF;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_reservation_total()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.total = NEW.subtotal + COALESCE(NEW.transport_cost, 0);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'customer');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Crear perfil automáticamente
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Asignar rol de customer por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = _role
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_email_sent(email_type_param character varying, recipient_email_param character varying, recipient_name_param character varying, subject_param character varying, content_param text, metadata_param jsonb DEFAULT '{}'::jsonb, related_reservation_id_param uuid DEFAULT NULL::uuid, related_contact_message_id_param uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.email_logs (
        email_type,
        recipient_email,
        recipient_name,
        subject,
        content,
        metadata,
        related_reservation_id,
        related_contact_message_id
    ) VALUES (
        email_type_param,
        recipient_email_param,
        recipient_name_param,
        subject_param,
        content_param,
        metadata_param,
        related_reservation_id_param,
        related_contact_message_id_param
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."configuracion" to "anon";

grant insert on table "public"."configuracion" to "anon";

grant references on table "public"."configuracion" to "anon";

grant select on table "public"."configuracion" to "anon";

grant trigger on table "public"."configuracion" to "anon";

grant truncate on table "public"."configuracion" to "anon";

grant update on table "public"."configuracion" to "anon";

grant delete on table "public"."configuracion" to "authenticated";

grant insert on table "public"."configuracion" to "authenticated";

grant references on table "public"."configuracion" to "authenticated";

grant select on table "public"."configuracion" to "authenticated";

grant trigger on table "public"."configuracion" to "authenticated";

grant truncate on table "public"."configuracion" to "authenticated";

grant update on table "public"."configuracion" to "authenticated";

grant delete on table "public"."configuracion" to "service_role";

grant insert on table "public"."configuracion" to "service_role";

grant references on table "public"."configuracion" to "service_role";

grant select on table "public"."configuracion" to "service_role";

grant trigger on table "public"."configuracion" to "service_role";

grant truncate on table "public"."configuracion" to "service_role";

grant update on table "public"."configuracion" to "service_role";

grant delete on table "public"."resources" to "anon";

grant insert on table "public"."resources" to "anon";

grant references on table "public"."resources" to "anon";

grant select on table "public"."resources" to "anon";

grant trigger on table "public"."resources" to "anon";

grant truncate on table "public"."resources" to "anon";

grant update on table "public"."resources" to "anon";

grant delete on table "public"."resources" to "authenticated";

grant insert on table "public"."resources" to "authenticated";

grant references on table "public"."resources" to "authenticated";

grant select on table "public"."resources" to "authenticated";

grant trigger on table "public"."resources" to "authenticated";

grant truncate on table "public"."resources" to "authenticated";

grant update on table "public"."resources" to "authenticated";

grant delete on table "public"."resources" to "service_role";

grant insert on table "public"."resources" to "service_role";

grant references on table "public"."resources" to "service_role";

grant select on table "public"."resources" to "service_role";

grant trigger on table "public"."resources" to "service_role";

grant truncate on table "public"."resources" to "service_role";

grant update on table "public"."resources" to "service_role";

create policy "Admins can delete availabilities"
on "public"."availabilities"
as permissive
for delete
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can insert availabilities"
on "public"."availabilities"
as permissive
for insert
to public
with check (has_role(auth.uid(), 'admin'::text));


create policy "Admins can update availabilities"
on "public"."availabilities"
as permissive
for update
to public
using (has_role(auth.uid(), 'admin'::text))
with check (has_role(auth.uid(), 'admin'::text));


create policy "Permitir insert a usuarios autenticados"
on "public"."availabilities"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Permitir lectura a usuarios autenticados"
on "public"."availabilities"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Permitir actualizar items propios"
on "public"."cart_items"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Permitir eliminar items propios"
on "public"."cart_items"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Permitir insertar items propios"
on "public"."cart_items"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Permitir leer items propios"
on "public"."cart_items"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Admins can delete categories"
on "public"."categories"
as permissive
for delete
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can insert categories"
on "public"."categories"
as permissive
for insert
to public
with check (has_role(auth.uid(), 'admin'::text));


create policy "Admins can update categories"
on "public"."categories"
as permissive
for update
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can view all categories"
on "public"."categories"
as permissive
for select
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins pueden modificar configuracion"
on "public"."configuracion"
as permissive
for all
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins full access email config"
on "public"."email_config"
as permissive
for all
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "public_read_email_config"
on "public"."email_config"
as permissive
for select
to public
using (true);


create policy "Admins can insert email logs"
on "public"."email_logs"
as permissive
for insert
to public
with check (has_role(auth.uid(), 'admin'::text));


create policy "Admins can update email logs"
on "public"."email_logs"
as permissive
for update
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can view all email logs"
on "public"."email_logs"
as permissive
for select
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins full access email templates"
on "public"."email_templates"
as permissive
for all
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "public_read_email_templates"
on "public"."email_templates"
as permissive
for select
to public
using (true);


create policy "Admin can Create Products"
on "public"."products"
as permissive
for insert
to supabase_auth_admin
with check (true);


create policy "Admins can delete products"
on "public"."products"
as permissive
for delete
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can insert products"
on "public"."products"
as permissive
for insert
to public
with check (has_role(auth.uid(), 'admin'::text));


create policy "Admins can update products"
on "public"."products"
as permissive
for update
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can view all products"
on "public"."products"
as permissive
for select
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admin can delete"
on "public"."profiles"
as permissive
for delete
to supabase_admin
using (true);


create policy "Usuarios pueden leer su propio perfil"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "admin can insert"
on "public"."profiles"
as permissive
for insert
to authenticated
with check (true);


create policy "Admins can delete reservation items"
on "public"."reservation_items"
as permissive
for delete
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can update all reservation items"
on "public"."reservation_items"
as permissive
for update
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Users can delete their own reservation items"
on "public"."reservation_items"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM reservations
  WHERE ((reservations.id = reservation_items.reservation_id) AND (reservations.user_id = auth.uid())))));


create policy "Users can view their reservation items"
on "public"."reservation_items"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM reservations
  WHERE ((reservations.id = reservation_items.reservation_id) AND (reservations.user_id = auth.uid())))));


create policy "Admins can delete reservations"
on "public"."reservations"
as permissive
for delete
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can insert reservations"
on "public"."reservations"
as permissive
for insert
to public
with check (has_role(auth.uid(), 'admin'::text));


create policy "Users can delete their own reservations"
on "public"."reservations"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "Users can insert"
on "public"."reservations"
as permissive
for insert
to public
with check (true);


create policy "Users can select"
on "public"."reservations"
as permissive
for select
to public
using (true);


create policy "Users can view own reservations"
on "public"."reservations"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (user_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));


create policy "users can update"
on "public"."reservations"
as permissive
for update
to public
using (true)
with check (true);


create policy "Resources visible to all authenticated users"
on "public"."resources"
as permissive
for select
to authenticated
using (((is_available = true) OR (owner_id = auth.uid())));


create policy "Users can create their own resources"
on "public"."resources"
as permissive
for insert
to public
with check ((owner_id = auth.uid()));


create policy "Users can delete their own resources"
on "public"."resources"
as permissive
for delete
to public
using ((owner_id = auth.uid()));


create policy "Users can update their own resources"
on "public"."resources"
as permissive
for update
to public
using ((owner_id = auth.uid()))
with check ((owner_id = auth.uid()));


create policy "Admins full access system settings"
on "public"."system_settings"
as permissive
for all
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Authenticated read public settings"
on "public"."system_settings"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND (is_public = true)));


create policy "Admins can view audit_log"
on "public"."audit_log"
as permissive
for select
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can manage availabilities"
on "public"."availabilities"
as permissive
for all
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can manage categories"
on "public"."categories"
as permissive
for all
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can delete all contact messages"
on "public"."contact_messages"
as permissive
for delete
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can update all contact messages"
on "public"."contact_messages"
as permissive
for update
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can view all contact messages"
on "public"."contact_messages"
as permissive
for select
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can manage products"
on "public"."products"
as permissive
for all
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can view all profiles"
on "public"."profiles"
as permissive
for select
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can insert all reservation items"
on "public"."reservation_items"
as permissive
for insert
to public
with check (has_role(auth.uid(), 'admin'::text));


create policy "Admins can view all reservation items"
on "public"."reservation_items"
as permissive
for select
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can update all reservations"
on "public"."reservations"
as permissive
for update
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can view all reservations"
on "public"."reservations"
as permissive
for select
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can manage user roles"
on "public"."user_roles"
as permissive
for all
to public
using (has_role(auth.uid(), 'admin'::text));


create policy "Admins can view all user roles"
on "public"."user_roles"
as permissive
for select
to public
using (has_role(auth.uid(), 'admin'::text));


CREATE TRIGGER trigger_update_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION update_contact_messages_updated_at();

CREATE TRIGGER log_reservation_changes AFTER UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION log_reservation_change();

CREATE TRIGGER set_user_email_on_reservation BEFORE INSERT ON public.reservations FOR EACH ROW EXECUTE FUNCTION add_user_email_to_reservation();

CREATE TRIGGER update_resources_modtime BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION update_modified_column();


