// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../src/ui/App';

function go(hash: string) { act(() => { window.history.replaceState(null, '', `/${hash}`); window.dispatchEvent(new HashChangeEvent('hashchange')); }); }
function change(label: string, value: string) { fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } }); }
function openPlan() { const link = screen.getByRole('link', { name: 'Abrir SCA — tratamiento integral' }); expect(link.getAttribute('href')).toBe('#sca-integral'); go(link.getAttribute('href')!); }
beforeEach(() => { window.history.replaceState(null, '', '/#paciente'); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('SCA integral · recorrido de pocos clics', () => {
  it('con solo SCA abre directamente todas las referencias y controles sin pedir completar formularios', () => {
    render(<App />); change('Condición', 'sca'); openPlan();
    expect(screen.getByRole('heading', { level: 1, name: 'SCA — tratamiento integral' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Referencia general — faltan datos para personalizar' })).toBeTruthy();
    for (const name of ['Heparina no fraccionada (HNF)', 'Enoxaparina', 'Fondaparinux', 'Bivalirudina', 'Atorvastatina', 'Rosuvastatina', 'Ezetimiba', 'Carvedilol', 'Metoprolol succinato LP', 'Ramipril (IECA)', 'Valsartán (ARA II)', 'Eplerenona (ARM)', 'Pantoprazol']) {
      const heading = screen.getByRole('heading', { name });
      const article = heading.closest('article')!;
      expect(within(article).getByText('Referencia ·')).toBeTruthy();
      expect(article.textContent).toContain('Confirmar antes de indicar');
    }
    expect(screen.getByRole('heading', { name: 'Prealta · revisión integral' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Respuesta a hipolipemiantes' })).toBeTruthy();
    expect((screen.getByText('Personalizar SCA · datos compartidos y precauciones').closest('details') as HTMLDetailsElement).open).toBe(false);
    expect((screen.getByText('Datos avanzados').closest('details') as HTMLDetailsElement).open).toBe(false);
    const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cambiar estrategia contextualiza DAPT y anticoagulación sin modificar ni ocultar la ficha aprobada', () => {
    render(<App />); change('Condición', 'sca'); openPlan();
    change('Tipo de SCA', 'stemi'); change('Estrategia del SCA', 'pci');
    expect(screen.getByRole('heading', { name: 'Orientación contextual — confirmar antes de indicar' })).toBeTruthy();
    const table = screen.getByRole('table', { name: 'Comparación de antiagregantes' });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(screen.getByText('Evitar fondaparinux como único anticoagulante de PCI.')).toBeTruthy();
    change('ACV o AIT previo', 'yes');
    expect(within(within(table).getByRole('row', { name: 'Prasugrel' })).getByText('Evitar / contraindicada')).toBeTruthy();
    expect(within(table).getByRole('row', { name: 'Ticagrelor' })).toBeTruthy();
  });

  it('conserva contexto nuevo y datos compartidos al ir a DAPT, Paciente y volver', () => {
    render(<App />); change('Condición', 'sca'); change('Edad (años)', '65'); change('Peso (kg)', '59'); openPlan();
    change('Momento de la consulta', 'ward');
    fireEvent.click(screen.getByText('Personalizar SCA · datos compartidos y precauciones'));
    change('HIT: antecedente o sospecha', 'yes'); change('Potasio (mEq/L)', '5.2'); change('FEVI (%)', '35');
    change('Tipo de SCA', 'stemi'); change('Estrategia del SCA', 'pci');
    expect(screen.getByText(/HIT sospechada\/confirmada: evitar HNF y enoxaparina/)).toBeTruthy();
    go('#tratamiento/doble-antiagregacion');
    expect(screen.getByRole('heading', { level: 1, name: 'Doble antiagregación' })).toBeTruthy();
    expect(screen.getByText('5 mg VO cada 24 h')).toBeTruthy();
    expect((screen.getByLabelText('Tipo de SCA') as HTMLSelectElement).value).toBe('stemi');
    go('#paciente');
    expect((screen.getByLabelText('FEVI (%) · opcional') as HTMLInputElement).value).toBe('35');
    change('Peso (kg)', '60'); openPlan();
    expect((screen.getByLabelText('HIT: antecedente o sospecha') as HTMLSelectElement).value).toBe('yes');
    expect((screen.getByLabelText('Momento de la consulta') as HTMLSelectElement).value).toBe('ward');
    expect(screen.getByText('10 mg VO cada 24 h')).toBeTruthy();
    expect((screen.getByLabelText('Potasio (mEq/L)') as HTMLInputElement).value).toBe('5.2');
  });

  it('sangrado en prealta conserva alternativas pero muestra la prioridad actual, no aptitud de alta', () => {
    render(<App />); change('Condición', 'sca'); change('Edad (años)', '70'); openPlan();
    change('Momento de la consulta', 'discharge'); change('Sangrado activo', 'yes');
    expect(screen.getByText(/Prealta\/seguimiento no significa estabilidad confirmada/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Evaluar sangrado durante la internación' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Resolver ahora' })).toBeTruthy();
    for (const name of ['Heparina no fraccionada (HNF)', 'Enoxaparina', 'Fondaparinux', 'Bivalirudina']) {
      const article = screen.getByRole('heading', { name }).closest('article')!;
      expect(within(article).getByText('Evitar / no iniciar')).toBeTruthy();
      expect(within(article).getByText('Referencia ·')).toBeTruthy();
    }
  });

  it('nueva sesión elimina también momento, HIT y conciliación nueva', () => {
    render(<App />); change('Condición', 'sca'); openPlan();
    change('Momento de la consulta', 'followup'); change('HIT: antecedente o sospecha', 'yes'); change('Anticoagulante recibido', 'enoxaparin');
    vi.spyOn(window, 'confirm').mockReturnValue(true); fireEvent.click(screen.getByRole('button', { name: /Nueva sesión/ }));
    go('#paciente'); change('Condición', 'sca'); openPlan();
    for (const label of ['Momento de la consulta', 'HIT: antecedente o sospecha', 'Anticoagulante recibido']) expect((screen.getByLabelText(label) as HTMLSelectElement).value).toBe('unknown');
    expect(screen.queryByText(/HIT sospechada\/confirmada: evitar HNF y enoxaparina/)).toBeNull();
  });
});
