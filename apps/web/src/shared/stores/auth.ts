import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../api/types';
import { api } from '../api/client';

interface AuthState {
    token: string | null;
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setAuth: (token: string, user: User) => void;
    logout: () => void;
    fetchProfile: () => Promise<void>;
    initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isLoading: false,
            isAuthenticated: false,

            setAuth: (token, user) => {
                api.setToken(token);
                set({
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false
                });
            },

            logout: () => {
                api.clearToken();
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            },

            fetchProfile: async () => {
                set({ isLoading: true });
                try {
                    const { user } = await api.getProfile();
                    set({ user, isLoading: false });
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                    get().logout();
                }
            },

            initialize: () => {
                const { token } = get();
                if (token) {
                    api.setToken(token);
                    set({ isAuthenticated: true });
                    get().fetchProfile();
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                token: state.token,
                user: state.user
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.token) {
                    api.setToken(state.token);
                    state.isAuthenticated = true;
                }
            },
        }
    )
);

// Selector hooks for better performance
export const useToken = () => useAuthStore((state) => state.token);
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthActions = () => useAuthStore((state) => ({
    setAuth: state.setAuth,
    logout: state.logout,
    fetchProfile: state.fetchProfile,
}));
