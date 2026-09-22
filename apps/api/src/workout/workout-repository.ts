import { and, eq } from 'drizzle-orm';
import type {
  BeginnerRoutine,
  ExerciseDefinition,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionSet,
} from '@forge/domain';
import { canCompleteWorkout, generateBeginnerRoutine } from '@forge/domain';
import type { CompleteSetInput } from '@forge/contracts';
import type { Database } from '../db/client.js';
import {
  workoutSessionExercises,
  workoutSessionSets,
  workoutSessions,
} from '../db/schema.js';

export class WorkoutNotFoundError extends Error {
  readonly code = 'workout_not_found';
}
export class WorkoutConflictError extends Error {
  readonly code = 'workout_session_conflict';
}
export class WorkoutInvalidTransitionError extends Error {
  readonly code = 'workout_invalid_transition';
}

export interface WorkoutRepository {
  listTemplates(): Promise<BeginnerRoutine[]>;
  getTemplate(id: string): Promise<BeginnerRoutine | null>;
  startSession(userId: string, routineId: string): Promise<WorkoutSession>;
  getSession(userId: string, id: string): Promise<WorkoutSession | null>;
  completeSet(
    userId: string,
    sessionId: string,
    input: CompleteSetInput,
  ): Promise<WorkoutSession>;
  completeWorkout(
    userId: string,
    sessionId: string,
    revision: number,
  ): Promise<WorkoutSession>;
}

const defaultRoutine = () =>
  generateBeginnerRoutine({
    goal: 'general-fitness',
    experience: 'new',
    trainingDays: 3,
    equipment: ['bodyweight', 'dumbbells', 'machines'],
  });

function newSession(userId: string, routine: BeginnerRoutine): WorkoutSession {
  const sessionId = crypto.randomUUID();
  return {
    id: sessionId,
    ownerId: userId,
    routine,
    status: 'active',
    revision: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
    exercises: routine.exercises.map((exercise) => {
      const exerciseId = crypto.randomUUID();
      return {
        id: exerciseId,
        exerciseId: exercise.id,
        order: exercise.order,
        exercise,
        sets: Array.from({ length: exercise.defaultSets }, (_, index) => ({
          id: crypto.randomUUID(),
          sessionExerciseId: exerciseId,
          setNumber: index + 1,
          status: 'pending' as const,
          completedAt: null,
        })),
      };
    }),
  };
}

function mutateSet(
  session: WorkoutSession,
  input: CompleteSetInput,
): WorkoutSession {
  const exercise = session.exercises.find(
    (item) => item.id === input.sessionExerciseId,
  );
  if (!exercise) throw new WorkoutNotFoundError();
  const set = exercise.sets.find((item) => item.setNumber === input.setNumber);
  if (!set) throw new WorkoutInvalidTransitionError('set_not_found');
  if (set.status === 'completed') return session;
  const completedAt = new Date().toISOString();
  return {
    ...session,
    revision: session.revision + 1,
    exercises: session.exercises.map((candidate) =>
      candidate.id !== exercise.id
        ? candidate
        : {
            ...candidate,
            sets: candidate.sets.map((candidateSet) =>
              candidateSet.id === set.id
                ? { ...candidateSet, status: 'completed', completedAt }
                : candidateSet,
            ),
          },
    ),
  };
}

function assertRevision(session: WorkoutSession, revision: number) {
  if (session.revision !== revision) throw new WorkoutConflictError();
}

