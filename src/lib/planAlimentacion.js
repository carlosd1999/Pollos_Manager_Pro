import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';

/** Ciclo orientativo: ingreso martes (día 1), sacrificio viernes (día 46). */
export const PLAN_ALIMENTACION_DEFAULT = {
  diasCiclo: 46,
  diaIngresoSemana: 2, // 0=dom … 2=martes
};

/** Dosis del plan original (vitaminas / desparasitación). */
export const REFERENCIA_POLLOS_MEDICACION = 20;

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Resumen por semana del lote (referencia 20 pollos). */
export const RESUMEN_MEDICACION_SEMANAL = [
  { semana: 1, texto: 'Martes a sábado: Microvit 2 g/día' },
  { semana: 2, texto: 'Viernes y sábado: Microvit 4 g/día' },
  { semana: 3, texto: 'Jueves y viernes: Microvit 6 g/día' },
  { semana: 4, texto: 'Miércoles: Levamisol 8 g (1 vez). Viernes y sábado: Microvit 8 g/día' },
  { semana: 5, texto: 'Viernes y sábado: Microvit 10 g/día. Transición a Pollo Final (días 32–34)' },
  { semana: 6, texto: 'Desde día 35: Pollo Final y melaza en agua día por medio' },
  { semana: 7, texto: 'Melaza día por medio hasta día 45; sacrificio día 46' },
];

/**
 * Microvit (g/día) y Levamisol por día del lote.
 * Ajustado a ingreso martes (el plan en papel usaba semanas con días nombrados).
 */
const MICROVIT_GRAMOS_POR_DIA = {
  1: 2,
  2: 2,
  3: 2,
  4: 2,
  5: 2,
  11: 4,
  12: 4,
  17: 6,
  18: 6,
  26: 8,
  27: 8,
  32: 10,
  33: 10,
};

const LEVAMISOL_DIA = 24;
const LEVAMISOL_GRAMOS = 8;
export { LEVAMISOL_DIA, LEVAMISOL_GRAMOS };
/** Melaza día por medio desde día 35 hasta día 45. */
export const MELAZA_DESDE_DIA = 35;
export const MELAZA_HASTA_DIA = 45;

export const AGUA_MELAZA_ALTERNADA =
  'Melaza día por medio alternando con agua limpia';

function esDiaMelaza(dia) {
  const d = Number(dia);
  if (d < MELAZA_DESDE_DIA || d > MELAZA_HASTA_DIA) return false;
  return (d - MELAZA_DESDE_DIA) % 2 === 0;
}

export function estaEnFaseMelazaAlternada(dia) {
  const d = Number(dia);
  return d >= MELAZA_DESDE_DIA && d <= MELAZA_HASTA_DIA;
}

/** Días con melaza en el ciclo (para recordatorios). */
export function diasMelazaEnCiclo(diasCiclo = PLAN_ALIMENTACION_DEFAULT.diasCiclo) {
  const dias = [];
  const hasta = Math.min(MELAZA_HASTA_DIA, Number(diasCiclo) || MELAZA_HASTA_DIA);
  for (let d = MELAZA_DESDE_DIA; d <= hasta; d += 1) {
    if (esDiaMelaza(d)) dias.push(d);
  }
  return dias;
}

function claveAguaParaAgrupar(dia, agua) {
  if (estaEnFaseMelazaAlternada(dia)) return AGUA_MELAZA_ALTERNADA;
  return agua;
}

export function semanaDelLote(dia) {
  return Math.ceil(Number(dia) / 7);
}

/** Día 1 = martes; los siguientes días siguen el calendario semanal. */
export function diaSemanaDesdeDiaLote(dia) {
  const idx = (PLAN_ALIMENTACION_DEFAULT.diaIngresoSemana + Number(dia) - 1) % 7;
  return DIAS_SEMANA[idx];
}

export function escalarGramosMedicacion(gramos, pollos = REFERENCIA_POLLOS_MEDICACION) {
  const g = Number(gramos);
  const p = Number(pollos);
  if (!Number.isFinite(g) || !Number.isFinite(p) || p <= 0) return gramos;
  const scaled = (g * p) / REFERENCIA_POLLOS_MEDICACION;
  return Math.round(scaled * 10) / 10;
}

