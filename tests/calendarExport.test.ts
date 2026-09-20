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
            dateRange: '1 сентября — 22 декабря 2026',
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
    expect(ics).toContain('X-WR-CALNAME:СПбГМТУ - 3210');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Методы искусственного интеллекта (Лекция)');
    expect(ics).toContain('LOCATION:У 407 (Ульянка)');
    expect(ics).toContain('DESCRIPTION:Группа: 3210\\nПреподаватель: Борисов Александр Николаевич');
    expect(ics).toContain('Период: 1 сентября — 22 декабря 2026');
    expect(ics).toContain('RRULE:FREQ=WEEKLY');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('generates compliant iCalendar for teacher schedule with multi-group summary', () => {
    const teacherMockSchedule: GroupSchedule = {
      groupId: 'teacher_101326',
      groupName: 'Чихонадских Елена Александровна',
      facultyName: 'Преподаватель СПбГМТУ',
      updatedAt: new Date().toISOString(),
      days: [
        {
          dayName: 'Понедельник',
          dayIndex: 1,
          lessons: [
            {
              id: '7630-1-11:50-5',
              time: '11:50-13:20',
              timeSlotIndex: 3,
              subject: 'Экология',
              type: 'lecture',
              rawType: 'Лекция',
              room: 'У 105',
              campus: 'Ульянка',
              groupName: '3230, 3231, 3280',
              weekParity: 'up',
            },
          ],
        },
      ],
    };

    const ics = generateIcsCalendar(teacherMockSchedule);
    expect(ics).toContain('X-WR-CALNAME:СПбГМТУ - Чихонадских Елена Александровна');
    expect(ics).toContain('SUMMARY:Экология [Гр. 3230, 3231, 3280]');
    expect(ics).toContain('DESCRIPTION:Преподаватель: Чихонадских Елена Александровна\\nУчебная группа: 3230, 3231, 3280');
  });
});
