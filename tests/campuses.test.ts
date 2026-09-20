import { describe, it, expect } from 'vitest';
import { getCampusByRoom } from '../src/data/campuses';

describe('Campuses and Room Matching', () => {
  it('correctly maps standard room numbers to campuses', () => {
    const roomU = getCampusByRoom('У 165');
    expect(roomU).toBeDefined();
    expect(roomU?.letter).toBe('У');
    expect(roomU?.address).toContain('Ленинский');

    const roomA = getCampusByRoom('А 407');
    expect(roomA).toBeDefined();
    expect(roomA?.letter).toBe('А');
    expect(roomA?.address).toContain('Лоцманская');

    const roomB = getCampusByRoom('Б 401');
    expect(roomB).toBeDefined();
    expect(roomB?.letter).toBe('Б');

    const roomG = getCampusByRoom('Г 502');
    expect(roomG).toBeDefined();
    expect(roomG?.letter).toBe('Г');
    expect(roomG?.address).toContain('Кронверкский');
  });

  it('correctly detects military center (ВУЦ)', () => {
    const vuc1 = getCampusByRoom('А ВУЦ');
    expect(vuc1?.letter).toBe('А');

    const vuc2 = getCampusByRoom('ВУЦ');
    expect(vuc2?.letter).toBe('А');
  });

  it('correctly detects special buildings (Конгресс-центр, Спортзал, Псковская, Колледж)', () => {
    const congress = getCampusByRoom('Конгресс-Центр 316');
    expect(congress?.letter).toBe('У');

    const gym = getCampusByRoom('У Спортзал');
    expect(gym?.letter).toBe('У');

    const pskov = getCampusByRoom('Псковская 23');
    expect(pskov?.letter).toBe('М');

    const college = getCampusByRoom('Колледж СТФ');
    expect(college?.letter).toBe('С');
  });

  it('defaults gracefully to main campus Ульянка for unknown room strings', () => {
    const unknown = getCampusByRoom('Лаборатория');
    expect(unknown?.letter).toBe('У');
  });
});
