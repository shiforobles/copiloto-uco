import type { Dilution } from '../rules/types';

/**
 * Diluciones estándar de la UCO (seeds).
 *
 * TODOS LOS VALORES SON PLACEHOLDERS (verified: false).
 * El médico debe verificar cada dilución contra el protocolo de su unidad.
 */
export const dilutions: Dilution[] = [
  {
    id: 'milrinona',
    nombre: 'Milrinona',
    presentacion: 'ampolla 10 mg/10 mL',
    dilucionEstandar: { mg: 20, volumenML: 250 },
    concentracionUgMl: 80, // 20 mg = 20000 µg / 250 mL = 80 µg/mL
    modoDosis: 'ug_kg_min',
    rango: { min: 0.25, max: 0.75, unidad: 'µg/kg/min' },
    notas: 'Considerar dosis menores en deterioro renal.',
    verified: false,
  },
  {
    id: 'dobutamina',
    nombre: 'Dobutamina',
    presentacion: 'ampolla 250 mg/20 mL',
    dilucionEstandar: { mg: 1000, volumenML: 500 },
    concentracionUgMl: 2000, // 1000 mg = 1000000 µg / 500 mL = 2000 µg/mL
    modoDosis: 'ug_kg_min',
    rango: { min: 2.5, max: 20, unidad: 'µg/kg/min' },
    notas: 'Taquicardia dosis-dependiente. Precaución en FA.',
    verified: false,
  },
  {
    id: 'noradrenalina',
    nombre: 'Noradrenalina',
    presentacion: 'ampolla 8 mg/4 mL',
    dilucionEstandar: { mg: 16, volumenML: 250 },
    concentracionUgMl: 64, // 16 mg = 16000 µg / 250 mL = 64 µg/mL
    modoDosis: 'ug_kg_min',
    rango: { min: 0.05, max: 1.0, unidad: 'µg/kg/min' },
    notas: 'Titular a TAM objetivo. Precaución con extravasación.',
    verified: false,
  },
  {
    id: 'dopamina',
    nombre: 'Dopamina',
    presentacion: 'ampolla 200 mg/5 mL',
    dilucionEstandar: { mg: 800, volumenML: 500 },
    concentracionUgMl: 1600, // 800 mg = 800000 µg / 500 mL = 1600 µg/mL
    modoDosis: 'ug_kg_min',
    rango: { min: 2, max: 20, unidad: 'µg/kg/min' },
    notas: 'Elegir el esquema según indicación y respuesta. Ver ficha de bradicardia para el contexto ACLS.',
    verified: false,
  },
  {
    id: 'nitroglicerina',
    nombre: 'Nitroglicerina',
    presentacion: 'ampolla 50 mg/10 mL',
    dilucionEstandar: { mg: 50, volumenML: 250 },
    concentracionUgMl: 200, // 50 mg = 50000 µg / 250 mL = 200 µg/mL
    modoDosis: 'ug_min',
    rango: { min: 5, max: 200, unidad: 'µg/min' },
    notas: 'Titular según TA y síntomas. Contraindicada con PDE5i.',
    verified: false,
  },
  {
    id: 'adrenalina',
    nombre: 'Adrenalina',
    presentacion: 'ampolla 1 mg/1 mL',
    dilucionEstandar: { mg: 4, volumenML: 250 },
    concentracionUgMl: 16, // 4 mg = 4000 µg / 250 mL = 16 µg/mL
    modoDosis: 'ug_kg_min',
    rango: { min: 0.01, max: 0.5, unidad: 'µg/kg/min' },
    notas: 'Dosis baja (< 0.05): efecto β predominante. Dosis alta (> 0.1): efecto α predominante.',
    verified: false,
  },
  {
    id: 'vasopresina',
    nombre: 'Vasopresina',
    presentacion: 'ampolla 20 U/1 mL',
    dilucionEstandar: { units: 40, volumenML: 100 },
    concentracionUgMl: 0,
    concentracionUPerMl: 0.4, // 40 U / 100 mL = 0.4 U/mL
    modoDosis: 'u_min',
    rango: { min: 0.01, max: 0.04, unidad: 'U/min' },
    notas: 'La dosis y titulación dependen del contexto (shock séptico o poscardiotomía) y del protocolo. Ver ficha de vasopresina; no asumir una dosis fija universal.',
    verified: false,
  },
  {
    id: 'levosimendan',
    nombre: 'Levosimendán',
    presentacion: 'ampolla 12.5 mg/5 mL',
    dilucionEstandar: { mg: 12.5, volumenML: 250 },
    concentracionUgMl: 50, // 12.5 mg = 12500 µg / 250 mL = 50 µg/mL
    modoDosis: 'ug_kg_min',
    rango: { min: 0.05, max: 0.2, unidad: 'µg/kg/min' },
    notas: 'Infusión de 24 h. Efecto persiste 7–10 días. Sin bolo en hipotensión.',
    verified: false,
  },
];

/** Obtiene una dilución por su ID */
export function getDilutionById(id: string): Dilution | undefined {
  return dilutions.find((d) => d.id === id);
}
