import React from "react";

export type ProjectPresetId = 
  | "video_agency"
  | "software_it"
  | "digital_marketing"
  | "construction_realestate"
  | "manufacturing_engineering"
  | "consulting_professional"
  | "event_management";

export type DynamicFieldType = 
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "select"
  | "url"
  | "currency"
  | "checklist";

export interface ProjectDynamicField {
  id: string;
  label: string;
  type: DynamicFieldType;
  stage: number; // 1 to 7
  section: string;
  placeholder?: string;
  options?: string[];
  defaultValue?: any;
  required?: boolean;
  isCustom?: boolean;
}

export interface ProjectStageConfig {
  stage: number;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
}

export interface DeliverableColumnSchema {
  id: string;
  label: string;
  type: "text" | "select" | "currency" | "url" | "user" | "status";
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
}

export interface ProjectDeliverableSchema {
  itemTypeName: string; // e.g., "Video Deliverable", "Feature / User Story", "Ad Creative", "Construction Milestone", "BOM Component", "Advisory Deliverable", "Event Segment"
  itemTypePlural: string;
  defaultAspectOrTypeOptions: string[];
  aspectOrTypeLabel: string;
  primaryRoleTitle: string; // e.g. "Assigned Editor", "Lead Engineer", "Media Buyer / Copywriter", "Subcontractor / Lead", "QC Inspector", "Lead Consultant", "Stage / AV Lead"
  secondaryRoleTitle: string; // e.g. "Talent / Model", "QA Tester", "Graphic Designer", "Site Surveyor", "Material Supplier", "Subject Matter Expert", "Performer / MC"
  workingFileLabel: string; // e.g. "Working File / Frame.io", "Git Branch / PR Link", "Asset Drive / Figma", "CAD / BIM Drawing", "Blueprint / Spec Sheet", "Draft Deck / Docs", "Run Sheet Link"
  demoFileLabel: string; // e.g. "Demo Cut / Preview", "Staging URL / Test Build", "Live Ad Preview / Copy", "Site Inspection Photo / Log", "Prototype Test Video", "Executive Deck PDF", "Rehearsal Footage"
  finalDeliveryLabel: string; // e.g. "Master 4K Video URL", "Production Release URL / Tag", "Published Campaign URL", "Completion Certificate", "Shipped Lot Batch URL", "Final Published Report", "Event Archive / Wrap URL"
}

export interface ProjectPreset {
  id: ProjectPresetId;
  name: string;
  tagline: string;
  category: string;
  icon: string; // material symbol or lucide icon name
  color: string;
  accentColor: string;
  bg: string;
  badgeBg: string;
  description: string;
  stages: Record<number, ProjectStageConfig>;
  deliverableSchema: ProjectDeliverableSchema;
  defaultChecklists: Record<number, string[]>;
  defaultFields: ProjectDynamicField[];
}

