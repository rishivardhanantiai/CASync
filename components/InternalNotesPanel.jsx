"use client";

import { useEffect, useRef, useState } from "react";

/**
 * InternalNotesPanel — Private staff-only notes for a service request.
 *
 * Props:
 *   serviceRequestId  {string}   — The request this panel belongs to.
 *   authorId          {string}   — ID of the currently logged-in staff member.
 *   authorName        {string}   — Display name of the logged-in staff member.
 *   theme             {object}   — Dashboard theme tokens (t.cardBg, t.border, …).
 */
export default function InternalNotesPanel({
  serviceRequestId,
  authorId,
  authorName,
  theme,
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

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const bottomRef = useRef(null);

  // ── Fetch notes ─────────────────────────────────────────────────────────────
  async function fetchNotes() {
    if (!serviceRequestId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/internal-notes?serviceRequestId=${serviceRequestId}`
      );
      const data = await res.json();
      if (data.success) {
        setNotes(data.notes);
      } else {
        setError(data.message || "Failed to load notes.");
      }
    } catch {
      setError("Network error. Could not load notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceRequestId]);

  // Scroll to bottom when notes update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  // ── Post a new note ──────────────────────────────────────────────────────────
  async function handleAddNote() {
    if (!content.trim() || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch("/api/internal-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceRequestId,
          authorId,
          authorName,
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => [...prev, data.note]);
        setContent("");
      } else {
        setPostError(data.message || "Failed to add note.");
      }
    } catch {
      setPostError("Network error. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddNote();
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + " · " + d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function authorInitial(name) {
    return (name || "?")[0].toUpperCase();
  }

  // Simple colour based on first char
  const AVATAR_COLORS = [
    "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
    "#ec4899", "#6366f1", "#14b8a6",
  ];
  function avatarColor(name) {
    const code = (name || "A").charCodeAt(0);
    return AVATAR_COLORS[code % AVATAR_COLORS.length];
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: t.cardBg,
    }}>

      <style>{`
        @keyframes noteFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .inp-note {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .inp-note-card {
          animation: noteFadeIn 0.22s ease both;
          display: flex;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid ${t.border};
        }
        .inp-note-card:last-child { border-bottom: none; }
        .inp-note-textarea {
          width: 100%;
          resize: none;
          border: 1px solid ${t.inputBorder};
          border-radius: 8px;
          background: ${t.inputBg};
          color: ${t.text};
          font-size: 13px;
          padding: 10px 12px;
          line-height: 1.55;
          font-family: inherit;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .inp-note-textarea:focus {
          outline: none;
          border-color: #7c3aed;
        }
        .inp-note-btn {
          padding: 9px 18px;
          background: #7c3aed;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s;
          align-self: flex-end;
        }
        .inp-note-btn:hover:not(:disabled) { background: #6d28d9; }
        .inp-note-btn:disabled { background: #94a3b8; cursor: not-allowed; }
      `}</style>

      {/* Panel header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: `1px solid ${t.border}`,
        flexShrink: 0,
      }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: t.text }}>
          🔒 Internal Notes
        </h3>
        <p style={{ margin: "2px 0 0", fontSize: "11px", color: t.muted }}>
          Visible to Admin &amp; Team only — not shared with clients.
        </p>
      </div>

      {/* Notes list */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <p style={{ color: t.muted, fontSize: "13px" }}>Loading notes…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "12px",
          }}>
            <p style={{ margin: 0, color: "#b91c1c", fontSize: "13px" }}>
              ⚠ {error}
            </p>
            <button
              onClick={fetchNotes}
              style={{
                marginTop: "8px",
                background: "transparent",
                border: "1px solid #f87171",
                borderRadius: "6px",
                color: "#b91c1c",
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && notes.length === 0 && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            paddingBottom: "20px",
          }}>
            <span style={{ fontSize: "36px" }}>📝</span>
            <p style={{ color: t.muted, fontSize: "13px", textAlign: "center", margin: 0 }}>
              No internal notes yet.<br />Add the first one below.
            </p>
          </div>
        )}

        {/* Notes */}
        {!loading && notes.map((note) => {
          const isMe = note.authorId === authorId;
          return (
            <div key={note.id} className="inp-note-card">
              {/* Avatar */}
              <div style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: avatarColor(note.authorName),
                color: "#fff",
                fontWeight: 700,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {authorInitial(note.authorName)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "5px" }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: t.text }}>
                    {note.authorName}
                    {isMe && (
                      <span style={{
                        marginLeft: "6px",
                        fontSize: "10px",
                        background: "#ede9fe",
                        color: "#7c3aed",
                        padding: "1px 6px",
                        borderRadius: "10px",
                        fontWeight: 600,
                      }}>
                        You
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: "11px", color: t.muted }}>{formatDate(note.createdAt)}</span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: "13px",
                  color: t.text,
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "#faf5ff",
                  border: "1px solid #ede9fe",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}>
                  {note.content}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} style={{ height: "8px" }} />
      </div>

      {/* Add note area */}
      <div style={{
        padding: "12px 16px",
        borderTop: `1px solid ${t.border}`,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}>
        {postError && (
          <p style={{ margin: 0, color: "#ef4444", fontSize: "12px" }}>⚠ {postError}</p>
        )}
        <textarea
          className="inp-note-textarea"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a private note… (Ctrl+Enter to submit)"
          disabled={posting}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", color: t.muted }}>
            🔒 Only visible to staff
          </span>
          <button
            className="inp-note-btn"
            onClick={handleAddNote}
            disabled={!content.trim() || posting}
          >
            {posting ? "Saving…" : "Add Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
