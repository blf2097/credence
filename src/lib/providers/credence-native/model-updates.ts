/**
 * Model update history storage.
 *
 * Each update records a confidence change: prior → posterior, linked to the
 * evidence that triggered it, with a human-readable rationale.
 *
 * This replaces the static `bayesUpdate` field in evidence JSON. The world
 * model's current confidence is derived from the latest update (or the
 * seed value if no updates exist yet).
 *
 * Storage: localStorage for MVP. Supabase `model_updates` table ready.
 */

export interface ModelUpdate {
  id: string;
  modelId: string;
  /** Evidence node that triggered this update, if any. */
  evidenceId?: string;
  /** Evidence title for display without a join. */
  evidenceTitle?: string;
  prior: number;
  posterior: number;
  rationale: string;
  createdBy: 'human' | 'ai_draft' | 'ai_approved';
  createdAt: string;
}

const KEY = 'credence:model-updates:v1';

export async function getModelUpdates(modelId?: string): Promise<ModelUpdate[]> {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const all: ModelUpdate[] = Array.isArray(parsed) ? parsed : [];
    return modelId ? all.filter((u) => u.modelId === modelId) : all;
  } catch {
    window.localStorage.removeItem(KEY);
    return [];
  }
}

export async function saveModelUpdate(
  update: Omit<ModelUpdate, 'id' | 'createdAt'>,
): Promise<ModelUpdate> {
  const full: ModelUpdate = {
    ...update,
    id: `mu:${update.modelId}:${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const existing = await getModelUpdates();
    const next = [full, ...existing];
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }

  return full;
}

/**
 * Get the current effective confidence for a model.
 * Returns the seed confidence if no updates exist.
 */
export async function getEffectiveConfidence(
  modelId: string,
  seedConfidence: number,
): Promise<number> {
  const updates = await getModelUpdates(modelId);
  if (updates.length === 0) return seedConfidence;
  return updates[0].posterior;
}
