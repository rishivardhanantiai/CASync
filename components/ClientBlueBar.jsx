"use client";

import { useRouter } from "next/navigation";

export default function ClientBlueBar({ fallbackHref = "/", isLoggedIn = false }) {
  const router = useRouter();

  function handleBack(event) {
    event.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  function handleLogout(event) {
    event.preventDefault();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push("/login");
  }

  return (
    <nav className="main-nav">
      <div className="container">
        <div className="nav-row">
          <ul>
            <li>
              <a href="#" onClick={handleBack} className="active">
                <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />
                Back
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
