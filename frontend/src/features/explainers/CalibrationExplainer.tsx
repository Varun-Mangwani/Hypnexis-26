import React, { useState } from 'react';
import {
  AlertTriangle,
  Scale,
  ShieldCheck,
  Zap,
  Activity,
  Target,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';

interface CalibrationExplainerProps {
  onNavigateToCockpit: () => void;
}

type MutationType = 'entity_swap' | 'negation' | 'number_scramble' | 'citation_shuffle';

export const CalibrationExplainer: React.FC<CalibrationExplainerProps> = ({ onNavigateToCockpit }) => {
  const [selectedMutation, setSelectedMutation] = useState<MutationType>('entity_swap');

  const mutationData = {
    entity_swap: {
      name: 'Entity Swap Mutation',
      description: 'Replaces key named entities with plausible alternatives to verify judge fact-checking vigilance.',
      originalText: 'RAG Doctor was designed for the AI-04 evaluation track using decoupled testing.',
      mutatedText: 'AutoRAG was designed for the AI-04 evaluation track using decoupled testing.',
      expectedVerdict: 'FAIL (Entity mismatch: "AutoRAG" vs ground truth "RAG Doctor")',
      judgeDetectionRate: '96.4%',
      kappaContribution: '+0.12',
    },
    negation: {
      name: 'Negation Inversion Mutation',
      description: 'Inserts or removes syntactic negations ("not", "never", "fails") to reverse semantic truth.',
      originalText: 'Decoupled evaluation isolates retriever errors from generator hallucinations.',
      mutatedText: 'Decoupled evaluation does not isolate retriever errors from generator hallucinations.',
      expectedVerdict: 'FAIL (Direct contradiction of core architecture truth)',
      judgeDetectionRate: '98.8%',
      kappaContribution: '+0.15',
    },
    number_scramble: {
      name: 'Numeric Scramble Mutation',
      description: 'Perturbs numbers, percentages, thresholds, and chunk sizes by +/- 20% to 50%.',
      originalText: 'The evaluation corpus contains 37 chunks with a target chunk size of 512 tokens.',
      mutatedText: 'The evaluation corpus contains 94 chunks with a target chunk size of 1024 tokens.',
      expectedVerdict: 'FAIL (Numeric distortion: chunk count 94 vs ground truth 37)',
      judgeDetectionRate: '91.2%',
      kappaContribution: '+0.09',
    },
    citation_shuffle: {
      name: 'Citation Shuffling Mutation',
      description: 'Links an otherwise truthful claim to an unrelated or incorrect chunk ID span.',
      originalText: 'Dual verdicts categorize failure modes [Cited: Chunk 02, lines 12-24].',
      mutatedText: 'Dual verdicts categorize failure modes [Cited: Chunk 19, lines 80-92].',
      expectedVerdict: 'FAIL (Citation Hallucination: Chunk 19 contains no dual verdict definitions)',
      judgeDetectionRate: '88.7%',
      kappaContribution: '+0.08',
    },
  };

  const current = mutationData[selectedMutation];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold tracking-wide uppercase">
              Statistical Verification
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-zinc-400 text-xs">Judge Reliability</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Judge Calibration & Synthetic Fault Injections
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            "Who judges the judge?" Using an LLM to evaluate another LLM without calibration leads to
            verbosity bias, position bias, and silent evaluation drift. RAG Doctor calibrates the judge
            using synthetic ground-truth mutations and Cohen's Kappa ($ \kappa $).
          </p>
        </div>
        <Button variant="primary" icon={<Target className="w-4 h-4" />} onClick={onNavigateToCockpit}>
          Open Calibration View
        </Button>
      </div>

      {/* Why Judge Calibration Matters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4" />
            Verbosity Bias
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Uncalibrated LLM judges routinely award higher faithfulness scores to longer, more elaborate
            answers, even when they introduce ungrounded claims.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
            <Scale className="w-4 h-4" />
            Cohen's Kappa Target
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            We target $ \kappa \ge 0.85 $ between our multi-tier judge (Gemini 2.0 Flash fallback) and human
            reference evaluations across 100+ synthetic cases.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4" />
            Nyquist Verification
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Statistical confidence intervals (Wilson score 95% CI) guarantee metrics are statistically
            sound before shipping models to production.
          </p>
        </div>
      </div>

      {/* Synthetic Fault Injection Suite */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Synthetic Fault Injection Matrix
          </h2>
          <p className="text-xs text-zinc-400">
            We inject known, controlled mutations into ground-truth text. If the judge fails to flag these
            injected errors, its calibration score drops automatically.
          </p>
        </div>

        {/* Mutation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['entity_swap', 'negation', 'number_scramble', 'citation_shuffle'] as MutationType[]).map((m) => {
            const data = mutationData[m];
            const isSelected = selectedMutation === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMutation(m)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-purple-500/50 bg-purple-950/20 ring-1 ring-purple-500/40'
                    : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-purple-400' : 'text-zinc-400'}`}>
                    MUTATION
                  </span>
                  <Badge variant={isSelected ? 'purple' : 'zinc'} className="text-[10px]">
                    {data.judgeDetectionRate}
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-zinc-200">{data.name}</p>
              </button>
            );
          })}
        </div>

        {/* Active Mutation Inspection */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 backdrop-blur">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-zinc-100">{current.name}</h3>
              <p className="text-xs text-zinc-400">{current.description}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 block uppercase font-mono">Detection Accuracy</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{current.judgeDetectionRate}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Original Ground Truth:
              </span>
              <p className="text-zinc-300 leading-relaxed font-sans">{current.originalText}</p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950 border border-purple-500/30 space-y-2">
              <span className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold block">
                Injected Mutation:
              </span>
              <p className="text-purple-300 leading-relaxed font-sans">{current.mutatedText}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-semibold uppercase text-[11px]">Calibration Verdict:</span>
              <span className="font-mono text-emerald-400 font-medium">{current.expectedVerdict}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-[11px]">Inter-Annotator Kappa:</span>
              <Badge variant="emerald" className="font-mono text-xs">
                {current.kappaContribution}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* The Cohen's Kappa Scale Guide */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Cohen's Kappa ($ \kappa $) Production Certification Bands
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-lg bg-emerald-950/15 border border-emerald-500/30 space-y-1.5">
            <div className="text-emerald-400 font-bold">κ ≥ 0.85 — Production Certified</div>
            <p className="text-zinc-400 font-sans text-[11px] leading-relaxed">
              Exceptional agreement with verified human ground truth. Evaluation runs can be safely automated
              without manual audit.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-950/15 border border-amber-500/30 space-y-1.5">
            <div className="text-amber-400 font-bold">0.70 ≤ κ &lt; 0.85 — Supervised</div>
            <p className="text-zinc-400 font-sans text-[11px] leading-relaxed">
              Moderate agreement. Requires human-in-the-loop validation on borderline or low-confidence cases.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-red-950/15 border border-red-500/30 space-y-1.5">
            <div className="text-red-400 font-bold">κ &lt; 0.70 — Uncalibrated</div>
            <p className="text-zinc-400 font-sans text-[11px] leading-relaxed">
              Unreliable judge. High rate of false positives/negatives. Automatic fallback to secondary
              model (Gemini 2.0 Flash) triggered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
