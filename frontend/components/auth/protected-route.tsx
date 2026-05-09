"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AuthLoading } from "@/components/auth/auth-loading";
import { LOGIN_PATH } from "@/lib/auth-paths";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { hasHydrated, token, refreshSession } = useAuthStore();
  const router = useRouter();
  const didSilentRefresh = useRef(false);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!token) {
      didSilentRefresh.current = false;
      router.replace(LOGIN_PATH);
      return;
    }

    if (!didSilentRefresh.current) {
      didSilentRefresh.current = true;
      void refreshSession({ silent: true });
    }
  }, [hasHydrated, refreshSession, router, token]);

  if (!hasHydrated) {
    return <AuthLoading label="Restoring session…" />;
  }

  if (!token) {
    return <AuthLoading label="Redirecting…" />;
  }

  return <>{children}</>;
}