export function concentradoParaDia(dia) {
  const d = Number(dia);
  if (d <= 18) return 'Pollo Inicio 100%';
  if (d >= 19 && d <= 21) return 'Inicio 50% + Crecimiento 50%';
  if (d <= 31) return 'Pollo Crecimiento 100%';
  if (d >= 32 && d <= 34) return 'Crecimiento 50% + Final 50%';
  if (d <= 45) return 'Pollo Final 100%';
  if (d === 46) return 'Pollo Final 100% · Sacrificio';
  return '—';
}

export function aguaParaDia(dia, pollos = REFERENCIA_POLLOS_MEDICACION) {
  const d = Number(dia);

  if (d === LEVAMISOL_DIA) {
    const g = escalarGramosMedicacion(LEVAMISOL_GRAMOS, pollos);
    return `Levamisol 10% — ${g} g en agua`;
  }

  if (esDiaMelaza(d)) {
    return 'Melaza en agua (día por medio)';
  }

  const microG = MICROVIT_GRAMOS_POR_DIA[d];
  if (microG != null) {
    const g = escalarGramosMedicacion(microG, pollos);
    return `Microvit — ${g} g/día`;
  }

  return 'Agua limpia';
}

export function manejoParaDia(dia) {
  const d = Number(dia);
  const sem = semanaDelLote(d);
  const partes = ['Renovar comederos (alimento fresco cada día)'];
  if (sem === 1) partes.push('Sem. 1: calor / arranque');
  else if (sem === 2) partes.push('Sem. 2: poca luz nocturna');
  else if (sem >= 3 && sem <= 7) partes.push('Luz nocturna');
  if (esDiaMelaza(d)) partes.push('Melaza en agua (día por medio)');
  if (d === 46) partes.push('Sacrificio / venta (viernes)');
  return partes.join(' · ');
}

export function formatoRangoDias(diaInicio, diaFin) {
  const a = Number(diaInicio);
  const b = Number(diaFin);
  if (a === b) return `Día ${a} (${diaSemanaDesdeDiaLote(a)})`;
  return `Días ${a} – ${b} (${diaSemanaDesdeDiaLote(a)} a ${diaSemanaDesdeDiaLote(b)})`;
}

/** Partes para mostrar período con días de semana en negrita (UI / PDF). */
export function partesRangoDias(diaInicio, diaFin) {
  const a = Number(diaInicio);
  const b = Number(diaFin);
  if (a === b) {
    return {
      prefijo: `Día ${a} `,
      diasSemana: `(${diaSemanaDesdeDiaLote(a)})`,
    };
  }
  return {
    prefijo: `Días ${a} – ${b} `,
    diasSemana: `(${diaSemanaDesdeDiaLote(a)} a ${diaSemanaDesdeDiaLote(b)})`,
  };
}

/** Agrupa días consecutivos con el mismo concentrado y agua (o fase melaza alternada). */
export function agruparFilasPlan(filas) {
  if (!filas?.length) return [];

  const grupos = [];
  let cur = {
    diaInicio: filas[0].dia,
    diaFin: filas[0].dia,
    concentrado: filas[0].concentrado,
    agua: claveAguaParaAgrupar(filas[0].dia, filas[0].agua),
    manejo: filas[0].manejo,
    esSacrificio: Boolean(filas[0].esSacrificio),
  };

  const pushCur = () => {
    const semA = semanaDelLote(cur.diaInicio);
    const semB = semanaDelLote(cur.diaFin);
    grupos.push({
      ...cur,
      diasLabel: formatoRangoDias(cur.diaInicio, cur.diaFin),
      semanasLabel: semA === semB ? `Sem. ${semA}` : `Sem. ${semA} – ${semB}`,
    });
  };

  for (let i = 1; i < filas.length; i += 1) {
    const f = filas[i];
    const aguaF = claveAguaParaAgrupar(f.dia, f.agua);
    if (f.concentrado === cur.concentrado && aguaF === cur.agua) {
      cur.diaFin = f.dia;
      cur.esSacrificio = cur.esSacrificio || Boolean(f.esSacrificio);
    } else {
      pushCur();
      cur = {
        diaInicio: f.dia,
        diaFin: f.dia,
        concentrado: f.concentrado,
        agua: aguaF,
        manejo: f.manejo,
        esSacrificio: Boolean(f.esSacrificio),
      };
    }
  }
  pushCur();
  return grupos;
}

