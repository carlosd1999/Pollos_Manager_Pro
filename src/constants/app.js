import dayjs from 'dayjs';

export const TABLES = [
  'ciclos',
  'lotes',
  'mortalidad',
  'gastos',
  'ventas',
  'clientes',
  'abonos',
  'lote_reparto_pagos',
];

/** Pestañas principales (orden en barra de navegación). */
export const MAIN_TABS = ['dashboard', 'ventas', 'gastos', 'mortalidad', 'clientes', 'ciclos', 'reportes'];

export const TAB_LABELS = {
  dashboard: 'Inicio',
  ventas: 'Ventas',
  gastos: 'Gastos',
  mortalidad: 'Mortalidad',
  clientes: 'Clientes',
  ciclos: 'Ciclos',
  reportes: 'Reportes',
  admin: 'Usuarios',
};

export function createInitialForm() {
  const today = dayjs().format('YYYY-MM-DD');
  return {
    gasto: {
      fecha: today,
      monto: '',
      categoria: 'Alimento',
      detalle: '',
      cantidad_pollos: '',
      ciclo_id: '',
    },
    venta: {
      fecha: today,
      cliente_id: '',
      lote_id: '',
      cantidad: '',
      peso_total: '',
      precio_kg: '2500',
      total_redondeado: '',
      metodo_pago: '',
      pagoCompleto: false,
      primerAbono: '',
    },
    mortalidad: { fecha: today, lote_id: '', cantidad: '', motivo: '' },
    cliente: { nombre: '', telefono: '', direccion: '' },
  };
}
