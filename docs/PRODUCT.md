# FIG product definition

## Product statement

FIG is a web-first beginner gym coach. It helps a person who is new to training decide what to do next, perform it safely, record it reliably, and understand progress without requiring prior fitness knowledge.

Workout coaching is the core product priority. Nutrition, activity, and food-photo analysis support the training experience; they do not replace it.

FIG is a fitness education and tracking product, not medical advice, diagnosis, or treatment. Nutrition and image-derived values must be presented as estimates.

## Beginner outcomes

FIG helps beginners understand:

- what to train and how to structure a routine;
- how to perform exercises and use equipment;
- which alternatives are appropriate when equipment or ability differs;
- how to start, pause, resume, and finish a workout;
- what to eat and how calories and macros work;
- how to log foods, meals, steps, and food-photo estimates;
- what progress means and which next action is useful.

## Product principles

1. **Next action first.** Every primary flow should make the safest useful next action obvious.
2. **Beginner language.** Explain terms; do not assume gym vocabulary.
3. **Guidance plus control.** Recommendations remain editable and explain their assumptions.
4. **Explicit confirmation.** Estimated food analysis never changes a log until the user reviews and confirms it.
5. **History is trustworthy.** Completed workout and nutrition records are not silently rewritten by later catalog changes.
6. **Ownership is enforced server-side.** Client-supplied identity never selects another user's data.
7. **Web first, mobile ready.** Browser workflows ship first. Native sensors, camera, and permissions remain behind replaceable boundaries for M9.
8. **Accessible by default.** Keyboard, screen-reader, contrast, motion, touch-target, and responsive behavior are acceptance requirements.

## Core product areas

### Workout coaching

Exercises, equipment, beginner plans, workout days, active sessions, set logs, instructions, alternatives, mistakes, and progress. This is the first new product domain to build.

### Nutrition

Calories, macros, reusable foods, meals, daily totals, manual entry, goals, and progress. Existing fixed-point and timezone-aware backend work should be preserved where it remains valid.

### Activity

Manual web step entry and daily activity first. Native providers are future adapters, not assumptions embedded in the domain.

### Food-photo analysis

Browser upload, temporary private image handling, estimate with confidence and assumptions, review/edit, explicit confirmation, and manual fallback. The current provider is deterministic development logic.

### Progress

Beginner-friendly summaries of completed workouts, consistency, nutrition, and activity. Avoid false precision and unsupported health claims.

## Users and primary journey

The primary user is a beginner who may not know exercise names, equipment setup, appropriate volume, or how to resume after interruption.

The first complete value journey is:

1. choose a beginner goal and available equipment;
2. receive a clear workout day;
3. start the workout;
4. complete and record a set with guidance;
5. refresh or return without losing the session;
6. resume and finish;
7. see the next useful action and a trustworthy record.

## Non-goals for the first web milestones

- Social feeds, messaging, leaderboards, payments, wearables, or coach marketplaces.
- Autonomous medical, injury, or eating-disorder advice.
- Native-first architecture or mandatory offline synchronization.
- A real vision provider before privacy, cost, region, retention, and security decisions are accepted.
- Copying Forge-Gym-V2 or Open WebUI wholesale.

## Product success criteria

- A beginner can complete the persisted workout journey without external instruction.
- Refreshing or temporarily leaving does not lose an active session.
- Exercise and equipment guidance is understandable and accessible.
- Nutrition and activity records remain owner-scoped and numerically reliable.
- Estimated values clearly show uncertainty and require confirmation.
- The system can state what is implemented, verified, blocked, and next without relying on chat history.
