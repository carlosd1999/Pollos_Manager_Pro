-- Pollos Manager: datos compartidos del negocio (mismo lote de filas user_id) para invitados.
-- Ejecuta en el SQL Editor de Supabase DESPUÉS de supabase-auth-rls.sql y supabase-access-control.sql.
--
-- Resumen: profiles.data_owner_id apunta al auth.users.id "dueño" de ciclos/ventas/etc.
-- Por defecto data_owner_id = id (cada usuario solo ve lo suyo). Al invitar, la Edge Function
-- pone data_owner_id = id del admin, así el invitado ve y escribe en el mismo dataset (mismo user_id en filas).

-- ---------------------------------------------------------------------------
-- 1) Columna en perfiles
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists data_owner_id uuid references auth.users(id);

update public.profiles p
set data_owner_id = p.id
where p.data_owner_id is null;

-- ---------------------------------------------------------------------------
-- 2) Helper para RLS (dueño efectivo del dataset)
-- ---------------------------------------------------------------------------

create or replace function public.my_data_owner_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    (select pr.data_owner_id from public.profiles pr where pr.id = auth.uid()),
    auth.uid()
  );
$$;

grant execute on function public.my_data_owner_id() to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Políticas: filas donde user_id = dueño del dataset (no solo auth.uid())
-- ---------------------------------------------------------------------------

drop policy if exists "ciclos_owner_select" on public.ciclos;
drop policy if exists "ciclos_owner_insert" on public.ciclos;
drop policy if exists "ciclos_owner_update" on public.ciclos;
drop policy if exists "ciclos_owner_delete" on public.ciclos;
create policy "ciclos_owner_select" on public.ciclos for select to authenticated using (user_id = public.my_data_owner_id());
create policy "ciclos_owner_insert" on public.ciclos for insert to authenticated with check (user_id = public.my_data_owner_id());
create policy "ciclos_owner_update" on public.ciclos for update to authenticated using (user_id = public.my_data_owner_id()) with check (user_id = public.my_data_owner_id());
create policy "ciclos_owner_delete" on public.ciclos for delete to authenticated using (user_id = public.my_data_owner_id());

drop policy if exists "lotes_owner_select" on public.lotes;
drop policy if exists "lotes_owner_insert" on public.lotes;
drop policy if exists "lotes_owner_update" on public.lotes;
drop policy if exists "lotes_owner_delete" on public.lotes;
create policy "lotes_owner_select" on public.lotes for select to authenticated using (user_id = public.my_data_owner_id());
create policy "lotes_owner_insert" on public.lotes for insert to authenticated with check (user_id = public.my_data_owner_id());
create policy "lotes_owner_update" on public.lotes for update to authenticated using (user_id = public.my_data_owner_id()) with check (user_id = public.my_data_owner_id());
create policy "lotes_owner_delete" on public.lotes for delete to authenticated using (user_id = public.my_data_owner_id());

drop policy if exists "clientes_owner_select" on public.clientes;
drop policy if exists "clientes_owner_insert" on public.clientes;
drop policy if exists "clientes_owner_update" on public.clientes;
drop policy if exists "clientes_owner_delete" on public.clientes;
create policy "clientes_owner_select" on public.clientes for select to authenticated using (user_id = public.my_data_owner_id());
create policy "clientes_owner_insert" on public.clientes for insert to authenticated with check (user_id = public.my_data_owner_id());
create policy "clientes_owner_update" on public.clientes for update to authenticated using (user_id = public.my_data_owner_id()) with check (user_id = public.my_data_owner_id());
create policy "clientes_owner_delete" on public.clientes for delete to authenticated using (user_id = public.my_data_owner_id());

