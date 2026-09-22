import type { BeginnerRoutine, WorkoutSession } from '@forge/domain';

const json = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const body = (await response.json()) as T | { error?: string };
  if (!response.ok) {
    const error =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : 'request_failed';
    throw new Error(error);
  }
  return body as T;
};

export const workoutApi = {
  list: async () =>
    (await json<{ workouts: BeginnerRoutine[] }>('/v1/workouts')).workouts,
  get: async (id: string) =>
    (
      await json<{ workout: BeginnerRoutine }>(
        `/v1/workouts/${encodeURIComponent(id)}`,
      )
    ).workout,
  start: async (workoutId: string) =>
    (
      await json<{ session: WorkoutSession }>('/v1/workout-sessions', {
        method: 'POST',
        body: JSON.stringify({ workoutId }),
      })
    ).session,
  session: async (id: string) =>
    (await json<{ session: WorkoutSession }>(`/v1/workout-sessions/${id}`))
      .session,
  completeSet: async (
    session: WorkoutSession,
    exerciseId: string,
    setNumber: number,
  ) =>
    (
      await json<{ session: WorkoutSession }>(
        `/v1/workout-sessions/${session.id}/sets/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            sessionExerciseId: exerciseId,
            setNumber,
            revision: session.revision,
            requestKey: crypto.randomUUID(),
          }),
        },
      )
    ).session,
  complete: async (session: WorkoutSession) =>
    (
      await json<{ session: WorkoutSession }>(
        `/v1/workout-sessions/${session.id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ revision: session.revision }),
        },
      )
    ).session,
};

const activeSessionKey = 'fig.web.active-session.v1';
export const activeSessionStore = {
  get: () => localStorage.getItem(activeSessionKey),
  set: (id: string) => localStorage.setItem(activeSessionKey, id),
  clear: () => localStorage.removeItem(activeSessionKey),
};
