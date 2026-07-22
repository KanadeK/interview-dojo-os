import type { TimelineEvent } from "@/domain/model";

export type Clock = { now: () => Date };
export const systemClock: Clock = { now: () => new Date() };

export function createId(prefix: string, clock: Clock, entropy = Math.random) {
  return `${prefix}_${clock.now().getTime().toString(36)}${Math.floor(entropy() * 1e8).toString(36)}`;
}

export function eventFor(
  sessionId: string,
  type: TimelineEvent["type"],
  detail: string,
  clock: Clock,
  entropy = Math.random,
): TimelineEvent {
  return {
    id: createId("evt", clock, entropy),
    sessionId,
    type,
    detail,
    occurredAt: clock.now().toISOString(),
  };
}

export function elapsedSeconds(startedAt: string, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000));
}
