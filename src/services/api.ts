import { Faculty, GroupItem, GroupSchedule, Lesson } from '../types/schedule';
import facultiesData from '../data/faculties.json';
import sampleSchedulesData from '../data/sampleSchedules.json';
import { storage } from './storage';
import { parseSmtuScheduleHtml } from './parser';

const faculties: Faculty[] = facultiesData as Faculty[];
const sampleSchedules: Record<string, GroupSchedule> = sampleSchedulesData as Record<string, GroupSchedule>;

export const api = {
  /**
   * Get all faculties with groups
   */
  getFaculties(): Faculty[] {
    return faculties;
  },

  /**
   * Search groups by name prefix/match
   */
  searchGroups(query: string): { group: GroupItem; faculty: Faculty }[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    const results: { group: GroupItem; faculty: Faculty }[] = [];
    for (const fac of faculties) {
      for (const g of fac.groups) {
        if (g.name.toLowerCase().includes(clean)) {
          results.push({ group: g, faculty: fac });
          if (results.length >= 30) return results;
        }
      }
    }
    return results;
  },

  /**
   * Find group by ID or name
   */
  findGroup(query: string): { group: GroupItem; faculty: Faculty } | null {
    const clean = query.trim().toLowerCase();
    for (const fac of faculties) {
      for (const g of fac.groups) {
        if (g.id === clean || g.name.toLowerCase() === clean) {
          return { group: g, faculty: fac };
        }
      }
    }
    return null;
  },

  /**
   * Fetch schedule for a group (cache-first + network + sample fallback)
   */
  async getSchedule(groupId: string, groupName = '', forceRefresh = false): Promise<GroupSchedule> {
    // 1. Check local storage cache if not force refresh
    if (!forceRefresh) {
      const cached = storage.getCachedSchedule(groupId);
      if (cached) {
        return cached;
      }
    }

    // 2. Try fetching from local Express proxy / server
    try {
      const res = await fetch(`/api/schedule/${groupId}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const schedule: GroupSchedule = await res.json();
        if (schedule && schedule.days) {
          storage.setCachedSchedule(schedule);
          return schedule;
        }
      }
    } catch {
      // Backend not running or offline, proceed to next source
    }

    // 3. Try direct smtu.ru fetch (works in Capacitor Android / mobile or if CORS allowed)
    try {
      const directRes = await fetch(`https://www.smtu.ru/ru/viewschedule_new/${groupId}/`, {
        headers: {
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8',
        },
        signal: AbortSignal.timeout(5000),
      });
      if (directRes.ok) {
        const html = await directRes.text();
        const parsed = parseSmtuScheduleHtml(html, groupId, groupName);
        if (parsed.days.some((d) => d.lessons.length > 0)) {
          storage.setCachedSchedule(parsed);
          return parsed;
        }
      }
    } catch {
      // Direct fetch restricted by CORS or network, proceed to pre-scraped mirrors
    }

    // 4. Try static bundle relative URL (e.g. on GitHub Pages: <baseUrl>data/g/<groupId>.json)
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const staticRes = await fetch(`${baseUrl}data/g/${groupId}.json`, {
        signal: AbortSignal.timeout(3000),
      });
      if (staticRes.ok) {
        const schedule: GroupSchedule = await staticRes.json();
        if (schedule && schedule.days) {
          storage.setCachedSchedule(schedule);
          return schedule;
        }
      }
    } catch {
      // Static file not reachable or 404
    }

    // 5. Try GitHub raw/pages mirror fallback
    try {
      const mirrorUrl = `https://cryptoteep.github.io/smtu-schedule/data/g/${groupId}.json`;
      const mirrorRes = await fetch(mirrorUrl, {
        signal: AbortSignal.timeout(4000),
      });
      if (mirrorRes.ok) {
        const schedule: GroupSchedule = await mirrorRes.json();
        if (schedule && schedule.days) {
          storage.setCachedSchedule(schedule);
          return schedule;
        }
      }
    } catch {
      // Mirror unavailable
    }

    // 6. Pre-cached sample schedule (built into JS bundle)
    if (sampleSchedules[groupId]) {
      const sched = sampleSchedules[groupId];
      storage.setCachedSchedule(sched);
      return sched;
    }
    if (groupName && sampleSchedules[groupName]) {
      const sched = sampleSchedules[groupName];
      storage.setCachedSchedule(sched);
      return sched;
    }

    // 7. Authentic empty schedule placeholder - NEVER generate fake/dummy classes!
    const gName = groupName || api.findGroup(groupId)?.group.name || groupId;
    const faculty = api.findGroup(groupId)?.faculty.faculty || 'СПбГМТУ';
    const emptySchedule: GroupSchedule = {
      groupId,
      groupName: gName,
      facultyName: faculty,
      updatedAt: new Date().toISOString(),
      days: [
        { dayName: 'Понедельник', dayIndex: 1, lessons: [] },
        { dayName: 'Вторник', dayIndex: 2, lessons: [] },
        { dayName: 'Среда', dayIndex: 3, lessons: [] },
        { dayName: 'Четверг', dayIndex: 4, lessons: [] },
        { dayName: 'Пятница', dayIndex: 5, lessons: [] },
        { dayName: 'Суббота', dayIndex: 6, lessons: [] },
      ],
    };
    storage.setCachedSchedule(emptySchedule);
    return emptySchedule;
  },

  /**
   * Search teachers across available schedules
   */
  async searchTeachers(query: string): Promise<{ teacherName: string; lessons: { lesson: Lesson; groupName: string; dayName: string }[] }[]> {
    const clean = query.trim().toLowerCase();
    if (!clean || clean.length < 2) return [];

    const map = new Map<string, { lesson: Lesson; groupName: string; dayName: string }[]>();

    // Search inside all cached and sample schedules
    const schedules = Object.values(sampleSchedules);
    schedules.forEach((sched) => {
      sched.days.forEach((day) => {
        day.lessons.forEach((l) => {
          if (l.teacher?.name && l.teacher.name.toLowerCase().includes(clean)) {
            const list = map.get(l.teacher.name) || [];
            list.push({ lesson: l, groupName: sched.groupName, dayName: day.dayName });
            map.set(l.teacher.name, list);
          }
        });
      });
    });

    return Array.from(map.entries()).map(([teacherName, lessons]) => ({
      teacherName,
      lessons,
    }));
  },
};
