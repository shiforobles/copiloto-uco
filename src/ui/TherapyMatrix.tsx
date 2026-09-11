import { useMemo, useState } from 'react';
import type { SessionAction, SessionState } from '../context/session';
import { scaTherapyGroups, scaTherapyOptionCount } from '../data/sca-therapy-matrix';
import { evaluateScaTherapyOption } from '../rules/sca-therapy.engine';
import type { TherapyGroup, TherapyRole } from '../rules/types';

interface TherapyMatrixProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
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

const phaseLabel: Record<NonNullable<SessionState['phase']>, string> = {
  shock_inotropicos: 'shock/inotrópicos',
  compensado: 'estabilizado',
  pre_alta: 'pre-alta',
};

const subtypeLabel: Record<SessionState['scaSubtype'], string> = {
  unknown: 'subtipo no definido',
  stemi: 'SCACEST',
  nstemi: 'SCASEST',
};

const strategyLabel: Record<SessionState['scaStrategy'], string> = {
  unknown: 'estrategia no definida',
  pci: 'PCI',
  fibrinolysis: 'fibrinólisis',
  medical: 'manejo médico',
};

export function TherapyMatrix({ state, dispatch }: TherapyMatrixProps) {
  const [query, setQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(scaTherapyGroups.filter((group) => group.defaultOpen).map((group) => group.id)),
  );
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());

  const normalizedQuery = query.trim().toLocaleLowerCase('es');

  const visibleGroups = useMemo(() => {
    return scaTherapyGroups
      .map((group) => ({
        ...group,
        options: group.options.filter((option) => {
          if (showSelectedOnly && !state.selectedTherapyOptionIds.includes(option.id)) return false;
          if (!normalizedQuery) return true;
          return [option.name, option.when, option.loadOrStart, option.maintenance]
            .join(' ')
            .toLocaleLowerCase('es')
            .includes(normalizedQuery);
        }),
      }))
      .filter((group) => group.options.length > 0);
  }, [normalizedQuery, showSelectedOnly, state.selectedTherapyOptionIds]);

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

  const selectedCount = state.selectedTherapyOptionIds.length;

  return (
    <section id="section-checklist" className="scroll-mt-20 space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400">
            SCA · matriz terapéutica
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">
            Alternativas por fármaco
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {scaTherapyOptionCount} opciones · {state.phase ? phaseLabel[state.phase] : 'fase no definida'}
          </p>
        </div>
        <span className={selectedCount > 0 ? 'badge border border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'badge-info'}>
          {selectedCount} recibe
        </span>
      </div>

      <div className="rounded-xl border border-amber-700/40 bg-amber-950/25 px-3 py-2.5">
        <p className="text-xs leading-relaxed text-amber-200/90">
          Borrador para curación clínica. “Lo recibe” registra la medicación actual; no equivale a indicarla.
          La app mantiene todas las alternativas visibles y señala incompatibilidades con los datos cargados.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900/55 p-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="badge-info">{subtypeLabel[state.scaSubtype]}</span>
          <span className="badge-info">{strategyLabel[state.scaStrategy]}</span>
          {state.hasAF && <span className="badge-warning">FA</span>}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Sin subtipo o estrategia también ves todo. Al completarlos, las filas se contextualizan sin desaparecer.
        </p>
      </div>

      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Buscar fármaco</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input-field py-2 text-sm"
            placeholder="Buscar: rosu, biso, clopi…"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowSelectedOnly((value) => !value)}
          className={showSelectedOnly ? 'quick-chip quick-chip-active shrink-0' : 'quick-chip shrink-0'}
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
            const selectedInGroup = group.options.filter((option) =>
              state.selectedTherapyOptionIds.includes(option.id),
            ).length;
            const isOpen = normalizedQuery.length > 0 || showSelectedOnly || openGroups.has(group.id);
            const duplicateSelection = group.selectionMode === 'one' && selectedInGroup > 1;

            return (
              <article
                key={group.id}
                className={duplicateSelection ? 'overflow-hidden rounded-2xl border border-rose-600/50 bg-rose-950/15' : 'overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/65'}
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
                          const evaluation = evaluateScaTherapyOption(option, state);
                          const hasAlert = evaluation.warnings.length > 0;

                          return (
                            <TableOptionRows
                              key={option.id}
                              selected={selected}
                              expanded={expanded}
                              hasAlert={hasAlert}
                              evaluation={evaluation}
                              onExpand={() => toggleSetItem(setExpandedOptions, option.id)}
                              onToggle={() => dispatch({ type: 'TOGGLE_THERAPY_OPTION', optionId: option.id })}
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

      <div className="rounded-xl border border-sky-800/30 bg-sky-950/20 px-3 py-2.5">
        <p className="text-[11px] leading-relaxed text-sky-200/75">
          Lípidos: en ASCVD de muy alto riesgo, la guía AHA/ACC 2026 propone LDL-C &lt;55 mg/dL.
          El objetivo y los agregados deben individualizarse con LDL basal, tolerancia y protocolo local.
        </p>
      </div>
    </section>
  );
}

interface TableOptionRowsProps {
  selected: boolean;
  expanded: boolean;
  hasAlert: boolean;
  evaluation: ReturnType<typeof evaluateScaTherapyOption>;
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
      <tr className={selected ? 'border-t border-emerald-700/30 bg-emerald-950/20 align-top' : 'border-t border-slate-700/40 align-top'}>
        <td className="px-2 py-2">
          <button type="button" className="w-full text-left" onClick={onExpand} aria-expanded={expanded}>
            <span className="block break-words text-[11px] font-semibold leading-tight text-slate-200">
              {option.name} {hasAlert && <span className="text-amber-400">⚠</span>}
            </span>
            <span className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${roleClass[option.role]}`}>
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
          {option.maximum && <span className="mt-1 block text-[9px] text-slate-500">Máx.: {option.maximum}</span>}
        </td>
        <td className="px-1 py-2 text-center">
          <button
            type="button"
            onClick={onToggle}
            aria-label={`${selected ? 'Quitar' : 'Marcar'} ${option.name} como medicación actual`}
            aria-pressed={selected}
            className={selected
              ? 'mx-auto flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/50 bg-emerald-500/25 text-sm font-bold text-emerald-300'
              : 'mx-auto flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600/60 bg-slate-900/60 text-base text-slate-500'}
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
                <p className="mt-1 text-xs font-medium leading-relaxed text-sky-200">{evaluation.patientDose}</p>
              </div>
            )}

            {evaluation.warnings.map((warning) => (
              <p key={warning} className="mb-1.5 text-[11px] font-medium leading-relaxed text-amber-300">
                ⚠ {warning}
              </p>
            ))}

            {evaluation.contextNotes.map((note) => (
              <p key={note} className="mb-1.5 text-[11px] leading-relaxed text-slate-400">{note}</p>
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

