import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  SearchX,
  AlertOctagon,
  XCircle,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import type { components } from '../api/schema';

export type Verdict = components['schemas']['Verdict'];

export interface VerdictConfig {
  code: Verdict;
  label: string;
  shortLabel: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
  description: string;
}

export const VERDICT_CONFIGS: Record<Verdict, VerdictConfig> = {
  PASS: {
    code: 'PASS',
    label: 'Accurate',
    shortLabel: 'Pass',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/70',
    borderColor: 'border-emerald-300 dark:border-emerald-500/50',
    icon: CheckCircle2,
    description: 'Retriever retrieved gold context; generator answered faithfully and accurately.',
  },
  RETRIEVAL_MISS: {
    code: 'RETRIEVAL_MISS',
    label: 'Missing Info (Retriever)',
    shortLabel: 'Retriever Miss',
    textColor: 'text-rose-700 dark:text-rose-300',
    bgColor: 'bg-rose-50 dark:bg-rose-950/70',
    borderColor: 'border-rose-300 dark:border-rose-500/50',
    icon: SearchX,
    description: 'Gold context was absent from retrieved chunks. Generator could not answer.',
  },
  HALLUCINATION: {
    code: 'HALLUCINATION',
    label: 'Hallucinated (Generator)',
    shortLabel: 'Hallucination',
    textColor: 'text-rose-700 dark:text-rose-300',
    bgColor: 'bg-rose-50 dark:bg-rose-950/70',
    borderColor: 'border-rose-300 dark:border-rose-500/50',
    icon: AlertOctagon,
    description: 'Context contained the answer, but generator fabricated unsupported claims.',
  },
  BOTH_FAILED: {
    code: 'BOTH_FAILED',
    label: 'Both Failed',
    shortLabel: 'Both Failed',
    textColor: 'text-rose-700 dark:text-rose-300',
    bgColor: 'bg-rose-50 dark:bg-rose-950/70',
    borderColor: 'border-rose-300 dark:border-rose-500/50',
    icon: XCircle,
    description: 'Retrieval missed context and generator hallucinated a spurious answer.',
  },
  FAILED_TO_ABSTAIN: {
    code: 'FAILED_TO_ABSTAIN',
    label: 'Failed to Abstain',
    shortLabel: 'Failed Abstain',
    textColor: 'text-rose-700 dark:text-rose-300',
    bgColor: 'bg-rose-50 dark:bg-rose-950/70',
    borderColor: 'border-rose-300 dark:border-rose-500/50',
    icon: ShieldAlert,
    description: 'Question was unanswerable, but generator provided an answer instead of abstaining.',
  },
  CONTEXT_DISTRACTION: {
    code: 'CONTEXT_DISTRACTION',
    label: 'Context Distraction',
    shortLabel: 'Distraction',
    textColor: 'text-amber-800 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/70',
    borderColor: 'border-amber-300 dark:border-amber-500/50',
    icon: AlertTriangle,
    description: 'Distractor chunks misled the generator away from the gold evidence.',
  },
  PARAMETRIC_LEAK: {
    code: 'PARAMETRIC_LEAK',
    label: 'Parametric Leak',
    shortLabel: 'Parametric',
    textColor: 'text-zinc-700 dark:text-zinc-200',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800/80',
    borderColor: 'border-zinc-300 dark:border-zinc-600',
    icon: HelpCircle,
    description: 'Question was answerable from pre-training memory; excluded from headline scores.',
  },
};

