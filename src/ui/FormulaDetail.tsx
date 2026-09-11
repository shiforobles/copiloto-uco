import type { ReactNode } from 'react';

interface FormulaDetailProps {
  title: string;
  children: ReactNode;
}

/**
 * Componente desplegable para mostrar la fórmula y pasos de un cálculo.
 * Usa <details>/<summary> nativo para accesibilidad.
 */
export function FormulaDetail({ title, children }: FormulaDetailProps) {
  return (
    <details className="mt-2 group">
      <summary className="text-xs text-sky-400/80 cursor-pointer hover:text-sky-400 transition-colors select-none flex items-center gap-1">
        <svg
          className="w-3 h-3 transition-transform group-open:rotate-90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {title}
      </summary>
      <div className="mt-2 pl-4 border-l-2 border-slate-700/50 text-xs text-slate-400 space-y-1">
        {children}
      </div>
    </details>
  );
}
