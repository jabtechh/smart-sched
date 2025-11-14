import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const region = 'asia-southeast1';
const TIMEZONE = 'Asia/Manila';

// Validation schemas
const ReservationSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  startAt: z.string().datetime({ offset: true }), // ISO-8601 with +08:00
  endAt: z.string().datetime({ offset: true }), // ISO-8601 with +08:00
});

const UpdateReservationSchema = z.object({
  reservationId: z.string().min(1, 'Reservation ID is required'),
  startAt: z.string().datetime({ offset: true }).optional(),
  endAt: z.string().datetime({ offset: true }).optional(),
});

// Helper function to check if user is professor
async function isUserProfessor(uid: string): Promise<boolean> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  return userDoc.exists && userDoc.data()?.role === 'professor';
}

// Helper function to check for reservation conflicts
async function hasConflictingReservation(
  roomId: string, 
  startAt: Date, 
  endAt: Date, 
  excludeReservationId?: string
): Promise<boolean> {
  const reservationsRef = admin.firestore().collection('reservations');
  
  // Query for potential conflicts
  const conflictQuery = reservationsRef
    .where('roomId', '==', roomId)
    .where('status', 'in', ['SCHEDULED', 'IN_SESSION'])
    .where('startAt', '<', endAt)
    .where('endAt', '>', startAt);

  const conflicts = await conflictQuery.get();
  
  // Check if any non-excluded reservation exists
  return conflicts.docs.some(doc => 
    doc.id !== excludeReservationId && 
    !doc.data().closed
  );
}

// Helper function to validate room availability
async function isRoomAvailable(roomId: string): Promise<boolean> {
  const roomDoc = await admin.firestore().collection('rooms').doc(roomId).get();
  return roomDoc.exists && !roomDoc.data()?.isRetired;
}

/**
 * Creates a new reservation with conflict checking
 * Required role: professor
 */
export const createReservation = functions.region(region).https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check professor role
  const isProfessor = await isUserProfessor(context.auth.uid);
  if (!isProfessor) {
    throw new functions.https.HttpsError('permission-denied', 'Only professors can create reservations');
  }

  try {
    // Validate input data
    const reservationData = ReservationSchema.parse(data);
    const startAt = new Date(reservationData.startAt);
    const endAt = new Date(reservationData.endAt);

    // Validate time range
    if (startAt >= endAt) {
      throw new functions.https.HttpsError('invalid-argument', 'Start time must be before end time');
    }

    // Check if room exists and is not retired
    const isAvailable = await isRoomAvailable(reservationData.roomId);
    if (!isAvailable) {
      throw new functions.https.HttpsError('failed-precondition', 'Room is not available');
    }

    // Check for conflicts
    const hasConflict = await hasConflictingReservation(
      reservationData.roomId,
      startAt,
      endAt
    );

    if (hasConflict) {
      throw new functions.https.HttpsError('failed-precondition', 'Time slot is already booked');
    }

    // Create reservation
    const reservationRef = admin.firestore().collection('reservations').doc();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    await reservationRef.set({
      ...reservationData,
      id: reservationRef.id,
      userId: context.auth.uid,
      status: 'SCHEDULED',
      closed: false,
      startAt: admin.firestore.Timestamp.fromDate(startAt),
      endAt: admin.firestore.Timestamp.fromDate(endAt),
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { reservationId: reservationRef.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid reservation data: ' + error.message);
    }
    throw new functions.https.HttpsError('internal', 'Failed to create reservation');
  }
});

/**
 * Updates an existing reservation with conflict checking
 * Required role: professor (must be owner)
 */
export const updateReservation = functions.region(region).https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Validate input data
    const { reservationId, ...updateData } = UpdateReservationSchema.parse(data);

    // Get existing reservation
    const reservationRef = admin.firestore().collection('reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Reservation not found');
    }

    const reservation = reservationDoc.data()!;

    // Check ownership and professor role
    if (reservation.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Can only update own reservations');
    }

    const isProfessor = await isUserProfessor(context.auth.uid);
    if (!isProfessor) {
      throw new functions.https.HttpsError('permission-denied', 'Only professors can update reservations');
    }

    // Check if reservation can be updated
    if (reservation.closed) {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot update a closed reservation');
    }

    if (reservation.status !== 'SCHEDULED') {
      throw new functions.https.HttpsError('failed-precondition', 'Can only update scheduled reservations');
    }

    // Prepare update data
    const startAt = updateData.startAt ? new Date(updateData.startAt) : reservation.startAt.toDate();
    const endAt = updateData.endAt ? new Date(updateData.endAt) : reservation.endAt.toDate();

    // Validate time range
    if (startAt >= endAt) {
      throw new functions.https.HttpsError('invalid-argument', 'Start time must be before end time');
    }

    // Check for conflicts if times are changing
    if (updateData.startAt || updateData.endAt) {
      const hasConflict = await hasConflictingReservation(
        reservation.roomId,
        startAt,
        endAt,
        reservationId
      );

      if (hasConflict) {
        throw new functions.https.HttpsError('failed-precondition', 'Time slot is already booked');
      }
    }

    // Update reservation
    await reservationRef.update({
      ...updateData,
      startAt: admin.firestore.Timestamp.fromDate(startAt),
      endAt: admin.firestore.Timestamp.fromDate(endAt),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { reservationId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid update data: ' + error.message);
    }
    throw new functions.https.HttpsError('internal', 'Failed to update reservation');
  }
});

/**
 * Cancels a reservation
 * Required role: professor (must be owner)
 */
export const cancelReservation = functions.region(region).https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { reservationId } = data;

  if (!reservationId) {
    throw new functions.https.HttpsError('invalid-argument', 'Reservation ID is required');
  }

  try {
    // Get reservation
    const reservationRef = admin.firestore().collection('reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Reservation not found');
    }

    const reservation = reservationDoc.data()!;

    // Check ownership and professor role
    if (reservation.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Can only cancel own reservations');
    }

    const isProfessor = await isUserProfessor(context.auth.uid);
    if (!isProfessor) {
      throw new functions.https.HttpsError('permission-denied', 'Only professors can cancel reservations');
    }

    // Check if reservation can be cancelled
    if (reservation.closed) {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot cancel a closed reservation');
    }

    if (reservation.status !== 'SCHEDULED') {
      throw new functions.https.HttpsError('failed-precondition', 'Can only cancel scheduled reservations');
    }

    // Cancel reservation
    await reservationRef.update({
      status: 'CANCELLED',
      closed: true,
      finalizedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { reservationId };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to cancel reservation');
  }
});