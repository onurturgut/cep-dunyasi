type TimingEntry = {
  name: string;
  duration: number;
  description?: string;
};

function sanitizeMetricName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "step"
  );
}

function escapeHeaderDescription(value: string) {
  return value.replace(/"/g, "'");
}

export function createRequestTimer(label: string) {
  const startedAt = performance.now();
  let cursor = startedAt;
  const entries: TimingEntry[] = [];

  const segmentDuration = () => Number((performance.now() - cursor).toFixed(1));
  const totalDuration = () => Number((performance.now() - startedAt).toFixed(1));

  return {
    mark(name: string, description?: string) {
      const duration = segmentDuration();
      entries.push({
        name: sanitizeMetricName(name),
        duration,
        description,
      });
      cursor = performance.now();
      return duration;
    },
    totalDuration,
    toServerTimingValue() {
      const metrics = [...entries, { name: "total", duration: totalDuration() }];
      return metrics
        .map((entry) =>
          entry.description
            ? `${entry.name};dur=${entry.duration};desc="${escapeHeaderDescription(entry.description)}"`
            : `${entry.name};dur=${entry.duration}`,
        )
        .join(", ");
    },
    headers(init?: HeadersInit) {
      const headers = new Headers(init);
      headers.set("Server-Timing", this.toServerTimingValue());
      return headers;
    },
    log(meta?: Record<string, unknown>) {
      if (process.env.NODE_ENV === "production" && process.env.ENABLE_SERVER_TIMING_LOGS !== "1") {
        return;
      }

      const parts = entries.map((entry) => `${entry.name}=${entry.duration}ms`);
      parts.push(`total=${totalDuration()}ms`);

      if (meta && Object.keys(meta).length > 0) {
        parts.push(`meta=${JSON.stringify(meta)}`);
      }

      console.log(`[perf] ${label} | ${parts.join(" | ")}`);
    },
  };
}
