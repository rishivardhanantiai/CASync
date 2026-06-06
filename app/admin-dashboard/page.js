"use client";

import { useEffect, useState } from "react";
import { showToast, ToastContainer } from "@/components/Toast";
import RequestDetailView from "@/components/RequestDetailView";
import SLABadge from "@/components/SLABadge";
import TeamWorkloadTable from "@/components/TeamWorkloadTable";
import RequestFilterBar, { DEFAULT_FILTERS, applyRequestFilters } from "@/components/RequestFilterBar";

// ─── Initial NAV_ITEMS set ───────────────────────────────────────────────────

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "serviceRequests", label: "Service Requests", icon: "📋" },
  { id: "registeredUsers", label: "Clients", icon: "👥" },
  { id: "adminData", label: "Admin Data", icon: "🛡" },
  { id: "addAdmin", label: "Add Admin", icon: "➕" },
  { id: "teamMembers", label: "Team Members", icon: "👷" },
  { id: "addTeamMember", label: "Add Team Member", icon: "➕" },
  { id: "documents", label: "Documents", icon: "📁" },
  // { id: "reports",          label: "Reports",           icon: "📊" },
  { id: "activityLog", label: "Activity Log", icon: "📜" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    in_progress: { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8" },
    submitted: { label: "Submitted", bg: "#fef9c3", color: "#a16207" },
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

// ─── Simple bar chart using CSS ───────────────────────────────────────────────
function BarChart({ data, color = "#2563eb" }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "160px", padding: "8px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
            <div style={{
              width: "100%",
              height: `${(d.value / max) * 100}%`,
              background: color,
              borderRadius: "4px 4px 0 0",
              minHeight: d.value > 0 ? "8px" : "0",
              transition: "height 0.3s ease"
            }} />
          </div>
          <span style={{ fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Simple pie chart using CSS conic-gradient ────────────────────────────────
function PieChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  let cumulative = 0;
  const segments = data.map((d, i) => {
    const pct = (d.value / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start, color: colors[i % colors.length] };
  });
  const gradient = segments.map(s => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(", ");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
      <div style={{
        width: "120px", height: "120px", borderRadius: "50%",
        background: total > 0 ? `conic-gradient(${gradient})` : "#e2e8f0",
        flexShrink: 0
      }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "#64748b" }}>{s.label} ({s.value})</span>
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
  const [allocateModal, setAllocateModal] = useState(null); // { member } | null
  const [allocateSelected, setAllocateSelected] = useState([]);
  const [allocateSaving, setAllocateSaving] = useState(false);

  // Documents upload form
  const [docClientId, setDocClientId] = useState("");
  const [docClientEmail, setDocClientEmail] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docNote, setDocNote] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);

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
  // Legacy aliases used in some inline references
  const srSearch = srFilters.search;
  const srStatus = srFilters.status;
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [srMode, setSrMode] = useState(null); // 'view' | 'edit' | null
  const [editForm, setEditForm] = useState({});
  const [detailsData, setDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Settings state
  const [slaDefault, setSlaDefault] = useState("7");
  const [allowReg, setAllowReg] = useState(true);
  const [autoAssign, setAutoAssign] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);

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

  async function loadAllData() {
    const token = localStorage.getItem("adminToken");
    if (token) {
      loadStats();
      loadRequests();
      loadUsers();
      loadTeamMembers();
      loadDocuments();
      loadAdmins();
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
      if (data.success && data.document.fileData) {
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
      const res = await fetch("/api/team/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMemberName, email: newMemberEmail, phone: newMemberPhone, password: newMemberPassword, role: newMemberRole, services }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Team member added!", "success");
        setNewMemberName(""); setNewMemberEmail(""); setNewMemberPhone(""); setNewMemberPassword(""); setNewMemberRole("Team"); setNewMemberServices("");
        loadTeamMembers();
        navigate("teamMembers");
      } else { showToast(data.message || "Failed to add member", "error"); }
    } catch { showToast("Error adding team member.", "error"); }
  }

  useEffect(() => {
    // Always clear any stored admin session so credentials are required on every visit
    try {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("currentAdmin");
    } catch (_) { /* ignore */ }

    // Always start at the login page
    setActiveView("loginPage");
  }, []);

  // Modal helpers for view/edit
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
        assignedToName: editForm.assignedToName,
        assignedToId: editForm.assignedToId,
        status: editForm.status,
      };
      // Include dueDate — send null to clear it, or a valid ISO string
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
        closeSrModal();
      } else showToast(data.message || "Update failed", "error");
    } catch { showToast("Error updating request", "error"); }
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
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
    // Force a reload after a short delay to ensure everything is clean
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  function logoutClient(event) {
    event?.preventDefault();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    setCurrentUser(null);
    showToast("Logged out successfully", "info");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  // ── Add admin ────────────────────────────────────────────────────────────────
  async function addAdmin() {
    if (!newAdminEmail || !newAdminPassword) { showToast("Email and Password required", "warning"); return; }
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newAdminName, email: newAdminEmail, phone: newAdminPhone, password: newAdminPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Admin Added Successfully!", "success");
        setNewAdminName(""); setNewAdminEmail(""); setNewAdminPhone(""); setNewAdminPassword("");
        loadAdmins();
        setActiveView("adminData");
      } else {
        showToast(data.message || "Failed to add admin", "error");
      }
    } catch { showToast("Error adding admin.", "error"); }
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
        setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, adminNotes } : r));
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

  // ── Navigate ─────────────────────────────────────────────────────────────────
  function navigate(view) {
    setActiveView(view);
    setMobileSidebarOpen(false);
    if (view === "registeredUsers") loadUsers();
    if (view === "adminData") loadAdmins();
    if (view === "teamMembers") { loadTeamMembers(); loadUsers(); }
    if (view === "documents") { loadDocuments(); loadUsers(); }
  }

  // ── Computed stats ────────────────────────────────────────────────────────────
  const totalReq = serviceRequests.length;
  const pendingReq = serviceRequests.filter(r => r.status === "submitted" || r.status === "pending_docs").length;
  const completedReq = serviceRequests.filter(r => r.status === "completed").length;
  const inProgressReq = serviceRequests.filter(r => r.status === "in_progress").length;
  const completionRate = Math.round((completedReq / Math.max(totalReq, 1)) * 100);

  const requestsByService = [
    { label: "GST", value: serviceRequests.filter(r => (r.serviceType || "").includes("GST")).length },
    { label: "ITR", value: serviceRequests.filter(r => (r.serviceType || "").includes("ITR")).length },
    { label: "PAN", value: serviceRequests.filter(r => (r.serviceType || "").includes("PAN")).length },
    { label: "Others", value: serviceRequests.filter(r => !(r.serviceType || "").includes("GST") && !(r.serviceType || "").includes("ITR") && !(r.serviceType || "").includes("PAN")).length },
  ];

  const assignees = [...new Set(serviceRequests.map(r => r.assignedToName))].filter(Boolean);
  const requestsByTeam = assignees.length > 0 ? assignees.map(name => ({
    label: (name || "Unassigned").split(" ")[0],
    value: serviceRequests.filter(r => r.assignedToName === name).length
  })) : [{ label: "No Team", value: 0 }];

  // ── Filter service requests (multi-filter) ───────────────────────────────────
  const filteredRequests = applyRequestFilters(
    serviceRequests,
    {
      ...srFilters,
      // treat __unassigned__ pseudo-value: match requests with no assignedToId
      assignedTo: srFilters.assignedTo === "__unassigned__" ? "__unassigned__" : srFilters.assignedTo,
    }
  ).filter(r =>
    srFilters.assignedTo !== "__unassigned__" || !r.assignedToId
  );

  // ── CSS vars ─────────────────────────────────────────────────────────────────
  const theme = darkMode ? {
    bg: "#0f172a", cardBg: "#1e293b", sidebar: "#0f172a",
    border: "#334155", text: "#f1f5f9", muted: "#94a3b8",
    inputBg: "#1e293b", inputBorder: "#475569", tableTh: "#1e3a5f"
  } : {
    bg: "#f1f5f9", cardBg: "#ffffff", sidebar: "#0f172a",
    border: "#e2e8f0", text: "#0f172a", muted: "#64748b",
    inputBg: "#ffffff", inputBorder: "#e2e8f0", tableTh: "#2563eb"
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  if (activeView === "loginPage") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", flexDirection: "column" }}>
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

        {/* Login card */}
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

  // ── Dashboard layout (logged in) ──────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "'Segoe UI', sans-serif" }}>
      <ToastContainer />

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div onClick={() => setMobileSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40, display: "none" }}
          className="mobile-overlay" />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarCollapsed ? "64px" : "240px",
        background: "#0f172a",
        display: "flex", flexDirection: "column",
        flexShrink: 0, transition: "width 0.25s ease",
        position: "fixed", left: 0, top: 0, zIndex: 30,
        borderRight: "1px solid #1e293b",
        height: "100vh"
      }}>
        {/* Brand */}
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

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto", minHeight: 0 }}>
          {!sidebarCollapsed && (
            <p style={{ color: "#475569", fontSize: "10px", fontWeight: 600, letterSpacing: "1px", padding: "4px 8px 8px", textTransform: "uppercase" }}>ADMIN PANEL</p>
          )}
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => navigate(item.id)}
              title={sidebarCollapsed ? item.label : ""}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: sidebarCollapsed ? "10px" : "10px 12px",
                background: activeView === item.id ? "#2563eb" : "transparent",
                border: "none", borderRadius: "8px", cursor: "pointer",
                color: activeView === item.id ? "#fff" : "#94a3b8",
                fontSize: "14px", fontWeight: activeView === item.id ? 600 : 400,
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                transition: "all 0.15s ease",
              }}>
              <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom: Admin info + dark mode + logout */}
        <div style={{ borderTop: "1px solid #1e293b", padding: "12px 8px", marginTop: "auto" }}>

          {/* Dark mode toggle */}
          <button onClick={() => setDarkMode(!darkMode)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: sidebarCollapsed ? "10px" : "10px 12px", background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "14px", borderRadius: "8px", justifyContent: sidebarCollapsed ? "center" : "flex-start", marginBottom: "4px" }}>
            <span style={{ fontSize: "16px" }}>{darkMode ? "☀" : "🌙"}</span>
            {!sidebarCollapsed && <span>{darkMode ? "Light" : "Dark"}</span>}
          </button>

          {/* Logout */}
          <button onClick={logout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: sidebarCollapsed ? "10px" : "10px 12px", background: "transparent", border: "none", cursor: "pointer", color: "#f87171", fontSize: "14px", borderRadius: "8px", justifyContent: sidebarCollapsed ? "center" : "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "16px" }}>↩</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>

          {/* Admin info */}
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

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, marginLeft: sidebarCollapsed ? "64px" : "240px" }}>
        {/* Topbar */}
        <div style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.border}`, padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: theme.muted }}>CA Services Platform</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={logout} style={{ padding: "7px 14px", background: "#ef4444", border: "none", borderRadius: "8px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600 }}>Logout</button>
          </div>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>

          {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
          {activeView === "dashboard" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Admin Dashboard</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>System overview and key metrics</p>
              </div>

              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                {[
                  { label: "Total Requests", value: totalReq, icon: "📋", color: "#2563eb" },
                  { label: "Pending Requests", value: pendingReq, icon: "⏳", color: "#d97706" },
                  { label: "Total Clients", value: users.length, icon: "👥", color: "#7c3aed" },
                  { label: "Completion Rate", value: `${completionRate}%`, icon: "📈", color: "#059669" },
                ].map((s, i) => (
                  <div key={i} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px 24px" }}>
                    <p style={{ color: theme.muted, fontSize: "13px", margin: "0 0 8px", fontWeight: 500 }}>{s.label}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <span style={{ fontSize: "30px", fontWeight: 700, color: s.color }}>{s.value}</span>
                      <span style={{ fontSize: "22px" }}>{s.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: theme.text }}>Requests by Service</h3>
                  <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 16px" }}>Distribution across service types</p>
                  <BarChart data={requestsByService} color="#2563eb" />
                </div>
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: theme.text }}>Workload Distribution</h3>
                  <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 16px" }}>Requests by team member</p>
                  <PieChart data={requestsByTeam} />
                </div>
              </div>


              {/* Recent requests */}
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: theme.text }}>Recent Service Requests</h3>
                <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 16px" }}>Latest requests in the system</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {serviceRequests.slice(0, 5).map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: `1px solid ${theme.border}`, borderRadius: "8px" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: theme.text }}>{r.id}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: theme.muted }}>{(r.serviceType || "").replace(/_/g, " ")} • {r.assignedToName || "Unassigned"}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats bottom */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
                {[
                  { label: "In Progress", value: inProgressReq, color: "#2563eb" },
                  { label: "Completed", value: completedReq, color: "#059669" },
                  { label: "Admins", value: admins.length || "—", color: "#7c3aed" },
                ].map((s, i) => (
                  <div key={i} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px 24px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 600, color: theme.muted }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: "32px", fontWeight: 700, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Team Workload Dashboard ──────────────────────────────────── */}
              <TeamWorkloadTable
                workload={teamWorkload}
                theme={theme}
                dark={darkMode}
              />
            </div>
          )}

          {/* ── SERVICE REQUESTS ───────────────────────────────────────────── */}
          {activeView === "serviceRequests" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Service Requests</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Master view of all service requests</p>
              </div>

              {/* Advanced Filter Bar */}
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

              {/* Table */}
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: theme.tableTh }}>
                        {["Request ID", "Client", "Service", "Assigned To", "Status", "SLA", "Created", "Actions"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((r, i) => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 1 ? (darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: theme.text }}>{r.id}</td>
                          <td style={{ padding: "12px 16px", color: theme.text }}>{r.clientName}</td>
                          <td style={{ padding: "12px 16px", color: theme.text }}>{(r.serviceType || "").replace(/_/g, " ")}</td>
                          <td style={{ padding: "12px 16px", color: theme.text }}>{r.assignedToName || "Unassigned"}</td>
                          <td style={{ padding: "12px 16px" }}><StatusBadge status={r.status} /></td>
                          <td style={{ padding: "12px 16px" }}><SLABadge dueDate={r.dueDate} status={r.status} dark={darkMode} /></td>
                          <td style={{ padding: "12px 16px", color: theme.muted }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <button onClick={() => viewRequestDetails(r)} style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "12px", color: theme.muted }}>👁 View</button>
                            <button onClick={() => { setSelectedRequest(r); setEditForm({ assignedToName: r.assignedToName, assignedToId: r.assignedToId, status: r.status, dueDate: r.dueDate ? new Date(r.dueDate).toISOString().split("T")[0] : "" }); setSrMode("edit"); }} style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "12px", color: theme.muted }}>✏ Edit</button>
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredRequests.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px", color: theme.muted }}>No requests found</div>
                )}
              </div>
            </div>
          )}

          {/* ── REGISTERED USERS (Clients) ─────────────────────────────────── */}
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
                            <button onClick={async () => {
                              if (!confirm("Remove this user? This will revoke their access.")) return;
                              try {
                                const token = localStorage.getItem("adminToken");
                                const res = await fetch("/api/admin/remove-user", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId: u.id }) });
                                const data = await res.json();
                                if (data.success) {
                                  setUsers(prev => prev.filter(x => x.id !== u.id));
                                  showToast("User removed", "success");
                                } else showToast(data.message || "Failed to remove user", "error");
                              } catch (err) { showToast("Error removing user", "error"); }
                            }} style={{ padding: "6px 10px", borderRadius: "6px", border: `1px solid ${theme.border}`, background: "transparent", cursor: "pointer", color: "#ef4444", fontWeight: 600 }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ADMIN DATA ─────────────────────────────────────────────────── */}
          {activeView === "adminData" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Admin Data</h1>
                  <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Manage system administrators</p>
                </div>
                <button onClick={() => navigate("addAdmin")} style={{ padding: "10px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                  + Add Admin
                </button>
              </div>

              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: theme.tableTh }}>
                        {["#", "Name", "Email", "Phone", "Actions"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#fff", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {admins.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: "48px", textAlign: "center", color: theme.muted }}>No admins found</td></tr>
                      ) : admins.map((a, i) => (
                        <tr key={a.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 1 ? (darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent" }}>
                          <td style={{ padding: "12px 16px", color: theme.muted }}>{i + 1}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: theme.text }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "30px", height: "30px", background: "#7c3aed", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>
                                {(a.name || a.email || "?")[0].toUpperCase()}
                              </div>
                              {a.name || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: theme.text }}>{a.email}</td>
                          <td style={{ padding: "12px 16px", color: theme.text }}>{a.phone || a.mobile || "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {currentAdmin && currentAdmin.id === String(a.id) ? (
                              <span style={{ padding: "6px 10px", borderRadius: "6px", background: "#eef2ff", color: "#4338ca", fontWeight: 600 }}>You</span>
                            ) : (
                              <button onClick={async () => {
                                if (!confirm("Remove this admin? This will revoke their access.")) return;
                                try {
                                  const token = localStorage.getItem("adminToken");
                                  const res = await fetch("/api/admin/remove-admin", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ adminId: a.id }) });
                                  const data = await res.json();
                                  if (data.success) {
                                    setAdmins(prev => prev.filter(x => x.id !== a.id));
                                    showToast("Admin removed", "success");
                                  } else showToast(data.message || "Failed to remove admin", "error");
                                } catch (err) { showToast("Error removing admin", "error"); }
                              }} style={{ padding: "6px 10px", borderRadius: "6px", border: `1px solid ${theme.border}`, background: "transparent", cursor: "pointer", color: "#ef4444", fontWeight: 600 }}>Delete</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ADD ADMIN ──────────────────────────────────────────────────── */}
          {activeView === "addAdmin" && (
            <div style={{ maxWidth: "520px" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Add Admin</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Create a new administrator account</p>
              </div>

              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { label: "Full Name", type: "text", val: newAdminName, set: setNewAdminName, placeholder: "Rohan Sharma" },
                    { label: "Email Address", type: "email", val: newAdminEmail, set: setNewAdminEmail, placeholder: "admin@example.com" },
                    { label: "Phone Number", type: "tel", val: newAdminPhone, set: setNewAdminPhone, placeholder: "9876543210" },
                    { label: "Password", type: "password", val: newAdminPassword, set: setNewAdminPassword, placeholder: "••••••••" },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ color: theme.muted, fontSize: "13px", display: "block", marginBottom: "6px", fontWeight: 500 }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={f.val}
                        onChange={e => f.set(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                    <button onClick={addAdmin} style={{ flex: 1, padding: "11px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
                      Save Admin
                    </button>
                    <button onClick={() => navigate("adminData")} style={{ flex: 1, padding: "11px", background: "transparent", color: theme.muted, border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REPORTS ───────────────────────────────────────────────────── */}
          {activeView === "reports" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Reports</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Analytics and insights</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "16px", marginBottom: "24px" }}>
                {[
                  { label: "Total Requests", value: totalReq, color: "#2563eb" },
                  { label: "Completed", value: completedReq, color: "#059669" },
                  { label: "Pending", value: pendingReq, color: "#d97706" },
                  { label: "Completion Rate", value: `${completionRate}%`, color: "#7c3aed" },
                ].map((s, i) => (
                  <div key={i} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px 24px" }}>
                    <p style={{ color: theme.muted, fontSize: "13px", margin: "0 0 8px" }}>{s.label}</p>
                    <p style={{ fontSize: "28px", fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: theme.text }}>Requests by Service</h3>
                  <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 16px" }}>Distribution across service types</p>
                  <BarChart data={requestsByService} color="#2563eb" />
                </div>
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: theme.text }}>Workload Distribution</h3>
                  <p style={{ color: theme.muted, fontSize: "12px", margin: "0 0 16px" }}>Requests by team member</p>
                  <PieChart data={requestsByTeam} />
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIVITY LOG ───────────────────────────────────────────────── */}
          {activeView === "activityLog" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Activity Log</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>System audit trail of all operations</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(() => {
                  const computedActivityLog = [
                    ...documents.map(d => ({
                      id: `doc-${d.id}`,
                      action: "Document Uploaded",
                      description: `${d.fileName} uploaded by ${d.uploaderName || d.uploader} for ${d.clientEmail}`,
                      type: "created",
                      timestamp: d.createdAt ? new Date(d.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: d.createdAt ? new Date(d.createdAt).getTime() : 0,
                      icon: "📁"
                    })),
                    ...users.map(u => ({
                      id: `user-${u.id}`,
                      action: "Client Registered",
                      description: `${u.name} (${u.email}) joined the platform`,
                      type: "created",
                      timestamp: u.createdAt ? new Date(u.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: u.createdAt ? new Date(u.createdAt).getTime() : 0,
                      icon: "👤"
                    })),
                    ...teamMembers.map(m => ({
                      id: `team-${m.id}`,
                      action: "Team Member Added",
                      description: `${m.name} assigned role: ${m.role}`,
                      type: "assigned",
                      timestamp: m.createdAt ? new Date(m.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: m.createdAt ? new Date(m.createdAt).getTime() : 0,
                      icon: "👷"
                    }))
                  ].sort((a, b) => b.timeMs - a.timeMs).slice(0, 50);

                  return computedActivityLog.length === 0 ? (
                    <p style={{ color: theme.muted, fontSize: "14px", padding: "20px" }}>No recent activity found.</p>
                  ) : computedActivityLog.map(activity => {
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

          {/* ── SETTINGS ───────────────────────────────────────────────────── */}
          {activeView === "settings" && (
            <div style={{ maxWidth: "600px" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Settings</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Configure system-wide settings</p>
              </div>

              {/* System Config */}
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

              {/* Dark Mode */}
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

          {/* ── TEAM MEMBERS ────────────────────────────────────────────── */}
          {activeView === "teamMembers" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Team Members</h1>
                  <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Manage your CA firm team</p>
                </div>
                <button onClick={() => navigate("addTeamMember")} style={{ padding: "10px 18px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                  + Add Member
                </button>
              </div>
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
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
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => openAllocateModal(m)}
                                style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #0ea5e9", background: "transparent", cursor: "pointer", color: "#0ea5e9", fontWeight: 600, fontSize: "12px" }}>
                                👥 Allocate
                              </button>
                              <button onClick={async () => {
                                if (!confirm("Remove this team member?")) return;
                                try {
                                  const res = await fetch("/api/team/remove-member", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: m.id }) });
                                  const data = await res.json();
                                  if (data.success) { setTeamMembers(prev => prev.filter(x => x.id !== m.id)); showToast("Member removed", "success"); }
                                  else showToast(data.message || "Failed", "error");
                                } catch { showToast("Error", "error"); }
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

          {/* ── ADD TEAM MEMBER ─────────────────────────────────────────── */}
          {activeView === "addTeamMember" && (
            <div style={{ maxWidth: "520px" }}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Add Team Member</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Create a new team member account</p>
              </div>
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { label: "Full Name *", type: "text", val: newMemberName, set: setNewMemberName, placeholder: "Rohan Sharma" },
                    { label: "Email *", type: "email", val: newMemberEmail, set: setNewMemberEmail, placeholder: "rohan@totaltaxhub.com" },
                    { label: "Phone", type: "tel", val: newMemberPhone, set: setNewMemberPhone, placeholder: "9876543210" },
                    { label: "Password *", type: "password", val: newMemberPassword, set: setNewMemberPassword, placeholder: "••••••••" },
                    { label: "Role", type: "text", val: newMemberRole, set: setNewMemberRole, placeholder: "Senior CA, Junior CA, Accountant..." },
                    { label: "Services (comma-separated)", type: "text", val: newMemberServices, set: setNewMemberServices, placeholder: "ITR, GST_FILING, BOOKKEEPING" },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ color: theme.muted, fontSize: "13px", display: "block", marginBottom: "6px", fontWeight: 500 }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={f.val}
                        onChange={e => f.set(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                    <button onClick={addTeamMember} style={{ flex: 1, padding: "11px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
                      Save Member
                    </button>
                    <button onClick={() => navigate("teamMembers")} style={{ flex: 1, padding: "11px", background: "transparent", color: theme.muted, border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── DOCUMENTS (Admin Upload) ─────────────────────────────── */}
          {activeView === "documents" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Documents</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Upload documents for clients and manage all shared files</p>
              </div>

              {/* Upload Form */}
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

              {/* Documents List */}
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: theme.text }}>All Uploaded Documents ({documents.length})</h3>
                  <div style={{ display: "flex", gap: "8px", flex: 1, justifyContent: "flex-end", minWidth: "250px" }}>
                    <input
                      placeholder="Search filename, title, or client..."
                      value={docSearch}
                      onChange={e => setDocSearch(e.target.value)}
                      style={{ padding: "7px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "100%", maxWidth: "300px" }}
                    />
                    <button style={{ padding: "7px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Search</button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: theme.tableTh }}>
                        {["File Name", "Title", "Client", "Uploaded By", "Date", "Actions"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#fff", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredDocs = documents.filter(doc => {
                          const s = docSearch.toLowerCase();
                          return !docSearch ||
                            (doc.fileName || "").toLowerCase().includes(s) ||
                            (doc.title || "").toLowerCase().includes(s) ||
                            (doc.clientEmail || "").toLowerCase().includes(s) ||
                            (doc.uploaderName || "").toLowerCase().includes(s);
                        });

                        return filteredDocs.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: theme.muted }}>{docSearch ? "No matching documents found." : "No documents uploaded yet."}</td></tr>
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
                              <button onClick={() => downloadDocument(doc.id, doc.fileName)}
                                style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>
                                ⬇ Download
                              </button>
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
            />
          )}

        </main>
      </div>

      {/* ── Edit Request Modal ───────────────────────────────────────── */}
      {srMode === "edit" && selectedRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
          <div style={{ width: "min(500px, 95%)", background: theme.cardBg, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: theme.text }}>✏ Edit Request</h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: theme.muted }}>{selectedRequest.id}</p>
              </div>
              <button onClick={closeSrModal} style={{ background: "transparent", border: "none", color: theme.muted, fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {/* Form Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

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
    </div>
  );
}
