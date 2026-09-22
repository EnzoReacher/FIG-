# Agent Instructions

- FIG is a web-first beginner gym-coach product. Workout coaching is the core product priority; native mobile clients are a later milestone.
- Treat `/home/enzoreacher/Forge-Gym-V2` and `/home/enzoreacher/Repos/open-webui` as read-only references. Never modify them or copy them wholesale.
- Use pnpm and treat workspace manifests and configuration as the source of truth for commands.
- Use strict TypeScript. Do not use `any` without a narrow, documented justification.
- Preserve the boundaries documented in `docs/ARCHITECTURE.md`: domain code must remain framework-independent, UI must not access the database, and transport/database models must not become domain models by convenience.
- Never modify an applied database migration. Add a new migration, inspect generated SQL, and verify both schema and behavior.
- Do not add a dependency without documenting why the existing platform or dependencies are insufficient.
- Every implementation task must have a task packet under `docs/tasks/` based on `docs/TASK_PACKET_TEMPLATE.md`. Normally only one task is `IN_PROGRESS`.
- Before completing work, run the affected tests and relevant typecheck, lint, formatting, integration, or browser checks. Report only checks actually executed.
- Update `docs/CURRENT_STATE.md` after completed work, including evidence, blockers, risks, and the exact next action.
- Do not claim success from cached, historical, skipped, or unexecuted checks.
- Do not push, merge, deploy, rewrite history, or discard user changes automatically.
- Preserve user changes and investigate unfamiliar files before replacing or deleting them.
- Significant architectural decisions require an ADR under `docs/adr/`.
