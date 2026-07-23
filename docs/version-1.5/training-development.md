# Version 1.5 - Enterprise Training & Development

## 1. Architecture
The Training & Development module is a structured engine designed to track employee upskilling. It is designed to stand independently from the Performance module, ensuring that training certificates and test scores are tracked purely as educational achievements.

**Core Models:**
- **`TrainingProgram`:** The master definition of a course (e.g., "Advanced Leadership", "Forklift Safety").
- **`TrainingSession`:** A specific, scheduled occurrence of a program, complete with capacities, trainers, and locations.
- **`TrainingEnrollment` & `TrainingAttendance`:** Tracks an employee's registration and physical/virtual attendance at a session.
- **`TrainingAssessment` & `TrainingCertificate`:** Manages the qualitative exit-criteria. Certificates are physically blocked from issuance unless a `PASS` assessment exists.

## 2. The Training Lifecycle Workflow
1. **Cataloging:** HR or Department Heads create `TrainingProgram` records.
2. **Scheduling:** `scheduleSession()` creates instances, mapping a specific `trainerId` (another employee) to run the session.
3. **Enrollment:** `enrollEmployee()` registers trainees. It strictly validates the `capacity` of the session before allowing insertion to prevent physical room overflow.
4. **Execution:** During the session, `recordAttendance()` logs presence.
5. **Evaluation:** Post-session, the trainer logs `recordAssessment()`.
6. **Certification:** `issueCertificate()` verifies that a `PASS` assessment exists before generating a unique certificate number and marking the enrollment as `COMPLETED`.

## 3. Performance Integration
Training **does not actively push** data to the Performance engine. This prevents circular coupling.
- **The Boundary:** When it is time for a Performance Review (Phase 8), the evaluator (or the system UI) can query `getTrainingHistory()` to retrieve a list of completed courses and certificates for that cycle.
- **Execution:** The reviewer can use this historical data to justify high scores in the `PerformanceScore` table, but the two modules remain structurally decoupled at the database level.

## 4. Security & Audit
- **Multi-Tenant Protection:** Every program traces up to `{ companyId }`.
- **Role Permissions Added:** `TRAINING_VIEW`, `TRAINING_CREATE`, `TRAINING_MANAGE`, `TRAINING_CERTIFY`.
- **Capacity Lock:** Database-level transaction verification prevents over-enrollment race conditions.
- **Audit Logging:** Separating `TrainingAttendance` and `TrainingAssessment` ensures that timestamps and evaluator IDs are immutable historical ledgers, preventing "retroactive passing" of failed tests without an auditable trail.
