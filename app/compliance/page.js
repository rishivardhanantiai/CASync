"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function CompliancePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComplianceContent />
    </Suspense>
  );
}

function ComplianceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const srId = searchParams.get("srId");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [existingDocs, setExistingDocs] = useState([]);
  const [agreed, setAgreed] = useState(false);

  const [formValues, setFormValues] = useState({
    companyName: "",
    details: "",
    queryText: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  async function handleCompanySearch(val) {
    setSearchQuery(val);
    setFormValues(prev => ({ ...prev, companyName: val }));
    if (!val) {
      setSearchResults([]);
      setSelectedCompany(null);
      return;
    }
    try {
      const res = await fetch(`/api/company?email=${encodeURIComponent(userEmail)}&search=${encodeURIComponent(val)}`);
      const json = await res.json();
      if (json.success) {
        setSearchResults(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleSelectCompany(comp) {
    setSelectedCompany(comp);
    setFormValues(prev => ({
      ...prev,
      companyName: comp.companyName
    }));
    setSearchResults([]);
    setSearchQuery(comp.companyName);
  }

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!(user && loggedIn));

    const currentUser = JSON.parse(user || "null");
    if (currentUser?.email) {
      setUserEmail(currentUser.email);
    } else if (loggedIn) {
      router.replace("/login");
    }

    if (editId) {
      fetch(`/api/admin/service-requests/details?id=${editId}&type=COMPLIANCE`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFormValues({
              companyName: data.data.companyName || "",
              details: data.data.details || "",
              queryText: data.data.queryText || ""
            });
            setExistingDocs(data.data.documents || []);
          }
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
  }, [editId, router]);

  function handleFilesChange(event) {
    const files = Array.from(event.target.files || []);
    if (files.length > 20) {
      alert("You can upload a maximum of 20 documents.");
      event.target.value = "";
      setDocuments([]);
      return;
    }
    setDocuments(files);
  }

  async function uploadFiles(files, email) {
    const uploadedIds = [];
    for (const file of files) {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          mimeType: file.type,
          uploader: "client",
          uploaderId: email,
          uploaderName: email.split("@")[0],
          clientEmail: email,
          title: `Compliance Doc: ${file.name}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        uploadedIds.push(data.document.id);
      }
    }
    return uploadedIds;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!agreed) {
      alert("Please agree to the disclaimer.");
      return;
    }

    try {
      const uploadedDocIds = await uploadFiles(documents, userEmail);
      const finalDocs = [...existingDocs, ...uploadedDocIds];

      const formData = {
        ...formValues,
        userEmail,
        documents: finalDocs
      };

      const res = await fetch("/api/client/submit-form", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          type: "COMPLIANCE",
          data: formData
        })
      });

      const result = await res.json();
      if (result.success) {
        if (editId && srId) {
          await fetch("/api/client/resubmit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: srId, clientNotes: "Compliance details updated." })
          });
        }
        alert(result.message);
        router.push("/dashboard");
      } else {
        alert("Error: " + result.message);
      }
    } catch (err) {
      alert("Submission failed!");
    }
  }

  if (isLoading) return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Loading your details...</div>;

  return (
    <>
      <SiteHeader />
      <ClientBlueBar isLoggedIn={isLoggedIn} />
      <main className="main-content">
        <div className="page">
          <div className="form-container">
            <h2>{editId ? "Edit" : "Company"} Compliance</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ position: "relative" }}>
                <label htmlFor="companyName">Search Company Name *</label>
                <input
                  type="text"
                  id="companyName"
                  required
                  placeholder="Type to search your registered companies..."
                  value={formValues.companyName}
                  onChange={(e) => handleCompanySearch(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    zIndex: 10,
                    maxHeight: "150px",
                    overflowY: "auto",
                    marginTop: "4px"
                  }}>
                    {searchResults.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => handleSelectCompany(comp)}
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          borderBottom: "1px solid #f1f5f9",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#1e293b"
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#f1f5f9"}
                        onMouseLeave={(e) => e.target.style.background = "none"}
                      >
                        {comp.companyName} ({comp.companyRegNo || "New Registration"})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail as per company name add */}
              {selectedCompany && (
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "20px"
                }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 700, color: "#475569" }}>
                    <i className="fas fa-info-circle" style={{ marginRight: 6 }} /> Detail as per company name add
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#64748b" }}>
                    <div><strong>Registration No / CIN:</strong> {selectedCompany.companyRegNo || "New Registration"}</div>
                    <div><strong>Contact Person:</strong> {selectedCompany.contactPerson || "N/A"}</div>
                    <div><strong>Email:</strong> {selectedCompany.email || "N/A"}</div>
                    <div><strong>Phone:</strong> {selectedCompany.phone || "N/A"}</div>
                    {selectedCompany.address && <div style={{ gridColumn: "span 2" }}><strong>Address:</strong> {selectedCompany.address}</div>}
                  </div>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="details">Details of Compliance *</label>
                <textarea
                  id="details"
                  required
                  rows={4}
                  value={formValues.details}
                  onChange={(e) => setFormValues(prev => ({ ...prev, details: e.target.value }))}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #b0bec5", background: "#f8f9fa", resize: "vertical" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="queryText">Query Text (Optional)</label>
                <textarea
                  id="queryText"
                  rows={3}
                  value={formValues.queryText}
                  onChange={(e) => setFormValues(prev => ({ ...prev, queryText: e.target.value }))}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #b0bec5", background: "#f8f9fa", resize: "vertical" }}
                />
              </div>

              {existingDocs.length > 0 && (
                <div style={{ marginBottom: "15px" }}>
                  <label className="form-label">Existing Documents</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {existingDocs.map((id, i) => (
                      <span key={id} className="badge" style={{ background: "#e2e8f0", color: "#475569", padding: "4px 8px", borderRadius: "4px", fontSize: "11px" }}>Doc {i + 1}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="documents">Upload Documents (Max 20)</label>
                <input type="file" id="documents" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFilesChange} />
                {documents.length > 0 && (
                  <div className="document-list">
                    {documents.map((file) => (
                      <div className="document-item" key={file.name}>{file.name}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="form-group checkbox-item" style={{ marginTop: "20px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <input type="checkbox" id="disclaimer" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: "auto", marginTop: "4px" }} />
                <label htmlFor="disclaimer" style={{ display: "inline", margin: 0, fontWeight: 500, fontSize: "14px", cursor: "pointer", color: "#475569" }}>
                  I agree that all the details provided above are correct to the best of my knowledge. I understand that filing with incorrect details may lead to penalties or rejection.
                </label>
              </div>

              <div className="button-group">
                <button type="button" onClick={() => router.back()}>Cancel</button>
                <button type="submit" disabled={!agreed} style={{ opacity: agreed ? 1 : 0.6, cursor: agreed ? "pointer" : "not-allowed" }}>
                  {editId ? "Update & Resubmit" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
      <style jsx>{`
        .page{background:#e3f2fd;display:flex;justify-content:center;align-items:flex-start;padding:40px 20px;font-family:"Poppins",sans-serif;min-height:calc(100vh - 150px);}
        .form-container{background:white;padding:25px;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.1);width:100%;max-width:600px;border-top:5px solid #007bff;}
        h2{text-align:center;color:#007bff;margin-bottom:20px;}
        .form-group{margin-bottom:15px;}
        .form-group label{display:block;font-weight:600;margin-bottom:5px;color:#333;font-size:14px;}
        .form-group input,.form-group select{width:100%;padding:10px;border:1px solid #b0bec5;border-radius:6px;font-size:14px;transition:0.3s;background:#f8f9fa;}
        .form-group input:focus,.form-group select:focus{border-color:#007bff;outline:none;box-shadow:0 0 5px rgba(0,123,255,0.5);}
        .button-group{display:flex;justify-content:space-between;margin-top:20px;gap:12px;}
        .button-group button{flex:1;padding:10px 15px;border:none;border-radius:6px;cursor:pointer;font-size:16px;transition:0.3s;font-weight:600;}
        .button-group button:first-child{background:#94a3b8;color:white;}
        .button-group button:last-child{background:#007bff;color:white;}
        .button-group button:hover{opacity:0.8;}
        .document-list{margin-top:10px;padding:10px;border:1px solid #b0bec5;border-radius:6px;background:#f8f9fa;min-height:40px;}
        .document-item{padding:5px;background:white;border:1px solid #e2e8f0;border-radius:4px;margin-bottom:5px;font-size:12px;}
        .badge{display:inline-block;margin-right:5px;}
        @media (max-width: 480px) {
          .button-group { flex-direction: column; }
          .button-group button { width: 100%; }
        }
      `}</style>
    </>
  );
}
