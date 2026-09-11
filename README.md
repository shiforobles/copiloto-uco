# Copiloto UCO
**Versión: 0.3.1-beta.1**

Copiloto terapéutico determinístico para recorrida de unidad coronaria (UCO). PWA offline-first, orientada a mostrar información útil con carga progresiva de datos e identidad farmacológica transversal.

> ⚠️ **Herramienta de apoyo para uso profesional personal. No reemplaza el juicio clínico. Verificar toda dosis antes de indicar.**

El alcance clínico y la arquitectura están documentados en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/CLINICAL-SOURCES.md`](docs/CLINICAL-SOURCES.md) y [`docs/ROADMAP.md`](docs/ROADMAP.md). Los cambios de esta versión están en [`CHANGELOG.md`](CHANGELOG.md).

## Funcionalidades Principales

- **Identidad farmacológica canónica:** catálogo transversal (`src/data/canonical-drugs.ts`) con IDs estables por principio activo, clases farmacológicas y regímenes por indicación (SCA, IC, FA, shock).
- **Función renal trazable:** Cockcroft-Gault + CKD-EPI 2021 (sin raza), diferenciación de peso actual/ideal Devine/ajustado (ABW) en obesidad, alertas fisiológicas y reporte explícito de datos faltantes.
- **Medicación actual sincronizada:** reducer normalizado con sincronización multi-pantalla, distinción de concordancia de dosis y detección de duplicación de principio activo y clase.
- **FA y anticoagulación estructurada:** duraciones estandarizadas (<24h, 24-48h, ≥48h, desconocida), cardioversión eléctrica urgente no demorada en inestabilidad, tri-state flags de adherencia y ETE, contraindicaciones mecánicas/reumáticas (RE-ALIGN, INVICTUS).
- **Doble score CHA₂DS₂:** `CHA₂DS₂-VASc` (ACC/AHA/ACCP/HRS 2023, 0–9 pts) y `CHA₂DS₂-VA` (ESC 2024, 0–8 pts) identificados por su procedencia.
- **Auditoría de ACOD y jurisdicción:** regímenes de apixabán, rivaroxabán, dabigatrán y edoxabán con perfiles regulatorios (AR-ANMAT, EU-EMA, US-FDA).
- **Registro canónico de fuentes clínicas:** procedencia formal de guías y fichas técnicas oficiales (`src/data/clinical-sources.ts`).
- **Pase de sala rápido y UX móvil:** acceso a resumen clínico colapsable de 4 bloques (Recibe / Falta / Precaución / Evitar), banner renal interactivo, buscador multi-token y targets táctiles ≥44px.
- **Goteos bidireccionales:** conversión editable en ambos sentidos mL/h ↔ dosis (µg/kg/min, µg/min, U/min).
- **Auditoría de seguridad transversal:** 4 bloques clínicos evaluando profilaxis TEV, protección GI, electrolitos, hematología, nefrotoxicidad y duplicaciones.

## Principios de seguridad

1. **Ningún LLM calcula nada.** Todo es funciones puras + base de reglas declarativas versionada.
2. **Cero datos identificatorios.** Sin nombre, DNI, HC. Sin backend, sin persistencia.
3. **Todo auditable.** Cada resultado muestra fórmula, valores usados y pasos intermedios.
4. **Toda regla clínica lleva fuente y fecha**, con flag `verified: false` hasta validación médica institucional.
5. **Carga progresiva segura.** Un dato faltante limita la individualización, pero no oculta la orientación general.
6. **Tests primero.** 214 tests discriminantes de motores, reglas, matrices y flujo de interfaz (100% pasando).

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v3 (dark mode, mobile-first)
- Vitest 4 (pool: vmThreads — workaround para espacio en path del workspace)
- vite-plugin-pwa (offline-first)
- Deploy: GitHub Pages → `shiforobles.github.io/copiloto-uco/`
- Estado: useReducer + Context (tristate booleanos: `null` = desconocido, `true` = presente, `false` = confirmado ausente)
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
│   ├── renal-rules.engine.ts  # evaluateRenalRule()
│   ├── checklist.engine.ts    # evaluateChecklist()
│   ├── sca-therapy.engine.ts  # Individualización de alternativas SCA
│   ├── hf-therapy.engine.ts   # Individualización IC / Shock + GDMT
│   ├── af-therapy.engine.ts   # Individualización FA + ACOD + cardioversión
│   ├── cha2ds2vasc.ts         # Score puro CHA₂DS₂-VASc por componente
│   └── safety-audit.engine.ts # Auditoría de seguridad en 4 bloques
│
├── data/                # Datos clínicos declarativos (verified: false)
│   ├── canonical-drugs.ts    # Rangos canónicos de dosis de inotrópicos/vasopresores
│   ├── dilutions.ts          # Goteos estándar y concentraciones
│   ├── renal-rules.ts        # Reglas de ajuste renal
│   ├── checklist-ic.ts       # Pilares IC
│   ├── checklist-sca.ts      # Checklist SCA
│   ├── sca-therapy-matrix.ts # Matriz SCA (36 opciones)
│   ├── hf-therapy-matrix.ts  # Matriz IC (28 opciones)
│   └── af-therapy-matrix.ts  # Matriz FA (19 opciones)
│
├── context/
│   └── session.tsx      # SessionProvider + useReducer + tipos de estado
│
├── ui/                  # Componentes React
│   ├── App.tsx          # Layout principal + tabs + nueva sesión
│   ├── QuickPathway.tsx # Entrada rápida por patología/situación
│   ├── PatientForm.tsx  # Datos esenciales, laboratorio y antecedentes
│   ├── MedicationSelector.tsx # Consulta de drogas
│   ├── RenalResults.tsx # Tarjetas CG + CKD-EPI con fórmulas
│   ├── DripsPanel.tsx   # Panel de goteos
│   ├── DripCard.tsx     # Tarjeta de goteo bidireccional
│   ├── RenalAlerts.tsx  # Alertas de ajuste por ClCr
│   ├── Checklist.tsx    # Pilares faltantes
│   ├── TherapyMatrix.tsx     # Matriz SCA
│   ├── HFTherapyMatrix.tsx   # Matriz IC con badges de contexto
│   ├── AFMatrix.tsx          # Matriz FA con badges de escenario
│   ├── SafetyAudit.tsx       # Auditoría de seguridad de 4 bloques
│   ├── TherapyTable.tsx      # Tabla compartida reutilizable
│   └── Disclaimer.tsx        # Footer con disclaimer legal
```

