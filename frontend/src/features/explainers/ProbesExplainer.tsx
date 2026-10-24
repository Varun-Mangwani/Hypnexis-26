import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  ShieldAlert,
  Code2,
  Sliders,
  ExternalLink,
  Target,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';

interface ProbesExplainerProps {
  onNavigateToCockpit: (caseId?: string) => void;
}

type ProbeKey = 'probe1' | 'probe2' | 'probe3' | 'probe4';

export const ProbesExplainer: React.FC<ProbesExplainerProps> = ({ onNavigateToCockpit }) => {
  const [activeProbe, setActiveProbe] = useState<ProbeKey>('probe1');

  const probesData = {
    probe1: {
      name: 'Probe 1: Gold Context Baseline',
      subtitle: 'Component Isolation — Isolating the Generator from Retrieval Errors',
      objective:
        'Feed ONLY the verified, curated gold ground-truth reference passage into the generator prompt. Completely bypass the retriever.',
      diagnosticQuestion:
        'If the retriever were 100% perfect, would the generator still produce factually faithful and accurate responses?',
      badgeVariant: 'emerald' as const,
      color: 'text-emerald-400',
      caseId: 'ps-01',
      sampleInput: {
        query: 'What is the core diagnostic innovation in the RAG Doctor AI-04 track?',
        contextSource: 'Ground Truth Reference Passage (Slide 1 & 2)',
        injectedContext:
          '"RAG Doctor introduces decoupled evaluation where the retriever and generator are tested in complete isolation. Rather than relying on black-box end-to-end scoring, it applies 4 counterfactual probes and categorizes results into 4 discrete dual verdicts."',
        llmResponse:
          '"The core diagnostic innovation is decoupled evaluation. It tests the retriever and generator separately using 4 counterfactual probes to yield 4 dual verdicts (PASS, RETRIEVAL_MISS, HALLUCINATION, BOTH_FAILED)."',
      },
      claimAnalysis: [
        { text: 'RAG Doctor introduces decoupled evaluation', status: 'SUPPORTED', span: [0, 43] },
        { text: 'Tests retriever and generator in isolation', status: 'SUPPORTED', span: [44, 98] },
        { text: 'Yields 4 dual verdicts', status: 'SUPPORTED', span: [99, 150] },
      ],
      verdict: 'PASS (Generator operates with 100% fidelity on clean evidence)',
      keyTakeaway:
        'If Probe 1 passes but Probe 2 fails, the generator is proven innocent: your retrieval pipeline is the sole source of degradation.',
    },
    probe2: {
      name: 'Probe 2: Retrieved Context (Pipeline Realism)',
      subtitle: 'End-to-End In-Situ Pipeline Stress Test',
      objective:
        'Run the full vector similarity search, take the actual top-k retrieved chunks, and pass them to the generator.',
      diagnosticQuestion:
        'Does the production retrieval pipeline supply relevant enough information for the generator to answer reliably?',
      badgeVariant: 'blue' as const,
      color: 'text-blue-400',
      caseId: 'ps-02',
      sampleInput: {
        query: 'What are the required deliverables for Track AI-04?',
        contextSource: 'Live Vector Store Top-3 Chunks (dense cosine search)',
        injectedContext:
          '"[Chunk 04]: Deliverables include: 1. Complete evaluation dashboard, 2. Synthetic fault injection suite, 3. Real-time document ingestion supporting PDF, TXT, PPTX, 4. Desktop executable packaging."',
        llmResponse:
          '"The deliverables for Track AI-04 include an evaluation dashboard, synthetic fault injection suite, real-time multi-format document ingestion, and a desktop executable package."',
      },
      claimAnalysis: [
        { text: 'Deliverables include evaluation dashboard', status: 'SUPPORTED', span: [0, 48] },
        { text: 'Synthetic fault injection suite', status: 'SUPPORTED', span: [49, 85] },
        { text: 'Real-time multi-format document ingestion', status: 'SUPPORTED', span: [86, 134] },
      ],
      verdict: 'PASS (Context Relevance: 92%, Faithfulness: 96%)',
      keyTakeaway:
        'Reflects real user experience. Comparing Probe 2 against Probe 1 reveals the exact retrieval penalty.',
    },
    probe3: {
      name: 'Probe 3: Noise Distractor Injection',
      subtitle: 'Adversarial Distractor Resistance Stress Test',
      objective:
        'Deliberately inject 2-3 distractor chunks (irrelevant topics, opposing facts, or unrelated documents) alongside relevant context.',
      diagnosticQuestion:
        'Does the generator get easily confused or distracted by irrelevant chunks present in large context windows?',
      badgeVariant: 'amber' as const,
      color: 'text-amber-400',
      caseId: 'ps-03',
      sampleInput: {
        query: 'What metric is used for judge calibration in RAG Doctor?',
        contextSource: 'Mixed: 1 Relevant Chunk + 2 Injected Distractor Chunks',
        injectedContext:
          '"[Distractor]: In standard web benchmarks, F1 score and ROUGE-L are used to evaluate summarization models.\n[Chunk 12]: Judge calibration is quantified using Cohens Kappa against synthetic ground-truth mutations."',
        llmResponse:
          '"RAG Doctor uses Cohens Kappa against synthetic ground truth mutations, though some web benchmarks also report F1 and ROUGE-L."',
      },
      claimAnalysis: [
        { text: 'Uses Cohens Kappa against synthetic ground truth', status: 'SUPPORTED', span: [0, 52] },
        { text: 'Web benchmarks report F1 and ROUGE-L', status: 'DISTRACTED_CLAIM', span: [53, 98] },
      ],
      verdict: 'ATTENTION LEAK (Distractor chunks crept into response)',
      keyTakeaway:
        'Exposes models with weak attention sinks or overly broad system prompts that cannot ignore distractor tokens.',
    },
    probe4: {
      name: 'Probe 4: Parametric Abstention / Hallucination Trigger',
      subtitle: 'Knowledge Boundary & Abstention Integrity Test',
      objective:
        'Provide an out-of-domain or unanswerable query with zero supporting evidence in the context window.',
      diagnosticQuestion:
        'Does the generator possess self-awareness to abstain ("I do not have sufficient information") or does it hallucinate parametric memories?',
      badgeVariant: 'rose' as const,
      color: 'text-rose-400',
      caseId: 'ps-04',
      sampleInput: {
        query: 'What was the exact prize pool amount awarded at Hackathon 2024 Track 3?',
        contextSource: 'Empty Context / Out-of-Domain Document',
        injectedContext:
          '"[Context]: Document contains only problem statement objectives for AI-04. No budget or prize pool figures exist in this corpus."',
        llmResponse:
          '"Based on the provided documents, there is no mention of the specific prize pool amount for Track 3."',
      },
      claimAnalysis: [
        { text: 'No mention of prize pool amount in documents', status: 'FAITHFUL_ABSTENTION', span: [0, 58] },
      ],
      verdict: 'PASS (Proper Abstention — Zero parametric hallucination)',
      keyTakeaway:
        'Guarantees your enterprise RAG system will never confidently fabricate answers when documentation is lacking.',
    },
  };

  const current = probesData[activeProbe];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide uppercase">
              Evaluation Methodology
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-zinc-400 text-xs">Diagnostic Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            The 4 Counterfactual Stress Probes
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            By manipulating the generator's context window under 4 controlled counterfactual conditions,
            RAG Doctor separates retrieval error, context distraction, and intrinsic model confabulation.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<ExternalLink className="w-4 h-4" />}
          onClick={() => onNavigateToCockpit(current.caseId)}
        >
          Inspect Live Probe in Cockpit
        </Button>
      </div>

      {/* Probe Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['probe1', 'probe2', 'probe3', 'probe4'] as ProbeKey[]).map((k) => {
          const p = probesData[k];
          const isSelected = activeProbe === k;
          return (
            <button
              key={k}
              onClick={() => setActiveProbe(k)}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'border-emerald-500/50 bg-emerald-950/20 shadow-lg shadow-black/30 ring-1 ring-emerald-500/40'
                  : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {k.toUpperCase()}
                </span>
                <Badge variant={p.badgeVariant} className="text-[10px]">
                  Active
                </Badge>
              </div>
              <p className="text-xs font-semibold text-zinc-200 line-clamp-1">{p.name}</p>
            </button>
          );
        })}
      </div>

      {/* Active Probe Deep Dive */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <FlaskConical className={`w-5 h-5 ${current.color}`} />
              {current.name}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">{current.subtitle}</p>
          </div>
          <Badge variant={current.badgeVariant} className="text-xs px-2.5 py-1">
            {current.verdict}
          </Badge>
        </div>

        {/* Objective & Question */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              Experimental Setup
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed">{current.objective}</p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Diagnostic Inquiry
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed italic">{current.diagnosticQuestion}</p>
          </div>
        </div>

        {/* Live Input & Output Inspection Box */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              Execution Trace & Probe Evidence
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">{current.sampleInput.contextSource}</span>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-4 font-mono text-xs">
            <div>
              <span className="text-zinc-500 select-none">[User Query]: </span>
              <span className="text-zinc-200">{current.sampleInput.query}</span>
            </div>

            <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800/80 text-zinc-300 whitespace-pre-wrap leading-relaxed">
              <span className="text-zinc-500 block mb-1 select-none font-sans text-[11px] font-semibold uppercase">
                Injected Context Window:
              </span>
              {current.sampleInput.injectedContext}
            </div>

            <div>
              <span className="text-zinc-500 block mb-1 select-none font-sans text-[11px] font-semibold uppercase">
                Generator Response:
              </span>
              <span className="text-emerald-300">{current.sampleInput.llmResponse}</span>
            </div>
          </div>
        </div>

        {/* Claim Verification Breakdown */}
        <div className="space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Atomic Claim Verification Breakdown
          </span>

          <div className="space-y-2">
            {current.claimAnalysis.map((claim, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-zinc-500 font-mono">#{idx + 1}</span>
                  <span className="text-zinc-300">"{claim.text}"</span>
                </div>
                <Badge
                  variant={
                    claim.status === 'SUPPORTED' || claim.status === 'FAITHFUL_ABSTENTION'
                      ? 'emerald'
                      : 'amber'
                  }
                  className="font-mono text-[10px]"
                >
                  {claim.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Takeaway */}
        <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-blue-300">Architectural Takeaway</h4>
            <p className="text-xs text-zinc-300 leading-relaxed">{current.keyTakeaway}</p>
          </div>
        </div>
      </div>

      {/* Triangulation Decision Tree */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          How the 4 Probes Triangulate Failure Modes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="font-semibold text-zinc-200">Probe 1 vs. Probe 2 Differential</div>
            <p className="text-zinc-400 leading-relaxed">
              If Probe 1 score is high (e.g. 95%) and Probe 2 score is low (e.g. 40%), the generation LLM
              is capable, but the retriever is failing to find or rank the right chunks. Focus on retrieval
              chunk size, hybrid BM25 search, or vector embedding models.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="font-semibold text-zinc-200">Probe 3 vs. Probe 4 Resistance</div>
            <p className="text-zinc-400 leading-relaxed">
              If Probe 3 fails, the model suffers from attention dilution when distractor documents are
              present. If Probe 4 fails, the model lacks boundary calibration and invents facts rather
              than abstaining when context is missing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
