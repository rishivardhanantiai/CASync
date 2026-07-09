"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function AddPanPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!(user && loggedIn));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget; // Safely capture the form reference
    const formData = new FormData(formElement);
    
    const data = {
      name: String(formData.get("name") || ""),
      middleName: String(formData.get("middleName") || ""),
      lastName: String(formData.get("lastName") || ""),
      fatherName: String(formData.get("fatherName") || ""),
      pan: String(formData.get("pan") || "").toUpperCase(),
      dob: String(formData.get("dob") || ""),
      plotNo: String(formData.get("plotNo") || ""),
      buildingName: String(formData.get("buildingName") || ""),
      streetNo: String(formData.get("streetNo") || ""),
      area: String(formData.get("area") || ""),
      city: String(formData.get("city") || ""),
      district: String(formData.get("district") || ""),
      state: String(formData.get("state") || ""),
      pin: String(formData.get("pin") || ""),
      mobileNo: String(formData.get("mobileNo") || ""),
      email: String(formData.get("email") || ""),
      incomeType: String(formData.get("incomeType") || "")
    };

    // Build full address string
    const normalizedRecord = {
      ...data,
      address: [
        data.plotNo,
        data.buildingName,
        data.streetNo,
        data.area,
        data.city,
        data.district,
        data.state,
        data.pin
      ]
        .filter(Boolean)
        .join(", ")
    };

    try {
      const response = await fetch("/api/add-pan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedRecord)
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        formElement.reset(); // Safe reset using the captured reference
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(`Something went wrong: ${error}`);
    }
  }

  return (
    <>
      <SiteHeader />
      <ClientBlueBar isLoggedIn={isLoggedIn} />
      <main className="main-content">
        <div className="container">
          <div className="form-container">
            <h2>Add PAN Details</h2>
            <form id="panForm" onSubmit={handleSubmit}>
              <div className="form-group"><label htmlFor="name">Name</label><input type="text" id="name" name="name" required /></div>
              <div className="form-group"><label htmlFor="middleName">Middle Name</label><input type="text" id="middleName" name="middleName" /></div>
              <div className="form-group"><label htmlFor="lastName">Last Name</label><input type="text" id="lastName" name="lastName" required /></div>
              <div className="form-group"><label htmlFor="fatherName">Father Name</label><input type="text" id="fatherName" name="fatherName" required /></div>
              <div className="form-group"><label htmlFor="pan">PAN</label><input type="text" id="pan" name="pan" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" title="Enter valid PAN number" required /></div>
              <div className="form-group"><label htmlFor="dob">Date of Birth</label><input type="date" id="dob" name="dob" required /></div>
              <div className="form-group"><label htmlFor="plotNo">Plot No</label><input type="text" id="plotNo" name="plotNo" required /></div>
              <div className="form-group"><label htmlFor="buildingName">Building Name</label><input type="text" id="buildingName" name="buildingName" required /></div>
              <div className="form-group"><label htmlFor="streetNo">Street No</label><input type="text" id="streetNo" name="streetNo" required /></div>
              <div className="form-group"><label htmlFor="area">Area</label><input type="text" id="area" name="area" required /></div>
              <div className="form-group"><label htmlFor="city">City</label><input type="text" id="city" name="city" required /></div>
              <div className="form-group"><label htmlFor="district">District</label><input type="text" id="district" name="district" required /></div>
              <div className="form-group"><label htmlFor="state">State</label><input type="text" id="state" name="state" required /></div>
              <div className="form-group"><label htmlFor="pin">PIN</label><input type="text" id="pin" name="pin" pattern="[0-9]{6}" title="Enter valid 6-digit PIN code" required /></div>
              <div className="form-group"><label htmlFor="mobileNo">Mobile No</label><input type="tel" id="mobileNo" name="mobileNo" pattern="[0-9]{10}" title="Enter valid 10-digit mobile number" required /></div>
              <div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" name="email" required /></div>
              <div className="form-group">
                <label htmlFor="incomeType">Income Type</label>
                <select id="incomeType" name="incomeType" required>
                  <option value="">Select Income Type</option>
                  <option value="salary">Salary</option>
                  <option value="business">Business</option>
                  <option value="agricultural">Agricultural</option>
                </select>
              </div>
              <div className="button-group">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" className="back-btn" onClick={() => router.back()}>Back</button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />

      <style jsx>{`
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-container { background-color: var(--white); padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); margin-top: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
        .form-group input, .form-group select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; transition: border-color 0.3s; }
        .form-group input:focus, .form-group select:focus { border-color: var(--secondary-color); outline: none; box-shadow: 0 0 0 2px rgba(41, 128, 185, 0.1); }
        .form-group input[type="date"] { padding: 11px; }
        .button-group { display: flex; gap: 15px; margin-top: 30px; justify-content: center; }
        .save-btn, .back-btn { padding: 12px 30px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; transition: background-color 0.3s; min-width: 120px; }
        .save-btn { background-color: var(--secondary-color); color: var(--white); }
        .save-btn:hover { background-color: #2980b9; }
        .back-btn { background-color: var(--accent-color); color: var(--white); }
        .back-btn:hover { background-color: #c0392b; }
      `}</style>
    </>
  );
}