tests/
├── engine/
│   ├── renal.test.ts         # 20 tests CG + CKD-EPI (validaciones y límites)
│   ├── drips.test.ts         # 16 tests goteos (ida/vuelta, bordes, unidades)
│   └── validation.test.ts    # 24 tests de validación de inputs
├── rules/
│   ├── renal-rules.test.ts   # 19 tests reglas renales y umbrales
│   ├── checklist.test.ts     # 20 tests checklist por fase y condición
│   ├── sca-therapy.test.ts   # 5 tests individualización SCA
│   ├── hf-therapy.test.ts    # 19 tests IC, inotrópicos canónicos y GDMT
│   ├── af-therapy.test.ts    # 20 tests FA, ajuste ACOD y cardioversión
│   ├── cha2ds2vasc.test.ts   # 7 tests score CHA₂DS₂-VASc
│   └── safety-audit.test.ts  # 16 tests auditoría transversal en 4 bloques
└── ui/
    └── progressive-flow.test.tsx # 7 tests de flujo progresivo de UI

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
npm ci
npm run dev          # Dev server
npm test             # Tests (vitest run)
npm run typecheck    # TypeScript estricto
npm run test:watch   # Tests en watch mode
npm run build        # Build de producción
ENABLE_PWA=true npm run build  # Build PWA
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

## TODOs priorizados

### P0 — Curación de datos (médico)
- [ ] Revisar y marcar `verified: true` cada dilución en `data/dilutions.ts`
- [ ] Revisar y completar fuentes en `data/renal-rules.ts` (campo `source`)
- [ ] Revisar dosis de inicio/objetivo en `data/checklist-ic.ts`
- [ ] Validar el criterio de peso usado por Cockcroft-Gault con el protocolo local
- [ ] Sustituir las reglas renales simples por reglas sensibles a indicación y métrica renal

### P1 — Cobertura clínica
- [ ] Curar SCA por subtipo y estrategia: STEMI/NSTEMI, PCI/fibrinólisis/conservadora y riesgo hemorrágico
- [x] Crear matriz SCA inicial por droga, manteniendo `verified: false` hasta validación clínica
- [ ] Curar IC por FEVI, congestión, perfusión y estabilidad hemodinámica
- [ ] Incorporar FA/flutter, TV/FV, bradicardia/bloqueos y posparo
- [ ] Incorporar TEP/TVP, anticoagulación, sangrado y reversión
- [ ] Incorporar profilaxis TEV y profilaxis de úlcera de estrés basada en riesgo
- [ ] Incorporar emergencia hipertensiva, síndrome aórtico, valvulopatía aguda, miocarditis/pericarditis y endocarditis

### P2 — Voz / IA
- [ ] Implementar `voiceProvider` con Web Speech API
- [ ] Parser vía Claude API (texto dictado → JSON de sesión)
- [ ] UI de confirmación post-parseo

### P3 — UX / Deploy
- [x] GitHub Actions con tests, typecheck y build PWA
- [x] Íconos PWA reales y manifest en español
- [x] Modo de pase con navegación inferior y carga progresiva
- [ ] Onboarding / tutorial de primer uso
- [ ] Exportar resumen de sesión como texto (para copiar al parte)

## Licencia

Uso personal. No distribuir sin autorización.
