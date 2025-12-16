/**
 * Mobile optimization utilities for SmartSched
 * Ensures proper touch interactions and responsive behavior on mobile devices
 */

export const setupMobileOptimizations = () => {
  // Prevent double-tap zoom on buttons and interactive elements
  if (typeof window !== 'undefined') {
    document.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('button, a, input, select, textarea, [role="button"], [role="menuitem"]')) {
        // Allows double-tap to work on interactive elements
        e.preventDefault();
        (target as HTMLElement).click?.();
      }
    }, { passive: true });

    // Ensure viewport doesn't zoom on input focus (already handled in CSS, but double-check)
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }

    // Fix iOS Safari status bar issue
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
  }
};

/**
 * Utility to detect if the app is running on a mobile device
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Get safe area insets for notched devices
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };

  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
  };
};
