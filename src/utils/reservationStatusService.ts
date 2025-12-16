import { getFirestore, collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export interface ReservationStatusUpdate {
  reservationId: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
}

/**
 * Auto-complete reservations that have passed their end time
 */
export const autoCompleteExpiredReservations = async (): Promise<ReservationStatusUpdate[]> => {
  const db = getFirestore();
  const updates: ReservationStatusUpdate[] = [];

  try {
    const schedulesRef = collection(db, 'roomSchedules');
    const q = query(
      schedulesRef,
      where('status', '==', 'scheduled')
    );

    const querySnapshot = await getDocs(q);
    const now = new Date();

    for (const docSnap of querySnapshot.docs) {
      const schedule = docSnap.data();
      const endTime = schedule.endTime.toDate();

      // If end time has passed, mark as completed
      if (endTime < now) {
        await updateDoc(doc(db, 'roomSchedules', docSnap.id), {
          status: 'completed',
          updatedAt: Timestamp.now(),
          autoCompletedAt: Timestamp.now()
        });

        updates.push({
          reservationId: docSnap.id,
          oldStatus: 'scheduled',
          newStatus: 'completed',
          reason: 'Auto-completed: End time passed'
        });
      }
    }

    return updates;
  } catch (error) {
    console.error('Error auto-completing reservations:', error);
    throw error;
  }
};

/**
 * Manually force complete a reservation (admin action)
 */
export const forceCompleteReservation = async (reservationId: string): Promise<void> => {
  const db = getFirestore();

  try {
    await updateDoc(doc(db, 'roomSchedules', reservationId), {
      status: 'completed',
      updatedAt: Timestamp.now(),
      forcedCompletedAt: Timestamp.now(),
      forcedCompletedByAdmin: true
    });

    toast.success('Reservation marked as completed');
  } catch (error) {
    console.error('Error force completing reservation:', error);
    toast.error('Failed to complete reservation');
    throw error;
  }
};

/**
 * Check for reservation conflicts and auto-complete blocking ones
 */
export const detectAndResolveConflicts = async (roomId: string): Promise<ReservationStatusUpdate[]> => {
  const db = getFirestore();
  const updates: ReservationStatusUpdate[] = [];

  try {
    const schedulesRef = collection(db, 'roomSchedules');
    const q = query(
      schedulesRef,
      where('roomId', '==', roomId),
      where('status', '==', 'scheduled')
    );

    const querySnapshot = await getDocs(q);
    const now = new Date();
    const activeReservations = [];
    const expiredReservations = [];

    // Separate active and expired
    for (const docSnap of querySnapshot.docs) {
      const schedule = docSnap.data();
      const startTime = schedule.startTime.toDate();
      const endTime = schedule.endTime.toDate();

      if (startTime <= now && endTime >= now) {
        activeReservations.push({ id: docSnap.id, ...schedule });
      } else if (endTime < now) {
        expiredReservations.push({ id: docSnap.id, ...schedule });
      }
    }

    // If there are expired ones, auto-complete them
    for (const expired of expiredReservations) {
      await updateDoc(doc(db, 'roomSchedules', expired.id), {
        status: 'completed',
        updatedAt: Timestamp.now(),
        autoCompletedAt: Timestamp.now(),
        resolvedConflict: true
      });

      updates.push({
        reservationId: expired.id,
        oldStatus: 'scheduled',
        newStatus: 'completed',
        reason: 'Auto-completed due to conflict detection'
      });
    }

    return updates;
  } catch (error) {
    console.error('Error detecting conflicts:', error);
    throw error;
  }
};

/**
 * Get reservations that should show grace period warning (ending soon)
 */
export const getReservationsEndingSoon = async (minutesUntilEnd: number = 10): Promise<any[]> => {
  const db = getFirestore();

  try {
    const schedulesRef = collection(db, 'roomSchedules');
    const q = query(
      schedulesRef,
      where('status', '==', 'scheduled')
    );

    const querySnapshot = await getDocs(q);
    const now = new Date();
    const endingSoon: any[] = [];
    const warningThreshold = minutesUntilEnd * 60 * 1000; // Convert to milliseconds

    for (const docSnap of querySnapshot.docs) {
      const schedule = docSnap.data();
      const endTime = schedule.endTime.toDate();
      const timeUntilEnd = endTime.getTime() - now.getTime();

      // If ending within threshold and hasn't already been warned
      if (timeUntilEnd > 0 && timeUntilEnd < warningThreshold && !schedule.warningShown) {
        endingSoon.push({
          id: docSnap.id,
          ...schedule,
          minutesRemaining: Math.ceil(timeUntilEnd / (60 * 1000))
        });
      }
    }

    return endingSoon;
  } catch (error) {
    console.error('Error getting ending soon reservations:', error);
    return [];
  }
};

/**
 * Mark a reservation warning as shown
 */
export const markWarningAsShown = async (reservationId: string): Promise<void> => {
  const db = getFirestore();

  try {
    await updateDoc(doc(db, 'roomSchedules', reservationId), {
      warningShown: true,
      warningShownAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking warning:', error);
  }
};

/**
 * Get reservations starting soon for professor (next 30 mins)
 */
export const getProfessorReservationsStartingSoon = async (professorId: string): Promise<any[]> => {
  const db = getFirestore();

  try {
    const schedulesRef = collection(db, 'roomSchedules');
    const q = query(
      schedulesRef,
      where('professorId', '==', professorId),
      where('status', '==', 'scheduled')
    );

    const querySnapshot = await getDocs(q);
    const now = new Date();
    const startingSoon: any[] = [];
    const threshold = 30 * 60 * 1000; // 30 minutes in milliseconds

    for (const docSnap of querySnapshot.docs) {
      const schedule = docSnap.data();
      const startTime = schedule.startTime.toDate();
      const timeUntilStart = startTime.getTime() - now.getTime();

      // If starts within 30 minutes and hasn't started yet
      if (timeUntilStart > 0 && timeUntilStart < threshold) {
        startingSoon.push({
          id: docSnap.id,
          ...schedule,
          minutesUntilStart: Math.ceil(timeUntilStart / (60 * 1000))
        });
      }
    }

    return startingSoon;
  } catch (error) {
    console.error('Error getting starting soon reservations:', error);
    return [];
  }
};
