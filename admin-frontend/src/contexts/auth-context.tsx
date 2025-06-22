"use client";

import { AuthResponse, AuthService, SignInCredentials } from "@/lib/auth-service";
import { AuthUser } from "@/types/auth";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    login: (credentials: SignInCredentials) => Promise<AuthResponse>;
    signInWithGoogle: () => Promise<AuthResponse>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = AuthService.initializeAuthListener();

        const authState = AuthService.getAuthStorageData();

        if (authState.isAuthenticated && authState.token && authState.user) {
            setToken(authState.token);
            setUser(authState.user);
        }
        setIsLoading(false);
        return () => unsubscribe();
    }, []);

    const login = useCallback(async (credentials: SignInCredentials): Promise<AuthResponse> => {
        try {
            const response = await AuthService.signInWithEmailPassword(credentials);

            setToken(response.access_token);
            setUser(response.user);

            return response;
        } catch (error) {
            throw error;
        }
    }, []);

    const signInWithGoogle = useCallback(async (): Promise<AuthResponse> => {
        try {
            const response = await AuthService.signInWithGoogle();

            setToken(response.access_token);
            setUser(response.user);

            return response;
        } catch (error) {
            console.error("Google sign-in error:", error);
            throw error;
        }
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        try {
            await AuthService.signOut();
            setToken(null);
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    }, []);

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                signInWithGoogle,
                logout,
                isAuthenticated,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}