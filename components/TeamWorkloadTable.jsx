"use client";

/**
 * TeamWorkloadTable — Shows per-team-member workload stats with indicators.
 *
 * Props:
 * workload  {Array}   — array of { memberId, memberName, email, active, completed, overdue, total }
 * theme     {Object}  — dashboard theme object (bg, cardBg, border, text, muted…)
 * dark      {boolean} — dark mode flag
 */
export default function TeamWorkloadTable({ workload = [], theme = {}, dark = false }) {
  
  // ── Data Normalization ─────────────────────────────────────────────────────
  // Adapts backend API payload safely to match the component's structure
  const normalizedWorkload = workload.map(m => ({
    memberId: m.memberId || m.id || `member-${Math.random()}`,
    memberName: m.memberName || m.name || "Unknown Member",
    email: m.email || "",
    active: typeof m.active === "number" ? m.active : (m.activeCount || 0),
    completed: typeof m.completed === "number" ? m.completed : (m.completedCount || 0),
    overdue: m.overdue || 0,
    total: typeof m.total === "number" ? m.total : (m.totalAssigned || 0)
  }));

  // ── Workload Level Calculation ─────────────────────────────────────────────
  // Based on number of active (non-completed) requests
  function getWorkloadLevel(active) {
    if (active === 0)  return { label: "Idle",   bg: dark ? "rgba(100,116,139,0.2)" : "#f1f5f9", color: "#64748b", bar: 0 };
    if (active <= 2)   return { label: "Low",    bg: dark ? "rgba(34,197,94,0.15)"  : "#dcfce7", color: "#15803d", bar: 25 };
    if (active <= 5)   return { label: "Medium", bg: dark ? "rgba(234,179,8,0.15)"  : "#fef9c3", color: "#a16207", bar: 60 };
    return               { label: "High",   bg: dark ? "rgba(239,68,68,0.15)"  : "#fee2e2", color: "#b91c1c", bar: 100 };
  }

  // Sort by active descending (busiest first)
  const sorted = [...normalizedWorkload].sort((a, b) => b.active - a.active);

  const t = {
    cardBg: "#ffffff", border: "#e2e8f0", text: "#0f172a",
    muted: "#64748b", tableTh: "#2563eb",
    ...theme,
  };

  if (sorted.length === 0) {
    return (
      <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "32px", textAlign: "center" }}>
        <p style={{ color: t.muted, fontSize: "14px", margin: 0 }}>No team members found. Add team members to see workload data.</p>
      </div>
    );
  }

  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 22px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: 700, color: t.text }}>👷 Team Workload Dashboard</h3>
          <p style={{ margin: 0, fontSize: "12px", color: t.muted }}>Active · Completed · Overdue counts per team member</p>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { label: "Idle",   color: "#64748b", bg: dark ? "rgba(100,116,139,0.2)" : "#f1f5f9" },
            { label: "Low",    color: "#15803d", bg: dark ? "rgba(34,197,94,0.15)"  : "#dcfce7" },
            { label: "Medium", color: "#a16207", bg: dark ? "rgba(234,179,8,0.15)"  : "#fef9c3" },
            { label: "High",   color: "#b91c1c", bg: dark ? "rgba(239,68,68,0.15)"  : "#fee2e2" },
          ].map(l => (
            <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: l.bg, color: l.color }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: l.color, flexShrink: 0 }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: t.tableTh }}>
              {["#", "Team Member", "Active", "Completed", "Overdue", "Total", "Workload", "Progress"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => {
              const level = getWorkloadLevel(m.active);
              const completionPct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;

              return (
                <tr key={m.memberId} style={{
                  borderBottom: `1px solid ${t.border}`,
                  background: i % 2 === 1
                    ? (dark ? "rgba(255,255,255,0.025)" : "#f8fafc")
                    : "transparent"
                }}>
                  {/* # */}
                  <td style={{ padding: "13px 16px", color: t.muted, fontSize: "12px" }}>{i + 1}</td>

                  {/* Member */}
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                        color: "#fff", fontWeight: 700, fontSize: "12px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0
                      }}>
                        {(m.memberName || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: "13px", color: t.text }}>{m.memberName}</p>
                        {m.email && <p style={{ margin: 0, fontSize: "11px", color: t.muted }}>{m.email}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Active */}
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: "999px", fontSize: "12px",
                      fontWeight: 700, background: dark ? "rgba(37,99,235,0.15)" : "#dbeafe", color: "#1d4ed8"
                    }}>
                      {m.active}
                    </span>
                  </td>

                  {/* Completed */}
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: "999px", fontSize: "12px",
                      fontWeight: 700, background: dark ? "rgba(21,128,61,0.15)" : "#dcfce7", color: "#15803d"
                    }}>
                      {m.completed}
                    </span>
                  </td>

                  {/* Overdue */}
                  <td style={{ padding: "13px 16px" }}>
                    {m.overdue > 0 ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px",
                        borderRadius: "999px", fontSize: "12px", fontWeight: 700,
                        background: dark ? "rgba(239,68,68,0.18)" : "#fee2e2", color: "#b91c1c",
                        animation: "wlPulse 2s ease-in-out infinite"
                      }}>
                        <style>{`@keyframes wlPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
                        ⚠ {m.overdue}
                      </span>
                    ) : (
                      <span style={{ color: t.muted, fontSize: "12px" }}>—</span>
                    )}
                  </td>

                  {/* Total */}
                  <td style={{ padding: "13px 16px", fontWeight: 600, color: t.text }}>{m.total}</td>

                  {/* Workload badge */}
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      padding: "3px 10px", borderRadius: "999px", fontSize: "11px",
                      fontWeight: 700, background: level.bg, color: level.color
                    }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: level.color, flexShrink: 0 }} />
                      {level.label}
                    </span>
                  </td>

                  {/* Completion progress bar */}
                  <td style={{ padding: "13px 16px", minWidth: "120px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "6px", borderRadius: "999px", background: dark ? "#334155" : "#e2e8f0", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${completionPct}%`,
                          borderRadius: "999px",
                          background: completionPct === 100
                            ? "#10b981"
                            : completionPct > 50
                            ? "#2563eb"
                            : "#f59e0b",
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                      <span style={{ fontSize: "11px", color: t.muted, whiteSpace: "nowrap", fontWeight: 500 }}>{completionPct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div style={{
        padding: "12px 22px", borderTop: `1px solid ${t.border}`,
        display: "flex", gap: "24px", flexWrap: "wrap",
        background: dark ? "rgba(255,255,255,0.02)" : "#f8fafc"
      }}>
        {[
          { label: "Team Members",         value: sorted.length,                                   color: t.text },
          { label: "Total Active",        value: sorted.reduce((s, m) => s + m.active, 0),        color: "#1d4ed8" },
          { label: "Total Completed",     value: sorted.reduce((s, m) => s + m.completed, 0),     color: "#15803d" },
          { label: "Total Overdue",       value: sorted.reduce((s, m) => s + m.overdue, 0),       color: "#b91c1c" },
          { label: "High Workload Members", value: sorted.filter(m => m.active > 5).length,       color: "#b91c1c" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <span style={{ fontSize: "10px", color: t.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{s.label}</span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}