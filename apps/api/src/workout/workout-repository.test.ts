import { describe, expect, it } from 'vitest';
import { DEVELOPMENT_USER_ID } from '../auth/development-auth-adapter.js';
import {
  createInMemoryWorkoutRepository,
  WorkoutConflictError,
  WorkoutInvalidTransitionError,
  WorkoutNotFoundError,
} from './workout-repository.js';

describe('workout repository', () => {
  it('creates an owned session and resumes the single active session', async () => {
    const repository = createInMemoryWorkoutRepository();
    const [template] = await repository.listTemplates();
    const first = await repository.startSession(
      DEVELOPMENT_USER_ID,
      template.id,
    );
    const resumed = await repository.startSession(
      DEVELOPMENT_USER_ID,
      template.id,
    );
    expect(resumed.id).toBe(first.id);
    expect(first.exercises[0]?.sets).toHaveLength(3);
  });

  it('completes a set once and rejects stale writes', async () => {
    const repository = createInMemoryWorkoutRepository();
    const [template] = await repository.listTemplates();
    const session = await repository.startSession(
      DEVELOPMENT_USER_ID,
      template.id,
    );
    const exercise = session.exercises[0]!;
    const input = {
      sessionExerciseId: exercise.id,
      setNumber: 1,
      revision: 0,
      requestKey: 'set-1',
    };
    const completed = await repository.completeSet(
      DEVELOPMENT_USER_ID,
      session.id,
      input,
    );
    const repeated = await repository.completeSet(
      DEVELOPMENT_USER_ID,
      session.id,
      input,
    );
    expect(completed.revision).toBe(1);
    expect(repeated.revision).toBe(1);
    await expect(
      repository.completeSet(DEVELOPMENT_USER_ID, session.id, {
        ...input,
        requestKey: 'different',
      }),
    ).rejects.toBeInstanceOf(WorkoutConflictError);
  });

  it('protects ownership, invalid sets, and incomplete completion', async () => {
    const repository = createInMemoryWorkoutRepository();
    const [template] = await repository.listTemplates();
    const session = await repository.startSession(
      DEVELOPMENT_USER_ID,
      template.id,
    );
    await expect(
      repository.getSession('00000000-0000-4000-8000-000000000099', session.id),
    ).resolves.toBeNull();
    await expect(
      repository.completeSet(DEVELOPMENT_USER_ID, session.id, {
        sessionExerciseId: session.exercises[0]!.id,
        setNumber: 99,
        revision: 0,
        requestKey: 'bad',
      }),
    ).rejects.toBeInstanceOf(WorkoutInvalidTransitionError);
    await expect(
      repository.completeWorkout(DEVELOPMENT_USER_ID, session.id, 0),
    ).rejects.toBeInstanceOf(WorkoutInvalidTransitionError);
    await expect(
      repository.getSession(DEVELOPMENT_USER_ID, crypto.randomUUID()),
    ).resolves.toBeNull();
    await expect(
      repository.startSession(DEVELOPMENT_USER_ID, 'missing'),
    ).rejects.toBeInstanceOf(WorkoutNotFoundError);
  });
});
