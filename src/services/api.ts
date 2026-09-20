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
    const clean = query.trim().toLowerCase();
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
      if (groupName) {
        const cachedByName = storage.getCachedSchedule(groupName);
        if (cachedByName) return cachedByName;
      }
    }

    const baseUrl = import.meta.env.BASE_URL || '/';

    // 2. Try fetching from local Express proxy / server
    try {
      const res = await fetch(`/api/schedule/${groupId}`, {
        signal: AbortSignal.timeout(3000),
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
        signal: AbortSignal.timeout(4000),
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

    // 4. Try static bundle relative URL (e.g. on GitHub Pages: <baseUrl>data/g/<groupId>.json or <groupName>.json)
    try {
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
      // Try groupName alias
    }

    if (groupName && groupName !== groupId) {
      try {
        const staticRes = await fetch(`${baseUrl}data/g/${encodeURIComponent(groupName)}.json`, {
          signal: AbortSignal.timeout(3000),
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
      const mirrorUrl = `https://cryptoteep.github.io/smtu-schedule/data/g/${groupId}.json`;
      const mirrorRes = await fetch(mirrorUrl, {
        signal: AbortSignal.timeout(3000),
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
   * Get all teachers (664 professors)
   */
  getTeachers(): TeacherItem[] {
    return teachers;
  },

  /**
   * Search teachers by name
   */
  searchTeachers(query: string): TeacherItem[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    const results: TeacherItem[] = [];
    for (const t of teachers) {
      if (t.name.toLowerCase().includes(clean)) {
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
    const clean = query.trim().toLowerCase();
    for (const t of teachers) {
      if (t.id === query || t.name.toLowerCase() === clean) {
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
    const key = teacherIdOrName || teacherName;
    const resolvedName = teacherName || api.findTeacher(key)?.name || key;
    const resolvedId = api.findTeacher(key)?.id || teacherIdOrName;
    const safeName = resolvedName.replace(/\s+/g, '_');

    // 1. Check storage cache
    if (!forceRefresh) {
      const cached = storage.getCachedTeacherSchedule(key);
      if (cached) return cached;
      if (resolvedId !== key) {
        const cachedById = storage.getCachedTeacherSchedule(resolvedId);
        if (cachedById) return cachedById;
      }
      if (resolvedName !== key) {
        const cachedByName = storage.getCachedTeacherSchedule(resolvedName);
        if (cachedByName) return cachedByName;
      }
    }

    const baseUrl = import.meta.env.BASE_URL || '/';

    // 2. Try static bundle by ID (e.g. data/t/101326.json)
    if (resolvedId) {
      try {
        const res = await fetch(`${baseUrl}data/t/${encodeURIComponent(resolvedId)}.json`, {
          signal: AbortSignal.timeout(3000),
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
          signal: AbortSignal.timeout(3000),
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
          { signal: AbortSignal.timeout(3000) }
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
          signal: AbortSignal.timeout(4000),
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
    return {
      groupId: `teacher_${teacherSchedule.teacherId || teacherSchedule.teacherName}`,
      groupName: teacherSchedule.teacherName,
      facultyName: 'Преподаватель СПбГМТУ',
      updatedAt: teacherSchedule.updatedAt,
      days: teacherSchedule.days,
    };
  },
};
