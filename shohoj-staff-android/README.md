# Shohoj Staff — Native Android Application

Native Android Employee Self Service (ESS) application for **Shohoj Ledger ERP**, built with **Kotlin** and **Jetpack Compose (Material 3)**.

---

## Features

1. **Authentication**:
   - Secure employee sign-in via Employee ID & Password.
   - Dynamic server URL configuration dialog.
   - Integrated GPS & Wi-Fi environment detection during login for backend verification.
   - Session persistence using `SessionCookieJar` (retaining Next.js session cookies across requests) and `SessionManager`.

2. **Home Dashboard**:
   - Live real-time digital clock with seconds and current date.
   - Quick attendance widget: check-in / check-out times, today's status badge, and instant punch button.
   - Monthly summary KPI cards: Present days, Late days.
   - Quick Action navigation grid: Attendance, Leave, Payroll, Tasks, Notices, Profile.
   - Recent company notices preview feed.

3. **Attendance & Punch**:
   - Live location acquisition (latitude & longitude) via Google Play Services Location (`FusedLocationProviderClient`).
   - Connected Wi-Fi SSID / BSSID detection for office geofencing validation.
   - Monthly attendance timeline records with check-in, check-out, duration, and status tags (Present, Late, Absent, Half Day).
   - Overview KPI counters.

4. **Leave Management**:
   - Balance overview progress indicators: Casual, Sick, Annual leaves.
   - Leave history records with approval status tags (Pending, Approved, Rejected).
   - Interactive **Apply Leave** modal bottom sheet with leave type selector, start/end date pickers, and reason submission.

5. **Payroll & Payslips**:
   - Latest Payslip featured card with Basic Salary, Allowances, Total Deductions, and Net Disbursed salary (in Bangladeshi Taka `৳`).
   - Tabbed views for:
     - **Payslips**: Historical records.
     - **Bonuses**: Festive & performance bonuses.
     - **Deductions**: Fines and adjustments.

6. **My Tasks**:
   - Filter chips: All, Pending, In Progress, Completed.
   - Task cards showing priority, title, description, and due date.
   - Interactive status dropdown to update task progress directly from the phone.

7. **Company Notices**:
   - Announcements feed categorized by type (Info, Payroll, Holiday, Urgent) with author and timestamps.

8. **Employee Profile**:
   - Initials avatar, Employee ID, designation, department, contact info, and reporting manager.
   - System settings with current API server configuration.
   - Sign Out with confirmation dialog.

---

## Getting Started

### 1. Open in Android Studio
1. Launch **Android Studio** (Hedgehog, Iguana, Jellyfish, or newer).
2. Select **File > Open...**
3. Select the `shohoj-staff-android` folder:
   ```
   e:\Shohoj-Ledger\shohoj-staff-android
   ```
4. Allow Gradle to sync the project dependencies.

### 2. Configure Backend Server URL
- **Live Production Server (Default)**: The app connects by default to:
  ```
  https://team.shohojsolution.com/
  ```
- **Android Emulator**: Tap the server badge on the Login screen and select the **💻 Android Emulator Localhost** preset (`http://10.0.2.2:3000/`), which automatically maps to `http://localhost:3000` on your host computer.
- **Physical Device**: Connect your phone to the same Wi-Fi network as your computer. In the Server Environment dialog, enter your computer's local LAN IP:
  ```
  http://192.168.1.XX:3000/
  ```

### 3. Test Credentials
- **Employee ID**: `EMP-1001` (or any valid employee ID in your database)
- **Password**: `password123` (or password assigned in your DB)
