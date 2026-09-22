# FIG AI development system

## Purpose

This repository is the durable memory for FIG. Chat history is not a source of truth. The system is intentionally small: one always-on instruction file, canonical project documents, focused skills, ADRs, and task packets.

## Where information belongs

### `AGENTS.md`

Only rules that are always true and useful on nearly every task: product direction, read-only references, package manager, TypeScript/migration/boundary rules, verification honesty, user-change preservation, and task-packet use. Do not place long workflows, milestone detail, or transient status here.

### Project-local skill

A repeatable workflow that is relevant only for certain tasks and benefits from progressive disclosure. Skills live in `.opencode/skills/<id>/SKILL.md`. They may point to canonical documents but must not duplicate product state. Skills must use FIG/OpenCode capabilities, not Claude-specific hooks, task syntax, model tiers, or hidden report locations.

### Project document

Durable shared facts: product requirements, architecture, roadmap, current state, risk register, audits, and templates. Each topic has one canonical document. Root compatibility files point to canonical `docs/` files instead of copying them.

### ADR

A significant, durable technical or product-architecture choice with alternatives and consequences. Use an ADR when a decision changes boundaries, persistence semantics, frameworks, authentication, providers, privacy, deployment, or other choices future work should not casually reverse.

### Task packet

The execution contract for one bounded implementation task. It defines scope, expected files, impacts, acceptance, checks, risks, evidence, and done criteria. It is also the recovery point after interruption.

## OpenCode operating model

1. Read `AGENTS.md`, `docs/CURRENT_STATE.md`, and the active task packet.
2. Load only the skills relevant to the task.
3. Inspect manifests/configuration before selecting commands.
4. Check the working tree and preserve unrelated user changes.
5. Confirm the task packet is bounded; update it before expanding scope.
6. Move the packet through `PLANNED` → `IN_PROGRESS` → `VERIFYING` → `COMPLETED`, or use `BLOCKED`, `DEFERRED`, or `CANCELLED` truthfully.
7. Make the smallest coherent change that satisfies acceptance criteria.
8. Run affected checks and record actual evidence, including failures and unavailable checks.
9. Update `docs/CURRENT_STATE.md`, risks, ADRs, and milestone evidence as needed.
10. Stop with an exact next action; do not push, merge, or deploy automatically.

Normally only one packet is `IN_PROGRESS`. Read-only audits may run in parallel when they do not edit shared files. Edits are coordinated sequentially.

## Owner review

The owner reviews:

- the task packet's scope and exclusions before high-impact work;
- dependency, migration, security, privacy, provider, and architectural decisions;
- the diff, actual verification evidence, known limitations, and next action;
- milestone acceptance using `MILESTONE_ACCEPTANCE_TEMPLATE.md`.

An agent may prepare options and recommendations, but owner decisions are required where the packet or ADR identifies a gate.

## Milestone acceptance

A milestone is accepted only when its objective, product value, scope, dependencies, criteria, automated checks, manual smoke test, evidence, limitations, risks, and next milestone are reviewed. “Code exists” is not acceptance. Skipped or unavailable checks remain limitations.

## Avoiding context drift

- Keep product direction in `PRODUCT.md`, architecture in `ARCHITECTURE.md`, sequencing in `ROADMAP.md`, and live facts in `CURRENT_STATE.md`.
- Link instead of duplicating.
- Update state in the same task that changes reality.
- Mark evidence with date and baseline.
- Preserve reference provenance and distinguish historical, adopted, superseded, and unverified information.
- Use `pnpm project:status` as a view over canonical documents, never as a separate database.

## Interrupted-work recovery

1. Run `git status --short --branch` and `pnpm project:status`.
2. Read the active packet's scope, evidence, and last update.
3. Inspect the diff without reverting unfamiliar changes.
4. Re-run only the checks needed to establish the current baseline.
5. If intent is unclear, mark the task `BLOCKED` and state the exact decision needed.
6. Resume from the packet or close it truthfully; never reconstruct completion from memory.

## Compatibility files

A future `CLAUDE.md` may contain only a pointer such as `@AGENTS.md`. It must not duplicate canonical instructions. Claude source directories remain read-only references and are not runtime dependencies.
