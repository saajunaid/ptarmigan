<div align="center">

# ptarmigan

### Structured agentic delivery for GitHub Copilot

**Test-first. Gate-guarded. Auditable from intent to ship.**

[![Marketplace](https://img.shields.io/badge/VS%20Marketplace-junai--labs.ptarmigan-007ACC.svg?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=junai-labs.ptarmigan)
[![License](https://img.shields.io/badge/License-MIT-22c55e.svg?style=for-the-badge)](https://github.com/saajunaid/ptarmigan/blob/HEAD/LICENSE.md)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.101%2B-007ACC.svg?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com)
[![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-required-6e40c9.svg?style=for-the-badge&logo=github)](https://github.com/features/copilot)

</div>

---

<div align="center">
<img src="https://raw.githubusercontent.com/saajunaid/junai-vscode/main/media/ptarmigan-agentic-flow.png" width="900" alt="ptarmigan agentic delivery flow"/>
</div>

---

## What ptarmigan does

Most AI coding tools give you a capable assistant. ptarmigan gives you a **delivery system**.

Every feature request moves through an explicit, gated pipeline: plan approval, preflight validation, a TDD implementation loop, code review, and a final ship gate. Each stage is handled by a specialist agent. Nothing advances without passing the gate before it.

The result is AI-assisted development that stays disciplined — no hallucinated paths, no skipped tests, no review-free merges.

---

## The pipeline at a glance

| Stage | Agent | Gate |
|---|---|---|
| Capture intent | `@Orchestrator` | — |
| Plan the work | `@Planner` | ✅ Plan Approved? |
| Validate plan vs codebase | `@Preflight` | ✅ Plan Validated? |
| Implement (tests first) | `@Implement` | — |
| Run and fix tests | `@Tester` | ✅ Tests Pass? |
| Review the change | `@Code Reviewer` | ✅ Review Approved? |
| Ship | — | ✅ Done |

Every gate is explicit. In `supervised` mode you approve each one personally. In `assisted` mode the pipeline pauses only at critical checkpoints. In `autopilot` mode it runs end-to-end after your initial confirmation.

---

## TDD is built in — not bolted on

ptarmigan enforces a **Red → Green → Refactor** loop inside every implementation stage:

1. `@Implement` writes or updates tests **before** writing production code.
2. `@Tester` runs the suite — failures loop back to `@Implement` automatically.
3. Only a **green suite** advances to `@Code Reviewer`.

This means every feature ships with tests. Every bug fix ships with a regression test that proves the fix. The pipeline makes the right thing the default thing.

---

## Preflight — catch plan failures before they waste agent time

Before any implementation begins, the **Preflight** stage validates your plan against the actual codebase:

- Are the API endpoints referenced in the plan real?
- Do the type names and field paths exist?
- Are the file paths and import targets accurate?
- Are there dependency gaps or version conflicts?

Preflight runs **8 validation categories** across 3 passes and classifies findings as `CRITICAL`, `SIGNIFICANT`, `MINOR`, or `WARN`. A plan with a `CRITICAL` finding does not advance. This single gate eliminates the most common cause of failed agent sessions — stale or wrong assumptions baked into the plan.

---

## Three delivery modes

Choose the right level of autonomy for your work:

| Mode | How it works | Best for |
|---|---|---|
| `supervised` | Every gate requires your explicit approval | High-stakes production changes, regulated environments |
| `assisted` | Progresses automatically; pauses at plan and review gates | Day-to-day feature development |
| `autopilot` | Runs end-to-end after initial intent confirmation | Well-scoped, low-risk, or repeatable tasks |

Switch modes at any time: `ptarmigan: Set Pipeline Mode`.

---

## Getting started in 4 steps

```
1. Install ptarmigan from the VS Code Marketplace
2. Run:  ptarmigan: Initialize Agent Pipeline
3. Choose a delivery mode (supervised / assisted / autopilot)
4. Open Copilot Chat and type:  @Orchestrator <your feature goal>
```

The `@Orchestrator` agent reads your `pipeline-state.json`, routes your intent to the right specialist, and manages stage transitions from there.

---

## Recipes — repeatable project playbooks

A **recipe** is a delivery blueprint for a project type. It pre-configures the agent pool, planning defaults, and implementation priorities for a domain (dashboards, API services, migration work, etc.).

**To apply a recipe:**

1. Run `ptarmigan: Set Recipe`
2. Pick from `.github/recipes/*.recipe.md`
3. The selection is written to `project-config.md` and flows into all planning and routing decisions

Recipes give teams a consistent starting point across repos — same structure, same gates, same quality expectations.

---

## What gets installed

One command installs everything into `.github/` — it travels with your repo and works immediately on any machine.

**Agents**

| Agent | Role |
|---|---|
| `@Orchestrator` | Pipeline brain — reads state, routes between agents, manages gates |
| `@Planner` | Produces structured implementation plans with phases and acceptance criteria |
| `@Preflight` | Validates plans against the real codebase before implementation |
| `@Implement` | Writes tests first, then production code — enforces TDD discipline |
| `@Tester` | Runs the suite, triages failures, loops back to Implement on red |
| `@Code Reviewer` | Reviews for correctness, security, performance, and coding standards |

**Supporting resources**

| Folder | Contents |
|---|---|
| `skills/` | Domain skill packs — TDD, code review, security, refactoring, architecture, and more |
| `instructions/` | Coding-convention files auto-loaded into Copilot context |
| `prompts/` | Handoff, planning, and review prompt templates |
| `agent-docs/` | Artefact schemas and architecture references |
| `tools/` | MCP server (auto-registered at `.vscode/mcp.json`) |
| `pipeline-state.json` | Live ledger — current stage, mode, gate states, and artefacts |

---

## Commands

| Command | What it does |
|---|---|
| `ptarmigan: Initialize Agent Pipeline` | Full install — agents, skills, MCP wiring, pipeline state |
| `ptarmigan: Initialize Agent Pool` | Install or refresh pool resources only |
| `ptarmigan: Update Agent Pool` | Pull latest pool updates, preserve project state |
| `ptarmigan: Show Pipeline Status` | Current stage, mode, gate states at a glance |
| `ptarmigan: Set Pipeline Mode` | Switch supervised / assisted / autopilot |
| `ptarmigan: Set Recipe` | Select a delivery recipe for your project type |
| `ptarmigan: Select Project Profile` | Set the active profile in `project-config.md` |
| `ptarmigan: Clean Up Duplicate Workspace Runtimes` | Safe removal of legacy duplicate runtime folders |
| `ptarmigan: Remove from this project` | Clean uninstall — removes all pool resources |

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `junai.defaultMode` | `supervised` | Delivery mode for new projects |
| `junai.autoInitializeOnActivation` | `prompt` | First-open behavior: prompt, always, or never |
| `junai.avoidUserLevelRuntimeDuplication` | `true` | Skip workspace runtime bundles when user-level equivalents exist |
| `junai.avoidClaudeRuleDuplication` | `true` | Skip `.claude/rules` when `.github/instructions` already covers them |
| `junai.promptDuplicateRuntimeCleanup` | `true` | One-time prompt to archive legacy duplicate folders |

---

## Support

- Issues: [github.com/saajunaid/ptarmigan/issues](https://github.com/saajunaid/ptarmigan/issues)
- Repository: [github.com/saajunaid/ptarmigan](https://github.com/saajunaid/ptarmigan)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
