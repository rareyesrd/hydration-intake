"use client";

import { useEffect, type ReactNode } from "react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";

import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { useAuth } from "@/components/auth/auth-provider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}` as Route);
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading || !user) {
    return <AuthLoadingScreen />;
  }

  return children;
}
