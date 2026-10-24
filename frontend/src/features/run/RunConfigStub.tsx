import React, { useState, useCallback } from 'react';
import { Play, Settings2, Zap, Target, Hash, ChevronDown, ChevronUp } from 'lucide-react';
import { useSSEStream } from './useSSEStream';
import { startEvaluationRun } from '../../api/client';
import { cn } from '../../lib/utils';

export interface RunConfig { chunk_size: number; top_k: number; num_questions: number; }
export interface RunConfigProps {
  corpusId?: string;
  onRunStarted?: (runId: string) => void;
  onRunCompleted?: (runId: string) => void;
}

const SliderRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}> = ({ icon, label, id, value, min, max, step, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)', width: 80, flexShrink: 0 }}>
      {icon}
      {label}
    </span>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ flex: 1, cursor: 'pointer' }}
    />
    <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text)', width: 32, textAlign: 'right', flexShrink: 0 }}>
      {value}
    </span>
  </div>
);

export const RunConfigStub: React.FC<RunConfigProps> = ({ corpusId = 'corpus-demo-001', onRunStarted, onRunCompleted }) => {
  const [config, setConfig] = useState<RunConfig>({ chunk_size: 512, top_k: 3, num_questions: 20 });
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isSectionOpen, setIsSectionOpen] = useState(true);

  const handleComplete = useCallback(() => {
    if (activeRunId) onRunCompleted?.(activeRunId);
  }, [activeRunId, onRunCompleted]);

  const { progress, startMockStream } = useSSEStream(activeRunId, handleComplete);

  const handleRun = async () => {
    try {
      const runId = await startEvaluationRun(corpusId, config);
      setActiveRunId(runId);
      onRunStarted?.(runId);
    } catch {
      const fallbackId = 'mock-run-' + Date.now();
      setActiveRunId(fallbackId);
      onRunStarted?.(fallbackId);
      startMockStream();
    }
  };

  const pct = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;
  const isRunning = progress.status === 'running';
  const isDone = progress.status === 'completed';

  return (
    <div
      style={{
        padding: isSectionOpen ? '12px' : '10px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        transition: 'padding 0.2s',
      }}
    >
      <div
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          marginBottom: isSectionOpen ? 8 : 0,
          userSelect: 'none',
        }}
      >
        <div className="t-label">Run Config</div>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-3)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
          }}
          title={isSectionOpen ? 'Collapse section' : 'Expand section'}
        >
          {isSectionOpen ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
        </button>
      </div>

      {isSectionOpen && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        <SliderRow
          icon={<Hash style={{ width: 10, height: 10 }} />}
          label="Chunk size"
          id="run-config-chunk_size"
          value={config.chunk_size}
          min={128} max={2048} step={128}
          onChange={(v) => setConfig((p) => ({ ...p, chunk_size: v }))}
        />
        <SliderRow
          icon={<Target style={{ width: 10, height: 10 }} />}
          label="Top-K"
          id="run-config-top_k"
          value={config.top_k}
          min={1} max={10} step={1}
          onChange={(v) => setConfig((p) => ({ ...p, top_k: v }))}
        />
        <SliderRow
          icon={<Zap style={{ width: 10, height: 10 }} />}
          label="Questions"
          id="run-config-num_questions"
          value={config.num_questions}
          min={5} max={100} step={5}
          onChange={(v) => setConfig((p) => ({ ...p, num_questions: v }))}
        />
      </div>

      {/* Progress */}
      {progress.status !== 'idle' && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              color: isDone ? 'var(--accent)' : progress.status === 'error' ? '#ef4444' : 'var(--text-2)',
            }}>
              {progress.message}
            </span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)' }}>
              {progress.processed}/{progress.total}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${pct}%`,
                background: isDone ? 'var(--accent)' : progress.status === 'reconnecting' ? '#f59e0b' : 'var(--accent)',
              }}
              role="progressbar"
              aria-valuenow={progress.processed}
              aria-valuemax={progress.total}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>
              {(progress.token_count / 1000).toFixed(1)}k tokens
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>
              {(progress.elapsed_ms / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      )}

      {/* Run button */}
      <button
        id="btn-run-evaluation"
        onClick={handleRun}
        disabled={isRunning}
        style={{
          width: '100%',
          padding: '7px 12px',
          borderRadius: 7,
          border: 'none',
          background: isRunning ? 'var(--bg-muted)' : 'var(--accent)',
          color: isRunning ? 'var(--text-3)' : '#000',
          fontSize: 12,
          fontWeight: 600,
          cursor: isRunning ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'all 0.15s',
          opacity: isRunning ? 0.6 : 1,
        }}
      >
        <Play style={{ width: 12, height: 12 }} />
        {isRunning ? 'Running…' : 'Run Evaluation'}
      </button>
        </>
      )}
    </div>
  );
};
