import * as vscode from 'vscode';

const CONFIG_SECTION = 'ptarmigan.experimental';

export type FeatureFlag = 'coordinator' | 'dream' | 'deepPlan' | 'proactive';

export type ExperimentalFeatureDefinition = {
    flag: FeatureFlag;
    label: string;
    statusLabel: string;
    description: string;
    implemented: boolean;
    commandId?: string;
    comingSoon?: string;
};

export type ExperimentalFeatureStatus = ExperimentalFeatureDefinition & {
    enabled: boolean;
};

const FEATURE_MANIFEST: readonly ExperimentalFeatureDefinition[] = [
    {
        flag: 'coordinator',
        label: 'Coordinator Mode',
        statusLabel: 'Coordinator Mode',
        description: 'Fan out structured read-only investigation tasks and synthesize the findings.',
        implemented: true,
        commandId: 'ptarmigan.coordinate',
    },
    {
        flag: 'dream',
        label: 'Dream Memory',
        statusLabel: 'Dream Memory',
        description: 'Consolidate durable insights from coordinator runs into lightweight workspace memory.',
        implemented: true,
    },
    {
        flag: 'deepPlan',
        label: 'Deep Plan',
        statusLabel: 'Deep Plan',
        description: 'Generate a structured, approval-ready implementation plan from task inputs and workspace signals.',
        implemented: true,
        commandId: 'ptarmigan.deepPlan',
    },
    {
        flag: 'proactive',
        label: 'Proactive Assistant',
        statusLabel: 'Proactive Assistant',
        description: 'Surface low-noise notices for important runtime events using popup, status-bar, or log output.',
        implemented: true,
    },
] as const;

/**
 * Check whether a specific experimental feature is enabled.
 * Reads from VS Code workspace configuration (user/workspace settings).
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return config.get<boolean>(flag, false);
}

/**
 * Get all feature flag states as a snapshot.
 * Useful for logging and status display.
 */
export function getAllFlags(): Record<FeatureFlag, boolean> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return {
        coordinator: config.get<boolean>('coordinator', false),
        dream: config.get<boolean>('dream', false),
        deepPlan: config.get<boolean>('deepPlan', false),
        proactive: config.get<boolean>('proactive', false),
    };
}

export function getExperimentalFeatureManifest(): readonly ExperimentalFeatureDefinition[] {
    return FEATURE_MANIFEST;
}

export function getExperimentalFeatureStatus(): ExperimentalFeatureStatus[] {
    const flags = getAllFlags();
    return FEATURE_MANIFEST.map((feature) => ({
        ...feature,
        enabled: flags[feature.flag],
    }));
}

/**
 * Guard that throws if a feature is not enabled.
 * Use at the top of command handlers gated behind experimental flags.
 */
export function requireFeature(flag: FeatureFlag): void {
    if (!isFeatureEnabled(flag)) {
        const msg = `This feature requires enabling "ptarmigan.experimental.${flag}" in settings.`;
        vscode.window.showWarningMessage(msg);
        throw new Error(msg);
    }
}
