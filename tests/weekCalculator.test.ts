import { describe, it, expect } from 'vitest';
import { getAcademicWeek, filterLessonsByParity, parseTimeRange, getLessonStatus } from '../src/services/weekCalculator';
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

    const invalid = parseTimeRange('invalid-time');
    expect(invalid).toBeNull();
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
});
