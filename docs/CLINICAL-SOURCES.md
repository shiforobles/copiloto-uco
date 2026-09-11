# Fuentes Clínicas y Evidencia de Referencia

Copiloto UCO se fundamenta exclusivamente en literatura primaria oficial, guías de práctica clínica internacionales y fichas técnicas regulatorias. Ninguna recomendación proviene de resúmenes comerciales ni de generación sintética por IA.

> ⚠️ **Aviso de Responsabilidad:** Todas las reglas y regímenes incluidos en la aplicación se encuentran etiquetados como `verified: false` hasta que sean auditados y rubricados por el comité médico o jefatura de la Unidad Coronaria de la institución correspondiente.

---

## 1. Guías de Práctica Clínica Principales

### Fibrilación Auricular y Anticoagulación
1. **ESC 2024 AF Guidelines:**
   - *Referencia:* 2024 ESC Guidelines for the management of atrial fibrillation developed in collaboration with EACTS.
   - *URL:* [https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/atrial-fibrillation/](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/atrial-fibrillation/)
   - *Aspectos clave:* Introducción del score CHA₂DS₂-VA (sin categoría de sexo como punto independiente), cardioversión guiada por tiempo (<24 h vs ≥24 h), anticoagulación temprana y control de factores de riesgo.

2. **ACC/AHA/ACCP/HRS 2023 AF Guideline:**
   - *Referencia:* 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation.
   - *DOI:* [10.1161/CIR.0000000000001193](https://www.ahajournals.org/doi/full/10.1161/CIR.0000000000001193)
   - *Aspectos clave:* Score CHA₂DS₂-VASc clásico (C=1, H=1, A2=2, D=1, S2=2, V=1, A=1, Sc=1), umbrales de inicio de ACOD (score ≥2 en hombres, ≥3 en mujeres; considerar en score 1 en hombres o 2 en mujeres), ventana de cardioversión de 48 horas.

### Insuficiencia Cardíaca y Shock Cardiogénico
3. **ESC 2021 / Focus Update 2023 HF Guidelines:**
   - *Referencia:* 2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure; 2023 Focused Update.
   - *Aspectos clave:* Cuádruple terapia fundacional para FEVI reducida (ARNI/IECA, Betabloqueante, ARM, iSGLT2); indicación clase I de iSGLT2 (dapagliflozina y empagliflozina) en FEVI preservada; manejo de congestión con diuréticos de asa y bloqueo secuencial.

4. **AHA/ACC/HFSA 2022 Heart Failure Guideline:**
   - *Referencia:* 2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure.
   - *Aspectos clave:* Titulación de inotrópicos y vasopresores por peso (µg/kg/min); noradrenalina como vasopresor de primera línea en shock cardiogénico; optimización hemodinámica antes de diuresis agresiva.

### Síndrome Coronario Agudo
5. **ESC 2023 ACS Guidelines:**
   - *Referencia:* 2023 ESC Guidelines for the management of acute coronary syndromes.
   - *Aspectos clave:* Dosis de carga de DAPT (AAS + ticagrelor/prasugrel/clopidogrel), anticoagulación parenteral en agudo (enoxaparina, HNF, fondaparinux, bivalirudina), estrategia invasiva según estratificación de riesgo.

---

## 2. Fichas Técnicas Regulatorias y Organismos Oficiales

### Argentina — ANMAT
- **Administración Nacional de Medicamentos, Alimentos y Tecnología Médica:**
  - *Portal:* [https://www.argentina.gob.ar/anmat/regulados/medicamentos](https://www.argentina.gob.ar/anmat/regulados/medicamentos)
  - *Estado:* Perfil de referencia principal para la práctica clínica local. Toda dosificación o indicación sin verificación en prospecto ANMAT permanece con `verified: false` y la mención "pendiente de validación regulatoria local".

### Europa — EMA
- **EMA Eliquis (Apixabán):** [https://www.ema.europa.eu/en/medicines/human/EPAR/eliquis](https://www.ema.europa.eu/en/medicines/human/EPAR/eliquis)
- **EMA Xarelto (Rivaroxabán):** [https://www.ema.europa.eu/en/medicines/human/EPAR/xarelto](https://www.ema.europa.eu/en/medicines/human/EPAR/xarelto)
- **EMA Pradaxa (Dabigatrán etexilato):** [https://www.ema.europa.eu/en/medicines/human/EPAR/pradaxa](https://www.ema.europa.eu/en/medicines/human/EPAR/pradaxa)
- **EMA Lixiana (Edoxabán):** [https://www.ema.europa.eu/en/medicines/human/EPAR/lixiana](https://www.ema.europa.eu/en/medicines/human/EPAR/lixiana)

### Estados Unidos — US FDA
- **FDA Drug Labels:** [https://labels.fda.gov/](https://labels.fda.gov/)
  - Se registran diferencias jurisprudenciales (ej. dosis de dabigatrán aprobada en EE.UU. 75 mg en lugar de 110 mg autorizada en Europa y Argentina).

---

## 3. Registro Canónico de Fuentes en Código

Las fuentes se encuentran modeladas en [`src/data/clinical-sources.ts`](file:///Users/lucassebastianrobles/Proyectos%20de%20Apps/Copiloto-UCO-v0.2.0-beta.1/src/data/clinical-sources.ts) con identificadores únicos (`sourceId`), asegurando que cada regla del motor enlace formalmente a su origen documental accesible offline.
