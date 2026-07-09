"use client";

import { useEffect, useState } from "react";
import { showToast, ToastContainer } from "@/components/Toast";
import RequestDetailView from "@/components/RequestDetailView";
import SLABadge from "@/components/SLABadge";
import TeamWorkloadTable from "@/components/TeamWorkloadTable";
import RequestFilterBar, { DEFAULT_FILTERS, applyRequestFilters } from "@/components/RequestFilterBar";

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "serviceRequests", label: "Service Requests", icon: "📋" },
  { id: "registeredUsers", label: "Clients", icon: "👥" },
  { id: "adminManagement", label: "Admin Management", icon: "🛡" },
  { id: "teamManagement", label: "Team Management", icon: "👷" },
  { id: "documents", label: "Documents", icon: "📁" },
  { id: "activityLog", label: "Activity Log", icon: "📜" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    in_progress: { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8" },
    submitted: { label: "Submitted", bg: "#fef9c3", color: "#a16207" },
    pending_review: { label: "Pending Review", bg: "#fef08a", color: "#854d0e" },
    completed: { label: "Completed", bg: "#dcfce7", color: "#15803d" },
    pending_docs: { label: "Pending Docs", bg: "#fee2e2", color: "#b91c1c" },
  };
  const s = map[status] || { label: status, bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: "999px", fontSize: "11px",
      fontWeight: 600, background: s.bg, color: s.color
    }}>{s.label}</span>
  );
}

