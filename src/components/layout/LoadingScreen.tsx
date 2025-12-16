import { useEffect, useState } from 'react';
import appLogo from '../../assets/ptc_smartsched_logo_primary.png';
import schoolLogo from '../../assets/ptc_logo.jpg';

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide loading screen after app loads
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="animate-fade-in flex flex-col items-center gap-4">
        <img 
          src={appLogo} 
          alt="SmartSched Loading" 
          className="h-32 w-32 animate-pulse"
        />
        <img 
          src={schoolLogo} 
          alt="School Logo" 
          className="h-32 w-32 animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
        <div className="flex justify-center gap-1 mt-6">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
