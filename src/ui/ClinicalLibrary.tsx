import { useState } from 'react';
import { drugs } from '../clinical/drugs';
import { pathways } from '../clinical/pathways';
import { clinicalSources } from '../clinical/sources';
import { searchEntries } from '../clinical/search';
import { renalRules } from '../data/renal-rules';
import { useSession } from '../context/session';
import type { ClinicalEntry, ClinicalPathway, DrugEntry } from '../clinical/types';

export function Sources({ ids }: { ids: string[] }) {
  return <details className="source-details">
    <summary>Fuentes y estado de revisión</summary>
    <div className="pt-3 space-y-3">
      <p>Fuentes consultadas el 14–15/09/2026. Síntesis orientativa pendiente de validación del servicio. No es un protocolo institucional ni una ficha exhaustiva.</p>
      {ids.map(id => { const source = clinicalSources[id]; return source ? <a key={id} href={source.url} target="_blank" rel="noreferrer" className="block text-sky-300 underline underline-offset-4">{source.title} · {source.year} ↗</a> : null; })}
      <p>Las fichas DailyMed y AEMPS corresponden a otras jurisdicciones. Confirmar presentación y prospecto autorizado en Argentina. Los enlaces externos requieren conexión.</p>
    </div>
  </details>;
}

export function EntryCard({ entry, kind }: { entry: ClinicalEntry; kind: 'cuadros' | 'drogas' }) {
  return <a className="entry-card group" href={`#${kind}/${entry.id}`}>
    <div className="flex items-start justify-between gap-3"><span className="eyebrow">{entry.category}</span><span className="text-slate-500 group-hover:text-teal-300" aria-hidden="true">↗</span></div>
    <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-100">{entry.name}</h3>
    <p className="mt-2 text-sm text-slate-400 leading-relaxed">{entry.summary}</p>
    <span className="mt-5 inline-block text-xs text-teal-300">{kind === 'cuadros' ? 'Abrir ficha clínica' : 'Consultar droga'} →</span>
  </a>;
}

function PathwayDetail({ entry }: { entry: ClinicalPathway }) {
  const { state, dispatch } = useSession();
  const checked = state.pathwayChecks[entry.id] ?? [];
  return <article className="space-y-5">
    <a href="#cuadros" className="back-link">← Todos los cuadros</a>
    <div><span className="eyebrow">{entry.category}</span><h1 className="page-title mt-2">{entry.name}</h1><p className="page-subtitle">{entry.summary}</p></div>
    <div className={entry.urgent ? 'priority-panel' : 'card'}><span className="eyebrow text-teal-300">Prioridad inicial</span><p className="mt-2 text-lg text-slate-100 leading-relaxed">{entry.first}</p></div>
    <section className="card"><div className="flex justify-between gap-3 mb-3"><h2 className="font-semibold">Revisar en la cabecera</h2><span className="text-xs text-slate-400">{checked.length}/{entry.checks.length} revisados</span></div>
      <div className="divide-y divide-slate-700/60">{entry.checks.map((check, index) => <label key={check} className="flex gap-3 py-3 cursor-pointer text-sm leading-relaxed text-slate-300">
        <input type="checkbox" checked={checked.includes(index)} onChange={() => dispatch({ type: 'TOGGLE_PATHWAY_CHECK', pathwayId: entry.id, index })} className="mt-1 h-4 w-4 shrink-0 accent-teal-400" />{check}
      </label>)}</div>
      <p className="text-xs text-slate-500 mt-3">Marcar significa revisado; no registra administración ni confirma tratamiento completo.</p>
    </section>
    <section className="card-warning"><h2 className="text-sm font-semibold text-amber-200">Precaución clave</h2><p className="mt-2 text-sm text-amber-100/80 leading-relaxed">{entry.avoid}</p></section>
    {entry.drugIds.length > 0 && <section><h2 className="section-title">Drogas relacionadas</h2><p className="text-xs text-slate-400 mb-3">Alternativas según contexto; no indica combinarlas ni administrarlas automáticamente.</p><div className="flex flex-wrap gap-2">{entry.drugIds.map(id => <a key={id} className="link-chip" href={`#drogas/${id}`}>{drugs.find(d => d.id === id)?.name} →</a>)}</div></section>}
    <Sources ids={entry.sourceIds} />
  </article>;
}

