# Quick Deployment Commands

## First Time Setup

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/jabtechh/smart-sched.git
git branch -M main
git push -u origin main

# 2. Login to Firebase
firebase login

# 3. Link to Firebase project
firebase use --add
# (Select your project and give it an alias like "production")

# 4. Install dependencies
npm install
cd functions && npm install && cd ..
```

## Deploy to Firebase Hosting

### Option 1: Manual Deploy (Recommended for first deploy)

```bash
# Build everything
npm run build
cd functions && npm run build && cd ..

# Deploy everything (hosting + functions + firestore rules)
firebase deploy

# Or deploy specific services:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
```

### Option 2: Use Deploy Script (Windows)

```bash
.\deploy.bat
```

### Option 3: Use Deploy Script (Mac/Linux)

```bash
chmod +x deploy.sh
./deploy.sh
```

## GitHub Actions Auto-Deploy

After pushing to main branch, GitHub Actions will automatically:
1. Build the project
2. Deploy to Firebase

**Setup Required:**
1. Go to: https://github.com/jabtechh/smart-sched/settings/secrets/actions
2. Add these secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT` (from Firebase Console → Project Settings → Service Accounts)

## Common Commands

```bash
# View logs
firebase hosting:logs
firebase functions:log

# Test locally
npm run dev                          # Frontend dev server
cd functions && npm run serve        # Functions emulator

# View deployment history
firebase hosting:channel:list

# Deploy to preview channel
firebase hosting:channel:deploy preview-name
```

## Your URLs

- **Production**: `https://your-project.web.app` or `https://your-project.firebaseapp.com`
- **GitHub Repo**: https://github.com/jabtechh/smart-sched

## Need Help?

See full guide in: `DEPLOYMENT.md`
