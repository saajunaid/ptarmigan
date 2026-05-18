import * as fs from 'fs';
import * as path from 'path';
import { requireFeature } from './featureFlags';

export type WorkerType = 'explore' | 'verify' | 'review';
export type TaskStatus = 'completed' | 'failed';

export type WorkerSpec = {
    id: string;
    type: WorkerType;
    label: string;
    prompt: string;
    scopePaths: string[];
};

export type CoordinatorTaskSpec = WorkerSpec;

export type CoordinationRequest = {
    title: string;
    goal: string;
    workers: WorkerSpec[];
};

export type TaskResult = {
    workerId: string;
    workerType: WorkerType;
    label: string;
    status: TaskStatus;
    output: string;
    error?: string;
};

export type CoordinatorFinding = {
    workerId: string;
    severity: 'info' | 'warning' | 'error';
    summary: string;
};

export type CoordinatorSynthesisResult = {
    findings: CoordinatorFinding[];
    markdown: string;
};

export type CoordinationResult = {
    summary: {
        total: number;
        completed: number;
        failed: number;
    };
    totalDurationMs: number;
    workerResults: TaskResult[];
    synthesizedOutput: string;
};

export type TaskNode = {
    id: string;
    label: string;
    children: string[];
};

export class TaskGraph {
    readonly nodes = new Map<string, TaskNode>();

    add(node: TaskNode): void {
        this.nodes.set(node.id, node);
    }

    list(): TaskNode[] {
        return [...this.nodes.values()];
    }
}

function formatScope(workspaceRoot: string, scopePath: string): string {
    const absolutePath = path.join(workspaceRoot, scopePath);
    if (!fs.existsSync(absolutePath)) {
        return `- ${scopePath}: missing`;
    }

    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
        const entries = fs.readdirSync(absolutePath).slice(0, 8);
        return `- ${scopePath}: directory (${entries.length} sample entries: ${entries.join(', ') || 'empty'})`;
    }

    return `- ${scopePath}: file (${stat.size} bytes)`;
}

export async function executeWorker(worker: WorkerSpec, workspaceRoot: string): Promise<TaskResult> {
    try {
        const scopeSummary = worker.scopePaths
            .map((scopePath) => formatScope(workspaceRoot, scopePath))
            .join('\n');

        const output = [
            `Worker: ${worker.label}`,
            `Type: ${worker.type}`,
            `Prompt: ${worker.prompt}`,
            'Scope review:',
            scopeSummary || '- no scope paths supplied',
        ].join('\n');

        return {
            workerId: worker.id,
            workerType: worker.type,
            label: worker.label,
            status: 'completed',
            output,
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            workerId: worker.id,
            workerType: worker.type,
            label: worker.label,
            status: 'failed',
            output: '',
            error: message,
        };
    }
}

export function synthesizeFindings(workerResults: TaskResult[]): CoordinatorFinding[] {
    return workerResults.map((result) => ({
        workerId: result.workerId,
        severity: result.status === 'failed' ? 'error' : 'info',
        summary: result.status === 'failed'
            ? `${result.label} failed: ${result.error ?? 'unknown error'}`
            : `${result.label} completed successfully.`,
    }));
}

export function synthesizeResults(workerResults: TaskResult[]): string {
    return workerResults
        .map((result) => {
            if (result.status === 'failed') {
                return `## ${result.label}\n\n- Status: failed\n- Error: ${result.error ?? 'unknown error'}`;
            }

            return `## ${result.label}\n\n- Status: completed\n\n${result.output}`;
        })
        .join('\n\n');
}

async function coordinateCore(
    request: CoordinationRequest,
    workspaceRoot: string,
): Promise<CoordinationResult> {
    const startedAt = Date.now();
    const workerResults: TaskResult[] = [];

    for (const worker of request.workers) {
        workerResults.push(await executeWorker(worker, workspaceRoot));
    }

    const completed = workerResults.filter((result) => result.status === 'completed').length;
    const failed = workerResults.length - completed;
    const synthesizedOutput = [
        `# ${request.title}`,
        '',
        `Goal: ${request.goal}`,
        '',
        synthesizeResults(workerResults),
    ].join('\n');

    return {
        summary: {
            total: workerResults.length,
            completed,
            failed,
        },
        totalDurationMs: Date.now() - startedAt,
        workerResults,
        synthesizedOutput,
    };
}

/**
 * Backward-compatible wrapper preserving existing feature-gated behavior.
 */
export async function coordinate(
    request: CoordinationRequest,
    workspaceRoot: string,
): Promise<CoordinationResult> {
    requireFeature('coordinator');
    return coordinateCore(request, workspaceRoot);
}
