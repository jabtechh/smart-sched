import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { addMinutes, subMinutes } from 'date-fns';

const region = 'asia-southeast1';
const TIMEZONE = 'Asia/Manila';

// Time window constants as per requirements
const CHECK_IN_WINDOW = {
  BEFORE: 10, // -10 minutes
  AFTER: 15,  // +15 minutes
};

// Validation schemas
const CheckInSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  nowISO: z.string().datetime({ offset: true }), // ISO-8601 with +08:00
  signals: z.record(z.any()).optional(), // Optional signal data
});

const CheckOutSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  nowISO: z.string().datetime({ offset: true }), // ISO-8601 with +08:00
});

// Helper function to check if user is professor
async function isUserProfessor(uid: string): Promise<boolean> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  return userDoc.exists && userDoc.data()?.role === 'professor';
}

// Helper function to find active reservation for check-in
async function findActiveReservation(
  roomId: string,
  userId: string,
  currentTime: Date
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const reservationsRef = admin.firestore().collection('reservations');
  
  // Get reservations that could be checked into
  const reservations = await reservationsRef
    .where('roomId', '==', roomId)
    .where('userId', '==', userId)
    .where('status', '==', 'SCHEDULED')
    .where('closed', '==', false)
    .get();

  // Find a reservation within the check-in window
  for (const doc of reservations.docs) {
    const reservation = doc.data();
    const startAt = reservation.startAt.toDate();
    const checkInStart = subMinutes(startAt, CHECK_IN_WINDOW.BEFORE);
    const checkInEnd = addMinutes(startAt, CHECK_IN_WINDOW.AFTER);

    if (currentTime >= checkInStart && currentTime <= checkInEnd) {
      return doc;
    }
  }

  return null;
}

// Helper function to find current session for check-out
async function findCurrentSession(
  roomId: string,
  userId: string
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const reservationsRef = admin.firestore().collection('reservations');
  
  const sessions = await reservationsRef
    .where('roomId', '==', roomId)
    .where('userId', '==', userId)
    .where('status', '==', 'IN_SESSION')
    .where('closed', '==', false)
    .limit(1)
    .get();

  return sessions.docs[0] || null;
}

/**
 * Handles faculty check-in
 * Validates time window (-10/+15 minutes around startAt)
 */
export const facultyCheckin = functions.region(region).https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check professor role
  const isProfessor = await isUserProfessor(context.auth.uid);
  if (!isProfessor) {
    throw new functions.https.HttpsError('permission-denied', 'Only professors can check in');
  }

  try {
    // Validate input data
    const checkInData = CheckInSchema.parse(data);
    const currentTime = new Date(checkInData.nowISO);

    // Check if room exists and is not retired
    const roomRef = admin.firestore().collection('rooms').doc(checkInData.roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists || roomDoc.data()?.isRetired) {
      throw new functions.https.HttpsError('failed-precondition', 'Room is not available');
    }

    // Check for any active sessions by this professor
    const activeSessionRef = await findCurrentSession(checkInData.roomId, context.auth.uid);
    if (activeSessionRef) {
      throw new functions.https.HttpsError('failed-precondition', 'You already have an active session');
    }

    // Find a valid reservation for check-in
    const reservationDoc = await findActiveReservation(
      checkInData.roomId,
      context.auth.uid,
      currentTime
    );

    if (!reservationDoc) {
      throw new functions.https.HttpsError('failed-precondition', 'No valid reservation found for check-in');
    }

    const reservation = reservationDoc.data();
    const startTime = reservation.startAt.toDate();

    // Create check-in record
    const checkInRef = admin.firestore().collection('faculty_checkins').doc();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().runTransaction(async (transaction) => {
      // Create check-in record
      transaction.set(checkInRef, {
        id: checkInRef.id,
        reservationId: reservationDoc.id,
        userId: context.auth!.uid,
        roomId: checkInData.roomId,
        type: 'CHECK_IN',
        method: 'QR',
        timestamp: admin.firestore.Timestamp.fromDate(currentTime),
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      // Update reservation status
      transaction.update(reservationDoc.ref, {
        status: 'IN_SESSION',
        updatedAt: timestamp,
      });
    });

    return {
      checkInId: checkInRef.id,
      reservationId: reservationDoc.id,
      startTime: startTime.toISOString(),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid check-in data: ' + error.message);
    }
    throw new functions.https.HttpsError('internal', 'Failed to process check-in');
  }
});

/**
 * Handles faculty check-out
 * Records check-out event and finalizes the session
 */
export const facultyCheckout = functions.region(region).https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check professor role
  const isProfessor = await isUserProfessor(context.auth.uid);
  if (!isProfessor) {
    throw new functions.https.HttpsError('permission-denied', 'Only professors can check out');
  }

  try {
    // Validate input data
    const checkOutData = CheckOutSchema.parse(data);
    const currentTime = new Date(checkOutData.nowISO);

    // Find current session
    const sessionDoc = await findCurrentSession(checkOutData.roomId, context.auth.uid);
    if (!sessionDoc) {
      throw new functions.https.HttpsError('failed-precondition', 'No active session found');
    }

    const reservation = sessionDoc.data();

    // Create check-out record
    const checkOutRef = admin.firestore().collection('faculty_checkins').doc();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().runTransaction(async (transaction) => {
      // Create check-out record
      transaction.set(checkOutRef, {
        id: checkOutRef.id,
        reservationId: sessionDoc.id,
        userId: context.auth!.uid,
        roomId: checkOutData.roomId,
        type: 'CHECK_OUT',
        method: 'QR',
        timestamp: admin.firestore.Timestamp.fromDate(currentTime),
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      // Update reservation status
      transaction.update(sessionDoc.ref, {
        status: 'COMPLETED',
        closed: true,
        finalizedAt: admin.firestore.Timestamp.fromDate(currentTime),
        updatedAt: timestamp,
      });
    });

    return {
      checkOutId: checkOutRef.id,
      reservationId: sessionDoc.id,
      endTime: currentTime.toISOString(),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid check-out data: ' + error.message);
    }
    throw new functions.https.HttpsError('internal', 'Failed to process check-out');
  }
});