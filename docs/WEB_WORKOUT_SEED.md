# M1 deterministic workout seed content

This is intentionally small seed content for the first FIG web vertical slice. It is product education content, not medical or individualized training advice. The generator is deterministic: the same onboarding input produces the same routine ID, title, exercise ordering, sets, reps, rest, instructions, and safety notes.

## Onboarding inputs

- Goal: `general-fitness`, `strength`, or `confidence`.
- Experience: `new` or `returning`.
- Training days: 2–5 days per week.
- Equipment: `bodyweight`, `dumbbells`, and/or `machines`.

## Exercise catalog

| ID                    | Exercise              | Muscles    | Equipment  | Prescription                |
| --------------------- | --------------------- | ---------- | ---------- | --------------------------- |
| `goblet-squat`        | Goblet squat          | Legs, core | Dumbbells  | 3 × 8–10, 90s rest          |
| `machine-chest-press` | Machine chest press   | Push       | Machines   | 3 × 8–12, 90s rest          |
| `seated-cable-row`    | Seated cable row      | Pull       | Machines   | 3 × 8–12, 90s rest          |
| `incline-push-up`     | Incline push-up       | Push, core | Bodyweight | 3 × 6–10, 75s rest          |
| `split-squat`         | Supported split squat | Legs       | Bodyweight | 2 × 6–8 each side, 75s rest |
| `dead-bug`            | Dead bug              | Core       | Bodyweight | 2 × 6–8 each side, 60s rest |

## Selection rules

- Strength goals prefer goblet squat, machine chest press, seated cable row, and dead bug when available.
- Other goals prefer goblet squat, incline push-up, seated cable row, and dead bug when available.
- Exercises are included only when their equipment is selected.
- The generator requires at least three compatible exercises and otherwise reports a clear onboarding error.
- Progress counts completed sets, caps at the target set count, and marks an exercise complete only after all target sets are complete.

## Safety/content boundary

The seed notes use beginner-safe, non-medical language: controlled movement, comfortable range of motion, stable surfaces, lighter starting loads, and stopping before pain. This content does not diagnose injuries, prescribe treatment, or claim individualized medical suitability. M4 content review must expand and approve guidance before FIG presents it as a broader coaching library.
