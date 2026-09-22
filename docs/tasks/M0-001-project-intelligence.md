# M0-001 — Establish repository-local project intelligence

## Identity

- Task ID: M0-001
- Task name: Establish repository-local project intelligence
- Milestone: M0 — Project intelligence and architecture alignment
- State: COMPLETED
- Owner: Project owner
- Created: 2026-09-21
- Updated: 2026-09-21

## Goal

Create a canonical, repository-local system that lets the solo owner and future agents understand FIG's product, architecture, state, risks, milestones, work packets, verification rules, and exact next action without relying on chat history.

## Context

- `AGENTS.md`
- `docs/LEGACY_PROJECT_AUDIT.md`
- `docs/SKILL_PORT_MATRIX.md`
- Read-only references: Forge-Gym-V2, Open WebUI, and located Claude/ClaudeKit skills.

## In scope

- Read-only audits and classification matrices.
- Canonical project-control documents and root pointers.
- FIG-native project-local skills.
- A document-derived `pnpm project:status` command.
- Verification and current-state update.

## Out of scope

- Creating `apps/web` or implementing workout behavior.
- Modifying reference repositories or Claude skill sources.
- Adding dependencies, providers, authentication, deployment, or migrations.
- Reworking the existing mobile prototype.

## Expected files

- `AGENTS.md`, root compatibility documents, `README.md`, `package.json`.
- `docs/*.md`, `docs/tasks/*`, `.opencode/skills/*`, `scripts/project-status.mjs`.

## Architecture constraints

- Canonical project documents live under `docs/`; no duplicate rule files.
- Status tooling reads documents and Git; it stores no hidden state.
- Skills are OpenCode-native and point to canonical sources.

## API impact

None.

## Database impact

None. No migrations may be changed.

## UI impact

None. Web UI work begins in M1.

## Security considerations

- Do not inspect or expose secret values in reference `.env` files.
- Keep all references read-only.
- Do not add external runtime dependencies.

## Acceptance criteria

- [x] FIG, Forge-Gym-V2, Open WebUI, and Claude/ClaudeKit sources are audited.
- [x] Legacy ideas have KEEP/ADAPT/FREEZE/REMOVE/REJECT classifications.
- [x] Relevant skills have A/B/C/D port classifications.
- [x] Always-on rules are in `AGENTS.md`; workflows are elsewhere.
- [x] Canonical product, architecture, roadmap, state, templates, and risks exist.
- [x] Required FIG-native skills exist in `.opencode/skills`.
- [x] `pnpm project:status` reads canonical documents and Git.
- [x] Automated and manual verification evidence is recorded.
- [x] `docs/CURRENT_STATE.md` is updated to the accepted M0 result and exact M1 task.

## Automated tests

- [x] `pnpm project:status`
- [x] `pnpm format:check`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm lint`
- [x] `git diff --check`

## Manual verification

- [x] Confirm status output identifies branch, tree state, milestone, task, blockers, risks, verification, and next action.
- [x] Confirm no reference repository changed.
- [x] Confirm existing user changes in mobile manifest/lockfile remain present.

## Risks

- Documentation may drift if duplicate root and `docs/` content remains.
  - Mitigation: root project-control files are pointers.
- Skills may duplicate project state.
  - Mitigation: skills load canonical documents and contain workflows only.

## Definition of done

- [x] Acceptance criteria and checks are complete or limitations are explicit.
- [x] Current state and exact next task are updated.
- [x] No broad application development was started.

## Evidence

- `pnpm project:status`: passed and reported all requested fields.
- `pnpm test`: passed, 6 files and 33 tests.
- `pnpm typecheck`: passed for all configured TypeScript workspaces.
- `pnpm lint`: passed; configured lint scripts currently run TypeScript checks.
- `pnpm format:check`: initially failed on six task-owned files, then passed after targeted formatting.
- `git diff --check`: passed.
- No database migration or application smoke test was required because this task changed project control/documentation only.

## Completion summary

M0 project intelligence is accepted. Known limitations are recorded in the milestone report. Next task: M1-001, select the web framework and accept ADR 0010 before scaffolding.
