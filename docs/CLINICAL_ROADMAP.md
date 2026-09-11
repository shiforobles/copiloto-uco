# Mapa maestro clínico — Copiloto UCO

## Definición del producto

Copiloto UCO debe responder tres consultas durante la recorrida:

1. **Patología → tratamiento esperado:** qué debería recibir el paciente según síndrome, subtipo y situación.
2. **Medicación → dosis individual:** dosis, vía, frecuencia, duración, ajustes y monitorización.
3. **Auditoría diaria:** qué falta, qué ya recibe, qué debe evitarse y qué dato falta para decidir.

La carga es progresiva. La ausencia de datos no debe ocultar la orientación general, pero sí debe impedir que una dosis no individualizada se presente como definitiva.

## Reglas de experiencia de uso

- Patología y situación clínica: máximo dos toques.
- No exigir la carga completa de medicación.
- Mostrar el tratamiento general desde el primer momento.
- Refinar automáticamente al agregar peso, función renal, electrolitos y signos vitales.
- Usar estados inequívocos: `referencia`, `individualizado`, `precaución`, `evitar`, `contraindicado` y `dato faltante`.
- Nunca interpretar ausencia de datos como normalidad.
- Separar claramente **leer una recomendación** de **marcar que el paciente la recibe**.
- Mantener accesos directos a tratamiento, dosis, goteos y datos.

## Contexto clínico del paciente

### Datos esenciales

- Edad, sexo biológico, peso, talla.
- Creatinina actual, tendencia, AKI y diálisis.
- TAS/TAM, FC, ritmo y situación hemodinámica.
- Potasio, magnesio, hemoglobina y plaquetas.
- Sangrado activo, alergias y medicación actual conocida.

### Datos contextuales según módulo

- FEVI, congestión, perfusión y soporte vasoactivo.
- STEMI/NSTEMI, tiempo de evolución y estrategia de reperfusión.
- PCI, fibrinólisis, cirugía o procedimiento planificado.
- QTc, cardioversión, válvula mecánica y anticoagulación previa.
- Función hepática, embarazo, fragilidad y capacidad de vía oral.

## Cobertura clínica priorizada

| Prioridad | Módulo | Decisiones principales | Estado |
| --- | --- | --- | --- |
| P0 | SCA | STEMI/NSTEMI, reperfusión, antiagregación, anticoagulación, estatina, sangrado | Matriz de 36 opciones implementada; requiere curación y casos de mesa |
| P0 | IC aguda y shock | Fenotipo, congestión, perfusión, FEVI, diuréticos, vasodilatadores, inotrópicos y GDMT | Prototipo; requiere rediseño clínico |
| P0 | FA/flutter | Estabilidad, frecuencia/ritmo, cardioversión, anticoagulación y dosis | Pendiente |
| P0 | Seguridad antitrombótica | Profilaxis TEV, tratamiento, sangrado, reversión y reinicio | Pendiente |
| P0 | Cuidados transversales | Profilaxis de úlcera de estrés basada en riesgo, glucemia, K/Mg y nefrotoxicidad | Pendiente |
| P1 | Arritmias críticas | TSV, TV, tormenta eléctrica, FV, bradicardia y bloqueos AV | Pendiente |
| P1 | TEP/TVP | Estratificación, anticoagulación, reperfusión y seguimiento | Pendiente |
| P1 | Posparo cardíaco | Temperatura, hemodinamia, ventilación, coronarias y neuropronóstico | Pendiente |
| P1 | Emergencia hipertensiva | Órgano blanco, fármaco EV, objetivos y velocidad de descenso | Pendiente |
| P1 | Síndrome aórtico agudo | Control antiimpulso, analgesia e intervención | Pendiente |
| P2 | Valvulopatía aguda | IM/IA aguda, estenosis crítica, prótesis y soporte puente | Pendiente |
| P2 | Miocarditis/pericarditis | Presentación, riesgo, taponamiento y tratamiento | Pendiente |
| P2 | Endocarditis | Hemocultivos, antibióticos, complicaciones y cirugía | Pendiente |
| P2 | Falla derecha/HP | Precarga, poscarga, oxigenación e inotrópicos | Pendiente |

## Esquema mínimo de una regla terapéutica

Cada recomendación futura debe contener:

- Identificador y versión.
- Síndrome, subtipo, indicación y objetivo terapéutico.
- Criterios necesarios y criterios de exclusión.
- Medicamento, vía, carga, mantenimiento, intervalo y duración.
- Métrica renal utilizada: Cockcroft-Gault, eGFR u otra.
- Ajustes por peso, edad, función hepática y diálisis.
- Modificadores por TA, FC, K, Mg, QTc, plaquetas y sangrado.
- Interacciones, duplicaciones y contraindicaciones.
- Monitorización y criterio de suspensión.
- Fuente primaria, fecha de revisión y jurisdicción.
- Estado `verified` y profesional que verificó la regla.

## Jerarquía de evidencia

1. Guía clínica oficial vigente.
2. Prospecto o ficha regulatoria oficial de la indicación concreta.
3. Presentación comercial disponible en Argentina.
4. Protocolo y dilución local de la UCO.
5. Verificación clínica final antes de habilitar la regla.

Fuentes troncales iniciales:

- [AHA/ACC 2025 — Síndrome coronario agudo](https://professional.heart.org/en/science-news/2025-guideline-for-the-management-of-patients-with-acute-coronary-syndromes)
- [ESC 2026 — Insuficiencia cardíaca](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure/)
- [ESC 2024 — Fibrilación auricular](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/atrial-fibrillation/)
- [ESC 2022 — Arritmias ventriculares](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/ventricular-arrhythmias-and-the-prevention-of-sudden-cardiac-death/)
- [ESC 2019 — Tromboembolismo pulmonar](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/acute-pulmonary-embolism/)
- [AHA 2025 — Reanimación y cuidados posparo](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines)
- [SCCM/ASHP — Prevención del sangrado gastrointestinal por estrés](https://sccm.org/clinical-resources/guidelines/guidelines)

## Secuencia de implementación

1. Cerrar el esquema de reglas y los estados de salida.
2. Curar un circuito SCA completo y probarlo con casos clínicos de mesa.
3. Implementar la auditoría transversal: TEV, sangrado, protección gástrica, glucemia y electrolitos.
4. Curar IC/shock y FA.
5. Añadir el resto de patologías por frecuencia y riesgo.
6. Habilitar una regla únicamente después de revisión médica y pruebas discriminantes.
