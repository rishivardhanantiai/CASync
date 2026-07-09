"use client";

import { useEffect, useState } from "react";
import { showToast, ToastContainer } from "@/components/Toast";
import RequestDetailView from "@/components/RequestDetailView";
import SLABadge from "@/components/SLABadge";

// ─── Initial Data ────────────────────────────────────────────────────────────

const STATUS_MAP = {
  in_progress:    { label: "In Progress",    bg: "#dbeafe", color: "#1d4ed8" },
  submitted:      { label: "Submitted",      bg: "#fef9c3", color: "#a16207" },
  pending_review: { label: "Pending Review", bg: "#fef08a", color: "#854d0e" }, 
  completed:      { label: "Completed",      bg: "#dcfce7", color: "#15803d" },
  pending_docs:   { label: "Pending Docs",   bg: "#fee2e2", color: "#b91c1c" },
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
  { id: "clients", label: "My Assigned Clients", icon: "👥" },
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

  // Hover state for Dashboard Cards
  const [hoveredCard, setHoveredCard] = useState(null);

  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Filters
  const [myReqSearch, setMyReqSearch] = useState("");
  const [myReqStatus, setMyReqStatus] = useState("all");
  const [myReqService, setMyReqService] = useState("all");
  const [myReqStartDate, setMyReqStartDate] = useState("");
  const [myReqEndDate, setMyReqEndDate] = useState("");

  const [allReqSearch, setAllReqSearch] = useState("");
  const [allReqStatus, setAllReqStatus] = useState("all");
  const [allReqService, setAllReqService] = useState("all");
  const [allReqAssignee, setAllReqAssignee] = useState("all");
  const [allReqStartDate, setAllReqStartDate] = useState("");
  const [allReqEndDate, setAllReqEndDate] = useState("");

  // Column searches for My Requests
  const [myColSrId, setMyColSrId] = useState("");
  const [myColClient, setMyColClient] = useState("");
  const [myColService, setMyColService] = useState("");
  const [myColPriority, setMyColPriority] = useState("");
  const [myColStatus, setMyColStatus] = useState("");
  const [myColDate, setMyColDate] = useState("");
  const [myColIdentifier, setMyColIdentifier] = useState("");
  const [myColFY, setMyColFY] = useState("");
  const [myColMonth, setMyColMonth] = useState("");
  const [myColPayment, setMyColPayment] = useState("");
  const [myColDueDate, setMyColDueDate] = useState("");

  // Column searches for All Requests
  const [allColSrId, setAllColSrId] = useState("");
  const [allColClient, setAllColClient] = useState("");
  const [allColService, setAllColService] = useState("");
  const [allColAssigned, setAllColAssigned] = useState("");
  const [allColPriority, setAllColPriority] = useState("");
  const [allColStatus, setAllColStatus] = useState("");
  const [allColDate, setAllColDate] = useState("");
  const [allColFY, setAllColFY] = useState("");
  const [allColPayment, setAllColPayment] = useState("");
  const [allColDueDate, setAllColDueDate] = useState("");

  // Activity filters
  const [activitySearch, setActivitySearch] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [activityStartDate, setActivityStartDate] = useState("");
  const [activityEndDate, setActivityEndDate] = useState("");

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [docStartDate, setDocStartDate] = useState("");
  const [docEndDate, setDocEndDate] = useState("");
  const [docSortFilter, setDocSortFilter] = useState("newest");
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

  useEffect(() => {
    if (activeView === "loginPage" || !currentMember) return;
    const isPublic = ["dashboard", "myRequests", "documents", "clients", "activityLog", "profile", "settings", "request-detail"].
includes(activeView);
    if (!isPublic) {
      if (activeView === "allRequests") {
        if (!currentMember.services || !currentMember.services.includes("permission_allRequests")) {
          setActiveView("dashboard");
        }
      } else {
        setActiveView("dashboard");
      }
    }
  }, [activeView, currentMember]);

  async function loadTeamDashboardData(memberId) {
    try {
      const res = await fetch(`/api/team/dashboard-data?memberId=${memberId}`);
      const data = await res.json();
      if (data.success) {
        setMyRequests(data.myRequests);
        setAllRequests(data.allRequests);
        if (data.member) {
          setCurrentMember(data.member);
          localStorage.setItem("currentTeamMember", JSON.stringify(data.member));
        }
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

  async function saveProfileChanges() {
    if (!profileName) {
      showToast("Name is required", "warning");
      return;
    }
    try {
      const res = await fetch("/api/team/update-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentMember.id,
          name: profileName,
          phone: profilePhone
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("currentTeamMember", JSON.stringify(data.member));
        setCurrentMember(data.member);
        setEditingProfile(false);
        showToast("Profile updated successfully!", "success");
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch {
      showToast("Error updating profile", "error");
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill all password fields", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long", "warning");
      return;
    }
    try {
      const res = await fetch("/api/team/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentMember.id,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Password updated successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.message || "Failed to update password", "error");
      }
    } catch {
      showToast("Error updating password", "error");
    }
  }

  function closeSrModal() {
    setSelectedRequest(null);
    setSrMode(null);
    setDetailsData(null);
    if (activeView === "request-detail") setActiveView("myRequests");
  }

  async function updateRequestStatus(id, newStatus, customNotes = null) {
    let adminNotes = customNotes;
    
    if (newStatus === "pending_docs" && !customNotes) {
      const reason = prompt("Please enter the reason for return / missing documents:");
      if (reason === null) return; // Cancelled
      
      // Preserve existing tasks if returning to client
      const req = myRequests.find(r => r.id === id);
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
        body: JSON.stringify({ id, status: newStatus, adminNotes })
      });
      const data = await res.json();
      if (data.success) {
        setMyRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, adminNotes: adminNotes || r.adminNotes } : r));
        setAllRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, adminNotes: adminNotes || r.adminNotes } : r));
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
          actorId: currentMember?.id || "",
          actorEmail: currentMember?.email || null,
          actorName: currentMember?.name || "Team Member",
          actorRole: "team",
        })
      });
      const data = await res.json();
      if (data.success) {
        setMyRequests(prev => prev.map(r => r.id === id ? { ...r, id: newId } : r));
        setAllRequests(prev => prev.map(r => r.id === id ? { ...r, id: newId } : r));
        setSelectedRequest(prev => prev?.id === id ? { ...prev, id: newId } : prev);
        showToast("Request ID updated successfully", "success");
        loadTeamDashboardData(currentMember.id);
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
    // Reset modal and editing states to prevent scroll lock leaks
    setSrMode(null);
    setSelectedRequest(null);
    setEditingProfile(false);
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("teamDarkMode", String(next));
  }

  // ── Computed data & Advanced Filters ──────────────────────────────────────────
  const memberName = currentMember?.name || "Team Member";
  const memberServices = currentMember?.services || [];
  const memberInitials = memberName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const activeMyRequests = myRequests.filter(r => !r.isDummy && !(r.status === "completed" && r.paymentStatus === "paid"));
  const myCompleted = activeMyRequests.filter(r => r.status === "completed").length;
  const myPending = activeMyRequests.filter(r => r.status !== "completed").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const myDueToday = activeMyRequests.filter(r => r.dueDate && r.dueDate.split("T")[0] === todayStr).length;
  const workloadPct = Math.min(Math.round((activeMyRequests.length / 10) * 100), 100);

  function matchesDueRange(request, startDate, endDate) {
    if (!startDate && !endDate) return true;
    if (!request.dueDate) return false;
    const dueStr = new Date(request.dueDate).toISOString().split("T")[0];
    if (startDate && dueStr < startDate) return false;
    if (endDate && dueStr > endDate) return false;
    return true;
  }

  const filteredMyReqs = myRequests
    .filter(r => myReqStatus === "all" || r.status === myReqStatus)
    .filter(r => myReqService === "all" || (r.serviceType || "").includes(myReqService))
    .filter(r => matchesDueRange(r, myReqStartDate, myReqEndDate))
    .filter(r => {
      // Filter out completed + paid items
      if (r.status === "completed" && r.paymentStatus === "paid") return false;

      // Filter out isDummy = true items from default assigned requests
      if (r.isDummy) return false;

      const s = myReqSearch.toLowerCase();
      if (myReqSearch && !(r.id.toLowerCase().includes(s) || (r.clientName || "").toLowerCase().includes(s) || (r.serviceType || "").toLowerCase().includes(s))) return false;

      if (myColSrId && !r.id.toLowerCase().includes(myColSrId.toLowerCase())) return false;
      if (myColClient) {
        const q = myColClient.toLowerCase();
        const matchName = (r.clientName || "").toLowerCase().includes(q);
        const idStr = (r.panNumber || r.gstNumber || r.cinNumber || r.udhyamNumber || "").toLowerCase();
        const matchId = idStr.includes(q);
        if (!matchName && !matchId) return false;
      }
      const serviceName = (r.serviceType || "").replace(/_/g, " ");
      if (myColService && !serviceName.toLowerCase().includes(myColService.toLowerCase())) return false;
      if (myColPriority && !(r.priority || "").toLowerCase().includes(myColPriority.toLowerCase())) return false;
      if (myColStatus && !(r.status || "").toLowerCase().includes(myColStatus.toLowerCase())) return false;
      if (myColFY && !(r.financialYear || "").toLowerCase().includes(myColFY.toLowerCase())) return false;
      if (myColMonth && !(r.financialMonth || "").toLowerCase().includes(myColMonth.toLowerCase())) return false;
      
      const reqDateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "";
      if (myColDate && !reqDateStr.includes(myColDate)) return false;

      const dueStr = r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "";
      if (myColDueDate && !dueStr.includes(myColDueDate)) return false;

      if (myColPayment && !(r.paymentStatus || "").toLowerCase().includes(myColPayment.toLowerCase())) return false;

      return true;
    });

  const filteredAllReqs = allRequests
    .filter(r => allReqStatus === "all" || r.status === allReqStatus)
    .filter(r => allReqService === "all" || (r.serviceType || "").includes(allReqService))
    .filter(r => allReqAssignee === "all" || r.assignedToName === allReqAssignee || (allReqAssignee === "Unassigned" && !r.assignedToName))
    .filter(r => matchesDueRange(r, allReqStartDate, allReqEndDate))
    .filter(r => {
      // Filter out completed + paid items
      if (r.status === "completed" && r.paymentStatus === "paid") return false;

      // Filter out isDummy = true items from default assigned requests
      if (r.isDummy) return false;

      const s = allReqSearch.toLowerCase();
      if (allReqSearch && !(r.id.toLowerCase().includes(s) || (r.clientName || "").toLowerCase().includes(s) || (r.serviceType || "").toLowerCase().includes(s))) return false;

      if (allColSrId && !r.id.toLowerCase().includes(allColSrId.toLowerCase())) return false;
      if (allColClient) {
        const q = allColClient.toLowerCase();
        const matchName = (r.clientName || "").toLowerCase().includes(q);
        const idStr = (r.panNumber || r.gstNumber || r.cinNumber || r.udhyamNumber || "").toLowerCase();
        const matchId = idStr.includes(q);
        if (!matchName && !matchId) return false;
      }
      
      const serviceName = (r.serviceType || "").replace(/_/g, " ");
      if (allColService && !serviceName.toLowerCase().includes(allColService.toLowerCase())) return false;
      if (allColAssigned && !(r.assignedToName || "unassigned").toLowerCase().includes(allColAssigned.toLowerCase())) return false;
      if (allColPriority && !(r.priority || "").toLowerCase().includes(allColPriority.toLowerCase())) return false;
      if (allColStatus && !(r.status || "").toLowerCase().includes(allColStatus.toLowerCase())) return false;
      if (allColFY && !(r.financialYear || "").toLowerCase().includes(allColFY.toLowerCase())) return false;

      const reqDateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "";
      if (allColDate && !reqDateStr.includes(allColDate)) return false;

      const dueStr = r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "";
      if (allColDueDate && !dueStr.includes(allColDueDate)) return false;

      if (allColPayment && !(r.paymentStatus || "").toLowerCase().includes(allColPayment.toLowerCase())) return false;

      return true;
    });

  const uniqueAssignees = [...new Set(allRequests.map(r => r.assignedToName).filter(Boolean))];

  const filteredDocs = myDocuments
    .filter(d => !docSearch || (d.fileName || "").toLowerCase().includes(docSearch.toLowerCase()) || (d.clientEmail || "").toLowerCase().includes(docSearch.toLowerCase()))
    .filter(d => {
      if (!docStartDate && !docEndDate) return true;
      if (!d.createdAt) return false;
      const createdStr = new Date(d.createdAt).toISOString().split("T")[0];
      if (docStartDate && createdStr < docStartDate) return false;
      if (docEndDate && createdStr > docEndDate) return false;
      return true;
    });
  const filteredClients = myClients.filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.email.toLowerCase().includes(clientSearch.toLowerCase()));

  // Dashboard Stats Config with attached items for Dropdown
  const statCardsData = [
    { 
      id: "assigned", 
      label: "Assigned Requests", 
      value: myRequests.length, 
      icon: "📋", 
      color: "#0ea5e9", 
      items: myRequests,
      onClick: () => { setActiveView("myRequests"); setMyReqStatus("all"); setMyReqStartDate(""); setMyReqEndDate(""); } 
    },
    { 
      id: "dueToday", 
      label: "Due Today", 
      value: myDueToday, 
      icon: "🕐", 
      color: "#f59e0b", 
      items: myRequests.filter(r => r.dueDate && r.dueDate.split("T")[0] === todayStr),
      onClick: () => { 
        setActiveView("myRequests"); 
        const todayStrLocal = new Date().toISOString().split("T")[0];
        setMyReqStartDate(todayStrLocal); 
        setMyReqEndDate(todayStrLocal); 
        setMyReqStatus("all"); 
      } 
    },
    { 
      id: "pendingDocs", 
      label: "Pending Docs", 
      value: myRequests.filter(r => r.status === "pending_docs").length, 
      icon: "📁", 
      color: "#8b5cf6", 
      items: myRequests.filter(r => r.status === "pending_docs"),
      onClick: () => { setActiveView("myRequests"); setMyReqStatus("pending_docs"); setMyReqStartDate(""); setMyReqEndDate(""); } 
    },
    { 
      id: "completed", 
      label: "Completed This Month", 
      value: myCompleted, 
      icon: "✅", 
      color: "#10b981", 
      items: myRequests.filter(r => r.status === "completed"),
      onClick: () => { setActiveView("myRequests"); setMyReqStatus("completed"); setMyReqStartDate(""); setMyReqEndDate(""); } 
    },
  ];

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
  function FilterBar({ search, setSearch, status, setStatus, service, setService, assignee, setAssignee, startDate, setStartDate, endDate, setEndDate, allAssignees = [], placeholder }) {
    return (
      <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder={placeholder || "Search..."} value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }} />
        
        {/* Advanced Filter: Service Type */}
        {setService && (
          <select value={service} onChange={e => setService(e.target.value)}
            style={{ padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }}>
            <option value="all">All Services</option>
            <option value="GST">GST</option>
            <option value="ITR">ITR</option>
            <option value="PAN">PAN</option>
          </select>
        )}

        {/* Advanced Filter: Assignee (Only for All Requests) */}
        {setAssignee && (
          <select value={assignee} onChange={e => setAssignee(e.target.value)}
            style={{ padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none" }}>
            <option value="all">All Assignees</option>
            <option value="Unassigned">Unassigned</option>
            {allAssignees.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        )}

        {/* Advanced Filter: Status */}
        {setStatus && (
          <select value={status} onChange={e => setStatus(e.target.value)}
            style={{ padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", cursor: "pointer" }}>
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_review">Pending Review</option>
            <option value="pending_docs">Pending Docs</option>
            <option value="completed">Completed</option>
          </select>
        )}

        {/* Advanced Filter: Due Date Range */}
        {setStartDate && setEndDate && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: theme.muted }}>Due:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="premium-input" style={{ padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "auto" }} />
            <span style={{ fontSize: "12px", color: theme.muted }}>to</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="premium-input" style={{ padding: "9px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "auto" }} />
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(""); setEndDate(""); }}
                style={{ padding: "9px 12px", background: "transparent", border: "none", color: "#ef4444", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>✕ Clear</button>
            )}
          </div>
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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: theme.bg, color: theme.text, fontFamily: "'Segoe UI', sans-serif" }}>
      <ToastContainer />
      <style>{`
        .premium-input {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-input:hover {
          border-color: #2563eb !important;
        }
        .premium-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
        }
        .premium-btn {
          transition: all 0.2s ease;
        }
        .premium-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .premium-btn:active {
          transform: translateY(0);
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
      `}</style>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarCollapsed ? "64px" : "240px",
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
              <div style={{ width: "32px", height: "32px", background: "#2563eb", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: "14px", flexShrink: 0 }}>CA</div>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px", whiteSpace: "nowrap" }}>CASync Team</span>
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

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto", minHeight: 0 }}>
          {!sidebarCollapsed && (
            <p style={{ color: "#475569", fontSize: "10px", fontWeight: 600, letterSpacing: "1px", padding: "4px 8px 8px", textTransform: "uppercase" }}>TEAM PANEL</p>
          )}
          {NAV_ITEMS.filter(item => {
            if (["dashboard", "myRequests", "documents", "clients", "activityLog", "profile", "settings"].includes(item.id)) return true;
            if (item.id === "allRequests") {
              return currentMember?.services?.includes("permission_allRequests");
            }
            return false;
          }).map(item => (
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

        {/* Bottom */}
        <div style={{ borderTop: "1px solid #1e293b", padding: "12px 8px", marginTop: "auto" }}>
          <button onClick={logout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: sidebarCollapsed ? "10px" : "10px 12px", background: "transparent", border: "none", cursor: "pointer", color: "#f87171", fontSize: "14px", borderRadius: "8px", justifyContent: sidebarCollapsed ? "center" : "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "16px" }}>↩</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#1e293b", borderRadius: "8px" }}>
              <div style={{ width: "32px", height: "32px", background: "#2563eb", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>{memberInitials}</div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{memberName}</p>
                <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>Team</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, marginLeft: sidebarCollapsed ? "64px" : "240px", transition: "margin-left 0.25s ease" }}>
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

              {/* Stat cards WITH HOVER DROPDOWN */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                {statCardsData.map((s, i) => (
                  <div key={i} 
                       onClick={s.onClick} 
                       onMouseEnter={(e) => { 
                         e.currentTarget.style.transform = "translateY(-2px)"; 
                         e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)"; 
                         setHoveredCard(s.id); 
                       }}
                       onMouseLeave={(e) => { 
                         e.currentTarget.style.transform = "translateY(0)"; 
                         e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; 
                         setHoveredCard(null); 
                       }}
                       style={{ position: "relative", background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px 24px", cursor: "pointer", transition: "all 0.15s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  >
                    <p style={{ color: theme.muted, fontSize: "13px", margin: "0 0 8px", fontWeight: 500 }}>{s.label}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <span style={{ fontSize: "30px", fontWeight: 700, color: s.color }}>{s.value}</span>
                      <span style={{ fontSize: "20px" }}>{s.icon}</span>
                    </div>

                    {/* DROPDOWN MENU */}
                    {hoveredCard === s.id && s.items && s.items.length > 0 && (
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
                      onClick={(e) => e.stopPropagation()} // prevents the outer onClick from firing
                      >
                        {s.items.slice(0, 5).map(item => (
                          <div key={item.id}
                               onClick={(e) => { e.stopPropagation(); viewRequestDetails(item); }}
                               style={{ padding: "8px", borderBottom: `1px solid ${theme.border}`, cursor: "pointer", fontSize: "12px" }}
                               onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"}
                               onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <strong style={{ color: theme.text }}>{item.id}</strong>
                              <StatusBadge status={item.status} />
                            </div>
                            <div style={{ color: theme.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.clientName || item.userEmail} • {(item.serviceType || "").replace(/_/g, " ")}
                            </div>
                          </div>
                        ))}
                        {s.items.length > 5 && (
                          <div style={{ padding: "8px", textAlign: "center", color: theme.muted, fontSize: "11px", fontStyle: "italic", cursor: "pointer" }}
                               onClick={(e) => { e.stopPropagation(); s.onClick(); }}>
                            View all {s.items.length} requests →
                          </div>
                        )}
                      </div>
                    )}
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
                      <div key={r.id} onClick={() => viewRequestDetails(r)}
                           style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", transition: "background 0.15s ease" }}
                           onMouseEnter={(e) => { e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"; }}
                           onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
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

              {/* Recent Service Requests widget */}
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
                  {allRequests.slice(0, 3).map(r => (
                    <div key={r.id} onClick={() => viewRequestDetails(r)}
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
                  {allRequests.length === 0 && <p style={{ color: theme.muted, fontSize: "14px", textAlign: "center", padding: "12px 0" }}>No requests in the system yet.</p>}
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
              <FilterBar search={myReqSearch} setSearch={setMyReqSearch} status={myReqStatus} setStatus={setMyReqStatus} service={myReqService} setService={setMyReqService} startDate={myReqStartDate} setStartDate={setMyReqStartDate} endDate={myReqEndDate} setEndDate={setMyReqEndDate} placeholder="Search by ID or client..." />

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
                    <input type="text" placeholder="ID" value={myColSrId} onChange={e => setMyColSrId(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px" }}>
                    <input type="text" placeholder="Client" value={myColClient} onChange={e => setMyColClient(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px", display: "flex", gap: "4px" }}>
                    <input type="text" placeholder="Service" value={myColService} onChange={e => setMyColService(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                    <input type="text" placeholder="FY" value={myColFY} onChange={e => setMyColFY(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "45px", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px" }}>
                    {/* Assigned search - since they are viewing their assigned requests, maker is current member. They can search checker name here */}
                    <input type="text" placeholder="Checker" value={myColIdentifier} onChange={e => setMyColIdentifier(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px", display: "flex", gap: "4px" }}>
                    <input type="text" placeholder="Status" value={myColStatus} onChange={e => setMyColStatus(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                    <input type="text" placeholder="Pay" value={myColPayment} onChange={e => setMyColPayment(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "45px", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px" }}>
                    <input type="text" placeholder="Priority" value={myColPriority} onChange={e => setMyColPriority(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px", display: "flex", gap: "4px" }}>
                    <input type="text" placeholder="Date" value={myColDate} onChange={e => setMyColDate(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                    <input type="text" placeholder="Due" value={myColDueDate} onChange={e => setMyColDueDate(e.target.value)}
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
                {filteredMyReqs.length === 0 ? (
                  <div style={{ padding: "56px", textAlign: "center", color: theme.muted }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>No assigned requests found</p>
                    <p style={{ margin: "6px 0 0", fontSize: "13px" }}>Try adjusting your filters or check back later</p>
                  </div>
                ) : (
                  filteredMyReqs.map((r, idx) => {
                    const statusMap = { submitted: { label: "Submitted", bg: "#fef9c3", color: "#a16207" }, in_progress: { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8" }, completed: { label: "Completed", bg: "#dcfce7", color: "#15803d" }, pending_docs: { label: "Pending Docs", bg: "#fee2e2", color: "#b91c1c" }, pending_review: { label: "Pending Review", bg: "#fef08a", color: "#854d0e" } };
                    const st = statusMap[r.status] || { label: r.status, bg: "#f1f5f9", color: "#475569" };
                    const prColor = r.priority === "high" ? "#ef4444" : r.priority === "low" ? "#10b981" : "#f59e0b";
                    const prBg = r.priority === "high" ? "#fee2e2" : r.priority === "low" ? "#dcfce7" : "#fef9c3";
                    return (
                      <div key={r.id} onClick={() => viewRequestDetails(r)}
                        onMouseEnter={e => { e.currentTarget.style.background = darkMode ? "rgba(37,99,235,0.08)" : "#eff6ff"; e.currentTarget.style.borderLeftColor = "#2563eb"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = "transparent"; }}
                        style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 2fr 1.3fr 1.4fr 1fr 1.6fr", gap: "0", padding: "13px 20px", borderBottom: idx < filteredMyReqs.length - 1 ? `1px solid ${theme.border}` : "none", cursor: "pointer", transition: "background 0.15s ease", alignItems: "center", borderLeft: "3px solid transparent" }}>
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
                        <div style={{ padding: "0 8px", display: "flex", gap: "5px", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                          <button onClick={e => { e.stopPropagation(); viewRequestDetails(r); }} style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "12px", color: theme.muted, fontWeight: 600, whiteSpace: "nowrap" }}>👁 View</button>
                          {r.status === "submitted" && (
                            <button onClick={e => { e.stopPropagation(); updateRequestStatus(r.id, "in_progress"); }} style={{ padding: "5px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Start</button>
                          )}
                          {r.status === "in_progress" && (
                            <>
                              <button onClick={e => { e.stopPropagation(); updateRequestStatus(r.id, "completed"); }} style={{ padding: "5px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Done</button>
                              <button onClick={e => { e.stopPropagation(); updateRequestStatus(r.id, "pending_docs"); }} style={{ padding: "5px 10px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Return</button>
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

          {/* ── ALL REQUESTS ──────────────────────────────────────────── */}
          {activeView === "allRequests" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>All Requests</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Read-only view of all service requests</p>
              </div>
              <FilterBar
                search={allReqSearch} setSearch={setAllReqSearch}
                status={allReqStatus} setStatus={setAllReqStatus}
                service={allReqService} setService={setAllReqService}
                assignee={allReqAssignee} setAssignee={setAllReqAssignee}
                startDate={allReqStartDate} setStartDate={setAllReqStartDate}
                endDate={allReqEndDate} setEndDate={setAllReqEndDate}
                allAssignees={uniqueAssignees}
                placeholder="Search by ID, client..."
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
                    <input type="text" placeholder="ID" value={allColSrId} onChange={e => setAllColSrId(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px" }}>
                    <input type="text" placeholder="Client" value={allColClient} onChange={e => setAllColClient(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px", display: "flex", gap: "4px" }}>
                    <input type="text" placeholder="Service" value={allColService} onChange={e => setAllColService(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                    <input type="text" placeholder="FY" value={allColFY} onChange={e => setAllColFY(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "45px", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px" }}>
                    <input type="text" placeholder="Assigned" value={allColAssigned} onChange={e => setAllColAssigned(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px", display: "flex", gap: "4px" }}>
                    <input type="text" placeholder="Status" value={allColStatus} onChange={e => setAllColStatus(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                    <input type="text" placeholder="Pay" value={allColPayment} onChange={e => setAllColPayment(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "45px", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px" }}>
                    <input type="text" placeholder="Priority" value={allColPriority} onChange={e => setAllColPriority(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0 8px", display: "flex", gap: "4px" }}>
                    <input type="text" placeholder="Date" value={allColDate} onChange={e => setAllColDate(e.target.value)}
                      style={{ padding: "6px 8px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", background: theme.inputBg, color: theme.text, outline: "none", flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                    <input type="text" placeholder="Due" value={allColDueDate} onChange={e => setAllColDueDate(e.target.value)}
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
                {filteredAllReqs.length === 0 ? (
                  <div style={{ padding: "56px", textAlign: "center", color: theme.muted }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>📂</div>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>No requests found</p>
                  </div>
                ) : (
                  filteredAllReqs.map((r, idx) => {
                    const statusMap = { submitted: { label: "Submitted", bg: "#fef9c3", color: "#a16207" }, in_progress: { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8" }, completed: { label: "Completed", bg: "#dcfce7", color: "#15803d" }, pending_docs: { label: "Pending Docs", bg: "#fee2e2", color: "#b91c1c" }, pending_review: { label: "Pending Review", bg: "#fef08a", color: "#854d0e" } };
                    const st = statusMap[r.status] || { label: r.status, bg: "#f1f5f9", color: "#475569" };
                    const prColor = r.priority === "high" ? "#ef4444" : r.priority === "low" ? "#10b981" : "#f59e0b";
                    const prBg = r.priority === "high" ? "#fee2e2" : r.priority === "low" ? "#dcfce7" : "#fef9c3";
                    return (
                      <div key={r.id} onClick={() => viewRequestDetails(r)}
                        onMouseEnter={e => { e.currentTarget.style.background = darkMode ? "rgba(37,99,235,0.08)" : "#eff6ff"; e.currentTarget.style.borderLeftColor = "#2563eb"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = "transparent"; }}
                        style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 2fr 1.3fr 1.4fr 1fr 1.6fr", gap: "0", padding: "13px 20px", borderBottom: idx < filteredAllReqs.length - 1 ? `1px solid ${theme.border}` : "none", cursor: "pointer", transition: "background 0.15s ease", alignItems: "center", borderLeft: "3px solid transparent" }}>
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
                        <div style={{ padding: "0 8px", display: "flex", gap: "5px", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                          <button onClick={e => { e.stopPropagation(); viewRequestDetails(r); }} style={{ padding: "5px 10px", border: `1px solid ${theme.border}`, borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "12px", color: theme.muted, fontWeight: 600, whiteSpace: "nowrap" }}>👁 View</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: theme.muted }}>From:</span>
                      <input type="date" value={docStartDate} onChange={e => setDocStartDate(e.target.value)}
                        className="premium-input" style={{ padding: "8px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "auto" }} />
                      <span style={{ fontSize: "12px", color: theme.muted }}>To:</span>
                      <input type="date" value={docEndDate} onChange={e => setDocEndDate(e.target.value)}
                        className="premium-input" style={{ padding: "8px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", width: "auto" }} />
                      {(docStartDate || docEndDate) && (
                        <button onClick={() => { setDocStartDate(""); setDocEndDate(""); }}
                          style={{ padding: "8px 12px", background: "transparent", border: "none", color: "#ef4444", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>✕ Clear</button>
                      )}
                    </div>
                    <select
                      value={docSortFilter}
                      onChange={e => setDocSortFilter(e.target.value)}
                      className="premium-input"
                      style={{ padding: "8px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "13px", outline: "none", cursor: "pointer" }}
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
                        ).sort((a, b) => {
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
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>My Assigned Clients</h1>
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
              
              {/* Advanced Activity Log Filters */}
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
                  placeholder="Search activity log..." 
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
                  <option value="client">Client Allocations</option>
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
                    ...myDocuments.map(d => ({
                      id: `doc-${d.id}`,
                      action: "Document Uploaded",
                      description: `${d.fileName} uploaded by ${d.uploader === "client" ? "Client" : (d.uploader === "admin" ? "Admin" : (String(d.uploaderId) === String(currentMember?.id) ? "You" : (d.uploaderName || "Team")))} for ${d.clientEmail}`,
                      rawType: "document",
                      time: d.createdAt ? new Date(d.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: d.createdAt ? new Date(d.createdAt).getTime() : 0,
                      icon: "📁"
                    })),
                    ...myClients.map(c => ({
                      id: `cli-${c.id}`,
                      action: "Client Allocated",
                      description: `Client allocated to you: ${c.name} (${c.email})`,
                      rawType: "client",
                      time: c.createdAt ? new Date(c.createdAt).toLocaleString("en-IN") : "Recently",
                      timeMs: c.createdAt ? new Date(c.createdAt).getTime() : 0,
                      icon: "👥"
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
                  ) : sortedActivities.map(a => (
                    <div key={a.id} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "36px", height: "36px", background: "#e0f2fe", color: "#0369a1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: theme.text }}>{a.description}</p>
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
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 4px", color: theme.text }}>My Profile</h1>
                <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>Manage your account information and password</p>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start" }}>
                {/* Card 1: Personal Information */}
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "18px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: theme.text }}>Personal Information</h3>
                    <button onClick={() => setEditingProfile(!editingProfile)}
                      style={{ padding: "6px 12px", background: "transparent", color: editingProfile ? "#ef4444" : theme.muted, border: `1px solid ${editingProfile ? "#ef4444" : theme.border}`, borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                      {editingProfile ? "✕ Cancel" : "✏ Edit"}
                    </button>
                  </div>
                  
                  <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Full Name</label>
                      {editingProfile
                        ? <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)}
                          style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
                        : <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: theme.text }}>{profileName || "—"}</p>
                      }
                    </div>

                    <div>
                      <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Email</label>
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: theme.muted }}>{currentMember?.email || "—"}</p>
                    </div>

                    <div>
                      <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Phone</label>
                      {editingProfile
                        ? <input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)}
                          style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
                        : <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: theme.text }}>{profilePhone || "—"}</p>
                      }
                    </div>

                    <div>
                      <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Role</label>
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: theme.text }}>{currentMember?.role || "Team"}</p>
                    </div>

                    {memberServices.length > 0 && (
                      <div>
                        <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Allocated Services</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {memberServices.map(s => <span key={s} style={{ padding: "3px 10px", background: "#e0f2fe", color: "#0369a1", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>{s}</span>)}
                        </div>
                      </div>
                    )}

                    {editingProfile && (
                      <button onClick={saveProfileChanges}
                        style={{ padding: "11px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", marginTop: "4px" }}>
                        💾 Save Changes
                      </button>
                    )}
                  </div>
                </div>

                {/* Card 2: Security & Password */}
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "18px 24px", borderBottom: `1px solid ${theme.border}` }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: theme.text }}>Security &amp; Password</h3>
                  </div>
                  
                  <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Current Password</label>
                      <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••"
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div>
                      <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>New Password</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••"
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div>
                      <label style={{ color: theme.muted, fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Confirm New Password</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.text, fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <button onClick={changePassword}
                      style={{ padding: "11px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", marginTop: "4px" }}>
                      🔑 Update Password
                    </button>
                  </div>
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
              senderId={currentMember?.id || ""}
              authorId={currentMember?.id || ""}
              senderEmail={currentMember?.email || ""}
              senderName={currentMember?.name || "Team Member"}
              senderRole="team"
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
              services={currentMember?.services || []}
              onUpdateRequestId={updateRequestId}
            />
          )}

          {/* ── View History Modal ────────────────────────────────────────────────── */}
          {showHistoryModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
              <div style={{ width: "min(640px, 95%)", background: theme.cardBg, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
                {/* Header */}
                <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: theme.text }}>Recent Requests History</h3>
                    <p style={{ margin: "2px 0 0", fontSize: "13px", color: theme.muted }}>Overview of the latest requests in the system</p>
                  </div>
                  <button onClick={() => setShowHistoryModal(false)} style={{ background: "transparent", border: "none", color: theme.muted, fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {allRequests.map(r => (
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
                        <span>Priority: <strong style={{ color: theme.text }}><PriorityBadge priority={r.priority} /></strong></span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                        <button onClick={() => { setShowHistoryModal(false); viewRequestDetails(r); }} style={{ padding: "6px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                  {allRequests.length === 0 && (
                    <p style={{ textAlign: "center", color: theme.muted, padding: "20px 0" }}>No requests history found.</p>
                  )}
                </div>
                {/* Footer */}
                <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => setShowHistoryModal(false)} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", color: theme.muted, fontSize: "13px", fontWeight: 600 }}>Close</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}