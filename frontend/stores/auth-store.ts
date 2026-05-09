import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { Keypair } from '@solana/web3.js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  `${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'}/api/v1`;

interface AuthPrincipal {
  session_id: string;
  user_id: string;
  wallet_address?: string;
  provider: string;
  expires_at: string;
}

interface AuthState {
  walletAddress: string | null;
  email: string | null;
  token: string | null;
  principal: AuthPrincipal | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  loginWithEmail: (email: string) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  verifyPrivyToken: (privyToken: string, email?: string | null) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

type AuthSessionResponse = {
  token: string;
  principal: AuthPrincipal;
};

type PhantomNonceResponse = {
  wallet_address: string;
  nonce: string;
  message: string;
};

type PhantomProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (
    message: Uint8Array,
    display?: 'utf8'
  ) => Promise<{ signature: Uint8Array }>;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload?.error === 'string') {
        message = payload.error;
      }
    } catch {
      // Keep the status-based fallback when the backend does not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function beginPhantomAuth(walletAddress: string) {
  return apiFetch<PhantomNonceResponse>('/auth/phantom/nonce', {
    method: 'POST',
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
}

async function verifyPhantomAuth(payload: {
  wallet_address: string;
  nonce: string;
  message: string;
  signature: string;
}) {
  return apiFetch<AuthSessionResponse>('/auth/phantom/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function sessionState(session: AuthSessionResponse, email?: string | null) {
  return {
    token: session.token,
    principal: session.principal,
    walletAddress: session.principal.wallet_address || null,
    email: email ?? null,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  };
}

async function signWithPhantomWallet() {
  const provider = window.solana;
  if (!provider?.isPhantom || !provider.signMessage) {
    return null;
  }

  const connection = await provider.connect();
  const walletAddress = connection.publicKey.toString();
  const challenge = await beginPhantomAuth(walletAddress);
  const encodedMessage = new TextEncoder().encode(challenge.message);
  const { signature } = await provider.signMessage(encodedMessage, 'utf8');

  return verifyPhantomAuth({
    wallet_address: walletAddress,
    nonce: challenge.nonce,
    message: challenge.message,
    signature: bs58.encode(signature),
  });
}

async function signWithLocalDevWallet() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Phantom wallet is required');
  }

  const keypair = Keypair.generate();
  const walletAddress = keypair.publicKey.toBase58();
  const challenge = await beginPhantomAuth(walletAddress);
  const encodedMessage = new TextEncoder().encode(challenge.message);
  const signature = nacl.sign.detached(encodedMessage, keypair.secretKey);

  return verifyPhantomAuth({
    wallet_address: walletAddress,
    nonce: challenge.nonce,
    message: challenge.message,
    signature: bs58.encode(signature),
  });
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      walletAddress: null,
      email: null,
      token: null,
      principal: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loginWithEmail: async (email: string) => {
        void email;
        set({ isLoading: false });
        throw new Error('Email login is handled by Privy. Configure NEXT_PUBLIC_PRIVY_APP_ID to enable it.');
      },

      loginWithWallet: async () => {
        set({ isLoading: true, error: null });
        try {
          const session =
            typeof window !== 'undefined'
              ? (await signWithPhantomWallet()) ?? (await signWithLocalDevWallet())
              : await signWithLocalDevWallet();
          set(sessionState(session));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Wallet login failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      verifyPrivyToken: async (privyToken: string, email?: string | null) => {
        set({ isLoading: true, error: null });
        try {
          const session = await apiFetch<AuthSessionResponse>('/auth/privy/verify', {
            method: 'POST',
            body: JSON.stringify({ privy_token: privyToken }),
          });
          set(sessionState(session, email));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Privy verification failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      refreshSession: async () => {
        const token = get().token;
        if (!token) {
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const principal = await apiFetch<AuthPrincipal>('/auth/me', { method: 'GET' }, token);
          set({
            principal,
            walletAddress: principal.wallet_address || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            token: null,
            principal: null,
            walletAddress: null,
            email: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Session refresh failed',
          });
        }
      },

      logout: async () => {
        const token = get().token;
        if (token) {
          try {
            await apiFetch('/auth/logout', { method: 'POST' }, token);
          } catch {
            // Local logout should still clear stale or already-revoked sessions.
          }
        }
        set({
          walletAddress: null,
          email: null,
          token: null,
          principal: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        email: state.email,
        token: state.token,
        principal: state.principal,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);