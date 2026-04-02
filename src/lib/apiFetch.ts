import { sendErrorLog } from "./errorLogger";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function apiFetch(input: string, init?: RequestInit) {
    const url = input.startsWith("http") ? input : `${API_BASE_URL}${input}`;
    const requestId = crypto.randomUUID();

    try {
        const response = await fetch(url, {
            ...init,
            credentials: "include",
            headers: {
                ...(init?.headers ?? {}),
                "x-request-id": requestId,
            },
        });

        if (!response.ok) {
            const text = await response.clone().text().catch(() => "");

            await sendErrorLog({
                level: response.status >= 500 ? "error" : "warn",
                category: "api_response_error",
                message: `API request failed with status ${response.status}`,
                requestId,
                path: url,
                method: init?.method ?? "GET",
                statusCode: response.status,
                context: {
                    responseBodySnippet: text.slice(0, 1000),
                },
            });
        }

        return response;
    } catch (error) {
        await sendErrorLog({
            level: "error",
            category: "api_network_error",
            message: error instanceof Error ? error.message : "Network request failed",
            stack: error instanceof Error ? error.stack : undefined,
            requestId,
            path: url,
            method: init?.method ?? "GET",
        });

        throw error;
    }
}