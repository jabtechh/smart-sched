# SmartSched 📚

A **mobile-first Progressive Web App (PWA)** for smart classroom scheduling and room management, built with React, TypeScript, Vite, and Firebase.

[![Deploy to Firebase](https://github.com/jabtechh/smart-sched/actions/workflows/deploy.yml/badge.svg)](https://github.com/jabtechh/smart-sched/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-blue)](https://smart-sched-ochre.vercel.app)

## 🚀 Features

### Core Functionality
- 📱 **Mobile-First PWA** - Installable on iOS and Android with offline support
- 🔐 **Role-Based Access Control** - Super Admin, Admin, and Professor roles with granular permissions
- 📅 **Room Scheduling** - Create, manage, and reserve classroom spaces
- 📷 **QR Code System** - Generate and scan QR codes for attendance check-ins
- ⏰ **Real-Time Updates** - Firebase Firestore for live data synchronization
- 📊 **Analytics & Reports** - Comprehensive reporting dashboards for utilization and bookings
- 🌐 **Serverless Backend** - Firebase Cloud Functions for scalable business logic

### UI/UX Features
- 🎨 **Modern, Responsive Design** - Tailwind CSS with mobile-first approach
- 🎭 **Professional Branding** - Dual logo system (School + App) on login/register
- ⚡ **Loading Screen** - Animated splash screen with stacked logos
- 🔄 **Real-Time Notifications** - Toast notifications for user actions
- 🌓 **Theme Support** - Consistent color scheme with green primary color (#297A20)
- ♿ **Accessible** - WCAG compliant with proper keyboard navigation

### PWA Capabilities
- 📦 **Installable** on mobile home screen and desktop
- 🔌 **Offline Support** - Service worker with multiple caching strategies
- 🚀 **Fast Loading** - Optimized bundle with lazy loading
- 📱 **Standalone Mode** - Full-screen app experience without browser UI
- 🎯 **App Shortcuts** - Quick access to key features

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.6.0
- **Build Tool**: Vite 7.3.0
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: Headless UI, Hero Icons
- **PDF Export**: jsPDF + html2canvas

### Backend & Services
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Serverless**: Firebase Cloud Functions (Node 18)
- **Deployment**: Vercel (Frontend), Firebase (Functions)
- **Region**: Asia Southeast (asia-southeast1)
- **Timezone**: Asia/Manila (UTC+8)

### Development
- **Linting**: ESLint
- **Code Format**: Prettier
- **Version Control**: Git & GitHub
- **CI/CD**: GitHub Actions
- **PWA**: Vite PWA Plugin, Service Workers

## 📦 Project Structure

```
smart-sched/
├── src/
│   ├── components/
│   │   ├── layout/          # Header, sidebar, layout components
│   │   ├── qr/              # QR scanner and generator
│   │   ├── reports/         # Analytics and reporting components
│   │   └── rooms/           # Room management components
│   ├── contexts/
│   │   ├── AuthContext.tsx  # Authentication state management
│   │   └── RoomContext.tsx  # Room and reservation data access
│   ├── pages/
│   │   ├── LoginPage.tsx    # Dual logo login
│   │   ├── RegisterPage.tsx # Dual logo registration
│   │   ├── admin/           # Admin pages (rooms, users, reports)
│   │   └── professor/       # Professor pages (today, reservations, check-in)
│   ├── config/
│   │   └── firebase.ts      # Firebase initialization
│   ├── utils/
│   │   ├── pwa.ts           # PWA service worker registration
│   │   ├── pdfExport.ts     # PDF generation utilities
│   │   ├── timeUtils.ts     # Time/date utilities
│   │   └── reservationStatusService.ts
│   ├── types/
│   │   └── models.ts        # TypeScript interfaces
│   ├── App.tsx              # Main app component with routing
│   └── main.tsx             # Entry point with PWA setup
├── functions/
│   └── src/
│       ├── index.ts         # Cloud Functions exports
│       ├── rooms.ts         # Room management functions
│       ├── reservations.ts  # Reservation logic
│       ├── checkins.ts      # Check-in functions
│       └── sweepers.ts      # Background cleanup tasks
├── public/
│   ├── manifest.json        # PWA manifest (updated)
│   ├── sw.js                # Service worker
│   └── icons/               # App icons (192x192, 512x512)
├── scripts/
│   ├── createIconsFromLogo.js  # PWA icon generation
│   └── initTestData.ts      # Test data initialization
└── firebase.json            # Firebase configuration
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account and project
- Git
- Android device or emulator (for APK testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jabtechh/smart-sched.git
   cd smart-sched
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_TIMEZONE=Asia/Manila
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open `http://localhost:5173` in your browser

5. **Run Firebase Functions locally** (optional)
   ```bash
   cd functions
   npm run serve
   ```
   
   Functions emulator runs on `localhost:5001`

6. **Initialize test data** (optional)
   ```bash
   npm run init-test-data
   ```

## 🌐 Deployment

### Vercel Deployment (Frontend)

The app is deployed on **Vercel** at: https://smart-sched-ochre.vercel.app

**Benefits:**
- Automatic deployments from GitHub
- Global CDN for fast loading
- Edge functions support
- PWA support with manifest caching

**Deployment Steps:**
1. Push to `main` branch on GitHub
2. Vercel automatically detects changes
3. Build and deploy (2-3 minutes)
4. Live at `https://smart-sched-ochre.vercel.app`

### Firebase Deployment (Backend)

1. **Build Cloud Functions**
   ```bash
   cd functions && npm run build && cd ..
   ```

2. **Deploy**
   ```bash
   firebase deploy --only functions
   ```

3. **Deploy Firestore rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### Local Development with Emulators

1. **Start Firebase emulators**
   ```bash
   firebase emulators:start --only firestore,functions,auth
   ```

2. **Configure frontend** (auto-detected in `.env`)
   - Functions: `localhost:5001`
   - Firestore: `localhost:8080`
   - Auth: `localhost:9099`

## 📱 PWA & APK Distribution

### Installing as PWA (Web)

1. Visit: https://smart-sched-ochre.vercel.app
2. Click browser menu → "Install app" (or use browser install prompt)
3. App appears on home screen as native app

### Building Android APK

1. Go to: https://pwabuilder.com
2. Enter: `https://smart-sched-ochre.vercel.app`
3. Click "Start" then "Package for Android"
4. Download APK and install on Android device

**APK Features:**
- ✅ Standalone fullscreen mode (no browser UI)
- ✅ Offline support via service worker
- ✅ Professional branding (dual logos)
- ✅ Quick app shortcuts
- ✅ Push notification ready

## 🔐 Authentication & Authorization

### User Roles

```
Super Admin
  ├── Manage all users and roles
  ├── System administration
  └── View all reports

Admin
  ├── Manage professors
  ├── Manage room schedules
  ├── View department reports
  └── Generate room QR codes

Professor
  ├── Create room reservations
  ├── Scan QR codes for check-in
  ├── View personal reservations
  └── Access personal reports
```

### Login Credentials Format

- **Username**: First part only (e.g., `john`)
- **Domain**: Auto-appended as `@pateros.edu.ph`
- **Full Email**: `john@pateros.edu.ph`

## 🎨 UI Components

### Key Components

- **LoadingScreen** - Animated splash with dual logos
- **Layout** - Responsive sidebar + navbar
- **QRScanner** - Live camera QR scanning
- **QRGenerator** - Generate room QR codes
- **ReportFilters** - Advanced filtering for analytics
- **CheckInAnalytics** - Attendance analytics dashboard
- **RoomUtilization** - Room usage statistics

### Responsive Design

- **Mobile** (< 640px): Full-width, stacked layout
- **Tablet** (640px - 1024px): Two-column layout
- **Desktop** (> 1024px): Sidebar + main content

## 📊 Firebase Collections

### users
```json
{
  "email": "john@pateros.edu.ph",
  "displayName": "John Doe",
  "role": "professor|admin|super-admin",
  "department": "Engineering",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### rooms
```json
{
  "name": "Lab A1",
  "building": "Engineering Building",
  "capacity": 30,
  "facilities": ["projector", "whiteboard", "computer"],
  "createdAt": "timestamp",
  "active": true
}
```

### reservations
```json
{
  "roomId": "room_123",
  "professorId": "user_456",
  "date": "2025-12-16",
  "startTime": "09:00",
  "endTime": "11:00",
  "status": "confirmed|completed|cancelled",
  "purpose": "Class Lecture",
  "createdAt": "timestamp"
}
```

### checkIns
```json
{
  "reservationId": "res_123",
  "professorId": "user_456",
  "timestamp": "timestamp",
  "method": "qr_scan|manual"
}
```

### roomSchedules
```json
{
  "roomId": "room_123",
  "dayOfWeek": 1,
  "startTime": "08:00",
  "endTime": "17:00",
  "enabled": true
}
```

## 📄 Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server with HMR

# Production
npm run build            # Build TypeScript + Vite
npm run preview          # Preview production build locally

# Testing & Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Data Management
npm run init-test-data   # Initialize Firebase with test data

# Functions
cd functions
npm run build            # Build Cloud Functions
npm run serve            # Start Functions emulator
npm run deploy           # Deploy to Firebase
```

## 🔄 Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
npm run dev              # Test locally
npm run build            # Verify build
git add -A
git commit -m "feat: Add new feature"
git push origin feature/new-feature

# Create Pull Request, get reviewed
# Merge to main
# Automatic deployment via GitHub Actions
```

## 📚 Key Features by User Role

### Admin Dashboard
- 👥 User management and role assignment
- 🏢 Room inventory and scheduling
- 📊 Comprehensive analytics and reports
- 🔗 QR code generation and management
- ⚙️ System settings and configuration

### Professor Interface
- 📅 Book classroom space
- 📱 Scan QR code for attendance
- 👥 View today's classes
- 📊 Personal attendance reports
- 🔔 Real-time notifications

## 🚀 Performance Optimizations

- **Code Splitting**: Lazy-loaded pages reduce initial bundle
- **Caching**: Service worker caches assets and API responses
- **Compression**: Gzip compression on all assets
- **Optimization**: Images optimized, unused code removed
- **CDN**: Vercel global CDN for fast content delivery

## 🔗 Important Links

- **Live App**: https://smart-sched-ochre.vercel.app
- **GitHub Repo**: https://github.com/jabtechh/smart-sched
- **Firebase Console**: https://console.firebase.google.com
- **PWA Builder**: https://pwabuilder.com
- **Vercel Dashboard**: https://vercel.com/dashboard

## 🐛 Troubleshooting

### PWA Not Installing
- Clear browser cache: `Ctrl+Shift+Delete`
- Check manifest.json loads without errors
- Verify HTTPS on production (required for PWA)
- Service worker must be served from root

### APK Not Showing Standalone Mode
- Uninstall and reinstall APK
- Check manifest has `"display": "standalone"`
- Verify icons are valid PNG format
- Ensure service worker registers successfully

### Login Issues
- Email should be username only (no @domain)
- Domain auto-appends as `@pateros.edu.ph`
- Check Firebase Authentication is enabled
- Verify Firestore rules allow user creation

### QR Scanner Not Working
- Request camera permissions
- Ensure good lighting
- Check QR code is valid
- Verify device has camera

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📞 Support & Issues

- **GitHub Issues**: https://github.com/jabtechh/smart-sched/issues
- **Firebase Status**: https://status.firebase.google.com
- **Vercel Status**: https://www.vercel-status.com

---

**Built with ❤️ using React, TypeScript, Firebase, and Vercel**

Last Updated: December 16, 2025
