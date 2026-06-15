/**
 * Parses a date-time string as a naive local Date object,
 * ignoring any timezone offset to keep the exact stored time.
 *
 * Handles Supabase returning timestamps with UTC offsets like
 * "2026-06-16T14:00:00+00:00" or "2026-06-16T14:00:00Z" — strips
 * the timezone suffix so 14:00 is always treated as 14:00 local,
 * not converted from UTC (which would show 09:00 in UTC-5).
 */
export const parseNaiveDateTime = (fechaHoraStr: string): Date => {
  if (!fechaHoraStr) return new Date();

  // Strip any timezone offset (e.g. +00:00, -05:00, Z) before parsing
  // so the time is always treated as local (naive) regardless of what
  // Supabase appends to the timestamp string.
  const naive = fechaHoraStr
    .replace('Z', '')                   // remove trailing Z
    .replace(/[+-]\d{2}:\d{2}$/, '');  // remove ±HH:MM offset

  // Format matches: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD HH:mm:ss
  const match = naive.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s)(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1, // JS months are 0-indexed
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      second ? parseInt(second) : 0
    );
  }
  return new Date(naive.replace(' ', 'T'));
};

/**
 * Returns a local date string in YYYY-MM-DD format (e.g. "2026-06-15").
 */
export const getLocalDateStr = (fechaHoraStr: string): string => {
  if (!fechaHoraStr) return "";
  try {
    const date = parseNaiveDateTime(fechaHoraStr);
    return date.toLocaleDateString("sv-SE");
  } catch {
    return fechaHoraStr.includes("T")
      ? fechaHoraStr.split("T")[0]
      : fechaHoraStr.split(" ")[0];
  }
};

/**
 * Returns a formatted date string for Spain locale (e.g. "15 jun").
 */
export const formatApptDate = (fechaHoraStr: string): string => {
  if (!fechaHoraStr) return "";
  try {
    const date = parseNaiveDateTime(fechaHoraStr);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch {
    return fechaHoraStr.split(" ")[0] || fechaHoraStr;
  }
};

/**
 * Returns a formatted time string in 12h format (e.g. "09:00 AM").
 */
export const formatTime12h = (fechaHoraStr: string): string => {
  if (!fechaHoraStr) return "";
  try {
    const date = parseNaiveDateTime(fechaHoraStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};
