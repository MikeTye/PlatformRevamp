import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

export interface User {
    id?: string;
    name?: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    login: () => Promise<User | null>;
    signup: () => Promise<User | null>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<User | null>;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
        ...(init?.headers as Record<string, string> | undefined),
    };

    if (init?.method && init.method !== "GET" && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const resp = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        ...init,
        headers,
    });

    if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(text || `Request failed with status ${resp.status}`);
    }

    return resp.json() as Promise<T>;
}

type MeResponse =
    | { user: User | null }
    | { data?: { user?: User | null }; user?: User | null };

function extractUser(payload: MeResponse): User | null {
    if ('user' in payload && payload.user !== undefined) {
        return payload.user;
    }

    if ('data' in payload && payload.data?.user !== undefined) {
        return payload.data.user ?? null;
    }

    return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const refreshSession = async (): Promise<User | null> => {
        try {
            const payload = await fetchJson<MeResponse>('/auth/me', {
                method: 'GET',
            });

            const nextUser = extractUser(payload);
            setUser(nextUser);
            return nextUser;
        } catch {
            setUser(null);
            return null;
        }
    };

    useEffect(() => {
        let isMounted = true;

        (async () => {
            try {
                await refreshSession();
            } finally {
                if (isMounted) {
                    setIsAuthLoading(false);
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    // For now, these simply re-check backend session after
    // passwordless verify or Google callback has completed.
    const login = async () => {
        return refreshSession();
    };

    const signup = async () => {
        return refreshSession();
    };

    const logout = async () => {
        try {
            await fetchJson<{ ok: boolean }>('/auth/logout', {
                method: 'POST',
            });
        } catch {
            // swallow for now; clear local auth state anyway
        } finally {
            setUser(null);
        }
    };

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            isAuthenticated: !!user,
            isAuthLoading,
            login,
            signup,
            logout,
            refreshSession,
            setUser,
        }),
        [user, isAuthLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}