import React, { useState } from 'react';
import { AlertCircle, Wrench, Download, ShieldCheck, ShieldAlert, Copy, Check } from 'lucide-react';
import { useCaseDetail } from '../../api/useRuns';
import { DualVerdictBadge } from '../../components/DualVerdictBadge';
import { Skeleton } from '../../components/Skeleton';
import { CompareButton } from '../compare/CompareModal';
import { cn } from '../../lib/utils';

interface ProbeRowProps {
  label: string;
  passed: boolean | undefined;
  reason?: string;
}

const ProbeRow: React.FC<ProbeRowProps> = ({ label, passed, reason }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid var(--border-soft)',
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
      {reason && (
        <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 6 }} title={reason}>
          ({reason.length > 32 ? reason.slice(0, 32) + '…' : reason})
        </span>
      )}
    </div>
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '2px 7px',
        borderRadius: 4,
        flexShrink: 0,
        border: `1px solid ${passed ? 'var(--highlight-supported-border)' : 'var(--highlight-unsupported-border)'}`,
        color: passed ? 'var(--highlight-supported-text)' : 'var(--highlight-unsupported-text)',
        background: passed ? 'var(--highlight-supported-bg)' : 'var(--highlight-unsupported-bg)',
      }}
    >
      {passed
        ? <ShieldCheck style={{ width: 10, height: 10 }} />
        : <ShieldAlert style={{ width: 10, height: 10 }} />
      }
      {passed ? 'Pass' : 'Fail'}
    </span>
  </div>
);

const handleExport = (runId: string) => window.open(`/api/runs/${runId}/report`, '_blank');

export interface DiagnosisStubProps {
  caseId: string | null;
  runId?: string;
}

export const DiagnosisStub: React.FC<DiagnosisStubProps> = ({ caseId, runId }) => {
  const { data: currentCase, isLoading } = useCaseDetail(caseId);
  const [fixCopied, setFixCopied] = useState(false);

  const handleCopyFix = () => {
    if (!currentCase?.fix_suggestion) return;
    navigator.clipboard.writeText(currentCase.fix_suggestion);
    setFixCopied(true);
    setTimeout(() => setFixCopied(false), 1500);
  };

  if (isLoading || !currentCase) {
    return (
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 64, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
      </div>
    );
  }

  const isPass = currentCase.verdict === 'PASS';
  const isAmber = currentCase.verdict === 'CONTEXT_DISTRACTION';
  const verdictBg = isPass ? 'rgba(16,185,129,0.06)' : isAmber ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)';
  const verdictBorder = isPass ? 'rgba(16,185,129,0.2)' : isAmber ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)';

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Verdict card */}
      <div
        style={{
          padding: 12,
          borderRadius: 8,
          border: `1px solid ${verdictBorder}`,
          background: verdictBg,
          textAlign: 'center',
        }}
      >
        <div className="t-label" style={{ marginBottom: 6 }}>Diagnostic Verdict</div>
        <DualVerdictBadge verdict={currentCase.verdict} size="lg" className="justify-center" />
        {currentCase.verdict_detail && (
          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6, fontFamily: 'monospace', margin: '6px 0 0' }}>
            {currentCase.verdict_detail}
          </p>
        )}
      </div>

      {/* Root cause */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <AlertCircle style={{ width: 13, height: 13, color: '#f59e0b', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Root Cause</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
          {currentCase.explanation}
        </p>
      </div>

      {/* Fix suggestion */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid rgba(16,185,129,0.2)',
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wrench style={{ width: 13, height: 13, color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Fix Action</span>
          </div>
          <button
            onClick={handleCopyFix}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}
          >
            {fixCopied ? <Check style={{ width: 10, height: 10, color: 'var(--accent)' }} /> : <Copy style={{ width: 10, height: 10 }} />}
            {fixCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
          {currentCase.fix_suggestion || 'No remediation required — evaluation passed.'}
        </p>
      </div>

      {/* Probes */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="t-label">Counterfactual Probes</div>
          <span style={{ fontSize: 9, color: 'var(--text-3)' }}>Component isolation</span>
        </div>
        <ProbeRow label="Gold Context"       passed={currentCase.probes.gold_probe.passed}       reason={currentCase.probes.gold_probe.reason} />
        <ProbeRow label="Retrieved Context"  passed={currentCase.probes.retrieved_probe.passed}  reason={currentCase.probes.retrieved_probe.reason} />
        <ProbeRow label="Parametric Refusal" passed={currentCase.probes.no_context_probe.passed} reason={currentCase.probes.no_context_probe.reason} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 2 }}>
        <CompareButton runId={runId || currentCase.run_id} />
        <button
          id="btn-export-report"
          onClick={() => handleExport(runId || currentCase.run_id)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--bg-surface)',
            fontSize: 11, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer',
          }}
        >
          <Download style={{ width: 12, height: 12 }} />
          Export Report
        </button>
      </div>
    </div>
  );
};
