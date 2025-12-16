import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { DocumentArrowDownIcon, CalendarIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import ReportFilters from '@/components/reports/ReportFilters';
import type { ReportFilters as ReportFiltersType } from '@/components/reports/ReportFilters';
import { exportToPDF } from '@/utils/pdfExport';
import { toast } from 'react-hot-toast';

interface MyReservation {
  id: string;
  roomId: string;
  roomName: string;
  courseCode: string;
  startTime: Date;
  endTime: Date;
  status: string;
}

interface MyCheckIn {
  id: string;
  roomName: string;
  checkInTime: Date;
  checkOutTime?: Date;
  duration: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'reservations' | 'checkins'>('reservations');
  const [filters, setFilters] = useState<ReportFiltersType>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    selectedRooms: []
  });
  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [checkIns, setCheckIns] = useState<MyCheckIn[]>([]);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all my reservations (without date range in query to avoid composite index)
        const schedulesRef = collection(db, 'roomSchedules');
        console.log('Querying roomSchedules for professorId:', auth.currentUser!.uid);
        console.log('Date range:', filters.startDate, 'to', filters.endDate);
        
        const reservationsQuery = query(
          schedulesRef,
          where('professorId', '==', auth.currentUser!.uid)
        );

        const reservationsSnap = await getDocs(reservationsQuery);
        console.log('Retrieved all reservations:', reservationsSnap.docs.length);
        
        // Filter by date in client code to avoid needing composite index
        const myReservations: MyReservation[] = reservationsSnap.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              roomId: data.roomId,
              roomName: data.roomName || 'Unknown Room',
              courseCode: data.courseCode,
              startTime: data.startTime.toDate(),
              endTime: data.endTime.toDate(),
              status: data.status
            };
          })
          .filter(r => 
            r.startTime >= filters.startDate && 
            r.startTime <= filters.endDate
          );
        
        myReservations.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        setReservations(myReservations);

        // Fetch my check-ins
        const checkInsRef = collection(db, 'checkIns');
        const checkInsQuery = query(
          checkInsRef,
          where('userId', '==', auth.currentUser!.uid)
        );

        const checkInsSnap = await getDocs(checkInsQuery);
        const myCheckIns: MyCheckIn[] = [];

        for (const doc of checkInsSnap.docs) {
          const data = doc.data();
          const checkInTime = data.checkInTime.toDate();
          
          // Filter by date range
          if (checkInTime >= filters.startDate && checkInTime <= filters.endDate) {
            const checkOutTime = data.checkOutTime?.toDate();
            const duration = checkOutTime 
              ? Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60))
              : 0;

            myCheckIns.push({
              id: doc.id,
              roomName: data.roomName || 'Unknown Room',
              checkInTime: checkInTime,
              checkOutTime: checkOutTime,
              duration: duration
            });
          }
        }

        myCheckIns.sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
        setCheckIns(myCheckIns);
      } catch (error) {
        console.error('Error fetching reports data:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        toast.error(`Failed to load reports: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleExportPDF = () => {
    const tabNames = {
      reservations: 'My Reservations',
      checkins: 'My Check-ins'
    };

    const sections = [
      {
        heading: 'Report Period',
        content: `${format(filters.startDate, 'MMM dd, yyyy')} to ${format(filters.endDate, 'MMM dd, yyyy')}`
      },
      {
        heading: 'Summary',
        content: activeTab === 'reservations'
          ? `Total Reservations: ${reservations.length}`
          : `Total Check-ins: ${checkIns.length}`
      }
    ];

    if (activeTab === 'reservations') {
      sections.push({
        heading: 'Reservations',
        content: reservations.length > 0
          ? reservations.map(r => `${r.roomName} - ${r.courseCode} (${format(r.startTime, 'MMM dd h:mm a')} to ${format(r.endTime, 'h:mm a')} - ${r.status})`).join('\n')
          : 'No reservations in this period'
      });
    } else {
      sections.push({
        heading: 'Check-ins',
        content: checkIns.length > 0
          ? checkIns.map(c => `${c.roomName} - ${format(c.checkInTime, 'MMM dd h:mm a')} (${c.duration || '0'} mins)`).join('\n')
          : 'No check-ins in this period'
      });
    }

    exportToPDF({
      title: tabNames[activeTab],
      date: format(new Date(), 'MMM dd, yyyy h:mm a'),
      sections: sections
    });

    toast.success(`${tabNames[activeTab]} exported as PDF`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const tabs = [
    { id: 'reservations' as const, label: 'My Reservations', icon: '📅' },
    { id: 'checkins' as const, label: 'My Check-ins', icon: '✓' }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
            <p className="text-gray-600 mt-1">View your reservations and check-in history</p>
          </div>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export PDF
          </button>
        </div>

        {/* Filters */}
        <ReportFilters rooms={[]} onFilterChange={setFilters} />
      </div>

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Total Reservations Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Reservations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{reservations.length}</p>
              </div>
              <CalendarIcon className="h-12 w-12 text-blue-100" />
            </div>
          </div>

          {/* Total Check-ins Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Check-ins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{checkIns.length}</p>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-100" />
            </div>
          </div>

          {/* Total Hours Utilized Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Hours</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {Math.floor(checkIns.reduce((sum, c) => sum + c.duration, 0) / 60)}h
                </p>
              </div>
              <ClockIcon className="h-12 w-12 text-orange-100" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === 'reservations' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {reservations.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No reservations found in the selected date range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Course Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Start Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">End Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reservations.map((reservation) => (
                      <tr key={reservation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{reservation.roomName}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{reservation.courseCode}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {format(reservation.startTime, 'MMM dd, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {format(reservation.endTime, 'h:mm a')}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {checkIns.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No check-ins found in the selected date range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Check-in Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {checkIns.map((checkIn) => (
                      <tr key={checkIn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{checkIn.roomName}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {format(checkIn.checkInTime, 'MMM dd, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {checkIn.duration > 0 ? formatDuration(checkIn.duration) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}