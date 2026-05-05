# ptarmigan - AI Agent Pipeline

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/junai-labs.ptarmigan?label=Marketplace&color=4c1)](https://marketplace.visualstudio.com/items?itemName=junai-labs.ptarmigan)
[![VS Code Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/junai-labs.ptarmigan?label=Installs)](https://marketplace.visualstudio.com/items?itemName=junai-labs.ptarmigan)
[![VS Code Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/junai-labs.ptarmigan?label=Rating)](https://marketplace.visualstudio.com/items?itemName=junai-labs.ptarmigan)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.md)

Agentic engineering for GitHub Copilot with deterministic workflow orchestration.

ptarmigan provides:
- 25 specialist agents
- 9 MCP tools
- deterministic pipeline routing (`supervised`, `assisted`, `autopilot`)
- profile + recipe aware project setup for public/open-source workflows

## Why ptarmigan

ptarmigan helps teams move from ad-hoc prompting to repeatable delivery:
- **Deterministic routing:** stage-aware flow instead of random context hopping.
- **Clear safety model:** low/medium/high risk action tiers with approval boundaries.
- **Portable project setup:** installs agent/runtime resources directly into your workspace.
- **Public-profile defaults:** optimized for open-source and public repository work.

## Requirements

- VS Code `^1.101.0`
- GitHub Copilot Chat enabled
- `uv` available on PATH (for MCP server runtime)

## Quick start

1. Install **ptarmigan** from VS Code Marketplace.
2. Open your target workspace.
3. Run command palette action: `ptarmigan: Initialize Agent Pipeline`.
4. Choose your default mode (`supervised` recommended initially).
5. Open Copilot Chat and start with `@Orchestrator`.

## Commands

ptarmigan contributes these commands:

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

## Configuration

Key settings:

- `junai.defaultMode`
- `junai.autoInitializeOnActivation`
- `junai.avoidUserLevelRuntimeDuplication`
- `junai.avoidClaudeRuleDuplication`
- `junai.promptDuplicateRuntimeCleanup`
- `junai.experimental.coordinator`
- `junai.experimental.dream`
- `junai.experimental.deepPlan`
- `junai.experimental.proactive`

## Publishing note

- Marketplace publisher: `junai-labs`
- Extension ID: `junai-labs.ptarmigan`
- Versioning follows `package.json`.
- Release/publish runbook: see [`PUBLISHING.md`](./PUBLISHING.md)

## Support

- Issues: https://github.com/saajunaid/ptarmigan/issues
- Repository: https://github.com/saajunaid/ptarmigan
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
