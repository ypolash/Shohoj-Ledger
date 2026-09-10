# Shohoj Admin — Native Android Application (Owner & Executive Portal)

Native Android Executive Monitoring & CRM Management application for **Shohoj Ledger CRM**, built with **Kotlin** and **Jetpack Compose (Material 3)**.

Designed specifically for **Company Owners and CRM Administrators** to monitor live business metrics, employees, today's attendance, client projects, sales leads, financial health, and leave requests directly from their Android smartphone.

---

## Key Features

1. **Owner Authentication**:
   - Secure sign-in using the **exact same email and password** used to sign up for the CRM.
   - Dynamic API server configuration (Production, Local Emulator, or LAN IP).
   - Session persistence via encrypted SharedPreferences and OkHttp `SessionCookieJar` / Bearer JWT tokens.

2. **Executive Dashboard**:
   - Real-time Company & Owner greeting with business classification.
   - **Present Today Attendance Counter**: Live count of employees present, late, absent, and unmarked today.
   - **Financial Health Card**: Live Net Profit, Total Revenue, and Total Expense in Bangladeshi Taka (`৳`).
   - High-level metric counters: Active Projects, CRM Leads, Pending Leaves, Total Staff.
   - Quick action shortcuts to all 6 modules.
   - Recent live employee attendance check-ins feed.

3. **Employee Details**:
   - Complete company staff roster with real-time search (by name, Employee ID, designation, department).
   - Status filtering (All, Active, Inactive).
   - Interactive detail bottom sheet: Full name, ID, designation, department, contact info, basic salary, joining date, reporting manager, and emergency contacts.

4. **Today's Attendance Roster**:
   - Live roster showing who has punched in today.
   - Status indicators: Present, Late (with exact minutes late e.g. `30m Late`), Absent, Half Day, Unmarked.
   - Check-in and check-out timestamps.
   - Filter by status (All, Present, Late, Absent).

5. **Project Details via Company Name or Project Code**:
   - Dedicated search bar supporting search by **Company Name / Client Name** (e.g. `Acme Corp`), **Project Code** (e.g. `PRJ-001`), or Project Name.
   - Filter chips: All, Planning, In Progress, On Hold, Completed.
   - Progress indicators (0% - 100% completion bar).
   - Project cards & detail sheet: Client contact person, budget (`৳`), manager, timeline, and task completion stats.

6. **Lead Management**:
   - CRM sales pipeline view with status tabs: `ALL`, `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `WON`, `LOST`.
   - Search leads by company name, contact person, or email.
   - Deal value highlighted in Bangladeshi Taka (`৳`).
   - Priority badges (Urgent, High, Medium, Low) and assigned sales reps.
   - Detailed modal sheet with lead source, service interest, and notes.

7. **Financial Report**:
   - Period selector: `All Time`, `This Month`, `This Quarter`, `This Year`.
   - **Profit & Loss**: Total Revenue, Total Expenses, Net Profit / Loss, Profit Margin %.
   - **Balance Sheet**: Total Assets, Total Liabilities, Net Equity.
   - **Cash Flow**: Cash Inflows, Cash Outflows, Net Cash Flow.

8. **Leave Requests**:
   - Filter company leave applications: `ALL`, `PENDING`, `APPROVED`, `REJECTED`.
   - Search by employee name or reason.
   - Leave cards with duration (days), date range, leave type (Casual, Sick, Annual, etc.), and reasons.
   - Detail sheet for executive review.

9. **Read-Only Invariant**:
   - Designed strictly for observation, monitoring, and decision making on mobile without accidental mutations.

---

## Getting Started

### 1. Open in Android Studio
1. Launch **Android Studio** (Hedgehog, Iguana, Jellyfish, or newer).
2. Select **File > Open...**
3. Select the `shohoj-admin-android` folder:
   ```
   e:\Shohoj-Ledger\shohoj-admin-android
   ```
4. Allow Gradle to sync the project dependencies.

### 2. Configure Backend Server URL
- **Live Production Server (Default)**: Connects by default to:
  ```
  https://team.shohojsolution.com/
  ```
- **Android Emulator**: Tap the server badge on the Login screen and select **Emulator Localhost** (`http://10.0.2.2:3000/`), which automatically maps to `http://localhost:3000` on your development PC.
- **Physical Android Phone**: Connect your phone to the same Wi-Fi as your computer. In the Server Environment dialog, enter your PC's local LAN IP:
  ```
  http://192.168.1.XX:3000/
  ```

### 3. Log In
- **Email**: Your CRM Owner/Admin email (e.g. `eightlines@mail.com` or your registered owner email).
- **Password**: Your CRM password.
