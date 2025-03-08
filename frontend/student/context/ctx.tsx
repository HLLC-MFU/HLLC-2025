import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { saveToken, getToken, removeToken } from "@/utils/storage";
import { router } from "expo-router";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = await getToken("accessToken");
            if (token && !user) { // Only fetch if there's a token and no user yet
                const profile = await getProfile();
                if (!profile) {
                    removeToken("accessToken");
                }
            } else {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]); // Add user to dependency to avoid infinite loops
    

    async function signIn(username: string, password: string): Promise<void> {
        try {
            setLoading(true);
            setError(null);

            const response = await apiRequest<TokenResponse>("/auth/login", "POST", { username, password });

            if (response.statusCode === 200 && response.data) {
                saveToken("accessToken", response.data.accessToken);
                saveToken("refreshToken", response.data.refreshToken);
                const profile = await getProfile();
                if (profile) {
                    return router.replace("/");
                }
            } else {
                setError(response.message);
                alert("Login failed!");
            }
        } catch (error) {
            setError((error as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function getProfile(): Promise<User | null> {
        try {
            setLoading(true);
            setError(null);

            const response = await apiRequest<User>("/auth/profile");
            if (response.statusCode === 200 && response.data) {
                setUser(response.data);
                setLoading(false);
                return response.data;
            } else {
                setError(response.message);
                return null;
            }
        } catch (error) {
            setError((error as Error).message);
            return null;
        } finally {
            setLoading(false);
        }
    }

    function signOut() {
        removeToken("accessToken");
        removeToken("refreshToken");
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
