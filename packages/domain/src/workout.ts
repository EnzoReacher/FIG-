import type {
  Equipment,
  ExperienceLevel,
  OnboardingInput,
  WorkoutGoal,
} from '@forge/contracts';

export type MuscleGroup = 'legs' | 'push' | 'pull' | 'core';

export interface ExerciseDefinition {
  readonly id: string;
  readonly name: string;
  readonly targetMuscles: readonly MuscleGroup[];
  readonly equipment: Equipment;
  readonly instructions: readonly string[];
  readonly safetyNotes: readonly string[];
  readonly defaultSets: number;
  readonly defaultReps: string;
  readonly restSeconds: number;
}

export interface RoutineExercise extends ExerciseDefinition {
  readonly order: number;
  readonly completedSets: number;
}

export interface BeginnerRoutine {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly goal: WorkoutGoal;
  readonly experience: ExperienceLevel;
  readonly trainingDays: number;
  readonly equipment: readonly Equipment[];
  readonly exercises: readonly RoutineExercise[];
}

export interface WorkoutProgress {
  readonly routineId: string;
  readonly completedExerciseIds: readonly string[];
  readonly completedSets: Readonly<Record<string, number>>;
}

const catalog: readonly ExerciseDefinition[] = [
  {
    id: 'goblet-squat',
    name: 'Goblet squat',
    targetMuscles: ['legs', 'core'],
    equipment: 'dumbbells',
    instructions: [
      'Hold one dumbbell at your chest.',
      'Sit down between your feet, then stand tall.',
    ],
    safetyNotes: [
      'Keep your whole foot on the floor.',
      'Use a range of motion you can control.',
    ],
    defaultSets: 3,
    defaultReps: '8–10',
    restSeconds: 90,
  },
  {
    id: 'machine-chest-press',
    name: 'Machine chest press',
    targetMuscles: ['push'],
    equipment: 'machines',
    instructions: [
      'Set the handles around mid-chest height.',
      'Press smoothly, then return with control.',
    ],
    safetyNotes: [
      'Keep your shoulders relaxed.',
      'Start lighter than you think and learn the path.',
    ],
    defaultSets: 3,
    defaultReps: '8–12',
    restSeconds: 90,
  },
  {
    id: 'seated-cable-row',
    name: 'Seated cable row',
    targetMuscles: ['pull'],
    equipment: 'machines',
    instructions: [
      'Sit tall with a soft bend in your knees.',
      'Pull the handle toward your ribs and pause.',
    ],
    safetyNotes: [
      'Do not jerk the weight.',
      'Keep your back comfortable and neutral.',
    ],
    defaultSets: 3,
    defaultReps: '8–12',
    restSeconds: 90,
  },
  {
    id: 'incline-push-up',
    name: 'Incline push-up',
    targetMuscles: ['push', 'core'],
    equipment: 'bodyweight',
    instructions: [
      'Place your hands on a stable raised surface.',
      'Lower your chest and press the surface away.',
    ],
    safetyNotes: [
      'Keep your body in one comfortable line.',
      'Use a higher surface if your shoulders feel strained.',
    ],
    defaultSets: 3,
    defaultReps: '6–10',
    restSeconds: 75,
  },
  {
    id: 'split-squat',
    name: 'Supported split squat',
    targetMuscles: ['legs'],
    equipment: 'bodyweight',
    instructions: [
      'Hold a rack or wall for balance.',
      'Lower straight down and push through the front foot.',
    ],
    safetyNotes: [
      'Move slowly while learning balance.',
      'Stop before pain, not normal effort.',
    ],
    defaultSets: 2,
    defaultReps: '6–8 each side',
    restSeconds: 75,
  },
  {
    id: 'dead-bug',
    name: 'Dead bug',
    targetMuscles: ['core'],
    equipment: 'bodyweight',
    instructions: [
      'Lie on your back with arms up and knees bent.',
      'Slowly lower the opposite arm and leg, then return.',
    ],
    safetyNotes: [
      'Keep your lower back comfortable.',
      'Make the movement smaller if your back arches.',
    ],
    defaultSets: 2,
    defaultReps: '6–8 each side',
    restSeconds: 60,
  },
];

