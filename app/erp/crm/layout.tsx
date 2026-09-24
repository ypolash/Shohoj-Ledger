"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { getFeatureByKey } from "@/lib/billing/crmFeatures";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  featureKey: string;
  exact?: boolean;
  matchAlso?: string;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/erp/crm", icon: "dashboard", featureKey: "crm_dashboard", exact: true },
  { name: "Customers", href: "/erp/crm/customers", icon: "person_search", featureKey: "crm_customers", exact: false },
  { name: "Follow Ups", href: "/erp/crm/follow-ups", icon: "event_upcoming", featureKey: "crm_follow_ups", exact: false },
  { name: "Leads", href: "/erp/crm/leads", icon: "view_kanban", featureKey: "crm_leads", exact: false },
  { name: "Opportunities", href: "/erp/crm/opportunities", icon: "trending_up", featureKey: "crm_opportunities", exact: false },
  { name: "Quotations", href: "/erp/crm/quotations", icon: "request_quote", featureKey: "crm_quotations", exact: false },
  { name: "Sales Orders", href: "/erp/crm/sales-orders", icon: "shopping_cart", featureKey: "crm_sales_orders", exact: false, matchAlso: "/erp/crm/orders" },
  { name: "Reports", href: "/erp/crm/reports", icon: "analytics", featureKey: "crm_reports", exact: false },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [planFeatures, setPlanFeatures] = useState<string[]>([]);
  const [planName, setPlanName] = useState<string>("Loading Plan...");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanFeatures = async () => {
      try {
        const res = await fetch("/api/crm/plan-features");
        if (res.ok) {
          const data = await res.json();
          setPlanFeatures(data.features || data.allowedFeatureKeys || []);
          setPlanName(data.planName || "Active Plan");
          setIsSuperAdmin(Boolean(data.isSuperAdmin));
        }
      } catch (err) {
        console.error("Failed to load plan features:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanFeatures();
  }, []);

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    if (pathname.startsWith(item.href)) {
      return true;
    }
    if (item.matchAlso && pathname.startsWith(item.matchAlso)) {
      return true;
    }
    return false;
  };

  const isFeatureAllowed = (featureKey: string) => {
    if (isSuperAdmin) return true;
    if (loading) return true; // Don't prematurely lock while loading
    if (planFeatures.includes("*") || planFeatures.includes("ALL_FEATURES")) return true;
    return planFeatures.includes(featureKey);
  };

  const currentActiveItem = navigation.find(isItemActive);
  const currentFeatureKey = currentActiveItem?.featureKey;
  const isCurrentFeatureLocked = currentFeatureKey ? !isFeatureAllowed(currentFeatureKey) : false;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Top Floating Pill Navigation */}
      <div style={{ padding: "24px 24px 0 24px", flexShrink: 0, background: "var(--surface-bg)" }}>
        <header
          style={{
            background: "var(--surface-card)",
            borderRadius: "50px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "1px solid var(--border-main)",
            padding: "8px 24px 8px 8px",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            gap: "16px",
            overflowX: "auto",
          }}
        >
          {/* Left Side Pill Badge (Current Section) */}
          <div
            style={{
              justifySelf: "start",
              background: "var(--text-main)",
              color: "var(--bg-main)",
              padding: "8px 20px",
              borderRadius: "50px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 700,
              fontSize: "15px",
              whiteSpace: "nowrap",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              {currentActiveItem?.icon || "groups"}
            </span>
            <span>
              {currentActiveItem && currentActiveItem.name !== "Dashboard"
                ? `CRM · ${currentActiveItem.name}`
                : "CRM & Sales"}
            </span>
          </div>

          {/* Navigation Links with Dynamic Feature Indicators */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "nowrap",
              overflowX: "auto",
            }}
          >
            {navigation.map((item) => {
              const active = isItemActive(item);
              const allowed = isFeatureAllowed(item.featureKey);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    fontSize: "13px",
                    fontWeight: active ? 600 : 500,
                    color: active
                      ? "var(--primary)"
                      : allowed
                      ? "var(--text-secondary)"
                      : "var(--text-muted)",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    background: active
                      ? "var(--primary-glow, rgba(59, 130, 246, 0.12))"
                      : "transparent",
                    whiteSpace: "nowrap",
                    opacity: allowed ? 1 : 0.65,
                    position: "relative",
                  }}
                  title={!allowed ? `${item.name} is not included in your current subscription` : undefined}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>

                  {!allowed && (
                    <span
                      style={{
                        marginLeft: "2px",
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px",
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.2)",
                        color: "#ef4444",
                      }}
                      title="Locked on current plan"
                    >
                      <Lock size={11} strokeWidth={2.5} />
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Subscription Plan Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "14px",
                background: isSuperAdmin
                  ? "rgba(168, 85, 247, 0.15)"
                  : "rgba(99, 102, 241, 0.12)",
                color: isSuperAdmin ? "#c084fc" : "#818cf8",
                border: `1px solid ${
                  isSuperAdmin ? "rgba(168, 85, 247, 0.3)" : "rgba(99, 102, 241, 0.25)"
                }`,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
              }}
            >
              {isSuperAdmin ? <ShieldCheck size={13} /> : <Sparkles size={12} />}
              {planName}
            </span>
          </div>
        </header>
      </div>

      {/* Main CRM Content Area or Feature Lock Barrier */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "var(--surface-bg)" }}>
        {isCurrentFeatureLocked ? (
          <div
            style={{
              maxWidth: "600px",
              margin: "60px auto",
              padding: "40px",
              borderRadius: "20px",
              textAlign: "center",
              background: "var(--surface-card)",
              border: "1px solid var(--border-main)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "18px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                marginBottom: "20px",
              }}
            >
              <Lock size={32} />
            </div>

            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#ef4444",
                marginBottom: "6px",
              }}
            >
              Feature Not Included In Plan
            </span>

            <h2 style={{ margin: "0 0 12px 0", fontSize: "22px", fontWeight: 700, color: "var(--text-main)" }}>
              Unlock {currentActiveItem?.name}
            </h2>

            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: "1.6",
                maxWidth: "460px",
              }}
            >
              {currentFeatureKey && getFeatureByKey(currentFeatureKey)?.description ? (
                getFeatureByKey(currentFeatureKey)?.description
              ) : (
                `The ${currentActiveItem?.name} module is not included in your current subscription plan.`
              )}
              <br />
              Your company is currently enrolled in <strong>{planName}</strong>.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <Link
                href="/erp/crm"
                style={{
                  textDecoration: "none",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-main)",
                  background: "var(--surface-subtle)",
                  color: "var(--text-main)",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Back to Dashboard
              </Link>

              <Link
                href="/erp/support"
                style={{
                  textDecoration: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  background: "var(--primary)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                }}
              >
                <span>Request Plan Upgrade</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
