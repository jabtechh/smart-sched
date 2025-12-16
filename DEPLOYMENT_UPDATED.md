# SmartSched Deployment Guide

Complete guide for deploying SmartSched to production using Vercel (Frontend), Firebase (Backend), and GitHub Actions (CI/CD).

## 📋 Prerequisites

- Git installed
- GitHub account and repository setup
- Firebase account and project
- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Vercel account (for frontend deployment)

## 🚀 Quick Start (Current Setup)

### Current Deployment Configuration

```
Frontend:     Vercel (https://smart-sched-ochre.vercel.app)
Backend:      Firebase (asia-southeast1)
Functions:    Firebase Cloud Functions
Database:     Firestore
Auth:         Firebase Authentication
CI/CD:        GitHub Actions
```

## 📦 Frontend Deployment (Vercel)

### Initial Setup

1. **Connect GitHub to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Import from GitHub: `jabtechh/smart-sched`
   - Select `main` branch

2. **Configure Environment Variables**
   - In Vercel project settings, add:
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_TIMEZONE=Asia/Manila
   ```

3. **Deploy**
   - Vercel automatically deploys on every push to `main`
   - Build command: `npm run build`
   - Output directory: `dist`

### Automatic Deployments

Every push to `main` branch automatically:
1. ✅ Builds the React app with Vite
2. ✅ Runs TypeScript type checking
3. ✅ Deploys to Vercel's global CDN
4. ✅ Available at https://smart-sched-ochre.vercel.app (2-3 minutes)

## 🔥 Backend Deployment (Firebase)

### Initial Firebase Setup

1. **Initialize Firebase Project**
   ```bash
   firebase init
   ```
   - Select features: Functions, Firestore, Hosting
   - Use existing project: `smart-sched` (or your project ID)
   - Region: `asia-southeast1`

2. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Cloud Functions**
   ```bash
   cd functions
   npm run build
   cd ..
   firebase deploy --only functions
   ```

### Cloud Functions Architecture

**Functions deployed:**
- `onUserCreated` - Setup new user in Firestore
- `onReservationCreated` - Create check-in records
- `checkInCleanup` - Daily cleanup of old data
- `sendNotifications` - Push notification handling (if enabled)

## 🔧 Environment Setup

### .env File (Local Development)

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# App Configuration
VITE_TIMEZONE=Asia/Manila
```

### GitHub Secrets (For CI/CD)

Add these secrets in GitHub repository settings:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT  # JSON key for Firebase admin SDK
```

## 🔄 Deployment Workflow

### Local Development

```bash
# 1. Start dev server
npm run dev

# 2. Test locally
# Open http://localhost:5173

# 3. Start Firebase emulators (optional)
cd functions && npm run serve

# 4. Make changes and test
```

### Pushing Changes

```bash
# 1. Stage changes
git add .

# 2. Commit with descriptive message
git commit -m "feat: Add new feature"

# 3. Push to main
git push origin main

# 4. Vercel automatically builds and deploys
# 5. Check progress: https://vercel.com/dashboard
```

### Monitoring Deployments

**Vercel Dashboard:**
- https://vercel.com/dashboard/smart-sched
- View build logs
- Monitor performance
- Configure domains

**Firebase Console:**
- https://console.firebase.google.com
- View Functions logs
- Monitor Firestore usage
- Check authentication

## 📱 PWA & APK Distribution

### Web PWA Installation

**Users can install directly from web:**
1. Visit https://smart-sched-ochre.vercel.app
2. Click browser menu → "Install app"
3. App appears on home screen

### Android APK Generation

**Using PWA Builder (Recommended):**

1. Go to https://pwabuilder.com
2. Enter: `https://smart-sched-ochre.vercel.app`
3. Click "Start"
4. Click "Package for Android"
5. Choose signing options:
   - **Testing**: Sign for free (recommended for testing)
   - **Production**: Use your keystore for Play Store

6. Download APK and install on Android device

**APK Features Included:**
- ✅ Standalone fullscreen mode
- ✅ Service worker offline support
- ✅ App icons and splash screen
- ✅ Push notifications ready
- ✅ Dual logo branding

## 🧪 Testing Before Production

### Pre-Deployment Checklist

