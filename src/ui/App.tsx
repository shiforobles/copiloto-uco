import { SessionProvider, useSession } from '../context/session';
import { PatientForm } from './PatientForm';
import { RenalResults } from './RenalResults';
import { MedicationSelector } from './MedicationSelector';
import { DripsPanel } from './DripsPanel';
import { RenalAlerts } from './RenalAlerts';
import { Checklist } from './Checklist';
import { Disclaimer } from './Disclaimer';
import { QuickPathway } from './QuickPathway';
import { TherapyMatrix } from './TherapyMatrix';
import { HFTherapyMatrix } from './HFTherapyMatrix';
import { AFMatrix } from './AFMatrix';
import { SafetyAudit } from './SafetyAudit';

function SessionScreen() {
  const { state, dispatch } = useSession();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNewSession = () => {
    if (window.confirm('¿Iniciar nueva sesión? Se borrarán todos los datos actuales.')) {
      dispatch({ type: 'RESET_SESSION' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-100">Copiloto UCO</h1>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-500/80">beta clínica</p>
            </div>
          </div>
          <button
            id="btn-new-session"
            onClick={handleNewSession}
            className="btn-danger text-sm px-3 py-1.5"
          >
            Nueva sesión
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-28">
        <QuickPathway state={state} dispatch={dispatch} />
        {state.condition === 'sca' ? (
          <TherapyMatrix state={state} dispatch={dispatch} />
        ) : state.condition === 'ic' ? (
          <HFTherapyMatrix state={state} dispatch={dispatch} />
        ) : state.condition === 'fa' ? (
          <AFMatrix state={state} dispatch={dispatch} />
        ) : (
          <Checklist state={state} dispatch={dispatch} />
        )}
        <SafetyAudit state={state} />
        <PatientForm state={state} dispatch={dispatch} />
        <MedicationSelector state={state} dispatch={dispatch} />
        <RenalAlerts state={state} />
        <DripsPanel state={state} dispatch={dispatch} />
        <RenalResults state={state} />
      </main>

      <Disclaimer />

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/70 bg-slate-950/95 px-3 py-2 backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          <button type="button" onClick={() => scrollTo('section-checklist')} className="nav-button">
            Tratamiento
          </button>
          <button type="button" onClick={() => scrollTo('section-medication-selector')} className="nav-button">
            Dosis
          </button>
          <button type="button" onClick={() => scrollTo('section-drips')} className="nav-button">
            Goteos
          </button>
          <button type="button" onClick={() => scrollTo('section-patient')} className="nav-button">
            Datos
          </button>
        </div>
      </nav>
    </div>
  );
}

export function App() {
  return (
    <SessionProvider>
      <SessionScreen />
    </SessionProvider>
  );
}
