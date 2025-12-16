import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { CalendarIcon, ClockIcon, CheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import type { ReportFilters } from './ReportFilters';
import { autoCompleteExpiredReservations, forceCompleteReservation } from '@/utils/reservationStatusService';

interface ReservationStats {
  totalBookings: number;
  activeRooms: number;
  upcomingReservations: number;
  completedReservations: number;
}

interface ReservationDashboardProps {
  filters: ReportFilters;
}

export default function ReservationDashboard({ filters }: ReservationDashboardProps) {
  const [stats, setStats] = useState<ReservationStats>({
    totalBookings: 0,
    activeRooms: 0,
    upcomingReservations: 0,
    completedReservations: 0
  });
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [forcingComplete, setForcingComplete] = useState<string | null>(null);
  const db = getFirestore();

  useEffect(() => {
    const fetchReservationData = async () => {
      try {
        setLoading(true);
        
        // First, auto-complete expired reservations
        try {
          await autoCompleteExpiredReservations();
        } catch (err) {
          console.warn('Auto-complete check completed', err);
        }

        const schedulesRef = collection(db, 'roomSchedules');
        const q = query(
          schedulesRef,
          where('startTime', '>=', Timestamp.fromDate(filters.startDate)),
          where('startTime', '<=', Timestamp.fromDate(filters.endDate))
        );

        const querySnapshot = await getDocs(q);
        const allSchedules = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            roomId: data.roomId,
            startTime: data.startTime,
            endTime: data.endTime,
            status: data.status,
            courseCode: data.courseCode,
            professorId: data.professorId,
            ...data
          };
        });

        // Filter by room selection if any
        const filtered = filters.selectedRooms.length > 0
          ? allSchedules.filter(s => filters.selectedRooms.includes(s.roomId))
          : allSchedules;

        const now = new Date();
        const activeRoomIds = new Set<string>();
        let upcoming = 0;
        let completed = 0;

        filtered.forEach(schedule => {
          const startTime = schedule.startTime.toDate();
          const endTime = schedule.endTime.toDate();

          if (startTime <= now && endTime >= now) {
            activeRoomIds.add(schedule.roomId);
          }

          if (startTime > now && schedule.status !== 'cancelled') {
            upcoming++;
          }

          if (schedule.status === 'completed') {
            completed++;
          }
        });

        setStats({
          totalBookings: filtered.length,
          activeRooms: activeRoomIds.size,
          upcomingReservations: upcoming,
          completedReservations: completed
        });

        // Get top 10 recent reservations
        const recent = filtered
          .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis())
          .slice(0, 10);

        setRecentReservations(recent);
      } catch (error) {
        console.error('Error fetching reservation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationData();
  }, [filters]);

  const handleForceComplete = async (reservationId: string) => {
    try {
      setForcingComplete(reservationId);
      await forceCompleteReservation(reservationId);
      
      // Refresh data
      const schedulesRef = collection(db, 'roomSchedules');
      const q = query(
        schedulesRef,
        where('startTime', '>=', Timestamp.fromDate(filters.startDate)),
        where('startTime', '<=', Timestamp.fromDate(filters.endDate))
      );

      const querySnapshot = await getDocs(q);
      const allSchedules = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          roomId: data.roomId,
          startTime: data.startTime,
          endTime: data.endTime,
          status: data.status,
          courseCode: data.courseCode,
          professorId: data.professorId,
          ...data
        };
      });

      const filtered = filters.selectedRooms.length > 0
        ? allSchedules.filter(s => filters.selectedRooms.includes(s.roomId))
        : allSchedules;

      const recent = filtered
        .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis())
        .slice(0, 10);

      setRecentReservations(recent);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setForcingComplete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings.toString(),
      icon: CalendarIcon,
      color: 'blue'
    },
    {
      title: 'Active Rooms',
      value: stats.activeRooms.toString(),
      icon: CheckIcon,
      color: 'green'
    },
    {
      title: 'Upcoming',
      value: stats.upcomingReservations.toString(),
      icon: ClockIcon,
      color: 'purple'
    },
    {
      title: 'Completed',
      value: stats.completedReservations.toString(),
      icon: CheckIcon,
      color: 'gray'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-600' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div>
      {/* Summary Cards */}
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

      {/* Recent Reservations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reservations</h3>
        </div>
        
        {recentReservations.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No reservations found in the selected date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Professor ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Course Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">End Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{reservation.roomId.substring(0, 8)}...</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{reservation.professorId.substring(0, 8)}...</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{reservation.courseCode}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {format(reservation.startTime.toDate(), 'MMM dd, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {format(reservation.endTime.toDate(), 'h:mm a')}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reservation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        reservation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {reservation.status === 'scheduled' && (
                        <button
                          onClick={() => handleForceComplete(reservation.id)}
                          disabled={forcingComplete === reservation.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mark reservation as completed"
                        >
                          {forcingComplete === reservation.id ? (
                            <>
                              <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                              Completing...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-3 h-3" />
                              Complete
                            </>
                          )}
                        </button>
                      )}
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
