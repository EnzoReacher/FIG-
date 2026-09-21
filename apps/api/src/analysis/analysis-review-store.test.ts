import { describe, expect, it } from 'vitest';
import { createAnalysisReviewStore } from './analysis-review-store.js';
import type { AnalysisResult } from './analysis-provider.js';

const result: AnalysisResult = {
  schemaVersion: '1',
  providerName: 'deterministic-mock',
  modelName: 'fixture-v1',
  name: 'Food',
  portionDescription: 'One serving',
  detectedItems: [
    { name: 'Food', portionDescription: 'One serving', confidence: 0.5 },
  ],
  calories: 100,
  proteinGrams: 1,
  carbohydrateGrams: 2,
  fatGrams: 3,
  confidence: 0.5,
  assumptions: ['Estimated portion'],
};

describe('analysis review store', () => {
  it('expires unconfirmed reviews and isolates owners', () => {
    let now = 1_000;
    const store = createAnalysisReviewStore(() => now, 100);
    const review = store.put('owner', result);
    expect(store.get(review.id, 'other')).toBeUndefined();
    now = 1_101;
    expect(store.get(review.id, 'owner')).toBeUndefined();
  });

  it('allows only one confirmation claim', () => {
    const store = createAnalysisReviewStore();
    const review = store.put('owner', result);
    expect(store.claim(review.id, 'owner')?.status).toBe('confirming');
    expect(store.claim(review.id, 'owner')?.status).toBe('confirming');
    expect(store.discard(review.id, 'owner')).toBe(false);
  });
});
