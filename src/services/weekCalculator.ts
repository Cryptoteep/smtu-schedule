import { Lesson } from '../types/schedule';

export interface AcademicWeekInfo {
  weekNumber: number;
  parity: 'up' | 'down';
  parityName: 'Числитель' | 'Знаменатель';
  label: string;
}

/**
 * Calculates current academic week and parity for SPbGMTU.
 * Fall semester starts on Sept 1st.
 * Spring semester typically starts on the 2nd Monday of February (around Feb 8-10).
 */
export function getAcademicWeek(currentDate = new Date()): AcademicWeekInfo {
  const date = new Date(currentDate.getTime());
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: 8 = Sept, 1 = Feb

  let semesterStart: Date;

  if (month >= 8) {
    // Autumn semester of current year (Sept - Dec)
    semesterStart = new Date(year, 8, 1);
  } else if (month === 0) {
    // January is session / end of autumn semester of previous year
    semesterStart = new Date(year - 1, 8, 1);
  } else {
    // Spring semester (Feb - June/July)
    // Find second Monday of February
    const febFirst = new Date(year, 1, 1);
    const dayOfWeek = febFirst.getDay(); // 0 is Sunday, 1 is Monday
    const firstMondayOffset = (8 - dayOfWeek) % 7;
    const secondMondayDate = 1 + firstMondayOffset + 7;
    semesterStart = new Date(year, 1, secondMondayDate);
  }

  // Adjust semester start to Monday of that week
  const startDay = semesterStart.getDay() || 7; // Monday = 1, Sunday = 7
  const startMonday = new Date(semesterStart);
  startMonday.setDate(semesterStart.getDate() - (startDay - 1));
  startMonday.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - startMonday.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const weekNumber = Math.max(1, diffWeeks + 1);

  // Odd week = Upper (up / Числитель), Even week = Lower (down / Знаменатель)
  const isUp = weekNumber % 2 !== 0;
  const parity: 'up' | 'down' = isUp ? 'up' : 'down';
  const parityName = isUp ? 'Числитель' : 'Знаменатель';

  return {
    weekNumber,
    parity,
    parityName,
    label: `${weekNumber}-я неделя (${parityName})`
  };
}

/**
 * Filter lessons according to selected parity view:
 * 'up' -> lessons with parity 'up' or 'both'
 * 'down' -> lessons with parity 'down' or 'both'
 * 'all' -> all lessons
 */
export function filterLessonsByParity(lessons: Lesson[], filterParity: 'up' | 'down' | 'all'): Lesson[] {
  if (filterParity === 'all') return lessons;
  return lessons.filter(l => l.weekParity === 'both' || l.weekParity === filterParity);
}

/**
 * Parses time string like "08:30-10:00" into start and end minute offsets from midnight
 */
export function parseTimeRange(timeStr: string): { startMinutes: number; endMinutes: number } | null {
  if (!timeStr || !timeStr.includes('-')) return null;
  const [start, end] = timeStr.split('-');
  const [sh, sm] = start.trim().split(':').map(Number);
  const [eh, em] = end.trim().split(':').map(Number);

  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;

  return {
    startMinutes: sh * 60 + sm,
    endMinutes: eh * 60 + em
  };
}

export type LessonCurrentStatus = 'active' | 'upcoming' | 'passed';

export function getLessonStatus(timeStr: string, currentDate = new Date()): {
  status: LessonCurrentStatus;
  minutesRemaining?: number;
  minutesUntilStart?: number;
} {
  const parsed = parseTimeRange(timeStr);
  if (!parsed) return { status: 'passed' };

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  if (currentMinutes >= parsed.startMinutes && currentMinutes <= parsed.endMinutes) {
    return {
      status: 'active',
      minutesRemaining: parsed.endMinutes - currentMinutes
    };
  }

  if (currentMinutes < parsed.startMinutes) {
    return {
      status: 'upcoming',
      minutesUntilStart: parsed.startMinutes - currentMinutes
    };
  }

  return { status: 'passed' };
}
