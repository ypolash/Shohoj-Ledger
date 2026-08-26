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
        <div className={styles.badge}>Enterprise Edition v2.0</div>
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

      {/* Finance Details Section */}
      <div className={styles.detailSection}>
        <div className={styles.detailImage}>
          <img src="/finance-vector.jpg" alt="Finance and Accounting vector art" />
        </div>
        <div className={styles.detailContent}>
          <h2 className={styles.detailTitle}>Finance & Accounting Details</h2>
          <p className={styles.detailDescription}>
            Gain complete visibility into your organization's financial health. Our advanced accounting module supports multi-currency ledgers, automated reconciliation, and deep integrations with payroll and project billing.
          </p>
          <ul className={styles.detailList}>
            <li>✨ Real-time general ledger updates</li>
            <li>✨ Automated tax calculations and compliance reporting</li>
            <li>✨ Smart invoicing with partial payment tracking</li>
          </ul>
        </div>
      </div>

      {/* HR Details Section */}
      <div className={styles.detailSection}>
        <div className={styles.detailContent}>
          <h2 className={styles.detailTitle}>HR & Payroll Details</h2>
          <p className={styles.detailDescription}>
            Streamline your workforce management with an integrated HR system. From automated attendance and lifecycle tracking to one-click payroll distribution, we help you focus on your people, not paperwork.
          </p>
          <ul className={styles.detailList}>
            <li>✨ One-click automated payroll runs</li>
            <li>✨ Interactive employee lifecycle tracking</li>
            <li>✨ Built-in attendance and leave management</li>
          </ul>
        </div>
        <div className={styles.detailImage}>
          <img src="/hr-vector.jpg" alt="HR and Payroll vector art" />
        </div>
      </div>

      {/* CRM & Projects Details Section */}
      <div className={styles.detailSection}>
        <div className={styles.detailImage}>
          <img src="/crm-projects-vector.jpg" alt="CRM and Projects vector art" />
        </div>
        <div className={styles.detailContent}>
          <h2 className={styles.detailTitle}>CRM & Projects Details</h2>
          <p className={styles.detailDescription}>
            Take charge of your customer relationships and project deliveries in one place. Move leads through customized pipelines, track project milestones, and link project billing directly to your finance ledger.
          </p>
          <ul className={styles.detailList}>
            <li>✨ Visual Kanban boards for lead tracking</li>
            <li>✨ Project milestone and task management</li>
            <li>✨ Direct integration with financial billing</li>
          </ul>
        </div>
      </div>
      
      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}></div>
              Shohoj Ledger
            </div>
            <p className={styles.footerDescription}>
              The ultimate unified Enterprise ERP platform. Streamlining Finance, HR, Payroll, and Projects into one powerful, secure, and fast workspace for modern businesses.
            </p>
            <p className={styles.copyright}>© 2026 Shohoj Solution. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
