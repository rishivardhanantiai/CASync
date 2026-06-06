"use client";

import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function CompanyPage() {
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
            <h2>Company Registration Services</h2>
            <p>Complete assistance in company incorporation and related services.</p>
            <div className="service-features">
              <div className="feature-card"><h3><i className="fas fa-building" /> Company Incorporation</h3><p>End-to-end assistance in incorporating your company with MCA.</p></div>
              <div className="feature-card"><h3><i className="fas fa-file-alt" /> Documentation</h3><p>Professional preparation of MOA, AOA, and other required documents.</p></div>
              <div className="feature-card"><h3><i className="fas fa-clipboard-check" /> Compliance Management</h3><p>Regular compliance services including annual returns and other statutory requirements.</p></div>
              <div className="feature-card"><h3><i className="fas fa-users" /> Director Services</h3><p>Assistance in Director appointments, DIN applications, and DSC.</p></div>
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
