import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { format, parseISO, addWeeks } from 'date-fns';
import { toast } from 'react-hot-toast';
import { PlusIcon, CalendarIcon, ClockIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import type { Room } from '@/types/room';

interface RoomSchedule {
  id: string;
  roomId: string;
  professorId: string;
  courseCode: string;
  startTime: Timestamp;
  endTime: Timestamp;
  recurringType: 'none' | 'daily' | 'weekly';
  status: 'scheduled' | 'cancelled' | 'completed';
  room?: {
    name: string;
    building: string;
    floor: string;
  };
}

interface ReservationFormData {
  roomId: string;
  courseCode: string;
  date: string;
  startTime: string;
  endTime: string;
  recurringType: RoomSchedule['recurringType'];
}

export default function ReservationPage() {
  const [schedules, setSchedules] = useState<RoomSchedule[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ReservationFormData>({
    roomId: '',
    courseCode: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '09:30',
    recurringType: 'none'
  });

  const auth = getAuth();
  const db = getFirestore();

  const fetchSchedules = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const schedulesRef = collection(db, 'roomSchedules');
      const q = query(
        schedulesRef,
        where('professorId', '==', auth.currentUser.uid),
        where('status', '!=', 'cancelled')
      );

      const querySnapshot = await getDocs(q);
      const schedulesData: RoomSchedule[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as RoomSchedule;
        // Get room details
        const roomSnap = await getDoc(doc(db, 'rooms', data.roomId));
        const roomData = roomSnap.data() as Room;

        schedulesData.push({
          ...data,
          id: docSnap.id,
          room: {
            name: roomData.name,
            building: roomData.building,
            floor: roomData.floor
          }
        });
      }

      // Sort by start time
      schedulesData.sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis());
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const roomsRef = collection(db, 'rooms');
      const roomsSnap = await getDocs(roomsRef);
      setRooms(roomsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchSchedules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      const startDateTime = parseISO(`${formData.date}T${formData.startTime}`);
      const endDateTime = parseISO(`${formData.date}T${formData.endTime}`);

      // Validate times
      if (endDateTime <= startDateTime) {
        toast.error('End time must be after start time');
        return;
      }

      // Check for conflicts
      const conflictQuery = query(
        collection(db, 'roomSchedules'),
        where('roomId', '==', formData.roomId),
        where('status', '==', 'scheduled')
      );

      const conflicts = await getDocs(conflictQuery);
      const hasConflict = conflicts.docs.some(doc => {
        const schedule = doc.data();
        const scheduleStart = schedule.startTime.toDate();
        const scheduleEnd = schedule.endTime.toDate();
        return (
          (startDateTime >= scheduleStart && startDateTime < scheduleEnd) ||
          (endDateTime > scheduleStart && endDateTime <= scheduleEnd)
        );
      });

      if (hasConflict) {
        toast.error('This time slot is already booked');
        return;
      }

      // Create schedule
      await addDoc(collection(db, 'roomSchedules'), {
        roomId: formData.roomId,
        professorId: auth.currentUser.uid,
        courseCode: formData.courseCode,
        startTime: Timestamp.fromDate(startDateTime),
        endTime: Timestamp.fromDate(endDateTime),
        recurringType: formData.recurringType,
        status: 'scheduled',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // If recurring, create future instances
      if (formData.recurringType === 'weekly') {
        const futurePromises = Array.from({ length: 15 }).map((_, i) => {
          const futureStart = addWeeks(startDateTime, i + 1);
          const futureEnd = addWeeks(endDateTime, i + 1);
          
          return addDoc(collection(db, 'roomSchedules'), {
            roomId: formData.roomId,
            professorId: auth.currentUser.uid,
            courseCode: formData.courseCode,
            startTime: Timestamp.fromDate(futureStart),
            endTime: Timestamp.fromDate(futureEnd),
            recurringType: formData.recurringType,
            status: 'scheduled',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        });

        await Promise.all(futurePromises);
      }

      toast.success('Reservation created successfully');
      setIsModalOpen(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Failed to create reservation');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Room Reservations</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Reservation
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reservations found. Click "New Reservation" to create one.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <li key={schedule.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-sm font-medium text-primary truncate">
                          {schedule.room?.name} - {schedule.courseCode}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5" />
                        <p>
                          {format(schedule.startTime.toDate(), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5" />
                        <p>
                          {format(schedule.startTime.toDate(), 'h:mm a')} - {format(schedule.endTime.toDate(), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        schedule.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {schedule.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* New Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">New Reservation</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <select
                    required
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} - {room.building}, Floor {room.floor}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Course Code</label>
                  <select
                    required
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">Select a course</option>
                    <option value="System Analysis and Design">System Analysis and Design</option>
                    <option value="Database Management">Database Management</option>
                    <option value="Capstone">Capstone</option>
                    <option value="Introduction to Web Technological">Introduction to Web Technological</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Recurring</label>
                  <select
                    value={formData.recurringType}
                    onChange={(e) => setFormData({ ...formData, recurringType: e.target.value as RoomSchedule['recurringType'] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="none">One-time only</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Create Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}