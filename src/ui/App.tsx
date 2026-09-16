import { useEffect, useState } from 'react';
import { SessionProvider, useSession } from '../context/session';
import { PatientForm } from './PatientForm';
import { RenalResults } from './RenalResults';
import { MedicationSelector } from './MedicationSelector';
import { DripsPanel } from './DripsPanel';
import { RenalAlerts } from './RenalAlerts';
import { Checklist } from './Checklist';
import { ClinicalLibrary, EntryCard } from './ClinicalLibrary';
import { InfusionCalculator } from './InfusionCalculator';
import { pathways } from '../clinical/pathways';
import { drugs } from '../clinical/drugs';
import { searchEntries } from '../clinical/search';
import { TreatmentPage, FollowUpPanel } from './TreatmentPage';
import { TherapyContextForm } from './TherapyContextForm';

const navigation = [
  { id: 'inicio', label: 'Inicio', symbol: '⌂' },
  { id: 'cuadros', label: 'Cuadros', symbol: '◇' },
  { id: 'drogas', label: 'Drogas', symbol: '✚' },
  { id: 'infusiones', label: 'Infusiones', symbol: '⇄' },
  { id: 'paciente', label: 'Paciente', symbol: '◎' },
] as const;
type View = typeof navigation[number]['id'] | 'tratamiento';
function readRoute(): { view: View; id?: string } {
  const [view, id] = window.location.hash.slice(1).split('/');
  return { view: view === 'tratamiento' || navigation.some(n => n.id === view) ? view as View : 'inicio', id };
}

function Home() {
  const [query, setQuery] = useState('');
  const foundPathways = searchEntries(pathways, query);
  const foundDrugs = searchEntries(drugs, query);
  return <div className="space-y-8">
    <section className="home-hero"><span className="eyebrow text-teal-300">UCO · Adultos · Argentina</span><h1 className="page-title mt-3 max-w-xl">¿Qué necesitás<br className="hidden sm:block" /> resolver ahora?</h1><p className="page-subtitle max-w-lg">Cuadros clínicos, drogas y cálculos. Una misma sesión para trabajar en la cabecera.</p>
      <label className="sr-only" htmlFor="global-search">Buscar cuadros o drogas</label><input id="global-search" type="search" className="search-field mt-6" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar una patología o droga…" />
      <p className="text-xs text-slate-400 mt-3">También por siglas: FA, SCA, HNF, NTG, RCP.</p>
    </section>
    {query.trim() ? <section aria-label="Resultados de búsqueda"><div className="flex justify-between mb-4"><h2 className="text-lg font-semibold">Resultados</h2><button className="back-link" onClick={() => setQuery('')}>Limpiar</button></div>
      <p className="text-xs text-slate-400 mb-4" role="status">{foundPathways.length} cuadros · {foundDrugs.length} drogas</p>
      <div className="grid sm:grid-cols-2 gap-3">{foundPathways.map(entry => <EntryCard key={entry.id} kind="cuadros" entry={entry} />)}{foundDrugs.map(entry => <EntryCard key={entry.id} kind="drogas" entry={entry} />)}</div>
      {!foundPathways.length && !foundDrugs.length && <p className="card text-slate-400">Todavía no hay una ficha para esa consulta. Probá otra denominación. La calculadora libre permite convertir una infusión definida por vos.</p>}
    </section> : <>
      <section><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Accesos de urgencia</h2><span className="text-xs text-slate-500">Fichas de consulta</span></div><div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{[
        ['paro', 'Paro / RCP', 'Ritmo y reanimación'], ['shock', 'Shock', 'Perfusión y soporte'], ['tv', 'Taquiarritmia', 'Pulso y estabilidad'], ['bradicardia', 'Bradicardia', 'Conducción y perfusión'],
      ].map(([id, title, detail]) => <a key={id} href={`#cuadros/${id}`} className="urgent-link"><span className="text-teal-300 text-xs">ABRIR →</span><strong className="block mt-3">{title}</strong><span className="block mt-1 text-xs text-slate-400">{detail}</span></a>)}</div></section>
      <section className="grid sm:grid-cols-2 gap-4"><a href="#drogas" className="feature-card"><span className="eyebrow">01 / Medicación</span><h2 className="text-2xl font-semibold mt-3">Necesito una droga</h2><p className="text-sm text-slate-400 mt-3 leading-relaxed">Contexto, precauciones, monitorización y acceso al cálculo.</p><span className="text-teal-300 text-sm mt-5 block">Explorar {drugs.length} fichas →</span></a><a href="#infusiones" className="feature-card"><span className="eyebrow">02 / Cálculo</span><h2 className="text-2xl font-semibold mt-3">Preparar una infusión</h2><p className="text-sm text-slate-400 mt-3 leading-relaxed">Dosis ↔ mL/h, con peso, unidades explícitas y pasos del cálculo.</p><span className="text-teal-300 text-sm mt-5 block">Abrir calculadora →</span></a></section>
      <a href="#paciente" className="feature-card block"><span className="eyebrow">03 / Decisión y seguimiento</span><h2 className="text-2xl font-semibold mt-3">Medicación para este paciente</h2><p className="text-sm text-slate-400 mt-3">Referencia terapéutica, doble antiagregación según contexto y controles para organizar el alta.</p><span className="text-teal-300 text-sm mt-5 block">Ver paciente y sugerencias →</span></a>
      <section><div className="flex justify-between mb-4"><h2 className="text-lg font-semibold">Consultas frecuentes</h2><a className="back-link" href="#cuadros">Ver {pathways.length} cuadros →</a></div><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{['sca-cest', 'ic-aguda', 'fa'].map(id => <EntryCard key={id} kind="cuadros" entry={pathways.find(p => p.id === id)!} />)}</div></section>
      <div className="scope-note"><strong className="text-slate-300">Versión en desarrollo clínico</strong><p className="mt-1">Las fichas son orientativas y tienen fuentes consultadas. Falta validarlas con el servicio y completar protocolos de titulación, compatibilidades, sedoanalgesia, ventilación y soporte mecánico. No cubre todavía toda la práctica de UCO.</p></div>
    </>}
  </div>;
}

