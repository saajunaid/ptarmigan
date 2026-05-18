"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode4 = __toESM(require("vscode"));
var fs4 = __toESM(require("fs"));
var path4 = __toESM(require("path"));
var os = __toESM(require("os"));
var import_child_process = require("child_process");

// src/featureFlags.ts
var vscode = __toESM(require("vscode"));
var CONFIG_SECTION = "ptarmigan.experimental";
var FEATURE_MANIFEST = [
  {
    flag: "coordinator",
    label: "Coordinator Mode",
    statusLabel: "Coordinator Mode",
    description: "Fan out structured read-only investigation tasks and synthesize the findings.",
    implemented: true,
    commandId: "ptarmigan.coordinate"
  },
  {
    flag: "dream",
    label: "Dream Memory",
    statusLabel: "Dream Memory",
    description: "Consolidate durable insights from coordinator runs into lightweight workspace memory.",
    implemented: true
  },
  {
    flag: "deepPlan",
    label: "Deep Plan",
    statusLabel: "Deep Plan",
    description: "Generate a structured, approval-ready implementation plan from task inputs and workspace signals.",
    implemented: true,
    commandId: "ptarmigan.deepPlan"
  },
  {
    flag: "proactive",
    label: "Proactive Assistant",
    statusLabel: "Proactive Assistant",
    description: "Surface low-noise notices for important runtime events using popup, status-bar, or log output.",
    implemented: true
  }
];
function isFeatureEnabled(flag) {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return config.get(flag, false);
}
function getAllFlags() {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return {
    coordinator: config.get("coordinator", false),
    dream: config.get("dream", false),
    deepPlan: config.get("deepPlan", false),
    proactive: config.get("proactive", false)
  };
}
function getExperimentalFeatureManifest() {
  return FEATURE_MANIFEST;
}
function getExperimentalFeatureStatus() {
  const flags = getAllFlags();
  return FEATURE_MANIFEST.map((feature) => ({
    ...feature,
    enabled: flags[feature.flag]
  }));
}
function requireFeature(flag) {
  if (!isFeatureEnabled(flag)) {
    const msg = `This feature requires enabling "ptarmigan.experimental.${flag}" in settings.`;
    vscode.window.showWarningMessage(msg);
    throw new Error(msg);
  }
}

// src/permissions.ts
var ACTION_CLASSIFICATIONS = [
  { action: "init", tier: "medium", description: "Writes project scaffolding and MCP configuration into the workspace." },
  { action: "selectProfile", tier: "low", description: "Updates the active project profile in project-config.md." },
  { action: "status", tier: "low", description: "Reads pipeline state and reports current status." },
  { action: "setMode", tier: "medium", description: "Modifies pipeline execution mode in pipeline-state.json." },
  { action: "remove", tier: "high", description: "Deletes ptarmigan-managed runtime files from the workspace." },
  { action: "cleanupDuplicateRuntimes", tier: "high", description: "Archives duplicate runtime folders to prevent duplicated agents." },
  { action: "update", tier: "medium", description: "Refreshes bundled runtime resources in the workspace." },
  { action: "initPool", tier: "medium", description: "Deploys the agent pool without pipeline state." },
  { action: "setRecipe", tier: "low", description: "Updates the recipe selection in project-config.md." },
  { action: "probeAutopilot", tier: "low", description: "Enumerates chat commands for diagnostic purposes." },
  { action: "coordinate", tier: "low", description: "Runs a read-only coordinator investigation over the workspace." },
  { action: "deepPlan", tier: "low", description: "Generates a structured implementation plan from workspace context." }
];
function getAllClassifications() {
  return [...ACTION_CLASSIFICATIONS];
}

// src/eventBus.ts
var _JunaiEventBus = class _JunaiEventBus {
  constructor() {
    this.listeners = /* @__PURE__ */ new Set();
    this.recentEvents = [];
    this.maxRecentEvents = 100;
  }
  static getInstance() {
    if (!_JunaiEventBus.instance) {
      _JunaiEventBus.instance = new _JunaiEventBus();
    }
    return _JunaiEventBus.instance;
  }
  emit(event) {
    this.recentEvents.push(event);
    if (this.recentEvents.length > this.maxRecentEvents) {
      this.recentEvents.splice(0, this.recentEvents.length - this.maxRecentEvents);
    }
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
      }
    }
  }
  onAny(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  getRecentEvents(limit = 20) {
    return this.recentEvents.slice(-limit).reverse();
  }
  dispose() {
    this.listeners.clear();
    this.recentEvents.length = 0;
    if (_JunaiEventBus.instance === this) {
      _JunaiEventBus.instance = null;
    }
  }
};
_JunaiEventBus.instance = null;
var JunaiEventBus = _JunaiEventBus;

// src/coordinator.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
function formatScope(workspaceRoot, scopePath) {
  const absolutePath = path.join(workspaceRoot, scopePath);
  if (!fs.existsSync(absolutePath)) {
    return `- ${scopePath}: missing`;
  }
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(absolutePath).slice(0, 8);
    return `- ${scopePath}: directory (${entries.length} sample entries: ${entries.join(", ") || "empty"})`;
  }
  return `- ${scopePath}: file (${stat.size} bytes)`;
}
async function executeWorker(worker, workspaceRoot) {
  try {
    const scopeSummary = worker.scopePaths.map((scopePath) => formatScope(workspaceRoot, scopePath)).join("\n");
    const output = [
      `Worker: ${worker.label}`,
      `Type: ${worker.type}`,
      `Prompt: ${worker.prompt}`,
      "Scope review:",
      scopeSummary || "- no scope paths supplied"
    ].join("\n");
    return {
      workerId: worker.id,
      workerType: worker.type,
      label: worker.label,
      status: "completed",
      output
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      workerId: worker.id,
      workerType: worker.type,
      label: worker.label,
      status: "failed",
      output: "",
      error: message
    };
  }
}
function synthesizeResults(workerResults) {
  return workerResults.map((result) => {
    if (result.status === "failed") {
      return `## ${result.label}

- Status: failed
- Error: ${result.error ?? "unknown error"}`;
    }
    return `## ${result.label}

- Status: completed

${result.output}`;
  }).join("\n\n");
}
async function coordinateCore(request, workspaceRoot) {
  const startedAt = Date.now();
  const workerResults = [];
  for (const worker of request.workers) {
    workerResults.push(await executeWorker(worker, workspaceRoot));
  }
  const completed = workerResults.filter((result) => result.status === "completed").length;
  const failed = workerResults.length - completed;
  const synthesizedOutput = [
    `# ${request.title}`,
    "",
    `Goal: ${request.goal}`,
    "",
    synthesizeResults(workerResults)
  ].join("\n");
  return {
    summary: {
      total: workerResults.length,
      completed,
      failed
    },
    totalDurationMs: Date.now() - startedAt,
    workerResults,
    synthesizedOutput
  };
}
async function coordinate(request, workspaceRoot) {
  requireFeature("coordinator");
  return coordinateCore(request, workspaceRoot);
}

// src/dreamMemory.ts
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
function dreamMemoryFile(workspaceRoot) {
  return path2.join(workspaceRoot, ".github", ".ptarmigan-dream-memory.json");
}
function defaultStore() {
  return {
    summary: {
      factCount: 0,
      runs: 0,
      lastUpdatedAt: (/* @__PURE__ */ new Date(0)).toISOString()
    },
    facts: []
  };
}
function loadStore(workspaceRoot) {
  const filePath = dreamMemoryFile(workspaceRoot);
  if (!fs2.existsSync(filePath)) {
    return defaultStore();
  }
  try {
    return JSON.parse(fs2.readFileSync(filePath, "utf8"));
  } catch {
    return defaultStore();
  }
}
function saveStore(workspaceRoot, store) {
  const filePath = dreamMemoryFile(workspaceRoot);
  fs2.mkdirSync(path2.dirname(filePath), { recursive: true });
  fs2.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf8");
}
var DreamMemoryService = class {
  constructor(workspaceRoot, eventBus, outputChannel) {
    this.eventBus = eventBus;
    this.outputChannel = outputChannel;
    this.workspaceRoot = workspaceRoot;
  }
  recordCoordinatorRun(run) {
    const store = loadStore(this.workspaceRoot);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const fact = {
      id: `run-${Date.now()}`,
      signal: "summary",
      summary: `${run.goal} (${run.summary.completed}/${run.summary.total} workers completed)`,
      updatedAt: now
    };
    store.facts.push(fact);
    store.summary = {
      factCount: store.facts.length,
      runs: store.summary.runs + 1,
      lastUpdatedAt: now
    };
    saveStore(this.workspaceRoot, store);
    this.outputChannel?.appendLine(`[${now}] Dream memory recorded coordinator run: ${run.goal}`);
    this.eventBus.emit({
      type: "memory-consolidated",
      timestamp: now,
      source: "dream-memory",
      severity: "success",
      title: "Dream memory updated",
      detail: fact.summary
    });
    return {
      factsAdded: [fact],
      factsUpdated: [],
      factsPruned: []
    };
  }
  dispose() {
  }
};
function createDreamMemoryService(workspaceRoot, eventBus, outputChannel) {
  return new DreamMemoryService(workspaceRoot, eventBus, outputChannel);
}
function readDreamMemorySummary(workspaceRoot) {
  const store = loadStore(workspaceRoot);
  return store.summary.runs > 0 ? store.summary : null;
}

