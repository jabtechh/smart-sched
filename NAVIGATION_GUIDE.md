# Smart-Sched - Complete Navigation Guide

## 🌐 Base URL
```
http://localhost:3000/
```

---

## 📍 Navigation Map

### Public Routes
| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Home/Redirect | No |
| `/login` | User Login | No |
| `/register` | New User Registration | No |

---

### 👨‍💼 Super Admin Routes (`/admin/...`)
**Required Role:** `super-admin`  
**Test Account:** `superadmin@gmail.com` or `superadmin@pateros.edu.ph`  
**Password:** `password123`

| Route | Feature | Purpose |
|-------|---------|---------|
| `/admin/users` | User Management | Create, edit, assign roles to all users |
| `/admin/rooms` | Room Management | Manage all rooms in system |
| `/admin/reports` | Facility Reports | View analytics across entire facility |

---

### 🏫 Admin Routes (`/admin/...`)
**Required Role:** `admin`  
**Test Account:** `adminone@pateros.edu.ph`  
**Password:** `password123`

| Route | Feature | Purpose |
|-------|---------|---------|
| `/admin/professors` | Professor Management | Manage professors and assign admin roles |
| `/admin/rooms` | Room Management | Manage assigned rooms |
| `/admin/reports` | Facility Reports | View facility analytics (same as reports) |

---

### 👨‍🏫 Professor Routes (`/prof/...`)
**Required Role:** `professor`  
**Test Account:** `profjohndoe@pateros.edu.ph`  
**Password:** `password123`

| Route | Feature | Purpose |
|-------|---------|---------|
| `/prof/scan` | QR Scanner | Scan room QR codes to check in |
| `/prof/today` | Today's Check-ins | View today's checked-in rooms |
| `/prof/reservations` | Room Reservations | Book and manage room reservations |
| `/prof/reports` | Personal Reports | View personal check-ins and reservations |

---

## 🔑 Test User Credentials

### Super Admins (Full System Access)
```
Email:    superadmin@gmail.com
Password: password123
Role:     super-admin

Email:    superadmin@pateros.edu.ph
Password: password123
Role:     super-admin
```

### Admin (Facility Management)
```
Email:    adminone@pateros.edu.ph
Password: password123
Role:     admin
```

### Professor (Faculty Member)
```
Email:    profjohndoe@pateros.edu.ph
Password: password123
Role:     professor
```

---

## 📊 Reports Feature Details

### Admin/Super-Admin Reports
**URL:** `http://localhost:3000/admin/reports`

**Available Report Types:**
1. **📅 Reservation Dashboard**
   - Total bookings
   - Active rooms
   - Upcoming reservations
   - Completed reservations
   - Recent bookings table

2. **✓ Check-in Analytics**
   - Total check-ins
   - Unique users
   - Average duration
   - Most used room
   - Recent check-ins detail

3. **🏢 Room Utilization**
   - Overall utilization %
   - Room-by-room breakdown
   - Hours tracked
   - Last used dates
   - Color-coded efficiency

**Filtering Options:**
- 📆 Date range (custom or presets: Today, 7 Days, 30 Days)
- 🏛️ Room selection (multi-select or all)
- ⬇️ Export to PDF

### Professor Reports
**URL:** `http://localhost:3000/prof/reports`

**Available Sections:**
1. **My Reservations** - Personal room bookings
2. **My Check-ins** - Personal check-in history

**Filtering:**
- 📆 Date range filtering
- ⬇️ Export to PDF

---

## 🔐 Role Hierarchy & Permissions

```
Super Admin
├── Can manage all users (admins, professors)
├── Can assign any role
├── Can view all facility reports
├── Can manage all rooms
└── Can archive/restore users

Admin
├── Can manage professors (not other admins)
├── Can make professors into admins
├── Can view facility reports
├── Can manage assigned rooms
└── Can archive/restore professors

Professor
├── Can make room reservations
├── Can check in/out with QR
├── Can view only their own reports
└── Can see their check-in history
```

---

## 🎯 Quick Navigation Scenarios

### I want to check a professor's reservations
1. Login as `adminone@pateros.edu.ph`
2. Go to `/admin/reports`
3. Select "Reservation Dashboard"
4. View all professor reservations

### I want to see which rooms are underutilized
1. Login as super admin
2. Go to `/admin/reports`
3. Click "Room Utilization" tab
4. Look at % column (red = underutilized)

### I want to track attendance
1. Login as admin
2. Go to `/admin/reports`
3. Click "Check-in Analytics" tab
4. See who checked in and when

### As a professor, I need my check-in history
1. Login as `profjohndoe@pateros.edu.ph`
2. Go to `/prof/reports`
3. Click "My Check-ins" tab
4. Export as PDF if needed

### I need to give someone admin access
1. Login as `superadmin@gmail.com`
2. Go to `/admin/users`
3. Find the user
4. Click to change role to "admin"

---

## 🔄 Data Flow

```
Login Page (/login)
    ↓
Authentication (Firebase Auth)
    ↓
Role Check (Firestore - users collection)
    ↓
Conditional Redirect:
    ├→ super-admin  → /admin/rooms
    ├→ admin        → /admin/rooms
    └→ professor    → /prof/today
    
From Sidebar Navigation:
├── Super Admin: Users → Rooms → Reports
├── Admin:       Professors → Rooms → Reports
└── Professor:   Scan → Today → Reservations → Reports
```

---

## 🚨 Common Issues & Solutions

### "Page Not Found"
- Ensure you're logged in (check `/login` page)
- Check the full URL path (case-sensitive)
- Clear browser cache if CSS/JS not loading

### "Access Denied" / "Unauthorized"
- Your account doesn't have required role
- Check user role: go to `/admin/users` as super-admin
- Test with appropriate test account above

### Reports show no data
- Try extending date range (presets: Last 30 Days)
- Ensure test data was initialized: `npm run init-test-data`
- Check filters aren't too restrictive

### PDF export not working
- Check browser console (F12)
- Ensure pop-ups aren't blocked
- Try different browser
- Check internet connection

---

## 📱 Mobile Access

All routes work on mobile browsers:
- Portrait/landscape responsive
- Touch-friendly buttons
- Scrollable tables
- Mobile-optimized navigation

**Test on mobile:**
```
Local URL: http://192.168.1.2:3000/
(Replace with your actual IP address)
```

---

## 🔧 Developer Notes

### Folder Structure
```
src/
├── components/
│   ├── layout/          (Navigation, sidebar)
│   ├── qr/              (QR scanning)
│   ├── rooms/           (Room components)
│   └── reports/         (Report components)
├── pages/
│   ├── admin/           (Admin pages)
│   ├── professor/       (Professor pages)
│   └── *.tsx            (Public pages)
├── contexts/            (Auth context)
├── config/              (Firebase config)
├── types/               (TypeScript types)
└── utils/               (Utilities, PDF export)
```

### Key Files to Know
- `src/contexts/AuthContext.tsx` - Authentication logic
- `src/pages/admin/ReportsPage.tsx` - Admin reports
- `src/pages/professor/ReportsPage.tsx` - Professor reports
- `src/components/reports/` - Report components

---

## 🎓 Learning Resources

For developers working with this codebase:
1. **REPORTS_IMPLEMENTATION.md** - Technical details of reports feature
2. **REPORTS_QUICK_START.md** - User guide for reports
3. **README.md** - Project overview
4. **DEPLOYMENT.md** - Deployment instructions

---

**Last Updated:** December 16, 2025  
**Server Status:** ✅ Running on http://localhost:3000/  
**Build Status:** ✅ All features compiled successfully
