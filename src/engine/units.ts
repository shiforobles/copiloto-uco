/**
 * Helpers de unidades y formateo numérico.
 */

/** Convierte mg a µg */
export function mgToUg(mg: number): number {
  return mg * 1000;
}

/** Convierte µg a mg */
export function ugToMg(ug: number): number {
  return ug / 1000;
}

/**
 * Calcula la concentración en µg/mL a partir de mg totales y volumen.
 * @param mgTotal mg de droga en la dilución
 * @param volumeMl volumen total de la dilución en mL
 * @returns concentración en µg/mL
 */
export function calculateConcentration(mgTotal: number, volumeMl: number): number {
  if (volumeMl <= 0) {
    throw new Error('El volumen debe ser mayor a 0 mL');
  }
  return (mgTotal * 1000) / volumeMl;
}

/**
 * Formatea un número para display clínico.
 * @param value Número a formatear
 * @param decimals Cantidad de decimales (default: 1)
 * @returns String formateado con la cantidad de decimales solicitada
 */
export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Formatea un resultado con su unidad para display.
 * @param value Valor numérico
 * @param unit Unidad
 * @param decimals Decimales para el valor
 */
export function formatWithUnit(value: number, unit: string, decimals: number = 1): string {
  return `${formatNumber(value, decimals)} ${unit}`;
}
