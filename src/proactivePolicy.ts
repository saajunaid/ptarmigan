import type { EventSeverity, JunaiEvent } from './eventBus';

export type ProactiveNoticeKind = 'event';
export type ProactiveSurface = 'popup' | 'status' | 'log';

export type ProactiveNotice = {
    kind: ProactiveNoticeKind;
    title: string;
    detail?: string;
    severity: EventSeverity;
};

export type ProactivePolicyOptions = {
    popupCooldownMs: number;
    statusCooldownMs: number;
    statusDurationMs: number;
};

export type ProactivePolicyState = {
    lastNoticeKey?: string;
    lastPopupAt?: number;
    lastStatusAt?: number;
};

export type ProactiveDecision = {
    notice?: ProactiveNotice;
    surface?: ProactiveSurface;
    suppressedReason?: 'deduped' | 'cooldown';
    downgradedFromPopup?: boolean;
    downgradedFromStatus?: boolean;
};

const DEFAULT_OPTIONS: ProactivePolicyOptions = {
    popupCooldownMs: 30_000,
    statusCooldownMs: 10_000,
    statusDurationMs: 6_000,
};

export function createProactivePolicyState(): ProactivePolicyState {
    return {};
}

export function evaluateProactiveEvent(
    event: JunaiEvent,
    state: ProactivePolicyState,
    options?: Partial<ProactivePolicyOptions>,
): ProactiveDecision {
    const merged = { ...DEFAULT_OPTIONS, ...options };
    const now = Date.now();
    const noticeKey = `${event.type}:${event.title}`;

    if (state.lastNoticeKey === noticeKey) {
        return { suppressedReason: 'deduped' };
    }

    let surface: ProactiveSurface = event.severity === 'error' || event.severity === 'warning'
        ? 'popup'
        : event.severity === 'success'
            ? 'status'
            : 'log';

    let downgradedFromPopup = false;
    let downgradedFromStatus = false;

    if (surface === 'popup' && state.lastPopupAt && now - state.lastPopupAt < merged.popupCooldownMs) {
        surface = 'status';
        downgradedFromPopup = true;
    }

    if (surface === 'status' && state.lastStatusAt && now - state.lastStatusAt < merged.statusCooldownMs) {
        surface = 'log';
        downgradedFromStatus = true;
    }

    state.lastNoticeKey = noticeKey;
    if (surface === 'popup') {
        state.lastPopupAt = now;
    }
    if (surface === 'status') {
        state.lastStatusAt = now;
    }

    return {
        notice: {
            kind: 'event',
            title: event.title,
            detail: event.detail,
            severity: event.severity,
        },
        surface,
        downgradedFromPopup,
        downgradedFromStatus,
    };
}