```bash
# 1. Type checking
npm run tsc

# 2. Linting
npm run lint

# 3. Build test
npm run build

# 4. Preview production build
npm run preview

# 5. Test service worker
# Open DevTools → Application → Service Workers

# 6. Test manifest
# Check: https://localhost:5173/manifest.json

# 7. Test PWA installation
# In browser: Install app option should appear
```

### Manual Testing

1. **Authentication**
   - ✅ Login works
   - ✅ Register works
   - ✅ Password reset works

2. **Core Features**
   - ✅ Room creation/editing
   - ✅ Reservation booking
   - ✅ QR code generation
   - ✅ Check-in scanning

3. **Offline Support**
   - ✅ Works without internet
   - ✅ Syncs when back online
   - ✅ Caches correctly

4. **Mobile Responsiveness**
   - ✅ Layouts adapt to screen sizes
   - ✅ Touch interactions work
   - ✅ Navigation responsive

## 🔐 Security Considerations

### Firebase Security Rules

**Firestore Rules** protect data access:
```
- Users can only read/write their own documents
- Admins have elevated permissions
- Public data (rooms) are readable
- Reservations require authentication
```

### Secrets Management

- ❌ Never commit `.env` files
- ❌ Never share Firebase service accounts
- ✅ Use GitHub Secrets for CI/CD
- ✅ Use Vercel environment variables
- ✅ Rotate keys periodically

## 🚨 Troubleshooting

### Vercel Build Fails

**Issue:** Build fails after push
- ✅ Check build logs in Vercel dashboard
- ✅ Verify environment variables are set
- ✅ Ensure `.env` is in `.gitignore`
- ✅ Check TypeScript errors: `npm run tsc`

### Firebase Deploy Issues

**Issue:** Functions deploy fails
```bash
# 1. Check Functions config
firebase functions:config:get

# 2. Build locally first
cd functions && npm run build

# 3. Deploy with verbose output
firebase deploy --only functions --debug
```

### PWA Not Installing

**Issue:** App doesn't show install prompt
- ✅ Verify HTTPS on production
- ✅ Check manifest.json is valid
- ✅ Service worker must register
- ✅ Need at least 2 app icons

### APK Issues

**Issue:** APK shows browser UI
- ✅ Reinstall APK after manifest update
- ✅ Verify `"display": "standalone"`
- ✅ Check icons are valid PNG
- ✅ Service worker must register

## 📊 Performance Monitoring

### Vercel Analytics

- https://vercel.com/analytics/smart-sched
- Real Experience Score (RES)
- Web Vitals metrics
- Performance trends

### Firebase Usage

- Go to Firebase Console
- Monitor Firestore reads/writes
- Check Functions execution time
- Review authentication metrics

## 🔄 Scaling & Future Upgrades

### Firestore Scaling

Current setup supports:
- ~1000 concurrent users
- ~10K reservations/month
- ~50K check-ins/month

To scale:
1. Create composite indexes
2. Implement pagination
3. Archive old data

### Functions Scaling

Firebase automatically scales functions. Monitor:
- Concurrent executions
- Memory usage
- Execution time

## 📞 Emergency Rollback

### Rollback Frontend

1. Identify last working commit
2. Revert push:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
3. Vercel automatically redeploys

### Rollback Backend

```bash
# View deployment history
firebase functions:list

# Delete problematic function
firebase functions:delete functionName

# Redeploy previous version
firebase deploy --only functions
```

## 📝 Maintenance & Updates

### Regular Tasks

- **Weekly**: Check error logs in Firebase Console
- **Monthly**: Update dependencies: `npm update`
- **Quarterly**: Review Firestore indexes
- **Annually**: Renew Firebase service accounts

### Update Process

1. Create feature branch
2. Update dependencies
3. Test thoroughly
4. Push to main
5. Verify in production

## 🔗 Useful Links

- **Live App**: https://smart-sched-ochre.vercel.app
- **GitHub Repo**: https://github.com/jabtechh/smart-sched
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firebase Console**: https://console.firebase.google.com
- **PWA Builder**: https://pwabuilder.com

## 📞 Support

For deployment issues:
1. Check Firebase Console logs
2. Check Vercel build logs
3. Review GitHub Actions workflow
4. Open GitHub Issue with error details

---

Last Updated: December 16, 2025
