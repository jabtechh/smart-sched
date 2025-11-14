import { addMinutes, subMinutes } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Manila';

export const CHECK_IN_WINDOW = {
  BEFORE: 10, // minutes
  AFTER: 15,  // minutes
};

export const AUTO_FINALIZE = {
  NO_SHOW_AFTER: 15,    // minutes
  CHECKOUT_AFTER: 10,   // minutes
};

// Convert local time to UTC while preserving the timezone
export const toUTC = (date: Date): Date => {
  return zonedTimeToUtc(date, TIMEZONE);
};

// Convert UTC to local time with timezone
export const fromUTC = (date: Date): Date => {
  return utcToZonedTime(date, TIMEZONE);
};

// Check if current time is within the check-in window
export const isWithinCheckInWindow = (startTime: Date): boolean => {
  const now = new Date();
  const checkInStart = subMinutes(startTime, CHECK_IN_WINDOW.BEFORE);
  const checkInEnd = addMinutes(startTime, CHECK_IN_WINDOW.AFTER);
  
  return now >= checkInStart && now <= checkInEnd;
};

// Check if a reservation should be marked as no-show
export const isNoShow = (startTime: Date): boolean => {
  const now = new Date();
  const noShowTime = addMinutes(startTime, AUTO_FINALIZE.NO_SHOW_AFTER);
  
  return now >= noShowTime;
};

// Check if a session should be auto-finalized
export const shouldAutoFinalize = (endTime: Date): boolean => {
  const now = new Date();
  const finalizeTime = addMinutes(endTime, AUTO_FINALIZE.CHECKOUT_AFTER);
  
  return now >= finalizeTime;
};