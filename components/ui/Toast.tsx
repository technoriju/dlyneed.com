"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setToastMessage(null), 300);
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none fixed bottom-[calc(24px+env(safe-area-inset-bottom,0px))] left-1/2 z-[95] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-full bg-ink-900 px-[18px] py-3 text-center text-sm font-medium leading-snug text-white shadow-[0_16px_40px_rgba(17,17,17,0.12)] transition-all duration-250 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          {toastMessage}
        </div>
      )}
    </ToastContext.Provider>
  );
}
