import { Timestamp } from 'firebase/firestore';

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[];
  status: 'available' | 'occupied' | 'maintenance';
  lastCheckin?: {
    professorId: string;
    timestamp: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RoomSchedule {
  id: string;
  roomId: string;
  professorId: string;
  courseCode?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  recurringType: 'none' | 'daily' | 'weekly';
  status: 'scheduled' | 'cancelled' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const FACILITIES_OPTIONS = [
  'Projector',
  'Whiteboard',
  'Smart TV',
  'Air Conditioning',
  'Computer Lab',
  'Audio System',
  'Video Conference',
  'Internet/WiFi'
] as const;

export const BUILDINGS = [
  'Main Building',
  'Science Building',
  'Engineering Building',
  'Arts Building',
  'Library'
] as const;

export type Building = typeof BUILDINGS[number];

// Constants for check-in/out validation
export const CHECK_IN_EARLY_BUFFER = 30; // minutes
export const CHECK_OUT_LATE_BUFFER = 30; // minutes