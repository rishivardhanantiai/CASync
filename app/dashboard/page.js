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
    if (activeView !== "grid") {
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

  const serviceLinks = [
    { href: "/income-tax", label: "Open Income Tax", icon: "fas fa-file-invoice" },
    { href: "/add-pan", label: "Add PAN", icon: "fas fa-file-invoice" },
    { href: "/income-tax-query", label: "Income Tax Query", icon: "fas fa-file-invoice" },
    { href: "/filereturn", label: "File Return", icon: "fas fa-file-invoice" },
    { href: "/gst", label: "Open GST", icon: "fas fa-percentage" },
    { href: "/gst-registration", label: "GST Registration", icon: "fas fa-percentage" },
    { href: "/gst-return", label: "File GST Return", icon: "fas fa-percentage" },
    { href: "/company", label: "Company Registration", icon: "fas fa-building" },
    { href: "/firm", label: "Firm Registration", icon: "fas fa-briefcase" },
    { href: "/udhyam", label: "Udhyam Registration", icon: "fas fa-store" },
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
            {activeView === "documents" && (
              <label className="action-btn" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "12px", margin: 0 }}>
                {docUploadLoading ? "..." : <><i className="fas fa-upload" /> Upload</>}
                <input type="file" style={{ display: "none" }} onChange={(e) => handleGeneralUpload(e.target.files[0])} disabled={docUploadLoading} />
              </label>
            )}
          </div>
          {/* ── DEFAULT GRID VIEW ── */}
          {activeView === "grid" && (
            <div className="dashboard-grid-container">
              <h2 className="grid-section-title desktop-only">New Service Request</h2>
              <p className="grid-section-sub desktop-only">Select a service to get started</p>
              <div className="service-grid">
                {serviceLinks.map(link => (
                  <Link key={link.href} href={link.href} className="service-card">
                    <i className={link.icon} />
                    <h3>{link.label}</h3>
                  </Link>
                ))}
              </div>

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
          {activeView === "my-requests" && (
            <div className="content-view">
              <h2 className="view-title desktop-only">My Requests</h2>
              <div className="card">
                {requests.length === 0 ? (
                  <p className="empty-state">No requests found.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map(r => (
                          <tr key={r.id}>
                            <td>{(r.serviceType || "").replace(/_/g, " ")}</td>
                            <td>
                              <span className="badge" style={{ background: STATUS_COLOR[r.status]?.bg, color: STATUS_COLOR[r.status]?.text }}>
                                {STATUS_COLOR[r.status]?.label}
                              </span>
                            </td>
                            <td>
                              {r.status === "pending_docs" ? (
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button className="action-btn" onClick={() => handleFixResubmit(r)}>Fix & Resubmit</button>
                                  <button className="ghost-btn" onClick={() => openRequestDetail(r)}>View</button>
                                </div>
                              ) : (
                                <button className="ghost-btn" onClick={() => openRequestDetail(r)}>View</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DOCUMENTS VIEW ── */}
          {activeView === "documents" && (
            <div className="content-view">
              <div className="desktop-only" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 className="view-title" style={{ margin: 0 }}>My Documents</h2>
                <label className="action-btn" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  {docUploadLoading ? "Uploading..." : <><i className="fas fa-upload" /> Upload Document</>}
                  <input type="file" style={{ display: "none" }} onChange={(e) => handleGeneralUpload(e.target.files[0])} disabled={docUploadLoading} />
                </label>
              </div>
              <div className="card">
                {documents.length === 0 ? (
                  <p className="empty-state">No documents found.</p>
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
                        {documents.map(d => (
                          <tr key={d.id}>
                            <td>
                              <i className="fas fa-file-alt" style={{ marginRight: "10px", color: "var(--secondary-color)" }} />
                              <strong>{d.title}</strong>
                            </td>
                            <td>{d.uploaderName || "System"}</td>
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
          )}



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
                        if (data.success) resolve({ success: true, docId: data.document.id });
                        else resolve({ success: false });
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
