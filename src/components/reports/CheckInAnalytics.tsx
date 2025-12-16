import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { UserIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import type { ReportFilters } from './ReportFilters';

interface CheckInRecord {
  id: string;
  userId: string;
  userEmail: string;
  roomId: string;
  roomName: string;
  building: string;
  floor: string;
  checkInTime: Date;
  checkOutTime?: Date;
  duration: number; // in minutes
  status: 'active' | 'completed';
}

interface CheckInStats {
  totalCheckIns: number;
  totalUsers: number;
  averageDuration: number;
  mostUsedRoom: string;
}

interface CheckInAnalyticsProps {
  filters: ReportFilters;
}

export default function CheckInAnalytics({ filters }: CheckInAnalyticsProps) {
  const [stats, setStats] = useState<CheckInStats>({
    totalCheckIns: 0,
    totalUsers: 0,
    averageDuration: 0,
    mostUsedRoom: ''
  });
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchCheckInData = async () => {
      try {
        setLoading(true);
        const checkInsRef = collection(db, 'checkIns');
        const q = query(
          checkInsRef,
          where('checkInTime', '>=', Timestamp.fromDate(filters.startDate)),
          where('checkInTime', '<=', Timestamp.fromDate(filters.endDate))
        );

        const querySnapshot = await getDocs(q);
        const allCheckIns: CheckInRecord[] = [];
        const userIds = new Set<string>();
        const roomCounts: Record<string, number> = {};
        let totalDuration = 0;

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          
          // Filter by room selection if any
          if (filters.selectedRooms.length > 0 && !filters.selectedRooms.includes(data.roomId)) {
            continue;
          }

          const checkInTime = data.checkInTime.toDate();
          const checkOutTime = data.checkOutTime?.toDate();
          
          let duration = 0;
          if (checkOutTime) {
            duration = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
          }

          userIds.add(data.userId);
          roomCounts[data.roomName] = (roomCounts[data.roomName] || 0) + 1;
          totalDuration += duration;

          allCheckIns.push({
            id: docSnap.id,
            userId: data.userId,
            userEmail: data.userEmail || 'Unknown',
            roomId: data.roomId,
            roomName: data.roomName || 'Unknown Room',
            building: data.building || 'Unknown Building',
            floor: data.floor || 'Unknown Floor',
            checkInTime: checkInTime,
            checkOutTime: checkOutTime,
            duration: duration,
            status: data.status
          });
        }

        const mostUsedRoom = Object.entries(roomCounts).reduce(
          (max, [room, count]) => count > max.count ? { room, count } : max,
          { room: 'N/A', count: 0 }
        ).room;

        const averageDuration = allCheckIns.length > 0 
          ? Math.round(totalDuration / allCheckIns.length)
          : 0;

        setStats({
          totalCheckIns: allCheckIns.length,
          totalUsers: userIds.size,
          averageDuration: averageDuration,
          mostUsedRoom: mostUsedRoom
        });

        // Sort by check-in time descending
        allCheckIns.sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
        setCheckIns(allCheckIns.slice(0, 20)); // Show top 20
      } catch (error) {
        console.error('Error fetching check-in data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckInData();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const statCards = [
    {
      title: 'Total Check-ins',
      value: stats.totalCheckIns.toString(),
      icon: ClockIcon,
      color: 'blue'
    },
    {
      title: 'Unique Users',
      value: stats.totalUsers.toString(),
      icon: UserIcon,
      color: 'green'
    },
    {
      title: 'Avg Duration',
      value: formatDuration(stats.averageDuration),
      icon: ClockIcon,
      color: 'purple'
    },
    {
      title: 'Most Used Room',
      value: stats.mostUsedRoom === 'N/A' ? 'N/A' : stats.mostUsedRoom.substring(0, 10),
      icon: MapPinIcon,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${colors.bg} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Check-in Details Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Check-ins</h3>
        </div>

        {checkIns.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No check-ins found in the selected date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">User Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Check-in Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {checkIns.map((checkIn) => (
                  <tr key={checkIn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{checkIn.userEmail}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{checkIn.roomName}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{checkIn.building}, Floor {checkIn.floor}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {format(checkIn.checkInTime, 'MMM dd, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {checkIn.duration > 0 ? formatDuration(checkIn.duration) : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        checkIn.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {checkIn.status}
                      </span>
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
