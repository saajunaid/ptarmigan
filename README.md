<div align="center">

# ptarmigan — AI Agent Delivery System

### Lean, deterministic agentic delivery for Enterprise teams

**A focused, auditable multi-agent delivery system for GitHub Copilot — optimized for the minimum resource set that still runs deterministic stage orchestration with confidence.**

[![Marketplace](https://img.shields.io/badge/Marketplace-junai--labs.ptarmigan-007ACC.svg?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=junai-labs.ptarmigan)
[![Profile](https://img.shields.io/badge/Profile-lean%20public%20lane-22c55e.svg?style=for-the-badge)](https://github.com/saajunaid/ptarmigan)
[![License](https://img.shields.io/badge/License-MIT-22c55e.svg?style=for-the-badge)](https://github.com/saajunaid/ptarmigan/blob/HEAD/LICENSE.md)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.101%2B-007ACC.svg?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com)
[![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-required-6e40c9.svg?style=for-the-badge&logo=github)](https://github.com/features/copilot)

</div>

---

## What is ptarmigan?

ptarmigan is the **lean public lane** of the junai ecosystem.

It keeps the delivery system deterministic and production-disciplined while trimming the resource surface for open-source/public workflows:

- curated specialist agents
- curated skills/instructions/prompts
- explicit stage routing + quality gates
- resources pool deployment and updates
- recipe-driven setup for repeatable project patterns
- full repo-local audit trail (`pipeline-state.json` + artefacts)

### How ptarmigan compares

| Feature | ptarmigan | Generic AI Chat |
|---|---|---|
| Deterministic stage routing | Yes | No |
| Specialist agent orchestration | Yes | No |
| Explicit gates (plan/test/review) | Yes | No |
| Repo-local state + artefacts | Yes | No |
| Lean curated runtime profile | Yes | N/A |

---

## Agentic delivery map (TDD-aware)

![ptarmigan agentic delivery flow](https://raw.githubusercontent.com/saajunaid/ptarmigan/main/assets/ptarmigan-agentic-flow.png)

Flow source (editable): [`assets/ptarmigan-agentic-flow.svg`](./assets/ptarmigan-agentic-flow.svg)

```text
Intent
	↓
Initialize Delivery System
	↓
@Orchestrator
	↓
Planner ──[Plan Approved?]──No──> Refine plan ─┐
	│                                             │
	└──Yes────────────────────────────────────────┘
	↓
Implement (start with/update tests first)
	↓
Tester ──[Tests Pass?]──No──> Fix code/tests ───┐
	│                                              │
	└──Yes─────────────────────────────────────────┘
	↓
Code Reviewer ──[Review Approved?]──No──> Address review feedback ─┐
	│                                                                 │
	└──Yes─────────────────────────────────────────────────────────────┘
	↓
Ship / Merge

TDD loop inside Implement + Tester: Red → Green → Refactor → Re-run tests
```

### Mode behavior

| Mode | Behavior | Best for |
|---|---|---|
| `supervised` | Explicit human gate approvals | High-safety workflows |
| `assisted` | Guided progression with approvals at key points | Day-to-day development |
| `autopilot` | Autonomous stage progression after intent confirmation | Well-scoped, trusted tasks |

---

## Quick start

1. Install from Marketplace.
2. Run `ptarmigan: Initialize Agent Pipeline`.
3. Choose pipeline mode.
4. Start in Copilot Chat with `@Orchestrator` and your feature goal.

---

## Recipes: what they are and how to use them

A **recipe** is a reusable delivery blueprint that configures how ptarmigan should scaffold and guide work for a project type.

Think of it as:

- **intent template**: defines the default implementation playbook for a domain
- **resource selector**: helps align agents/skills/prompts to a project context
- **consistency layer**: keeps team workflows repeatable across repos

Use recipes when you want predictable setup for similar projects (for example dashboard-heavy work, API-first work, or migration workflows).

### How to use recipes

1. Initialize the delivery system with `ptarmigan: Initialize Agent Pipeline`.
2. Run `ptarmigan: Set Recipe`.
3. Pick a recipe from `.github/recipes/*.recipe.md`.
4. The selected recipe is written to `project-config.md` and used by routing/planning flows.

### When to change recipes

- Your project scope changed (e.g., from prototype to production hardening).
- You want different defaults for planning and execution behavior.
- You are standardizing multiple repos on the same delivery pattern.

---

## What gets installed

One command. Everything lands in your `.github/` folder and travels with your repo.

| Folder | What's inside |
|---|---|
| `agents/` | Curated specialist agent definitions for the public lane |
| `skills/` | Reusable skill modules (coding, workflow, docs, testing, and more) |
| `prompts/` | Workflow prompt templates (handoff, planning, review, etc.) |
| `instructions/` | Coding-convention instruction files loaded into Copilot context |
| `plans/` | Plan templates and planning scaffolds |
| `agent-docs/` | Artefact hub, schemas, and architecture references |
| `handoffs/` | Cross-stage handoff protocol files |
| `tools/` | MCP server resources (auto-registered) |

Plus at the root level:

| File | Purpose |
|---|---|
| `pipeline-state.json` | Live delivery-state ledger (stage, mode, gates, routing, artefacts) |
| `copilot-instructions.md` | Project context file with a junai-managed sentinel section |
| `.vscode/mcp.json` | MCP server registration for VS Code |

---

## Commands

| Command | What it does |
|---|---|
| `ptarmigan: Initialize Agent Pipeline` | Install delivery-system resources and configure MCP wiring |
| `ptarmigan: Initialize Agent Pool` | Install/update pool resources without full pipeline init |
| `ptarmigan: Update Agent Pool` | Pull latest pool resources while preserving project state |
| `ptarmigan: Show Pipeline Status` | Show current stage, mode, and gate state |
| `ptarmigan: Set Pipeline Mode` | Switch supervised / assisted / autopilot mode |
| `ptarmigan: Select Project Profile` | Set the active project profile in config |
| `ptarmigan: Set Recipe` | Select/update recipe from available recipe files |
| `ptarmigan: Clean Up Duplicate Workspace Runtimes` | Remove duplicate workspace runtime folders safely |
| `ptarmigan: Probe Autopilot Chat Commands (dry run)` | Validate autopilot command wiring without mutating state |
| `ptarmigan: Run Coordinator Mode (experimental)` | Run experimental parallel coordination mode |
| `ptarmigan: Deep Plan: Build Structured Plan (experimental)` | Generate structured planning output in experimental mode |
| `ptarmigan: Remove from this project` | Clean uninstall of pool resources from the workspace |

---

## Extension settings

| Setting | Default | Description |
|---|---|---|
| `junai.defaultMode` | `supervised` | Default delivery mode used for new projects. |
| `junai.autoInitializeOnActivation` | `prompt` | Control first-open behavior: prompt, always, or never initialize automatically. |
| `junai.avoidUserLevelRuntimeDuplication` | `true` | Skip deploying workspace `.claude`/`.codex` runtime bundles when matching user-level runtimes exist. |
| `junai.avoidClaudeRuleDuplication` | `true` | Skip workspace `.claude/rules` when `.github/instructions` already exists to reduce duplicate instruction surfaces. |
| `junai.promptDuplicateRuntimeCleanup` | `true` | Show one-time prompt to archive legacy duplicate runtime folders. |
| `junai.experimental.coordinator` | `false` | Enable Coordinator Mode (experimental). |
| `junai.experimental.dream` | `false` | Enable Dream Memory Consolidation (experimental). |
| `junai.experimental.deepPlan` | `false` | Enable Deep Plan Mode (experimental). |
| `junai.experimental.proactive` | `false` | Enable KAIROS-lite proactive notifications (experimental). |

---

## Publishing notes

- Publisher: `junai-labs`
- Extension ID: `junai-labs.ptarmigan`
- Version source: `package.json`
- Maintainer runbook: [`PUBLISHING.md`](./PUBLISHING.md)

## Support

- Issues: https://github.com/saajunaid/ptarmigan/issues
- Repository: https://github.com/saajunaid/ptarmigan
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
