-- Módulo «Dieta» (alimentacion) en permisos de usuario.
-- Ejecutar en Supabase SQL Editor si ya tenés user_module_access creada.

alter table public.user_module_access drop constraint if exists user_module_access_module_key_check;

alter table public.user_module_access add constraint user_module_access_module_key_check check (
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
);

-- Habilitar Dieta para socias que ya tienen acceso a operaciones (ajustá user_id si hace falta).
-- insert into public.user_module_access (user_id, module_key, enabled)
-- select user_id, 'alimentacion', true from public.user_module_access where module_key = 'ventas' and enabled = true
-- on conflict (user_id, module_key) do update set enabled = excluded.enabled;
