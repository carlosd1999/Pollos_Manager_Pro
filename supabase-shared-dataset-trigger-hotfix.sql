-- Hotfix: permitir que la Edge Function invite-user (service_role) actualice data_owner_id.
-- Ejecuta esto en el SQL Editor si ya aplicaste supabase-shared-dataset-rls.sql sin esta lógica.

create or replace function public.profiles_guard_data_owner_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.data_owner_id is distinct from old.data_owner_id then
    if coalesce(auth.jwt()->>'role', '') = 'service_role'
      or coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '') = 'service_role' then
      return new;
    end if;
    if not public.is_app_admin() then
      raise exception 'Solo un administrador puede cambiar el negocio compartido (data_owner_id).';
    end if;
  end if;
  return new;
end;
$$;
