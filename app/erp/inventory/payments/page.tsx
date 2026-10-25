"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";

export default function InventoryPaymentsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/erp/finance/payments");
  }, [router]);

  return (
    <div style={{ padding: "48px 24px", maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
      <div style={{ width: "56px", height: "56px", background: "rgba(37, 99, 235, 0.1)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <CreditCard size={28} />
      </div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px" }}>
        Financial Data Transferred to Finance
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "20px" }}>
        All supplier dues, purchase disbursements, and accounts payable are now managed under the <strong>Finance &amp; Accounts</strong> section.
      </p>
      <Link
        href="/erp/finance/payments"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 18px",
          background: "#2563eb",
          color: "#ffffff",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "0.875rem"
        }}
      >
        <span>Go to Finance Supplier Dues</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
