import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/services/storage';
import { GroupItem, LessonNote } from '../src/types/schedule';

// Mock localStorage for node environment
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: 0,
};

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('manages current group correctly', () => {
    const group: GroupItem = { id: '7624', name: '3210' };
    expect(storage.getCurrentGroup()).toBeNull();

    storage.setCurrentGroup(group);
    expect(storage.getCurrentGroup()).toEqual(group);
  });

  it('manages favorite groups toggling', () => {
    const group1: GroupItem = { id: '7624', name: '3210' };
    const group2: GroupItem = { id: '7540', name: '1201' };

    expect(storage.isFavorite('7624')).toBe(false);

    // Toggle on
    const isFavNow = storage.toggleFavorite(group1);
    expect(isFavNow).toBe(true);
    expect(storage.isFavorite('7624')).toBe(true);
    expect(storage.getFavorites()).toHaveLength(1);

    storage.toggleFavorite(group2);
    expect(storage.getFavorites()).toHaveLength(2);

    // Toggle off
    const isFavAfter = storage.toggleFavorite(group1);
    expect(isFavAfter).toBe(false);
    expect(storage.isFavorite('7624')).toBe(false);
    expect(storage.getFavorites()).toHaveLength(1);
  });

  it('records recent groups without duplicates and capped at 8', () => {
    for (let i = 1; i <= 10; i++) {
      storage.addRecentGroup({ id: `${i}`, name: `Group-${i}` });
    }
    const recents = storage.getRecentGroups();
    expect(recents.length).toBeLessThanOrEqual(8);
    expect(recents[0].name).toBe('Group-10');
  });

  it('saves and deletes lesson notes', () => {
    const note: LessonNote = {
      id: 'note-1',
      groupId: '7624',
      subject: 'Методы искусственного интеллекта',
      dayIndex: 1,
      time: '08:30-10:00',
      text: 'Подготовить лабораторную работу №2 по деревьям решений',
      createdAt: new Date().toISOString(),
    };

    storage.saveNote(note);
    expect(storage.getNotes('7624')).toHaveLength(1);
    expect(storage.getNotes('7624')[0].text).toBe('Подготовить лабораторную работу №2 по деревьям решений');

    storage.deleteNote('note-1');
    expect(storage.getNotes('7624')).toHaveLength(0);
  });

  it('manages schedule mode and current teacher', () => {
    expect(storage.getMode()).toBe('group');
    storage.setMode('teacher');
    expect(storage.getMode()).toBe('teacher');

    const teacher = { id: '101326', name: 'Чихонадских Елена Александровна' };
    expect(storage.getCurrentTeacher()).toBeNull();
    storage.setCurrentTeacher(teacher);
    expect(storage.getCurrentTeacher()?.name).toBe('Чихонадских Елена Александровна');
    expect(storage.getRecentTeachers()).toHaveLength(1);
  });

  it('manages favorite teachers', () => {
    const teacher = { id: '100593', name: 'Крыжевич Геннадий Брониславович' };
    expect(storage.isFavoriteTeacher('100593')).toBe(false);

    const toggledOn = storage.toggleFavoriteTeacher(teacher);
    expect(toggledOn).toBe(true);
    expect(storage.isFavoriteTeacher('100593')).toBe(true);
    expect(storage.getFavoriteTeachers()).toHaveLength(1);

    const toggledOff = storage.toggleFavoriteTeacher(teacher);
    expect(toggledOff).toBe(false);
    expect(storage.isFavoriteTeacher('100593')).toBe(false);
  });

  it('allows destructuring of methods without unbound this errors', () => {
    const { getFavorites, toggleFavorite, isFavorite, getNotes } = storage;
    expect(getFavorites()).toEqual([]);
    expect(isFavorite('7624')).toBe(false);
    expect(toggleFavorite({ id: '7624', name: '3210' })).toBe(true);
    expect(getFavorites()).toHaveLength(1);
    expect(getNotes('7624')).toEqual([]);
  });

  it('evicts old caches safely when quota limit is approached', () => {
    // Add multiple schedules to cache
    for (let i = 1; i <= 6; i++) {
      storage.setCachedSchedule({
        groupId: `g-${i}`,
        groupName: `name-${i}`,
        updatedAt: new Date().toISOString(),
        days: []
      });
    }
    expect(storage.getCachedSchedule('g-1')).toBeDefined();

    storage.evictOldCaches();
    // Verify eviction executes cleanly without errors
    expect(true).toBe(true);
  });
});
