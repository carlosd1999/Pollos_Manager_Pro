# Gestión Avícola

Web app responsive (mobile first) para administrar ciclos productivos, lotes, mortalidad, gastos, ventas y analitica historica para negocio avicola.

## Stack

- React + Vite
- Supabase (DB relacional, Auth y Realtime)
- Recharts (dashboard visual)
- jsPDF + xlsx (exportaciones)
- PWA basica con manifest + service worker

## Iconos PWA (pantalla de inicio / iOS)

Los PNG en `public/` (`pwa-192.png`, `pwa-512.png`, `pwa-512-maskable.png`, `apple-touch-icon.png`) se generan desde `public/favicon.svg`. Si cambias el logo, vuelve a generarlos:

```bash
npm run generate:pwa-icons
```

## Configuracion

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo `.env`:

```bash
cp .env.example .env
```

3. Completa tus credenciales de Supabase.

4. Ejecuta el SQL de `supabase-schema.sql` en el SQL Editor de Supabase.

5. Ejecuta tambien `supabase-auth-rls.sql` para seguridad por usuario (Auth + RLS).

6. Levanta el proyecto:

```bash
npm run dev
```

## Automatizacion implementada

- Al registrar un gasto con categoria `Compra de Pollos`:
  - Si no hay ciclo activo, crea un ciclo y lote 1.
  - Si el ciclo activo tiene menos de 6 lotes, crea el siguiente lote.
  - Si el ciclo activo llega a 6 lotes, lo cierra y crea un nuevo ciclo con lote 1.
- Validacion de ventas para no vender mas pollos de los disponibles por lote.
- Mortalidad impacta disponibilidad de lote y metricas de rentabilidad.

## Modulos incluidos

- Dashboard: KPIs, ganancia por ciclo, gastos por categoria, distribucion gastos.
- Operaciones: registrar gastos, ventas y mortalidad.
- Reportes: exportacion PDF y Excel.
- Vista responsive: bottom nav en movil y pestañas en escritorio.

## Siguientes mejoras recomendadas

- Politicas RLS por usuario autenticado.
- Login completo con Supabase Auth.
- Modulo de filtros inteligentes (30 dias, 3 meses, anual, cliente, categoria).
- Tablas historicas avanzadas y ranking top 10 ciclos.
