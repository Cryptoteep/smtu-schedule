/**
 * Synchronizes real schedules directly from www.smtu.ru for ALL groups in the university.
 * Generates public/data/g/<id>.json and updates src/data/sampleSchedules.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FACULTIES_FILE = path.join(ROOT, 'src', 'data', 'faculties.json');
const SAMPLE_FILE = path.join(ROOT, 'src', 'data', 'sampleSchedules.json');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const GROUPS_DIR = path.join(DATA_DIR, 'g');

if (!fs.existsSync(GROUPS_DIR)) {
  fs.mkdirSync(GROUPS_DIR, { recursive: true });
}

// Campuses lookup matching src/data/campuses.ts
function getCampusName(room) {
  if (!room) return 'СПбГМТУ';
  const str = room.trim();
  const corpusMatch = str.match(/Корпус\s+([А-ЯЁA-Z])/i);
  if (corpusMatch) {
    const l = corpusMatch[1].toUpperCase();
    if (l === 'У') return 'Ульянка (Корпус У)';
    if (l === 'А') return 'Лоцманская (Корпус А)';
    if (l === 'Б') return 'Лоцманская (Корпус Б)';
    if (l === 'Г') return 'Горьковская (Корпус Г)';
    if (l === 'М') return 'Псковская (Корпус М)';
    if (l === 'С') return 'Колледж СПбГМТУ (СТФ)';
  }
  const first = str.charAt(0).toUpperCase();
  if (first === 'У') return 'Ульянка (Корпус У)';
  if (first === 'А') return 'Лоцманская (Корпус А)';
  if (first === 'Б') return 'Лоцманская (Корпус Б)';
  if (first === 'Г') return 'Горьковская (Корпус Г)';
  if (first === 'М') return 'Псковская (Корпус М)';
  if (first === 'С') return 'Колледж СПбГМТУ (СТФ)';
  if (str.toLowerCase().includes('конгресс') || str.toLowerCase().includes('спортзал') || str.toLowerCase().includes('бассейн')) {
    return 'Ульянка (Корпус У)';
  }
  return 'СПбГМТУ';
}

function parseHtml(html, groupId, groupName) {
  const days = [];
  const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  const tables = html.match(tableRegex) || [];
  const sections = html.split(/<table/i);

  tables.forEach((tableHtml, index) => {
    let dayName = DAY_NAMES[index] || `День ${index + 1}`;
    const preceding = sections[index] || '';
    for (const name of DAY_NAMES) {
      if (preceding.toLowerCase().includes(name.toLowerCase())) {
        dayName = name;
        break;
      }
    }
    const dayIndex = DAY_NAMES.indexOf(dayName) + 1;
    const lessons = [];
    const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];

    rows.forEach((rowHtml, rowIndex) => {
      let weekParity = 'both';
      if (rowHtml.includes('id="week-up-container"') || rowHtml.includes('Верхняя неделя') || rowHtml.includes('fa-arrow-turn-up') || rowHtml.includes('js-week-1')) {
        weekParity = 'up';
      } else if (rowHtml.includes('id="week-down-container"') || rowHtml.includes('Нижняя неделя') || rowHtml.includes('fa-arrow-turn-down') || rowHtml.includes('js-week-2')) {
        weekParity = 'down';
      }

      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      const cells = [];
      let m;
      while ((m = cellRegex.exec(rowHtml)) !== null) {
        cells.push(m[1]);
      }
      if (cells.length < 5) return;

      const timeRaw = cells[0].replace(/<[^>]+>/g, '').trim();
      if (!timeRaw || !timeRaw.includes(':') || timeRaw.toLowerCase().includes('время')) return;

      const room = cells[2].replace(/<[^>]+>/g, '').trim();
      const campus = getCampusName(room);
      const parsedGroupName = cells[3].replace(/<[^>]+>/g, '').trim() || groupName;

      const subjectCell = cells[4];
      const spanMatch = subjectCell.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
      const smallMatch = subjectCell.match(/<small[^>]*>([\s\S]*?)<\/small>/i);
      let subject = spanMatch ? spanMatch[1].replace(/<[^>]+>/g, '').trim() : subjectCell.replace(/<[^>]+>/g, '').trim();
      let rawType = smallMatch ? smallMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      let dateSpecific;
      const dateMatch = subjectCell.match(/(\d{1,2}\.\d{1,2}(?:\s*(?:и|-|по)\s*\d{1,2}\.\d{1,2})*)/);
      if (dateMatch) dateSpecific = dateMatch[1];

      // Exact occurrences and dateRange from title attribute or dates column
      let exactDates;
      let dateRange;
      const titleMatch = rowHtml.match(/title=[\"'](\d{2}\.\d{2}\.\d{4}[^\"']*)[\"']/i);
      if (titleMatch) {
        exactDates = titleMatch[1].split(',').map(s => s.trim()).filter(s => /^\d{2}\.\d{2}\.\d{4}$/.test(s));
      }
      const rangeMatch = rowHtml.match(/<td[^>]*>(\d{1,2}\s+[а-яёА-ЯЁ]+\s*—\s*\d{1,2}\s+[а-яёА-ЯЁ]+\s*\d{4})<\/td>/i);
      if (rangeMatch) {
        dateRange = rangeMatch[1].trim();
      }

      let teacherName = '';
      let teacherId;
      let teacherPhotoUrl;
      if (cells.length >= 6) {
        const teacherCell = cells[5];
        const aMatch = teacherCell.match(/<a[^>]*href=[\"']\/ru\/viewperson\/(\d+)\/?[\"'][^>]*>([\s\S]*?)<\/a>/i);
        const sMatch = teacherCell.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
        if (aMatch) {
          teacherId = aMatch[1];
          teacherName = aMatch[2].replace(/<[^>]+>/g, '').trim();
        } else {
          teacherName = (sMatch ? sMatch[1] : teacherCell).replace(/<[^>]+>/g, '').trim();
        }
        const pMatch = teacherCell.match(/\/ru\/viewperson\/(\d+)/i);
        if (pMatch) teacherId = pMatch[1];

        const imgMatch = teacherCell.match(/<img[^>]+src=[\"']([^\"']+)[\"']/i);
        if (imgMatch) {
          teacherPhotoUrl = imgMatch[1].startsWith('/') ? 'https://www.smtu.ru' + imgMatch[1] : imgMatch[1];
        }
      }

      let type = 'practice';
      const lType = rawType.toLowerCase();
      const lSub = subject.toLowerCase();
      if (lType.includes('лекц') || lSub.includes('лекция')) type = 'lecture';
      else if (lType.includes('лаб') || lSub.includes('лабораторн')) type = 'lab';
      else if (lType.includes('воен') || lSub.includes('воен')) type = 'military';
      else if (lType.includes('экзамен') || lType.includes('зачет')) type = 'exam';

      const timeSlotMap = { '08:30': 1, '10:10': 2, '11:50': 3, '14:00': 4, '15:40': 5, '17:20': 6, '19:00': 7 };
      const timeStart = timeRaw.split('-')[0].trim();
      const timeSlotIndex = timeSlotMap[timeStart] || (rowIndex + 1);

      lessons.push({
        id: `${groupId}-${dayIndex}-${timeStart}-${rowIndex}`,
        time: timeRaw,
        timeSlotIndex,
        subject,
        type,
        rawType: rawType || (type === 'lecture' ? 'Лекция' : 'Практика'),
        room,
        campus,
        groupName: parsedGroupName,
        weekParity,
        dateSpecific,
        dateRange,
        exactDates,
        teacher: teacherName ? {
          name: teacherName,
          id: teacherId,
          profileUrl: teacherId ? `https://www.smtu.ru/ru/viewperson/${teacherId}/` : undefined,
          photoUrl: teacherPhotoUrl
        } : undefined
      });
    });

    if (lessons.length > 0 || dayIndex <= 6) {
      days.push({ dayName, dayIndex: dayIndex > 0 ? dayIndex : index + 1, lessons });
    }
  });

  return {
    groupId,
    groupName: groupName || (days[0]?.lessons[0]?.groupName || groupId),
    updatedAt: new Date().toISOString(),
    days
  };
}

async function main() {
  console.log('[Sync] Starting full university SMTU schedule synchronization...');
  const faculties = JSON.parse(fs.readFileSync(FACULTIES_FILE, 'utf8'));

  // Collect all groups from faculties.json
  const allGroups = [];
  for (const fac of faculties) {
    for (const g of fac.groups) {
      allGroups.push({ ...g, faculty: fac.faculty });
    }
  }
  console.log(`[Sync] Found ${allGroups.length} groups across ${faculties.length} faculties.`);

  // Initialize clean sampleSchedules for key offline groups
  const sampleSchedules = {};

  // Top core groups stored directly in bundle for instant zero-network start
  const topCoreGroupNames = [
    '3210', '3280', '12226-11', '12826-11', '12826-12', '12815-55',
    '1101', '1201', '2201', '3220', '4200', '7200', '10274'
  ];

  // We sync ALL 412 groups!
  const toSync = allGroups;

  console.log(`[Sync] Fetching real live schedules for ALL ${toSync.length} groups directly from www.smtu.ru...`);
  let successCount = 0;
  let totalLessonsFound = 0;

  // Fetch with concurrency pool of 8 workers
  const CONCURRENCY = 8;
  let currentIndex = 0;

  async function worker(workerId) {
    while (currentIndex < toSync.length) {
      const idx = currentIndex++;
      const group = toSync[idx];
      let ok = false;

      // Retry up to 2 times
      for (let attempt = 0; attempt < 2 && !ok; attempt++) {
        try {
          const url = `https://www.smtu.ru/ru/viewschedule_new/${group.id}/`;
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
              'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8'
            },
            signal: AbortSignal.timeout(10000)
          });

          if (res.ok) {
            const html = await res.text();
            const parsed = parseHtml(html, group.id, group.name);
            const lessonCount = parsed.days.reduce((acc, d) => acc + d.lessons.length, 0);

            // Write to public/data/g/<id>.json
            const groupFilePath = path.join(GROUPS_DIR, `${group.id}.json`);
            fs.writeFileSync(groupFilePath, JSON.stringify(parsed, null, 2), 'utf8');

            // Store in sampleSchedules if core
            if (topCoreGroupNames.includes(group.name)) {
              sampleSchedules[group.id] = parsed;
              sampleSchedules[group.name] = parsed;
            }
            totalLessonsFound += lessonCount;
            successCount++;
            ok = true;

            if (idx % 25 === 0 || idx === toSync.length - 1 || group.name === '3280') {
              console.log(`  [${idx + 1}/${toSync.length}] Группа ${group.name} (id ${group.id}): ${lessonCount} пар.`);
            }
          }
        } catch (e) {
          if (attempt === 1) {
            console.warn(`  [${idx + 1}/${toSync.length}] Ошибка для ${group.name}: ${e.message}`);
          }
          await new Promise(r => setTimeout(r, 300));
        }
      }
      await new Promise(r => setTimeout(r, 60));
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i));
  await Promise.all(workers);

  // Save updated sampleSchedules.json
  fs.writeFileSync(SAMPLE_FILE, JSON.stringify(sampleSchedules, null, 2), 'utf8');

  // Save index.json
  const indexData = {
    updatedAt: new Date().toISOString(),
    totalGroups: allGroups.length,
    cachedGroups: Object.keys(sampleSchedules).length / 2,
    groups: allGroups.map(g => ({
      id: g.id,
      name: g.name,
      faculty: g.faculty,
      course: g.course,
      hasPrecachedSchedule: !!sampleSchedules[g.id] || fs.existsSync(path.join(GROUPS_DIR, `${g.id}.json`))
    }))
  };
  fs.writeFileSync(path.join(DATA_DIR, 'index.json'), JSON.stringify(indexData, null, 2), 'utf8');

  console.log(`[Sync] Finished: Successfully synced ${successCount}/${toSync.length} groups, total ${totalLessonsFound} real lessons saved across all 412 groups.`);
}

main().catch(err => {
  console.error('[Sync] Fatal error:', err);
  process.exit(1);
});
