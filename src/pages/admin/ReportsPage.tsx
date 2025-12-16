import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { DocumentArrowDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import ptcLogo from "@/assets/ptc_logo.jpg";
import ReportFilters from '@/components/reports/ReportFilters';
import type { ReportFilters as ReportFiltersType } from '@/components/reports/ReportFilters';
import ReservationDashboard from '@/components/reports/ReservationDashboard';
import CheckInAnalytics from '@/components/reports/CheckInAnalytics';
import RoomUtilization from '@/components/reports/RoomUtilization';
import ActivityMonitor from '@/components/reports/ActivityMonitor';
import ReservationGracePeriodWarnings from '@/components/reports/ReservationGracePeriodWarnings';
import { exportToPDF } from '@/utils/pdfExport';
import { autoCompleteExpiredReservations } from '@/utils/reservationStatusService';
import { toast } from 'react-hot-toast';

type ReportTab = 'reservations' | 'checkins' | 'rooms' | 'activity';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('activity');
  const [filters, setFilters] = useState<ReportFiltersType>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    selectedRooms: []
  });
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [autoCompleting, setAutoCompleting] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const roomsRef = collection(db, 'rooms');
        const roomsSnap = await getDocs(roomsRef);
        const roomsList = roomsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unknown Room'
        }));
        setRooms(roomsList);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  const handleAutoCompleteReservations = async () => {
    try {
      setAutoCompleting(true);
      const updates = await autoCompleteExpiredReservations();
      
      if (updates.length > 0) {
        toast.success(`✓ Auto-completed ${updates.length} reservation(s)`);
      } else {
        toast.success('✓ No expired reservations to complete');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to auto-complete reservations');
    } finally {
      setAutoCompleting(false);
    }
  };

  // Helper to convert image to base64 data URL
  const imageToDataURL = (imagePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = imagePath;
    });
  };

  const handleExportPDF = async () => {
    const tabNames: Record<ReportTab, string> = {
      activity: 'Activity Monitor',
      reservations: 'Reservation Dashboard',
      checkins: 'Check-in Analytics',
      rooms: 'Room Utilization'
    };

    // Convert logo to data URL
    let logoDataURL = '';
    try {
      logoDataURL = await imageToDataURL(ptcLogo);
    } catch (err) {
      console.warn('Could not load logo image:', err);
    }

    // If exporting Activity Monitor, fetch and format the data
    if (activeTab === 'activity') {
      try {
        // Use filters date range
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);

        const checkInsRef = collection(db, 'checkIns');
        const q = query(
          checkInsRef,
          where('checkInTime', '>=', startDate),
          where('checkInTime', '<=', filters.endDate)
        );

        const checkInsSnap = await getDocs(q);
        const activityData: Array<{
          date: string;
          room: string;
          professor: string;
          schedule: string;
          checkIn: string;
          subject: string;
        }> = [];

        for (const doc of checkInsSnap.docs) {
          const data = doc.data();
          const checkInTime = data.checkInTime.toDate();

          // Fetch professor name
          let professorName = 'Unknown';
          try {
            const userRef = collection(db, 'users');
            const userQ = query(userRef);
            const userSnap = await getDocs(userQ);
            const user = userSnap.docs.find(u => u.id === data.userId);
            if (user?.exists()) {
              professorName = user.data().displayName || user.data().name || 'Unknown';
            }
          } catch (err) {
            console.error('Error fetching professor:', err);
          }

          // Fetch course code and schedule - get ALL schedules for this room and date
          let courseCode = 'N/A';
          let scheduleTime = 'N/A';
          try {
            const schedulesRef = collection(db, 'roomSchedules');
            const scheduleQ = query(
              schedulesRef,
              where('roomId', '==', data.roomId)
            );
            
            const scheduleSnap = await getDocs(scheduleQ);
            if (!scheduleSnap.empty) {
              // Find schedule that matches the check-in date
              const matchedSchedule = scheduleSnap.docs.find(schedDoc => {
                const schedData = schedDoc.data();
                if (!schedData.startTime) return false;
                const schedDate = schedData.startTime.toDate();
                return schedDate.toDateString() === checkInTime.toDateString();
              });
              
              if (matchedSchedule) {
                const schedData = matchedSchedule.data();
                courseCode = schedData.courseCode || 'N/A';
                scheduleTime = `${format(schedData.startTime.toDate(), 'h:mm a')} - ${format(schedData.endTime.toDate(), 'h:mm a')}`;
              }
            }
          } catch (err) {
            console.error('Error fetching schedule:', err);
          }

          activityData.push({
            date: format(checkInTime, 'MMM dd, yyyy'),
            room: data.roomName || 'Unknown Room',
            professor: professorName,
            schedule: scheduleTime,
            checkIn: format(checkInTime, 'h:mm a'),
            subject: courseCode
          });
        }

        // Create table HTML
        const tableHTML = `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #d1d5db;">DATE</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #d1d5db;">ROOM</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #d1d5db;">PROF NAME</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #d1d5db;">SCHEDULE</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #d1d5db;">CHECK IN</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">SUBJECT</th>
              </tr>
            </thead>
            <tbody>
              ${activityData.map((row, idx) => `
                <tr style="border-bottom: 1px solid #e5e7eb; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                  <td style="padding: 10px; border-right: 1px solid #e5e7eb;">${row.date}</td>
                  <td style="padding: 10px; border-right: 1px solid #e5e7eb;">${row.room}</td>
                  <td style="padding: 10px; border-right: 1px solid #e5e7eb;">${row.professor}</td>
                  <td style="padding: 10px; border-right: 1px solid #e5e7eb;">${row.schedule}</td>
                  <td style="padding: 10px; border-right: 1px solid #e5e7eb;">${row.checkIn}</td>
                  <td style="padding: 10px;">${row.subject}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

        const dateRangeText = filters.startDate.toDateString() === filters.endDate.toDateString()
          ? `on ${format(filters.startDate, 'MMM dd, yyyy')}`
          : `from ${format(filters.startDate, 'MMM dd, yyyy')} to ${format(filters.endDate, 'MMM dd, yyyy')}`;

        exportToPDF({
          title: `Activity Monitor ${dateRangeText}`,
          date: format(new Date(), 'MMM dd, yyyy h:mm a'),
          logo: logoDataURL,
          sections: [
            {
              heading: `Check-in Activity ${dateRangeText}`,
              content: tableHTML,
              isHTML: true
            },
            {
              heading: 'Summary',
              content: `Total Records: ${activityData.length}`
            }
          ]
        });

        toast.success('Activity Monitor exported as PDF');
      } catch (err) {
        console.error('Error exporting activity:', err);
        toast.error('Failed to export activity data');
      }
      return;
    }

    // For other tabs, use the original logic
    const sections = [
      {
        heading: 'Report Period',
        content: `${format(filters.startDate, 'MMM dd, yyyy')} to ${format(filters.endDate, 'MMM dd, yyyy')}`
      },
      {
        heading: 'Filters Applied',
        content: filters.selectedRooms.length > 0 
          ? `Rooms: ${filters.selectedRooms.join(', ')}`
          : 'All rooms included'
      }
    ];

    exportToPDF({
      title: tabNames[activeTab],
      date: format(new Date(), 'MMM dd, yyyy h:mm a'),
      logo: logoDataURL,
      sections: sections
    });

    toast.success(`${tabNames[activeTab]} exported as PDF`);
  };

  const tabs = [
    { id: 'activity' as const, label: 'Activity Monitor', icon: '⏱' },
    { id: 'reservations' as const, label: 'Reservation Dashboard', icon: '📅' },
    { id: 'checkins' as const, label: 'Check-in Analytics', icon: '✓' },
    { id: 'rooms' as const, label: 'Room Utilization', icon: '🏢' }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <ReservationGracePeriodWarnings />
      
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">View and analyze facility usage, check-ins, and reservations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        {!loadingRooms && <ReportFilters rooms={rooms} onFilterChange={setFilters} />}
      </div>

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
        {activeTab === 'activity' && <ActivityMonitor />}
        {activeTab === 'reservations' && <ReservationDashboard filters={filters} />}
        {activeTab === 'checkins' && <CheckInAnalytics filters={filters} />}
        {activeTab === 'rooms' && <RoomUtilization filters={filters} />}
      </div>
    </div>
  );
}