/** Metadatos de fase para UI y PDF. */
export const FASE_PLAN = {
  inicio: { label: 'Inicio', short: 'INI' },
  transicion: { label: 'Transición', short: 'MIX' },
  crecimiento: { label: 'Crecimiento', short: 'CRE' },
  final: { label: 'Final', short: 'FIN' },
  sacrificio: { label: 'Sacrificio', short: 'SAC' },
};

export function fasePlanFila(row) {
  if (row?.esSacrificio) return 'sacrificio';
  const c = String(row?.concentrado || '');
  if (c.includes('50%')) return 'transicion';
  if (c.includes('Inicio')) return 'inicio';
  if (c.includes('Crecimiento 100%')) return 'crecimiento';
  if (c.includes('Final')) return 'final';
  return 'inicio';
}

export function tipoAguaFila(row) {
  const a = String(row?.agua || '');
  if (a.includes('Levamisol')) return 'levamisol';
  if (a === AGUA_MELAZA_ALTERNADA || a.includes('alternando')) return 'melaza-alternada';
  if (a.includes('Melaza')) return 'melaza';
  if (a.includes('Microvit')) return 'microvit';
  if (a.includes('sacrificio')) return 'sacrificio';
  return 'limpia';
}

export const RECORDATORIOS_ENCARGADO = [
  {
    id: 'comederos',
    titulo: 'Comederos',
    texto: 'Renovar cada día. Alimento fresco siempre disponible.',
  },
  {
    id: 'luz',
    titulo: 'Luz y temperatura',
    texto: 'Sem. 1–2: calor. Sem. 3–7: luz nocturna.',
  },
  {
    id: 'mezclas',
    titulo: 'No mezclar el mismo día',
    texto: 'Microvit, Levamisol y melaza van en días distintos.',
  },
  {
    id: 'transicion',
    titulo: 'Cambio de concentrado',
    texto: 'Mezcla 50% – 50% durante 3 días (días 19 – 21 y 32 – 34).',
  },
];

const PDF_FASE_RGB = {
  inicio: { fill: [216, 243, 220] },
  transicion: { fill: [254, 243, 209] },
  crecimiento: { fill: [224, 242, 254] },
  final: { fill: [237, 233, 254] },
  sacrificio: { fill: [254, 226, 226] },
};

const PDF_BRAND = {
  dark: [27, 67, 50],
  mid: [45, 106, 79],
  light: [241, 250, 238],
  text: [26, 46, 36],
  muted: [92, 111, 99],
  border: [184, 201, 184],
  white: [255, 255, 255],
};

/**
 * Plan general del ciclo (sin fechas ni lote).
 * @param {{ diasCiclo?: number, pollosReferencia?: number }} [opts]
 */
export function generarPlanAlimentacion(opts = {}) {
  const diasCiclo = Number(opts.diasCiclo) || PLAN_ALIMENTACION_DEFAULT.diasCiclo;
  const pollosReferencia = Number(opts.pollosReferencia) || REFERENCIA_POLLOS_MEDICACION;

  const filas = [];
  for (let dia = 1; dia <= diasCiclo; dia += 1) {
    filas.push({
      dia,
      semana: semanaDelLote(dia),
      diaSemana: diaSemanaDesdeDiaLote(dia),
      concentrado: concentradoParaDia(dia),
      agua: aguaParaDia(dia, pollosReferencia),
      manejo: manejoParaDia(dia),
      esSacrificio: dia === diasCiclo,
    });
  }

  return {
    filas,
    filasResumen: agruparFilasPlan(filas),
    meta: {
      diasCiclo,
      pollosReferencia,
      marca: 'Ciclón / El Colono',
    },
  };
}

