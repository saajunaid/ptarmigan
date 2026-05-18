export type RiskTier = 'low' | 'medium' | 'high';

export type ActionName =
    | 'init'
    | 'selectProfile'
    | 'status'
    | 'setMode'
    | 'remove'
    | 'cleanupDuplicateRuntimes'
    | 'update'
    | 'initPool'
    | 'setRecipe'
    | 'probeAutopilot'
    | 'coordinate'
    | 'deepPlan';

export type ProtectedAction = ActionName;

export type ActionClassification = {
    action: ActionName;
    tier: RiskTier;
    description: string;
};

export type PermissionResult = {
    allowed: boolean;
    tier: RiskTier;
    reason?: string;
};

export const ACTION_CLASSIFICATIONS: readonly ActionClassification[] = [
    { action: 'init', tier: 'medium', description: 'Writes project scaffolding and MCP configuration into the workspace.' },
    { action: 'selectProfile', tier: 'low', description: 'Updates the active project profile in project-config.md.' },
    { action: 'status', tier: 'low', description: 'Reads pipeline state and reports current status.' },
    { action: 'setMode', tier: 'medium', description: 'Modifies pipeline execution mode in pipeline-state.json.' },
    { action: 'remove', tier: 'high', description: 'Deletes ptarmigan-managed runtime files from the workspace.' },
    { action: 'cleanupDuplicateRuntimes', tier: 'high', description: 'Archives duplicate runtime folders to prevent duplicated agents.' },
    { action: 'update', tier: 'medium', description: 'Refreshes bundled runtime resources in the workspace.' },
    { action: 'initPool', tier: 'medium', description: 'Deploys the agent pool without pipeline state.' },
    { action: 'setRecipe', tier: 'low', description: 'Updates the recipe selection in project-config.md.' },
    { action: 'probeAutopilot', tier: 'low', description: 'Enumerates chat commands for diagnostic purposes.' },
    { action: 'coordinate', tier: 'low', description: 'Runs a read-only coordinator investigation over the workspace.' },
    { action: 'deepPlan', tier: 'low', description: 'Generates a structured implementation plan from workspace context.' },
];

export const PROTECTED_ACTIONS = new Set<ProtectedAction>(['remove', 'cleanupDuplicateRuntimes']);

export const DEFAULT_PROTECTED_PATH_PATTERNS = [
    '.github/pipeline-state.json',
    '.github/project-config.md',
    '.vscode/mcp.json',
];

export function getActionClassification(action: ActionName): ActionClassification {
    return ACTION_CLASSIFICATIONS.find((entry) => entry.action === action)
        ?? { action, tier: 'low', description: 'No explicit classification recorded.' };
}

export function getAllClassifications(): ActionClassification[] {
    return [...ACTION_CLASSIFICATIONS];
}

export function isProtectedAction(action: string): action is ProtectedAction {
    return PROTECTED_ACTIONS.has(action as ProtectedAction);
}

export function matchGlob(candidate: string, pattern: string): boolean {
    const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i').test(candidate);
}

export function isProtectedPath(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    return DEFAULT_PROTECTED_PATH_PATTERNS.some((pattern) => normalized.endsWith(pattern) || matchGlob(normalized, pattern));
}

export function checkPermission(action: ActionName, targetPath?: string): PermissionResult {
    const classification = getActionClassification(action);
    const pathProtected = targetPath ? isProtectedPath(targetPath) : false;
    if (classification.tier === 'high' || pathProtected) {
        return {
            allowed: false,
            tier: classification.tier === 'high' ? 'high' : 'medium',
            reason: pathProtected
                ? `Target path is protected: ${targetPath}`
                : `Action ${action} requires explicit confirmation.`,
        };
    }

    return { allowed: true, tier: classification.tier };
}
