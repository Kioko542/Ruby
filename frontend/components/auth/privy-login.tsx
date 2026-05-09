"use client";

import { useCallback, useEffect, useRef } from "react";
import { getIdentityToken, useIdentityToken, usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth-store";

interface PrivyLoginProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

/**
 * Keeps Privy (browser session) and Ruby (JWT in zustand) in sync.
 * If Privy already has `authenticated: true` but Ruby has no token, calling `login()`
 * throws ("already logged in… use link"). We must exchange the Privy identity JWT
 * for a Ruby session instead — via `getIdentityToken()` when the hook value is still null.
 */
export function PrivyLogin({ onSuccess, onError }: PrivyLoginProps) {
  const { authenticated, login, ready, user } = usePrivy();
  const { identityToken } = useIdentityToken();
  const rubyToken = useAuthStore((s) => s.token);
  const { verifyPrivyToken, isLoading } = useAuthStore();
  const lastOkIdentityRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const emailAddr = user?.email?.address ?? null;

  const syncRubyFromPrivy = useCallback(async () => {
    if (!ready || !authenticated) {
      return;
    }
    if (useAuthStore.getState().token) {
      return;
    }
    if (inFlightRef.current) {
      return;
    }

    let id = identityToken;
    if (!id) {
      id = await getIdentityToken();
    }
    if (!id) {
      onErrorRef.current?.(
        "Privy is signed in but Ruby could not read an identity token. Try logging out and signing in again, or clear site data for this app.",
      );
      return;
    }

    if (lastOkIdentityRef.current === id) {
      return;
    }

    inFlightRef.current = true;
    try {
      await verifyPrivyToken(id, emailAddr);
      lastOkIdentityRef.current = id;
      onSuccessRef.current?.();
    } catch (error) {
      lastOkIdentityRef.current = null;
      onErrorRef.current?.(error instanceof Error ? error.message : "Privy verification failed");
    } finally {
      inFlightRef.current = false;
    }
  }, [authenticated, emailAddr, identityToken, ready, verifyPrivyToken]);

  useEffect(() => {
    if (!rubyToken) {
      lastOkIdentityRef.current = null;
    }
  }, [rubyToken]);

  useEffect(() => {
    void syncRubyFromPrivy();
  }, [syncRubyFromPrivy, rubyToken]);

  const handleClick = () => {
    if (!ready || isLoading) {
      return;
    }
    if (authenticated) {
      if (!useAuthStore.getState().token) {
        void syncRubyFromPrivy();
      }
      return;
    }
    login({ loginMethods: ["email"] });
  };

  const needsRubySync = authenticated && !rubyToken;
  const label = !authenticated
    ? "Continue with email"
    : needsRubySync
      ? "Verify & continue"
      : "Continue with email";

  return (
    <button className="ruby-btn ruby-btn-primary" onClick={handleClick} disabled={!ready || isLoading} type="button">
      {isLoading ? (
        <>
          <div className="loading-spinner" />
          Verifying...
        </>
      ) : (
        <>
          <i className="ti ti-mail" style={{ fontSize: 13 }} />
          {label}
        </>
      )}
    </button>
  );
}
