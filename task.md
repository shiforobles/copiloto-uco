# Plan de Trabajo Copiloto UCO v0.3.1-beta.1

## Etapa 0 — Auditoría inicial y versión
- [x] Ejecutar npm test (173 tests verificados), npm run typecheck, npm run build
- [x] Actualizar package.json y package-lock.json a 0.3.1-beta.1
- [x] Crear/actualizar documentación permanente en el proyecto: docs/ARCHITECTURE.md, docs/CLINICAL-SOURCES.md, docs/ROADMAP.md, task.md

## Etapa 1 — Registro canónico de medicamentos
- [x] Definir tipos: DrugId, DrugClassId, IndicationId, RegimenId, SourceId, CanonicalDrug, TherapyRegimen, ClinicalSource, CurrentMedication
- [x] Implementar catálogo canónico de medicamentos con IDs estables (aspirin, clopidogrel, ticagrelor, prasugrel, atorvastatin, rosuvastatin, simvastatin, bisoprolol, nebivolol, metoprolol, carvedilol, enoxaparin, unfractionated-heparin, apixaban, rivaroxaban, dabigatran, edoxaban, etc.)
- [x] Separar regímenes por indicación (ej. enoxaparina SCA vs TVP vs AC; apixabán FA vs TVP)
- [x] Soporte no farmacológico: kind: "procedure" | "strategy" sin drugId obligatorio

## Etapa 2 — Migración transversal
- [x] Migrar matrices (SCA, IC/shock, FA) y motores al registro canónico
- [x] Desacoplar dosis terapéutica, concentración preparada y velocidad de infusión
- [x] Conectar reglas renales y checklist con drugId canónico
- [x] Mantener los 173 tests preexistentes pasando

## Etapa 3 — Medicación actual sincronizada
- [x] Normalizar medicación actual en SessionState (currentMedications: CurrentMedication[])
- [x] Reducer: ADD_CURRENT_MEDICATION, REMOVE_CURRENT_MEDICATION, UPDATE_CURRENT_MEDICATION, RESET_SESSION
- [x] Sincronización bidireccional transversal entre módulos (si bisoprolol se marca en IC, se refleja en SCA/FA y viceversa)
- [x] Distinguir "recibe el fármaco" de "coincide con régimen evaluado"
- [x] Detección de duplicación de principio activo y clase farmacológica

## Etapa 4 — Contexto renal trazable y peso utilizado
- [x] Crear contexto renal unificado y trazable: Cr, edad, sexo, peso actual, peso ideal (Devine), peso ajustado, IMC, ClCr Cockcroft-Gault, peso usado en CG, eGFR CKD-EPI 2021
- [x] Mostrar explícitamente qué función renal se usó en cada ajuste
- [x] Manejo de obesidad con discriminación de peso utilizado
- [x] No emitir falsa dosis individualizada ante datos faltantes

## Etapa 5 — Corrección estructural de FA
- [x] Reemplazar afDuration por categorías: <24h, 24–48h, ≥48h, unknown
- [x] Tristate para anticoagulación ≥3 sem, adherencia, ETE sin trombo, prótesis mecánica, estenosis mitral reumática, sangrado activo
- [x] Separar paciente inestable (cardioversión urgente) vs estable (guiado por duración/anticoagulación/ETE)
- [x] Calcular CHA₂DS₂-VASc y CHA₂DS₂-VA (ESC 2024) por separado
- [x] Selector de perfil de guía: ESC 2024, ACC/AHA 2023, Comparar guías, Protocolo institucional

## Etapa 6 — Regímenes de ACOD y jurisdicción
- [x] Auditar regímenes de apixabán, rivaroxabán, dabigatrán, edoxabán con umbrales y criterios explícitos
- [x] Perfiles regulatorios (AR-ANMAT, EU-EMA, US-FDA) con enfoque inicial Argentina y verified: false
- [x] Documentar motivos de precaución/no recomendado/contraindicado

## Etapa 7 — Registro canónico de fuentes clínicas
- [x] Implementar src/data/clinical-sources.ts con sourceId, organización, título, año, URL, jurisdicción, tipo
- [x] Garantizar que reglas verified: true tengan fuente válida
- [x] Disponibilidad de metadatos offline

## Etapa 8 — UX práctica para recorrida
- [x] Vista compacta mobile-first para pase de sala (Recibe, Falta considerar, Precaución, Evitar)
- [x] Buscador transversal por nombre, clase y alias
- [x] Accesibilidad táctil (touch targets ≥44px), visualización en 390px y 430px sin scroll horizontal

## Etapa 9 — Tests obligatorios (meta ≥ 208 tests)
- [x] Agregar ≥ 35 tests discriminantes nuevos que cubran los requisitos de v0.3.1 (41 tests nuevos agregados: 214 totales)
- [x] Verificar que no se rompa ninguna prueba existente (173/173 preexistentes aprobadas)

## Etapa 10 — Git, verificación y documentación final
- [x] Inicializar git repo si no existe (git init, sin remoto)
- [x] Actualizar README.md, CHANGELOG.md, docs/ARCHITECTURE.md, docs/CLINICAL-SOURCES.md, docs/ROADMAP.md, task.md
- [x] Ejecutar verificaciones: npm test, npm run typecheck, npm run build, ENABLE_PWA=true npm run build, git status --short
