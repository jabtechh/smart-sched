# Deployment Guide for Smart-Sched

## Prerequisites

- Git installed on your machine
- Firebase account with a project created
- Node.js and npm installed
- Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Push Code to GitHub

Since you've already created the repository at https://github.com/jabtechh/smart-sched, follow these steps:

### Initialize Git and Push (if not already done)

```bash
# Initialize git repository (if not already done)
git init

# Add the remote repository
git remote add origin https://github.com/jabtechh/smart-sched.git

# Check your current branch name
git branch

# If you're on 'master', rename to 'main' (recommended)
git branch -M main

# Stage all files
git add .

# Commit your code
git commit -m "Initial commit: Smart-Sched PWA with Firebase"

# Push to GitHub
git push -u origin main
```

**Important:** Make sure your `.env` file is in `.gitignore` (it already is) so your Firebase credentials don't get pushed to GitHub.

## Step 2: Set Up Firebase Hosting

### 2.1 Update firebase.json

Add hosting configuration to your `firebase.json`:

```json
{
  "firestore": {
    "database": "(default)",
    "location": "nam5",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "disallowLegacyRuntimeConfig": true,
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run lint",
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ],
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "/assets/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          },
          {
            "key": "Service-Worker-Allowed",
            "value": "/"
          }
        ]
      }
    ]
  }
}
```

### 2.2 Login to Firebase

```bash
firebase login
```

### 2.3 Initialize Firebase (if not already done)

```bash
# This will link your local project to your Firebase project
firebase use --add

# Select your Firebase project
# Give it an alias (e.g., "production")
```

## Step 3: Build and Deploy

### 3.1 Install Dependencies

```bash
# Install root dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 3.2 Build the Project

```bash
# Build the frontend
npm run build

# Build the functions
cd functions
npm run build
cd ..
```

### 3.3 Deploy Everything to Firebase

```bash
# Deploy hosting, functions, and Firestore rules
firebase deploy

# Or deploy specific services:
firebase deploy --only hosting          # Just the frontend
firebase deploy --only functions        # Just the Cloud Functions
firebase deploy --only firestore        # Just Firestore rules & indexes
```

## Step 4: Set Up GitHub Actions for CI/CD (Optional but Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install functions dependencies
        run: cd functions && npm ci
      
      - name: Create .env file
        run: |
          echo "VITE_FIREBASE_API_KEY=${{ secrets.VITE_FIREBASE_API_KEY }}" >> .env
          echo "VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}" >> .env
          echo "VITE_FIREBASE_PROJECT_ID=${{ secrets.VITE_FIREBASE_PROJECT_ID }}" >> .env
          echo "VITE_FIREBASE_STORAGE_BUCKET=${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}" >> .env
          echo "VITE_FIREBASE_MESSAGING_SENDER_ID=${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}" >> .env
          echo "VITE_FIREBASE_APP_ID=${{ secrets.VITE_FIREBASE_APP_ID }}" >> .env
          echo "VITE_TIMEZONE=Asia/Manila" >> .env
      
      - name: Build project
        run: npm run build
      
      - name: Build functions
        run: cd functions && npm run build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

### 4.1 Set Up GitHub Secrets

1. Go to your GitHub repository: https://github.com/jabtechh/smart-sched
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT` (Get this from Firebase Console → Project Settings → Service Accounts → Generate new private key)

## Step 5: Configure Firebase Authentication

Make sure your Firebase Authentication settings allow your hosting domain:

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your Firebase hosting domain (e.g., `your-project.web.app`)

## Step 6: Test Your Deployment

1. After deployment, Firebase will provide a URL like: `https://your-project.web.app`
2. Open it in your browser
3. Test the PWA functionality by clicking "Install App" (should appear in mobile browsers)
4. Test authentication and all features

## Environment Variables for Production

Make sure you have these environment variables set correctly in your `.env` file for local development:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_TIMEZONE=Asia/Manila
```

## Troubleshooting

### Build Fails
- Check that all dependencies are installed: `npm install && cd functions && npm install`
- Verify TypeScript compilation: `npm run build`

### Functions Not Deploying
- Ensure you're on the Blaze (pay-as-you-go) plan in Firebase
- Check functions build: `cd functions && npm run build`

### PWA Not Installing
- Verify `manifest.json` is in the `public/` folder
- Check that `sw.js` is accessible at the root URL
- Ensure HTTPS is enabled (Firebase Hosting provides this automatically)

### 404 on Refresh
- Make sure the `rewrites` rule in `firebase.json` hosting config is set correctly (see Step 2.1)

## Monitoring and Logs

```bash
# View hosting logs
firebase hosting:logs

# View functions logs
firebase functions:log

# View Firestore logs (in Firebase Console)
```

## Rolling Back

If something goes wrong:

```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version (in Firebase Console)
# Go to Hosting → Release history → Rollback
```

## Quick Deploy Script

Create a `deploy.sh` script for easy deployment:

```bash
#!/bin/bash
echo "Building project..."
npm run build

echo "Building functions..."
cd functions && npm run build && cd ..

echo "Deploying to Firebase..."
firebase deploy

echo "Deployment complete!"
echo "Visit your site at: https://your-project.web.app"
```

Make it executable: `chmod +x deploy.sh`

Then deploy with: `./deploy.sh`

---

## Summary

1. **Push to GitHub**: `git push -u origin main`
2. **Update firebase.json** with hosting config
3. **Build**: `npm run build`
4. **Deploy**: `firebase deploy`
5. **Set up GitHub Actions** (optional but recommended)
6. **Test**: Visit your Firebase hosting URL

Your app will be live at: `https://your-firebase-project.web.app`
