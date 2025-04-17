import { 
  type Day, 
  setDay, 
  setHours, 
  setMinutes, 
  setSeconds, 
  setMilliseconds, 
  isAfter, 
  addWeeks, 
  compareAsc, 
  startOfDay 
} from 'date-fns';
import type { ChildWithEnrollments, DbEnrollment } from '@/types/enrollment'; // Updated import path and added DbEnrollment

// Mapping from time_slot string to schedule details
interface SlotDetail {
  day: Day; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  hour: number;
  minute: number;
  description: string;
}

const slotMappings: Record<string, SlotDetail> = {
  // Punjabi
  'sunday_beginner': { day: 0, hour: 10, minute: 0, description: 'Punjabi/Gurmukhi (Beginner)' },
  'sunday_advanced': { day: 0, hour: 11, minute: 30, description: 'Punjabi/Gurmukhi (Mid/Advanced)' },
  // Math
  'saturday_math_grade1_5': { day: 6, hour: 11, minute: 0, description: 'Math (Grade 1-5)' },
  'saturday_math_grade6_8': { day: 6, hour: 12, minute: 30, description: 'Math (Grade 6-8)' },
  'saturday_math_grade9_plus': { day: 6, hour: 14, minute: 0, description: 'Math (Grade 9+)' },
  // Coding
  'saturday_coding_beginner': { day: 6, hour: 16, minute: 0, description: 'Coding (Beginner)' },
  'saturday_coding_advanced': { day: 6, hour: 18, minute: 0, description: 'Coding (Mid/Advanced)' },
};

/**
 * Calculates the next occurrence date/time for a specific schedule slot 
 * after a given reference date.
 * 
 * @param slot The time_slot string (e.g., 'sunday_beginner')
 * @param referenceDate The date/time after which to find the next occurrence
 * @returns The Date object for the next occurrence, or null if slot is invalid
 */
function getNextOccurrence(slot: string, referenceDate: Date): Date | null {
  const details = slotMappings[slot];
  if (!details) {
    console.warn(`[scheduleUtils] Unknown slot mapping for: ${slot}`);
    return null;
  }

  // Start with the reference date, reset time to midnight for consistent day setting
  let potentialDate = startOfDay(referenceDate);

  // Set the day of the week
  potentialDate = setDay(potentialDate, details.day, { weekStartsOn: 0 }); // Assuming week starts on Sunday

  // Set the time
  potentialDate = setHours(potentialDate, details.hour);
  potentialDate = setMinutes(potentialDate, details.minute);
  potentialDate = setSeconds(potentialDate, 0);
  potentialDate = setMilliseconds(potentialDate, 0);

  // If the calculated date is not *after* the reference date, it means the next occurrence is next week
  if (!isAfter(potentialDate, referenceDate)) {
    potentialDate = addWeeks(potentialDate, 1);
  }

  return potentialDate;
}

// Type for the output array elements
export interface UpcomingOccurrence {
  date: Date;
  childName: string;
  description: string;
  slot: string; // Keep original slot for potential filtering/keying
}

/**
 * Processes child enrollment data to find all upcoming class occurrences
 * sorted chronologically.
 * 
 * @param children Array of children with their enrollments
 * @param referenceDate The date/time from which to calculate future occurrences
 * @returns A sorted array of upcoming class occurrences.
 */
export function getAllUpcomingOccurrences(
  children: ChildWithEnrollments[], 
  referenceDate: Date
): UpcomingOccurrence[] {
  const allOccurrences: UpcomingOccurrence[] = [];

  if (!children || children.length === 0) {
    return [];
  }

  children.forEach(child => {
    if (child.enrollments && child.enrollments.length > 0) {
      child.enrollments.forEach((enrollment: DbEnrollment) => {
        const nextDate = getNextOccurrence(enrollment.time_slot, referenceDate);
        if (nextDate) {
          const details = slotMappings[enrollment.time_slot]; // Get description again
          allOccurrences.push({
            date: nextDate,
            childName: child.name,
            description: details?.description || `Unknown Class (${enrollment.time_slot})`,
            slot: enrollment.time_slot,
          });
        }
      });
    }
  });

  // Sort by date ascending
  allOccurrences.sort((a, b) => compareAsc(a.date, b.date));

  return allOccurrences;
} 