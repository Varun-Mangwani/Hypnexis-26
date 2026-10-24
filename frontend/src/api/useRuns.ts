import { useQuery } from '@tanstack/react-query';
import {
  fetchRunSummary,
  fetchRunCases,
  fetchCaseDetail,
  fetchRunValidation,
  fetchComparison,
  type Verdict,
  type QuestionType,
} from './client';

export function useRun(runId: string) {
  return useQuery({
    queryKey: ['run', runId],
    queryFn: () => fetchRunSummary(runId),
    enabled: Boolean(runId),
  });
}

export function useRunCases(
  runId: string,
  filters?: { verdict?: Verdict; question_type?: QuestionType; query?: string }
) {
  return useQuery({
    queryKey: ['run-cases', runId, filters],
    queryFn: () => fetchRunCases(runId, filters),
    enabled: Boolean(runId),
  });
}

export function useCaseDetail(caseId: string | null) {
  return useQuery({
    queryKey: ['case-detail', caseId],
    queryFn: () => fetchCaseDetail(caseId as string),
    enabled: Boolean(caseId),
  });
}

export function useValidation(runId: string) {
  return useQuery({
    queryKey: ['validation', runId],
    queryFn: () => fetchRunValidation(runId),
    enabled: Boolean(runId),
  });
}

export function useComparison(runId: string, baselineRunId: string) {
  return useQuery({
    queryKey: ['comparison', runId, baselineRunId],
    queryFn: () => fetchComparison(runId, baselineRunId),
    enabled: Boolean(runId && baselineRunId),
  });
}

