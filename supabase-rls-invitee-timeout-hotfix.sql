-- Hotfix: timeouts (PostgreSQL 57014) al entrar como usuario invitado con dataset compartido.
--
-- Causa habitual: my_data_owner_id() era SECURITY INVOKER; al leer public.profiles dentro
-- de la función se volvían a evaluar las políticas RLS de profiles (p. ej. is_app_admin() →
-- otra subconsulta a profiles). Eso encadena trabajo por cada fila comprobada en ventas,
-- ciclos, etc. y puede disparar "canceling statement due to statement timeout".
--
-- Solución: SECURITY DEFINER + búsqueda por PK (solo la fila auth.uid()). La función solo
-- devuelve data_owner_id del usuario actual; no expone otras filas.
--
-- Ejecuta en el SQL Editor de Supabase (una vez). No sustituye supabase-shared-dataset-rls.sql;
-- solo reemplaza la función y añade índices útiles para SELECT * … ORDER BY id DESC bajo RLS.

create or replace function public.my_data_owner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select pr.data_owner_id from public.profiles pr where pr.id = auth.uid() limit 1),
    auth.uid()
  );
$$;

revoke all on function public.my_data_owner_id() from public;
grant execute on function public.my_data_owner_id() to authenticated;

-- Ayuda al planificador: filtro RLS user_id = … + orden por id (fetchTable en la app).
create index if not exists idx_ciclos_user_id_id_desc on public.ciclos (user_id, id desc);
create index if not exists idx_lotes_user_id_id_desc on public.lotes (user_id, id desc);
create index if not exists idx_clientes_user_id_id_desc on public.clientes (user_id, id desc);
create index if not exists idx_gastos_user_id_id_desc on public.gastos (user_id, id desc);
create index if not exists idx_ventas_user_id_id_desc on public.ventas (user_id, id desc);
create index if not exists idx_abonos_user_id_id_desc on public.abonos (user_id, id desc);
create index if not exists idx_mortalidad_user_id_id_desc on public.mortalidad (user_id, id desc);
