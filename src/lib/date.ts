/**
 * Convert a UTC datetime string from the API to a Date in the browser's local timezone.
 * Accepts "YYYY-MM-DDTHH:mm:ss" (no suffix) or any ISO string.
 */
export function utcToLocal(utcDateStr: string): Date {
  const normalized = utcDateStr.endsWith("Z") ? utcDateStr : utcDateStr + "Z"
  return new Date(normalized)
}

/**
 * Convert a local Date (or a local datetime string "YYYY-MM-DDTHH:mm:ss")
 * to a UTC ISO string for sending to the API.
 */
export function localToUtc(localDate: Date | string): string {
  const date = typeof localDate === "string" ? new Date(localDate) : localDate
  return date.toISOString()
}
