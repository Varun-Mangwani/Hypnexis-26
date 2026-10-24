import React from 'react';
import { useRun } from '../../api/useRuns';
import { cn } from '../../lib/utils';

export interface ScoresStubProps {
  runId?: string;
}

interface MetricCardProps {
  label: string;
  sublabel: string;
  value: number;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, sublabel, value, color }) => {
  const pct = Math.round(value * 100);
  const tag = pct >= 80 ? 'Optimal' : pct >= 65 ? 'Moderate' : 'Bottleneck';
  const tagColor = pct >= 80 ? '#10b981' : pct >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <div
      style={{
        padding: '16px 12px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "'JetBrains Mono', monospace",
          color,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          margin: '4px 0',
        }}
      >
        {pct}<span style={{ fontSize: 16, fontWeight: 600 }}>%</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{sublabel}</div>
      <span
        style={{
          marginTop: 2,
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: tagColor,
          background: `${tagColor}18`,
          border: `1px solid ${tagColor}35`,
          borderRadius: 4,
          padding: '2px 7px',
        }}
      >
        {tag}
      </span>
    </div>
  );
};

const Bar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
    <div className="progress-bar" style={{ height: 5 }}>
      <div className="progress-fill" style={{ width: `${value * 100}%`, background: color, height: 5 }} />
    </div>
  </div>
);

export const ScoresStub: React.FC<ScoresStubProps> = ({ runId = 'run-demo-eval-001' }) => {
  const { data: run, isLoading } = useRun(runId);

  if (isLoading || !run) {
    return (
      <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 14, width: '50%', borderRadius: 4 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 10 }} />)}
        </div>
      </div>
    );
  }

  const s = run.scores;
  const cs = run.component_scores;

  return (
    <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          Scorecards
        </div>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)' }}>
          {run.total_cases} cases
        </span>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        <MetricCard
          label="Retriever"
          sublabel="Context Rel."
          value={s.context_relevance}
          color="var(--accent)"
        />
        <MetricCard
          label="Generator"
          sublabel="Faithfulness"
          value={s.faithfulness}
          color="#f59e0b"
        />
        <MetricCard
          label="E2E"
          sublabel="Accuracy"
          value={s.answer_accuracy}
          color={s.answer_accuracy >= 0.7 ? 'var(--accent)' : '#ef4444'}
        />
      </div>

      {/* Component isolation bars */}
      <div
        style={{
          padding: '14px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          Component Isolation
        </div>
        <Bar label="Retriever Hit & Recall" value={cs.retriever_score} color="var(--accent)" />
        <Bar label="Generator (Gold ctx.)"  value={cs.generator_score} color="#f59e0b" />
      </div>
    </div>
  );
};
