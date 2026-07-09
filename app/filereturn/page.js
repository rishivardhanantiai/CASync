"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";
import Toast from "@/components/Toast";

export default function FileReturnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FileReturnPageContent />
    </Suspense>
  );
}

function FileReturnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const srId = searchParams.get("srId");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(!!editId);
  const [existingDocs, setExistingDocs] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [formValues, setFormValues] = useState({
    panSearch: "",
    pan: "",
    name: "",
    fatherName: "",
    dob: "",
    mobileNo: "",
    email: "",
    incomeType: "",
    address: "",
    bankAccount: "",
    ifscCode: "",
    financialYear: "2022-23",
    assessmentYear: "2023-24",
    otherIncome: "",
    aadharNo: ""
  });

  const [checks, setChecks] = useState({
    landSale: false,
    housingRent: false,
    salary: false,
    business: false,
    agriculture: false,
    other: false
  });

  const [form16, setForm16] = useState(null);
  const [otherDocs, setOtherDocs] = useState([]);
  const [agreed, setAgreed] = useState(false);
  
  // Custom manual override state for PAN search
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [searchStatus, setSearchStatus] = useState({ success: null, message: "" });

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
      fetch(`/api/admin/service-requests/details?id=${editId}&type=ITR`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const d = data.data;
            setFormValues({
              panSearch: d.pan || "",
              pan: d.pan || "",
              name: d.name || "",
              fatherName: d.fatherName || "",
              dob: d.dob || "",
              mobileNo: d.mobileNo || "",
              email: d.email || "",
              incomeType: d.incomeType || "",
              address: d.address || "",
              bankAccount: d.bankAccount || "",
              ifscCode: d.ifscCode || "",
              financialYear: d.financialYear || "2022-23",
              assessmentYear: d.assessmentYear || "2023-24",
              otherIncome: d.otherIncome || "",
              aadharNo: d.aadharNo || ""
            });
            setChecks({
              landSale: !!d.landSale,
              housingRent: !!d.housingRent,
              salary: !!d.salary,
              business: !!d.business,
              agriculture: !!d.agriculture,
              other: !!d.other
            });
            setExistingDocs(d.documents || []);
            setIsManualEntry(true); // Allow manual editing during form updates
          }
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
  }, [editId, router]);

  async function handlePanSearch(value) {
    setFormValues((current) => ({ ...current, panSearch: value }));
    if (value.length < 10) {
      setSearchStatus({ success: null, message: "" });
      setIsManualEntry(false);
      return;
    }
    try {
      const res = await fetch(`/api/add-pan?pan=${value.toUpperCase()}`);
      const data = await res.json();
      if (!data.success || !data.data) {
        setFormValues((current) => ({
          ...current,
          pan: value.toUpperCase(),
          name: "", fatherName: "", dob: "",
          mobileNo: "", email: "", incomeType: "", address: ""
        }));
        setIsManualEntry(true);
        setSearchStatus({
          success: false,
          message: "PAN not found. You can enter details manually below."
        });
        return;
      }
      const match = data.data;
      setFormValues((current) => ({
        ...current,
        panSearch: value.toUpperCase(),
        pan: match.pan || "",
        name: [match.name, match.middleName, match.lastName].filter(Boolean).join(" "),
        fatherName: match.fatherName || "",
        dob: match.dob || "",
        mobileNo: match.mobileNo || "",
        email: match.email || "",
        incomeType: match.incomeType || "",
        address: match.address || ""
      }));
      setIsManualEntry(false);
      setSearchStatus({
        success: true,
        message: "PAN details auto-filled successfully!"
      });
    } catch (err) {
      console.error("PAN search failed:", err);
    }
  }

  async function uploadFileHelper(file, userEmail, title) {
    if (!file) return null;
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
        title: title || `ITR Doc: ${file.name}`,
      }),
    });
    const data = await res.json();
    return data.success ? data.document.id : null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const form16Id = await uploadFileHelper(form16, userEmail, "Form 16");
      const otherIds = [];
      for (const f of otherDocs) {
        const id = await uploadFileHelper(f, userEmail, `ITR Other: ${f.name}`);
        if (id) otherIds.push(id);
      }

      const submissionData = {
        ...formValues,
        userEmail,
        landSale: checks.landSale ? 1 : 0,
        housingRent: checks.housingRent ? 1 : 0,
        salary: checks.salary ? 1 : 0,
        business: checks.business ? 1 : 0,
        agriculture: checks.agriculture ? 1 : 0,
        other: checks.other ? 1 : 0,
        documents: [...existingDocs, form16Id, ...otherIds].filter(Boolean)
      };

      if (editId) {
        const response = await fetch("/api/file-return", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...submissionData })
        });
        const result = await response.json();
        if (result.success && srId) {
          await fetch("/api/client/resubmit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: srId, clientNotes: "Details updated via full form edit." })
          });
          setToast({ show: true, message: "ITR Updated & Resubmitted Successfully!", type: "success" });
          setTimeout(() => router.push("/dashboard"), 1500);
        } else if (result.success) {
          setToast({ show: true, message: "ITR Updated Successfully!", type: "success" });
          setTimeout(() => router.push("/dashboard"), 1500);
        } else {
          setToast({ show: true, message: `Error: ${result.message}`, type: "error" });
        }
      } else {
        const response = await fetch("/api/file-return", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData)
        });
        const result = await response.json();
        if (result.success) {
          setToast({ show: true, message: result.message, type: "success" });
          setTimeout(() => router.push("/dashboard"), 1500);
        } else {
          setToast({ show: true, message: `Error: ${result.message}`, type: "error" });
        }
      }
    } catch { 
      setToast({ show: true, message: "Something went wrong!", type: "error" });
    }
  }

  if (isLoading) return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Loading your details...</div>;

  return (
    <>
      <SiteHeader />
      <ClientBlueBar isLoggedIn={isLoggedIn} />
      <main className="main-content">
        <div className="container">
          <div className="form-container">
            <h2>{editId ? "Edit" : "File"} Return</h2>
            <p>Email: <span>{userEmail}</span></p>
            <div className="form-group">
              <label htmlFor="panSearch">Search PAN:</label>
              <input type="text" id="panSearch" placeholder="Enter PAN to search" value={formValues.panSearch} onChange={(e) => handlePanSearch(e.target.value)} />
              
              {searchStatus.message && (
                <div style={{
                  marginTop: "10px",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  background: searchStatus.success ? "#dcfce7" : "#fee2e2",
                  color: searchStatus.success ? "#166534" : "#991b1b",
                  border: `1px solid ${searchStatus.success ? "#bbf7d0" : "#fecaca"}`
                }}>
                  <i className={`fas ${searchStatus.success ? "fa-check-circle" : "fa-info-circle"}`} style={{ marginRight: 6 }} />
                  {searchStatus.message}
                </div>
              )}
            </div>
            <form id="fileReturnForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>PAN *</label>
                <input
                  type="text"
                  required
                  readOnly={!isManualEntry}
                  value={formValues.pan}
                  onChange={(e) => setFormValues((c) => ({ ...c, pan: e.target.value.toUpperCase() }))}
                  placeholder={isManualEntry ? "Enter PAN Number" : "Search PAN first to auto-fill"}
                />
              </div>
              <div className="form-group"><label>Aadhar Number *</label><input type="text" required pattern="[0-9]{12}" title="Enter valid 12-digit Aadhar Number" value={formValues.aadharNo} onChange={(e) => setFormValues((c) => ({ ...c, aadharNo: e.target.value }))} /></div>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  required
                  readOnly={!isManualEntry}
                  value={formValues.name}
                  onChange={(e) => setFormValues((c) => ({ ...c, name: e.target.value }))}
                  placeholder={isManualEntry ? "Enter Full Name" : "Search PAN first to auto-fill"}
                />
              </div>
              <div className="form-group">
                <label>Father's Name</label>
                <input
                  type="text"
                  readOnly={!isManualEntry}
                  value={formValues.fatherName}
                  onChange={(e) => setFormValues((c) => ({ ...c, fatherName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="text"
                  readOnly={!isManualEntry}
                  value={formValues.dob}
                  onChange={(e) => setFormValues((c) => ({ ...c, dob: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="text"
                  readOnly={!isManualEntry}
                  value={formValues.mobileNo}
                  onChange={(e) => setFormValues((c) => ({ ...c, mobileNo: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="text"
                  readOnly={!isManualEntry}
                  value={formValues.email}
                  onChange={(e) => setFormValues((c) => ({ ...c, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Income Type</label>
                <input
                  type="text"
                  readOnly={!isManualEntry}
                  value={formValues.incomeType}
                  onChange={(e) => setFormValues((c) => ({ ...c, incomeType: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  readOnly={!isManualEntry}
                  value={formValues.address}
                  onChange={(e) => setFormValues((c) => ({ ...c, address: e.target.value }))}
                />
              </div>

              <div className="form-group"><label>Bank Account Number</label><input type="text" required value={formValues.bankAccount} onChange={(e) => setFormValues((c) => ({ ...c, bankAccount: e.target.value }))} /></div>
              <div className="form-group"><label>IFSC Code</label><input type="text" required value={formValues.ifscCode} onChange={(e) => setFormValues((c) => ({ ...c, ifscCode: e.target.value }))} /></div>

              <div className="form-group">
                <label>Financial Year</label>
                <select required value={formValues.financialYear} onChange={(e) => setFormValues((c) => ({ ...c, financialYear: e.target.value }))}>
                  <option value="2022-23">2022-23</option>
                  <option value="2023-24">2023-24</option>
                  <option value="2024-25">2024-25</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assessment Year</label>
                <select required value={formValues.assessmentYear} onChange={(e) => setFormValues((c) => ({ ...c, assessmentYear: e.target.value }))}>
                  <option value="2023-24">2023-24</option>
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                </select>
              </div>

              <h3>During the Year</h3>
              <div className="checkbox-group">
                {[
                  ["landSale", "Land Sale"], ["housingRent", "Housing Rent"], ["salary", "Salary"],
                  ["business", "Business"], ["agriculture", "Agriculture"], ["other", "Other"]
                ].map(([key, label]) => (
                  <div className="checkbox-item" key={key}>
                    <input type="checkbox" id={key} checked={checks[key]} onChange={(e) => setChecks((c) => ({ ...c, [key]: e.target.checked }))} />
                    <label htmlFor={key}>{label}</label>
                  </div>
                ))}
              </div>

              <div className={`other-input ${checks.other ? "show" : ""}`}>
                <input type="text" placeholder="Specify other income source" value={formValues.otherIncome} onChange={(e) => setFormValues((c) => ({ ...c, otherIncome: e.target.value }))} />
              </div>

              {existingDocs.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "10px" }}>Existing Documents</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {existingDocs.map((id, i) => (
                      <span key={id} style={{ background: "#e2e8f0", color: "#475569", padding: "4px 10px", borderRadius: "100px", fontSize: "12px" }}>Doc {i + 1}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="attachment-section">
                <div className="form-group"><label>Update Form 16</label><input type="file" id="form16" onChange={(e) => setForm16(e.target.files[0])} /></div>
                <div className="form-group"><label>Upload More Documents (Max 20 total)</label><input type="file" id="otherDocs" multiple onChange={(e) => setOtherDocs(Array.from(e.target.files).slice(0, 20))} /></div>
              </div>

              {/* Disclaimer */}
              <div className="form-group checkbox-item" style={{ marginTop: "20px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <input type="checkbox" id="disclaimer" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: "auto", marginTop: "4px" }} />
                <label htmlFor="disclaimer" style={{ display: "inline", margin: 0, fontWeight: 500, fontSize: "14px", cursor: "pointer", color: "#475569" }}>
                  I agree that all the details provided above are correct to the best of my knowledge. I understand that filing with incorrect details may lead to penalties or rejection.
                </label>
              </div>

              <div className="button-group">
                <button type="submit" className="save-btn" disabled={!agreed} style={{ opacity: agreed ? 1 : 0.6, cursor: agreed ? "pointer" : "not-allowed" }}>{editId ? "Update & Resubmit" : "Save"}</button>
                <button type="button" className="back-btn" onClick={() => router.push("/dashboard")}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />

      <style jsx>{`
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-container { background-color: var(--white); padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
        .form-group input, .form-group select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; transition: border-color 0.3s; }
        .form-group input:focus, .form-group select:focus { border-color: var(--secondary-color); outline: none; }
        input:read-only { background-color: #eaeaea; cursor: not-allowed; }
        .checkbox-group { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin: 15px 0; }
        .checkbox-item { display: flex; align-items: center; gap: 5px; }
        .checkbox-item input { width: auto; }
        .other-input { margin-top: 10px; display: none; }
        .other-input.show { display: block; }
        .attachment-section { margin-top: 30px; }
        .button-group { display: flex; gap: 15px; margin-top: 30px; justify-content: center; }
        .save-btn, .back-btn { padding: 12px 30px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; min-width: 120px; }
        .save-btn { background-color: var(--secondary-color); color: var(--white); }
        .save-btn:hover { background-color: #2980b9; }
        .back-btn { background-color: var(--accent-color); color: var(--white); }
        .back-btn:hover { background-color: #c0392b; }
        
        @media (max-width: 480px) {
          .checkbox-group { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
          .button-group { flex-direction: column; }
          .save-btn, .back-btn { width: 100%; }
        }
      `}</style>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
    </>
  );
}