export const PROJECT_PRESETS: Record<ProjectPresetId, ProjectPreset> = {
  // 1. VIDEO EDITING & CREATIVE MEDIA AGENCY (The Original Core Preset)
  video_agency: {
    id: "video_agency",
    name: "Video Editing & Media Agency",
    tagline: "Commercials, Reels, YouTube & Post-Production",
    category: "Media & Creative Production",
    icon: "videocam",
    color: "#a855f7",
    accentColor: "#c084fc",
    bg: "rgba(168, 85, 247, 0.12)",
    badgeBg: "rgba(168, 85, 247, 0.2)",
    description: "Tailored for video editing studios, commercial directors, content agencies, and creative production houses with shooting schedules, model talent casting, footage ingestion, multi-cut deliverables, and timecoded revisions.",
    stages: {
      1: {
        stage: 1,
        name: "Project Scope & Brief",
        shortName: "Brief",
        badge: "DRAFT & SCOPE",
        description: "Creative brief, visual moodboard, scope narrative, and budget estimation.",
        icon: "description",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.15)"
      },
      2: {
        stage: 2,
        name: "Advance & Retainer",
        shortName: "Advance",
        badge: "DEPOSIT SECURED",
        description: "Booking confirmation, client advance settlement, and project lock-in.",
        icon: "account_balance_wallet",
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.15)"
      },
      3: {
        stage: 3,
        name: "Product & Talent Casting",
        shortName: "Pre-Prod",
        badge: "PRODUCT & TALENT",
        description: "Physical product receipt, shoot scripts, talent/model assignments, and shoot calendar.",
        icon: "inventory_2",
        color: "#fbbf24",
        bg: "rgba(251, 191, 36, 0.15)"
      },
      4: {
        stage: 4,
        name: "Shoot & Raw Footage",
        shortName: "Shooting",
        badge: "ON-SET SHOOTING",
        description: "Studio/Location shoot execution, raw footage cloud ingestion, and editor handoff.",
        icon: "movie_creation",
        color: "#f472b6",
        bg: "rgba(244, 114, 182, 0.15)"
      },
      5: {
        stage: 5,
        name: "Post-Production & Editing",
        shortName: "Editing",
        badge: "MULTI-CUT EDITING",
        description: "Multi-video deliverables matrix, aspect ratios (16:9, 9:16, 1:1), color grading, and editor assignments.",
        icon: "content_cut",
        color: "#c084fc",
        bg: "rgba(192, 132, 252, 0.15)"
      },
      6: {
        stage: 6,
        name: "Demo Review & Approvals",
        shortName: "Review",
        badge: "TIMECODED REVIEWS",
        description: "Client preview watermarked cuts, timecode-annotated revisions, and sign-offs.",
        icon: "rate_review",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)"
      },
      7: {
        stage: 7,
        name: "Master Delivery & Payouts",
        shortName: "Completed",
        badge: "FINAL SETTLEMENT",
        description: "4K Master delivery, editor & talent fee disbursements, final invoice settlement, and closure.",
        icon: "verified",
        color: "#34d399",
        bg: "rgba(52, 211, 153, 0.15)"
      }
    },
    deliverableSchema: {
      itemTypeName: "Video Cut Deliverable",
      itemTypePlural: "Video Deliverables",
      defaultAspectOrTypeOptions: [
        "16:9 Landscape (4K Master)",
        "9:16 Vertical (1080x1920 Reel/Shorts)",
        "1:1 Square (1080x1080 Feed)",
        "4:5 Portrait (1080x1350 Instagram)",
        "21:9 Ultra-Wide Cinematic"
      ],
      aspectOrTypeLabel: "Aspect Ratio & Spec",
      primaryRoleTitle: "Assigned Video Editor",
      secondaryRoleTitle: "Model / On-Screen Talent",
      workingFileLabel: "Frame.io / Project File Link",
      demoFileLabel: "Demo Cut / Review URL",
      finalDeliveryLabel: "Master 4K Video Download URL"
    },
    defaultChecklists: {
      1: ["Creative brief approved by client", "Aspect ratio requirements confirmed", "Estimated budget agreed"],
      2: ["Advance deposit received in bank", "Invoice receipt shared with client"],
      3: ["Product received in studio condition", "Script / Storyboard finalized", "Talent rate & shoot schedule confirmed"],
      4: ["Studio call sheet distributed", "Shoot wrapped without equipment issue", "Raw footage uploaded to Cloud/NAS"],
      5: ["Rough cut assembled", "Color grade & audio mix completed", "Motion graphics & captions synced"],
      6: ["Demo video shared with client", "Revision notes incorporated", "Final client approval confirmed"],
      7: ["4K master deliverables exported", "Editor & Talent payouts disbursed", "Final payment collected"]
    },
    defaultFields: [
      { id: "studioLocation", label: "Studio / Shooting Location", type: "text", stage: 3, section: "Production Logistics", placeholder: "e.g. Studio Main Stage / Outdoor Dhaka" },
      { id: "rawFootageCloudUrl", label: "Primary Raw Footage Cloud / NAS Link", type: "url", stage: 4, section: "Asset Links", placeholder: "https://drive.google.com/..." },
      { id: "frameIoProjectUrl", label: "Frame.io / Review Workspace URL", type: "url", stage: 5, section: "Asset Links", placeholder: "https://app.frame.io/..." },
      { id: "soundDesignNotes", label: "Audio & Music Guidelines", type: "textarea", stage: 5, section: "Creative Specifications", placeholder: "e.g. Upbeat electronic music, sound effects on transitions..." },
      { id: "freeRevisionsIncluded", label: "Free Revisions Included", type: "number", stage: 6, section: "Revision Policy", defaultValue: 2 }
    ]
  },

  // 2. IT, SOFTWARE & APP DEVELOPMENT AGENCY
  software_it: {
    id: "software_it",
    name: "IT & Software Development",
    tagline: "Web Apps, Mobile SDKs, SaaS & Sprints",
    category: "Technology & Engineering",
    icon: "terminal",
    color: "#38bdf8",
    accentColor: "#60a5fa",
    bg: "rgba(56, 189, 248, 0.12)",
    badgeBg: "rgba(56, 189, 248, 0.2)",
    description: "Built for software agencies, mobile dev teams, SaaS builders, and IT consultancies. Tracks product requirements (PRD), architecture, sprint milestones, git branches, QA test matrices, staging UAT, and production releases.",
    stages: {
      1: {
        stage: 1,
        name: "Requirements & Architecture",
        shortName: "PRD & Spec",
        badge: "TECH SPEC & PRD",
        description: "Product requirements document, technical architecture, database schemas, and milestone roadmap.",
        icon: "schema",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.15)"
      },
      2: {
        stage: 2,
        name: "Milestone Advance & Setup",
        shortName: "Deposit",
        badge: "RETAINER LOCKED",
        description: "Contract signing, milestone 1 advance payment, dev team allocation, and environment setup.",
        icon: "account_balance",
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.15)"
      },
      3: {
        stage: 3,
        name: "Backlog & Sprint Planning",
        shortName: "Sprints",
        badge: "SPRINT BACKLOG",
        description: "User stories breakdown, API contracts, database migrations, and sprint planning.",
        icon: "developer_board",
        color: "#fbbf24",
        bg: "rgba(251, 191, 36, 0.15)"
      },
      4: {
        stage: 4,
        name: "Core Development & Sprints",
        shortName: "Coding",
        badge: "ENGINEERING",
        description: "Frontend, backend API, database engineering, git repo commits, and CI/CD setup.",
        icon: "code",
        color: "#60a5fa",
        bg: "rgba(96, 165, 250, 0.15)"
      },
      5: {
        stage: 5,
        name: "Code Review & QA Testing",
        shortName: "QA / Bugs",
        badge: "TESTING & QA",
        description: "Unit & integration testing, bug tracking, automated pipelines, and code reviews.",
        icon: "bug_report",
        color: "#c084fc",
        bg: "rgba(192, 132, 252, 0.15)"
      },
      6: {
        stage: 6,
        name: "Staging UAT & Client Review",
        shortName: "Staging UAT",
        badge: "CLIENT UAT",
        description: "Deployment to staging sandbox, user acceptance testing (UAT), security audit, and client sign-off.",
        icon: "desktop_windows",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)"
      },
      7: {
        stage: 7,
        name: "Production Release & Handover",
        shortName: "Released",
        badge: "PROD DEPLOYED",
        description: "DNS cutover, production deployment, documentation handover, engineer payouts, and final milestone billing.",
        icon: "rocket_launch",
        color: "#34d399",
        bg: "rgba(52, 211, 153, 0.15)"
      }
    },
    deliverableSchema: {
      itemTypeName: "Sprint / Feature Module",
      itemTypePlural: "Feature Modules & Epics",
      defaultAspectOrTypeOptions: [
        "Backend API & Database",
        "Frontend Web UI / Dashboard",
        "Mobile App (iOS / Android)",
        "Authentication & Security",
        "Payment Gateway Integration",
        "DevOps & CI/CD Pipeline"
      ],
      aspectOrTypeLabel: "Module Category / Stack",
      primaryRoleTitle: "Lead Software Engineer",
      secondaryRoleTitle: "QA Tester / DevOps Engineer",
      workingFileLabel: "GitHub / GitLab Repository / PR",
      demoFileLabel: "Staging URL / Preview Build",
      finalDeliveryLabel: "Production URL / API Endpoint"
    },
    defaultChecklists: {
      1: ["PRD document signed off", "System architecture & DB diagram approved", "Tech stack confirmed (Next.js, Prisma, PostgreSQL, etc.)"],
      2: ["Milestone 1 deposit cleared", "Cloud accounts & API keys provisioned", "Jira / Linear board initialized"],
      3: ["User stories estimated in story points", "Figma design specs handed over", "API contract interfaces written"],
      4: ["Core features built per sprint", "Git commits passed linting & builds", "Database migrations executed safely"],
      5: ["QA test suite passes with 0 critical bugs", "Code reviews approved by Tech Lead", "Performance & load benchmarks met"],
      6: ["Staging build deployed to client sandbox", "Client UAT testing sign-off received", "Security vulnerability scan passed"],
      7: ["Production deployment verified live", "DNS & SSL certs configured", "Source code & repo ownership transferred", "Final invoice settled"]
    },
    defaultFields: [
      { id: "gitRepoUrl", label: "GitHub / GitLab Repository URL", type: "url", stage: 1, section: "Technical Setup", placeholder: "https://github.com/org/repo" },
      { id: "techStackSummary", label: "Primary Tech Stack", type: "text", stage: 1, section: "Technical Setup", placeholder: "e.g. Next.js 15, TypeScript, PostgreSQL, Prisma, Tailwind" },
      { id: "figmaDesignUrl", label: "Figma UI/UX File Link", type: "url", stage: 3, section: "Design Assets", placeholder: "https://www.figma.com/file/..." },
      { id: "stagingUrl", label: "Staging Server Environment URL", type: "url", stage: 6, section: "Deployment & Environment", placeholder: "https://staging.app.example.com" },
      { id: "productionUrl", label: "Live Production URL", type: "url", stage: 7, section: "Deployment & Environment", placeholder: "https://app.example.com" },
      { id: "apiDocsUrl", label: "API Documentation (Swagger / Postman)", type: "url", stage: 7, section: "Handover Docs", placeholder: "https://docs.example.com/api" }
    ]
  },

  // 3. DIGITAL MARKETING & GROWTH AGENCY
  digital_marketing: {
    id: "digital_marketing",
    name: "Digital Marketing & Ad Agency",
    tagline: "Performance Ads, Funnels, SEO & Social Media",
    category: "Marketing & Growth",
    icon: "campaign",
    color: "#10b981",
    accentColor: "#34d399",
    bg: "rgba(16, 185, 129, 0.12)",
    badgeBg: "rgba(16, 185, 129, 0.2)",
    description: "Designed for digital ad agencies, performance marketers, media buyers, and growth consultancies. Organizes audience briefs, ad creatives, copy variations, pixel tracking, launch proofs, and ROAS performance audits.",
    stages: {
      1: {
        stage: 1,
        name: "Campaign Strategy & Brief",
        shortName: "Strategy",
        badge: "MARKETING BRIEF",
        description: "Target audience personas, campaign KPI targets (CPA, ROAS), and budget allocation.",
        icon: "track_changes",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.15)"
      },
      2: {
        stage: 2,
        name: "Media Spend & Retainer Deposit",
        shortName: "Retainer",
        badge: "SPEND SECURED",
        description: "Management retainer billing, ad spend budget authorization, and ad account linking.",
        icon: "payments",
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.15)"
      },
      3: {
        stage: 3,
        name: "Copywriting & Asset Pipeline",
        shortName: "Creatives",
        badge: "CREATIVE ASSETS",
        description: "Hook copywriting, graphic banners, short video scripts, and landing page wireframes.",
        icon: "edit_note",
        color: "#fbbf24",
        bg: "rgba(251, 191, 36, 0.15)"
      },
      4: {
        stage: 4,
        name: "Ad Production & Creatives",
        shortName: "Production",
        badge: "AD ASSETS",
        description: "Ad banners, video hooks, carousel designs, and landing page builds across platforms.",
        icon: "palette",
        color: "#34d399",
        bg: "rgba(52, 211, 153, 0.15)"
      },
      5: {
        stage: 5,
        name: "Funnel Setup & Pixel Tracking",
        shortName: "Ad Setup",
        badge: "TRACKING & PIXELS",
        description: "Meta/Google ad setup, conversion API pixel tracking, UTM campaign schemas, and A/B variations.",
        icon: "query_stats",
        color: "#c084fc",
        bg: "rgba(192, 132, 252, 0.15)"
      },
      6: {
        stage: 6,
        name: "Campaign Launch & Proofing",
        shortName: "Live Ads",
        badge: "CAMPAIGN LIVE",
        description: "Live ad proofing, client sign-off, budget spend monitoring, and CTR / CPC optimizations.",
        icon: "trending_up",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)"
      },
      7: {
        stage: 7,
        name: "ROAS Audit & Performance Wrap",
        shortName: "ROI Report",
        badge: "PERFORMANCE WRAP",
        description: "Final ROI & conversion audit, media buyer & designer payouts, client reporting, and next month retainer renewal.",
        icon: "insights",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.15)"
      }
    },
    deliverableSchema: {
      itemTypeName: "Ad Creative / Campaign Asset",
      itemTypePlural: "Ad Creatives & Angles",
      defaultAspectOrTypeOptions: [
        "Meta Feed & Story (1080x1920 / 1080x1080)",
        "Google Search & Performance Max",
        "TikTok / Shorts Video Ad",
        "Landing Page / Sales Funnel",
        "Email Marketing Automation Sequence",
        "Influencer / UGC Video Hook"
      ],
      aspectOrTypeLabel: "Platform / Ad Channel",
      primaryRoleTitle: "Lead Media Buyer / Strategist",
      secondaryRoleTitle: "Ad Copywriter / Graphic Designer",
      workingFileLabel: "Canva / Figma / Drive Asset Link",
      demoFileLabel: "Ad Preview / Live Sandbox Link",
      finalDeliveryLabel: "Live Campaign URL / Analytics Dashboard"
    },
    defaultChecklists: {
      1: ["Target audience & competitor audit completed", "Target CPA and ROAS goals agreed", "Ad spend budget approved"],
      2: ["Ad account permissions granted (Meta, Google, TikTok)", "Media spend advance processed", "Management retainer secured"],
      3: ["10+ ad headline & copy angles written", "Creative brief handed to designers", "Offer angle & lead magnet approved"],
      4: ["Visual banners & videos formatted for multi-placement", "Landing page conversion copy optimized", "Speed tests passed"],
      5: ["Meta Pixel & Google Tag Manager verified live", "UTM parameters configured accurately", "A/B test ad variations queued"],
      6: ["Ads approved by platform policy review", "First 48-hour data reviewed with client", "Winning ad sets scaled"],
      7: ["End of campaign analytics report delivered", "ROAS & conversion numbers audited", "Freelance media buyers & creators paid", "Monthly settlement completed"]
    },
    defaultFields: [
      { id: "targetAdSpend", label: "Monthly Target Ad Spend (BDT / USD)", type: "currency", stage: 1, section: "Budget & Goals", placeholder: "e.g. 50,000" },
      { id: "targetRoas", label: "Target ROAS (Return On Ad Spend)", type: "text", stage: 1, section: "Budget & Goals", placeholder: "e.g. 3.5x ROAS" },
      { id: "landingPageUrl", label: "Campaign Landing Page URL", type: "url", stage: 3, section: "Funnel URLs", placeholder: "https://promo.brand.com" },
      { id: "metaAdAccountId", label: "Meta / Google Ad Account ID", type: "text", stage: 5, section: "Ad Accounts", placeholder: "act_1029384756" },
      { id: "analyticsDashboardUrl", label: "Looker Studio / Live Analytics Dashboard", type: "url", stage: 7, section: "Reporting", placeholder: "https://lookerstudio.google.com/..." }
    ]
  },

  // 4. CONSTRUCTION, ARCHITECTURE & REAL ESTATE
  construction_realestate: {
    id: "construction_realestate",
    name: "Construction & Real Estate",
    tagline: "Architecture, Site Works, Subcontractors & BOQ",
    category: "Architecture & Infrastructure",
    icon: "apartment",
    color: "#f59e0b",
    accentColor: "#fbbf24",
    bg: "rgba(245, 158, 11, 0.12)",
    badgeBg: "rgba(245, 158, 11, 0.2)",
    description: "Tailored for construction contractors, architectural firms, interior designers, and civil engineering companies. Handles site surveys, permits, Bill of Quantities (BOQ), subcontractor trades, safety inspections, snagging lists, and retention settlement.",
    stages: {
      1: {
        stage: 1,
        name: "Site Survey & Architectural Drafting",
        shortName: "Design & BOQ",
        badge: "BLUEPRINTS & BOQ",
        description: "Topographical site survey, architectural blueprints, structural drawings, and initial BOQ estimate.",
        icon: "architecture",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.15)"
      },
      2: {
        stage: 2,
        name: "Mobilization Advance & Permits",
        shortName: "Permits",
        badge: "MOBILIZATION",
        description: "Municipal building permits, client mobilization advance, insurance, and site boundary fencing.",
        icon: "gavel",
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.15)"
      },
      3: {
        stage: 3,
        name: "BOQ Procurement & Subcontractors",
        shortName: "Tendering",
        badge: "SUBCONTRACTORS",
        description: "Bill of quantities vendor quotes, steel/cement procurement, and trade subcontractor allocations.",
        icon: "foundation",
        color: "#fbbf24",
        bg: "rgba(251, 191, 36, 0.15)"
      },
      4: {
        stage: 4,
        name: "Structural Works & Civil Construction",
        shortName: "Site Works",
        badge: "CIVIL WORKS",
        description: "Excavation, foundation piling, RCC casting, brickwork, and structural milestone inspections.",
        icon: "construction",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)"
      },
      5: {
        stage: 5,
        name: "MEP, Finishing & Interior Fitting",
        shortName: "Finishing",
        badge: "MEP & FINISHING",
        description: "Electrical, plumbing (MEP), plastering, tiles, painting, and interior carpentry fittings.",
        icon: "carpenter",
        color: "#c084fc",
        bg: "rgba(192, 132, 252, 0.15)"
      },
      6: {
        stage: 6,
        name: "Snagging List & Quality Clearance",
        shortName: "Snag List",
        badge: "INSPECTION & SNAGS",
        description: "Comprehensive snag list audit, structural safety clearance, and client walkthrough inspection.",
        icon: "fact_check",
        color: "#f97316",
        bg: "rgba(249, 115, 22, 0.15)"
      },
      7: {
        stage: 7,
        name: "Handover & Retention Settlement",
        shortName: "Handover",
        badge: "KEYS HANDOVER",
        description: "Occupancy certificate, final site handover, subcontractor retention payouts, and project sign-off.",
        icon: "key",
        color: "#34d399",
        bg: "rgba(52, 211, 153, 0.15)"
      }
    },
    deliverableSchema: {
      itemTypeName: "Construction Phase / BOQ Item",
      itemTypePlural: "Milestones & BOQ Items",
      defaultAspectOrTypeOptions: [
        "Substructure & Foundation",
        "RCC Superstructure & Framing",
        "Masonry, Brickwork & Plastering",
        "MEP (Electrical & Plumbing)",
        "Tiles, Flooring & Paint Finishing",
        "Interior Woodwork & Fixtures",
        "External Landscaping & Facade"
      ],
      aspectOrTypeLabel: "Work Package / Trade",
      primaryRoleTitle: "Project Site Engineer / Architect",
      secondaryRoleTitle: "Subcontractor / Master Tradesman",
      workingFileLabel: "CAD / BIM Drawing / DWG Link",
      demoFileLabel: "Site Progress Photo / Inspection Report",
      finalDeliveryLabel: "Handover & Completion Certificate"
    },
    defaultChecklists: {
      1: ["Soil test & site survey completed", "Architectural & structural drawings approved", "Detailed BOQ prepared"],
      2: ["RAJUK / Municipal building permission received", "Client mobilization advance cleared", "Site safety signage installed"],
      3: ["Steel & cement suppliers contracted", "Labor & scaffolding subcontractor agreements signed", "Material quality test passed"],
      4: ["Excavation & foundation casting completed", "Structural column & slab concrete curing verified", "Milestone 1 inspection cleared"],
      5: ["Plumbing & electrical conduits concealed", "Plastering & tiling completed with level checks", "Interior fittings installed"],
      6: ["Full snagging list documented with photos", "All defect rectifications completed", "Client executive walkthrough approved"],
      7: ["Building occupancy certificate obtained", "Subcontractor retention bills audited", "Client final settlement & keys delivered"]
    },
    defaultFields: [
      { id: "siteAddress", label: "Construction Site Physical Address & Plot No.", type: "text", stage: 1, section: "Site Location", placeholder: "e.g. Plot 42, Road 11, Banani, Dhaka" },
      { id: "totalBuiltAreaSqFt", label: "Total Built-Up Area (Sq. Ft.)", type: "number", stage: 1, section: "Site Specs", placeholder: "e.g. 15000" },
      { id: "permitApprovalNumber", label: "Municipal Building Permit Ref Number", type: "text", stage: 2, section: "Permits", placeholder: "e.g. RAJUK-2026-B1092" },
      { id: "cadBimDriveUrl", label: "Architectural CAD / BIM Cloud Link", type: "url", stage: 3, section: "Drawings & Specs", placeholder: "https://autodesk.cloud/..." },
      { id: "retentionPercentage", label: "Subcontractor Retention Holdback (%)", type: "number", stage: 7, section: "Settlement", defaultValue: 5 }
    ]
  },

  // 5. MANUFACTURING & PRODUCT ENGINEERING
  manufacturing_engineering: {
    id: "manufacturing_engineering",
    name: "Manufacturing & Product Engineering",
    tagline: "CAD Specs, BOM Sourcing, Assembly & Quality Control",
    category: "Industrial & Manufacturing",
    icon: "precision_manufacturing",
    color: "#ef4444",
    accentColor: "#f87171",
    bg: "rgba(239, 68, 68, 0.12)",
    badgeBg: "rgba(239, 68, 68, 0.2)",
    description: "Designed for hardware manufacturers, garment factories, assembly plants, and product engineering shops. Covers product CAD specs, Bill of Materials (BOM), tooling fabrication, batch assembly, quality control (QC), and warehouse dispatch.",
    stages: {
      1: {
        stage: 1,
        name: "Product Specs & CAD Design",
        shortName: "Specs & CAD",
        badge: "PRODUCT SPECS",
        description: "3D CAD modeling, engineering specifications, tolerance limits, and feasibility assessment.",
        icon: "view_in_ar",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.15)"
      },
      2: {
        stage: 2,
        name: "Tooling & Material Advance",
        shortName: "Deposit",
        badge: "TOOLING ADVANCE",
        description: "Die / mold tooling deposit, bulk raw material purchase order financing, and scheduling.",
        icon: "account_balance_wallet",
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.15)"
      },
      3: {
        stage: 3,
        name: "Bill of Materials (BOM) Sourcing",
        shortName: "BOM Sourcing",
        badge: "BOM SOURCING",
        description: "Component sourcing, supplier vendor quotations, raw inventory ingestion, and batch costing.",
        icon: "layers",
        color: "#fbbf24",
        bg: "rgba(251, 191, 36, 0.15)"
      },
      4: {
        stage: 4,
        name: "Prototype & Pilot Run",
        shortName: "Prototype",
        badge: "PILOT RUN",
        description: "Golden sample prototype fabrication, mold calibration, and stress tolerance testing.",
        icon: "science",
        color: "#f87171",
        bg: "rgba(248, 113, 113, 0.15)"
      },
      5: {
        stage: 5,
        name: "Mass Production & Assembly Line",
        shortName: "Production",
        badge: "MASS ASSEMBLY",
        description: "High-volume assembly line production, shift labor scheduling, and in-line quality checks.",
        icon: "settings_suggest",
        color: "#c084fc",
        bg: "rgba(192, 132, 252, 0.15)"
      },
      6: {
        stage: 6,
        name: "Quality Assurance & Compliance",
        shortName: "QA / Batch QC",
        badge: "QC & CERTIFICATION",
        description: "AQL 2.5 lot testing, compliance certification (ISO/CE), packaging, and barcode labeling.",
        icon: "verified_user",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)"
      },
      7: {
        stage: 7,
        name: "Warehouse Dispatch & Settlement",
        shortName: "Dispatched",
        badge: "DISPATCHED",
        description: "Container loading, bill of lading tracking, supplier balance settlement, and final buyer billing.",
        icon: "local_shipping",
        color: "#34d399",
        bg: "rgba(52, 211, 153, 0.15)"
      }
    },
    deliverableSchema: {
      itemTypeName: "Production Batch / BOM Component",
      itemTypePlural: "Production Batches & Parts",
      defaultAspectOrTypeOptions: [
        "Mechanical / Metal Stamping Part",
        "Plastic Injection Molded Part",
        "PCB / Electrical Sub-Assembly",
        "Fabric / Textile Component",
        "Packaging, Boxes & Manuals",
        "Final Master Assembled Unit"
      ],
      aspectOrTypeLabel: "Component Class / Sub-Assembly",
      primaryRoleTitle: "Plant Production Supervisor",
      secondaryRoleTitle: "Quality Control (QC) Inspector",
      workingFileLabel: "CAD Drawing / Spec Sheet URL",
      demoFileLabel: "Sample Prototype Inspection Video / Report",
      finalDeliveryLabel: "Bill of Lading / Dispatch Slip URL"
    },
    defaultChecklists: {
      1: ["Engineering 2D/3D CAD drawings approved", "BOM cost model calculated", "Production feasibility review signed"],
      2: ["Tooling & mold advance payment received", "Raw material vendor POs issued"],
      3: ["Raw materials received & batch inspected in warehouse", "BOM component inventory reserved"],
      4: ["Golden sample fabricated & verified against tolerances", "Client physical sample sign-off received"],
      5: ["Assembly line speed calibrated", "In-line defect rate under 1.5%", "Daily shift quotas met"],
      6: ["Final AQL 2.5 batch inspection passed", "Safety compliance certs attached", "Barcode packaging verified"],
      7: ["Consignment dispatched with tracking manifest", "Vendor & material invoices reconciled", "Final client commercial invoice cleared"]
    },
    defaultFields: [
      { id: "batchLotNumber", label: "Production Batch / Lot Number", type: "text", stage: 1, section: "Manufacturing Data", placeholder: "e.g. LOT-2026-ENG04" },
      { id: "totalUnitsQuantity", label: "Total Production Run Quantity (Units)", type: "number", stage: 1, section: "Manufacturing Data", placeholder: "e.g. 5000" },
      { id: "cadFilesCloudUrl", label: "3D CAD / Blueprint Drive Link", type: "url", stage: 1, section: "Specifications", placeholder: "https://cad.cloud/..." },
      { id: "complianceStandards", label: "Compliance Standards (e.g. ISO 9001, CE, RoHS)", type: "text", stage: 6, section: "Compliance", placeholder: "ISO 9001 / CE / RoHS" },
      { id: "shippingTrackingNumber", label: "Freight / Courier Tracking Manifest ID", type: "text", stage: 7, section: "Logistics", placeholder: "e.g. DHL-8910293847" }
    ]
  },

  // 6. CONSULTING, LEGAL & PROFESSIONAL SERVICES
  consulting_professional: {
    id: "consulting_professional",
    name: "Consulting & Professional Services",
    tagline: "Audits, Strategic Advisory, Retainers & Executive Decks",
    category: "Professional Services",
    icon: "psychology",
    color: "#6366f1",
    accentColor: "#818cf8",
    bg: "rgba(99, 102, 241, 0.12)",
    badgeBg: "rgba(99, 102, 241, 0.2)",
    description: "Built for management consultancies, legal firms, accounting advisory practices, and strategy experts. Manages engagement charters, data due diligence, financial modeling, draft decks, board reviews, and billable hour settlements.",
    stages: {
      1: {
        stage: 1,
        name: "Engagement Charter & Problem Scoping",
        shortName: "Charter",
        badge: "SCOPING CHARTER",
        description: "Client problem definition, stakeholder engagement charter, deliverables scope, and fee structure.",
        icon: "assignment",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.15)"
      },
      2: {
        stage: 2,
        name: "Retainer & Engagement Agreement",
        shortName: "Retainer",
        badge: "ENGAGEMENT LOCKED",
        description: "Signed non-disclosure (NDA), master services agreement (MSA), and advisory retainer deposit.",
        icon: "handshake",
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.15)"
      },
      3: {
        stage: 3,
        name: "Research, Data Audit & Interviews",
        shortName: "Discovery",
        badge: "DISCOVERY & AUDIT",
        description: "Stakeholder interviews, financial audits, operational data collection, and competitor benchmarking.",
        icon: "find_in_page",
        color: "#fbbf24",
        bg: "rgba(251, 191, 36, 0.15)"
      },
      4: {
        stage: 4,
        name: "Strategy Formulation & Modeling",
        shortName: "Analysis",
        badge: "STRATEGY MODELING",
        description: "Quantitative financial modeling, gap analysis, scenario forecasting, and strategic frameworks.",
        icon: "analytics",
        color: "#818cf8",
        bg: "rgba(129, 140, 248, 0.15)"
      },
      5: {
        stage: 5,
        name: "Draft Deliverables & Deck Synthesis",
        shortName: "Drafting",
        badge: "EXECUTIVE DECK",
        description: "Executive presentation deck, advisory report whitepaper, and strategic roadmap synthesis.",
        icon: "pie_chart",
        color: "#c084fc",
        bg: "rgba(192, 132, 252, 0.15)"
      },
      6: {
        stage: 6,
        name: "Executive Review & Board Presentation",
        shortName: "Board Review",
        badge: "BOARD PRESENTATION",
        description: "C-level executive presentation, board Q&A review, feedback integration, and final sign-off.",
        icon: "co_present",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)"
      },
      7: {
        stage: 7,
        name: "Implementation Roadmap & Final Billing",
        shortName: "Settled",
        badge: "HANDOVER & BILLING",
        description: "Final strategic roadmap handover, billable hours reconciliation, expert advisor payouts, and invoice closure.",
        icon: "task_alt",
        color: "#34d399",
        bg: "rgba(52, 211, 153, 0.15)"
      }
    },
    deliverableSchema: {
      itemTypeName: "Advisory Deliverable / Workstream",
      itemTypePlural: "Advisory Deliverables",
      defaultAspectOrTypeOptions: [
        "Executive Strategy Deck (PowerPoint / Keynote)",
        "Financial Forecast & Valuation Model (Excel)",
        "Operational Audit & Gap Analysis Report",
        "Legal / Compliance Review Memorandum",
        "Market Research & Competitor Benchmark",
        "Transformation Implementation Roadmap"
      ],
      aspectOrTypeLabel: "Deliverable Format & Stream",
      primaryRoleTitle: "Lead Strategy Partner / Director",
      secondaryRoleTitle: "Senior Analyst / Subject Matter Expert",
      workingFileLabel: "Draft Document / Spreadsheet Drive Link",
      demoFileLabel: "Executive Preview Deck PDF Link",
      finalDeliveryLabel: "Final Signed Advisory Report & Roadmap"
    },
    defaultChecklists: {
      1: ["Engagement charter signed with scope boundaries", "Key stakeholder interview list finalized", "Fixed / hourly fee agreement confirmed"],
      2: ["Mutual NDA executed", "Retainer deposit processed", "Project data room access provisioned"],
      3: ["15+ stakeholder interviews conducted", "Financial ledger & audit data ingested", "Benchmarking research compiled"],
      4: ["Financial model calibrated with 3 scenarios", "Core recommendations synthesized", "Internal peer review completed"],
      5: ["Executive deck drafted with data visualizations", "Draft report shared with client champion for pre-alignment"],
      6: ["Board of Directors presentation delivered", "Board feedback & amendments captured", "Final approval documented"],
      7: ["Final strategic roadmap deliverable delivered", "Consultant & analyst timesheets reconciled", "Final retainer invoice settled"]
    },
    defaultFields: [
      { id: "leadClientSponsor", label: "Client Executive Sponsor (Name & Title)", type: "text", stage: 1, section: "Stakeholders", placeholder: "e.g. Managing Director / CFO" },
      { id: "billingModel", label: "Engagement Billing Model", type: "select", stage: 2, section: "Financial Terms", options: ["Fixed Retainer", "Time & Materials (Hourly)", "Success Fee / Milestone Based"], defaultValue: "Fixed Retainer" },
      { id: "secureDataRoomUrl", label: "Confidential Data Room / Drive Link", type: "url", stage: 3, section: "Data Room", placeholder: "https://dataroom.firm.com/..." },
      { id: "presentationDeckUrl", label: "Board Presentation Deck Cloud URL", type: "url", stage: 5, section: "Deliverables", placeholder: "https://docs.google.com/presentation/..." },
      { id: "totalBillableHours", label: "Total Project Billable Hours Logged", type: "number", stage: 7, section: "Time Audit", placeholder: "e.g. 120" }
    ]
  },

  // 7. EVENT MANAGEMENT & LIVE PRODUCTION
  event_management: {
    id: "event_management",
    name: "Event Management & Live Production",
    tagline: "Venues, Run of Show, Performers & Stage Operations",
    category: "Events & Experiential",
    icon: "theater_comedy",
    color: "#ec4899",
    accentColor: "#f472b6",
    bg: "rgba(236, 72, 153, 0.12)",
    badgeBg: "rgba(236, 72, 153, 0.2)",
    description: "Tailored for event planning agencies, concert producers, corporate conference organizers, and wedding planners. Manages event rundowns (Run of Show), venue floorplans, vendor/talent contracts, AV rehearsals, live operations, and post-event reconciliation.",
    stages: {
      1: {
        stage: 1,
        name: "Event Concept, Rundown & Budget",
        shortName: "Concept",
        badge: "EVENT BRIEF",
        description: "Event theme, target guest capacity, preliminary budget, and high-level run of show.",
        icon: "celebration",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.15)"
      },
      2: {
        stage: 2,
        name: "Venue Deposit & Client Advance",
        shortName: "Deposit",
        badge: "VENUE BOOKED",
        description: "Client event advance, venue security deposit, date lock, and municipal permissions.",
        icon: "event_seat",
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.15)"
      },
      3: {
        stage: 3,
        name: "Venue Floorplans & Vendor Contracts",
        shortName: "Vendors",
        badge: "VENDORS & TALENT",
        description: "Sound/AV staging contracts, catering menus, decorator floorplans, and performer agreements.",
        icon: "handshake",
        color: "#fbbf24",
        bg: "rgba(251, 191, 36, 0.15)"
      },
      4: {
        stage: 4,
        name: "AV / Stage Production & Guest Invites",
        shortName: "Production",
        badge: "STAGE SETUP",
        description: "Stage truss fabrication, LED screens, sound checks, guest RSVPs, and ticketing operations.",
        icon: "speaker_group",
        color: "#f472b6",
        bg: "rgba(244, 114, 182, 0.15)"
      },
      5: {
        stage: 5,
        name: "Tech Rehearsal & Dry Run",
        shortName: "Rehearsal",
        badge: "TECH DRY RUN",
        description: "Full dry run with MC / performers, lighting cues, stage management check, and security briefing.",
        icon: "mic_external_on",
        color: "#c084fc",
        bg: "rgba(192, 132, 252, 0.15)"
      },
      6: {
        stage: 6,
        name: "Live Event Execution & Operations",
        shortName: "Live Event",
        badge: "LIVE OPERATIONS",
        description: "On-site guest reception, timecode run-of-show execution, live streaming, and stage management.",
        icon: "live_tv",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)"
      },
      7: {
        stage: 7,
        name: "Teardown, Vendor Settlements & Wrap",
        shortName: "Wrapped",
        badge: "WRAP & SETTLED",
        description: "Venue teardown, equipment return, vendor/performer balance payouts, photo/video archive delivery, and final billing.",
        icon: "task_alt",
        color: "#34d399",
        bg: "rgba(52, 211, 153, 0.15)"
      }
    },
    deliverableSchema: {
      itemTypeName: "Event Program Segment / Vendor Package",
      itemTypePlural: "Program Segments & Vendors",
      defaultAspectOrTypeOptions: [
        "Stage, Truss & LED Screen AV Setup",
        "Sound Engineering & Live Audio",
        "Lighting Cues & Laser Production",
        "Catering & Banquet Service",
        "Guest Registration & VIP Reception",
        "Performer / Keynote Speaker Act",
        "Live Multi-Cam Broadcast / Stream"
      ],
      aspectOrTypeLabel: "Segment / Service Type",
      primaryRoleTitle: "Event Operations Director",
      secondaryRoleTitle: "Performer / MC / Sound Engineer",
      workingFileLabel: "Run of Show / Script Drive Link",
      demoFileLabel: "Stage 3D Render / Floorplan Link",
      finalDeliveryLabel: "Event Photos / Video Archive Master Link"
    },
    defaultChecklists: {
      1: ["Event concept & theme approved by client", "Date & time options confirmed", "Target guest capacity & preliminary budget set"],
      2: ["Venue booking contract signed & deposit paid", "Client mobilization advance cleared", "Police & emergency permissions submitted"],
      3: ["AV / Sound contractor confirmed with equipment list", "Catering menu tasting & head-count locked", "Performer / Keynote speaker contracts executed"],
      4: ["Stage fabrication & LED wall assembled on-site", "RSVP list compiled & badge printing ready", "Walkie-talkie channels assigned"],
      5: ["Sound check & microphone frequencies tested", "Run of show dry run with MC completed", "Safety & fire exits inspected"],
      6: ["Guest check-in operational without delay", "Stage transitions kept on minute-by-minute schedule", "Client VIP satisfaction verified on site"],
      7: ["Venue handed back in clean condition with security deposit returned", "All vendor & artist balance fees disbursed", "Post-event highlights video & photo archive shared", "Final invoice reconciled"]
    },
    defaultFields: [
      { id: "eventVenueName", label: "Event Venue Name & Hall", type: "text", stage: 1, section: "Venue Details", placeholder: "e.g. Radisson Blu Grand Ballroom / ICCB Hall 2" },
      { id: "expectedGuestCount", label: "Expected Guest / Attendee Count", type: "number", stage: 1, section: "Capacity", placeholder: "e.g. 500" },
      { id: "eventDate", label: "Event Main Date", type: "date", stage: 2, section: "Date & Time" },
      { id: "eventStartTime", label: "Event Start Time", type: "time", stage: 2, section: "Date & Time" },
      { id: "runOfShowSheetUrl", label: "Run of Show (Minute-by-Minute Cue Sheet) URL", type: "url", stage: 4, section: "Show Schedule", placeholder: "https://docs.google.com/spreadsheets/..." },
      { id: "eventMediaArchiveUrl", label: "Official Photo & Video Archive Link", type: "url", stage: 7, section: "Media Delivery", placeholder: "https://photos.app.goo.gl/..." }
    ]
  }
};

