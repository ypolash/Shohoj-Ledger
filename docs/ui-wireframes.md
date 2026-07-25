# Structural Wireframes & Layout Planning

This document describes the structural layout of the application. No aesthetic styling is detailed here, only wireframe regions.

## 1. Master Application Layout

```text
+---------------------------------------------------------+
| [LOGO]   | [GLOBAL SEARCH]        | [NOTIF] [PROFILE]   | <- Topbar (64px)
+----------+----------------------------------------------+
| Sidebar  | Main Content Area                            |
|          |                                              |
| - Dash   | Breadcrumbs: Home / Module / Page            |
| - CRM    |                                              |
| - Fin    | PAGE TITLE                     [PRI. ACTION] | <- Header
| - Inv    | -------------------------------------------- |
|          | [Search Input] [Filter 1] [Filter 2] [Export]| <- Toolbar
|          |                                              |
|          | +------------------------------------------+ |
|          | | Table Header (Sticky)                    | |
|          | +------------------------------------------+ |
|          | | Data Row 1                               | | <- Content (Table/Grid)
|          | | Data Row 2                               | |
|          | | Data Row 3                               | |
|          | +------------------------------------------+ |
|          | [Pagination Controls]                        | <- Footer
+----------+----------------------------------------------+
```

## 2. Detail Page Layout (e.g., Customer Detail)

```text
+---------------------------------------------------------+
| [LOGO]   | [GLOBAL SEARCH]        | [NOTIF] [PROFILE]   |
+----------+----------------------------------------------+
| Sidebar  | < Back to Customers                          |
|          |                                              |
|          | [Avatar] CUSTOMER NAME         [EDIT] [MORE] | <- Profile Header
|          | Status: Active | ID: CUST-001                |
|          | -------------------------------------------- |
|          | [Overview] [Contacts] [Financials] [Orders]  | <- Tabs
|          |                                              |
|          | +-------------+ +--------------------------+ |
|          | | KPI Card    | | Recent Activity Chart    | |
|          | +-------------+ +--------------------------+ |
|          | | Info Panel  | | Data Table (Orders)      | |
|          | | - Email     | |                          | |
|          | | - Phone     | |                          | |
|          | +-------------+ +--------------------------+ |
+----------+----------------------------------------------+
```

## 3. Side Panel (Drawer) Layout (e.g., Create Form)

```text
+---------------------------------------------------------+
| [LOGO]   |                        | [NOTIF] [PROFILE]   |
+----------+------------------------+---------------------+
| Sidebar  | Main Content (Dimmed)  | NEW CUSTOMER    [X] | <- Drawer Header
|          |                        | ------------------- |
|          |                        | First Name          |
|          |                        | [_______________]   |
|          |                        |                     |
|          |                        | Last Name           |
|          |                        | [_______________]   |
|          |                        |                     |
|          |                        | Email               |
|          |                        | [_______________]   |
|          |                        |                     |
|          |                        | ------------------- |
|          |                        | [Cancel]   [SAVE]   | <- Drawer Footer (Sticky)
+----------+------------------------+---------------------+
```

## Wireframe Principles
1. **Context Retention:** Use Drawers for data entry so the user never leaves the list view.
2. **F-Pattern Scanning:** Top-left to bottom-right reading flow. Actions always top-right.
3. **Z-Pattern Layout:** For dashboards and visual data.
4. **Sticky Elements:** Table headers and Drawer footers must always remain visible during scroll.
