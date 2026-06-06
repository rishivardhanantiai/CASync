"use client";

import { useEffect, useState } from "react";

// Usage: import { useToast, ToastContainer } from "@/components/Toast";
// const { showToast } = useToast();
// showToast("Message here", "success"); // types: success | error | info | warning

let toastListeners = [];
let toastCounter = 0;

export function showToast(message, type = "info") {
  const id = `${Date.now()}-${++toastCounter}-${Math.floor(
    Math.random() * 1000000
  )}`;
  toastListeners.forEach((fn) => fn({ id, message, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3500);
    };
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handler);
    };
  }, []);

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <>
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">{icons[toast.type]}</span>
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: 10px;
          min-width: 280px;
          max-width: 380px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          pointer-events: all;
          animation: toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          color: white;
        }

        .toast-success { background: linear-gradient(135deg, #11998e, #38ef7d); }
        .toast-error   { background: linear-gradient(135deg, #c0392b, #e74c3c); }
        .toast-warning { background: linear-gradient(135deg, #f39c12, #f1c40f); color: #333; }
        .toast-info    { background: linear-gradient(135deg, #2980b9, #3498db); }

        .toast-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          line-height: 1.4;
        }

        .toast-close {
          background: none;
          border: none;
          color: inherit;
          font-size: 18px;
          cursor: pointer;
          opacity: 0.7;
          padding: 0;
          line-height: 1;
          flex-shrink: 0;
          margin: 0;
        }

        .toast-close:hover {
          opacity: 1;
          background: none;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(60px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}