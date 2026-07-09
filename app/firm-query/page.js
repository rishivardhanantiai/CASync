"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function FirmQueryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FirmQueryContent />
    </Suspense>
  );
}

function FirmQueryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const srId = searchParams.get("srId");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(!!editId);

  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phone: "",
    firmName: "",
    queryDetails: ""
  });

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!(user && loggedIn));

    const currentUser = JSON.parse(user || "null");
    if (currentUser?.email) {
      setUserEmail(currentUser.email);
      if (!editId) {
        setFormValues(prev => ({
          ...prev,
          email: currentUser.email,
          name: currentUser.name || ""
        }));
      }
    } else if (loggedIn) {
      router.replace("/login?redirect=/firm-query");
    } else {
      router.replace("/login?redirect=/firm-query");
    }

    if (editId) {
      fetch(`/api/admin/service-requests/details?id=${editId}&type=FIRM_QUERY`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFormValues({
              name: data.data.name || "",
              email: data.data.email || "",
              phone: data.data.phone || "",
              firmName: data.data.firmName || "",
              queryDetails: data.data.queryDetails || ""
            });
          }
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
  }, [editId, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const res = await fetch("/api/client/submit-form", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          type: "FIRM_QUERY",
          data: {
            ...formValues,
            userEmail
          }
        })
      });

      const result = await res.json();
      if (result.success) {
        if (editId && srId) {
          await fetch("/api/client/resubmit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: srId, clientNotes: "Firm query updated." })
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

  if (isLoading) return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Loading details...</div>;

  return (
    <>
      <SiteHeader />
      <ClientBlueBar isLoggedIn={isLoggedIn} />
      <main className="main-content">
        <div className="page">
          <div className="form-container">
            <h2>{editId ? "Edit" : "New"} Firm Query</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formValues.name}
                  onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formValues.email}
                  onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone *</label>
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
              <div className="form-group">
                <label htmlFor="firmName">Firm Name *</label>
                <input
                  type="text"
                  id="firmName"
                  required
                  value={formValues.firmName}
                  onChange={(e) => setFormValues(prev => ({ ...prev, firmName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="queryDetails">Query Details *</label>
                <textarea
                  id="queryDetails"
                  required
                  rows={5}
                  value={formValues.queryDetails}
                  onChange={(e) => setFormValues(prev => ({ ...prev, queryDetails: e.target.value }))}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #b0bec5", background: "#f8f9fa", resize: "vertical" }}
                />
              </div>

              <div className="button-group">
                <button type="button" onClick={() => router.back()}>Cancel</button>
                <button type="submit">Submit Query</button>
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
      `}</style>
    </>
  );
}
