"use client";

import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";

export function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
