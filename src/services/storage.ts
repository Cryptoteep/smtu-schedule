import { GroupSchedule, GroupItem, LessonNote, TeacherItem, TeacherSchedule, ScheduleMode } from '../types/schedule';

const KEYS = {
  CURRENT_GROUP: 'smtu_current_group',
  CURRENT_TEACHER: 'smtu_current_teacher',
  SCHEDULE_MODE: 'smtu_schedule_mode',
  FAVORITES: 'smtu_favorite_groups',
  FAVORITE_TEACHERS: 'smtu_favorite_teachers',
  RECENT_GROUPS: 'smtu_recent_groups',
  RECENT_TEACHERS: 'smtu_recent_teachers',
  SCHEDULE_CACHE_PREFIX: 'smtu_sched_cache_v2_',
  TEACHER_CACHE_PREFIX: 'smtu_teacher_cache_v2_',
  NOTES: 'smtu_lesson_notes',
  THEME: 'smtu_theme_mode',
  WEEK_FILTER: 'smtu_week_filter',
};

export const storage = {
  getMode(): ScheduleMode {
    try {
      return (localStorage.getItem(KEYS.SCHEDULE_MODE) as ScheduleMode) || 'group';
    } catch {
      return 'group';
    }
  },

  setMode(mode: ScheduleMode): void {
    try {
      localStorage.setItem(KEYS.SCHEDULE_MODE, mode);
    } catch {}
  },

  getCurrentGroup(): GroupItem | null {
    try {
      const data = localStorage.getItem(KEYS.CURRENT_GROUP);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getCurrentTeacher(): TeacherItem | null {
    try {
      const data = localStorage.getItem(KEYS.CURRENT_TEACHER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentTeacher(teacher: TeacherItem): void {
    if (!teacher) return;
    try {
      localStorage.setItem(KEYS.CURRENT_TEACHER, JSON.stringify(teacher));
      storage.addRecentTeacher(teacher);
    } catch (e) {
      storage.evictOldCaches();
      try {
        localStorage.setItem(KEYS.CURRENT_TEACHER, JSON.stringify(teacher));
      } catch {}
    }
  },

  getRecentTeachers(): TeacherItem[] {
    try {
      const data = localStorage.getItem(KEYS.RECENT_TEACHERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addRecentTeacher(teacher: TeacherItem): void {
    if (!teacher) return;
    try {
      const recents = storage.getRecentTeachers().filter((t) => t.id !== teacher.id && t.name !== teacher.name);
      const updated = [teacher, ...recents].slice(0, 8);
      localStorage.setItem(KEYS.RECENT_TEACHERS, JSON.stringify(updated));
    } catch {}
  },

  getCachedTeacherSchedule(teacherIdOrName: string): TeacherSchedule | null {
    if (!teacherIdOrName) return null;
    try {
      const data = localStorage.getItem(KEYS.TEACHER_CACHE_PREFIX + teacherIdOrName);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCachedTeacherSchedule(schedule: TeacherSchedule): void {
    if (!schedule) return;
    const save = () => {
      if (schedule.teacherId) {
        localStorage.setItem(KEYS.TEACHER_CACHE_PREFIX + schedule.teacherId, JSON.stringify(schedule));
      }
      if (schedule.teacherName && schedule.teacherName !== schedule.teacherId) {
        localStorage.setItem(KEYS.TEACHER_CACHE_PREFIX + schedule.teacherName, JSON.stringify(schedule));
      }
    };
    try {
      save();
    } catch {
      storage.evictOldCaches();
      try { save(); } catch {}
    }
  },

  setCurrentGroup(group: GroupItem): void {
    if (!group) return;
    try {
      localStorage.setItem(KEYS.CURRENT_GROUP, JSON.stringify(group));
      storage.addRecentGroup(group);
    } catch (e) {
      storage.evictOldCaches();
      try {
        localStorage.setItem(KEYS.CURRENT_GROUP, JSON.stringify(group));
      } catch {}
    }
  },

  evictOldCaches(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith(KEYS.SCHEDULE_CACHE_PREFIX) || k.startsWith(KEYS.TEACHER_CACHE_PREFIX))) {
          keysToRemove.push(k);
        }
      }
      // Evict oldest cached schedules to release browser storage quota
      keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });
    } catch {}
  },

  getFavorites(): GroupItem[] {
    try {
      const data = localStorage.getItem(KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleFavorite(group: GroupItem): boolean {
    if (!group) return false;
    try {
      const favorites = storage.getFavorites();
      const exists = favorites.some((g) => g.id === group.id);
      let updated: GroupItem[];
      if (exists) {
        updated = favorites.filter((g) => g.id !== group.id);
      } else {
        updated = [group, ...favorites];
      }
      localStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
      return !exists;
    } catch {
      return false;
    }
  },

  isFavorite(groupId: string): boolean {
    if (!groupId) return false;
    return storage.getFavorites().some((g) => g.id === groupId);
  },

  getFavoriteTeachers(): TeacherItem[] {
    try {
      const data = localStorage.getItem(KEYS.FAVORITE_TEACHERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleFavoriteTeacher(teacher: TeacherItem): boolean {
    if (!teacher) return false;
    try {
      const favorites = storage.getFavoriteTeachers();
      const exists = favorites.some((t) => t.id === teacher.id || t.name === teacher.name);
      let updated: TeacherItem[];
      if (exists) {
        updated = favorites.filter((t) => t.id !== teacher.id && t.name !== teacher.name);
      } else {
        updated = [teacher, ...favorites];
      }
      localStorage.setItem(KEYS.FAVORITE_TEACHERS, JSON.stringify(updated));
      return !exists;
    } catch {
      return false;
    }
  },

  isFavoriteTeacher(teacherIdOrName: string): boolean {
    if (!teacherIdOrName) return false;
    return storage.getFavoriteTeachers().some(
      (t) => t.id === teacherIdOrName || t.name === teacherIdOrName
    );
  },

  getRecentGroups(): GroupItem[] {
    try {
      const data = localStorage.getItem(KEYS.RECENT_GROUPS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addRecentGroup(group: GroupItem): void {
    if (!group) return;
    try {
      const recents = storage.getRecentGroups().filter((g) => g.id !== group.id);
      const updated = [group, ...recents].slice(0, 8);
      localStorage.setItem(KEYS.RECENT_GROUPS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error saving recent groups:', e);
    }
  },

  getCachedSchedule(groupId: string): GroupSchedule | null {
    if (!groupId) return null;
    try {
      const data = localStorage.getItem(KEYS.SCHEDULE_CACHE_PREFIX + groupId);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCachedSchedule(schedule: GroupSchedule): void {
    if (!schedule) return;
    const save = () => {
      if (schedule.groupId) {
        localStorage.setItem(KEYS.SCHEDULE_CACHE_PREFIX + schedule.groupId, JSON.stringify(schedule));
      }
      if (schedule.groupName && schedule.groupName !== schedule.groupId) {
        localStorage.setItem(KEYS.SCHEDULE_CACHE_PREFIX + schedule.groupName, JSON.stringify(schedule));
      }
    };
    try {
      save();
    } catch (e) {
      storage.evictOldCaches();
      try { save(); } catch {}
    }
  },

  getNotes(groupId?: string): LessonNote[] {
    try {
      const data = localStorage.getItem(KEYS.NOTES);
      const allNotes: LessonNote[] = data ? JSON.parse(data) : [];
      if (groupId) {
        return allNotes.filter((n) => n.groupId === groupId);
      }
      return allNotes;
    } catch {
      return [];
    }
  },

  saveNote(note: LessonNote): void {
    if (!note) return;
    try {
      const allNotes = storage.getNotes().filter((n) => n.id !== note.id);
      const updated = [note, ...allNotes];
      localStorage.setItem(KEYS.NOTES, JSON.stringify(updated));
    } catch (e) {
      storage.evictOldCaches();
      try {
        const allNotes = storage.getNotes().filter((n) => n.id !== note.id);
        localStorage.setItem(KEYS.NOTES, JSON.stringify([note, ...allNotes]));
      } catch {}
    }
  },

  deleteNote(noteId: string): void {
    if (!noteId) return;
    try {
      const updated = storage.getNotes().filter((n) => n.id !== noteId);
      localStorage.setItem(KEYS.NOTES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error deleting note:', e);
    }
  },

  getTheme(): 'dark' | 'light' | 'system' {
    try {
      return (localStorage.getItem(KEYS.THEME) as 'dark' | 'light' | 'system') || 'system';
    } catch {
      return 'system';
    }
  },

  setTheme(theme: 'dark' | 'light' | 'system'): void {
    try {
      localStorage.setItem(KEYS.THEME, theme);
    } catch (e) {
      console.warn('Storage error saving theme:', e);
    }
  },
};
