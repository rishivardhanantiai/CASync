"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function GstRegistrationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GstRegistrationPageContent />
    </Suspense>
  );
}

function GstRegistrationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const srId = searchParams.get("srId");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [businessType, setBusinessType] = useState("");
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [existingDocs, setExistingDocs] = useState([]);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!(user && loggedIn));

    if (editId) {
      fetch(`/api/admin/service-requests/details?id=${editId}&type=GST_REGISTRATION`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBusinessType(data.data.businessType || "");
            setExistingDocs(data.data.documents || []);
            setTimeout(() => {
              const form = document.getElementById("gstRegistrationForm");
              if (form) {
                form.firmGstNo.value = data.data.gstNumber || "";
                form.firmName.value = data.data.firmName || "";
                form.mainPerson.value = data.data.mainPerson || "";
                form.address.value = data.data.address || "";
                form.panNo.value = data.data.panNo || "";
                form.udyamNo.value = data.data.udyamNo || "";
                form.bankAccNo.value = data.data.bankAccNo || "";
                form.ifscCode.value = data.data.ifscCode || "";
              }
            }, 100);
          }
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
  }, [editId]);

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

  async function uploadFiles(files, userEmail) {
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
          uploaderId: userEmail,
          uploaderName: userEmail.split("@")[0],
          clientEmail: userEmail,
          title: `GST Registration Doc: ${file.name}`,
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
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    const loggedInUser = currentUser?.email;
    if (!loggedInUser) { alert("User not logged in!"); return; }

    try {
      const uploadedDocIds = await uploadFiles(documents, loggedInUser);
      const finalDocs = [...existingDocs, ...uploadedDocIds];

      const formData = new FormData(event.currentTarget);
      const gstData = {
        gstNumber: String(formData.get("firmGstNo") || ""),
        firmName: String(formData.get("firmName") || ""),
        businessType: String(formData.get("businessType") || ""),
        mainPerson: String(formData.get("mainPerson") || ""),
        address: String(formData.get("address") || ""),
        panNo: String(formData.get("panNo") || ""),
        udyamNo: String(formData.get("udyamNo") || ""),
        bankAccNo: String(formData.get("bankAccNo") || ""),
        ifscCode: String(formData.get("ifscCode") || ""),
        documents: finalDocs,
        userEmail: loggedInUser
      };

      if (editId) {
        const res = await fetch("/api/gst-registration", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...gstData }),
        });
        const data = await res.json();
        if (data.success && srId) {
          await fetch("/api/client/resubmit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: srId, clientNotes: "Details updated via full form edit." })
          });
          alert("Registration Updated & Resubmitted Successfully!");
          router.push("/dashboard");
        } else if (data.success) {
          alert("GST Registration Updated Successfully!");
        } else alert("Error: " + data.message);
      } else {
        const res = await fetch("/api/gst-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gstData),
        });
        const data = await res.json();
        if (data.success) {
          alert("GST Registration Saved Successfully!");
          event.target.reset();
          setBusinessType("");
          setDocuments([]);
        } else alert("Error: " + data.message);
      }
    } catch { alert("Something went wrong!"); }
  }

  if (isLoading) return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Loading your details...</div>;

  return (
    <>
      <SiteHeader />
      <ClientBlueBar isLoggedIn={isLoggedIn} />
      <main className="main-content">
        <div className="page">
          <div className="form-container">
            <h2>{editId ? "Edit" : "New"} GST Registration</h2>
            <form id="gstRegistrationForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="firmGstNo">Firm GST Number *</label>
                <input type="text" id="firmGstNo" name="firmGstNo" pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}" title="Enter valid GST number (15 characters)" required />
              </div>
              <div className="form-group">
                <label htmlFor="firmName">Firm Name *</label>
                <input type="text" id="firmName" name="firmName" required />
              </div>
              <div className="form-group">
                <label htmlFor="businessType">Business Type *</label>
                <select id="businessType" name="businessType" required value={businessType} onChange={(event) => setBusinessType(event.target.value)}>
                  <option value="">Select Business Type</option>
                  <option value="partner">Partner</option>
                  <option value="proprietor">Proprietor</option>
                  <option value="company">Company</option>
                  <option value="huf">HUF</option>
                  <option value="aop">AOP</option>
                </select>
              </div>
              <div className="additional-fields" style={{ display: businessType ? "block" : "none" }}>
                <div className="form-group"><label htmlFor="mainPerson">Main Person *</label><input type="text" id="mainPerson" name="mainPerson" required /></div>
                <div className="form-group"><label htmlFor="address">Address *</label><input type="text" id="address" name="address" required /></div>
                <div className="form-group"><label htmlFor="panNo">PAN Number *</label><input type="text" id="panNo" name="panNo" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" title="Enter valid PAN number" required /></div>
                <div className="form-group"><label htmlFor="udyamNo">Udyam Aadhaar Number *</label><input type="text" id="udyamNo" name="udyamNo" pattern="[0-9]{12}" title="Enter 12-digit Udyam Aadhaar Number" required /></div>
                <div className="form-group"><label htmlFor="bankAccNo">Bank Account Number *</label><input type="text" id="bankAccNo" name="bankAccNo" pattern="[0-9]{9,18}" title="Enter valid Bank Account Number (9-18 digits)" required /></div>
                <div className="form-group"><label htmlFor="ifscCode">IFSC Code *</label><input type="text" id="ifscCode" name="ifscCode" pattern="[A-Z]{4}0[A-Z0-9]{6}" title="Enter valid IFSC Code" required /></div>
              </div>

              {existingDocs.length > 0 && (
                <div style={{ marginBottom: "15px" }}>
                  <label className="form-label">Existing Documents</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {existingDocs.map((id, i) => (
                      <span key={id} className="badge" style={{ background: "#e2e8f0", color: "#475569", padding: "4px 8px", borderRadius: "4px", fontSize: "11px" }}>Existing Doc {i + 1}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="documents">Upload More Documents (Max 20 total)</label>
                <input type="file" id="documents" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFilesChange} />
                <div id="documentList" className="document-list">
                  {documents.map((file) => (
                    <div className="document-item" key={file.name}>{file.name}</div>
                  ))}
                </div>
              </div>

              <div className="button-group">
                <button type="button" onClick={() => router.back()}>Cancel</button>
                <button type="submit">{editId ? "Update & Resubmit" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
      <style jsx>{`
        .page{background:#e3f2fd;display:flex;justify-content:center;align-items:center;padding:20px;font-family:"Poppins",sans-serif;min-height:calc(100vh - 150px);}
        .form-container{background:white;padding:25px;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.1);width:100%;max-width:600px;border-top:5px solid #007bff;}
        h2{text-align:center;color:#007bff;margin-bottom:20px;}
        .form-group{margin-bottom:15px;}
        .form-group label{display:block;font-weight:600;margin-bottom:5px;color:#333;font-size:14px;}
        .form-group input,.form-group select{width:100%;padding:10px;border:1px solid #b0bec5;border-radius:6px;font-size:14px;transition:0.3s;background:#f8f9fa;}
        .form-group input:focus,.form-group select:focus{border-color:#007bff;outline:none;box-shadow:0 0 5px rgba(0,123,255,0.5);}
        .additional-fields{background:#f1f5f9;padding:15px;border-radius:6px;margin-top:10px;border:1px solid #e2e8f0;}
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
