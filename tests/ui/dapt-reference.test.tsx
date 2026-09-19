// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../src/ui/App';

function go(hash: string) {
  act(() => { window.history.replaceState(null, '', `/${hash}`); window.dispatchEvent(new HashChangeEvent('hashchange')); });
}
function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
}
function openDapt() {
  const link = screen.getByRole('link', { name: 'Abrir Doble antiagregación' });
  expect(link.getAttribute('href')).toBe('#tratamiento/doble-antiagregacion');
  go(link.getAttribute('href')!);
}
function comparison() { return screen.getByRole('table', { name: 'Comparación de antiagregantes' }); }
function drug(name: string) { return within(comparison()).getByRole('row', { name }); }
function allFour() {
  for (const name of ['AAS', 'Ticagrelor', 'Prasugrel', 'Clopidogrel']) expect(drug(name)).toBeTruthy();
  expect(within(comparison()).getAllByRole('row')).toHaveLength(5); // Encabezado + cuatro alternativas.
}
beforeEach(() => { window.history.replaceState(null, '', '/#paciente'); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('DAPT inmediata desde Paciente', () => {
  it('llega desde SCA con un enlace directo y presenta referencia completa con avanzados cerrados', () => {
    render(<App />);
    change('Condición', 'sca');
    openDapt();
    expect(screen.getByRole('heading', { name: 'Referencia general — faltan datos para personalizar' })).toBeTruthy();
    allFour();
    expect(within(drug('Ticagrelor')).getByText('90 mg VO cada 12 h')).toBeTruthy();
    expect(within(drug('Prasugrel')).getByText(/10 mg VO cada 24 h; 5 mg si <60 kg/)).toBeTruthy();
    const quick = screen.getByRole('region', { name: 'Decisión rápida' });
    expect(within(quick).getAllByRole('combobox')).toHaveLength(6);
    expect(within(quick).getAllByRole('combobox').map(e => (e as HTMLSelectElement).value)).toEqual(Array(6).fill('unknown'));
    const advanced = screen.getByText('Datos avanzados').closest('details')!;
    expect(advanced.open).toBe(false);
    expect(within(advanced).getByLabelText('Hemoglobina (g/dL)')).toBeTruthy();
    expect(within(quick).queryByLabelText('Fase clínica')).toBeNull();
    expect(screen.getAllByText('Validación local pendiente').length).toBeGreaterThan(0);
  });

  it('solo Tipo de SCA y Estrategia actualizan alternativas sin exigir antecedentes', () => {
    render(<App />); change('Condición', 'sca'); openDapt();
    change('Tipo de SCA', 'stemi'); change('Estrategia del SCA', 'pci');
    expect(screen.getByRole('heading', { name: 'Orientación contextual — confirmar antes de indicar' })).toBeTruthy();
    allFour();
    expect(within(drug('Ticagrelor')).getByText(/Opción habitual en este escenario/)).toBeTruthy();
    expect(within(drug('Ticagrelor')).getByText('Confirmar dato')).toBeTruthy();
    expect(within(drug('Prasugrel')).getByText(/ACV\/AIT previo · Hemorragia intracraneal previa · Edad · Peso/)).toBeTruthy();
    expect((screen.getByLabelText('ACV o AIT previo') as HTMLSelectElement).value).toBe('unknown');
    change('ACV o AIT previo', 'yes');
    allFour();
    expect(within(drug('Prasugrel')).getByText('Evitar / contraindicada')).toBeTruthy();
    expect(within(drug('Ticagrelor')).queryByText('Evitar / contraindicada')).toBeNull();
  });

  it('muestra sangrado activo sin desaparecer la tabla y recupera desconocidos al editarlo', () => {
    render(<App />); change('Condición', 'sca'); openDapt();
    change('Sangrado activo', 'yes');
    allFour();
    expect(within(comparison()).getAllByText('Evitar / contraindicada')).toHaveLength(4);
    expect(screen.getByText(/Sangrado activo: resolver en la internación/)).toBeTruthy();
    change('Sangrado activo', 'unknown');
    allFour();
    expect(within(comparison()).queryByText('Evitar / contraindicada')).toBeNull();
    expect(within(comparison()).getAllByText('Confirmar dato')).toHaveLength(4);
    expect(document.getElementById('dapt-common-pending')!.textContent).toContain('Sangrado activo');
  });

  it('conserva datos rápidos, avanzados y edad/peso compartidos al navegar y editar el paciente', () => {
    render(<App />);
    change('Condición', 'sca'); change('Edad (años)', '64'); change('Peso (kg)', '59');
    openDapt();
    change('Tipo de SCA', 'stemi'); change('Estrategia del SCA', 'pci');
    change('ACV o AIT previo', 'no'); change('P2Y12 que recibe actualmente', 'clopidogrel');
    fireEvent.click(screen.getByText('Datos avanzados'));
    change('Hemorragia intracraneal previa', 'no'); change('Hemoglobina (g/dL)', '12.5'); change('ALT (veces el límite superior normal)', '2');
    expect(within(drug('Prasugrel')).getByText('5 mg VO cada 24 h')).toBeTruthy();
    go('#inicio'); go('#paciente');
    expect((screen.getByLabelText('Peso (kg)') as HTMLInputElement).value).toBe('59');
    expect((screen.getByLabelText('Hemoglobina (g/dL)') as HTMLInputElement).value).toBe('12.5');
    change('Peso (kg)', '60'); openDapt();
    expect((screen.getByLabelText('Tipo de SCA') as HTMLSelectElement).value).toBe('stemi');
    expect((screen.getByLabelText('Estrategia del SCA') as HTMLSelectElement).value).toBe('pci');
    expect((screen.getByLabelText('ACV o AIT previo') as HTMLSelectElement).value).toBe('no');
    expect((screen.getByLabelText('P2Y12 que recibe actualmente') as HTMLSelectElement).value).toBe('clopidogrel');
    expect((screen.getByLabelText('Sangrado activo') as HTMLSelectElement).value).toBe('unknown');
    expect((screen.getByLabelText('Hemorragia intracraneal previa') as HTMLSelectElement).value).toBe('no');
    expect((screen.getByLabelText('ALT (veces el límite superior normal)') as HTMLInputElement).value).toBe('2');
    expect(within(drug('Prasugrel')).getByText('10 mg VO cada 24 h')).toBeTruthy();
    expect(within(drug('Clopidogrel')).getByText('Actual')).toBeTruthy();
  });
});
