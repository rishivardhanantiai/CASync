"use client";

import { useEffect, useRef, useState } from "react";
import InternalNotesPanel from "./InternalNotesPanel";

function parseLegacyPM(rawText) {
  if (!rawText) return { notes: "", tasks: [], missingDocs: [] };
  try {
    const parsed = JSON.parse(rawText);
    if (parsed && typeof parsed === "object" && ("tasks" in parsed || "missingDocs" in parsed || "notes" in parsed)) {
      return { notes: parsed.notes || "", tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [], missingDocs: Array.isArray(parsed.missingDocs) ? parsed.missingDocs : [] };
    }
  } catch (_) {}
  return { notes: rawText, tasks: [], missingDocs: [] };
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getDueState(dueDate, status) {
  if (!dueDate) return { label: "No due date", bg: "#f1f5f9", color: "#64748b" };
  if (status === "completed") return { label: "Completed", bg: "#dcfce7", color: "#15803d" };
  const todayKey = new Date().toISOString().slice(0, 10);
  const dueKey = new Date(dueDate).toISOString().slice(0, 10);
  if (dueKey < todayKey) return { label: "Overdue", bg: "#fee2e2", color: "#b91c1c" };
  if (dueKey === todayKey) return { label: "Due today", bg: "#fef3c7", color: "#b45309" };
  return { label: "Upcoming", bg: "#dbeafe", color: "#1d4ed8" };
}

const STATUS_LABELS = {
  submitted: { label: "Submitted", bg: "#fef9c3", color: "#a16207" },
  in_progress: { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8" },
  pending_review: { label: "Pending Review", bg: "#fef08a", color: "#854d0e" },
  pending_docs: { label: "Pending Docs", bg: "#fee2e2", color: "#b91c1c" },
  completed: { label: "Completed", bg: "#dcfce7", color: "#15803d" },
};

const ROLE_COLOR = { admin: "#7c3aed", team: "#0ea5e9", client: "#64748b", system: "#94a3b8" };
const SKIP_FIELDS = ["id", "userEmail", "userId", "assignmentId", "documents", "createdAt", "updatedAt"];

export default function RequestDetailView({
  request, detailsData, loadingDetails, senderId, senderEmail, senderName, senderRole,
  onClose, onDownloadDoc, uploadFileToServer, showStatusControls, onUpdateStatus, theme, authorId,
  services = [], onUpdateRequestId,
}) {
  const t = theme || { bg: "#f1f5f9", cardBg: "#ffffff", border: "#e2e8f0", text: "#0f172a", muted: "#64748b", inputBg: "#ffffff", inputBorder: "#e2e8f0" };

  const [localRequest, setLocalRequest] = useState(request);
  const [leftTab, setLeftTab] = useState("overview"); 
  const [rightTab, setRightTab] = useState("chat"); 
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isEditingId, setIsEditingId] = useState(false);
  const [editedId, setEditedId] = useState(request?.id || "");

  const [messages, setMessages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [missingDocs, setMissingDocs] = useState([]);
  const [legacyNote, setLegacyNote] = useState("");

  const [newTaskInput, setNewTaskInput] = useState("");
  const [newDocInput, setNewDocInput] = useState("");
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [savingOps, setSavingOps] = useState(false);
  const [attachFile, setAttachFile] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const chatEndRef = useRef(null);
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  const isStaff = senderRole === "admin" || senderRole === "team";
  const isAdmin = senderRole === "admin";
  const actorPayload = { actorId: senderId || senderEmail || null, actorEmail: senderEmail || null, actorName: senderName || senderEmail || "User", actorRole: senderRole || "team" };

  useEffect(() => {
    setLocalRequest(request); setLeftTab("overview"); setRightTab("chat"); setShowMobileChat(false);
    setEditedId(request?.id || "");
    setIsEditingId(false);
  }, [request]);

  async function loadMessages() {
    if (!request?.id) return;
    try {
      const res = await fetch(`/api/service-request/messages?serviceRequestId=${request.id}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch (_) {}
  }

  async function loadOperations() {
    if (!request?.id) return;
    const legacy = parseLegacyPM(request.adminNotes);
    setLegacyNote(legacy.notes || "");
    try {
      const [taskRes, docRes, activityRes] = await Promise.all([
        fetch(`/api/subtasks?serviceRequestId=${request.id}`),
        fetch(`/api/missing-documents?serviceRequestId=${request.id}`),
        fetch(`/api/request-activity?serviceRequestId=${request.id}`),
      ]);
      const [taskData, docData, activityData] = await Promise.all([taskRes.json(), docRes.json(), activityRes.json()]);
      if (taskData.success) {
        const records = taskData.subtasks || [];
        setSubtasks(records.length ? records : legacy.tasks.map((task, idx) => ({ id: `legacy-task-${task.id ?? idx}`, title: task.text || task.title || "Untitled task", isCompleted: Boolean(task.done || task.isCompleted), legacy: true })));
      }
      if (docData.success) {
        const records = docData.missingDocuments || [];
        setMissingDocs(records.length ? records : legacy.missingDocs.map((doc, idx) => ({ id: `legacy-doc-${doc.id ?? idx}`, documentName: doc.text || doc.documentName || "Requested document", status: doc.done ? "received" : "requested", legacy: true })));
      }
      if (activityData.success) setActivities(activityData.activities || []);
    } catch (_) {}
  }

  useEffect(() => {
    loadMessages(); loadOperations();
    pollRef.current = setInterval(loadMessages, 10000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, uploading]);

  function refreshOperationsSoon() { setTimeout(loadOperations, 250); }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachFile({ file, name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
    e.target.value = "";
  }

  function clearAttach() { setAttachFile(null); }

  async function addTask() {
    if (!newTaskInput.trim() || savingOps || !localRequest?.id) return;
    setSavingOps(true);
    try {
      const res = await fetch("/api/subtasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceRequestId: localRequest.id, title: newTaskInput.trim(), ...actorPayload }),
      });
      const data = await res.json();
      if (data.success) { setSubtasks((prev) => [...prev.filter((item) => !item.legacy), data.subtask]); setNewTaskInput(""); refreshOperationsSoon(); }
    } catch (_) {}
    setSavingOps(false);
  }

  async function toggleTask(task) {
    if (task.legacy || savingOps) {
      if (task.legacy) { setSubtasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, isCompleted: !item.isCompleted } : item))); }
      return;
    }
    setSavingOps(true);
    try {
      const res = await fetch("/api/subtasks", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, isCompleted: !task.isCompleted, ...actorPayload }),
      });
      const data = await res.json();
      if (data.success) { setSubtasks((prev) => prev.map((item) => (item.id === task.id ? data.subtask : item))); refreshOperationsSoon(); }
    } catch (_) {}
    setSavingOps(false);
  }

  async function addMissingDoc() {
    if (!newDocInput.trim() || savingOps || !localRequest?.id) return;
    setSavingOps(true);
    try {
      const res = await fetch("/api/missing-documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceRequestId: localRequest.id, documentName: newDocInput.trim(), ...actorPayload }),
      });
      const data = await res.json();
      if (data.success) { setMissingDocs((prev) => [...prev.filter((item) => !item.legacy), data.missingDocument]); setNewDocInput(""); refreshOperationsSoon(); }
    } catch (_) {}
    setSavingOps(false);
  }

  async function toggleMissingDoc(doc) {
    if (doc.legacy || savingOps) {
      if (doc.legacy) { setMissingDocs((prev) => prev.map((item) => item.id === doc.id ? { ...item, status: item.status === "received" ? "requested" : "received" } : item)); }
      return;
    }
    const nextStatus = doc.status === "received" ? "requested" : "received";
    setSavingOps(true);
    try {
      const res = await fetch("/api/missing-documents", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, status: nextStatus, ...actorPayload }),
      });
      const data = await res.json();
      if (data.success) { setMissingDocs((prev) => prev.map((item) => (item.id === doc.id ? data.missingDocument : item))); refreshOperationsSoon(); }
    } catch (_) {}
    setSavingOps(false);
  }

  async function updateStatus(newStatus, note = undefined) {
    if (!localRequest?.id) return;
    const next = { ...localRequest, status: newStatus };
    setLocalRequest(next);
    await onUpdateStatus?.(localRequest.id, newStatus, note);
    refreshOperationsSoon();
  }

  async function sendMessage() {
    if (sending || uploading || !request?.id) return;
    if (!msgText.trim() && !attachFile) return;
    setSending(true);
    
    let fileId = null; let fileName = null;
    
    if (attachFile) {
      setUploading(true);
      try {
        const result = await uploadFileToServer?.(attachFile.file);
        if (result?.success) { fileId = result.docId; fileName = attachFile.name; }
      } catch (_) {}
      setUploading(false);
    }
    
    try {
      const payloadMessage = msgText.trim() || (attachFile ? "📎 Shared a document" : "");
      
      const res = await fetch("/api/service-request/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceRequestId: request.id, senderEmail, senderName, senderRole, message: payloadMessage, fileId, fileName }),
      });
      const data = await res.json();
      if (data.success) { setMessages((prev) => [...prev, data.message]); setMsgText(""); setAttachFile(null); }
    } catch (_) {}
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function handleDownloadChatFile(msg) {
    if (!msg.fileId || !onDownloadDoc) return;
    onDownloadDoc(msg.fileId, msg.fileName || "attachment");
  }

  // ✅ Admin Only: Delete Chat Message & Document Completely
  async function handleDeleteMessage(msgId, fileId) {
    if (!isAdmin) return;
    if (!confirm("Delete this message completely? This action cannot be undone.")) return;
    try {
      // Optimistically remove from UI
      setMessages(prev => prev.filter(m => m.id !== msgId));
      
      // If there's a file, deleting the document handles the message cleanup (via your route.js logic)
      if (fileId) {
         await fetch("/api/documents/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: fileId }) });
      } else {
         // Otherwise, we just delete the raw message from the DB
         await fetch("/api/service-request/messages", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: msgId }) });
      }
    } catch (e) {
      alert("Failed to delete message");
      loadMessages(); // reload if failed
    }
  }

  const currentRequest = localRequest || request;
  const statusInfo = STATUS_LABELS[currentRequest?.status] || { label: currentRequest?.status || "-", bg: "#f1f5f9", color: "#475569" };
  const dueInfo = getDueState(currentRequest?.dueDate, currentRequest?.status);
  const canCheck = senderRole === "admin" || (senderRole === "team" && currentRequest?.reviewerId && currentRequest.reviewerId === senderId);
  const completeTasks = subtasks.filter((item) => item.isCompleted).length;
  const pendingDocs = missingDocs.filter((item) => item.status !== "received" && item.status !== "waived").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: t.bg, animation: "rdvFade 0.25s ease" }}>
      <style>{`
        @keyframes rdvFade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .rdv-bubble { max-width: 78%; padding: 12px 16px; border-radius: 18px; font-size: 13.5px; line-height: 1.5; word-break: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.05); position: relative; }
        .rdv-file-card { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:10px; cursor:pointer; transition:all .2s ease; margin-bottom: 6px; }
        .rdv-file-card:hover { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .rdv-field-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px 20px; }
        @media(max-width:700px) { .rdv-field-grid { grid-template-columns:1fr; } }
        .rdv-send-input:focus { outline:none; border-color:#2563eb !important; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important; }
        .rdv-attach-preview { display:flex; align-items:center; gap:10px; padding:10px 16px; background:${theme?.cardBg || "#ffffff"}; border-top:1px solid ${t.border}; font-size:13px; color:${t.text}; font-weight: 500; }
        .rdv-icon-btn { background:transparent; border:none; cursor:pointer; padding:8px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition:background .15s; }
        .rdv-icon-btn:hover { background:${theme ? "rgba(255,255,255,0.08)" : "#f1f5f9"}; }
        .rdv-main-layout { flex:1; display:grid; grid-template-columns:1fr 420px; min-height:0; overflow:hidden; position:relative; }
        @media(max-width: 900px) {
          .rdv-main-layout { display:block; overflow-y:auto; height:auto; }
          .rdv-left-panel { padding-bottom:80px; }
          .rdv-right-panel { position:fixed; top:0; right:0; bottom:0; left:0; z-index:1000; background:${t.bg}; transform:translateX(100%); transition:transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-left:none !important; }
          .rdv-right-panel.open { transform:translateX(0); }
          .rdv-fab { position:fixed; bottom:24px; right:24px; width:56px; height:56px; border-radius:28px; background:#2563eb; color:#fff; box-shadow:0 4px 12px rgba(37, 99, 235, 0.4); display:flex; align-items:center; justify-content:center; font-size:24px; cursor:pointer; z-index:900; border:none; }
          .rdv-mobile-header { display:flex !important; align-items:center; padding:16px; background:${t.cardBg}; border-bottom:1px solid ${t.border}; }
        }
        @media(min-width: 901px) { .rdv-fab { display:none; } .rdv-mobile-header { display:none; } }
      `}</style>

      <div style={{ background: t.cardBg, borderBottom: `1px solid ${t.border}`, padding: "13px 22px", display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: "7px", padding: "6px 13px", cursor: "pointer", color: t.muted, fontSize: "13px", display: "flex", alignItems: "center", gap: "5px" }}>← Back</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {isEditingId ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input 
                  type="text" 
                  value={editedId} 
                  onChange={e => setEditedId(e.target.value)} 
                  style={{ padding: "4px 8px", fontSize: "13px", border: `1px solid ${t.border}`, borderRadius: "6px", background: t.inputBg, color: t.text, outline: "none", width: "160px" }}
                />
                <button 
                  onClick={async () => {
                    if (editedId.trim() && editedId.trim() !== currentRequest?.id) {
                      await onUpdateRequestId?.(currentRequest.id, editedId.trim());
                    }
                    setIsEditingId(false);
                  }} 
                  style={{ padding: "4px 8px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                >
                  ✓ Save
                </button>
                <button 
                  onClick={() => { setEditedId(currentRequest?.id); setIsEditingId(false); }} 
                  style={{ padding: "4px 8px", background: "transparent", border: `1px solid ${t.border}`, color: t.muted, borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: t.text }}>{currentRequest?.id}</h2>
                {(senderRole === "admin" || (services && services.includes("permission_editRequestId"))) && (
                  <button 
                    onClick={() => setIsEditingId(true)} 
                    style={{ background: "transparent", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 600 }}
                    title="Change Request ID Manually"
                  >
                    ✏️ Edit ID
                  </button>
                )}
              </div>
            )}
            <span style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>
            <span style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: dueInfo.bg, color: dueInfo.color }}>{dueInfo.label}</span>
            <span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 7px", borderRadius: "4px", fontWeight: 700 }}>{(currentRequest?.serviceType || "").replace(/_/g, " ")}</span>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: t.muted }}>
            Client: {currentRequest?.clientName || currentRequest?.userEmail} | Maker: {currentRequest?.assignedToName || "Unassigned"} | Checker: {currentRequest?.reviewerName || "Not assigned"}
          </p>
        </div>

        {showStatusControls && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {senderRole === "team" && currentRequest?.status === "submitted" && (
              <button onClick={() => updateStatus("in_progress")} style={primaryBtn("#2563eb")}>Start</button>
            )}
            {senderRole === "team" && ["in_progress", "pending_docs"].includes(currentRequest?.status) && (
              <button onClick={() => updateStatus("pending_review")} style={primaryBtn("#d97706")}>Submit for Review</button>
            )}
            {canCheck && currentRequest?.status === "pending_review" && (
              <>
                <button onClick={() => updateStatus("completed")} style={primaryBtn("#10b981")}>Approve</button>
                <button onClick={() => updateStatus("in_progress")} style={primaryBtn("#ef4444")}>Return to Maker</button>
              </>
            )}
            {senderRole === "admin" && currentRequest?.status !== "completed" && currentRequest?.status !== "pending_review" && (
              <button onClick={() => updateStatus("completed")} style={primaryBtn("#10b981")}>Complete</button>
            )}
            {currentRequest?.status !== "completed" && (
              <button onClick={() => updateStatus("pending_docs")} style={primaryBtn("#f59e0b")}>Needs Docs</button>
            )}
          </div>
        )}
      </div>

      <div className="rdv-main-layout">
        <div className="rdv-left-panel" style={{ overflowY: "auto", padding: "22px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => setLeftTab("overview")} style={tabBtn(leftTab === "overview", t)}>Overview</button>
            <button onClick={() => setLeftTab("activity")} style={tabBtn(leftTab === "activity", t)}>Activity ({activities.length})</button>
          </div>

          {leftTab === "overview" ? (
            <>
              {currentRequest?.status === "pending_docs" && legacyNote && (
                <div style={{ background: "#fee2e2", border: "1px solid #ef4444", borderRadius: "10px", padding: "14px 16px" }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "#991b1b", fontSize: "13px" }}>Reason for return</p>
                  <p style={{ margin: "6px 0 0", color: "#991b1b", fontSize: "14px" }}>{legacyNote}</p>
                </div>
              )}

              {isStaff && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <OpsCard title="Task Checklist" sub={`${completeTasks}/${subtasks.length} completed`} theme={t}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                      {subtasks.length === 0 ? (
                        <span style={{ fontSize: "12px", color: t.muted }}>No tasks added yet.</span>
                      ) : (
                        subtasks.map((task) => (
                          <label key={task.id} style={checkRowStyle(t)}>
                            <input type="checkbox" checked={Boolean(task.isCompleted)} onChange={() => toggleTask(task)} style={{ width: "16px", height: "16px", accentColor: "#0ea5e9" }} />
                            <span style={{ flex: 1, fontSize: "13px", color: task.isCompleted ? t.muted : t.text, textDecoration: task.isCompleted ? "line-through" : "none" }}>{task.title}</span>
                            {task.legacy && <small style={{ color: t.muted }}>legacy</small>}
                          </label>
                        ))
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input value={newTaskInput} onChange={(e) => setNewTaskInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="Add a task" style={inputStyle(t)} />
                      <button onClick={addTask} disabled={savingOps} style={miniBtn("#0ea5e9")}>Add</button>
                    </div>
                  </OpsCard>

                  <OpsCard title="Missing Documents" sub={`${pendingDocs} pending`} theme={t}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                      {missingDocs.length === 0 ? (
                        <span style={{ fontSize: "12px", color: t.muted }}>No missing documents requested.</span>
                      ) : (
                        missingDocs.map((doc) => {
                          const received = doc.status === "received" || doc.status === "waived";
                          return (
                            <label key={doc.id} style={checkRowStyle(t)}>
                              <input type="checkbox" checked={received} onChange={() => toggleMissingDoc(doc)} style={{ width: "16px", height: "16px", accentColor: "#f59e0b" }} />
                              <span style={{ flex: 1, fontSize: "13px", color: received ? t.muted : t.text, textDecoration: received ? "line-through" : "none" }}>{doc.documentName}</span>
                              <span style={{ padding: "2px 7px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, background: received ? "#dcfce7" : "#fee2e2", color: received ? "#15803d" : "#b91c1c" }}>{received ? "received" : "pending"}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input value={newDocInput} onChange={(e) => setNewDocInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMissingDoc()} placeholder="Request a document" style={inputStyle(t)} />
                      <button onClick={addMissingDoc} disabled={savingOps} style={miniBtn("#f59e0b")}>Add</button>
                    </div>
                  </OpsCard>
                </div>
              )}

              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "18px" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700, color: t.text }}>Submitted Client Details</h3>
                {loadingDetails ? (
                  <p style={{ color: t.muted, fontSize: "13px" }}>Loading details...</p>
                ) : detailsData ? (
                  <div className="rdv-field-grid">
                    {Object.entries(detailsData).filter(([key]) => !SKIP_FIELDS.includes(key)).map(([key, val]) => (
                      <div key={key} style={{ gridColumn: key === "address" ? "1 / -1" : "span 1" }}>
                        <p style={{ margin: "0 0 3px", fontSize: "10px", color: t.muted, fontWeight: 700, textTransform: "uppercase" }}>{key.replace(/([A-Z])/g, " $1").trim()}</p>
                        {Array.isArray(val) ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                            {val.length > 0 ? val.map((v, i) => <span key={i} style={{ padding: "2px 7px", background: "#dbeafe", color: "#1e40af", borderRadius: "4px", fontSize: "12px" }}>{v}</span>) : <span style={{ color: t.muted, fontSize: "13px" }}>-</span>}
                          </div>
                        ) : (
                          <p style={{ margin: 0, fontSize: "13px", color: t.text, fontWeight: 500, wordBreak: "break-word" }}>{val === null || val === "" || val === undefined ? "-" : String(val)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: t.muted, fontSize: "13px" }}>No submission data found.</p>
                )}
              </div>
            </>
          ) : (
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: `1px solid ${t.border}` }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: t.text }}>Immutable Activity Log</h3>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: t.muted }}>Every workflow update recorded for accountability.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {activities.length === 0 ? (
                  <p style={{ padding: "24px", color: t.muted, margin: 0, fontSize: "13px" }}>No activity recorded yet.</p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: "12px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#eef2ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", flexShrink: 0 }}>
                        {(activity.actorName || "S").slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                          <p style={{ margin: 0, color: t.text, fontWeight: 700, fontSize: "13px" }}>{activity.description}</p>
                          <span style={{ color: t.muted, fontSize: "11px", whiteSpace: "nowrap" }}>{formatDateTime(activity.createdAt)}</span>
                        </div>
                        <p style={{ margin: "3px 0 0", color: t.muted, fontSize: "12px" }}>
                          {activity.actorName || "System"} {activity.actorRole ? `(${activity.actorRole})` : ""} - {String(activity.action || "").replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── CHAT PANEL ───────────────────────────────────────────────────────── */}
        <div className={`rdv-right-panel ${showMobileChat ? "open" : ""}`} style={{ borderLeft: `1px solid ${t.border}`, display: "flex", flexDirection: "column", background: t.cardBg, minHeight: 0 }}>
          <div className="rdv-mobile-header">
            <button onClick={() => setShowMobileChat(false)} style={{ background: "transparent", border: "none", fontSize: "20px", color: t.muted, cursor: "pointer", padding: "0 8px 0 0" }}>←</button>
            <span style={{ fontWeight: 700, fontSize: "16px", color: t.text }}>Messages</span>
          </div>

          <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, flexShrink: 0, background: t.cardBg }}>
            <button onClick={() => setRightTab("chat")} style={{ ...sideTabBtn(rightTab === "chat", t), flex: 1 }}>💬 Client Chat</button>
            {isStaff && <button onClick={() => setRightTab("notes")} style={{ ...sideTabBtn(rightTab === "notes", t, "#7c3aed"), flex: 1 }}>🔒 Internal Notes</button>}
          </div>

          {rightTab === "notes" && isStaff ? (
            <InternalNotesPanel serviceRequestId={request?.id} authorId={authorId || senderId || senderEmail} authorName={senderName} theme={theme} uploadFileToServer={uploadFileToServer} />
          ) : (
            <div style={{ display: "contents" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {messages.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.5 }}>👋</div>
                    <p style={{ color: t.muted, fontSize: "13px", textAlign: "center", margin: 0 }}>No messages yet.<br />Start the conversation below.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderEmail === senderEmail;
                    const isFile = !!msg.fileId;
                    const showMenu = openMenuId === msg.id;

                    // Modern dynamic styling for bubbles
                    const bubbleStyle = isMe 
                      ? { background: msg.senderRole === "admin" ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", borderBottomRightRadius: "4px" }
                      : { background: t.inputBg, border: `1px solid ${t.border}`, color: t.text, borderBottomLeftRadius: "4px" };

                    return (
                      <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", position: "relative" }}>
                        {!isMe && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", paddingLeft: "2px" }}>
                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, background: ROLE_COLOR[msg.senderRole] || ROLE_COLOR.system, color: "#fff", fontSize: "9px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {(msg.senderName || "?")[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: "11px", color: t.muted, fontWeight: 600 }}>{msg.senderName} <span style={{ opacity: 0.6, textTransform: "capitalize", fontWeight: 400 }}>({msg.senderRole})</span></span>
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: isMe ? "row-reverse" : "row" }}>
                          {/* Chat Bubble */}
                          <div className="rdv-bubble" style={bubbleStyle}>
                            {isFile && (
                              <div className="rdv-file-card" onClick={() => handleDownloadChatFile(msg)} title={`Download ${msg.fileName || "attachment"}`}
                                   style={{ background: isMe ? "rgba(255,255,255,0.15)" : (theme ? "rgba(255,255,255,0.05)" : "#f1f5f9") }}>
                                <span style={{ fontSize: "24px", flexShrink: 0 }}>📄</span>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.fileName || "Attachment"}</p>
                                  <p style={{ margin: "2px 0 0", fontSize: "10px", opacity: 0.8 }}>Click to download</p>
                                </div>
                                <span style={{ fontSize: "16px", opacity: 0.9, marginLeft: "4px" }}>⬇</span>
                              </div>
                            )}
                            {msg.message && <div style={{ marginTop: isFile ? "4px" : "0" }}>{msg.message}</div>}
                          </div>

                          {/* ✅ 3-Dot Context Menu (Admins Only) */}
                          {isAdmin && (
                            <div style={{ position: "relative" }}>
                              <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(showMenu ? null : msg.id); }} style={{ background: "transparent", border: "none", color: t.muted, cursor: "pointer", fontSize: "18px", padding: "4px 8px", borderRadius: "50%", opacity: 0.6 }}>⋮</button>
                              {showMenu && (
                                <div style={{ 
                                  position: "absolute", 
                                  ...(isMe ? { left: 0 } : { right: 0 }),
                                  top: "100%", 
                                  marginTop: "4px",
                                  background: t.cardBg, 
                                  border: `1px solid ${t.border}`, 
                                  borderRadius: "8px", 
                                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)", 
                                  zIndex: 9999, 
                                  overflow: "hidden", 
                                  minWidth: "160px" 
                                }}>
                                  {isFile && (
                                    <button onClick={() => { setOpenMenuId(null); handleDownloadChatFile(msg); }} style={{ width: "100%", padding: "10px 16px", background: "transparent", border: "none", color: t.text, fontSize: "13px", cursor: "pointer", fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}>
                                      ⬇ Download File
                                    </button>
                                  )}
                                  <button onClick={() => { setOpenMenuId(null); handleDeleteMessage(msg.id, msg.fileId); }} style={{ width: "100%", padding: "10px 16px", background: "transparent", border: "none", color: "#ef4444", fontSize: "13px", cursor: "pointer", fontWeight: 600, textAlign: "left", borderTop: isFile ? `1px solid ${t.border}` : "none", display: "flex", alignItems: "center", gap: "8px" }}>
                                    🗑 Delete Message
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <span style={{ fontSize: "10px", color: t.muted, marginTop: "4px", padding: isMe ? "0 4px 0 0" : "0 0 0 28px" }}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                )}
                {uploading && (
                  <div style={{ display: "flex", alignItems: "flex-end", flexDirection: "column", opacity: 0.7 }}>
                     <div className="rdv-bubble" style={{ background: "linear-gradient(135deg, #94a3b8, #64748b)", color: "#fff", borderBottomRightRadius: "4px" }}>
                        <span style={{ fontSize: "13px", display: "flex", gap: "8px", alignItems: "center" }}>
                          <svg className="animate-spin" style={{ width: "16px", height: "16px", color: "white" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Uploading file...
                        </span>
                     </div>
                  </div>
                )}
                <div ref={chatEndRef} style={{ height: "4px" }} />
              </div>

              {attachFile && (
                <div className="rdv-attach-preview">
                  <span style={{ fontSize: "20px", color: "#2563eb" }}>📄</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachFile.name} <span style={{ opacity: 0.6, fontSize: "11px" }}>({attachFile.size})</span></span>
                  <button onClick={clearAttach} className="rdv-icon-btn" title="Remove attachment" style={{ color: "#ef4444", fontSize: "16px", fontWeight: 700 }}>✕</button>
                </div>
              )}

              <div style={{ padding: "14px 16px", borderTop: attachFile ? "none" : `1px solid ${t.border}`, background: t.cardBg, flexShrink: 0 }}>
                <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelect} />
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button className="rdv-icon-btn" onClick={() => fileInputRef.current?.click()} disabled={sending || uploading} title="Attach a file" style={{ color: t.muted, fontSize: "20px", flexShrink: 0, padding: "8px" }}>📎</button>
                  <input className="rdv-send-input" value={msgText} onChange={(e) => setMsgText(e.target.value)} onKeyDown={handleKeyDown} placeholder={attachFile ? "Add a caption (optional)..." : "Type a message..."} style={{ flex: 1, padding: "11px 16px", borderRadius: "24px", border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.text, fontSize: "14px", minWidth: 0 }} />
                  <button onClick={sendMessage} disabled={sending || uploading || (!msgText.trim() && !attachFile)} style={{ padding: "10px 18px", background: sending || uploading || (!msgText.trim() && !attachFile) ? "#94a3b8" : "#2563eb", color: "#fff", border: "none", borderRadius: "24px", cursor: sending || uploading || (!msgText.trim() && !attachFile) ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px", flexShrink: 0, transition: "all .2s ease" }}>
                    {uploading ? "⬆" : sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button className="rdv-fab" onClick={() => setShowMobileChat(true)} type="button">💬</button>
    </div>
  );
}

function primaryBtn(bg) { return { padding: "7px 13px", background: bg, color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }; }
function tabBtn(active, theme) { return { padding: "8px 13px", borderRadius: "8px", border: `1px solid ${active ? "#2563eb" : theme.border}`, background: active ? "#2563eb" : theme.cardBg, color: active ? "#fff" : theme.text, cursor: "pointer", fontSize: "13px", fontWeight: 700 }; }
function sideTabBtn(active, theme, activeColor = "#2563eb") { return { padding: "11px 8px", border: "none", background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: active ? 700 : 500, color: active ? activeColor : theme.muted, borderBottom: active ? `2px solid ${activeColor}` : "2px solid transparent", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }; }
function miniBtn(bg) { return { padding: "7px 11px", background: bg, color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }; }
function inputStyle(theme) { return { flex: 1, minWidth: 0, padding: "7px 10px", fontSize: "12px", border: `1px solid ${theme.inputBorder}`, borderRadius: "7px", background: theme.inputBg, color: theme.text }; }
function checkRowStyle(theme) { return { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "7px 8px", border: `1px solid ${theme.border}`, borderRadius: "8px", background: theme.inputBg }; }
function OpsCard({ title, sub, theme, children }) { return ( <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "16px", minWidth: 0 }}> <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "baseline", marginBottom: "12px" }}> <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: theme.text }}>{title}</h3> <span style={{ color: theme.muted, fontSize: "12px", fontWeight: 700 }}>{sub}</span> </div> {children} </div> ); }