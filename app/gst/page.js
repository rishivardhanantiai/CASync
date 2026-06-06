"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function GstPage() {
  const router = useRouter();
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
            <h2>Goods and Services Tax (GST) Services</h2>
            <p>Comprehensive GST registration, return filing, billing, and compliance support for your business.</p>

            <div className="service-features">
              <div className="feature-card">
                <h3><i className="fas fa-registered" /> GST Registration</h3>
                <p>Assistance with GST registration and related document preparation.</p>
              </div>
              <div className="feature-card">
                <h3><i className="fas fa-file-invoice" /> GST Returns</h3>
                <p>Timely filing of monthly, quarterly, and annual GST returns.</p>
              </div>
              <div className="feature-card">
                <h3><i className="fas fa-receipt" /> GST Billing</h3>
                <p>Support for invoice setup, billing guidance, and GST-compliant documentation.</p>
              </div>
              <div className="feature-card">
                <h3><i className="fas fa-book" /> GST Compliance</h3>
                <p>Professional compliance support to keep your business aligned with GST requirements.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />

      <style jsx>{`
        .service-content { padding: 40px 0; }
        .service-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
        .feature-card { background: var(--white); padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      `}</style>
    </>
  );
}