import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { BeginnerRoutine, WorkoutSession } from '@forge/domain';
import { activeSessionStore, workoutApi } from './api';
import './styles.css';

type Page = 'dashboard' | 'workouts' | 'details' | 'session' | 'completed';

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [workouts, setWorkouts] = useState<BeginnerRoutine[]>([]);
  const [selected, setSelected] = useState<BeginnerRoutine | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const items = await workoutApi.list();
        setWorkouts(items);
        const sessionId = activeSessionStore.get();
        if (sessionId) {
          try {
            const restored = await workoutApi.session(sessionId);
            setSession(restored);
            setPage(restored.status === 'completed' ? 'completed' : 'session');
          } catch {
            activeSessionStore.clear();
          }
        }
      } catch {
        setError('FIG could not reach the workout service.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const start = async (workout: BeginnerRoutine) => {
    setError(null);
    try {
      const next = await workoutApi.start(workout.id);
      setSession(next);
      activeSessionStore.set(next.id);
      setPage('session');
    } catch {
      setError('We could not start this workout. Try again.');
    }
  };
  const completeSet = async (exerciseId: string, setNumber: number) => {
    if (!session) return;
    try {
      setSession(await workoutApi.completeSet(session, exerciseId, setNumber));
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === 'workout_session_conflict'
          ? 'This workout changed in another tab. Refresh to load the latest progress.'
          : 'Set could not be saved. Try again.',
      );
    }
  };
  const finish = async () => {
    if (!session) return;
    try {
      const next = await workoutApi.complete(session);
      setSession(next);
      activeSessionStore.clear();
      setPage('completed');
    } catch {
      setError('Finish every prescribed set before completing the workout.');
    }
  };

  if (loading)
    return (
      <Status title="Getting FIG ready" message="Loading beginner workouts…" />
    );
  if (error && workouts.length === 0)
    return (
      <Status
        title="Workout service unavailable"
        message={error}
        retry={() => window.location.reload()}
      />
    );
  const routine = selected ?? workouts[0] ?? null;
  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#dashboard"
          onClick={() => setPage('dashboard')}
        >
          <span className="brand-mark">F</span>
          <span>FIG</span>
        </a>
        <p className="eyebrow">Your beginner gym coach</p>
        <span className="status-dot">Web preview</span>
      </header>
      <div className="layout">
        <aside className="sidebar" aria-label="Primary navigation">
          <p className="sidebar-label">Coach desk</p>
          <button className="nav-item" onClick={() => setPage('dashboard')}>
            Dashboard
          </button>
          <button className="nav-item" onClick={() => setPage('workouts')}>
            Workouts
          </button>
          <div className="sidebar-note">
            <strong>Small steps count.</strong>
            <span>Learn the movement first. Consistency comes next.</span>
          </div>
        </aside>
        <main className="main-content">
          {error && (
            <div className="notice" role="alert">
              {error}
            </div>
          )}
          {page === 'dashboard' && routine && (
            <section className="hero-card">
              <div className="hero-copy">
                <p className="kicker">Welcome to FIG</p>
                <h1>Build confidence, one workout at a time.</h1>
                <p>
                  Clear beginner guidance, one saved set at a time. Your active
                  workout resumes after a refresh.
                </p>
              </div>
              <button
                className="button primary"
                onClick={() =>
                  session ? setPage('session') : void start(routine)
                }
              >
                {session ? 'Resume workout →' : 'Start recommended workout →'}
              </button>
            </section>
          )}
          {page === 'workouts' && (
            <WorkoutList
              workouts={workouts}
              open={(item) => {
                setSelected(item);
                setPage('details');
              }}
            />
          )}
          {page === 'details' && routine && (
            <Details workout={routine} start={() => void start(routine)} />
          )}
          {page === 'session' && session && (
            <SessionView
              session={session}
              completeSet={(id, n) => void completeSet(id, n)}
              finish={() => void finish()}
            />
          )}
          {page === 'completed' && session && (
            <section className="simple-page">
              <p className="kicker">Workout complete</p>
              <h1>You showed up. That matters.</h1>
              <p>{session.routine.title} is saved as completed.</p>
              <button
                className="button primary"
                onClick={() => setPage('dashboard')}
              >
                Back to dashboard
              </button>
            </section>
          )}
          {!routine && (
            <Status
              title="No workouts available"
              message="The seeded beginner workout is not available yet."
            />
          )}
        </main>
      </div>
    </div>
  );
}