// src/deepPlan.ts
var fs3 = __toESM(require("fs"));
var path3 = __toESM(require("path"));
function splitList(value) {
  if (!value) {
    return [];
  }
  return value.split(/[\n,]+/).map((entry) => entry.trim()).filter(Boolean);
}
function detectTechnologies(fileNames) {
  const technologies = /* @__PURE__ */ new Set();
  for (const name of fileNames) {
    const normalized = name.toLowerCase();
    if (normalized.endsWith(".ts") || normalized.endsWith(".tsx")) {
      technologies.add("TypeScript");
    }
    if (normalized.endsWith(".js") || normalized.endsWith(".jsx")) {
      technologies.add("JavaScript");
    }
    if (normalized.endsWith(".py")) {
      technologies.add("Python");
    }
    if (normalized.endsWith("package.json")) {
      technologies.add("Node.js");
      technologies.add("VS Code Extension");
    }
    if (normalized.endsWith("tsconfig.json")) {
      technologies.add("TypeScript Toolchain");
    }
  }
  return [...technologies];
}
function walkWorkspace(root, maxFiles = 60) {
  const collected = [];
  const queue = [""];
  while (queue.length > 0 && collected.length < maxFiles) {
    const current = queue.shift() ?? "";
    const absolute = path3.join(root, current);
    if (!fs3.existsSync(absolute)) {
      continue;
    }
    const entries = fs3.readdirSync(absolute, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".venv") {
        continue;
      }
      const relative2 = path3.join(current, entry.name);
      if (entry.isDirectory()) {
        if (relative2.split(path3.sep).length <= 3) {
          queue.push(relative2);
        }
        continue;
      }
      collected.push(relative2.replace(/\\/g, "/"));
      if (collected.length >= maxFiles) {
        break;
      }
    }
  }
  return collected;
}
function scanWorkspace(workspaceRoot) {
  const topLevelEntries = fs3.existsSync(workspaceRoot) ? fs3.readdirSync(workspaceRoot).slice(0, 20) : [];
  const detectedFiles = walkWorkspace(workspaceRoot);
  const detectedTechnologies = detectTechnologies(detectedFiles);
  return {
    workspaceRoot,
    topLevelEntries,
    detectedFiles,
    detectedTechnologies
  };
}
function scanResultToContextLines(scan) {
  return [
    `Workspace root: ${scan.workspaceRoot}`,
    `Top-level entries: ${scan.topLevelEntries.join(", ") || "none detected"}`,
    `Detected technologies: ${scan.detectedTechnologies.join(", ") || "none detected"}`,
    "Sample files:",
    ...scan.detectedFiles.slice(0, 20).map((file) => `- ${file}`)
  ];
}
function buildDeepPlanRequest(input) {
  return {
    taskSummary: input.taskSummary.trim(),
    scope: splitList(input.scopeInput),
    constraints: splitList(input.constraintsInput),
    contextReferences: input.contextReferences?.filter(Boolean) ?? [],
    requestedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createDeepPlanResult(request, scan) {
  const confidence = request.scope.length >= 2 || scan.detectedTechnologies.length >= 2 ? "high" : request.scope.length === 1 || scan.detectedTechnologies.length === 1 ? "medium" : "low";
  const scopeLabel = request.scope.join(", ") || "the relevant workspace files";
  const techLabel = scan.detectedTechnologies.join(", ") || "the detected project stack";
  return {
    confidence,
    phases: [
      {
        title: "Validate the current implementation surface",
        objective: `Confirm the files and entry points involved in ${request.taskSummary}.`,
        steps: [
          `Inspect ${scopeLabel} and verify how the current behavior is wired today.`,
          `Confirm the surrounding project context using ${techLabel}.`
        ]
      },
      {
        title: "Implement the smallest safe change",
        objective: "Make the targeted code change without broad refactors.",
        steps: [
          "Update the primary code path first, then adjust any supporting helpers that would otherwise drift out of sync.",
          "Preserve existing user-facing behavior unless the task explicitly requires a behavior change."
        ]
      },
      {
        title: "Validate and ship with confidence",
        objective: "Prove the change works before handing it off.",
        steps: [
          "Run compile, lint, or test validation relevant to the touched files.",
          "Re-check the original request against the final implementation to catch any missed edge cases."
        ]
      }
    ],
    risks: [
      request.scope.length === 0 ? "No explicit scope was provided, so adjacent files may still need verification before editing." : `Changes may need to stay aligned across: ${scopeLabel}.`,
      scan.detectedTechnologies.length === 0 ? "Technology signals were sparse; verify tooling expectations before relying on automation." : `Validation should match the detected stack: ${techLabel}.`
    ],
    nextAction: `Start by validating the current behavior in ${request.scope[0] ?? "the primary implementation file"} before making any code changes.`
  };
}
function renderDeepPlanMarkdown(request, result, scan) {
  const lines = [
    "# Deep Plan",
    "",
    `**Task**: ${request.taskSummary}`,
    `**Requested at**: ${request.requestedAt}`,
    `**Confidence**: ${result.confidence}`,
    "",
    "## Scope",
    "",
    ...request.scope.length > 0 ? request.scope.map((item) => `- ${item}`) : ["- Not explicitly provided"],
    "",
    "## Constraints",
    "",
    ...request.constraints.length > 0 ? request.constraints.map((item) => `- ${item}`) : ["- None provided"],
    "",
    "## Workspace signals",
    "",
    ...scanResultToContextLines(scan),
    "",
    "## Phases",
    ""
  ];
  for (const phase of result.phases) {
    lines.push(`### ${phase.title}`);
    lines.push("");
    lines.push(phase.objective);
    lines.push("");
    for (const step of phase.steps) {
      lines.push(`- ${step}`);
    }
    lines.push("");
  }
  lines.push("## Risks");
  lines.push("");
  for (const risk of result.risks) {
    lines.push(`- ${risk}`);
  }
  lines.push("");
  lines.push("## Next action");
  lines.push("");
  lines.push(result.nextAction);
  lines.push("");
  return lines.join("\n");
}
function persistDeepPlanMarkdown(workspaceRoot, markdown) {
  const plansDir = path3.join(workspaceRoot, ".github", "plans");
  fs3.mkdirSync(plansDir, { recursive: true });
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const outputPath = path3.join(plansDir, `deep-plan-${timestamp}.md`);
  fs3.writeFileSync(outputPath, markdown, "utf8");
  return outputPath;
}

// src/lmEnrich.ts
var vscode2 = __toESM(require("vscode"));
async function enrichPlanWithLM(request, result, scan, baseMarkdown) {
  let models;
  try {
    models = await vscode2.lm.selectChatModels({ family: "gpt-4o" });
    if (models.length === 0) {
      models = await vscode2.lm.selectChatModels();
    }
  } catch {
    return null;
  }
  if (models.length === 0) {
    return null;
  }
  const model = models[0];
  const contextBlock = scan ? scanResultToContextLines(scan).join("\n") : "No workspace scan available.";
  const systemPrompt = [
    "You are a senior software architect reviewing and enriching an implementation plan.",
    "The plan was generated algorithmically from user inputs and a workspace scan.",
    "Your job is to make the plan MORE SPECIFIC and ACTIONABLE for this particular codebase.",
    "",
    "Rules:",
    "- Reference actual files, directories, and technologies detected in the workspace context.",
    "- Add concrete implementation steps that reference the real project structure.",
    "- Flag any risks specific to the detected tech stack.",
    "- Keep the same markdown structure \u2014 add detail, do not reorganize.",
    "- Do NOT add generic advice. Every sentence must be grounded in the workspace context.",
    "- If the workspace context is too thin to add value, return the original plan unchanged.",
    "- Keep output concise \u2014 enriched plan should be 1.5x original length at most."
  ].join("\n");
  const userPrompt = [
    "## Workspace Context",
    contextBlock,
    "",
    "## Task",
    `Task: ${request.taskSummary}`,
    `Scope: ${request.scope.join(", ") || "not specified"}`,
    `Constraints: ${request.constraints.join(", ") || "none"}`,
    "",
    "## Algorithmic Plan (to enrich)",
    baseMarkdown
  ].join("\n");
  const messages = [
    vscode2.LanguageModelChatMessage.User(`${systemPrompt}

---

${userPrompt}`)
  ];
  try {
    const response = await model.sendRequest(messages, {}, new vscode2.CancellationTokenSource().token);
    const chunks = [];
    for await (const chunk of response.text) {
      chunks.push(chunk);
    }
    const enriched = chunks.join("");
    if (enriched.length > 100) {
      return enriched;
    }
    return null;
  } catch {
    return null;
  }
}

// src/proactiveAssistant.ts
var vscode3 = __toESM(require("vscode"));

// src/proactivePolicy.ts
var DEFAULT_OPTIONS = {
  popupCooldownMs: 3e4,
  statusCooldownMs: 1e4,
  statusDurationMs: 6e3
};
function createProactivePolicyState() {
  return {};
}
function evaluateProactiveEvent(event, state, options) {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const now = Date.now();
  const noticeKey = `${event.type}:${event.title}`;
  if (state.lastNoticeKey === noticeKey) {
    return { suppressedReason: "deduped" };
  }
  let surface = event.severity === "error" || event.severity === "warning" ? "popup" : event.severity === "success" ? "status" : "log";
  let downgradedFromPopup = false;
  let downgradedFromStatus = false;
  if (surface === "popup" && state.lastPopupAt && now - state.lastPopupAt < merged.popupCooldownMs) {
    surface = "status";
    downgradedFromPopup = true;
  }
  if (surface === "status" && state.lastStatusAt && now - state.lastStatusAt < merged.statusCooldownMs) {
    surface = "log";
    downgradedFromStatus = true;
  }
  state.lastNoticeKey = noticeKey;
  if (surface === "popup") {
    state.lastPopupAt = now;
  }
  if (surface === "status") {
    state.lastStatusAt = now;
  }
  return {
    notice: {
      kind: "event",
      title: event.title,
      detail: event.detail,
      severity: event.severity
    },
    surface,
    downgradedFromPopup,
    downgradedFromStatus
  };
}

// src/proactiveAssistant.ts
var DEFAULT_STATUS_DURATION_MS = 6e3;
var MAX_NOTICE_MESSAGE_CHARS = 220;
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function truncateMessage(value, maxChars) {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars - 1)}\u2026`;
}
function formatSurfaceMessage(notice) {
  const composed = notice.detail ? `${notice.title} \u2014 ${notice.detail}` : notice.title;
  return truncateMessage(composed, MAX_NOTICE_MESSAGE_CHARS);
}
var ProactiveAssistantService = class {
  constructor(eventBus, outputChannel, options) {
    this.eventBus = eventBus;
    this.outputChannel = outputChannel;
    this.policyState = createProactivePolicyState();
    this.unsubscribe = null;
    this.policyOptions = options;
    this.statusBarItem = vscode3.window.createStatusBarItem(vscode3.StatusBarAlignment.Left, 10);
    this.statusBarItem.hide();
    this.unsubscribe = this.eventBus.onAny((event) => {
      this.onEvent(event);
    });
    this.log("KAIROS-lite proactive assistant enabled (low-noise mode).");
  }
  onEvent(event) {
    const decision = evaluateProactiveEvent(event, this.policyState, this.policyOptions);
    if (!decision.notice || !decision.surface) {
      if (decision.suppressedReason === "deduped") {
        this.log(`suppressed duplicate notice for event ${event.type}`);
      }
      return;
    }
    const notice = decision.notice;
    const downgradeLabel = decision.downgradedFromPopup ? " (popup cooldown downgrade)" : decision.downgradedFromStatus ? " (status cooldown downgrade)" : "";
    this.log(`surface=${decision.surface}${downgradeLabel} | ${notice.title}`);
    if (decision.surface === "popup") {
      this.showPopupNotice(notice);
      return;
    }
    if (decision.surface === "status") {
      this.showStatusNotice(notice);
      return;
    }
    if (notice.detail) {
      this.log(notice.detail);
    }
  }
  showPopupNotice(notice) {
    const message = formatSurfaceMessage(notice);
    if (notice.severity === "warning" || notice.severity === "error") {
      void vscode3.window.showWarningMessage(message);
      return;
    }
    void vscode3.window.showInformationMessage(message);
  }
  showStatusNotice(notice) {
    const message = formatSurfaceMessage(notice);
    this.statusBarItem.text = `$(bell) ${truncateMessage(notice.title, 80)}`;
    this.statusBarItem.tooltip = message;
    this.statusBarItem.show();
    if (this.statusHideTimer) {
      clearTimeout(this.statusHideTimer);
    }
    const statusDurationMs = this.policyOptions?.statusDurationMs ?? DEFAULT_STATUS_DURATION_MS;
    this.statusHideTimer = setTimeout(() => {
      this.statusBarItem.hide();
      this.statusHideTimer = void 0;
    }, statusDurationMs);
  }
  log(message) {
    if (!this.outputChannel) {
      return;
    }
    this.outputChannel.appendLine(`[${nowIso()}] ${message}`);
  }
  dispose() {
    if (this.statusHideTimer) {
      clearTimeout(this.statusHideTimer);
      this.statusHideTimer = void 0;
    }
    this.statusBarItem.dispose();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
};
function createProactiveAssistantService(eventBus, outputChannel, options) {
  return new ProactiveAssistantService(eventBus, outputChannel, options);
}

// src/extension.ts
var JUNAI_SECTION_START = "<!-- junai:start \u2014 managed by junai extension, do not edit this section -->";
var JUNAI_SECTION_END = "<!-- junai:end -->";
var COPILOT_RUNTIME_DIR = ".github";
var CLAUDE_RUNTIME_DIR = ".claude";
var CODEX_RUNTIME_DIR = ".codex";
var dreamMemoryService = null;
var proactiveAssistantService = null;
var ALLOWED_WORKSPACE_RUNTIME_ENTRIES = {
  claude: /* @__PURE__ */ new Set(["skills", "rules"]),
  codex: /* @__PURE__ */ new Set(["skills"])
};
function getRuntimeDirName(runtimeName) {
  switch (runtimeName) {
    case "copilot":
      return COPILOT_RUNTIME_DIR;
    case "claude":
      return CLAUDE_RUNTIME_DIR;
    case "codex":
      return CODEX_RUNTIME_DIR;
  }
}
function hasUserLevelRuntimeTarget(runtimeName) {
  const home = os.homedir();
  switch (runtimeName) {
    case "copilot":
      return false;
    case "claude":
      return dirHasNonDotEntries(path4.join(home, CLAUDE_RUNTIME_DIR, "agents"));
    case "codex":
      return dirHasNonDotEntries(path4.join(home, CODEX_RUNTIME_DIR, "skills"));
  }
}
function dirHasNonDotEntries(dir) {
  if (!fs4.existsSync(dir)) {
    return false;
  }
  try {
    return fs4.readdirSync(dir).some((e) => !e.startsWith("."));
  } catch {
    return false;
  }
}
function shouldAvoidUserLevelRuntimeDuplication() {
  return vscode4.workspace.getConfiguration("ptarmigan").get("avoidUserLevelRuntimeDuplication", true);
}
function shouldAvoidClaudeRuleDuplication() {
  return vscode4.workspace.getConfiguration("ptarmigan").get("avoidClaudeRuleDuplication", true);
}
function hasGithubInstructionSurface(poolDir, targetFolder) {
  const workspaceInstructions = path4.join(targetFolder, COPILOT_RUNTIME_DIR, "instructions");
  const pooledInstructions = path4.join(poolDir, COPILOT_RUNTIME_DIR, "instructions");
  return fs4.existsSync(workspaceInstructions) || fs4.existsSync(pooledInstructions);
}
function shouldSkipClaudeRulesDeployment(poolDir, targetFolder) {
  return shouldAvoidClaudeRuleDuplication() && hasGithubInstructionSurface(poolDir, targetFolder);
}
function buildRuntimeBundleTargets(poolDir, targetFolder) {
  const avoidDuplication = shouldAvoidUserLevelRuntimeDuplication();
  const makeTarget = (runtimeName) => {
    const runtimeDir = getRuntimeDirName(runtimeName);
    const workspaceRoot = path4.join(targetFolder, runtimeDir);
    const poolRoot = path4.join(poolDir, runtimeDir);
    if (runtimeName === "copilot") {
      return { runtimeName, poolRoot, workspaceRoot, deploy: true };
    }
    const hasUserLevelRuntime = hasUserLevelRuntimeTarget(runtimeName);
    const deploy = !(avoidDuplication && hasUserLevelRuntime);
    return {
      runtimeName,
      poolRoot,
      workspaceRoot,
      deploy,
      skipReason: deploy ? void 0 : `matching user-level ${runtimeDir} runtime detected`
    };
  };
  return [
    makeTarget("copilot"),
    makeTarget("claude"),
    makeTarget("codex")
  ];
}
function formatRuntimeSkipNotice(skippedTargets) {
  if (skippedTargets.length === 0) {
    return "";
  }
  const runtimeList = skippedTargets.map((target) => target.workspaceRoot).map((workspacePath) => `\`${path4.basename(workspacePath)}\``).join(", ");
  return `Skipped workspace runtime deployment for ${runtimeList} because matching user-level runtimes were detected. Run \`ptarmigan: Clean Up Duplicate Workspace Runtimes\` to archive existing workspace duplicates. Set \`ptarmigan.avoidUserLevelRuntimeDuplication\` to \`false\` to force workspace deployment.`;
}
function formatClaudeRulesSkipNotice(skipClaudeRules) {
  if (!skipClaudeRules) {
    return "";
  }
  return "Skipped workspace `.claude/rules` deployment because `.github/instructions` is present, to avoid duplicate instruction surfaces. Set `ptarmigan.avoidClaudeRuleDuplication` to `false` to deploy Claude rules as well.";
}
function getRuntimeSignalPath(runtimeName, runtimeRoot) {
  const signalDir = runtimeName === "claude" ? "agents" : "skills";
  return path4.join(runtimeRoot, signalDir);
}
function getUserRuntimeSignalPath(runtimeName) {
  const runtimeRoot = path4.join(os.homedir(), getRuntimeDirName(runtimeName));
  return getRuntimeSignalPath(runtimeName, runtimeRoot);
}
function getDuplicateWorkspaceRuntimeTargets(targetFolder) {
  if (!shouldAvoidUserLevelRuntimeDuplication()) {
    return [];
  }
  const runtimeNames = ["claude", "codex"];
  const targets = [];
  for (const runtimeName of runtimeNames) {
    const workspaceRoot = path4.join(targetFolder, getRuntimeDirName(runtimeName));
    const workspaceSignalPath = getRuntimeSignalPath(runtimeName, workspaceRoot);
    const userSignalPath = getUserRuntimeSignalPath(runtimeName);
    if (!fs4.existsSync(workspaceSignalPath)) {
      continue;
    }
    if (!fs4.existsSync(userSignalPath)) {
      continue;
    }
    targets.push({ runtimeName, workspaceRoot, workspaceSignalPath, userSignalPath });
  }
  return targets;
}
function listUnsafeWorkspaceRuntimeEntries(target) {
  if (!fs4.existsSync(target.workspaceRoot)) {
    return [];
  }
  const allowedEntries = ALLOWED_WORKSPACE_RUNTIME_ENTRIES[target.runtimeName];
  return fs4.readdirSync(target.workspaceRoot, { withFileTypes: true }).map((entry) => entry.name).filter((name) => !SKIP.has(name)).filter((name) => !allowedEntries.has(name));
}
function cleanupDuplicateWorkspaceRuntimes(targetFolder) {
  const summary = { archived: [], skipped: [] };
  const targets = getDuplicateWorkspaceRuntimeTargets(targetFolder);
  if (targets.length === 0) {
    return summary;
  }
  let backupRoot;
  for (const target of targets) {
    const unsafeEntries = listUnsafeWorkspaceRuntimeEntries(target);
    if (unsafeEntries.length > 0) {
      summary.skipped.push({
        target,
        reason: `contains non-junai entries (${unsafeEntries.join(", ")})`
      });
      continue;
    }
    try {
      if (!backupRoot) {
        const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        backupRoot = path4.join(targetFolder, ".junai-backups", `duplicate-runtime-cleanup-${stamp}`);
        fs4.mkdirSync(backupRoot, { recursive: true });
      }
      const backupDest = path4.join(backupRoot, path4.basename(target.workspaceRoot));
      if (fs4.existsSync(backupDest)) {
        summary.skipped.push({
          target,
          reason: `backup destination already exists (${backupDest})`
        });
        continue;
      }
      fs4.renameSync(target.workspaceRoot, backupDest);
      summary.archived.push(target);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      summary.skipped.push({ target, reason });
    }
  }
  summary.backupRoot = backupRoot;
  return summary;
}
function formatRuntimeTargetNames(targets) {
  return targets.map((target) => `\`${path4.basename(target.workspaceRoot)}\``).join(", ");
}
async function cmdCleanupDuplicateRuntimes(context, targetFolderOverride) {
  const targetFolder = targetFolderOverride ?? await pickTargetFolder();
  if (!targetFolder) {
    return;
  }
  const duplicateTargets = getDuplicateWorkspaceRuntimeTargets(targetFolder);
  if (duplicateTargets.length === 0) {
    vscode4.window.showInformationMessage("junai: No duplicate workspace runtimes detected.");
    return;
  }
  const runtimeList = formatRuntimeTargetNames(duplicateTargets);
  const confirm = await vscode4.window.showWarningMessage(
    `Archive duplicate workspace runtimes ${runtimeList}? This only archives junai-managed runtime folders and keeps a rollback copy in .junai-backups/.`,
    { modal: true },
    "Archive Duplicates",
    "Cancel"
  );
  if (confirm !== "Archive Duplicates") {
    return;
  }
  const summary = cleanupDuplicateWorkspaceRuntimes(targetFolder);
  const archivedList = summary.archived.length > 0 ? formatRuntimeTargetNames(summary.archived) : "";
  const skippedDetail = summary.skipped.map((item) => `${path4.basename(item.target.workspaceRoot)} (${item.reason})`).join("; ");
  if (summary.archived.length > 0) {
    let message = `junai: Archived duplicate workspace runtimes ${archivedList}.`;
    if (summary.backupRoot) {
      message += ` Backup: ${summary.backupRoot}.`;
    }
    if (summary.skipped.length > 0) {
      message += ` Skipped: ${skippedDetail}.`;
    }
    vscode4.window.showInformationMessage(message);
  } else {
    vscode4.window.showWarningMessage(`junai: No runtime folders were archived. ${skippedDetail || "Nothing matched cleanup safety checks."}`);
  }
  if (context) {
    const promptKey = `ptarmigan.duplicateRuntimeCleanupPrompted.${targetFolder}`;
    await context.workspaceState.update(promptKey, true);
  }
}
async function promptDuplicateRuntimeCleanupIfNeeded(context) {
  if (!shouldAvoidUserLevelRuntimeDuplication()) {
    return;
  }
  const promptEnabled = vscode4.workspace.getConfiguration("ptarmigan").get("promptDuplicateRuntimeCleanup", true);
  if (!promptEnabled) {
    return;
  }
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }
  const targetFolder = workspaceFolders[0].uri.fsPath;
  const duplicateTargets = getDuplicateWorkspaceRuntimeTargets(targetFolder);
  if (duplicateTargets.length === 0) {
    return;
  }
  const promptKey = `ptarmigan.duplicateRuntimeCleanupPrompted.${targetFolder}`;
  if (context.workspaceState.get(promptKey)) {
    return;
  }
  const runtimeList = formatRuntimeTargetNames(duplicateTargets);
  const choice = await vscode4.window.showInformationMessage(
    `ptarmigan detected duplicate workspace runtimes (${runtimeList}) while matching user-level runtimes exist. Archive workspace duplicates now to avoid duplicate agent listings?`,
    "Archive Duplicates",
    "Later",
    "Never Ask Again"
  );
  if (choice === "Archive Duplicates") {
    await cmdCleanupDuplicateRuntimes(context, targetFolder);
    return;
  }
  if (choice === "Never Ask Again" || choice === "Later") {
    await context.workspaceState.update(promptKey, true);
  }
}
function junaiManagedSection() {
  return [
    JUNAI_SECTION_START,
    "",
    "## junai Agent Pipeline",
    "",
    "> junai system documentation (agents, pipeline flow, MCP tools, routing conventions) is",
    "> automatically provided by `.github/instructions/junai-system.instructions.md`.",
    ">",
    "> Project-specific config: `.github/project-config.md` | Pipeline state: `.github/pipeline-state.json`",
    ">",
    "> Start with `@Orchestrator` in Copilot Chat.",
    "",
    "## Recipe-Driven Delivery",
    "",
    "When working on **data-to-UI tasks** (new features, dashboards, data integrations \u2014 not bug fixes, refactors, or docs-only work):",
    "",
    "1. Read `.github/project-config.md` \u2014 check if a `recipe` field is set in Step 1",
    "2. If set, read `.github/recipes/{recipe}.recipe.md`",
    "3. Follow the recipe's **Delivery Pipeline** as your mandatory phase sequence",
    "4. Load the recipe's **Mandatory Skills** for each phase you work on",
    "5. Apply the recipe's **Cross-Skill Conventions** (naming chains, directory structure, chart styling)",
    "",
    "If no recipe is set, work normally using your built-in expertise and any skills loaded via other mechanisms.",
    "",
    "For complex, ambiguous, or risky tasks, run `ptarmigan.deepPlan` from the Command Palette to generate a phased plan before implementation.",
    "",
    JUNAI_SECTION_END
  ].join("\n");
}
function ensureCopilotInstructionsSection(githubDir) {
  const filePath = path4.join(githubDir, "copilot-instructions.md");
  const section = junaiManagedSection();
  if (!fs4.existsSync(filePath)) {
    const template = [
      "# Project Instructions",
      "",
      "<!-- Add your project's context, conventions, and institutional knowledge below. -->",
      "",
      "---",
      "",
      section,
      ""
    ].join("\n");
    fs4.writeFileSync(filePath, template, "utf8");
    return;
  }
  const content = fs4.readFileSync(filePath, "utf8");
  const startIdx = content.indexOf(JUNAI_SECTION_START);
  const endIdx = content.indexOf(JUNAI_SECTION_END);
  if (startIdx !== -1 && endIdx !== -1) {
    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx + JUNAI_SECTION_END.length);
    fs4.writeFileSync(filePath, before + section + after, "utf8");
  } else {
    const separator = content.endsWith("\n") ? "\n" : "\n\n";
    fs4.writeFileSync(filePath, content + separator + section + "\n", "utf8");
  }
}
function removeCopilotInstructionsSection(githubDir) {
  const filePath = path4.join(githubDir, "copilot-instructions.md");
  if (!fs4.existsSync(filePath)) {
    return;
  }
  const content = fs4.readFileSync(filePath, "utf8");
  const startIdx = content.indexOf(JUNAI_SECTION_START);
  const endIdx = content.indexOf(JUNAI_SECTION_END);
  if (startIdx === -1 || endIdx === -1) {
    return;
  }
  const before = content.slice(0, startIdx);
  const after = content.slice(endIdx + JUNAI_SECTION_END.length);
  const cleaned = (before + after).replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  fs4.writeFileSync(filePath, cleaned, "utf8");
}
function activate(context) {
  context.subscriptions.push(
    vscode4.commands.registerCommand("ptarmigan.init", () => cmdInit(context)),
    vscode4.commands.registerCommand("ptarmigan.selectProfile", (opts) => cmdSelectProfile(context, opts)),
    vscode4.commands.registerCommand("ptarmigan.status", () => cmdStatus()),
    vscode4.commands.registerCommand("ptarmigan.setMode", () => cmdSetMode()),
    vscode4.commands.registerCommand("ptarmigan.remove", () => cmdRemove()),
    vscode4.commands.registerCommand("ptarmigan.cleanupDuplicateRuntimes", () => cmdCleanupDuplicateRuntimes(context)),
    vscode4.commands.registerCommand("ptarmigan.update", (opts) => cmdUpdate(context, opts)),
    vscode4.commands.registerCommand("ptarmigan.initPool", () => cmdInitPool(context)),
    vscode4.commands.registerCommand("ptarmigan.setRecipe", () => cmdSetRecipe()),
    vscode4.commands.registerCommand("ptarmigan.probeAutopilot", () => cmdProbeAutopilot())
  );
  registerExperimentalCommands(context);
  startAutopilotWatcher(context);
  const eventBus = JunaiEventBus.getInstance();
  const outputChannel = vscode4.window.createOutputChannel("junai Events");
  context.subscriptions.push({ dispose: () => {
    eventBus.dispose();
    outputChannel.dispose();
  } });
  eventBus.onAny((event) => {
    outputChannel.appendLine(`[${event.timestamp}] ${event.type} from ${event.source}: ${JSON.stringify(event)}`);
  });
  const workspaceRoot = vscode4.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot && isFeatureEnabled("proactive")) {
    const proactiveChannel = vscode4.window.createOutputChannel("junai Proactive");
    proactiveAssistantService = createProactiveAssistantService(eventBus, proactiveChannel);
    context.subscriptions.push(proactiveAssistantService, proactiveChannel);
  } else {
    proactiveAssistantService = null;
  }
  if (workspaceRoot && isFeatureEnabled("dream")) {
    const dreamChannel = vscode4.window.createOutputChannel("junai Dream");
    dreamMemoryService = createDreamMemoryService(workspaceRoot, eventBus, dreamChannel);
    context.subscriptions.push(dreamMemoryService, dreamChannel);
  } else {
    dreamMemoryService = null;
  }
  promptWelcomeIfNeeded(context);
  checkPoolUpdate(context);
  void promptDuplicateRuntimeCleanupIfNeeded(context);
}
var experimentalCommandHandlers = {
  "ptarmigan.coordinate": () => cmdCoordinate(),
  "ptarmigan.deepPlan": () => cmdDeepPlan()
};
function registerExperimentalCommands(context) {
  for (const feature of getExperimentalFeatureManifest()) {
    if (!feature.implemented || !feature.commandId) {
      continue;
    }
    const handler = experimentalCommandHandlers[feature.commandId];
    if (!handler) {
      continue;
    }
    context.subscriptions.push(vscode4.commands.registerCommand(feature.commandId, handler));
  }
}
function promptWelcomeIfNeeded(context) {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }
  const agentsDir = path4.join(workspaceFolders[0].uri.fsPath, ".github", "agents");
  if (fs4.existsSync(agentsDir)) {
    return;
  }
  const autoMode = vscode4.workspace.getConfiguration("ptarmigan").get("autoInitializeOnActivation", "prompt");
  if (autoMode === "never") {
    return;
  }
  if (autoMode === "always") {
    void cmdInit(context, { silent: true });
    return;
  }
  const storageKey = `ptarmigan.welcomed.${workspaceFolders[0].uri.fsPath}`;
  if (context.workspaceState.get(storageKey)) {
    return;
  }
  vscode4.window.showInformationMessage(
    "ptarmigan: Agent pipeline not yet set up in this project. Run Initialize to install 23 agents, skills, and MCP config.",
    "Initialize Now",
    "Not Now"
  ).then((choice) => {
    if (choice === "Initialize Now") {
      void vscode4.commands.executeCommand("ptarmigan.init");
    } else {
      context.workspaceState.update(storageKey, true);
    }
  });
}
function deactivate() {
  proactiveAssistantService?.dispose();
  proactiveAssistantService = null;
  dreamMemoryService?.dispose();
  dreamMemoryService = null;
  JunaiEventBus.getInstance().dispose();
}
async function cmdInit(context, opts) {
  const silent = opts?.silent ?? false;
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    if (!silent) {
      vscode4.window.showErrorMessage("junai: No workspace folder open. Open a project folder first.");
    }
    return;
  }
  let targetFolder;
  if (workspaceFolders.length === 1 || silent) {
    targetFolder = workspaceFolders[0].uri.fsPath;
  } else {
    const picked = await vscode4.window.showQuickPick(
      workspaceFolders.map((f) => ({
        label: f.name,
        description: f.uri.fsPath,
        fsPath: f.uri.fsPath
      })),
      { placeHolder: "Select the workspace folder to initialize junai in" }
    );
    if (!picked) {
      return;
    }
    targetFolder = picked.fsPath;
  }
  const githubDir = path4.join(targetFolder, COPILOT_RUNTIME_DIR);
  const poolDir = path4.join(context.extensionPath, "pool");
  const agentsDir = path4.join(githubDir, "agents");
  if (fs4.existsSync(agentsDir)) {
    if (silent) {
      return;
    }
    const choice = await vscode4.window.showWarningMessage(
      "junai pipeline is already initialised in this project. Your project-config.md will be backed up before overwriting.",
      { modal: true },
      "Overwrite",
      "Cancel"
    );
    if (choice !== "Overwrite") {
      return;
    }
    backupProjectConfig(githubDir);
  }
  const cfg = vscode4.workspace.getConfiguration("ptarmigan");
  const mode = cfg.get("defaultMode", "supervised");
  const runtimeSummary = await vscode4.window.withProgress(
    {
      location: vscode4.ProgressLocation.Notification,
      title: "junai",
      cancellable: false
    },
    async (progress) => {
      progress.report({ message: "Copying agent pool\u2026" });
      const summary = installRuntimeBundles(poolDir, targetFolder);
      progress.report({ message: "Setting up copilot-instructions.md\u2026" });
      ensureCopilotInstructionsSection(githubDir);
      progress.report({ message: "Scaffolding pipeline state\u2026" });
      scaffoldPipelineState(githubDir, mode);
      progress.report({ message: "Configuring MCP server\u2026" });
      scaffoldMcpConfig(targetFolder);
      scaffoldVscodeSettings(targetFolder);
      writeWorkspacePoolVersion(context, githubDir);
      scaffoldSelectiveGithubGitignore(targetFolder);
      progress.report({ message: "Done." });
      return summary;
    }
  );
  const runtimeSkipNotice = formatRuntimeSkipNotice(runtimeSummary.skipped);
  const claudeRulesSkipNotice = formatClaudeRulesSkipNotice(shouldSkipClaudeRulesDeployment(poolDir, targetFolder));
  await promptProfileSelectionAfterInit(context, targetFolder);
  if (silent) {
    const autoMsg = `\u2705 junai agent pipeline auto-initialized (mode: ${mode}).`;
    const notices = [runtimeSkipNotice, claudeRulesSkipNotice].filter(Boolean).join(" ");
    vscode4.window.showInformationMessage(notices ? `${autoMsg} ${notices}` : autoMsg);
    return;
  }
  const initNotices = [runtimeSkipNotice, claudeRulesSkipNotice].filter(Boolean).join(" ");
  const open = await vscode4.window.showInformationMessage(
    `\u2705 junai agent pipeline installed (mode: ${mode}). MCP server configured in .vscode/mcp.json. Open ARTIFACTS.md to get started.${initNotices ? ` ${initNotices}` : ""}`,
    "Open ARTIFACTS.md",
    "Dismiss"
  );
  if (open === "Open ARTIFACTS.md") {
    const artifactsPath = path4.join(githubDir, "agent-docs", "ARTIFACTS.md");
    if (fs4.existsSync(artifactsPath)) {
      vscode4.commands.executeCommand("markdown.showPreview", vscode4.Uri.file(artifactsPath));
    }
  }
}
var PROFILE_DESCRIPTIONS = {
  "streamlit-mssql-enterprise": "Streamlit dashboard + SQL Server \u2014 enterprise internal tools",
  "streamlit-postgres-analytics": "Streamlit dashboard + PostgreSQL \u2014 analytics and BI apps",
  "fastapi-postgres-service": "FastAPI REST service + PostgreSQL \u2014 cloud microservices",
  "fastapi-mssql-internal-api": "FastAPI REST service + SQL Server \u2014 internal corporate APIs",
  "react-node-saas": "React + Node.js \u2014 SaaS products and customer-facing apps",
  "nextjs-postgres-saas": "Next.js + PostgreSQL \u2014 full-stack SaaS with SSR",
  "data-pipeline-python-mssql": "Python ETL pipeline + SQL Server \u2014 data engineering",
  "data-pipeline-python-snowflake": "Python data pipeline + Snowflake \u2014 cloud data warehouse",
  "ml-training-python-pytorch": "PyTorch ML training \u2014 GPU workloads and model development",
  "mcp-server-python": "Python MCP server \u2014 Model Context Protocol tooling",
  "vscode-extension-typescript": "VS Code extension \u2014 TypeScript, vsce, activation events",
  "telecom-appointment-intelligence": "FastAPI + React + MSSQL + Redis + Ollama \u2014 full-stack AI system",
  "org1-telecom-ops": "Org1 \u2014 telecoms operations, full brand colour palette included",
  "org2-finance-ops": "Org2 \u2014 finance operations team profile",
  "org3-healthcare-ops": "Org3 \u2014 healthcare operations team profile"
};
async function cmdSelectProfile(context, opts) {
  const silent = opts?.silent ?? false;
  const targetFolder = opts?.targetFolder ?? await pickTargetFolder();
  if (!targetFolder) {
    return;
  }
  const projectConfigPath = path4.join(targetFolder, ".github", "project-config.md");
  if (!fs4.existsSync(projectConfigPath)) {
    const initialize = await vscode4.window.showInformationMessage(
      "junai: project-config.md not found. Initialize pipeline resources first?",
      "Initialize Now",
      "Cancel"
    );
    if (initialize !== "Initialize Now") {
      return;
    }
    await vscode4.commands.executeCommand("ptarmigan.init");
    if (!fs4.existsSync(projectConfigPath)) {
      return;
    }
  }
  const raw = fs4.readFileSync(projectConfigPath, "utf8");
  const profiles = extractProfileNames(raw);
  if (profiles.length === 0) {
    if (!silent) {
      vscode4.window.showWarningMessage(
        "junai: No named profiles found in .github/project-config.md. Add profile definitions first."
      );
    }
    return;
  }
  const options = profiles.map((name) => ({
    label: name,
    description: PROFILE_DESCRIPTIONS[name] ?? `Set active profile to ${name}`
  }));
  options.push({
    label: "manual (blank profile)",
    description: "Clear profile \u2014 fill placeholder values manually in Step 2"
  });
  const picked = await vscode4.window.showQuickPick(options, {
    placeHolder: "Select a project profile for .github/project-config.md"
  });
  if (!picked) {
    return;
  }
  const selectedProfile = picked.label === "manual (blank profile)" ? "" : picked.label;
  const updated = setProfileValue(raw, selectedProfile);
  if (updated === raw) {
    if (!silent) {
      vscode4.window.showWarningMessage("junai: Could not locate the profile row in project-config.md.");
    }
    return;
  }
  fs4.writeFileSync(projectConfigPath, updated, "utf8");
  if (!silent) {
    const finalLabel = selectedProfile || "(blank/manual)";
    vscode4.window.showInformationMessage(`ptarmigan: project profile set to ${finalLabel}.`);
  }
  await promptRecipeSelection(targetFolder, silent);
  const storageKey = `ptarmigan.profilePrompted.${targetFolder}`;
  await context.workspaceState.update(storageKey, true);
}
async function promptProfileSelectionAfterInit(context, targetFolder) {
  const storageKey = `ptarmigan.profilePrompted.${targetFolder}`;
  if (context.workspaceState.get(storageKey)) {
    return;
  }
  const projectConfigPath = path4.join(targetFolder, ".github", "project-config.md");
  if (!fs4.existsSync(projectConfigPath)) {
    return;
  }
  const raw = fs4.readFileSync(projectConfigPath, "utf8");
  const profiles = extractProfileNames(raw);
  if (profiles.length === 0) {
    return;
  }
  if (currentProfileValue(raw).length > 0) {
    await context.workspaceState.update(storageKey, true);
    return;
  }
  const choice = await vscode4.window.showInformationMessage(
    "junai: Select a predefined profile now? This pre-fills project context for all agents.",
    "Select Profile",
    "Later"
  );
  if (choice === "Select Profile") {
    await cmdSelectProfile(context, { targetFolder });
  } else {
    await context.workspaceState.update(storageKey, true);
  }
}
async function pickTargetFolder() {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode4.window.showErrorMessage("junai: No workspace folder open. Open a project folder first.");
    return null;
  }
  if (workspaceFolders.length === 1) {
    return workspaceFolders[0].uri.fsPath;
  }
  const picked = await vscode4.window.showQuickPick(
    workspaceFolders.map((f) => ({
      label: f.name,
      description: f.uri.fsPath,
      fsPath: f.uri.fsPath
    })),
    { placeHolder: "Select workspace folder" }
  );
  if (!picked) {
    return null;
  }
  return picked.fsPath;
}
function extractProfileNames(markdown) {
  const sanitized = markdown.replace(/<!--[\s\S]*?-->/g, "");
  const matches = sanitized.matchAll(/^###\s+([a-z0-9][a-z0-9-]*)\s*$/gim);
  const names = Array.from(matches, (m) => m[1].trim());
  return [...new Set(names)];
}
function currentProfileValue(markdown) {
  const row = markdown.match(/^\|\s*\*\*profile\*\*\s*\|\s*(.*?)\s*\|\s*$/im);
  if (!row || row.length < 2) {
    return "";
  }
  return row[1].replace(/`/g, "").trim();
}
function setProfileValue(markdown, profile) {
  const formatted = profile ? `\`${profile}\`` : "``";
  return markdown.replace(
    /^\|\s*\*\*profile\*\*\s*\|\s*.*?\s*\|\s*$/im,
    `| **profile** | ${formatted} |`
  );
}
async function promptRecipeSelection(targetFolder, silent) {
  const recipesDir = path4.join(targetFolder, ".github", "recipes");
  if (!fs4.existsSync(recipesDir)) {
    return;
  }
  const recipeFiles = fs4.readdirSync(recipesDir).filter((f) => f.endsWith(".recipe.md")).map((f) => f.replace(".recipe.md", ""));
  if (recipeFiles.length === 0) {
    return;
  }
  const projectConfigPath = path4.join(targetFolder, ".github", "project-config.md");
  if (!fs4.existsSync(projectConfigPath)) {
    return;
  }
  const raw = fs4.readFileSync(projectConfigPath, "utf8");
  const currentRecipe = currentRecipeValue(raw);
  if (currentRecipe.length > 0) {
    return;
  }
  if (silent) {
    return;
  }
  const options = recipeFiles.map((name) => ({
    label: name,
    description: `Use .github/recipes/${name}.recipe.md delivery workflow`
  }));
  options.push({
    label: "none",
    description: "No recipe \u2014 agents work with built-in expertise only"
  });
  const picked = await vscode4.window.showQuickPick(options, {
    placeHolder: "Select a delivery recipe (optional \u2014 defines mandatory skill pipeline for data-to-UI tasks)"
  });
  if (!picked || picked.label === "none") {
    return;
  }
  const updatedConfig = setRecipeValue(raw, picked.label);
  if (updatedConfig !== raw) {
    fs4.writeFileSync(projectConfigPath, updatedConfig, "utf8");
    vscode4.window.showInformationMessage(`junai: recipe set to ${picked.label}.`);
  }
}
function currentRecipeValue(markdown) {
  const row = markdown.match(/^\|\s*\*\*recipe\*\*\s*\|\s*(.*?)\s*\|\s*$/im);
  if (!row || row.length < 2) {
    return "";
  }
  return row[1].replace(/`/g, "").trim();
}
function setRecipeValue(markdown, recipe) {
  const formatted = recipe ? `\`${recipe}\`` : "``";
  return markdown.replace(
    /^\|\s*\*\*recipe\*\*\s*\|\s*.*?\s*\|\s*$/im,
    `| **recipe** | ${formatted} |`
  );
}
function backupProjectConfig(githubDir) {
  const src = path4.join(githubDir, "project-config.md");
  if (!fs4.existsSync(src)) {
    return false;
  }
  const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dest = path4.join(githubDir, `project-config.bak.${ts}.md`);
  fs4.copyFileSync(src, dest);
  return true;
}
async function cmdStatus() {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode4.window.showErrorMessage("junai: No workspace folder open.");
    return;
  }
  const githubDir = path4.join(workspaceFolders[0].uri.fsPath, ".github");
  const stateFile = path4.join(githubDir, "pipeline-state.json");
  const channel = vscode4.window.createOutputChannel("junai Pipeline");
  channel.show(true);
  if (!fs4.existsSync(stateFile)) {
    channel.appendLine('\u26A0  No pipeline-state.json found. Run "junai: Initialize Agent Pipeline" first.');
    return;
  }
  const state = JSON.parse(fs4.readFileSync(stateFile, "utf8"));
  channel.appendLine("\u2500\u2500\u2500 junai Pipeline Status \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  channel.appendLine(`  Mode        : ${state.mode}`);
  channel.appendLine(`  Initialized : ${state.initialized}`);
  channel.appendLine(`  Version     : ${state.version}`);
  const featureStatuses = getExperimentalFeatureStatus();
  channel.appendLine(`  Flags       : ${featureStatuses.map((feature) => `${feature.flag}=${feature.enabled}`).join(" ")}`);
  channel.appendLine("  Experimental:");
  for (const feature of featureStatuses) {
    const liveState = feature.implemented ? "live" : "coming soon";
    const commandInfo = feature.commandId ? ` | command=${feature.commandId}` : "";
    const comingSoonNote = !feature.implemented && feature.comingSoon ? ` | ${feature.comingSoon}` : "";
    channel.appendLine(`    \u2022 ${feature.statusLabel}: ${feature.enabled ? "enabled" : "disabled"} | ${liveState}${commandInfo}${comingSoonNote}`);
  }
  const dreamFeature = featureStatuses.find((feature) => feature.flag === "dream");
  if (dreamFeature?.enabled) {
    const dreamSummary = readDreamMemorySummary(workspaceFolders[0].uri.fsPath);
    if (dreamSummary) {
      channel.appendLine(`  Dream       : ${dreamSummary.factCount} facts, ${dreamSummary.runs} runs, last=${dreamSummary.lastUpdatedAt}`);
    } else {
      channel.appendLine("  Dream       : enabled, awaiting first consolidation pass");
    }
  } else if (dreamFeature?.implemented) {
    channel.appendLine("  Dream       : available (disabled)");
  }
  const proactiveFeature = featureStatuses.find((feature) => feature.flag === "proactive");
  if (proactiveFeature?.enabled) {
    channel.appendLine("  Proactive   : enabled (KAIROS-lite, low-noise notices)");
  } else if (proactiveFeature?.implemented) {
    channel.appendLine("  Proactive   : available (disabled)");
  }
  const classifications = getAllClassifications();
  const highCount = classifications.filter((c) => c.tier === "high").length;
  const medCount = classifications.filter((c) => c.tier === "medium").length;
  const lowCount = classifications.filter((c) => c.tier === "low").length;
  channel.appendLine(`  Permissions : ${lowCount} low / ${medCount} medium / ${highCount} high risk actions classified`);
  const recentEvents = JunaiEventBus.getInstance().getRecentEvents(5);
  channel.appendLine(`  Events      : ${recentEvents.length} recent events in log`);
  if (recentEvents.length > 0) {
    for (const evt of recentEvents) {
      channel.appendLine(`    \u2022 [${evt.severity}] [${evt.type}] ${evt.title} \u2014 ${evt.timestamp}`);
    }
  }
  channel.appendLine("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
}
async function cmdSetMode() {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode4.window.showErrorMessage("junai: No workspace folder open.");
    return;
  }
  const picked = await vscode4.window.showQuickPick(
    [
      {
        label: "supervised",
        description: "All gates require manual approval \u2014 recommended for production teams"
      },
      {
        label: "assisted",
        description: "Manual gates with AI guidance hints"
      },
      {
        label: "autopilot",
        description: "All gates auto-satisfied except intent_approved \u2014 fully autonomous after kick-off"
      }
    ],
    { placeHolder: "Select pipeline mode" }
  );
  if (!picked) {
    return;
  }
  const stateFile = path4.join(
    workspaceFolders[0].uri.fsPath,
    ".github",
    "pipeline-state.json"
  );
  if (!fs4.existsSync(stateFile)) {
    vscode4.window.showErrorMessage("junai: No pipeline-state.json found. Initialize the pipeline first.");
    return;
  }
  const state = JSON.parse(fs4.readFileSync(stateFile, "utf8"));
  state.mode = picked.label;
  fs4.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
  vscode4.window.showInformationMessage(`junai: Pipeline mode set to "${picked.label}".`);
}
async function cmdRemove() {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode4.window.showErrorMessage("junai: No workspace folder open.");
    return;
  }
  const confirmed = await vscode4.window.showWarningMessage(
    "This will delete the junai agent pool (.github runtime folders, .claude runtime folders, .codex runtime folders, pipeline-state.json) and remove the MCP entry from .vscode/mcp.json. Your own code and commits are NOT affected.",
    { modal: true },
    "Remove junai from this project",
    "Cancel"
  );
  if (confirmed !== "Remove junai from this project") {
    return;
  }
  const targetFolder = workspaceFolders[0].uri.fsPath;
  const githubDir = path4.join(targetFolder, COPILOT_RUNTIME_DIR);
  const claudeDir = path4.join(targetFolder, CLAUDE_RUNTIME_DIR);
  const codexDir = path4.join(targetFolder, CODEX_RUNTIME_DIR);
  const poolDirs = [
    "agents",
    "skills",
    "prompts",
    "instructions",
    "agent-docs",
    "plans",
    "handoffs",
    "tools",
    "diagrams"
  ];
  for (const dir of poolDirs) {
    const p = path4.join(githubDir, dir);
    if (fs4.existsSync(p)) {
      fs4.rmSync(p, { recursive: true, force: true });
    }
  }
  for (const dir of ["agents", "skills", "rules"]) {
    const p = path4.join(claudeDir, dir);
    if (fs4.existsSync(p)) {
      fs4.rmSync(p, { recursive: true, force: true });
    }
  }
  const codexSkills = path4.join(codexDir, "skills");
  if (fs4.existsSync(codexSkills)) {
    fs4.rmSync(codexSkills, { recursive: true, force: true });
  }
  for (const file of ["pipeline-state.json", "project-config.md", ".junai-pool-version"]) {
    const p = path4.join(githubDir, file);
    if (fs4.existsSync(p)) {
      fs4.rmSync(p, { force: true });
    }
  }
  removeCopilotInstructionsSection(githubDir);
  removeDirIfEmpty(claudeDir);
  removeDirIfEmpty(codexDir);
  const mcpFile = path4.join(targetFolder, ".vscode", "mcp.json");
  if (fs4.existsSync(mcpFile)) {
    try {
      const cfg = JSON.parse(fs4.readFileSync(mcpFile, "utf8"));
      if (cfg.servers && cfg.servers["junai"]) {
        delete cfg.servers["junai"];
      }
      if (cfg.servers && cfg.servers["junai-pipeline"]) {
        delete cfg.servers["junai-pipeline"];
      }
      fs4.writeFileSync(mcpFile, JSON.stringify(cfg, null, 2), "utf8");
    } catch {
    }
  }
  vscode4.window.showInformationMessage("junai: Agent pool removed from this project. Re-run Initialize to restore it.");
}
async function cmdUpdate(context, opts) {
  const silent = opts?.silent ?? false;
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    if (!silent) {
      vscode4.window.showErrorMessage("junai: No workspace folder open.");
    }
    return;
  }
  const githubDir = path4.join(workspaceFolders[0].uri.fsPath, COPILOT_RUNTIME_DIR);
  const claudeDir = path4.join(workspaceFolders[0].uri.fsPath, CLAUDE_RUNTIME_DIR);
  const codexDir = path4.join(workspaceFolders[0].uri.fsPath, CODEX_RUNTIME_DIR);
  const agentsDir = path4.join(githubDir, "agents");
  if (!fs4.existsSync(agentsDir)) {
    if (!silent) {
      vscode4.window.showErrorMessage("junai: Pipeline not initialized in this project. Run Initialize first.");
    }
    return;
  }
  if (!silent) {
    const confirmed = await vscode4.window.showInformationMessage(
      "Update agent pool with latest files from this extension version? Your copilot-instructions.md content is preserved (only the junai section is refreshed).",
      { modal: true },
      "Update",
      "Cancel"
    );
    if (confirmed !== "Update") {
      return;
    }
  }
  const poolDir = path4.join(context.extensionPath, "pool");
  const USER_OWNED = /* @__PURE__ */ new Set(["pipeline-state.json", "project-config.md"]);
  let updated = 0;
  let skipped = 0;
  let runtimeSkipNotice = "";
  let claudeRulesSkipNotice = "";
  const git = { result: "skipped-no-repo" };
  await vscode4.window.withProgress(
    { location: vscode4.ProgressLocation.Notification, title: "junai", cancellable: false },
    async (progress) => {
      progress.report({ message: "Updating agent pool\u2026" });
      const skipClaudeRules = shouldSkipClaudeRulesDeployment(poolDir, workspaceFolders[0].uri.fsPath);
      claudeRulesSkipNotice = formatClaudeRulesSkipNotice(skipClaudeRules);
      const runtimeTemplates = {
        copilot: {
          cleanDirs: ["agents", "skills", "prompts", "instructions", "tools", "diagrams"],
          mergeDirs: ["agent-docs", "plans", "handoffs"],
          rootFiles: ["project-config.md"],
          userOwnedFiles: USER_OWNED
        },
        claude: {
          cleanDirs: skipClaudeRules ? ["skills"] : ["skills", "rules"],
          mergeDirs: [],
          rootFiles: [],
          userOwnedFiles: /* @__PURE__ */ new Set()
        },
        codex: {
          cleanDirs: ["skills"],
          mergeDirs: [],
          rootFiles: [],
          userOwnedFiles: /* @__PURE__ */ new Set()
        }
      };
      const runtimeTargets = buildRuntimeBundleTargets(poolDir, workspaceFolders[0].uri.fsPath);
      runtimeSkipNotice = formatRuntimeSkipNotice(runtimeTargets.filter((target) => !target.deploy));
      const runtimes = runtimeTargets.filter((target) => target.deploy).map((target) => ({
        poolRoot: target.poolRoot,
        workspaceRoot: target.workspaceRoot,
        ...runtimeTemplates[target.runtimeName]
      }));
      for (const runtime of runtimes) {
        const counts = updateRuntimeBundle(runtime);
        updated += counts.updated;
        skipped += counts.skipped;
      }
      ensureCopilotInstructionsSection(githubDir);
      writeWorkspacePoolVersion(context, githubDir);
      scaffoldMcpConfig(workspaceFolders[0].uri.fsPath);
      scaffoldVscodeSettings(workspaceFolders[0].uri.fsPath);
      scaffoldSelectiveGithubGitignore(workspaceFolders[0].uri.fsPath);
      progress.report({ message: "Committing pool update\u2026" });
      git.result = gitCommitPoolUpdate(workspaceFolders[0].uri.fsPath, readBundledPoolVersion(context) ?? void 0);
      progress.report({ message: "Done." });
    }
  );
  const poolVer = readBundledPoolVersion(context) ?? "latest";
  let msg = silent ? `junai: Agent pool auto-updated to v${poolVer} \u2014 ${updated} files refreshed.` : `\u2705 junai pool updated \u2014 ${updated} files refreshed, ${skipped} user-owned files preserved.`;
  if (git.result === "committed") {
    msg += " Pool changes committed to git.";
  } else if (git.result === "skipped-in-progress") {
    msg += " (git commit skipped \u2014 repo has an in-progress operation; commit manually)";
  } else if (git.result === "skipped-detached") {
    msg += " (git commit skipped \u2014 detached HEAD)";
  } else if (git.result === "error") {
    msg += " (git commit failed \u2014 commit manually if needed)";
  }
  if (runtimeSkipNotice) {
    msg += ` ${runtimeSkipNotice}`;
  }
  if (claudeRulesSkipNotice) {
    msg += ` ${claudeRulesSkipNotice}`;
  }
  vscode4.window.showInformationMessage(msg);
}
async function cmdInitPool(context) {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders?.length) {
    vscode4.window.showErrorMessage("junai: No workspace folder open. Open a project folder first.");
    return;
  }
  const targetFolder = workspaceFolders.length === 1 ? workspaceFolders[0].uri.fsPath : await pickTargetFolder();
  if (!targetFolder) {
    return;
  }
  const githubDir = path4.join(targetFolder, ".github");
  const poolDir = path4.join(context.extensionPath, "pool");
  const runtimeSummary = await vscode4.window.withProgress(
    { location: vscode4.ProgressLocation.Notification, title: "junai: Deploying agent pool\u2026", cancellable: false },
    async () => {
      const summary = installRuntimeBundles(poolDir, targetFolder);
      ensureCopilotInstructionsSection(githubDir);
      scaffoldMcpConfig(targetFolder);
      scaffoldVscodeSettings(targetFolder);
      writeWorkspacePoolVersion(context, githubDir);
      scaffoldSelectiveGithubGitignore(targetFolder);
      return summary;
    }
  );
  const runtimeSkipNotice = formatRuntimeSkipNotice(runtimeSummary.skipped);
  const claudeRulesSkipNotice = formatClaudeRulesSkipNotice(shouldSkipClaudeRulesDeployment(poolDir, targetFolder));
  const initPoolNotices = [runtimeSkipNotice, claudeRulesSkipNotice].filter(Boolean).join(" ");
  const sel = await vscode4.window.showInformationMessage(
    `junai: Agent pool deployed. Agents and skills are ready \u2014 no pipeline-state.json created.${initPoolNotices ? ` ${initPoolNotices}` : ""}`,
    "Select Profile",
    "Set Recipe"
  );
  if (sel === "Select Profile") {
    vscode4.commands.executeCommand("ptarmigan.selectProfile");
  }
  if (sel === "Set Recipe") {
    vscode4.commands.executeCommand("ptarmigan.setRecipe");
  }
}
async function cmdSetRecipe() {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders?.length) {
    vscode4.window.showErrorMessage("junai: No workspace folder open.");
    return;
  }
  const targetFolder = workspaceFolders.length === 1 ? workspaceFolders[0].uri.fsPath : await pickTargetFolder();
  if (!targetFolder) {
    return;
  }
  const projectConfigPath = path4.join(targetFolder, ".github", "project-config.md");
  if (!fs4.existsSync(projectConfigPath)) {
    vscode4.window.showErrorMessage("junai: project-config.md not found. Run Initialize Agent Pipeline or Initialize Agent Pool first.");
    return;
  }
  const recipesDir = path4.join(targetFolder, ".github", "recipes");
  if (!fs4.existsSync(recipesDir)) {
    vscode4.window.showErrorMessage("junai: .github/recipes/ not found.");
    return;
  }
  const recipeFiles = fs4.readdirSync(recipesDir).filter((f) => f.endsWith(".recipe.md")).map((f) => f.replace(".recipe.md", ""));
  if (recipeFiles.length === 0) {
    vscode4.window.showErrorMessage("junai: No .recipe.md files found in .github/recipes/");
    return;
  }
  const raw = fs4.readFileSync(projectConfigPath, "utf8");
  const current = currentRecipeValue(raw);
  const options = recipeFiles.map((name) => ({
    label: name,
    description: name === current ? "(currently selected)" : `Use .github/recipes/${name}.recipe.md`
  }));
  options.push({ label: "none", description: "No recipe \u2014 agents work with built-in expertise only" });
  const picked = await vscode4.window.showQuickPick(options, {
    placeHolder: current ? `Current recipe: ${current} \u2014 select to change` : "Select a delivery recipe"
  });
  if (!picked) {
    return;
  }
  const newRecipe = picked.label === "none" ? "" : picked.label;
  const updatedConfig = setRecipeValue(raw, newRecipe);
  if (updatedConfig !== raw) {
    fs4.writeFileSync(projectConfigPath, updatedConfig, "utf8");
    vscode4.window.showInformationMessage(`junai: recipe set to ${newRecipe || "none"}.`);
  } else {
    vscode4.window.showInformationMessage(`junai: recipe unchanged (${current || "none"}).`);
  }
}
var SKIP = /* @__PURE__ */ new Set([".git", "node_modules", "__pycache__", ".DS_Store"]);
function installRuntimeBundles(poolDir, targetFolder) {
  const summary = { installed: [], skipped: [] };
  const runtimes = buildRuntimeBundleTargets(poolDir, targetFolder);
  const skipClaudeRules = shouldSkipClaudeRulesDeployment(poolDir, targetFolder);
  for (const runtime of runtimes) {
    if (!runtime.deploy) {
      summary.skipped.push(runtime);
      continue;
    }
    if (!fs4.existsSync(runtime.poolRoot)) {
      continue;
    }
    const excludedTopLevelDirs = /* @__PURE__ */ new Set();
    if (runtime.runtimeName === "claude") {
      excludedTopLevelDirs.add("agents");
      if (skipClaudeRules) {
        excludedTopLevelDirs.add("rules");
      }
    }
    copyRuntimeBundleRoot(runtime.poolRoot, runtime.workspaceRoot, excludedTopLevelDirs);
    summary.installed.push(runtime.runtimeName);
  }
  return summary;
}
function updateRuntimeBundle(spec) {
  let updated = 0;
  let skipped = 0;
  if (!fs4.existsSync(spec.poolRoot)) {
    return { updated, skipped };
  }
  for (const dir of [...spec.cleanDirs, ...spec.mergeDirs]) {
    const nested = path4.join(spec.workspaceRoot, dir, dir);
    if (fs4.existsSync(nested)) {
      fs4.rmSync(nested, { recursive: true, force: true });
    }
  }
  for (const dir of spec.cleanDirs) {
    const src = path4.join(spec.poolRoot, dir);
    const dest = path4.join(spec.workspaceRoot, dir);
    if (!fs4.existsSync(src)) {
      continue;
    }
    if (fs4.existsSync(dest)) {
      fs4.rmSync(dest, { recursive: true, force: true });
    }
    const counts = mergeDirSync(src, dest, spec.userOwnedFiles);
    updated += counts.updated;
    skipped += counts.skipped;
  }
  for (const dir of spec.mergeDirs) {
    const src = path4.join(spec.poolRoot, dir);
    const dest = path4.join(spec.workspaceRoot, dir);
    if (!fs4.existsSync(src)) {
      continue;
    }
    const counts = mergeDirSync(src, dest, spec.userOwnedFiles);
    updated += counts.updated;
    skipped += counts.skipped;
  }
  for (const file of spec.rootFiles) {
    const src = path4.join(spec.poolRoot, file);
    const dest = path4.join(spec.workspaceRoot, file);
    if (!fs4.existsSync(src)) {
      continue;
    }
    fs4.mkdirSync(spec.workspaceRoot, { recursive: true });
    if (spec.userOwnedFiles.has(file) && fs4.existsSync(dest)) {
      skipped++;
      continue;
    }
    fs4.copyFileSync(src, dest);
    updated++;
  }
  return { updated, skipped };
}
function removeDirIfEmpty(dirPath) {
  if (!fs4.existsSync(dirPath)) {
    return;
  }
  if (fs4.readdirSync(dirPath).length === 0) {
    fs4.rmSync(dirPath, { recursive: true, force: true });
  }
}
function copyRuntimeBundleRoot(src, dest, excludedTopLevelDirs) {
  if (!fs4.existsSync(src)) {
    return;
  }
  fs4.mkdirSync(dest, { recursive: true });
  for (const entry of fs4.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) {
      continue;
    }
    if (entry.isDirectory() && excludedTopLevelDirs.has(entry.name)) {
      continue;
    }
    const srcPath = path4.join(src, entry.name);
    const destPath = path4.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs4.copyFileSync(srcPath, destPath);
    }
  }
}
function copyDirSync(src, dest) {
  if (!fs4.existsSync(src)) {
    return;
  }
  fs4.mkdirSync(dest, { recursive: true });
  for (const entry of fs4.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) {
      continue;
    }
    const srcPath = path4.join(src, entry.name);
    const destPath = path4.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs4.copyFileSync(srcPath, destPath);
    }
  }
}
function mergeDirSync(src, dest, userOwned) {
  let updated = 0;
  let skipped = 0;
  if (!fs4.existsSync(src)) {
    return { updated, skipped };
  }
  fs4.mkdirSync(dest, { recursive: true });
  const parentName = path4.basename(dest);
  for (const entry of fs4.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) {
      continue;
    }
    if (entry.isDirectory() && entry.name === parentName) {
      continue;
    }
    const srcPath = path4.join(src, entry.name);
    const destPath = path4.join(dest, entry.name);
    if (entry.isDirectory()) {
      const sub = mergeDirSync(srcPath, destPath, userOwned);
      updated += sub.updated;
      skipped += sub.skipped;
    } else if (userOwned.has(entry.name)) {
      skipped++;
    } else {
      fs4.copyFileSync(srcPath, destPath);
      updated++;
    }
  }
  return { updated, skipped };
}
function scaffoldMcpConfig(targetFolder) {
  const vscodedir = path4.join(targetFolder, ".vscode");
  const mcpFile = path4.join(vscodedir, "mcp.json");
  fs4.mkdirSync(vscodedir, { recursive: true });
  let config = {};
  if (fs4.existsSync(mcpFile)) {
    try {
      config = JSON.parse(fs4.readFileSync(mcpFile, "utf8"));
    } catch {
      config = {};
    }
  }
  if (!config.servers) {
    config.servers = {};
  }
  if (config.servers["junai-pipeline"]) {
    delete config.servers["junai-pipeline"];
  }
  if (!config.servers["junai"]) {
    config.servers["junai"] = {
      type: "stdio",
      command: "uv",
      args: ["run", "${workspaceFolder}/.github/tools/mcp-server/server.py"]
    };
    fs4.writeFileSync(mcpFile, JSON.stringify(config, null, 2), "utf8");
  }
}
function scaffoldVscodeSettings(targetFolder) {
  const vscodedir = path4.join(targetFolder, ".vscode");
  const settingsFile = path4.join(vscodedir, "settings.json");
  fs4.mkdirSync(vscodedir, { recursive: true });
  let settings = {};
  if (fs4.existsSync(settingsFile)) {
    try {
      settings = JSON.parse(fs4.readFileSync(settingsFile, "utf8"));
    } catch {
      settings = {};
    }
  }
  const exclude = settings["files.exclude"] ?? {};
  if (!exclude["NUL"]) {
    exclude["NUL"] = true;
    settings["files.exclude"] = exclude;
    fs4.writeFileSync(settingsFile, JSON.stringify(settings, null, 4), "utf8");
  }
}
var AGENT_OPEN_OVERRIDES = {
  "UI/UX Designer": "ui-ux-designer",
  "Mermaid Diagram Specialist": "mermaid-diagram-specialist"
};
function agentOpenCommand(agentName) {
  const suffix = AGENT_OPEN_OVERRIDES[agentName] ?? agentName;
  return `workbench.action.chat.open${suffix}`;
}
async function tryExecuteCommand(channel, command, ...args) {
  try {
    await vscode4.commands.executeCommand(command, ...args);
    return true;
  } catch {
    channel.appendLine(`  \u26A0 Command unavailable: ${command}`);
    return false;
  }
}
function startAutopilotWatcher(context) {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }
  const stateFilePath = path4.join(
    workspaceFolders[0].uri.fsPath,
    ".github",
    "pipeline-state.json"
  );
  const watcher = vscode4.workspace.createFileSystemWatcher(
    new vscode4.RelativePattern(workspaceFolders[0], ".github/pipeline-state.json")
  );
  const channel = vscode4.window.createOutputChannel("junai Autopilot");
  let lastDispatchedKey = "";
  const checkState = async () => {
    try {
      if (!fs4.existsSync(stateFilePath)) {
        return;
      }
      const state = JSON.parse(fs4.readFileSync(stateFilePath, "utf8"));
      const mode = state.pipeline_mode;
      const decision = state._notes?._routing_decision;
      if (mode !== "autopilot" || !decision || decision.blocked) {
        return;
      }
      const dispatchKey = `${decision.next_stage ?? ""}:${state.last_updated ?? ""}`;
      if (dispatchKey === lastDispatchedKey) {
        return;
      }
      lastDispatchedKey = dispatchKey;
      const stage = decision.next_stage ?? "?";
      const targetAgent = decision.target_agent ?? "None";
      const prompt = decision.handoff_prompt ?? decision.prompt ?? "";
      channel.show(false);
      channel.appendLine(`
[junai autopilot] \u{1F680} ${(/* @__PURE__ */ new Date()).toISOString()}`);
      channel.appendLine(`  stage        : ${stage}`);
      channel.appendLine(`  target_agent : ${targetAgent}`);
      channel.appendLine(`  prompt       : ${prompt.length} chars`);
      if (!targetAgent || targetAgent === "None") {
        channel.appendLine(`  \u2705 Pipeline reached closed state \u2014 no further routing needed.`);
        JunaiEventBus.getInstance().emit({
          type: "task-completed",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          source: "autopilot-watcher",
          severity: "success",
          title: "Pipeline closed",
          detail: `${state.feature ?? "feature"} complete`,
          stage: "pipeline-closed",
          agent: "none",
          summary: `Pipeline closed \u2014 ${state.feature ?? "feature"} complete`
        });
        vscode4.window.showInformationMessage(
          `junai autopilot: \u2705 Pipeline closed \u2014 ${state.feature ?? "feature"} complete.`,
          "View Log"
        ).then((c) => {
          if (c === "View Log") {
            channel.show(true);
          }
        });
        return;
      }
      const openCmd = agentOpenCommand(targetAgent);
      const openOk = await tryExecuteCommand(channel, openCmd, { query: prompt });
      await vscode4.env.clipboard.writeText(prompt);
      if (!openOk) {
        channel.appendLine(`  \u2717 Could not open @${targetAgent} via: ${openCmd}`);
        channel.appendLine(`  \u2192 Manual fallback: open @${targetAgent} and paste the routing prompt (Ctrl+V).`);
        vscode4.window.showWarningMessage(
          `junai autopilot: could not auto-open @${targetAgent}. Routing prompt copied to clipboard.`,
          "View Log"
        ).then((c) => {
          if (c === "View Log") {
            channel.show(true);
          }
        });
        return;
      }
      channel.appendLine(`  \u2713 Opened @${targetAgent} \u2014 routing prompt sent as query (also in clipboard)`);
      JunaiEventBus.getInstance().emit({
        type: "task-completed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        source: "autopilot-watcher",
        severity: "success",
        title: `Autopilot routed to @${targetAgent}`,
        detail: `Stage ${stage}`,
        stage,
        agent: targetAgent,
        summary: `Routed to @${targetAgent} for stage: ${stage}`
      });
      vscode4.window.showInformationMessage(
        `junai autopilot: \u2705 @${targetAgent} invoked \u2014 stage: ${stage}`,
        "View Log"
      ).then((c) => {
        if (c === "View Log") {
          channel.show(true);
        }
      });
    } catch {
    }
  };
  watcher.onDidChange(() => {
    void checkState();
  });
  watcher.onDidCreate(() => {
    void checkState();
  });
  context.subscriptions.push(watcher, channel);
}
async function cmdProbeAutopilot() {
  const channel = vscode4.window.createOutputChannel("junai Autopilot Probe");
  channel.show(true);
  channel.appendLine("=== junai Autopilot Command Probe ===");
  channel.appendLine(`VS Code version : ${vscode4.version}`);
  channel.appendLine("");
  const allCommands = await vscode4.commands.getCommands(true);
  const relevant = allCommands.filter((c) => /chat|copilot|agent|handoff|send|message/i.test(c)).sort();
  channel.appendLine(`Found ${relevant.length} chat/copilot/agent commands:`);
  channel.appendLine("");
  for (const cmd of relevant) {
    channel.appendLine(`  ${cmd}`);
  }
  channel.appendLine("");
  channel.appendLine("--- lm API surface (1.102 probe) ---");
  try {
    const lm3 = vscode4.lm;
    const lmKeys = Object.keys(lm3).filter((k) => /chat|agent|send|request|mcp/i.test(k));
    for (const k of lmKeys) {
      channel.appendLine(`  vscode.lm.${k} : ${typeof lm3[k]}`);
    }
    if (lmKeys.length === 0) {
      channel.appendLine("  (no matching keys found on vscode.lm)");
    }
  } catch (e) {
    channel.appendLine(`  \u26A0 Could not enumerate vscode.lm: ${e?.message ?? e}`);
    channel.appendLine('  Add enabledApiProposals=["mcpServerDefinitions"] to package.json and use --enable-proposed-api flag,');
    channel.appendLine("  or run via F5 (Extension Development Host) to access proposed APIs.");
  }
  channel.appendLine("");
  channel.appendLine("Paste this output as context when implementing the real autopilot invoker.");
  vscode4.window.showInformationMessage(`junai probe: found ${relevant.length} chat commands. See "junai Autopilot Probe" output channel.`);
}
async function cmdDeepPlan() {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode4.window.showErrorMessage("junai: No workspace folder open.");
    return;
  }
  try {
    requireFeature("deepPlan");
  } catch {
    return;
  }
  const taskSummary = await vscode4.window.showInputBox({
    prompt: "What complex task should Deep Plan break down?",
    placeHolder: "e.g. add staged rollout for Dream memory with rollback safety and metrics",
    ignoreFocusOut: true
  });
  if (!taskSummary) {
    return;
  }
  const scopeInput = await vscode4.window.showInputBox({
    prompt: "Scope (optional, comma/newline separated)",
    placeHolder: "e.g. src/dreamMemory.ts, src/extension.ts, package.json settings",
    ignoreFocusOut: true
  });
  const constraintsInput = await vscode4.window.showInputBox({
    prompt: "Constraints (optional, comma/newline separated)",
    placeHolder: "e.g. no pipeline-state edits, backward compatible, no new dependencies",
    ignoreFocusOut: true
  });
  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const activeEditorPath = vscode4.window.activeTextEditor?.document.uri.fsPath;
  const contextReferences = activeEditorPath ? [path4.relative(workspaceRoot, activeEditorPath)] : [];
  const scan = scanWorkspace(workspaceRoot);
  const request = buildDeepPlanRequest({
    taskSummary,
    scopeInput,
    constraintsInput,
    contextReferences
  });
  const result = createDeepPlanResult(request, scan);
  let markdown = renderDeepPlanMarkdown(request, result, scan);
  const enriched = await enrichPlanWithLM(request, result, scan, markdown);
  if (enriched) {
    markdown = enriched;
  }
  const outputPath = persistDeepPlanMarkdown(workspaceRoot, markdown);
  const channel = vscode4.window.createOutputChannel("junai Deep Plan");
  channel.show(true);
  channel.appendLine("=== junai Deep Plan ===");
  channel.appendLine(`Saved: ${outputPath}`);
  channel.appendLine("");
  channel.appendLine(markdown);
  const eventBus = JunaiEventBus.getInstance();
  eventBus.emit({
    type: "approval-needed",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    source: "deep-plan",
    severity: "info",
    title: "Deep Plan ready",
    detail: `Confidence ${result.confidence}. Review plan and choose your next step.`,
    stage: "plan",
    agent: "Deep Plan",
    action: "use_deep_plan",
    riskTier: "medium"
  });
  const action = await vscode4.window.showInformationMessage(
    `junai deep plan ready (${result.confidence} confidence). Choose your next step.`,
    "Use This Plan",
    "Copy Next Step",
    "Open Plan File"
  );
  if (action === "Use This Plan") {
    await vscode4.env.clipboard.writeText(result.nextAction);
    eventBus.emit({
      type: "task-completed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      source: "deep-plan",
      severity: "success",
      title: "Deep Plan selected",
      detail: "Next step copied to clipboard",
      stage: "plan-approved",
      agent: "Deep Plan",
      summary: "User selected deep plan and copied the next step to clipboard"
    });
    vscode4.window.showInformationMessage("junai deep plan selected. Next step copied to clipboard.");
    return;
  }
  if (action === "Copy Next Step") {
    await vscode4.env.clipboard.writeText(result.nextAction);
    vscode4.window.showInformationMessage("junai deep plan next step copied to clipboard.");
    return;
  }
  if (action === "Open Plan File") {
    const doc = await vscode4.workspace.openTextDocument(vscode4.Uri.file(outputPath));
    await vscode4.window.showTextDocument(doc, { preview: false });
  }
}
async function cmdCoordinate() {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode4.window.showErrorMessage("junai: No workspace folder open.");
    return;
  }
  try {
    requireFeature("coordinator");
  } catch {
    return;
  }
  const goal = await vscode4.window.showInputBox({
    prompt: "What should Coordinator Mode investigate?",
    placeHolder: "e.g. review the extension architecture and verify coordinator-related files",
    ignoreFocusOut: true
  });
  if (!goal) {
    return;
  }
  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const channel = vscode4.window.createOutputChannel("junai Coordinator");
  channel.show(true);
  channel.appendLine("=== junai Coordinator ===");
  channel.appendLine(`Goal: ${goal}`);
  channel.appendLine("Launching 3 read-only workers...");
  channel.appendLine("");
  const request = {
    title: "Coordinator Mode Run",
    goal,
    workers: [
      {
        id: "explore-1",
        type: "explore",
        label: "Explore workspace structure",
        prompt: `Explore the workspace areas most relevant to: ${goal}`,
        scopePaths: ["src", "package.json"]
      },
      {
        id: "verify-1",
        type: "verify",
        label: "Verify coordinator targets",
        prompt: `Verify that the main coordinator-related files for this goal exist and are readable: ${goal}`,
        scopePaths: ["src/extension.ts", "src/coordinator.ts", "package.json"]
      },
      {
        id: "review-1",
        type: "review",
        label: "Review implementation signals",
        prompt: `Review the current implementation for patterns, exports, and TODOs related to: ${goal}`,
        scopePaths: ["src/extension.ts", "src/coordinator.ts"]
      }
    ]
  };
  try {
    const result = await vscode4.window.withProgress(
      {
        location: vscode4.ProgressLocation.Notification,
        title: "junai Coordinator",
        cancellable: false
      },
      async () => coordinate(request, workspaceRoot)
    );
    channel.appendLine(`Completed in ${result.totalDurationMs}ms`);
    channel.appendLine(`Summary: ${result.summary.completed} completed / ${result.summary.failed} failed / ${result.summary.total} total`);
    channel.appendLine("");
    channel.appendLine(result.synthesizedOutput);
    if (dreamMemoryService) {
      const dreamResult = dreamMemoryService.recordCoordinatorRun({
        goal,
        summary: result.summary,
        workerResults: result.workerResults.map((workerResult) => ({
          workerId: workerResult.workerId,
          workerType: workerResult.workerType,
          label: workerResult.label,
          status: workerResult.status,
          output: workerResult.output,
          error: workerResult.error
        }))
      });
      if (dreamResult) {
        const promotedCount = dreamResult.factsAdded.length + dreamResult.factsUpdated.length;
        if (promotedCount > 0 || dreamResult.factsPruned.length > 0) {
          channel.appendLine("");
          channel.appendLine(
            `Dream consolidation: +${dreamResult.factsAdded.length} added / ${dreamResult.factsUpdated.length} updated / ${dreamResult.factsPruned.length} pruned`
          );
        }
      }
    }
    vscode4.window.showInformationMessage(
      `junai coordinator: completed ${result.summary.total} workers in ${result.totalDurationMs}ms.`,
      "View Output"
    ).then((choice) => {
      if (choice === "View Output") {
        channel.show(true);
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    channel.appendLine(`Error: ${message}`);
    vscode4.window.showWarningMessage(message);
  }
}
function readBundledPoolVersion(context) {
  const f = path4.join(context.extensionPath, "pool", "POOL_VERSION");
  try {
    return fs4.readFileSync(f, "utf8").trim();
  } catch {
    return null;
  }
}
function readWorkspacePoolVersion(githubDir) {
  const f = path4.join(githubDir, ".junai-pool-version");
  try {
    return fs4.readFileSync(f, "utf8").trim();
  } catch {
    return null;
  }
}
function writeWorkspacePoolVersion(context, githubDir) {
  const v = readBundledPoolVersion(context);
  if (!v) {
    return;
  }
  fs4.writeFileSync(path4.join(githubDir, ".junai-pool-version"), v, "utf8");
}
function checkPoolUpdate(context) {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }
  const githubDir = path4.join(workspaceFolders[0].uri.fsPath, ".github");
  const agentsDir = path4.join(githubDir, "agents");
  if (!fs4.existsSync(agentsDir)) {
    return;
  }
  const bundled = readBundledPoolVersion(context);
  const workspace3 = readWorkspacePoolVersion(githubDir);
  if (!bundled) {
    return;
  }
  if (bundled === workspace3) {
    return;
  }
  vscode4.commands.executeCommand("ptarmigan.update", { silent: true });
}
function gitCommitPoolUpdate(workspaceRoot, poolVersion) {
  const label = poolVersion ? `v${poolVersion}` : "latest";
  function run(args, cwd, extraEnv) {
    const env2 = extraEnv ? { ...process.env, ...extraEnv } : void 0;
    const r = (0, import_child_process.spawnSync)("git", args, { cwd, encoding: "utf8", env: env2 });
    return { ok: r.status === 0 && !r.error, out: (r.stdout ?? "").trim() };
  }
  if (!run(["rev-parse", "--git-dir"], workspaceRoot).ok) {
    return "skipped-no-repo";
  }
  const gitDirResult = run(["rev-parse", "--git-dir"], workspaceRoot);
  const gitDir = path4.isAbsolute(gitDirResult.out) ? gitDirResult.out : path4.join(workspaceRoot, gitDirResult.out);
  const inProgressMarkers = ["rebase-merge", "rebase-apply", "MERGE_HEAD", "CHERRY_PICK_HEAD", "BISECT_LOG"];
  if (inProgressMarkers.some((m) => fs4.existsSync(path4.join(gitDir, m)))) {
    return "skipped-in-progress";
  }
  if (!run(["symbolic-ref", "HEAD"], workspaceRoot).ok) {
    return "skipped-detached";
  }
  const rootResult = run(["rev-parse", "--show-toplevel"], workspaceRoot);
  if (!rootResult.ok) {
    return "skipped-no-repo";
  }
  const gitRoot = rootResult.out;
  const githubDir = path4.join(workspaceRoot, COPILOT_RUNTIME_DIR);
  const claudeDir = path4.join(workspaceRoot, CLAUDE_RUNTIME_DIR);
  const codexDir = path4.join(workspaceRoot, CODEX_RUNTIME_DIR);
  const relGithub = path4.relative(gitRoot, githubDir).split(path4.sep).join("/");
  const stagePaths = [
    ...["agents", "tools", "skills", "instructions", "prompts", "diagrams", "handoffs", "agent-docs", "plans"].map((d) => `${relGithub}/${d}`),
    `${relGithub}/copilot-instructions.md`,
    `${relGithub}/.junai-pool-version`
  ];
  if (fs4.existsSync(claudeDir)) {
    const relClaude = path4.relative(gitRoot, claudeDir).split(path4.sep).join("/");
    if (fs4.existsSync(path4.join(claudeDir, "agents"))) {
      stagePaths.push(`${relClaude}/agents`);
    }
    if (fs4.existsSync(path4.join(claudeDir, "skills"))) {
      stagePaths.push(`${relClaude}/skills`);
    }
    if (fs4.existsSync(path4.join(claudeDir, "rules"))) {
      stagePaths.push(`${relClaude}/rules`);
    }
  }
  if (fs4.existsSync(codexDir)) {
    const relCodex = path4.relative(gitRoot, codexDir).split(path4.sep).join("/");
    if (fs4.existsSync(path4.join(codexDir, "skills"))) {
      stagePaths.push(`${relCodex}/skills`);
    }
  }
  const existingStagePaths = stagePaths.filter((p) => {
    const abs = path4.isAbsolute(p) ? p : path4.join(gitRoot, p);
    return fs4.existsSync(abs);
  });
  if (existingStagePaths.length > 0) {
    run(["add", "--", ...existingStagePaths], gitRoot);
  }
  if (run(["diff", "--cached", "--quiet"], gitRoot).ok) {
    return "nothing-to-commit";
  }
  const commitMsg = `chore(junai): update pool to ${label}`;
  const commitArgs = ["commit", "-m", commitMsg];
  if (run(commitArgs, gitRoot).ok) {
    return "committed";
  }
  const fallbackEnv = { GIT_AUTHOR_NAME: "junai", GIT_AUTHOR_EMAIL: "junai-bot@localhost", GIT_COMMITTER_NAME: "junai", GIT_COMMITTER_EMAIL: "junai-bot@localhost" };
  return run(commitArgs, gitRoot, fallbackEnv).ok ? "committed" : "error";
}
function scaffoldSelectiveGithubGitignore(workspaceRoot) {
  const MARKER = "# \u2500\u2500 junai: selective .github tracking \u2500\u2500";
  const gitignorePath = path4.join(workspaceRoot, ".gitignore");
  if (fs4.existsSync(gitignorePath)) {
    const existing = fs4.readFileSync(gitignorePath, "utf8");
    if (existing.includes(MARKER)) {
      return;
    }
  }
  const block = [
    "",
    MARKER,
    ".github/*",
    "!.github/agent-docs/",
    "!.github/agent-docs/**",
    "!.github/plans/",
    "!.github/plans/**",
    "!.github/handoffs/",
    "!.github/handoffs/**",
    "!.github/copilot-instructions.md",
    "!.github/project-config.md",
    "!.github/pipeline-state.json",
    ".claude/",
    ""
  ].join("\n");
  fs4.appendFileSync(gitignorePath, block, "utf8");
}
function scaffoldPipelineState(githubDir, mode) {
  const stateFile = path4.join(githubDir, "pipeline-state.json");
  if (!fs4.existsSync(stateFile)) {
    const state = {
      version: "1.0.0",
      initialized: (/* @__PURE__ */ new Date()).toISOString(),
      mode,
      stages: {},
      artefacts: {}
    };
    fs4.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
