'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    username: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load token from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('stonksbro_token');
        const savedUser = localStorage.getItem('stonksbro_user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);  // OAuth2 uses 'username' field
            formData.append('password', password);

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.detail || 'Login failed' };
            }

            // Save to state and localStorage
            setToken(data.access_token);
            setUser(data.user);
            localStorage.setItem('stonksbro_token', data.access_token);
            localStorage.setItem('stonksbro_user', JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    const signup = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.detail || 'Signup failed' };
            }

            // Save to state and localStorage
            setToken(data.access_token);
            setUser(data.user);
            localStorage.setItem('stonksbro_token', data.access_token);
            localStorage.setItem('stonksbro_user', JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('stonksbro_token');
        localStorage.removeItem('stonksbro_user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!token,
                login,
                signup,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Custom hook for authenticated API calls
export function useAuthFetch() {
    const { token, logout } = useAuth();

    const authFetch = async (url: string, options: RequestInit = {}) => {
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        };

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please login again.');
        }

        return response;
    };

    return authFetch;
}
