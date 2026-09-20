import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Coffee, BookOpen, Clock, RotateCcw } from 'lucide-react';
import { GroupSchedule, Lesson, LessonNote, ScheduleMode, ViewWeekFilter } from '../types/schedule';
import {
  filterLessonsByParity,
  AcademicWeekInfo,
  getWeekDates,
  formatDayDate,
  parseTimeRange,
} from '../services/weekCalculator';
import { LessonCard } from './LessonCard';

interface ScheduleViewProps {
  schedule: GroupSchedule;
  mode?: ScheduleMode;
  effectiveParity: 'up' | 'down' | 'all';
  weekFilter: ViewWeekFilter;
  onWeekFilterChange: (filter: ViewWeekFilter) => void;
  academicWeek: AcademicWeekInfo;
  notes: LessonNote[];
  onOpenTeacher: (teacherName: string, photoUrl?: string) => void;
  onOpenCampus: (letter: string) => void;
  onOpenNote: (lesson: Lesson) => void;
  onSelectGroupByName?: (groupName: string) => void;
}

const SHORT_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedule,
  mode = 'group',
  effectiveParity,
  weekFilter,
  onWeekFilterChange,
  academicWeek,
  notes,
  onOpenTeacher,
  onOpenCampus,
  onOpenNote,
  onSelectGroupByName,
}) => {
  // Current calendar day (1 = Mon ... 6 = Sat, 0 = Sun)
  const todayJs = new Date().getDay();
  const currentAcademicDay = todayJs === 0 ? 1 : todayJs; // default to Mon if Sun

  // Week offset from current academic week (0 = this week, 1 = next week, -1 = prev week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Selected day tab in day mode
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(currentAcademicDay);

  // View mode: 'day' (single day with selector) or 'week' (all days at once)
  const [viewMode, setViewMode] = useState<'day' | 'week'>(() => {
    try {
      const saved = localStorage.getItem('smtu_schedule_view_mode');
      return saved === 'week' ? 'week' : 'day';
    } catch {
      return 'day';
    }
  });

  const handleToggleViewMode = (m: 'day' | 'week') => {
    setViewMode(m);
    try {
      localStorage.setItem('smtu_schedule_view_mode', m);
    } catch {}
  };

  // Compute displayed week info using effectiveParity
  const displayedWeekNumber = Math.max(1, academicWeek.weekNumber + weekOffset);
  const baseParity = effectiveParity === 'all' ? academicWeek.parity : effectiveParity;
  const isOffsetEven = Math.abs(weekOffset) % 2 === 0;
  const displayedParity: 'up' | 'down' = isOffsetEven
    ? baseParity
    : baseParity === 'up'
    ? 'down'
    : 'up';
  const displayedParityName = displayedParity === 'up' ? 'Верхняя' : 'Нижняя';

  // Compute active parity filter according to user selection
  const computedFilterParity: 'up' | 'down' | 'all' = useMemo(() => {
    if (weekFilter === 'all') return 'all';
    if (weekFilter === 'up') return 'up';
    if (weekFilter === 'down') return 'down';
    return displayedParity;
  }, [weekFilter, displayedParity]);

  // Real calendar dates for Monday..Saturday of the displayed week
  const weekDates = useMemo(() => {
    return getWeekDates(new Date(), weekOffset);
  }, [weekOffset]);

  // Group and filter lessons by day according to parity
  const daysWithFilteredLessons = useMemo(() => {
    if (!schedule || !Array.isArray(schedule.days)) return [];
    return schedule.days.map((day) => {
      const filtered = filterLessonsByParity(day?.lessons || [], computedFilterParity);
      return {
        ...day,
        filteredLessons: filtered,
      };
    });
  }, [schedule, computedFilterParity]);

  const activeDay =
    daysWithFilteredLessons.find((d) => d.dayIndex === selectedDayIndex) || daysWithFilteredLessons[0];

  const isSelectedDayRealToday =
    weekOffset === 0 && selectedDayIndex === (todayJs === 0 ? 7 : todayJs);

  const totalLessonsCount = activeDay?.filteredLessons.length || 0;

  // Compute daily schedule time span (e.g. "09:00 — 14:00")
  const dayTimeSpan = useMemo(() => {
    if (!activeDay || activeDay.filteredLessons.length === 0) return null;
    const sorted = [...activeDay.filteredLessons].sort((a, b) => {
      const ra = parseTimeRange(a.time);
      const rb = parseTimeRange(b.time);
      return (ra?.startMinutes || 0) - (rb?.startMinutes || 0);
    });
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstRange = parseTimeRange(first.time);
    const lastRange = parseTimeRange(last.time);
    if (!firstRange || !lastRange) return first.time;

    const sh = String(Math.floor(firstRange.startMinutes / 60)).padStart(2, '0');
    const sm = String(firstRange.startMinutes % 60).padStart(2, '0');
    const eh = String(Math.floor(lastRange.endMinutes / 60)).padStart(2, '0');
    const em = String(lastRange.endMinutes % 60).padStart(2, '0');
    return `${sh}:${sm} — ${eh}:${em}`;
  }, [activeDay]);

  // Jump to today
  const handleGoToToday = () => {
    setWeekOffset(0);
    setSelectedDayIndex(todayJs === 0 ? 1 : todayJs);
  };

  const activeDayDateObj = activeDay ? weekDates[activeDay.dayIndex - 1] : null;
  const activeDayDateFormatted = activeDayDateObj ? formatDayDate(activeDayDateObj) : null;

  return (
    <div className="space-y-4">
      {/* ============================================================ */}
      {/* Unified University Calendar Ribbon & Navigation Toolbar      */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-navy-900/80 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
        {/* Top Ribbon Row: Week Navigator & View Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Week Navigation Pill */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-navy-950/80 p-1 rounded-xl border border-slate-200/80 dark:border-navy-800">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-navy-800 transition shadow-sm"
              title="Предыдущая неделя"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-2">
              <span className="font-extrabold text-sm sm:text-base text-navy-950 dark:text-white tracking-tight whitespace-nowrap">
                {displayedWeekNumber}-я неделя
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 whitespace-nowrap ${
                  displayedParity === 'up'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    displayedParity === 'up' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span>{displayedParityName} неделя</span>
              </span>
            </div>

            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-navy-800 transition shadow-sm"
              title="Следующая неделя"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Quick jump to Today button */}
            {(weekOffset !== 0 || selectedDayIndex !== currentAcademicDay) && (
              <button
                onClick={handleGoToToday}
                className="ml-1 px-2.5 py-1 rounded-lg bg-ship-gold/20 hover:bg-ship-gold/30 text-navy-900 dark:text-ship-gold font-bold text-xs transition flex items-center gap-1"
                title="Вернуться к сегодняшнему расписанию"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Сегодня</span>
              </button>
            )}
          </div>

          {/* Right Controls: Parity Switcher & View Mode Toggle */}
          <div className="flex items-center gap-2">
            {/* Parity Filter Tabs */}
            <div className="hidden sm:inline-flex p-1 bg-slate-100 dark:bg-navy-950/80 rounded-xl border border-slate-200/80 dark:border-navy-800 text-xs font-semibold">
              <button
                onClick={() => onWeekFilterChange('current')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  weekFilter === 'current'
                    ? 'bg-white dark:bg-navy-800 text-navy-950 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Показывать пары согласно текущей неделе"
              >
                Текущая
              </button>
              <button
                onClick={() => onWeekFilterChange('up')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  weekFilter === 'up'
                    ? 'bg-white dark:bg-navy-800 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Показать только верхнюю неделю"
              >
                ↑ Верхняя
              </button>
              <button
                onClick={() => onWeekFilterChange('down')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  weekFilter === 'down'
                    ? 'bg-white dark:bg-navy-800 text-amber-700 dark:text-amber-300 shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Показать только нижнюю неделю"
              >
                ↓ Нижняя
              </button>
              <button
                onClick={() => onWeekFilterChange('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  weekFilter === 'all'
                    ? 'bg-white dark:bg-navy-800 text-navy-950 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Показать все недели без фильтра"
              >
                Все
              </button>
            </div>

            {/* View Mode Toggle: День / Вся неделя */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-navy-950/80 rounded-xl border border-slate-200/80 dark:border-navy-800 text-xs font-semibold">
              <button
                onClick={() => handleToggleViewMode('day')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-navy-800 text-navy-950 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                День
              </button>
              <button
                onClick={() => handleToggleViewMode('week')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-navy-800 text-navy-950 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Неделя
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Ribbon Row: 6-Day Calendar Strip (in Day Mode) */}
        {viewMode === 'day' && (
          <div className="pt-2 border-t border-slate-100 dark:border-navy-800/80">
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {daysWithFilteredLessons.map((day, idx) => {
                const dateObj = weekDates[idx];
                const dateFormatted = dateObj ? formatDayDate(dateObj) : null;
                const isRealToday =
                  weekOffset === 0 && day.dayIndex === (todayJs === 0 ? 7 : todayJs);
                const isSelected = day.dayIndex === selectedDayIndex;
                const count = day.filteredLessons.length;

                return (
                  <button
                    key={day.dayIndex}
                    onClick={() => setSelectedDayIndex(day.dayIndex)}
                    className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl transition-all relative group ${
                      isSelected
                        ? 'bg-navy-900 text-white dark:bg-navy-800 dark:text-white shadow-md shadow-navy-950/20 font-bold scale-[1.02] ring-1 ring-white/10 dark:ring-navy-700'
                        : 'bg-slate-50/60 dark:bg-navy-950/40 hover:bg-slate-100 dark:hover:bg-navy-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-navy-800/60'
                    }`}
                  >
                    {/* Day Abbreviation + Today indicator */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm font-bold tracking-tight">
                        {SHORT_DAYS[idx]}
                      </span>
                      {isRealToday && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-ship-gold' : 'bg-emerald-500 animate-pulse'
                          }`}
                        />
                      )}
                    </div>

                    {/* Real Calendar Date (e.g. 22 сен) */}
                    {dateFormatted && (
                      <span
                        className={`text-[11px] sm:text-xs font-semibold mt-0.5 ${
                          isSelected
                            ? 'text-ship-gold dark:text-ship-gold font-bold'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {dateFormatted.dayNum} {dateFormatted.monthShort}
                      </span>
                    )}

                    {/* Pair count chip */}
                    <span
                      className={`text-[10px] sm:text-[11px] mt-1 px-1.5 py-0.2 rounded-md font-medium ${
                        isSelected
                          ? 'bg-white/15 text-white'
                          : count > 0
                          ? 'bg-slate-200/60 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {count > 0 ? `${count} ${count === 1 ? 'пара' : count < 5 ? 'пары' : 'пар'}` : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Content for DAY Mode                                         */}
      {/* ============================================================ */}
      {viewMode === 'day' && (
        <div className="space-y-3">
          {/* Active Day Heading Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-navy-950 dark:text-white tracking-tight">
                {activeDay?.dayName}
                {activeDayDateFormatted ? `, ${activeDayDateFormatted.fullDateStr}` : ''}
              </h2>
              {isSelectedDayRealToday && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Сегодня</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 bg-white dark:bg-navy-900/60 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-navy-800 shadow-sm">
                <BookOpen className="w-3.5 h-3.5 text-navy-600 dark:text-ship-gold" />
                <span>
                  {totalLessonsCount}{' '}
                  {totalLessonsCount === 1
                    ? 'пара'
                    : totalLessonsCount >= 2 && totalLessonsCount <= 4
                    ? 'пары'
                    : 'пар'}
                </span>
                {dayTimeSpan && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{dayTimeSpan}</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Lessons List or Empty State */}
          {totalLessonsCount > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {activeDay.filteredLessons.map((lesson) => {
                const lessonNotes = notes.filter(
                  (n) =>
                    n.subject === lesson.subject &&
                    (!n.dayIndex || n.dayIndex === activeDay.dayIndex) &&
                    n.time === lesson.time
                );
                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    notes={lessonNotes}
                    mode={mode}
                    onOpenTeacher={onOpenTeacher}
                    onOpenCampus={onOpenCampus}
                    onOpenNote={onOpenNote}
                    onSelectGroupByName={onSelectGroupByName}
                    isToday={isSelectedDayRealToday}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl p-10 text-center bg-white dark:bg-navy-900/40 border border-dashed border-slate-200 dark:border-navy-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <Coffee className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                В этот день занятий нет
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {computedFilterParity !== 'all'
                  ? 'Возможно, пары запланированы на другую неделю (верхнюю / нижнюю) или в этот день выходной.'
                  : 'Учебных занятий в расписании на этот день не найдено.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* Content for WEEK Mode (Full Week Agenda Feed)                */}
      {/* ============================================================ */}
      {viewMode === 'week' && (
        <div className="space-y-6">
          {daysWithFilteredLessons.map((day, idx) => {
            const dateObj = weekDates[idx];
            const dateFormatted = dateObj ? formatDayDate(dateObj) : null;
            const isDayToday =
              weekOffset === 0 && day.dayIndex === (todayJs === 0 ? 7 : todayJs);
            const count = day.filteredLessons.length;

            return (
              <div
                key={day.dayIndex}
                className={`rounded-3xl p-4 sm:p-5 border transition-all ${
                  isDayToday
                    ? 'bg-emerald-500/[0.03] dark:bg-emerald-950/20 border-emerald-400/80 dark:border-emerald-700/80 shadow-md ring-1 ring-emerald-400/30'
                    : 'bg-white/80 dark:bg-navy-900/50 border-slate-200 dark:border-navy-800 shadow-sm'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100 dark:border-navy-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-ship-gold font-extrabold text-xs flex items-center justify-center shadow-sm">
                      {SHORT_DAYS[idx]}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                          {day.dayName}
                        </h3>
                        {isDayToday && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Сегодня</span>
                          </span>
                        )}
                      </div>
                      {dateFormatted && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {dateFormatted.fullDateStr}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-navy-800 px-2.5 py-1 rounded-lg">
                    {count > 0
                      ? `${count} ${count === 1 ? 'пара' : count < 5 ? 'пары' : 'пар'}`
                      : 'Выходной'}
                  </span>
                </div>

                {/* Day Lessons */}
                {count > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {day.filteredLessons.map((lesson) => {
                      const lessonNotes = notes.filter(
                        (n) =>
                          n.subject === lesson.subject &&
                          (!n.dayIndex || n.dayIndex === day.dayIndex) &&
                          n.time === lesson.time
                      );
                      return (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          notes={lessonNotes}
                          mode={mode}
                          onOpenTeacher={onOpenTeacher}
                          onOpenCampus={onOpenCampus}
                          onOpenNote={onOpenNote}
                          onSelectGroupByName={onSelectGroupByName}
                          isToday={isDayToday}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                    Занятия отсутствуют
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
