// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emptySession } from '../helpers/session';
import type { ActiveDrip } from '../../src/context/session';
import { Checklist } from '../../src/ui/Checklist';
import { DripCard } from '../../src/ui/DripCard';
import { MedicationSelector } from '../../src/ui/MedicationSelector';
import { QuickPathway } from '../../src/ui/QuickPathway';
import { RenalAlerts } from '../../src/ui/RenalAlerts';
import { TherapyMatrix } from '../../src/ui/TherapyMatrix';

describe('Flujo progresivo de pase de sala', () => {
  it('permite elegir una patología en un toque', () => {
    const dispatch = vi.fn();
    render(<QuickPathway state={emptySession()} dispatch={dispatch} />);

    fireEvent.click(screen.getByRole('button', { name: /SCA/i }));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PATIENT_FIELD',
      field: 'condition',
      value: 'sca',
    });
  });

  it('muestra el tratamiento general aunque falten datos y medicación actual', () => {
    render(
      <Checklist
        state={emptySession({ condition: 'ic', phase: 'compensado' })}
        dispatch={vi.fn()}
      />,
    );

    expect(screen.getByText('Tratamiento esperado')).toBeInTheDocument();
    expect(screen.getByText('Antagonista mineralocorticoide')).toBeInTheDocument();
    expect(screen.getAllByText(/Falta .*función renal/i).length).toBeGreaterThan(0);
  });

  it('muestra una tabla SCA con alternativas exactas aun sin completar datos', () => {
    render(
      <TherapyMatrix
        state={emptySession({ condition: 'sca' })}
        dispatch={vi.fn()}
      />,
    );

    expect(screen.getByText('Alternativas por fármaco')).toBeInTheDocument();
    expect(screen.getByText('Rosuvastatina')).toBeInTheDocument();
    expect(screen.getByText('Simvastatina')).toBeInTheDocument();
    expect(screen.getByText('Clopidogrel')).toBeInTheDocument();
    expect(screen.getByText('Ticagrelor')).toBeInTheDocument();
  });

  it('marca una droga exacta como medicación actual desde la matriz SCA', () => {
    const dispatch = vi.fn();
    render(
      <TherapyMatrix
        state={emptySession({ condition: 'sca' })}
        dispatch={dispatch}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Marcar Rosuvastatina/i }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_THERAPY_OPTION',
      optionId: 'rosuvastatin',
    });
  });

  it('mantiene visible el selector de drogas sin datos renales', () => {
    const dispatch = vi.fn();
    render(<MedicationSelector state={emptySession()} dispatch={dispatch} />);

    expect(screen.getByText('Consultar una medicación')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Enoxaparina/i })[0]);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_RENAL_RULE',
      ruleId: 'enoxaparina-profilaxis',
    });
  });

  it('muestra dosis de referencia de la droga seleccionada aunque falten datos', () => {
    render(
      <RenalAlerts
        state={emptySession({ activeRenalRuleIds: ['enoxaparina-anticoag'] })}
      />,
    );

    expect(screen.getByText('Dosis y ajuste')).toBeInTheDocument();
    expect(screen.getByText(/Dosis de referencia sin individualizar/i)).toBeInTheDocument();
    expect(screen.getByText('1 mg/kg c/12 h SC')).toBeInTheDocument();
  });

  it('permite ingresar cualquiera de los dos sentidos y edita vasopresina en unidades', () => {
    const drip: ActiveDrip = {
      id: 'vasopresina-test',
      dilutionId: 'vasopresina',
      nombre: 'Vasopresina',
      currentDilution: {
        cantidad: 40,
        unidad: 'U',
        volumenML: 100,
        concentracionUPerMl: 0.4,
      },
      modoDosis: 'u_min',
      rango: { min: 0.01, max: 0.04, unidad: 'U/min' },
      notas: '',
      verified: false,
      inputMode: 'mlh',
      mlPerHour: null,
      gamma: null,
    };

    render(
      <DripCard
        drip={drip}
        weightKg={null}
        dispatch={vi.fn()}
        onUpdateDilution={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Vasopresina en mL por hora')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Vasopresina en U/min')).not.toHaveAttribute('readonly');
    fireEvent.click(screen.getByTitle('Editar dilución'));
    expect(screen.getByText('U totales')).toBeInTheDocument();
  });
});
