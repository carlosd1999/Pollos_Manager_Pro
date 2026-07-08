# Gestión Avícola (Pollos Manager Pro)

Web app responsive (mobile first) para administrar ciclos productivos, lotes, mortalidad, gastos, ventas, clientes y analítica histórica para negocio avícola.

## Stack

- React + Vite
- Supabase (PostgreSQL, Auth, RLS)
- Recharts (dashboard)
- jsPDF + xlsx (exportaciones)
- PWA con manifest + service worker

## Configuración inicial

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env` desde el ejemplo:

```bash
cp .env.example .env
```

3. Completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

4. Ejecutar las migraciones SQL en Supabase (ver `docs/MIGRACIONES.md`).

5. Levantar el proyecto:

```bash
npm run dev
```

## Autenticación y permisos

- Login con Supabase Auth (email/contraseña).
- Cada usuario tiene su dataset o acceso como invitado al negocio del owner.
- RLS restringe lectura/escritura por `user_id` y reglas de invitados.
- Módulo **Admin**: invitar usuarios y habilitar pestañas por persona.
- Rol **admin**: venta al contado, eliminar ventas, reparto entre socias.
- Usuarios no admin: apartados, editar peso y registrar abonos.

## Módulos

| Módulo | Descripción |
|--------|-------------|
| Dashboard | KPIs financieros, mortalidad y pendientes operativos (sin pesar, sin entregar, cobro pendiente) |
| Ventas | Apartados/ventas, abonos, preferencia de pollo, marcar entregado, filtros y reparto por lote |
| Gastos | Gastos por ciclo; compra de pollos crea/actualiza lotes automáticamente |
| Mortalidad | Registro por lote |
| Clientes | Datos de contacto y preferencia de tamaño de pollo |
| Ciclos | Abrir/cerrar ciclos y ver disponibilidad por lote |
| Reportes | Export PDF/Excel con métricas de pendientes |

## Migraciones SQL

El orden completo está en [`docs/MIGRACIONES.md`](docs/MIGRACIONES.md).

Para funciones recientes (preferencia de pollo, entregado):

```bash
# Ejecutar en SQL Editor de Supabase
supabase-cliente-preferencia-venta-entregado.sql
```

## Iconos PWA

```bash
npm run generate:pwa-icons
```

Genera los PNG en `public/` desde `public/favicon.svg`.

## Automatización de negocio

- Gasto **Compra de Pollos**: crea ciclo/lote según reglas (máx. 6 lotes por ciclo).
- Validación de stock: no se venden más pollos que los disponibles en el lote.
- Mortalidad reduce disponibilidad y afecta rentabilidad.
- Edición de compra de pollos actualiza cantidad, precio y fecha del lote vinculado.
