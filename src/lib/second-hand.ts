export type SecondHandCondition = "mukemmel" | "cok_iyi" | "iyi";
export type SecondHandWarrantyType = "magaza" | "distributor" | "none";
export type SecondHandCheckStatus = "working" | "not_working" | "not_applicable";

export type SecondHandDetails = {
  condition: SecondHandCondition | null;
  battery_health: number | null;
  warranty_type: SecondHandWarrantyType | null;
  warranty_remaining_months: number | null;
  includes_box: boolean;
  includes_invoice: boolean;
  included_accessories: string[];
  face_id_status: SecondHandCheckStatus | null;
  true_tone_status: SecondHandCheckStatus | null;
  battery_changed: boolean | null;
  changed_parts: string[];
  cosmetic_notes: string | null;
  inspection_summary: string | null;
  inspection_date: string | null;
  imei: string | null;
  serial_number: string | null;
};

export const SECOND_HAND_CONDITION_OPTIONS: Array<{ value: SecondHandCondition; label: string }> = [
  { value: "mukemmel", label: "M\u00fckemmel" },
  { value: "cok_iyi", label: "\u00c7ok \u0130yi" },
  { value: "iyi", label: "\u0130yi" },
];

export const SECOND_HAND_WARRANTY_OPTIONS: Array<{ value: SecondHandWarrantyType; label: string }> = [
  { value: "magaza", label: "Ma\u011faza Garantili" },
  { value: "distributor", label: "Distrib\u00fct\u00f6r Garantili" },
  { value: "none", label: "Garantisiz" },
];

export const SECOND_HAND_CHECK_OPTIONS: Array<{ value: SecondHandCheckStatus; label: string }> = [
  { value: "working", label: "\u00c7al\u0131\u015f\u0131yor" },
  { value: "not_working", label: "\u00c7al\u0131\u015fm\u0131yor" },
  { value: "not_applicable", label: "Uygulanamaz" },
];

export const SECOND_HAND_BATTERY_BUCKETS: Array<{ value: number; label: string }> = [
  { value: 95, label: "%95 ve \u00fczeri" },
  { value: 90, label: "%90 ve \u00fczeri" },
  { value: 85, label: "%85 ve \u00fczeri" },
  { value: 80, label: "%80 ve \u00fczeri" },
];

type RawSecondHandDetails = Partial<{
  condition: unknown;
  battery_health: unknown;
  warranty_type: unknown;
  warranty_remaining_months: unknown;
  includes_box: unknown;
  includes_invoice: unknown;
  included_accessories: unknown;
  face_id_status: unknown;
  true_tone_status: unknown;
  battery_changed: unknown;
  changed_parts: unknown;
  cosmetic_notes: unknown;
  inspection_summary: unknown;
  inspection_date: unknown;
  imei: unknown;
  serial_number: unknown;
}> | null | undefined;

function normalizeText(value: unknown) {
  const normalized = `${value ?? ""}`.trim();
  return normalized || null;
}

function normalizeInteger(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.round(parsed));
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeText(item))
    .filter((item): item is string => Boolean(item));
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLocaleLowerCase("tr-TR");
    if (["true", "1", "evet", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "hayir", "no"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function normalizeOptionalBoolean(value: unknown) {
  if (value == null || value === "") {
    return null;
  }

  return normalizeBoolean(value);
}

function normalizeCondition(value: unknown): SecondHandCondition | null {
  const normalized = normalizeText(value)?.toLocaleLowerCase("tr-TR");
  if (normalized === "mukemmel" || normalized === "cok_iyi" || normalized === "iyi") {
    return normalized;
  }
  return null;
}

function normalizeWarrantyType(value: unknown): SecondHandWarrantyType | null {
  const normalized = normalizeText(value)?.toLocaleLowerCase("tr-TR");
  if (normalized === "magaza" || normalized === "distributor" || normalized === "none") {
    return normalized;
  }
  return null;
}

function normalizeCheckStatus(value: unknown): SecondHandCheckStatus | null {
  const normalized = normalizeText(value)?.toLocaleLowerCase("tr-TR");
  if (normalized === "working" || normalized === "not_working" || normalized === "not_applicable") {
    return normalized;
  }
  return null;
}

function normalizeDateString(value: unknown) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function normalizeSecondHandDetails(value: RawSecondHandDetails): SecondHandDetails | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const details: SecondHandDetails = {
    condition: normalizeCondition(value.condition),
    battery_health: normalizeInteger(value.battery_health),
    warranty_type: normalizeWarrantyType(value.warranty_type),
    warranty_remaining_months: normalizeInteger(value.warranty_remaining_months),
    includes_box: normalizeBoolean(value.includes_box),
    includes_invoice: normalizeBoolean(value.includes_invoice),
    included_accessories: normalizeStringArray(value.included_accessories),
    face_id_status: normalizeCheckStatus(value.face_id_status),
    true_tone_status: normalizeCheckStatus(value.true_tone_status),
    battery_changed: normalizeOptionalBoolean(value.battery_changed),
    changed_parts: normalizeStringArray(value.changed_parts),
    cosmetic_notes: normalizeText(value.cosmetic_notes),
    inspection_summary: normalizeText(value.inspection_summary),
    inspection_date: normalizeDateString(value.inspection_date),
    imei: normalizeText(value.imei),
    serial_number: normalizeText(value.serial_number),
  };

  const hasMeaningfulValue =
    details.condition ||
    details.battery_health != null ||
    details.warranty_type ||
    details.warranty_remaining_months != null ||
    details.includes_box ||
    details.includes_invoice ||
    details.included_accessories.length > 0 ||
    details.face_id_status ||
    details.true_tone_status ||
    details.battery_changed != null ||
    details.changed_parts.length > 0 ||
    details.cosmetic_notes ||
    details.inspection_summary ||
    details.inspection_date ||
    details.imei ||
    details.serial_number;

  return hasMeaningfulValue ? details : null;
}

export function getSecondHandConditionLabel(condition: SecondHandCondition | null | undefined) {
  return SECOND_HAND_CONDITION_OPTIONS.find((item) => item.value === condition)?.label || null;
}

export function getSecondHandWarrantyLabel(
  warrantyType: SecondHandWarrantyType | null | undefined,
  remainingMonths?: number | null,
) {
  const baseLabel = SECOND_HAND_WARRANTY_OPTIONS.find((item) => item.value === warrantyType)?.label || null;
  if (!baseLabel) {
    return null;
  }

  if (warrantyType !== "none" && remainingMonths && remainingMonths > 0) {
    return `${baseLabel} \u00b7 ${remainingMonths} ay`;
  }

  return baseLabel;
}

export function getSecondHandCheckStatusLabel(status: SecondHandCheckStatus | null | undefined) {
  return SECOND_HAND_CHECK_OPTIONS.find((item) => item.value === status)?.label || null;
}

export function getBatteryHealthBucketLabel(value: number | null | undefined) {
  if (value == null) {
    return null;
  }

  if (value >= 95) return "%95+";
  if (value >= 90) return "%90+";
  if (value >= 85) return "%85+";
  if (value >= 80) return "%80+";
  return `%${value}`;
}

export function maskSensitiveCode(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  if (normalized.length <= 4) {
    return normalized;
  }

  return `${"*".repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
}
