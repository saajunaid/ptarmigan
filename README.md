# ptarmigan - AI Agent Pipeline

[![Marketplace](https://img.shields.io/badge/Marketplace-junai--labs.ptarmigan-007ACC.png?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=junai-labs.ptarmigan)
[![Profile](https://img.shields.io/badge/Profile-lean%20public%20lane-22c55e.png?style=flat-square)](https://github.com/saajunaid/ptarmigan)
[![License: MIT](https://img.shields.io/badge/License-MIT-2563eb.svg)](./LICENSE.md)

**Build software with agents like an engineering team, not a single chat tab.**

ptarmigan turns GitHub Copilot into a structured agentic delivery pipeline for public/open-source development, with deterministic stage routing, explicit quality gates, and auditable artefacts.

## What makes ptarmigan powerful

- **Deterministic orchestration**: explicit stage transitions, no random agent drift.
- **Specialist agent roles**: planning, implementation, testing, and review lanes.
- **Mode-aware execution**: `supervised`, `assisted`, or `autopilot`.
- **Portable workspace runtime**: pipeline context lives in your repo and travels with it.
- **Lean profile by design**: minimal curated resources needed for pipeline reliability.

## Agentic development flow

Use this flow to run feature delivery with repeatability and strong feedback loops:

```mermaid
flowchart TD
	A[Define feature intent] --> B[Initialize pipeline in workspace]
	B --> C[@Orchestrator reads context + routes stage]
	C --> D[Planner creates scoped implementation plan]
	D --> E{Plan approved?}
	E -- No --> D
	E -- Yes --> F[Implement executes feature slice]
	F --> G[Tester validates behavior + regressions]
	G --> H{Tests pass?}
	H -- No --> F
	H -- Yes --> I[Code Reviewer validates quality + risk]
	I --> J{Review approved?}
	J -- No --> F
	J -- Yes --> K[Orchestrator closes stage chain]
	K --> L[Done: merge-ready artefacts]
```

## Quick start

1. Install **ptarmigan** from VS Code Marketplace.
2. Open your project workspace.
3. Run: `ptarmigan: Initialize Agent Pipeline`
4. Select pipeline mode (`supervised` is best for first run).
5. Open Copilot Chat and start with `@Orchestrator`.

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

## Core configuration

- `junai.defaultMode`
- `junai.autoInitializeOnActivation`
- `junai.avoidUserLevelRuntimeDuplication`
- `junai.avoidClaudeRuleDuplication`
- `junai.promptDuplicateRuntimeCleanup`
- `junai.experimental.coordinator`
- `junai.experimental.dream`
- `junai.experimental.deepPlan`
- `junai.experimental.proactive`

## Publishing and release

- Publisher: `junai-labs`
- Extension ID: `junai-labs.ptarmigan`
- Version source: `package.json`
- Maintainer runbook: [`PUBLISHING.md`](./PUBLISHING.md)

## Support

- Issues: https://github.com/saajunaid/ptarmigan/issues
- Repository: https://github.com/saajunaid/ptarmigan
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
