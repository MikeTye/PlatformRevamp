import { sendErrorLog } from "./errorLogger";

let registered = false;

export function registerGlobalErrorHandlers() {
  if (registered) return;
  registered = true;

  window.addEventListener("error", (event) => {
    void sendErrorLog({
      level: "error",
      category: "window_error",
      message: event.message || "Unhandled window error",
      stack: event.error instanceof Error ? event.error.stack : undefined,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    void sendErrorLog({
      level: "error",
      category: "unhandled_promise_rejection",
      message:
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection",
      stack: reason instanceof Error ? reason.stack : undefined,
      context: {
        reason:
          reason instanceof Error
            ? { name: reason.name, message: reason.message }
            : reason,
      },
    });
  });
}