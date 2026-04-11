import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, setTokenGetter, setUnauthorizedHandler } from '../lib/api';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  admin: boolean;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, passwordConfirmation: string, username: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const authSlice: StateCreator<AuthState> = (set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { headers, data } = await api.post<{ user: AuthUser }>('/api/v1/auth/sign_in', {
      user: { email, password },
    });
    const token = headers.get('Authorization')?.replace('Bearer ', '') ?? null;
    set({ token, user: data.user, isAuthenticated: true });
  },

  signup: async (email: string, password: string, passwordConfirmation: string, username: string, displayName?: string) => {
    const { headers, data } = await api.post<{ user: AuthUser }>('/api/v1/auth/sign_up', {
      user: { email, password, password_confirmation: passwordConfirmation, username, display_name: displayName },
    });
    const token = headers.get('Authorization')?.replace('Bearer ', '') ?? null;
    set({ token, user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    try { await api.delete('/api/v1/auth/sign_out'); } catch { /* ignore */ }
    set({ token: null, user: null, isAuthenticated: false });
  },
});

export const useAuthStore = create<AuthState>()(
  persist(authSlice, {
    name: 'supperware-auth',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
  })
);

// Wire token getter and unauthorized handler into the api client
setTokenGetter(() => useAuthStore.getState().token);
setUnauthorizedHandler(() => { useAuthStore.getState().logout(); });
