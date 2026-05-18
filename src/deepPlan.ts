import * as fs from 'fs';
import * as path from 'path';

export type DeepPlanConfidence = 'low' | 'medium' | 'high';

export type BuildDeepPlanRequestInput = {
    taskSummary: string;
    scopeInput?: string;
    constraintsInput?: string;
    contextReferences?: string[];
};

export type DeepPlanPhase = {
    title: string;
    objective: string;
    steps: string[];
};

export type DeepPlanRequest = {
    taskSummary: string;
    scope: string[];
    constraints: string[];
    contextReferences: string[];
    requestedAt: string;
};

export type DeepPlanResult = {
    confidence: DeepPlanConfidence;
    phases: DeepPlanPhase[];
    risks: string[];
    nextAction: string;
};

export type WorkspaceScanResult = {
    workspaceRoot: string;
    topLevelEntries: string[];
    detectedFiles: string[];
    detectedTechnologies: string[];
};

function splitList(value?: string): string[] {
    if (!value) {
        return [];
    }

    return value
        .split(/[\n,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function detectTechnologies(fileNames: string[]): string[] {
    const technologies = new Set<string>();

    for (const name of fileNames) {
        const normalized = name.toLowerCase();
        if (normalized.endsWith('.ts') || normalized.endsWith('.tsx')) {
            technologies.add('TypeScript');
        }
        if (normalized.endsWith('.js') || normalized.endsWith('.jsx')) {
            technologies.add('JavaScript');
        }
        if (normalized.endsWith('.py')) {
            technologies.add('Python');
        }
        if (normalized.endsWith('package.json')) {
            technologies.add('Node.js');
            technologies.add('VS Code Extension');
        }
        if (normalized.endsWith('tsconfig.json')) {
            technologies.add('TypeScript Toolchain');
        }
    }

    return [...technologies];
}

function walkWorkspace(root: string, maxFiles = 60): string[] {
    const collected: string[] = [];
    const queue = [''];

    while (queue.length > 0 && collected.length < maxFiles) {
        const current = queue.shift() ?? '';
        const absolute = path.join(root, current);
        if (!fs.existsSync(absolute)) {
            continue;
        }

        const entries = fs.readdirSync(absolute, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.venv') {
                continue;
            }

            const relative = path.join(current, entry.name);
            if (entry.isDirectory()) {
                if (relative.split(path.sep).length <= 3) {
                    queue.push(relative);
                }
                continue;
            }

            collected.push(relative.replace(/\\/g, '/'));
            if (collected.length >= maxFiles) {
                break;
            }
        }
    }

    return collected;
}

export function scanWorkspace(workspaceRoot: string): WorkspaceScanResult {
    const topLevelEntries = fs.existsSync(workspaceRoot)
        ? fs.readdirSync(workspaceRoot).slice(0, 20)
        : [];
    const detectedFiles = walkWorkspace(workspaceRoot);
    const detectedTechnologies = detectTechnologies(detectedFiles);

    return {
        workspaceRoot,
        topLevelEntries,
        detectedFiles,
        detectedTechnologies,
    };
}

export function scanResultToContextLines(scan: WorkspaceScanResult): string[] {
    return [
        `Workspace root: ${scan.workspaceRoot}`,
        `Top-level entries: ${scan.topLevelEntries.join(', ') || 'none detected'}`,
        `Detected technologies: ${scan.detectedTechnologies.join(', ') || 'none detected'}`,
        'Sample files:',
        ...scan.detectedFiles.slice(0, 20).map((file) => `- ${file}`),
    ];
}

export function buildDeepPlanRequest(input: BuildDeepPlanRequestInput): DeepPlanRequest {
    return {
        taskSummary: input.taskSummary.trim(),
        scope: splitList(input.scopeInput),
        constraints: splitList(input.constraintsInput),
        contextReferences: input.contextReferences?.filter(Boolean) ?? [],
        requestedAt: new Date().toISOString(),
    };
}

export function createDeepPlanResult(
    request: DeepPlanRequest,
    scan: WorkspaceScanResult,
): DeepPlanResult {
    const confidence: DeepPlanConfidence = request.scope.length >= 2 || scan.detectedTechnologies.length >= 2
        ? 'high'
        : request.scope.length === 1 || scan.detectedTechnologies.length === 1
            ? 'medium'
            : 'low';

    const scopeLabel = request.scope.join(', ') || 'the relevant workspace files';
    const techLabel = scan.detectedTechnologies.join(', ') || 'the detected project stack';

    return {
        confidence,
        phases: [
            {
                title: 'Validate the current implementation surface',
                objective: `Confirm the files and entry points involved in ${request.taskSummary}.`,
                steps: [
                    `Inspect ${scopeLabel} and verify how the current behavior is wired today.`,
                    `Confirm the surrounding project context using ${techLabel}.`,
                ],
            },
            {
                title: 'Implement the smallest safe change',
                objective: 'Make the targeted code change without broad refactors.',
                steps: [
                    'Update the primary code path first, then adjust any supporting helpers that would otherwise drift out of sync.',
                    'Preserve existing user-facing behavior unless the task explicitly requires a behavior change.',
                ],
            },
            {
                title: 'Validate and ship with confidence',
                objective: 'Prove the change works before handing it off.',
                steps: [
                    'Run compile, lint, or test validation relevant to the touched files.',
                    'Re-check the original request against the final implementation to catch any missed edge cases.',
                ],
            },
        ],
        risks: [
            request.scope.length === 0
                ? 'No explicit scope was provided, so adjacent files may still need verification before editing.'
                : `Changes may need to stay aligned across: ${scopeLabel}.`,
            scan.detectedTechnologies.length === 0
                ? 'Technology signals were sparse; verify tooling expectations before relying on automation.'
                : `Validation should match the detected stack: ${techLabel}.`,
        ],
        nextAction: `Start by validating the current behavior in ${request.scope[0] ?? 'the primary implementation file'} before making any code changes.`,
    };
}

export function renderDeepPlanMarkdown(
    request: DeepPlanRequest,
    result: DeepPlanResult,
    scan: WorkspaceScanResult,
): string {
    const lines: string[] = [
        '# Deep Plan',
        '',
        `**Task**: ${request.taskSummary}`,
        `**Requested at**: ${request.requestedAt}`,
        `**Confidence**: ${result.confidence}`,
        '',
        '## Scope',
        '',
        ...(request.scope.length > 0 ? request.scope.map((item) => `- ${item}`) : ['- Not explicitly provided']),
        '',
        '## Constraints',
        '',
        ...(request.constraints.length > 0 ? request.constraints.map((item) => `- ${item}`) : ['- None provided']),
        '',
        '## Workspace signals',
        '',
        ...scanResultToContextLines(scan),
        '',
        '## Phases',
        '',
    ];

    for (const phase of result.phases) {
        lines.push(`### ${phase.title}`);
        lines.push('');
        lines.push(phase.objective);
        lines.push('');
        for (const step of phase.steps) {
            lines.push(`- ${step}`);
        }
        lines.push('');
    }

    lines.push('## Risks');
    lines.push('');
    for (const risk of result.risks) {
        lines.push(`- ${risk}`);
    }
    lines.push('');
    lines.push('## Next action');
    lines.push('');
    lines.push(result.nextAction);
    lines.push('');

    return lines.join('\n');
}

export function persistDeepPlanMarkdown(workspaceRoot: string, markdown: string): string {
    const plansDir = path.join(workspaceRoot, '.github', 'plans');
    fs.mkdirSync(plansDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(plansDir, `deep-plan-${timestamp}.md`);
    fs.writeFileSync(outputPath, markdown, 'utf8');
    return outputPath;
}
