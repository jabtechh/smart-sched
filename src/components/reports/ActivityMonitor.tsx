import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ActivityLog {
  id: string;
  type: 'check-in' | 'check-out';
  professorName: string;
  roomName: string;
  courseCode?: string;
  timestamp: Date;
  duration?: number; // in minutes, for check-outs
  building?: string;
  floor?: string;
  scheduledStartTime?: Date; // for check-ins
  scheduledEndTime?: Date; // for check-ins
}

export default function ActivityMonitor() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // Get start of today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch all check-ins from today
        const checkInsRef = collection(db, 'checkIns');
        const q = query(
          checkInsRef,
          where('checkInTime', '>=', today)
        );

        const checkInsSnap = await getDocs(q);
        const activityList: ActivityLog[] = [];

        // Process each check-in
        for (const doc of checkInsSnap.docs) {
          const data = doc.data();
          const checkInTime = data.checkInTime.toDate();

          // Fetch professor name
          let professorName = 'Unknown Professor';
          try {
            const userRef = collection(db, 'users');
            const userQ = query(userRef);
            const userSnap = await getDocs(userQ);
            const user = userSnap.docs.find(u => u.id === data.userId);
            if (user?.exists()) {
              professorName = user.data().displayName || user.data().name || 'Unknown Professor';
            }
          } catch (err) {
            console.error('Error fetching professor:', err);
          }

          // Fetch course code and scheduled times
          let courseCode: string | undefined;
          let scheduledStartTime: Date | undefined;
          let scheduledEndTime: Date | undefined;
          try {
            const schedulesRef = collection(db, 'roomSchedules');
            const scheduleQ = query(
              schedulesRef,
              where('roomId', '==', data.roomId),
              where('status', '==', 'scheduled')
            );
            
            const scheduleSnap = await getDocs(scheduleQ);
            if (!scheduleSnap.empty) {
              const schedule = scheduleSnap.docs
                .map(schedDoc => ({ 
                  id: schedDoc.id, 
                  startTime: schedDoc.data().startTime,
                  endTime: schedDoc.data().endTime,
                  courseCode: schedDoc.data().courseCode
                }))
                .find(sched => {
                  const schedDate = sched.startTime.toDate();
                  return schedDate.toDateString() === checkInTime.toDateString();
                });
              
              if (schedule) {
                courseCode = schedule.courseCode;
                scheduledStartTime = schedule.startTime.toDate();
                scheduledEndTime = schedule.endTime.toDate();
              }
            }
          } catch (err) {
            console.error('Error fetching schedule:', err);
          }

          // Add check-in activity
          activityList.push({
            id: `checkin-${doc.id}`,
            type: 'check-in',
            professorName,
            roomName: data.roomName || 'Unknown Room',
            courseCode,
            timestamp: checkInTime,
            building: data.building,
            floor: data.floor,
            scheduledStartTime,
            scheduledEndTime,
          });

          // Add check-out activity if exists
          if (data.checkOutTime) {
            const checkOutTime = data.checkOutTime.toDate();
            const durationMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
            
            activityList.push({
              id: `checkout-${doc.id}`,
              type: 'check-out',
              professorName,
              roomName: data.roomName || 'Unknown Room',
              courseCode,
              timestamp: checkOutTime,
              duration: durationMinutes,
              building: data.building,
              floor: data.floor,
            });
          }
        }

        // Sort by timestamp descending (newest first)
        activityList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(activityList);
      } catch (err) {
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Today's Activity
        </h2>
      </div>

      <div className="divide-y divide-gray-200">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No check-in activity today
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                  activity.type === 'check-in'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-400 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Time and Action */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                      {activity.type === 'check-in' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-800">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          Checked IN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
                          <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                          Checked OUT
                        </span>
                      )}
                    </div>

                    {/* Professor Name */}
                    <p className="font-medium text-gray-900">{activity.professorName}</p>

                    {/* Course Code */}
                    {activity.courseCode && (
                      <p className="text-sm font-semibold text-primary">{activity.courseCode}</p>
                    )}

                    {/* Room Info */}
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <span>{activity.roomName}</span>
                      {activity.building && activity.floor && (
                        <>
                          <span>•</span>
                          <span>{activity.building}, Floor {activity.floor}</span>
                        </>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {activity.type === 'check-in' ? (
                        <>
                          <p>Checked in at: {format(activity.timestamp, 'h:mm a')}</p>
                          {activity.scheduledStartTime && activity.scheduledEndTime && (
                            <p>Reservation: {format(activity.scheduledStartTime, 'h:mm a')}-{format(activity.scheduledEndTime, 'h:mm a')}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p>Checked out at: {format(activity.timestamp, 'h:mm a')}</p>
                          {activity.duration && (
                            <p>Duration: {activity.duration} minutes</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="ml-4 flex-shrink-0">
                    {activity.type === 'check-in' ? (
                      <ArrowRightIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowRightIcon className="h-5 w-5 text-gray-400 transform rotate-180" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
