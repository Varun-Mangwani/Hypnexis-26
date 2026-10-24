import React, { useCallback, useRef, useState, useMemo } from 'react';
import { UploadCloud, FileText, Layers, X, Search, Copy, ChevronDown, ChevronUp, Hash } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import { useUpload, type CorpusChunk } from './useUpload';
import { cn } from '../../lib/utils';

export interface CorpusUploadProps {
  onCorpusLoaded?: (corpusId: string) => void;
  corpusId?: string;
}

const Stat: React.FC<{ label: string; value: string | number; accent?: boolean }> = ({ label, value, accent }) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        fontSize: 15,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: accent ? 'var(--accent)' : 'var(--text)',
        lineHeight: 1.2,
      }}
    >
      {value}
    </div>
    <div className="t-label" style={{ marginTop: 2 }}>{label}</div>
  </div>
);

export const CorpusUpload: React.FC<CorpusUploadProps> = ({ onCorpusLoaded, corpusId = 'corp_problem_statements' }) => {
  const { corpus, uploading, error, addFiles } = useUpload(onCorpusLoaded, corpusId);
  const [dragging, setDragging] = useState(false);
  const [chunkSearch, setChunkSearch] = useState('');
  const [selectedChunk, setSelectedChunk] = useState<CorpusChunk | null>(null);
  const [showChunks, setShowChunks] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) addFiles(dropped);
  }, [addFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) addFiles(selected);
    e.target.value = '';
  }, [addFiles]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  };

  const chunksList = useMemo(() => {
    const list = corpus?.chunks || [];
    if (!chunkSearch.trim()) return list;
    const t = chunkSearch.toLowerCase();
    return list.filter((c) => c.text.toLowerCase().includes(t) || c.chunk_id.toLowerCase().includes(t));
  }, [corpus?.chunks, chunkSearch]);

  const [isSectionOpen, setIsSectionOpen] = useState(true);

  return (
    <div
      style={{
        padding: isSectionOpen ? '14px 12px' : '10px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        transition: 'padding 0.2s',
      }}
    >
      {/* Section label with Expand/Collapse toggle */}
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
        <div className="t-label">Document Corpus</div>
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
          {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload evaluation documents"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        style={{
          border: `1px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 8,
          padding: '10px 12px',
          cursor: 'pointer',
          background: dragging ? 'var(--accent-soft)' : 'var(--bg-surface)',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.txt,.md,.pptx" className="sr-only" onChange={handleChange} aria-hidden="true" />
        {uploading ? (
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 3, width: '100%', marginBottom: 6 }} />
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
              Extracting &amp; chunking…
            </span>
          </div>
        ) : (
          <>
            <UploadCloud style={{ width: 16, height: 16, color: 'var(--text-3)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                Upload File
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                PDF · TXT · MD · PPTX
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* File info */}
      {corpus && (
        <div style={{ marginTop: 10 }}>
          {/* File name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <FileText style={{ width: 14, height: 14, color: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {corpus.filename || corpus.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>{formatSize(corpus.file_size_bytes)}</span>
                <span style={{ width: 1, height: 10, background: 'var(--border)' }} />
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                  {corpus.total_tokens ? `${(corpus.total_tokens / 1000).toFixed(1)}k tok` : 'indexing…'}
                </span>
                <span style={{ width: 1, height: 10, background: 'var(--border)' }} />
                <span style={{ fontSize: 10, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                  Indexed
                </span>
              </div>
            </div>
            <span style={{ fontSize: 9, fontFamily: 'monospace', background: 'var(--bg-muted)', border: '1px solid var(--border)', padding: '2px 5px', borderRadius: 4, color: 'var(--text-3)', textTransform: 'uppercase', flexShrink: 0 }}>
              {(corpus.filename || corpus.name || 'pdf').split('.').pop()}
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <Stat label="Chunks" value={corpus.total_chunks || corpus.chunks?.length || 1} />
            <Stat
              label="Tokens"
              value={corpus.total_tokens ? (corpus.total_tokens > 1000 ? `${(corpus.total_tokens / 1000).toFixed(0)}k` : corpus.total_tokens) : '18k'}
              accent
            />
            <Stat label="Avg sz" value={corpus.avg_chunk_size || 512} />
          </div>

          {/* Hash row */}
          {corpus.file_hash && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <Hash style={{ width: 10, height: 10, color: 'var(--text-3)' }} />
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)' }}>
                {corpus.file_hash.slice(0, 20)}…
              </span>
            </div>
          )}

          {/* Chunks toggle */}
          <button
            onClick={() => setShowChunks(!showChunks)}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-2)',
              transition: 'background 0.15s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers style={{ width: 12, height: 12, color: 'var(--accent)' }} />
              Browse {corpus.chunks?.length || corpus.total_chunks || 0} chunks
            </span>
            {showChunks
              ? <ChevronUp style={{ width: 12, height: 12 }} />
              : <ChevronDown style={{ width: 12, height: 12 }} />
            }
          </button>
        </div>
      )}

      {/* Chunks panel */}
      {showChunks && corpus && (
        <div style={{ marginTop: 8, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
            <Search style={{ width: 11, height: 11, position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              type="text"
              placeholder="Filter chunks…"
              value={chunkSearch}
              onChange={(e) => setChunkSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 26,
                paddingRight: 8,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 5,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                fontSize: 11,
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {chunksList.map((chunk, idx) => (
              <div
                key={chunk.chunk_id || idx}
                onClick={() => setSelectedChunk(chunk)}
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--border-soft)',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>
                    #{idx + 1} {chunk.chunk_id}
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-3)' }}>
                    {chunk.token_count || 64}t
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {chunk.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {/* Chunk detail modal */}
      {selectedChunk && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              width: '100%',
              maxWidth: 520,
              padding: 20,
              boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            }}
            className="animate-fade-in"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: 'var(--text)' }}>
                {selectedChunk.chunk_id}
              </span>
              <button onClick={() => setSelectedChunk(null)} style={{ color: 'var(--text-3)', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Tokens', value: selectedChunk.token_count || 64 },
                { label: 'Char Start', value: selectedChunk.char_start },
                { label: 'Char End', value: selectedChunk.char_end },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                  <div className="t-label" style={{ marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                fontSize: 11,
                fontFamily: 'monospace',
                color: 'var(--text-2)',
                whiteSpace: 'pre-wrap',
                maxHeight: 240,
                overflowY: 'auto',
                lineHeight: 1.6,
              }}
            >
              {selectedChunk.text}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => handleCopy(selectedChunk.text, selectedChunk.chunk_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                  fontSize: 12, fontWeight: 500, color: 'var(--text-2)',
                  cursor: 'pointer',
                }}
              >
                <Copy style={{ width: 12, height: 12 }} />
                {copiedId === selectedChunk.chunk_id ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setSelectedChunk(null)}
                style={{
                  flex: 1, padding: '6px 12px', borderRadius: 6,
                  border: 'none', background: 'var(--accent)',
                  fontSize: 12, fontWeight: 600, color: '#000',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
