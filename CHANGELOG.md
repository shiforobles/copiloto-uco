# Changelog

## 0.3.1-beta.1 — Identidad Farmacológica Transversal, Procedencia Clínica y Ajuste Renal Trazable (2026-09-10)

> ⚠️ Borrador clínico — todas las reglas con `verified: false` hasta validación médica institucional colegiada.

### Identidad Farmacológica Canónica y Transversal
- **Catálogo canónico (`src/data/canonical-drugs.ts`):** Fuente única de identidad para medicamentos en SCA, IC y FA. Define `DrugId`, `DrugClassId`, `IndicationId`, `RegimenId`, `CanonicalDrug`, `TherapyRegimen` y `CurrentMedication`.
- **Diferenciación estricta:** Distingue fármaco, clase farmacológica, indicación, régimen de dosis, vía, dilución/concentración, fuente clínica y jurisdicción regulatoria.
- **Unicidad de ID y multiplicidad de indicaciones:** Un mismo medicamento conserva su `drugId` pero posee dosis e indicaciones independientes (ej. enoxaparina en SCA vs FA vs profilaxis TEV; apixabán en FA no valvular vs tratamiento TEV).
- **Procedimientos no farmacológicos:** Cardioversión eléctrica y procedimientos admiten `kind: 'procedure' | 'strategy'` sin requerir `drugId`.

### Medicación Actual Sincronizada y Reducer Normalizado
- **Acciones del reducer:** `ADD_CURRENT_MEDICATION`, `REMOVE_CURRENT_MEDICATION`, `UPDATE_CURRENT_MEDICATION`, `RESET_SESSION`.
- **Sincronización multi-pantalla:** Al marcar bisoprolol u otra droga en cualquier patología, se refleja en toda la aplicación y en la auditoría transversal.
- **Distingue recibir el fármaco vs concordancia con el régimen evaluado:** `doseMatchesEvaluatedRegimen` independiente de `currentDoseText`.
- **Detección de duplicaciones:** Detección de principio activo duplicado y detección de duplicación de clase farmacológica (múltiples betabloqueantes, múltiples ARM) en `safety-audit.engine.ts`.

### Contexto Renal Trazable y Estrategia de Peso
- **`getTraceableRenalContext` (`src/engine/renal.ts`):** Expone creatinina, edad, sexo, peso actual, talla, IMC, peso ideal por Devine, peso ajustado (ABW), ClCr por Cockcroft-Gault, peso utilizado y estrategia ('actual' vs 'adjusted'), eGFR por CKD-EPI 2021, datos faltantes explícitos y alertas extremas.
- **Separación conceptual estricta:** ClCr en mL/min y eGFR en mL/min/1.73 m² nunca se intercambian silenciosamente. Cada regla especifica la métrica y fórmula utilizada.
- **Alertas extremas:** Alertas automáticas para Cr > 10 mg/dL, Cr ≥ 5 mg/dL, peso < 30 kg o > 200 kg, edad ≥ 100 años y ancianos ≥ 80 años con Cr < 0.8 mg/dL.
- **Transparencia en falta de datos:** Muestra dosis de referencia general señalando exactamente qué parámetro falta para individualizar, sin emitir dosis falsas.

### Corrección Estructural de FA y Perfiles de Guías
- **Duraciones de FA:** Cuatro categorías estándar (`<24h`, `24_48h`, `gte48h`, `unknown`).
- **Campos tristate:** Adherencia confirmada a anticoagulación (`confirmedAdherence`), ETE sin trombo (`teeNoThrombus`), prótesis mecánica (`mechanicalValve`), estenosis mitral reumática moderada/severa (`rheumaticMitralStenosis`).
- **Estratificación hemodinámica:** En paciente inestable con shock/edema pulmonar, la cardioversión eléctrica urgente no se demora por duración de arritmia ni anticoagulación previa.
- **Doble score diferenciado:**
  - `CHA₂DS₂-VASc` (ACC/AHA/ACCP/HRS 2023, 0-9 puntos).
  - `CHA₂DS₂-VA` (ESC 2024, 0-8 puntos, sin categoría de sexo).
  - Selector de perfil explícito: ESC 2024, ACC/AHA 2023, Comparar guías, Protocolo institucional.

