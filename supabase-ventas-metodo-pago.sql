-- Forma de pago al registrar venta al contado (abonos ya tenían metodo_pago).
alter table public.ventas add column if not exists metodo_pago text;

comment on column public.ventas.metodo_pago is 'efectivo | transferencia | sinpe (venta al contado)';
