"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout/SuperAdminLayout";
import { Shield, RefreshCw } from "lucide-react";

export default function SaaSAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // If visiting the login page, render children immediately without auth check
  const isLoginPage = pathname === "/super-admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthorized(true);
      return;
    }

    const checkSuperAdminAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/super-admin/login");
          return;
        }
        const data = await res.json();
        if (!data.user || data.user.platformRole !== "SUPER_ADMIN") {
          router.replace("/super-admin/login");
          return;
        }
        setAuthorized(true);
      } catch (e) {
        router.replace("/super-admin/login");
      }
    };

    checkSuperAdminAuth();
  }, [pathname, isLoginPage, router]);

  // If on login page, render without the admin shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state while verifying Super Admin status
  if (authorized === null) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        color: "#f8fafc",
        gap: "16px"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: "rgba(168, 85, 247, 0.15)",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#c084fc"
        }}>
          <Shield size={24} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "14px" }}>
          <RefreshCw size={16} className="animate-spin" />
          <span>Verifying Super Admin Authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminLayout>
      {children}
    </SuperAdminLayout>
  );
}
