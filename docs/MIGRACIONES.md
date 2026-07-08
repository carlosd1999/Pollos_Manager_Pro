# Migraciones SQL (Supabase)

Ejecutá estos scripts **en orden** en el SQL Editor de Supabase (proyecto nuevo o actualización incremental).

## Instalación desde cero

1. `supabase-schema.sql` — tablas base  
2. `supabase-auth-rls.sql` — `user_id` y RLS por usuario  
3. `supabase-ventas-metodo-pago.sql` — método de pago en ventas  
4. `supabase-ventas-venta-al-contado.sql` — flag venta al contado  
5. `supabase-lote-reparto-pagos.sql` — reparto entre socias por lote  
6. `supabase-access-control.sql` — perfiles, invitados y permisos por módulo  
7. `supabase-shared-dataset-rls.sql` — dataset compartido del negocio (owner + invitados)  
8. `supabase-shared-dataset-trigger-hotfix.sql` — trigger de `user_id` (si aplica)  
9. `supabase-rls-invitee-timeout-hotfix.sql` — rendimiento RLS invitados (opcional pero recomendado)  
10. `supabase-cliente-preferencia-venta-entregado.sql` — preferencia de pollo y entregado  
11. `supabase-grant-admin-role.sql` — asignar admin a tu usuario (editar email en el script)

## Solo actualizar un proyecto existente

Si ya tenés la app en producción, ejecutá **solo** los scripts que aún no corriste. Los más recientes:

- `supabase-cliente-preferencia-venta-entregado.sql` — necesario para preferencia de pollo y marcar entregas

## Verificación rápida

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'clientes' and column_name = 'preferencia_pollo';

select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'ventas' and column_name = 'entregado';
```

Ambas consultas deben devolver una fila.
