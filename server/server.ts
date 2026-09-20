import express from 'express';
import cors from 'cors';
import facultiesData from '../src/data/faculties.json' with { type: 'json' };
import sampleSchedulesData from '../src/data/sampleSchedules.json' with { type: 'json' };
import { parseSmtuScheduleHtml } from '../src/services/parser';
import { getAcademicWeek } from '../src/services/weekCalculator';
import { generateIcsCalendar } from '../src/services/calendarExport';
import { GroupSchedule } from '../src/types/schedule';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory cache for parsed schedules (TTL 1 hour)
interface CacheEntry {
  schedule: GroupSchedule;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), university: 'СПбГМТУ (Корабелка)' });
});

app.get('/api/faculties', (_req, res) => {
  res.json(facultiesData);
});

app.get('/api/week', (_req, res) => {
  const weekInfo = getAcademicWeek(new Date());
  res.json(weekInfo);
});

app.get('/api/schedule/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const force = req.query.force === 'true';

  // 1. Check cache
  const cached = cache.get(groupId);
  if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.schedule);
  }

  // 2. Fetch from smtu.ru
  try {
    const smtuUrl = `https://www.smtu.ru/ru/viewschedule_new/${groupId}/`;
    const response = await fetch(smtuUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      const html = await response.text();
      const parsed = parseSmtuScheduleHtml(html, groupId);
      if (parsed.days.some((d) => d.lessons.length > 0)) {
        cache.set(groupId, { schedule: parsed, timestamp: Date.now() });
        return res.json(parsed);
      }
    }
  } catch (err) {
    console.warn(`[Proxy] Error fetching from smtu.ru for group ${groupId}:`, err);
  }

  // 3. Fallback to sample data
  const sampleMap = sampleSchedulesData as Record<string, GroupSchedule>;
  if (sampleMap[groupId]) {
    return res.json(sampleMap[groupId]);
  }

  // 4. Return 404 or empty fallback
  return res.status(404).json({ error: 'Schedule not found or upstream unavailable', groupId });
});

app.get('/api/ics/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const cached = cache.get(groupId);
  let schedule = cached?.schedule;

  if (!schedule) {
    const sampleMap = sampleSchedulesData as Record<string, GroupSchedule>;
    schedule = sampleMap[groupId];
  }

  if (!schedule) {
    return res.status(404).send('Schedule not available for calendar export');
  }

  const icsData = generateIcsCalendar(schedule);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="smtu_${schedule.groupName}.ics"`);
  res.send(icsData);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[СПбГМТУ Расписание API] Server running on http://localhost:${PORT}`);
  });
}

export default app;
