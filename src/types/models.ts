// User roles as specified in requirements
export type UserRole = 'professor' | 'admin';

// Base interface for timestamps
interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// User model
export interface User extends Timestamps {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}

// Room model
export interface Room extends Timestamps {
  id: string;
  name: string;
  capacity: number;
  isRetired: boolean;
  qrVersion: number;
}

// Reservation status as per requirements
export type ReservationStatus = 'SCHEDULED' | 'IN_SESSION' | 'COMPLETED' | 'NO_SHOW';

// Reservation model with all required fields
export interface Reservation extends Timestamps {
  id: string;
  roomId: string;
  userId: string;
  startAt: Date; // ISO-8601 with +08:00
  endAt: Date;   // ISO-8601 with +08:00
  status: ReservationStatus;
  closed: boolean;
  finalizedAt?: Date;
}

// Check-in types as per requirements
export type CheckInType = 'CHECK_IN' | 'CHECK_OUT';
export type CheckInMethod = 'QR' | 'AUTO';

// Faculty check-in model
export interface FacultyCheckIn extends Timestamps {
  id: string;
  reservationId: string;
  userId: string;
  roomId: string;
  type: CheckInType;
  method: CheckInMethod;
  timestamp: Date; // ISO-8601 with +08:00
}