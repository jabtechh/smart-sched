import { useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { getReservationsEndingSoon, markWarningAsShown } from '@/utils/reservationStatusService';

export default function ReservationGracePeriodWarnings() {
  useEffect(() => {
    const checkForEndingReservations = async () => {
      try {
        const endingSoon = await getReservationsEndingSoon(10); // 10 minute warning

        for (const reservation of endingSoon) {
          toast(() => (
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">
                  Reservation Ending Soon
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {reservation.roomName || 'Room'} - {reservation.minutesRemaining} minutes remaining
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Course: {reservation.courseCode}
                </p>
              </div>
            </div>
          ), {
            duration: 8000,
            icon: null
          });

          // Mark as warned
          await markWarningAsShown(reservation.id);
        }
      } catch (error) {
        console.error('Error checking grace period:', error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkForEndingReservations, 5 * 60 * 1000);
    
    // Initial check
    checkForEndingReservations();

    return () => clearInterval(interval);
  }, []);

  return null; // This is a silent background component
}
