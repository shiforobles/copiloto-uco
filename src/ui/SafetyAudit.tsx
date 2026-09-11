import { runSafetyAudit } from '../rules/safety-audit.engine';
import type { SafetyFinding, SafetySeverity } from '../rules/types';
import type { SessionState } from '../context/session';

interface SafetyAuditProps {
  state: SessionState;
}

const severityConfig: Record<SafetySeverity, { color: string; icon: string }> = {
  info: { color: 'text-sky-300/80', icon: 'ℹ' },
  caution: { color: 'text-amber-300', icon: '⚠' },
  avoid: { color: 'text-rose-300', icon: '✕' },
  contraindicated: { color: 'text-rose-400 font-bold', icon: '⛔' },
};

function FindingsList({ findings }: { findings: SafetyFinding[] }) {
  if (findings.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {findings.map((f) => {
        const cfg = severityConfig[f.severity];
        return (
          <li key={f.id} className={`text-[11px] leading-relaxed ${cfg.color}`}>
            <span className="mr-1">{cfg.icon}</span>
            {f.message}
          </li>
        );
      })}
    </ul>
  );
}

interface AuditBlockProps {
  title: string;
  count: number;
  children: React.ReactNode;
  borderClass: string;
  headerClass: string;
}

function AuditBlock({ title, count, children, borderClass, headerClass }: AuditBlockProps) {
  return (
    <div className={`rounded-xl border ${borderClass} px-3 py-2.5`}>
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${headerClass}`}>
        {title} {count > 0 && <span className="ml-1 font-mono">{count}</span>}
      </p>
      {count === 0 ? (
        <p className="text-[11px] text-slate-600">—</p>
      ) : (
        children
      )}
    </div>
  );
}

export function SafetyAudit({ state }: SafetyAuditProps) {
  const result = runSafetyAudit(state);
  const totalIssues = result.missing.length + result.caution.length + result.avoid.length;

  if (totalIssues === 0 && result.receives.length === 0) return null;

  return (
    <section className="scroll-mt-20 space-y-3" id="section-safety-audit">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-400">
            Seguridad · auditoría diaria
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">Revisión de seguridad</h2>
        </div>
        {totalIssues > 0 && (
          <span className="badge border border-rose-500/40 bg-rose-500/15 text-rose-300">
            {totalIssues} ítems
          </span>
        )}
      </div>

      <AuditBlock
        title="Recibe"
        count={result.receives.length}
        borderClass="border-emerald-700/40 bg-emerald-950/15"
        headerClass="text-emerald-400"
      >
        <FindingsList findings={result.receives} />
      </AuditBlock>

      <AuditBlock
        title="Falta considerar"
        count={result.missing.length}
        borderClass="border-sky-700/40 bg-sky-950/15"
        headerClass="text-sky-400"
      >
        <FindingsList findings={result.missing} />
      </AuditBlock>

      <AuditBlock
        title="Precaución"
        count={result.caution.length}
        borderClass="border-amber-700/40 bg-amber-950/20"
        headerClass="text-amber-400"
      >
        <FindingsList findings={result.caution} />
      </AuditBlock>

      <AuditBlock
        title="Evitar / contraindicado"
        count={result.avoid.length}
        borderClass="border-rose-700/40 bg-rose-950/15"
        headerClass="text-rose-400"
      >
        <FindingsList findings={result.avoid} />
      </AuditBlock>
    </section>
  );
}
