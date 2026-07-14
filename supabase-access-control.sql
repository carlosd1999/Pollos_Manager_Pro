-- Pollos Manager: perfiles, permisos por módulo e invitaciones (admin).
-- Ejecuta este script en el SQL Editor de Supabase después de supabase-schema.sql y supabase-auth-rls.sql.
-- Datos compartidos invitado ↔ admin: después ejecuta también supabase-shared-dataset-rls.sql.
--
-- Pasos recomendados en Authentication > Settings:
-- - Desactiva "Enable sign ups" (solo el admin invita desde la app / función).
-- - Añade la URL de tu app en "Redirect URLs" (invitación y recuperación de contraseña).
--
-- Administrador:
--   A) En Authentication → Users → App Metadata: { "role": "admin" }
--   B) O ejecuta supabase-grant-admin-role.sql (actualiza auth + profiles).
-- public.profiles.is_admin se sincroniza desde auth.users.raw_app_meta_data
-- (trigger al crear/actualizar usuario). Las políticas RLS usan profiles.is_admin.

-- ---------------------------------------------------------------------------
-- 1) Tablas primero (is_app_admin() y las políticas las referencian)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  is_admin boolean not null default false,
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists is_admin boolean not null default false;

create table if not exists public.user_module_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  enabled boolean not null default false,
  primary key (user_id, module_key),
  constraint user_module_access_module_key_check check (
    module_key in (
      'dashboard',
      'ventas',
      'gastos',
      'mortalidad',
      'clientes',
      'ciclos',
      'alimentacion',
      'reportes'
    )
  )
);

create index if not exists idx_user_module_access_user on public.user_module_access(user_id);

alter table public.profiles enable row level security;
alter table public.user_module_access enable row level security;

-- ---------------------------------------------------------------------------
-- 2) Función admin (requiere que public.profiles ya exista)
-- ---------------------------------------------------------------------------

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin is true
  );
$$;

grant execute on function public.is_app_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Políticas RLS
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_app_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "module_access_select_own_or_admin" on public.user_module_access;
create policy "module_access_select_own_or_admin" on public.user_module_access
  for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists "module_access_admin_insert" on public.user_module_access;
create policy "module_access_admin_insert" on public.user_module_access
  for insert to authenticated
  with check (public.is_app_admin());

drop policy if exists "module_access_admin_update" on public.user_module_access;
create policy "module_access_admin_update" on public.user_module_access
  for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "module_access_admin_delete" on public.user_module_access;
create policy "module_access_admin_delete" on public.user_module_access
  for delete to authenticated
  using (public.is_app_admin());

-- ---------------------------------------------------------------------------
-- 4) Trigger: sincronizar auth.users → public.profiles
-- ---------------------------------------------------------------------------

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_is_admin boolean;
begin
  v_name := coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''), '');
  v_is_admin := coalesce(trim(lower(coalesce(new.raw_app_meta_data->>'role', ''))), '') = 'admin';
  insert into public.profiles (id, email, full_name, is_admin)
  values (
    new.id,
    coalesce(new.email, ''),
    v_name,
    v_is_admin
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case
      when excluded.full_name <> '' then excluded.full_name
      else public.profiles.full_name
    end,
    is_admin = excluded.is_admin,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_auth_user_profile();

drop trigger if exists on_auth_user_updated_profile on auth.users;
create trigger on_auth_user_updated_profile
  after update of email, raw_user_meta_data, raw_app_meta_data on auth.users
  for each row execute function public.handle_auth_user_profile();

-- ---------------------------------------------------------------------------
-- 5) Datos iniciales / backfill
-- ---------------------------------------------------------------------------

insert into public.profiles (id, email, full_name, is_admin)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), ''), ''),
  (coalesce(trim(lower(coalesce(u.raw_app_meta_data->>'role', ''))), '') = 'admin')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

insert into public.user_module_access (user_id, module_key, enabled)
select u.id, m.k, true
from auth.users u
cross join (
  values
    ('dashboard'),
    ('ventas'),
    ('gastos'),
    ('mortalidad'),
    ('clientes'),
    ('ciclos'),
    ('reportes')
) as m(k)
where coalesce(trim(lower(coalesce(u.raw_app_meta_data->>'role', ''))), '') <> 'admin'
  and not exists (select 1 from public.user_module_access x where x.user_id = u.id);

update public.profiles p
set is_admin = (
    coalesce(trim(lower(coalesce(u.raw_app_meta_data->>'role', ''))), '') = 'admin'
  ),
  updated_at = now()
from auth.users u
where u.id = p.id;
