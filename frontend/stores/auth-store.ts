import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  walletAddress: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  loginWithEmail: (email: string) => Promise<void>;
  loginWithWallet: (walletAddress: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      walletAddress: null,
      email: null,
      isAuthenticated: false,
      isLoading: false,

      loginWithEmail: async (email: string) => {
        set({ isLoading: true });
        // API-READY: Replace with actual Privy email login
        await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
        set({
          email,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      loginWithWallet: async (walletAddress: string) => {
        set({ isLoading: true });
        // API-READY: Replace with actual Privy wallet connection
        await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
        set({
          walletAddress,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        // API-READY: Replace with actual Privy logout
        set({
          walletAddress: null,
          email: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        email: state.email,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);