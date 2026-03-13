# ASTU PC Management – API Testing Guide

This README focuses on **test input and expected output** for the main backend responsibilities and MVP features.

- Base URL (dev): `http://localhost:5000`
- All protected routes require header: `Authorization: Bearer <JWT_TOKEN>`
- All bodies are JSON unless otherwise stated

---

## 1. User Authentication & RBAC

### 1.1 Bootstrap initial admin (one‑time)

`POST /api/auth/bootstrap-admin` (no auth, only works when no users exist)

Request body:

```json
{
  "username": "admin1",
  "email": "admin1@example.com",
  "password": "Admin123!@#",
  "fullName": "System Administrator"
}
```

Expected success (201):

```json
{
  "message": "Initial admin user created",
  "user": {
    "id": "uuid",
    "username": "admin1",
    "email": "admin1@example.com",
    "role": "admin",
    "is_active": true
  }
}
```

### 1.2 Login authentication (MVP)

`POST /api/auth/login`

Request body:

```json
{
  "email": "admin1@example.com",
  "password": "Admin123!@#"
}
```

Expected success (200):

```json
{
  "token": "<JWT_TOKEN>",
  "user": {
    "id": "uuid",
    "username": "admin1",
    "email": "admin1@example.com",
    "role": "admin",
    "fullName": "System Administrator",
    "department": null,
    "phone": null,
    "isActive": true,
    "createdAt": "2026-03-12T10:00:00.000Z",
    "lastLoginAt": "2026-03-12T10:05:00.000Z"
  }
}
```

Typical failure (401):

```json
{
  "message": "Invalid email or password"
}
```

### 1.3 Current profile

`GET /api/auth/profile`

Headers: `Authorization: Bearer <JWT_TOKEN>`

Expected success (200):

```json
{
  "user": {
    "id": "uuid",
    "username": "admin1",
    "email": "admin1@example.com",
    "role": "admin",
    "fullName": "System Administrator",
    "department": null,
    "phone": null,
    "lastLoginAt": "2026-03-12T10:05:00.000Z"
  }
}
```

### 1.4 Change password

`PUT /api/auth/change-password`

Request body:

```json
{
  "currentPassword": "Admin123!@#",
  "newPassword": "NewStrongPass123!"
}
```

Expected success (200):

```json
{
  "message": "Password updated successfully"
}
```

Error (400 – missing fields):

```json
{
  "message": "currentPassword and newPassword are required"
}
```

### 1.5 Role-based access quick checks

- Admin-only example: `GET /api/users` with a **security** token → `403` with body like:
  ```json
  {
    "message": "Forbidden: insufficient role"
  }
  ```
- Security-only example: `GET /api/dashboard/security` with an **admin** token → `403`.

---

## 2. Student Data – CRUD & Registration (MVP)

### 2.1 Create student (Student registration API)

`POST /api/students` (admin)

Headers: `Authorization: Bearer <ADMIN_JWT>`

Request body (ASTU-style ID example):

```json
{
  "studentId": "Ugr/35112/16",
  "fullName": "Abebe Bekele",
  "yearOfEntry": 2022,
  "gender": "male",
  "department": "Software Engineering",
  "email": "abebe.bekele@astu.edu.et",
  "phone": "+251911111111"
}
```

Expected success (201):

```json
{
  "student": {
    "id": "uuid",
    "student_id": "Ugr/35126/16",
    "full_name": "Abebe Bekele",
    "year_of_entry": 2022,
    "gender": "male",
    "department": "Software Engineering",
    "email": "abebe.bekele@astu.edu.et",
    "phone": "+251911111111",
    "is_active": true,
    "created_at": "2026-03-12T10:10:00.000Z"
  }
}
```

Validation error (400 – invalid ID format):

```json
{
  "message": "Invalid student ID format"
}
```

Conflict (409 – duplicate):

```json
{
  "message": "Student ID already exists"
}
```

### 2.2 List students

`GET /api/students?page=1&limit=10&department=Software%20Engineering`

Expected success (200):

