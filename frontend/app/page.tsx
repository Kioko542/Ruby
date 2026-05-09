"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AuthLoading } from "@/components/auth/auth-loading";
import { useAuthStore } from "@/stores/auth-store";
import { AUTH_REDIRECT_PATH } from "@/lib/auth-paths";

export default function HomePage() {
  const router = useRouter();
  const { hasHydrated, isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && isAuthenticated && token) {
      router.replace(AUTH_REDIRECT_PATH);
    }
  }, [hasHydrated, isAuthenticated, token, router]);

  if (!hasHydrated) {
    return <AuthLoading />;
  }

  if (isAuthenticated && token) {
    return <AuthLoading label="Opening dashboard…" />;
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#fafaf9",
        }}
      >
        <LoginForm />
      </div>
    </>
  );
}
