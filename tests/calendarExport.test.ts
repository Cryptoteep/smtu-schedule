import { describe, it, expect } from 'vitest';
import { generateIcsCalendar } from '../src/services/calendarExport';
import { GroupSchedule } from '../src/types/schedule';

describe('iCalendar Export (RFC 5545)', () => {
  const mockSchedule: GroupSchedule = {
    groupId: '7624',
    groupName: '3210',
    updatedAt: new Date().toISOString(),
    days: [
      {
        dayName: 'Понедельник',
        dayIndex: 1,
        lessons: [
          {
            id: '7624-1-08:30-0',
            time: '08:30-10:00',
            timeSlotIndex: 1,
            subject: 'Методы искусственного интеллекта',
            type: 'lecture',
            rawType: 'Лекция',
            room: 'У 407',
            campus: 'Ульянка',
            groupName: '3210',
            weekParity: 'up',
            teacher: { name: 'Борисов Александр Николаевич' },
          },
        ],
      },
    ],
  };

  it('generates compliant iCalendar output with valid VCALENDAR and VEVENT blocks', () => {
    const ics = generateIcsCalendar(mockSchedule);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('X-WR-CALNAME:СПбГМТУ Расписание - 3210');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Методы искусственного интеллекта (Лекция)');
    expect(ics).toContain('LOCATION:У 407 (Ульянка)');
    expect(ics).toContain('RRULE:FREQ=WEEKLY');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });
});
