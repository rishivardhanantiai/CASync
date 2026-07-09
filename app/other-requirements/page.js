"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function OtherRequirementsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OtherRequirementsContent />
    </Suspense>
  );
}

function OtherRequirementsContent() {
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
    requirementType: "Trade Mark",
    otherRequirementText: "",
    contactPersonName: "",
    email: "",
    phone: ""
  });

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
      fetch(`/api/admin/service-requests/details?id=${editId}&type=OTHER_REQUIREMENTS`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFormValues({
              requirementType: data.data.requirementType || "Trade Mark",
              otherRequirementText: data.data.otherRequirementText || "",
              contactPersonName: data.data.contactPerson || "",
              email: data.data.email || "",
              phone: data.data.phone || ""
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
          title: `Other Req Doc: ${file.name}`,
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
          type: "OTHER_REQUIREMENTS",
          data: formData
        })
      });

      const result = await res.json();
      if (result.success) {
        if (editId && srId) {
          await fetch("/api/client/resubmit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: srId, clientNotes: "Other requirements request updated." })
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
            <h2>{editId ? "Edit" : "Other"} Requirements Form</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="requirementType">Requirement Type *</label>
                <select
                  id="requirementType"
                  required
                  value={formValues.requirementType}
                  onChange={(e) => setFormValues(prev => ({ ...prev, requirementType: e.target.value, otherRequirementText: e.target.value === "Other" ? prev.otherRequirementText : "" }))}
                >
                  <option value="Trade Mark">Trade Mark</option>
                  <option value="ESIPF">ESIPF</option>
                  <option value="Project Report">Project Report</option>
                  <option value="TDS">TDS</option>
                  <option value="Civil Consultancy">Civil Consultancy</option>
                  <option value="Pollution Control">Pollution Control</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {formValues.requirementType === "Other" && (
                <div className="form-group">
                  <label htmlFor="otherRequirementText">Describe Your Requirement *</label>
                  <textarea
                    id="otherRequirementText"
                    required
                    rows={4}
                    value={formValues.otherRequirementText}
                    onChange={(e) => setFormValues(prev => ({ ...prev, otherRequirementText: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #b0bec5", background: "#f8f9fa", resize: "vertical" }}
                  />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="contactPersonName">Contact Person Name *</label>
                <input
                  type="text"
                  id="contactPersonName"
                  required
                  value={formValues.contactPersonName}
                  onChange={(e) => setFormValues(prev => ({ ...prev, contactPersonName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email ID *</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formValues.email}
                  onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  required
                  pattern="[0-9]{10}"
                  title="10 digit phone number"
                  value={formValues.phone}
                  onChange={(e) => setFormValues(prev => ({ ...prev, phone: e.target.value }))}
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
                  {editId ? "Update & Resubmit" : "Submit Requirement"}
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
