"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "null");
      const flag = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(Boolean(user) || flag);
    } catch (_) {
      setIsLoggedIn(false);
    }
  }, []);

  function showComingSoon(event) {
    event.preventDefault();
    alert("Coming Soon!");
  }

  function handleLogout(event) {
    event.preventDefault();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    setIsLoggedIn(false);
    window.location.href = "/";
  }

  return (
    <>
      <SiteHeader title="TOTALTAXHUB.COM" />

      <nav className="main-nav home-nav">
        <div className="container">
          <div className="nav-row">
            {/* Hamburger Button for Mobile */}
            <button
              className="menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              <i className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
            </button>

            <div className={`nav-links-wrapper ${isMenuOpen ? "open" : ""}`}>
              {/* Internal Close Button for Sidebar */}
              <button 
                className="close-sidebar" 
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close Menu"
              >
                <i className="fas fa-times"></i>
              </button>
              <ul>
                <li>
                  <Link href="/" className="sidebar-link active" onClick={() => setIsMenuOpen(false)}>
                    Home
                  </Link>
                </li>
                <li>
                  {isLoggedIn ? (
                    <Link href="/dashboard" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>
                      Dashboard
                    </Link>
                  ) : (
                    <Link href="/register" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>Register</Link>
                  )}
                </li>
                {!isLoggedIn && (
                  <li>
                    <Link href="/login" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  </li>
                )}
                <li>
                  <a href="#" className="sidebar-link" onClick={(e) => { showComingSoon(e); setIsMenuOpen(false); }}>
                    News
                  </a>
                </li>
                <li>
                  <a href="#" className="sidebar-link" onClick={(e) => { showComingSoon(e); setIsMenuOpen(false); }}>
                    Query
                  </a>
                </li>
              </ul>

              <div className="nav-admin">
                {isLoggedIn && (
                  <a href="#" className="sidebar-link" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }} />
                    Logout
                  </a>
                )}
                {/* 
                {!isLoggedIn && (
                  <div className="admin-login-links">
                    <Link href="/team-dashboard" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>Team Login</Link>
                    <Link href="/admin-dashboard?view=login" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>Admin Login</Link>
                  </div>
                )} 
                */}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <section className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">Simplify Your Tax & Compliance Journey</h1>
              <p className="hero-subtitle">
                Expert financial services, tax filing, and company registration all in one place. Fast, secure, and hassle-free.
              </p>
              <div className="hero-actions">
                {isLoggedIn ? (
                  <Link href="/dashboard" className="primary-btn">Go to Dashboard</Link>
                ) : (
                  <Link href="/register" className="primary-btn">Get Started</Link>
                )}
                <a href="#services" className="secondary-btn">Our Services</a>
              </div>
            </div>
            <div className="hero-image">
              <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800" alt="Finance and Tax" />
            </div>
          </section>

          <section id="services" className="services" style={{ marginTop: '80px', marginBottom: '80px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '32px', color: 'var(--text-color)' }}>Services Provided</h2>
            <div className="service-grid">
              <Link href="/income-tax" className="service-card">
                <i className="fas fa-file-invoice" />
                <h3>Income Tax Return</h3>
              </Link>
              <Link href="/gst" className="service-card">
                <i className="fas fa-percentage" />
                <h3>Goods and Service Tax</h3>
              </Link>
              <Link href="/udhyam" className="service-card">
                <i className="fas fa-id-card" />
                <h3>UDHYAM Aadhar</h3>
              </Link>
              <Link href="/firm" className="service-card">
                <i className="fas fa-building" />
                <h3>Firm Registration</h3>
              </Link>
              <Link href="/company" className="service-card">
                <i className="fas fa-landmark" />
                <h3>Company Registration</h3>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter text="&copy; 2025 TOTALTAXHUB.COM. All rights reserved." />

      <style jsx>{`
        .hero-section {
          display: flex;
          align-items: center;
          gap: 60px;
          padding: 60px 0;
          min-height: 60vh;
        }
        .hero-content {
          flex: 1;
        }
        .hero-title {
          font-size: 52px;
          font-weight: 800;
          color: var(--text-color);
          line-height: 1.15;
          margin-bottom: 24px;
        }
        .hero-subtitle {
          font-size: 18px;
          color: #475569;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        :global(.primary-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--secondary-color) !important;
          color: white !important;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none !important;
          transition: background 0.2s, transform 0.2s;
        }
        :global(.primary-btn:hover) {
          background: #2980b9 !important;
          color: white !important;
          transform: translateY(-2px);
        }
        :global(.secondary-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9 !important;
          color: var(--text-color) !important;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none !important;
          transition: background 0.2s, transform 0.2s;
        }
        :global(.secondary-btn:hover) {
          background: #e2e8f0 !important;
          color: var(--text-color) !important;
          transform: translateY(-2px);
        }
        .hero-image {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        .hero-image img {
          max-width: 100%;
          border-radius: 16px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.12);
        }
        
        .service-card {
          background: var(--white);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 32px 20px;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          color: var(--text-color);
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .service-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
          text-decoration: none;
          color: var(--text-color);
        }
        .service-card i {
          font-size: 32px;
          color: var(--secondary-color);
          margin-bottom: 20px;
        }
        .service-card h3 {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
        }

        @media (max-width: 992px) {
          .nav-row {
            flex-direction: row;
            justify-content: flex-end;
            padding: 10px 0;
            position: relative;
            min-height: 50px;
          }
          .menu-toggle {
            display: block;
            background: none;
            border: none;
            color: #fff;
            font-size: 24px;
            cursor: pointer;
            z-index: 1000;
            position: absolute;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
          }
          .close-sidebar {
            display: block;
            background: none;
            border: none;
            color: #fff;
            font-size: 24px;
            cursor: pointer;
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 2000;
          }
          .nav-links-wrapper {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 80%;
            max-width: 300px;
            background: #1a202c;
            display: flex;
            flex-direction: column;
            padding: 80px 24px 40px;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1500;
            box-shadow: -10px 0 25px rgba(0,0,0,0.3);
          }
          .nav-links-wrapper.open {
            transform: translateX(0);
          }
          .home-nav > .container > .nav-row > ul, 
          .home-nav > .container > .nav-row > .nav-admin {
            display: none;
          }
          .nav-links-wrapper ul, 
          .nav-links-wrapper .nav-admin {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            width: 100%;
          }
          .nav-links-wrapper ul li { width: 100%; }
          .sidebar-link {
            font-size: 15px !important;
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 12px 20px !important;
            text-align: center !important;
            border-radius: 8px !important;
            background: rgba(255,255,255,0.1) !important;
            color: #fff !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            box-sizing: border-box !important;
            margin-bottom: 12px !important;
            cursor: pointer !important;
          }
          .sidebar-link:hover {
            background: rgba(255,255,255,0.15) !important;
          }
          .sidebar-link.active {
            background: var(--secondary-color) !important;
            border-color: var(--secondary-color) !important;
            font-weight: 700 !important;
          }
          .nav-admin {
            margin-top: auto;
            margin-left: 0 !important;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          .admin-login-links {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
          }
          .admin-login-links a {
            padding: 12px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            font-size: 15px;
            color: #fff;
            text-decoration: none;
          }
          .hero-section { flex-direction: column; text-align: center; gap: 40px; }
          .hero-title { font-size: 32px; }
          .hero-actions { flex-direction: column; }
          .hero-image { display: none; }
        }

        @media (min-width: 993px) {
          .menu-toggle, .close-sidebar { display: none; }
          .nav-links-wrapper { 
            display: flex; 
            flex: 1; 
            align-items: center; 
            justify-content: space-between;
          }
          .nav-links-wrapper ul { 
            display: flex; 
            gap: 24px; 
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .sidebar-link {
            color: #fff;
            text-decoration: none;
            font-weight: 500;
            padding: 8px 12px;
            border-radius: 6px;
            transition: background 0.2s;
          }
          .sidebar-link:hover {
            background: rgba(255,255,255,0.1);
          }
          .sidebar-link.active {
            background: rgba(255,255,255,0.2);
          }
          .nav-admin { margin-left: auto; display: flex; align-items: center; gap: 15px; }
          .admin-login-links { display: flex; gap: 12px; align-items: center; }
          .admin-login-links a {
            color: #fff;
            text-decoration: none;
            padding: 6px 12px;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.2s;
          }
          .admin-login-links a:hover {
            background: #fff;
            color: var(--secondary-color);
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 28px;
          }
          .hero-actions {
            flex-direction: column;
            width: 100%;
          }
          :global(.primary-btn), :global(.secondary-btn) {
            width: 100%;
          }
          .hero-image {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