```json
{
  "data": [
    {
      "id": "uuid",
      "student_id": "Ugr/35126/16",
      "full_name": "Abebe Bekele",
      "department": "Software Engineering",
      "year_of_entry": 2022,
      "is_active": true
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

### 2.3 Get, update, soft-delete student

**Get** – `GET /api/students/Ugr/35126/16`

```json
{
  "student": {
    "id": "uuid",
    "student_id": "Ugr/35126/16",
    "full_name": "Abebe Bekele",
    "department": "Software Engineering",
    "year_of_entry": 2022,
    "gender": "male",
    "email": "abebe.bekele@astu.edu.et",
    "phone": "+251911111111",
    "is_active": true
  }
}
```

**Update** – `PUT /api/students/Ugr/35126/16`

Request:

```json
{
  "fullName": "Abebe B. Bekele",
  "phone": "+251922222222"
}
```

Expected success (200):

```json
{
  "student": {
    "id": "uuid",
    "student_id": "Ugr/35126/16",
    "full_name": "Abebe B. Bekele",
    "phone": "+251922222222",
    "is_active": true
  }
}
```

**Soft delete** – `DELETE /api/students/Ugr/35126/16`

Expected success (200):

```json
{
  "student": {
    "student_id": "Ugr/35126/16",
    "is_active": false
  },
  "message": "Student soft-deleted (inactive)"
}
```

---

## 3. Laptop Data & Image Uploads (MVP)

### 3.1 Laptop registration API – create laptop for student

`POST /api/students/:studentId/laptops` (admin)

Example URL: `/api/students/Ugr/35126/16/laptops`

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

Expected success (201):

```json
{
  "laptop": {
    "id": "uuid",
    "student_id": "uuid-of-student",
    "brand": "Dell",
    "model": "Latitude 5490",
    "serial_number": "SN-ABC-12345",
    "mac_address": "00:11:22:33:44:55",
    "color": "Black",
    "purchase_year": 2021,
    "notes": "Student personal laptop",
    "created_at": "2026-03-12T10:20:00.000Z"
  },
  "student": {
    "id": "uuid-of-student",
    "student_id": "Ugr/35126/16",
    "full_name": "Abebe Bekele"
  }
}
```

Validation error (400 – bad MAC):

```json
{
  "message": "Invalid MAC address format"
}
```

Conflict (409 – duplicate serial):

```json
{
  "message": "Serial number already exists"
}
```

### 3.2 List laptops for student

`GET /api/students/Ugr/35126/16/laptops`

Expected success (200):

```json
{
  "student": {
    "id": "uuid-of-student",
    "student_id": "Ugr/35126/16",
    "full_name": "Abebe Bekele"
  },
  "laptops": [
    {
      "id": "uuid",
      "brand": "Dell",
      "model": "Latitude 5490",
      "serial_number": "SN-ABC-12345",
      "color": "Black",
      "purchase_year": 2021
    }
  ]
}
```

### 3.3 Laptop images – handle uploads

**Upload images** – `POST /api/laptops/:laptopId/images` (admin)

- Content-Type: `multipart/form-data`
- Fields:
  - `images`: one or more image files (JPEG/PNG, max ~5MB each)
  - `imageType`: e.g. `"front"`, `"back"`, `"serial"`

Expected success (201):

```json
{
  "images": [
    {
      "id": "uuid",
      "laptop_id": "uuid-of-laptop",
      "image_type": "front",
      "cloudinary_public_id": "astu/laptops/Ugr-35126-16/uuid-of-laptop/front/xyz",
      "cloudinary_url": "https://res.cloudinary.com/...",
      "is_primary": true,
      "created_at": "2026-03-12T10:25:00.000Z"
    }
  ]
}
```

Missing fields (400):

```json
{
  "message": "imageType is required"
}
```

**List images** – `GET /api/laptops/:laptopId/images`

```json
{
  "images": [
    {
      "id": "uuid",
      "image_type": "front",
      "cloudinary_url": "https://res.cloudinary.com/...",
      "is_primary": true
    }
  ]
}
```

**Delete image** – `DELETE /api/laptops/:laptopId/images/:imageId`

```json
{
  "image": {
    "id": "uuid",
    "image_type": "front"
  },
  "message": "Image deleted"
}
```

---

## 4. ID Verification API (MVP) & Scan Logging

### 4.1 Scan ID (gate / IoT scanner input)

`POST /api/verification/scan` (security, admin)

Request body:

```json
{
  "studentId": "Ugr/35126/16",
  "scannerType": "qr",
  "gateLocation": "Main Gate"
}
```

#### Case A – Registered student with laptops

Expected success (200):

```json
{
  "status": "registered",
  "student": {
    "id": "uuid-of-student",
    "studentId": "Ugr/35126/16",
    "fullName": "Abebe Bekele",
    "department": "Software Engineering",
    "yearOfEntry": 2022
  },
  "laptops": [
    {
      "id": "uuid-of-laptop",
      "brand": "Dell",
      "model": "Latitude 5490",
      "serialNumber": "SN-ABC-12345",
      "macAddress": "00:11:22:33:44:55",
      "color": "Black",
      "purchaseYear": 2021,
      "notes": "Student personal laptop",
      "images": [
        {
          "id": "uuid-of-image",
          "imageType": "front",
          "url": "https://res.cloudinary.com/...",
          "isPrimary": true
        }
      ]
    }
  ],
  "source": "scan"
}
```

#### Case B – Unregistered ID

```json
{
  "status": "unregistered",
  "message": "Student ID not found",
  "studentId": "Ugr/00000/16",
  "source": "scan"
}
```

#### Case C – Student exists, no laptops

```json
{
  "status": "no_laptops",
  "message": "Student has no registered laptops",
  "student": {
    "id": "uuid-of-student",
    "studentId": "Ugr/35126/16",
    "fullName": "Abebe Bekele",
    "department": "Software Engineering",
    "yearOfEntry": 2022
  },
  "laptops": [],
  "source": "scan"
}
```

### 4.2 Manual entry

`POST /api/verification/manual` (security, admin)

Request body:

```json
{
  "studentId": "Ugr/35126/16",
  "gateLocation": "Side Gate"
}
```

Expected responses are identical to `/scan`, but with:

```json
"source": "manual"
```

### 4.3 Quick check (lightweight)

`GET /api/verification/check/Ugr/35126/16`

Registered with laptops:

```json
{
  "status": "registered",
  "student": {
    "id": "uuid-of-student",
    "studentId": "Ugr/35126/16",
    "fullName": "Abebe Bekele",
    "department": "Software Engineering",
    "yearOfEntry": 2022
  },
  "laptopCount": 1
}
```

Unregistered:

```json
{
  "status": "unregistered",
  "studentId": "Ugr/00000/16"
}
```

### 4.4 Scan logging system – verify logs

A call to `/api/verification/scan` or `/manual` automatically writes into `scan_logs`.

Admin can inspect:

`GET /api/logs/scans?status=registered&page=1&limit=10`

Expected shape:

```json
{
  "data": [
    {
      "id": "uuid-of-scan-log",
      "scanned_student_id": "Ugr/35126/16",
      "status": "registered",
      "gate_location": "Main Gate",
      "scan_type": "scan",
      "scanner_type": "qr",
      "created_at": "2026-03-12T10:30:00.000Z"
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

---

## 5. Alert Generation & Management (MVP)

Alerts are created automatically by verification:

- `status = "unregistered"` → alert type `unregistered_id`
- `status = "no_laptops"` → alert type `no_laptop`

### 5.1 List alerts

`GET /api/alerts?status=active&page=1&limit=10`

Expected success:

```json
{
  "data": [
    {
      "id": "uuid-of-alert",
      "type": "unregistered_id",
      "scanned_student_id": "Ugr/00000/16",
      "severity": "medium",
      "status": "active",
      "gate_location": "Main Gate",
      "repeat_count": 1,
      "created_at": "2026-03-12T10:31:00.000Z"
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

### 5.2 Resolve alert

`PUT /api/alerts/:alertId/resolve`

Request:

```json
{
  "notes": "Student verified with registrar, allowed to pass."
}
```

Expected success (200):

```json
{
  "alert": {
    "id": "uuid-of-alert",
    "status": "resolved",
    "resolution_notes": "Student verified with registrar, allowed to pass.",
    "resolved_by_user_id": "uuid-of-admin",
    "resolved_at": "2026-03-12T10:40:00.000Z"
  }
}
```

### 5.3 Mark false alarm

`PUT /api/alerts/:alertId/false-alarm`

Request:

```json
{
  "notes": "Scanner misread the ID."
}
```

Expected:

```json
{
  "alert": {
    "id": "uuid-of-alert",
    "status": "false_alarm",
    "resolution_notes": "Scanner misread the ID.",
    "resolved_by_user_id": "uuid-of-admin"
  }
}
```

### 5.4 Alert statistics

`GET /api/alerts/statistics`

Example success:

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

---

## 6. Summary – What to focus on when testing

For manual or automated tests of the **MVP features**:

- **Login authentication** – `POST /api/auth/login` (valid vs invalid credentials).
- **Student registration** – `POST /api/students` (valid ASTU ID vs invalid/duplicate).
- **Laptop registration** – `POST /api/students/:studentId/laptops` (valid vs bad MAC/duplicate serial).
- **ID verification** – `POST /api/verification/scan` and `/manual` (registered, unregistered, no laptops).
- **Scan logging system** – verify `/api/logs/scans` reflects each verification call.
- **Alert generation** – verify `/api/alerts` and `/api/alerts/statistics` after `unregistered` and `no_laptops` scans.

Field names and shapes above follow the current backend implementation; real responses may include extra fields (timestamps, IDs). Tests should assert on the documented keys and be tolerant of additional properties.
