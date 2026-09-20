import React, { useState, useMemo } from 'react';
import { Sparkles, BookOpen, Coffee } from 'lucide-react';
import { GroupSchedule, Lesson, LessonNote } from '../types/schedule';
import { filterLessonsByParity } from '../services/weekCalculator';
import { LessonCard } from './LessonCard';

interface ScheduleViewProps {
  schedule: GroupSchedule;
  effectiveParity: 'up' | 'down' | 'all';
  notes: LessonNote[];
  onOpenTeacher: (teacherName: string, photoUrl?: string) => void;
  onOpenCampus: (letter: string) => void;
  onOpenNote: (lesson: Lesson) => void;
}

const SHORT_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedule,
  effectiveParity,
  notes,
  onOpenTeacher,
  onOpenCampus,
  onOpenNote,
}) => {
  // Current day index (1 = Monday ... 6 = Saturday, 0 = Sunday)
  const todayJs = new Date().getDay();
  const currentAcademicDay = todayJs === 0 ? 1 : todayJs; // default to Mon if Sun

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(currentAcademicDay);

  // Group lessons by day
  const daysWithFilteredLessons = useMemo(() => {
    return schedule.days.map((day) => {
      const filtered = filterLessonsByParity(day.lessons, effectiveParity);
      return {
        ...day,
        filteredLessons: filtered,
      };
    });
  }, [schedule, effectiveParity]);

  const activeDay = daysWithFilteredLessons.find((d) => d.dayIndex === selectedDayIndex) || daysWithFilteredLessons[0];
  const isSelectedDayToday = selectedDayIndex === (todayJs === 0 ? 7 : todayJs);

  const totalLessonsCount = activeDay?.filteredLessons.length || 0;

  return (
    <div className="space-y-4">
      {/* Day Selector Navigation Pills */}
      <div className="bg-white dark:bg-navy-900/60 rounded-2xl p-2 border border-slate-200/80 dark:border-navy-800 shadow-sm">
        <div className="grid grid-cols-6 gap-1 sm:gap-2">
          {daysWithFilteredLessons.map((day, idx) => {
            const isToday = day.dayIndex === (todayJs === 0 ? 7 : todayJs);
            const isSelected = day.dayIndex === selectedDayIndex;
            const count = day.filteredLessons.length;

            return (
              <button
                key={day.dayIndex}
                onClick={() => setSelectedDayIndex(day.dayIndex)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative ${
                  isSelected
                    ? 'bg-navy-700 dark:bg-navy-700 text-white shadow-md shadow-navy-900/20 font-bold scale-[1.02]'
                    : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm">{SHORT_DAYS[idx]}</span>
                  {isToday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-ship-gold' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-[11px] mt-0.5 ${
                    isSelected ? 'text-navy-200' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {count > 0 ? `${count} пар` : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-navy-950 dark:text-white tracking-tight">
            {activeDay?.dayName}
          </h2>
          {isSelectedDayToday && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Сегодня</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-navy-500" />
            <span>
              {totalLessonsCount} {totalLessonsCount === 1 ? 'занятие' : totalLessonsCount >= 2 && totalLessonsCount <= 4 ? 'занятия' : 'занятий'}
            </span>
          </span>
        </div>
      </div>

      {/* Lessons List or Empty State */}
      {totalLessonsCount > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {activeDay.filteredLessons.map((lesson) => {
            const lessonNotes = notes.filter(
              (n) => n.subject === lesson.subject && n.dayIndex === activeDay.dayIndex && n.time === lesson.time
            );
            return (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                notes={lessonNotes}
                onOpenTeacher={onOpenTeacher}
                onOpenCampus={onOpenCampus}
                onOpenNote={onOpenNote}
                isToday={isSelectedDayToday}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl p-10 text-center bg-white dark:bg-navy-900/40 border border-dashed border-slate-200 dark:border-navy-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Coffee className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
            В этот день занятий нет
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {effectiveParity !== 'all'
              ? 'Возможно, пары запланированы на другую неделю (числитель / знаменатель) или у группы выходной.'
              : 'Учебных занятий в расписании на этот день не найдено.'}
          </p>
        </div>
      )}
    </div>
  );
};
