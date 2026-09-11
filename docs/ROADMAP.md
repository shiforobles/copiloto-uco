# Roadmap de Desarrollo — Copiloto UCO

## Estado Actual: v0.3.1-beta.1 (Consolidación de Arquitectura y Seguridad)

| Versión | Alcance Principal | Estado |
|---|---|---|
| **v0.1.0** | Motores basales: Cockcroft-Gault, CKD-EPI 2021, conversión bidireccional de goteos y reglas renales iniciales. | Completado |
| **v0.2.0-beta.1** | Matriz terapéutica SCA (36 alternativas en 10 grupos), checklist clínico, flujo progresivo mobile. | Completado |
| **v0.3.0-beta.1** | Matrices IC/Shock y FA, score CHA₂DS₂-VASc, auditoría de seguridad en 4 bloques, tristate booleanos. | Completado (173 tests) |
| **v0.3.1-beta.1** | **(Versión actual)** Identidad farmacológica transversal canónica, procedencia clínica formal, contexto renal trazable con pesos diferenciados, perfiles de guías (ESC 2024 vs ACC/AHA 2023), auditoría de ACOD y UX móvil de recorrida. | En ejecución |

---

## Fases Futuras

### v0.4.0 — Trombosis Venosa Profunda y Tromboembolismo Pulmonar (TEP/TVP)
- Estratificación de riesgo en TEP (sPESI, biomarcadores, ecocardiograma/VD).
- Regímenes diferenciados de anticoagulación para tratamiento agudo de TEV vs profilaxis vs FA.
- Criterios de reperfusión farmacológica (trombolisis sistémica / dosis reducida) y embolectomía.

### v0.5.0 — Arritmias Ventriculares y Paro Cardíaco
- Tormenta eléctrica y taquicardia ventricular con pulso.
- Algoritmos ACLS / ERC postparo (manejo de temperatura, metas hemodinámicas, angiografía inmediata).
- Bradicardias sintomáticas y marcapasos transitorio.

### v0.6.0 — Cuidados Transversales Críticos y Emergencias Vasculares
- Síndrome aórtico agudo (control anti-impulso estricto de FC y TAS).
- Emergencia hipertensiva con daño de órgano blanco.
- Protocolos de reversión de anticoagulantes (idarucizumab, andexanet alfa, complejo protrombínico).

### v1.0.0 — Validación Institucional y Producción
- Auditoría médica formal y rubicado de reglas (`verified: true`).
- Integración opcional de proveedor de voz local/offline para dictado de laboratorio.
- Modo multi-paciente en memoria local (pase de sala de unidad completa).
