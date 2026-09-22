import { describe, expect, it } from 'vitest';
import type { OnboardingInput } from '@forge/contracts';
import {
  completeSet,
  createEmptyProgress,
  generateBeginnerRoutine,
} from '@forge/domain';
import { loadWorkoutStateFrom, saveWorkoutStateTo } from './storage';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const onboarding: OnboardingInput = {
  goal: 'general-fitness',
  experience: 'new',
  trainingDays: 3,
  equipment: ['bodyweight', 'dumbbells', 'machines'],
};

describe('web workout persistence', () => {
  it('round-trips onboarding, routine, and completed set progress', () => {
    const storage = new MemoryStorage();
    const routine = generateBeginnerRoutine(onboarding);
    const firstExercise = routine.exercises[0];
    const progress = completeSet(createEmptyProgress(routine), firstExercise);

    expect(saveWorkoutStateTo(storage, onboarding, routine, progress)).toBe(
      true,
    );
    expect(loadWorkoutStateFrom(storage)).toEqual({
      onboarding,
      routine,
      progress,
      available: true,
    });
  });

  it('reports unavailable storage without pretending progress was saved', () => {
    const routine = generateBeginnerRoutine(onboarding);
    const progress = createEmptyProgress(routine);

    expect(saveWorkoutStateTo(null, onboarding, routine, progress)).toBe(false);
    expect(loadWorkoutStateFrom(null)).toEqual({
      onboarding: null,
      routine: null,
      progress: null,
      available: false,
    });
  });
});
