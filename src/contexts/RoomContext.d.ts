import type { Reservation } from './types';

export function getReservationsForRoom(roomId: string): Promise<Reservation[]>;
export function getUserReservations(): Promise<Reservation[]>;