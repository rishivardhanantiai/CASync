"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function MyReturnStatusPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [itrRequests, setItrRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search states
  const [searchPan, setSearchPan] = useState("");
  const [activeSearchPan, setActiveSearchPan] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!(user && loggedIn));

    const currentUser = JSON.parse(user || "null");
    if (currentUser?.email) {
      setUserEmail(currentUser.email);
      fetchItrStatus(currentUser.email);
    } else if (loggedIn) {
      router.replace("/login");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  async function fetchItrStatus(email) {
    try {
      const res = await fetch(`/api/client/dashboard-data?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        // Filter for ITR requests
        const filtered = (data.requests || []).filter(r => r.serviceType === "ITR");
        setItrRequests(filtered);
        setDocuments(data.documents || []);

        // Pre-fill search if there is at least one request
        if (filtered.length > 0 && filtered[0].panNumber) {
          setSearchPan(filtered[0].panNumber);
          setActiveSearchPan(filtered[0].panNumber);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
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
        alert("Failed to download document");
      }
    } catch {
      alert("Download error");
    }
  }

  function findDocument(type, fy) {
    if (!fy) return null;
    const fyClean = fy.replace(/[^0-9]/g, ""); // e.g., "202324"
    return documents.find(d => {
      // Must be uploaded by team/admin
      if (d.uploader === "client") return false;
      const nameLower = (d.title || d.fileName || "").toLowerCase();
      
      let matchesType = false;
      if (type === "acknowledgment") {
        matchesType = nameLower.includes("acknowledg") || nameLower.includes("ack");
      } else if (type === "computation") {
        matchesType = nameLower.includes("computation") || nameLower.includes("comp");
      }
      
      if (!matchesType) return false;
      
      // Matches the year numbers of the financial year
      const cleanDocName = nameLower.replace(/[^0-9]/g, "");
      const matchesFY = nameLower.includes(fy.toLowerCase()) || 
                        (fyClean && cleanDocName.includes(fyClean)) ||
                        (fy.split("-")[0] && nameLower.includes(fy.split("-")[0]));
      
      return matchesFY;
    });
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearchPan(searchPan.trim());
  };

  const handleQuickPanSelect = (pan) => {
    setSearchPan(pan);
    setActiveSearchPan(pan);
  };

  const uniquePans = Array.from(new Set(itrRequests.map(r => r.panNumber).filter(Boolean)));
  const displayedRequests = activeSearchPan
    ? itrRequests.filter(r => r.panNumber?.toUpperCase() === activeSearchPan.toUpperCase())
    : [];

  const STATUS_STEP = {
    submitted: 1,
    assigned: 2,
    in_progress: 3,
    pending_docs: 2,
    completed: 4
  };

  const STATUS_LABELS = {
    submitted: "Request Submitted",
    assigned: "Assigned to Expert",
    in_progress: "Processing Return",
    pending_docs: "Information Required",
    completed: "Filed & Completed"
  };

  return (
    <>
      <SiteHeader />
      <ClientBlueBar isLoggedIn={isLoggedIn} />
      <main className="main-content">
        <div className="page">
          <div className="status-container">
            <div className="status-header">
              <h2>My Return Status</h2>
              <button onClick={() => router.push("/dashboard")} className="back-btn">
                <i className="fas fa-arrow-left" /> Back to Dashboard
              </button>
            </div>

            {/* Search Box Panel */}
            <div className="search-card">
              <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#1e293b" }}>Search Returns by PAN</h3>
              <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Enter 10-digit PAN (e.g. ABCDE1234F)"
                  value={searchPan}
                  onChange={(e) => setSearchPan(e.target.value)}
                  pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}"
                  title="Valid 10-character PAN format"
                  required
                  style={{ flex: 1, padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px" }}
                />
                <button type="submit" className="search-submit-btn">
                  <i className="fas fa-search" style={{ marginRight: 6 }} /> Search
                </button>
              </form>

              {uniquePans.length > 0 && (
                <div style={{ marginTop: "15px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>Your Filed PANs:</span>
                  {uniquePans.map(pan => (
                    <button
                      key={pan}
                      type="button"
                      onClick={() => handleQuickPanSelect(pan)}
                      className={`quick-pan-btn ${activeSearchPan.toUpperCase() === pan.toUpperCase() ? "active" : ""}`}
                    >
                      {pan}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="loading">Loading filing details...</div>
            ) : !activeSearchPan ? (
              <div className="empty-state">
                <i className="fas fa-search" style={{ fontSize: "40px", color: "#cbd5e1", marginBottom: "15px" }} />
                <p>Please enter your PAN number to search and retrieve your tax returns.</p>
              </div>
            ) : displayedRequests.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-exclamation-triangle" style={{ fontSize: "40px", color: "#f59e0b", marginBottom: "15px" }} />
                <p>No tax filing requests found for PAN: <strong>{activeSearchPan.toUpperCase()}</strong></p>
                <button onClick={() => router.push("/filereturn")} className="action-btn" style={{ marginTop: "10px" }}>
                  File New Return
                </button>
              </div>
            ) : (
              <div className="requests-list">
                {displayedRequests.map((req) => {
                  const currentStep = STATUS_STEP[req.status] || 1;
                  const ackDoc = findDocument("acknowledgment", req.financialYear);
                  const compDoc = findDocument("computation", req.financialYear);

                  return (
                    <div key={req.id} className="request-card animate-slide-in">
                      <div className="card-top">
                        <div>
                          <span className="fy-badge">FY {req.financialYear || "N/A"}</span>
                          <h3 style={{ margin: "10px 0 5px 0" }}>PAN: {req.panNumber || "N/A"}</h3>
                          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                            Submitted on {new Date(req.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <div className="status-badge" data-status={req.status}>
                          {STATUS_LABELS[req.status] || req.status}
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="timeline-wrapper">
                        <div className="timeline">
                          <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
                            <div className="node">1</div>
                            <span>Submitted</span>
                          </div>
                          <div className={`step ${currentStep >= 2 ? "active" : ""} ${req.status === "pending_docs" ? "alert" : ""}`}>
                            <div className="node">{req.status === "pending_docs" ? "!" : "2"}</div>
                            <span>{req.status === "pending_docs" ? "Info Required" : "Assigned"}</span>
                          </div>
                          <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
                            <div className="node">3</div>
                            <span>In Progress</span>
                          </div>
                          <div className={`step ${currentStep >= 4 ? "active" : ""}`}>
                            <div className="node">✓</div>
                            <span>Completed</span>
                          </div>
                        </div>
                      </div>

                      {/* Documents Section */}
                      <div className="documents-section">
                        <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", fontWeight: 700, color: "#475569", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                          <i className="fas fa-folder-open" style={{ marginRight: 6 }} /> Filed Output Downloads
                        </h4>
                        <div className="doc-grid">
                          {/* Acknowledgment file */}
                          <div className="doc-box">
                            <div className="doc-icon ack">
                              <i className="fas fa-file-invoice" />
                            </div>
                            <div className="doc-meta">
                              <h5>ITR Acknowledgment</h5>
                              <p>{ackDoc ? ackDoc.fileName : "Pending upload by team/admin"}</p>
                            </div>
                            {ackDoc ? (
                              <button onClick={() => downloadDocument(ackDoc.id)} className="doc-download-btn">
                                <i className="fas fa-download" /> Download
                              </button>
                            ) : (
                              <span className="doc-status-badge pending">Pending</span>
                            )}
                          </div>

                          {/* Computation file */}
                          <div className="doc-box">
                            <div className="doc-icon comp">
                              <i className="fas fa-calculator" />
                            </div>
                            <div className="doc-meta">
                              <h5>ITR Computation</h5>
                              <p>{compDoc ? compDoc.fileName : "Pending upload by team/admin"}</p>
                            </div>
                            {compDoc ? (
                              <button onClick={() => downloadDocument(compDoc.id)} className="doc-download-btn">
                                <i className="fas fa-download" /> Download
                              </button>
                            ) : (
                              <span className="doc-status-badge pending">Pending</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {req.status === "pending_docs" && (
                        <div className="action-required" style={{ marginTop: "20px" }}>
                          <p>⚠️ Attention: Action Required! Some documents or details need clarification.</p>
                          <button onClick={() => router.push(`/filereturn?edit=${req.referenceId}&srId=${req.id}`)} className="fix-btn">
                            Fix & Resubmit Form
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
      <style jsx>{`
        .page { background: #f8fafc; min-height: calc(100vh - 150px); padding: 40px 20px; font-family: "Inter", sans-serif; }
        .status-container { max-width: 900px; margin: 0 auto; }
        .status-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .status-header h2 { font-size: 28px; color: #1e293b; margin: 0; font-weight: 700; }
        .back-btn { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 500; transition: 0.2s; color: #475569; }
        .back-btn:hover { background: #f1f5f9; }
        
        .search-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .search-submit-btn { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 15px; display: flex; align-items: center; transition: 0.2s; }
        .search-submit-btn:hover { background: #1d4ed8; }
        
        .quick-pan-btn { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; transition: 0.2s; }
        .quick-pan-btn:hover { background: #e2e8f0; }
        .quick-pan-btn.active { background: #dbeafe; border-color: #93c5fd; color: #1e40af; }

        .loading { text-align: center; padding: 40px; font-size: 16px; color: #64748b; }
        .empty-state { background: white; padding: 40px; text-align: center; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; }
        .empty-state p { color: #64748b; font-size: 16px; margin: 0; }
        .action-btn { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s; }
        .action-btn:hover { background: #1d4ed8; }
        
        .requests-list { display: flex; flex-direction: column; gap: 24px; }
        .request-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; }
        .fy-badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
        
        .status-badge { padding: 6px 12px; border-radius: 100px; font-size: 13px; font-weight: 600; }
        .status-badge[data-status="submitted"] { background: #fef3c7; color: #d97706; }
        .status-badge[data-status="assigned"] { background: #dbeafe; color: #2563eb; }
        .status-badge[data-status="in_progress"] { background: #e0e7ff; color: #4f46e5; }
        .status-badge[data-status="pending_docs"] { background: #fee2e2; color: #dc2626; }
        .status-badge[data-status="completed"] { background: #dcfce7; color: #16a34a; }
        
        .timeline-wrapper { margin: 30px 0; }
        .timeline { display: flex; justify-content: space-between; position: relative; }
        .timeline::before { content: ""; position: absolute; top: 18px; left: 5%; right: 5%; height: 4px; background: #e2e8f0; z-index: 1; }
        .step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; z-index: 2; text-align: center; }
        .node { width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; color: #64748b; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 8px; border: 4px solid white; transition: 0.3s; }
        .step.active .node { background: #3b82f6; color: white; box-shadow: 0 0 0 4px rgba(59,130,246,0.2); }
        .step.alert .node { background: #ef4444 !important; color: white !important; }
        .step span { font-size: 13px; font-weight: 500; color: #64748b; }
        .step.active span { color: #1e293b; font-weight: 600; }
        
        .documents-section { background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 20px; border: 1px solid #f1f5f9; }
        .doc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 12px; }
        .doc-box { display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; gap: 12px; position: relative; }
        .doc-icon { width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .doc-icon.ack { background: #eff6ff; color: #3b82f6; }
        .doc-icon.comp { background: #ecfdf5; color: #10b981; }
        
        .doc-meta { flex: 1; min-width: 0; }
        .doc-meta h5 { margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #1e293b; }
        .doc-meta p { margin: 0; font-size: 11px; color: #64748b; whiteSpace: nowrap; overflow: hidden; textOverflow: ellipsis; }
        
        .doc-download-btn { background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 4px; }
        .doc-download-btn:hover { background: #1d4ed8; }
        
        .doc-status-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .doc-status-badge.pending { background: #fef3c7; color: #d97706; }
        
        .action-required { background: #fdf2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; }
        .fix-btn { background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; }
        
        .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
