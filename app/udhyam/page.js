"use client";

import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function UdhyamPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!(user && loggedIn));
  }, []);
  return (
    <>
      <SiteHeader />
      <ClientBlueBar isLoggedIn={isLoggedIn} />
      <main className="main-content">
        <div className="container">
          <section className="service-content">
            <h2>UDHYAM Aadhar Registration Services</h2>
            <p>Complete assistance for MSME registration through UDHYAM Aadhar portal.</p>
            <div className="service-features">
              <div className="feature-card"><h3><i className="fas fa-id-card" /> New Registration</h3><p>Assistance in new UDHYAM Aadhar registration for your business.</p></div>
              <div className="feature-card"><h3><i className="fas fa-sync" /> Updates &amp; Modifications</h3><p>Help in updating existing UDHYAM registration details.</p></div>
              <div className="feature-card"><h3><i className="fas fa-check-circle" /> Compliance</h3><p>Guidance on maintaining compliance with MSME regulations.</p></div>
              <div className="feature-card"><h3><i className="fas fa-hands-helping" /> Benefits Consultation</h3><p>Information about various benefits available for MSME registered businesses.</p></div>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />

      <style jsx>{`
        .service-content { padding: 40px 0; }
        .service-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
        .feature-card { background: var(--white); padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
      `}</style>
    </>
  );
}