function DrugDetail({ entry }: { entry: DrugEntry }) {
  const { state, dispatch } = useSession();
  const related = pathways.filter(p => p.drugIds.includes(entry.id));
  const isMinor = state.age !== null && state.age < 18;
  return <article className="space-y-5">
    <a href="#drogas" className="back-link">← Todas las drogas</a>
    <div><span className="eyebrow">{entry.category}</span><h1 className="page-title mt-2">{entry.name}</h1><p className="page-subtitle">{entry.summary}</p><span className="mt-3 badge-warning">Pendiente de validación local</span></div>
    <section className="card-warning"><h2 className="text-sm font-semibold text-amber-200">Antes de indicar</h2><p className="mt-2 text-sm text-amber-100/90 leading-relaxed">{entry.precautions}</p></section>
    {['aspirina', 'ticagrelor', 'clopidogrel', 'prasugrel'].includes(entry.id) && <a href="#tratamiento/doble-antiagregacion" className="feature-card block"><h2 className="font-semibold text-teal-200">Comparar antiagregación para el paciente actual →</h2><p className="mt-2 text-sm text-slate-400">Abrir indicación, contraindicaciones y alternativas según el contexto cargado.</p></a>}
    {entry.id === 'atorvastatina' && <a className="feature-card block" href="#tratamiento/estatina"><h2 className="font-semibold text-teal-200">Ver estatina y controles para este paciente →</h2></a>}
    <section className="card"><h2 className="section-title">Dosis por contexto · adultos</h2>
      {isMinor ? <p className="text-amber-200 text-sm">La edad cargada es pediátrica. Estos esquemas son exclusivamente para adultos.</p> : entry.doses.length ? <div className="space-y-3">{entry.doses.map(dose => <div key={dose.context} className="dose-reference"><h3 className="text-xs uppercase tracking-wide text-teal-300">{dose.context}</h3><p className="text-lg font-medium mt-2 leading-relaxed text-slate-100">{dose.text}</p><a className="text-xs text-slate-400 underline mt-3 inline-block" href={clinicalSources[dose.sourceId].url} target="_blank" rel="noreferrer">Ver fuente ↗</a></div>)}<p className="text-xs text-slate-400">Referencia no personalizada. Confirmar indicación, contraindicaciones, vía, preparación y dosis previas.</p></div> : <p className="text-sm text-slate-300 leading-relaxed">El esquema debe elegirse según indicación y protocolo del servicio. Consultá la fuente antes de definir dosis; la calculadora convierte la dosis que ingreses.</p>}
    </section>
    <section className="card"><h2 className="font-semibold text-sm">Qué monitorizar</h2><p className="mt-2 text-sm text-slate-300">{entry.monitoring}</p></section>
    {entry.infusionUnit && !isMinor && <a className="btn-primary inline-flex gap-3 items-center" href={`#infusiones/${entry.id}`}>Calcular infusión <span aria-hidden="true">→</span></a>}
    {!!entry.renalRuleIds?.length && <section className="card"><h2 className="font-semibold text-sm mb-2">Evaluación renal disponible</h2><p className="text-xs text-slate-400 mb-3">Reglas heredadas en borrador. Elegí la indicación; requieren función renal estable y datos completos.</p><div className="flex flex-wrap gap-2">{entry.renalRuleIds.map(id => <button className="btn-ghost text-sm" key={id} onClick={() => { dispatch({ type: 'ADD_RENAL_RULE', ruleId: id }); window.location.hash = 'paciente'; }}>{renalRules.find(r => r.id === id)?.indicacion ?? id} →</button>)}</div></section>}
    {!!related.length && <section><h2 className="section-title">Cuadros relacionados</h2><div className="flex gap-2 flex-wrap">{related.map(p => <a href={`#cuadros/${p.id}`} key={p.id} className="link-chip">{p.name} →</a>)}</div></section>}
    <Sources ids={entry.sourceIds} />
  </article>;
}

export function ClinicalLibrary({ kind, selectedId }: { kind: 'cuadros' | 'drogas'; selectedId?: string }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const entries: ClinicalEntry[] = kind === 'cuadros' ? pathways : drugs;
  if (selectedId) {
    const entry = entries.find(e => e.id === selectedId);
    if (!entry) return <div className="card"><h1 className="section-title">Ficha no encontrada</h1><a className="back-link" href={`#${kind}`}>Volver al catálogo</a></div>;
    return kind === 'cuadros' ? <PathwayDetail key={entry.id} entry={entry as ClinicalPathway} /> : <DrugDetail entry={entry as DrugEntry} />;
  }
  const filtered = searchEntries(entries, query, category);
  return <section>
    <span className="eyebrow">Biblioteca de cabecera</span><h1 className="page-title mt-2">{kind === 'cuadros' ? 'Cuadros clínicos' : 'Drogas de UCO'}</h1>
    <p className="page-subtitle">{kind === 'cuadros' ? 'Elegí el problema para revisar prioridades y opciones.' : 'Buscá por nombre, sigla, familia o indicación.'}</p>
    <div className="my-6"><label className="sr-only" htmlFor={`search-${kind}`}>Buscar {kind}</label><input id={`search-${kind}`} className="search-field" value={query} onChange={e => setQuery(e.target.value)} placeholder={kind === 'cuadros' ? 'Ej. shock, FA, dolor torácico…' : 'Ej. noradrenalina, HNF, amio…'} type="search" /></div>
    <div className="flex flex-wrap gap-2 mb-5" aria-label="Filtrar por categoría">{['Todas', ...new Set(entries.map(e => e.category))].map(cat => <button key={cat} className={`filter-chip ${cat === category ? 'selected' : ''}`} aria-pressed={cat === category} onClick={() => setCategory(cat)}>{cat}</button>)}</div>
    <p className="text-xs text-slate-400 mb-4" role="status">{filtered.length} fichas · revisión local pendiente</p>
    {filtered.length ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{filtered.map(entry => <EntryCard key={entry.id} entry={entry} kind={kind} />)}</div> : <div className="card text-slate-400"><p>No encontramos esa consulta. Probá un nombre genérico o quitá el filtro.</p><button className="btn-ghost mt-4" onClick={() => { setQuery(''); setCategory('Todas'); }}>Ver todas las fichas</button></div>}
  </section>;
}
