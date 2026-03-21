export function parseValidDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDate(
  value: string | number | Date | null | undefined,
  locale = "tr-TR",
  options?: Intl.DateTimeFormatOptions,
  fallback = "-"
) {
  const date = parseValidDate(value);

  if (!date) {
    return fallback;
  }

  return date.toLocaleDateString(locale, options);
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  locale = "tr-TR",
  options?: Intl.DateTimeFormatOptions,
  fallback = "-"
) {
  const date = parseValidDate(value);

  if (!date) {
    return fallback;
  }

  return date.toLocaleString(locale, options);
}

export function toIsoDateKey(value: string | number | Date | null | undefined) {
  const date = parseValidDate(value);

  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}
