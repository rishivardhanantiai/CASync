"use client";

import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function FirmPage() {
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
            <h2>Firm Registration Services</h2>
            <p>Complete support for partnership setup, documentation, compliance, and advisory services.</p>
            <div className="service-features">
              <div className="feature-card"><h3><i className="fas fa-handshake" /> Partnership Firm Registration</h3><p>End-to-end support for starting and registering your partnership firm.</p></div>
              <div className="feature-card"><h3><i className="fas fa-file-contract" /> Partnership Deed</h3><p>Professional drafting and guidance for partnership deed preparation.</p></div>
              <div className="feature-card"><h3><i className="fas fa-clipboard-list" /> Compliance Services</h3><p>Ongoing filing and compliance support for registered firms.</p></div>
              <div className="feature-card"><h3><i className="fas fa-chart-line" /> Business Advisory</h3><p>Guidance to help firms with planning, setup, and operational decisions.</p></div>
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
