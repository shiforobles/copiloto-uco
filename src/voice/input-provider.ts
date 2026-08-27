/**
 * Interfaz InputProvider para abstracción del método de entrada.
 *
 * Fase 1: Solo 'form' (formulario manual).
 * Fase 2: Se agregará 'voice' que usa Web Speech API + Claude API para parseo.
 *
 * ## Cómo enchufar el proveedor de voz (fase 2)
 *
 * 1. Crear `voice-provider.ts` que implemente `InputProvider` con type: 'voice'
 * 2. Usar Web Speech API (SpeechRecognition) para capturar audio a texto
 * 3. Enviar el texto a Claude API con un prompt de parseo estricto:
 *    - Entrada: texto libre dictado por el médico
 *    - Salida: JSON estricto con Partial<SessionState>
 *    - Claude SOLO parsea, NUNCA calcula
 * 4. El parseInput devuelve los campos reconocidos como Partial<SessionState>
 * 5. La UI valida y muestra los campos parseados antes de confirmar
 * 6. El engine recalcula con los valores confirmados (igual que con formulario)
 *
 * Ejemplo de prompt para Claude API:
 * ```
 * Extraé los datos clínicos del siguiente texto dictado y devolvelos como JSON.
 * No calcules nada. Solo parseá los valores mencionados.
 * Campos posibles: age, sex, weight, height, creatinine, potassium, ...
 * Texto: "{dictado}"
 * ```
 */

/** Estado parcial de sesión que puede devolver el parser de voz */
export interface PartialSessionInput {
  age?: number;
  sex?: 'male' | 'female';
  weight?: number;
  height?: number;
  creatinine?: number;
  potassium?: number;
  systolicBP?: number;
  heartRate?: number;
}

export interface InputProvider {
  type: 'form' | 'voice';
  /**
   * Parsea un input de texto libre a campos estructurados de sesión.
   * Solo aplica al proveedor de voz (fase 2).
   * El proveedor de formulario lanza error si se llama.
   */
  parseInput(raw: string): Promise<PartialSessionInput>;
}

/** Proveedor de formulario (fase 1) — no parsea texto */
export const formProvider: InputProvider = {
  type: 'form',
  parseInput: async () => {
    throw new Error(
      'El proveedor de formulario no soporta parseo de texto. ' +
      'Los datos se ingresan directamente en los campos.'
    );
  },
};
