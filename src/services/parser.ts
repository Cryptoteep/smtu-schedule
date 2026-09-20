import { GroupSchedule, DaySchedule, Lesson, LessonType, WeekParity } from '../types/schedule';
import { getCampusByRoom } from '../data/campuses';

const TIME_SLOT_MAP: Record<string, number> = {
  '08:30': 1,
  '10:10': 2,
  '11:50': 3,
  '14:00': 4,
  '15:40': 5,
  '17:20': 6,
  '19:00': 7,
};

const DAY_NAMES = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

export function determineLessonType(rawType: string, subject: string): LessonType {
  const lowerType = (rawType || '').toLowerCase();
  const lowerSubj = (subject || '').toLowerCase();

  if (lowerType.includes('лекц') || lowerSubj.includes('лекция')) {
    return 'lecture';
  }
  if (
    lowerType.includes('практ') ||
    lowerType.includes('семинар') ||
    lowerSubj.includes('практика') ||
    lowerSubj.includes('семинар')
  ) {
    return 'practice';
  }
  if (lowerType.includes('лаб') || lowerSubj.includes('лабораторн')) {
    return 'lab';
  }
  if (lowerSubj.includes('воен') || lowerType.includes('воен')) {
    return 'military';
  }
  if (lowerType.includes('экзамен') || lowerType.includes('зачет') || lowerType.includes('зачёт')) {
    return 'exam';
  }
  return 'other';
}

export function parseSmtuScheduleHtml(html: string, groupId: string, groupName = ''): GroupSchedule {
  const days: DaySchedule[] = [];

  // Match day headers or table sections
  // Look for sections like <h4 ...>День</h4> followed by <table>...</table>
  // Or table count matching days 1..6
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  const tables = html.match(tableRegex) || [];

  // Extract day titles preceding tables
  const sections = html.split(/<table/i);

  tables.forEach((tableHtml, index) => {
    // Find preceding heading if possible
    let dayName = DAY_NAMES[index] || `День ${index + 1}`;
    const precedingChunk = sections[index] || '';
    for (const name of DAY_NAMES) {
      if (precedingChunk.toLowerCase().includes(name.toLowerCase())) {
        dayName = name;
        break;
      }
    }

    const dayIndex = DAY_NAMES.indexOf(dayName) + 1; // 1 = Monday
    const lessons: Lesson[] = [];

    const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
    const rows = tableHtml.match(rowRegex) || [];

    rows.forEach((rowHtml, rowIndex) => {
      // Check for week parity indicator
      let weekParity: WeekParity = 'both';
      if (rowHtml.includes('id="week-up-container"') || rowHtml.includes('Верхняя неделя') || rowHtml.includes('fa-arrow-turn-up')) {
        weekParity = 'up';
      } else if (rowHtml.includes('id="week-down-container"') || rowHtml.includes('Нижняя неделя') || rowHtml.includes('fa-arrow-turn-down')) {
        weekParity = 'down';
      }

      // Extract cells: <th or <td
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        cells.push(cellMatch[1]);
      }

      if (cells.length < 5) {
        return; // Header row or invalid
      }

      // Clean HTML from time cell
      const timeRaw = cells[0].replace(/<[^>]+>/g, '').trim();
      if (!timeRaw || !timeRaw.includes(':') || timeRaw.toLowerCase().includes('время')) {
        return; // Skip table header row
      }

      // Auditorium / Room is typically cell 2 (index 2)
      const room = cells[2].replace(/<[^>]+>/g, '').trim();
      const campusObj = getCampusByRoom(room);
      const campus = campusObj ? campusObj.name : 'Кампус';

      // Group name is typically cell 3 (index 3)
      const parsedGroupName = cells[3].replace(/<[^>]+>/g, '').trim() || groupName;

      // Subject and rawType from cell 4
      const subjectCell = cells[4];
      const spanMatch = subjectCell.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
      const smallMatch = subjectCell.match(/<small[^>]*>([\s\S]*?)<\/small>/i);

      let subject = spanMatch ? spanMatch[1].replace(/<[^>]+>/g, '').trim() : subjectCell.replace(/<[^>]+>/g, '').trim();
      let rawType = smallMatch ? smallMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      // Check for dates inside subject cell (e.g. 17.10 и 24.10)
      let dateSpecific: string | undefined;
      const dateMatch = subjectCell.match(/(\d{1,2}\.\d{1,2}(?:\s*(?:и|-|по)\s*\d{1,2}\.\d{1,2})*)/);
      if (dateMatch) {
        dateSpecific = dateMatch[1];
      }

      if (!rawType && subject.includes('\n')) {
        const parts = subject.split('\n').map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) {
          subject = parts[0];
          rawType = parts.slice(1).join(' ');
        }
      }

      // Teacher from cell 5 (if present)
      let teacherName = '';
      let teacherPhotoUrl: string | undefined;
      if (cells.length >= 6) {
        const teacherCell = cells[5];
        const teacherSpan = teacherCell.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
        teacherName = teacherSpan ? teacherSpan[1].replace(/<[^>]+>/g, '').trim() : teacherCell.replace(/<[^>]+>/g, '').trim();

        const imgMatch = teacherCell.match(/<img[^>]+src=[\"']([^\"']+)[\"']/i);
        if (imgMatch) {
          teacherPhotoUrl = imgMatch[1];
          if (teacherPhotoUrl.startsWith('/')) {
            teacherPhotoUrl = 'https://www.smtu.ru' + teacherPhotoUrl;
          }
        }
      }

      const lessonType = determineLessonType(rawType, subject);
      const timeStart = timeRaw.split('-')[0].trim();
      const timeSlotIndex = TIME_SLOT_MAP[timeStart] || (rowIndex + 1);

      lessons.push({
        id: `${groupId}-${dayIndex}-${timeStart}-${rowIndex}`,
        time: timeRaw,
        timeSlotIndex,
        subject,
        type: lessonType,
        rawType: rawType || (lessonType === 'lecture' ? 'Лекция' : 'Практика'),
        room,
        campus,
        groupName: parsedGroupName,
        weekParity,
        dateSpecific,
        teacher: teacherName ? {
          name: teacherName,
          photoUrl: teacherPhotoUrl
        } : undefined
      });
    });

    if (lessons.length > 0 || dayIndex <= 6) {
      days.push({
        dayName,
        dayIndex: dayIndex > 0 ? dayIndex : index + 1,
        lessons
      });
    }
  });

  return {
    groupId,
    groupName: groupName || (days[0]?.lessons[0]?.groupName || groupId),
    updatedAt: new Date().toISOString(),
    days
  };
}
