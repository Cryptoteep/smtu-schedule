import React from 'react';
import { Clock, MapPin, User, FileText, CheckCircle2, AlertCircle, Navigation, Users } from 'lucide-react';
import { Lesson, LessonNote, ScheduleMode } from '../types/schedule';
import { getLessonStatus } from '../services/weekCalculator';
import { getCampusByRoom, getFloorByRoom } from '../data/campuses';

interface LessonCardProps {
  lesson: Lesson;
  notes: LessonNote[];
  mode?: ScheduleMode;
  onOpenTeacher: (teacherName: string, photoUrl?: string) => void;
  onOpenCampus: (letter: string) => void;
  onOpenNote: (lesson: Lesson) => void;
  onSelectGroupByName?: (groupName: string) => void;
  isToday: boolean;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  notes,
  mode = 'group',
  onOpenTeacher,
  onOpenCampus,
  onOpenNote,
  onSelectGroupByName,
  isToday,
}) => {
  const currentStatus = isToday ? getLessonStatus(lesson.time) : { status: 'passed' as const };
  const isActive = isToday && currentStatus.status === 'active';
  const isUpcoming = isToday && currentStatus.status === 'upcoming';

  const typeStyles: Record<string, { bg: string; text: string; border: string; borderAccent: string }> = {
    lecture: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800/80',
      borderAccent: 'border-l-blue-500',
    },
    practice: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/80',
      borderAccent: 'border-l-emerald-500',
    },
    lab: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/80',
      borderAccent: 'border-l-amber-500',
    },
    military: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800/80',
      borderAccent: 'border-l-purple-500',
    },
    exam: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/80',
      borderAccent: 'border-l-rose-500',
    },
    other: {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-800/80',
      borderAccent: 'border-l-slate-400',
    },
  };

  const style = typeStyles[lesson.type] || typeStyles.other;

  return (
    <div
      className={`relative rounded-2xl p-4 transition-all duration-200 border border-l-4 ${style.borderAccent} ${
        isActive
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/60 dark:border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
          : 'bg-white dark:bg-navy-900/60 border-slate-200/80 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700 shadow-sm'
      }`}
    >
      {/* Top row: Time Slot, Exact Hours, Live Status, Parity */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-ship-gold tracking-wide">
            {lesson.timeSlotIndex} пара
          </span>
          <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">
            <Clock className="w-3.5 h-3.5 text-navy-500 dark:text-navy-400" />
            <span>{lesson.time}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Active now / upcoming status indicator */}
          {isActive && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>Идёт сейчас • ещё {currentStatus.minutesRemaining} мин</span>
            </span>
          )}
          {isUpcoming && currentStatus.minutesUntilStart !== undefined && currentStatus.minutesUntilStart <= 60 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <AlertCircle className="w-3 h-3" />
              <span>Через {currentStatus.minutesUntilStart} мин</span>
            </span>
          )}

          {/* Week parity badge */}
          {lesson.weekParity === 'up' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ↑ Верхняя неделя
            </span>
          )}
          {lesson.weekParity === 'down' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              ↓ Нижняя неделя
            </span>
          )}
        </div>
      </div>

      {/* Lesson Subject & Type Chips */}
      <div className="mb-3">
        <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug tracking-tight mb-2">
          {lesson.subject}
        </h4>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
            {lesson.rawType || lesson.type}
          </span>
          {lesson.dateSpecific && (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
              📅 {lesson.dateSpecific}
            </span>
          )}
          {lesson.dateRange && (
            <span
              className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700"
              title={lesson.exactDates?.length ? `Даты занятий: ${lesson.exactDates.join(', ')}` : undefined}
            >
              🗓️ {lesson.dateRange}
            </span>
          )}
        </div>
      </div>

      {/* Location, Teacher, Notes Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-navy-800/80 text-xs">
        {/* Room and Campus */}
        {(() => {
          const campusInfo = getCampusByRoom(lesson.room);
          const floor = getFloorByRoom(lesson.room);
          const campusLetter = campusInfo?.letter || 'У';
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenCampus(campusLetter)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-800 dark:text-slate-200 transition group text-left border border-slate-200/60 dark:border-navy-700/60"
                title={`Посмотреть ${campusInfo?.fullName || 'корпус'} и схему этажей`}
              >
                <MapPin className="w-3.5 h-3.5 text-navy-600 dark:text-ship-gold group-hover:scale-110 transition shrink-0" />
                <span className="font-extrabold">{lesson.room}</span>
                {floor && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300">
                    {floor} эт.
                  </span>
                )}
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {campusInfo?.name ? campusInfo.name.split(' ')[0] : 'СПбГМТУ'}
                </span>
              </button>
              {campusInfo?.mapsUrl && (
                <a
                  href={campusInfo.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-navy-600 dark:hover:text-ship-gold hover:bg-slate-100 dark:hover:bg-navy-800 transition"
                  title="Открыть в Яндекс Картах"
                >
                  <Navigation className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          );
        })()}

        <div className="flex items-center gap-2">
          {/* Teacher */}
          {lesson.teacher ? (
            <button
              onClick={() => onOpenTeacher(lesson.teacher!.name, lesson.teacher?.photoUrl)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-800 dark:text-slate-200 transition max-w-[220px] truncate border border-slate-200/60 dark:border-navy-700/60"
              title="Открыть расписание преподавателя"
            >
              {lesson.teacher.photoUrl ? (
                <img
                  src={lesson.teacher.photoUrl}
                  alt={lesson.teacher.name}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <User className="w-3.5 h-3.5 text-navy-500 dark:text-navy-400 shrink-0" />
              )}
              <span className="truncate font-semibold">{lesson.teacher.name}</span>
            </button>
          ) : (
            <span className="text-slate-400 text-xs">Преподаватель не указан</span>
          )}

          {/* Notes & Homework Button */}
          <button
            onClick={() => onOpenNote(lesson)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition font-semibold text-xs ${
              notes.length > 0
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200/60 dark:border-navy-700/60'
            }`}
            title="Заметки и домашнее задание"
          >
            {notes.length > 0 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span>{notes.length}</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ ДЗ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* For Teacher Mode or when groupName is explicitly present: Clickable Group badge */}
      {mode === 'teacher' && lesson.groupName && (
        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-navy-800/80 text-xs">
          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Группа:</span>
          <div className="flex flex-wrap gap-1.5">
            {lesson.groupName.split(',').map((grp) => {
              const cleanGrp = grp.trim();
              return (
                <button
                  key={cleanGrp}
                  onClick={() => onSelectGroupByName?.(cleanGrp)}
                  className="px-2.5 py-0.5 rounded-lg font-bold text-xs bg-navy-100 hover:bg-navy-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-900 dark:text-ship-gold transition border border-navy-200 dark:border-navy-700"
                  title={`Перейти к расписанию группы ${cleanGrp}`}
                >
                  {cleanGrp}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