function SessionScreen() {
  const { state, dispatch } = useSession();
  const [route, setRoute] = useState(readRoute);
  const [online, setOnline] = useState(navigator.onLine);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [infusionDrug, setInfusionDrug] = useState(route.view === 'infusiones' ? route.id : undefined);
  useEffect(() => {
    const change = () => { const next = readRoute(); setRoute(next); if (next.view === 'infusiones') setInfusionDrug(next.id); window.scrollTo({ top: 0 }); };
    const connection = () => setOnline(navigator.onLine);
    window.addEventListener('hashchange', change); window.addEventListener('online', connection); window.addEventListener('offline', connection);
    return () => { window.removeEventListener('hashchange', change); window.removeEventListener('online', connection); window.removeEventListener('offline', connection); };
  }, []);
  const newSession = () => {
    if (window.confirm('¿Iniciar una nueva sesión? Se borrarán los datos del paciente, las infusiones y las marcas de revisión.')) {
      dispatch({ type: 'RESET_SESSION' }); setSessionVersion(v => v + 1); setInfusionDrug(undefined); window.location.hash = 'inicio';
    }
  };
  return <div className="app-shell">
    <a href="#main-content" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Saltar al contenido</a>
    <aside className="desktop-sidebar">
      <a href="#inicio" className="brand"><span className="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12h5l3-7 4 14 3-7h5" /></svg></span><span>Copiloto <b className="text-teal-300">UCO</b></span></a>
      <p className="text-xs text-slate-500 mt-3 px-1">Tu espacio de trabajo clínico</p>
      <nav className="mt-10 space-y-2" aria-label="Navegación principal">{navigation.map(item => <a key={item.id} href={item.id === 'infusiones' && infusionDrug ? `#infusiones/${infusionDrug}` : `#${item.id}`} aria-current={(route.view === 'tratamiento' ? 'paciente' : route.view) === item.id ? 'page' : undefined} className={`nav-item ${(route.view === 'tratamiento' ? 'paciente' : route.view) === item.id ? 'active' : ''}`}><span aria-hidden="true" className="text-xl w-6">{item.symbol}</span>{item.label}</a>)}</nav>
      <div className="mt-auto pt-12"><div className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-5">Adultos · Argentina<br />Biblioteca consultada 14–15/09/2026</div><span className="mt-3 inline-flex text-xs text-amber-200">Validación local pendiente</span></div>
    </aside>
    <div className="app-workspace">
      <header className="workspace-header"><a href="#inicio" className="font-semibold text-slate-200 md:hidden">Copiloto <span className="text-teal-300">UCO</span></a><span className="hidden md:block text-sm text-slate-400">Cabecera / <span className="text-slate-100">{route.view === 'tratamiento' ? 'Referencia terapéutica' : navigation.find(n => n.id === route.view)?.label}</span></span><div className="flex items-center gap-4"><span className="text-xs text-slate-400 hidden sm:block">{online ? '● Con conexión' : '● Sin conexión'}</span><button id="btn-new-session" onClick={newSession} className="new-session">Nueva sesión <span aria-hidden="true">↺</span></button></div></header>
      <div className="workspace-body">
        <a href="#paciente" className="patient-strip" aria-label="Editar datos de la sesión"><div className="flex gap-2 items-center"><span className="text-teal-300" aria-hidden="true">◎</span><strong className="text-sm">Paciente actual</strong></div><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400"><span>Edad <b>{state.age ?? '—'}</b></span><span>Peso <b>{state.weight ?? '—'} kg</b></span><span>Cr <b>{state.creatinine ?? '—'} mg/dL</b></span><span>TAS <b>{state.systolicBP ?? '—'}</b></span></div><span className="text-xs text-teal-300">Editar →</span></a>
        <main id="main-content" tabIndex={-1} className="outline-none" key={sessionVersion}>
          {route.view === 'inicio' && <Home />}
          {route.view === 'cuadros' && <ClinicalLibrary kind="cuadros" selectedId={route.id} />}
          {route.view === 'drogas' && <ClinicalLibrary kind="drogas" selectedId={route.id} />}
          {route.view === 'tratamiento' && <TreatmentPage key={route.id} id={route.id} />}
          <div hidden={route.view !== 'infusiones'} className="space-y-6">
            <div><span className="eyebrow">Cálculos auditables</span><h1 className="page-title mt-2">Infusiones</h1><p className="page-subtitle">Preparación explícita. Unidades claras. Conversión en ambos sentidos.</p></div>
            <InfusionCalculator key={infusionDrug ?? 'custom'} drugId={infusionDrug} />
            <details className="source-details"><summary>Goteos vasoactivos con preparaciones de ejemplo</summary><div className="mt-5"><DripsPanel state={state} dispatch={dispatch} /></div></details>
          </div>
          {route.view === 'paciente' && <div className="space-y-6"><div><span className="eyebrow">Sesión temporal</span><h1 className="page-title mt-2">Datos del paciente</h1><p className="page-subtitle">Ingresá los datos para orientar la consulta. Se comparten entre herramientas.</p></div><PatientForm state={state} dispatch={dispatch} /><Checklist state={state} /><details className="source-details"><summary>Antecedentes y laboratorio para personalizar la medicación</summary><div className="mt-5"><TherapyContextForm /></div></details><RenalResults state={state} /><FollowUpPanel /><details className="source-details"><summary>Consultar reglas de ajuste renal · borrador</summary><div className="mt-5 space-y-5"><MedicationSelector state={state} dispatch={dispatch} /><RenalAlerts state={state} /></div></details></div>}
        </main>
        <footer className="mt-10 border-t border-slate-800 pt-5 text-xs text-slate-500 leading-relaxed">Apoyo profesional en desarrollo. Verificar dosis, presentación y contexto antes de indicar. Las fichas no sustituyen el protocolo del servicio ni el juicio clínico.</footer>
      </div>
    </div>
    <nav className="mobile-nav" aria-label="Navegación móvil">{navigation.map(item => <a key={item.id} href={item.id === 'infusiones' && infusionDrug ? `#infusiones/${infusionDrug}` : `#${item.id}`} aria-current={(route.view === 'tratamiento' ? 'paciente' : route.view) === item.id ? 'page' : undefined} className={(route.view === 'tratamiento' ? 'paciente' : route.view) === item.id ? 'active' : ''}><span aria-hidden="true">{item.symbol}</span>{item.label}</a>)}</nav>
  </div>;
}

export function App() { return <SessionProvider><SessionScreen /></SessionProvider>; }
