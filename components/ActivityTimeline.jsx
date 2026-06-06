"use client";

import { useEffect, useState } from "react";

/**
 * ActivityTimeline — Chronological read-only activity log for a ServiceRequest.
 *
 * Props:
 *   serviceRequestId  {string}  — ID of the request to show activity for.
 *   theme             {object}  — Dashboard theme tokens.
 *   dark              {boolean} — Dark mode flag.
 */

const ACTION_CONFIG = {
  STATUS_CHANGE: {
    icon: "🔄",
    bg: "#dbeafe",
    color: "#1d4ed8",
    darkBg: "rgba(37,99,235,0.18)",
    darkColor: "#93c5fd",
    label: "Status Changed",
  },
  ASSIGNMENT: {
    icon: "👤",
    bg: "#ede9fe",
    color: "#6d28d9",
    darkBg: "rgba(124,58,237,0.18)",
    darkColor: "#c4b5fd",
    label: "Assigned",
  },
  DUE_DATE_UPDATE: {
    icon: "🗓",
    bg: "#fef9c3",
    color: "#a16207",
    darkBg: "rgba(234,179,8,0.18)",
    darkColor: "#fde047",
    label: "Due Date",
  },
  DOCUMENT_UPLOAD: {
    icon: "📎",
    bg: "#dcfce7",
    color: "#15803d",
    darkBg: "rgba(21,128,61,0.18)",
    darkColor: "#86efac",
    label: "Document",
  },
  REQUEST_COMPLETION: {
    icon: "✅",
    bg: "#dcfce7",
    color: "#15803d",
    darkBg: "rgba(21,128,61,0.18)",
    darkColor: "#86efac",
    label: "Completed",
  },
  REQUEST_REJECTION: {
    icon: "↩",
    bg: "#fee2e2",
    color: "#b91c1c",
    darkBg: "rgba(239,68,68,0.18)",
    darkColor: "#fca5a5",
    label: "Returned",
  },
  NOTE_ADDED: {
    icon: "🔒",
    bg: "#faf5ff",
    color: "#7c3aed",
    darkBg: "rgba(124,58,237,0.18)",
    darkColor: "#c4b5fd",
    label: "Note Added",
  },
};

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function ActivityTimeline({ serviceRequestId, theme, dark = false }) {
  const t = theme || {
    bg: "#f1f5f9",
    cardBg: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    muted: "#64748b",
  };

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchActivities() {
    if (!serviceRequestId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/request-activity?serviceRequestId=${serviceRequestId}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
      } else {
        setError(data.message || "Failed to load activity log.");
      }
    } catch {
      setError("Network error. Could not load activity log.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceRequestId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: t.cardBg }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: t.text }}>
          📜 Activity Log
        </h3>
        <p style={{ margin: "2px 0 0", fontSize: "11px", color: t.muted }}>
          Read-only chronological history of this request.
        </p>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
            <p style={{ color: t.muted, fontSize: "13px" }}>Loading activity log…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px 14px" }}>
            <p style={{ margin: 0, color: "#b91c1c", fontSize: "13px" }}>⚠ {error}</p>
            <button
              onClick={fetchActivities}
              style={{ marginTop: "8px", background: "transparent", border: "1px solid #f87171", borderRadius: "6px", color: "#b91c1c", padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && activities.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "40px 0" }}>
            <span style={{ fontSize: "36px" }}>📜</span>
            <p style={{ color: t.muted, fontSize: "13px", textAlign: "center", margin: 0 }}>
              No activity recorded yet.<br />
              Actions will appear here automatically.
            </p>
          </div>
        )}

        {/* Timeline */}
        {!loading && activities.map((activity, idx) => {
          const cfg = ACTION_CONFIG[activity.action] || {
            icon: "🕐",
            bg: "#f1f5f9",
            color: "#475569",
            darkBg: "rgba(71,85,105,0.18)",
            darkColor: "#94a3b8",
            label: activity.action || "Activity",
          };

          const isLast = idx === activities.length - 1;
          const badgeBg    = dark ? cfg.darkBg    : cfg.bg;
          const badgeColor = dark ? cfg.darkColor : cfg.color;

          return (
            <div
              key={activity.id}
              style={{ display: "flex", gap: "12px", paddingBottom: isLast ? "0" : "18px", position: "relative" }}
            >
              {/* Left: icon + connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: badgeBg, border: `2px solid ${badgeColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0,
                }}>
                  {cfg.icon}
                </div>
                {!isLast && (
                  <div style={{
                    width: "2px", flex: 1, background: dark ? "#334155" : "#e2e8f0",
                    marginTop: "4px", marginBottom: "-4px", minHeight: "20px",
                  }} />
                )}
              </div>

              {/* Right: content */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700,
                    background: badgeBg, color: badgeColor, letterSpacing: "0.3px", textTransform: "uppercase",
                  }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: t.text }}>
                    {activity.actorName || activity.actorRole || "System"}
                  </span>
                </div>
                <p style={{ margin: "0 0 4px", fontSize: "12px", color: t.muted, lineHeight: "1.5", wordBreak: "break-word" }}>
                  {activity.description}
                </p>
                <p style={{ margin: 0, fontSize: "10px", color: dark ? "#475569" : "#94a3b8" }}>
                  {formatDateTime(activity.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
