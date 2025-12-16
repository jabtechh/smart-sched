# SmartSched System Architecture - AI Prompt Format

## For ERD Generation

Paste this into ChatGPT/Claude and ask: "Generate an Entity Relationship Diagram (ERD) for this database schema"

---

### Database Entities and Relationships

**System Overview:**
SmartSched is a classroom scheduling and management system with the following entities:

#### 1. USERS Entity
- **Fields:**
  - userId (Primary Key, UUID)
  - email (Unique, String) - Format: username@pateros.edu.ph
  - displayName (String)
  - role (Enum: super-admin, admin, professor) - Determines system access
  - department (String, Optional)
  - profilePhoto (URL, Optional)
  - createdAt (Timestamp)
  - updatedAt (Timestamp)
  - isActive (Boolean)

#### 2. ROOMS Entity
- **Fields:**
  - roomId (Primary Key, UUID)
  - name (String) - Example: "Lab A1"
  - building (String) - Example: "Engineering Building"
  - capacity (Integer) - Number of students
  - facilities (Array of Strings) - Example: ["projector", "whiteboard", "computer", "wifi"]
  - type (Enum: laboratory, classroom, meeting_room)
  - isActive (Boolean)
  - createdAt (Timestamp)
  - updatedBy (Foreign Key -> USERS)

#### 3. ROOM_SCHEDULES Entity
- **Fields:**
  - scheduleId (Primary Key, UUID)
  - roomId (Foreign Key -> ROOMS) - Which room
  - dayOfWeek (Integer) - 0-6 (Sunday to Saturday)
  - startTime (Time) - Format: "HH:MM" (e.g., "08:00")
  - endTime (Time) - Format: "HH:MM" (e.g., "17:00")
  - isEnabled (Boolean) - Room available on this day
  - createdAt (Timestamp)

#### 4. RESERVATIONS Entity
- **Fields:**
  - reservationId (Primary Key, UUID)
  - roomId (Foreign Key -> ROOMS) - Which room is reserved
  - professorId (Foreign Key -> USERS) - Who made the reservation
  - date (Date) - Format: YYYY-MM-DD
  - startTime (Time) - Format: "HH:MM"
  - endTime (Time) - Format: "HH:MM"
  - purpose (String) - Example: "Class Lecture", "Lab Work", "Meeting"
  - status (Enum: pending, confirmed, in_progress, completed, cancelled, expired)
  - gracePeriod (Integer) - Minutes allowed before auto-cancel (default: 15)
  - createdAt (Timestamp)
  - updatedAt (Timestamp)

#### 5. CHECK_INS Entity
- **Fields:**
  - checkInId (Primary Key, UUID)
  - reservationId (Foreign Key -> RESERVATIONS) - Links to the booking
  - professorId (Foreign Key -> USERS) - Who checked in
  - roomId (Foreign Key -> ROOMS) - Which room (denormalized for queries)
  - checkInTime (Timestamp) - When they checked in
  - checkOutTime (Timestamp, Optional) - When they left
  - method (Enum: qr_scan, manual) - How they checked in
  - qrCodeScanned (String, Optional) - QR payload
  - duration (Integer, Optional) - Minutes spent in room
  - status (Enum: active, completed)

#### 6. NOTIFICATIONS Entity (Optional)
- **Fields:**
  - notificationId (Primary Key, UUID)
  - userId (Foreign Key -> USERS)
  - type (Enum: reservation_confirmation, check_in_reminder, schedule_change, system_alert)
  - title (String)
  - message (String)
  - isRead (Boolean)
  - createdAt (Timestamp)

#### 7. AUDIT_LOGS Entity (Optional)
- **Fields:**
  - logId (Primary Key, UUID)
  - entityType (String) - Example: "RESERVATION", "ROOM", "USER"
  - entityId (UUID)
  - action (Enum: create, update, delete)
  - userId (Foreign Key -> USERS)
  - changes (JSON)
  - timestamp (Timestamp)

---

### Entity Relationships

1. **USERS (1) -----> (Many) RESERVATIONS**
   - One professor can make many reservations
   - Relationship type: One-to-Many

2. **ROOMS (1) -----> (Many) RESERVATIONS**
   - One room can be reserved many times
   - Relationship type: One-to-Many

3. **ROOMS (1) -----> (Many) ROOM_SCHEDULES**
   - One room has multiple schedule entries (one per day of week)
   - Relationship type: One-to-Many

