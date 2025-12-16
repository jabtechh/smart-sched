import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { db } from '@/config/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, Timestamp, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import type { Room, Reservation } from './types';

interface RoomContextType {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  fetchRooms: (filters?: { building?: string; status?: Room['status'] }) => Promise<void>;
  getRoom: (roomId: string) => Promise<Room>;
  createRoom: (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRoom: (roomId: string, roomData: Partial<Room>) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  getReservation: (reservationId: string) => Promise<Reservation>;
  getUserReservations: () => Promise<Reservation[]>;
  createReservation: (roomId: string, startTime: Date, endTime: Date) => Promise<Reservation>;
  cancelReservation: (reservationId: string) => Promise<void>;
  checkInToRoom: (roomId: string) => Promise<void>;
  checkOutFromRoom: (roomId: string) => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async (filters?: { building?: string; status?: Room['status'] }) => {
    try {
      setLoading(true);
      setError(null);
      
      let q = query(collection(db, 'rooms'));
      
      if (filters?.building) {
        q = query(q, where('building', '==', filters.building));
      }
      
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      const querySnapshot = await getDocs(q);
      
      const roomsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastCheckin: doc.data().lastCheckin ? {
          ...doc.data().lastCheckin,
          timestamp: doc.data().lastCheckin.timestamp.toDate()
        } : undefined
      } as Room));
      
      setRooms(roomsData);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoom = async (roomId: string): Promise<Room> => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error('Room not found');
      }

      const data = roomDoc.data();
      return {
        id: roomDoc.id,
        name: data.name,
        building: data.building,
        floor: data.floor,
        capacity: data.capacity,
        facilities: data.facilities || [],
        status: data.status || 'available',
        lastCheckin: data.lastCheckin ? {
          ...data.lastCheckin,
          timestamp: data.lastCheckin.timestamp.toDate()
        } : undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Room;
    } catch (err) {
      console.error('Error getting room:', err);
      throw new Error('Failed to get room details');
    }
  };

  const createRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const roomRef = doc(collection(db, 'rooms'));
    await setDoc(roomRef, {
      ...roomData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await fetchRooms();
    return roomRef.id;
  };

  const updateRoom = async (roomId: string, roomData: Partial<Room>): Promise<void> => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const { id, createdAt, updatedAt, ...updateData } = roomData as any;
      await updateDoc(roomRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      await fetchRooms(); // Refresh the rooms list
    } catch (err) {
      console.error('Error updating room:', err);
      throw new Error('Failed to update room');
    }
  };

  const deleteRoom = async (roomId: string): Promise<void> => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await deleteDoc(roomRef);
      await fetchRooms(); // Refresh the rooms list after deletion
    } catch (err) {
      console.error('Error deleting room:', err);
      throw new Error('Failed to delete room');
    }
  };

  const getReservation = async (reservationId: string): Promise<Reservation> => {
    const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
    if (!reservationDoc.exists()) {
      throw new Error('Reservation not found');
    }
    return { id: reservationDoc.id, ...reservationDoc.data() } as Reservation;
  };

  const getUserReservations = async (): Promise<Reservation[]> => {
    if (!user) throw new Error('User not authenticated');
    
    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );
    const reservationsSnapshot = await getDocs(reservationsQuery);
    return reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
  };

  const createReservation = async (roomId: string, startTime: Date, endTime: Date): Promise<Reservation> => {
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const reservation: Omit<Reservation, 'id'> = {
      roomId,
      userId: user.uid,
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const reservationRef = doc(collection(db, 'reservations'));
    await setDoc(reservationRef, reservation);
    return { id: reservationRef.id, ...reservation };
  };

  const cancelReservation = async (reservationId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    const reservationRef = doc(db, 'reservations', reservationId);
    const reservationDoc = await getDoc(reservationRef);
    
    if (!reservationDoc.exists()) {
      throw new Error('Reservation not found');
    }

    const reservation = reservationDoc.data() as Reservation;
    if (reservation.userId !== user.uid) {
      throw new Error('Unauthorized');
    }

    await updateDoc(reservationRef, {
      status: 'cancelled',
      updatedAt: Timestamp.now(),
    });
  };

  const checkInToRoom = async (roomId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Find active reservation for this room and user
    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('roomId', '==', roomId),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );
    const reservationsSnapshot = await getDocs(reservationsQuery);
    
    if (reservationsSnapshot.empty) {
      throw new Error('No active reservation found for this room');
    }

    // Update the first active reservation with check-in time
    const reservation = reservationsSnapshot.docs[0];
    await updateDoc(doc(db, 'reservations', reservation.id), {
      checkInTime: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  };

  const checkOutFromRoom = async (roomId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Find active reservation for this room and user
    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('roomId', '==', roomId),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );
    const reservationsSnapshot = await getDocs(reservationsQuery);
    
    if (reservationsSnapshot.empty) {
      throw new Error('No active reservation found for this room');
    }

    // Update the first active reservation with check-out time and complete status
    const reservation = reservationsSnapshot.docs[0];
    await updateDoc(doc(db, 'reservations', reservation.id), {
      checkOutTime: Timestamp.now(),
      status: 'completed',
      updatedAt: Timestamp.now(),
    });
  };

  const value = {
    rooms,
    loading,
    error,
    fetchRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    getReservation,
    getUserReservations,
    createReservation,
    cancelReservation,
    checkInToRoom,
    checkOutFromRoom,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
}