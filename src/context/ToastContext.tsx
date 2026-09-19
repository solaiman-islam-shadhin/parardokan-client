import { createContext, ReactNode, useContext } from "react";
import { ToastContainer, toast, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

const toastOptions: ToastOptions = {
  position: "top-right",
  autoClose: 4500,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
};

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { error?: unknown; message?: unknown } } }).response;
    const message = response?.data?.error || response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (type: ToastType, message: string) => {
    const text = message.trim() || "Something went wrong";
    toast[type](text, toastOptions);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer {...toastOptions} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