4. **RESERVATIONS (1) -----> (Many) CHECK_INS**
   - One reservation can have one check-in record
   - Relationship type: One-to-One (typically)

5. **USERS (1) -----> (Many) CHECK_INS**
   - One professor can have many check-ins
   - Relationship type: One-to-Many

6. **USERS (1) -----> (Many) AUDIT_LOGS**
   - One user creates many audit log entries
   - Relationship type: One-to-Many

---

## For Workflow/Process Flowchart Generation

Paste this into ChatGPT/Claude and ask: "Generate a detailed flowchart for this workflow"

---

### 1. USER REGISTRATION WORKFLOW

**Starting Point:** User navigates to /register

**Process Steps:**
1. User enters username (only first part, no @domain)
2. User enters password (minimum 6 characters)
3. User confirms password
4. System appends @pateros.edu.ph domain automatically
5. System validates email uniqueness in USERS table
6. System validates password strength
7. **Decision Point:** All validations pass?
   - YES → Continue to Step 8
   - NO → Display error message, return to Step 2
8. System creates new USERS record with:
   - email: username@pateros.edu.ph
   - displayName: from input
   - role: "professor" (default)
   - isActive: true
   - createdAt: current timestamp
9. System sends confirmation email
10. Redirect to Login page with success message
**End Point:** Registration complete

---

### 2. USER LOGIN WORKFLOW

**Starting Point:** User navigates to /login

**Process Steps:**
1. User enters username (first part only)
2. User enters password
3. System appends @pateros.edu.ph domain
4. System queries USERS table for matching email
5. **Decision Point:** Email found and user isActive = true?
   - NO → Return error "Invalid credentials", go to Step 1
   - YES → Continue to Step 6
6. System verifies password using Firebase Auth
7. **Decision Point:** Password correct?
   - NO → Return error "Invalid credentials", go to Step 1
   - YES → Continue to Step 8
8. System retrieves user's role from USERS record
9. System creates session/JWT token
10. **Decision Point:** User role?
    - admin/super-admin → Redirect to /admin/rooms
    - professor → Redirect to /prof/today
11. Store user session and role in localStorage
**End Point:** User logged in and redirected

---

### 3. ROOM RESERVATION WORKFLOW

**Starting Point:** Professor clicks "Create Reservation" on /prof/reservations

**Process Steps:**
1. Display list of all active ROOMS (isActive = true)
2. Professor selects a room
3. System displays room details (capacity, facilities, description)
4. Professor selects date (future date only, not past)
5. Professor selects start time and end time
6. System displays the room's ROOM_SCHEDULES for that day
7. **Decision Point:** Selected time within room's available hours?
   - NO → Display error "Room not available during selected time", return to Step 4
   - YES → Continue to Step 8
8. System queries RESERVATIONS for conflicts:
   - Check if any RESERVATION exists for this roomId on this date with overlapping time
9. **Decision Point:** Any conflicting reservations?
   - YES → Display error "Room already booked", return to Step 4
   - NO → Continue to Step 10
10. Professor enters reservation purpose/description
11. Professor reviews all details:
    - Room name and location
    - Date and time range
    - Duration
    - Capacity and facilities
12. Professor clicks "Confirm Reservation"
13. System creates new RESERVATIONS record with:
    - roomId: selected room
    - professorId: current user
    - date: selected date
    - startTime: selected start time
    - endTime: selected end time
    - purpose: entered purpose
    - status: "confirmed"
    - gracePeriod: 15 minutes
    - createdAt: current timestamp
14. System calculates duration = endTime - startTime
15. **Decision Point:** Grace period enabled?
    - YES → Set auto-cancel time = startTime + 15 minutes
    - NO → No auto-cancel
16. System sends confirmation email/notification to professor
17. System creates AUDIT_LOG entry:
    - action: "create"
    - entityType: "RESERVATION"
    - userId: current professor
18. Display success message: "Reservation confirmed!"
19. Redirect to /prof/reservations showing new booking
**End Point:** Reservation created

---

### 4. QR CODE GENERATION WORKFLOW (Admin)

**Starting Point:** Admin clicks "Generate QR Codes" on /admin/rooms/qr

**Process Steps:**
1. Admin selects a room from active ROOMS list
2. System retrieves roomId for selected room
3. System generates QR code data in format: "room-{roomId}"
4. System encodes QR code as PNG image
5. System creates printable PDF with:
   - QR code image
   - Room name
   - Room location
   - Room capacity
   - Room facilities
