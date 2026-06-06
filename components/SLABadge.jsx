"use client";

/**
 * SLABadge — Reusable SLA Deadline Indicator badge.
 *
 * Props:
 *  dueDate  {string|Date|null}  — the request's dueDate
 *  status   {string}            — the request's workflow status (e.g. "completed")
 *  dark     {boolean}           — dark-mode flag (optional)
 *  showDate {boolean}           — show the actual due date below the label (optional)
 */

import { getSLAStatus, daysFromToday, SLA_CONFIG, toLocalDateString } from "@/lib/slaUtils";

export default function SLABadge({ dueDate, status, dark = false, showDate = false }) {
  const slaStatus = getSLAStatus(dueDate, status);
  const cfg = SLA_CONFIG[slaStatus];

  // Render nothing when there's no meaningful SLA state
  if (!cfg) return null;

  const days = daysFromToday(dueDate);
  const dueDateStr = toLocalDateString(dueDate);

  // Sub-label: e.g. "3 days left", "2 days ago"
  let subLabel = null;
  if (days !== null) {
    if (days > 0)  subLabel = `${days}d left`;
    else if (days < 0) subLabel = `${Math.abs(days)}d ago`;
    // days === 0 → "Due Today" is enough
  }

  const bg    = dark ? cfg.darkBg    : cfg.bg;
  const color = dark ? cfg.darkColor : cfg.color;

  return (
    <span
      title={dueDateStr ? `Due: ${dueDateStr}` : cfg.label}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            "4px",
        padding:        "3px 9px",
        borderRadius:   "999px",
        fontSize:       "11px",
        fontWeight:     700,
        background:     bg,
        color:          color,
        whiteSpace:     "nowrap",
        letterSpacing:  "0.2px",
        // Subtle pulse animation for overdue
        animation:      cfg.pulse ? "slaPulse 2s ease-in-out infinite" : "none",
        // Embed keyframes inline via style tag workaround below
      }}
    >
      <style>{`
        @keyframes slaPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>

      {/* Coloured dot */}
      <span style={{
        width:        "6px",
        height:       "6px",
        borderRadius: "50%",
        background:   color,
        flexShrink:   0,
      }} />

      {cfg.label}

      {subLabel && (
        <span style={{ opacity: 0.75, fontWeight: 500, fontSize: "10px" }}>
          &nbsp;({subLabel})
        </span>
      )}
    </span>
  );
}
