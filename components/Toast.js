"use client";

import { useEffect, useState } from "react";

const listeners = new Set();

export function showToast(message, type = "success") {
  listeners.forEach(listener => listener({ message, type, id: Math.random() }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast]);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return (
    <div style={{
      position: "fixed",
      top: "24px",
      right: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      zIndex: 99999,
      pointerEvents: "none"
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={(id) => setToasts(prev => prev.filter(x => x.id !== id))} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const isError = toast.type === "error" || toast.message.toLowerCase().includes("error") || toast.message.toLowerCase().includes("fail");

  return (
    <div style={{
      backgroundColor: isError ? "#ef4444" : "#10b981",
      color: "white",
      padding: "12px 20px",
      borderRadius: "6px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontFamily: "'Poppins', sans-serif",
      fontSize: "13px",
      animation: "toastSlideIn 0.3s ease",
      maxWidth: "300px",
      pointerEvents: "auto"
    }}>
      <i className={isError ? "fas fa-exclamation-circle" : "fas fa-check-circle"} style={{ fontSize: "16px", flexShrink: 0 }} />
      <span>{toast.message}</span>
      <button 
        onClick={() => onDismiss(toast.id)} 
        style={{
          background: "none",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontSize: "18px",
          marginLeft: "auto",
          opacity: 0.8,
          lineHeight: 1,
          flexShrink: 0
        }}
      >
        &times;
      </button>
    </div>
  );
}

// Default export component for file-return compatibility
export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (message) {
      showToast(message, type);
      if (onClose) onClose();
    }
  }, [message, type, onClose]);

  return null;
}
