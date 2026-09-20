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

export function generateIcsCalendar(schedule: GroupSchedule): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SPbGMTU//Korabelka Schedule App//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:СПбГМТУ Расписание - ${schedule.groupName}`,
    'X-WR-TIMEZONE:Europe/Moscow',
  ];

  // Base date for recurrence: pick the nearest Monday
  const now = new Date();
  const currentDay = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (currentDay - 1));
  monday.setHours(0, 0, 0, 0);

  schedule.days.forEach((day) => {
    const dayCode = DAY_ICS_CODE[day.dayIndex];
    if (!dayCode) return;

    // Calculate specific date for this day of week
    const lessonDate = new Date(monday);
    lessonDate.setDate(monday.getDate() + (day.dayIndex - 1));

    day.lessons.forEach((lesson) => {
      const times = parseTimeRange(lesson.time);
      if (!times) return;

      const startDate = new Date(lessonDate);
      startDate.setHours(Math.floor(times.startMinutes / 60), times.startMinutes % 60, 0);

      const endDate = new Date(lessonDate);
      endDate.setHours(Math.floor(times.endMinutes / 60), times.endMinutes % 60, 0);

      // Recurrence rule
      let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};COUNT=18`;
      if (lesson.weekParity === 'up' || lesson.weekParity === 'down') {
        rrule = `RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=${dayCode};COUNT=10`;
      }

      const summary = `${lesson.subject} (${lesson.rawType || lesson.type})`;
      const location = `${lesson.room} (${lesson.campus})`;
      const descParts = [
        `Группа: ${schedule.groupName}`,
        `Тип: ${lesson.rawType || lesson.type}`,
        `Неделя: ${lesson.weekParity === 'up' ? 'Верхняя (числитель)' : lesson.weekParity === 'down' ? 'Нижняя (знаменатель)' : 'Каждую неделю'}`,
      ];
      if (lesson.teacher?.name) {
        descParts.push(`Преподаватель: ${lesson.teacher.name}`);
      }
      if (lesson.dateSpecific) {
        descParts.push(`Даты: ${lesson.dateSpecific}`);
      }

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${lesson.id}-${Date.now()}@smtu.ru`);
      lines.push(`DTSTAMP:${formatIcsDateTime(new Date())}Z`);
      lines.push(`DTSTART;TZID=Europe/Moscow:${formatIcsDateTime(startDate)}`);
      lines.push(`DTEND;TZID=Europe/Moscow:${formatIcsDateTime(endDate)}`);
      lines.push(rrule);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`LOCATION:${location}`);
      lines.push(`DESCRIPTION:${descParts.join('\\n')}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsFile(schedule: GroupSchedule): void {
  const icsData = generateIcsCalendar(schedule);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `smtu_schedule_${schedule.groupName}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
