"use client";

import { useEffect, useState } from "react";

export default function AlertOverride() {
  const [toast, setToast] = useState({ show: false, message: "" });

  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (message) => {
      setToast({ show: true, message: String(message) });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.show]);

  if (!toast.show) return null;

  const isError = toast.message.toLowerCase().includes("error") || 
                  toast.message.toLowerCase().includes("fail") || 
                  toast.message.toLowerCase().includes("wrong");

  return (
    <div style={{
      position: "fixed",
      top: "24px",
      right: "24px",
      backgroundColor: isError ? "#ef4444" : "#10b981",
      color: "white",
      padding: "16px 24px",
      borderRadius: "8px",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      zIndex: 99999,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: "12px",
      fontFamily: "'Poppins', sans-serif",
      fontSize: "14px",
      animation: "toastSlideIn 0.3s ease",
      maxWidth: "350px"
    }}>
      <i className={isError ? "fas fa-exclamation-circle" : "fas fa-check-circle"} style={{ fontSize: "18px", flexShrink: 0 }} />
      <span style={{ flex: 1, whiteSpace: "pre-line" }}>{toast.message}</span>
      <button 
        onClick={() => setToast({ show: false, message: "" })} 
        style={{
          background: "none",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontSize: "18px",
          marginLeft: "8px",
          opacity: 0.8,
          lineHeight: 1,
          flexShrink: 0
        }}
      >
        &times;
      </button>

      <style jsx global>{`
        @keyframes toastSlideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