function pdfRgb(doc, [r, g, b]) {
  doc.setFillColor(r, g, b);
  doc.setDrawColor(r, g, b);
}

function pdfTextRgb(doc, [r, g, b]) {
  doc.setTextColor(r, g, b);
}

function pdfRowLines(doc, texts, widths, pad = 2) {
  const lineH = 3.8;
  let maxLines = 1;
  const wrapped = texts.map((text, i) => {
    const lines = doc.splitTextToSize(String(text || ''), widths[i] - pad * 2);
    maxLines = Math.max(maxLines, lines.length);
    return lines;
  });
  return { wrapped, rowH: Math.max(8, maxLines * lineH + 4), lineH };
}

function pdfDrawTitle(doc, plan, margin, pageW, compact = false) {
  if (!compact) {
    pdfRgb(doc, PDF_BRAND.dark);
    doc.rect(0, 0, pageW, 24, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(17);
    pdfTextRgb(doc, PDF_BRAND.white);
    doc.text('Plan de alimentación — Pollos de engorde', margin, 11);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9.5);
    doc.text(
      `Ciclo de ${plan.meta.diasCiclo} días  ·  Día 1 = martes  ·  Sacrificio día ${plan.meta.diasCiclo} (viernes)`,
      margin,
      18,
    );
    pdfTextRgb(doc, PDF_BRAND.text);
    return 32;
  }

  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  pdfTextRgb(doc, PDF_BRAND.dark);
  doc.text('Plan de alimentación — Pollos de engorde', margin, 14);
  doc.setFont(undefined, 'normal');
  pdfTextRgb(doc, PDF_BRAND.text);
  return 20;
}

function pdfDrawPageFrame(doc, margin, pageW, pageH) {
  doc.setDrawColor(...PDF_BRAND.border);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin - 3, margin - 3, pageW - margin * 2 + 6, pageH - margin * 2 + 6, 3, 3, 'S');
}

function pdfDrawColLines(doc, x0, cols, yTop, yBottom) {
  doc.setDrawColor(...PDF_BRAND.border);
  doc.setLineWidth(0.12);
  let x = x0;
  for (let i = 1; i < cols.length; i += 1) {
    x += cols[i - 1].w;
    doc.line(x, yTop, x, yBottom);
  }
}

function pdfSemanaLabel(row) {
  const semA = semanaDelLote(row.diaInicio);
  const semB = semanaDelLote(row.diaFin);
  return semA === semB ? `Sem. ${semA}` : `Sem. ${semA}–${semB}`;
}

function pdfDrawSemana(doc, row, x, colW, ty) {
  doc.setFont(undefined, 'normal');
  doc.text(pdfSemanaLabel(row), x + colW / 2, ty, { align: 'center' });
}

function pdfDrawPeriodo(doc, row, x, ty) {
  const { prefijo, diasSemana } = partesRangoDias(row.diaInicio, row.diaFin);
  const pad = 3;
  doc.setFont(undefined, 'normal');
  doc.text(prefijo, x + pad, ty);
  doc.setFont(undefined, 'bold');
  doc.text(diasSemana, x + pad + doc.getTextWidth(prefijo), ty);
  doc.setFont(undefined, 'normal');
}

/**
 * @param {{ plan: ReturnType<typeof generarPlanAlimentacion> }} opts
 */
