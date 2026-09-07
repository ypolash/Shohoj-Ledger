# Known Limitations

- **Database Migrations:** There is a known local migration failure marker for `20260721102340_multi_tenant_phase_1` that needs to be resolved (`prisma migrate resolve --rolled-back`) on development environments.
- **Third-Party Integrations:** Some advanced export formats (PDF) might require external microservices or binary dependencies not included in the base Docker image.
- **Android App:** The mobile application is currently not synced with all v1.1.0 API changes and requires a separate update cycle.
- **UI Responsiveness:** A few complex tables in the inventory and payroll sections might require horizontal scrolling on extremely small mobile screens.
