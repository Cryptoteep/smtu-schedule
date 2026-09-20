import { describe, it, expect } from 'vitest';
import { getAcademicWeek, filterLessonsByParity, parseTimeRange, getLessonStatus, deriveParityFromSchedule } from '../src/services/weekCalculator';
import { Lesson } from '../src/types/schedule';

describe('Week Calculator (СПбГМТУ)', () => {
  it('calculates week 1 (Числитель) for September 1st', () => {
    const sept1 = new Date(2026, 8, 1); // 1 Sept 2026
    const info = getAcademicWeek(sept1);

    expect(info.weekNumber).toBe(1);
    expect(info.parity).toBe('up');
    expect(info.parityName).toBe('Числитель');
  });

  it('calculates week 2 (Знаменатель) for September 8th', () => {
    const sept8 = new Date(2026, 8, 8); // 8 Sept 2026
    const info = getAcademicWeek(sept8);

    expect(info.weekNumber).toBe(2);
    expect(info.parity).toBe('down');
    expect(info.parityName).toBe('Знаменатель');
  });

  it('parses time range string into minute offsets accurately', () => {
    const time1 = parseTimeRange('08:30-10:00');
    expect(time1).toEqual({ startMinutes: 8 * 60 + 30, endMinutes: 10 * 60 });

    const time2 = parseTimeRange('14:00-15:30');
    expect(time2).toEqual({ startMinutes: 14 * 60, endMinutes: 15 * 60 + 30 });

    const timeWithEnDash = parseTimeRange('08:30 – 10:00');
    expect(timeWithEnDash).toEqual({ startMinutes: 8 * 60 + 30, endMinutes: 10 * 60 });

    const timeWithEmDash = parseTimeRange('11:50—13:20');
    expect(timeWithEmDash).toEqual({ startMinutes: 11 * 60 + 50, endMinutes: 13 * 60 + 20 });

    const invalid = parseTimeRange('invalid-time');
    expect(invalid).toBeNull();

    expect(parseTimeRange('25:00-26:00')).toBeNull();
    expect(parseTimeRange('12:70-13:00')).toBeNull();
    expect(parseTimeRange('14:00-10:00')).toBeNull(); // inverted range
    // @ts-expect-error testing invalid input
    expect(parseTimeRange(null)).toBeNull();
    // @ts-expect-error testing invalid input
    expect(parseTimeRange(undefined)).toBeNull();
  });

  it('filters lessons based on parity selection', () => {
    const mockLessons: Lesson[] = [
      { id: '1', time: '08:30-10:00', timeSlotIndex: 1, subject: 'Математика', type: 'lecture', rawType: 'Лекция', room: 'У 407', campus: 'Ульянка', groupName: '3210', weekParity: 'up' },
      { id: '2', time: '10:10-11:40', timeSlotIndex: 2, subject: 'Физика', type: 'practice', rawType: 'Практика', room: 'У 408', campus: 'Ульянка', groupName: '3210', weekParity: 'down' },
      { id: '3', time: '11:50-13:20', timeSlotIndex: 3, subject: 'Информатика', type: 'lab', rawType: 'Лабораторная', room: 'У 312', campus: 'Ульянка', groupName: '3210', weekParity: 'both' },
    ];

    const upList = filterLessonsByParity(mockLessons, 'up');
    expect(upList.map(l => l.id)).toEqual(['1', '3']);

    const downList = filterLessonsByParity(mockLessons, 'down');
    expect(downList.map(l => l.id)).toEqual(['2', '3']);

    const allList = filterLessonsByParity(mockLessons, 'all');
    expect(allList.length).toBe(3);
  });

  it('correctly calculates lesson status for active, upcoming, and passed classes', () => {
    // Mock current time at 09:00
    const now = new Date();
    now.setHours(9, 0, 0, 0);

    const status1 = getLessonStatus('08:30-10:00', now);
    expect(status1.status).toBe('active');
    expect(status1.minutesRemaining).toBe(60);

    const status2 = getLessonStatus('10:10-11:40', now);
    expect(status2.status).toBe('upcoming');
    expect(status2.minutesUntilStart).toBe(70);

    const status3 = getLessonStatus('07:00-08:00', now);
    expect(status3.status).toBe('passed');
  });

  it('derives parity directly from schedule exactDates occurrences', () => {
    const mockLessons: Lesson[] = [
      {
        id: '1',
        time: '08:30-10:00',
        timeSlotIndex: 1,
        subject: 'Высшая математика',
        type: 'lecture',
        rawType: 'Лекция',
        room: 'У 407',
        campus: 'Ульянка',
        groupName: '3280',
        weekParity: 'up',
        exactDates: ['14.09.2026', '28.09.2026']
      },
      {
        id: '2',
        time: '10:10-11:40',
        timeSlotIndex: 2,
        subject: 'Теоретическая механика',
        type: 'practice',
        rawType: 'Практика',
        room: 'У 408',
        campus: 'Ульянка',
        groupName: '3280',
        weekParity: 'down',
        exactDates: ['21.09.2026', '05.10.2026']
      }
    ];

    // On 14 Sept 2026 (Monday of upper week)
    const d1 = new Date(2026, 8, 14);
    const p1 = deriveParityFromSchedule(mockLessons, d1);
    expect(p1.isDerived).toBe(true);
    expect(p1.parity).toBe('up');

    // On 21 Sept 2026 (Monday of lower week)
    const d2 = new Date(2026, 8, 21);
    const p2 = deriveParityFromSchedule(mockLessons, d2);
    expect(p2.isDerived).toBe(true);
    expect(p2.parity).toBe('down');
  });
});

