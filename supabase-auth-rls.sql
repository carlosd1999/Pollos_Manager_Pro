alter table public.ciclos add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.lotes add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.clientes add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.gastos add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.ventas add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.abonos add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.mortalidad add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists idx_ciclos_user_id on public.ciclos(user_id);
create index if not exists idx_lotes_user_id on public.lotes(user_id);
create index if not exists idx_clientes_user_id on public.clientes(user_id);
create index if not exists idx_gastos_user_id on public.gastos(user_id);
create index if not exists idx_ventas_user_id on public.ventas(user_id);
create index if not exists idx_abonos_user_id on public.abonos(user_id);
create index if not exists idx_mortalidad_user_id on public.mortalidad(user_id);

alter table public.ciclos enable row level security;
alter table public.lotes enable row level security;
alter table public.clientes enable row level security;
alter table public.gastos enable row level security;
alter table public.ventas enable row level security;
alter table public.abonos enable row level security;
alter table public.mortalidad enable row level security;

drop policy if exists "ciclos_owner_select" on public.ciclos;
drop policy if exists "ciclos_owner_insert" on public.ciclos;
drop policy if exists "ciclos_owner_update" on public.ciclos;
drop policy if exists "ciclos_owner_delete" on public.ciclos;
create policy "ciclos_owner_select" on public.ciclos for select to authenticated using (auth.uid() = user_id);
create policy "ciclos_owner_insert" on public.ciclos for insert to authenticated with check (auth.uid() = user_id);
create policy "ciclos_owner_update" on public.ciclos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ciclos_owner_delete" on public.ciclos for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "lotes_owner_select" on public.lotes;
drop policy if exists "lotes_owner_insert" on public.lotes;
drop policy if exists "lotes_owner_update" on public.lotes;
drop policy if exists "lotes_owner_delete" on public.lotes;
create policy "lotes_owner_select" on public.lotes for select to authenticated using (auth.uid() = user_id);
create policy "lotes_owner_insert" on public.lotes for insert to authenticated with check (auth.uid() = user_id);
create policy "lotes_owner_update" on public.lotes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lotes_owner_delete" on public.lotes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "clientes_owner_select" on public.clientes;
drop policy if exists "clientes_owner_insert" on public.clientes;
drop policy if exists "clientes_owner_update" on public.clientes;
drop policy if exists "clientes_owner_delete" on public.clientes;
create policy "clientes_owner_select" on public.clientes for select to authenticated using (auth.uid() = user_id);
create policy "clientes_owner_insert" on public.clientes for insert to authenticated with check (auth.uid() = user_id);
create policy "clientes_owner_update" on public.clientes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "clientes_owner_delete" on public.clientes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "gastos_owner_select" on public.gastos;
drop policy if exists "gastos_owner_insert" on public.gastos;
drop policy if exists "gastos_owner_update" on public.gastos;
drop policy if exists "gastos_owner_delete" on public.gastos;
create policy "gastos_owner_select" on public.gastos for select to authenticated using (auth.uid() = user_id);
create policy "gastos_owner_insert" on public.gastos for insert to authenticated with check (auth.uid() = user_id);
create policy "gastos_owner_update" on public.gastos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "gastos_owner_delete" on public.gastos for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "ventas_owner_select" on public.ventas;
drop policy if exists "ventas_owner_insert" on public.ventas;
drop policy if exists "ventas_owner_update" on public.ventas;
drop policy if exists "ventas_owner_delete" on public.ventas;
create policy "ventas_owner_select" on public.ventas for select to authenticated using (auth.uid() = user_id);
create policy "ventas_owner_insert" on public.ventas for insert to authenticated with check (auth.uid() = user_id);
create policy "ventas_owner_update" on public.ventas for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ventas_owner_delete" on public.ventas for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "abonos_owner_select" on public.abonos;
drop policy if exists "abonos_owner_insert" on public.abonos;
drop policy if exists "abonos_owner_update" on public.abonos;
drop policy if exists "abonos_owner_delete" on public.abonos;
create policy "abonos_owner_select" on public.abonos for select to authenticated using (auth.uid() = user_id);
create policy "abonos_owner_insert" on public.abonos for insert to authenticated with check (auth.uid() = user_id);
create policy "abonos_owner_update" on public.abonos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "abonos_owner_delete" on public.abonos for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "mortalidad_owner_select" on public.mortalidad;
drop policy if exists "mortalidad_owner_insert" on public.mortalidad;
drop policy if exists "mortalidad_owner_update" on public.mortalidad;
drop policy if exists "mortalidad_owner_delete" on public.mortalidad;
create policy "mortalidad_owner_select" on public.mortalidad for select to authenticated using (auth.uid() = user_id);
create policy "mortalidad_owner_insert" on public.mortalidad for insert to authenticated with check (auth.uid() = user_id);
create policy "mortalidad_owner_update" on public.mortalidad for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mortalidad_owner_delete" on public.mortalidad for delete to authenticated using (auth.uid() = user_id);
