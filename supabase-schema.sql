create table if not exists users (
  id bigint generated always as identity primary key,
  auth_user_id uuid unique,
  nombre text,
  email text,
  created_at timestamptz default now()
);

create table if not exists ciclos (
  id bigint generated always as identity primary key,
  numero int not null,
  fecha_inicio date not null,
  fecha_cierre date,
  estado text default 'activo',
  created_at timestamptz default now()
);

create table if not exists lotes (
  id bigint generated always as identity primary key,
  ciclo_id bigint references ciclos(id) on delete cascade,
  numero_lote int not null,
  fecha_ingreso date not null,
  cantidad_comprada int not null,
  precio_compra numeric(12,2) not null,
  precio_unitario numeric(12,2),
  semana_ciclo int,
  estado text default 'activo',
  created_at timestamptz default now()
);

create table if not exists clientes (
  id bigint generated always as identity primary key,
  nombre text not null,
  telefono text,
  direccion text,
  created_at timestamptz default now()
);

create table if not exists gastos (
  id bigint generated always as identity primary key,
  fecha date not null,
  monto numeric(12,2) not null,
  categoria text not null,
  detalle text,
  metodo_pago text,
  ciclo_id bigint references ciclos(id),
  lote_id bigint references lotes(id),
  created_at timestamptz default now()
);

create table if not exists ventas (
  id bigint generated always as identity primary key,
  fecha date not null,
  cliente_id bigint references clientes(id),
  ciclo_id bigint references ciclos(id),
  lote_id bigint references lotes(id),
  cantidad int not null,
  peso_total numeric(12,2),
  peso_promedio numeric(12,2),
  precio_kg numeric(12,2),
  total_venta numeric(12,2) not null,
  metodo_pago text,
  monto_cancelado numeric(12,2) default 0,
  saldo_pendiente numeric(12,2) default 0,
  estado_pago text default 'pendiente',
  venta_al_contado boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists abonos (
  id bigint generated always as identity primary key,
  venta_id bigint references ventas(id) on delete cascade,
  fecha date not null,
  monto numeric(12,2) not null,
  metodo_pago text,
  observaciones text,
  created_at timestamptz default now()
);

create table if not exists mortalidad (
  id bigint generated always as identity primary key,
  fecha date not null,
  lote_id bigint references lotes(id) on delete cascade,
  cantidad int not null,
  motivo text,
  observaciones text,
  created_at timestamptz default now()
);

create table if not exists configuracion (
  id bigint generated always as identity primary key,
  clave text unique not null,
  valor jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create index if not exists idx_lotes_ciclo on lotes(ciclo_id);
create index if not exists idx_gastos_ciclo on gastos(ciclo_id);
create index if not exists idx_ventas_lote on ventas(lote_id);
create index if not exists idx_mortalidad_lote on mortalidad(lote_id);
