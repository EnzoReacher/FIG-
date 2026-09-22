# Claude/ClaudeKit skill port matrix

Audit date: 2026-09-21  
Read-only ClaudeKit source: `/home/enzoreacher/gym-planner-ai/.claude/`  
Read-only official plugin source: `/home/enzoreacher/.claude/plugins/marketplaces/claude-plugins-official/`

## Conclusion

ClaudeKit contains a large amount of reusable knowledge, but its orchestration layer depends on Claude Code tasks, hooks, slash commands, model tiers, `.claude` state, and hidden report conventions. FIG does not port that layer. The initial FIG catalog contains eight small project-specific OpenCode skills written from FIG requirements, not copied from ClaudeKit.

Classifications:

- **A — PORT_DIRECTLY:** pure knowledge/workflow; normalize naming and attribution only.
- **B — PORT_WITH_EDITS:** useful, but paths, dependencies, commands, assumptions, or integrations need changes.
- **C — REWRITE_FOR_OPEN_CODE:** useful idea whose implementation relies on Claude-specific orchestration.
- **D — DO_NOT_PORT:** unnecessary, unsafe, duplicate, obsolete, placeholder, or tightly Claude-coupled.

## Claude-specific signals inspected

- `CLAUDE.md` and `.claude/` path assumptions;
- Claude Code and `/ck:*` slash commands;
- hooks and plugin metadata;
- `Task(...)`, `Agent(...)`, `subagent_type`, task/team APIs, and `run_in_background`;
- `!shell-command` and `$ARGUMENTS` syntax;
- `AskUserQuestion`, `TodoWrite`, `SendMessage`, and `KillShell`;
- `.claude/.ck.json`, `.claude/.mcp.json`, `.claude/.env`, and fixed report paths;
- Haiku/Sonnet/Opus and Claude Agent Teams assumptions;
- implicit global installs, environment variables, and working-directory paths.

The located project `CLAUDE.md` contains only `@AGENTS.md`, which is a good compatibility-pointer pattern and is not copied because FIG does not currently need that file.

## A — PORT_DIRECTLY candidates

These appear portable as knowledge sources, but are not automatically needed by FIG.

| Skill                    | Source                                                    | Relevance / disposition                                                                                     |
| ------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| backend-development      | ClaudeKit `skills/backend-development`                    | Relevant reference for API architecture; FIG's focused architecture skill is smaller and project-specific.  |
| databases                | `skills/databases`                                        | Relevant reference for PostgreSQL; FIG uses a focused migration skill instead of porting the broad catalog. |
| frontend-development     | `skills/frontend-development`                             | General reference; FIG web skill encodes project-specific rules.                                            |
| react-best-practices     | `skills/react-best-practices`                             | Candidate after M1 framework selection; do not assume Next.js.                                              |
| web-testing              | `skills/web-testing`                                      | Useful testing knowledge; FIG verification skill is adopted now.                                            |
| mermaidjs-v11            | `skills/mermaidjs-v11`                                    | Portable but not essential to initial FIG operations.                                                       |
| problem-solving          | `skills/problem-solving`                                  | Portable but generic and lower value than focused FIG workflows.                                            |
| sequential-thinking      | `skills/sequential-thinking`                              | Portable methodology; not needed as a project-local skill.                                                  |
| mobile-development       | `skills/mobile-development`                               | Relevant in M9, not current web-first work.                                                                 |
| web-frameworks           | `skills/web-frameworks`                                   | Useful during M1 framework decision; consult as reference rather than installing wholesale.                 |
| devops                   | `skills/devops`                                           | Relevant in M8; broad catalog deferred.                                                                     |
| agent-browser            | `skills/agent-browser`                                    | External CLI guidance; OpenCode already provides browser tools.                                             |
| official frontend-design | official `plugins/frontend-design/skills/frontend-design` | Cleanest general design candidate; FIG web skill incorporates only project-relevant principles.             |

Other A-class but currently irrelevant domain catalogs: `better-auth`, `google-adk-python`, `payment-integration`, `remotion`, `repomix`, `shader`, `shopify`, `tanstack`, and `threejs` only after its path issue is corrected. They are not part of FIG's initial catalog.

## B — PORT_WITH_EDITS candidates

| Skill                                           | Required edits / FIG decision                                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| frontend-design (ClaudeKit)                     | Remove `ck:*` skill chaining and named subagent assumptions; keep design critique only if needed.                                          |
| ui-ux-pro-max                                   | Fix skill-relative scripts, remove React-Native-only assertions, verify advertised stacks, and make generated design-system output opt-in. |
| ui-styling                                      | Verify selected web framework and remove cross-skill assumptions.                                                                          |
| security-scan                                   | Detect manifests/package manager, remove `/ck:` naming and report-path assumptions, separate matches from confirmed issues.                |
| chrome-devtools                                 | Replace `.claude` paths and generated output locations; use OpenCode browser capabilities.                                                 |
| web-design-guidelines                           | Replace named `WebFetch`; define offline/fetch-failure behavior.                                                                           |
| mcp-builder                                     | Replace Claude tool names and refresh SDK/config guidance before use.                                                                      |
| docs-seeker                                     | Replace `.claude/.env` search behavior and secret handling.                                                                                |
| worktree                                        | Replace `AskUserQuestion` and Claude invocation semantics; retain safety review.                                                           |
| watzup                                          | Adapt Git inspection to repositories without commits and OpenCode tools.                                                                   |
| retro                                           | Avoid automatic report writes and fixed `plans/reports` paths.                                                                             |
| media-processing / ai-multimodal / ai-artist    | Remove provider, Gemini, `.claude`, and skill-chain assumptions; verify binaries and privacy before use.                                   |
| design / copywriting                            | Remove `.claude` paths and Claude prompts; only port if product work requires them.                                                        |
| find-skills                                     | Do not install from external catalogs without owner approval and provenance review.                                                        |
| document skills (`pdf`, `docx`, `xlsx`, `pptx`) | Verify binaries/libraries, output behavior, and visual-inspection assumptions.                                                             |
| official skill-creator / MCP skills             | Replace Claude plugin packaging/configuration and use OpenCode V2 skill conventions.                                                       |

