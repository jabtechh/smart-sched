# Smart-Sched 📚

A **mobile-first Progressive Web App (PWA)** for smart scheduling and room management, built with React, TypeScript, Vite, and Firebase.

[![Deploy to Firebase](https://github.com/jabtechh/smart-sched/actions/workflows/deploy.yml/badge.svg)](https://github.com/jabtechh/smart-sched/actions/workflows/deploy.yml)

## 🚀 Features

- 📱 **Mobile-First PWA** - Installable on mobile devices with offline support
- 🔐 **Role-Based Access** - Admin and Professor roles with different capabilities
- 📅 **Room Scheduling** - Create and manage room reservations
- 📷 **QR Code System** - Generate and scan QR codes for room check-ins
- ⏰ **Real-Time Updates** - Firebase Firestore for live data synchronization
- 🌐 **Serverless Backend** - Firebase Cloud Functions for business logic
- 🎨 **Modern UI** - Tailwind CSS with responsive design

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Firebase (Firestore, Functions, Auth)
- **UI**: Tailwind CSS, Headless UI, Hero Icons
- **PWA**: Vite PWA Plugin, Service Workers
- **Region**: Asia Southeast (asia-southeast1)
- **Timezone**: Asia/Manila

## 📦 Project Structure

```
smart-sched/
├── src/                      # Frontend source code
│   ├── components/           # Reusable React components
│   ├── contexts/             # React contexts (Auth, Room)
│   ├── pages/                # Page components (Admin, Professor)
│   ├── config/               # Firebase configuration
│   └── utils/                # Utility functions
├── functions/                # Firebase Cloud Functions
│   └── src/                  # Functions source code
├── public/                   # Static assets (PWA manifest, icons)
├── firebase.json             # Firebase configuration
└── DEPLOYMENT.md             # Detailed deployment guide
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account and project
- Git

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
   
   Copy `.env.example` to `.env` and fill in your Firebase credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
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
   
   Visit `http://localhost:5173`

5. **Run Firebase Functions locally** (optional)
   ```bash
   cd functions
   npm run serve
   ```

## 🌐 Deployment

### Quick Deploy

1. **Build the project**
   ```bash
   npm run build
   cd functions && npm run build && cd ..
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

### Automated Deployment with GitHub Actions

Push to `main` branch and GitHub Actions will automatically build and deploy.

**Required GitHub Secrets:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Deploy Scripts

**Windows:**
```bash
.\deploy.bat
```

**Mac/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## 📱 PWA Features

- **Installable** on iOS and Android devices
- **Offline support** with service worker caching
- **App-like experience** with custom icons and splash screens
- **Push notifications** ready (if enabled)

## 🔑 User Roles

### Admin
- Manage rooms and schedules
- View all reservations and check-ins
- Generate QR codes for rooms
- Access reports and analytics

### Professor
- Create reservations
- Scan QR codes for check-in
- View today's schedule
- Access personal reservations

## 📄 Available Scripts

```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run init-test-data  # Initialize test data
```

## 🗂️ Firebase Collections

- `users` - User profiles and roles
- `rooms` - Room information
- `reservations` - Booking data
- `checkIns` - Check-in records
- `roomSchedules` - Schedule validation data

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🔗 Links

- **GitHub Repository**: https://github.com/jabtechh/smart-sched
- **Firebase Console**: [Your Firebase Project](https://console.firebase.google.com)
- **Live Demo**: Your Firebase Hosting URL

## 📞 Support

For issues and questions, please use the [GitHub Issues](https://github.com/jabtechh/smart-sched/issues) page.

---

Built with ❤️ using React, TypeScript, and Firebase


Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
