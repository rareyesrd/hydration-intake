import type { ReactNode } from "react";

import { AuthenticatedLayout } from "@/components/auth/authenticated-layout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
