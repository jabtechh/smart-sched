import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa'
import { setupMobileOptimizations } from './utils/mobileOptimizations'

// Setup mobile-specific optimizations (touch interactions, viewport, etc.)
setupMobileOptimizations();

// Register service worker for PWA functionality
registerServiceWorker();

// Setup "Add to Home Screen" functionality
setupInstallPrompt();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
