-- Reparto por lote: objetivo de gastos a descontar + pagos registrados (gastos y cada socia).
-- Ejecutar en Supabase SQL Editor después de las migraciones de auth/RLS compartido.

alter table public.lotes add column if not exists reparto_gastos_objetivo numeric(12,2);

create table if not exists public.lote_reparto_pagos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  lote_id bigint not null references public.lotes(id) on delete cascade,
  bucket text not null check (bucket in ('gastos', 'carmen', 'cherania', 'carlos')),
  monto numeric(12,2) not null check (monto > 0),
  fecha date not null default (current_date),
  observaciones text,
  created_at timestamptz default now()
);

create index if not exists idx_lote_reparto_pagos_lote on public.lote_reparto_pagos(lote_id);
create index if not exists idx_lote_reparto_pagos_user_lote on public.lote_reparto_pagos(user_id, lote_id);

alter table public.lote_reparto_pagos enable row level security;

drop policy if exists "lote_reparto_pagos_owner_select" on public.lote_reparto_pagos;
drop policy if exists "lote_reparto_pagos_owner_insert" on public.lote_reparto_pagos;
drop policy if exists "lote_reparto_pagos_owner_update" on public.lote_reparto_pagos;
drop policy if exists "lote_reparto_pagos_owner_delete" on public.lote_reparto_pagos;

create policy "lote_reparto_pagos_owner_select" on public.lote_reparto_pagos for select to authenticated
  using (user_id = public.my_data_owner_id());
create policy "lote_reparto_pagos_owner_insert" on public.lote_reparto_pagos for insert to authenticated
  with check (user_id = public.my_data_owner_id());
create policy "lote_reparto_pagos_owner_update" on public.lote_reparto_pagos for update to authenticated
  using (user_id = public.my_data_owner_id()) with check (user_id = public.my_data_owner_id());
create policy "lote_reparto_pagos_owner_delete" on public.lote_reparto_pagos for delete to authenticated
  using (user_id = public.my_data_owner_id());

create index if not exists idx_lote_reparto_pagos_user_id_id_desc on public.lote_reparto_pagos (user_id, id desc);
