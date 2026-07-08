-- Preferencia de tamaño de pollo en clientes y marcado de entrega en ventas.
-- Ejecutar en Supabase SQL Editor.

alter table public.clientes
  add column if not exists preferencia_pollo text;

alter table public.ventas
  add column if not exists entregado boolean not null default false;

comment on column public.clientes.preferencia_pollo is
  'grande (+2.5 kg), mediano (2.2-2.5 kg), pequeno (<2.2 kg)';

comment on column public.ventas.entregado is
  'true cuando la venta/apartado ya fue entregado al cliente';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clientes_preferencia_pollo_check'
  ) then
    alter table public.clientes
      add constraint clientes_preferencia_pollo_check
      check (
        preferencia_pollo is null
        or preferencia_pollo in ('grande', 'mediano', 'pequeno')
      );
  end if;
end $$;

create index if not exists idx_ventas_entregado on public.ventas (entregado);
