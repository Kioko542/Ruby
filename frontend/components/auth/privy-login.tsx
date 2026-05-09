"use client";

import { useEffect, useRef } from "react";
import { useIdentityToken, usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth-store";

interface PrivyLoginProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function PrivyLogin({ onSuccess, onError }: PrivyLoginProps) {
  const { authenticated, login, ready, user } = usePrivy();
  const { identityToken } = useIdentityToken();
  const { verifyPrivyToken, isLoading } = useAuthStore();
  const verifiedTokenRef = useRef<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!ready || !authenticated || !identityToken || verifiedTokenRef.current === identityToken) {
      return;
    }

    verifiedTokenRef.current = identityToken;
    const email = user?.email?.address ?? null;
    verifyPrivyToken(identityToken, email)
      .then(() => {
        onSuccessRef.current?.();
      })
      .catch((error) => {
        verifiedTokenRef.current = null;
        onErrorRef.current?.(error instanceof Error ? error.message : "Privy login failed");
      });
  }, [authenticated, identityToken, ready, user, verifyPrivyToken]);

  return (
    <button
      className="ruby-btn ruby-btn-primary"
      onClick={() => login()}
      disabled={!ready || isLoading}
      type="button"
    >
      {isLoading ? (
        <>
          <div className="loading-spinner" />
          Verifying...
        </>
      ) : (
        <>
          <i className="ti ti-mail" style={{ fontSize: 13 }} />
          Continue with email
        </>
      )}
    </button>
  );
}
