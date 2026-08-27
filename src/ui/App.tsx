import { SessionProvider, useSession } from '../context/session';
import { PatientForm } from './PatientForm';
import { RenalResults } from './RenalResults';
import { MedicationSelector } from './MedicationSelector';
import { DripsPanel } from './DripsPanel';
import { RenalAlerts } from './RenalAlerts';
import { Checklist } from './Checklist';
import { Disclaimer } from './Disclaimer';

function SessionScreen() {
  const { state, dispatch } = useSession();

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
            <h1 className="text-lg font-bold text-slate-100">Copiloto UCO</h1>
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
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-32">
        <PatientForm state={state} dispatch={dispatch} />
        <RenalResults state={state} />
        <MedicationSelector state={state} dispatch={dispatch} />
        <RenalAlerts state={state} />
        <DripsPanel state={state} dispatch={dispatch} />
        <Checklist state={state} dispatch={dispatch} />
      </main>

      {/* Footer */}
      <Disclaimer />
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