### Auditoría de Regímenes de ACOD y Jurisdicción
- **ACOD auditados:** Apixabán, rivaroxabán, dabigatrán, edoxabán con umbrales renales, criterios de reducción de dosis y contraindicaciones de valvulopatías específicas (RE-ALIGN en prótesis mecánicas, INVICTUS en EM reumática).
- **Perfiles regulatorios:** AR-ANMAT, EU-EMA, US-FDA. Indicación explícita de "pendiente de validación regulatoria local" para fichas técnicas locales en proceso de homologación.

### Registro Canónico de Fuentes Clínicas
- **Catálogo (`src/data/clinical-sources.ts`):** Metadata con `sourceId`, organización, título, año, URL oficial primaria, jurisdicción, tipo de documento y fecha de consulta. Offline-first sin PDFs embebidos.

### UX Mobile-First para Recorrida de UCO
- **Resumen clínico colapsable de 4 bloques:** En cabecera de matriz ("Recibe", "Falta considerar", "Precaución", "Evitar").
- **Banner renal trazable interactivo:** Indicador del ClCr/eGFR y peso utilizado con botón para modificar datos del paciente.
- **Targets táctiles ≥ 44px:** Botones y chips optimizados para uso clínico táctil con una mano a 390px y 430px de ancho.
- **Buscador multi-token:** Filtrado simultáneo por nombre comercial, nombre genérico, sinónimos, clase e indicación.

### Tests y Verificación
- **214 tests aprobados (100% pasando):** 173 tests de línea base preservados intactos + 41 tests discriminantes nuevos.
- **Repositorio Git inicializado localmente.**

---

> ⚠️ Borrador clínico — todas las reglas con `verified: false`. Requiere validación médica institucional.

### Nuevos módulos

- **IC/Shock** (`hf-therapy-matrix.ts` + `hf-therapy.engine.ts`): 9 grupos, 28 opciones. Cubre diuréticos (asa + secuencial), vasodilatadores IV, vasopresores/inotrópicos, GDMT cuádruple (ARNI/IECA/ARA-II, BB, ARM, iSGLT2) y agregados. Motor determinístico calcula dosis individualizadas de inotrópicos por peso.
- **FA/Anticoagulación** (`af-therapy-matrix.ts` + `af-therapy.engine.ts`): 5 grupos, 19 opciones. Control de frecuencia IV/oral, control de ritmo, cardioversión eléctrica/farmacológica, ACOD (apixabán, rivaroxabán, dabigatrán, edoxabán), warfarina y anticoagulación parenteral en situaciones específicas. Individualiza dosis de ACOD por ClCr/Cockcroft-Gault.
- **CHA₂DS₂-VASc** (`cha2ds2vasc.ts`): función pura, muestra cada componente, no automatiza decisión de anticoagulación.
- **Auditoría de seguridad transversal** (`safety-audit.engine.ts` + `SafetyAudit.tsx`): 4 bloques (Recibe / Falta / Precaución / Evitar). Detecta profilaxis TEV, gastroprotección, electrolitos, hematología, sangrado activo, nefrotoxicidad, duplicaciones y combinaciones peligrosas.

### Ampliación de datos clínicos

- 17 campos nuevos en `SessionState`: FEVI, congestión, hipoperfusión, vasopresores, Hb, plaquetas, Mg, QTc, diálisis, AKI, sangrado activo, ACV previo, cardiopatía estructural, preexcitación, anticoagulante actual, PCI/cirugía planificada, escenario FA.
- Campos booleanos clínicamente significativos ahora son `boolean | null` (null = desconocido, distinto de false).
- Nuevos campos FA: `afDuration`, `priorTherapeuticAnticoag`, `hypertension`, `diabetes`, `vascularDisease`.

### Componentes UI

- `HFTherapyMatrix.tsx`: matriz IC con badges de contexto (FEVI, congestión, fase).
- `AFMatrix.tsx`: matriz FA con badges de escenario.
- `SafetyAudit.tsx`: auditoría de 4 bloques con iconografía por severidad.
- `TherapyTable.tsx` (shared): componente reutilizable de tabla con búsqueda, colapso por grupo, expand por fila.
- `PatientForm.tsx`: tres secciones expandibles (vitales básicos, laboratorio avanzado, antecedentes/contexto).
- `QuickPathway.tsx`: FA como cuarta patología, contextos IC rápidos, escenarios FA, duración de FA.

### Correcciones

- Anticoagulación parenteral en FA: eliminada la presentación como "puente rutinario"; indicaciones restringidas a cardioversión sin AC previa, perioperatorio y transición específica.
- Separación explícita de dosis FA vs TVP/TEP.
- Capa canónica de rangos de inotrópicos (`canonical-drugs.ts`) — elimina divergencia entre `dilutions.ts` y la matriz IC.