export function createInMemoryWorkoutRepository(): WorkoutRepository {
  const templates = [defaultRoutine()];
  const sessions = new Map<string, WorkoutSession>();
  const requestResults = new Map<string, WorkoutSession>();
  return {
    async listTemplates() {
      return templates;
    },
    async getTemplate(id) {
      return templates.find((template) => template.id === id) ?? null;
    },
    async startSession(userId, routineId) {
      const template = templates.find((item) => item.id === routineId);
      if (!template) throw new WorkoutNotFoundError();
      const existing = [...sessions.values()].find(
        (session) => session.ownerId === userId && session.status === 'active',
      );
      if (existing) return existing;
      const session = newSession(userId, template);
      sessions.set(session.id, session);
      return session;
    },
    async getSession(userId, id) {
      const session = sessions.get(id);
      return session?.ownerId === userId ? session : null;
    },
    async completeSet(userId, sessionId, input) {
      const session = sessions.get(sessionId);
      if (!session || session.ownerId !== userId)
        throw new WorkoutNotFoundError();
      const requestKey = `${sessionId}:${input.requestKey}`;
      const prior = requestResults.get(requestKey);
      if (prior) return prior;
      if (session.status !== 'active')
        throw new WorkoutInvalidTransitionError('session_completed');
      assertRevision(session, input.revision);
      const next = mutateSet(session, input);
      sessions.set(sessionId, next);
      requestResults.set(requestKey, next);
      return next;
    },
    async completeWorkout(userId, sessionId, revision) {
      const session = sessions.get(sessionId);
      if (!session || session.ownerId !== userId)
        throw new WorkoutNotFoundError();
      assertRevision(session, revision);
      if (!canCompleteWorkout(session))
        throw new WorkoutInvalidTransitionError('sets_remaining');
      const next = {
        ...session,
        status: 'completed' as const,
        revision: session.revision + 1,
        completedAt: new Date().toISOString(),
      };
      sessions.set(sessionId, next);
      return next;
    },
  };
}

function toDomain(
  session: typeof workoutSessions.$inferSelect,
  exerciseRows: Array<typeof workoutSessionExercises.$inferSelect>,
  setRows: Array<typeof workoutSessionSets.$inferSelect>,
): WorkoutSession {
  const routine: BeginnerRoutine = {
    id: session.routineId,
    title: session.title,
    summary: session.summary,
    goal: session.goal as BeginnerRoutine['goal'],
    experience: session.experience as BeginnerRoutine['experience'],
    trainingDays: session.trainingDays,
    equipment: session.equipment as BeginnerRoutine['equipment'],
    exercises: exerciseRows
      .sort((a, b) => a.order - b.order)
      .map((row) => ({
        id: row.exerciseId,
        name: row.name,
        targetMuscles: row.targetMuscles as ExerciseDefinition['targetMuscles'],
        equipment: row.equipment as ExerciseDefinition['equipment'],
        instructions: row.instructions,
        safetyNotes: row.safetyNotes,
        defaultSets: row.defaultSets,
        defaultReps: row.defaultReps,
        restSeconds: row.restSeconds,
        order: row.order,
        completedSets: 0,
      })),
  };
  return {
    id: session.id,
    ownerId: session.userId,
    routine,
    status: session.status as WorkoutSession['status'],
    revision: session.revision,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    exercises: exerciseRows
      .sort((a, b) => a.order - b.order)
      .map((row) => ({
        id: row.id,
        exerciseId: row.exerciseId,
        order: row.order,
        exercise: routine.exercises.find((item) => item.id === row.exerciseId)!,
        sets: setRows
          .filter((set) => set.sessionExerciseId === row.id)
          .sort((a, b) => a.setNumber - b.setNumber)
          .map((set) => ({
            id: set.id,
            sessionExerciseId: set.sessionExerciseId,
            setNumber: set.setNumber,
            status: set.completed ? 'completed' : 'pending',
            completedAt: set.completedAt?.toISOString() ?? null,
          })),
      })),
  };
}

