import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, GitCompare } from 'lucide-react';
import { Button } from '../../components/Button';
import { cn } from '../../lib/utils';

import { useComparison } from '../../api/useRuns';

interface CompareModalProps {
  onClose: () => void;
  runId?: string;
}

const MOCK_COMPARISON = {
  run_a_id: 'run-demo-eval-001',
  run_b_id: 'run-demo-eval-002',
  delta_scores: {
    context_relevance: 0.08,
    faithfulness: -0.03,
    answer_accuracy: 0.12,
  },
  improved_cases_count: 4,
  regressed_cases_count: 1,
  unchanged_cases_count: 15,
};

const DeltaRow: React.FC<{ label: string; delta: number }> = ({ label, delta }) => {
  const pct = (delta * 100).toFixed(1);
  const pos = delta > 0;
  const zero = delta === 0;
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-zinc-400">{label}</span>
      <div className={cn(
        'flex items-center gap-1 font-mono font-bold',
        zero ? 'text-zinc-500' : pos ? 'text-emerald-400' : 'text-rose-400'
      )}>
        {zero ? <Minus className="w-3.5 h-3.5" /> : pos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {pos ? '+' : ''}{pct}%
      </div>
    </div>
  );
};

export const CompareModal: React.FC<CompareModalProps> = ({ onClose, runId = 'run-demo-eval-001' }) => {
  const { data: compData } = useComparison(runId, 'run-demo-eval-002');
  const d = compData || MOCK_COMPARISON;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Run Comparison">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <GitCompare className="w-4 h-4 text-emerald-400" />
            Run Comparison
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-500 rounded"
            aria-label="Close comparison"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
            <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700">{d.run_a_id}</span>
            <span>→</span>
            <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700">{d.run_b_id}</span>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Score Deltas</div>
            <div className="divide-y divide-zinc-800/60">
              <DeltaRow label="Context Relevance" delta={d.delta_scores.context_relevance} />
              <DeltaRow label="Faithfulness" delta={d.delta_scores.faithfulness} />
              <DeltaRow label="Answer Accuracy" delta={d.delta_scores.answer_accuracy} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="p-2 bg-emerald-950/30 border border-emerald-800/40 rounded">
              <div className="text-emerald-400 font-bold text-base">{d.improved_cases_count}</div>
              <div className="text-zinc-400">Improved</div>
            </div>
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
              <div className="text-zinc-300 font-bold text-base">{d.unchanged_cases_count}</div>
              <div className="text-zinc-500">Unchanged</div>
            </div>
            <div className="p-2 bg-rose-950/30 border border-rose-800/40 rounded">
              <div className="text-rose-400 font-bold text-base">{d.regressed_cases_count}</div>
              <div className="text-zinc-400">Regressed</div>
            </div>
          </div>

          <Button id="btn-close-compare" variant="outline" size="sm" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export interface CompareButtonProps {
  runId?: string;
}

export const CompareButton: React.FC<CompareButtonProps> = ({ runId }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        id="btn-open-compare"
        variant="outline"
        size="sm"
        className="flex-1"
        icon={<GitCompare className="w-3.5 h-3.5" />}
        onClick={() => setOpen(true)}
      >
        Compare
      </Button>
      {open && <CompareModal runId={runId} onClose={() => setOpen(false)} />}
    </>
  );
};

