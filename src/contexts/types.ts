import { Timestamp } from 'firebase/firestore';

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[];
  status: 'available' | 'occupied' | 'maintenance';
  type?: string;
  lastCheckin?: {
    professorId: string;
    timestamp: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Reservation {
  id: string;
  roomId: string;
  userId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: 'active' | 'completed' | 'cancelled';
  checkInTime?: Timestamp;
  checkOutTime?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  room?: Room;
}