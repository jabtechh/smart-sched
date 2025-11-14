import { useState, useEffect } from 'react';
import { QRScanner } from '@/components/qr';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, doc, updateDoc, Timestamp, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { CHECK_IN_EARLY_BUFFER } from '@/types/room';

const ScannerPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const db = getFirestore();
  
  const isCheckingOut = location.state?.mode === 'checkout';
  const activeCheckInId = location.state?.checkInId;

  const validateSchedule = async (roomId: string) => {
    const now = Timestamp.now();
    const scheduleRef = collection(db, 'roomSchedules');
    
    // Find any active schedule for this professor and room
    const q = query(
      scheduleRef,
      where('roomId', '==', roomId),
      where('professorId', '==', auth.currentUser?.uid),
      where('status', '==', 'scheduled')
    );

    const schedules = await getDocs(q);
    if (schedules.empty) {
      throw new Error('You do not have any scheduled sessions in this room.');
    }

    // Find the closest matching schedule
    const currentSchedule = schedules.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .find(schedule => {
        const startTime = schedule.startTime.toDate();
        const endTime = schedule.endTime.toDate();
        const nowDate = now.toDate();
        
        // Allow early check-in if no other schedule exists
        const earlyWindowStart = new Date(startTime);
        earlyWindowStart.setMinutes(earlyWindowStart.getMinutes() - CHECK_IN_EARLY_BUFFER);
        
        return nowDate >= earlyWindowStart && nowDate <= endTime;
      });

    if (!currentSchedule) {
      throw new Error('No active schedule found for current time.');
    }

    return currentSchedule;
  };

  const handleScan = async (qrData: string) => {
    console.log('Scan detected:', qrData);
    try {
      setIsProcessing(true);
      
      // 1. Basic validations
      if (!auth.currentUser) {
        throw new Error('You must be logged in to scan rooms');
      }

      if (!qrData.startsWith('room-')) {
        console.error('Invalid QR data:', qrData);
        throw new Error('Invalid QR code. Please scan a valid room QR code.');
      }

      // 2. Get room info
      const roomId = qrData.replace('room-', '');
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('Room not found. Please try again.');
      }

      const checkInsRef = collection(db, 'checkIns');
      
      // 3. Validate schedule if checking in
      if (!isCheckingOut) {
        const schedule = await validateSchedule(roomId);
        console.log('Valid schedule found:', schedule);
      }

      // 3. Handle Check-out
      if (isCheckingOut) {
        console.log('Processing check-out...');
        
        // Get the active check-in
        const checkInRef = doc(db, 'checkIns', activeCheckInId);
        const checkInData = (await getDoc(checkInRef)).data();

        // Verify same room
        if (checkInData?.roomId !== roomId) {
          throw new Error('Please scan the same room you checked into');
        }

        // Update check-in record
        await updateDoc(checkInRef, {
          checkOutTime: Timestamp.now(),
          status: 'completed'
        });

        toast.success('✅ Check-out successful!');
      }
      // 4. Handle Check-in
      else {
        console.log('Processing check-in...');
        
        // Check for existing active check-in
        const activeQuery = query(
          checkInsRef,
          where('userId', '==', auth.currentUser.uid),
          where('status', '==', 'active')
        );
        
        const hasActive = !(await getDocs(activeQuery)).empty;
        if (hasActive) {
          throw new Error('You already have an active check-in. Please check-out first.');
        }

        // Create new check-in record
        await addDoc(checkInsRef, {
          userId: auth.currentUser.uid,
          roomId: roomId,
          checkInTime: Timestamp.now(),
          status: 'active',
          roomName: roomSnap.data().name,
          building: roomSnap.data().building,
          floor: roomSnap.data().floor
        });

        toast.success('✅ Check-in successful!');
      }
      
      // 5. Return to Today's page
      navigate('/prof/today', { replace: true });
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process scan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (error: Error) => {
    console.error('Scanner error:', error);
    toast.error('Failed to access camera. Please check permissions.');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-primary text-white flex justify-between items-center">
            <h1 className="text-xl font-semibold">
              {isCheckingOut ? 'Scan to Check Out' : 'Scan Room QR Code'}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-200"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4">
            {isProcessing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Processing scan...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {isCheckingOut
                    ? 'Scan the room QR code to complete your check-out.'
                    : 'Point your camera at a room QR code to record your check-in.'}
                </div>
                <QRScanner
                  onScan={handleScan}
                  onError={handleError}
                  className="mb-4"
                />
                {isCheckingOut && (
                  <div className="mt-4 text-xs text-gray-500">
                    Note: You must scan the same room's QR code that you checked into.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;