/**
 * Componente de tabla terapéutica reutilizable.
 *
 * Usado por TherapyMatrix (SCA), HFTherapyMatrix (IC) y AFMatrix (FA).
 * Recibe:
 * - groups: TherapyGroup[]
 * - evaluateOption: función evaluadora específica del módulo
 * - selectedIds: IDs de medicación actual
 * - onToggle: callback para marcar/desmarcar
 * - matrixTitle: título del encabezado
 * - matrixBadge: texto del badge de conteo
 */

import { useMemo, useState } from 'react';
import type { EvaluatedTherapyOption, TherapyGroup, TherapyOption, TherapyRole } from '../../rules/types';
import type { SessionState } from '../../context/session';
import type { SessionAction } from '../../context/session';
import { CANONICAL_DRUGS } from '../../data/canonical-drugs';
import { getTraceableRenalContext } from '../../engine/renal';

export interface TherapyTableProps {
  groups: TherapyGroup[];
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  evaluateOption: (option: TherapyOption, state: SessionState) => EvaluatedTherapyOption;
  matrixTitle: string;
  matrixSubtitle: string;
  contextBadges?: React.ReactNode;
}

const roleLabel: Record<TherapyRole, string> = {
  base: 'base',
  preferred: 'preferida',
  alternative: 'alternativa',
  add_on: 'agregado',
  rescue: 'rescate',
};

const roleClass: Record<TherapyRole, string> = {
  base: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  preferred: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  alternative: 'border-slate-600/50 bg-slate-700/30 text-slate-400',
  add_on: 'border-violet-500/30 bg-violet-500/15 text-violet-300',
  rescue: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
};

const modeLabel: Record<TherapyGroup['selectionMode'], string> = {
  one: 'elegir 1',
  one_or_more: 'agregar según objetivo',
  conditional: 'sólo si corresponde',
};

