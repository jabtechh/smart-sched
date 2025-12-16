import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ClockIcon, XCircleIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { format, differenceInSeconds } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface CheckIn {
  id: string;
  roomId: string;
  roomName: string;
  building: string;
  floor: string;
  checkInTime: Date;
  checkOutTime?: Date;
  status: 'active' | 'completed';
  scheduledEndTime?: Date;
  scheduledStartTime?: Date;
  courseCode?: string;
  userId: string;
  professorName?: string;
}

export default function TodayPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const auth = getAuth();
  const db = getFirestore();

  const fetchTodayCheckIns = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Get start of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Query check-ins
      const checkInsRef = collection(db, 'checkIns');
      const q = query(
        checkInsRef,
        where('userId', '==', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const checkInData: CheckIn[] = [];

      // Process check-ins
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        // Only include today's check-ins
        const checkInTime = data.checkInTime.toDate();
        if (checkInTime >= today) {
          let scheduledEndTime: Date | undefined;
          let scheduledStartTime: Date | undefined;
          let courseCode: string | undefined;
          let professorName: string | undefined;
          
          // Fetch professor name
          try {
            const userRef = (doc as any)(db, 'users', data.userId || auth.currentUser!.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data() as any;
              professorName = userData?.displayName || userData?.name || 'Professor';
            }
          } catch (userErr) {
            console.error('Error fetching user:', userErr);
          }
          
          // Fetch scheduled details from roomSchedules
          try {
            const schedulesRef = collection(db, 'roomSchedules');
            const scheduleQ = query(
              schedulesRef,
              where('roomId', '==', data.roomId),
              where('professorId', '==', auth.currentUser.uid),
              where('status', '==', 'scheduled')
            );
            
            const scheduleSnap = await getDocs(scheduleQ);
            if (!scheduleSnap.empty) {
              // Find the schedule for the current date
              const schedule = scheduleSnap.docs
                .map(schedDoc => schedDoc.data())
                .find((sched: any) => {
                  const schedDate = (sched.startTime as any)?.toDate?.() || sched.startTime;
                  return (new Date(schedDate)).toDateString() === checkInTime.toDateString();
                });
              
              if (schedule) {
                const schedData = schedule as any;
                scheduledEndTime = schedData.endTime?.toDate?.() || schedData.endTime;
                scheduledStartTime = schedData.startTime?.toDate?.() || schedData.startTime;
                courseCode = schedData.courseCode;
              }
            }
          } catch (schedErr) {
            console.error('Error fetching schedule:', schedErr);
          }
          
          checkInData.push({
            id: doc.id,
            roomId: data.roomId,
            roomName: data.roomName || 'Unknown Room',
            building: data.building || 'Unknown Building',
            floor: data.floor || 'Unknown Floor',
            checkInTime: checkInTime,
            checkOutTime: data.checkOutTime?.toDate(),
            status: data.status,
            scheduledEndTime: scheduledEndTime,
            scheduledStartTime: scheduledStartTime,
            courseCode: courseCode,
            userId: data.userId || auth.currentUser!.uid,
            professorName: professorName,
          });
        }
      }

      // Sort by check-in time descending
      checkInData.sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
      setCheckIns(checkInData);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
      setError('Failed to load check-in history');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (checkInId: string) => {
    if (!auth.currentUser) return;

    try {
      const checkInRef = doc(db, 'checkIns', checkInId);
      await updateDoc(checkInRef, {
        checkOutTime: Timestamp.now(),
        status: 'completed'
      });

      toast.success('Successfully checked out');
      fetchTodayCheckIns(); // Refresh the list
    } catch (err) {
      console.error('Error checking out:', err);
      toast.error('Failed to check out');
    }
  };

  useEffect(() => {
    fetchTodayCheckIns();
    // Set up real-time updates if needed
    const interval = setInterval(fetchTodayCheckIns, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const activeCheckIn = checkIns.find(checkIn => checkIn.status === 'active');
    if (!activeCheckIn || !activeCheckIn.scheduledEndTime) {
      setTimeRemaining('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const endTime = activeCheckIn.scheduledEndTime!;
      const secondsRemaining = differenceInSeconds(endTime, now);

      if (secondsRemaining <= 0) {
        setTimeRemaining('Session ended');
      } else {
        const hours = Math.floor(secondsRemaining / 3600);
        const minutes = Math.floor((secondsRemaining % 3600) / 60);
        const seconds = secondsRemaining % 60;

        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m remaining`);
        } else if (minutes > 0) {
          setTimeRemaining(`${minutes}m ${seconds}s remaining`);
        } else {
          setTimeRemaining(`${seconds}s remaining`);
        }
      }
    };

    // Initial call
    updateCountdown();

    // Update every second
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownInterval);
  }, [checkIns]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-700 bg-red-100 rounded-lg">
        {error}
      </div>
    );
  }

  const activeCheckIn = checkIns.find(checkIn => checkIn.status === 'active');

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Active Room Section */}
      {activeCheckIn && (
        <div className="mb-8 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-primary text-white">
            <h2 className="text-lg font-semibold">Currently Active Room</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{activeCheckIn.roomName}</h3>
                <p className="text-gray-600">{activeCheckIn.building}, Floor {activeCheckIn.floor}</p>
                <div className="mt-2 space-y-2">
                  {activeCheckIn.scheduledStartTime && activeCheckIn.scheduledEndTime && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Reservation:</span> {format(activeCheckIn.scheduledStartTime, 'h:mm a')}-{format(activeCheckIn.scheduledEndTime, 'h:mm a')}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Checked in at:</span> {format(activeCheckIn.checkInTime, 'h:mm a')}
                  </p>
                </div>
                {activeCheckIn.scheduledEndTime && (
                  <div className="mt-3 flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-primary" />
                    <span className={`text-sm font-semibold ${
                      timeRemaining.includes('ended') ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {timeRemaining}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCheckOut(activeCheckIn.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Check Out
                </button>
                <Link
                  to="/professor/scan"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                  Scan to Check Out
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Activity Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">Today's Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {checkIns.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No check-ins recorded today
            </div>
          ) : (
            checkIns.map((checkIn) => (
              <div
                key={checkIn.id}
                onClick={() => setSelectedCheckIn(checkIn)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-primary"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{checkIn.roomName}</h3>
                    <p className="text-sm text-gray-600">{checkIn.building}, Floor {checkIn.floor}</p>
                    {checkIn.courseCode && (
                      <p className="text-sm text-primary font-semibold mt-1">{checkIn.courseCode}</p>
                    )}
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>
                        {format(checkIn.checkInTime, 'h:mm a')}
                        {checkIn.checkOutTime && ` - ${format(checkIn.checkOutTime, 'h:mm a')}`}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      checkIn.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {checkIn.status === 'active' ? 'Active' : 'Completed'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-lg shadow-lg p-6 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{selectedCheckIn.roomName}</h3>
                {selectedCheckIn.professorName && (
                  <p className="text-sm text-gray-600">Professor: {selectedCheckIn.professorName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedCheckIn(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-light ml-2"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Course Code - Prominent */}
              {selectedCheckIn.courseCode && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Course Code</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedCheckIn.courseCode}</p>
                </div>
              )}

              {/* Location */}
              <div>
                <p className="text-sm text-gray-600 font-medium">Location</p>
                <p className="text-gray-900">{selectedCheckIn.building}, Floor {selectedCheckIn.floor}</p>
              </div>

              {/* Scheduled Time */}
              {selectedCheckIn.scheduledStartTime && selectedCheckIn.scheduledEndTime && (
                <div>
                  <p className="text-sm text-gray-600 font-medium">Scheduled Session</p>
                  <p className="text-gray-900">
                    {format(selectedCheckIn.scheduledStartTime, 'h:mm a')} - {format(selectedCheckIn.scheduledEndTime, 'h:mm a')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Duration: {Math.round((selectedCheckIn.scheduledEndTime.getTime() - selectedCheckIn.scheduledStartTime.getTime()) / (1000 * 60))} minutes
                  </p>
                </div>
              )}

              {/* Check-in Time */}
              <div>
                <p className="text-sm text-gray-600 font-medium">Check-in Time</p>
                <p className="text-gray-900">{format(selectedCheckIn.checkInTime, 'h:mm a')}</p>
              </div>

              {/* Check-out Time or Status */}
              <div>
                <p className="text-sm text-gray-600 font-medium">Status</p>
                {selectedCheckIn.checkOutTime ? (
                  <div>
                    <p className="text-gray-900">Checked out: {format(selectedCheckIn.checkOutTime, 'h:mm a')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Duration: {Math.round((selectedCheckIn.checkOutTime.getTime() - selectedCheckIn.checkInTime.getTime()) / (1000 * 60))} minutes
                    </p>
                  </div>
                ) : (
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedCheckIn(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}