# Copiloto UCO

Referencia profesional en desarrollo para UCO de adultos en Argentina. Diseñada para consultar en la cabecera y trasladar las decisiones del médico a sus indicaciones en papel.

**App:** https://shiforobles.github.io/copiloto-uco/

## Flujo principal

1. Cargar en **Paciente** edad, sexo, peso, talla, función renal, condición y fase clínica.
2. Abrir una tarjeta de **Referencia terapéutica**. No se marcan tratamientos como administrados ni se ocultan por haberlos consultado.
3. Completar los antecedentes y laboratorios que modifican la elección. “No informado” nunca equivale a un resultado negativo.
4. Revisar alternativas, motivos, datos faltantes, contraindicaciones y controles.
5. Consultar **Laboratorio y continuidad de cuidados**: diferencia evaluación actual, coordinación antes del alta y seguimiento ambulatorio.

### Doble antiagregación: consulta inmediata

Desde **Paciente → Condición: SCA → Doble antiagregación**, la tabla muestra siempre AAS, ticagrelor, prasugrel y clopidogrel con mantenimiento, escenario, contraindicaciones y datos pendientes, aunque no haya otros datos cargados.

**Decisión rápida** contiene seis campos: tipo de SCA, estrategia, sangrado activo, ACV/AIT, indicación de anticoagulación oral y P2Y12 actual. Con tipo y estrategia ya se ordenan las alternativas. Edad y peso se reutilizan desde Paciente. El resto se consulta en **Datos avanzados**, inicialmente cerrado. Fase clínica y estabilidad renal no son requisitos para mostrar la tabla; sus advertencias se conservan.

Cada droga distingue opción habitual/alternativa, precaución, evitar/contraindicada o confirmar dato. Un antecedente positivo afecta a las filas correspondientes; un desconocido pide **Confirmar antes de indicar**. Ninguno elimina las otras referencias. Los datos se conservan al navegar durante la misma sesión.

La presentación progresiva está separada del evaluador terapéutico existente, que mantiene sus reglas y pruebas. **Validación local pendiente**; las pruebas de interfaz no constituyen validación clínica.

### Cobertura actual

- 16 fichas de cuadros clínicos y 31 fichas de drogas, buscables por nombre o siglas.
- Doble antiagregación contextual para SCA: PCI, fibrinólisis, manejo médico, cirugía, anticoagulación oral, edad, peso, función renal, sangrado, hemoglobina, plaquetas, ACV/AIT, hemorragia intracraneal, hepatopatía, interacciones y tratamiento previo.
- Fichas de estatinas, ARNI/IECA/ARA II, betabloqueantes, ARM, iSGLT2, diuréticos y anticoagulación. La profundidad de personalización varía: no todas seleccionan una droga o calculan una dosis.
- Controles e interconsultas con motivo explícito: Cardiología/rehabilitación, Nefrología, Hematología, evaluación hepática y Diabetología/Endocrinología cuando los hallazgos lo ameritan.
- Calculadora bidireccional de infusiones con preparación real ingresada, 9 unidades de dosis, coma decimal, dimensionalidad validada y pasos auditables.
- Cockcroft–Gault y CKD-EPI 2021. Se evita aplicar ecuaciones estables en LRA/diálisis y reglas adultas en menores.
- Preparaciones de ejemplo y reglas renales heredadas, visibles como borradores; las diluciones requieren confirmación antes de mostrar un cálculo.

## Alcance clínico

Las síntesis y reglas están **pendientes de validación clínica local**. No cubren toda la práctica de UCO ni aseguran la integridad del tratamiento o la aptitud de alta. Las pruebas automáticas verifican lógica y cálculos, no eficacia ni seguridad clínica.

Las fichas incluyen enlaces a guías y prospectos. Las referencias AEMPS, DailyMed, NICE y otras fuentes externas deben contrastarse con el prospecto autorizado en Argentina y el protocolo del servicio. La app no afirma disponibilidad comercial local.

La antiagregación presenta alternativas de mantenimiento y solicita datos decisivos; no automatiza cargas, cambios de P2Y12 ni suspensión de un tratamiento previo. Las señales hemorrágicas son parciales: no representan un score ARC-HBR o PRECISE-DAPT completo ni certifican riesgo bajo. La talla no determina por sí sola una dosis antiagregante.

## Privacidad y uso sin conexión

- Sin nombres, DNI ni historia clínica. Sin backend, analítica, envío de datos clínicos ni almacenamiento persistente de la sesión.
- Los datos quedan en memoria y se borran al recargar o iniciar **Nueva sesión**.
- La PWA guarda los recursos de la app para su uso posterior sin conexión. Los enlaces a fuentes externas requieren internet.
- Una nueva versión pide actualizar; la actualización recarga y borra la sesión actual. No aceptar una actualización en medio de una consulta que se necesite conservar.

## Desarrollo

React 19, TypeScript, Vite, Tailwind y Vitest. Node.js 24 en CI.

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
ENABLE_PWA=true npm run build
```

El sitio se sirve bajo `/copiloto-uco/`. `ENABLE_PWA=true` genera el service worker; el desarrollo habitual no registra uno.

Los íconos se regeneran sin dependencias adicionales con `node scripts/generate-icons.mjs`.

## Organización

- `src/clinical/`: catálogo, fuentes, contexto del paciente, evaluación terapéutica y seguimiento.
- `src/engine/`: funciones determinísticas de cálculo.
- `src/context/session.tsx`: estado temporal compartido entre pantallas.
- `src/ui/`: navegación, fichas, formularios y calculadoras.
- `src/data/` y `src/rules/`: preparaciones, reglas renales y módulos heredados. Los antiguos checklists de datos no alimentan la referencia terapéutica actual.
- `tests/`: casos de referencia, límites numéricos, ramas clínicas e integración de navegación y sesión; todos los casos son sintéticos.

## Publicación

Un push a `main` ejecuta instalación, TypeScript, pruebas y build PWA antes de publicar en GitHub Pages. La versión desplegada se puede identificar en GitHub Actions.

## Próxima validación con el servicio

Revisar cada rama clínica con casos representativos, completar presentaciones locales, conciliación integral de medicación, protocolos de cambios de antitrombóticos, titulación, compatibilidades y cobertura de patologías aún ausentes. Mantener la fecha y procedencia de toda regla modificada.
