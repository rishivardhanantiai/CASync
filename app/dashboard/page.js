"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ToastContainer, showToast } from "@/components/Toast";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import RequestDetailView from "@/components/RequestDetailView";

// ─── Constants ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  in_progress: { bg: "#fef9c3", text: "#854d0e", label: "In Progress" },
  completed: { bg: "#dcfce7", text: "#166534", label: "Completed" },
  pending_docs: { bg: "#fee2e2", text: "#991b1b", label: "Pending Docs" },
  submitted: { bg: "#dbeafe", text: "#1e40af", label: "Submitted" },
  on_hold: { bg: "#f3f4f6", text: "#374151", label: "On Hold" },
  paid: { bg: "#dcfce7", text: "#166534", label: "Paid" },
  pending: { bg: "#ffedd5", text: "#9a3412", label: "Pending" },
};


export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userMobile, setUserMobile] = useState("");
  const [activeView, setActiveView] = useState("grid"); // "grid", "my-requests", "notifications", "billing", "profile"

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Data states
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Request detail view
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reqDetailsData, setReqDetailsData] = useState(null);
  const [reqDetailsLoading, setReqDetailsLoading] = useState(false);
  const [reqUploadLoading, setReqUploadLoading] = useState(false);
  const initRef = useRef(false);

  // CATEGORY & SEARCH STATES
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Column search filters
  const [colService, setColService] = useState("");
  const [colName, setColName] = useState("");
  const [colIdentifier, setColIdentifier] = useState("");
  const [colFY, setColFY] = useState("");
  const [colMonth, setColMonth] = useState("");
  const [colDate, setColDate] = useState("");

  // Document states
  const [docSearchTerm, setDocSearchTerm] = useState("");
  const [docUploaderFilter, setDocUploaderFilter] = useState("all");

  useEffect(() => {
    const cu = localStorage.getItem("currentUser");
    if (!cu) { router.replace("/login"); return; }
    const u = JSON.parse(cu);
    setUserName(u.name || "User");
    setUserEmail(u.email || "");
    setUserMobile(u.mobile || "");
    if (u.email) {
      loadDashboardData(u.email);
    }
  }, [router]);

  async function loadDashboardData(email) {
    try {
      const res = await fetch(`/api/client/dashboard-data?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
        setInvoices(data.invoices);
        setDocuments(data.documents || []);
        if (data.notifications?.length > 0) {
          setNotifs(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = data.notifications.filter(n => !existingIds.has(n.id));
            return [...newOnes, ...prev];
          });
        }
      }
    } catch { console.log("Error loading dashboard data"); }
  }

  // Persist notifications to localStorage
  useEffect(() => {
    try {
      const cu = JSON.parse(localStorage.getItem("currentUser") || "null");
      const email = cu?.email || "guest";
      const raw = localStorage.getItem(`casync.notifications.${email}`) || null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setNotifs(parsed);
      }
    } catch (e) {
      // ignore
    } finally {
      initRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!initRef.current) return;
    try {
      const cu = JSON.parse(localStorage.getItem("currentUser") || "null");
      const email = cu?.email || "guest";
      localStorage.setItem(`casync.notifications.${email}`, JSON.stringify(notifs));
    } catch (e) { }
  }, [notifs]);

  const handleFixResubmit = (request) => {
    let path = "";
    if (request.serviceType === "GST_REGISTRATION") path = "/gst-registration";
    else if (request.serviceType === "GST_RETURN") path = "/gst-return";
    else if (request.serviceType === "ITR") path = "/filereturn";
    else if (request.serviceType === "PAN") path = "/add-pan";
    else if (request.serviceType === "APPLY_NEW_GST") path = "/new-gst-registration";
    else if (request.serviceType === "ADD_COMPANY") path = "/add-company";
    else if (request.serviceType === "NEW_COMPANY_REGISTRATION") path = "/new-company-registration";
    else if (request.serviceType === "COMPLIANCE") path = "/compliance";
    else if (request.serviceType === "NEW_FIRM_REGISTRATION") path = "/new-firm-registration";
    else if (request.serviceType === "NEW_UDHYAM_REGISTRATION") path = "/new-udhyam-registration";
    else if (request.serviceType === "UDHYAM_UPDATES") path = "/udhyam-updates";
    else if (request.serviceType === "OTHER_REQUIREMENTS") path = "/other-requirements";
    else if (request.serviceType === "GST_QUERY") path = "/gst-query";
    else if (request.serviceType === "COMPANY_QUERY") path = "/company-query";
    else if (request.serviceType === "FIRM_QUERY") path = "/firm-query";
    else if (request.serviceType === "UDHYAM_QUERY") path = "/udhyam-query";
    else if (request.serviceType === "IT_QUERY") path = "/income-tax-query";

    if (path && request.referenceId) {
      router.push(`${path}?edit=${request.referenceId}&srId=${request.id}`);
    } else {
      openRequestDetail(request);
    }
  };

  async function openRequestDetail(request) {
    setSelectedRequest(request);
    setReqDetailsData(null);
    setReqDetailsLoading(true);
    setActiveView("request-detail");
    try {
      const res = await fetch(`/api/admin/service-requests/details?id=${request.referenceId}&type=${request.serviceType}`);
      const data = await res.json();
      if (data.success) setReqDetailsData(data.data);
    } catch { showToast("Failed to load details", "error"); }
    setReqDetailsLoading(false);
  }

  async function handleDocUploadForRequest(file) {
    if (!file) return;
    setReqUploadLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploader: "client",
            uploaderId: userEmail,
            uploaderName: userName,
            clientId: userEmail,
            clientEmail: userEmail,
            title: file.name,
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + " KB",
            mimeType: file.type,
            fileData: reader.result,
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast("Document uploaded", "success");
          loadDashboardData(userEmail);
        } else showToast(data.message || "Upload failed", "error");
        setReqUploadLoading(false);
      };
      reader.readAsDataURL(file);
    } catch { showToast("Upload error", "error"); setReqUploadLoading(false); }
  }

  async function handleClientResubmit(clientNotes) {
    if (!selectedRequest) return;
    try {
      const res = await fetch("/api/client/resubmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRequest.id, clientNotes, newDocuments: [] })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Request resubmitted!", "success");
        setActiveView("my-requests");
        setSelectedRequest(null);
        loadDashboardData(userEmail);
      } else showToast(data.message || "Failed to resubmit", "error");
    } catch { showToast("Resubmit error", "error"); }
  }

  async function handleUpdateProfile(event) {
    event.preventDefault();
    setProfileUpdating(true);
    try {
      const res = await fetch("/api/client/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: editName,
          mobile: editMobile,
          password: editPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Profile updated successfully", "success");
        setUserName(data.user.name);
        setUserMobile(data.user.mobile);

        // Update localStorage
        const cu = JSON.parse(localStorage.getItem("currentUser") || "{}");
        cu.name = data.user.name;
        cu.mobile = data.user.mobile;
        localStorage.setItem("currentUser", JSON.stringify(cu));

        setIsEditingProfile(false);
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch {
      showToast("Error updating profile", "error");
    }
    setProfileUpdating(false);
  }

  function handleMarkAsRead(id) {
    setNotifs((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
    showToast("Marked as read", "success");
  }

  function handleDeleteNotification(id) {
    setNotifs((prev) => prev.filter((x) => x.id !== id));
    showToast("Notification deleted", "info");
  }

  function handleLogout(event) {
    event?.preventDefault();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    window.location.href = "/";
  }

  function handleBack(event) {
    event.preventDefault();
    if (selectedCategory) {
      setSelectedCategory(null);
    } else if (activeView !== "grid") {
      setActiveView("grid");
    } else {
      router.push("/");
    }
  }

  const unreadCount = notifs.filter(n => !n.read).length;
  const mobileViewTitle = activeView === "grid"
    ? "New Service Request"
    : activeView === "my-requests"
      ? "My Requests"
      : activeView === "documents"
        ? "My Documents"
        : activeView === "profile"
          ? "My Profile"
          : "Dashboard";

  const CATEGORIES = [
    {
      id: "income_tax",
      label: "Income Tax",
      icon: "fas fa-file-invoice-dollar",
      items: [
        { label: "File Return", href: "/filereturn", icon: "fas fa-file-export" },
        { label: "Income Tax Query", href: "/income-tax-query", icon: "fas fa-question-circle" },
        { label: "My Return Status", href: "/my-return-status", icon: "fas fa-info-circle" },
        { label: "Add PAN", href: "/add-pan", icon: "fas fa-address-card" }
      ]
    },
    {
      id: "gst",
      label: "GST",
      icon: "fas fa-percent",
      items: [
        { label: "Add GST", href: "/gst-registration", icon: "fas fa-plus-circle" },
        { label: "Apply New GST Registration", href: "/new-gst-registration", icon: "fas fa-file-signature" },
        { label: "GST Return", href: "/gst-return", icon: "fas fa-file-invoice" },
        { label: "GST Query", href: "/gst-query", icon: "fas fa-question-circle" }
      ]
    },
    {
      id: "company",
      label: "Company",
      icon: "fas fa-building",
      items: [
        { label: "Add Company", href: "/add-company", icon: "fas fa-plus-circle" },
        { label: "New Company Registration", href: "/new-company-registration", icon: "fas fa-file-signature" },
        { label: "Compliance", href: "/compliance", icon: "fas fa-clipboard-check" },
        { label: "Company Query", href: "/company-query", icon: "fas fa-question-circle" }
      ]
    },
    {
      id: "firm",
      label: "Firm",
      icon: "fas fa-briefcase",
      items: [
        { label: "New Firm Registration", href: "/new-firm-registration", icon: "fas fa-file-signature" },
        { label: "Query", href: "/firm-query", icon: "fas fa-question-circle" }
      ]
    },
    {
      id: "udhyam",
      label: "Udhyam",
      icon: "fas fa-store",
      items: [
        { label: "New Registration", href: "/new-udhyam-registration", icon: "fas fa-file-signature" },
        { label: "Updates and Modification", href: "/udhyam-updates", icon: "fas fa-edit" },
        { label: "Query", href: "/udhyam-query", icon: "fas fa-question-circle" }
      ]
    },
    {
      id: "other",
      label: "Other Requirements",
      icon: "fas fa-tasks",
      href: "/other-requirements"
    }
  ];

  const [docUploadLoading, setDocUploadLoading] = useState(false);

  async function handleGeneralUpload(file) {
    if (!file) return;
    setDocUploadLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploader: "client",
            uploaderId: userEmail,
            uploaderName: userName,
            clientId: userEmail,
            clientEmail: userEmail,
            title: file.name,
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + " KB",
            mimeType: file.type,
            fileData: reader.result,
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast("Document uploaded successfully", "success");
          loadDashboardData(userEmail);
        } else showToast(data.message || "Upload failed", "error");
        setDocUploadLoading(false);
      };
      reader.readAsDataURL(file);
    } catch { showToast("Upload error", "error"); setDocUploadLoading(false); }
  }

  async function downloadDocument(id) {
    try {
      const res = await fetch(`/api/documents/download?id=${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        const a = document.createElement("a");
        a.href = data.data.fileData;
        a.download = data.data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        showToast("Download failed", "error");
      }
    } catch {
      showToast("Download error", "error");
    }
  }

  return (
    <div className="layout-wrapper">
      <ToastContainer />
      <div className="desktop-only"><SiteHeader title="TOTALTAXHUB.COM" /></div>
      <header className="mobile-header mobile-only">
        <div className="mobile-brand">
          <span>TotalTax Hub</span>
        </div>
        <a href="#" onClick={handleLogout} className="mobile-logout" aria-label="Logout">
          <i className="fas fa-sign-out-alt" />
        </a>
      </header>
      {/* ClientBlueBar Style Top Bar */}
      <nav className="main-nav desktop-only">
        <div className="container">
          <div className="nav-row">
            <ul>
              <li>
                <a href="#" onClick={handleBack} className="active">
                  <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />
                  <span className="back-text">Back</span>
                </a>
              </li>
            </ul>
            {activeView === "grid" && (
              <ul style={{ marginLeft: "auto" }}>
                <li>
                  <a href="#" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }} />
                    Logout
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <div className="mobile-view-header mobile-only">
            <h2>{mobileViewTitle}</h2>
            {activeView === "my-requests" && (
              <button type="button" onClick={() => setActiveView("grid")} className="mobile-plus-btn" aria-label="New Service Request">
                <i className="fas fa-plus" />
              </button>
            )}
          </div>
          {/* ── DEFAULT GRID VIEW ── */}
          {activeView === "grid" && (
            <div className="dashboard-grid-container">
              {!selectedCategory ? (
                <>
                  <h2 className="grid-section-title desktop-only">New Service Request</h2>
                  <p className="grid-section-sub desktop-only">Select a service category to get started</p>
                  <div className="service-grid">
                    {CATEGORIES.map(cat => {
                      if (cat.href) {
                        return (
                          <Link key={cat.id} href={cat.href} className="service-card">
                            <i className={cat.icon} />
                            <h3>{cat.label}</h3>
                          </Link>
                        );
                      }
                      return (
                        <div key={cat.id} onClick={() => setSelectedCategory(cat)} className="service-card" style={{ cursor: "pointer" }}>
                          <i className={cat.icon} />
                          <h3>{cat.label}</h3>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
                    <button onClick={() => setSelectedCategory(null)} className="ghost-btn" style={{ fontSize: "14px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fas fa-arrow-left" /> Back to Categories
                    </button>
                    <h2 className="grid-section-title" style={{ margin: 0 }}>{selectedCategory.label}</h2>
                  </div>
                  <div className="service-grid">
                    {selectedCategory.items.map(item => (
                      <Link key={item.href} href={item.href} className="service-card">
                        <i className={item.icon} />
                        <h3>{item.label}</h3>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              <h2 className="grid-section-title desktop-only" style={{ marginTop: "40px" }}>Manage Account</h2>
              <div className="service-grid desktop-only">
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveView("my-requests"); }} className="service-card">
                  <i className="fas fa-list-alt" />
                  <h3>My Requests</h3>
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveView("documents"); }} className="service-card">
                  <i className="fas fa-folder-open" />
                  <h3>Documents</h3>
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveView("profile"); }} className="service-card">
                  <i className="fas fa-user-circle" />
                  <h3>Profile</h3>
                </a>
              </div>
            </div>
          )}

          {/* ── MY REQUESTS VIEW ── */}
          {activeView === "my-requests" && (() => {
            const filteredRequests = requests.filter(r => {
              // Status Filter
              if (statusFilter === "pending" && r.status === "completed") return false;
              if (statusFilter === "completed" && r.status !== "completed") return false;

              // General Search Filter (matches service type, name, or date)
              const dateStr = new Date(r.createdAt).toLocaleDateString("en-IN");
              const serviceStr = (r.serviceType || "").replace(/_/g, " ").toLowerCase();
              const nameStr = (r.clientName || "").toLowerCase();
              const rawSearch = searchTerm.toLowerCase();

              if (rawSearch) {
                const matchesGeneral =
                  serviceStr.includes(rawSearch) ||
                  nameStr.includes(rawSearch) ||
                  dateStr.includes(rawSearch);
                if (!matchesGeneral) return false;
              }

              // Column Search Filters
              if (colService && !serviceStr.includes(colService.toLowerCase())) return false;
              if (colName && !nameStr.includes(colName.toLowerCase())) return false;
              if (colFY && !(r.financialYear || "").toLowerCase().includes(colFY.toLowerCase())) return false;
              if (colMonth && !(r.financialMonth || "").toLowerCase().includes(colMonth.toLowerCase())) return false;
              if (colDate && !dateStr.includes(colDate)) return false;

              const identifier = (r.panNumber || r.gstNumber || r.cinNumber || r.udhyamNumber || "").toLowerCase();
              if (colIdentifier && !identifier.includes(colIdentifier.toLowerCase())) return false;

              return true;
            });

            return (
              <div className="content-view">
                <h2 className="view-title desktop-only">My Requests</h2>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "280px" }}>
                    <input
                      type="text"
                      placeholder="Search by Service, Name, or Date..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ flex: 1, padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", background: "#fff" }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="card">
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Identifier (PAN/GST/CIN/Udhyam)</th>
                          <th>Name</th>
                          <th>Financial Year</th>
                          <th>Financial Month</th>
                          <th>Date of Request</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                        {/* Column level search bars */}
                        <tr style={{ background: "#f8fafc" }}>
                          <td>
                            <input
                              type="text"
                              placeholder="Filter Service"
                              value={colService}
                              onChange={(e) => setColService(e.target.value)}
                              style={{ width: "100%", padding: "6px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Filter Identifier"
                              value={colIdentifier}
                              onChange={(e) => setColIdentifier(e.target.value)}
                              style={{ width: "100%", padding: "6px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Filter Name"
                              value={colName}
                              onChange={(e) => setColName(e.target.value)}
                              style={{ width: "100%", padding: "6px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Filter FY"
                              value={colFY}
                              onChange={(e) => setColFY(e.target.value)}
                              style={{ width: "100%", padding: "6px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Filter Month"
                              value={colMonth}
                              onChange={(e) => setColMonth(e.target.value)}
                              style={{ width: "100%", padding: "6px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Filter Date"
                              value={colDate}
                              onChange={(e) => setColDate(e.target.value)}
                              style={{ width: "100%", padding: "6px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                            />
                          </td>
                          <td></td>
                          <td></td>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="empty-state" style={{ textAlign: "center", padding: "40px", color: "#64748b", fontWeight: 500 }}>
                              <i className="fas fa-search" style={{ marginRight: 8, color: "#cbd5e1" }} />
                              No requests found matching your filters.
                            </td>
                          </tr>
                        ) : (
                          filteredRequests.map(r => (
                            <tr key={r.id}>
                              <td>
                                <span style={{ fontWeight: 600 }}>
                                  {(r.serviceType || "").replace(/_/g, " ")}
                                </span>
                              </td>
                              <td>{r.panNumber || r.gstNumber || r.cinNumber || r.udhyamNumber || "-"}</td>
                              <td>{r.clientName || "-"}</td>
                              <td>{r.financialYear || "-"}</td>
                              <td>{r.financialMonth || "-"}</td>
                              <td>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                              <td>
                                <span className="badge" style={{ background: STATUS_COLOR[r.status]?.bg, color: STATUS_COLOR[r.status]?.text }}>
                                  {STATUS_COLOR[r.status]?.label}
                                </span>
                              </td>
                              <td>
                                {(r.status === "submitted" || r.status === "pending_docs") ? (
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <button className="action-btn" onClick={() => handleFixResubmit(r)}>Edit</button>
                                    <button className="ghost-btn" onClick={() => openRequestDetail(r)}>View</button>
                                  </div>
                                ) : (
                                  <button className="ghost-btn" onClick={() => openRequestDetail(r)}>View</button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── DOCUMENTS VIEW ── */}
          {activeView === "documents" && (() => {
            const filteredDocuments = documents.filter(d => {
              // Uploaded by filter
              if (docUploaderFilter === "me" && d.uploader !== "client") return false;
              if (docUploaderFilter === "team_admin" && d.uploader === "client") return false;

              // Search bar filter
              if (docSearchTerm) {
                const term = docSearchTerm.toLowerCase();
                const titleStr = (d.title || d.fileName || "").toLowerCase();
                if (!titleStr.includes(term)) return false;
              }
              return true;
            });

            return (
              <div className="content-view">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "15px" }}>
                  <h2 className="view-title" style={{ margin: 0 }}>My Documents</h2>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={docSearchTerm}
                      onChange={(e) => setDocSearchTerm(e.target.value)}
                      style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", width: "220px" }}
                    />
                    <select
                      value={docUploaderFilter}
                      onChange={(e) => setDocUploaderFilter(e.target.value)}
                      style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", background: "#fff" }}
                    >
                      <option value="all">All Documents</option>
                      <option value="me">Uploaded by Me</option>
                      <option value="team_admin">Uploaded by Team/Admin</option>
                    </select>
                  </div>
                </div>
                <div className="card">
                  {filteredDocuments.length === 0 ? (
                    <p className="empty-state">No documents found matching your filters.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Document Name</th>
                            <th>Uploaded By</th>
                            <th>Size</th>
                            <th>Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDocuments.map(d => (
                            <tr key={d.id}>
                              <td>
                                <i className="fas fa-file-alt" style={{ marginRight: "10px", color: "var(--secondary-color)" }} />
                                <strong>{d.title}</strong>
                              </td>
                              <td>{d.uploaderName || d.uploader || "System"}</td>
                              <td>{d.fileSize || "—"}</td>
                              <td>{new Date(d.createdAt).toLocaleDateString("en-IN")}</td>
                              <td>
                                <button className="ghost-btn" onClick={() => downloadDocument(d.id)}>
                                  <i className="fas fa-download" style={{ marginRight: "6px" }} /> Download
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}



          {/* ── PROFILE VIEW ── */}
          {activeView === "profile" && (
            <div className="content-view">
              <h2 className="view-title desktop-only">My Profile</h2>
              <div className="card" style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}>
                <div className="profile-view-header" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--secondary-color)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "bold" }}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "24px", color: "var(--text-color)" }}>{userName}</h3>
                    <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "16px" }}>{userEmail}</p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => {
                        setEditName(userName);
                        setEditMobile(userMobile);
                        setEditPassword("");
                        setIsEditingProfile(true);
                      }}
                      style={{ marginLeft: "auto", padding: "8px 16px", background: "var(--secondary-color)", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                    >
                      <i className="fas fa-edit" style={{ marginRight: "6px" }} /> Edit Profile
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#475569", fontSize: "14px" }}>Full Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#475569", fontSize: "14px" }}>Email ID (Cannot be changed)</label>
                      <input type="email" value={userEmail} disabled style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1", background: "#f1f5f9", cursor: "not-allowed" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#475569", fontSize: "14px" }}>Mobile Number</label>
                      <input type="tel" value={editMobile} onChange={(e) => setEditMobile(e.target.value)} pattern="[0-9]{10}" required style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#475569", fontSize: "14px" }}>New Password (Leave blank to keep current)</label>
                      <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Enter new password" style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button type="submit" disabled={profileUpdating} style={{ flex: 1, padding: "12px", background: "var(--secondary-color)", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>
                        {profileUpdating ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" onClick={() => setIsEditingProfile(false)} disabled={profileUpdating} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Mobile Number</p>
                        <p style={{ margin: "5px 0 0", fontWeight: "600", color: "var(--text-color)" }}>{userMobile || "Not provided"}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Account Type</p>
                        <p style={{ margin: "5px 0 0", fontWeight: "600", color: "var(--text-color)" }}>Client</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── REQUEST DETAIL SPLIT-VIEW ── */}
          {activeView === "request-detail" && selectedRequest && (
          <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#f1f5f9", display: "flex", flexDirection: "column" }}>
            <RequestDetailView
              request={selectedRequest}
              detailsData={reqDetailsData}
              loadingDetails={reqDetailsLoading}
              senderId={userEmail}
              senderEmail={userEmail}
              senderName={userName}
              senderRole="client"
              onClose={() => { setActiveView("my-requests"); setSelectedRequest(null); }}
              onDownloadDoc={async (docId, fileName) => {
                try {
                  const res = await fetch(`/api/documents/download?id=${docId}`);
                  const data = await res.json();
                  if (data.success) {
                    const a = document.createElement("a");
                    a.href = data.data.fileData;
                    a.download = fileName || data.data.fileName;
                    a.click();
                  } else showToast("Download failed", "error");
                } catch { showToast("Download error", "error"); }
              }}
              uploadFileToServer={async (file) => {
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    try {
                      const res = await fetch("/api/documents/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          uploader: "client",
                          uploaderId: userEmail,
                          uploaderName: userName,
                          clientId: userEmail,
                          clientEmail: userEmail,
                          title: file.name,
                          fileName: file.name,
                          fileSize: (file.size / 1024).toFixed(1) + " KB",
                          mimeType: file.type,
                          fileData: reader.result,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        // ✅ Essential: reload data so the UI reflects the new file
                        loadDashboardData(userEmail);
                        resolve({ success: true, docId: data.document.id });
                      } else resolve({ success: false });
                    } catch { resolve({ success: false }); }
                  };
                  reader.readAsDataURL(file);
                });
              }}
              showStatusControls={false}
            />
          </div>
        )}


        </div>
      </main>

      <SiteFooter />
      {activeView !== "request-detail" && (
        <nav className="mobile-bottom-nav mobile-only" aria-label="Bottom Navigation">
          <button type="button" className={activeView === "grid" ? "is-active" : ""} onClick={() => setActiveView("grid")}>
            <i className="fas fa-plus-circle" />
            <span>New</span>
          </button>
          <button type="button" className={activeView === "my-requests" ? "is-active" : ""} onClick={() => setActiveView("my-requests")}>
            <i className="fas fa-clipboard-list" />
            <span>My Requests</span>
          </button>
          <button type="button" className={activeView === "documents" ? "is-active" : ""} onClick={() => setActiveView("documents")}>
            <i className="far fa-folder" />
            <span>Documents</span>
          </button>
          <button type="button" className={activeView === "profile" ? "is-active" : ""} onClick={() => setActiveView("profile")}>
            <i className="far fa-user" />
            <span>Profile</span>
          </button>
        </nav>
      )}


      <style jsx>{`
        .layout-wrapper { display: flex; flex-direction: column; min-height: 100vh; background-color: var(--light-bg); }
        .main-content { flex: 1; padding: 40px 0; }
        .desktop-only { display: block; }
        .mobile-only { display: none; }
        
        .dashboard-grid-container { animation: fadeIn 0.3s ease; }
        .content-view { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .grid-section-title { font-size: 22px; color: var(--text-color); margin-bottom: 4px; }
        .grid-section-sub { font-size: 14px; color: #64748b; margin-bottom: 24px; }
        .view-title { font-size: 24px; color: var(--text-color); margin-bottom: 24px; text-align: center; }

        .service-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; }
        .service-card { background: var(--white); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px 20px; text-align: center; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; color: var(--text-color); text-decoration: none; display: flex; flex-direction: column; align-items: center; }
        .service-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); text-decoration: none; color: var(--text-color); }
        .service-card i { font-size: 28px; color: var(--secondary-color); margin-bottom: 16px; display: block; }
        .service-card h3 { font-size: 15px; font-weight: 700; margin: 0; }
        
        .card { background: var(--white); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { background: #f8fafc; padding: 16px 20px; text-align: left; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 14px; }
        .data-table td { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; color: var(--text-color); font-size: 14px; }
        .data-table tr:last-child td { border-bottom: none; }
        
        .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
        .nav-badge { background: #ef4444; color: #fff; border-radius: 50%; padding: 2px 6px; font-size: 12px; margin-left: 6px; vertical-align: middle; }
        .empty-state { text-align: center; padding: 60px 20px; color: #64748b; font-size: 15px; }
        
        .action-btn { background: var(--secondary-color); color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
        .action-btn:hover { background: #2980b9; }
        
        .notif-list { display: grid; gap: 16px; }
        .notif-item { display: flex; gap: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; border-left: 4px solid; }
        .notif-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; alignItems: center; justifyContent: center; font-size: 16px; flex-shrink: 0; }
        .notif-body { flex: 1; }
        .notif-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .notif-title { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-color); }
        .notif-time { font-size: 12px; color: #64748b; }
        .notif-message { margin: 0 0 12px 0; font-size: 14px; color: #475569; }
        .notif-actions { display: flex; gap: 8px; }
        
        .ghost-btn { background: #f1f5f9; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; color: #475569; font-size: 12px; font-weight: 500; }
        .ghost-btn:hover { background: #e2e8f0; }
        .ghost-btn.danger { color: #ef4444; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-card { background: #fff; width: 100%; max-width: 600px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); max-height: 90vh; display: flex; flex-direction: column; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: #64748b; }
        .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }

        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block; }
          .main-content { padding: 16px 0 92px; }
          .container { padding: 0 14px; }

          .mobile-header {
            background: var(--primary-color);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            height: 72px;
            padding: 0 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .mobile-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--white);
            font-size: 38px;
          }
          .mobile-brand span {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 0.2px;
          }
          .mobile-logout {
            color: var(--white);
            font-size: 28px;
            text-decoration: none;
          }

          .mobile-view-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 8px 2px 18px;
          }
          .mobile-view-header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 500;
            color: #0f172a;
          }
          .mobile-plus-btn {
            border: none;
            background: transparent;
            width: 40px;
            height: 40px;
            color: var(--primary-color);
            font-size: 34px;
            line-height: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .mobile-plus-btn.icon-only {
            opacity: 0.95;
            pointer-events: none;
          }

          .service-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          .service-card {
            min-height: 172px;
            border-radius: 18px;
            padding: 22px 14px;
            box-shadow: 0 1px 8px rgba(15, 23, 42, 0.06);
          }
          .service-card i { font-size: 32px; margin-bottom: 14px; }
          .service-card h3 { font-size: 19px; font-weight: 500; line-height: 1.25; }

          .view-title {
            display: none;
          }
          .card {
            border-radius: 14px;
          }
          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .data-table th,
          .data-table td {
            padding: 12px;
            font-size: 13px;
            white-space: nowrap;
          }
          .data-table { min-width: 600px; }
          .modal-card { width: 95%; max-height: 85vh; }

          .mobile-bottom-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            height: 76px;
            background: var(--primary-color);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            z-index: 55;
          }
          .mobile-bottom-nav button {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
            margin: 0;
            border-top: 3px solid transparent;
          }
          .mobile-bottom-nav button span {
            white-space: nowrap;
            line-height: 1.1;
          }
          .mobile-bottom-nav button i {
            font-size: 23px;
            line-height: 1;
          }
          .mobile-bottom-nav button.is-active {
            color: var(--white);
            border-top-color: var(--white);
          }
          .profile-view-header { flex-direction: column !important; text-align: center; }
          .profile-view-header button { margin: 15px auto 0 !important; width: 100%; }
          .notif-item { flex-direction: column; gap: 12px; }
          .notif-header { flex-direction: column; }
          .notif-actions { flex-wrap: wrap; }
        }

        @media (max-width: 480px) {
          .modal-card { width: 100%; max-height: 80vh; border-radius: 8px; }
        }

        @media (max-width: 320px) {
          .main-content { padding: 20px 0 92px !important; }
          .view-title { font-size: 20px; }
          .card { padding: 15px !important; }
          .back-text { display: none; }
        }
      `}</style>
    </div>
  );
}
