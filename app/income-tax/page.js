"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";

export default function IncomeTaxPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  async function checkLoginStatus() {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "GET",
        credentials: "include",
      });
      return response.ok;
    } catch (error) {
      console.error("Error verifying login status:", error);
      return false;
    }
  }

  async function handleFeatureClick(feature) {
    const isLoggedIn = await checkLoginStatus();
    if (feature === "filereturn") {
      if (isLoggedIn) {
        router.push("/filereturn");
      } else {
        setShowLoginRequired(true);
        window.setTimeout(() => setShowLoginRequired(false), 3000);
      }
    }
  }

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const loggedIn = localStorage.getItem("isLoggedIn");
    const isUserLoggedIn = !!(user && loggedIn);
    setIsLoggedIn(isUserLoggedIn);
  }, []);

  useEffect(() => {
    checkLoginStatus().then((isLoggedInFromServer) => {
      if (!isLoggedInFromServer) setShowLoginRequired(true);
    });
  }, []);

  return (
    <>
      <SiteHeader />
      <ClientBlueBar isLoggedIn={isLoggedIn} />
      <main className="main-content">
        <div className="container">
          <section className="service-content">
            <h2>Income Tax Return Services</h2>
            <p>We provide comprehensive income tax return filing services for individuals and businesses.</p>

            <div className="service-features">
              <div className="feature-card" onClick={() => handleFeatureClick("filereturn")}>
                <h3><i className="fas fa-file-invoice" /> File Return</h3>
                <p>Easily file your income tax return with our streamlined process. Search your PAN and auto-fill details.</p>
                {showLoginRequired && <p className="login-required">Please login to access this feature</p>}
              </div>
              <div className="feature-card">
                <h3><i className="fas fa-user" /> Individual Tax Returns</h3>
                <p>Professional assistance in filing individual income tax returns with maximum benefits and deductions.</p>
              </div>
              <div className="feature-card">
                <h3><i className="fas fa-building" /> Business Tax Returns</h3>
                <p>Complete business tax return services including profit &amp; loss statements and balance sheets.</p>
              </div>
              <div className="feature-card">
                <h3><i className="fas fa-calculator" /> Tax Planning</h3>
                <p>Strategic tax planning to help you minimize your tax liability legally.</p>
              </div>
              <div className="feature-card">
                <h3><i className="fas fa-file-alt" /> Tax Consultation</h3>
                <p>Expert consultation on tax-related matters and compliance requirements.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />

      <style jsx>{`
        .service-content { padding: 40px 0; }
        .service-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
        .feature-card { background: var(--white); padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.3s ease; }
        .feature-card:hover { transform: translateY(-5px); }
        .login-required { color: red; margin-top: 10px; font-size: 14px; }
      `}</style>
    </>
  );
}