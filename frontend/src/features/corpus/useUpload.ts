import { useState, useCallback, useEffect } from 'react';
import { uploadCorpus, fetchCorpus, type DetailedCorpusSummary, type CorpusChunk } from '../../api/client';

export type { DetailedCorpusSummary, CorpusChunk };

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export interface UploadState {
  files: UploadedFile[];
  corpus: DetailedCorpusSummary | null;
  uploading: boolean;
  error: string | null;
}

const INITIAL_CORPUS: DetailedCorpusSummary = {
  corpus_id: 'corp_problem_statements',
  name: 'problem_statement.pdf',
  filename: 'problem_statement.pdf',
  file_hash: 'b14c3e8a719d45e0',
  file_size_bytes: 159230,
  document_count: 1,
  total_chunks: 37,
  total_tokens: 18944,
  avg_chunk_size: 512,
  chunks: [],
};

export function useUpload(
  onCorpusLoaded?: (corpusId: string) => void,
  initialCorpusId: string = 'corp_problem_statements'
) {
  const [state, setState] = useState<UploadState>({
    files: [],
    corpus: INITIAL_CORPUS,
    uploading: false,
    error: null,
  });

  // Load initial corpus details if available
  useEffect(() => {
    let isMounted = true;
    if (initialCorpusId) {
      fetchCorpus(initialCorpusId)
        .then((data) => {
          if (isMounted) {
            setState((prev) => ({
              ...prev,
              corpus: data,
            }));
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [initialCorpusId]);

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      const uploaded: UploadedFile[] = newFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      }));

      setState((prev) => ({
        ...prev,
        files: [...prev.files, ...uploaded],
        uploading: true,
        error: null,
      }));

      try {
        const file = newFiles[0];
        if (file) {
          const result = await uploadCorpus(file);
          setState((prev) => ({
            ...prev,
            uploading: false,
            corpus: result,
          }));
          onCorpusLoaded?.(result.corpus_id);
          return;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setState((prev) => ({
          ...prev,
          uploading: false,
          error: message,
        }));
      }
    },
    [onCorpusLoaded]
  );

  const clearFiles = useCallback(() => {
    setState({
      files: [],
      corpus: null,
      uploading: false,
      error: null,
    });
  }, []);

  return { ...state, addFiles, clearFiles };
}
