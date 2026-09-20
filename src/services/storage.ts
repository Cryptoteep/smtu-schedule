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
    try {
      localStorage.setItem(KEYS.CURRENT_TEACHER, JSON.stringify(teacher));
      this.addRecentTeacher(teacher);
    } catch (e) {
      console.warn('Storage error saving current teacher:', e);
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
    try {
      const recents = this.getRecentTeachers().filter((t) => t.id !== teacher.id && t.name !== teacher.name);
      const updated = [teacher, ...recents].slice(0, 8);
      localStorage.setItem(KEYS.RECENT_TEACHERS, JSON.stringify(updated));
    } catch {}
  },

  getCachedTeacherSchedule(teacherIdOrName: string): TeacherSchedule | null {
    try {
      const data = localStorage.getItem(KEYS.TEACHER_CACHE_PREFIX + teacherIdOrName);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCachedTeacherSchedule(schedule: TeacherSchedule): void {
    try {
      localStorage.setItem(KEYS.TEACHER_CACHE_PREFIX + (schedule.teacherId || schedule.teacherName), JSON.stringify(schedule));
    } catch {}
  },

  setCurrentGroup(group: GroupItem): void {
    try {
      localStorage.setItem(KEYS.CURRENT_GROUP, JSON.stringify(group));
      this.addRecentGroup(group);
    } catch (e) {
      console.warn('Storage error saving current group:', e);
    }
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
    try {
      const favorites = this.getFavorites();
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
    return this.getFavorites().some((g) => g.id === groupId);
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
    try {
      const favorites = this.getFavoriteTeachers();
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
    return this.getFavoriteTeachers().some(
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
    try {
      const recents = this.getRecentGroups().filter((g) => g.id !== group.id);
      const updated = [group, ...recents].slice(0, 8);
      localStorage.setItem(KEYS.RECENT_GROUPS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error saving recent groups:', e);
    }
  },

  getCachedSchedule(groupId: string): GroupSchedule | null {
    try {
      const data = localStorage.getItem(KEYS.SCHEDULE_CACHE_PREFIX + groupId);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCachedSchedule(schedule: GroupSchedule): void {
    try {
      localStorage.setItem(KEYS.SCHEDULE_CACHE_PREFIX + schedule.groupId, JSON.stringify(schedule));
    } catch (e) {
      console.warn('Storage error caching schedule:', e);
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
    try {
      const allNotes = this.getNotes().filter((n) => n.id !== note.id);
      const updated = [note, ...allNotes];
      localStorage.setItem(KEYS.NOTES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error saving note:', e);
    }
  },

  deleteNote(noteId: string): void {
    try {
      const updated = this.getNotes().filter((n) => n.id !== noteId);
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
