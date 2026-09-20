import { describe, it, expect } from 'vitest';
import { api } from '../src/services/api';

describe('Teachers and Groups API', () => {
  it('loads all 8 faculties and 412 groups', () => {
    const faculties = api.getFaculties();
    expect(faculties).toHaveLength(8);

    const totalGroups = faculties.reduce((acc, f) => acc + f.groups.length, 0);
    expect(totalGroups).toBe(412);
  });

  it('correctly finds group 3280 (id 7640)', () => {
    const byName = api.findGroup('3280');
    expect(byName).not.toBeNull();
    expect(byName?.group.id).toBe('7640');
    expect(byName?.group.name).toBe('3280');

    const byId = api.findGroup('7640');
    expect(byId).not.toBeNull();
    expect(byId?.group.name).toBe('3280');
  });

  it('searches groups by prefix or fragment and strips common words like группа', () => {
    const results = api.searchGroups('328');
    expect(results.length).toBeGreaterThan(0);
    const found3280 = results.find((r) => r.group.name === '3280');
    expect(found3280).toBeDefined();

    const withPrefix = api.searchGroups('группа 3280');
    expect(withPrefix.length).toBeGreaterThan(0);
    expect(withPrefix[0].group.name).toBe('3280');

    const withShortPrefix = api.searchGroups('гр. 3210');
    expect(withShortPrefix.length).toBeGreaterThan(0);
    expect(withShortPrefix[0].group.name).toBe('3210');
  });

  it('loads all 664 teachers from university database', () => {
    const teachers = api.getTeachers();
    expect(teachers).toHaveLength(664);
  });

  it('searches teachers by name, initials, and token permutations', () => {
    const results = api.searchTeachers('Чихонадских');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Чихонадских');

    // Initials: "Чихонадских Е.А."
    const resultsInitials = api.searchTeachers('Чихонадских Е.А.');
    expect(resultsInitials.length).toBeGreaterThan(0);
    expect(resultsInitials[0].name).toBe('Чихонадских Елена Александровна');

    // First name then last name: "Геннадий Крыжевич"
    const resultsReversed = api.searchTeachers('Геннадий Крыжевич');
    expect(resultsReversed.length).toBeGreaterThan(0);
    expect(resultsReversed[0].name).toBe('Крыжевич Геннадий Брониславович');

    // Initial with dot: "Крыжевич Г."
    const resultsKryzh = api.searchTeachers('Крыжевич Г.');
    expect(resultsKryzh.length).toBeGreaterThan(0);
    expect(resultsKryzh[0].name).toContain('Крыжевич');
  });

  it('finds teacher by ID or exact name', () => {
    const byName = api.findTeacher('Чихонадских Елена Александровна');
    expect(byName).not.toBeNull();
    expect(byName?.name).toBe('Чихонадских Елена Александровна');
  });

  it('adapts teacher schedule to unified group schedule format', async () => {
    const teacherSched = await api.getTeacherSchedule('100593', 'Крыжевич Геннадий Брониславович');
    expect(teacherSched).toBeDefined();
    expect(teacherSched.teacherName).toContain('Крыжевич');

    const adapted = api.teacherScheduleToGroupSchedule(teacherSched);
    expect(adapted.groupName).toBe(teacherSched.teacherName);
    expect(adapted.days).toBe(teacherSched.days);
    expect(adapted.facultyName).toBe('Преподаватель СПбГМТУ');
  });
});
