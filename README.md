# Copiloto UCO

Calculadora clínica determinística para uso personal en unidad coronaria (UCO). PWA offline-first.

> ⚠️ **Herramienta de apoyo para uso profesional personal. No reemplaza el juicio clínico. Verificar toda dosis antes de indicar.**

## Funcionalidades

- **Función renal:** Cockcroft-Gault + CKD-EPI 2021 (sin raza), con advertencias clínicas
- **Goteos:** Conversión bidireccional mL/h ↔ γ (µg/kg/min) o µg/min, con diluciones editables
- **Alertas de ajuste renal:** Base de reglas que marca ajustes de dosis por ClCr
- **Checklist IC:** Pilares de insuficiencia cardíaca por fase clínica, con precauciones por signos vitales

## Principios de seguridad

1. **Ningún LLM calcula nada.** Todo es funciones puras + base de reglas JSON versionada
2. **Cero datos identificatorios.** Sin nombre, DNI, HC. Sin backend, sin persistencia
3. **Todo auditable.** Cada resultado muestra fórmula, valores usados y pasos intermedios
4. **Toda regla clínica lleva fuente y fecha**, con flag `verified: false` hasta validación del médico
5. **Tests primero.** 69 tests cubren todos los casos de respuesta conocida

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v3 (dark mode, mobile-first)
- Vitest 3 (pool: vmThreads — workaround para espacio en path del workspace)
- vite-plugin-pwa (offline-first)
- Deploy: GitHub Pages → `shiforobles.github.io/copiloto-uco/`
- Estado: useReducer + Context (sin Zustand)
- Sin backend, sin base de datos, sin analytics

## Estructura de archivos

```
src/
├── engine/              # Funciones puras de cálculo (sin deps de UI)
│   ├── types.ts         # CalculationResult, CalculationStep, inputs tipados
│   ├── validation.ts    # Validación de inputs (peso, Cr, edad, etc.)
│   ├── units.ts         # Helpers: mgToUg, calculateConcentration, formatNumber
│   ├── renal.ts         # cockcroftGault(), ckdEpi2021()
│   └── drips.ts         # mlhToGamma(), gammaToMlh(), mlhToUgMin(), ugMinToMlh()
│
├── rules/               # Tipos y evaluadores de reglas clínicas
│   ├── types.ts         # Dilution, RenalRule, ChecklistItem, etc.
│   ├── renal-rules.engine.ts  # evaluateRenalRule() — algoritmo corregido
│   └── checklist.engine.ts    # evaluateChecklist() — condicional por fase
│
├── data/                # Datos seed (verified: false)
│   ├── dilutions.ts     # 5 drogas: milrinona, dobutamina, NA, dopamina, NTG
│   ├── renal-rules.ts   # 13 reglas para 12 drogas cardiológicas
│   └── checklist-ic.ts  # 7 pilares IC por fase clínica
│
├── context/
│   └── session.tsx      # SessionProvider + useReducer + tipos de estado
│
├── ui/                  # Componentes React
│   ├── App.tsx          # Layout principal + header + nueva sesión
│   ├── PatientForm.tsx  # Formulario: edad, sexo, peso, talla, Cr, K, TAS, FC, condición, FA, fase
│   ├── RenalResults.tsx # Tarjetas CG + CKD-EPI con fórmulas desplegables
│   ├── DripsPanel.tsx   # Panel de goteos (agregar, quitar)
│   ├── DripCard.tsx     # Tarjeta de goteo individual (bidireccional, dilución editable)
│   ├── RenalAlerts.tsx  # Alertas de ajuste por ClCr
│   ├── Checklist.tsx    # Pilares faltantes según fase + condición
│   ├── FormulaDetail.tsx # Componente <details> para fórmulas
│   ├── StepDisplay.tsx  # Visualización de pasos de cálculo
│   └── Disclaimer.tsx   # Footer con disclaimer legal
│
├── voice/               # Fase 2 (stub)
│   └── input-provider.ts # InputProvider interface + formProvider
│
├── main.tsx             # Entry point React
└── index.css            # Tailwind + design system (cards, buttons, badges)

tests/
├── engine/
│   ├── renal.test.ts    # 10 tests CG + CKD-EPI
│   ├── drips.test.ts    # 9 tests goteos (ida/vuelta, bordes)
│   └── validation.test.ts # 24 tests de validación de inputs
└── rules/
    ├── renal-rules.test.ts  # 12 tests (incl. test discriminante ClCr 10)
    └── checklist.test.ts    # 14 tests (fase, FA, precauciones vitales)
```

## Decisiones técnicas clave

### Algoritmo del evaluador renal
Filtra ajustes donde `clcr <= clcrMax` (umbrales que el paciente cruza), luego elige el de **menor** `clcrMax` (más restrictivo). Usa ClCr **sin redondear** para evitar cambios de bin por display.

### Datos como .ts en vez de .json
Los seeds están en archivos `.ts` (objetos literales exportados) para tener tipado en compilación y autocompletado. Siguen siendo declarativos.

### useReducer + Context
Estado efímero de una sesión, sin persistencia. Un solo reducer maneja todo. Zustand no se justificaba.

### Vitest pool: vmThreads
El workspace tiene espacio en el nombre ("App UCO"). Vitest forks/threads workers no resuelven paths con espacios. `vmThreads` funciona correctamente.

## Cómo correr

```bash
npm install
npm run dev          # Dev server
npm test             # Tests (vitest run)
npm run test:watch   # Tests en watch mode
npm run build        # Build de producción
```

## Cómo enchufar el proveedor de voz (fase 2)

Ver `src/voice/input-provider.ts`. El flujo sería:

1. Crear `voice-provider.ts` que implemente `InputProvider` con `type: 'voice'`
2. Usar Web Speech API (`SpeechRecognition`) para capturar audio → texto
3. Enviar texto a Claude API con prompt de parseo estricto:
   - Entrada: texto libre dictado
   - Salida: JSON con `Partial<SessionState>`
   - Claude **SOLO parsea, NUNCA calcula**
4. La UI muestra campos parseados para confirmación del médico
5. El engine recalcula con valores confirmados (mismo flujo que formulario)

## TODOs priorizados (para Claude Code)

### P0 — Curación de datos (médico)
- [ ] Revisar y marcar `verified: true` cada dilución en `data/dilutions.ts`
- [ ] Revisar y completar fuentes en `data/renal-rules.ts` (campo `source`)
- [ ] Revisar dosis de inicio/objetivo en `data/checklist-ic.ts`
- [ ] Generar íconos PWA reales (192x192 y 512x512)

### P1 — Funcionalidad
- [ ] Agregar más drogas vasoactivas (vasopresina, levosimendan, adrenalina)
- [ ] Agregar más reglas renales (amiodarona, colchicina, alopurinol)
- [ ] Peso ideal (Devine) + peso ajustado para CG en obesos
- [ ] Selector de medicación actual para evaluar reglas renales automáticamente
- [ ] Checklist para SCA (no solo IC)

### P2 — Voz / IA
- [ ] Implementar `voiceProvider` con Web Speech API
- [ ] Parser vía Claude API (texto dictado → JSON de sesión)
- [ ] UI de confirmación post-parseo

### P3 — UX / Deploy
- [ ] GitHub Actions para deploy automático a GH Pages
- [ ] Animaciones de transición al cambiar fase/agregar goteo
- [ ] Onboarding / tutorial de primer uso
- [ ] Exportar resumen de sesión como texto (para copiar al parte)

## Licencia

Uso personal. No distribuir sin autorización.
