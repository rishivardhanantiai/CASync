"use client";

import { useEffect, useState } from "react";
import { showToast, ToastContainer } from "@/components/Toast";
import RequestDetailView from "@/components/RequestDetailView";
import SLABadge from "@/components/SLABadge";
import RequestFilterBar, { DEFAULT_FILTERS, applyRequestFilters } from "@/components/RequestFilterBar";

// ─── Initial Data ────────────────────────────────────────────────────────────

// Removed MOCK_ACTIVITY

const STATUS_MAP = {
  in_progress: { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8" },
  submitted: { label: "Submitted", bg: "#fef9c3", color: "#a16207" },
  completed: { label: "Completed", bg: "#dcfce7", color: "#15803d" },
  pending_docs: { label: "Pending Docs", bg: "#fee2e2", color: "#b91c1c" },
};

const PRIORITY_MAP = {
  high: { label: "High", bg: "#fee2e2", color: "#b91c1c" },
  medium: { label: "Medium", bg: "#fef9c3", color: "#a16207" },
  low: { label: "Low", bg: "#dcfce7", color: "#15803d" },
};

const SERVICE_LABELS = {
  ITR: "ITR", GST_FILING: "GST FILING", GST_REGISTRATION: "GST REGISTRATION",
  BOOKKEEPING: "BOOKKEEPING", COMPANY: "COMPANY", FIRM: "FIRM",
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "myRequests", label: "My Assigned Requests", icon: "📋" },
  { id: "allRequests", label: "All Requests", icon: "📂" },
  { id: "documents", label: "Documents", icon: "📄" },
  { id: "clients", label: "Clients", icon: "👥" },
  { id: "activityLog", label: "Activity Log", icon: "📜" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

// ─── Reusable StatusBadge ─────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = PRIORITY_MAP[priority] || { label: priority, bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, background: p.bg, color: p.color, textTransform: "uppercase" }}>
      {p.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TeamDashboardPage() {
  const [activeView, setActiveView] = useState("loginPage");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Auth state
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [currentMember, setCurrentMember] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [srMode, setSrMode] = useState(null); // 'view'
  const [detailsData, setDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  // Filters
  const [myReqFilters, setMyReqFilters] = useState({ ...DEFAULT_FILTERS });
  const [allReqFilters, setAllReqFilters] = useState({ ...DEFAULT_FILTERS });
  // Legacy aliases (used in status update & other logic)
  const myReqSearch = myReqFilters.search;
  const myReqStatus = myReqFilters.status;
  const allReqSearch = allReqFilters.search;
  const allReqStatus = allReqFilters.status;
  const [docSearch, setDocSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  // Real data
  const [myRequests, setMyRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [myClients, setMyClients] = useState([]);
  const [myDocuments, setMyDocuments] = useState([]);

  // Document upload
  const [docClientId, setDocClientId] = useState("");
  const [docClientEmail, setDocClientEmail] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docNote, setDocNote] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);

  // Load saved member on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("currentTeamMember") || "null");
      if (saved) {
        setCurrentMember(saved);
        setProfileName(saved.name || "");
        setProfilePhone(saved.phone || "");
        setActiveView("dashboard");
        // Load real data
        loadMyClients(saved.id);
        loadMyDocuments(saved.id);
        loadTeamDashboardData(saved.id);
      }
      const dark = localStorage.getItem("teamDarkMode") === "true";
      setDarkMode(dark);
    } catch (_) { }
  }, []);

  async function loadTeamDashboardData(memberId) {
    try {
      const res = await fetch(`/api/team/dashboard-data?memberId=${memberId}`);
      const data = await res.json();
      if (data.success) {
        setMyRequests(data.myRequests);
        setAllRequests(data.allRequests);
      }
    } catch { console.log("Error loading dashboard data"); }
  }

  async function loadMyClients(memberId) {
    try {
      const res = await fetch(`/api/team/my-clients?memberId=${memberId}`);
      const data = await res.json();
      if (data.success) setMyClients(data.clients);
    } catch { console.log("Error loading clients"); }
  }

  async function loadMyDocuments(memberId) {
    // Fetch documents for all allocated clients
    try {
      const res = await fetch("/api/documents/list");
      const data = await res.json();
      if (data.success) setMyDocuments(data.documents);
    } catch { console.log("Error loading documents"); }
  }

  async function uploadDocument() {
    if (!docFile || !docClientEmail) { showToast("Please select a client and a file", "warning"); return; }
    setDocUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: docFile.name,
            fileData: base64,
            fileSize: `${(docFile.size / 1024).toFixed(1)} KB`,
            mimeType: docFile.type,
            uploader: "team",
            uploaderId: currentMember?.id || "",
            uploaderName: currentMember?.name || "Team Member",
            clientId: docClientId,
            clientEmail: docClientEmail,
            title: docTitle,
            note: docNote,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Document uploaded!", "success");
          setDocFile(null); setDocTitle(""); setDocNote(""); setDocClientId(""); setDocClientEmail("");
          loadMyDocuments(currentMember?.id);
        } else showToast(data.message || "Upload failed", "error");
        setDocUploading(false);
      };
      reader.readAsDataURL(docFile);
    } catch { showToast("Error uploading", "error"); setDocUploading(false); }
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
      } else showToast("Download failed", "error");
    } catch { showToast("Download error", "error"); }
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  async function login() {
    if (!memberEmail || !memberPassword) { showToast("Please fill all fields", "warning"); return; }
    try {
      const res = await fetch("/api/team/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: memberEmail, password: memberPassword }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("currentTeamMember", JSON.stringify(data.member));
        setCurrentMember(data.member);
        setProfileName(data.member.name || "");
        setProfilePhone(data.member.phone || "");
        setActiveView("dashboard");
        loadMyClients(data.member.id);
        loadMyDocuments(data.member.id);
        loadTeamDashboardData(data.member.id);
        showToast(`Welcome back, ${data.member.name}!`, "success");
      } else {
        showToast(data.message || "Incorrect credentials", "error");
      }
    } catch { showToast("Login failed. Please try again.", "error"); }
  }

  function logout() {
    localStorage.removeItem("currentTeamMember");
    setCurrentMember(null);
    setMemberEmail(""); setMemberPassword("");
    setMyRequests([]);
    setAllRequests([]);
    setMyClients([]);
    setMyDocuments([]);
    setActiveView("loginPage");
    showToast("Logged out successfully", "info");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  function closeSrModal() {
    setSelectedRequest(null);
    setSrMode(null);
    setDetailsData(null);
    if (activeView === "request-detail") setActiveView("myRequests");
  }

  async function updateRequestStatus(id, newStatus) {
    let adminNotes = null;
    if (newStatus === "pending_docs") {
      adminNotes = prompt("Please enter the reason for return / missing documents:");
      if (adminNotes === null) return; // Cancelled
    }

    try {
      const res = await fetch("/api/admin/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, adminNotes })
      });
      const data = await res.json();
      if (data.success) {
        setMyRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, adminNotes } : r));
        setAllRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, adminNotes } : r));
        showToast(`Status updated to ${newStatus}`, "success");
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch { showToast("Error updating status.", "error"); }
  }

  async function downloadDocument(id, fileName) {
    try {
      const res = await fetch(`/api/documents/download?id=${id}`);
      const data = await res.json();
      if (data.success) {
        const link = document.createElement("a");
        link.href = data.data.fileData;
        link.download = fileName || data.data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Download started", "success");
      } else {
        showToast(data.message || "Download failed", "error");
      }
    } catch { showToast("Error downloading document.", "error"); }
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

  function navigate(view) { setActiveView(view); }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("teamDarkMode", String(next));
  }

  // ── Computed data ──────────────────────────────────────────────────────────
  const memberName = currentMember?.name || "Team Member";
  const memberServices = currentMember?.services || [];
  const memberInitials = memberName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const myCompleted = myRequests.filter(r => r.status === "completed").length;
  const myPending = myRequests.filter(r => r.status !== "completed").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const myDueToday = myRequests.filter(r => r.dueDate && r.dueDate.split("T")[0] === todayStr).length;
  const workloadPct = Math.min(Math.round((myRequests.length / 10) * 100), 100);

  const filteredMyReqs = applyRequestFilters(myRequests, myReqFilters);
  const filteredAllReqs = applyRequestFilters(allRequests, allReqFilters);

  const filteredDocs = myDocuments.filter(d => !docSearch || (d.fileName || "").toLowerCase().includes(docSearch.toLowerCase()) || (d.clientEmail || "").toLowerCase().includes(docSearch.toLowerCase()));
  const filteredClients = myClients.filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.email.toLowerCase().includes(clientSearch.toLowerCase()));

  // ── Theme ─────────────────────────────────────────────────────────────────
  const theme = darkMode ? {
    bg: "#0f172a", cardBg: "#1e293b", border: "#334155",
    text: "#f1f5f9", muted: "#94a3b8", inputBg: "#1e293b", inputBorder: "#475569", tableTh: "#1e3a5f",
  } : {
    bg: "#f1f5f9", cardBg: "#ffffff", border: "#e2e8f0",
    text: "#0f172a", muted: "#64748b", inputBg: "#ffffff", inputBorder: "#e2e8f0", tableTh: "#2563eb",
  };

  // ── Table helper ──────────────────────────────────────────────────────────
  function Table({ headers, rows, emptyMsg = "No data found" }) {
    return (
      <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: theme.tableTh }}>
                {headers.map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0
                ? <tr><td colSpan={headers.length} style={{ padding: "48px", textAlign: "center", color: theme.muted }}>{emptyMsg}</td></tr>
                : rows}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Filter bar helper ─────────────────────────────────────────────────────
  function FilterBar({ search, setSearch, status, setStatus, placeholder }) {
    return (
      <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <input placeholder={placeholder || "Search..."} value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }} />
        {setStatus && (
          <select value={status} onChange={e => setStatus(e.target.value)}
            style={{ padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", cursor: "pointer" }}>
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_docs">Pending Docs</option>
            <option value="completed">Completed</option>
          </select>
        )}
      </div>
    );
  }

  // ── Login page ────────────────────────────────────────────────────────────
  if (activeView === "loginPage") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', sans-serif" }}>
        <ToastContainer />
        {/* Top bar */}
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
          <a href="/login" style={{ color: "#fff", textDecoration: "none", padding: "12px 16px", fontSize: "14px" }}>Client Login</a>
          <a href="/admin-dashboard?view=login" style={{ color: "#fff", textDecoration: "none", padding: "12px 16px", fontSize: "14px" }}>Admin Login</a>
        </div>

        {/* Login card */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
          <div style={{ background: "#1e293b", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px", border: "1px solid #334155" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ width: "56px", height: "56px", background: "#0ea5e9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", margin: "0 auto 16px" }}>👷</div>
              <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 }}>Team Login</h1>
              <p style={{ color: "#94a3b8", fontSize: "14px", margin: "6px 0 0" }}>CASync Team Member Portal</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Email Address</label>
                <input type="email" placeholder="team@totaltaxhub.com" value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && login()}
                  style={{ width: "100%", padding: "11px 14px", background: "#0f172a", border: "1px solid #475569", borderRadius: "8px", color: "#fff", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Password</label>
                <input type="password" placeholder="••••••••" value={memberPassword}
                  onChange={e => setMemberPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && login()}
                  style={{ width: "100%", padding: "11px 14px", background: "#0f172a", border: "1px solid #475569", borderRadius: "8px", color: "#fff", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
              </div>
              <button onClick={login} style={{ padding: "12px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>
                Login to Team Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard layout ────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "'Segoe UI', sans-serif" }}>
      <ToastContainer />

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarCollapsed ? "64px" : "220px",
        background: "#0f172a",
        display: "flex", flexDirection: "column",
        flexShrink: 0, transition: "width 0.25s ease",
        position: "fixed", left: 0, top: 0, zIndex: 30,
        borderRight: "1px solid #1e293b", height: "100vh"
      }}>
        {/* Brand */}
        <div style={{ padding: "16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", minHeight: "64px" }}>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
              <div style={{ width: "32px", height: "32px", background: "#0ea5e9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: "14px", flexShrink: 0 }}>CA</div>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px", whiteSpace: "nowrap" }}>CASync Team</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div style={{ width: "32px", height: "32px", background: "#0ea5e9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontWeight: 700, color: "#fff", fontSize: "14px" }}>CA</div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#94a3b8", cursor: "pointer", borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
          {!sidebarCollapsed && (
            <p style={{ color: "#475569", fontSize: "10px", fontWeight: 600, letterSpacing: "1px", padding: "4px 8px 8px", textTransform: "uppercase" }}>TEAM PANEL</p>
          )}
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => navigate(item.id)} title={sidebarCollapsed ? item.label : ""}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: sidebarCollapsed ? "10px" : "10px 12px",
                background: activeView === item.id ? "#0ea5e9" : "transparent",
                border: "none", borderRadius: "8px", cursor: "pointer",
                color: activeView === item.id ? "#fff" : "#94a3b8",
                fontSize: "13px", fontWeight: activeView === item.id ? 600 : 400,
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                transition: "all 0.15s ease",
              }}>
              <span style={{ fontSize: "15px", flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid #1e293b", padding: "12px 8px", marginTop: "auto" }}>
          <button onClick={toggleDark}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: sidebarCollapsed ? "10px" : "10px 12px", background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "13px", borderRadius: "8px", justifyContent: sidebarCollapsed ? "center" : "flex-start", marginBottom: "4px" }}>
            <span style={{ fontSize: "15px" }}>{darkMode ? "☀" : "🌙"}</span>
            {!sidebarCollapsed && <span>{darkMode ? "Light" : "Dark"}</span>}
          </button>
          <button onClick={logout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: sidebarCollapsed ? "10px" : "10px 12px", background: "transparent", border: "none", cursor: "pointer", color: "#f87171", fontSize: "13px", borderRadius: "8px", justifyContent: sidebarCollapsed ? "center" : "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "15px" }}>↩</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#1e293b", borderRadius: "8px" }}>
              <div style={{ width: "32px", height: "32px", background: "#0ea5e9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>{memberInitials}</div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{memberName}</p>
                <p style={{ color: "#64748b", fontSize: "10px", margin: 0 }}>Team</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, marginLeft: sidebarCollapsed ? "64px" : "220px", transition: "margin-left 0.25s ease" }}>
        {/* Topbar */}
        <div style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.border}`, padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: theme.muted }}>CA Services Platform</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={logout} style={{ padding: "7px 14px", background: "#ef4444", border: "none", borderRadius: "8px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600 }}>Logout</button>
          </div>
        </div>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px" }}>

          {/* ── DASHBOARD ──────────────────────────────────────────────── */}
          {activeView === "dashboard" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Welcome back, {memberName}</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Here&apos;s what&apos;s on your plate today</p>
              </div>

              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                {[
                  { label: "Assigned Requests", value: myRequests.length, icon: "📋", color: "#0ea5e9" },
                  { label: "Due Today", value: myDueToday, icon: "🕐", color: "#f59e0b" },
                  { label: "Pending Docs", value: myRequests.filter(r => r.status === "pending_docs").length, icon: "📁", color: "#8b5cf6" },
                  { label: "Completed This Month", value: myCompleted, icon: "✅", color: "#10b981" },
                ].map((s, i) => (
                  <div key={i} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px 24px" }}>
                    <p style={{ color: theme.muted, fontSize: "13px", margin: "0 0 8px", fontWeight: 500 }}>{s.label}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <span style={{ fontSize: "30px", fontWeight: 700, color: s.color }}>{s.value}</span>
                      <span style={{ fontSize: "20px" }}>{s.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Two-column layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", marginBottom: "24px" }}>
                {/* Assigned Requests */}
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: theme.text }}>Assigned Requests</h3>
                  <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 16px" }}>Your active service requests</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {myRequests.slice(0, 4).map(r => (
                      <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: `1px solid ${theme.border}`, borderRadius: "8px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: theme.text }}>{r.id}</p>
                            <span style={{ fontSize: "10px", background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{(r.serviceType || "").replace(/_/g, " ")}</span>
                            <PriorityBadge priority={r.priority} />
                          </div>
                          <p style={{ margin: 0, fontSize: "12px", color: theme.muted }}>Due {r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "—"}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <StatusBadge status={r.status} />
                          <span style={{ color: theme.muted, fontSize: "14px" }}>→</span>
                        </div>
                      </div>
                    ))}
                    {myRequests.length === 0 && <p style={{ color: theme.muted, fontSize: "14px", textAlign: "center", padding: "24px 0" }}>No assigned requests yet.</p>}
                  </div>
                </div>

                {/* Workload + Services */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 600, color: theme.text }}>Your Workload</h3>
                    <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 8px" }}>Current Load</p>
                    <div style={{ background: theme.border, borderRadius: "999px", height: "8px", marginBottom: "8px" }}>
                      <div style={{ width: `${workloadPct}%`, background: "#0ea5e9", height: "100%", borderRadius: "999px", transition: "width 0.5s ease" }} />
                    </div>
                    <p style={{ color: theme.muted, fontSize: "12px", margin: 0 }}>{myRequests.length} active assignment{myRequests.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: theme.text }}>Services You Handle</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                      {memberServices.length > 0
                        ? memberServices.map(s => <span key={s} style={{ padding: "3px 10px", background: "#e0f2fe", color: "#0369a1", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>{s}</span>)
                        : ["ITR", "GST", "BOOKKEEPING"].map(s => <span key={s} style={{ padding: "3px 10px", background: "#e0f2fe", color: "#0369a1", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>{s}</span>)
                      }
                    </div>
                    <button onClick={() => navigate("profile")}
                      style={{ width: "100%", padding: "8px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "13px", color: theme.muted }}>
                      View Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: theme.text }}>Recent Activity</h3>
                <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 16px" }}>Latest updates</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(() => {
                    const computedActivityLog = [
                      ...myDocuments.map(d => ({
                        id: `doc-${d.id}`,
                        text: `${d.fileName} uploaded by ${d.uploader === "client" ? "Client" : (d.uploader === "admin" ? "Admin" : (String(d.uploaderId) === String(currentMember?.id) ? "You" : (d.uploaderName || "Team")))} for ${d.clientEmail}`,
                        time: d.createdAt ? new Date(d.createdAt).toLocaleString("en-IN") : "Recently",
                        timeMs: d.createdAt ? new Date(d.createdAt).getTime() : 0,
                      })),
                      ...myClients.map(c => ({
                        id: `cli-${c.id}`,
                        text: `Client allocated to you: ${c.name} (${c.email})`,
                        time: c.createdAt ? new Date(c.createdAt).toLocaleString("en-IN") : "Recently",
                        timeMs: c.createdAt ? new Date(c.createdAt).getTime() : 0,
                      }))
                    ].sort((a, b) => b.timeMs - a.timeMs).slice(0, 10);

                    return computedActivityLog.length === 0 ? (
                      <p style={{ color: theme.muted, fontSize: "13px", padding: "10px 0" }}>No recent activity.</p>
                    ) : computedActivityLog.slice(0, 4).map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
                        <span style={{ width: "8px", height: "8px", background: "#0ea5e9", borderRadius: "50%", flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: "13px", color: theme.text, flex: 1 }}>{a.text}</p>
                        <span style={{ fontSize: "12px", color: theme.muted, whiteSpace: "nowrap" }}>{a.time}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ── MY ASSIGNED REQUESTS ──────────────────────────────────── */}
          {activeView === "myRequests" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>My Assigned Requests</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Service requests assigned to you</p>
              </div>
              <RequestFilterBar
                filters={myReqFilters}
                onChange={setMyReqFilters}
                theme={theme}
                dark={darkMode}
                showAssigned={false}
                resultCount={filteredMyReqs.length}
                totalCount={myRequests.length}
              />
              <Table
                headers={["Request ID", "Client", "Service", "Priority", "Status", "Due Date", "Actions"]}
                emptyMsg="No assigned requests found."
                rows={filteredMyReqs.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 1 ? (darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: theme.text }}>{r.id}</td>
                    <td style={{ padding: "12px 16px", color: theme.text }}>{r.clientName}</td>
                    <td style={{ padding: "12px 16px", color: theme.text }}><span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>{(r.serviceType || "").replace(/_/g, " ")}</span></td>
                    <td style={{ padding: "12px 16px" }}><PriorityBadge priority={r.priority} /></td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <SLABadge dueDate={r.dueDate} status={r.status} dark={darkMode} />
                        {r.dueDate && r.status !== "completed" && (
                          <span style={{ fontSize: "10px", color: theme.muted }}>
                            {new Date(r.dueDate).toLocaleDateString("en-IN")}
                          </span>
                        )}
                        {!r.dueDate && <span style={{ color: theme.muted, fontSize: "11px" }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => viewRequestDetails(r)} style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "12px", color: theme.muted }}>👁 View</button>
                        {r.status === "submitted" && (
                          <button onClick={() => updateRequestStatus(r.id, "in_progress")}
                            style={{ padding: "5px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Start</button>
                        )}
                        {r.status === "in_progress" && (
                          <>
                            <button onClick={() => updateRequestStatus(r.id, "completed")}
                              style={{ padding: "5px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Done</button>
                            <button onClick={() => updateRequestStatus(r.id, "pending_docs")}
                              style={{ padding: "5px 10px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Return</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}

          {/* ── ALL REQUESTS ──────────────────────────────────────────── */}
          {activeView === "allRequests" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>All Requests</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Read-only view of all service requests</p>
              </div>
              <RequestFilterBar
                filters={allReqFilters}
                onChange={setAllReqFilters}
                theme={theme}
                dark={darkMode}
                showAssigned={false}
                resultCount={filteredAllReqs.length}
                totalCount={allRequests.length}
              />
              <Table
                headers={["Request ID", "Client", "Service", "Assigned To", "Priority", "Status", "Due", "Actions"]}
                rows={filteredAllReqs.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 1 ? (darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: theme.text }}>{r.id}</td>
                    <td style={{ padding: "12px 16px", color: theme.text }}>{r.clientName}</td>
                    <td style={{ padding: "12px 16px", color: theme.text }}><span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>{(r.serviceType || "").replace(/_/g, " ")}</span></td>
                    <td style={{ padding: "12px 16px", color: theme.text }}>{r.assignedToName || "Unassigned"}</td>
                    <td style={{ padding: "12px 16px" }}><PriorityBadge priority={r.priority} /></td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <SLABadge dueDate={r.dueDate} status={r.status} dark={darkMode} />
                        {r.dueDate && r.status !== "completed" && (
                          <span style={{ fontSize: "10px", color: theme.muted }}>
                            {new Date(r.dueDate).toLocaleDateString("en-IN")}
                          </span>
                        )}
                        {!r.dueDate && <span style={{ color: theme.muted, fontSize: "11px" }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => viewRequestDetails(r)} style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "12px", color: theme.muted }}>👁 View</button>
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}

          {/* ── DOCUMENTS ──────────────────────────────────────────────── */}
          {activeView === "documents" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Documents</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Upload and manage client documents</p>
              </div>

              {/* Upload Form */}
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 600, color: theme.text }}>📤 Upload Document for Client</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "5px" }}>Select Client *</label>
                    <select value={docClientId} onChange={e => {
                      const c = myClients.find(c => c.id === e.target.value);
                      setDocClientId(e.target.value);
                      setDocClientEmail(c?.email || "");
                    }} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }}>
                      <option value="">— Choose allocated client —</option>
                      {myClients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                    </select>
                    {myClients.length === 0 && <p style={{ color: "#f59e0b", fontSize: "11px", margin: "4px 0 0" }}>No clients allocated to you yet. Ask admin.</p>}
                  </div>
                  <div>
                    <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "5px" }}>Document Title</label>
                    <input type="text" placeholder="e.g. ITR Form, PAN Card" value={docTitle} onChange={e => setDocTitle(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "5px" }}>Note (optional)</label>
                    <input type="text" placeholder="Note for the client" value={docNote} onChange={e => setDocNote(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: theme.muted, fontSize: "12px", display: "block", marginBottom: "5px" }}>File *</label>
                    <input type="file" onChange={e => setDocFile(e.target.files[0] || null)}
                      style={{ width: "100%", padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px" }} />
                    {docFile && <p style={{ color: theme.muted, fontSize: "11px", marginTop: "3px" }}>{docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)</p>}
                  </div>
                </div>
                <button onClick={uploadDocument} disabled={docUploading}
                  style={{ marginTop: "14px", padding: "9px 22px", background: docUploading ? "#94a3b8" : "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", cursor: docUploading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "13px" }}>
                  {docUploading ? "Uploading..." : "📤 Upload Document"}
                </button>
              </div>

              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: theme.text }}>All Shared Documents ({myDocuments.length})</h3>
                  <div style={{ display: "flex", gap: "8px", flex: 1, justifyContent: "flex-end", minWidth: "250px" }}>
                    <input
                      placeholder="Search filename, title, or client..."
                      value={docSearch}
                      onChange={e => setDocSearch(e.target.value)}
                      style={{ padding: "8px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "100%", maxWidth: "300px" }}
                    />
                    <button style={{ padding: "8px 16px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Search</button>
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
                        const docsToShow = filteredDocs.filter(d =>
                          (String(d.uploaderId) === String(currentMember?.id)) ||
                          myClients.some(c => c.email === d.clientEmail)
                        );

                        if (docsToShow.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: theme.muted }}>
                                {docSearch ? "No matching documents found." : "No documents shared yet."}
                              </td>
                            </tr>
                          );
                        }

                        return docsToShow.map((doc, i) => (
                          <tr key={doc.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 1 ? (darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "16px" }}>📄</span>
                                <span style={{ fontWeight: 600, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>{doc.fileName}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", color: theme.muted }}>{doc.title || "—"}</td>
                            <td style={{ padding: "12px 16px", color: theme.text }}>
                              <span style={{ background: theme.inputBg, padding: "3px 8px", borderRadius: "6px" }}>
                                {myClients.find(c => c.email === doc.clientEmail)?.name || doc.clientEmail}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: doc.uploader === "admin" ? "#ede9fe" : (doc.uploader === "team" ? "#e0f2fe" : "#fef3c7"), color: doc.uploader === "admin" ? "#6d28d9" : (doc.uploader === "team" ? "#0369a1" : "#92400e") }}>
                                {doc.uploader === "admin" ? "Admin" : (doc.uploader === "client" ? "Client" : (String(doc.uploaderId) === String(currentMember?.id) ? "You" : (doc.uploaderName || "Team Member")))}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", color: theme.muted }}>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <button onClick={() => downloadDocument(doc.id, doc.fileName)}
                                style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "12px", color: "#0ea5e9", fontWeight: 600 }}>
                                ⬇ Download
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* ── CLIENTS ──────────────────────────────────────────────── */}
          {activeView === "clients" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>My Clients</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Clients allocated to you by admin ({myClients.length} total)</p>
              </div>
              <FilterBar search={clientSearch} setSearch={setClientSearch} placeholder="Search by name or email..." />
              <Table
                headers={["#", "Name", "Email", "Mobile", "Joined"]}
                emptyMsg={myClients.length === 0 ? "No clients allocated to you yet. Contact your admin." : "No clients match your search."}
                rows={filteredClients.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 1 ? (darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent" }}>
                    <td style={{ padding: "12px 16px", color: theme.muted }}>{i + 1}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "28px", height: "28px", background: "#0ea5e9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "11px", flexShrink: 0 }}>
                          {(c.name || "?")[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: theme.text }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: theme.text }}>{c.email}</td>
                    <td style={{ padding: "12px 16px", color: theme.text }}>{c.mobile || "—"}</td>
                    <td style={{ padding: "12px 16px", color: theme.muted }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                ))}
              />
            </div>
          )}
          {/* ── ACTIVITY LOG ────────────────────────────────────────────── */}
          {activeView === "activityLog" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Activity Log</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Recent activity on your requests</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(() => {
                  const computedActivityLog = [
                    ...myDocuments.map(d => ({
                      id: `doc-${d.id}`,
                      text: `${d.fileName} uploaded by ${d.uploader === "client" ? "Client" : (d.uploader === "admin" ? "Admin" : (String(d.uploaderId) === String(currentMember?.id) ? "You" : (d.uploaderName || "Team")))} for ${d.clientEmail}`,
                      time: d.createdAt ? new Date(d.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: d.createdAt ? new Date(d.createdAt).getTime() : 0,
                    })),
                    ...myClients.map(c => ({
                      id: `cli-${c.id}`,
                      text: `Client allocated to you: ${c.name} (${c.email})`,
                      time: c.createdAt ? new Date(c.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: c.createdAt ? new Date(c.createdAt).getTime() : 0,
                    }))
                  ].sort((a, b) => b.timeMs - a.timeMs).slice(0, 50);

                  return computedActivityLog.length === 0 ? (
                    <p style={{ color: theme.muted, fontSize: "14px", padding: "20px" }}>No activity log found.</p>
                  ) : computedActivityLog.map(a => (
                    <div key={a.id} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "36px", height: "36px", background: "#e0f2fe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>🕐</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: theme.text }}>{a.text}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: theme.muted, marginTop: "3px" }}>{a.time}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* ── PROFILE ──────────────────────────────────────────────── */}
          {activeView === "profile" && (
            <div style={{ maxWidth: "600px" }}>
              <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>My Profile</h1>
                  <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Your account information</p>
                </div>
                <button onClick={() => setEditingProfile(!editingProfile)}
                  style={{ padding: "8px 18px", background: editingProfile ? "#ef4444" : "transparent", color: editingProfile ? "#fff" : theme.muted, border: `1px solid ${editingProfile ? "#ef4444" : theme.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                  {editingProfile ? "✕ Cancel" : "✏ Edit"}
                </button>
              </div>
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: `1px solid ${theme.border}` }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: theme.text }}>Personal Information</h3>
                </div>
                {/* Fields */}
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { label: "Full Name", value: profileName, set: setProfileName, editable: true, type: "text" },
                    { label: "Email", value: currentMember?.email || "", set: null, editable: false, type: "email" },
                    { label: "Phone", value: profilePhone, set: setProfilePhone, editable: true, type: "tel" },
                    { label: "Role", value: currentMember?.role || "Team", set: null, editable: false, type: "text" },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>{f.label}</label>
                      {editingProfile && f.editable
                        ? <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                          style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
                        : <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: theme.text }}>{f.value || "—"}</p>
                      }
                    </div>
                  ))}
                  {memberServices.length > 0 && (
                    <div>
                      <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Services</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {memberServices.map(s => <span key={s} style={{ padding: "3px 10px", background: "#e0f2fe", color: "#0369a1", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>{s}</span>)}
                      </div>
                    </div>
                  )}
                  {editingProfile && (
                    <button onClick={() => { setEditingProfile(false); showToast("Profile updated!", "success"); }}
                      style={{ padding: "11px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", marginTop: "4px" }}>
                      💾 Save Changes
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ─────────────────────────────────────────────── */}
          {activeView === "settings" && (
            <div style={{ maxWidth: "560px" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Settings</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Manage your preferences</p>
              </div>
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                {[
                  { label: "Dark Mode", sub: "Toggle dark / light theme", action: <button onClick={toggleDark} style={{ width: "44px", height: "24px", borderRadius: "12px", background: darkMode ? "#0ea5e9" : "#cbd5e1", border: "none", cursor: "pointer", position: "relative" }}><span style={{ position: "absolute", top: "2px", left: darkMode ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} /></button> },
                  { label: "Email Notifications", sub: "Receive email updates on assigned requests", action: <button style={{ width: "44px", height: "24px", borderRadius: "12px", background: "#0ea5e9", border: "none", cursor: "pointer", position: "relative" }}><span style={{ position: "absolute", top: "2px", left: "22px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff" }} /></button> },
                  { label: "Language", sub: "Interface language", action: <select style={{ padding: "6px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, fontSize: "13px" }}><option>English</option><option>Hindi</option></select> },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: i < 2 ? `1px solid ${theme.border}` : "none" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: theme.text }}>{s.label}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: theme.muted, marginTop: "2px" }}>{s.sub}</p>
                    </div>
                    {s.action}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ── REQUEST DETAIL SPLIT-VIEW (Team) ──────────────────────────── */}
          {activeView === "request-detail" && selectedRequest && (
            <RequestDetailView
              request={selectedRequest}
              detailsData={detailsData}
              loadingDetails={loadingDetails}
              senderEmail={currentMember?.email || ""}
              senderName={currentMember?.name || "Team Member"}
              senderRole="team"
              senderId={currentMember?.id}
              authorId={currentMember?.id}
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
                          uploader: "team",
                          uploaderId: currentMember?.id || "",
                          uploaderName: currentMember?.name || "Team Member",
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
            />
          )}


        </main>
      </div>
    </div>
  );
}
