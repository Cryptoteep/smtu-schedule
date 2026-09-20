import { Faculty, GroupItem, GroupSchedule, TeacherItem, TeacherSchedule } from '../types/schedule';
import facultiesData from '../data/faculties.json';
import sampleSchedulesData from '../data/sampleSchedules.json';
import teachersData from '../data/teachers.json';
import sampleTeachersData from '../data/sampleTeachers.json';
import { storage } from './storage';
import { parseSmtuScheduleHtml } from './parser';

const faculties: Faculty[] = facultiesData as Faculty[];
const sampleSchedules: Record<string, GroupSchedule> = sampleSchedulesData as Record<string, GroupSchedule>;
const teachers: TeacherItem[] = teachersData as TeacherItem[];
const sampleTeachers: Record<string, TeacherSchedule> = sampleTeachersData as Record<string, TeacherSchedule>;

function safeTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    try {
      return AbortSignal.timeout(ms);
    } catch {}
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export const api = {
  /**
   * Get all faculties with groups (412 groups)
   */
  getFaculties(): Faculty[] {
    return faculties;
  },

  /**
   * Search groups by name prefix/match
   */
  searchGroups(query: string): { group: GroupItem; faculty: Faculty }[] {
    if (!query || typeof query !== 'string') return [];
    const raw = query.trim().toLowerCase();
    if (!raw) return [];

    // Strip common prefixes like "группа", "гр.", "гр", "group"
    const clean = raw.replace(/^(?:группа|гр\.?|group)\s*/i, '').trim();
    if (!clean) return [];

    const results: { group: GroupItem; faculty: Faculty }[] = [];
    for (const fac of faculties) {
      for (const g of fac.groups) {
        if (g.name.toLowerCase().includes(clean)) {
          results.push({ group: g, faculty: fac });
          if (results.length >= 40) return results;
        }
      }
    }
    return results;
  },

  /**
   * Find group by ID or name
   */
  findGroup(query: string): { group: GroupItem; faculty: Faculty } | null {
    if (!query || typeof query !== 'string') return null;
    const clean = query.trim().toLowerCase();
    if (!clean) return null;
    for (const fac of faculties) {
      for (const g of fac.groups) {
        if (g.id.toLowerCase() === clean || g.name.toLowerCase() === clean) {
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
    const rawId = String(groupId || '').trim();
    const rawName = String(groupName || '').trim();
    const cleanId = rawId || rawName;
    if (!cleanId) {
      throw new Error('Идентификатор группы не задан');
    }

    // 1. Check local storage cache if not force refresh
    if (!forceRefresh) {
      const cached = storage.getCachedSchedule(cleanId);
      if (cached) {
        return cached;
      }
      if (rawName && rawName !== cleanId) {
        const cachedByName = storage.getCachedSchedule(rawName);
        if (cachedByName) return cachedByName;
      }
    }

    const baseUrl = import.meta.env.BASE_URL || '/';

    // 2. Try fetching from local Express proxy / server
    try {
      const res = await fetch(`/api/schedule/${encodeURIComponent(cleanId)}`, {
        signal: safeTimeoutSignal(3000),
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
      const directRes = await fetch(`https://www.smtu.ru/ru/viewschedule_new/${encodeURIComponent(cleanId)}/`, {
        headers: {
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8',
        },
        signal: safeTimeoutSignal(4000),
      });
      if (directRes.ok) {
        const html = await directRes.text();
        const parsed = parseSmtuScheduleHtml(html, cleanId, rawName);
        if (parsed.days.some((d) => d.lessons.length > 0)) {
          storage.setCachedSchedule(parsed);
          return parsed;
        }
      }
    } catch {
      // Direct fetch restricted by CORS or network, proceed to pre-scraped mirrors
    }

    // 4. Try static bundle relative URL (e.g. on GitHub Pages: <baseUrl>data/g/<groupId>.json or <groupName>.json)
    try {
      const staticRes = await fetch(`${baseUrl}data/g/${encodeURIComponent(cleanId)}.json`, {
        signal: safeTimeoutSignal(3000),
      });
      if (staticRes.ok) {
        const schedule: GroupSchedule = await staticRes.json();
        if (schedule && schedule.days) {
          storage.setCachedSchedule(schedule);
          return schedule;
        }
      }
    } catch {
      // Try groupName alias
    }

    if (rawName && rawName !== cleanId) {
      try {
        const staticRes = await fetch(`${baseUrl}data/g/${encodeURIComponent(rawName)}.json`, {
          signal: safeTimeoutSignal(3000),
        });
        if (staticRes.ok) {
          const schedule: GroupSchedule = await staticRes.json();
          if (schedule && schedule.days) {
            storage.setCachedSchedule(schedule);
            return schedule;
          }
        }
      } catch {}
    }

    // 5. Try GitHub raw/pages mirror fallback
    try {
      const mirrorUrl = `https://cryptoteep.github.io/smtu-schedule/data/g/${encodeURIComponent(cleanId)}.json`;
      const mirrorRes = await fetch(mirrorUrl, {
        signal: safeTimeoutSignal(3000),
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
    if (sampleSchedules[cleanId]) {
      const sched = sampleSchedules[cleanId];
      storage.setCachedSchedule(sched);
      return sched;
    }
    if (rawName && sampleSchedules[rawName]) {
      const sched = sampleSchedules[rawName];
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
   * Get all teachers (664 professors)
   */
  getTeachers(): TeacherItem[] {
    return teachers;
  },

  /**
   * Search teachers by name
   */
  searchTeachers(query: string): TeacherItem[] {
    if (!query || typeof query !== 'string') return [];
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    // Extract search tokens, e.g. "Чихонадских Е.А." -> ["чихонадских", "е", "а"]
    const tokens = clean
      .split(/[\s,.\-_/]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tokens.length === 0) return [];

    const results: TeacherItem[] = [];
    for (const t of teachers) {
      const nameLower = t.name.toLowerCase();

      // Fast check: direct substring match
      if (nameLower.includes(clean)) {
        results.push(t);
        if (results.length >= 50) break;
        continue;
      }

      // Token-based matching: each token matches either a word or an initial
      const nameWords = nameLower.split(/\s+/);
      const allTokensMatch = tokens.every((tok) => {
        return nameWords.some((word) => {
          if (tok.length === 1) {
            return word.startsWith(tok);
          }
          return word.includes(tok);
        });
      });

      if (allTokensMatch) {
        results.push(t);
        if (results.length >= 50) break;
      }
    }
    return results;
  },

  /**
   * Find teacher by ID or exact name
   */
  findTeacher(query: string): TeacherItem | null {
    if (!query || typeof query !== 'string') return null;
    const clean = query.trim().toLowerCase();
    if (!clean) return null;
    for (const t of teachers) {
      if (t.id.toLowerCase() === clean || t.name.toLowerCase() === clean) {
        return t;
      }
    }
    return null;
  },

  /**
   * Fetch full schedule for a teacher
   */
  async getTeacherSchedule(
    teacherIdOrName: string,
    teacherName = '',
    forceRefresh = false
  ): Promise<TeacherSchedule> {
    const rawKey = String(teacherIdOrName || teacherName || '').trim();
    if (!rawKey) {
      throw new Error('Идентификатор преподавателя не задан');
    }
    const resolvedName = teacherName || api.findTeacher(rawKey)?.name || rawKey;
    const resolvedId = api.findTeacher(rawKey)?.id || teacherIdOrName || rawKey;
    const safeName = resolvedName.replace(/\s+/g, '_');

    // 1. Check storage cache
    if (!forceRefresh) {
      const cached = storage.getCachedTeacherSchedule(rawKey);
      if (cached) return cached;
      if (resolvedId !== rawKey) {
        const cachedById = storage.getCachedTeacherSchedule(resolvedId);
        if (cachedById) return cachedById;
      }
      if (resolvedName !== rawKey) {
        const cachedByName = storage.getCachedTeacherSchedule(resolvedName);
        if (cachedByName) return cachedByName;
      }
    }

    const baseUrl = import.meta.env.BASE_URL || '/';

    // 2. Try static bundle by ID (e.g. data/t/101326.json)
    if (resolvedId) {
      try {
        const res = await fetch(`${baseUrl}data/t/${encodeURIComponent(resolvedId)}.json`, {
          signal: safeTimeoutSignal(3000),
        });
        if (res.ok) {
          const sched: TeacherSchedule = await res.json();
          if (sched && sched.days) {
            storage.setCachedTeacherSchedule(sched);
            return sched;
          }
        }
      } catch {}
    }

    // 3. Try static bundle by safeName (e.g. data/t/Чихонадских_Елена_Александровна.json)
    if (safeName) {
      try {
        const res = await fetch(`${baseUrl}data/t/${encodeURIComponent(safeName)}.json`, {
          signal: safeTimeoutSignal(3000),
        });
        if (res.ok) {
          const sched: TeacherSchedule = await res.json();
          if (sched && sched.days) {
            storage.setCachedTeacherSchedule(sched);
            return sched;
          }
        }
      } catch {}
    }

    // 4. Try GitHub mirror
    if (resolvedId) {
      try {
        const mirrorRes = await fetch(
          `https://cryptoteep.github.io/smtu-schedule/data/t/${encodeURIComponent(resolvedId)}.json`,
          { signal: safeTimeoutSignal(3000) }
        );
        if (mirrorRes.ok) {
          const sched: TeacherSchedule = await mirrorRes.json();
          if (sched && sched.days) {
            storage.setCachedTeacherSchedule(sched);
            return sched;
          }
        }
      } catch {}
    }

    // 5. Pre-cached sample teacher schedule
    if (sampleTeachers[resolvedId]) {
      const sched = sampleTeachers[resolvedId];
      storage.setCachedTeacherSchedule(sched);
      return sched;
    }
    if (sampleTeachers[safeName]) {
      const sched = sampleTeachers[safeName];
      storage.setCachedTeacherSchedule(sched);
      return sched;
    }
    if (sampleTeachers[resolvedName]) {
      const sched = sampleTeachers[resolvedName];
      storage.setCachedTeacherSchedule(sched);
      return sched;
    }

    // 6. Direct fetch if numeric id (e.g. 101326) and capacitor / proxy available
    if (/^\d+$/.test(resolvedId)) {
      try {
        const directRes = await fetch(`https://www.smtu.ru/ru/viewschedule_new/teacher/${resolvedId}/`, {
          headers: { 'Accept-Language': 'ru-RU,ru;q=0.9' },
          signal: safeTimeoutSignal(4000),
        });
        if (directRes.ok) {
          const html = await directRes.text();
          const parsed = parseSmtuScheduleHtml(html, `t_${resolvedId}`, resolvedName);
          const teacherSched: TeacherSchedule = {
            teacherId: resolvedId,
            teacherName: resolvedName,
            profileUrl: `https://www.smtu.ru/ru/viewperson/${resolvedId}/`,
            updatedAt: new Date().toISOString(),
            totalLessons: parsed.days.reduce((acc, d) => acc + d.lessons.length, 0),
            days: parsed.days,
          };
          if (teacherSched.totalLessons > 0) {
            storage.setCachedTeacherSchedule(teacherSched);
            return teacherSched;
          }
        }
      } catch {}
    }

    // 7. Fallback empty teacher schedule
    const teacherItem = api.findTeacher(resolvedName);
    const emptyTeacherSchedule: TeacherSchedule = {
      teacherId: resolvedId,
      teacherName: resolvedName,
      photoUrl: teacherItem?.photoUrl,
      profileUrl: teacherItem?.profileUrl,
      updatedAt: new Date().toISOString(),
      totalLessons: 0,
      days: [
        { dayName: 'Понедельник', dayIndex: 1, lessons: [] },
        { dayName: 'Вторник', dayIndex: 2, lessons: [] },
        { dayName: 'Среда', dayIndex: 3, lessons: [] },
        { dayName: 'Четверг', dayIndex: 4, lessons: [] },
        { dayName: 'Пятница', dayIndex: 5, lessons: [] },
        { dayName: 'Суббота', dayIndex: 6, lessons: [] },
      ],
    };
    storage.setCachedTeacherSchedule(emptyTeacherSchedule);
    return emptyTeacherSchedule;
  },

  /**
   * Converts a TeacherSchedule into a GroupSchedule for unified rendering in views
   */
  teacherScheduleToGroupSchedule(teacherSchedule: TeacherSchedule): GroupSchedule {
    if (!teacherSchedule) {
      return {
        groupId: 'teacher_unknown',
        groupName: 'Преподаватель',
        facultyName: 'Преподаватель СПбГМТУ',
        updatedAt: new Date().toISOString(),
        days: [],
      };
    }
    return {
      groupId: `teacher_${teacherSchedule.teacherId || teacherSchedule.teacherName || 'unknown'}`,
      groupName: teacherSchedule.teacherName || '',
      facultyName: 'Преподаватель СПбГМТУ',
      updatedAt: teacherSchedule.updatedAt || new Date().toISOString(),
      days: teacherSchedule.days || [],
    };
  },
};
