const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export type FrontendErrorLogPayload = {
    source: "frontend";
    level?: "info" | "warn" | "error" | "fatal";
    message: string;
    code?: string;
    category?: string;
    requestId?: string;
    userId?: string | null;
    path?: string;
    method?: string;
    statusCode?: number;
    stack?: string;
    context?: Record<string, unknown>;
};

function safeJson(value: unknown) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        return { serialization: "failed" };
    }
}

export async function sendErrorLog(payload: Omit<FrontendErrorLogPayload, "source">) {
    const body: FrontendErrorLogPayload = {
        source: "frontend",
        level: payload.level ?? "error",
        path: payload.path ?? window.location.pathname,
        ...payload,
        context: {
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...safeJson(payload.context ?? {}),
        },
    };

    try {
        await fetch(`${API_BASE_URL}/error-logs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(body),
            keepalive: true,
        });
    } catch (err) {
        console.error("Failed to send error log", err, body);
    }
}