"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
  Wallet,
  Building2,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronDown,
  Globe,
  Database,
  Calculator,
  Briefcase,
  TrendingUp,
  CreditCard,
  MapPin,
  Sparkles,
  Server,
  FileSpreadsheet,
  Check,
  Star,
  Activity,
  DollarSign
} from "lucide-react";
import { Hero3DCanvas } from "./components/Hero3DCanvas";
import styles from "./page.module.css";

export default function HomePage() {
  // Unique IDs for accessibility
  const teamSizeId = useId();
  const txCountId = useId();

  // 1. Hero 3D Stage View Switcher
  const [stageTab, setStageTab] = useState<"FINANCE" | "HR" | "CRM">("FINANCE");

  // 2. Modules Deep Dive Tab Switcher
  const [selectedModule, setSelectedModule] = useState<
    "FINANCE" | "HR" | "CRM" | "INVENTORY" | "PROJECTS" | "SECURITY"
  >("FINANCE");

  // 3. ROI Calculator State
  const [teamSize, setTeamSize] = useState<number>(45);
  const [monthlyTx, setMonthlyTx] = useState<number>(350);

  // Calculations:
  // Avg hours saved per employee/mo: ~3.2 hrs
  // Cost savings estimate ($35/hr avg operational burden): teamSize * 3.2 * 35 + monthlyTx * 4.5
  const hoursSaved = Math.round(teamSize * 3.2 + monthlyTx * 0.15);
  const estimatedSavings = Math.round(hoursSaved * 28);

  // 4. Pricing Switcher (Monthly vs Annual)
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");

  // 5. FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <main className={styles.main}>
      {/* Dynamic Ambient Glow Mesh */}
      <div className={styles.ambientGlowTop} />
      <div className={styles.ambientGlowMid} />
      <div className={styles.ambientGlowBottom} />
      <div className={styles.gridPattern} />

      {/* ================= 1. STICKY NAVBAR ================= */}
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoBadge}>
            <div className={styles.logoIcon} />
          </div>
          <span>Shohoj Ledger</span>
          <span className={styles.navTag}>v2.5.0</span>
        </Link>

        <div className={styles.navLinks}>
          <a href="#modules" className={styles.navLink}>Modules</a>
          <a href="#architecture" className={styles.navLink}>Architecture</a>
          <a href="#roi-calculator" className={styles.navLink}>ROI Calculator</a>
          <a href="#security" className={styles.navLink}>Security</a>
          <a href="#pricing" className={styles.navLink}>Pricing</a>
          <a href="#faqs" className={styles.navLink}>FAQs</a>
        </div>

        <div className={styles.navActions}>
          <Link href="/login" className={styles.navLogin}>Sign In</Link>
          <Link href="/signup" className={styles.navSignup}>
            <span>Get Started Free</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* ================= 2. HERO SECTION WITH 3D STAGE ================= */}
      <section className={styles.hero}>
        {/* Dynamic 3D Interactive WebGL/Canvas Animation */}
        <Hero3DCanvas />

        <div className={styles.heroAnnouncement}>
          <span className={styles.sparkleDot} />
          <span>⚡ Next-Gen Autonomous Enterprise ERP · v2.5.0</span>
        </div>

        <h1 className={styles.heroTitle}>
          The Intelligent OS for <br />
          <span className={styles.gradientText}>Modern Enterprise Governance</span>
        </h1>

        <p className={styles.heroSubtitle}>
          Unified multi-tenant Financial Ledgers, automated Payroll distributions, GPS geofenced HR attendance, and CRM revenue pipelines in one high-performance, real-time workspace.
        </p>

        <div className={styles.heroCtaGroup}>
          <Link href="/signup" className={styles.primaryHeroCta}>
            <span>Launch Your Workspace</span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/login" className={styles.secondaryHeroCta}>
            <span>Sign In to Dashboard</span>
          </Link>
        </div>

        {/* 3D PERSPECTIVE INTERACTIVE STAGE */}
        <div className={styles.stagePerspectiveWrapper}>
          {/* Left Floating Badge */}
          <div className={styles.floatingBadgeLeft}>
            <Activity size={18} color="#38bdf8" />
            <div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>REAL-TIME SETTLEMENT</div>
              <div style={{ fontSize: "0.88rem", color: "#fff", fontWeight: 800 }}>$124,500.00 Cleared</div>
            </div>
          </div>

          {/* Right Floating Badge */}
          <div className={styles.floatingBadgeRight}>
            <MapPin size={18} color="#34d399" />
            <div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>GEOFENCE TELEMETRY</div>
              <div style={{ fontSize: "0.88rem", color: "#fff", fontWeight: 800 }}>99.4% On-Time Validated</div>
            </div>
          </div>

          <div className={styles.stageContainer}>
            <div className={styles.stageWindowHeader}>
              <div className={styles.windowControls}>
                <span className={styles.dotRed} />
                <span className={styles.dotYellow} />
                <span className={styles.dotGreen} />
              </div>

              <div className={styles.stageTabs}>
                <button
                  onClick={() => setStageTab("FINANCE")}
                  className={`${styles.stageTabBtn} ${stageTab === "FINANCE" ? styles.stageTabBtnActive : ""}`}
                >
                  <DollarSign size={14} /> Finance & Ledgers
                </button>
                <button
                  onClick={() => setStageTab("HR")}
                  className={`${styles.stageTabBtn} ${stageTab === "HR" ? styles.stageTabBtnActive : ""}`}
                >
                  <Users size={14} /> HR & Attendance
                </button>
                <button
                  onClick={() => setStageTab("CRM")}
                  className={`${styles.stageTabBtn} ${stageTab === "CRM" ? styles.stageTabBtnActive : ""}`}
                >
                  <TrendingUp size={14} /> CRM & Projects
                </button>
              </div>

              <div className={styles.liveBadge}>
                <span className={styles.sparkleDot} style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
                <span>LIVE SYNC</span>
              </div>
            </div>

            <div className={styles.stageBody}>
              {/* Mini Sidebar */}
              <div className={styles.stageSidebar}>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, paddingLeft: "0.5rem" }}>
                  ACTIVE WORKSPACE
                </div>
                <div className={`${styles.stageSidebarItem} ${styles.stageSidebarItemActive}`}>
                  <BarChart3 size={16} /> Overview Dashboard
                </div>
                <div className={styles.stageSidebarItem}>
                  <Wallet size={16} /> Corporate Ledgers
                </div>
                <div className={styles.stageSidebarItem}>
                  <Users size={16} /> Workforce & Payroll
                </div>
                <div className={styles.stageSidebarItem}>
                  <Package size={16} /> Inventory Hub
                </div>
                <div className={styles.stageSidebarItem}>
                  <ShieldCheck size={16} /> Audit Governance
                </div>
              </div>

              {/* Main Interactive Stage Grid */}
              <div className={styles.stageDashboardGrid}>
                {stageTab === "FINANCE" && (
                  <>
                    <div className={styles.stageStatsRow}>
                      <div className={styles.stageStatCard}>
                        <span className={styles.statCardLabel}>TOTAL ASSETS</span>
                        <span className={styles.statCardVal}>$1,842,900</span>
                        <span className={styles.statCardTrend}>+14.8% vs last mo</span>
                      </div>
                      <div className={styles.stageStatCard}>
                        <span className={styles.statCardLabel}>NET OPERATING REVENUE</span>
                        <span className={styles.statCardVal}>$489,120</span>
                        <span className={styles.statCardTrend}>+8.4% automated</span>
                      </div>
                      <div className={styles.stageStatCard}>
                        <span className={styles.statCardLabel}>DISPATCHED PAYROLL</span>
                        <span className={styles.statCardVal}>$142,300</span>
                        <span className={styles.statCardTrend} style={{ color: "#38bdf8" }}>✓ 100% Reconciled</span>
                      </div>
                    </div>

                    <div className={styles.stageChartCard}>
                      <div className={styles.chartHeader}>
                        <span className={styles.chartTitle}>Monthly Ledger Cash Flow (Receivables vs Outlays)</span>
                        <span style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 700 }}>Real-time Audit Trail</span>
                      </div>
                      <div className={styles.stageMiniBars}>
                        <div className={styles.miniBarCol}>
                          <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ height: "45%" }} /></div>
                          <span className={styles.miniBarLabel}>May</span>
                        </div>
                        <div className={styles.miniBarCol}>
                          <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ height: "65%" }} /></div>
                          <span className={styles.miniBarLabel}>Jun</span>
                        </div>
                        <div className={styles.miniBarCol}>
                          <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ height: "55%" }} /></div>
                          <span className={styles.miniBarLabel}>Jul</span>
                        </div>
                        <div className={styles.miniBarCol}>
                          <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ height: "85%" }} /></div>
                          <span className={styles.miniBarLabel}>Aug</span>
                        </div>
                        <div className={styles.miniBarCol}>
                          <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ height: "92%" }} /></div>
                          <span className={styles.miniBarLabel}>Sep</span>
                        </div>
                        <div className={styles.miniBarCol}>
                          <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ height: "100%", background: "linear-gradient(180deg, #10b981 0%, #059669 100%)" }} /></div>
                          <span className={styles.miniBarLabel}>Current</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {stageTab === "HR" && (
                  <>
                    <div className={styles.stageStatsRow}>
                      <div className={styles.stageStatCard}>
                        <span className={styles.statCardLabel}>TOTAL HEADCOUNT</span>
                        <span className={styles.statCardVal}>248 Staff</span>
                        <span className={styles.statCardTrend}>100% Verified</span>
                      </div>
                      <div className={styles.stageStatCard}>
                        <span className={styles.statCardLabel}>TODAY ON-TIME</span>
                        <span className={styles.statCardVal}>96.4%</span>
                        <span className={styles.statCardTrend}>GPS & WiFi Beacon</span>
                      </div>
                      <div className={styles.stageStatCard}>
                        <span className={styles.statCardLabel}>DATE-WISE ATTENDANCE</span>
                        <span className={styles.statCardVal}>Active</span>
                        <span className={styles.statCardTrend} style={{ color: "#38bdf8" }}>✓ Auto Deductions</span>
                      </div>
                    </div>

                    <div className={styles.stageChartCard}>
                      <div className={styles.chartHeader}>
                        <span className={styles.chartTitle}>Recent Verified Check-Ins (Date-Wise Grouping)</span>
                        <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700 }}>Company Geofence Active</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "0.82rem" }}>
                          <span><strong>Cristiano Ronaldo</strong> · EMP-789135</span>
                          <span style={{ color: "#34d399", fontWeight: 700 }}>09:12 AM · ON-TIME (Dhaka HQ)</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "0.82rem" }}>
                          <span><strong>Lionel Messi</strong> · EMP-378566</span>
                          <span style={{ color: "#fbbf24", fontWeight: 700 }}>09:45 AM · LATE (+15 min)</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "0.82rem" }}>
                          <span><strong>Neymar Jr</strong> · EMP-992144</span>
                          <span style={{ color: "#34d399", fontWeight: 700 }}>08:58 AM · ON-TIME (Sylhet Branch)</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {stageTab === "CRM" && (
                  <>
                    <div className={styles.stageStatsRow}>
                      <div className={styles.stageStatCard}>
                        <span className={styles.statCardLabel}>PIPELINE VALUE</span>
                        <span className={styles.statCardVal}>$742,000</span>
                        <span className={styles.statCardTrend}>+22.4% Win Rate</span>
                      </div>
                      <div className={styles.stageStatCard}>
                        <span className={styles.statCardLabel}>ACTIVE PROJECTS</span>
                        <span className={styles.statCardVal}>18 In-Flight</span>
                        <span className={styles.statCardTrend}>Milestone Linked</span>
                      </div>
                      <div className={styles.stageStatCard}>
                        <span className={styles.statCardLabel}>AUTO INVOICING</span>
                        <span className={styles.statCardVal}>Enabled</span>
                        <span className={styles.statCardTrend} style={{ color: "#38bdf8" }}>Syncs to GL</span>
                      </div>
                    </div>

                    <div className={styles.stageChartCard}>
                      <div className={styles.chartHeader}>
                        <span className={styles.chartTitle}>Opportunity Pipeline & Revenue Milestones</span>
                        <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>Kanban Auto-Sync</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px", borderTop: "2px solid #38bdf8" }}>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>PROPOSALS (4)</div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>$185,000</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px", borderTop: "2px solid #f59e0b" }}>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>NEGOTIATION (2)</div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>$320,000</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px", borderTop: "2px solid #10b981" }}>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>WON & SETTLED (9)</div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>$237,000</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. LIVE TELEMETRY BAR ================= */}
      <section className={styles.telemetrySection} id="architecture">
        <div className={styles.telemetryGrid}>
          <div className={styles.telemetryCard}>
            <span className={styles.telemetryVal}>$24.5M+</span>
            <span className={styles.telemetryLabel}>Reconciled Financial Volume</span>
          </div>
          <div className={styles.telemetryCard}>
            <span className={styles.telemetryVal}>99.99%</span>
            <span className={styles.telemetryLabel}>Guaranteed Platform Uptime</span>
          </div>
          <div className={styles.telemetryCard}>
            <span className={styles.telemetryVal}>50,000+</span>
            <span className={styles.telemetryLabel}>Daily Employee Attendance Logs</span>
          </div>
          <div className={styles.telemetryCard}>
            <span className={styles.telemetryVal}>12+</span>
            <span className={styles.telemetryLabel}>Fully Autonomous ERP Modules</span>
          </div>
        </div>
      </section>

      {/* ================= 4. DEEP-DIVE MODULES MATRIX ================= */}
      <section className={styles.sectionWrapper} id="modules">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionPill}>
            <Sparkles size={14} /> Modular Architecture
          </div>
          <h2 className={styles.sectionTitle}>Everything You Need to Run at Scale</h2>
          <p className={styles.sectionSubtitle}>
            Engineered from first principles with zero data silos. Every transaction, employee event, and invoice updates the master ledger in real time.
          </p>
        </div>

        {/* Module Switcher Tabs */}
        <div className={styles.moduleTabsList}>
          <button
            onClick={() => setSelectedModule("FINANCE")}
            className={`${styles.moduleTabBtn} ${selectedModule === "FINANCE" ? styles.moduleTabBtnActive : ""}`}
          >
            <Wallet size={16} /> Finance & Treasury
          </button>
          <button
            onClick={() => setSelectedModule("HR")}
            className={`${styles.moduleTabBtn} ${selectedModule === "HR" ? styles.moduleTabBtnActive : ""}`}
          >
            <Users size={16} /> HR & Workforce
          </button>
          <button
            onClick={() => setSelectedModule("CRM")}
            className={`${styles.moduleTabBtn} ${selectedModule === "CRM" ? styles.moduleTabBtnActive : ""}`}
          >
            <TrendingUp size={16} /> CRM & Pipelines
          </button>
          <button
            onClick={() => setSelectedModule("INVENTORY")}
            className={`${styles.moduleTabBtn} ${selectedModule === "INVENTORY" ? styles.moduleTabBtnActive : ""}`}
          >
            <Package size={16} /> Inventory & Stock
          </button>
          <button
            onClick={() => setSelectedModule("PROJECTS")}
            className={`${styles.moduleTabBtn} ${selectedModule === "PROJECTS" ? styles.moduleTabBtnActive : ""}`}
          >
            <Briefcase size={16} /> Project Management
          </button>
          <button
            onClick={() => setSelectedModule("SECURITY")}
            className={`${styles.moduleTabBtn} ${selectedModule === "SECURITY" ? styles.moduleTabBtnActive : ""}`}
          >
            <ShieldCheck size={16} /> Multi-Tenant Security
          </button>
        </div>

        {/* Selected Module Detail Card */}
        <div className={styles.moduleDetailCard}>
          {selectedModule === "FINANCE" && (
            <>
              <div className={styles.moduleContentArea}>
                <div className={styles.moduleBadgeRow}>
                  <div className={styles.moduleIconBox}><Wallet size={24} /></div>
                  <div>
                    <span className={styles.sectionPill} style={{ margin: 0 }}>Core Module</span>
                    <h3 className={styles.moduleCardTitle}>Corporate Finance & Ledgers</h3>
                  </div>
                </div>
                <p className={styles.moduleCardDesc}>
                  Eliminate spreadsheet chaos with real-time double-entry general ledgers, multi-currency corporate reserves, automated bank reconciliations, and custom fiscal periods.
                </p>
                <div className={styles.moduleFeatureList}>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Multi-tiered Chart of Accounts</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Automated Tax & VAT Reporting</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Partial & Milestone Invoicing</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Corporate Fund Transfers & Audit</span>
                  </div>
                </div>
              </div>

              <div className={styles.moduleInteractivePreview}>
                <div className={styles.previewTopBar}>
                  <span className={styles.previewTitle}>General Ledger Settlement</span>
                  <span className={styles.previewBadge}>Balanced · Audit Passed</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Journal #JE-8902</span>
                  <span className={styles.previewRowVal}>+$18,500.00 (Customer Invoice)</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Payroll Run #PR-04</span>
                  <span className={styles.previewRowVal} style={{ color: "#f87171" }}>-$12,450.00 (Settled)</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Corporate Reserve Bal.</span>
                  <span className={styles.previewRowVal} style={{ color: "#34d399" }}>$1,240,850.00</span>
                </div>
              </div>
            </>
          )}

          {selectedModule === "HR" && (
            <>
              <div className={styles.moduleContentArea}>
                <div className={styles.moduleBadgeRow}>
                  <div className={styles.moduleIconBox}><Users size={24} /></div>
                  <div>
                    <span className={styles.sectionPill} style={{ margin: 0 }}>Smart Workforce</span>
                    <h3 className={styles.moduleCardTitle}>Automated HR & Payroll</h3>
                  </div>
                </div>
                <p className={styles.moduleCardDesc}>
                  Track workforce attendance through geofenced mobile verification, calculate late durations automatically, manage leaves and advances, and execute payroll in one single click.
                </p>
                <div className={styles.moduleFeatureList}>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>GPS & WiFi BSSID Attendance Guard</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Date-Wise Grouped Attendance View</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>1-Click Bulk Payslip Generation</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Automated Late & Leave Deductions</span>
                  </div>
                </div>
              </div>

              <div className={styles.moduleInteractivePreview}>
                <div className={styles.previewTopBar}>
                  <span className={styles.previewTitle}>Monthly Payroll Batch</span>
                  <span className={styles.previewBadge}>Ready to Disburse</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Staff In Batch</span>
                  <span className={styles.previewRowVal}>248 Employees</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Late / Absent Deductions</span>
                  <span className={styles.previewRowVal} style={{ color: "#fbbf24" }}>-$1,840.00 (Automated)</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Net Payout Total</span>
                  <span className={styles.previewRowVal} style={{ color: "#34d399" }}>$140,460.00</span>
                </div>
              </div>
            </>
          )}

          {selectedModule === "CRM" && (
            <>
              <div className={styles.moduleContentArea}>
                <div className={styles.moduleBadgeRow}>
                  <div className={styles.moduleIconBox}><TrendingUp size={24} /></div>
                  <div>
                    <span className={styles.sectionPill} style={{ margin: 0 }}>Sales Velocity</span>
                    <h3 className={styles.moduleCardTitle}>CRM & Opportunities Pipeline</h3>
                  </div>
                </div>
                <p className={styles.moduleCardDesc}>
                  Turn prospective leads into high-yield enterprise deals. Visual Kanban pipelines, smart quote builders with margin calculators, and automated sales commission tracking.
                </p>
                <div className={styles.moduleFeatureList}>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Visual Drag-and-Drop Kanban</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Quotation-to-Invoice 1-Click Conversion</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Client Credit Limit & Aging Alerts</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Sales Representative Performance Telemetry</span>
                  </div>
                </div>
              </div>

              <div className={styles.moduleInteractivePreview}>
                <div className={styles.previewTopBar}>
                  <span className={styles.previewTitle}>Deal Pipeline Status</span>
                  <span className={styles.previewBadge}>Active Cycle</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Acme Corp Cloud Migration</span>
                  <span className={styles.previewRowVal}>$85,000 (80% Win Prob.)</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Global Retail ERP Suite</span>
                  <span className={styles.previewRowVal} style={{ color: "#34d399" }}>$140,000 (Won)</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Monthly Forecast</span>
                  <span className={styles.previewRowVal}>$345,000.00</span>
                </div>
              </div>
            </>
          )}

          {selectedModule === "INVENTORY" && (
            <>
              <div className={styles.moduleContentArea}>
                <div className={styles.moduleBadgeRow}>
                  <div className={styles.moduleIconBox}><Package size={24} /></div>
                  <div>
                    <span className={styles.sectionPill} style={{ margin: 0 }}>Supply Chain</span>
                    <h3 className={styles.moduleCardTitle}>Multi-Warehouse Inventory</h3>
                  </div>
                </div>
                <p className={styles.moduleCardDesc}>
                  Real-time stock valuation with FIFO/Weighted Average cost methods, batch & serial tracking, barcode printing, and cross-warehouse transfer orders.
                </p>
                <div className={styles.moduleFeatureList}>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Multi-Location Warehouse Allocation</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Goods Receipt Note (GRN) Approvals</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Batch Number & Expiry Validation</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Automated Stock Re-order Triggers</span>
                  </div>
                </div>
              </div>

              <div className={styles.moduleInteractivePreview}>
                <div className={styles.previewTopBar}>
                  <span className={styles.previewTitle}>Warehouse Central Stock</span>
                  <span className={styles.previewBadge}>Optimized</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>SKU Items Monitored</span>
                  <span className={styles.previewRowVal}>1,420 Active SKUs</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Total Stock Valuation</span>
                  <span className={styles.previewRowVal} style={{ color: "#34d399" }}>$490,200.00</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Low-Stock Notifications</span>
                  <span className={styles.previewRowVal} style={{ color: "#38bdf8" }}>0 Critical Alerts</span>
                </div>
              </div>
            </>
          )}

          {selectedModule === "PROJECTS" && (
            <>
              <div className={styles.moduleContentArea}>
                <div className={styles.moduleBadgeRow}>
                  <div className={styles.moduleIconBox}><Briefcase size={24} /></div>
                  <div>
                    <span className={styles.sectionPill} style={{ margin: 0 }}>Execution</span>
                    <h3 className={styles.moduleCardTitle}>Project & Milestone Intelligence</h3>
                  </div>
                </div>
                <p className={styles.moduleCardDesc}>
                  Deliver complex customer projects on schedule. Link billable timesheets, expenses, and deliverables directly to project profit & loss statements.
                </p>
                <div className={styles.moduleFeatureList}>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Milestone-Based Billing Schedules</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Employee Task Rewards & Bounties</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Real-Time Project P&L Margin Tracking</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Client Collaboration Portal</span>
                  </div>
                </div>
              </div>

              <div className={styles.moduleInteractivePreview}>
                <div className={styles.previewTopBar}>
                  <span className={styles.previewTitle}>Project Zeta Delivery</span>
                  <span className={styles.previewBadge}>Phase 3 Completed</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Milestone Billed</span>
                  <span className={styles.previewRowVal}>$45,000 / $60,000</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Operating Profit Margin</span>
                  <span className={styles.previewRowVal} style={{ color: "#34d399" }}>42.8% ROI</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Delivery Timeline</span>
                  <span className={styles.previewRowVal} style={{ color: "#38bdf8" }}>4 Days Ahead of Target</span>
                </div>
              </div>
            </>
          )}

          {selectedModule === "SECURITY" && (
            <>
              <div className={styles.moduleContentArea}>
                <div className={styles.moduleBadgeRow}>
                  <div className={styles.moduleIconBox}><ShieldCheck size={24} /></div>
                  <div>
                    <span className={styles.sectionPill} style={{ margin: 0 }}>Governance</span>
                    <h3 className={styles.moduleCardTitle}>Multi-Tenant Zero-Trust Security</h3>
                  </div>
                </div>
                <p className={styles.moduleCardDesc}>
                  Strict organizational multi-tenant schema isolation, granular Role-Based Access Control (RBAC), tamper-proof immutable audit logs, and hardware device binding.
                </p>
                <div className={styles.moduleFeatureList}>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Granular RBAC Permission Matrices</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Automated Password & Session Recovery</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>End-to-End Cryptographic Tokens</span>
                  </div>
                  <div className={styles.moduleFeatureItem}>
                    <CheckCircle2 size={16} className={styles.featureCheckIcon} />
                    <span>Real-Time Audit Event Trail</span>
                  </div>
                </div>
              </div>

              <div className={styles.moduleInteractivePreview}>
                <div className={styles.previewTopBar}>
                  <span className={styles.previewTitle}>Security Perimeter</span>
                  <span className={styles.previewBadge}>Shield Active</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Tenant Isolation</span>
                  <span className={styles.previewRowVal}>Strict Multi-Tenant</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Audit Events Logged</span>
                  <span className={styles.previewRowVal} style={{ color: "#34d399" }}>100% Immutable</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewRowLabel}>Security Clearance</span>
                  <span className={styles.previewRowVal} style={{ color: "#38bdf8" }}>SOC2 & GDPR Ready</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================= 5. 3D WORKFLOW PIPELINE ================= */}
      <section className={styles.sectionWrapper}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionPill}>
            <Layers size={14} /> Unified Lifecycle
          </div>
          <h2 className={styles.sectionTitle}>Zero Double-Entry. Total Automation.</h2>
          <p className={styles.sectionSubtitle}>
            Watch how a single customer action propagates instantaneously across CRM, stock, ledgers, and staff payroll.
          </p>
        </div>

        <div className={styles.workflowPipelineGrid}>
          <div className={styles.pipelineCard}>
            <span className={styles.pipelineStepNumber}>STEP 01</span>
            <h3 className={styles.pipelineCardTitle}>Deal Won & Quoted</h3>
            <p className={styles.pipelineCardDesc}>
              Sales rep finalizes contract in CRM. Quotation is automatically converted to an approved Sales Order with verified tax calculations.
            </p>
          </div>

          <div className={styles.pipelineCard}>
            <span className={styles.pipelineStepNumber}>STEP 02</span>
            <h3 className={styles.pipelineCardTitle}>Stock & Project Allocated</h3>
            <p className={styles.pipelineCardDesc}>
              Inventory automatically reserves necessary SKU units. Project manager receives auto-generated delivery milestones and assigned tasks.
            </p>
          </div>

          <div className={styles.pipelineCard}>
            <span className={styles.pipelineStepNumber}>STEP 03</span>
            <h3 className={styles.pipelineCardTitle}>Ledger & Payroll Dispatched</h3>
            <p className={styles.pipelineCardDesc}>
              Customer payment is credited to general ledger. Staff task bounties and monthly salaries are calculated and disbursed automatically.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 6. INTERACTIVE ROI CALCULATOR ================= */}
      <section className={styles.sectionWrapper} id="roi-calculator">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionPill}>
            <Calculator size={14} /> Quantifiable Impact
          </div>
          <h2 className={styles.sectionTitle}>Calculate Your Organization&apos;s ROI</h2>
          <p className={styles.sectionSubtitle}>
            See how much operational time and budget you reclaim by consolidating fragmented accounting, HR, and CRM tools into Shohoj Ledger.
          </p>
        </div>

        <div className={styles.roiCard}>
          <div className={styles.roiControlGroup}>
            <div className={styles.sliderWrapper}>
              <div className={styles.sliderHeader}>
                <label htmlFor={teamSizeId} className={styles.sliderLabel}>Company Team Size</label>
                <span className={styles.sliderValueBadge}>{teamSize} Employees</span>
              </div>
              <input
                id={teamSizeId}
                type="range"
                min="5"
                max="500"
                step="5"
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>

            <div className={styles.sliderWrapper}>
              <div className={styles.sliderHeader}>
                <label htmlFor={txCountId} className={styles.sliderLabel}>Monthly Invoices & Transactions</label>
                <span className={styles.sliderValueBadge}>{monthlyTx} Tx / Month</span>
              </div>
              <input
                id={txCountId}
                type="range"
                min="50"
                max="2500"
                step="50"
                value={monthlyTx}
                onChange={(e) => setMonthlyTx(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>
          </div>

          <div className={styles.roiResultBox}>
            <div className={styles.roiBigMetric}>
              <span className={styles.roiMetricLabel}>ESTIMATED ANNUAL SAVINGS</span>
              <span className={styles.roiMetricVal}>${(estimatedSavings * 12).toLocaleString()}</span>
            </div>

            <div className={styles.roiBreakdownRow}>
              <span style={{ color: "#94a3b8" }}>Reclaimed Admin Time</span>
              <span className={styles.roiBreakdownVal}>{hoursSaved} Hours / Month</span>
            </div>
            <div className={styles.roiBreakdownRow}>
              <span style={{ color: "#94a3b8" }}>Direct Monthly Cost Reduction</span>
              <span className={styles.roiBreakdownVal} style={{ color: "#34d399" }}>
                ${estimatedSavings.toLocaleString()} / Month
              </span>
            </div>
            <div className={styles.roiBreakdownRow}>
              <span style={{ color: "#94a3b8" }}>Average Payback Period</span>
              <span className={styles.roiBreakdownVal} style={{ color: "#38bdf8" }}>Under 12 Days</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 7. SECURITY & MULTI-TENANCY ================= */}
      <section className={styles.sectionWrapper} id="security">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionPill}>
            <Lock size={14} /> Enterprise Guard
          </div>
          <h2 className={styles.sectionTitle}>Built for Extreme Security & Reliability</h2>
          <p className={styles.sectionSubtitle}>
            Your financial records and employee data are protected with bank-grade encryption, immutable audit trails, and multi-tenant schema isolation.
          </p>
        </div>

        <div className={styles.securityGrid}>
          <div className={styles.securityCard}>
            <div className={styles.securityIconBox}><Database size={22} /></div>
            <h3 style={{ fontSize: "1.25rem", margin: 0, color: "#fff", fontWeight: 700 }}>Tenant Data Isolation</h3>
            <p style={{ fontSize: "0.92rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              Each organization operates within strict tenancy boundaries with separate workspace contexts and zero cross-tenant data leakage.
            </p>
          </div>

          <div className={styles.securityCard}>
            <div className={styles.securityIconBox}><ShieldCheck size={22} /></div>
            <h3 style={{ fontSize: "1.25rem", margin: 0, color: "#fff", fontWeight: 700 }}>Role-Based Access (RBAC)</h3>
            <p style={{ fontSize: "0.92rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              Custom role assignment with module-by-module read/write/approve permissions down to individual ledgers and salary slips.
            </p>
          </div>

          <div className={styles.securityCard}>
            <div className={styles.securityIconBox}><Server size={22} /></div>
            <h3 style={{ fontSize: "1.25rem", margin: 0, color: "#fff", fontWeight: 700 }}>Immutable Global Audit Log</h3>
            <p style={{ fontSize: "0.92rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              Every financial adjustment, voucher approval, check-in override, and password change is permanently recorded with actor identity and IP stamps.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 8. PRICING SECTION ================= */}
      <section className={styles.sectionWrapper} id="pricing">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionPill}>
            <CreditCard size={14} /> Transparent Pricing
          </div>
          <h2 className={styles.sectionTitle}>Simple, Predictable Plans</h2>
          <p className={styles.sectionSubtitle}>
            Scale seamlessly from emerging businesses to multi-branch enterprises without hidden fees.
          </p>
        </div>

        <div className={styles.pricingToggleContainer}>
          <div className={styles.pricingToggleBtn}>
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`${styles.toggleOption} ${billingCycle === "MONTHLY" ? styles.toggleOptionActive : ""}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("ANNUAL")}
              className={`${styles.toggleOption} ${billingCycle === "ANNUAL" ? styles.toggleOptionActive : ""}`}
            >
              Annual Billing
            </button>
          </div>
          <span className={styles.discountBadge}>Save 20% on Annual</span>
        </div>

        <div className={styles.pricingGrid}>
          {/* STARTER */}
          <div className={styles.pricingCard}>
            <div>
              <div className={styles.pricingHeader}>
                <h3 className={styles.pricingPlanName}>Starter Edition</h3>
                <p className={styles.pricingPlanDesc}>Essential ledgers and payroll for small teams</p>
              </div>

              <div className={styles.pricingPriceRow}>
                <span className={styles.pricingPrice}>{billingCycle === "ANNUAL" ? "$24" : "$29"}</span>
                <span className={styles.pricingPeriod}>/ month</span>
              </div>

              <ul className={styles.pricingFeatureList}>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Up to 25 Staff Accounts</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Double-Entry General Ledger</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Automated Payroll Runs</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Date-Wise Attendance View</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Standard Email Support</li>
              </ul>
            </div>

            <Link href="/signup" className={styles.pricingCtaBtn}>Start 14-Day Free Trial</Link>
          </div>

          {/* GROWTH (POPULAR) */}
          <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
            <span className={styles.popularBadge}>Most Popular</span>
            <div>
              <div className={styles.pricingHeader}>
                <h3 className={styles.pricingPlanName}>Growth Business</h3>
                <p className={styles.pricingPlanDesc}>Full ERP suite for growing multi-department companies</p>
              </div>

              <div className={styles.pricingPriceRow}>
                <span className={styles.pricingPrice}>{billingCycle === "ANNUAL" ? "$64" : "$79"}</span>
                <span className={styles.pricingPeriod}>/ month</span>
              </div>

              <ul className={styles.pricingFeatureList}>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Up to 150 Staff Accounts</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> All Starter Features Included</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> CRM Kanban & Sales Pipelines</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Multi-Warehouse Stock & GRN</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> GPS Mobile Geofencing Guard</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Priority 24/7 Support</li>
              </ul>
            </div>

            <Link href="/signup" className={`${styles.pricingCtaBtn} ${styles.pricingCtaPopular}`}>
              Deploy Growth ERP
            </Link>
          </div>

          {/* ENTERPRISE SCALE */}
          <div className={styles.pricingCard}>
            <div>
              <div className={styles.pricingHeader}>
                <h3 className={styles.pricingPlanName}>Enterprise Scale</h3>
                <p className={styles.pricingPlanDesc}>Uncapped operations, custom integrations & SLA</p>
              </div>

              <div className={styles.pricingPriceRow}>
                <span className={styles.pricingPrice}>{billingCycle === "ANNUAL" ? "$159" : "$199"}</span>
                <span className={styles.pricingPeriod}>/ month</span>
              </div>

              <ul className={styles.pricingFeatureList}>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Unlimited Staff Accounts</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Multi-Branch Consolidated Ledgers</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Dedicated Database Instance</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> Custom ERP Integrations & API</li>
                <li className={styles.pricingFeatureItem}><Check size={16} color="#38bdf8" /> 99.99% Guaranteed SLA & Manager</li>
              </ul>
            </div>

            <Link href="/signup" className={styles.pricingCtaBtn}>Contact Enterprise Team</Link>
          </div>
        </div>
      </section>

      {/* ================= 9. FAQ ACCORDION ================= */}
      <section className={styles.sectionWrapper} id="faqs">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionPill}>
            <Globe size={14} /> Clear Answers
          </div>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to know about migrations, security, and deploying Shohoj Ledger.
          </p>
        </div>

        <div className={styles.faqContainer}>
          {[
            {
              q: "How does the GPS and WiFi Geofencing mobile attendance work?",
              a: "When staff check in via the mobile employee app, Shohoj Ledger calculates the geodesic distance to your company coordinates and verifies router WiFi BSSID signatures. If an employee is outside the boundary, check-in is logged with an exception flag or blocked per your company policy."
            },
            {
              q: "Can we migrate our existing Chart of Accounts and Excel records?",
              a: "Yes! Shohoj Ledger provides one-click CSV and Excel import templates for your existing Chart of Accounts, Customers, Suppliers, Employee profiles, and opening journal balances with zero data loss."
            },
            {
              q: "Is each tenant's data isolated?",
              a: "Absolutely. Shohoj Ledger uses strict multi-tenant context enforcement. Every database query, ledger entry, and session token is scoped to your verified company ID."
            },
            {
              q: "What happens if our staff or managers forget their passwords?",
              a: "Shohoj Ledger includes a complete cryptographic self-service password recovery system with 6-digit OTP verification and secure reset tokens for both Admin and Employee accounts."
            },
            {
              q: "Can we run partial invoicing and milestone billing on projects?",
              a: "Yes. Invoices can be generated for partial percentages or fixed milestones. Payments are tracked individually and linked automatically to your project profit and loss statements."
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`${styles.faqItem} ${openFaq === idx ? styles.faqItemOpen : ""}`}
            >
              <button
                onClick={() => toggleFaq(idx)}
                className={styles.faqQuestionBtn}
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={18}
                  style={{
                    transform: openFaq === idx ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease"
                  }}
                />
              </button>
              {openFaq === idx && (
                <div className={styles.faqAnswer}>{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================= 10. HIGH CONVERTING FINAL CTA ================= */}
      <section className={styles.finalCtaSection}>
        <div className={styles.finalCtaCard}>
          <div className={styles.sectionPill}>
            <Zap size={14} /> Instant Deployment
          </div>
          <h2 className={styles.finalCtaTitle}>
            Ready to Take Complete Control of Your Enterprise?
          </h2>
          <p className={styles.finalCtaDesc}>
            Join modern organizations simplifying their accounting, workforce, and sales operations. Start your 14-day free workspace in under 60 seconds.
          </p>
          <div className={styles.heroCtaGroup} style={{ marginBottom: 0 }}>
            <Link href="/signup" className={styles.primaryHeroCta}>
              <span>Start Free Workspace</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className={styles.secondaryHeroCta}>
              <span>Sign In to Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 11. MEGA FOOTER ================= */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrandCol}>
            <div className={styles.logo}>
              <div className={styles.logoBadge}><div className={styles.logoIcon} /></div>
              <span>Shohoj Ledger</span>
            </div>
            <p className={styles.footerDesc}>
              The unified intelligence platform for Financial Ledgers, Corporate Reserves, HR Operations, and Enterprise Governance.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span className={styles.sparkleDot} style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>All Systems Operational · v2.5.0</span>
            </div>
          </div>

          <div>
            <div className={styles.footerColTitle}>Modules</div>
            <ul className={styles.footerLinksList}>
              <li><a href="#modules" className={styles.footerLink}>Finance & Ledgers</a></li>
              <li><a href="#modules" className={styles.footerLink}>HR & Attendance</a></li>
              <li><a href="#modules" className={styles.footerLink}>Payroll Engine</a></li>
              <li><a href="#modules" className={styles.footerLink}>CRM & Opportunities</a></li>
              <li><a href="#modules" className={styles.footerLink}>Warehouse Inventory</a></li>
            </ul>
          </div>

          <div>
            <div className={styles.footerColTitle}>Platform</div>
            <ul className={styles.footerLinksList}>
              <li><a href="#architecture" className={styles.footerLink}>Architecture</a></li>
              <li><a href="#security" className={styles.footerLink}>Security & RBAC</a></li>
              <li><a href="#roi-calculator" className={styles.footerLink}>ROI Calculator</a></li>
              <li><a href="#pricing" className={styles.footerLink}>Pricing Plans</a></li>
              <li><Link href="/forgot-password" className={styles.footerLink}>Password Recovery</Link></li>
            </ul>
          </div>

          <div>
            <div className={styles.footerColTitle}>Access & Portals</div>
            <ul className={styles.footerLinksList}>
              <li><Link href="/login" className={styles.footerLink}>Workspace Sign In</Link></li>
              <li><Link href="/signup" className={styles.footerLink}>Create Free Account</Link></li>
              <li><Link href="/staff" className={styles.footerLink}>Staff Mobile App</Link></li>
              <li><Link href="/super-admin/login" className={styles.footerLink}>Super Admin Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div>© 2026 Shohoj Solution. All rights reserved.</div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <span style={{ color: "#475569" }}>Multi-Tenant Architecture</span>
            <span style={{ color: "#475569" }}>ISO-27001 & SOC2 Ready</span>
            <span style={{ color: "#475569" }}>End-to-End Cryptography</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
