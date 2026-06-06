"use client";

/**
 * RequestFilterBar — Advanced reusable filter + search bar for service request tables.
 *
 * Props:
 *   filters       {object}   — current filter state: { search, status, serviceType, assignedTo }
 *   onChange      {function} — (updatedFilters) => void
 *   teamMembers   {Array}    — [{ id, name }] for the Assigned To dropdown (optional)
 *   theme         {object}   — dashboard theme tokens
 *   dark          {boolean}  — dark-mode flag
 *   showAssigned  {boolean}  — show Assigned To filter (Admin only)
 *   resultCount   {number}   — how many results match (shown as a badge)
 *   totalCount    {number}   — total before filtering
 */

// All known service types in CASync
const SERVICE_TYPES = [
  { value: "all",               label: "All Services" },
  { value: "GST_REGISTRATION",  label: "GST Registration" },
  { value: "GST_RETURN",        label: "GST Return" },
  { value: "ITR",               label: "Income Tax Return" },
  { value: "PAN",               label: "PAN" },
  { value: "IT_QUERY",          label: "IT Query" },
  { value: "FILE_RETURN",       label: "File Return" },
  { value: "COMPANY",           label: "Company" },
  { value: "FIRM",              label: "Firm" },
  { value: "UDHYAM",            label: "Udhyam" },
];

const STATUS_OPTIONS = [
  { value: "all",          label: "All Status" },
  { value: "submitted",    label: "Submitted" },
  { value: "in_progress",  label: "In Progress" },
  { value: "pending_docs", label: "Pending Docs" },
  { value: "completed",    label: "Completed" },
];

export const DEFAULT_FILTERS = {
  search:      "",
  status:      "all",
  serviceType: "all",
  assignedTo:  "all",
};

/** Returns true if any filter is active (non-default). */
export function hasActiveFilters(filters) {
  return (
    filters.search.trim() !== "" ||
    filters.status      !== "all" ||
    filters.serviceType !== "all" ||
    filters.assignedTo  !== "all"
  );
}

/**
 * Pure filtering function — apply all filters to a list of requests.
 * Call this in the component that holds the data.
 */
export function applyRequestFilters(requests, filters) {
  const { search, status, serviceType, assignedTo } = filters;
  const s = search.trim().toLowerCase();

  return requests.filter(r => {
    // Search: ID, client name, service type
    const matchSearch = !s ||
      (r.id              || "").toLowerCase().includes(s) ||
      (r.clientName      || "").toLowerCase().includes(s) ||
      (r.serviceType     || "").toLowerCase().includes(s) ||
      (r.assignedToName  || "").toLowerCase().includes(s) ||
      (r.userEmail       || "").toLowerCase().includes(s);

    // Status filter
    const matchStatus = status === "all" || r.status === status;

    // Service type filter — partial match so "GST" matches both GST variants
    const matchService = serviceType === "all" ||
      (r.serviceType || "").toUpperCase() === serviceType.toUpperCase() ||
      (r.serviceType || "").toUpperCase().includes(serviceType.toUpperCase());

    // Assigned To filter (by assignedToId or assignedToName)
    const matchAssigned = assignedTo === "all" ||
      r.assignedToId   === assignedTo ||
      r.assignedToName === assignedTo;

    return matchSearch && matchStatus && matchService && matchAssigned;
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RequestFilterBar({
  filters = DEFAULT_FILTERS,
  onChange,
  teamMembers = [],
  theme = {},
  dark = false,
  showAssigned = false,
  resultCount,
  totalCount,
}) {
  const t = {
    cardBg: "#ffffff", border: "#e2e8f0", text: "#0f172a",
    muted: "#64748b", inputBg: "#ffffff", inputBorder: "#e2e8f0",
    ...theme,
  };

  function set(key, val) {
    onChange({ ...filters, [key]: val });
  }

  function clearAll() {
    onChange({ ...DEFAULT_FILTERS });
  }

  const active = hasActiveFilters(filters);

  const selectStyle = {
    padding: "9px 12px",
    border: `1px solid ${t.inputBorder}`,
    borderRadius: "8px",
    background: t.inputBg,
    color: t.text,
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
    minWidth: "140px",
  };

  return (
    <div style={{
      background: t.cardBg,
      border: `1px solid ${active ? "#2563eb" : t.border}`,
      borderRadius: "12px",
      padding: "14px 18px",
      marginBottom: "20px",
      transition: "border-color 0.2s",
    }}>
      {/* Row 1: search + selects + clear */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>

        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: "200px" }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: t.muted, fontSize: "14px", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Search by ID, client, service…"
            value={filters.search}
            onChange={e => set("search", e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 32px",
              border: `1px solid ${t.inputBorder}`,
              borderRadius: "8px",
              background: t.inputBg,
              color: t.text,
              fontSize: "13px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {filters.search && (
            <button
              onClick={() => set("search", "")}
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "14px", padding: "2px" }}
            >✕</button>
          )}
        </div>

        {/* Status */}
        <select value={filters.status} onChange={e => set("status", e.target.value)} style={selectStyle}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Service Type */}
        <select value={filters.serviceType} onChange={e => set("serviceType", e.target.value)} style={selectStyle}>
          {SERVICE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Assigned To (Admin only) */}
        {showAssigned && (
          <select value={filters.assignedTo} onChange={e => set("assignedTo", e.target.value)} style={selectStyle}>
            <option value="all">All Members</option>
            <option value="__unassigned__">Unassigned</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}

        {/* Clear Filters */}
        {active && (
          <button
            onClick={clearAll}
            style={{
              padding: "9px 14px",
              background: dark ? "rgba(239,68,68,0.15)" : "#fee2e2",
              color: "#b91c1c",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Row 2: active filter chips + result count */}
      {(active || resultCount !== undefined) && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "10px" }}>
          {/* Active filter chips */}
          {filters.status !== "all" && (
            <Chip label={`Status: ${filters.status.replace("_", " ")}`} onRemove={() => set("status", "all")} dark={dark} />
          )}
          {filters.serviceType !== "all" && (
            <Chip label={`Service: ${filters.serviceType.replace(/_/g, " ")}`} onRemove={() => set("serviceType", "all")} dark={dark} />
          )}
          {filters.assignedTo !== "all" && (
            <Chip
              label={`Assigned: ${filters.assignedTo === "__unassigned__" ? "Unassigned" : (teamMembers.find(m => m.id === filters.assignedTo)?.name || filters.assignedTo)}`}
              onRemove={() => set("assignedTo", "all")}
              dark={dark}
            />
          )}

          {/* Result count */}
          {resultCount !== undefined && totalCount !== undefined && (
            <span style={{
              marginLeft: "auto",
              fontSize: "12px",
              color: t.muted,
              fontWeight: 500,
            }}>
              Showing <strong style={{ color: t.text }}>{resultCount}</strong> of <strong style={{ color: t.text }}>{totalCount}</strong> requests
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Filter Chip (internal) ────────────────────────────────────────────────────
function Chip({ label, onRemove, dark }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "2px 10px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 600,
      background: dark ? "rgba(37,99,235,0.2)" : "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #93c5fd",
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#1d4ed8", fontSize: "11px", padding: 0, lineHeight: 1, fontWeight: 700 }}
      >✕</button>
    </span>
  );
}