Deferred B-class integrations with no present FIG need: `gkg`, `llms`, `mintlify`, `stitch`.

## C — REWRITE_FOR_OPEN_CODE

| Skill                                                              | Useful idea                             | Why direct port is invalid                                                                                       |
| ------------------------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| project-management                                                 | Synchronize tasks and project state.    | Built around Claude Tasks and `TodoWrite`; FIG replaces it with task packets and `fig-project-control`.          |
| project-organization                                               | Keep outputs discoverable.              | Coupled to ClaudeKit report lifecycle; FIG uses canonical docs and explicit requested outputs.                   |
| ck-plan                                                            | Structured planning and challenge.      | Uses `/ck:*`, tasks, active-plan state, and `AskUserQuestion`.                                                   |
| cook                                                               | Implementation orchestration.           | Depends on Tasks, subagent types, `TodoWrite`, and journal chaining.                                             |
| test                                                               | Select and coordinate test work.        | Depends on Tasks, `SendMessage`, and project-organization chaining; replaced by `testing-verification`.          |
| ck-debug                                                           | Reproduce and isolate failures.         | Uses native Claude Tasks and `/ck:scout`; replaced by `debugging`.                                               |
| code-review                                                        | Multi-perspective review.               | Uses Claude tasks/subagents and `/ck:ship`; FIG may add a focused review skill later.                            |
| deploy                                                             | Deployment workflow.                    | Uses Claude prompts/cross-skills and is too dangerous/general for current FIG scope.                             |
| git                                                                | Git workflow.                           | Contains `.claude` rules and prompt APIs; existing OpenCode/Git tools suffice.                                   |
| brainstorm / ask                                                   | Requirements dialogue.                  | `$ARGUMENTS`, `AskUserQuestion`, rules directories, and command chaining.                                        |
| research / scout                                                   | Search and research.                    | `.ck.json`, Gemini/model assumptions, task orchestration, and output conventions.                                |
| skill-creator                                                      | Skill authoring.                        | Hardcodes `.claude/skills`, Claude documentation, and command chaining. Use OpenCode V2 docs instead.            |
| docs / journal                                                     | Documentation workflows.                | Command routers and automatic report conventions. FIG project control covers durable updates.                    |
| preview / markdown-novel-viewer / plans-kanban / kanban            | Preview/task boards.                    | Fixed `.claude` paths, background shell semantics, and command routers; unnecessary for source-of-truth control. |
| ck-autoresearch / ck-loop / ck-predict / ck-scenario / ck-security | Potential iterative analysis workflows. | Claude command parsing, prompt APIs, hidden state, and runtime-specific loops.                                   |
| official session-report                                            | Session recovery/reporting.             | Reads Claude transcripts from `~/.claude/projects`; FIG recovers from documents/Git.                             |
| official claude-md-improver                                        | Improve instruction files.              | Targets Claude-specific files; any future equivalent must preserve `AGENTS.md` canonicality.                     |

## D — DO_NOT_PORT

| Skill/source                                                      | Reason                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| bootstrap                                                         | Thin router to other `/ck:*` commands; little standalone value.                                   |
| coding-level                                                      | Only edits `.claude/.ck.json`.                                                                    |
| fix                                                               | Duplicates a native FIG debugging workflow while being deeply Claude-orchestrated.                |
| mcp-management                                                    | Manages `.claude/.mcp.json` and Gemini symlinks.                                                  |
| ship                                                              | ClaudeKit release router; FIG has a focused release audit and no automatic release action.        |
| team                                                              | Requires Claude Agent Teams, model tiers, team storage, and experimental environment variables.   |
| template-skill                                                    | Placeholder.                                                                                      |
| use-mcp                                                           | Primarily invokes Gemini via `.ck.json`; not a general MCP workflow.                              |
| official plugin structure/settings/hook/command/agent development | Documents Claude plugin runtime, `${CLAUDE_PLUGIN_ROOT}`, hooks, slash commands, and model names. |
| official Claude automation/hookify                                | Explicitly configures Claude Code hooks and `.claude` layouts.                                    |
| project-artifact                                                  | Requires Claude's Artifact tool and claude.ai publication.                                        |
| official examples                                                 | Example material, not production workflows.                                                       |
| Telegram/Discord/iMessage channel skills                          | Manage `~/.claude/channels` and `$ARGUMENTS`; unrelated to FIG.                                   |
| hardware-specific CWC skills                                      | External hardware/plugin workflows unrelated to FIG milestones.                                   |

## Selected FIG-native catalog

Created under `.opencode/skills/`:

1. `fig-project-control`
2. `fig-architecture`
3. `fig-web-ui`
4. `workout-domain`
5. `nutrition-domain`
6. `database-migration`
7. `testing-verification`
8. `release-audit`
9. `debugging`

These skills contain workflows only. Product truth remains in project documents. They assume no Claude hooks, slash commands, task APIs, model tiers, or `.claude` state.

## Port policy

Any future port must use skill-relative paths, inspect project manifests first, avoid implicit installs and writes, preserve license/attribution, remove model/provider assumptions, describe tools by capability, and be tested in the actual OpenCode V2 runtime. A skill is not adopted merely because it exists in a source catalog.
