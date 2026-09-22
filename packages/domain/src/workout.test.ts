import { describe, expect, it } from 'vitest';
import type { OnboardingInput } from '@forge/contracts';
import {
  completeSet,
  createEmptyProgress,
  generateBeginnerRoutine,
  progressPercent,
} from './workout';

const input: OnboardingInput = {
  goal: 'general-fitness' as const,
  experience: 'new' as const,
  trainingDays: 3,
  equipment: ['bodyweight', 'dumbbells', 'machines'],
};

describe('beginner routine generation', () => {
  it('creates deterministic, equipment-compatible guidance', () => {
    const first = generateBeginnerRoutine(input);
    const second = generateBeginnerRoutine(input);

    expect(first).toEqual(second);
    expect(first.exercises.length).toBeGreaterThanOrEqual(3);
    expect(
      first.exercises.every((exercise) =>
        input.equipment.includes(exercise.equipment),
      ),
    ).toBe(true);
    expect(
      first.exercises.every((exercise) => exercise.instructions.length > 0),
    ).toBe(true);
  });

  it('fails clearly when selected equipment cannot support the starter routine', () => {
    expect(() =>
      generateBeginnerRoutine({ ...input, equipment: ['machines'] }),
    ).toThrow();
  });
});

describe('workout progress', () => {
  it('increments sets, completes an exercise, and reports progress', () => {
    const routine = generateBeginnerRoutine(input);
    const exercise = routine.exercises[0];
    let progress = createEmptyProgress(routine);

    progress = completeSet(progress, exercise);
    expect(progress.completedSets[exercise.id]).toBe(1);
    expect(progress.completedExerciseIds).toEqual([]);

    for (let set = 1; set < exercise.defaultSets; set += 1) {
      progress = completeSet(progress, exercise);
    }
    expect(progress.completedExerciseIds).toContain(exercise.id);
    expect(progressPercent(routine, progress)).toBeGreaterThan(0);
  });

  it('does not count sets beyond the target', () => {
    const routine = generateBeginnerRoutine(input);
    const exercise = routine.exercises[0];
    let progress = createEmptyProgress(routine);

    for (let set = 0; set < exercise.defaultSets + 2; set += 1) {
      progress = completeSet(progress, exercise);
    }
    expect(progress.completedSets[exercise.id]).toBe(exercise.defaultSets);
  });
});