export function exportarPlanAlimentacionPDF({ plan }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerH = 10;
  const contentW = pageW - margin * 2;

  const colSemanaW = 32;
  const colPeriodoW = 56;
  const colConcentradoW = 74;
  const cols = [
    { label: 'Semana', w: colSemanaW, align: 'center' },
    { label: 'Período', w: colPeriodoW, align: 'left' },
    { label: 'Concentrado', w: colConcentradoW, align: 'left' },
    { label: 'Agua', w: contentW - colSemanaW - colPeriodoW - colConcentradoW, align: 'left' },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const x0 = margin;
  let pageNum = 0;

  const startPage = (compact) => {
    pageNum += 1;
    if (pageNum > 1) doc.addPage();
    pdfDrawPageFrame(doc, margin, pageW, pageH);
    let y = pdfDrawTitle(doc, plan, margin, pageW, compact);
    y += 4;
    return y;
  };

  let y = startPage(false);
  let tableTopY = y;

  const drawTableHeader = () => {
    const headerH = 9;
    tableTopY = y;
    pdfRgb(doc, PDF_BRAND.mid);
    doc.rect(x0, y, tableW, headerH, 'F');
    doc.setFontSize(9.5);
    doc.setFont(undefined, 'bold');
    pdfTextRgb(doc, PDF_BRAND.white);
    let x = x0;
    cols.forEach((c) => {
      const tx = c.align === 'center' ? x + c.w / 2 : x + 3;
      doc.text(c.label, tx, y + 6, { align: c.align === 'center' ? 'center' : 'left' });
      x += c.w;
    });
    doc.setDrawColor(...PDF_BRAND.border);
    doc.setLineWidth(0.2);
    doc.rect(x0, y, tableW, headerH, 'S');
    pdfDrawColLines(doc, x0, cols, y, y + headerH);
    doc.setFont(undefined, 'normal');
    y += headerH;
  };

  drawTableHeader();

  plan.filasResumen.forEach((row) => {
    const fase = fasePlanFila(row);
    const colors = PDF_FASE_RGB[fase] || PDF_FASE_RGB.inicio;
    const cells = [pdfSemanaLabel(row), row.diasLabel, row.concentrado, row.agua];
    const wrapWidths = cols.map((c) => c.w);
    wrapWidths[0] = 80;
    const { wrapped, rowH, lineH } = pdfRowLines(doc, cells, wrapWidths, 3);

    if (y + rowH > pageH - margin - footerH) {
      doc.setDrawColor(...PDF_BRAND.border);
      doc.setLineWidth(0.2);
      doc.rect(x0, tableTopY, tableW, y - tableTopY, 'S');
      y = startPage(true);
      drawTableHeader();
    }

    const rowY = y;
    pdfRgb(doc, colors.fill);
    doc.rect(x0, rowY, tableW, rowH, 'F');

    doc.setDrawColor(...PDF_BRAND.border);
    doc.setLineWidth(0.15);
    doc.line(x0, rowY + rowH, x0 + tableW, rowY + rowH);
    pdfDrawColLines(doc, x0, cols, rowY, rowY + rowH);

    doc.setFontSize(8.5);
    pdfTextRgb(doc, PDF_BRAND.text);
    let x = x0;
    wrapped.forEach((lines, i) => {
      const col = cols[i];
      if (i === 0) {
        pdfDrawSemana(doc, row, x, col.w, rowY + 5);
        x += col.w;
        return;
      }
      if (i === 1) {
        pdfDrawPeriodo(doc, row, x, rowY + 5);
        x += col.w;
        return;
      }
      lines.forEach((ln, li) => {
        const ty = rowY + 5 + li * lineH;
        doc.setFont(undefined, 'normal');
        if (col.align === 'center') {
          doc.text(ln, x + col.w / 2, ty, { align: 'center' });
        } else {
          doc.text(ln, x + 3, ty);
        }
      });
      x += col.w;
    });
    y += rowH;
  });

  doc.setDrawColor(...PDF_BRAND.border);
  doc.setLineWidth(0.2);
  doc.rect(x0, tableTopY, tableW, y - tableTopY, 'S');

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    pdfTextRgb(doc, PDF_BRAND.muted);
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text(dayjs().format('DD/MM/YYYY'), pageW / 2, pageH - margin + 2, { align: 'center' });
    if (totalPages > 1) {
      doc.text(`Página ${p} de ${totalPages}`, pageW - margin, pageH - margin + 2, { align: 'right' });
    }
    pdfTextRgb(doc, PDF_BRAND.text);
  }

  doc.save(`plan-alimentacion-${dayjs().format('YYYYMMDD-HHmm')}.pdf`);
}
