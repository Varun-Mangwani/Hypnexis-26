import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search } from 'lucide-react';
import { useRunCases } from '../../api/useRuns';
import { DualVerdictBadge } from '../../components/DualVerdictBadge';
import { Skeleton } from '../../components/Skeleton';
import { cn } from '../../lib/utils';
import type { Verdict, QuestionType } from '../../api/client';

export interface CaseListStubProps {
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  runId?: string;
}

const VERDICT_CHIPS: Array<{ label: string; value: Verdict | 'ALL' }> = [
  { label: 'All',       value: 'ALL'            },
  { label: 'Pass',      value: 'PASS'           },
  { label: 'Ret. Miss', value: 'RETRIEVAL_MISS' },
  { label: 'Halluc.',   value: 'HALLUCINATION'  },
  { label: 'Both ✗',   value: 'BOTH_FAILED'    },
];

const QT_CHIPS: Array<{ label: string; value: QuestionType | 'ALL' }> = [
  { label: 'All',       value: 'ALL'          },
  { label: 'Factual',   value: 'factual'      },
  { label: 'Multi-hop', value: 'multi-hop'    },
  { label: 'Unanswer.', value: 'unanswerable' },
];

const Chip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '3px 8px',
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 500,
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent-soft)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-2)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.1s',
    }}
  >
    {label}
  </button>
);

export const CaseListStub: React.FC<CaseListStubProps> = ({
  selectedCaseId,
  onSelectCase,
  runId = 'run-demo-eval-001',
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<Verdict | 'ALL'>('ALL');
  const [qtFilter, setQtFilter] = useState<QuestionType | 'ALL'>('ALL');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const handleQuery = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(val), 200);
  }, []);

  const { data: allCases, isLoading, error } = useRunCases(runId);

  const filtered = useMemo(() => {
    if (!allCases) return [];
    return allCases.filter((c) => {
      if (verdictFilter !== 'ALL' && c.verdict !== verdictFilter) return false;
      if (qtFilter !== 'ALL' && c.question_type !== qtFilter) return false;
      if (debouncedQuery) {
        const q = debouncedQuery.toLowerCase();
        if (!c.question.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allCases, verdictFilter, qtFilter, debouncedQuery]);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <Search style={{ width: 12, height: 12, position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            id="case-list-search"
            type="text"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            placeholder="Search queries…"
            style={{
              width: '100%',
              paddingLeft: 28,
              paddingRight: 8,
              paddingTop: 5,
              paddingBottom: 5,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              fontSize: 11,
              color: 'var(--text)',
              outline: 'none',
            }}
          />
        </div>

        {/* Filter chips — Verdict */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
          {VERDICT_CHIPS.map((f) => (
            <Chip key={f.value} label={f.label} active={verdictFilter === f.value} onClick={() => setVerdictFilter(f.value)} />
          ))}
        </div>

        {/* Filter chips — Type */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {QT_CHIPS.map((f) => (
            <Chip key={f.value} label={f.label} active={qtFilter === f.value} onClick={() => setQtFilter(f.value)} />
          ))}
        </div>

        {/* Count */}
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-3)' }}>
          {filtered.length} {filtered.length === 1 ? 'query' : 'queries'}
        </div>
      </div>

      {/* List */}
      <div ref={parentRef} style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading && (
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 6 }} />
            ))}
          </div>
        )}
        {error && (
          <div style={{ margin: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#ef4444' }}>
            Failed to load cases.
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 11, color: 'var(--text-3)' }}>
            No queries match
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const c = filtered[virtualRow.index];
              const isSelected = c.id === selectedCaseId;
              return (
                <div
                  key={c.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: virtualRow.start,
                    left: 0,
                    right: 0,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-soft)',
                    borderLeft: `2px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                    background: isSelected ? 'var(--accent-soft)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onClick={() => onSelectCase(c.id)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-muted)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <DualVerdictBadge verdict={c.verdict} size="sm" compact />
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                      {c.question_type}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.45 }}>
                    {c.question}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
