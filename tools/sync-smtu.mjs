/**
 * Synchronizes real schedules directly from www.smtu.ru
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

// Simple regex-based SMTU parser matching src/services/parser.ts
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
      if (rowHtml.includes('id="week-up-container"') || rowHtml.includes('Верхняя неделя') || rowHtml.includes('fa-arrow-turn-up')) {
        weekParity = 'up';
      } else if (rowHtml.includes('id="week-down-container"') || rowHtml.includes('Нижняя неделя') || rowHtml.includes('fa-arrow-turn-down')) {
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
      let campus = 'Ульянка';
      if (room.startsWith('А') || room.includes('Корпус А')) campus = 'Лоцманская (А)';
      else if (room.startsWith('Б') || room.includes('Корпус Б')) campus = 'Лоцманская (Б)';
      else if (room.startsWith('Г') || room.includes('Корпус Г')) campus = 'Горьковская (Г)';
      else if (room.startsWith('М') || room.includes('Корпус М')) campus = 'Псковская (М)';
      else if (room.startsWith('С') || room.includes('Корпус С')) campus = 'Колледж';

      const parsedGroupName = cells[3].replace(/<[^>]+>/g, '').trim() || groupName;
      const subjectCell = cells[4];
      const spanMatch = subjectCell.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
      const smallMatch = subjectCell.match(/<small[^>]*>([\s\S]*?)<\/small>/i);
      let subject = spanMatch ? spanMatch[1].replace(/<[^>]+>/g, '').trim() : subjectCell.replace(/<[^>]+>/g, '').trim();
      let rawType = smallMatch ? smallMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      let dateSpecific;
      const dateMatch = subjectCell.match(/(\d{1,2}\.\d{1,2}(?:\s*(?:и|-|по)\s*\d{1,2}\.\d{1,2})*)/);
      if (dateMatch) dateSpecific = dateMatch[1];

      let teacherName = '';
      let teacherPhotoUrl;
      if (cells.length >= 6) {
        const teacherCell = cells[5];
        const aMatch = teacherCell.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
        const sMatch = teacherCell.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
        teacherName = (aMatch ? aMatch[1] : (sMatch ? sMatch[1] : teacherCell)).replace(/<[^>]+>/g, '').trim();
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
        teacher: teacherName ? { name: teacherName, photoUrl: teacherPhotoUrl } : undefined
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
  console.log('[Sync] Starting SMTU schedule synchronization...');
  const faculties = JSON.parse(fs.readFileSync(FACULTIES_FILE, 'utf8'));

  // Collect all groups
  const allGroups = [];
  for (const fac of faculties) {
    for (const g of fac.groups) {
      allGroups.push({ ...g, faculty: fac.faculty });
    }
  }
  console.log(`[Sync] Found ${allGroups.length} groups across ${faculties.length} faculties.`);

  // Initialize clean sampleSchedules for key offline groups
  const sampleSchedules = {};

  // Priority groups: groups from each faculty, popular groups like 3210, 12226-11, 12826-11, etc.
  const priorityGroupNames = [
    '3210', '12226-11', '12826-11', '12826-12', '12815-55', '20498',
    '1101', '1201', '1301', '1410', '2101', '2201', '2301', '2401', '2505',
    '3220', '3300', '3400', '4200', '4300', '4400', '5200', '5300', '5400',
    '7200', '7301', '7401', '8210', '8310', '8410', '10274', '10374'
  ];

  // Pick priority groups + top 12 from each faculty across courses
  const toSync = [];
  for (const name of priorityGroupNames) {
    const found = allGroups.find(g => g.name === name);
    if (found && !toSync.some(x => x.id === found.id)) {
      toSync.push(found);
    }
  }

  for (const fac of faculties) {
    for (const g of fac.groups.slice(0, 12)) {
      if (!toSync.some(x => x.id === g.id)) {
        toSync.push({ ...g, faculty: fac.faculty });
      }
    }
  }

  console.log(`[Sync] Fetching real live schedules for ${toSync.length} key groups directly from www.smtu.ru...`);
  let successCount = 0;
  let totalLessonsFound = 0;

  // Fetch with concurrency pool of 4 workers
  const CONCURRENCY = 4;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < toSync.length) {
      const idx = currentIndex++;
      const group = toSync[idx];
      try {
        const url = `https://www.smtu.ru/ru/viewschedule_new/${group.id}/`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8'
          },
          signal: AbortSignal.timeout(12000)
        });

        if (res.ok) {
          const html = await res.text();
          const parsed = parseHtml(html, group.id, group.name);
          const lessonCount = parsed.days.reduce((acc, d) => acc + d.lessons.length, 0);

          // Write to public/data/g/<id>.json
          const groupFilePath = path.join(GROUPS_DIR, `${group.id}.json`);
          fs.writeFileSync(groupFilePath, JSON.stringify(parsed, null, 2), 'utf8');

          // Store top core groups in sampleSchedules for instant zero-network offline loading
          const topCore = ['3210', '12226-11', '12826-12', '1101', '2201', '4200', '7200', '10274'];
          if (topCore.includes(group.name)) {
            sampleSchedules[group.id] = parsed;
            sampleSchedules[group.name] = parsed;
          }
          totalLessonsFound += lessonCount;

          successCount++;
          console.log(`  [${idx + 1}/${toSync.length}] Группа ${group.name} (id ${group.id}): ${lessonCount} пар.`);
        }
      } catch (e) {
        console.warn(`  [${idx + 1}/${toSync.length}] Ошибка для ${group.name}: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 150));
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  // Also include test_smtu.html (12226-11) and test_3210.html (3210) if present
  if (fs.existsSync(path.join(ROOT, 'test_smtu.html'))) {
    const html = fs.readFileSync(path.join(ROOT, 'test_smtu.html'), 'utf8');
    const p12226 = parseHtml(html, '7798', '12226-11');
    sampleSchedules['7798'] = p12226;
    sampleSchedules['12226-11'] = p12226;
    fs.writeFileSync(path.join(GROUPS_DIR, '7798.json'), JSON.stringify(p12226, null, 2), 'utf8');
  }

  if (fs.existsSync(path.join(ROOT, 'test_3210.html'))) {
    const html = fs.readFileSync(path.join(ROOT, 'test_3210.html'), 'utf8');
    const p3210 = parseHtml(html, '7624', '3210');
    sampleSchedules['7624'] = p3210;
    sampleSchedules['3210'] = p3210;
    fs.writeFileSync(path.join(GROUPS_DIR, '7624.json'), JSON.stringify(p3210, null, 2), 'utf8');
  }

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
      hasPrecachedSchedule: !!sampleSchedules[g.id]
    }))
  };
  fs.writeFileSync(path.join(DATA_DIR, 'index.json'), JSON.stringify(indexData, null, 2), 'utf8');

  console.log(`[Sync] Finished: Synced ${successCount} groups, total ${totalLessonsFound} real lessons saved.`);
}

main().catch(err => {
  console.error('[Sync] Fatal error:', err);
  process.exit(1);
});