### Pruebas

- 111 tests preexistentes: todos pasando.
- ~55 tests nuevos discriminantes (IC, FA, CHA₂DS₂-VASc, auditoría de seguridad).

### Limitaciones conocidas

- Todas las reglas clínicas son `verified: false` — requieren validación por médicos de la institución.
- Sin repositorio Git — no hay rollback automático.
- La identidad cruzada de medicamentos (misma droga en varias matrices) es deuda técnica para v0.3.1.

---

## 0.2.0-beta.1 — Matriz terapéutica SCA


### Alternativas visibles con pocos toques

- Sustituye el checklist genérico de SCA por una matriz compacta de 36 fármacos en 10 grupos.
- Muestra por fila carga/inicio, mantenimiento, dosis máxima y rol: base, preferida, alternativa, agregado o rescate.
- Incorpora buscador instantáneo por nombre o indicación y filtro de medicación actual.
- Agrega opciones exactas de AAS, P2Y12, anticoagulación aguda, estatinas, hipolipemiantes no estatínicos, betabloqueantes, IECA/ARA-II, MRA, gastroprotección y analgesia/antiisquémicos.
- Incluye las alternativas solicitadas: rosuvastatina, atorvastatina, simvastatina, bisoprolol, nebivolol, AAS, clopidogrel, ticagrelor y prasugrel.

### Individualización progresiva

- Subtipo SCACEST/SCASEST y estrategia PCI/fibrinólisis/médica son opcionales; nunca ocultan opciones.
- Peso, edad, Cockcroft-Gault, eGFR, FC, TAS y K refinan dosis o agregan alertas.
- Calcula referencias individuales para HNF, enoxaparina, bivalirudina, cangrelor y ajustes seleccionados.
- Advierte duplicaciones de clase, rosuvastatina en insuficiencia renal grave, betabloqueo en shock/bradicardia/hipotensión y combinación clopidogrel–omeprazol/esomeprazol.

### Seguridad y calidad

- Cada alternativa ofrece “cuándo”, “evitar/revisar”, monitorización y enlaces a guías o fichas regulatorias.
- Todas las nuevas reglas permanecen como `verified: false` hasta revisión médica e institucional.
- 111 pruebas aprobadas, TypeScript estricto y build de producción verificados.

## 0.1.0-beta.1 — Modo Pase de sala

### Flujo y experiencia de uso

- Entrada rápida por SCA, insuficiencia cardíaca o consulta directa de una droga.
- Recomendaciones generales visibles aunque falten laboratorio o medicación actual.
- Datos del paciente con carga progresiva: cuatro campos renales principales y campos clínicos adicionales desplegables.
- Botón explícito **Lo recibe** para evitar que tocar una tarjeta la marque accidentalmente.
- Navegación inferior fija para tratamiento, dosis, goteos y datos.

### Medicación y función renal

- El selector de drogas ya no se oculta cuando faltan datos renales.
- Cada droga seleccionada muestra una dosis de referencia y explica qué falta para individualizarla.
- Las drogas sin ajuste activo también muestran un resultado explícito.
- Resultados, alertas y checklist comparten el mismo Cockcroft-Gault de dosificación.
- En presencia de talla y peso mayor a 120% del peso ideal, el prototipo utiliza el peso ajustado de forma consistente.

### Goteos

- Ambos campos pueden usarse como entrada: mL/h o dosis.
- Vasopresina se almacena y edita en unidades, no en miligramos.
- Las diluciones no verificadas muestran una identificación de borrador.

### Calidad técnica

- TypeScript estricto sin errores.
- Lockfile reproducible con `npm ci`.
- Vitest 4 compatible con Vite 8.
- 104 pruebas aprobadas, incluyendo flujo de interfaz.
- Builds web y PWA aprobados.
- Auditoría de dependencias de producción sin vulnerabilidades conocidas.
- GitHub Actions ejecuta tests, typecheck y build PWA.
- Íconos PWA reales, manifest en español y eliminación de la fuente web externa.

### Límites conocidos

- Las recomendaciones clínicas actuales continúan como `verified: false`.
- Los módulos de IC y SCA son prototipos de interacción, no protocolos clínicos validados.
- Aún faltan los subtipos de SCA, fenotipos de IC y el resto del mapa clínico UCO.
- No usar las dosis como indicación asistencial hasta completar curación y verificación médica.
