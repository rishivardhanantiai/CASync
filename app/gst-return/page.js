"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function GstReturnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GstReturnPageContent />
    </Suspense>
  );
}

function GstReturnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const srId = searchParams.get("srId");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [selectedGst, setSelectedGst] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [month, setMonth] = useState("");
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [existingDocs, setExistingDocs] = useState([]);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!(user && loggedIn));

    if (editId) {
      fetch(`/api/admin/service-requests/details?id=${editId}&type=GST_RETURN`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSelectedGst(data.data.gstNumber || "");
            setFinancialYear(data.data.financialYear || "");
            setMonth(data.data.month || "");
            setExistingDocs(data.data.documents || []);
          }
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
  }, [editId]);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    const email = currentUser?.email;

    if (!email) {
      alert("User not logged in! Redirecting...");
      router.replace("/login");
      return;
    }

    setLoggedInUser(email);

    // ✅ Fetch GST registrations from API instead of localStorage
    async function fetchRegistrations() {
      try {
        const res = await fetch("/api/gst-registration");
        const data = await res.json();
        if (data.success) {
          // Filter only current user's registrations
          const userGSTs = data.data.filter((gst) => gst.userEmail === email);
          if (userGSTs.length === 0) {
            alert("No GST Registrations found. Please register first.");
          }
          setRegistrations(userGSTs);
        }
      } catch (err) {
        console.error("Failed to fetch GST registrations:", err);
      }
    }

    fetchRegistrations();
  }, [router]);

  const selectedRegistration = useMemo(
    () => registrations.find((entry) => entry.gstNumber === selectedGst),
    [registrations, selectedGst]
  );

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
          title: `GST Return Doc: ${file.name}`,
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
    try {
      const uploadedDocIds = await uploadFiles(documents, loggedInUser);
      const finalDocs = [...existingDocs, ...uploadedDocIds];

      const gstReturnData = {
        userEmail: loggedInUser,
        gstNumber: selectedGst,
        businessName: selectedRegistration?.firmName || "",
        state: selectedRegistration?.address || "",
        mainPerson: selectedRegistration?.mainPerson || "",
        panNo: selectedRegistration?.panNo || "",
        financialYear,
        month,
        documents: finalDocs,
      };

      if (editId) {
        // UPDATE MODE
        const res = await fetch("/api/gst-return", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...gstReturnData }),
        });
        const data = await res.json();

        if (data.success && srId) {
          await fetch("/api/client/resubmit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: srId, clientNotes: "Details updated via full form edit." })
          });
          alert("Return Updated & Resubmitted Successfully!");
          router.push("/dashboard");
        } else if (data.success) {
          alert("GST Return Updated Successfully!");
        } else alert("Error: " + data.message);
      } else {
        // CREATE MODE
        const res = await fetch("/api/gst-return", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gstReturnData),
        });
        const data = await res.json();
        if (data.success) {
          alert("GST Return submitted successfully!");
          event.target.reset();
          setSelectedGst("");
          setFinancialYear("");
          setMonth("");
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
            <h2>{editId ? "Edit" : "Submit"} GST Return</h2>
            <div id="errorContainer" className="error-message" />
            {loggedInUser ? <p>{`Logged in as: ${loggedInUser}`}</p> : null}
            <form id="gstReturnForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="gstRegistration">Select GST Registration:</label>
                <select
                  id="gstRegistration"
                  required
                  value={selectedGst}
                  onChange={(event) => setSelectedGst(event.target.value)}
                  disabled={registrations.length === 0}
                >
                  <option value="">Select GST Registration</option>
                  {registrations.map((gst) => (
                    <option key={gst.gstNumber} value={gst.gstNumber}>
                      {`${gst.gstNumber} - ${gst.firmName}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="businessName">Business Name:</label>
                <input type="text" id="businessName" readOnly value={selectedRegistration?.firmName || ""} />
              </div>
              <div className="form-group">
                <label htmlFor="state">State:</label>
                <input type="text" id="state" readOnly value={selectedRegistration?.address || ""} />
              </div>
              <div className="form-group">
                <label htmlFor="mainPerson">Main Person:</label>
                <input type="text" id="mainPerson" readOnly value={selectedRegistration?.mainPerson || ""} />
              </div>
              <div className="form-group">
                <label htmlFor="panNo">PAN Number:</label>
                <input type="text" id="panNo" readOnly value={selectedRegistration?.panNo || ""} />
              </div>

              <div className="form-group">
                <label htmlFor="financialYear">Financial Year:</label>
                <select id="financialYear" required value={financialYear} onChange={(event) => setFinancialYear(event.target.value)}>
                  <option value="">Select Financial Year</option>
                  <option value="2024-25">2024-25</option>
                  <option value="2023-24">2023-24</option>
                  <option value="2022-23">2022-23</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="month">Month:</label>
                <select id="month" required value={month} onChange={(event) => setMonth(event.target.value)}>
                  <option value="">Select Month</option>
                  {["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"].map((entry) => (
                    <option key={entry} value={entry}>{entry}</option>
                  ))}
                </select>
              </div>

              {existingDocs.length > 0 && (
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ fontWeight: 600, fontSize: "14px", display: "block", marginBottom: "5px" }}>Existing Documents</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {existingDocs.map((id, i) => (
                      <span key={id} style={{ background: "#e2e8f0", color: "#475569", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid #cbd5e1" }}>Existing Doc {i + 1}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="documents">Upload More Documents (Maximum 20):</label>
                <input
                  type="file"
                  id="documents"
                  multiple
                  onChange={(event) => setDocuments(Array.from(event.target.files || []).slice(0, 20))}
                />
                <div id="documentList" className="document-list">
                  {documents.map((file) => (
                    <div key={file.name}>{file.name}</div>
                  ))}
                </div>
              </div>

              <div className="button-group">
                <button type="button" onClick={() => router.back()} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ccc", background: "#f1f5f9", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn-submit" style={{ flex: 2 }}>{editId ? "Update & Resubmit" : "Submit GST Return"}</button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />

      <style jsx>{`
        .page { background: #f7f9fc; padding: 40px 20px; display: flex; justify-content: center; align-items: flex-start; }
        .form-container { background: #ffffff; border-radius: 12px; padding: 30px; max-width: 600px; width: 100%; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); }
        .form-container h2 { text-align: center; margin-bottom: 24px; color: #333; font-weight: 500; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
        input[type="text"], select, input[type="file"] { width: 100%; padding: 10px 14px; border: 1px solid #ccc; border-radius: 6px; background: #f9f9f9; font-size: 14px; transition: border-color 0.3s ease; }
        input:read-only { background-color: #eaeaea; cursor: not-allowed; }
        input:focus, select:focus { border-color: #007bff; outline: none; }
        input[type="file"] { background-color: #fff; padding: 8px; }
        .document-list { margin-top: 10px; font-size: 13px; color: #555; }
        .btn-submit { display: block; width: 100%; padding: 12px; background-color: #007bff; color: white; font-size: 16px; font-weight: 500; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.3s ease; }
        .btn-submit:hover { background-color: #0056b3; }
        .error-message { color: red; text-align: center; margin-bottom: 16px; font-size: 14px; }
        .button-group { display: flex; gap: 10px; }
        
        @media (max-width: 480px) {
          .button-group { flex-direction: column; }
        }
      `}</style>
    </>
  );
}