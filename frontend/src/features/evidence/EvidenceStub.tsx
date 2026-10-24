import React, { useRef, useCallback, useState } from 'react';
import { FileSearch, Sparkles, Award, Copy, Check } from 'lucide-react';
import { useCaseDetail } from '../../api/useRuns';
import { DualVerdictBadge } from '../../components/DualVerdictBadge';
import { Skeleton } from '../../components/Skeleton';
import { splitIntoSegments } from './splitIntoSegments';
import { cn } from '../../lib/utils';
import type { components } from '../../api/schema';

type RetrievedChunk = components['schemas']['RetrievedChunk'];

export interface EvidenceStubProps {
  caseId: string | null;
}

interface ChunkCardProps {
  chunk: RetrievedChunk;
  idx: number;
  highlighted: boolean;
  chunkRef: (el: HTMLDivElement | null) => void;
}

const ChunkCard: React.FC<ChunkCardProps> = ({ chunk, idx, highlighted, chunkRef }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(chunk.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      ref={chunkRef}
      data-chunk-id={chunk.chunk_id}
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: `1px solid ${
          highlighted
            ? 'var(--accent)'
            : chunk.is_gold
            ? 'var(--highlight-gold-border)'
            : 'var(--border)'
        }`,
        background: highlighted
          ? 'var(--highlight-active-bg)'
          : chunk.is_gold
          ? 'var(--highlight-gold-bg)'
          : 'var(--bg-surface)',
        transition: 'all 0.25s',
        boxShadow: highlighted ? '0 0 0 2px var(--highlight-active-ring)' : 'none',
        position: 'relative',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-3)', fontWeight: 700 }}>
            #{idx + 1}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
            {chunk.doc_name}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>
            {chunk.chunk_id}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {chunk.is_gold && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: 'var(--highlight-gold-text)', background: 'var(--highlight-gold-bg)', border: '1px solid var(--highlight-gold-border)', padding: '1px 5px', borderRadius: 4 }}>
              <Award style={{ width: 9, height: 9 }} />
              Gold
            </span>
          )}
          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid var(--accent-ring)', padding: '1px 6px', borderRadius: 4 }}>
            {(chunk.score * 100).toFixed(0)}%
          </span>
          <button
            onClick={handleCopy}
            title="Copy chunk text"
            style={{ padding: 3, borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)', transition: 'color 0.1s', opacity: 0.6 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            {copied ? <Check style={{ width: 11, height: 11, color: 'var(--accent)' }} /> : <Copy style={{ width: 11, height: 11 }} />}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
        {chunk.text}
      </p>
    </div>
  );
};