6. Admin can:
   - Download single QR code PDF
   - Download all room QR codes as ZIP
   - Print directly
7. Admin can customize:
   - QR size (small, medium, large)
   - Print layout (single per page, 4 per page, etc.)
8. System generates downloadable file
9. **Decision Point:** Download or Print?
   - Download → File saved to device downloads
   - Print → Open print dialog
10. Admin prints/downloads QR codes
11. Admin posts QR codes in corresponding physical rooms
**End Point:** QR codes generated and distributed

---

### 5. CHECK-IN WORKFLOW (QR Scan)

**Starting Point:** Professor navigates to /prof/check-in during class time

**Workflow Steps:**

**Part A: Before Check-In**
1. System displays professor's TODAY's reservations
2. For each reservation, display:
   - Room name
   - Time slot
   - Check-in status (pending/completed)
3. System checks if reservation startTime <= now
4. **Decision Point:** Is it time to check in?
   - NO → Display "Check-in available at {startTime}"
   - YES → Enable check-in button
5. Professor clicks "Scan QR Code"

**Part B: QR Scanning**
6. Browser requests camera permission
7. **Decision Point:** Permission granted?
   - NO → Display error "Camera permission denied"
   - YES → Continue to Step 8
8. System activates live camera feed
9. System initializes QR code scanner
10. Scanner continuously scans for QR codes in view
11. **Decision Point:** QR code detected?
    - NO → Continue scanning, show indicator
    - YES → Continue to Step 12
12. System extracts QR payload: "room-{roomId}"
13. **Decision Point:** Format valid (starts with "room-")?
    - NO → Display error "Invalid QR code", go to Step 10
    - YES → Continue to Step 14
14. Extract roomId from payload

**Part C: Validation**
15. System queries RESERVATIONS matching:
    - professorId = current user
    - roomId = from QR code
    - date = today
    - status = "confirmed"
    - startTime <= now <= endTime + gracePeriod
16. **Decision Point:** Matching reservation found?
    - NO → Display error "No active reservation for this room", go to Step 10
    - YES → Continue to Step 17
17. System checks if CHECK_IN already exists for this reservation
18. **Decision Point:** Already checked in?
    - YES → Display "Already checked in at {checkInTime}"
    - NO → Continue to Step 19
19. **Decision Point:** Grace period expired?
    - YES → Display warning "Late check-in (grace period expired)"
    - NO → Display "On time"

**Part D: Check-In Recording**
20. System creates new CHECK_INS record with:
    - checkInId: new UUID
    - reservationId: from matched reservation
    - professorId: current user
    - roomId: from QR code
    - checkInTime: current timestamp
    - method: "qr_scan"
    - qrCodeScanned: the QR payload
    - status: "active"
21. System updates RESERVATION status: "in_progress"
22. System creates AUDIT_LOG:
    - action: "check_in"
    - entityType: "RESERVATION"
    - userId: current professor
23. System plays success beep/sound
24. Display success message: "Checked in successfully!"
25. Display confirmation:
    - Room name
    - Check-in time
    - Expected end time
26. Professor can close check-in screen or return to today's view

**Part E: Manual Check-In (Alternative)**
27. **Alternative to QR:** If QR scan fails after 30 seconds
28. Display "Manual Check-In" option
29. Professor can select room from dropdown list
30. System validates and checks in using manual method
31. Record method = "manual" instead of "qr_scan"
**End Point:** Check-in recorded in system

---

### 6. CHECK-OUT WORKFLOW

**Starting Point:** End of class time

**Process Steps:**
1. Professor manually clicks "Check Out" (typically)
   OR
2. System automatically checks out at reservation endTime + 5 minutes
3. System retrieves active CHECK_INS record for professor in current room
4. **Decision Point:** Active check-in found?
   - NO → Display error "No active check-in"
   - YES → Continue to Step 5
5. System calculates duration:
   - duration = checkOutTime - checkInTime (in minutes)
6. System updates CHECK_INS record:
   - checkOutTime: current timestamp
   - duration: calculated minutes
   - status: "completed"
7. System updates RESERVATIONS status: "completed"
8. System creates AUDIT_LOG for check-out
9. Display checkout confirmation with duration
**End Point:** Check-out recorded

---

### 7. ADMIN REPORTING WORKFLOW

