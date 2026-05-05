<div align="center">

<img src="https://raw.githubusercontent.com/saajunaid/ptarmigan/main/Ptarmigan.png" alt="ptarmigan" width="96"/>

# ptarmigan — AI Agent Pipeline

### Lean, deterministic agentic delivery for public/open-source teams

**A focused, auditable multi-agent workflow for GitHub Copilot — optimized for the minimum resource set that still runs the full pipeline with confidence.**

[![Marketplace](https://img.shields.io/badge/Marketplace-junai--labs.ptarmigan-007ACC.png?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=junai-labs.ptarmigan)
[![Profile](https://img.shields.io/badge/Profile-lean%20public%20lane-22c55e.png?style=flat-square)](https://github.com/saajunaid/ptarmigan)
[![License](https://img.shields.io/badge/license-MIT-22c55e.png?style=flat-square)](./LICENSE.md)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.101%2B-007ACC.png?style=flat-square)](https://code.visualstudio.com)

</div>

---

## What is ptarmigan?

ptarmigan is the **lean public lane** of the junai ecosystem.

It keeps the pipeline deterministic and production-disciplined while trimming the resource surface for open-source/public workflows:

- curated specialist agents
- curated skills/instructions/prompts
- explicit stage routing + quality gates
- full repo-local audit trail (`pipeline-state.json` + artefacts)

## How ptarmigan compares

| Feature | ptarmigan | Generic AI chat |
|---|---|---|
| Deterministic stage routing | Yes | No |
| Specialist agent orchestration | Yes | No |
| Explicit gates (plan/test/review) | Yes | No |
| Repo-local state + artefacts | Yes | No |
| Lean curated runtime profile | Yes | N/A |

---

## Agentic development flow (recommended)

![Ptarmigan agentic development flow](https://raw.githubusercontent.com/saajunaid/ptarmigan/main/assets/ptarmigan-agentic-flow.png)

### Mode behavior

| Mode | Behavior | Best for |
|---|---|---|
| `supervised` | explicit human gate approvals | high-safety workflows |
| `assisted` | guided progression with approvals at key points | day-to-day development |
| `autopilot` | autonomous stage progression after intent confirmation | well-scoped, trusted tasks |

---

## Quick start

1. Install from Marketplace.
2. Run `ptarmigan: Initialize Agent Pipeline`.
3. Choose pipeline mode.
4. Start in Copilot Chat with `@Orchestrator` and your feature goal.

## Command palette actions

- `ptarmigan: Initialize Agent Pipeline`
- `ptarmigan: Initialize Agent Pool`
- `ptarmigan: Update Agent Pool`
- `ptarmigan: Remove from this project`
- `ptarmigan: Show Pipeline Status`
- `ptarmigan: Set Pipeline Mode`
- `ptarmigan: Select Project Profile`
- `ptarmigan: Set Recipe`
- `ptarmigan: Clean Up Duplicate Workspace Runtimes`
- `ptarmigan: Probe Autopilot Chat Commands (dry run)`
- `ptarmigan: Run Coordinator Mode (experimental)`
- `ptarmigan: Deep Plan: Build Structured Plan (experimental)`

## Core settings

- `junai.defaultMode`
- `junai.autoInitializeOnActivation`
- `junai.avoidUserLevelRuntimeDuplication`
- `junai.avoidClaudeRuleDuplication`
- `junai.promptDuplicateRuntimeCleanup`
- `junai.experimental.coordinator`
- `junai.experimental.dream`
- `junai.experimental.deepPlan`
- `junai.experimental.proactive`

## Publishing notes

- Publisher: `junai-labs`
- Extension ID: `junai-labs.ptarmigan`
- Version source: `package.json`
- Maintainer runbook: [`PUBLISHING.md`](./PUBLISHING.md)

## Support

- Issues: https://github.com/saajunaid/ptarmigan/issues
- Repository: https://github.com/saajunaid/ptarmigan
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