export const EvidenceStub: React.FC<EvidenceStubProps> = ({ caseId }) => {
  const { data: currentCase, isLoading } = useCaseDetail(caseId);
  const chunkRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);
  const [answerCopied, setAnswerCopied] = useState(false);

  const scrollToChunk = useCallback((chunkId: string) => {
    const el = chunkRefs.current[chunkId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setActiveChunkId(chunkId);
      setTimeout(() => setActiveChunkId(null), 2500);
    }
  }, []);

  const handleCopyAnswer = () => {
    if (!currentCase) return;
    navigator.clipboard.writeText(currentCase.answer);
    setAnswerCopied(true);
    setTimeout(() => setAnswerCopied(false), 1500);
  };

  if (isLoading || !currentCase) {
    return (
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton" style={{ height: 24, width: '40%' }} />
        <div className="skeleton" style={{ height: 80, width: '100%' }} />
        <div className="skeleton" style={{ height: 120, width: '100%' }} />
      </div>
    );
  }

  const segments = splitIntoSegments(currentCase.answer, currentCase.claims);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Query header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          background: 'var(--bg-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="t-label">Selected Query</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DualVerdictBadge verdict={currentCase.verdict} size="sm" compact />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-3)' }}>
              {currentCase.id}
            </span>
          </div>
        </div>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 1.4 }}>
          {currentCase.question}
        </h2>
      </div>

      {/* Two-column split */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', minHeight: 0 }}>

        {/* Left — Retrieved Evidence */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
          <div
            style={{
              padding: '8px 14px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              background: 'var(--bg-subtle)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>
              <FileSearch style={{ width: 12, height: 12, color: 'var(--accent)' }} />
              Retrieved ({currentCase.retrieved.length})
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>
              Hybrid · Cosine + BM25
            </span>
          </div>
          <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentCase.retrieved.map((chunk, idx) => (
              <ChunkCard
                key={chunk.chunk_id}
                chunk={chunk}
                idx={idx}
                highlighted={activeChunkId === chunk.chunk_id}
                chunkRef={(el) => { chunkRefs.current[chunk.chunk_id] = el; }}
              />
            ))}
          </div>
        </div>

        {/* Right — Generated Answer */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              padding: '8px 14px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              background: 'var(--bg-subtle)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>
              <Sparkles style={{ width: 12, height: 12, color: 'var(--accent)' }} />
              Generated ({currentCase.claims.length} claims)
            </span>
            <button
              onClick={handleCopyAnswer}
              style={{ padding: 3, borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
            >
              {answerCopied ? <Check style={{ width: 12, height: 12, color: 'var(--accent)' }} /> : <Copy style={{ width: 12, height: 12 }} />}
            </button>
          </div>

          <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Grounded claim reader */}
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div className="t-label">Grounded Claim Reader</div>
                <span style={{ fontSize: 9, color: 'var(--text-3)' }}>click span → jump to chunk</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
                {segments.map((seg, i) =>
                  seg.claim ? (
                    <button
                      key={i}
                      onClick={() => seg.claim?.evidence_chunk_id && scrollToChunk(seg.claim.evidence_chunk_id)}
                      onMouseEnter={() => seg.claim?.evidence_chunk_id && setActiveChunkId(seg.claim.evidence_chunk_id)}
                      onMouseLeave={() => setActiveChunkId(null)}
                      style={{
                        display: 'inline',
                        borderRadius: 3,
                        padding: '1px 4px',
                        margin: '0 1px',
                        border: `1px solid ${seg.claim.supported ? 'var(--highlight-supported-border)' : 'var(--highlight-unsupported-border)'}`,
                        background: seg.claim.supported ? 'var(--highlight-supported-bg)' : 'var(--highlight-unsupported-bg)',
                        color: seg.claim.supported ? 'var(--highlight-supported-text)' : 'var(--highlight-unsupported-text)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 11,
                        transition: 'all 0.1s',
                      }}
                      title={seg.claim.supported ? `Supported · ${seg.claim.evidence_chunk_id}` : 'Unsupported / Hallucination'}
                    >
                      {seg.text}
                    </button>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </p>
            </div>

            {/* Claim breakdown */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div className="t-label">Claim Breakdown</div>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)' }}>
                  {currentCase.claims.filter((c) => c.supported).length}/{currentCase.claims.length} supported
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {currentCase.claims.map((claim, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => claim.evidence_chunk_id && setActiveChunkId(claim.evidence_chunk_id)}
                    onMouseLeave={() => setActiveChunkId(null)}
                    onClick={() => claim.evidence_chunk_id && scrollToChunk(claim.evidence_chunk_id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: `1px solid ${claim.supported ? 'var(--highlight-supported-border)' : 'var(--highlight-unsupported-border)'}`,
                      background: claim.supported ? 'var(--highlight-supported-bg)' : 'var(--highlight-unsupported-bg)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      cursor: 'pointer',
                      transition: 'border-color 0.1s',
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        marginTop: 1,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '2px 5px',
                        borderRadius: 3,
                        border: `1px solid ${claim.supported ? 'var(--highlight-supported-border)' : 'var(--highlight-unsupported-border)'}`,
                        color: claim.supported ? 'var(--highlight-supported-text)' : 'var(--highlight-unsupported-text)',
                        background: claim.supported ? 'var(--highlight-supported-bg)' : 'var(--highlight-unsupported-bg)',
                      }}
                    >
                      {claim.supported ? '✓' : '✗'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>{claim.text}</p>
                      {claim.evidence_chunk_id && (
                        <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-3)', display: 'block', marginTop: 2 }}>
                          → {claim.evidence_chunk_id}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