drop policy if exists "gastos_owner_select" on public.gastos;
drop policy if exists "gastos_owner_insert" on public.gastos;
drop policy if exists "gastos_owner_update" on public.gastos;
drop policy if exists "gastos_owner_delete" on public.gastos;
create policy "gastos_owner_select" on public.gastos for select to authenticated using (user_id = public.my_data_owner_id());
create policy "gastos_owner_insert" on public.gastos for insert to authenticated with check (user_id = public.my_data_owner_id());
create policy "gastos_owner_update" on public.gastos for update to authenticated using (user_id = public.my_data_owner_id()) with check (user_id = public.my_data_owner_id());
create policy "gastos_owner_delete" on public.gastos for delete to authenticated using (user_id = public.my_data_owner_id());

drop policy if exists "ventas_owner_select" on public.ventas;
drop policy if exists "ventas_owner_insert" on public.ventas;
drop policy if exists "ventas_owner_update" on public.ventas;
drop policy if exists "ventas_owner_delete" on public.ventas;
create policy "ventas_owner_select" on public.ventas for select to authenticated using (user_id = public.my_data_owner_id());
create policy "ventas_owner_insert" on public.ventas for insert to authenticated with check (user_id = public.my_data_owner_id());
create policy "ventas_owner_update" on public.ventas for update to authenticated using (user_id = public.my_data_owner_id()) with check (user_id = public.my_data_owner_id());
create policy "ventas_owner_delete" on public.ventas for delete to authenticated using (user_id = public.my_data_owner_id());

drop policy if exists "abonos_owner_select" on public.abonos;
drop policy if exists "abonos_owner_insert" on public.abonos;
drop policy if exists "abonos_owner_update" on public.abonos;
drop policy if exists "abonos_owner_delete" on public.abonos;
create policy "abonos_owner_select" on public.abonos for select to authenticated using (user_id = public.my_data_owner_id());
create policy "abonos_owner_insert" on public.abonos for insert to authenticated with check (user_id = public.my_data_owner_id());
create policy "abonos_owner_update" on public.abonos for update to authenticated using (user_id = public.my_data_owner_id()) with check (user_id = public.my_data_owner_id());
create policy "abonos_owner_delete" on public.abonos for delete to authenticated using (user_id = public.my_data_owner_id());

drop policy if exists "mortalidad_owner_select" on public.mortalidad;
drop policy if exists "mortalidad_owner_insert" on public.mortalidad;
drop policy if exists "mortalidad_owner_update" on public.mortalidad;
drop policy if exists "mortalidad_owner_delete" on public.mortalidad;
create policy "mortalidad_owner_select" on public.mortalidad for select to authenticated using (user_id = public.my_data_owner_id());
create policy "mortalidad_owner_insert" on public.mortalidad for insert to authenticated with check (user_id = public.my_data_owner_id());
create policy "mortalidad_owner_update" on public.mortalidad for update to authenticated using (user_id = public.my_data_owner_id()) with check (user_id = public.my_data_owner_id());
create policy "mortalidad_owner_delete" on public.mortalidad for delete to authenticated using (user_id = public.my_data_owner_id());

-- ---------------------------------------------------------------------------
-- 4) Solo administradores (o service_role / Edge Functions) pueden cambiar data_owner_id
-- ---------------------------------------------------------------------------

create or replace function public.profiles_guard_data_owner_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.data_owner_id is distinct from old.data_owner_id then
    -- Cliente con service_role (p. ej. invite-user): auth.uid() es null e is_app_admin() falla.
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

drop trigger if exists profiles_guard_data_owner_change on public.profiles;
create trigger profiles_guard_data_owner_change
  before update on public.profiles
  for each row
  execute function public.profiles_guard_data_owner_change();

-- ---------------------------------------------------------------------------
-- 5) Nuevos perfiles: data_owner_id = propio usuario (hasta que un admin reasigne / invite lo fije)
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
  insert into public.profiles (id, email, full_name, is_admin, data_owner_id)
  values (
    new.id,
    coalesce(new.email, ''),
    v_name,
    v_is_admin,
    new.id
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
