export type EventSeverity = 'info' | 'success' | 'warning' | 'error';

export type JunaiEventType =
    | 'approval-needed'
    | 'background-result'
    | 'memory-consolidated'
    | 'pipeline'
    | 'task-blocked'
    | 'task-completed'
    | string;

export type CoreEvent = {
    type: JunaiEventType;
    timestamp: string;
    source: string;
    severity: EventSeverity;
    title: string;
    detail?: string;
    [key: string]: unknown;
};

export type JunaiEvent = CoreEvent;
export type ApprovalNeededEvent = CoreEvent;
export type BackgroundResultEvent = CoreEvent;
export type MemoryConsolidatedEvent = CoreEvent;
export type PipelineEvent = CoreEvent;
export type TaskBlockedEvent = CoreEvent;
export type TaskCompletedEvent = CoreEvent;

type EventListener = (event: JunaiEvent) => void;

export class JunaiEventBus {
    private static instance: JunaiEventBus | null = null;

    private readonly listeners = new Set<EventListener>();
    private readonly recentEvents: JunaiEvent[] = [];
    private readonly maxRecentEvents = 100;

    static getInstance(): JunaiEventBus {
        if (!JunaiEventBus.instance) {
            JunaiEventBus.instance = new JunaiEventBus();
        }
        return JunaiEventBus.instance;
    }

    emit(event: JunaiEvent): void {
        this.recentEvents.push(event);
        if (this.recentEvents.length > this.maxRecentEvents) {
            this.recentEvents.splice(0, this.recentEvents.length - this.maxRecentEvents);
        }

        for (const listener of this.listeners) {
            try {
                listener(event);
            } catch {
                // Listener failures should never break the emitter path.
            }
        }
    }

    onAny(listener: EventListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    getRecentEvents(limit = 20): JunaiEvent[] {
        return this.recentEvents.slice(-limit).reverse();
    }

    dispose(): void {
        this.listeners.clear();
        this.recentEvents.length = 0;
        if (JunaiEventBus.instance === this) {
            JunaiEventBus.instance = null;
        }
    }
}
