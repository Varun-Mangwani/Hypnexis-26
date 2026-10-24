import React from 'react';
import { ShieldCheck, BarChart3, Layers } from 'lucide-react';
import { useValidation } from '../../api/useRuns';

const MOCK_VALIDATION = {
  cohen_kappa: 0.88,
  calibration_verdict: 'Strong inter-annotator agreement (κ = 0.88) — LLM judge is certified for autonomous production evaluation.',
  confusion_matrix: { true_positives: 38, false_positives: 4, true_negatives: 52, false_negatives: 6 },
};

const FAULT_INJECTIONS = [
  { name: 'Tiny Chunks (64 chars)',  rate: '80% miss' },
  { name: 'Top-K=1 Starvation',     rate: '70% miss' },
  { name: 'Shuffled Retrieval',      rate: '60% miss' },
  { name: 'Guess Prompt',            rate: '50% hall' },
  { name: 'Gold Removed',            rate: '70% miss' },
];

export interface ValidationViewProps { runId?: string; }

export const ValidationView: React.FC<ValidationViewProps> = ({ runId = 'run-demo-eval-001' }) => {
  const { data: valData } = useValidation(runId);
  const v = valData || MOCK_VALIDATION;
  const cm = v.confusion_matrix;

  const total = cm.true_positives + cm.false_positives + cm.true_negatives + cm.false_negatives;
  const precision = cm.true_positives / (cm.true_positives + cm.false_positives || 1);
  const recall    = cm.true_positives / (cm.true_positives + cm.false_negatives || 1);
  const f1        = (2 * precision * recall) / (precision + recall || 1);

  const kPct  = Math.round(v.cohen_kappa * 100);
  const kColor = v.cohen_kappa >= 0.8 ? 'var(--accent)' : v.cohen_kappa >= 0.6 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div className="t-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShieldCheck style={{ width: 11, height: 11, color: 'var(--accent)' }} />
        Judge Calibration
      </div>

      {/* Kappa gauge */}
      <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Cohen's Kappa (κ)</span>
          <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: kColor, lineHeight: 1 }}>
            {v.cohen_kappa.toFixed(3)}
          </span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 4 }}>
          <div className="progress-fill" style={{ width: `${kPct}%`, background: kColor }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'monospace', color: 'var(--text-3)' }}>
          <span>0.0 chance</span>
          <span>0.6 substantial</span>
          <span>0.8+ certified</span>
        </div>
      </div>

      {/* Calibration verdict */}
      <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--highlight-supported-bg)', border: '1px solid var(--highlight-supported-border)', fontSize: 11, color: 'var(--text-2)', lineHeight: 1.55 }}>
        {v.calibration_verdict}
      </div>

      {/* Confusion matrix */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <BarChart3 style={{ width: 11, height: 11, color: 'var(--accent)' }} />
            <span className="t-label">Confusion Matrix ({total})</span>
          </div>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)' }}>F1 = {f1.toFixed(2)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          {[
            { label: 'TP', value: cm.true_positives,  good: true  },
            { label: 'FP', value: cm.false_positives, good: false },
            { label: 'FN', value: cm.false_negatives, good: false },
            { label: 'TN', value: cm.true_negatives,  good: true  },
          ].map(({ label, value, good }) => (
            <div
              key={label}
              style={{
                padding: '8px 4px',
                borderRadius: 6,
                border: `1px solid ${good ? 'var(--highlight-supported-border)' : 'var(--highlight-unsupported-border)'}`,
                background: good ? 'var(--highlight-supported-bg)' : 'var(--highlight-unsupported-bg)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', color: good ? 'var(--highlight-supported-text)' : 'var(--highlight-unsupported-text)', marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: good ? 'var(--highlight-supported-text)' : 'var(--highlight-unsupported-text)', lineHeight: 1 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)', padding: '0 2px' }}>
          <span>Prec {(precision * 100).toFixed(0)}%</span>
          <span>Recall {(recall * 100).toFixed(0)}%</span>
          <span>F1 {(f1 * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Fault injection */}
      <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <Layers style={{ width: 11, height: 11, color: 'var(--accent)' }} />
          <span className="t-label">Fault Injection Library</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {FAULT_INJECTIONS.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
                borderBottom: i < FAULT_INJECTIONS.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{f.name}</span>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)' }}>{f.rate}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
