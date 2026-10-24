import React, { useState } from 'react';
import {
  X,
  Search,
  Sparkles,
  FileText,
  Clock,
  Award,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Skeleton } from '../../components/Skeleton';
import { sendAdHocQuery, type AdHocQueryResult } from '../../api/client';
import { cn } from '../../lib/utils';

export interface AdHocQueryModalProps {
  corpusId: string;
  onClose: () => void;
}

const SAMPLE_PROMPTS = [
  'What was the reported enterprise gross margin and revenue growth in Q3?',
  'What was operating cash flow compared to prior year?',
  'What are the key retention metrics across enterprise cohorts?',
];

export const AdHocQueryModal: React.FC<AdHocQueryModalProps> = ({ corpusId, onClose }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdHocQueryResult | null>(null);

  const handleSearch = async (q?: string) => {
    const queryToRun = q || question;
    if (!queryToRun.trim()) return;
    setLoading(true);
    try {
      const res = await sendAdHocQuery(corpusId, queryToRun);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Ad-Hoc Query Sandbox"
    >
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Live RAG Query Sandbox</h2>
              <p className="text-[11px] text-zinc-400">
                Execute ad-hoc inquiries against corpus chunks with live metric scoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 flex-shrink-0 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask an evaluation question against the loaded corpus..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-3.5 pr-28 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-500"
            />
            <div className="absolute right-1.5 top-1.5">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSearch()}
                disabled={loading || !question.trim()}
                icon={<ArrowRight className="w-3 h-3" />}
              >
                {loading ? 'Evaluating…' : 'Query'}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-zinc-500 font-medium">Try:</span>
            {SAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setQuestion(prompt);
                  handleSearch(prompt);
                }}
                className="text-left text-[11px] px-2 py-0.5 rounded bg-zinc-800/70 border border-zinc-700/60 text-zinc-300 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors truncate max-w-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="p-12 text-center text-xs text-zinc-500 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-zinc-600" />
              <p className="font-medium text-zinc-400">No query executed yet.</p>
              <p>Type a question or pick one of the sample prompts above to test live retrieval and synthesis.</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Relevance
                  </div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    {(result.scores.context_relevance * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Faithfulness
                  </div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    {(result.scores.faithfulness * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Latency
                  </div>
                  <div className="text-lg font-bold text-zinc-200 font-mono mt-0.5 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {result.latency_ms}ms
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/70 rounded-lg border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Synthesized Answer
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed">{result.answer}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Top Retrieved Chunks ({result.retrieved.length})
                  </span>
                  <span className="text-[11px] text-zinc-500">Ranked by Hybrid Cosine + BM25</span>
                </div>

                <div className="space-y-2.5">
                  {result.retrieved.map((chunk, idx) => (
                    <div
                      key={chunk.chunk_id}
                      className={cn(
                        'p-3.5 rounded-lg border text-xs space-y-1.5',
                        chunk.is_gold
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-zinc-950/50 border-zinc-800/80'
                      )}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-500 font-bold">#{idx + 1}</span>
                          <span className="font-medium text-zinc-300 truncate max-w-xs">
                            {chunk.doc_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {chunk.is_gold && (
                            <Badge variant="gold" icon={<Award className="w-3 h-3 text-amber-400" />}>
                              Gold
                            </Badge>
                          )}
                          <span className="font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {(chunk.score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-zinc-300 leading-relaxed">{chunk.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-[11px] text-zinc-500 flex-shrink-0">
          <span>Corpus: {corpusId}</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Sandbox
          </Button>
        </div>
      </div>
    </div>
  );
};
