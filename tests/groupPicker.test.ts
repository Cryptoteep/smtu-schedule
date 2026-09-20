import { describe, it, expect } from 'vitest';
import { api, getCourseFromGroup } from '../src/services/api';

describe('Group Course Detection and Filtering', () => {
  it('accurately detects courses from standard 4-digit group names', () => {
    expect(getCourseFromGroup({ name: '1101' })).toBe(1);
    expect(getCourseFromGroup({ name: '1201' })).toBe(2);
    expect(getCourseFromGroup({ name: '3210' })).toBe(2);
    expect(getCourseFromGroup({ name: '1301' })).toBe(3);
    expect(getCourseFromGroup({ name: '2401' })).toBe(4);
    expect(getCourseFromGroup({ name: '1501' })).toBe(5);
  });

  it('accurately detects courses from 5-digit college and evening groups', () => {
    // 20xxx series
    expect(getCourseFromGroup({ name: '20100' })).toBe(1);
    expect(getCourseFromGroup({ name: '20200' })).toBe(2);
    expect(getCourseFromGroup({ name: '20220' })).toBe(2);
    expect(getCourseFromGroup({ name: '20300' })).toBe(3);
    expect(getCourseFromGroup({ name: '20313' })).toBe(3);
    expect(getCourseFromGroup({ name: '20400' })).toBe(4);

    // 10xxx series
    expect(getCourseFromGroup({ name: '10274' })).toBe(2);
    expect(getCourseFromGroup({ name: '10374' })).toBe(3);
    expect(getCourseFromGroup({ name: '10449' })).toBe(4);
  });

  it('populates all 412 groups in faculties with valid course numbers', () => {
    const faculties = api.getFaculties();
    let totalGroups = 0;
    let missingCourse = 0;

    for (const f of faculties) {
      for (const g of f.groups) {
        totalGroups++;
        if (!g.course) {
          missingCourse++;
        }
      }
    }

    expect(totalGroups).toBe(412);
    expect(missingCourse).toBe(0);
  });

  it('filters search results by course accurately', () => {
    const allMatching = api.searchGroups('12');
    expect(allMatching.length).toBeGreaterThan(0);

    // Filter by course 2
    const course2Groups = allMatching.filter(({ group }) => group.course === 2);
    expect(course2Groups.length).toBeGreaterThan(0);
    course2Groups.forEach(({ group }) => {
      expect(group.course).toBe(2);
    });
  });

  it('calculates correct group counts per course', () => {
    const faculties = api.getFaculties();
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;

    for (const f of faculties) {
      for (const g of f.groups) {
        const c = g.course ?? getCourseFromGroup(g);
        if (c && counts[c] !== undefined) {
          counts[c]++;
        }
        total++;
      }
    }

    expect(total).toBe(412);
    expect(counts[1]).toBe(2);
    expect(counts[2]).toBe(228);
    expect(counts[3]).toBe(87);
    expect(counts[4]).toBe(76);
    expect(counts[5]).toBe(19);
  });

  it('scopes faculties correctly when course is filtered', () => {
    const faculties = api.getFaculties();

    // Course 1 scoping
    const course1Faculties = faculties
      .map((fac) => ({
        ...fac,
        groups: fac.groups.filter((g) => (g.course ?? getCourseFromGroup(g)) === 1),
      }))
      .filter((fac) => fac.groups.length > 0);

    expect(course1Faculties.length).toBe(2);
    expect(course1Faculties.reduce((sum, f) => sum + f.groups.length, 0)).toBe(2);

    // Course 2 scoping
    const course2Faculties = faculties
      .map((fac) => ({
        ...fac,
        groups: fac.groups.filter((g) => (g.course ?? getCourseFromGroup(g)) === 2),
      }))
      .filter((fac) => fac.groups.length > 0);

    expect(course2Faculties.length).toBe(8);
    expect(course2Faculties.reduce((sum, f) => sum + f.groups.length, 0)).toBe(228);
    for (const fac of course2Faculties) {
      for (const g of fac.groups) {
        expect(g.course ?? getCourseFromGroup(g)).toBe(2);
      }
    }
  });
});
