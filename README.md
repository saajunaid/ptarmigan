<div align="center">

# ptarmigan — AI Agent Pipeline

### Lean, deterministic agentic delivery for public/open-source teams

**A focused, auditable multi-agent workflow for GitHub Copilot — optimized for the minimum resource set that still runs the full pipeline with confidence.**

[![Marketplace](https://img.shields.io/badge/Marketplace-junai--labs.ptarmigan-007ACC.svg?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=junai-labs.ptarmigan)
[![Profile](https://img.shields.io/badge/Profile-lean%20public%20lane-22c55e.svg?style=for-the-badge)](https://github.com/saajunaid/ptarmigan)
[![License](https://img.shields.io/badge/License-MIT-22c55e.svg?style=for-the-badge)](https://github.com/saajunaid/ptarmigan/blob/HEAD/LICENSE.md)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.101%2B-007ACC.svg?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com)
[![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-required-6e40c9.svg?style=for-the-badge&logo=github)](https://github.com/features/copilot)

</div>

---

## What is ptarmigan?

ptarmigan is the **lean public lane** of the junai ecosystem.

It keeps the pipeline deterministic and production-disciplined while trimming the resource surface for open-source/public workflows:

- curated specialist agents
- curated skills/instructions/prompts
- explicit stage routing + quality gates
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

## Agentic development flow (TDD-aware)

```text
Intent
	↓
Initialize Pipeline
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
| `pipeline-state.json` | Live pipeline state (stage, mode, gates, routing, artefacts) |
| `copilot-instructions.md` | Project context file with a junai-managed sentinel section |
| `.vscode/mcp.json` | MCP server registration for VS Code |

---

## Commands

| Command | What it does |
|---|---|
| `ptarmigan: Initialize Agent Pipeline` | Install pipeline resources and configure MCP wiring |
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
| `junai.defaultMode` | `supervised` | Default pipeline mode used for new projects. |
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