**Starting Point:** Admin navigates to /admin/reports

**Process Steps:**
1. Display report options:
   - Reservation Analytics
   - Check-in Analytics
   - Room Utilization
   - User Activity

**For Reservation Analytics:**
2. Admin selects date range (start date, end date)
3. Admin optionally selects room filter
4. Admin optionally selects professor filter
5. System queries RESERVATIONS table with filters:
   - date BETWEEN startDate AND endDate
   - Match filters if selected
6. System aggregates data:
   - Total reservations
   - Completed vs. cancelled count
   - Most booked rooms
   - Peak reservation hours
   - Average duration
7. **Decision Point:** Room filter selected?
   - YES → Show room-specific stats
   - NO → Show all rooms
8. System generates charts and visualizations
9. Display in dashboard format
10. Admin can:
    - Download as PDF
    - Download as CSV
    - Print report
11. System generates file and initiates download
**End Point:** Report generated and exported

---

### 8. GRACE PERIOD & AUTO-CANCEL WORKFLOW

**Starting Point:** Background scheduler runs every minute

**Process Steps:**
1. System queries RESERVATIONS where:
   - status = "confirmed"
   - date = today
   - startTime = now - 15 minutes
   - (reservation is 15 minutes old, no check-in)
2. **Decision Point:** Any such reservations found?
   - NO → Continue waiting, exit
   - YES → Continue to Step 3
3. System queries CHECK_INS for this reservation
4. **Decision Point:** Check-in exists?
   - YES → Reservation valid, do nothing
   - NO → Continue to Step 5
5. System cancels reservation:
   - Set status = "expired"
   - Set updatedAt = current timestamp
6. System creates notification for professor:
   - "Reservation auto-cancelled due to no check-in within grace period"
7. System sends email to professor
8. System creates AUDIT_LOG:
   - action: "auto_cancel"
   - reason: "grace_period_expired"
9. Freeing up the room slot for others
**End Point:** Auto-cancel completed

---

### 9. RESERVATION CANCELLATION WORKFLOW (Manual)

**Starting Point:** Professor clicks "Cancel Reservation" on /prof/reservations

**Process Steps:**
1. System displays active/upcoming reservations
2. Professor selects a reservation to cancel
3. System displays cancellation confirmation dialog:
   - "Are you sure? This action cannot be undone."
   - Shows room name, date, time
4. **Decision Point:** Confirmed?
   - NO → Cancel dialog, stay on page
   - YES → Continue to Step 5
5. **Decision Point:** Is reservation already in progress (status = "in_progress")?
   - YES → Display error "Cannot cancel ongoing reservation"
   - NO → Continue to Step 6
6. System updates RESERVATION:
   - status = "cancelled"
   - updatedAt = current timestamp
7. System sends notification to professor
8. System sends notification to admin
9. System creates AUDIT_LOG:
   - action: "cancel"
   - userId: professor
   - reason: "user_initiated"
10. Display success: "Reservation cancelled"
11. Redirect to updated reservations list
**End Point:** Reservation cancelled

---

### 10. PROFESSOR PROFILE & SETTINGS WORKFLOW

**Starting Point:** Professor clicks profile/settings

**Process Steps:**
1. Display professor's profile information:
   - Display name
   - Email
   - Department
   - Profile photo
   - Account created date
   - Last login date
2. Professor can:
   - View past reservations
   - View check-in history
   - Download personal reports
   - Change password
   - Logout
3. **Decision Point:** What action?
   - View history → Display past data
   - Change password → Trigger password reset
   - Logout → Clear session and redirect
**End Point:** Action completed

---

### 11. SUPER ADMIN USER MANAGEMENT WORKFLOW

**Starting Point:** Super Admin navigates to /admin/users

**Process Steps:**
1. Display list of all USERS in system
2. Super Admin can:
   - Filter by role (admin, professor)
   - Filter by department
   - Search by name/email
   - Sort by created date
3. Super Admin selects a user
4. Display user details:
   - Email
   - Display name
   - Current role
   - Department
   - Account status (active/inactive)
   - Created date
5. Super Admin can:
   - Change role (admin ← → professor)
   - Activate/deactivate user
   - Reset user password
   - Delete user account
6. **Decision Point:** What action?
   - Change role → Update USERS.role
   - Activate/deactivate → Toggle USERS.isActive
   - Reset password → Send password reset email
   - Delete → Remove USERS record and related data
