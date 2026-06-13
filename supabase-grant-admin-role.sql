-- Otorgar rol admin sin depender del editor de Supabase (SQL Editor).
-- Requiere haber aplicado supabase-access-control.sql (columna public.profiles.is_admin).
-- 1) Cambia el correo por el tuyo (en ambos UPDATE).
-- 2) Ejecuta todo el bloque.
-- 3) Cierra sesión en la app y vuelve a entrar (o recarga con sesión nueva).

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
where lower(trim(email)) = lower(trim('tu-correo@ejemplo.com'));

-- Mantener public.profiles alineado (por si el trigger aún no actualizó is_admin)
update public.profiles p
set is_admin = true,
    updated_at = now()
from auth.users u
where u.id = p.id
  and lower(trim(u.email)) = lower(trim('tu-correo@ejemplo.com'));
