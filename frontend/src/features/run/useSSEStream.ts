import { useState, useEffect, useRef, useCallback } from 'react';

export type RunStatus = 'idle' | 'running' | 'completed' | 'error' | 'reconnecting';

export interface StreamProgress {
  processed: number;
  total: number;
  token_count: number;
  elapsed_ms: number;
  status: RunStatus;
  message: string;
}

const MOCK_TOTAL = 20;

export function useSSEStream(runId: string | null, onComplete?: () => void) {
  const [progress, setProgress] = useState<StreamProgress>({
    processed: 0,
    total: MOCK_TOTAL,
    token_count: 0,
    elapsed_ms: 0,
    status: 'idle',
    message: 'Ready',
  });

  const esRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const stopMock = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startMockStream = useCallback(() => {
    stopMock();
    let processed = 0;
    const startTime = Date.now();
    completedRef.current = false;

    setProgress({
      processed: 0,
      total: MOCK_TOTAL,
      token_count: 0,
      elapsed_ms: 0,
      status: 'running',
      message: 'Evaluating cases…',
    });

    timerRef.current = setInterval(() => {
      processed += 1;
      const elapsed = Date.now() - startTime;
      const tokens = processed * 7140;

      if (processed >= MOCK_TOTAL) {
        stopMock();
        setProgress({
          processed: MOCK_TOTAL,
          total: MOCK_TOTAL,
          token_count: MOCK_TOTAL * 7140,
          elapsed_ms: elapsed,
          status: 'completed',
          message: 'Evaluation complete',
        });
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
        return;
      }

      setProgress({
        processed,
        total: MOCK_TOTAL,
        token_count: tokens,
        elapsed_ms: elapsed,
        status: 'running',
        message: `Evaluating case ${processed}/${MOCK_TOTAL}…`,
      });
    }, 200);
  }, [stopMock, onComplete]);

  useEffect(() => {
    if (!runId) return;
    completedRef.current = false;

    if (runId.startsWith('mock')) {
      startMockStream();
      return () => stopMock();
    }

    try {
      const es = new EventSource(`/api/runs/${runId}/events`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as Partial<StreamProgress>;
          setProgress((prev) => {
            const next = { ...prev, ...data };
            if (next.status === 'completed') {
              if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
              }
              if (!completedRef.current) {
                completedRef.current = true;
                onComplete?.();
              }
            }
            return next;
          });
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        if (completedRef.current) {
          if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
          }
          return;
        }
        setProgress((prev) => {
          if (prev.status === 'completed') return prev;
          if (prev.status === 'running') {
            return { ...prev, status: 'reconnecting', message: 'Reconnecting…' };
          }
          return prev;
        });
      };

      return () => {
        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
      };
    } catch {
      startMockStream();
      return () => stopMock();
    }
  }, [runId, startMockStream, stopMock, onComplete]);

  return { progress, startMockStream };
}
