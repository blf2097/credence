import type {
  NativeSignalPrediction,
  PredictionRepository,
  ScalarDistributionPrediction,
} from '@/lib/core/repositories/prediction-repository';

const SIGNAL_KEY = 'credence:native-signal-submissions:v1';
const SCALAR_KEY = 'credence:native-scalar-submissions:v1';

export class LocalStoragePredictionRepository implements PredictionRepository {
  async saveNativeSignalPrediction(
    prediction: Omit<NativeSignalPrediction, 'id' | 'createdAt'>,
  ): Promise<NativeSignalPrediction> {
    const next: NativeSignalPrediction = {
      ...prediction,
      id: `signal:${prediction.marketId}:${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const existing = readArray<NativeSignalPrediction>(SIGNAL_KEY);
    writeArray(SIGNAL_KEY, [next, ...existing]);
    return next;
  }

  async listNativeSignalPredictions(marketId?: string): Promise<NativeSignalPrediction[]> {
    const all = readArray<NativeSignalPrediction>(SIGNAL_KEY);
    return marketId ? all.filter((item) => item.marketId === marketId) : all;
  }

  async saveScalarDistributionPrediction(
    prediction: Omit<ScalarDistributionPrediction, 'id' | 'createdAt'>,
  ): Promise<ScalarDistributionPrediction> {
    const next: ScalarDistributionPrediction = {
      ...prediction,
      id: `scalar:${prediction.marketId}:${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const existing = readArray<ScalarDistributionPrediction>(SCALAR_KEY);
    writeArray(SCALAR_KEY, [next, ...existing]);
    return next;
  }

  async listScalarDistributionPredictions(
    marketId?: string,
  ): Promise<ScalarDistributionPrediction[]> {
    const all = readArray<ScalarDistributionPrediction>(SCALAR_KEY);
    return marketId ? all.filter((item) => item.marketId === marketId) : all;
  }
}

export const localStoragePredictionRepository = new LocalStoragePredictionRepository();

function readArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

function writeArray<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
