import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import type { JunaiEventBus } from './eventBus';

export type DreamWorkerResult = {
    workerId: string;
    workerType: string;
    label: string;
    status: string;
    output?: string;
    error?: string;
};

export type DreamCoordinatorRun = {
    goal: string;
    summary: {
        total: number;
        completed: number;
        failed: number;
    };
    workerResults: DreamWorkerResult[];
};

export type MemorySignalKind = 'goal' | 'summary' | 'finding';

export type MemoryFactRecord = {
    id: string;
    signal: MemorySignalKind;
    summary: string;
    updatedAt: string;
};

export type MemoryConflict = {
    existing: MemoryFactRecord;
    incoming: MemoryFactRecord;
};

export type MemoryConsolidationResult = {
    factsAdded: MemoryFactRecord[];
    factsUpdated: MemoryFactRecord[];
    factsPruned: MemoryFactRecord[];
};

export type DreamMemorySummary = {
    factCount: number;
    runs: number;
    lastUpdatedAt: string;
};

type DreamMemoryStore = {
    summary: DreamMemorySummary;
    facts: MemoryFactRecord[];
};

function dreamMemoryFile(workspaceRoot: string): string {
    return path.join(workspaceRoot, '.github', '.ptarmigan-dream-memory.json');
}

function defaultStore(): DreamMemoryStore {
    return {
        summary: {
            factCount: 0,
            runs: 0,
            lastUpdatedAt: new Date(0).toISOString(),
        },
        facts: [],
    };
}

function loadStore(workspaceRoot: string): DreamMemoryStore {
    const filePath = dreamMemoryFile(workspaceRoot);
    if (!fs.existsSync(filePath)) {
        return defaultStore();
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as DreamMemoryStore;
    } catch {
        return defaultStore();
    }
}

function saveStore(workspaceRoot: string, store: DreamMemoryStore): void {
    const filePath = dreamMemoryFile(workspaceRoot);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf8');
}

export class DreamMemoryService implements vscode.Disposable {
    private readonly workspaceRoot: string;

    constructor(
        workspaceRoot: string,
        private readonly eventBus: JunaiEventBus,
        private readonly outputChannel?: vscode.OutputChannel,
    ) {
        this.workspaceRoot = workspaceRoot;
    }

    recordCoordinatorRun(run: DreamCoordinatorRun): MemoryConsolidationResult | null {
        const store = loadStore(this.workspaceRoot);
        const now = new Date().toISOString();

        const fact: MemoryFactRecord = {
            id: `run-${Date.now()}`,
            signal: 'summary',
            summary: `${run.goal} (${run.summary.completed}/${run.summary.total} workers completed)`,
            updatedAt: now,
        };

        store.facts.push(fact);
        store.summary = {
            factCount: store.facts.length,
            runs: store.summary.runs + 1,
            lastUpdatedAt: now,
        };
        saveStore(this.workspaceRoot, store);

        this.outputChannel?.appendLine(`[${now}] Dream memory recorded coordinator run: ${run.goal}`);
        this.eventBus.emit({
            type: 'memory-consolidated',
            timestamp: now,
            source: 'dream-memory',
            severity: 'success',
            title: 'Dream memory updated',
            detail: fact.summary,
        });

        return {
            factsAdded: [fact],
            factsUpdated: [],
            factsPruned: [],
        };
    }

    dispose(): void {
        // No background handles to clean up.
    }
}

export function createDreamMemoryService(
    workspaceRoot: string,
    eventBus: JunaiEventBus,
    outputChannel?: vscode.OutputChannel,
): DreamMemoryService {
    return new DreamMemoryService(workspaceRoot, eventBus, outputChannel);
}

export function readDreamMemorySummary(workspaceRoot: string): DreamMemorySummary | null {
    const store = loadStore(workspaceRoot);
    return store.summary.runs > 0 ? store.summary : null;
}