function WorkoutList({
  workouts,
  open,
}: {
  workouts: BeginnerRoutine[];
  open: (workout: BeginnerRoutine) => void;
}) {
  return (
    <section className="simple-page">
      <p className="kicker">Workouts</p>
      <h1>Beginner workouts</h1>
      <p>Start with a routine that explains what to do and why it matters.</p>
      <div className="plan-grid">
        {workouts.map((workout) => (
          <button
            className="plan-item"
            key={workout.id}
            onClick={() => open(workout)}
          >
            <strong>{workout.title}</strong>
            <small>
              {workout.exercises.length} exercises · Beginner · about 30 minutes
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
function Details({
  workout,
  start,
}: {
  workout: BeginnerRoutine;
  start: () => void;
}) {
  return (
    <section className="simple-page">
      <p className="kicker">Workout details</p>
      <h1>{workout.title}</h1>
      <p>{workout.summary}</p>
      <div className="exercise-list">
        {workout.exercises.map((exercise) => (
          <article className="exercise-card" key={exercise.id}>
            <div className="exercise-top">
              <span className="exercise-number">
                {String(exercise.order).padStart(2, '0')}
              </span>
              <div>
                <h2>{exercise.name}</h2>
                <p className="meta">
                  {exercise.targetMuscles.join(' · ')} · {exercise.equipment}
                </p>
              </div>
            </div>
            <p>{exercise.instructions.join(' ')}</p>
            <p className="safety">
              Beginner note: {exercise.safetyNotes.join(' ')}
            </p>
            <span>
              {exercise.defaultSets} sets · {exercise.defaultReps} reps ·{' '}
              {exercise.restSeconds}s rest
            </span>
          </article>
        ))}
      </div>
      <button className="button primary" onClick={start}>
        Start this workout →
      </button>
    </section>
  );
}
function SessionView({
  session,
  completeSet,
  finish,
}: {
  session: WorkoutSession;
  completeSet: (id: string, n: number) => void;
  finish: () => void;
}) {
  const total = session.exercises.reduce(
    (sum, item) => sum + item.sets.length,
    0,
  );
  const done = session.exercises.reduce(
    (sum, item) =>
      sum + item.sets.filter((set) => set.status === 'completed').length,
    0,
  );
  const percent = useMemo(
    () => Math.round((done / total) * 100),
    [done, total],
  );
  return (
    <section className="simple-page">
      <p className="kicker">Active workout</p>
      <h1>{session.routine.title}</h1>
      <div className="progress-card">
        <strong>{percent}% complete</strong>
        <span>
          {done} of {total} sets completed
        </span>
        <div className="progress-track">
          <div style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="exercise-list">
        {session.exercises.map((exercise) => (
          <article className="exercise-card" key={exercise.id}>
            <div className="exercise-top">
              <span className="exercise-number">
                {String(exercise.order).padStart(2, '0')}
              </span>
              <h2>{exercise.exercise.name}</h2>
            </div>
            <p>
              {exercise.exercise.defaultReps} reps ·{' '}
              {exercise.exercise.restSeconds}s rest
            </p>
            <div className="choice-grid">
              {exercise.sets.map((set) => (
                <button
                  className="button small"
                  key={set.id}
                  disabled={set.status === 'completed'}
                  onClick={() => completeSet(exercise.id, set.setNumber)}
                >
                  {set.status === 'completed'
                    ? `Set ${set.setNumber} complete`
                    : `Complete set ${set.setNumber}`}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      <button
        className="button primary"
        disabled={done !== total}
        onClick={finish}
      >
        Complete workout
      </button>
    </section>
  );
}
function Status({
  title,
  message,
  retry,
}: {
  title: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="status-panel" role="status">
      <h1>{title}</h1>
      <p>{message}</p>
      {retry && (
        <button className="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
