import type { BeginnerRoutine, WorkoutProgress } from '@forge/domain';
import type { OnboardingInput } from '@forge/contracts';

const onboardingKey = 'fig.web.onboarding.v1';
const routineKey = 'fig.web.routine.v1';
const progressKey = 'fig.web.progress.v1';

export interface StoredWorkoutState {
  readonly onboarding: OnboardingInput | null;
  readonly routine: BeginnerRoutine | null;
  readonly progress: WorkoutProgress | null;
  readonly available: boolean;
}

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function read<T>(storage: Storage | null, key: string): T | null {
  if (storage === null) return null;
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function write<T>(storage: Storage | null, key: string, value: T): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadWorkoutStateFrom(
  storage: Storage | null,
): StoredWorkoutState {
  return {
    onboarding: read<OnboardingInput>(storage, onboardingKey),
    routine: read<BeginnerRoutine>(storage, routineKey),
    progress: read<WorkoutProgress>(storage, progressKey),
    available: storage !== null,
  };
}

export function loadWorkoutState(): StoredWorkoutState {
  return loadWorkoutStateFrom(browserStorage());
}

export function saveWorkoutStateTo(
  storage: Storage | null,
  onboarding: OnboardingInput,
  routine: BeginnerRoutine,
  progress: WorkoutProgress,
): boolean {
  return [
    write(storage, onboardingKey, onboarding),
    write(storage, routineKey, routine),
    write(storage, progressKey, progress),
  ].every(Boolean);
}

export function saveWorkoutState(
  onboarding: OnboardingInput,
  routine: BeginnerRoutine,
  progress: WorkoutProgress,
): boolean {
  return saveWorkoutStateTo(browserStorage(), onboarding, routine, progress);
}
