"use client";

import { useEffect, useRef, useState } from "react";
import InternalNotesPanel from "./InternalNotesPanel";

/**
 * RequestDetailView — Full-page split-panel request viewer.
 *
 * Left panel : submitted form fields + admin notes
 * Right panel: chat with inline file attachments (upload paperclip, download on click)
 */
export default function RequestDetailView({
  request,
  detailsData,
  loadingDetails,
  senderEmail,
  senderName,
  senderRole,
  onClose,
  onDownloadDoc,       // (docId, fileName) => void — used for chat file downloads
  // Upload helper: receives (file) and must return { success, docId } or null
  uploadFileToServer,
  showStatusControls,
  onUpdateStatus,
  theme,
  // Internal Notes props — required for staff-only tab
  authorId,            // logged-in staff member ID
}) {
  const t = theme || {
    bg: "#f1f5f9",
    cardBg: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    muted: "#64748b",
    inputBg: "#ffffff",
    inputBorder: "#e2e8f0",
  };

  const STATUS_LABELS = {
    submitted: { label: "Submitted", bg: "#fef9c3", color: "#a16207" },
    in_progress: { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8" },
    pending_docs: { label: "Pending Docs", bg: "#fee2e2", color: "#b91c1c" },
    completed: { label: "Completed", bg: "#dcfce7", color: "#15803d" },
  };

  const ROLE_COLOR = { admin: "#7c3aed", team: "#0ea5e9", client: "#2563eb" };

  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [attachFile, setAttachFile] = useState(null); // { file, preview }
  const [uploading, setUploading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'notes'
  const chatEndRef = useRef(null);
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  // True when the current user is a staff member (admin or team)
  const isStaff = senderRole === "admin" || senderRole === "team";

  // ── Load & poll messages ────────────────────────────────────────────────────
  async function loadMessages() {
    if (!request?.id) return;
    try {
      const res = await fetch(`/api/service-request/messages?serviceRequestId=${request.id}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch { /* silent */ }
  }

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 10000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── File picker ─────────────────────────────────────────────────────────────
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachFile({ file, name: file.name, size: (file.size / 1024).toFixed(1) + " KB" });
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function clearAttach() {
    setAttachFile(null);
  }

  // ── Send message (text and/or file) ────────────────────────────────────────
  async function sendMessage() {
    if (sending || uploading) return;
    if (!msgText.trim() && !attachFile) return;

    setSending(true);
    let fileId = null;
    let fileName = null;

    // 1. Upload the file first if one is attached
    if (attachFile) {
      setUploading(true);
      try {
        const result = await uploadFileToServer(attachFile.file);
        if (result?.success) {
          fileId = result.docId;
          fileName = attachFile.name;
        }
      } catch { /* silent */ }
      setUploading(false);
    }

    // 2. Post the message
    try {
      const res = await fetch("/api/service-request/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceRequestId: request.id,
          senderEmail,
          senderName,
          senderRole,
          message: msgText.trim(),
          fileId,
          fileName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setMsgText("");
        setAttachFile(null);
      }
    } catch { /* silent */ }

    setSending(false);
  }

  // ── Key handler ─────────────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Download a file attached in chat ────────────────────────────────────────
  function handleDownloadChatFile(msg) {
    if (!msg.fileId || !onDownloadDoc) return;
    onDownloadDoc(msg.fileId, msg.fileName || "attachment");
  }

  const statusInfo = STATUS_LABELS[request?.status] || { label: request?.status, bg: "#f1f5f9", color: "#475569" };
  const SKIP_FIELDS = ["id", "userEmail", "userId", "assignmentId", "documents", "createdAt", "updatedAt"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: t.bg, animation: "rdvFade 0.25s ease" }}>
      <style>{`
        @keyframes rdvFade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .rdv-bubble { max-width:72%; padding:10px 14px; border-radius:12px; font-size:13px; line-height:1.55; word-break:break-word; }
        .rdv-bubble.mine   { background:#2563eb; color:#fff; border-bottom-right-radius:3px; }
        .rdv-bubble.theirs { background:${theme ? "#1e293b" : "#f1f5f9"}; color:${theme ? "#f1f5f9" : "#0f172a"}; border-bottom-left-radius:3px; }
        .rdv-file-card { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; cursor:pointer; transition:opacity .15s; }
        .rdv-file-card:hover { opacity:.82; }
        .rdv-file-card.mine   { background:rgba(255,255,255,0.18); }
        .rdv-file-card.theirs { background:${theme ? "rgba(255,255,255,0.07)" : "#e2e8f0"}; }
        .rdv-field-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px 20px; }
        @media(max-width:700px) { .rdv-field-grid { grid-template-columns:1fr; } }
        .rdv-send-input { transition:border-color .15s; }
        .rdv-send-input:focus { outline:none; border-color:#2563eb !important; }
        .rdv-attach-preview { display:flex; align-items:center; gap:8px; padding:8px 12px; background:${theme ? "#1e293b" : "#f1f5f9"}; border-top:1px solid ${t.border}; font-size:12px; color:${t.muted}; }
        .rdv-icon-btn { background:transparent; border:none; cursor:pointer; padding:6px; border-radius:6px; display:flex; align-items:center; justify-content:center; transition:background .15s; }
        .rdv-icon-btn:hover { background:${theme ? "rgba(255,255,255,0.08)" : "#e2e8f0"}; }
        .rdv-main-layout { flex: 1; display: grid; grid-template-columns: 1fr 380px; min-height: 0; overflow: hidden; position: relative; }
        @media(max-width: 800px) {
          .rdv-main-layout { 
            display: block; 
            overflow-y: auto; 
            height: auto; 
          }
          .rdv-left-panel { 
            padding-bottom: 80px; /* Space for FAB */
          }
          .rdv-right-panel { 
            position: fixed;
            top: 0; right: 0; bottom: 0; left: 0;
            z-index: 1000;
            background: #fff;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-left: none !important;
          }
          .rdv-right-panel.open {
            transform: translateX(0);
          }
          .rdv-fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 28px;
            background: #2563eb;
            color: #fff;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            z-index: 900;
            border: none;
          }
          .rdv-mobile-header {
            display: flex !important;
            align-items: center;
            padding: 12px 16px;
            background: #fff;
            border-bottom: 1px solid ${t.border};
          }
        }
        @media(min-width: 801px) {
          .rdv-fab { display: none; }
          .rdv-mobile-header { display: none; }
        }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: t.cardBg, borderBottom: `1px solid ${t.border}`,
        padding: "13px 22px", display: "flex", alignItems: "center", gap: "14px", flexShrink: 0
      }}>
        <button onClick={onClose} style={{
          background: "transparent", border: `1px solid ${t.border}`, borderRadius: "7px",
          padding: "6px 13px", cursor: "pointer", color: t.muted, fontSize: "13px",
          display: "flex", alignItems: "center", gap: "5px"
        }}>← Back</button>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: t.text }}>
              {request?.id}
            </h2>
            <span style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: statusInfo.bg, color: statusInfo.color }}>
              {statusInfo.label}
            </span>
            <span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 7px", borderRadius: "4px", fontWeight: 600 }}>
              {(request?.serviceType || "").replace(/_/g, " ")}
            </span>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: t.muted }}>
            Client: {request?.userEmail} &nbsp;|&nbsp; Assigned: {request?.assignedToName || "Unassigned"}
          </p>
        </div>

        {/* Status controls for team/admin */}
        {showStatusControls && (
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {request?.status === "submitted" && (
              <button onClick={() => onUpdateStatus(request.id, "in_progress")}
                style={{ padding: "7px 13px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                ▶ Start
              </button>
            )}
            {request?.status === "in_progress" && (<>
              <button onClick={() => onUpdateStatus(request.id, "completed")}
                style={{ padding: "7px 13px", background: "#10b981", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                ✓ Done
              </button>
              <button onClick={() => onUpdateStatus(request.id, "pending_docs")}
                style={{ padding: "7px 13px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                ↩ Return
              </button>
            </>)}
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="rdv-main-layout">

        {/* ── LEFT: Form details ───────────────────────────────────────────── */}
        <div className="rdv-left-panel" style={{ overflowY: "auto", padding: "22px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Return reason */}
          {request?.status === "pending_docs" && request?.adminNotes && (
            <div style={{ background: "#fee2e2", border: "1px solid #ef4444", borderRadius: "10px", padding: "14px 16px" }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#991b1b", fontSize: "13px" }}>⚠ Reason for Return</p>
              <p style={{ margin: "6px 0 0", color: "#991b1b", fontSize: "14px" }}>{request.adminNotes}</p>
            </div>
          )}

          {/* Submitted form fields */}
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "18px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700, color: t.text }}>📋 Submitted Details</h3>
            {loadingDetails ? (
              <p style={{ color: t.muted, fontSize: "13px" }}>Loading details…</p>
            ) : detailsData ? (
              <div className="rdv-field-grid">
                {Object.entries(detailsData)
                  .filter(([k]) => !SKIP_FIELDS.includes(k))
                  .map(([key, val]) => (
                    <div key={key} style={{ gridColumn: key === "address" ? "1 / -1" : "span 1" }}>
                      <p style={{ margin: "0 0 3px", fontSize: "10px", color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      {Array.isArray(val) ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                          {val.length > 0
                            ? val.map((v, i) => (
                              <span key={i} style={{ padding: "2px 7px", background: "#dbeafe", color: "#1e40af", borderRadius: "4px", fontSize: "12px" }}>{v}</span>
                            ))
                            : <span style={{ color: t.muted, fontSize: "13px" }}>—</span>
                          }
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: "13px", color: t.text, fontWeight: 500 }}>
                          {val === null || val === undefined || val === "" ? "—" : String(val)}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ color: t.muted, fontSize: "13px" }}>No submission data found.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat / Internal Notes ──────────────────────────────── */}
        <div className={`rdv-right-panel ${showMobileChat ? "open" : ""}`} style={{ borderLeft: `1px solid ${t.border}`, display: "flex", flexDirection: "column", background: t.cardBg, minHeight: 0 }}>

          {/* Mobile-only header to close panel */}
          <div className="rdv-mobile-header" style={{ display: "none" }}>
            <button onClick={() => setShowMobileChat(false)} style={{ background: "transparent", border: "none", fontSize: "20px", color: t.muted, cursor: "pointer" }}>✕</button>
            <span style={{ marginLeft: "12px", fontWeight: 700, fontSize: "16px" }}>Messages</span>
          </div>

          {/* ── Tab bar ── */}
          <div style={{
            display: "flex",
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0,
            background: t.cardBg,
          }}>
            <button
              onClick={() => setActiveTab("chat")}
              style={{
                flex: 1,
                padding: "11px 8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: activeTab === "chat" ? 700 : 500,
                color: activeTab === "chat" ? "#2563eb" : t.muted,
                borderBottom: activeTab === "chat" ? "2px solid #2563eb" : "2px solid transparent",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              💬 Client Chat
            </button>
            {isStaff && (
              <button
                onClick={() => setActiveTab("notes")}
                style={{
                  flex: 1,
                  padding: "11px 8px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: activeTab === "notes" ? 700 : 500,
                  color: activeTab === "notes" ? "#7c3aed" : t.muted,
                  borderBottom: activeTab === "notes" ? "2px solid #7c3aed" : "2px solid transparent",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                }}
              >
                🔒 Internal Notes
              </button>
            )}
          </div>

          {/* ── Internal Notes Panel ── */}
          {activeTab === "notes" && isStaff && (
            <InternalNotesPanel
              serviceRequestId={request?.id}
              authorId={authorId || senderEmail}
              authorName={senderName}
              theme={theme}
            />
          )}

          {/* ── Chat Panel (display:contents when active, hidden when notes tab) ── */}
          <div style={{ display: activeTab === "chat" ? "contents" : "none" }}>

            {/* Messages list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "20px" }}>
                  <p style={{ color: t.muted, fontSize: "13px", textAlign: "center" }}>
                    No messages yet.<br />Start the conversation below.
                  </p>
                </div>
              ) : messages.map((msg) => {
                const isMe = msg.senderEmail === senderEmail;
                const isFile = !!msg.fileId;

                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    {/* Sender label for other people */}
                    {!isMe && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                          background: ROLE_COLOR[msg.senderRole] || "#64748b",
                          color: "#fff", fontSize: "9px", fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {(msg.senderName || "?")[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: "11px", color: t.muted, fontWeight: 600 }}>
                          {msg.senderName} <span style={{ opacity: 0.55, textTransform: "capitalize" }}>({msg.senderRole})</span>
                        </span>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`rdv-bubble ${isMe ? "mine" : "theirs"}`}>
                      {/* File attachment card */}
                      {isFile && (
                        <div
                          className={`rdv-file-card ${isMe ? "mine" : "theirs"}`}
                          onClick={() => handleDownloadChatFile(msg)}
                          title={`Download ${msg.fileName}`}
                        >
                          <span style={{ fontSize: "20px", flexShrink: 0 }}>📎</span>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                              {msg.fileName || "attachment"}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: "10px", opacity: 0.7 }}>Click to download</p>
                          </div>
                          <span style={{ fontSize: "14px", flexShrink: 0, opacity: 0.8 }}>⬇</span>
                        </div>
                      )}
                      {/* Text body */}
                      {msg.message && <span>{msg.message}</span>}
                    </div>

                    <span style={{ fontSize: "10px", color: t.muted, marginTop: "3px" }}>
                      {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      {new Date(msg.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} style={{ height: "14px" }} />
            </div>

            {/* Attach preview bar */}
            {attachFile && (
              <div className="rdv-attach-preview">
                <span style={{ fontSize: "16px" }}>📎</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {attachFile.name} <span style={{ opacity: 0.6 }}>({attachFile.size})</span>
                </span>
                <button onClick={clearAttach} className="rdv-icon-btn" title="Remove attachment" style={{ color: "#ef4444", fontSize: "15px", fontWeight: 700 }}>✕</button>
              </div>
            )}

            {/* Input row */}
            <div style={{ padding: "10px 12px", borderTop: attachFile ? "none" : `1px solid ${t.border}`, flexShrink: 0 }}>
              {/* Hidden real file input */}
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {/* Paperclip button */}
                <button
                  className="rdv-icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || uploading}
                  title="Attach a file"
                  style={{ color: t.muted, fontSize: "18px", flexShrink: 0 }}
                >
                  📎
                </button>

                {/* Text input */}
                <input
                  className="rdv-send-input"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={attachFile ? "Add a caption (optional)…" : "Type a message…"}
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: "8px",
                    border: `1px solid ${t.inputBorder}`, background: t.inputBg,
                    color: t.text, fontSize: "13px"
                  }}
                />

                {/* Send button */}
                <button
                  onClick={sendMessage}
                  disabled={sending || uploading || (!msgText.trim() && !attachFile)}
                  style={{
                    padding: "9px 15px",
                    background: (sending || uploading || (!msgText.trim() && !attachFile)) ? "#94a3b8" : "#2563eb",
                    color: "#fff", border: "none", borderRadius: "8px",
                    cursor: (sending || uploading || (!msgText.trim() && !attachFile)) ? "not-allowed" : "pointer",
                    fontWeight: 600, fontSize: "13px", flexShrink: 0, transition: "background .15s"
                  }}
                >
                  {uploading ? "⬆" : sending ? "…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile Chat */}
      <button className="rdv-fab" onClick={() => setShowMobileChat(true)}>
        <i className="fas fa-comments"></i>
      </button>
    </div>
  );
}
