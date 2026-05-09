"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { hasHydrated, isAuthenticated, isLoading, token, refreshSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    if (token) {
      void refreshSession();
      return;
    }
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [hasHydrated, isAuthenticated, refreshSession, router, token]);

  if (!hasHydrated || isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}