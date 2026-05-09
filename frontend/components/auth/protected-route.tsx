"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, token, refreshSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      void refreshSession();
      return;
    }
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, refreshSession, router, token]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}