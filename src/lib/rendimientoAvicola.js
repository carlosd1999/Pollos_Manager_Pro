/**
 * Referencias orientativas para pollos de engorde (inicio + desarrollo, sacrificio ~6–7 semanas).
 * No sustituye asesoría zootechnica; sirve para comparar tendencias en reportes.
 */
export const REFERENCIA_SACRIFICIO_SEMANAS = { min: 6, tipico: 7, max: 8 };

export const REFERENCIA_SACRIFICIO_DIAS = {
  min: REFERENCIA_SACRIFICIO_SEMANAS.min * 7,
  tipico: REFERENCIA_SACRIFICIO_SEMANAS.tipico * 7,
  max: REFERENCIA_SACRIFICIO_SEMANAS.max * 7,
};

export const REFERENCIA_PESO_KG = {
  /** Peso vivo orientativo a ~7 semanas con manejo estándar tropical. */
  semana7: { bajo: 2.0, normal: 2.35, bueno: 2.55 },
  /** Ganancia diaria de peso vivo (gramos/día). */
  gananciaDiariaG: { bajo: 38, normal: 48, bueno: 55 },
};

/**
 * Evalúa peso promedio vs días en galera (compra → venta).
 * El nivel se basa en g/día (peso y días van ligados: g/día = peso×1000/días).
 * @returns {{ dias: number, gananciaDiariaG: number, pesoPromedioKg: number, nivel: 'bajo'|'normal'|'bueno', nota: string } | null}
 */
export function evaluarPesoVsEdad(pesoPromedioKg, diasEnGalera) {
  const peso = Number(pesoPromedioKg);
  const dias = Number(diasEnGalera);
  if (!Number.isFinite(peso) || peso <= 0 || !Number.isFinite(dias) || dias <= 0) return null;

  const gananciaDiariaG = (peso * 1000) / dias;
  const ref = REFERENCIA_PESO_KG;
  const refDias = REFERENCIA_SACRIFICIO_DIAS;
  const gDia = Math.round(gananciaDiariaG);
  const diasRed = Math.round(dias);
  const pesoStr = peso.toFixed(2);

  let nivel = 'normal';
  let nota = `Ganancia habitual (${gDia} g/día); peso prom. ${pesoStr} kg a los ${diasRed} días.`;

  if (gananciaDiariaG < ref.gananciaDiariaG.bajo) {
    nivel = 'bajo';
    nota = `Ganancia baja (${gDia} g/día; ref. ≥${ref.gananciaDiariaG.bajo}); peso prom. ${pesoStr} kg a los ${diasRed} días.`;
  } else if (gananciaDiariaG >= ref.gananciaDiariaG.bueno) {
    nivel = 'bueno';
    nota = `Buena ganancia (${gDia} g/día); peso prom. ${pesoStr} kg a los ${diasRed} días.`;
  }

  if (dias < refDias.min) {
    nota += ` Sacrificio temprano (ref. ~${refDias.tipico} días); el peso puede subir si esperás un poco más.`;
  } else if (dias > refDias.max && gananciaDiariaG < ref.gananciaDiariaG.normal) {
    nivel = 'bajo';
    nota = `Lote largo (${diasRed} días) con ganancia modesta (${gDia} g/día); conviene sacrificar antes o revisar manejo.`;
  } else if (dias > refDias.max) {
    nota += ` Ciclo extendido (${diasRed} días); vigilá conversión de alimento.`;
  }

  return { dias, gananciaDiariaG, pesoPromedioKg: peso, nivel, nota };
}

export function labelNivelRendimiento(nivel) {
  switch (nivel) {
    case 'bueno':
      return 'Bueno';
    case 'bajo':
      return 'Bajo';
    default:
      return 'Normal';
  }
}
