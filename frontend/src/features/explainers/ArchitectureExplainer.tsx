import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';

interface ArchitectureExplainerProps {
  onNavigateToCockpit: (caseId?: string) => void;
}

type VerdictType = 'PASS' | 'RETRIEVAL_MISS' | 'HALLUCINATION' | 'BOTH_FAILED';

export const ArchitectureExplainer: React.FC<ArchitectureExplainerProps> = ({ onNavigateToCockpit }) => {
  const [activeVerdict, setActiveVerdict] = useState<VerdictType>('RETRIEVAL_MISS');

  const verdictDetails = {
    PASS: {
      title: 'PASS (Dual Success)',
      badgeVariant: 'emerald' as const,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      colorClass: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300',
      retrieverState: 'RETRIEVAL HIT (Gold context found in top-k)',
      generatorState: 'FAITHFUL (100% claims grounded in context)',
      diagnosis: 'Pipeline healthy. Both retriever and generator operate within nominal tolerance.',
      remediation: 'No immediate action required. Maintain regression tests in automated CI/CD.',
      sampleCase: 'ps-01 (Problem Statement Overview - All facts verified against slide 1)',
      caseId: 'ps-01',
      metrics: { contextRelevance: '94%', faithfulness: '98%', accuracy: '95%' },
    },
    RETRIEVAL_MISS: {
      title: 'RETRIEVAL_MISS (Retriever Blunder)',
      badgeVariant: 'amber' as const,
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      colorClass: 'border-amber-500/40 bg-amber-500/5 text-amber-300',
      retrieverState: 'RETRIEVAL MISS (Gold context absent or low rank)',
      generatorState: 'ABSTAINED or DEGRADED (Unable to answer due to missing facts)',
      diagnosis:
        'The retriever failed to fetch the required document chunks. Even a flawless generator cannot produce factually grounded answers if the necessary knowledge is never placed in the prompt context.',
      remediation:
        '1. Increase top-k retrieval cutoff (e.g., from k=3 to k=5).\n2. Optimize chunking strategy (reduce chunk size to 256 tokens with 64 overlap).\n3. Implement hybrid search (BM25 keyword search + Dense Vector Embeddings).\n4. Add a cross-encoder re-ranker (e.g. bge-reranker-large).',
      sampleCase: 'ps-03 (Synthetic Fault Injection - Section not found in top-3)',
      caseId: 'ps-03',
      metrics: { contextRelevance: '20%', faithfulness: '100%', accuracy: '35%' },
    },
    HALLUCINATION: {
      title: 'HALLUCINATION (Generator Stray)',
      badgeVariant: 'red' as const,
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      colorClass: 'border-red-500/40 bg-red-500/5 text-red-300',
      retrieverState: 'RETRIEVAL HIT (Gold chunk was present in context)',
      generatorState: 'UNFAITHFUL (Generator fabricated claims not in evidence)',
      diagnosis:
        'The retriever provided the correct ground-truth chunk, but the generator ignored the evidence, introduced extraneous parametric knowledge, or fabricated dates, metrics, or citations.',
      remediation:
        '1. Lower LLM temperature (e.g., set temperature=0.0).\n2. Enforce explicit system prompt grounding constraints: "Answer solely from the provided excerpts. Cite chunk IDs."\n3. Use Claim-Level Verification and require Chain-of-Thought attribution.\n4. Switch to a more capable generator model or use Gemini 2.0 Flash fallback.',
      sampleCase: 'ps-04 (Counterfactual Probe - Generator invented unsupported team sizes)',
      caseId: 'ps-04',
      metrics: { contextRelevance: '91%', faithfulness: '42%', accuracy: '45%' },
    },
    BOTH_FAILED: {
      title: 'BOTH_FAILED (Compound Failure)',
      badgeVariant: 'rose' as const,
      icon: <AlertOctagon className="w-5 h-5 text-rose-400" />,
      colorClass: 'border-rose-500/40 bg-rose-500/5 text-rose-300',
      retrieverState: 'RETRIEVAL MISS (Irrelevant or distractor chunks retrieved)',
      generatorState: 'UNFAITHFUL / CONFABULATED (Fabricated answers on bogus context)',
      diagnosis:
        'Catastrophic failure mode. The retriever fetched irrelevant distractors, and instead of admitting lack of context, the generator hallucinated a plausible-sounding hallucination.',
      remediation:
        '1. Implement strict Parametric Abstention: enforce "If the context does not contain the answer, reply ONLY: Insufficient context".\n2. Overhaul document indexing and metadata filters.\n3. Calibrate judge thresholds to catch compound failures early.',
      sampleCase: 'ps-05 (Noise Distractor - Out-of-domain prompt with distractor)',
      caseId: 'ps-05',
      metrics: { contextRelevance: '15%', faithfulness: '25%', accuracy: '10%' },
    },
  };

  const selected = verdictDetails[activeVerdict];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
              AI-04 Core Methodology
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-zinc-400 text-xs">Diagnostic Framework</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Decoupled Retriever vs. Generator Evaluation
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Standard RAG evaluations treat the pipeline as an opaque black box. When an answer is wrong,
            teams waste days debugging the LLM prompt when the retriever missed the chunk, or tuning vector
            indexes when the LLM hallucinated despite having the right context. RAG Doctor solves this by
            testing retriever and generator in complete isolation.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Sparkles className="w-4 h-4" />}
          onClick={() => onNavigateToCockpit(selected.caseId)}
        >
          View Case in Cockpit
        </Button>
      </div>

      {/* Why Decoupled Testing Solves The Problem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-5 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <XCircle className="w-4 h-4" />
            The Black-Box RAG Trap
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            In standard benchmarks (e.g. naive BLEU/ROUGE or end-to-end question answering), failures are
            opaque. You cannot tell whether an incorrect response occurred because:
          </p>
          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
            <li>The retrieval system fetched noise chunks or missed the gold section.</li>
            <li>The retriever succeeded, but the LLM hallucinated details from pretraining.</li>
            <li>The context was incomplete, but the model guessed rather than abstaining.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            RAG Doctor's Decoupled Solution
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            We isolate each component through counterfactual probe injection and gold reference alignment:
          </p>
          <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-4">
            <li>
              <span className="text-emerald-400 font-medium">Retriever Isolation:</span> Evaluated against
              gold span matches using Precision@k, Recall@k, and Hit Rate.
            </li>
            <li>
              <span className="text-emerald-400 font-medium">Generator Isolation:</span> Evaluated with
              controlled Gold Context to measure pure generation fidelity without retrieval noise.
            </li>
            <li>
              <span className="text-emerald-400 font-medium">Dual Verdict Attribution:</span> Every query
              is categorized into one of 4 deterministic quadrants.
            </li>
          </ul>
        </div>
      </div>

      {/* The 4 Dual Verdicts Matrix */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            The 4 Dual Verdicts Matrix
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Click on any verdict below to inspect its failure mechanics, diagnostic signals, and recommended fixes.
          </p>
        </div>

        {/* Quadrant Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['PASS', 'RETRIEVAL_MISS', 'HALLUCINATION', 'BOTH_FAILED'] as VerdictType[]).map((v) => {
            const item = verdictDetails[v];
            const isSelected = activeVerdict === v;
            return (
              <button
                key={v}
                onClick={() => setActiveVerdict(v)}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? `${item.colorClass} ring-2 ring-emerald-500/40 shadow-lg shadow-black/40`
                    : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="font-mono text-xs font-bold">{v}</span>
                  </div>
                  <Badge variant={item.badgeVariant} className="text-[10px]">
                    {v === 'PASS' ? 'Optimal' : 'Needs Fix'}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-300 font-medium line-clamp-2">
                  {item.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Verdict Deep-Dive */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6 backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                {selected.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">{selected.title}</h3>
                <p className="text-xs text-zinc-400">Component State Attribution</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => onNavigateToCockpit(selected.caseId)}
              >
                Inspect Example in Cockpit
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                Retriever Component State
              </span>
              <p className="font-mono text-xs text-zinc-200">{selected.retrieverState}</p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                Generator Component State
              </span>
              <p className="font-mono text-xs text-zinc-200">{selected.generatorState}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Root Cause Diagnosis
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-800/60">
              {selected.diagnosis}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Prescribed Remediation Action
            </h4>
            <div className="text-xs text-zinc-300 leading-relaxed bg-emerald-950/10 p-3.5 rounded-lg border border-emerald-500/20 whitespace-pre-line font-mono">
              {selected.remediation}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
            <span>Associated Test Case: <span className="font-mono text-zinc-200 font-semibold">{selected.sampleCase}</span></span>
            <span className="text-zinc-600">|</span>
            <span>Typical Context Relevance: <span className="font-mono text-emerald-400 font-semibold">{selected.metrics.contextRelevance}</span></span>
            <span className="text-zinc-600">|</span>
            <span>Typical Faithfulness: <span className="font-mono text-blue-400 font-semibold">{selected.metrics.faithfulness}</span></span>
          </div>
        </div>
      </div>

      {/* Component Isolation Diagram */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          The Component Isolation Pipeline
        </h2>
        <p className="text-xs text-zinc-400">
          How RAG Doctor injects counterfactual baselines to decouple component failure attribution:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-mono text-xs">
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="text-emerald-400 font-semibold">1. Retriever Evaluation</div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Query is run against Vector Store. Retrieved chunks are compared against Ground Truth Spans.
            </p>
            <div className="pt-2 text-[10px] text-zinc-500">
              Metric: Hit Rate@k, MRR, Context Relevance
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="text-blue-400 font-semibold">2. Generator Evaluation</div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Generator is evaluated on two streams: (A) Gold Reference Context, and (B) Retrieved Context.
            </p>
            <div className="pt-2 text-[10px] text-zinc-500">
              Metric: Claim Grounding, Faithfulness %, Abstention Rate
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="text-purple-400 font-semibold">3. Dual Verdict Assignment</div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Both evaluations are synthesized into one of 4 discrete verdicts with root cause pinpointing.
            </p>
            <div className="pt-2 text-[10px] text-zinc-500">
              Verdict: PASS | RETRIEVAL_MISS | HALLUCINATION | BOTH
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Metrics Breakdown */}
      <div className="space-y-4 pb-8">
        <h2 className="text-base font-bold text-zinc-100">
          Mathematical Formulation of Core Diagnostic Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-2">
            <div className="text-xs font-semibold text-zinc-300">Context Relevance Score</div>
            <div className="p-2 rounded bg-zinc-950 font-mono text-[11px] text-emerald-400 text-center">
              CR = |Chunks_relevant| / |Chunks_retrieved|
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Measures signal-to-noise ratio in retrieved context chunks. A low score indicates the prompt
              is polluted with distractors.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-2">
            <div className="text-xs font-semibold text-zinc-300">Generator Faithfulness</div>
            <div className="p-2 rounded bg-zinc-950 font-mono text-[11px] text-blue-400 text-center">
              GF = |Claims_supported| / |Claims_total|
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Extracts discrete factual atomic claims from the generated answer and checks if each claim has
              a direct textual entailment in the provided context.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-2">
            <div className="text-xs font-semibold text-zinc-300">Grounded Accuracy</div>
            <div className="p-2 rounded bg-zinc-950 font-mono text-[11px] text-purple-400 text-center">
              GA = Semantic_Match(Output, Gold_Answer)
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Evaluates if the response satisfies the user's intent and factually aligns with the verified
              ground truth answer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
