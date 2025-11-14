import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { addMinutes } from 'date-fns';

const region = 'asia-southeast1';

// Time constants as per requirements
const AUTO_FINALIZE = {
  NO_SHOW_AFTER: 15,    // Mark as NO_SHOW after startAt + 15m
  CHECKOUT_AFTER: 10,   // Auto-checkout after endAt + 10m
};

/**
 * Scheduled function that runs every 5 minutes to mark no-shows
 * Sets status to NO_SHOW if not checked in by startAt + 15m
 */
export const sweeperAutoNoShow = functions.region(region)
  .pubsub.schedule('every 5 minutes')
  .timeZone('Asia/Manila')
  .onRun(async (context) => {
    const now = new Date();
    const reservationsRef = admin.firestore().collection('reservations');
    const batch = admin.firestore().batch();
    let batchCount = 0;

    try {
      // Find scheduled reservations that should be marked as no-show
      const query = reservationsRef
        .where('status', '==', 'SCHEDULED')
        .where('closed', '==', false);

      const snapshot = await query.get();

      for (const doc of snapshot.docs) {
        const reservation = doc.data();
        const startAt = reservation.startAt.toDate();
        const noShowDeadline = addMinutes(startAt, AUTO_FINALIZE.NO_SHOW_AFTER);

        // If past the no-show deadline
        if (now >= noShowDeadline) {
          batch.update(doc.ref, {
            status: 'NO_SHOW',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          batchCount++;

          // Commit batch when it reaches limit
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }

      // Commit any remaining updates
      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`sweeperAutoNoShow completed successfully at ${now.toISOString()}`);
      return null;
    } catch (error) {
      console.error('sweeperAutoNoShow failed:', error);
      throw error;
    }
});

/**
 * Scheduled function that runs every 5 minutes to auto-finalize sessions
 * 1. Auto-checkout IN_SESSION reservations at endAt + 10m
 * 2. Close NO_SHOW reservations at endAt + 10m
 */
export const sweeperAutoFinalize = functions.region(region)
  .pubsub.schedule('every 5 minutes')
  .timeZone('Asia/Manila')
  .onRun(async (context) => {
    const now = new Date();
    const reservationsRef = admin.firestore().collection('reservations');
    const batch = admin.firestore().batch();
    let batchCount = 0;

    try {
      // 1. Handle IN_SESSION reservations that need auto-checkout
      const activeSessions = await reservationsRef
        .where('status', '==', 'IN_SESSION')
        .where('closed', '==', false)
        .get();

      for (const doc of activeSessions.docs) {
        const reservation = doc.data();
        const endAt = reservation.endAt.toDate();
        const autoCheckoutDeadline = addMinutes(endAt, AUTO_FINALIZE.CHECKOUT_AFTER);

        if (now >= autoCheckoutDeadline) {
          // Create auto-checkout record
          const checkoutRef = admin.firestore().collection('faculty_checkins').doc();
          batch.set(checkoutRef, {
            id: checkoutRef.id,
            reservationId: doc.id,
            userId: reservation.userId,
            roomId: reservation.roomId,
            type: 'CHECK_OUT',
            method: 'AUTO',
            timestamp: admin.firestore.Timestamp.fromDate(now),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Update reservation
          batch.update(doc.ref, {
            status: 'COMPLETED',
            closed: true,
            finalizedAt: admin.firestore.Timestamp.fromDate(now),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          batchCount += 2; // Counting both operations

          // Commit batch when it reaches limit
          if (batchCount >= 499) { // Leave room for pairs of operations
            await batch.commit();
            batchCount = 0;
          }
        }
      }

      // 2. Handle NO_SHOW reservations that need to be closed
      const noShows = await reservationsRef
        .where('status', '==', 'NO_SHOW')
        .where('closed', '==', false)
        .get();

      for (const doc of noShows.docs) {
        const reservation = doc.data();
        const endAt = reservation.endAt.toDate();
        const closeDeadline = addMinutes(endAt, AUTO_FINALIZE.CHECKOUT_AFTER);

        if (now >= closeDeadline) {
          batch.update(doc.ref, {
            closed: true,
            finalizedAt: admin.firestore.Timestamp.fromDate(now),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          batchCount++;

          // Commit batch when it reaches limit
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }

      // Commit any remaining updates
      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`sweeperAutoFinalize completed successfully at ${now.toISOString()}`);
      return null;
    } catch (error) {
      console.error('sweeperAutoFinalize failed:', error);
      throw error;
    }
});