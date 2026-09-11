# Arquitectura de Copiloto UCO

## 1. Visión y Principios del Sistema

Copiloto UCO es un asistente de decisión clínica para la recorrida y pase de sala en Unidad Coronaria (UCO), diseñado bajo principios estrictos de seguridad médica y determinismo computacional:

1. **Determinismo absoluto (Cero IA en el runtime de cálculo):** Ningún modelo de lenguaje (LLM) calcula dosis, reglas renales ni scores. Toda la lógica clínica reside en funciones puras de TypeScript y bases de datos declarativas inmutables.
2. **Offline-first y PWA:** La aplicación funciona íntegramente en el navegador sin conexión a internet (Service Worker vía Workbox/Vite-PWA), garantizando disponibilidad al pie de la cama.
3. **Privacidad total:** Sin backend, sin base de datos en servidor, sin cookies, sin analytics ni transmisión de identificadores de pacientes (edad, peso y laboratorio son volátiles en memoria durante la sesión).
4. **Carga progresiva y no oclusión:** Un dato faltante limita la individualización de dosis, pero nunca oculta la recomendación de referencia ni las alternativas terapéuticas.
5. **Tristate semántico estricto:** Se distingue formalmente entre:
   - `true`: Condición confirmada presente.
   - `false`: Condición confirmada ausente.
   - `null`: Dato no registrado / desconocido. El sistema jamás interpreta `null` como falso o normal.
6. **Trazabilidad clínica y auditabilidad:** Cada sugerencia terapéutica incluye su fórmula de cálculo, el peso y función renal utilizados, y referencias a fuentes clínicas primarias con bandera de verificación (`verified: false` por defecto hasta validación médica institucional).

---

## 2. Capas de la Arquitectura

```
src/
├── engine/             # 1. Capa de Cálculo Matemático Puro (sin dependencias UI)
│   ├── renal.ts        # Cockcroft-Gault, CKD-EPI 2021, pesos (actual, ideal Devine, ajustado)
│   ├── drips.ts        # Conversiones bidireccionales mL/h ↔ µg/kg/min, µg/min, U/min
│   ├── validation.ts   # Rangos biológicos y validaciones fisiológicas
│   └── units.ts        # Conversión de unidades y formateo
│
├── data/               # 2. Registro Canónico y Datos Declarativos
│   ├── clinical-sources.ts   # Catálogo centralizado de fuentes, guías y fichas técnicas
│   ├── canonical-drugs.ts    # Fármacos canónicos, clases, indicaciones y regímenes
│   ├── dilutions.ts          # Concentraciones estándar y modos de goteo
│   ├── sca-therapy-matrix.ts # Opciones terapéuticas para Síndrome Coronario Agudo
│   ├── hf-therapy-matrix.ts  # Opciones para Insuficiencia Cardíaca y Shock
│   ├── af-therapy-matrix.ts  # Opciones para Fibrilación Auricular y Anticoagulación
│   ├── renal-rules.ts        # Reglas de ajuste de dosis según función renal
│   └── checklist-ic.ts       # Pilares terapéuticos según fase de IC
│
├── rules/              # 3. Motores de Reglas Clínicas
│   ├── sca-therapy.engine.ts  # Evaluación contextual SCA
│   ├── hf-therapy.engine.ts   # Evaluación IC / Shock y GDMT por rango de FEVI
│   ├── af-therapy.engine.ts   # Evaluación FA, cardioversión y ACOD según guías
│   ├── cha2ds2vasc.ts         # Cálculo determinístico CHA₂DS₂-VASc y CHA₂DS₂-VA
│   ├── safety-audit.engine.ts # Auditoría transversal de seguridad en 4 bloques
│   └── renal-rules.engine.ts  # Matching de reglas renales
│
├── context/            # 4. Gestión de Estado Global (Sesión)
│   └── session.tsx     # SessionState, useReducer, acciones de medicación sincronizada
│
└── ui/                 # 5. Componentes de Interfaz de Usuario (React + Tailwind)
    ├── App.tsx         # Navegación principal, tabs móviles y header
    ├── QuickPathway.tsx# Pase rápido de sala (SCA, IC, FA, Otros)
    ├── PatientForm.tsx # Entrada de datos fisiológicos y antecedentes
    ├── TherapyMatrix.tsx / HFTherapyMatrix.tsx / AFMatrix.tsx
    ├── SafetyAudit.tsx # Vista transversal de seguridad
    └── shared/         # Componentes reutilizables (TherapyTable, DripCard, etc.)
```

---

## 3. Modelo de Dominio Farmacológico

Para eliminar la divergencia entre matrices y garantizar la sincronización transversal de la medicación actual, se adopta un modelo canónico normalizado:

1. **CanonicalDrug (`drugId`):** Entidad farmacológica estable (ej. `bisoprolol`, `enoxaparin`, `apixaban`).
2. **DrugClass (`drugClassId`):** Familia terapéutica (ej. `betablocker`, `doac`, `lmwh`, `sglt2i`, `raas_inhibitor`). Permite detección de duplicación de clase.
3. **Indication (`indicationId`):** Situación clínica específica (ej. `sca_antithrombotic`, `af_stroke_prevention`, `hf_gdmt`, `vte_prophylaxis`).
4. **TherapyRegimen (`regimenId`):** Esquema concreto de administración (dosis de carga, mantenimiento, dosis máxima, vía, intervalo, criterios de ajuste y umbrales renales).
5. **Non-Pharmacological Option (`kind: 'procedure' | 'strategy'`):** Permite representar cardioversión eléctrica, revascularización o monitoreo invasivo sin forzar un `drugId`.

---

## 4. Trazabilidad Renal y de Dosificación

El sistema implementa una política transparente de selección de parámetros renales:
- **Cockcroft-Gault (ClCr):** Obligatorio para fármacos cuya ficha técnica exige ajuste por ClCr (en particular ACOD: apixabán, rivaroxabán, dabigatrán, edoxabán).
- **CKD-EPI 2021 (eGFR):** Utilizado para diagnóstico de insuficiencia renal y fármacos cuya evidencia se basa en TFG indexada (ej. iSGLT2, ARM).
- **Discriminación de Peso:** El motor calcula peso actual, peso ideal según fórmula de Devine y peso ajustado para obesidad (IMC ≥ 30 kg/m²), explicitando cuál fue empleado en la fórmula.

---

## 5. Auditoría de Seguridad Transversal (4 Bloques)

La auditoría evalúa en tiempo real el estado global del paciente:
- **Recibe:** Medicación activa confirmada.
- **Falta considerar:** Profilaxis TEV ausente, gastroprotección en alto riesgo, pilares GDMT pendientes según FEVI.
- **Precaución:** Alteraciones electrolíticas (K, Mg), interacciones farmacológicas (CYP2C19 clopidogrel-omeprazol), valores de QTc límite.
- **Evitar:** Contraindicaciones formales (doble bloqueo SRAA, ACOD en diálisis o sangrado activo, flecainida en cardiopatía estructural, etc.).
