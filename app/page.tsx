import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}></div>
          Shohoj Ledger
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.navLogin}>Sign In</Link>
          <Link href="/signup" className={styles.navSignup}>Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.badge}>Enterprise Edition v1.1</div>
        <h1 className={styles.title}>
          Enterprise ERP, <br /> <span className={styles.gradientText}>Simplified.</span>
        </h1>
        <p className={styles.description}>
          The unified platform for Finance, HR, Payroll, and Projects. Built for scale, designed for speed. Take control of your business operations in one secure workspace.
        </p>
        
        <div className={styles.ctaGroup}>
          <Link href="/signup" className={styles.primaryCta}>
            Start your free workspace
          </Link>
          <Link href="/login" className={styles.secondaryCta}>
            Sign in to Dashboard
          </Link>
        </div>
        
        <div className={styles.heroImageWrapper}>
          <div className={styles.heroImageGlow}></div>
          <div className={styles.heroImagePlaceholder}>
            <div className={styles.mockDashboard}>
              <div className={styles.mockSidebar}>
                <div className={styles.mockSidebarItem} style={{width: '60%'}}></div>
                <div className={styles.mockSidebarItem} style={{width: '80%'}}></div>
                <div className={styles.mockSidebarItem} style={{width: '50%'}}></div>
                <div className={styles.mockSidebarItem} style={{width: '70%'}}></div>
              </div>
              <div className={styles.mockMain}>
                 <div className={styles.mockHeader}>
                    <div className={styles.mockHeaderItem} style={{width: '200px'}}></div>
                    <div className={styles.mockHeaderItem} style={{width: '40px', borderRadius: '50%'}}></div>
                 </div>
                 <div className={styles.mockCards}>
                    <div className={styles.mockCard}></div>
                    <div className={styles.mockCard}></div>
                    <div className={styles.mockCard}></div>
                 </div>
                 <div className={styles.mockTable}>
                    <div className={styles.mockTableRow}></div>
                    <div className={styles.mockTableRow}></div>
                    <div className={styles.mockTableRow}></div>
                    <div className={styles.mockTableRow}></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className={styles.featuresSection} id="features">
        <div className={styles.sectionHeader}>
          <h2>Everything you need to run your business</h2>
          <p>Seamlessly integrated modules that share the same data context.</p>
        </div>
        <div className={styles.actionGrid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>💰</div>
            <h2>Finance & Accounting</h2>
            <p>Track full and partial payments, automate settlements, and manage corporate reserves with ease.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>👥</div>
            <h2>HR & Payroll</h2>
            <p>Automated attendance tracking, employee lifecycle management, and one-click payroll distribution.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>📊</div>
            <h2>CRM & Projects</h2>
            <p>Monitor client lifecycles, track project milestones, and analyze revenue by project.</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <h3>Shohoj Ledger</h3>
            <p>© 2026 Shohoj. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
