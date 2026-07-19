"use client";
import { createContext, useContext, useState, useCallback } from "react";

type Toast = { id: number; message: string; type: "success" | "error" | "info" };
const ToastContext = createContext<{ push: (msg: string, type?: Toast["type"]) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  const colors = { success: "var(--success)", error: "var(--danger)", info: "var(--text-primary)" };
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id}
            className="min-w-[240px] rounded-[10px] bg-white border border-[var(--border-medium)] shadow-[var(--shadow-lg)] px-4 py-3 text-[13px] font-medium text-[var(--text-primary)] animate-[slideIn_0.25s_ease-out]"
            style={{ borderLeft: `3px solid ${colors[t.type]}` }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext)!;
