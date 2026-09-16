// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../src/ui/App';

function go(hash: string) {
  act(() => { window.history.replaceState(null, '', `/${hash}`); window.dispatchEvent(new HashChangeEvent('hashchange')); });
}
beforeEach(() => { window.history.replaceState(null, '', '/#inicio'); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Recorridos de cabecera', () => {
  it('abre la referencia sin casilleros y reacciona a datos del mismo paciente', () => {
    render(<App />); go('#paciente');
    fireEvent.change(screen.getByLabelText('Edad (años)'), { target: { value: '62' } });
    fireEvent.change(screen.getByLabelText('Condición'), { target: { value: 'sca' } });
    fireEvent.change(screen.getByLabelText('Fase clínica'), { target: { value: 'pre_alta' } });
    const link = screen.getByRole('link', { name: 'Abrir Doble antiagregación' });
    expect(within(link).queryByRole('checkbox')).toBeNull();
    expect(link.getAttribute('href')).toBe('#tratamiento/doble-antiagregacion');
    go(link.getAttribute('href')!);
    expect(screen.getByRole('heading', { name: 'Doble antiagregación', level: 1 })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Indicaciones y contraindicaciones generales' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Sangrado activo', { exact: true }), { target: { value: 'yes' } });
    expect(screen.getByText(/Sangrado activo: resolver en la internación/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Evaluar sangrado durante la internación' })).toBeTruthy();
    go('#paciente');
    expect((screen.getByLabelText('Sangrado activo', { exact: true }) as HTMLSelectElement).value).toBe('yes');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /Nueva sesión/ })); go('#paciente');
    expect((screen.getByLabelText('Sangrado activo', { exact: true }) as HTMLSelectElement).value).toBe('unknown');
  });
  it('encuentra una droga por sigla y separa los contextos de dosis', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Buscar cuadros o drogas'), { target: { value: 'HNF' } });
    expect(screen.getByRole('heading', { name: 'Heparina no fraccionada' })).toBeTruthy();
    go('#drogas/amiodarona');
    expect(screen.getByText('FV/TV sin pulso refractaria')).toBeTruthy();
    expect(screen.getByText('TV estable con pulso')).toBeTruthy();
  });
  it('reutiliza peso, acepta coma decimal y conserva la preparación al editar paciente', () => {
    render(<App />); go('#paciente');
    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '80' } });
    go('#infusiones/noradrenalina');
    fireEvent.change(screen.getByLabelText('Cantidad total'), { target: { value: '16' } });
    fireEvent.change(screen.getByLabelText('Volumen final (mL)'), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText('Dosis (µg/kg/min)'), { target: { value: '0,1' } });
    expect(screen.getByText('7,5')).toBeTruthy();
    go('#paciente'); fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '100' } });
    go('#infusiones/noradrenalina'); expect(screen.getByText('9,375')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'mL/h → dosis' }));
    expect(screen.queryByText('9,375')).toBeNull();
    fireEvent.change(screen.getByLabelText('Velocidad de bomba (mL/h)'), { target: { value: '9,375' } });
    expect(screen.getByText('0,1')).toBeTruthy();
  });
  it('no recicla una preparación al cambiar de droga y borra todo en nueva sesión', () => {
    render(<App />); go('#infusiones/vasopresina');
    fireEvent.change(screen.getByLabelText('Cantidad total'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('Volumen final (mL)'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Dosis (U/min)'), { target: { value: '0,03' } });
    expect(screen.getByText('4,5')).toBeTruthy();
    go('#infusiones/amiodarona');
    expect((screen.getByLabelText('Cantidad total') as HTMLInputElement).value).toBe('');
    expect(screen.queryByText('4,5')).toBeNull();
    go('#paciente'); fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '80' } });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /Nueva sesión/ }));
    go('#paciente'); expect((screen.getByLabelText('Peso (kg)') as HTMLInputElement).value).toBe('');
  });
  it('no calcula función renal para menores ni en diálisis', () => {
    render(<App />); go('#paciente');
    fireEvent.change(screen.getByLabelText('Edad (años)'), { target: { value: '12' } });
    expect(screen.getByText(/herramientas de esta app son para adultos/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Edad (años)'), { target: { value: '70' } });
    fireEvent.change(screen.getByLabelText('Situación renal'), { target: { value: 'dialysis' } });
    expect(screen.getByText(/se requiere un esquema específico para la modalidad/)).toBeTruthy();
    expect(screen.queryByText('Cockcroft-Gault')).toBeNull();
  });
});