// ─── Simple bar chart using CSS (Interactive) ────────────────────────────────
function BarChart({ data, timeData = [], color = "#2563eb", theme, darkMode }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [chartType, setChartType] = useState("bar");
  
  const activeData = chartType === "line" && timeData.length > 0 ? timeData : data;
  
  const max = Math.max(...activeData.map(d => d.value), 1);
  const gridLines = [0.25, 0.5, 0.75, 1];

  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;
  const chartWidth = 700 - paddingLeft - paddingRight;
  const chartHeight = 300 - paddingTop - paddingBottom;
  const zeroY = 300 - paddingBottom;

  const points = activeData.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, activeData.length - 1)) * chartWidth;
    const y = zeroY - (d.value / max) * chartHeight;
    return { x, y, value: d.value, label: d.label, completed: d.completed, pending: d.pending };
  });

  const totalPoints = points;
  const completedPoints = activeData.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, activeData.length - 1)) * chartWidth;
    const y = zeroY - ((d.completed || 0) / max) * chartHeight;
    return { x, y };
  });
  const pendingPoints = activeData.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, activeData.length - 1)) * chartWidth;
    const y = zeroY - ((d.pending || 0) / max) * chartHeight;
    return { x, y };
  });

  const linePathTotal = totalPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const linePathCompleted = completedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const linePathPending = pendingPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPathTotal = totalPoints.length > 0 ? `${linePathTotal} L ${totalPoints[totalPoints.length - 1].x} ${zeroY} L ${totalPoints[0].x} ${zeroY} Z` : '';

  return (
    <div style={{ position: "relative", height: "300px", padding: "10px 0 20px 0" }}>
      {/* Chart Type Toggle */}
      <div style={{
        position: "absolute",
        top: "-42px",
        right: "0px",
        display: "flex",
        gap: "4px",
        background: theme?.border || "rgba(0,0,0,0.05)",
        padding: "2px",
        borderRadius: "6px",
        zIndex: 2
      }}>
        <button
          onClick={() => setChartType("bar")}
          style={{
            padding: "4px 10px",
            background: chartType === "bar" ? color : "transparent",
            color: chartType === "bar" ? "#fff" : (theme?.muted || "#94a3b8"),
            border: "none",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          📊 Bar
        </button>
        <button
          onClick={() => setChartType("line")}
          style={{
            padding: "4px 10px",
            background: chartType === "line" ? color : "transparent",
            color: chartType === "line" ? "#fff" : (theme?.muted || "#94a3b8"),
            border: "none",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          📈 Line
        </button>
      </div>

      {chartType === "bar" ? (
        <>
          {gridLines.map((line, idx) => (
            <div key={idx} style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: `${line * 100}%`,
              borderBottom: `1px dashed ${theme?.border || "#e2e8f0"}`,
              opacity: 0.5,
              zIndex: 1
            }} />
          ))}
          
          <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "100%", position: "relative", zIndex: 2 }}>
            {data.map((d, i) => {
              const isHovered = hoveredIdx === i;
              return (
                <div key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", cursor: "pointer", position: "relative" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%", minHeight: "120px" }}>
                    <div style={{
                      width: "100%",
                      height: `${(d.value / max) * 100}%`,
                      background: isHovered ? `linear-gradient(180deg, #60a5fa, ${color})` : `linear-gradient(180deg, ${color}dd, ${color})`,
                      borderRadius: "6px 6px 0 0",
                      minHeight: d.value > 0 ? "8px" : "0",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: isHovered ? `0 0 20px ${color}88, 0 4px 10px rgba(0,0,0,0.1)` : "none",
                      transform: isHovered ? "scaleY(1.03)" : "none",
                      transformOrigin: "bottom"
                    }} />
                  </div>
                  
                  {isHovered && (
                    <div style={{
                      position: "absolute",
                      bottom: `${(d.value / max) * 100 + 20}%`,
                      background: "#0f172a",
                      color: "#fff",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                      border: "1px solid #334155",
                      zIndex: 10,
                      pointerEvents: "none"
                    }}>
                      {d.label}: <strong>{d.value}</strong> requests
                    </div>
                  )}
                  <span style={{ fontSize: "11px", color: isHovered ? color : (theme?.muted || "#94a3b8"), fontWeight: isHovered ? 600 : 500, transition: "color 0.2s" }}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <svg viewBox="0 0 700 300" style={{ width: "100%", height: "100%", display: "block" }}>
            <defs>
              <linearGradient id={`area-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {gridLines.map((line, idx) => {
              const y = zeroY - line * chartHeight;
              return (
                <line
                  key={idx}
                  x1={paddingLeft}
                  y1={y}
                  x2={700 - paddingRight}
                  y2={y}
                  stroke={theme?.border || "#cbd5e1"}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
              );
            })}

            <line
              x1={paddingLeft}
              y1={zeroY}
              x2={700 - paddingRight}
              y2={zeroY}
              stroke={theme?.border || "#cbd5e1"}
              strokeWidth="1.5"
            />
            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={zeroY}
              stroke={theme?.border || "#cbd5e1"}
              strokeWidth="1.5"
            />

            {[0, Math.round(max * 0.5), max].map((val, idx) => {
              const y = zeroY - (val / max) * chartHeight;
              return (
                <text
                  key={idx}
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill={theme?.muted || "#94a3b8"}
                  style={{ fontSize: "10px", fontWeight: 500, fontFamily: "inherit" }}
                >
                  {val}
                </text>
              );
            })}

            {totalPoints.length > 0 && (
              <path
                d={areaPathTotal}
                fill={`url(#area-gradient-${color.replace('#', '')})`}
                style={{ transition: "all 0.3s ease" }}
              />
            )}

            {/* Total Requests Line */}
            {totalPoints.length > 0 && (
              <path
                d={linePathTotal}
                fill="none"
                stroke={color}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: "all 0.3s ease" }}
              />
            )}

            {/* Completed Requests Line */}
            {completedPoints.length > 0 && (
              <path
                d={linePathCompleted}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: "all 0.3s ease" }}
              />
            )}

            {/* Pending Requests Line */}
            {pendingPoints.length > 0 && (
              <path
                d={linePathPending}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: "all 0.3s ease" }}
              />
            )}

            {/* Total dots */}
            {totalPoints.map((p, i) => {
              const isActive = hoveredIdx === i;
              return (
                <g key={`total-${i}`}>
                  {isActive && (
                    <circle cx={p.x} cy={p.y} r="9" fill={color} opacity="0.25" style={{ transition: "all 0.15s ease" }} />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? "6" : "4.5"}
                    fill={darkMode ? "#1e293b" : "#fff"}
                    stroke={color}
                    strokeWidth={isActive ? "3" : "2"}
                    style={{ transition: "all 0.15s ease", cursor: "pointer" }}
                  />
                </g>
              );
            })}

            {/* Completed dots */}
            {completedPoints.map((p, i) => {
              const isActive = hoveredIdx === i;
              return (
                <g key={`completed-${i}`}>
                  {isActive && (
                    <circle cx={p.x} cy={p.y} r="8" fill="#10b981" opacity="0.25" style={{ transition: "all 0.15s ease" }} />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? "5" : "3.5"}
                    fill={darkMode ? "#1e293b" : "#fff"}
                    stroke="#10b981"
                    strokeWidth="2"
                    style={{ transition: "all 0.15s ease", cursor: "pointer" }}
                  />
                </g>
              );
            })}

            {/* Pending dots */}
            {pendingPoints.map((p, i) => {
              const isActive = hoveredIdx === i;
              return (
                <g key={`pending-${i}`}>
                  {isActive && (
                    <circle cx={p.x} cy={p.y} r="8" fill="#f59e0b" opacity="0.25" style={{ transition: "all 0.15s ease" }} />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? "5" : "3.5"}
                    fill={darkMode ? "#1e293b" : "#fff"}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    style={{ transition: "all 0.15s ease", cursor: "pointer" }}
                  />
                </g>
              );
            })}

            {totalPoints.map((p, i) => (
              <text
                key={i}
                x={p.x}
                y={zeroY + 16}
                textAnchor="middle"
                fill={hoveredIdx === i ? color : (theme?.muted || "#94a3b8")}
                style={{ fontSize: "10px", fontWeight: hoveredIdx === i ? 600 : 500, fontFamily: "inherit", transition: "fill 0.2s" }}
              >
                {p.label}
              </text>
            ))}

            {hoveredIdx !== null && (
              <line
                x1={points[hoveredIdx].x}
                y1={paddingTop}
                x2={points[hoveredIdx].x}
                y2={zeroY}
                stroke={theme?.border || "#cbd5e1"}
                strokeWidth="1"
                strokeDasharray="4 4"
                pointerEvents="none"
              />
            )}
          </svg>

          {points.map((p, i) => {
            const numPoints = activeData.length;
            const sliceWidth = chartWidth / (numPoints - 1 || 1);
            let leftX = p.x - sliceWidth / 2;
            let widthX = sliceWidth;
            if (i === 0) {
              leftX = paddingLeft;
              widthX = sliceWidth / 2;
            } else if (i === numPoints - 1) {
              widthX = sliceWidth / 2;
            }
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  position: "absolute",
                  left: `${(leftX / 700) * 100}%`,
                  width: `${(widthX / 700) * 100}%`,
                  top: "0px",
                  bottom: "0px",
                  cursor: "pointer",
                  zIndex: 5
                }}
              />
            );
          })}

          {hoveredIdx !== null && (
            <div style={{
              position: "absolute",
              left: `${(points[hoveredIdx].x / 700) * 100}%`,
              bottom: `${((zeroY - points[hoveredIdx].y) / 300) * 100 + 10}%`,
              transform: "translateX(-50%)",
              background: "#0f172a",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "11px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
              border: "1px solid #334155",
              zIndex: 10,
              pointerEvents: "none",
              transition: "all 0.1s ease",
              minWidth: "135px"
            }}>
              <div style={{ fontWeight: 700, borderBottom: "1px solid #334155", paddingBottom: "4px", marginBottom: "6px" }}>{points[hoveredIdx].label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#60a5fa" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2563eb" }} /> Total:</span>
                  <strong>{points[hoveredIdx].value}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#34d399" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} /> Completed:</span>
                  <strong>{points[hoveredIdx].completed || 0}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fbbf24" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b" }} /> Pending:</span>
                  <strong>{points[hoveredIdx].pending || 0}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend for Line Chart */}
      {chartType === "line" && (
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "12px", fontSize: "11px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: theme?.muted || "#64748b" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} /> Total Requests
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: theme?.muted || "#64748b" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} /> Completed
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: theme?.muted || "#64748b" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} /> Pending
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Interactive SVG Pie/Donut Chart ────────────────────────────────────────────────
function PieChart({ data, theme, darkMode }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 0;
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  
  let currentAngle = 0;
  const segments = data.map((d, i) => {
    const percentage = d.value / (total || 1);
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...d,
      startAngle,
      angle,
      percentage,
      color: colors[i % colors.length]
    };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "28px", padding: "10px 0" }}>
      <div style={{ position: "relative", width: "130px", height: "130px", flexShrink: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
          {segments.map((s, i) => {
            if (s.value === 0) return null;
            const x1 = 50 + 40 * Math.cos((s.startAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((s.startAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos(((s.startAngle + s.angle) * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin(((s.startAngle + s.angle) * Math.PI) / 180);
            const largeArc = s.angle > 180 ? 1 : 0;
            const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const isHovered = hoveredIdx === i;

            return (
              <path
                key={i}
                d={pathData}
                fill={s.color}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  transition: "all 0.25s ease-in-out",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "50px 50px",
                  cursor: "pointer",
                  filter: isHovered ? `drop-shadow(0 0 8px ${s.color}aa)` : "none",
                  opacity: hoveredIdx !== null && !isHovered ? 0.55 : 1
                }}
              />
            );
          })}
          
          {/* Donut Center Hole */}
          <circle cx="50" cy="50" r="25" fill={theme?.cardBg || "#ffffff"} />
          
          {total === 0 && (
            <circle cx="50" cy="50" r="40" fill="#e2e8f0" />
          )}
        </svg>
        
        {/* Center label */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
          width: "50px"
        }}>
          <span style={{ fontSize: "10px", color: theme?.muted || "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Total</span>
          <span style={{ fontSize: "16px", fontWeight: 800, color: theme?.text || "#0f172a", lineHeight: 1.1 }}>{total}</span>
        </div>

        {hoveredIdx !== null && segments[hoveredIdx].value > 0 && (
          <div style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translate(-50%, -100%)",
            background: "#0f172a",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 600,
            textAlign: "center",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            pointerEvents: "none",
            zIndex: 10,
            border: "1px solid #334155",
            whiteSpace: "nowrap"
          }}>
            {segments[hoveredIdx].label}: <strong>{segments[hoveredIdx].value}</strong> ({Math.round(segments[hoveredIdx].percentage * 100)}%)
          </div>
        )}
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {segments.map((s, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.5 : 1,
              transition: "opacity 0.2s"
            }}
          >
            <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: hoveredIdx === i ? s.color : (theme?.text || "#64748b"), fontWeight: hoveredIdx === i ? 700 : 500 }}>
              {s.label} ({s.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [activeView, setActiveView] = useState("loginPage");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Login
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Add admin form
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  // Data from API
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Add team member form
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Team");
  const [newMemberServices, setNewMemberServices] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  // Allocate clients modal
  const [allocateModal, setAllocateModal] = useState(null);
  const [allocateSelected, setAllocateSelected] = useState([]);
  const [allocateSaving, setAllocateSaving] = useState(false);

  // Documents upload form
  const [docClientId, setDocClientId] = useState("");
  const [docClientEmail, setDocClientEmail] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docNote, setDocNote] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docSearch, setDocSearch] = useState(""); 

  // Service requests (Real data)
  const [serviceRequests, setServiceRequests] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalRevenue: 0
  });
  const [teamWorkload, setTeamWorkload] = useState([]);
  const [srFilters, setSrFilters] = useState({ ...DEFAULT_FILTERS });
  const [requestActivities, setRequestActivities] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [srMode, setSrMode] = useState(null);
  const [editForm, setEditForm] = useState({}); 
  const [detailsData, setDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Settings state
  const [slaDefault, setSlaDefault] = useState("7");
  const [allowReg, setAllowReg] = useState(true);
  const [autoAssign, setAutoAssign] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);

  // Added States for Unified UX, Filters & Role Controls
  const [newAdminRole, setNewAdminRole] = useState("Admin");
  const [adminTab, setAdminTab] = useState("list"); // "list" | "add"
  const [teamTab, setTeamTab] = useState("list");   // "list" | "add"
  const [docStartDate, setDocStartDate] = useState("");
  const [docEndDate, setDocEndDate] = useState("");
  const [docSortFilter, setDocSortFilter] = useState("newest");
  const [selectedClientForView, setSelectedClientForView] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const [hoveredStat, setHoveredStat] = useState(null);
  const [colSrId, setColSrId] = useState("");
  const [colClient, setColClient] = useState("");
  const [colService, setColService] = useState("");
  const [colAssigned, setColAssigned] = useState("");
  const [colStatus, setColStatus] = useState("");
  const [colDate, setColDate] = useState("");
  const [colIdentifier, setColIdentifier] = useState("");
  const [colFY, setColFY] = useState("");
  const [colMonth, setColMonth] = useState("");
  const [colPriority, setColPriority] = useState("");
  const [colDueDate, setColDueDate] = useState("");
  const [colPayment, setColPayment] = useState("");

  // Add team member permissions
  const [rightsAllRequests, setRightsAllRequests] = useState(false);
  const [rightsEditRequestId, setRightsEditRequestId] = useState(false);
  const [rightsChangePayment, setRightsChangePayment] = useState(false);
  const [rightsDeleteDocuments, setRightsDeleteDocuments] = useState(false);

  // Edit team member permissions
  const [editRightsAllRequests, setEditRightsAllRequests] = useState(false);
  const [editRightsEditRequestId, setEditRightsEditRequestId] = useState(false);
  const [editRightsChangePayment, setEditRightsChangePayment] = useState(false);
  const [editRightsDeleteDocuments, setEditRightsDeleteDocuments] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [activityStartDate, setActivityStartDate] = useState("");
  const [activityEndDate, setActivityEndDate] = useState("");
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [activeTeamActionMenu, setActiveTeamActionMenu] = useState(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberEmail, setEditMemberEmail] = useState("");
  const [editMemberPhone, setEditMemberPhone] = useState("");
  const [editMemberRole, setEditMemberRole] = useState("Team");
  const [editMemberServices, setEditMemberServices] = useState("");
  const [editMemberPassword, setEditMemberPassword] = useState("");
  const [editMemberConfirmPassword, setEditMemberConfirmPassword] = useState("");

  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminPhone, setEditAdminPhone] = useState("");
  const [editAdminRole, setEditAdminRole] = useState("Admin");
  const [editAdminPassword, setEditAdminPassword] = useState("");

  const isSuperAdmin = currentAdmin?.role === "Super Admin";
  const isAdmin = currentAdmin?.role === "Admin" || currentAdmin?.role === "Super Admin";

  function triggerConfirm(title, message, onConfirm) {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
      }
    });
  }

  // ── API helpers ──────────────────────────────────────────────────────────────
  async function loadUsers() {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch { console.log("Error loading users"); }
  }

  useEffect(() => {
    try {
      const cu = JSON.parse(localStorage.getItem("currentUser") || "null");
      setCurrentUser(cu);
    } catch (_) { setCurrentUser(null); }
  }, []);

  // Body scroll lock effect
  useEffect(() => {
    const hasOpenModal = !!(showHistoryModal || selectedClientForView || allocateModal || confirmModal.isOpen || editingTeamMember || editingAdmin || srMode);
    if (hasOpenModal) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showHistoryModal, selectedClientForView, allocateModal, confirmModal.isOpen, editingTeamMember, editingAdmin, srMode]);

  useEffect(() => {
    try {
      const ca = JSON.parse(localStorage.getItem("currentAdmin") || "null");
      setCurrentAdmin(ca);
    } catch (_) { setCurrentAdmin(null); }
  }, []);

  async function loadAdmins() {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/all-admins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAdmins(data.admins);
    } catch { console.log("Error loading admins"); }
  }

  async function loadTeamMembers() {
    try {
      const res = await fetch("/api/team/all-members");
      const data = await res.json();
      if (data.success) setTeamMembers(data.members);
    } catch { console.log("Error loading team members"); }
  }

  async function loadDocuments() {
    try {
      const res = await fetch("/api/documents/list");
      const data = await res.json();
      if (data.success) setDocuments(data.documents);
    } catch { console.log("Error loading documents"); }
  }

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        if (data.teamWorkload) setTeamWorkload(data.teamWorkload);
      }
    } catch { console.log("Error loading stats"); }
  }

  async function loadRequests() {
    try {
      const res = await fetch("/api/admin/service-requests");
      const data = await res.json();
      if (data.success) setServiceRequests(data.requests);
    } catch { console.log("Error loading requests"); }
  }

  async function loadRequestActivities() {
    try {
      const res = await fetch("/api/request-activity?limit=120");
      const data = await res.json();
      if (data.success) setRequestActivities(data.activities || []);
    } catch { console.log("Error loading request activity"); }
  }

  async function loadAllData() {
    const token = localStorage.getItem("adminToken");
    if (token) {
      loadStats();
      loadRequests();
      loadUsers();
      loadTeamMembers();
      loadDocuments();
      loadAdmins();
      loadRequestActivities();
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  async function openAllocateModal(member) {
    if (users.length === 0) await loadUsers();
    setAllocateSelected(member.allocatedClientIds || []);
    setAllocateModal(member);
  }

  async function saveAllocation() {
    if (!allocateModal) return;
    setAllocateSaving(true);
    try {
      const res = await fetch("/api/team/allocate-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: allocateModal.id, clientIds: allocateSelected }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Allocated ${data.allocatedCount} client(s) to ${allocateModal.name}`, "success");
        setTeamMembers(prev => prev.map(m => m.id === allocateModal.id ? { ...m, allocatedClientIds: allocateSelected } : m));
        setAllocateModal(null);
      } else showToast(data.message || "Failed to allocate", "error");
    } catch { showToast("Error saving allocation", "error"); }
    setAllocateSaving(false);
  }

  async function uploadDocument() {
    if (!docFile || !docClientEmail) { showToast("Please select a client and a file", "warning"); return; }
    setDocUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        const adminData = JSON.parse(localStorage.getItem("currentAdmin") || "{}");
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: docFile.name,
            fileData: base64,
            fileSize: `${(docFile.size / 1024).toFixed(1)} KB`,
            mimeType: docFile.type,
            uploader: "admin",
            uploaderId: adminData?.id || "admin",
            uploaderName: adminData?.name || adminData?.email || "Admin",
            clientId: docClientId,
            clientEmail: docClientEmail,
            title: docTitle,
            note: docNote,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Document uploaded successfully!", "success");
          setDocFile(null); setDocTitle(""); setDocNote(""); setDocClientId(""); setDocClientEmail("");
          loadDocuments();
        } else showToast(data.message || "Upload failed", "error");
        setDocUploading(false);
      };
      reader.readAsDataURL(docFile);
    } catch { showToast("Error uploading document", "error"); setDocUploading(false); }
  }

  async function downloadDocument(docId, fileName) {
    try {
      const res = await fetch(`/api/documents/list?download=${docId}`);
      const data = await res.json();
      if (data.success && data.document?.fileData) {
        const a = document.createElement("a");
        a.href = data.document.fileData;
        a.download = fileName;
        a.click();
      } else showToast("Failed to download", "error");
    } catch { showToast("Download error", "error"); }
  }

  async function addTeamMember() {
    if (!newMemberEmail || !newMemberPassword || !newMemberName) {
      showToast("Name, email and password required", "warning"); return;
    }
    try {
      const services = newMemberServices.split(",").map(s => s.trim()).filter(Boolean);
      if (rightsAllRequests) services.push("permission_allRequests");
      if (rightsEditRequestId) services.push("permission_editRequestId");
      if (rightsChangePayment) services.push("permission_changePayment");
      if (rightsDeleteDocuments) services.push("permission_deleteDocuments");

      const res = await fetch("/api/team/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMemberName, email: newMemberEmail, phone: newMemberPhone, password: newMemberPassword, role: newMemberRole, services }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Team member added!", "success");
        setNewMemberName(""); setNewMemberEmail(""); setNewMemberPhone(""); setNewMemberPassword(""); setNewMemberRole("Team"); setNewMemberServices("");
        setRightsAllRequests(false);
        setRightsEditRequestId(false);
        setRightsChangePayment(false);
        setRightsDeleteDocuments(false);
        loadTeamMembers();
        navigate("teamManagement");
      } else { showToast(data.message || "Failed to add member", "error"); }
    } catch { showToast("Error adding team member.", "error"); }
  }

  const startEditingTeam = (m) => {
    setEditingTeamMember(m);
    setEditMemberName(m.name || "");
    setEditMemberEmail(m.email || "");
    setEditMemberPhone(m.phone || "");
    setEditMemberRole(m.role || "Team");
    setEditMemberServices((m.services || []).filter(s => !s.startsWith("permission_")).join(", "));
    
    // Set edit checkboxes
    setEditRightsAllRequests((m.services || []).includes("permission_allRequests"));
    setEditRightsEditRequestId((m.services || []).includes("permission_editRequestId"));
    setEditRightsChangePayment((m.services || []).includes("permission_changePayment"));
    setEditRightsDeleteDocuments((m.services || []).includes("permission_deleteDocuments"));

    setEditMemberPassword("");
    setEditMemberConfirmPassword("");
  };

  async function saveTeamMemberEdits() {
    if (!editingTeamMember) return;
    if (editMemberPassword) {
      if (editMemberPassword.length < 6) {
        showToast("Password must be at least 6 characters long", "error");
        return;
      }
      if (editMemberPassword !== editMemberConfirmPassword) {
        showToast("Passwords do not match", "error");
        return;
      }
    }
    try {
      const services = editMemberServices.split(",").map(s => s.trim()).filter(Boolean);
      if (editRightsAllRequests) services.push("permission_allRequests");
      if (editRightsEditRequestId) services.push("permission_editRequestId");
      if (editRightsChangePayment) services.push("permission_changePayment");
      if (editRightsDeleteDocuments) services.push("permission_deleteDocuments");

      const res = await fetch("/api/team/update-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTeamMember.id,
          name: editMemberName,
          email: editMemberEmail,
          phone: editMemberPhone,
          role: editMemberRole,
          services,
          password: editMemberPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Team member updated successfully", "success");
        setTeamMembers(prev => prev.map(m => m.id === editingTeamMember.id ? { ...m, name: editMemberName, email: editMemberEmail, phone: editMemberPhone, role: editMemberRole, services } : m));
        setEditingTeamMember(null);
      } else {
        showToast(data.message || "Failed to update", "error");
      }
    } catch {
      showToast("Error updating team member", "error");
    }
  }

  const startEditingAdmin = (a) => {
    setEditingAdmin(a);
    setEditAdminName(a.name || "");
    setEditAdminEmail(a.email || "");
    setEditAdminPhone(a.phone || a.mobile || "");
    setEditAdminRole(a.role || "Admin");
    setEditAdminPassword("");
  };

  async function saveAdminEdits() {
    if (!editingAdmin) return;
    try {
      const res = await fetch("/api/admin/update-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAdmin.id,
          name: editAdminName,
          email: editAdminEmail,
          phone: editAdminPhone,
          role: editAdminRole,
          password: editAdminPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Admin updated successfully", "success");
        setAdmins(prev => prev.map(a => a.id === editingAdmin.id ? { ...a, name: editAdminName, email: editAdminEmail, phone: editAdminPhone, role: editAdminRole } : a));
        setEditingAdmin(null);
      } else {
        showToast(data.message || "Failed to update", "error");
      }
    } catch {
      showToast("Error updating admin", "error");
    }
  }

  useEffect(() => {
    try {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("currentAdmin");
    } catch (_) {}
    setActiveView("loginPage");
  }, []);

  function closeSrModal() {
    setSelectedRequest(null);
    setSrMode(null);
    setEditForm({});
    setDetailsData(null);
    if (activeView === "request-detail") setActiveView("serviceRequests");
  }

  async function saveRequestEdits() {
    if (!selectedRequest) return;
    try {
      const payload = {
        id: selectedRequest.id,
        newId: editForm.newId,
        isDummy: editForm.isDummy,
        assignedToName: editForm.assignedToName,
        assignedToId: editForm.assignedToId,
        reviewerName: editForm.reviewerName,
        reviewerId: editForm.reviewerId,
        priority: editForm.priority,
        status: editForm.status,
        referenceId: editForm.referenceId,
        customRequestId: editForm.customRequestId,
        actorId: currentAdmin?.id || currentAdmin?.email || "admin",
        actorEmail: currentAdmin?.email || null,
        actorName: currentAdmin?.name || currentAdmin?.email || "Admin",
        actorRole: "admin",
      };
      
      if (editForm.dueDate !== undefined) {
        payload.dueDate = editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null;
      }
      
      const res = await fetch("/api/admin/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Request updated", "success");
        loadRequests();
        loadStats();
        loadRequestActivities();
        closeSrModal();
      } else showToast(data.message || "Update failed", "error");
    } catch { showToast("Error updating request", "error"); }
  }

  async function login() {
    if (!adminEmail || !adminPassword) { showToast("Please fill all fields", "warning"); return; }
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("currentAdmin", JSON.stringify(data.admin));
        setCurrentAdmin(data.admin);
        setActiveView("dashboard");
        loadAllData();
        showToast("Welcome back, Admin!", "success");
      } else {
        showToast(data.message || "Incorrect Credentials", "error");
      }
    } catch { showToast("Login failed. Please try again.", "error"); }
  }

  function logout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("currentAdmin");
    setAdminEmail(""); setAdminPassword("");
    setCurrentAdmin(null);
    setUsers([]);
    setAdmins([]);
    setTeamMembers([]);
    setDocuments([]);
    setServiceRequests([]);
    setActiveView("loginPage");
    showToast("Logged out successfully", "info");
    setTimeout(() => { window.location.reload(); }, 500);
  }

  function logoutClient(event) {
    event?.preventDefault();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    setCurrentUser(null);
    showToast("Logged out successfully", "info");
    setTimeout(() => { window.location.reload(); }, 500);
  }

  async function addAdmin() {
    if (!newAdminEmail || !newAdminPassword) { showToast("Email and Password required", "warning"); return; }
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newAdminName, email: newAdminEmail, phone: newAdminPhone, password: newAdminPassword, role: newAdminRole }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Admin Added Successfully!", "success");
        setNewAdminName(""); setNewAdminEmail(""); setNewAdminPhone(""); setNewAdminPassword(""); setNewAdminRole("Admin");
        loadAdmins();
        setAdminTab("list");
      } else {
        showToast(data.message || "Failed to add admin", "error");
      }
    } catch { showToast("Error adding admin.", "error"); }
  }

  async function updateRequestStatus(id, newStatus, customNotes = null) {
    let adminNotes = customNotes;
    
    if (newStatus === "pending_docs" && !customNotes) {
      const reason = prompt("Please enter the reason for return / missing documents:");
      if (reason === null) return;
      const req = serviceRequests.find(r => r.id === id);
      let parsed = { notes: reason, tasks: [], missingDocs: [] };
      try {
        if(req?.adminNotes) {
            const oldData = JSON.parse(req.adminNotes);
            parsed.tasks = oldData.tasks || [];
            parsed.missingDocs = oldData.missingDocs || [];
        }
      } catch(e) {}
      adminNotes = JSON.stringify(parsed);
    }

    try {
      const res = await fetch("/api/admin/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
          adminNotes,
          actorId: currentAdmin?.id || currentAdmin?.email || "admin",
          actorEmail: currentAdmin?.email || null,
          actorName: currentAdmin?.name || currentAdmin?.email || "Admin",
          actorRole: "admin",
        })
      });
      const data = await res.json();
      if (data.success) {
        setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, adminNotes: adminNotes || r.adminNotes } : r));
        setSelectedRequest(prev => prev?.id === id ? { ...prev, status: newStatus, adminNotes: adminNotes || prev.adminNotes } : prev);
        loadRequestActivities();
        showToast(`Status updated to ${newStatus.replace("_", " ")}`, "success");
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch { showToast("Error updating status.", "error"); }
  }

  async function updateRequestId(id, newId) {
    try {
      const res = await fetch("/api/admin/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          newId,
          actorId: currentAdmin?.id || currentAdmin?.email || "admin",
          actorEmail: currentAdmin?.email || null,
          actorName: currentAdmin?.name || currentAdmin?.email || "Admin",
          actorRole: "admin",
        })
      });
      const data = await res.json();
      if (data.success) {
        setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, id: newId } : r));
        setSelectedRequest(prev => prev?.id === id ? { ...prev, id: newId } : prev);
        showToast("Request ID updated successfully", "success");
        loadRequests();
      } else {
        showToast(data.message || "Failed to update Request ID", "error");
      }
    } catch { showToast("Error updating Request ID", "error"); }
  }

  async function viewRequestDetails(request) {
    setSelectedRequest(request);
    setSrMode("view");
    setLoadingDetails(true);
    setDetailsData(null);
    setActiveView("request-detail");
    try {
      const res = await fetch(`/api/admin/service-requests/details?id=${request.referenceId}&type=${request.serviceType}`);
      const data = await res.json();
      if (data.success) {
        setDetailsData(data.data);
      } else {
        showToast(data.message || "Failed to fetch details", "error");
      }
    } catch {
      showToast("Error fetching details", "error");
    } finally {
      setLoadingDetails(false);
    }
  }

  function navigate(view) {
    setActiveView(view);
    setMobileSidebarOpen(false);
    if (view === "registeredUsers") loadUsers();
    if (view === "adminManagement") { loadAdmins(); setAdminTab("list"); }
    if (view === "teamManagement") { loadTeamMembers(); loadUsers(); setTeamTab("list"); }
    if (view === "documents") { loadDocuments(); loadUsers(); }
  }

  const activeAdminRequests = serviceRequests.filter(r => !r.isDummy && !(r.status?.toLowerCase() === "completed" && r.paymentStatus === "paid"));
  const totalReq = activeAdminRequests.length;
  const pendingReq = activeAdminRequests.filter(r => r.status?.toLowerCase() !== "completed").length;
  const completedReq = activeAdminRequests.filter(r => r.status?.toLowerCase() === "completed").length;
  const inProgressReq = activeAdminRequests.filter(r => r.status?.toLowerCase() === "in_progress").length;
  const completionRate = Math.round((completedReq / Math.max(totalReq, 1)) * 100);

  const requestsByService = [
    { label: "GST", value: serviceRequests.filter(r => (r.serviceType || "").includes("GST")).length },
    { label: "ITR", value: serviceRequests.filter(r => (r.serviceType || "").includes("ITR")).length },
    { label: "PAN", value: serviceRequests.filter(r => (r.serviceType || "").includes("PAN")).length },
    { label: "Others", value: serviceRequests.filter(r => !(r.serviceType || "").includes("GST") && !(r.serviceType || "").includes("ITR") && !(r.serviceType || "").includes("PAN")).length },
  ];

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const requestsByTime = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = months[d.getMonth()];
    const yName = d.getFullYear().toString().slice(-2);
    const label = `${mName} '${yName}`;
    const value = serviceRequests.filter(r => {
      if (!r.createdAt) return false;
      const rc = new Date(r.createdAt);
      return rc.getMonth() === d.getMonth() && rc.getFullYear() === d.getFullYear();
    }).length;
    
    const completed = serviceRequests.filter(r => {
      if (!r.createdAt) return false;
      const rc = new Date(r.createdAt);
      return rc.getMonth() === d.getMonth() && rc.getFullYear() === d.getFullYear() && r.status?.toLowerCase() === "completed";
    }).length;

    const pending = serviceRequests.filter(r => {
      if (!r.createdAt) return false;
      const rc = new Date(r.createdAt);
      return rc.getMonth() === d.getMonth() && rc.getFullYear() === d.getFullYear() && r.status?.toLowerCase() !== "completed";
    }).length;

    requestsByTime.push({ label, value, completed, pending });
  }

  const assignees = [...new Set(serviceRequests.map(r => r.assignedToName))].filter(Boolean);
  const requestsByTeam = assignees.length > 0 ? assignees.map(name => ({
    label: (name || "Unassigned").split(" ")[0],
    value: serviceRequests.filter(r => r.assignedToName === name).length
  })) : [{ label: "No Team", value: 0 }];

  const filteredRequests = applyRequestFilters(
    serviceRequests,
    {
      ...srFilters,
      status: srFilters.status === "pending" ? "all" : srFilters.status,
      assignedTo: srFilters.assignedTo === "__unassigned__" ? "__unassigned__" : srFilters.assignedTo,
    }
  ).filter(r => {
    if (srFilters.assignedTo === "__unassigned__" && r.assignedToId) return false;
    if (srFilters.status === "pending" && r.status === "completed") return false;

    // Filter out completed + paid items
    if (r.status === "completed" && r.paymentStatus === "paid") return false;

    // Column Searches (Case Insensitive)
    if (colSrId && !r.id.toLowerCase().includes(colSrId.toLowerCase())) return false;
    if (colClient) {
      const q = colClient.toLowerCase();
      const matchName = (r.clientName || "").toLowerCase().includes(q);
      const idStr = (r.panNumber || r.gstNumber || r.cinNumber || r.udhyamNumber || "").toLowerCase();
      const matchId = idStr.includes(q);
      if (!matchName && !matchId) return false;
    }

    const serviceName = (r.serviceType || "").replace(/_/g, " ");
    if (colService && !serviceName.toLowerCase().includes(colService.toLowerCase())) return false;
    if (colAssigned && !(r.assignedToName || "unassigned").toLowerCase().includes(colAssigned.toLowerCase())) return false;
    if (colStatus && !(r.status || "").toLowerCase().includes(colStatus.toLowerCase())) return false;
    
    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "";
    if (colDate && !dateStr.includes(colDate)) return false;

    if (colFY && !(r.financialYear || "").toLowerCase().includes(colFY.toLowerCase())) return false;
    if (colMonth && !(r.financialMonth || "").toLowerCase().includes(colMonth.toLowerCase())) return false;
    if (colPriority && !(r.priority || "").toLowerCase().includes(colPriority.toLowerCase())) return false;
    
    const dueStr = r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "";
    if (colDueDate && !dueStr.includes(colDueDate)) return false;

    if (colPayment && !(r.paymentStatus || "").toLowerCase().includes(colPayment.toLowerCase())) return false;

    return true;
  });

  const theme = darkMode ? {
    bg: "#0f172a", cardBg: "#1e293b", sidebar: "#0f172a",
    border: "#334155", text: "#f1f5f9", muted: "#94a3b8",
    inputBg: "#1e293b", inputBorder: "#475569", tableTh: "#1e3a5f"
  } : {
    bg: "#f1f5f9", cardBg: "#ffffff", sidebar: "#0f172a",
    border: "#e2e8f0", text: "#0f172a", muted: "#64748b",
    inputBg: "#ffffff", inputBorder: "#e2e8f0", tableTh: "#2563eb"
  };

  // Dashboard Stats Config with attached items for Dropdown
  const statCardsData = [
    {
      id: "total",
      label: "Total Requests",
      value: totalReq,
      icon: "📋",
      color: "#2563eb",
      items: serviceRequests,
      itemType: "request",
      onClick: () => { navigate("serviceRequests"); setSrFilters({ ...DEFAULT_FILTERS }); }
    },
    {
      id: "pending",
      label: "Pending Requests",
      value: pendingReq,
      icon: "⏳",
      color: "#d97706",
      items: serviceRequests.filter(r => r.status?.toLowerCase() !== "completed"),
      itemType: "request",
      // ✅ Now it sets "pending" which accurately grabs submitted, in_progress, and pending_docs
      onClick: () => { navigate("serviceRequests"); setSrFilters({ ...DEFAULT_FILTERS, status: "pending" }); }
    },
    {
      id: "clients",
      label: "Total Clients",
      value: users.length,
      icon: "👥",
      color: "#7c3aed",
      items: users,
      itemType: "client",
      onClick: () => { navigate("registeredUsers"); }
    },
    {
      id: "completion",
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: "📈",
      color: "#059669",
      items: [],
      itemType: "none",
      onClick: () => { navigate("serviceRequests"); setSrFilters({ ...DEFAULT_FILTERS, status: "completed" }); }
    },
  ];
  if (activeView === "loginPage") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", flexDirection: "column" }}>
        <ToastContainer />
        <div style={{ background: "#1e293b", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "18px", letterSpacing: "1px" }}>TOTALTAXHUB.COM</span>
          <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "#94a3b8" }}>
            <span>✉ btpitsolution@gmail.com</span>
            <span>📞 9414973521</span>
          </div>
        </div>
        <div style={{ background: "#2563eb", display: "flex", alignItems: "center", gap: "8px", padding: "0 16px" }}>
          <a href="/" style={{ color: "#fff", textDecoration: "none", padding: "12px 16px", fontSize: "14px", background: "rgba(255,255,255,0.15)", display: "inline-block" }}>← Back</a>
          <a href="/" style={{ color: "#fff", textDecoration: "none", padding: "12px 16px", fontSize: "14px" }}>Home</a>
          {currentUser ? (
            <>
              <a href="/dashboard" style={{ color: "#fff", textDecoration: "none", padding: "12px 16px", fontSize: "14px" }}>Dashboard</a>
              <a href="#" onClick={logoutClient} style={{ color: "#fff", textDecoration: "none", padding: "12px 16px", fontSize: "14px" }}>Logout</a>
            </>
          ) : (
            <>
              <a href="/register" style={{ color: "#fff", textDecoration: "none", padding: "12px 16px", fontSize: "14px" }}>Register</a>
              <a href="/login" style={{ color: "#fff", textDecoration: "none", padding: "12px 16px", fontSize: "14px" }}>Login</a>
            </>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
          <div style={{ background: "#1e293b", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px", border: "1px solid #334155" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ width: "56px", height: "56px", background: "#2563eb", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto 16px" }}>🛡</div>
              <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 }}>Admin Login</h1>
              <p style={{ color: "#94a3b8", fontSize: "14px", margin: "6px 0 0" }}>Total Tax Hub Administration</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Email Address</label>
                <input type="email" placeholder="admin@totaltaxhub.com" value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && login()}
                  style={{ width: "100%", padding: "11px 14px", background: "#0f172a", border: "1px solid #475569", borderRadius: "8px", color: "#fff", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Password</label>
                <input type="password" placeholder="••••••••" value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && login()}
                  style={{ width: "100%", padding: "11px 14px", background: "#0f172a", border: "1px solid #475569", borderRadius: "8px", color: "#fff", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
              </div>
              <button onClick={login} style={{ padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>
                Login to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "'Segoe UI', sans-serif" }}>
      <ToastContainer />
      <style>{`
        .premium-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid ${theme.inputBorder};
          border-radius: 8px;
          background: ${theme.inputBg};
          color: ${theme.text};
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18) !important;
        }
        .premium-select {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid ${theme.inputBorder};
          border-radius: 8px;
          background: ${theme.inputBg};
          color: ${theme.text};
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-select:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18) !important;
        }
        .premium-card {
          background: ${theme.cardBg};
          border: 1px solid ${theme.border};
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
        }
        .premium-btn {
          padding: 11px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
        }
        .premium-btn-primary {
          background: #2563eb;
          color: #fff;
        }
        .premium-btn-primary:hover {
          background: #1d4ed8;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .premium-btn-secondary {
          background: transparent;
          border: 1px solid ${theme.border};
          color: ${theme.muted};
        }
        .premium-btn-secondary:hover {
          background: ${darkMode ? "#334155" : "#f1f5f9"};
        }
        .sidebar-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 400;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          transform: translateX(4px);
        }
        .sidebar-btn-active {
          background: #2563eb !important;
          color: #fff !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        .sidebar-btn-active::before {
          content: '';
          position: absolute;
          left: -4px;
          top: 25%;
          bottom: 25%;
          width: 3px;
          background: #fff;
          border-radius: 0 4px 4px 0;
        }

      `}</style>

      {mobileSidebarOpen && (
        <div onClick={() => setMobileSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40, display: "none" }}
          className="mobile-overlay" />
      )}

      <aside style={{
        width: sidebarCollapsed ? "64px" : "240px",
        background: "#0f172a",
        display: "flex", flexDirection: "column",
        flexShrink: 0, transition: "width 0.25s ease",
        position: "fixed", left: 0, top: 0, zIndex: 30,
        borderRight: "1px solid #1e293b",
        height: "100vh"
      }}>
        <div style={{ padding: "16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", minHeight: "64px" }}>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
              <div style={{ width: "32px", height: "32px", background: "#2563eb", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, color: "#fff", fontSize: "14px" }}>CA</div>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px", whiteSpace: "nowrap" }}>CASync Admin</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div style={{ width: "32px", height: "32px", background: "#2563eb", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontWeight: 700, color: "#fff", fontSize: "14px" }}>CA</div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#94a3b8", cursor: "pointer", borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto", minHeight: 0 }}>
          {!sidebarCollapsed && (
            <p style={{ color: "#475569", fontSize: "10px", fontWeight: 600, letterSpacing: "1px", padding: "4px 8px 8px", textTransform: "uppercase" }}>ADMIN PANEL</p>
          )}
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={`sidebar-btn ${activeView === item.id ? "sidebar-btn-active" : ""}`}
              title={sidebarCollapsed ? item.label : ""}
              style={{
                padding: sidebarCollapsed ? "10px" : "10px 12px",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                borderLeft: activeView === item.id ? "4px solid #fff" : "4px solid transparent",
                borderRadius: activeView === item.id ? "0 8px 8px 0" : "8px",
              }}>
              <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid #1e293b", padding: "12px 8px", marginTop: "auto" }}>
          <button onClick={logout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: sidebarCollapsed ? "10px" : "10px 12px", background: "transparent", border: "none", cursor: "pointer", color: "#f87171", fontSize: "14px", borderRadius: "8px", justifyContent: sidebarCollapsed ? "center" : "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "16px" }}>↩</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#1e293b", borderRadius: "8px" }}>
              <div style={{ width: "32px", height: "32px", background: "#2563eb", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>A</div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600, margin: 0, whiteSpace: "nowrap" }}>Admin User</p>
                <p style={{ color: "#64748b", fontSize: "11px", margin: 0, whiteSpace: "nowrap" }}>ADMIN</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, marginLeft: sidebarCollapsed ? "64px" : "240px" }}>
        <div style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.border}`, padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: theme.muted }}>CA Services Platform</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={logout} style={{ padding: "7px 14px", background: "#ef4444", border: "none", borderRadius: "8px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600 }}>Logout</button>
          </div>
        </div>

        <main style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>
          {activeView === "dashboard" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Admin Dashboard</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>System overview and key metrics</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px", position: "relative", zIndex: 10 }}>
                {statCardsData.map((s, i) => {
                  const isHovered = hoveredStat === s.id;
                  return (
                    <div key={i}
                      onClick={s.onClick}
                      onMouseEnter={() => setHoveredStat(s.id)}
                      onMouseLeave={() => setHoveredStat(null)}
                      style={{
                        background: theme.cardBg,
                        border: `1px solid ${isHovered ? s.color : theme.border}`,
                        borderRadius: "12px",
                        padding: "20px 24px",
                        position: "relative",
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                        transform: isHovered ? "translateY(-4px)" : "none",
                        boxShadow: isHovered ? `0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px ${s.color}33` : "none",
                        zIndex: isHovered ? 20 : 1
                      }}
                    >
                      <p style={{ color: theme.muted, fontSize: "13px", margin: "0 0 8px", fontWeight: 500 }}>{s.label}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <span style={{ fontSize: "30px", fontWeight: 700, color: s.color }}>{s.value}</span>
                        <span style={{ fontSize: "22px" }}>{s.icon}</span>
                      </div>
                      
                      {/* CLICKABLE DROPDOWN MENU */}
                      {isHovered && s.items && s.items.length > 0 && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: "8px",
                          background: theme.cardBg,
                          border: `1px solid ${theme.border}`,
                          borderRadius: "8px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          zIndex: 50,
                          maxHeight: "220px",
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                          padding: "8px"
                        }}
                        onClick={(e) => e.stopPropagation()}
                        >
                          {s.items.slice(0, 5).map(item => (
                            <div key={item.id}
                                 onClick={(e) => { 
                                   e.stopPropagation(); 
                                   if(s.itemType === "request") viewRequestDetails(item);
                                   if(s.itemType === "client") setSelectedClientForView(item);
                                 }}
                                 style={{ padding: "8px", borderBottom: `1px solid ${theme.border}`, cursor: "pointer", fontSize: "12px" }}
                                 onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"}
                                 onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                              {s.itemType === "request" ? (
                                <>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                    <strong style={{ color: theme.text }}>{item.id}</strong>
                                    <StatusBadge status={item.status} />
                                  </div>
                                  <div style={{ color: theme.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {item.clientName || item.userEmail} • {(item.serviceType || "").replace(/_/g, " ")}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                    <strong style={{ color: theme.text }}>{item.name || "Client"}</strong>
                                  </div>
                                  <div style={{ color: theme.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {item.email}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                          {s.items.length > 5 && (
                            <div style={{ padding: "8px", textAlign: "center", color: theme.muted, fontSize: "11px", fontStyle: "italic", cursor: "pointer" }}
                                 onClick={(e) => { e.stopPropagation(); s.onClick(); }}>
                              View all {s.items.length} {s.label.toLowerCase()} →
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px", position: "relative", zIndex: 5 }}>
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: theme.text }}>Requests Analysis</h3>
                  <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 16px" }}>Service distribution or monthly creation trends</p>
                  <BarChart data={requestsByService} timeData={requestsByTime} color="#2563eb" theme={theme} darkMode={darkMode} />
                </div>
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: theme.text }}>Workload Distribution</h3>
                  <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 16px" }}>Requests by team member</p>
                  <PieChart data={requestsByTeam} theme={theme} darkMode={darkMode} />
                </div>
              </div>

              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: theme.text }}>Recent Service Requests</h3>
                    <p style={{ color: theme.muted, fontSize: "12px", margin: "4px 0 0" }}>Latest requests in the system</p>
                  </div>
                  <button onClick={() => setShowHistoryModal(true)} style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "6px", cursor: "pointer", color: theme.muted, fontSize: "12px", fontWeight: 600 }}>
                    🕒 View History
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {serviceRequests.slice(0, 3).map(r => (
                    <div key={r.id} 
                         onClick={() => viewRequestDetails(r)}
                         style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", transition: "background 0.15s ease" }}
                         onMouseEnter={(e) => { e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"; }}
                         onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: theme.text }}>{r.id}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: theme.muted }}>{(r.serviceType || "").replace(/_/g, " ")} • {r.assignedToName || "Unassigned"}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                  {serviceRequests.length === 0 && <p style={{ color: theme.muted, fontSize: "14px", textAlign: "center", padding: "12px 0" }}>No requests in the system yet.</p>}
                </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
                {[
                  { label: "In Progress", value: inProgressReq, color: "#2563eb", onClick: () => { navigate("serviceRequests"); setSrFilters({ ...DEFAULT_FILTERS, status: "in_progress" }); } },
                  { label: "Completed", value: completedReq, color: "#059669", onClick: () => { navigate("serviceRequests"); setSrFilters({ ...DEFAULT_FILTERS, status: "completed" }); } },
                  { label: "Admins", value: admins.length || "—", color: "#7c3aed", onClick: () => { navigate("adminManagement"); } },
                ].map((s, i) => (
                  <div key={i} 
                       onClick={s.onClick} 
                       style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px 24px", cursor: "pointer", transition: "all 0.2s ease" }}
                       onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)"; e.currentTarget.style.borderColor = s.color; }}
                       onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = theme.border; }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 600, color: theme.muted }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: "32px", fontWeight: 700, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              
              {/* ✅ ADDED TEAM WORKLOAD DASHBOARD */}
              <TeamWorkloadTable
                workload={teamWorkload}
                theme={theme}
                dark={darkMode}
              />
            </div>
            </div>
          )}

          {activeView === "serviceRequests" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Service Requests</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Master view of all service requests</p>
              </div>

              <RequestFilterBar
                filters={srFilters}
                onChange={setSrFilters}
                teamMembers={teamMembers}
                theme={theme}
                dark={darkMode}
                showAssigned={true}
                resultCount={filteredRequests.length}
                totalCount={serviceRequests.length}
              />

              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
                {/* Column filter bar */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.5fr 2fr 1.3fr 1.4fr 1fr 1.6fr",
                  gap: "0",
                  padding: "10px 20px",
                  background: darkMode ? "#111c30" : "#f1f5f9",
                  borderBottom: `1px solid ${theme.border}`,
                  alignItems: "center"
                }}>
                  <div style={{ padding: "0 8px" }}>
                    <input type="text" placeholder="ID" value={colSrId} onChange={e => setColSrId(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px" }}>
                    <input type="text" placeholder="Client" value={colClient} onChange={e => setColClient(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px", display: "flex", gap: "4px" }}>
                    <input type="text" placeholder="Service" value={colService} onChange={e => setColService(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                    <input type="text" placeholder="FY" value={colFY} onChange={e => setColFY(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "45px", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px" }}>
                    <input type="text" placeholder="Assigned" value={colAssigned} onChange={e => setColAssigned(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px", display: "flex", gap: "4px" }}>
                    <input type="text" placeholder="Status" value={colStatus} onChange={e => setColStatus(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                    <input type="text" placeholder="Pay" value={colPayment} onChange={e => setColPayment(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "45px", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px" }}>
                    <input type="text" placeholder="Priority" value={colPriority} onChange={e => setColPriority(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px", display: "flex", gap: "4px" }}>
                    <input type="text" placeholder="Date" value={colDate} onChange={e => setColDate(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                    <input type="text" placeholder="Due" value={colDueDate} onChange={e => setColDueDate(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                  </div>
                </div>

                {/* Column Headers */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 2fr 1.3fr 1.4fr 1fr 1.6fr", gap: "0", padding: "10px 20px", background: darkMode ? "#1e293b" : "#f8fafc", borderBottom: `1px solid ${theme.border}`, alignItems: "center" }}>
                  {["Request ID", "Client / ID", "Service · Dates", "Assigned To", "Status · Pay", "Priority", "Actions"].map(h => (
                    <div key={h} style={{ fontSize: "11px", fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 8px" }}>{h}</div>
                  ))}
                </div>

                {/* Data Rows */}
                {filteredRequests.length === 0 ? (
                  <div style={{ padding: "56px", textAlign: "center", color: theme.muted }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>No requests found</p>
                    <p style={{ margin: "6px 0 0", fontSize: "13px" }}>Try adjusting your filters</p>
                  </div>
                ) : (
                  filteredRequests.map((r, idx) => {
                    const statusMap = { submitted: { label: "Submitted", bg: "#fef9c3", color: "#a16207" }, in_progress: { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8" }, completed: { label: "Completed", bg: "#dcfce7", color: "#15803d" }, pending_docs: { label: "Pending Docs", bg: "#fee2e2", color: "#b91c1c" }, pending_review: { label: "Pending Review", bg: "#fef08a", color: "#854d0e" } };
                    const st = statusMap[r.status] || { label: r.status, bg: "#f1f5f9", color: "#475569" };
                    const prColor = r.priority === "high" ? "#ef4444" : r.priority === "low" ? "#10b981" : "#f59e0b";
                    const prBg = r.priority === "high" ? "#fee2e2" : r.priority === "low" ? "#dcfce7" : "#fef9c3";
                    return (
                      <div key={r.id} onClick={() => viewRequestDetails(r)}
                        onMouseEnter={e => { e.currentTarget.style.background = darkMode ? "rgba(37,99,235,0.08)" : "#eff6ff"; e.currentTarget.style.borderLeftColor = "#2563eb"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = "transparent"; }}
                        style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 2fr 1.3fr 1.4fr 1fr 1.6fr", gap: "0", padding: "13px 20px", borderBottom: idx < filteredRequests.length - 1 ? `1px solid ${theme.border}` : "none", cursor: "pointer", transition: "background 0.15s ease", alignItems: "center", borderLeft: "3px solid transparent" }}>
                        {/* Request ID */}
                        <div style={{ padding: "0 8px" }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#2563eb" }} title={r.id}>{r.id.slice(0, 10)}...</p>
                          {r.isDummy && <span style={{ fontSize: "9px", background: "#fee2e2", color: "#ef4444", padding: "1px 5px", borderRadius: "3px", fontWeight: 700 }}>DUMMY</span>}
                        </div>
                        {/* Client */}
                        <div style={{ padding: "0 8px" }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.clientName || "—"}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: theme.muted }}>{r.panNumber || r.gstNumber || r.cinNumber || r.udhyamNumber || "—"}</p>
                        </div>
                        {/* Service + FY + Dates */}
                        <div style={{ padding: "0 8px" }}>
                          <span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 7px", borderRadius: "5px", fontWeight: 600, display: "inline-block", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(r.serviceType || "").replace(/_/g, " ")}</span>
                          <p style={{ margin: "3px 0 0", fontSize: "11px", color: theme.muted }}>{r.financialYear || "—"}{r.financialMonth ? ` · ${r.financialMonth}` : ""}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "10px", color: theme.muted }}>📅 {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"} · Due: {r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "—"}</p>
                        </div>
                        {/* Assigned */}
                        <div style={{ padding: "0 8px" }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: theme.text }}>{r.assignedToName || "Unassigned"}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: theme.muted }}>Rev: {r.reviewerName || "None"}</p>
                        </div>
                        {/* Status + Payment */}
                        <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                          <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>{st.label}</span>
                          <span style={{ padding: "1px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: r.paymentStatus === "paid" ? "#dcfce7" : "#fee2e2", color: r.paymentStatus === "paid" ? "#15803d" : "#991b1b" }}>{(r.paymentStatus || "UNPAID").toUpperCase()}</span>
                        </div>
                        {/* Priority */}
                        <div style={{ padding: "0 8px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: prBg, color: prColor }}>{(r.priority || "medium").toUpperCase()}</span>
                        </div>
                        {/* Actions */}
                        <div style={{ padding: "0 8px", display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
                          <button onClick={e => { e.stopPropagation(); viewRequestDetails(r); }} style={{ padding: "5px 9px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "11px", color: theme.muted, fontWeight: 600, whiteSpace: "nowrap" }}>👁 View</button>
                          <button onClick={e => { e.stopPropagation(); setSelectedRequest(r); setEditForm({ newId: r.id, isDummy: r.isDummy || false, assignedToName: r.assignedToName, assignedToId: r.assignedToId, reviewerName: r.reviewerName, reviewerId: r.reviewerId, priority: r.priority, status: r.status, dueDate: r.dueDate ? new Date(r.dueDate).toISOString().split("T")[0] : "", referenceId: r.referenceId || "", customRequestId: r.customRequestId || "" }); setSrMode("edit"); }} style={{ padding: "5px 9px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "11px", color: theme.muted, fontWeight: 600, whiteSpace: "nowrap" }}>✏ Edit</button>
                          {r.status === "submitted" && (
                            <button onClick={e => { e.stopPropagation(); updateRequestStatus(r.id, "in_progress"); }} style={{ padding: "5px 9px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>Start</button>
                          )}
                          {r.status === "in_progress" && (
                            <>
                              <button onClick={e => { e.stopPropagation(); updateRequestStatus(r.id, "completed"); }} style={{ padding: "5px 9px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>Done</button>
                              <button onClick={e => { e.stopPropagation(); updateRequestStatus(r.id, "pending_docs"); }} style={{ padding: "5px 9px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>Return</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}






          {activeView === "registeredUsers" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Clients</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>All registered users on the platform</p>
              </div>

              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: theme.tableTh }}>
                        {["#", "Name", "Email", "Mobile", "Joined", "Actions"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#fff", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: theme.muted }}>No users found</td></tr>
                      ) : users.map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 1 ? (darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent" }}>
                          <td style={{ padding: "12px 16px", color: theme.muted }}>{i + 1}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: theme.text }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "30px", height: "30px", background: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>
                                {(u.name || "?")[0].toUpperCase()}
                              </div>
                              {u.name || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: theme.text }}>{u.email}</td>
                          <td style={{ padding: "12px 16px", color: theme.text }}>{u.mobile || "—"}</td>
                          <td style={{ padding: "12px 16px", color: theme.muted }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={() => setSelectedClientForView(u)} style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${theme.border}`, background: "#2563eb", cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: "12px" }}>👁 View</button>
                              <button onClick={() => {
                                const action = async () => {
                                  try {
                                    const token = localStorage.getItem("adminToken");
                                    const res = await fetch("/api/admin/remove-user", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId: u.id }) });
                                    const data = await res.json();
                                    if (data.success) {
                                      setUsers(prev => prev.filter(x => x.id !== u.id));
                                      showToast("User removed", "success");
                                    } else showToast(data.message || "Failed to remove user", "error");
                                  } catch (err) { showToast("Error removing user", "error"); }
                                };
                                triggerConfirm(
                                  "Confirm Client Deletion",
                                  `Are you sure you want to permanently delete client "${u.name || u.email}"? This will revoke their access to the portal.`,
                                  action
                                );
                              }} style={{ padding: "6px 10px", borderRadius: "6px", border: `1px solid ${theme.border}`, background: "transparent", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12px" }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === "adminManagement" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Admin Management</h1>
                  <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>View and manage system administrators</p>
                </div>
                {isSuperAdmin && (
                  <div style={{ display: "flex", gap: "8px", background: theme.border, padding: "2px", borderRadius: "8px" }}>
                    <button onClick={() => setAdminTab("list")} style={{ padding: "8px 16px", background: adminTab === "list" ? "#2563eb" : "transparent", color: adminTab === "list" ? "#fff" : theme.muted, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px", transition: "all 0.2s" }}>
                      List Admins
                    </button>
                    <button onClick={() => setAdminTab("add")} style={{ padding: "8px 16px", background: adminTab === "add" ? "#2563eb" : "transparent", color: adminTab === "add" ? "#fff" : theme.muted, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px", transition: "all 0.2s" }}>
                      + Add Admin
                    </button>
                  </div>
                )}
              </div>

              {adminTab === "list" ? (
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: theme.tableTh }}>
                          {["#", "Name", "Email", "Phone", "Role", "Actions"].map(h => (
                            <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#fff", fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {admins.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: theme.muted }}>No admins found</td></tr>
                        ) : admins.map((a, i) => (
                          <tr key={a.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 1 ? (darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent" }}>
                            <td style={{ padding: "12px 16px", color: theme.muted }}>{i + 1}</td>
                            <td style={{ padding: "12px 16px", fontWeight: 600, color: theme.text }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "30px", height: "30px", background: a.role === "Super Admin" ? "#7c3aed" : "#3b82f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>
                                  {(a.name || a.email || "?")[0].toUpperCase()}
                                </div>
                                {a.name || "—"}
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", color: theme.text }}>{a.email}</td>
                            <td style={{ padding: "12px 16px", color: theme.text }}>{a.phone || a.mobile || "—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: a.role === "Super Admin" ? "#f3e8ff" : "#dbeafe", color: a.role === "Super Admin" ? "#6b21a8" : "#1e40af" }}>
                                {a.role || "Admin"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {currentAdmin && currentAdmin.id === String(a.id) ? (
                                <span style={{ padding: "6px 10px", borderRadius: "6px", background: "#eef2ff", color: "#4338ca", fontWeight: 600 }}>You</span>
                              ) : isSuperAdmin ? (
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button onClick={() => startEditingAdmin(a)} style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${theme.border}`, background: "#2563eb", cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: "12px" }}>Edit</button>
                                  <button onClick={() => {
                                    const action = async () => {
                                      try {
                                        const token = localStorage.getItem("adminToken");
                                        const res = await fetch("/api/admin/remove-admin", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ adminId: a.id }) });
                                        const data = await res.json();
                                        if (data.success) {
                                          setAdmins(prev => prev.filter(x => x.id !== a.id));
                                          showToast("Admin removed", "success");
                                        } else showToast(data.message || "Failed to remove admin", "error");
                                      } catch (err) { showToast("Error removing admin", "error"); }
                                    };
                                    triggerConfirm(
                                      "Confirm Admin Deletion",
                                      `Are you sure you want to delete admin "${a.name || a.email}"? This will revoke their access to the system.`,
                                      action
                                    );
                                  }} style={{ padding: "6px 10px", borderRadius: "6px", border: `1px solid ${theme.border}`, background: "transparent", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12px" }}>Delete</button>
                                </div>
                              ) : (
                                <span style={{ color: theme.muted, fontSize: "12px", fontStyle: "italic" }}>Locked</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="premium-card" style={{ maxWidth: "600px", margin: "24px auto", borderTop: "4px solid #2563eb", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: theme.text }}>Create New Administrator</h3>
                  <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 20px" }}>Register another administrative profile with specific roles.</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Full Name</label>
                        <input type="text" placeholder="Rohan Sharma" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} className="premium-input" />
                      </div>
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Email Address</label>
                        <input type="email" placeholder="admin@example.com" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="premium-input" />
                      </div>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Phone Number</label>
                        <input type="tel" placeholder="9876543210" value={newAdminPhone} onChange={e => setNewAdminPhone(e.target.value)} className="premium-input" />
                      </div>
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Password</label>
                        <input type="password" placeholder="••••••••" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} className="premium-input" />
                      </div>
                    </div>

                    <div>
                      <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>System Role</label>
                      <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value)} className="premium-select">
                        <option value="Admin">Standard Admin (Cannot manage admin accounts)</option>
                        <option value="Super Admin">Super Admin (Full privileges)</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                      <button onClick={addAdmin} className="premium-btn premium-btn-primary" style={{ flex: 1 }}>Save Admin</button>
                      <button onClick={() => setAdminTab("list")} className="premium-btn premium-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === "teamManagement" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Team Management</h1>
                  <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Manage your CA firm team members</p>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: "8px", background: theme.border, padding: "2px", borderRadius: "8px" }}>
                    <button onClick={() => setTeamTab("list")} style={{ padding: "8px 16px", background: teamTab === "list" ? "#0ea5e9" : "transparent", color: teamTab === "list" ? "#fff" : theme.muted, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px", transition: "all 0.2s" }}>
                      Team Members
                    </button>
                    <button onClick={() => setTeamTab("add")} style={{ padding: "8px 16px", background: teamTab === "add" ? "#0ea5e9" : "transparent", color: teamTab === "add" ? "#fff" : theme.muted, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px", transition: "all 0.2s" }}>
                      + Add Member
                    </button>
                  </div>
                )}
              </div>

              {teamTab === "list" ? (
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ overflowX: "auto", minHeight: "280px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#0ea5e9" }}>
                          {["#", "Name", "Email", "Phone", "Role", "Services", "Clients", "Actions"].map(h => (
                            <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#fff", fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {teamMembers.length === 0 ? (
                          <tr><td colSpan={8} style={{ padding: "48px", textAlign: "center", color: theme.muted }}>No team members yet. Add one!</td></tr>
                        ) : teamMembers.map((m, i) => (
                          <tr key={m.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 1 ? (darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent" }}>
                            <td style={{ padding: "12px 16px", color: theme.muted }}>{i + 1}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "30px", height: "30px", background: "#0ea5e9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>
                                  {(m.name || "?")[0].toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 600, color: theme.text }}>{m.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", color: theme.text }}>{m.email}</td>
                            <td style={{ padding: "12px 16px", color: theme.text }}>{m.phone || "—"}</td>
                            <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: "#e0f2fe", color: "#0369a1" }}>{m.role}</span></td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {(m.services || []).length > 0
                                  ? m.services.map(s => <span key={s} style={{ padding: "2px 6px", background: "#f0fdf4", color: "#15803d", borderRadius: "4px", fontSize: "10px", fontWeight: 600 }}>{s}</span>)
                                  : <span style={{ color: theme.muted, fontSize: "12px" }}>—</span>}
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ fontSize: "12px", color: theme.muted }}>
                                {(m.allocatedClientIds || []).length} client(s)
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ position: "relative" }}>
                                {isAdmin ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTeamActionMenu(activeTeamActionMenu === m.id ? null : m.id);
                                      }}
                                      style={{
                                        background: "transparent",
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: "6px",
                                        padding: "6px 12px",
                                        cursor: "pointer",
                                        color: theme.text,
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      Actions <span style={{ fontSize: "10px" }}>▼</span>
                                    </button>
                                    
                                    {activeTeamActionMenu === m.id && (
                                      <div style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "105%",
                                        background: theme.cardBg,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: "8px",
                                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.15)",
                                        zIndex: 40,
                                        minWidth: "150px",
                                        overflow: "hidden"
                                      }}>
                                        <button
                                          onClick={() => {
                                            setActiveTeamActionMenu(null);
                                            startEditingTeam(m);
                                          }}
                                          style={{
                                            width: "100%",
                                            padding: "10px 14px",
                                            background: "transparent",
                                            border: "none",
                                            color: theme.text,
                                            fontSize: "13px",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            fontWeight: 500,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            transition: "background 0.15s"
                                          }}
                                          onMouseEnter={(e) => e.target.style.background = darkMode ? "#334155" : "#f1f5f9"}
                                          onMouseLeave={(e) => e.target.style.background = "transparent"}
                                        >
                                          ✏️ Edit Details
                                        </button>
                                        <button
                                          onClick={() => {
                                            setActiveTeamActionMenu(null);
                                            openAllocateModal(m);
                                          }}
                                          style={{
                                            width: "100%",
                                            padding: "10px 14px",
                                            background: "transparent",
                                            border: "none",
                                            color: theme.text,
                                            fontSize: "13px",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            fontWeight: 500,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            borderTop: `1px solid ${theme.border}`,
                                            transition: "background 0.15s"
                                          }}
                                          onMouseEnter={(e) => e.target.style.background = darkMode ? "#334155" : "#f1f5f9"}
                                          onMouseLeave={(e) => e.target.style.background = "transparent"}
                                        >
                                          👥 Allocate Clients
                                        </button>
                                        <button
                                          onClick={() => {
                                            setActiveTeamActionMenu(null);
                                            const action = async () => {
                                              try {
                                                const res = await fetch("/api/team/remove-member", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: m.id }) });
                                                const data = await res.json();
                                                if (data.success) { setTeamMembers(prev => prev.filter(x => x.id !== m.id)); showToast("Member removed", "success"); }
                                                else showToast(data.message || "Failed", "error");
                                              } catch { showToast("Error", "error"); }
                                            };
                                            triggerConfirm(
                                              "Confirm Team Member Deletion",
                                              `Are you sure you want to permanently delete team member "${m.name}"?`,
                                              action
                                            );
                                          }}
                                          style={{
                                            width: "100%",
                                            padding: "10px 14px",
                                            background: "transparent",
                                            border: "none",
                                            color: "#ef4444",
                                            fontSize: "13px",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            borderTop: `1px solid ${theme.border}`,
                                            transition: "background 0.15s"
                                          }}
                                          onMouseEnter={(e) => e.target.style.background = darkMode ? "#334155" : "#f1f5f9"}
                                          onMouseLeave={(e) => e.target.style.background = "transparent"}
                                        >
                                          🗑️ Delete Member
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span style={{ color: theme.muted, fontSize: "12px", fontStyle: "italic" }}>Locked (Admin Only)</span>
                                )}
                              </div>



                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="premium-card" style={{ maxWidth: "600px", margin: "24px auto", borderTop: "4px solid #0ea5e9", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: theme.text }}>Add Team Member</h3>
                  <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 20px" }}>Register a team member to handle client work allocation.</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Full Name *</label>
                        <input type="text" placeholder="Rohan Sharma" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="premium-input" />
                      </div>
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Email Address *</label>
                        <input type="email" placeholder="rohan@totaltaxhub.com" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} className="premium-input" />
                      </div>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Phone Number</label>
                        <input type="tel" placeholder="9876543210" value={newMemberPhone} onChange={e => setNewMemberPhone(e.target.value)} className="premium-input" />
                      </div>
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Password *</label>
                        <input type="password" placeholder="••••••••" value={newMemberPassword} onChange={e => setNewMemberPassword(e.target.value)} className="premium-input" />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Role / Designation</label>
                        <input type="text" placeholder="Senior CA, Accountant..." value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} className="premium-input" />
                      </div>
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Services (comma-separated)</label>
                        <input type="text" placeholder="ITR, GST_FILING, BOOKKEEPING" value={newMemberServices} onChange={e => setNewMemberServices(e.target.value)} className="premium-input" />
                      </div>
                    </div>

                    {/* Permissions Checkboxes */}
                    <div>
                      <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Assign Rights (Permissions)</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: darkMode ? "#1e293b" : "#f8fafc", padding: "12px", borderRadius: "8px", border: `1px solid ${theme.border}` }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: theme.text }}>
                          <input type="checkbox" checked={rightsAllRequests} onChange={e => setRightsAllRequests(e.target.checked)} style={{ accentColor: "#2563eb" }} />
                          All Requests Access
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: theme.text }}>
                          <input type="checkbox" checked={rightsEditRequestId} onChange={e => setRightsEditRequestId(e.target.checked)} style={{ accentColor: "#2563eb" }} />
                          Edit Request ID Access
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: theme.text }}>
                          <input type="checkbox" checked={rightsChangePayment} onChange={e => setRightsChangePayment(e.target.checked)} style={{ accentColor: "#2563eb" }} />
                          Change Payment Access
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: theme.text }}>
                          <input type="checkbox" checked={rightsDeleteDocuments} onChange={e => setRightsDeleteDocuments(e.target.checked)} style={{ accentColor: "#2563eb" }} />
                          Delete Documents Access
                        </label>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                      <button onClick={addTeamMember} className="premium-btn premium-btn-primary" style={{ flex: 1, background: "#0ea5e9" }}>Save Member</button>
                      <button onClick={() => setTeamTab("list")} className="premium-btn premium-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === "documents" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Documents</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Upload documents for clients and manage all shared files</p>
              </div>

              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: theme.text }}>📤 Upload New Document</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ color: theme.muted, fontSize: "13px", display: "block", marginBottom: "6px" }}>Select Client *</label>
                    <select value={docClientId} onChange={e => {
                      const u = users.find(u => u.id === e.target.value);
                      setDocClientId(e.target.value);
                      setDocClientEmail(u?.email || "");
                    }} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }}>
                      <option value="">— Choose a client —</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: theme.muted, fontSize: "13px", display: "block", marginBottom: "6px" }}>Document Title</label>
                    <input type="text" placeholder="e.g. PAN Card, ITR Form" value={docTitle} onChange={e => setDocTitle(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: theme.muted, fontSize: "13px", display: "block", marginBottom: "6px" }}>Note / Description</label>
                    <input type="text" placeholder="Optional note for the client" value={docNote} onChange={e => setDocNote(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: theme.muted, fontSize: "13px", display: "block", marginBottom: "6px" }}>File *</label>
                    <input type="file" onChange={e => setDocFile(e.target.files[0] || null)}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px" }} />
                    {docFile && <p style={{ color: theme.muted, fontSize: "12px", marginTop: "4px" }}>Selected: {docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)</p>}
                  </div>
                </div>
                <button onClick={uploadDocument} disabled={docUploading}
                  style={{ marginTop: "16px", padding: "10px 24px", background: docUploading ? "#94a3b8" : "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: docUploading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "13px" }}>
                  {docUploading ? "Uploading..." : "📤 Upload Document"}
                </button>
              </div>

              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: theme.text }}>All Uploaded Documents ({documents.length})</h3>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: theme.muted }}>From:</span>
                      <input type="date" value={docStartDate} onChange={e => setDocStartDate(e.target.value)}
                        className="premium-input" style={{ padding: "6px 10px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "auto" }} />
                      <span style={{ fontSize: "12px", color: theme.muted }}>To:</span>
                      <input type="date" value={docEndDate} onChange={e => setDocEndDate(e.target.value)}
                        className="premium-input" style={{ padding: "6px 10px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "auto" }} />
                      {(docStartDate || docEndDate) && (
                        <button onClick={() => { setDocStartDate(""); setDocEndDate(""); }}
                          style={{ padding: "6px 10px", background: "transparent", border: "none", color: "#ef4444", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>✕ Clear</button>
                      )}
                    </div>

                    <select
                      value={docSortFilter}
                      onChange={e => setDocSortFilter(e.target.value)}
                      style={{ padding: "7px 10px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }}
                    >
                      <option value="newest">🔥 Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Name A-Z</option>
                      <option value="size">Size (Largest)</option>
                    </select>

                    <input
                      placeholder="Search filename, title, or client..."
                      value={docSearch}
                      onChange={e => setDocSearch(e.target.value)}
                      style={{ padding: "7px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "200px" }}
                    />
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: theme.tableTh }}>
                        {["File Name", "Title", "Client", "Uploaded By", "Date", "Actions"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredDocs = documents.filter(doc => {
                          const s = docSearch.toLowerCase();
                          const matchesSearch = !docSearch ||
                            (doc.fileName || "").toLowerCase().includes(s) ||
                            (doc.title || "").toLowerCase().includes(s) ||
                            (doc.clientEmail || "").toLowerCase().includes(s) ||
                            (doc.uploaderName || "").toLowerCase().includes(s);

                          if (!matchesSearch) return false;
                          const createdDate = new Date(doc.createdAt);
                          const createdDateStr = createdDate.toISOString().split("T")[0];
                          if (docStartDate && createdDateStr < docStartDate) return false;
                          if (docEndDate && createdDateStr > docEndDate) return false;

                          return true;
                        }).sort((a, b) => {
                          if (docSortFilter === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
                          if (docSortFilter === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
                          if (docSortFilter === "name") return (a.fileName || "").localeCompare(b.fileName || "");
                          if (docSortFilter === "size") {
                            const parseSize = (sz) => {
                              if (!sz) return 0;
                              const num = parseFloat(sz);
                              if (sz.toUpperCase().includes("MB")) return num * 1024;
                              return num;
                            };
                            return parseSize(b.fileSize) - parseSize(a.fileSize);
                          }
                          return 0;
                        });

                        return filteredDocs.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: theme.muted }}>No documents found.</td></tr>
                        ) : filteredDocs.map((doc, i) => (
                          <tr key={doc.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 1 ? (darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "16px" }}>📄</span>
                                <span style={{ fontWeight: 600, color: theme.text }}>{doc.fileName}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", color: theme.muted }}>{doc.title || "—"}</td>
                            <td style={{ padding: "12px 16px", color: theme.text }}>{doc.clientEmail}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: doc.uploader === "admin" ? "#ede9fe" : "#e0f2fe", color: doc.uploader === "admin" ? "#6d28d9" : "#0369a1" }}>
                                {doc.uploaderName || doc.uploader}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", color: theme.muted }}>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button onClick={() => downloadDocument(doc.id, doc.fileName)}
                                  style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>
                                  ⬇ Download
                                </button>
                                <button onClick={() => {
                                  const action = async () => {
                                    try {
                                      const res = await fetch("/api/documents/delete", {
                                        method: "DELETE",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ id: doc.id }),
                                      });
                                      const data = await res.json();
                                      if (data.success) {
                                        showToast("Document deleted successfully", "success");
                                        loadDocuments();
                                      } else showToast(data.message || "Failed to delete document", "error");
                                    } catch { showToast("Error deleting document", "error"); }
                                  };
                                  triggerConfirm(
                                    "Confirm Document Deletion",
                                    `Are you sure you want to permanently delete document "${doc.fileName}"? This cannot be undone.`,
                                    action
                                  );
                                }} style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "12px", color: "#ef4444", fontWeight: 600 }}>
                                  🗑 Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === "activityLog" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Activity Log</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>System audit trail of all operations</p>
              </div>

              {/* Advanced Filter Bar */}
              <div style={{ 
                background: theme.cardBg, 
                border: `1px solid ${theme.border}`, 
                borderRadius: "12px", 
                padding: "14px 18px", 
                marginBottom: "20px", 
                display: "flex", 
                gap: "12px", 
                flexWrap: "wrap",
                zIndex: 2,
                position: "relative"
              }}>
                <input 
                  placeholder="Search by keyword..." 
                  value={activitySearch} 
                  onChange={e => setActivitySearch(e.target.value)}
                  style={{ 
                    flex: 1, 
                    minWidth: "200px", 
                    padding: "9px 12px", 
                    border: `1px solid ${theme.inputBorder}`, 
                    borderRadius: "8px", 
                    background: theme.inputBg, 
                    color: theme.text, 
                    fontSize: "13px", 
                    outline: "none" 
                  }} 
                />
                
                <select 
                  value={activityType} 
                  onChange={e => setActivityType(e.target.value)}
                  style={{ 
                    padding: "9px 12px", 
                    border: `1px solid ${theme.inputBorder}`, 
                    borderRadius: "8px", 
                    background: theme.inputBg, 
                    color: theme.text, 
                    fontSize: "13px", 
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">All Activity Types</option>
                  <option value="document">Document Uploads</option>
                  <option value="user">Client Registrations</option>
                  <option value="team">Team Member Updates</option>
                  <option value="request">Request Actions</option>
                </select>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", color: theme.muted }}>From:</span>
                  <input type="date" value={activityStartDate} onChange={e => setActivityStartDate(e.target.value)}
                    className="premium-input" style={{ padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "auto" }} />
                  <span style={{ fontSize: "12px", color: theme.muted }}>To:</span>
                  <input type="date" value={activityEndDate} onChange={e => setActivityEndDate(e.target.value)}
                    className="premium-input" style={{ padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "auto" }} />
                  {(activityStartDate || activityEndDate) && (
                    <button onClick={() => { setActivityStartDate(""); setActivityEndDate(""); }}
                      style={{ padding: "9px 12px", background: "transparent", border: "none", color: "#ef4444", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>✕ Clear</button>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(() => {
                  const computedActivityLog = [
                    ...documents.map(d => ({
                      id: `doc-${d.id}`,
                      action: "Document Uploaded",
                      description: `${d.fileName} uploaded by ${d.uploaderName || d.uploader} for ${d.clientEmail}`,
                      type: "created",
                      rawType: "document",
                      timestamp: d.createdAt ? new Date(d.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: d.createdAt ? new Date(d.createdAt).getTime() : 0,
                      icon: "📁"
                    })),
                    ...users.map(u => ({
                      id: `user-${u.id}`,
                      action: "Client Registered",
                      description: `${u.name} (${u.email}) joined the platform`,
                      type: "created",
                      rawType: "user",
                      timestamp: u.createdAt ? new Date(u.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: u.createdAt ? new Date(u.createdAt).getTime() : 0,
                      icon: "👤"
                    })),
                    ...teamMembers.map(m => ({
                      id: `team-${m.id}`,
                      action: "Team Member Added",
                      description: `${m.name} assigned role: ${m.role}`,
                      type: "assigned",
                      rawType: "team",
                      timestamp: m.createdAt ? new Date(m.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: m.createdAt ? new Date(m.createdAt).getTime() : 0,
                      icon: "👷"
                    })),
                    ...requestActivities.map(act => ({
                      id: `act-${act.id}`,
                      action: act.action ? act.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Request Activity",
                      description: act.description || "",
                      type: act.action === "status_changed" ? "completed" : "updated",
                      rawType: "request",
                      timestamp: act.createdAt ? new Date(act.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: act.createdAt ? new Date(act.createdAt).getTime() : 0,
                      icon: "⚙"
                    }))
                  ];

                  let filtered = computedActivityLog;
                  if (activityType !== "all") {
                    filtered = filtered.filter(a => a.rawType === activityType);
                  }

                  if (activitySearch) {
                    const searchLower = activitySearch.toLowerCase();
                    filtered = filtered.filter(a => 
                      a.action.toLowerCase().includes(searchLower) || 
                      a.description.toLowerCase().includes(searchLower)
                    );
                  }

                  if (activityStartDate || activityEndDate) {
                    filtered = filtered.filter(a => {
                      if (!a.timeMs) return false;
                      const aDate = new Date(a.timeMs);
                      const aDateStr = aDate.toISOString().split("T")[0];
                      if (activityStartDate && aDateStr < activityStartDate) return false;
                      if (activityEndDate && aDateStr > activityEndDate) return false;
                      return true;
                    });
                  }

                  const sortedActivities = filtered.sort((a, b) => b.timeMs - a.timeMs).slice(0, 100);

                  return sortedActivities.length === 0 ? (
                    <p style={{ color: theme.muted, fontSize: "14px", padding: "20px" }}>No activity log matching filters found.</p>
                  ) : sortedActivities.map(activity => {
                    const typeStyle = {
                      created: { bg: "#dbeafe", color: "#1d4ed8", label: "created" },
                      assigned: { bg: "#ede9fe", color: "#6d28d9", label: "assigned" },
                      updated: { bg: "#dcfce7", color: "#15803d", label: "updated" },
                      completed: { bg: "#dcfce7", color: "#15803d", label: "completed" },
                    }[activity.type] || { bg: "#f1f5f9", color: "#475569", label: activity.type };

                    return (
                      <div key={activity.id} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        <div style={{ width: "40px", height: "40px", background: darkMode ? "#1e293b" : "#f1f5f9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{activity.icon || "🕐"}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <p style={{ margin: "0 0 2px", fontWeight: 600, color: theme.text, fontSize: "14px" }}>{activity.action}</p>
                              <p style={{ margin: 0, fontSize: "13px", color: theme.muted }}>{activity.description}</p>
                            </div>
                            <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: typeStyle.bg, color: typeStyle.color, flexShrink: 0 }}>
                              {typeStyle.label}
                            </span>
                          </div>
                          <p style={{ margin: "8px 0 0", fontSize: "12px", color: theme.muted }}>{activity.timestamp}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {activeView === "settings" && (
            <div style={{ maxWidth: "600px" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Settings</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Configure system-wide settings</p>
              </div>

              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: theme.text }}>System Configuration</h3>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ color: theme.muted, fontSize: "13px", display: "block", marginBottom: "6px" }}>Default SLA (in days)</label>
                  <input type="number" value={slaDefault} onChange={e => setSlaDefault(e.target.value)}
                    style={{ width: "120px", padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }} />
                </div>

                {[
                  { label: "Allow New Client Registration", desc: "Clients can sign up for accounts", val: allowReg, set: setAllowReg },
                  { label: "Auto-Assignment Enabled", desc: "Automatically assign requests to team members", val: autoAssign, set: setAutoAssign },
                  { label: "Email Notifications", desc: "Send email updates to clients and team", val: emailNotif, set: setEmailNotif },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: `1px solid ${theme.border}` }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontWeight: 500, fontSize: "14px", color: theme.text }}>{s.label}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: theme.muted }}>{s.desc}</p>
                    </div>
                    <button onClick={() => s.set(!s.val)} style={{
                      width: "44px", height: "24px", borderRadius: "999px", border: "none", cursor: "pointer",
                      background: s.val ? "#2563eb" : (darkMode ? "#334155" : "#e2e8f0"),
                      position: "relative", transition: "background 0.2s", flexShrink: 0
                    }}>
                      <span style={{
                        position: "absolute", top: "3px", left: s.val ? "22px" : "3px",
                        width: "18px", height: "18px", background: "#fff", borderRadius: "50%",
                        transition: "left 0.2s", display: "block"
                      }} />
                    </button>
                  </div>
                ))}

                <button onClick={() => showToast("Settings saved!", "success")}
                  style={{ marginTop: "20px", padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                  Save Settings
                </button>
              </div>

              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: theme.text }}>Appearance</h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontWeight: 500, fontSize: "14px", color: theme.text }}>Dark Mode</p>
                    <p style={{ margin: 0, fontSize: "12px", color: theme.muted }}>Toggle dark/light theme</p>
                  </div>
                  <button onClick={() => setDarkMode(!darkMode)} style={{
                    width: "44px", height: "24px", borderRadius: "999px", border: "none", cursor: "pointer",
                    background: darkMode ? "#2563eb" : "#e2e8f0", position: "relative", transition: "background 0.2s"
                  }}>
                    <span style={{
                      position: "absolute", top: "3px", left: darkMode ? "22px" : "3px",
                      width: "18px", height: "18px", background: "#fff", borderRadius: "50%",
                      transition: "left 0.2s", display: "block"
                    }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── REQUEST DETAIL SPLIT-VIEW (Admin) ─────────────────────────── */}
          {activeView === "request-detail" && selectedRequest && (
            <RequestDetailView
              request={selectedRequest}
              detailsData={detailsData}
              loadingDetails={loadingDetails}
              senderEmail={currentAdmin?.email || "admin@system"}
              senderName={currentAdmin?.name || "Admin"}
              senderRole="admin"
              senderId={currentAdmin?.id}
              authorId={currentAdmin?.id}
              theme={theme}
              onClose={closeSrModal}
              onDownloadDoc={downloadDocument}
              uploadFileToServer={async (file) => {
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    try {
                      const res = await fetch("/api/documents/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          uploader: "admin",
                          uploaderId: currentAdmin?.email || "admin",
                          uploaderName: currentAdmin?.name || "Admin",
                          clientEmail: selectedRequest?.userEmail || "",
                          clientId: selectedRequest?.userEmail || "",
                          title: file.name,
                          fileName: file.name,
                          fileSize: (file.size / 1024).toFixed(1) + " KB",
                          mimeType: file.type,
                          fileData: reader.result,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) resolve({ success: true, docId: data.document.id });
                      else resolve({ success: false });
                    } catch { resolve({ success: false }); }
                  };
                  reader.readAsDataURL(file);
                });
              }}
              showStatusControls={true}
              onUpdateStatus={updateRequestStatus}
              onUpdateRequestId={updateRequestId}
            />
          )}

        </main>
      </div>

      {/* ── EDIT REQUEST MODAL (Maker/Checker Assignment) ───────────────── */}
      {srMode === "edit" && selectedRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
          <div style={{ width: "min(500px, 95%)", background: theme.cardBg, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: theme.text }}>✏ Edit Request</h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: theme.muted }}>{selectedRequest.id}</p>
              </div>
              <button onClick={closeSrModal} style={{ background: "transparent", border: "none", color: theme.muted, fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {/* Form Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, overflowY: "auto" }}>

              {/* Assign To */}
              <div>
                <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Assign To (Team Member)</label>
                <select
                  value={editForm.assignedToId || ""}
                  onChange={e => {
                    const m = teamMembers.find(m => m.id === e.target.value);
                    setEditForm(prev => ({ ...prev, assignedToId: m?.id || "", assignedToName: m?.name || "" }));
                  }}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }}
                >
                  <option value="">— Unassigned —</option>
                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                </select>
              </div>

              {/* Checker Assignment (Quality Control) */}
              <div>
                <label style={{ color: theme.muted, fontSize: "13px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Reviewer (Checker)</label>
                <select 
                  value={editForm.reviewerId || ""}
                  onChange={e => {
                    const tm = teamMembers.find(m => m.id === e.target.value);
                    setEditForm({ ...editForm, reviewerId: tm?.id || null, reviewerName: tm?.name || null });
                  }}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: "14px", outline: "none" }}
                >
                  <option value="">— No Reviewer —</option>
                  {teamMembers.map(m => <option key={`rev-${m.id}`} value={m.id}>{m.name} ({m.role})</option>)}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label style={{ color: theme.muted, fontSize: "13px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Priority</label>
                <select 
                  value={editForm.priority || "medium"}
                  onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: "14px", outline: "none" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Status</label>
                <select
                  value={editForm.status || ""}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }}
                >
                  <option value="submitted">Submitted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending_docs">Pending Docs</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>🗓 Due Date (SLA Deadline)</label>
                <input
                  type="date"
                  value={editForm.dueDate || ""}
                  onChange={e => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
                {editForm.dueDate && (
                  <p style={{ margin: "5px 0 0", fontSize: "11px", color: theme.muted }}>
                    SLA preview: <strong style={{ color: new Date(editForm.dueDate) < new Date(new Date().toDateString()) ? "#ef4444" : new Date(editForm.dueDate).toDateString() === new Date().toDateString() ? "#f59e0b" : "#10b981" }}>
                      {new Date(editForm.dueDate) < new Date(new Date().toDateString()) ? "🔴 Overdue" : new Date(editForm.dueDate).toDateString() === new Date().toDateString() ? "🟡 Due Today" : "🟢 On Track"}
                    </strong>
                  </p>
                )}
              </div>

              {/* Change Request ID (Manual) */}
              <div>
                <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Change Request ID (Manual)</label>
                <input
                  type="text"
                  value={editForm.newId || ""}
                  onChange={e => setEditForm(prev => ({ ...prev, newId: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Dummy Mode */}
              <div>
                <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Dummy Mode</label>
                <select
                  value={editForm.isDummy ? "true" : "false"}
                  onChange={e => setEditForm(prev => ({ ...prev, isDummy: e.target.value === "true" }))}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }}
                >
                  <option value="false">Standard Mode (Shows in assigned list)</option>
                  <option value="true">Dummy Mode (Hidden from assigned list)</option>
                </select>
              </div>

              {/* Reference ID */}
              <div>
                <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Reference ID</label>
                <input
                  type="text"
                  value={editForm.referenceId || ""}
                  onChange={e => setEditForm(prev => ({ ...prev, referenceId: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={closeSrModal} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", color: theme.muted, fontSize: "14px" }}>Cancel</button>
              <button onClick={saveRequestEdits} style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>💾 Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Allocate Clients Modal ──────────────────────────────────────── */}
      {allocateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
          <div style={{ width: "min(560px, 95%)", background: theme.cardBg, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: theme.text }}>Allocate Clients</h3>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: theme.muted }}>Choose clients for <strong>{allocateModal.name}</strong></p>
              </div>
              <button onClick={() => setAllocateModal(null)} style={{ background: "transparent", border: "none", color: theme.muted, fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {/* Client List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {users.length === 0 ? (
                <p style={{ color: theme.muted, textAlign: "center", padding: "24px 0" }}>No clients registered yet.</p>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: theme.muted }}>{allocateSelected.length} of {users.length} selected</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => setAllocateSelected(users.map(u => u.id))} style={{ fontSize: "12px", padding: "4px 10px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "6px", cursor: "pointer", color: theme.muted }}>Select All</button>
                      <button onClick={() => setAllocateSelected([])} style={{ fontSize: "12px", padding: "4px 10px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "6px", cursor: "pointer", color: theme.muted }}>Clear All</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {users.map(u => {
                      const checked = allocateSelected.includes(u.id);
                      return (
                        <label key={u.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", border: `1px solid ${checked ? "#0ea5e9" : theme.border}`, background: checked ? (darkMode ? "#1e3a5f" : "#f0f9ff") : "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                          <input type="checkbox" checked={checked} onChange={() => {
                            setAllocateSelected(prev => checked ? prev.filter(id => id !== u.id) : [...prev, u.id]);
                          }} style={{ width: "16px", height: "16px", accentColor: "#0ea5e9", flexShrink: 0 }} />
                          <div style={{ width: "30px", height: "30px", background: "#0ea5e9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "11px", flexShrink: 0 }}>
                            {(u.name || "?")[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: theme.text }}>{u.name}</p>
                            <p style={{ margin: 0, fontSize: "12px", color: theme.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                          </div>
                          {checked && <span style={{ fontSize: "16px" }}>✔</span>}
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setAllocateModal(null)} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", color: theme.muted, fontSize: "14px" }}>Cancel</button>
              <button onClick={saveAllocation} disabled={allocateSaving} style={{ padding: "10px 24px", background: allocateSaving ? "#94a3b8" : "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", cursor: allocateSaving ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px" }}>
                {allocateSaving ? "Saving..." : `Save Allocation (${allocateSelected.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Confirm Dialog Modal ────────────────────────────────────── */}
      {confirmModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ width: "min(420px, 95%)", background: theme.cardBg, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "20px 24px" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: "16px", fontWeight: 700, color: theme.text }}>{confirmModal.title}</h3>
              <p style={{ margin: 0, fontSize: "14px", color: theme.muted, lineHeight: "1.5" }}>{confirmModal.message}</p>
            </div>
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.border}`, background: darkMode ? "#1e293b" : "#f8fafc", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null })} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", color: theme.muted, fontSize: "13px", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={() => { confirmModal.onConfirm?.(); }} style={{ padding: "8px 18px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View History Modal ────────────────────────────────────────────────── */}
      {showHistoryModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
          <div style={{ width: "min(640px, 95%)", background: theme.cardBg, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: theme.text }}>Recent Requests History</h3>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: theme.muted }}>Overview of the latest activity in the system</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: "transparent", border: "none", color: theme.muted, fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {serviceRequests.map(r => (
                <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", border: `1px solid ${theme.border}`, borderRadius: "12px", background: darkMode ? "#1e293b" : "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "12px", background: "#e0f2fe", color: "#0369a1", padding: "2px 7px", borderRadius: "4px", fontWeight: 700, marginRight: "8px" }}>
                        {(r.serviceType || "").replace(/_/g, " ")}
                      </span>
                      <strong style={{ color: theme.text, fontSize: "14px" }}>{r.id}</strong>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: theme.muted }}>
                    <span>Client: <strong style={{ color: theme.text }}>{r.clientName || r.userEmail}</strong></span>
                    <span>Assigned: <strong style={{ color: theme.text }}>{r.assignedToName || "Unassigned"}</strong></span>
                    <span>Created: <strong style={{ color: theme.text }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "-"}</strong></span>
                    <span>Checker: <strong style={{ color: theme.text }}>{r.reviewerName || "None"}</strong></span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                    <button onClick={() => { setShowHistoryModal(false); viewRequestDetails(r); }} style={{ padding: "6px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
              {serviceRequests.length === 0 && (
                <p style={{ textAlign: "center", color: theme.muted, padding: "20px 0" }}>No history found.</p>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowHistoryModal(false)} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", color: theme.muted, fontSize: "13px", fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Information Modal (CRM popup) ────────────────────────── */}
      {selectedClientForView && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
          <div style={{ width: "min(780px, 95%)", background: theme.cardBg, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: theme.text }}>Client Information</h3>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: theme.muted }}>Profile and history details for CRM lookup</p>
              </div>
              <button onClick={() => setSelectedClientForView(null)} style={{ background: "transparent", border: "none", color: theme.muted, fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Profile Details */}
              <div style={{ background: darkMode ? "#1e293b" : "#f8fafc", padding: "16px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, color: theme.text }}>Profile Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "13px" }}>
                  <div>Name: <strong style={{ color: theme.text }}>{selectedClientForView.name}</strong></div>
                  <div>Email: <strong style={{ color: theme.text }}>{selectedClientForView.email}</strong></div>
                  <div>Mobile: <strong style={{ color: theme.text }}>{selectedClientForView.mobile}</strong></div>
                  <div>Registered: <strong style={{ color: theme.text }}>{selectedClientForView.createdAt ? new Date(selectedClientForView.createdAt).toLocaleDateString("en-IN") : "-"}</strong></div>
                </div>
              </div>

              {/* Service Requests */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 700, color: theme.text }}>Associated Requests</h4>
                {(() => {
                  const clientReqs = serviceRequests.filter(r => r.userEmail === selectedClientForView.email);
                  return clientReqs.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "13px", color: theme.muted }}>No requests associated with this client.</p>
                  ) : (
                    <div style={{ overflowX: "auto", border: `1px solid ${theme.border}`, borderRadius: "8px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: theme.tableTh, color: "#fff" }}>
                            <th style={{ padding: "10px 12px" }}>ID</th>
                            <th style={{ padding: "10px 12px" }}>Service Type</th>
                            <th style={{ padding: "10px 12px" }}>Status</th>
                            <th style={{ padding: "10px 12px" }}>Checker</th>
                            <th style={{ padding: "10px 12px" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientReqs.map(r => (
                            <tr key={r.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                              <td style={{ padding: "10px 12px", fontWeight: 600 }}>{r.id}</td>
                              <td style={{ padding: "10px 12px" }}>{(r.serviceType || "").replace(/_/g, " ")}</td>
                              <td style={{ padding: "10px 12px" }}><StatusBadge status={r.status} /></td>
                              <td style={{ padding: "10px 12px" }}>{r.reviewerName || "-"}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <button onClick={() => { setSelectedClientForView(null); viewRequestDetails(r); }} style={{ padding: "4px 8px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Documents */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 700, color: theme.text }}>Uploaded Documents</h4>
                {(() => {
                  const clientDocs = documents.filter(d => d.clientId === selectedClientForView.id || d.clientEmail === selectedClientForView.email);
                  return clientDocs.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "13px", color: theme.muted }}>No documents uploaded for this client.</p>
                  ) : (
                    <div style={{ overflowX: "auto", border: `1px solid ${theme.border}`, borderRadius: "8px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: theme.tableTh, color: "#fff" }}>
                            <th style={{ padding: "10px 12px" }}>File Name</th>
                            <th style={{ padding: "10px 12px" }}>Title</th>
                            <th style={{ padding: "10px 12px" }}>Uploaded By</th>
                            <th style={{ padding: "10px 12px" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientDocs.map(d => (
                            <tr key={d.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                              <td style={{ padding: "10px 12px", fontWeight: 600 }}>{d.fileName}</td>
                              <td style={{ padding: "10px 12px" }}>{d.title || "-"}</td>
                              <td style={{ padding: "10px 12px" }}>{d.uploaderName || d.uploader}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <button onClick={() => downloadDocument(d.id, d.fileName)} style={{ padding: "4px 8px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "4px", cursor: "pointer", fontSize: "11px", color: "#2563eb", fontWeight: 600 }}>
                                  Download
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedClientForView(null)} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", color: theme.muted, fontSize: "13px", fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* ── Edit Team Member Modal ─────────────────────────────────────────── */}
      {editingTeamMember && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
          <div style={{ width: "min(520px, 95%)", background: theme.cardBg, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: theme.text }}>Edit Team Member Details</h3>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: theme.muted }}>Update details for <strong>{editingTeamMember.name}</strong></p>
              </div>
              <button onClick={() => setEditingTeamMember(null)} style={{ background: "transparent", border: "none", color: theme.muted, fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Full Name</label>
                  <input type="text" value={editMemberName} onChange={e => setEditMemberName(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Email Address</label>
                  <input type="email" value={editMemberEmail} onChange={e => setEditMemberEmail(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Phone Number</label>
                  <input type="tel" value={editMemberPhone} onChange={e => setEditMemberPhone(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Role / Title</label>
                  <input type="text" value={editMemberRole} onChange={e => setEditMemberRole(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Services (comma-separated)</label>
                <input type="text" value={editMemberServices} onChange={e => setEditMemberServices(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                <p style={{ margin: "4px 0 6px", fontSize: "11px", color: theme.muted }}>Example: ITR, GST_FILING, BOOKKEEPING</p>
              </div>
              
              {/* Permissions Checkboxes */}
              <div>
                <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Assign Rights (Permissions)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: darkMode ? "#1e293b" : "#f8fafc", padding: "12px", borderRadius: "8px", border: `1px solid ${theme.border}` }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: theme.text }}>
                    <input type="checkbox" checked={editRightsAllRequests} onChange={e => setEditRightsAllRequests(e.target.checked)} style={{ accentColor: "#2563eb" }} />
                    All Requests Access
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: theme.text }}>
                    <input type="checkbox" checked={editRightsEditRequestId} onChange={e => setEditRightsEditRequestId(e.target.checked)} style={{ accentColor: "#2563eb" }} />
                    Edit Request ID Access
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: theme.text }}>
                    <input type="checkbox" checked={editRightsChangePayment} onChange={e => setEditRightsChangePayment(e.target.checked)} style={{ accentColor: "#2563eb" }} />
                    Change Payment Access
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: theme.text }}>
                    <input type="checkbox" checked={editRightsDeleteDocuments} onChange={e => setEditRightsDeleteDocuments(e.target.checked)} style={{ accentColor: "#2563eb" }} />
                    Delete Documents Access
                  </label>
                </div>
              </div>
              {isSuperAdmin && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Reset Password (Super Admin only)</label>
                    <input type="password" value={editMemberPassword} onChange={e => setEditMemberPassword(e.target.value)} placeholder="Leave blank to keep current"
                      className="premium-input" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Confirm Password</label>
                    <input type="password" value={editMemberConfirmPassword} onChange={e => setEditMemberConfirmPassword(e.target.value)} placeholder="Confirm new password"
                      className="premium-input" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setEditingTeamMember(null)} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", color: theme.muted, fontSize: "14px" }}>Cancel</button>
              <button onClick={saveTeamMemberEdits} style={{ padding: "10px 24px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Admin Modal ─────────────────────────────────────────── */}
      {editingAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
          <div style={{ width: "min(520px, 95%)", background: theme.cardBg, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: theme.text }}>Edit Admin Details</h3>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: theme.muted }}>Update details for <strong>{editingAdmin.name || editingAdmin.email}</strong></p>
              </div>
              <button onClick={() => setEditingAdmin(null)} style={{ background: "transparent", border: "none", color: theme.muted, fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Full Name</label>
                  <input type="text" value={editAdminName} onChange={e => setEditAdminName(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Email Address</label>
                  <input type="email" value={editAdminEmail} onChange={e => setEditAdminEmail(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>Phone Number</label>
                  <input type="tel" value={editAdminPhone} onChange={e => setEditAdminPhone(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>System Role</label>
                  <select value={editAdminRole} onChange={e => setEditAdminRole(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }}>
                    <option value="Admin">Standard Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>New Password (leave blank to keep current)</label>
                <input type="password" placeholder="••••••••" value={editAdminPassword} onChange={e => setEditAdminPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setEditingAdmin(null)} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", color: theme.muted, fontSize: "14px" }}>Cancel</button>
              <button onClick={saveAdminEdits} style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}