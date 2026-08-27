import type { CalculationStep } from '../engine/types';

interface StepDisplayProps {
  steps: CalculationStep[];
}

/**
 * Muestra los pasos intermedios de un cálculo de forma legible.
 */
export function StepDisplay({ steps }: StepDisplayProps) {
  return (
    <div className="space-y-1">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-slate-600 font-mono text-xs mt-0.5 shrink-0">
            {i + 1}.
          </span>
          <div>
            <p className="text-slate-400 text-xs">{step.label}</p>
            {step.formula && (
              <p className="text-slate-600 text-xs italic">{step.formula}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
