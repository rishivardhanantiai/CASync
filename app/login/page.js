"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClientBlueBar from "@/components/ClientBlueBar";
import { showToast, ToastContainer } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/dashboard");

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!(user && loggedIn));

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redir = params.get("redirect");
      if (redir) setRedirectPath(redir);
    }
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        showToast("Invalid email or password.", "error");
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");
      document.cookie = "isLoggedIn=true; path=/";

      showToast("Login successful!", "success");
      router.push(redirectPath);

    } catch (error) {
      console.error(error);
      showToast("Something went wrong! Please try again.", "error");
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
              <i className="fas fa-sign-in-alt" /> Login
            </h2>
            <form id="loginForm" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" required />
              </div>
              <button type="submit" className="submit-btn">Login</button>
            </form>
            <div className="auth-links">
              <p>
                Don&apos;t have an account? <Link href="/register">Register here</Link>
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