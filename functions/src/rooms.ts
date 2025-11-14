import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// Initialize Firebase Admin
admin.initializeApp();

// Configure region as per requirements
const region = 'asia-southeast1';

// Room validation schema
const RoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  isRetired: z.boolean().optional().default(false),
});

// Update room validation schema
const UpdateRoomSchema = RoomSchema.partial().extend({
  qrVersion: z.number().optional(),
});

// Helper function to check if user is admin
async function isUserAdmin(uid: string): Promise<boolean> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  return userDoc.exists && userDoc.data()?.role === 'admin';
}

/**
 * Creates a new room
 * Required role: admin
 */
export const createRoom = functions.region(region).https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check admin role
  const isAdmin = await isUserAdmin(context.auth.uid);
  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create rooms');
  }

  try {
    // Validate input data
    const roomData = RoomSchema.parse(data);

    // Create room document
    const roomRef = admin.firestore().collection('rooms').doc();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    await roomRef.set({
      ...roomData,
      id: roomRef.id,
      qrVersion: 1, // Initial QR version
      isRetired: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { roomId: roomRef.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid room data: ' + error.message);
    }
    throw new functions.https.HttpsError('internal', 'Failed to create room');
  }
});

/**
 * Updates an existing room, including QR version bump
 * Required role: admin
 */
export const updateRoom = functions.region(region).https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check admin role
  const isAdmin = await isUserAdmin(context.auth.uid);
  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update rooms');
  }

  const { roomId, ...updateData } = data;

  if (!roomId) {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID is required');
  }

  try {
    // Validate update data
    const validatedData = UpdateRoomSchema.parse(updateData);

    // Get room reference
    const roomRef = admin.firestore().collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Room not found');
    }

    const currentData = roomDoc.data();
    
    // Prepare update data
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const updates: any = {
      ...validatedData,
      updatedAt: timestamp,
    };

    // Bump QR version if specified or if room is being retired
    if (data.bumpQrVersion || (validatedData.isRetired && !currentData?.isRetired)) {
      updates.qrVersion = (currentData?.qrVersion || 0) + 1;
    }

    // Update room
    await roomRef.update(updates);

    return {
      roomId,
      qrVersion: updates.qrVersion || currentData?.qrVersion,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid room data: ' + error.message);
    }
    throw new functions.https.HttpsError('internal', 'Failed to update room');
  }
});