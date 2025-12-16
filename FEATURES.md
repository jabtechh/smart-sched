# SmartSched Features Documentation

Complete feature reference and usage guide for SmartSched application.

## 📚 Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Admin Features](#admin-features)
3. [Professor Features](#professor-features)
4. [Shared Features](#shared-features)
5. [PWA & Mobile Features](#pwa--mobile-features)
6. [Technical Features](#technical-features)

---

## 🔐 Authentication & Authorization

### Login System

**Access Point:** `/login`

**Features:**
- Email-based authentication
- Auto-appended domain (`@pateros.edu.ph`)
- Password reset via email
- Remember me functionality
- Dual logo display (School + App)

**Login Flow:**
1. User enters username (e.g., `john`)
2. Domain auto-appends: `john@pateros.edu.ph`
3. Firebase authenticates credentials
4. User role fetched from Firestore
5. Redirected to appropriate dashboard

### Registration

**Access Point:** `/register`

**Features:**
- Self-service registration
- Email validation
- Password strength requirements (6+ chars)
- Display name requirement
- Email domain verification

**Registration Requirements:**
- Unique email address
- Strong password (minimum 6 characters)
- Display name (real name)
- Cannot manually type @pateros.edu.ph

### User Roles & Permissions

#### Super Admin
- **Dashboard Access:** `/admin/users`
- **Capabilities:**
  - ✅ Manage all users
  - ✅ Assign/modify user roles
  - ✅ System administration
  - ✅ View all system reports
  - ✅ Manage administrators

#### Admin
- **Dashboard Access:** `/admin/rooms`
- **Capabilities:**
  - ✅ Create/edit/delete rooms
  - ✅ Manage professors
  - ✅ View all reservations
  - ✅ Generate QR codes
  - ✅ Access department reports
  - ✅ View analytics

#### Professor
- **Dashboard Access:** `/prof/today`
- **Capabilities:**
  - ✅ Book rooms (reservations)
  - ✅ Scan QR codes (check-in)
  - ✅ View personal schedule
  - ✅ Manage own reservations
  - ✅ View personal reports

---

## 🏢 Admin Features

### Room Management (`/admin/rooms`)

**Create Room:**
- Room name (e.g., "Lab A1")
- Building/Location
- Capacity (number of students)
- Facilities (checkboxes)
- Room type classification

**Edit Room:**
- Modify all room properties
- Enable/disable room
- Update capacity
- Change facilities

**Delete Room:**
- Permanent deletion
- Cascades to schedules
- Preserves reservation history

**Room Fields:**
```json
{
  "name": "Lab A1",
  "building": "Engineering Building",
  "capacity": 30,
  "facilities": ["projector", "whiteboard", "computer"],
  "type": "laboratory|classroom|meeting_room",
  "active": true
}
```

### Schedule Management

**Set Room Availability:**
- Day of week selection
- Start time (08:00)
- End time (17:00)
- Recurring availability
- Special closures/holidays

**Schedule Validation:**
- Reservations checked against schedules
- Prevents booking during closed hours
- Weekend/holiday handling

### QR Code Generation (`/admin/rooms/qr`)

**Generate QR Codes:**
- Generate for single room
- Download as PNG
- Batch download all room codes
- QR format: `room-<roomId>`

**Features:**
- Print-friendly format
- Custom sizing options
- Room identification included
- Multiple download formats

### Professor Management (`/admin/professors`)

**List Professors:**
- Search by name/email
- Filter by department
- Sort by status

**Manage Access:**
- Activate/deactivate accounts
- Reset passwords
- Modify department assignment
- View activity logs

### Analytics & Reports (`/admin/reports`)

**Reservation Analytics:**
- Total reservations (period)
- Average reservations per room
- Booking trends over time
- Peak booking hours
- Most reserved rooms

**Check-in Analytics:**
- Check-in rates
- Attendance statistics
- Reservation vs actual usage
- Utilization patterns

**Room Utilization:**
- Usage by room
- Occupancy rates
- Underutilized spaces
- Capacity planning data

**Filters:**
- Date range selection
- Room filtering
- Department filtering
- Time range filtering
- Export to PDF/CSV

---

## 👨‍🏫 Professor Features

### Today's Schedule (`/prof/today`)

**Display:**
- Today's reservations
- Check-in status for each
- Time remaining
- Room details

**Quick Actions:**
- Check in with QR scan button
- View reservation details
- Cancel if needed
- Extend duration (if available)

**Color Coding:**
- 🟢 Green: Checked in
- 🟡 Yellow: Upcoming (30 min)
- 🔴 Red: Starting soon (5 min)
- ⚪ Gray: Past reservations

### Room Reservations (`/prof/reservations`)

**Create Reservation:**
1. Select room from available list
2. Choose date and time
3. Set duration
4. Add class/purpose
5. Confirm booking

**Reservation Details:**
- Room name and location
- Date and time range
- Capacity information
- Available facilities
- Confirmation status

**Modify Reservation:**
- Change date/time (if not started)
- Extend duration (if no conflicts)
- Change room (if available)
- Add notes/updates
- Cancel reservation

**Cancel Reservation:**
- Online cancellation
- Shows cancellation reason options
- Frees up room slot
- Notification sent

**Reservation Status:**
- `pending` - Awaiting confirmation
- `confirmed` - Approved
- `in_progress` - Currently checking in
- `completed` - Finished
- `cancelled` - User cancelled
- `expired` - Automatic expiry

### Check-In with QR Scanner (`/prof/check-in`)

**Scan QR Code:**
1. Click "Scan QR Code" button
2. Allow camera permission
3. Point at room's QR code
4. Automatic check-in on successful scan

**Manual Check-In:**
- Fallback if QR unavailable
- Select room from list
- Confirm check-in
- Timestamp recorded

**Check-In Details Recorded:**
- Timestamp (exact time)
- Professor ID
- Room ID
- Scan method (QR/manual)
- Duration in room

### Scan QR Page (`/prof/scan`)

**Features:**
- Live camera feed
- QR detection indicators
- Beep on successful scan
- Error messaging
- Retry functionality

**QR Format:**
- Expected format: `room-<roomId>`
- Validation checks
- Grace period for processing

### Personal Reports (`/prof/reports`)

**Available Reports:**

1. **Check-in History**
   - All check-ins (date range)
   - Time spent per class
   - Attendance summary
   - Export to PDF

2. **Reservation Summary**
   - Total bookings
   - Used vs. cancelled
   - Favorite rooms
   - Peak booking times

3. **Activity Report**
   - Monthly activity
   - Booking trends
   - Cancellation reasons
   - Peak hours analysis

**Report Features:**
- Date range filtering
- Export to PDF
- Print-friendly format
- Data visualization (charts)
- Download as CSV

---

## 📱 Shared Features

### Responsive Design

**Mobile (< 640px):**
- Full-width layouts
- Stacked navigation
- Bottom sheet dialogs
- Touch-optimized buttons
- Collapsible sections

**Tablet (640px - 1024px):**
- Two-column layouts
- Side drawer navigation
- Optimized form fields
- Tab-based navigation

**Desktop (> 1024px):**
- Sidebar navigation
- Multi-column layouts
- Advanced filtering
- Keyboard shortcuts

### Notifications

**Toast Notifications:**
- Success confirmations
- Error messages
- Warning alerts
- Info messages

**Types:**
- ✅ Success (green)
- ❌ Error (red)
- ⚠️ Warning (yellow)
- ℹ️ Info (blue)

### Real-Time Updates

**Live Features:**
- Room availability updates
- Reservation status changes
- Check-in confirmations
- User activity feeds

**Sync Method:**
- Firebase Firestore listeners
- Real-time updates
- Automatic refresh
- Conflict resolution

### Search & Filtering

**Room Search:**
- Search by name/building
- Filter by capacity
- Filter by facilities
- Sort by availability

**Reservation Search:**
- Filter by date range
- Filter by room
- Filter by status
- Sort by various fields

**User Search:**
- Search by name/email
- Filter by role
- Filter by department
- Sort by status

---

## 🌐 PWA & Mobile Features

### Installation Options

**Web Installation:**
1. Visit web app
2. Browser shows install prompt
3. Click "Install"
4. App on home screen

**APK Installation (Android):**
1. Generate APK via PWA Builder
2. Download to Android device
3. Install via file manager
4. Appears as native app

### Offline Support

**Available Offline:**
- ✅ View previously loaded data
- ✅ Read reservations
- ✅ Browse room list
- ✅ Access settings

**Syncs When Online:**
- ✅ Submits pending changes
- ✅ Downloads new data
- ✅ Updates last sync time
- ✅ Resolves conflicts

### App Features

**Quick Actions:**
- Shortcuts to key features
- Fast app access
- Desktop integration
- Notification support

**Splash Screen:**
- Branded loading screen
- Animated dual logos
- Professional appearance
- Custom themes

**Progressive Enhancement:**
- Works without JavaScript (fallback)
- Graceful degradation
- Progressive feature loading
- Offline-first strategy

---

## 🔧 Technical Features

### Performance Optimizations

**Code Splitting:**
- Lazy-loaded pages
- Route-based chunking
- Reduced initial bundle
- Faster first load

**Caching Strategy:**
- Service worker caching
- API response caching
- Image caching
- Asset versioning

**Bundle Optimization:**
- Tree shaking
- Minification
- CSS purging
- Asset compression

### Data Management

**Firestore Collections:**
- Normalized data structure
- Indexed queries
- Referential integrity
- Timestamp tracking

**Context API:**
- Global state management
- Auth state
- User data
- Room/reservation data

### Security

**Authentication:**
- Firebase Auth
- Email/password auth
- Session management
- Automatic logout

**Authorization:**
- Role-based access control (RBAC)
- Document-level security
- Collection-level rules
- Field-level permissions

**Data Protection:**
- Firestore security rules
- Data validation
- SQL injection prevention
- XSS protection

### Accessibility

**WCAG Compliance:**
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

**Usability:**
- Clear error messages
- Form validation
- Help text
- Tooltips

---

## 🎨 UI/UX Features

### Branding

**Logos:**
- School logo (PTC)
- App logo (SmartSched)
- Dual logo on login/register
- Stacked logos on loading screen

**Colors:**
- Primary: Green (#297A20)
- Secondary: Various grays
- Accent: Blue
- Status colors

**Typography:**
- Clear hierarchy
- Readable fonts
- Consistent sizing
- Line spacing

### User Experience

**Loading States:**
- Skeleton screens
- Loading spinners
- Progress indicators
- Animated splash screen

**Feedback:**
- Toast notifications
- Inline validation
- Error boundaries
- Loading states

**Accessibility:**
- Keyboard navigation
- Focus management
- ARIA attributes
- High contrast support

---

## 🔗 Feature Integration

### QR Code Workflow

```
1. Admin generates QR code
   ↓
2. QR code printed/displayed
   ↓
3. Professor opens scanner
   ↓
4. Scans QR in room
   ↓
5. Check-in recorded
   ↓
6. Attendance confirmed
```

### Reservation Workflow

```
1. Professor creates reservation
   ↓
2. System validates availability
   ↓
3. Checks schedule
   ↓
4. Reservation confirmed
   ↓
5. Admin notified
   ↓
6. Professor can check in
```

### Report Generation

```
1. Admin selects date range
   ↓
2. Applies filters
   ↓
3. System aggregates data
   ↓
4. Generates analytics
   ↓
5. Export to PDF/CSV
   ↓
6. Download initiated
```

---

Last Updated: December 16, 2025
