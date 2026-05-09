"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import Create from "../create";

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <Create />
    </ProtectedRoute>
  );
}
