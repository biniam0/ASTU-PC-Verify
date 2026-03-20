# ASTU PC Management – Backend

Node.js/Express backend for ASTU PC Management, using PostgreSQL (Neon), JWT auth, and Cloudinary for image storage.

## High-level Responsibilities & MVP Features

Main responsibilities:

- Implement user authentication
- Manage role-based access control
- Store and manage student and laptop data
- Handle image uploads
- Process ID verification requests
- Generate alerts and logs
- Provide APIs for the frontend
- Manage database operations (create, read, update, delete)

Core backend features for MVP:

- Login authentication
- Student registration API
- Laptop registration API
- ID verification API
- Scan logging system
- Alert generation

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Configure environment variables by copying `.env.example` to `.env` and filling in values:

- `DATABASE_URL` – Neon PostgreSQL connection string
- `JWT_SECRET` – strong random secret
- `CORS_ORIGIN` – frontend origin (e.g., http://localhost:3000)

3. Create database schema (e.g. in psql or Neon SQL editor):

```sql
\i db-schema.sql
```

4. Run the server in development mode:

```bash
npm run dev
```

Server will start on `http://localhost:5000` by default.

## Auth Feature (Feature 1)

### Tables

- `users` – stores user accounts, roles, password hashes, status, timestamps
- `user_sessions` – stores active JWT tokens with expiry, IP, user agent

### Endpoints

Base path: `/api/auth`

- `POST /register` – create new admin/security user (admin only)
- `POST /login` – login with `email` and `password`, returns `{ token, user }`
- `POST /logout` – revoke current session token (authenticated)
- `POST /refresh` – exchange existing token for a new one (uses sessions table)
- `GET /profile` – return current user profile (authenticated)
- `PUT /change-password` – change password with `currentPassword`, `newPassword` (authenticated)

### Auth Details

- Passwords hashed with bcrypt (configurable rounds)
- JWT payload includes `sub` (user id) and `role`
- Token expiry defaults to 8 hours (`JWT_EXPIRES_IN`)
- All protected routes use middleware that:
  - verifies JWT
  - validates session in `user_sessions`
  - loads user and role
- `requireRole('admin')` middleware restricts admin-only operations (like registration)
- Failed login attempts are counted and can trigger a temporary account lock

## Student Management (Feature 2)

### Tables

- `students` – stores student profiles (student_id, full name, year of entry, gender, department, contact info, timestamps, active flag, created/updated by)
- `student_audit_logs` – records all create/update/delete operations with before/after data and the user who performed the change

### Endpoints

Base path: `/api/students`

- `POST /` – register new student (admin)
- `GET /` – list students with pagination/filter/sort (admin, security)
- `GET /:studentId` – get student by student ID (admin, security)
- `PUT /:studentId` – update student info (admin)
- `DELETE /:studentId` – soft delete student (mark inactive, admin)
- `GET /search/by` – search by name, department, or year of entry (admin, security)
- `GET /department/:dept` – list students in a department (admin)

### Business Logic

- Student ID is unique (DB constraint) and validated via a configurable regex (`STUDENT_ID_REGEX`)
- Departments are validated against `STUDENT_DEPARTMENTS` when configured
- Deletion is soft (sets `is_active = false`) to preserve links to laptops/scan logs
- Every create/update/delete writes an entry to `student_audit_logs` with before/after JSON data
- Listing and search endpoints support pagination (`page`, `limit`) and server-side filtering/sorting; indexes on key columns improve performance

## Laptop Registration (Feature 3)

### Tables

- `laptops` – stores laptop inventory linked to students (brand, model, unique serial number, MAC address, color, purchase year, notes, timestamps, created/updated by)
- `laptop_images` – stores image metadata for each laptop (image type: front/back/serial/mac/other, Cloudinary public ID, URL, primary flag, uploader, timestamp)

### Endpoints

- `POST /api/students/:studentId/laptops` – register a new laptop for a student (admin)
- `GET /api/students/:studentId/laptops` – list laptops for a student (admin, security)
- `GET /api/laptops/:laptopId` – get laptop details (admin, security)
- `PUT /api/laptops/:laptopId` – update laptop info (admin)
- `DELETE /api/laptops/:laptopId` – delete a laptop and its images (admin)
- `GET /api/laptops/serial/:serialNumber` – lookup laptop by serial (admin, security)
- `POST /api/laptops/:laptopId/images` – upload JPEG/PNG images (max 5MB) for a laptop (admin)
- `GET /api/laptops/:laptopId/images` – list laptop images (admin, security)
- `DELETE /api/laptops/:laptopId/images/:imageId` – delete a specific laptop image (admin)

### Business Logic

- Serial numbers are globally unique (DB constraint plus service check)
- A student can own multiple laptops without limit
- Laptops can only be registered for active students
- Optional MAC addresses are validated using a standard MAC address regex
- Purchase year must not be in the future
- Images are uploaded via server-side Cloudinary SDK using the folder pattern `astu/laptops/{studentId}/{laptopId}/{imageType}`
- Only JPEG/PNG images up to 5MB are accepted
- When a laptop is deleted, all associated images are deleted from Cloudinary and removed from the database

## ID Scanning & Verification (Feature 4)

### Tables

- `scan_logs` – records every verification attempt (scanned ID, status `registered`/`unregistered`/`no_laptops`, scanner type, gate location, user, timestamp)
- `scan_alerts` – stores alerts for unregistered IDs or students with no laptops, with resolution metadata

### Endpoints

Base path: `/api/verification`

- `POST /scan` – process scanned student ID from barcode/QR/RFID (security, admin)
- `POST /manual` – process manually entered student ID (security, admin)
- `GET /check/:studentId` – quick minimal verification check (security, admin)

### Verification Flow

- Receive `studentId` plus optional `scannerType` and `gateLocation`
- Single optimized SQL query joins `students`, `laptops`, and `laptop_images` using JSON aggregation to fetch:
  - student profile
  - all laptops for that student
  - image URLs for each laptop
- If no matching student:
  - log scan with status `unregistered` in `scan_logs`
  - create an `unregistered` alert in `scan_alerts`
  - return an _Unregistered Response_ with an alert message
- If student exists but has no laptops:
  - log scan with status `no_laptops`
  - create a `no_laptops` alert
  - return a _No Laptops Response_ with student details but no laptops
- If student and laptops exist:
  - log scan with status `registered`
  - return a _Registered Response_ containing student profile, laptops, and Cloudinary image URLs

Indexes on `students.student_id`, `laptops.student_id`, and related foreign keys help keep responses under ~2 seconds, while Cloudinary URLs are returned directly without extra processing.

## Alert Management (Feature 5)

### Tables

- `alerts` – core alert store with: ID, type (`unregistered_id`, `no_laptop`, `suspicious_activity`), scanned student ID, student reference (if known), scan reference, message, severity (`low`, `medium`, `high`), status (`active`, `resolved`, `false_alarm`), gate location, repeat count, creator, resolver, resolution notes, timestamps.
- `alert_history` – tracks status changes and notes with timestamps and user references.

### Endpoints

Base path: `/api/alerts`

- `GET /` – list alerts with filters (`type`, `status`, `fromDate`, `toDate`, `gateLocation`, pagination) – admin, security
- `GET /active` – list all active alerts – admin, security
- `GET /:alertId` – detailed alert info including history – admin, security
- `PUT /:alertId/resolve` – resolve an alert with required resolution notes – admin, security
- `PUT /:alertId/false-alarm` – mark alert as false alarm – admin, security
- `POST /:alertId/notes` – append additional notes to an alert – admin, security
- `GET /statistics` – aggregated statistics (counts by type, resolution times) – admin
- `GET /student/:studentId` – all alerts associated with a given student ID – admin, security

### Business Logic

- Alerts are auto-created during verification for:
  - `unregistered_id` when a scanned ID is not found.
  - `no_laptop` when a student has no registered laptops.
- Each alert links back to the triggering scan via `scan_log_id`.
- Duplicate detection: repeated alerts for the same student/type/gate within `ALERT_DUPLICATE_WINDOW_MINUTES` are merged by incrementing `repeat_count` instead of creating a new alert.
- Severity:
  - `high` for repeat offenders (3+ alerts of same type/student in 24 hours).
  - `medium` for first-time incidents by default.
- Resolution:
  - Resolving or marking false alarm records resolver, time, and notes on the alert and adds an entry to `alert_history`.
  - Alerts remain stored for reporting; statistics include counts by type and basic resolution time metrics.

## Scan Logging & History (Feature 6)

### Tables

- `scan_logs` – records every verification attempt with: scanned student ID, optional linked student, denormalized student name, scan type (`scan`/`manual`), result status (`registered`/`unregistered`/`no_laptops`), scanner type, gate location, scanning user, alert flags/references, IP address, user agent, response time in ms, original request payload, and timestamp.
- `daily_scan_statistics` – (for pre-aggregation) stores per-day totals: total scans, registered/unregistered/no-laptop counts, alerts generated, peak hour, and busiest gate.

### Endpoints

Base path: `/api/logs`

- `GET /scans` – paginated scan logs with filters (`status`, `fromDate`, `toDate`, `gateLocation`, `scannedByUserId`) – admin
- `GET /scans/:scanId` – detailed information for a specific scan – admin, security
- `GET /scans/student/:studentId` – complete scan history for a student – admin, security
- `GET /scans/date-range` – scans between `fromDate` and `toDate` – admin
- `GET /scans/today` – all scans for the current day – admin, security
- `GET /scans/gate/:gateLocation` – scans performed at a specific gate – admin
- `GET /scans/staff/:userId` – scans performed by a specific security staff member – admin
- `GET /scans/statistics/daily` – daily scan statistics (totals and success breakdowns) – admin
- `GET /scans/statistics/hourly` – hourly scan distribution for peak-time analysis – admin
- `GET /scans/export` – CSV export of scan logs for external analysis – admin

### Logging & Performance

- Each verification request creates a `scan_logs` entry at the start with `status = 'pending'`, then updates it after verification with the final result, linked student (if any), alert linkage, and measured response time.
- The schema and model support storing IP address, user agent, and the original request payload; you can extend the verification routes to populate these from the incoming HTTP request for full auditing.
- Indexes on `scan_logs.scanned_student_id`, `student_id`, `created_at`, `scanned_by_user_id`, and `gate_location` support fast lookups and date-range queries.
- CSV exports provide Excel-compatible data for offline analysis.

## User Management (Feature 7)

### Purpose

Feature 7 allows administrators to manage system users (admins and security staff), including creation, updates, deactivation, password resets, and basic activity summaries.

### Schema

- `users`
  - Extended fields:
    - `department` – department or unit, useful for assigning security staff to specific gates.
    - `phone` – contact phone number.
    - `last_login_ip` – IP address of the last successful login.
    - `login_count` – total successful login count.
    - `created_by_user_id`, `updated_by_user_id` – references to the admin who created/last updated the user.
    - `deactivated_at`, `deactivation_reason`, `deactivated_by_user_id` – soft-deactivation metadata.
- `password_reset_tokens`
  - Stores admin-triggered password reset events with: `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`, and `created_by_user_id`.

### Endpoints

Base path: `/api/users` (Admin only)

- `GET /` – list all users with pagination and filtering by `role`, `department`, `isActive`, and free-text `search` (username, email, full name).
- `POST /` – create a new user account with a generated secure temporary password; returns the user plus `temporaryPassword` for the admin to communicate to the user.
- `GET /:userId` – get detailed information for a specific user including department, contact details, and deactivation metadata.
- `PUT /:userId` – update user information such as username, email, full name, role, department, and phone. Username and email remain unique across users.
- `PUT /:userId/status` – activate or deactivate a user account. Deactivation requires a reason and records `deactivated_at` and `deactivated_by_user_id`. Administrators cannot deactivate their own account.
- `POST /:userId/reset-password` – generate and apply a new secure temporary password for the user, store a corresponding `password_reset_tokens` record with 24-hour expiry, and return the temporary password to the admin.
- `GET /:userId/activity` – activity summary for a specific user, including counts of scans performed, students registered, laptops registered, and alerts resolved.
- `GET /roles/permissions` – returns the available roles (`admin`, `security`) and their high-level permissions for UI configuration.

### Behavior & Activity Tracking

- On successful login, the system updates `last_login_at`, `last_login_ip`, and increments `login_count` for the user.
- User creation and updates record the admin responsible via `created_by_user_id` and `updated_by_user_id`.
- User deactivation is implemented as a soft delete (`is_active = FALSE`) with reason and actor recorded; existing scans, registrations, and alerts remain for audit but associated UI can display them as "deactivated user".
- Each admin-triggered password reset creates a `password_reset_tokens` entry for auditing, with a 24-hour expiration window.

## Dashboard & Statistics (Feature 8)

### Purpose

Feature 8 exposes aggregated statistics and chart data for dashboards used by administrators and security staff. It surfaces real-time insights into registrations, verifications, and alerts while using a lightweight cache for frequently accessed metrics.

### Schema & Caching

- Uses existing tables:
  - `students`, `laptops` – for registration counts and distributions.
  - `scan_logs` – for verification/scan volume and result breakdowns.
  - `alerts` – for alert counts, types, and severities.
- `cached_dashboard_metrics`
  - Simple key/value cache storing JSON payloads and `valid_until` timestamp.
  - Used by the dashboard service to cache expensive aggregates for a short TTL (default 5 minutes via `DASHBOARD_CACHE_TTL_SECONDS`).

### Endpoints

Base path: `/api/dashboard`

- `GET /summary` – overall system summary (Admin, Security)
  - Returns aggregate metrics: total students, total laptops, students without laptops, today’s scan count, active alerts, today’s student and laptop registrations, and today’s scans by result (`registered`, `unregistered`, `noLaptops`).
- `GET /admin` – comprehensive admin dashboard data (Admin)
  - Wraps summary plus alert breakdown by type and student distribution by department for admin charts.
- `GET /security` – security-specific dashboard data (Security)
  - Returns today’s total scans, scans performed by the logged-in security user, a list of recent active alerts, recent scans at an optional `gateLocation`, and gate-wise scan distribution for today.
- `GET /registrations` – registration statistics (Admin)
  - Total students, total laptops, students without laptops, today’s student registrations, and today’s laptop registrations.
- `GET /verifications` – verification statistics (Admin, Security)
  - Overall and today’s scan counts with breakdowns for `registered`, `unregistered`, and `no_laptops` statuses.
- `GET /alerts` – alert summary (Admin, Security)
  - Total alerts plus counts by status (active, resolved, false alarm), and active alerts grouped by type and severity.
- `GET /activity/recent` – recent activity feed (Admin, Security)
  - Combined feed of the most recent scans and alerts (up to 50 entries) sorted by time, suitable for a live activity stream.
- `GET /charts/registrations` – chart data for registrations over time (Admin)
  - Returns a 30-day series with daily counts of students and laptops registered.
- `GET /charts/scans` – chart data for scan volume over time (Admin)
  - Returns a 30-day series with daily total scans and per-result breakdown (`registered`, `unregistered`, `no_laptops`).
- `GET /charts/departments` – student distribution by department (Admin)
  - Returns counts of active students per department for use in pie/bar charts.

### Performance Notes

- Dashboard service uses the `cached_dashboard_metrics` table to cache JSON results for a configurable TTL (default 5 minutes), significantly reducing load on aggregate-heavy queries.
- Aggregations are computed using indexed columns (such as `created_at`, `status`, `department`, and `role`-specific foreign keys) to keep queries responsive.
- The design is compatible with adding background jobs or materialized views to precompute statistics; those can be scheduled separately (for example, via cron or a worker process) without changing the API surface.

## Audit Logging (Feature 9)

### Purpose

Feature 9 provides a unified audit trail of important system activities, including user logins/logouts, user management actions, exports, and (extensible) entity changes. Audit entries are immutable and are intended to support compliance and incident investigations.

### Schema

- `audit_logs`
  - Core columns:
    - `id` – audit entry ID.
    - `created_at` – timestamp of the audited action.
    - `user_id` – reference to `users.id` when the action is authenticated.
    - `username`, `user_role` – denormalized user identity and role for stable historical reporting.
    - `ip_address`, `user_agent` – source of the request when available.
    - `action` – one of `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `SCAN`, `EXPORT`, `RESOLVE`, `UPLOAD`.
    - `entity_type` – one of `student`, `laptop`, `user`, `alert`, `setting`, `image`, `scan`, `other`.
    - `entity_id` – UUID of the affected entity where applicable.
    - `entity_identifier` – human-readable identifier (e.g., username or student ID).
    - `old_data`, `new_data` – JSON snapshots of the before/after state; sensitive fields (passwords and hashes) are redacted by the audit service.
    - `description` – human-readable description of the change.
  - Indexes on `created_at`, `user_id`, `(entity_type, entity_id)`, and `action` support filtered audit queries.

### Endpoints

Base path: `/api/audit` (Admin only)

- `GET /` – list audit logs with pagination and filters (`action`, `entityType`, `userId`, `fromDate`, `toDate`, `search` on identifier/description).
- `GET /:logId` – get a single audit log entry by ID.
- `GET /entity/:entityType/:entityId` – full audit history for a specific entity.
- `GET /user/:userId` – all audit log entries linked to a specific user (with pagination via query params).
- `GET /date-range` – audit logs between `fromDate` and `toDate`.
- `GET /action/:action` – audit logs filtered by a specific action type.
- `GET /export` – CSV export of audit logs, filtered by the same parameters as `GET /`.

### Application-Level Audit Events

- Login:
  - Successful logins via `/api/auth/login` create a `LOGIN` audit entry containing user identity and source IP/user-agent.
- Logout:
  - `/api/auth/logout` records a `LOGOUT` audit entry for the current user.
- User management:
  - Admin user creation (`POST /api/users`) logs a `CREATE` audit entry for the new user (excluding password data).
  - User updates (`PUT /api/users/:userId`) log an `UPDATE` entry with old and new core fields (username, email, role, department).
  - User activation/deactivation (`PUT /api/users/:userId/status`) logs `UPDATE` (for reactivation) or `DELETE`-style entries (for deactivation) capturing status and deactivation metadata.
  - Admin-triggered password resets (`POST /api/users/:userId/reset-password`) log an `UPDATE` entry indicating that a reset occurred (without storing the temporary password).
- Exports:
  - Scan log export (`GET /api/logs/scans/export`) logs an `EXPORT` entry with the applied filters.
  - Audit log export (`GET /api/audit/export`) logs an `EXPORT` entry with export filter parameters for compliance tracking.

### Extensibility & Retention

- The audit service (`recordAuditEvent`) is reusable from any route or service to record additional actions (e.g., student/laptop CRUD, alert resolution, uploads). It automatically redacts password fields from JSON payloads.
- Long-term log retention, archival to cold storage, and any database-level triggers can be added outside this codebase (for example, via SQL migrations or periodic jobs). The application does not expose any endpoint to modify or delete audit logs, preserving immutability at the API level.

## System Configuration & Settings (Feature 10)

### Purpose

Feature 10 introduces centralized configuration and reference data for departments, gates, security settings, and backup configuration/status. This allows administrators to manage core system settings via APIs instead of environment variables only.

### Schema

- `system_settings`
  - Generic key/value JSON store for system-wide settings.
  - Columns: `key` (unique), `value` (JSONB), `description`, `data_type`, `updated_at`, `updated_by_user_id`.
  - Example keys:
    - `security.session_timeout_minutes`
    - `security.password_policy`
    - `backup.schedule`
    - `backup.retention_days`
    - Any other namespaced settings needed by the system.
- `departments`
  - Reference table for academic/organizational departments used in student registration and reporting.
  - Columns: `id`, `name`, `code` (unique), `is_active`, `created_at`, `updated_at`, `created_by_user_id`, `updated_by_user_id`.
- `gates`
  - Configuration table for exit/entry gates and scanners.
  - Columns: `id`, `name`, `location`, `scanner_type` (`barcode`, `qr`, `rfid`, `manual`), `ip_address`, `is_active`, `created_at`, `updated_at`, `created_by_user_id`.
- `backup_history`
  - Tracks backup requests and status.
  - Columns: `id`, `type` (`manual`, `scheduled`), `status` (`queued`, `running`, `success`, `failed`), `triggered_by_user_id`, `triggered_at`, `completed_at`, `details` (JSONB).

### Endpoints

Base path: `/api/settings`

#### System settings

- `GET /` – list all settings (Admin)
  - Returns all keys and values from `system_settings`.
- `PUT /` – upsert system settings (Admin)
  - Accepts either a simple key/value object or an array of `{ key, value, description, dataType }`.
  - Writes through to `system_settings` and records an audit `UPDATE` event with `entityType = 'setting'`.

#### Departments

- `GET /departments` – list departments (Admin, Security)
  - Returns all departments with `id`, `name`, `code`, `is_active`, timestamps.
- `POST /departments` – create department (Admin)
  - Body: `{ name, code }`.
  - Validates uniqueness of `code`.
  - Creates a row in `departments` and writes an audit `CREATE` entry.
- `PUT /departments/:dept` – update department (Admin)
  - `:dept` is the department `code`.
  - Body: `{ name?, newCode?, isActive? }`.
  - Optionally renames the department, changes its code, or toggles `is_active`.
  - Validates that `newCode` (if provided) is still unique.
  - Writes an audit `UPDATE` entry.
- `DELETE /departments/:dept` – delete department (Admin)
  - `:dept` is the department `code`.
  - Refuses to delete if there are active students with `students.department = :dept`.
  - On success, removes the department and records an audit `DELETE` entry.

> Note: student registration currently still validates departments against the environment-driven `STUDENT_DEPARTMENTS` configuration. The `departments` table is intended as the authoritative source for UIs and future validation logic.

#### Gates

- `GET /gates` – list gates (Admin, Security)
  - Returns configured gates (name, location, scanner type, IP address, activity flag, timestamps).
- `POST /gates` – create gate (Admin)
  - Body: `{ name, location?, scannerType, ipAddress? }`.
  - `scannerType` must be one of `barcode`, `qr`, `rfid`, or `manual`.
  - Creates a gate row and records an audit `CREATE` entry.
- `PUT /gates/:gateId` – update gate (Admin)
  - Body: `{ name?, location?, scannerType?, ipAddress?, isActive? }`.
  - Validates `scannerType` if provided and updates gate details.
  - Records an audit `UPDATE` entry.
- `DELETE /gates/:gateId` – delete gate (Admin)
  - Deletes the gate row and records an audit `DELETE` entry.

#### Security settings

- `GET /security` – list security-related settings (Admin)
  - Returns settings with keys prefixed by `security.` from `system_settings`.
- `PUT /security` – update security-related settings (Admin)
  - Body: object with arbitrary keys; each key is stored under `security.{key}` in `system_settings`.
  - Writes an audit `UPDATE` entry.

#### Backup configuration & manual backup

- `GET /backup` – get backup configuration and last status (Admin)
  - Returns:
    - `config` – current values of `backup.schedule`, `backup.retention_days`, and `backup.enabled` from `system_settings` (if present).
    - `lastBackup` – the most recent row from `backup_history`.
- `POST /backup/manual` – request a manual backup (Admin)
  - Creates a `backup_history` row with `type = 'manual'`, `status = 'queued'`, and a JSON `details` note.
  - Records an audit `CREATE` entry.
  - Returns `202 Accepted` with the created backup record.

> The application does not perform the physical database backup itself. Instead, this endpoint is intended to integrate with external automation that picks up `backup_history` entries and executes the actual backup process.

## API Reference for Frontend Integration

This section summarizes the main REST endpoints and shows example JSON requests and responses to help frontend developers integrate with the backend.

Unless stated otherwise:

- Base URL: `http://localhost:5000`
- All protected routes require `Authorization: Bearer <JWT_TOKEN>`
- All request/response bodies are JSON

### Auth – `/api/auth`

**Login**  
`POST /api/auth/login`

Request body:

```json
{
  "email": "admin1@example.com",
  "password": "Admin123!@#"
}
```

Success response (200):

```json
{
  "token": "<JWT_TOKEN>",
  "user": {
    "id": "uuid",
    "username": "admin1",
    "email": "admin1@example.com",
    "role": "admin",
    "department": "ICT",
    "phone": "+251900000000"
  }
}
```

**Current profile**  
`GET /api/auth/profile`

Headers: `Authorization: Bearer <JWT_TOKEN>`

Response (200):

```json
{
  "id": "uuid",
  "username": "admin1",
  "email": "admin1@example.com",
  "role": "admin",
  "department": "ICT",
  "phone": "+251900000000",
  "lastLoginAt": "2026-03-12T10:00:00.000Z"
}
```

**Change password**  
`PUT /api/auth/change-password`

Request body:

```json
{
  "currentPassword": "Admin123!@#",
  "newPassword": "NewStrongPass123!"
}
```

Response (200):

```json
{ "message": "Password changed successfully" }
```

### Students – `/api/students`

**Create student (admin)**  
`POST /api/students`

Request body:

```json
{
  "studentId": "ETS123456",
  "fullName": "Abebe Bekele",
  "yearOfEntry": 2022,
  "gender": "male",
  "department": "Software Engineering",
  "email": "abebe.bekele@astu.edu.et",
  "phone": "+251911111111"
}
```

Success response (201):

```json
{
  "id": "uuid",
  "studentId": "ETS123456",
  "fullName": "Abebe Bekele",
  "yearOfEntry": 2022,
  "gender": "male",
  "department": "Software Engineering",
  "email": "abebe.bekele@astu.edu.et",
  "phone": "+251911111111",
  "isActive": true,
  "createdAt": "2026-03-12T10:10:00.000Z"
}
```

**List students (admin, security)**  
`GET /api/students?page=1&limit=10&department=Software%20Engineering`

Response (200):

```json
{
  "data": [
    {
      "id": "uuid",
      "studentId": "ETS123456",
      "fullName": "Abebe Bekele",
      "department": "Software Engineering",
      "yearOfEntry": 2022,
      "isActive": true
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

**Get student by ID**  
`GET /api/students/ETS123456`

Response (200):

```json
{
  "id": "uuid",
  "studentId": "ETS123456",
  "fullName": "Abebe Bekele",
  "department": "Software Engineering",
  "yearOfEntry": 2022,
  "gender": "male",
  "email": "abebe.bekele@astu.edu.et",
  "phone": "+251911111111",
  "isActive": true
}
```

**Update student (admin)**  
`PUT /api/students/ETS123456`

Request body (only changed fields are required):

```json
{
  "fullName": "Abebe B. Bekele",
  "phone": "+251922222222"
}
```

Response (200): updated student JSON.

**Soft-delete student (admin)**  
`DELETE /api/students/ETS123456`

Response (200):

```json
{
  "message": "Student deactivated",
  "student": {
    "studentId": "ETS123456",
    "isActive": false
  }
}
```

**Search & department listing**

- `GET /api/students/search/by?q=Abebe&page=1&limit=5` – same shape as list endpoint.
- `GET /api/students/department/Software%20Engineering` – returns an array of student objects.

### Laptops & Images

**Create laptop for student (admin)**  
`POST /api/students/:studentId/laptops`

Example URL: `/api/students/ETS123456/laptops`

Request body:

```json
{
  "brand": "Dell",
  "model": "Latitude 5490",
  "serialNumber": "SN-ABC-12345",
  "macAddress": "00:11:22:33:44:55",
  "color": "Black",
  "purchaseYear": 2021,
  "notes": "Student personal laptop"
}
```

Response (201):

```json
{
  "id": "uuid",
  "studentId": "uuid-of-student",
  "brand": "Dell",
  "model": "Latitude 5490",
  "serialNumber": "SN-ABC-12345",
  "macAddress": "00:11:22:33:44:55",
  "color": "Black",
  "purchaseYear": 2021,
  "notes": "Student personal laptop"
}
```

**List laptops for student**  
`GET /api/students/ETS123456/laptops`

Response:

```json
[
  {
    "id": "uuid",
    "brand": "Dell",
    "model": "Latitude 5490",
    "serialNumber": "SN-ABC-12345",
    "color": "Black"
  }
]
```

**Laptop images**

- `POST /api/laptops/:laptopId/images` – multipart/form-data
  - Fields: `image` (file), `imageType` ("front" | "back" | "serial" | ...)
  - Response:

    ```json
    {
      "id": "uuid",
      "laptopId": "uuid-of-laptop",
      "imageType": "front",
      "cloudinaryPublicId": "astu/laptops/ETS123456/uuid-of-laptop/front/xyz",
      "cloudinaryUrl": "https://res.cloudinary.com/...",
      "isPrimary": true
    }
    ```

- `GET /api/laptops/:laptopId/images` – returns an array of image records.
- `DELETE /api/laptops/:laptopId/images/:imageId` – returns `{ "message": "Image deleted" }`.

### Verification – `/api/verification`

**Scan ID (QR/barcode/RFID)**  
`POST /api/verification/scan`

Request body:

```json
{
  "studentId": "ETS123456",
  "scannerType": "qr",
  "gateLocation": "Main Gate"
}
```

Possible responses (200):

Registered:

```json
{
  "status": "registered",
  "student": {
    "studentId": "ETS123456",
    "fullName": "Abebe Bekele",
    "department": "Software Engineering"
  },
  "laptops": [
    {
      "id": "uuid",
      "brand": "Dell",
      "serialNumber": "SN-ABC-12345",
      "images": [
        {
          "imageType": "front",
          "url": "https://res.cloudinary.com/..."
        }
      ]
    }
  ]
}
```

Unregistered ID:

```json
{
  "status": "unregistered",
  "studentId": "ETS000000",
  "message": "Student ID not found",
  "alertId": "uuid"
}
```

No laptops:

```json
{
  "status": "no_laptops",
  "student": {
    "studentId": "ETS123456",
    "fullName": "Abebe Bekele"
  },
  "message": "Student has no registered laptops",
  "alertId": "uuid"
}
```

**Manual entry**  
`POST /api/verification/manual` – same request/response shapes as `/scan`.

**Quick check**  
`GET /api/verification/check/:studentId`

Example: `GET /api/verification/check/ETS123456`

Response:

```json
{
  "status": "registered",
  "hasLaptops": true
}
```

### Alerts – `/api/alerts`

**List alerts**  
`GET /api/alerts?status=active&type=unregistered_id&page=1&limit=10`

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "unregistered_id",
      "scannedStudentId": "ETS000000",
      "severity": "medium",
      "status": "active",
      "gateLocation": "Main Gate",
      "repeatCount": 1,
      "createdAt": "2026-03-12T10:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

**Resolve alert**  
`PUT /api/alerts/:alertId/resolve`

Request body:

```json
{
  "resolutionNotes": "Student verified with registrar, allowed to pass."
}
```

Response:

```json
{
  "id": "uuid",
  "status": "resolved",
  "resolverUserId": "uuid-of-admin",
  "resolutionNotes": "Student verified with registrar, allowed to pass.",
  "resolvedAt": "2026-03-12T10:20:00.000Z"
}
```

**Append note**  
`POST /api/alerts/:alertId/notes`

Request body:

```json
{
  "note": "Supervisor reviewed CCTV footage.",
  "userId": "uuid-of-admin"
}
```

**Alert statistics**  
`GET /api/alerts/statistics`

Response:

```json
{
  "countsByType": [
    { "type": "unregistered_id", "count": 5 },
    { "type": "no_laptop", "count": 2 }
  ],
  "resolutionTimes": {
    "avgMinutes": 12.5,
    "minMinutes": 2,
    "maxMinutes": 45
  }
}
```

### Scan Logs – `/api/logs`

**List scans**  
`GET /api/logs/scans?status=registered&fromDate=2026-03-01&toDate=2026-03-31&page=1&limit=20`

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "scannedStudentId": "ETS123456",
      "status": "registered",
      "gateLocation": "Main Gate",
      "scanType": "scan",
      "createdAt": "2026-03-12T10:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

**Daily statistics**  
`GET /api/logs/scans/statistics/daily`

Response:

```json
[
  {
    "date": "2026-03-12",
    "total_scans": 50,
    "registered_scans": 40,
    "unregistered_scans": 5,
    "no_laptop_scans": 5,
    "alerts_generated": 10,
    "peak_hour": 12,
    "busiest_gate": "Main Gate"
  }
]
```

**Hourly statistics**  
`GET /api/logs/scans/statistics/hourly` – returns an array of `{ date, hour, total_scans }` objects.

### Users – `/api/users` (admin)

**Create user**  
`POST /api/users`

Request body:

```json
{
  "username": "security1",
  "email": "security1@example.com",
  "role": "security",
  "fullName": "Security Officer 1",
  "department": "Security",
  "phone": "+251933333333"
}
```

Response:

```json
{
  "user": {
    "id": "uuid",
    "username": "security1",
    "email": "security1@example.com",
    "role": "security",
    "isActive": true
  },
  "temporaryPassword": "AutoGen-1234"
}
```

**List users**  
`GET /api/users?role=security&isActive=true&search=security1&page=1&limit=10`

Response is the same list/pagination pattern as students.

**Change status**  
`PUT /api/users/:userId/status`

Request body (deactivate):

```json
{
  "isActive": false,
  "deactivationReason": "Left organization"
}
```

**Reset password**  
`POST /api/users/:userId/reset-password`  
Response:

```json
{
  "temporaryPassword": "NewTempPass-5678"
}
```

**User activity summary**  
`GET /api/users/:userId/activity`

Response:

```json
{
  "scans_performed": 20,
  "students_registered": 5,
  "laptops_registered": 3,
  "alerts_resolved": 4
}
```

### Dashboard – `/api/dashboard`

**Summary**  
`GET /api/dashboard/summary`

Response:

```json
{
  "totalStudents": 1000,
  "totalLaptops": 850,
  "studentsWithoutLaptops": 150,
  "todayScans": 120,
  "activeAlerts": 3,
  "todayStudentRegistrations": 10,
  "todayLaptopRegistrations": 8,
  "todayScanResults": {
    "registered": 100,
    "unregistered": 10,
    "noLaptops": 10
  }
}
```

`GET /api/dashboard/admin`, `/security`, `/registrations`, `/verifications`, `/alerts`, `/activity/recent`, and `/charts/*` all return JSON suited for charts and dashboards, generally arrays of `{ date, value... }` or objects grouping counts.

### Audit – `/api/audit`

**List audit logs**  
`GET /api/audit?entityType=student&fromDate=2026-03-01&toDate=2026-03-31&page=1&limit=20`

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "createdAt": "2026-03-12T10:00:00.000Z",
      "userId": "uuid-of-admin",
      "username": "admin1",
      "action": "CREATE",
      "entityType": "student",
      "entityId": "uuid-of-student",
      "entityIdentifier": "ETS123456",
      "description": "Created student ETS123456"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### Settings, Departments, Gates, Backup – `/api/settings`

**Upsert system settings**  
`PUT /api/settings`

Request body:

```json
[
  {
    "key": "security.session_timeout_minutes",
    "value": 60,
    "description": "Session timeout in minutes",
    "dataType": "number"
  },
  {
    "key": "backup.retention_days",
    "value": 30,
    "description": "How long to keep backups",
    "dataType": "number"
  }
]
```

Response: array of saved settings with metadata.

**Create department**  
`POST /api/settings/departments`

Request body:

```json
{
  "name": "Electrical Engineering",
  "code": "EE"
}
```

**Create gate**  
`POST /api/settings/gates`

Request body:

```json
{
  "name": "North Gate",
  "location": "North Campus",
  "scannerType": "qr",
  "ipAddress": "10.0.0.5"
}
```

**Get backup config & status**  
`GET /api/settings/backup`

Response:

```json
{
  "config": {
    "schedule": "0 2 * * *",
    "retentionDays": 30,
    "enabled": true
  },
  "lastBackup": {
    "id": "uuid",
    "type": "manual",
    "status": "success",
    "triggeredAt": "2026-03-11T02:00:00.000Z",
    "completedAt": "2026-03-11T02:10:00.000Z"
  }
}
```

**Request manual backup**  
`POST /api/settings/backup/manual`

Request body:

```json
{
  "note": "On-demand backup before schema change"
}
```

Response (202):

```json
{
  "id": "uuid",
  "type": "manual",
  "status": "queued",
  "details": {
    "note": "On-demand backup before schema change"
  }
}
```

---

These examples are intentionally simplified; real responses may include additional fields like timestamps and internal IDs. Frontend code should ignore unknown fields and focus on the documented ones.
