"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { PwaProvider } from "@/components/pwa/pwa-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PwaProvider>{children}</PwaProvider>
    </AuthProvider>
  );
}