function canUseEquipment(
  input: OnboardingInput,
  exercise: ExerciseDefinition,
): boolean {
  return input.equipment.includes(exercise.equipment);
}

function chooseExercises(
  input: OnboardingInput,
): readonly ExerciseDefinition[] {
  const available = catalog.filter((exercise) =>
    canUseEquipment(input, exercise),
  );
  const preferred =
    input.goal === 'strength'
      ? ['goblet-squat', 'machine-chest-press', 'seated-cable-row', 'dead-bug']
      : ['goblet-squat', 'incline-push-up', 'seated-cable-row', 'dead-bug'];
  const selected = preferred
    .map((id) => available.find((exercise) => exercise.id === id))
    .filter(
      (exercise): exercise is ExerciseDefinition => exercise !== undefined,
    );
  return selected.length >= 3 ? selected.slice(0, 4) : available.slice(0, 4);
}

export function generateBeginnerRoutine(
  input: OnboardingInput,
): BeginnerRoutine {
  const exercises = chooseExercises(input);
  if (exercises.length < 3) {
    throw new Error(
      'Choose at least one equipment option that supports three starter exercises.',
    );
  }
  return {
    id: `beginner-${input.goal}-${input.trainingDays}-${input.equipment.slice().sort().join('-')}`,
    title:
      input.goal === 'strength'
        ? 'Build a strong foundation'
        : 'Your first full-body routine',
    summary:
      'A simple full-body session. Learn the movement, leave a little energy in reserve, and build consistency.',
    goal: input.goal,
    experience: input.experience,
    trainingDays: input.trainingDays,
    equipment: input.equipment,
    exercises: exercises.map((exercise, index) => ({
      ...exercise,
      order: index + 1,
      completedSets: 0,
    })),
  };
}

export function createEmptyProgress(routine: BeginnerRoutine): WorkoutProgress {
  return { routineId: routine.id, completedExerciseIds: [], completedSets: {} };
}

export function completeSet(
  progress: WorkoutProgress,
  exercise: RoutineExercise,
): WorkoutProgress {
  const completed = Math.min(
    exercise.defaultSets,
    (progress.completedSets[exercise.id] ?? 0) + 1,
  );
  const completedSets = { ...progress.completedSets, [exercise.id]: completed };
  const completedExerciseIds =
    completed >= exercise.defaultSets &&
    !progress.completedExerciseIds.includes(exercise.id)
      ? [...progress.completedExerciseIds, exercise.id]
      : progress.completedExerciseIds;
  return { ...progress, completedSets, completedExerciseIds };
}

export function progressPercent(
  routine: BeginnerRoutine,
  progress: WorkoutProgress,
): number {
  const totalSets = routine.exercises.reduce(
    (total, exercise) => total + exercise.defaultSets,
    0,
  );
  const completedSets = routine.exercises.reduce(
    (total, exercise) => total + (progress.completedSets[exercise.id] ?? 0),
    0,
  );
  return totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);
}

export type SessionStatus = 'active' | 'completed';
export type SessionSetStatus = 'pending' | 'completed';

export interface WorkoutSessionSet {
  readonly id: string;
  readonly sessionExerciseId: string;
  readonly setNumber: number;
  readonly status: SessionSetStatus;
  readonly completedAt: string | null;
}

export interface WorkoutSessionExercise {
  readonly id: string;
  readonly exerciseId: string;
  readonly order: number;
  readonly exercise: ExerciseDefinition;
  readonly sets: readonly WorkoutSessionSet[];
}

export interface WorkoutSession {
  readonly id: string;
  readonly ownerId: string;
  readonly routine: BeginnerRoutine;
  readonly status: SessionStatus;
  readonly revision: number;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly exercises: readonly WorkoutSessionExercise[];
}

export function canCompleteWorkout(session: WorkoutSession): boolean {
  return (
    session.status === 'active' &&
    session.exercises.every((exercise) =>
      exercise.sets.every((set) => set.status === 'completed'),
    )
  );
}
