import type { Address } from 'viem';
import type { PredictionMarket } from '@/lib/core/market';

const SUBMISSIONS_KEY = 'credence:native-signal-submissions:v1';

export interface NativeSignalSubmission {
  id: string;
  marketId: string;
  marketTitle: string;
  marketKind: PredictionMarket['kind'];
  outcomeId: string;
  outcomeLabel: string;
  confidence: number;
  amount: number;
  rationale?: string;
  trader?: Address;
  createdAt: string;
}

export function saveNativeSignalSubmission(
  submission: Omit<NativeSignalSubmission, 'id' | 'createdAt'>,
): NativeSignalSubmission {
  const next: NativeSignalSubmission = {
    ...submission,
    id: `signal:${submission.marketId}:${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const existing = getNativeSignalSubmissions();
  window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify([next, ...existing]));
  return next;
}

export function getNativeSignalSubmissions(): NativeSignalSubmission[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(SUBMISSIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NativeSignalSubmission[]) : [];
  } catch {
    window.localStorage.removeItem(SUBMISSIONS_KEY);
    return [];
  }
}

export function getNativeSignalSubmissionsForMarket(marketId: string) {
  return getNativeSignalSubmissions().filter(
    (submission) => submission.marketId === marketId,
  );
}
