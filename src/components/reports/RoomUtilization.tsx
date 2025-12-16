import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { BuildingOfficeIcon, UsersIcon } from '@heroicons/react/24/outline';
import { format, differenceInMinutes } from 'date-fns';
import type { ReportFilters } from './ReportFilters';

interface RoomUsage {
  roomId: string;
  roomName: string;
  building: string;
  floor: string;
  totalHours: number;
  bookingCount: number;
  utilizationPercentage: number;
  lastUsed: Date | null;
}

interface RoomUtilizationProps {
  filters: ReportFilters;
}

export default function RoomUtilization({ filters }: RoomUtilizationProps) {
  const [rooms, setRooms] = useState<RoomUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageUtilization, setAverageUtilization] = useState(0);
  const db = getFirestore();

  useEffect(() => {
    const fetchRoomUtilization = async () => {
      try {
        setLoading(true);
        
        // Get all schedules in the date range
        const schedulesRef = collection(db, 'roomSchedules');
        const q = query(
          schedulesRef,
          where('startTime', '>=', Timestamp.fromDate(filters.startDate)),
          where('startTime', '<=', Timestamp.fromDate(filters.endDate))
        );

        const querySnapshot = await getDocs(q);
        const roomUsageMap: Record<string, RoomUsage> = {};

        // Get all unique rooms
        const roomIds = new Set<string>();
        const schedules = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            roomId: data.roomId,
            startTime: data.startTime,
            endTime: data.endTime,
            ...data
          };
        });

        for (const schedule of schedules) {
          roomIds.add(schedule.roomId);
        }

        // Fetch room details
        const roomsRef = collection(db, 'rooms');
        const allRoomsSnap = await getDocs(roomsRef);
        
        for (const roomDoc of allRoomsSnap.docs) {
          const roomData = roomDoc.data();
          roomUsageMap[roomDoc.id] = {
            roomId: roomDoc.id,
            roomName: roomData.name || 'Unknown Room',
            building: roomData.building || 'Unknown Building',
            floor: roomData.floor || 'Unknown Floor',
            totalHours: 0,
            bookingCount: 0,
            utilizationPercentage: 0,
            lastUsed: null
          };
        }

        // Calculate usage for filtered schedules
        for (const schedule of schedules) {
          // Filter by room selection if any
          if (filters.selectedRooms.length > 0 && !filters.selectedRooms.includes(schedule.roomId)) {
            continue;
          }

          if (roomUsageMap[schedule.roomId]) {
            const startTime = schedule.startTime.toDate();
            const endTime = schedule.endTime.toDate();
            const durationHours = differenceInMinutes(endTime, startTime) / 60;

            roomUsageMap[schedule.roomId].totalHours += durationHours;
            roomUsageMap[schedule.roomId].bookingCount += 1;

            // Update last used
            if (!roomUsageMap[schedule.roomId].lastUsed || 
                startTime > roomUsageMap[schedule.roomId].lastUsed!) {
              roomUsageMap[schedule.roomId].lastUsed = startTime;
            }
          }
        }

        // Calculate utilization percentage
        // Assuming a room should be used 8 hours per day on average for 100%
        const daysInRange = differenceInMinutes(filters.endDate, filters.startDate) / (60 * 24);
        const maxHoursPerRoom = daysInRange * 8; // 8 hours per day

        const roomList = Object.values(roomUsageMap);
        let totalUtilization = 0;
        let utilizableRooms = 0;

        roomList.forEach(room => {
          if (room.bookingCount > 0) {
            room.utilizationPercentage = Math.min(100, Math.round((room.totalHours / maxHoursPerRoom) * 100));
            totalUtilization += room.utilizationPercentage;
            utilizableRooms++;
          }
        });

        if (utilizableRooms > 0) {
          setAverageUtilization(Math.round(totalUtilization / utilizableRooms));
        }

        // Sort by utilization descending
        roomList.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
        setRooms(roomList);
      } catch (error) {
        console.error('Error fetching room utilization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomUtilization();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Average Utilization</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{averageUtilization}%</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Rooms</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{rooms.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Rooms Used</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {rooms.filter(r => r.bookingCount > 0).length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <UsersIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Room Details Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Room Utilization Details</h3>
        </div>

        {rooms.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No rooms found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Room Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hours Used</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Utilization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Last Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rooms.map((room) => (
                  <tr key={room.roomId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{room.roomName}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {room.building}, Floor {room.floor}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{room.bookingCount}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{room.totalHours.toFixed(1)}h</td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`${getUtilizationColor(room.utilizationPercentage)} h-2 rounded-full transition-all`}
                            style={{ width: `${room.utilizationPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">
                          {room.utilizationPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {room.lastUsed 
                        ? format(room.lastUsed, 'MMM dd, yyyy')
                        : 'Never'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
