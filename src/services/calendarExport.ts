import { GroupSchedule } from '../types/schedule';
import { parseTimeRange } from './weekCalculator';

const DAY_ICS_CODE: Record<number, string> = {
  1: 'MO',
  2: 'TU',
  3: 'WE',
  4: 'TH',
  5: 'FR',
  6: 'SA',
};

function formatIcsDateTime(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const mins = pad(date.getMinutes());
  const secs = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${mins}${secs}`;
}

function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function generateIcsCalendar(schedule: GroupSchedule): string {
  if (!schedule || !schedule.days) {
    return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//SPbGMTU//Korabelka Schedule App//RU\r\nEND:VCALENDAR';
  }

  const isTeacher =
    schedule.groupId.startsWith('teacher_') || schedule.facultyName === 'Преподаватель СПбГМТУ';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SPbGMTU//Korabelka Schedule App//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(`СПбГМТУ - ${schedule.groupName}`)}`,
    'X-WR-TIMEZONE:Europe/Moscow',
  ];

  // Base date for recurrence: pick the nearest Monday
  const now = new Date();
  const currentDay = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (currentDay - 1));
  monday.setHours(0, 0, 0, 0);

  // Determine current academic week parity to properly align bi-weekly (INTERVAL=2) schedules
  const currentWeekMonth = monday.getMonth();
  const currentWeekYear = monday.getFullYear();
  let semesterStartMonday: Date;
  if (currentWeekMonth >= 8) {
    semesterStartMonday = new Date(currentWeekYear, 8, 1);
  } else if (currentWeekMonth === 0) {
    semesterStartMonday = new Date(currentWeekYear - 1, 8, 1);
  } else {
    const febFirst = new Date(currentWeekYear, 1, 1);
    const dayOfWeek = febFirst.getDay() || 7;
    const firstMondayOffset = (8 - dayOfWeek) % 7;
    semesterStartMonday = new Date(currentWeekYear, 1, 1 + firstMondayOffset + 7);
  }
  const sDay = semesterStartMonday.getDay() || 7;
  semesterStartMonday.setDate(semesterStartMonday.getDate() - (sDay - 1));
  semesterStartMonday.setHours(0, 0, 0, 0);

  const diffWeeks = Math.floor((monday.getTime() - semesterStartMonday.getTime()) / (7 * 86400000));
  const isCurrentWeekUp = (Math.max(1, diffWeeks + 1) % 2) !== 0;

  schedule.days.forEach((day) => {
    const dayCode = DAY_ICS_CODE[day.dayIndex];
    if (!dayCode) return;

    // Calculate specific date for this day of week
    const baseLessonDate = new Date(monday);
    baseLessonDate.setDate(monday.getDate() + (day.dayIndex - 1));

    day.lessons.forEach((lesson) => {
      const times = parseTimeRange(lesson.time);
      if (!times) return;

      const lessonDate = new Date(baseLessonDate);

      // Parity alignment: If lesson is bi-weekly and its parity does not match the current week,
      // shift first occurrence by +7 days so recurrence falls on the true matching weeks!
      if (lesson.weekParity === 'up' && !isCurrentWeekUp) {
        lessonDate.setDate(lessonDate.getDate() + 7);
      } else if (lesson.weekParity === 'down' && isCurrentWeekUp) {
        lessonDate.setDate(lessonDate.getDate() + 7);
      }

      const startDate = new Date(lessonDate);
      startDate.setHours(Math.floor(times.startMinutes / 60), times.startMinutes % 60, 0);

      const endDate = new Date(lessonDate);
      endDate.setHours(Math.floor(times.endMinutes / 60), times.endMinutes % 60, 0);

      // Recurrence rule
      let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};COUNT=18`;
      if (lesson.weekParity === 'up' || lesson.weekParity === 'down') {
        rrule = `RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=${dayCode};COUNT=10`;
      }

      const summary =
        isTeacher && lesson.groupName
          ? `${lesson.subject} [Гр. ${lesson.groupName}]`
          : `${lesson.subject} (${lesson.rawType || lesson.type})`;

      const location = `${lesson.room} (${lesson.campus || 'СПбГМТУ'})`;
      const descParts: string[] = [];

      if (isTeacher) {
        descParts.push(`Преподаватель: ${schedule.groupName}`);
        if (lesson.groupName) descParts.push(`Учебная группа: ${lesson.groupName}`);
      } else {
        descParts.push(`Группа: ${schedule.groupName}`);
        if (lesson.teacher?.name) descParts.push(`Преподаватель: ${lesson.teacher.name}`);
      }

      descParts.push(`Тип: ${lesson.rawType || lesson.type}`);
      descParts.push(
        `Неделя: ${
          lesson.weekParity === 'up'
            ? 'Верхняя неделя'
            : lesson.weekParity === 'down'
            ? 'Нижняя неделя'
            : 'Каждую неделю'
        }`
      );

      if (lesson.dateRange) {
        descParts.push(`Период: ${lesson.dateRange}`);
      }
      if (lesson.dateSpecific) {
        descParts.push(`Даты: ${lesson.dateSpecific}`);
      }

      // Deterministic RFC 5545 UID based on schedule and lesson id to avoid calendar duplicates upon re-export
      const cleanGroupId = schedule.groupId.replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanLessonId = (lesson.id || `${day.dayIndex}-${times.startMinutes}`).replace(/[^a-zA-Z0-9_-]/g, '');
      const uid = `smtu-${cleanGroupId}-${cleanLessonId}@smtu.ru`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${formatIcsDateTime(new Date())}Z`);
      lines.push(`DTSTART;TZID=Europe/Moscow:${formatIcsDateTime(startDate)}`);
      lines.push(`DTEND;TZID=Europe/Moscow:${formatIcsDateTime(endDate)}`);
      lines.push(rrule);
      lines.push(`SUMMARY:${escapeIcsText(summary)}`);
      lines.push(`LOCATION:${escapeIcsText(location)}`);
      lines.push(`DESCRIPTION:${descParts.map(escapeIcsText).join('\\n')}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsFile(schedule: GroupSchedule): boolean {
  try {
    const icsData = generateIcsCalendar(schedule);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (schedule?.groupName || 'schedule').replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_');
    link.setAttribute('download', `smtu_schedule_${safeName}.ics`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch {}
    }, 200);
    return true;
  } catch (err) {
    console.error('Failed to download .ics file:', err);
    return false;
  }
}
