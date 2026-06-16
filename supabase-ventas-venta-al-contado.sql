-- Ventas al contado sin usar tabla `abonos`: permite distinguirlas al recalcular cobro cuando no hay filas de abonos.
alter table public.ventas add column if not exists venta_al_contado boolean not null default false;

-- Ventas ya pagadas al contado sin abonos registrados
update public.ventas v
set venta_al_contado = true
where not exists (select 1 from public.abonos a where a.venta_id = v.id)
  and coalesce(v.total_venta, 0) > 0
  and v.estado_pago = 'pagado'
  and coalesce(v.saldo_pendiente, 0) <= 0.01
  and coalesce(v.monto_cancelado, 0) >= coalesce(v.total_venta, 0) - 0.01;
