import type { AnalysisResult } from './analysis-provider.js';
import type { MealView } from '../nutrition/nutrition-repository.js';

type Review = {
  id: string;
  ownerId: string;
  result: AnalysisResult;
  expiresAt: number;
  status: 'pending' | 'confirming' | 'confirmed' | 'discarded';
  meal?: MealView;
};
export function createAnalysisReviewStore(
  now: () => number = () => Date.now(),
  ttlMs = 30 * 60 * 1000,
) {
  const reviews = new Map<string, Review>();
  const get = (id: string, ownerId: string) => {
    const review = reviews.get(id);
    if (!review || review.ownerId !== ownerId) return undefined;
    if (review.expiresAt <= now()) {
      reviews.delete(id);
      return undefined;
    }
    return review;
  };
  return {
    put(ownerId: string, result: AnalysisResult) {
      const id = crypto.randomUUID();
      reviews.set(id, {
        id,
        ownerId,
        result,
        expiresAt: now() + ttlMs,
        status: 'pending',
      });
      return get(id, ownerId)!;
    },
    get,
    discard(id: string, ownerId: string) {
      const review = get(id, ownerId);
      if (!review || review.status !== 'pending') return false;
      review.status = 'discarded';
      return true;
    },
    claim(id: string, ownerId: string) {
      const review = get(id, ownerId);
      if (!review || review.status !== 'pending') return review;
      review.status = 'confirming';
      return review;
    },
    release(id: string, ownerId: string) {
      const review = get(id, ownerId);
      if (review?.status === 'confirming') review.status = 'pending';
    },
    confirm(id: string, ownerId: string, meal: MealView) {
      const review = get(id, ownerId);
      if (!review || review.status !== 'confirming') return review;
      review.status = 'confirmed';
      review.meal = meal;
      return review;
    },
  };
}
