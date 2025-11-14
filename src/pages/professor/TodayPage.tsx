import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ClockIcon, XCircleIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
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
}

export default function TodayPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          checkInData.push({
            id: doc.id,
            roomId: data.roomId,
            roomName: data.roomName || 'Unknown Room',
            building: data.building || 'Unknown Building',
            floor: data.floor || 'Unknown Floor',
            checkInTime: checkInTime,
            checkOutTime: data.checkOutTime?.toDate(),
            status: data.status,
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
                <p className="text-sm text-gray-500">
                  Checked in at {format(activeCheckIn.checkInTime, 'h:mm a')}
                </p>
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
              <div key={checkIn.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{checkIn.roomName}</h3>
                    <p className="text-sm text-gray-600">{checkIn.building}, Floor {checkIn.floor}</p>
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
    </div>
  );
}