/**
 * Returns the Preset definition matching presetId, or falls back to video_agency
 */
export function getPresetById(presetId?: string): ProjectPreset {
  if (!presetId) return PROJECT_PRESETS.video_agency;
  const clean = presetId.toLowerCase().trim() as ProjectPresetId;
  return PROJECT_PRESETS[clean] || PROJECT_PRESETS.video_agency;
}

/**
 * Maps onboarding industry selection (e.g. "it", "retail", "manufacturing", "consulting", etc.)
 * to the best recommended project preset.
 */
export function mapIndustryToProjectPreset(industryId?: string): ProjectPresetId {
  if (!industryId) return "video_agency";
  const id = industryId.toLowerCase();

  if (id.includes("it") || id.includes("software") || id.includes("tech")) {
    return "software_it";
  }
  if (id.includes("marketing") || id.includes("retail") || id.includes("commerce") || id.includes("social")) {
    return "digital_marketing";
  }
  if (id.includes("construction") || id.includes("realestate") || id.includes("building") || id.includes("arch")) {
    return "construction_realestate";
  }
  if (id.includes("manufactur") || id.includes("factory") || id.includes("wholesale") || id.includes("product")) {
    return "manufacturing_engineering";
  }
  if (id.includes("consult") || id.includes("legal") || id.includes("health") || id.includes("professional") || id.includes("finance")) {
    return "consulting_professional";
  }
  if (id.includes("event") || id.includes("entertainment") || id.includes("wedding")) {
    return "event_management";
  }
  if (id.includes("media") || id.includes("video") || id.includes("photo") || id.includes("creative")) {
    return "video_agency";
  }

  return "video_agency";
}

