import { describe, it, expect } from 'vitest';
import { parseSmtuScheduleHtml, determineLessonType } from '../src/services/parser';

describe('SPbGMTU HTML Parser', () => {
  it('determines lesson types accurately', () => {
    expect(determineLessonType('Лекция', 'Математический анализ')).toBe('lecture');
    expect(determineLessonType('Практическое занятие', 'Теория алгоритмов')).toBe('practice');
    expect(determineLessonType('Лабораторная работа', 'Физика')).toBe('lab');
    expect(determineLessonType('Семинар', 'История судостроения')).toBe('practice');
    expect(determineLessonType('', 'Военная подготовка (офицеры запаса)')).toBe('military');
    expect(determineLessonType('Экзамен', 'Философия')).toBe('exam');
  });

  it('parses HTML schedule table with upper/lower weeks, teachers, and rooms', () => {
    const mockHtml = `
      <h4>Понедельник</h4>
      <table class="table table-bordered">
        <thead>
          <tr><th>Время</th><th>Неделя</th><th>Ауд</th><th>Группа</th><th>Дисциплина</th><th>Преподаватель</th></tr>
        </thead>
        <tbody>
          <tr class="js-week-container collapse show" id="week-up-container">
            <th scope="row">08:30-10:00</th>
            <td class="text-success"><i class="fa-solid fa-arrow-turn-up" data-bs-title="Верхняя неделя"></i></td>
            <td>У 407</td>
            <td>3210</td>
            <td><span>Методы искусственного интеллекта</span><br><small class="text-muted">Лекция</small></td>
            <td><img src="/files/photo.jpg" /><span>Борисов Александр Николаевич</span></td>
          </tr>
          <tr class="js-week-container collapse show" id="week-down-container">
            <th scope="row">10:10-11:40</th>
            <td class="text-warning"><i class="fa-solid fa-arrow-turn-down" data-bs-title="Нижняя неделя"></i></td>
            <td>У 312</td>
            <td>3210</td>
            <td><span>Технология разработки ПО</span><br><small class="text-muted">Практическое занятие</small></td>
            <td><span>Сакович Сергей Юрьевич</span></td>
          </tr>
        </tbody>
      </table>
    `;

    const parsed = parseSmtuScheduleHtml(mockHtml, '7624', '3210');
    expect(parsed.groupId).toBe('7624');
    expect(parsed.groupName).toBe('3210');
    expect(parsed.days.length).toBeGreaterThan(0);

    const monday = parsed.days.find(d => d.dayName === 'Понедельник');
    expect(monday).toBeDefined();
    expect(monday?.lessons.length).toBe(2);

    const lesson1 = monday!.lessons[0];
    expect(lesson1.time).toBe('08:30-10:00');
    expect(lesson1.room).toBe('У 407');
    expect(lesson1.campus).toContain('Ульянка');
    expect(lesson1.subject).toBe('Методы искусственного интеллекта');
    expect(lesson1.type).toBe('lecture');
    expect(lesson1.weekParity).toBe('up');
    expect(lesson1.teacher?.name).toBe('Борисов Александр Николаевич');
    expect(lesson1.teacher?.photoUrl).toBe('https://www.smtu.ru/files/photo.jpg');

    const lesson2 = monday!.lessons[1];
    expect(lesson2.time).toBe('10:10-11:40');
    expect(lesson2.weekParity).toBe('down');
    expect(lesson2.type).toBe('practice');
    expect(lesson2.teacher?.name).toBe('Сакович Сергей Юрьевич');
  });

  it('extracts teacherId, profileUrl, and exact dates list accurately', () => {
    const mockHtml = `
      <h4>Среда</h4>
      <table>
        <tbody>
          <tr id="week-up-container" title="16.09.2026, 30.09.2026, 14.10.2026">
            <th>10:10-11:40</th>
            <td>верхняя</td>
            <td>У 165</td>
            <td>3280</td>
            <td><span>Физика</span><br><small>Лекция</small></td>
            <td><a href="/ru/viewperson/101234/">Клюбина Ксения Александровна</a></td>
          </tr>
        </tbody>
      </table>
    `;
    const parsed = parseSmtuScheduleHtml(mockHtml, '7640', '3280');
    const wednesday = parsed.days.find(d => d.dayName === 'Среда');
    expect(wednesday).toBeDefined();
    expect(wednesday?.lessons.length).toBe(1);

    const lesson = wednesday!.lessons[0];
    expect(lesson.subject).toBe('Физика');
    expect(lesson.teacher?.name).toBe('Клюбина Ксения Александровна');
    expect(lesson.teacher?.id).toBe('101234');
    expect(lesson.teacher?.profileUrl).toBe('https://www.smtu.ru/ru/viewperson/101234/');
    expect(lesson.exactDates).toEqual(['16.09.2026', '30.09.2026', '14.10.2026']);
    expect(lesson.dayIndex).toBe(3);
  });

  it('handles empty or malformed inputs without throwing', () => {
    // @ts-expect-error testing invalid input
    const empty1 = parseSmtuScheduleHtml(null, '123');
    expect(empty1.days).toEqual([]);

    // @ts-expect-error testing invalid input
    const empty2 = parseSmtuScheduleHtml(undefined, '123');
    expect(empty2.days).toEqual([]);

    expect(determineLessonType(null as unknown as string, null as unknown as string)).toBe('other');
    expect(determineLessonType(undefined, undefined)).toBe('other');
    expect(determineLessonType()).toBe('other');
  });
});
