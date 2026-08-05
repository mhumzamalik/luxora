"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (title: string, description?: string, type?: ToastType) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, description?: string, type: ToastType = "info") => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => toast(title, description, "success"),
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) => toast(title, description, "error"),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`pointer-events-auto flex items-start p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all ${
                t.type === "success"
                  ? "bg-emerald-900/90 text-white border-emerald-700/50"
                  : t.type === "error"
                  ? "bg-red-900/90 text-white border-red-700/50"
                  : "bg-black/90 text-white border-gray-800"
              }`}
            >
              <div className="mr-3 mt-0.5">
                {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {t.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
                {t.type === "info" && <Info className="w-5 h-5 text-indigo-400" />}
              </div>
              <div className="flex-1 space-y-0.5">
                <h4 className="text-xs font-bold">{t.title}</h4>
                {t.description && <p className="text-[11px] text-gray-300">{t.description}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
    };
  }
  return context;
}
