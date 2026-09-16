import { useState } from 'react';
import { calculateInfusion, parseDecimal, doseUnits, type AmountUnit, type InfusionDoseUnit } from '../engine/infusion';
import type { CalculationResult } from '../engine/types';
import { drugs } from '../clinical/drugs';
import { useSession } from '../context/session';
import { FormulaDetail } from './FormulaDetail';
import { StepDisplay } from './StepDisplay';

export function InfusionCalculator({ drugId }: { drugId?: string }) {
  const { state } = useSession();
  const drug = drugs.find(d => d.id === drugId);
  const [amount, setAmount] = useState('');
  const [volume, setVolume] = useState('');
  const [amountUnit, setAmountUnit] = useState<AmountUnit>(drug?.infusionUnit?.startsWith('U') ? 'U' : 'mg');
  const [doseUnit, setDoseUnit] = useState<InfusionDoseUnit>(drug?.infusionUnit ?? 'µg/kg/min');
  const [direction, setDirection] = useState<'dose-to-rate' | 'rate-to-dose'>('dose-to-rate');
  const [input, setInput] = useState('');
  const a = parseDecimal(amount), v = parseDecimal(volume), value = parseDecimal(input);
  let result: CalculationResult<number> | null = null;
  let error = '';
  if ((amount && a === null) || (volume && v === null) || (input && value === null)) error = 'Ingresá números válidos. Podés usar coma o punto decimal.';
  if (state.age !== null && state.age < 18) error = 'Esta herramienta está destinada a adultos.';
  if (!error && a !== null && v !== null && value !== null) {
    try { result = calculateInfusion({ amount: a, amountUnit, volume: v, doseUnit, weight: state.weight, direction, value }); }
    catch (err) { error = err instanceof Error ? err.message : 'Revisá los datos.'; }
  }
  const unitChoices = doseUnits.filter(unit => (amountUnit === 'U') === unit.startsWith('U'));
  return <section className="card" id="infusion-calculator">
    <div className="flex items-center justify-between gap-3"><h2 className="section-title mb-0">Conversor de infusiones</h2><span className="eyebrow">9 unidades</span></div>
    <p className="mt-2 text-sm text-slate-400">Ingresá la preparación real y la dosis elegida. El resultado es una conversión matemática.</p>
    <div className="my-5"><label htmlFor="infusion-drug" className="label">Droga de referencia</label><select id="infusion-drug" className="select-field" value={drug?.id ?? ''} onChange={e => { window.location.hash = e.target.value ? `infusiones/${e.target.value}` : 'infusiones'; }}><option value="">Otra droga / conversión libre</option>{drugs.filter(d => d.infusionUnit).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select><p className="text-xs text-slate-500 mt-2">Cambiar de droga limpia la preparación y el valor ingresado.</p></div>
    {drug && <p className="text-sm text-amber-200 mb-5 leading-relaxed">{drug.precautions} <a href={`#drogas/${drug.id}`} className="underline">Ver ficha</a></p>}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div><label className="label" htmlFor="infusion-amount">Cantidad total</label><input id="infusion-amount" className="input-field" inputMode="decimal" placeholder="Ej. 16" value={amount} onChange={e => setAmount(e.target.value)} /></div>
      <div><label className="label" htmlFor="infusion-amount-unit">Unidad del fármaco</label><select id="infusion-amount-unit" className="select-field" value={amountUnit} onChange={e => { const next = e.target.value as AmountUnit; setAmountUnit(next); setAmount(''); setInput(''); if ((next === 'U') !== doseUnit.startsWith('U')) setDoseUnit(next === 'U' ? 'U/h' : 'mg/h'); }}>{['mg', 'µg', 'g', 'U'].map(unit => <option key={unit}>{unit}</option>)}</select></div>
      <div className="col-span-2 sm:col-span-1"><label className="label" htmlFor="infusion-volume">Volumen final (mL)</label><input id="infusion-volume" className="input-field" inputMode="decimal" placeholder="Ej. 250" value={volume} onChange={e => setVolume(e.target.value)} /></div>
    </div>
    <p className="mt-2 text-xs text-slate-400">Volumen final = fármaco + diluyente. Confirmar concentración, compatibilidad, estabilidad y vía con farmacia/protocolo.</p>
    <div className="segmented mt-6" aria-label="Sentido de conversión"><button aria-pressed={direction === 'dose-to-rate'} className={direction === 'dose-to-rate' ? 'selected' : ''} onClick={() => { setDirection('dose-to-rate'); setInput(''); }}>Dosis → mL/h</button><button aria-pressed={direction === 'rate-to-dose'} className={direction === 'rate-to-dose' ? 'selected' : ''} onClick={() => { setDirection('rate-to-dose'); setInput(''); }}>mL/h → dosis</button></div>
    <div className="grid sm:grid-cols-2 gap-3 mt-4"><div><label className="label" htmlFor="infusion-dose-unit">Unidad de dosis</label><select id="infusion-dose-unit" className="select-field" value={doseUnit} onChange={e => { setDoseUnit(e.target.value as InfusionDoseUnit); setInput(''); }}>{unitChoices.map(unit => <option key={unit}>{unit}</option>)}</select></div><div><label className="label" htmlFor="infusion-value">{direction === 'dose-to-rate' ? `Dosis (${doseUnit})` : 'Velocidad de bomba (mL/h)'}</label><input id="infusion-value" className="input-field" inputMode="decimal" placeholder="Ingresar valor" value={input} onChange={e => setInput(e.target.value)} /></div></div>
    {doseUnit.includes('/kg/') && <p className="text-sm text-slate-300 mt-4">Peso de la sesión: <strong>{state.weight ?? '—'} kg</strong> · <a href="#paciente" className="text-teal-300 underline">Editar paciente</a></p>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-amber-500/10 p-3 text-amber-200 text-sm">{error}</p>}
    {result ? <div className="mt-5">
      <div className="calculation-result" aria-live="polite"><span className="eyebrow text-teal-300">{direction === 'dose-to-rate' ? 'Velocidad calculada' : 'Dosis calculada'}</span><div className="mt-2 flex gap-2 items-baseline flex-wrap"><strong className="text-4xl tabular-nums tracking-tight">{result.value > 0 && result.value < 0.001 ? result.value.toExponential(3) : new Intl.NumberFormat('es-AR', { maximumFractionDigits: 4 }).format(result.value)}</strong><span className="text-slate-300">{result.unit}</span></div><p className="text-xs mt-3 text-slate-400">Verificar precisión de la bomba. El resultado no confirma que la dosis sea apropiada.</p></div>
      {result.warnings.map(w => <p role="alert" key={w} className="mt-3 text-sm text-amber-200">{w}</p>)}
      <FormulaDetail title="Ver fórmula, datos y pasos"><StepDisplay steps={result.steps} /></FormulaDetail>
    </div> : !error && <p className="mt-5 text-sm text-slate-400 p-4 rounded-xl border border-dashed border-slate-700">Completá cantidad, volumen final y {direction === 'dose-to-rate' ? 'dosis' : 'velocidad'} para calcular.</p>}
  </section>;
}