7. System creates AUDIT_LOG for action
8. Send notification to affected user (if applicable)
9. Display confirmation message
**End Point:** User management action completed

---

### 12. REAL-TIME SYNC WORKFLOW

**Starting Point:** User has app open in background

**Process Steps:**
1. Firebase Firestore listeners attached to collections:
   - RESERVATIONS
   - CHECK_INS
   - ROOMS
2. **Decision Point:** Data change in Firestore?
   - NO → Continue listening
   - YES → Continue to Step 3
3. Firestore emits real-time update event
4. React context updates state immediately
5. UI re-renders with new data
6. **Decision Point:** Is user on /prof/reservations page?
   - YES → Update reservation list in real-time
   - NO → Store in cache
7. **Decision Point:** Is user on /admin/rooms page?
   - YES → Update room list in real-time
   - NO → Store in cache
8. System compares old vs. new data
9. **Decision Point:** Any conflicts?
   - YES → Show sync warning/merge options
   - NO → Continue to Step 10
10. Display toast notification if critical change (e.g., reservation cancelled)
**End Point:** Real-time sync complete

---

## For Database Schema Generation

Paste this into ChatGPT/Claude and ask: "Generate SQL CREATE TABLE statements for this database schema"

---

### Create Table Statements (Firestore Collections)

**Collection: users**
```
Document structure:
- userId (document ID)
- email: string
- displayName: string
- role: enum(super-admin, admin, professor)
- department: string
- profilePhoto: string (URL)
- createdAt: timestamp
- updatedAt: timestamp
- isActive: boolean
```

**Collection: rooms**
```
Document structure:
- roomId (document ID)
- name: string
- building: string
- capacity: integer
- facilities: array(string)
- type: enum(laboratory, classroom, meeting_room)
- isActive: boolean
- createdAt: timestamp
- createdBy: reference(users)
- updatedAt: timestamp
- updatedBy: reference(users)
```

**Collection: roomSchedules**
```
Document structure:
- scheduleId (document ID)
- roomId: reference(rooms)
- dayOfWeek: integer (0-6)
- startTime: string (HH:MM)
- endTime: string (HH:MM)
- isEnabled: boolean
- createdAt: timestamp
```

**Collection: reservations**
```
Document structure:
- reservationId (document ID)
- roomId: reference(rooms)
- professorId: reference(users)
- date: string (YYYY-MM-DD)
- startTime: string (HH:MM)
- endTime: string (HH:MM)
- purpose: string
- status: enum(pending, confirmed, in_progress, completed, cancelled, expired)
- gracePeriod: integer (minutes)
- createdAt: timestamp
- updatedAt: timestamp
- cancelledAt: timestamp (optional)
- cancelReason: string (optional)
```

**Collection: checkIns**
```
Document structure:
- checkInId (document ID)
- reservationId: reference(reservations)
- professorId: reference(users)
- roomId: reference(rooms)
- checkInTime: timestamp
- checkOutTime: timestamp (optional)
- method: enum(qr_scan, manual)
- qrCodeScanned: string (optional)
- duration: integer (minutes, optional)
- status: enum(active, completed)
- createdAt: timestamp
```

**Collection: notifications (optional)**
```
Document structure:
- notificationId (document ID)
- userId: reference(users)
- type: enum(reservation_confirmation, check_in_reminder, schedule_change, system_alert)
- title: string
- message: string
- isRead: boolean
- link: string (optional, URL to navigate to)
- createdAt: timestamp
```

**Collection: auditLogs (optional)**
```
Document structure:
- logId (document ID)
- entityType: string
- entityId: string
- action: enum(create, update, delete, check_in, cancel)
- userId: reference(users)
- changes: object (JSON with before/after values)
- timestamp: timestamp
```

---

### Indexes Required (Firestore)

For optimal query performance, create these composite indexes:

1. **reservations collection:**
   - Index 1: (roomId, date, startTime)
   - Index 2: (professorId, date, status)
   - Index 3: (date, status) with status DESC

2. **checkIns collection:**
   - Index 1: (reservationId, checkInTime)
   - Index 2: (professorId, checkInTime) DESC

3. **roomSchedules collection:**
   - Index 1: (roomId, dayOfWeek)

4. **users collection:**
   - Index 1: (role, isActive)

---

**End of System Description**

This document is optimized for pasting into AI chat systems for diagram generation.
