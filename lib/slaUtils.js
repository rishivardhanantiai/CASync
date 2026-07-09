/**
 * slaUtils.js — Reusable SLA / Deadline calculation utilities
 *
 * Timezone-safe: all comparisons are done on date-only strings (YYYY-MM-DD)
 * so they work correctly regardless of the user's local timezone offset.
 */

/**
 * Returns today's date as a YYYY-MM-DD string in local time.
 */
export function todayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Converts any Date-like value to a YYYY-MM-DD string in local time.
 * Returns null if the value is falsy or invalid.
 * @param {string|Date|null|undefined} dateVal
 * @returns {string|null}
 */
export function toLocalDateString(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * @typedef {"overdue"|"due_today"|"on_track"|"no_deadline"} SLAStatus
 */

/**
 * Calculates the SLA status for a request.
 *
 * Rules:
 *  - No dueDate            → "no_deadline"
 *  - dueDate < today       → "overdue"
 *  - dueDate === today     → "due_today"
 *  - dueDate > today       → "on_track"
 *
 * Completed requests are exempt — they always return "no_deadline"
 * so the badge is hidden (no point flagging a done request as overdue).
 *
 * @param {string|Date|null|undefined} dueDate
 * @param {string} [status]  — the request status (e.g. "completed")
 * @returns {SLAStatus}
 */
export function getSLAStatus(dueDate, status) {
  // Exempt completed requests
  if (status === "completed") return "no_deadline";

  const dueDateStr = toLocalDateString(dueDate);
  if (!dueDateStr) return "no_deadline";

  const today = todayDateString();

  if (dueDateStr < today) return "overdue";
  if (dueDateStr === today) return "due_today";
  return "on_track";
}

/**
 * Returns how many days until (positive) or since (negative) the due date.
 * Returns null if no valid dueDate.
 * @param {string|Date|null|undefined} dueDate
 * @returns {number|null}
 */
export function daysFromToday(dueDate) {
  const dueDateStr = toLocalDateString(dueDate);
  if (!dueDateStr) return null;
  const today = todayDateString();
  // simple day diff via date arithmetic
  const msPerDay = 86400000;
  const diff = new Date(dueDateStr).getTime() - new Date(today).getTime();
  return Math.round(diff / msPerDay);
}

/**
 * Visual config for each SLA status — colours and labels.
 */
export const SLA_CONFIG = {
  overdue: {
    label: "Overdue",
    bg: "#fee2e2",
    color: "#b91c1c",
    darkBg: "rgba(239,68,68,0.18)",
    darkColor: "#fca5a5",
    icon: "🔴",
    pulse: true,
  },
  due_today: {
    label: "Due Today",
    bg: "#fef9c3",
    color: "#a16207",
    darkBg: "rgba(234,179,8,0.18)",
    darkColor: "#fde047",
    icon: "🟡",
    pulse: false,
  },
  on_track: {
    label: "On Track",
    bg: "#dcfce7",
    color: "#15803d",
    darkBg: "rgba(34,197,94,0.18)",
    darkColor: "#86efac",
    icon: "🟢",
    pulse: false,
  },
  no_deadline: null, // render nothing
};