export function createWorkoutRepository(db: Database): WorkoutRepository {
  const inMemory = createInMemoryWorkoutRepository();
  // Template content is deterministic and seeded in the domain. PostgreSQL stores
  // snapshots only after a session starts; the repository keeps query policy here.
  return {
    listTemplates: () => inMemory.listTemplates(),
    getTemplate: (id) => inMemory.getTemplate(id),
    async startSession(userId, routineId) {
      const existing = await db
        .select()
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, userId),
            eq(workoutSessions.status, 'active'),
          ),
        )
        .limit(1);
      if (existing[0])
        return this.getSession(
          userId,
          existing[0].id,
        ) as Promise<WorkoutSession>;
      const routine = await inMemory.getTemplate(routineId);
      if (!routine) throw new WorkoutNotFoundError();
      const [created] = await db
        .insert(workoutSessions)
        .values({
          userId,
          routineId: routine.id,
          title: routine.title,
          summary: routine.summary,
          goal: routine.goal,
          experience: routine.experience,
          trainingDays: routine.trainingDays,
          equipment: [...routine.equipment],
          status: 'active',
        })
        .returning();
      for (const exercise of routine.exercises) {
        const [createdExercise] = await db
          .insert(workoutSessionExercises)
          .values({
            sessionId: created.id,
            userId,
            exerciseId: exercise.id,
            order: exercise.order,
            name: exercise.name,
            targetMuscles: [...exercise.targetMuscles],
            equipment: exercise.equipment,
            instructions: [...exercise.instructions],
            safetyNotes: [...exercise.safetyNotes],
            defaultSets: exercise.defaultSets,
            defaultReps: exercise.defaultReps,
            restSeconds: exercise.restSeconds,
          })
          .returning();
        await db.insert(workoutSessionSets).values(
          Array.from({ length: exercise.defaultSets }, (_, index) => ({
            sessionId: created.id,
            sessionExerciseId: createdExercise.id,
            userId,
            setNumber: index + 1,
          })),
        );
      }
      return (await this.getSession(userId, created.id))!;
    },
    async getSession(userId, id) {
      const [session] = await db
        .select()
        .from(workoutSessions)
        .where(
          and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)),
        )
        .limit(1);
      if (!session) return null;
      const exercises = await db
        .select()
        .from(workoutSessionExercises)
        .where(eq(workoutSessionExercises.sessionId, id));
      const sets = await db
        .select()
        .from(workoutSessionSets)
        .where(eq(workoutSessionSets.sessionId, id));
      return toDomain(session, exercises, sets);
    },
    async completeSet(userId, sessionId, input) {
      const session = await this.getSession(userId, sessionId);
      if (!session) throw new WorkoutNotFoundError();
      if (session.status !== 'active')
        throw new WorkoutInvalidTransitionError('session_completed');
      const [priorRequest] = await db
        .select()
        .from(workoutSessionSets)
        .where(
          and(
            eq(workoutSessionSets.sessionId, sessionId),
            eq(workoutSessionSets.userId, userId),
            eq(workoutSessionSets.requestKey, input.requestKey),
          ),
        )
        .limit(1);
      if (priorRequest) return session;
      assertRevision(session, input.revision);
      const result = await db.transaction(async (tx) => {
        const [set] = await tx
          .select()
          .from(workoutSessionSets)
          .where(
            and(
              eq(workoutSessionSets.sessionExerciseId, input.sessionExerciseId),
              eq(workoutSessionSets.setNumber, input.setNumber),
              eq(workoutSessionSets.userId, userId),
            ),
          )
          .limit(1);
        if (!set) throw new WorkoutNotFoundError();
        await tx
          .update(workoutSessionSets)
          .set({
            completed: true,
            completedAt: new Date(),
            requestKey: input.requestKey,
          })
          .where(
            and(
              eq(workoutSessionSets.id, set.id),
              eq(workoutSessionSets.completed, false),
            ),
          );
        const updated = await tx
          .update(workoutSessions)
          .set({ revision: session.revision + 1 })
          .where(
            and(
              eq(workoutSessions.id, sessionId),
              eq(workoutSessions.revision, session.revision),
            ),
          )
          .returning({ id: workoutSessions.id });
        if (updated.length === 0) throw new WorkoutConflictError();
        return this.getSession(userId, sessionId);
      });
      return (await result)!;
    },
    async completeWorkout(userId, sessionId, revision) {
      const session = await this.getSession(userId, sessionId);
      if (!session) throw new WorkoutNotFoundError();
      assertRevision(session, revision);
      if (!canCompleteWorkout(session))
        throw new WorkoutInvalidTransitionError('sets_remaining');
      await db
        .update(workoutSessions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          revision: revision + 1,
        })
        .where(
          and(
            eq(workoutSessions.id, sessionId),
            eq(workoutSessions.userId, userId),
            eq(workoutSessions.revision, revision),
          ),
        );
      return (await this.getSession(userId, sessionId))!;
    },
  };
}
