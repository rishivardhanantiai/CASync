"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";
import { showToast, ToastContainer } from "@/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!(user && loggedIn));
  }, []);

  async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").toLowerCase();
    const mobile = String(formData.get("mobile") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, mobile, password }),
      });

      const result = await res.json();

      if (result.success) {
        showToast("Registration successful! Please login.", "success");
        setTimeout(() => router.push("/login"), 1200);
      } else {
        showToast(result.message || "Registration failed. Please try again.", "error");
      }
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
      console.error(err);
    }
  }

  return (
    <>
      <ToastContainer />
      <SiteHeader />
      <ClientBlueBar isLoggedIn={isLoggedIn} />
      <main className="main-content">
        <div className="container">
          <div className="auth-container">
            <h2>
              <i className="fas fa-user-plus" /> Register
            </h2>
            <form id="registerForm" onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" name="name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email ID</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number</label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit mobile number"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" required />
              </div>
              <button type="submit" className="submit-btn">Register</button>
            </form>
            <div className="auth-links">
              <p>
                Already have an account? <Link href="/login">Login here</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />

      <style jsx>{`
        .auth-container {
          max-width: 500px;
          margin: 40px auto;
          padding: 30px;
          background-color: var(--white);
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .auth-container h2 {
          text-align: center;
          margin-bottom: 30px;
          color: var(--primary-color);
        }
        .form-group { margin-bottom: 20px; }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: var(--text-color);
        }
        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        .form-group input:focus {
          outline: none;
          border-color: var(--secondary-color);
        }
        .submit-btn {
          width: 100%;
          padding: 12px;
          background-color: var(--secondary-color);
          color: var(--white);
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .submit-btn:hover { background-color: #2980b9; }
        .auth-links {
          text-align: center;
          margin-top: 20px;
        }
        .auth-links :global(a) {
          color: var(--secondary-color);
          text-decoration: none;
        }
        .auth-links :global(a:hover) { text-decoration: underline; }
      `}</style>
    </>
  );
}