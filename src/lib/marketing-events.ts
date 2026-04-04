import type { MarketingEventPayload } from "@/lib/marketing";

const recentEventTimestamps = new Map<string, number>();

function serializeMetadata(metadata: MarketingEventPayload["metadata"]) {
  if (!metadata) {
    return "";
  }

  return Object.entries(metadata)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}:${value === null ? "null" : String(value)}`)
    .join("|");
}

function buildEventKey(payload: MarketingEventPayload) {
  return [
    payload.eventType,
    payload.entityType ?? "",
    payload.entityId ?? "",
    payload.pagePath ?? "",
    serializeMetadata(payload.metadata),
  ].join("::");
}

function pruneRecentEvents(now: number, windowMs: number) {
  for (const [key, timestamp] of recentEventTimestamps.entries()) {
    if (now - timestamp > windowMs) {
      recentEventTimestamps.delete(key);
    }
  }
}

export async function postMarketingEvent(payload: MarketingEventPayload) {
  try {
    const response = await fetch("/api/events/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "same-origin",
      keepalive: true,
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function postMarketingEventOnce(
  payload: MarketingEventPayload,
  options?: {
    dedupeKey?: string;
    windowMs?: number;
  },
) {
  if (typeof window === "undefined") {
    return false;
  }

  const windowMs = options?.windowMs ?? 10_000;
  const now = Date.now();
  const dedupeKey = options?.dedupeKey ?? buildEventKey(payload);

  pruneRecentEvents(now, windowMs);

  const previousTimestamp = recentEventTimestamps.get(dedupeKey);
  if (previousTimestamp && now - previousTimestamp < windowMs) {
    return false;
  }

  recentEventTimestamps.set(dedupeKey, now);
  return postMarketingEvent(payload);
}
