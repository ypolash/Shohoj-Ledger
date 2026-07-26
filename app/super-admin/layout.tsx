"use client";

import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout/SuperAdminLayout";

export default function SaaSAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminLayout>
      {children}
    </SuperAdminLayout>
  );
}
