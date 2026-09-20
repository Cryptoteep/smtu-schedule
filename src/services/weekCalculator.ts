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
  if (!timeStr) return null;
  const normalized = timeStr.replace(/[–—−]/g, '-');
  if (!normalized.includes('-')) return null;
  const [start, end] = normalized.split('-');
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

/**
 * Data-driven parity calculation derived directly from schedule occurrences.
 * Counts parity votes per Monday for lessons with exactDates.
 * Falls back to calendar calculation if no occurrences data is available.
 */
export function deriveParityFromSchedule(
  lessons: Lesson[],
  currentDate = new Date()
): { parity: 'up' | 'down'; isDerived: boolean } {
  const votes = new Map<number, { up: number; down: number }>();

  for (const lesson of lessons) {
    if (!lesson.exactDates || lesson.exactDates.length === 0) continue;
    if (lesson.weekParity !== 'up' && lesson.weekParity !== 'down') continue;

    for (const dStr of lesson.exactDates) {
      const parts = dStr.split('.');
      if (parts.length !== 3) continue;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (isNaN(d.getTime())) continue;

      // Find Monday of this date
      const dayOfWeek = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
      const mondayEpoch = Math.floor((d.getTime() - dayOfWeek * 86400000) / (7 * 86400000));

      const v = votes.get(mondayEpoch) || { up: 0, down: 0 };
      if (lesson.weekParity === 'up') v.up++;
      else v.down++;
      votes.set(mondayEpoch, v);
    }
  }

  if (votes.size > 0) {
    // Current week Monday epoch
    const curDayOfWeek = (currentDate.getDay() + 6) % 7;
    const curMondayEpoch = Math.floor((currentDate.getTime() - curDayOfWeek * 86400000) / (7 * 86400000));

    // Find closest or best voted Monday
    let bestKey: number | null = null;
    let maxMargin = -1;
    let isUp = true;

    for (const [key, v] of votes.entries()) {
      const margin = Math.abs(v.up - v.down);
      if (margin > maxMargin) {
        maxMargin = margin;
        bestKey = key;
        isUp = v.up >= v.down;
      }
    }

    if (bestKey !== null) {
      const diffWeeks = curMondayEpoch - bestKey;
      const curIsUp = diffWeeks % 2 === 0 ? isUp : !isUp;
      return {
        parity: curIsUp ? 'up' : 'down',
        isDerived: true
      };
    }
  }

  return {
    parity: getAcademicWeek(currentDate).parity,
    isDerived: false
  };
}
