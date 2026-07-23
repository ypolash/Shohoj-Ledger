# Version 1.3 Technical Dependencies

## Internal Module Dependencies

| V1.3 Feature | Depends On (V1.2 Foundation) | Reason |
|---|---|---|
| **Purchase Order Workflow** | Approval Engine (`ApprovalFlow`) | POs must traverse multi-tier management approvals before finalizing. |
| **Sales Invoicing** | Inventory Foundation (`Product`) | Invoices must reserve/deduct stock dynamically. |
| **Financial Statements** | Event-Driven Hooks | Every Income/Expense/Payroll API must hook into the Ledger Service without blocking the request. |
| **Mobile Actions** | Notification Center (`NotificationQueue`) | Mobile push tokens must be registered to the User profile for routing. |
| **AI Insights** | Analytics Foundation (`AnalyticsSnapshot`) | LLM must not query live DB tables directly. It queries nightly snapshots to protect DB performance. |

## External Dependencies to Introduce
1. **Queue Architecture**: Need a lightweight queue system (e.g., BullMQ with Redis, or Next.js background API routes) to process `NotificationQueue` and `WebhookDelivery`.
2. **LLM Provider**: Need an integration (e.g., OpenAI or Vertex AI) hooked up specifically to read `BusinessInsight` context.
3. **Storage Provider**: S3-compatible storage required for Employee Documents and Report PDF outputs, replacing raw database Blobs.
4. **Export Libraries**: Client-side vs Server-side PDF generation strategies (currently using client-side `window.print()` per MISSION.md pivot, need to evaluate if background Report Engine requires headless Puppeteer/PDFKit).
