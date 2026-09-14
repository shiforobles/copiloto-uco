import { useState } from 'react';
import type { SessionState, SessionAction, ActiveDrip } from '../context/session';
import { dilutions } from '../data/dilutions';
import { calculateConcentration } from '../engine/units';
import { DripCard } from './DripCard';

interface DripsPanelProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

export function DripsPanel({ state, dispatch }: DripsPanelProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleAddDrip = (dilutionId: string) => {
    const dil = dilutions.find((d) => d.id === dilutionId);
    if (!dil) return;

    const newDrip: ActiveDrip = {
      id: `${dil.id}-${Date.now()}`,
      dilutionId: dil.id,
      nombre: dil.nombre,
      currentDilution: {
        mg: dil.dilucionEstandar.mg,
        units: dil.dilucionEstandar.units,
        volumenML: dil.dilucionEstandar.volumenML,
        concentracionUgMl: dil.concentracionUgMl,
        concentracionUPerMl: dil.concentracionUPerMl,
      },
      modoDosis: dil.modoDosis,
      rango: dil.rango,
      notas: dil.notas,
      inputMode: 'mlh',
      mlPerHour: null,
      gamma: null,
    };

    dispatch({ type: 'ADD_DRIP', drip: newDrip });
    setShowPicker(false);
  };

  const handleUpdateDilution = (
    dripId: string,
    cantidad: number,
    volumenML: number,
    isUnits: boolean
  ) => {
    if (cantidad <= 0 || volumenML <= 0) return;
    if (isUnits) {
      const concU = cantidad / volumenML;
      dispatch({
        type: 'UPDATE_DRIP',
        id: dripId,
        updates: {
          currentDilution: {
            units: cantidad,
            volumenML,
            concentracionUgMl: 0,
            concentracionUPerMl: concU,
          },
        },
      });
    } else {
      const concUg = calculateConcentration(cantidad, volumenML);
      dispatch({
        type: 'UPDATE_DRIP',
        id: dripId,
        updates: {
          currentDilution: {
            mg: cantidad,
            volumenML,
            concentracionUgMl: concUg,
          },
        },
      });
    }
  };

  return (
    <section id="section-drips">
      <div className="flex items-center justify-between px-1 mb-3">
        <h2 className="section-title mb-0">
          <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Goteos vasoactivos
        </h2>
        <button
          id="btn-add-drip"
          onClick={() => setShowPicker(!showPicker)}
          className="btn-primary text-sm px-3 py-1.5"
        >
          + Agregar
        </button>
      </div>

      {/* Drug picker */}
      {showPicker && (
        <div className="card mb-3 space-y-2">
          <p className="text-sm text-slate-400">Seleccionar droga para infusión:</p>
          <div className="grid grid-cols-2 gap-2">
            {dilutions.map((dil) => (
              <button
                key={dil.id}
                id={`btn-add-${dil.id}`}
                onClick={() => handleAddDrip(dil.id)}
                className="btn-ghost text-sm text-left flex flex-col p-2.5 rounded-xl border border-slate-700/50 hover:border-sky-500/50"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-slate-200">{dil.nombre}</span>
                  {!dil.verified && (
                    <span className="badge-unverified text-[9px] px-1 py-0">borrador</span>
                  )}
                </div>
                <span className="text-xs text-slate-500 mt-0.5">{dil.presentacion}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPicker(false)}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors w-full text-center mt-1 py-1"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Active drips */}
      {state.drips.length === 0 && !showPicker && (
        <div className="card opacity-60">
          <p className="text-sm text-slate-500 text-center">
            Sin goteos activos. Usá "+ Agregar" para calcular una infusión.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {state.drips.map((drip) => (
          <DripCard
            key={drip.id}
            drip={drip}
            weightKg={state.weight}
            dispatch={dispatch}
            onUpdateDilution={handleUpdateDilution}
          />
        ))}
      </div>
    </section>
  );
}