/**
 * Merges a base preset with custom overrides saved at the company or project level.
 */
export function mergeCustomPresetConfig(
  base: ProjectPreset | ProjectPresetId,
  customConfig?: {
    stageNames?: Record<number, string>;
    stageBadges?: Record<number, string>;
    customFields?: ProjectDynamicField[];
    customChecklists?: Record<number, string[]>;
    deliverableSchema?: Partial<ProjectDeliverableSchema>;
  }
): ProjectPreset {
  const basePreset = typeof base === 'string' ? getPresetById(base) : base;
  if (!basePreset) return PROJECT_PRESETS.video_agency;
  if (!customConfig) return basePreset;

  const mergedStages: Record<number, ProjectStageConfig> = {};
  for (let s = 1; s <= 7; s++) {
    const baseStage = basePreset.stages[s];
    mergedStages[s] = {
      ...baseStage,
      name: customConfig.stageNames?.[s] || baseStage.name,
      badge: customConfig.stageBadges?.[s] || baseStage.badge
    };
  }

  const allFields = [...basePreset.defaultFields];
  if (Array.isArray(customConfig.customFields)) {
    customConfig.customFields.forEach(f => {
      const existingIdx = allFields.findIndex(x => x.id === f.id);
      if (existingIdx >= 0) {
        allFields[existingIdx] = { ...allFields[existingIdx], ...f };
      } else {
        allFields.push(f);
      }
    });
  }

  const mergedChecklists: Record<number, string[]> = {};
  for (let s = 1; s <= 7; s++) {
    mergedChecklists[s] = customConfig.customChecklists?.[s] || basePreset.defaultChecklists[s] || [];
  }

  return {
    ...basePreset,
    stages: mergedStages,
    defaultFields: allFields,
    defaultChecklists: mergedChecklists,
    deliverableSchema: {
      ...basePreset.deliverableSchema,
      ...(customConfig.deliverableSchema || {})
    }
  };
}