export function TherapyTable({
  groups,
  state,
  dispatch,
  evaluateOption,
  matrixTitle,
  matrixSubtitle,
  contextBadges,
}: TherapyTableProps) {
  const [query, setQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showRoundsSummary, setShowRoundsSummary] = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(groups.filter((g) => g.defaultOpen).map((g) => g.id)),
  );
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());

  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const renalCtx = useMemo(() => getTraceableRenalContext(state), [state]);

  const roundsMetrics = useMemo(() => {
    let missingGroupsCount = 0;
    let cautionCount = 0;
    let avoidCount = 0;

    for (const group of groups) {
      const selectedInGroup = group.options.some((o) => state.selectedTherapyOptionIds.includes(o.id));
      if (!selectedInGroup && group.selectionMode !== 'conditional') {
        missingGroupsCount++;
      }
      for (const option of group.options) {
        const evalRes = evaluateOption(option, state);
        if (evalRes.warnings.length > 0) {
          cautionCount++;
          if (evalRes.warnings.some((w) => /contraindicad|evitar|grave/i.test(w))) {
            avoidCount++;
          }
        }
      }
    }
    return { missingGroupsCount, cautionCount, avoidCount };
  }, [groups, state, evaluateOption]);

  const visibleGroups = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter((option) => {
          if (showSelectedOnly && !state.selectedTherapyOptionIds.includes(option.id)) return false;
          if (!normalizedQuery) return true;
          const canonical = option.drugId ? CANONICAL_DRUGS[option.drugId as keyof typeof CANONICAL_DRUGS] : undefined;
          const searchTokens = [
            option.name,
            option.when,
            option.loadOrStart,
            option.maintenance,
            canonical?.name,
            canonical?.className,
            canonical?.synonyms?.join(' '),
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase('es');
          return searchTokens.includes(normalizedQuery);
        }),
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, normalizedQuery, showSelectedOnly, state.selectedTherapyOptionIds]);

  const toggleSetItem = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = state.selectedTherapyOptionIds.filter((id) =>
    groups.flatMap((g) => g.options).some((o) => o.id === id),
  ).length;

  return (
    <section id="section-checklist" className="scroll-mt-20 space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400">
            {matrixSubtitle}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">
            {matrixTitle}
          </h2>
        </div>
        <span className={selectedCount > 0 ? 'badge border border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'badge-info'}>
          {selectedCount} recibe
        </span>
      </div>

      {/* ── Resumen compacto de recorrida clínica (Recibe / Falta / Precaución / Evitar) ── */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3">
        <button
          type="button"
          onClick={() => setShowRoundsSummary((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300 min-h-[44px]"
        >
          <span>Resumen de Recorrida UCO</span>
          <span className="text-sky-400">{showRoundsSummary ? 'Plegar' : 'Expandir'}</span>
        </button>
        {showRoundsSummary && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2">
              <span className="block text-[10px] font-bold uppercase text-emerald-400">Recibe</span>
              <span className="text-lg font-bold text-emerald-300">{selectedCount}</span>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-2">
              <span className="block text-[10px] font-bold uppercase text-amber-400">Falta considerar</span>
              <span className="text-lg font-bold text-amber-300">{roundsMetrics.missingGroupsCount}</span>
            </div>
            <div className="rounded-lg border border-sky-500/30 bg-sky-950/30 p-2">
              <span className="block text-[10px] font-bold uppercase text-sky-400">Precaución</span>
              <span className="text-lg font-bold text-sky-300">{roundsMetrics.cautionCount}</span>
            </div>
            <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2">
              <span className="block text-[10px] font-bold uppercase text-rose-400">Evitar / Alerta</span>
              <span className="text-lg font-bold text-rose-300">{roundsMetrics.avoidCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Banner trazable de función renal y peso ── */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-200">
              {renalCtx.clcrCockcroftGault !== null ? (
                <>
                  <span className="text-sky-300">ClCr {renalCtx.clcrCockcroftGault.toFixed(1)} mL/min</span>
                  <span className="text-slate-400 font-normal"> (Cockcroft-Gault, {renalCtx.clcrWeightStrategy === 'adjusted' ? 'peso ajustado' : 'peso real'} {renalCtx.clcrWeightUsed} kg)</span>
                  {renalCtx.egfrCkdEpi2021 !== null && (
                    <span className="text-slate-500 font-normal"> · eGFR {renalCtx.egfrCkdEpi2021.toFixed(1)} (CKD-EPI)</span>
                  )}
                </>
              ) : renalCtx.egfrCkdEpi2021 !== null ? (
                <>
                  <span className="text-sky-300">eGFR {renalCtx.egfrCkdEpi2021.toFixed(1)} mL/min/1.73m²</span>
                  <span className="text-slate-400 font-normal"> (CKD-EPI 2021)</span>
                </>
              ) : (
                <span className="text-amber-400/90 font-medium">Función renal no calculada (faltan datos)</span>
              )}
            </p>
            {renalCtx.missingDataForClcr.length > 0 ? (
              <p className="text-[11px] text-amber-300/80">
                Para individualizar dosis renales falta: {renalCtx.missingDataForClcr.join(', ')}.
              </p>
            ) : (
              <p className="text-[11px] text-emerald-400/80">
                Parámetros renales completos para ajuste de dosis.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              document.getElementById('section-patient')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="min-h-[44px] px-3 py-1.5 rounded-lg border border-sky-600/40 bg-sky-950/40 text-xs font-medium text-sky-300 hover:bg-sky-900/50"
          >
            Modificar datos paciente
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-700/40 bg-amber-950/25 px-3 py-2.5">
        <p className="text-xs leading-relaxed text-amber-200/90">
          Borrador para curación clínica. "Lo recibe" registra la medicación actual; no equivale a indicarla.
          La app mantiene todas las alternativas visibles y señala incompatibilidades.
        </p>
      </div>

      {contextBadges && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/55 p-3">
          <div className="flex flex-wrap gap-1.5">{contextBadges}</div>
        </div>
      )}

      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Buscar fármaco</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field py-2 text-sm"
            placeholder="Buscar por nombre, clase, alias, indicación…"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowSelectedOnly((v) => !v)}
          className={showSelectedOnly ? 'quick-chip quick-chip-active shrink-0 min-h-[44px]' : 'quick-chip shrink-0 min-h-[44px]'}
        >
          {showSelectedOnly ? '✓ Recibe' : 'Ver recibe'}
        </button>
      </div>

      {visibleGroups.length === 0 ? (
        <div className="card border-dashed text-center text-sm text-slate-500">
          No hay filas que coincidan con este filtro.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleGroups.map((group) => {
            const selectedInGroup = group.options.filter((o) =>
              state.selectedTherapyOptionIds.includes(o.id),
            ).length;
            const isOpen = normalizedQuery.length > 0 || showSelectedOnly || openGroups.has(group.id);
            const duplicateSelection = group.selectionMode === 'one' && selectedInGroup > 1;

            return (
              <article
                key={group.id}
                className={
                  duplicateSelection
                    ? 'overflow-hidden rounded-2xl border border-rose-600/50 bg-rose-950/15'
                    : 'overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/65'
                }
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                  onClick={() => toggleSetItem(setOpenGroups, group.id)}
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-200">{group.title}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">{group.subtitle}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {selectedInGroup}/{group.options.length} · {modeLabel[group.selectionMode]}
                    </span>
                    <span className="mt-0.5 block text-xs text-sky-400">{isOpen ? 'Cerrar' : 'Abrir'}</span>
                  </span>
                </button>

                {duplicateSelection && (
                  <p className="border-t border-rose-700/30 bg-rose-950/30 px-3 py-2 text-xs font-medium text-rose-300">
                    ⚠ Marcaste más de una alternativa del mismo grupo. Revisar duplicación.
                  </p>
                )}

                {isOpen && (
                  <div className="border-t border-slate-700/50">
                    <table className="w-full table-fixed border-collapse text-left" aria-label={group.title}>
                      <colgroup>
                        <col className="w-[31%]" />
                        <col className="w-[25%]" />
                        <col className="w-[31%]" />
                        <col className="w-[13%]" />
                      </colgroup>
                      <thead className="bg-slate-950/45">
                        <tr className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                          <th className="px-2 py-2">Droga</th>
                          <th className="px-1.5 py-2">Carga/inicio</th>
                          <th className="px-1.5 py-2">Mant./máx.</th>
                          <th className="px-1 py-2 text-center">Recibe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.options.map((option) => {
                          const selected = state.selectedTherapyOptionIds.includes(option.id);
                          const expanded = expandedOptions.has(option.id);
                          const evaluation = evaluateOption(option, state);
                          const hasAlert = evaluation.warnings.length > 0;

                          return (
                            <TableOptionRows
                              key={option.id}
                              selected={selected}
                              expanded={expanded}
                              hasAlert={hasAlert}
                              evaluation={evaluation}
                              onExpand={() => toggleSetItem(setExpandedOptions, option.id)}
                              onToggle={() =>
                                dispatch({ type: 'TOGGLE_THERAPY_OPTION', optionId: option.id })
                              }
                            />
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Fila de opción (reutilizable internamente) ───────────────────────────────

interface TableOptionRowsProps {
  selected: boolean;
  expanded: boolean;
  hasAlert: boolean;
  evaluation: EvaluatedTherapyOption;
  onExpand: () => void;
  onToggle: () => void;
}

function TableOptionRows({
  selected,
  expanded,
  hasAlert,
  evaluation,
  onExpand,
  onToggle,
}: TableOptionRowsProps) {
  const { option } = evaluation;

  return (
    <>
      <tr
        className={
          selected
            ? 'border-t border-emerald-700/30 bg-emerald-950/20 align-top'
            : 'border-t border-slate-700/40 align-top'
        }
      >
        <td className="px-2 py-2">
          <button type="button" className="w-full text-left" onClick={onExpand} aria-expanded={expanded}>
            <span className="block break-words text-[11px] font-semibold leading-tight text-slate-200">
              {option.name} {hasAlert && <span className="text-amber-400">⚠</span>}
            </span>
            <span
              className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${roleClass[option.role]}`}
            >
              {roleLabel[option.role]}
            </span>
            <span className="mt-1 block text-[9px] text-sky-400">{expanded ? 'menos' : 'detalle'}</span>
          </button>
        </td>
        <td className="break-words px-1.5 py-2 text-[10px] leading-[1.35] text-sky-200/85">
          {option.loadOrStart}
        </td>
        <td className="break-words px-1.5 py-2 text-[10px] leading-[1.35] text-slate-300">
          {option.maintenance}
          {option.maximum && (
            <span className="mt-1 block text-[9px] text-slate-500">Máx.: {option.maximum}</span>
          )}
        </td>
        <td className="px-1 py-2 text-center">
          <button
            type="button"
            onClick={onToggle}
            aria-label={`${selected ? 'Quitar' : 'Marcar'} ${option.name} como medicación actual`}
            aria-pressed={selected}
            className={
              selected
                ? 'mx-auto flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-500/25 text-base font-bold text-emerald-300'
                : 'mx-auto flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-600/60 bg-slate-900/60 text-lg text-slate-500 hover:text-slate-300'
            }
          >
            {selected ? '✓' : '+'}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-t border-slate-700/30 bg-slate-950/55">
          <td colSpan={4} className="px-3 py-3">
            {evaluation.patientDose && (
              <div className="mb-2 rounded-lg border border-sky-700/30 bg-sky-950/30 px-2.5 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-sky-500">Con datos cargados</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-sky-200">
                  {evaluation.patientDose}
                </p>
              </div>
            )}

            {evaluation.warnings.map((warning) => (
              <p key={warning} className="mb-1.5 text-[11px] font-medium leading-relaxed text-amber-300">
                ⚠ {warning}
              </p>
            ))}

            {evaluation.contextNotes.map((note) => (
              <p key={note} className="mb-1.5 text-[11px] leading-relaxed text-slate-400">
                {note}
              </p>
            ))}

            {evaluation.missingData.length > 0 && (
              <p className="mb-2 text-[11px] leading-relaxed text-amber-400/85">
                Falta {evaluation.missingData.join(', ')} para contextualizar mejor; la referencia sigue visible.
              </p>
            )}

            <p className="text-[11px] leading-relaxed text-slate-300">
              <span className="font-semibold text-slate-400">Cuándo:</span> {option.when}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-rose-300/80">
              <span className="font-semibold">Evitar/revisar:</span> {option.avoid.join(' · ')}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              <span className="font-semibold">Control:</span> {option.monitoring.join(' · ')}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
              {option.sources.map((source) => (
                <a
                  key={`${option.id}-${source.url}`}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-sky-500 underline decoration-sky-700 underline-offset-2"
                >
                  {source.label}
                </a>
              ))}
              <span className="text-[10px] text-slate-600">· no verificado</span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
